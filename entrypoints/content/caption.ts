import type { Caption } from "./types";
import { MAX_CAPTIONS } from "./constants";
import { TranslationStatus } from "./constants";
import {
  captions,
  settings,
  waveElement,
  waveTimeout,
  setWaveTimeout,
  clearSemanticTimer,
} from "./state";
import { translateCaption, cleanupTranslationState } from "./translation";
import { renderCaptions, scrollToBottomIfNeeded } from "./render";
import { updateCaptionTranslation } from "./caption-ui";
import { createOverlayItemFromEvent } from "./event-ingestion";
import {
  saveCaptionsDebounced,
  addCaptionToHistory,
  updateCaptionInHistory,
} from "./history-service";

export function setWaveActive(active: boolean): void {
  if (!waveElement) return;
  if (active) {
    waveElement.classList.add("mc-active");
    if (waveTimeout) clearTimeout(waveTimeout);
    setWaveTimeout(
      setTimeout(() => {
        waveElement?.classList.remove("mc-active");
      }, 3000)
    );
  } else {
    waveElement.classList.remove("mc-active");
    if (waveTimeout) clearTimeout(waveTimeout);
  }
}

export function addOrUpdateCaption(
  captionId: number | null,
  speaker: string,
  text: string,
  options?: {
    providerEventId?: string;
    metadata?: Caption["metadata"];
    time?: string;
    timestamp?: number;
    historyTimestamp?: number;
    own?: boolean;
  }
): number {
  if (!text || text.trim().length === 0) {
    return captionId ?? -1;
  }

  setWaveActive(true);

  if (captionId !== null) {
    const caption = captions.find((c) => c.id === captionId);
    if (caption) {
      const textChanged = caption.text !== text;

      if (!textChanged) {
        return captionId;
      }

      caption.text = text;
      caption.time = options?.time || new Date().toLocaleTimeString();
      if (options?.providerEventId !== undefined) {
        caption.providerEventId = options.providerEventId;
      }
      if (options?.metadata !== undefined) {
        caption.metadata = options.metadata;
      }
      if (options?.own !== undefined) {
        caption.own = options.own;
      }

      const needsRetranslate = caption.isFinalized && textChanged;
      if (needsRetranslate) {
        caption.translationStatus = TranslationStatus.Pending;
      }
      caption.isFinalized = false;

      const captionEl = document.querySelector(
        `[data-caption-id="${captionId}"]`
      );
      if (captionEl) {
        const textEl = captionEl.querySelector(".mc-original");
        const timeEl = captionEl.querySelector(".mc-time");
        if (textEl) textEl.textContent = text;
        if (timeEl) timeEl.textContent = caption.time;

        if (needsRetranslate || !caption.translation) {
          updateCaptionTranslation(caption);
        }
      }

      scrollToBottomIfNeeded();

      updateCaptionInHistory(captionId, {
        speaker,
        text,
        time: caption.time,
        providerEventId: caption.providerEventId,
        metadata: caption.metadata,
        own: caption.own,
        isFinal: false,
      });
      saveCaptionsDebounced();
      return captionId;
    }
    // Edge case: Caption no longer exists, fall through to create new
  }

  const createdAt = options?.timestamp ?? Date.now();
  const newCaption: Caption = createOverlayItemFromEvent({
    source: "caption",
    speaker,
    text,
    time: options?.time,
    timestamp: createdAt,
    historyTimestamp: options?.historyTimestamp ?? createdAt,
    providerEventId: options?.providerEventId,
    metadata: options?.metadata,
    own: options?.own,
    isFinal: false,
  });
  const newId = newCaption.id;

  captions.push(newCaption);

  addCaptionToHistory(newCaption);

  while (captions.length > MAX_CAPTIONS) {
    const removed = captions.shift();
    if (removed) {
      clearSemanticTimer(removed.id);
      cleanupTranslationState(removed.id);
    }
  }

  renderCaptions(false);
  saveCaptionsDebounced();

  return newId;
}

export function finalizeCaption(captionId: number): void {
  const caption = captions.find((c) => c.id === captionId);

  if (!caption) {
    return;
  }

  if (caption.isFinalized) {
    return;
  }

  caption.isFinalized = true;
  updateCaptionInHistory(captionId, { isFinal: true });

  if (settings.translationEnabled) {
    // Skip if already has translation and not pending retranslate
    if (
      caption.translation &&
      caption.translationStatus !== TranslationStatus.Error &&
      caption.translationStatus !== TranslationStatus.Pending
    ) {
      return;
    }

    if (caption.translationStatus === TranslationStatus.Translating) {
      return;
    }

    translateCaption(caption, "semantic");
  }

  saveCaptionsDebounced();
}

export function addCaption(speaker: string, text: string): void {
  addOrUpdateCaption(null, speaker, text);
}
