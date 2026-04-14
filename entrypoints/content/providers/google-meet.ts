import {
  captions,
  settings,
  setCCEnabled,
  isCCEnabled,
} from "../state";
import { addOrUpdateCaption, finalizeCaption } from "../caption";
import { renderCaptions } from "../render";
import { closeCaptureGuide, openCaptureGuide } from "../overlay/capture-guide";
import { ingestLiveChatEvent } from "../event-ingestion";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";
import { getUiRuntimeTranslator } from "../../shared/i18n";
import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingPresenceState, MeetingProvider } from "./types";

const googleMeetDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "provider",
  feature: "google-meet-caption-pipeline",
  provider: "google-meet",
});

let currentCaptionRegion: HTMLElement | null = null;
let currentChatRegion: HTMLElement | null = null;
let hasSeenGoogleMeetLeaveCallControl = false;
let lastGoogleMeetLeaveMeetingCode: string | null = null;

const elementToCaptionId = new WeakMap<Element, number>();
const elementLastText = new WeakMap<Element, string>();
const elementLastSpeaker = new WeakMap<Element, string>();
const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();
const capturedChatMessageIds = new Set<string>();
const recentChatFingerprints = new Map<string, number>();

const FINALIZE_DELAY = 1500;
const CHAT_DUPLICATE_WINDOW_MS = 15000;
const GOOGLE_MEET_CAPTION_ENABLE_POLL_INTERVAL_MS = 180;
const GOOGLE_MEET_CAPTION_ENABLE_VERIFY_TIMEOUT_MS = 1800;
let chatMessageCounter = 0;

function buildGoogleMeetCaptionMetadata(entry: Element): Record<string, string | boolean> {
  return {
    domShape: "nMcdL",
    entryClass: entry.className || "",
    speakerNodePresent: entry.querySelector(".NWpY1d") !== null,
    textNodePresent: entry.querySelector(".ygicle") !== null,
  };
}

function getMeetingCodeFromUrl(): string | undefined {
  const match = window.location.pathname.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:\/|$)/);
  return match ? match[1] : undefined;
}

function getMeetingTitle(): string | undefined {
  const el = document.querySelector("[data-meeting-title]");
  return el?.getAttribute("data-meeting-title") || undefined;
}

function normalizeGoogleMeetText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function getGoogleMeetInteractiveElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('button, [role="button"]')
  ).filter((element) => element.closest("#captionarc-overlay") === null);
}

function hasGoogleMeetLeaveCallControl(): boolean {
  const buttons = getGoogleMeetInteractiveElements();

  return buttons.some((button) => {
    const ariaLabel = button.getAttribute("aria-label")?.trim() || "";
    if (/^leave call$/i.test(ariaLabel)) {
      return true;
    }

    const iconText = button
      .querySelector('[data-google-symbols-override="true"]')
      ?.textContent?.trim();

    return iconText === "call_end";
  });
}

function hasGoogleMeetPrejoinSurface(): boolean {
  const buttons = getGoogleMeetInteractiveElements();
  const hasPrimaryAction = buttons.some((button) => {
    const label = normalizeGoogleMeetText(button.getAttribute("aria-label"));
    const text = normalizeGoogleMeetText(button.textContent);
    return (
      /^(join now|ask to join|present)$/i.test(label) ||
      /^(join now|ask to join|present)$/i.test(text)
    );
  });

  if (hasPrimaryAction) {
    return true;
  }

  const bodyText = normalizeGoogleMeetText(document.body?.innerText);
  if (bodyText.includes("use companion mode")) {
    return true;
  }

  return Boolean(getMeetingTitle()) && !hasSeenGoogleMeetLeaveCallControl;
}

function hasGoogleMeetMeetingShellHint(url: URL): boolean {
  if (getGoogleMeetPageKind(url) !== "meeting") {
    return false;
  }

  const title = document.title.trim();
  if (/^meet(?:\s*-\s*.+)?$/i.test(title)) {
    return true;
  }

  const bodyText = normalizeGoogleMeetText(document.body?.innerText);
  if (
    bodyText.includes("getting ready") ||
    bodyText.includes("preparing your meeting") ||
    bodyText.includes("setting things up for your meeting")
  ) {
    return true;
  }

  return false;
}

