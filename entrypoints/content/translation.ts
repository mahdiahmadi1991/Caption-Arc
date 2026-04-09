import type { Caption, TranslateResponse } from "./types";
import { captions, liveChatMessages, settings } from "./state";
import { getOpenAiServiceAvailability } from "../shared/openai-service";
import { updateCaptionTranslation } from "./caption-ui";
import {
  updateCaptionInHistory,
  saveCaptionsDebounced,
} from "./history-service";
import { TranslationStatus } from "./constants";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import { getUiRuntimeTranslator } from "../shared/i18n";

type TranslateAllCaptionsOptions = {
  force?: boolean;
  includeTranslated?: boolean;
  resetExisting?: boolean;
  overridePending?: boolean;
};

const pendingTranslations = new Map<number, number>();
const translationEpochs = new Map<number, number>();

const CONTEXT_CAPTION_COUNT = 5;

const translationDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "translation",
  feature: "caption-translation",
});

function getOverlayItems(): Caption[] {
  return [...captions, ...liveChatMessages].sort(
    (left, right) => left.timestamp - right.timestamp
  );
}

function buildContext(currentCaption: Caption): string {
  const overlayItems = getOverlayItems();
  const currentIndex = overlayItems.findIndex((c) => c.id === currentCaption.id);
  if (currentIndex <= 0) return "";

  const startIndex = Math.max(0, currentIndex - CONTEXT_CAPTION_COUNT);
  const contextCaptions = overlayItems.slice(startIndex, currentIndex);

  if (contextCaptions.length === 0) return "";

  return contextCaptions.map((c) => `[${c.speaker}]: ${c.text}`).join("\n");
}

function incrementTranslationEpoch(captionId: number): number {
  const nextEpoch = (translationEpochs.get(captionId) || 0) + 1;
  translationEpochs.set(captionId, nextEpoch);
  return nextEpoch;
}

function getTranslationConfigError(): string | null {
  const availability = getOpenAiServiceAvailability(settings);
  if (availability.operational) {
    return null;
  }

  return availability.message;
}

function resetCaptionTranslation(captionObj: Caption): void {
  void translationDiagnostics.trace("caption_translation_reset", {
    captionId: captionObj.id,
    source: captionObj.source,
    hadTranslation: Boolean(captionObj.translation),
  });
  incrementTranslationEpoch(captionObj.id);
  captionObj.translation = "";
  captionObj.translationError = undefined;
  captionObj.translationStatus = TranslationStatus.Pending;
  captionObj.userEdited = false;
  updateCaptionInHistory(captionObj.id, {
    translation: "",
    translationLanguage: undefined,
  });
  saveCaptionsDebounced();
  updateCaptionTranslation(captionObj);
}

export function isTranslationConfigured(): boolean {
  return getTranslationConfigError() === null;
}

export function openTranslationSettings(): void {
  void chrome.runtime.sendMessage({ action: "openOptions" }).catch(() => {
    void translationDiagnostics.warn("open_translation_settings_failed");
    // Ignore context invalidation during extension reloads.
  });
}

export function cleanupTranslationState(captionId: number): void {
  void translationDiagnostics.trace("translation_state_cleaned", {
    captionId,
    hadPendingRequest: pendingTranslations.has(captionId),
  });
  pendingTranslations.delete(captionId);
  translationEpochs.delete(captionId);
}

export function resetTranslationState(): void {
  void translationDiagnostics.info("translation_state_reset", {
    pendingCount: pendingTranslations.size,
    epochCount: translationEpochs.size,
  });
  pendingTranslations.clear();
  translationEpochs.clear();
}

