import { captions, isCCEnabled, setCCEnabled } from "./state";
import { addOrUpdateCaption, finalizeCaption } from "./caption";
import { renderCaptions } from "./render";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";

let currentCaptionRegion: HTMLElement | null = null;

const elementToCaptionId = new WeakMap<Element, number>();

const elementLastText = new WeakMap<Element, string>();

const elementLastSpeaker = new WeakMap<Element, string>();

const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();

const FINALIZE_DELAY = 1500;

const observerDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "provider",
  feature: "google-meet-observer",
  provider: "google-meet",
});

function processCaption(entry: Element): void {
  const speakerEl = entry.querySelector(".NWpY1d");
  const speaker = speakerEl?.textContent?.trim() || "Unknown";

  const textEl = entry.querySelector(".ygicle");
  if (!textEl) {
    void observerDiagnostics.trace("observer_caption_skipped_missing_text_element");
    return;
  }

  const text = textEl.textContent?.trim();

  if (!text || text.length < 2) {
    void observerDiagnostics.trace("observer_caption_skipped_short_text", {
      speaker,
      textLength: text?.length || 0,
    });
    return;
  }

  const lastText = elementLastText.get(entry);
  const lastSpeaker = elementLastSpeaker.get(entry);

  if (lastText === text && lastSpeaker === speaker) {
    void observerDiagnostics.trace("observer_caption_skipped_duplicate", {
      speaker,
      textLength: text.length,
    });
    return;
  }

  elementLastText.set(entry, text);
  elementLastSpeaker.set(entry, speaker);

  const existingCaptionId = elementToCaptionId.get(entry);

  if (existingCaptionId !== undefined) {
    const caption = captions.find((c) => c.id === existingCaptionId);

    if (!caption) {
      void observerDiagnostics.debug("observer_caption_recreated_missing_local_state", {
        captionId: existingCaptionId,
        speaker,
      });
      cancelFinalization(existingCaptionId);
      const newId = addOrUpdateCaption(null, speaker, text);
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
      return;
    }

    if (caption.speaker === speaker) {
      if (text !== caption.text) {
        void observerDiagnostics.trace("observer_caption_updated", {
          captionId: existingCaptionId,
          speaker,
          textLength: text.length,
        });
        addOrUpdateCaption(existingCaptionId, speaker, text);
        scheduleFinalization(existingCaptionId);
      }
    } else {
      void observerDiagnostics.debug("observer_speaker_switched", {
        previousSpeaker: caption.speaker,
        nextSpeaker: speaker,
      });
      cancelFinalization(existingCaptionId);
      finalizeCaption(existingCaptionId);

      const newId = addOrUpdateCaption(null, speaker, text);
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
    }
  } else {
    void observerDiagnostics.debug("observer_caption_created", {
      speaker,
      textLength: text.length,
    });
    finalizePendingCaptions();

    const newId = addOrUpdateCaption(null, speaker, text);
    elementToCaptionId.set(entry, newId);
    scheduleFinalization(newId);
  }
}

function scheduleFinalization(captionId: number): void {
  void observerDiagnostics.trace("observer_caption_finalization_scheduled", {
    captionId,
    delayMs: FINALIZE_DELAY,
  });
  cancelFinalization(captionId);

  const timer = setTimeout(() => {
    finalizationTimers.delete(captionId);

    const caption = captions.find((c) => c.id === captionId);
    if (caption) {
      finalizeCaption(captionId);
    }
  }, FINALIZE_DELAY);

  finalizationTimers.set(captionId, timer);
}

function finalizePendingCaptions(): void {
  const pendingIds = Array.from(finalizationTimers.keys());
  void observerDiagnostics.trace("observer_pending_captions_finalized", {
    count: pendingIds.length,
  });
  for (const captionId of pendingIds) {
    cancelFinalization(captionId);
    finalizeCaption(captionId);
  }
}

function cancelFinalization(captionId: number): void {
  const timer = finalizationTimers.get(captionId);
  if (timer) {
    clearTimeout(timer);
    finalizationTimers.delete(captionId);
  }
}

function extractCaptions(): void {
  const captionRegion = document.querySelector('[role="region"].vNKgIf.UDinHf');
  if (!captionRegion) {
    void observerDiagnostics.trace("observer_extract_skipped_missing_region");
    return;
  }

  const captionEntries = captionRegion.querySelectorAll(".nMcdL");

  if (captionEntries.length === 0) {
    void observerDiagnostics.trace("observer_extract_skipped_empty_region");
    return;
  }

  void observerDiagnostics.trace("observer_extract_processing_entries", {
    count: captionEntries.length,
  });

  captionEntries.forEach(processCaption);
}

export function startObserver(): void {
  let observer: MutationObserver | null = null;
  let extractTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedExtract(): void {
    if (extractTimeout) clearTimeout(extractTimeout);
    extractTimeout = setTimeout(() => {
      extractCaptions();
    }, 100);
  }

  function observeCaptionRegion(): void {
    const captionRegion = document.querySelector(
      '[role="region"].vNKgIf.UDinHf'
    ) as HTMLElement | null;

    const needsReobserve =
      captionRegion &&
      (!currentCaptionRegion ||
        captionRegion !== currentCaptionRegion ||
        !document.body.contains(currentCaptionRegion));

    if (needsReobserve && captionRegion) {
      void observerDiagnostics.info("observer_region_attached", {
        childCount: captionRegion.childElementCount,
      });
      if (observer) {
        observer.disconnect();
        observer = null;
      }

      currentCaptionRegion = captionRegion;

      if (!isCCEnabled) {
        setCCEnabled(true);
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      observer = new MutationObserver(debouncedExtract);
      observer.observe(captionRegion, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      extractCaptions();
    }

    if (!captionRegion && currentCaptionRegion) {
      void observerDiagnostics.info("observer_region_detached");
      currentCaptionRegion = null;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      finalizePendingCaptions();
    }
  }

  setInterval(observeCaptionRegion, 2000);
  void observerDiagnostics.info("observer_started", {
    pollIntervalMs: 2000,
  });
  observeCaptionRegion();
}
