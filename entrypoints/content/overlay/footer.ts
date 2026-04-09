import {
  captions,
  captureConsentState,
  isCCEnabled,
  liveChatMessages,
  meetingPresenceState,
  settings,
} from "../state";
import { createElement } from "../libs";
import { createContentIcon } from "../icons";
import { getOpenAiServiceAvailability } from "../../shared/openai-service";
import {
  isAutomaticSummaryEnabledForProfile,
  resolveSummaryProfile,
} from "../../shared/summary-profiles";
import {
  getCurrentSessionSnapshot,
  getPendingSessionMetadata,
  getPendingSessionProfileSelection,
  getPendingSessionPreviewSnapshot,
} from "../history-service";
import { getPrimaryMeetingIdentifier } from "../../shared/meeting-session";
import { getUiRuntimeTranslator } from "../../shared/i18n";

const FOOTER_TICK_INTERVAL_MS = 1000;

let footerTicker: number | null = null;

function formatFooterSessionIdentifier(
  providerLabel: string,
  identifiers: Parameters<typeof getPrimaryMeetingIdentifier>[0]
): string {
  const primaryIdentifier = getPrimaryMeetingIdentifier(identifiers);
  if (!primaryIdentifier || primaryIdentifier === "unknown") {
    return providerLabel;
  }

  return `${providerLabel} · ${primaryIdentifier}`;
}

function setTextIfChanged(el: HTMLElement | null, text: string): void {
  if (!el || el.textContent === text) {
    return;
  }

  el.textContent = text;
}

function setAttributeIfChanged(
  el: HTMLElement | null,
  name: string,
  value: string
): void {
  if (!el || el.getAttribute(name) === value) {
    return;
  }

  el.setAttribute(name, value);
}

function setIndicatorVisibility(el: HTMLElement | null, visible: boolean): void {
  if (!el) {
    return;
  }

  const nextDisplay = visible ? "" : "none";
  const nextAriaHidden = visible ? "false" : "true";
  if (
    el.hidden === !visible &&
    el.style.display === nextDisplay &&
    el.getAttribute("aria-hidden") === nextAriaHidden
  ) {
    return;
  }

  el.hidden = !visible;
  el.setAttribute("aria-hidden", nextAriaHidden);
  el.style.display = nextDisplay;
}