function hasGoogleMeetPageContext(url: URL): boolean {
  const pageKind = getGoogleMeetPageKind(url);
  if (!pageKind) {
    return false;
  }

  if (pageKind === "new") {
    return true;
  }

  return (
    hasGoogleMeetLeaveCallControl() ||
    hasGoogleMeetPrejoinSurface() ||
    hasGoogleMeetMeetingShellHint(url)
  );
}

function getGoogleMeetCaptionToggleButton(
  mode: "enable" | "disable"
): HTMLButtonElement | null {
  const buttons = getGoogleMeetInteractiveElements();

  return (
    buttons.find((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return false;
      }

      if (button.disabled || button.getAttribute("aria-disabled") === "true") {
        return false;
      }

      const ariaLabel = normalizeGoogleMeetText(button.getAttribute("aria-label"));
      const tooltipId = button.getAttribute("data-tooltip-id");
      const tooltip = normalizeGoogleMeetText(
        tooltipId ? document.getElementById(tooltipId)?.textContent : ""
      );
      const iconText = normalizeGoogleMeetText(
        button.querySelector("i")?.textContent
      );

      if (mode === "enable") {
        return (
          ariaLabel === "turn on captions" ||
          tooltip.includes("turn on captions") ||
          iconText === "closed_caption_off"
        );
      }

      return (
        ariaLabel === "turn off captions" ||
        tooltip.includes("turn off captions") ||
        iconText === "closed_caption"
      );
    }) || null
  );
}