export async function translateCaption(
  captionObj: Caption,
  mode: "optimistic" | "semantic" = "semantic",
  force = false,
  overridePending = false
): Promise<void> {
  if (pendingTranslations.has(captionObj.id) && !overridePending) {
    await translationDiagnostics.trace("translation_skipped_pending", {
      captionId: captionObj.id,
      overridePending,
    });
    return;
  }

  if (!force && !settings.translationEnabled) {
    await translationDiagnostics.trace("translation_skipped_disabled", {
      captionId: captionObj.id,
      force,
    });
    return;
  }

  const configError = getTranslationConfigError();
  if (configError) {
    await translationDiagnostics.warn("translation_skipped_config_error", {
      captionId: captionObj.id,
      configError,
    });
    captionObj.translationStatus = TranslationStatus.Error;
    captionObj.translationError = configError;
    updateCaptionTranslation(captionObj);
    return;
  }

  if (!captionObj.text || captionObj.text.trim().length === 0) {
    await translationDiagnostics.trace("translation_skipped_empty_text", {
      captionId: captionObj.id,
    });
    return;
  }

  const textToTranslate = captionObj.text;
  const captionId = captionObj.id;
  const speaker = captionObj.speaker;
  const context = buildContext(captionObj);
  const requestEpoch = incrementTranslationEpoch(captionId);

  await translationDiagnostics.debug("translation_request_started", {
    captionId,
    mode,
    force,
    overridePending,
    source: captionObj.source,
    textLength: textToTranslate.length,
    contextLength: context.length,
    targetLanguage: settings.targetLanguage,
  });

  try {
    pendingTranslations.set(captionId, requestEpoch);
    captionObj.translationStatus = TranslationStatus.Translating;
    captionObj.translationError = undefined;
    updateCaptionTranslation(captionObj);

    const response = (await chrome.runtime.sendMessage({
      action: "translate",
      id: captionId,
      text: textToTranslate,
      targetLang: settings.targetLanguage,
      mode,
      speaker,
      context,
      customPrompt: settings.customPrompt,
      force,
    })) as TranslateResponse;

    const stillExistsInUI = getOverlayItems().find((c) => c.id === captionId);
    const isLatestRequest = translationEpochs.get(captionId) === requestEpoch;

    if (response?.success && response.translation && isLatestRequest) {
      await translationDiagnostics.info("translation_request_succeeded", {
        captionId,
        mode,
        translationLength: response.translation.length,
        stillExistsInUI: Boolean(stillExistsInUI),
      });
      updateCaptionInHistory(captionId, {
        translation: response.translation,
        translationLanguage: settings.targetLanguage,
      });
      saveCaptionsDebounced();

      if (stillExistsInUI) {
        captionObj.translation = response.translation;
        captionObj.translationStatus = TranslationStatus.Semantic;
        captionObj.translationError = undefined;
        updateCaptionTranslation(captionObj);
      }
    } else if (stillExistsInUI && isLatestRequest) {
      const requestFailedMessage = getUiRuntimeTranslator()(
        "content.translation.requestFailed"
      );
      await translationDiagnostics.warn("translation_request_failed", {
        captionId,
        mode,
        error: response?.error || requestFailedMessage,
      });
      captionObj.translationStatus = TranslationStatus.Error;
      captionObj.translationError = response?.error || requestFailedMessage;
      updateCaptionTranslation(captionObj);
    }
  } catch (e) {
    await translationDiagnostics.error("translation_request_threw", {
      captionId,
      mode,
      error: e,
    });
    if (translationEpochs.get(captionId) === requestEpoch) {
      captionObj.translationStatus = TranslationStatus.Error;
      captionObj.translationError = String(e);
      updateCaptionTranslation(captionObj);
    }
  } finally {
    if (pendingTranslations.get(captionId) === requestEpoch) {
      pendingTranslations.delete(captionId);
    }

    await translationDiagnostics.trace("translation_request_finished", {
      captionId,
      mode,
      requestEpoch,
      pendingCount: pendingTranslations.size,
    });
  }
}

export function retranslateCaption(captionObj: Caption): void {
  resetCaptionTranslation(captionObj);
  captionObj.isFinalized = false;
  void translateCaption(captionObj, "semantic", true, true);
}

export function manualTranslate(captionObj: Caption): void {
  resetCaptionTranslation(captionObj);
  void translateCaption(captionObj, "semantic", true, true);
}

export async function translateAllExistingCaptions(
  options: TranslateAllCaptionsOptions = {}
): Promise<void> {
  const {
    force = false,
    includeTranslated = false,
    resetExisting = false,
    overridePending = false,
  } = options;

  const captionsToTranslate = captions.filter(
    (c) =>
      c.text.trim().length > 0 &&
      (includeTranslated || !c.translation) &&
      (overridePending || !pendingTranslations.has(c.id))
  );

  const chatMessagesToTranslate = liveChatMessages.filter(
    (c) =>
      c.text.trim().length > 0 &&
      (includeTranslated || !c.translation) &&
      (overridePending || !pendingTranslations.has(c.id))
  );

  await translationDiagnostics.info("translate_all_started", {
    force,
    includeTranslated,
    resetExisting,
    overridePending,
    captionCount: captionsToTranslate.length,
    chatCount: chatMessagesToTranslate.length,
  });

  for (const caption of [...captionsToTranslate, ...chatMessagesToTranslate].sort(
    (left, right) => left.timestamp - right.timestamp
  )) {
    if (resetExisting) {
      resetCaptionTranslation(caption);
    }

    await translateCaption(caption, "semantic", force, overridePending);
  }

  await translationDiagnostics.info("translate_all_completed", {
    processedCount: captionsToTranslate.length + chatMessagesToTranslate.length,
    force,
    includeTranslated,
  });
}