function formatElapsedDuration(startTime: number): string {
  const elapsedMs = Math.max(0, Date.now() - startTime);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getFooterLiveState(): {
  label: string;
  tooltip: string;
  tone: "live" | "armed" | "waiting" | "hold" | "off";
} {
  const t = getUiRuntimeTranslator();

  if (captureConsentState === "pending") {
    return {
      label: t("content.footer.liveState.awaitingReply.label"),
      tooltip: t("content.footer.liveState.awaitingReply.tooltip"),
      tone: "hold",
    };
  }

  if (captureConsentState === "approved") {
    return {
      label: t("content.footer.liveState.starting.label"),
      tooltip: t("content.footer.liveState.starting.tooltip"),
      tone: "hold",
    };
  }

  if (captureConsentState === "dismissed") {
    return {
      label: t("content.footer.liveState.off.label"),
      tooltip: t("content.footer.liveState.off.tooltip"),
      tone: "off",
    };
  }

  if (meetingPresenceState === "ended") {
    return {
      label: t("content.footer.liveState.ended.label"),
      tooltip: t("content.footer.liveState.ended.tooltip"),
      tone: "off",
    };
  }

  if (meetingPresenceState !== "joined") {
    return {
      label: t("content.footer.liveState.lobby.label"),
      tooltip: t("content.footer.liveState.lobby.tooltip"),
      tone: "waiting",
    };
  }

  const hasItems = captions.length > 0 || liveChatMessages.length > 0;

  if (isCCEnabled && hasItems) {
    return {
      label: t("content.footer.liveState.live.label"),
      tooltip: t("content.footer.liveState.live.tooltip"),
      tone: "live",
    };
  }

  if (isCCEnabled) {
    return {
      label: t("content.footer.liveState.armed.label"),
      tooltip: t("content.footer.liveState.armed.tooltip"),
      tone: "armed",
    };
  }

  return {
    label: t("content.footer.liveState.waiting.label"),
    tooltip: t("content.footer.liveState.waiting.tooltip"),
    tone: "waiting",
  };
}

export function syncOverlayFooter(): void {
  const t = getUiRuntimeTranslator();
  const titleEl = document.getElementById("mc-footer-title");
  const subtitleEl = document.getElementById("mc-footer-subtitle");
  const durationEl = document.getElementById("mc-footer-duration");
  const turnsEl = document.getElementById("mc-footer-turns");
  const chatEl = document.getElementById("mc-footer-chat");
  const liveStateEl = document.getElementById("mc-footer-live-state");
  const chatCaptureEl = document.getElementById("mc-footer-chat-capture");
  const autoSummaryEl = document.getElementById("mc-footer-auto-summary");
  const autoSummaryWarningEl = document.getElementById(
    "mc-footer-auto-summary-warning"
  );
  const aiAlertEl = document.getElementById("mc-footer-ai-alert");
  const aiAvailability = getOpenAiServiceAvailability(settings);
  const showAiIssue = !aiAvailability.operational;

  const activeSession = getCurrentSessionSnapshot();
  const previewSession = getPendingSessionPreviewSnapshot();
  const pendingProfileSelection = getPendingSessionProfileSelection();
  const session = activeSession || previewSession;
  const resolvedProfile = resolveSummaryProfile(
    settings.summaryProfiles,
    session?.summaryProfileId || pendingProfileSelection.profileId || undefined,
    settings.defaultSummaryProfileId
  );
  const autoSummaryEnabled = isAutomaticSummaryEnabledForProfile(resolvedProfile);
  const pendingMetadata = getPendingSessionMetadata();
  const title =
    session?.title?.trim() ||
    pendingMetadata?.title?.trim() ||
    t("content.footer.sessionFallbackTitle");
  const sessionIdentifier = session
    ? formatFooterSessionIdentifier(session.providerLabel, session.identifiers)
    : pendingMetadata
      ? formatFooterSessionIdentifier(
          pendingMetadata.providerLabel,
          pendingMetadata.identifiers
        )
      : "";
  const liveState = getFooterLiveState();
  const totalTurns = captions.length + liveChatMessages.length;

  if (titleEl) {
    setTextIfChanged(titleEl, title);
  }

  if (subtitleEl) {
    setTextIfChanged(subtitleEl, sessionIdentifier);
    const nextDisplay = sessionIdentifier ? "" : "none";
    if (subtitleEl.style.display !== nextDisplay) {
      subtitleEl.style.display = nextDisplay;
    }
  }

  if (durationEl) {
    setTextIfChanged(
      durationEl,
      activeSession
        ? formatElapsedDuration(activeSession.currentSegmentStartTime)
        : "--"
    );
  }

  if (turnsEl) {
    setTextIfChanged(turnsEl, t("content.footer.turns", { count: totalTurns }));
  }

  if (chatEl) {
    setTextIfChanged(chatEl, t("content.footer.chat", { count: liveChatMessages.length }));
    setIndicatorVisibility(chatEl, settings.storeMeetingChat);
  }

  if (chatCaptureEl) {
    setIndicatorVisibility(chatCaptureEl, settings.storeMeetingChat);
    setAttributeIfChanged(
      chatCaptureEl,
      "data-tooltip",
      t("content.footer.chatCaptureTooltip")
    );
  }

  if (liveStateEl) {
    setTextIfChanged(liveStateEl, liveState.label);
    if (liveStateEl.dataset.tone !== liveState.tone) {
      liveStateEl.dataset.tone = liveState.tone;
    }
    setAttributeIfChanged(liveStateEl, "data-tooltip", liveState.tooltip);
  }

  if (autoSummaryEl) {
    setIndicatorVisibility(autoSummaryEl, autoSummaryEnabled);
    autoSummaryEl.dataset.blocked = showAiIssue ? "true" : "false";
    setAttributeIfChanged(
      autoSummaryEl,
      "data-tooltip",
      showAiIssue
        ? aiAvailability.state === "setup"
          ? t("content.footer.autoSummarySetupTooltip")
          : t("content.footer.autoSummaryUnavailableTooltip")
        : t("content.footer.autoSummaryReadyTooltip", {
            profile: resolvedProfile.name,
          })
    );
  }

  if (autoSummaryWarningEl) {
    setIndicatorVisibility(
      autoSummaryWarningEl,
      autoSummaryEnabled && showAiIssue
    );
  }

  if (aiAlertEl) {
    setIndicatorVisibility(aiAlertEl, showAiIssue);
    setAttributeIfChanged(
      aiAlertEl,
      "data-tooltip",
      aiAvailability.state === "setup"
        ? t("content.footer.aiAlertSetupTooltip")
        : t("content.footer.aiAlertUnavailableTooltip", {
            message: aiAvailability.message,
          })
    );
  }
}

export function startOverlayFooterTicker(): void {
  stopOverlayFooterTicker();
  footerTicker = window.setInterval(() => {
    syncOverlayFooter();
  }, FOOTER_TICK_INTERVAL_MS);
}

export function stopOverlayFooterTicker(): void {
  if (footerTicker !== null) {
    window.clearInterval(footerTicker);
    footerTicker = null;
  }
}

export function createOverlayFooter(): HTMLElement {
  const footer = createElement("div", { className: "mc-footer" }, [
    createElement("div", { className: "mc-footer-session" }, [
      createElement("div", {
        id: "mc-footer-title",
        className: "mc-footer-title",
      }),
      createElement("div", {
        id: "mc-footer-subtitle",
        className: "mc-footer-subtitle",
      }),
    ]),
    createElement("div", { className: "mc-footer-stats" }, [
      createElement("span", {
        id: "mc-footer-live-state",
        className: "mc-footer-pill mc-footer-live-state",
        tabindex: "0",
      }),
      createElement("span", {
        id: "mc-footer-duration",
        className: "mc-footer-pill mc-footer-pill--duration",
        tabindex: "0",
      }),
      createElement("span", {
        id: "mc-footer-turns",
        className: "mc-footer-pill mc-footer-pill--count",
        tabindex: "0",
      }),
      createElement("span", {
        id: "mc-footer-chat",
        className: "mc-footer-pill mc-footer-pill--count",
        tabindex: "0",
      }),
      createElement(
        "span",
        {
          id: "mc-footer-chat-capture",
          className: "mc-footer-chat-capture",
          tabindex: "0",
          hidden: !settings.storeMeetingChat,
        },
        [
          createContentIcon("message-square", {
            className: "mc-icon mc-footer-chat-capture-icon",
            size: 11,
            strokeWidth: 2,
          }) as unknown as HTMLElement,
          createElement("span", { className: "mc-footer-chat-capture-spark" }, [
            createElement("span", {
              className: "mc-footer-chat-capture-spark-dot",
            }),
          ]),
        ]
      ),
      createElement(
        "span",
        {
          id: "mc-footer-auto-summary",
          className: "mc-footer-auto-summary",
          tabindex: "0",
          hidden: true,
        },
        [
          createContentIcon("file-text", {
            className: "mc-icon mc-footer-auto-summary-icon",
            size: 11,
            strokeWidth: 2,
          }) as unknown as HTMLElement,
          createElement("span", { className: "mc-footer-auto-summary-spark" }, [
            createContentIcon("sparkles", {
              className: "mc-icon mc-footer-auto-summary-spark-icon",
              size: 7,
              strokeWidth: 2.1,
            }) as unknown as HTMLElement,
          ]),
          createElement(
            "span",
            {
              id: "mc-footer-auto-summary-warning",
              className: "mc-footer-warning-badge",
              hidden: true,
              "aria-hidden": "true",
            },
            [
              createContentIcon("info", {
                className: "mc-icon mc-footer-warning-icon",
                size: 7,
                strokeWidth: 2.1,
              }) as unknown as HTMLElement,
            ]
          ),
        ]
      ),
      createElement(
        "span",
        {
          id: "mc-footer-ai-alert",
          className: "mc-footer-ai-alert",
          tabindex: "0",
          hidden: true,
        },
        [
          createContentIcon("info", {
            className: "mc-icon mc-footer-ai-alert-icon",
            size: 11,
            strokeWidth: 2,
          }) as unknown as HTMLElement,
        ]
      ),
    ]),
  ]);

  syncOverlayFooter();

  return footer;
}