function isGoogleMeetCaptionsEnabled(): boolean {
  return (
    document.querySelector('[role="region"].vNKgIf.UDinHf') !== null ||
    getGoogleMeetCaptionToggleButton("disable") !== null
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getGoogleMeetPresence(): MeetingPresenceState {
  const currentUrl = new URL(window.location.href);
  const pageKind = getGoogleMeetPageKind(currentUrl);
  if (!pageKind) {
    return "unknown";
  }

  const meetingCode = getMeetingCodeFromUrl() || null;
  if (
    hasSeenGoogleMeetLeaveCallControl &&
    lastGoogleMeetLeaveMeetingCode &&
    meetingCode &&
    meetingCode !== lastGoogleMeetLeaveMeetingCode
  ) {
    hasSeenGoogleMeetLeaveCallControl = false;
    lastGoogleMeetLeaveMeetingCode = null;
  }

  if (hasGoogleMeetLeaveCallControl()) {
    hasSeenGoogleMeetLeaveCallControl = true;
    lastGoogleMeetLeaveMeetingCode = meetingCode;
    return "joined";
  }

  if (pageKind === "new") {
    hasSeenGoogleMeetLeaveCallControl = false;
    lastGoogleMeetLeaveMeetingCode = null;
    return "prejoin";
  }

  if (hasGoogleMeetPrejoinSurface()) {
    hasSeenGoogleMeetLeaveCallControl = false;
    lastGoogleMeetLeaveMeetingCode = null;
    return "prejoin";
  }

  if (hasSeenGoogleMeetLeaveCallControl) {
    return "ended";
  }

  if (!hasGoogleMeetPageContext(currentUrl)) {
    return "unknown";
  }

  return "prejoin";
}

function processCaption(entry: Element): void {
  const speakerEl = entry.querySelector(".NWpY1d");
  const speaker = speakerEl?.textContent?.trim() || "Unknown";
  const own = speaker === "You";

  const textEl = entry.querySelector(".ygicle");
  if (!textEl) {
    void googleMeetDiagnostics.trace("google_meet_caption_skipped_missing_text_node");
    return;
  }

  const text = textEl.textContent?.trim();
  if (!text || text.length < 2) {
    void googleMeetDiagnostics.trace("google_meet_caption_skipped_short_text", {
      speaker,
      textLength: text?.length || 0,
    });
    return;
  }

  const lastText = elementLastText.get(entry);
  const lastSpeaker = elementLastSpeaker.get(entry);
  if (lastText === text && lastSpeaker === speaker) {
    void googleMeetDiagnostics.trace("google_meet_caption_skipped_duplicate", {
      speaker,
      textLength: text.length,
    });
    return;
  }

  elementLastText.set(entry, text);
  elementLastSpeaker.set(entry, speaker);

  const existingCaptionId = elementToCaptionId.get(entry);
  const metadata = buildGoogleMeetCaptionMetadata(entry);

  if (existingCaptionId !== undefined) {
    const caption = captions.find((item) => item.id === existingCaptionId);

    if (!caption) {
      void googleMeetDiagnostics.debug("google_meet_caption_recreated_missing_local_state", {
        captionId: existingCaptionId,
        speaker,
      });
      cancelFinalization(existingCaptionId);
      const newId = addOrUpdateCaption(null, speaker, text, { metadata, own });
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
      return;
    }

    if (caption.speaker === speaker) {
      if (text !== caption.text) {
        void googleMeetDiagnostics.trace("google_meet_caption_updated", {
          captionId: existingCaptionId,
          speaker,
          textLength: text.length,
        });
        addOrUpdateCaption(existingCaptionId, speaker, text, { metadata, own });
        scheduleFinalization(existingCaptionId);
      }
    } else {
      void googleMeetDiagnostics.debug("google_meet_caption_speaker_switched", {
        previousSpeaker: caption.speaker,
        nextSpeaker: speaker,
      });
      cancelFinalization(existingCaptionId);
      finalizeCaption(existingCaptionId);

      const newId = addOrUpdateCaption(null, speaker, text, { metadata, own });
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
    }

    return;
  }

  finalizePendingCaptions();

  void googleMeetDiagnostics.debug("google_meet_caption_created", {
    speaker,
    textLength: text.length,
    own,
  });
  const newId = addOrUpdateCaption(null, speaker, text, { metadata, own });
  elementToCaptionId.set(entry, newId);
  scheduleFinalization(newId);
}

function scheduleFinalization(captionId: number): void {
  void googleMeetDiagnostics.trace("google_meet_caption_finalization_scheduled", {
    captionId,
    delayMs: FINALIZE_DELAY,
  });
  cancelFinalization(captionId);

  const timer = setTimeout(() => {
    finalizationTimers.delete(captionId);
    const caption = captions.find((item) => item.id === captionId);
    if (caption) {
      finalizeCaption(captionId);
    }
  }, FINALIZE_DELAY);

  finalizationTimers.set(captionId, timer);
}

function finalizePendingCaptions(): void {
  const pendingIds = Array.from(finalizationTimers.keys());
  void googleMeetDiagnostics.trace("google_meet_pending_captions_finalized", {
    count: pendingIds.length,
  });
  for (const captionId of pendingIds) {
    cancelFinalization(captionId);
    finalizeCaption(captionId);
  }
}

function cancelFinalization(captionId: number): void {
  const timer = finalizationTimers.get(captionId);
  if (!timer) {
    return;
  }

  clearTimeout(timer);
  finalizationTimers.delete(captionId);
}

function extractCaptions(): void {
  const captionRegion = document.querySelector('[role="region"].vNKgIf.UDinHf');
  if (!captionRegion) {
    void googleMeetDiagnostics.trace("google_meet_extract_skipped_missing_region");
    return;
  }

  const captionEntries = captionRegion.querySelectorAll(".nMcdL");
  if (captionEntries.length === 0) {
    void googleMeetDiagnostics.trace("google_meet_extract_skipped_empty_region");
    return;
  }

  void googleMeetDiagnostics.trace("google_meet_extract_processing_entries", {
    count: captionEntries.length,
  });

  captionEntries.forEach(processCaption);
}

function getChatRegion(): HTMLElement | null {
  return document.querySelector(
    'div[jsname="xySENc"][aria-live="polite"]'
  ) as HTMLElement | null;
}

function createChatTimestamp(): number {
  chatMessageCounter += 1;
  return Date.now() + chatMessageCounter;
}

function buildChatFingerprint(
  speaker: string,
  text: string
): string {
  return `${speaker.trim().toLowerCase()}|${text.trim().toLowerCase()}`;
}

function extractChatMessages(): void {
  if (!settings.storeMeetingChat) {
    void googleMeetDiagnostics.trace("google_meet_chat_extract_skipped_disabled");
    return;
  }

  const chatRegion = getChatRegion();
  if (!chatRegion) {
    void googleMeetDiagnostics.trace("google_meet_chat_extract_skipped_missing_region");
    return;
  }

  const messageGroups = chatRegion.querySelectorAll(
    '.Ss4fHf, .Ss4fHf.ydIQ1d'
  );

  messageGroups.forEach((group) => {
    const speaker =
      group.querySelector(".poVWob")?.textContent?.trim() || "You";
    const time =
      group.querySelector('[jsname="biJjHb"]')?.textContent?.trim() ||
      new Date().toLocaleTimeString();
    const messageEntries = group.querySelectorAll<HTMLElement>(
      '.beTDc > .RLrADb[data-message-id]'
    );

    messageEntries.forEach((entry) => {
      const messageId = entry.getAttribute("data-message-id")?.trim();
      if (!messageId || capturedChatMessageIds.has(messageId)) {
        return;
      }

      const text =
        entry
          .querySelector('[jsname="dTKtvb"]')
          ?.textContent?.trim()
          .replace(/\s+/g, " ") || "";

      if (!text) {
        return;
      }

      const fingerprint = buildChatFingerprint(speaker, text);
      const now = Date.now();
      const lastSeenAt = recentChatFingerprints.get(fingerprint);
      if (lastSeenAt && now - lastSeenAt < CHAT_DUPLICATE_WINDOW_MS) {
        void googleMeetDiagnostics.trace("google_meet_chat_skipped_duplicate", {
          speaker,
          messageId,
        });
        capturedChatMessageIds.add(messageId);
        return;
      }

      capturedChatMessageIds.add(messageId);
      const timestamp = createChatTimestamp();
      recentChatFingerprints.set(fingerprint, now);

      void googleMeetDiagnostics.debug("google_meet_chat_ingested", {
        speaker,
        messageId,
        textLength: text.length,
      });

      ingestLiveChatEvent({
        speaker,
        text,
        time,
        timestamp,
        historyTimestamp: timestamp,
        own: speaker === "You",
        providerEventId: messageId,
      });
    });
  });
}

export const googleMeetProvider: MeetingProvider = {
  platform: "google-meet",

  matchesUrl(url) {
    return getGoogleMeetPageKind(url) !== null;
  },

  matchesPageContext(url) {
    return hasGoogleMeetPageContext(url);
  },

  bootstrap() {
    return undefined;
  },

  getMeetingPresence() {
    return getGoogleMeetPresence();
  },

  startCaptionObserver() {
    let captionObserver: MutationObserver | null = null;
    let chatObserver: MutationObserver | null = null;
    let extractTimeout: ReturnType<typeof setTimeout> | null = null;
    let chatExtractTimeout: ReturnType<typeof setTimeout> | null = null;

    const debouncedExtract = () => {
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      extractTimeout = setTimeout(() => {
        extractCaptions();
      }, 100);
    };

    const debouncedExtractChat = () => {
      if (chatExtractTimeout) {
        clearTimeout(chatExtractTimeout);
      }
      chatExtractTimeout = setTimeout(() => {
        extractChatMessages();
      }, 100);
    };

    const observeCaptionRegion = () => {
      const captionRegion = document.querySelector(
        '[role="region"].vNKgIf.UDinHf'
      ) as HTMLElement | null;

      const needsReobserve =
        captionRegion &&
        (!currentCaptionRegion ||
          captionRegion !== currentCaptionRegion ||
          !document.body.contains(currentCaptionRegion));

      if (needsReobserve && captionRegion) {
        void googleMeetDiagnostics.info("google_meet_caption_region_attached", {
          childCount: captionRegion.childElementCount,
        });
        if (captionObserver) {
          captionObserver.disconnect();
          captionObserver = null;
        }

        currentCaptionRegion = captionRegion;

        if (!isCCEnabled) {
          setCCEnabled(true);
          closeCaptureGuide();
          if (captions.length === 0) {
            renderCaptions();
          }
        }

        captionObserver = new MutationObserver(debouncedExtract);
        captionObserver.observe(captionRegion, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        extractCaptions();
      }

      if (!captionRegion && currentCaptionRegion) {
        void googleMeetDiagnostics.info("google_meet_caption_region_detached");
        currentCaptionRegion = null;
        setCCEnabled(false);
        if (getGoogleMeetPresence() === "joined") {
          openCaptureGuide();
        } else {
          closeCaptureGuide();
        }

        if (captionObserver) {
          captionObserver.disconnect();
          captionObserver = null;
        }

        finalizePendingCaptions();
        if (captions.length === 0) {
          renderCaptions();
        }
      }
    };

    const observeChatRegion = () => {
      if (!settings.storeMeetingChat) {
        if (currentChatRegion && chatObserver) {
          void googleMeetDiagnostics.info("google_meet_chat_region_detached_due_settings");
          chatObserver.disconnect();
          chatObserver = null;
        }
        currentChatRegion = null;
        return;
      }

      const chatRegion = getChatRegion();
      const needsReobserve =
        chatRegion &&
        (!currentChatRegion ||
          chatRegion !== currentChatRegion ||
          !document.body.contains(currentChatRegion));

      if (needsReobserve && chatRegion) {
        void googleMeetDiagnostics.info("google_meet_chat_region_attached", {
          childCount: chatRegion.childElementCount,
        });
        if (chatObserver) {
          chatObserver.disconnect();
          chatObserver = null;
        }

        currentChatRegion = chatRegion;
        chatObserver = new MutationObserver(debouncedExtractChat);
        chatObserver.observe(chatRegion, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        extractChatMessages();
      }

      if (!chatRegion && currentChatRegion) {
        void googleMeetDiagnostics.info("google_meet_chat_region_detached");
        currentChatRegion = null;
        if (chatObserver) {
          chatObserver.disconnect();
          chatObserver = null;
        }
      }
    };

    const intervalId = setInterval(() => {
      observeCaptionRegion();
      observeChatRegion();
    }, 2000);
    void googleMeetDiagnostics.info("google_meet_observers_started", {
      pollIntervalMs: 2000,
    });
    observeCaptionRegion();
    observeChatRegion();

    return () => {
      void googleMeetDiagnostics.info("google_meet_observers_stopped", {
        capturedChatCount: capturedChatMessageIds.size,
      });
      clearInterval(intervalId);
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      if (chatExtractTimeout) {
        clearTimeout(chatExtractTimeout);
      }
      if (captionObserver) {
        captionObserver.disconnect();
      }
      if (chatObserver) {
        chatObserver.disconnect();
      }
      currentCaptionRegion = null;
      currentChatRegion = null;
      capturedChatMessageIds.clear();
      recentChatFingerprints.clear();
      chatMessageCounter = 0;
      setCCEnabled(false);
      finalizePendingCaptions();
    };
  },

  getSessionMetadata() {
    return {
      platform: "google-meet",
      providerLabel: getProviderLabel("google-meet"),
      title: getMeetingTitle(),
      sourceUrl: window.location.href,
      identifiers: {
        meetingCode: getMeetingCodeFromUrl(),
      },
    };
  },

  getEmptyState() {
    const t = getUiRuntimeTranslator();

    return {
      waitingTitle: t("content.empty.waitingForCaptionsTitle"),
      waitingBody: t("content.empty.waitingForCaptionsGoogleMeet"),
    };
  },

  getCaptureGuide() {
    const t = getUiRuntimeTranslator();

    return {
      modalTitle: t("content.captureGuide.providers.googleMeet.title"),
      modalBody: t("content.captureGuide.providers.googleMeet.body"),
      statusLabel: t("content.captureGuide.providers.googleMeet.status"),
      footerNote: t("content.captureGuide.providers.googleMeet.footer"),
      steps: [
        {
          title: t("content.captureGuide.providers.googleMeet.steps.openControls.title"),
          detail: t(
            "content.captureGuide.providers.googleMeet.steps.openControls.detail"
          ),
        },
        {
          title: t("content.captureGuide.providers.googleMeet.steps.openCaptions.title"),
          detail: t(
            "content.captureGuide.providers.googleMeet.steps.openCaptions.detail"
          ),
        },
        {
          title: t("content.captureGuide.providers.googleMeet.steps.turnOn.title"),
          detail: t(
            "content.captureGuide.providers.googleMeet.steps.turnOn.detail"
          ),
        },
      ],
      troubleshootingHint: t(
        "content.captureGuide.providers.googleMeet.troubleshooting"
      ),
    };
  },

  isCaptioningCurrentlyAvailable() {
    return document.querySelector('[role="region"].vNKgIf.UDinHf') !== null;
  },

  async tryEnableLiveCaptions(timeoutMs) {
    await googleMeetDiagnostics.info("google_meet_enable_captions_started", {
      timeoutMs,
    });
    if (isGoogleMeetCaptionsEnabled()) {
      await googleMeetDiagnostics.debug("google_meet_enable_captions_already_enabled");
      return true;
    }

    const deadline = Date.now() + Math.max(0, timeoutMs);
    let toggleButton: HTMLButtonElement | null = null;

    while (Date.now() < deadline) {
      toggleButton = getGoogleMeetCaptionToggleButton("enable");
      if (toggleButton) {
        break;
      }

      await delay(GOOGLE_MEET_CAPTION_ENABLE_POLL_INTERVAL_MS);
    }

    if (!toggleButton) {
      await googleMeetDiagnostics.warn("google_meet_enable_captions_toggle_not_found", {
        timeoutMs,
      });
      return false;
    }

    toggleButton.click();

    const verifyDeadline = Date.now() + GOOGLE_MEET_CAPTION_ENABLE_VERIFY_TIMEOUT_MS;

    while (Date.now() < verifyDeadline) {
      if (isGoogleMeetCaptionsEnabled()) {
        await googleMeetDiagnostics.info("google_meet_enable_captions_completed");
        return true;
      }

      await delay(GOOGLE_MEET_CAPTION_ENABLE_POLL_INTERVAL_MS);
    }

    const enabled = isGoogleMeetCaptionsEnabled();
    await googleMeetDiagnostics.warn("google_meet_enable_captions_verify_finished", {
      enabled,
    });
    return enabled;
  },
};

function getGoogleMeetPageKind(
  url: URL
): "meeting" | "new" | null {
  if (url.pathname === "/new") {
    return "new";
  }

  if (/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\/)?$/.test(url.pathname)) {
    return "meeting";
  }

  return null;
}

function resetGoogleMeetProviderStateForTests(): void {
  currentCaptionRegion = null;
  currentChatRegion = null;
  hasSeenGoogleMeetLeaveCallControl = false;
  lastGoogleMeetLeaveMeetingCode = null;
  finalizationTimers.forEach((timer) => clearTimeout(timer));
  finalizationTimers.clear();
  capturedChatMessageIds.clear();
  recentChatFingerprints.clear();
  chatMessageCounter = 0;
}

export const googleMeetProviderInternals = {
  getGoogleMeetPageKind,
  getGoogleMeetPresence,
  getGoogleMeetCaptionToggleButton,
  hasGoogleMeetPageContext,
  hasGoogleMeetPrejoinSurface,
  hasGoogleMeetLeaveCallControl,
  isGoogleMeetCaptionsEnabled,
  tryEnableGoogleMeetLiveCaptions: googleMeetProvider.tryEnableLiveCaptions,
  processCaption,
  extractChatMessages,
  resetGoogleMeetProviderStateForTests,
};
