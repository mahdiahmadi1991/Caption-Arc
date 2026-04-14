import { LANGUAGES, TranslationStatus } from "../constants";
import {
  settings,
  overlay,
  captions,
  captionActivationState,
  liveChatMessages,
  isCCEnabled,
  isCaptureGuideOpen,
  captureConsentState,
  meetingPresenceState,
  setWaveElement,
  isMinimized,
  setMinimized,
  savedPosition,
  setSavedPosition,
} from "../state";
import { createElement } from "../libs";
import { createContentIcon } from "../icons";
import { getOpenAiServiceAvailability } from "../../shared/openai-service";
import {
  translateAllExistingCaptions,
  isTranslationConfigured,
  openTranslationSettings,
} from "../translation";
import { closeCaptureGuide, openCaptureGuide } from "./capture-guide";
import { createOverlayDropdownSelect } from "./dropdown-select";
import { persistOverlayPosition } from "./interactions";
import { saveOverlaySettings } from "./settings";
import {
  getSystemPrefersDark,
  resolveThemePreference,
} from "../../shared/theme";
import {
  ensurePendingSessionProfileSelection,
  getCurrentSessionSnapshot,
  getPendingSessionPreviewSnapshot,
  getPendingSessionProfileSelection,
  setPendingSessionProfileSelection,
} from "../history-service";
import { syncOverlayFooter } from "./footer";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";
import { getUiRuntimeTranslator } from "../../shared/i18n";

const overlayHeaderDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "overlay-header",
});

type TranslationDockState = {
  status:
    | "setup"
    | "off"
    | "waiting"
    | "ready"
    | "translating"
    | "error"
    | "live"
    | "consent"
    | "starting"
    | "dismissed"
    | "unavailable";
  title: string;
  body: string;
  badge: string;
};

const COMPACT_OVERLAY_WIDTH = 296;
const COMPACT_OVERLAY_HEIGHT = 68;
const VIEWPORT_MARGIN = 16;
const OVERLAY_STAGE_TIMEOUT_MS = 240;
const PROFILE_CONTROL_OPEN_MIN_WIDTH = 220;
const PROFILE_CONTROL_OPEN_MAX_WIDTH = 350;
let isOverlayTransitioning = false;
let sessionProfileSelectHandle:
  | ReturnType<typeof createOverlayDropdownSelect>
  | null = null;
let sessionProfileRailOpen = false;
const PENDING_TRANSLATION_STATES: TranslationStatus[] = [
  TranslationStatus.Pending,
  TranslationStatus.Translating,
  TranslationStatus.Refining,
];

type ExtensionRuntime = {
  getURL?: (path: string) => string;
  sendMessage: (message: unknown) => Promise<unknown>;
};

function getExtensionRuntime(): ExtensionRuntime | undefined {
  return (globalThis as typeof globalThis & {
    chrome?: { runtime?: ExtensionRuntime };
  }).chrome?.runtime;
}

function getOverlayItems() {
  return [...captions, ...liveChatMessages];
}

function clampOverlayPosition(
  left: number,
  top: number,
  width: number,
  height: number
): { left: number; top: number } {
  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

  return {
    left: Math.min(Math.max(VIEWPORT_MARGIN, left), maxLeft),
    top: Math.min(Math.max(VIEWPORT_MARGIN, top), maxTop),
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function waitForOverlayStage(
  element: HTMLElement,
  propertyName: "width" | "height"
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      element.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(timeoutId);
      resolve();
    };

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === propertyName) {
        finish();
      }
    };

    const timeoutId = window.setTimeout(finish, OVERLAY_STAGE_TIMEOUT_MS);
    element.addEventListener("transitionend", handleTransitionEnd);
  });
}

function getLanguageName(code: string): string {
  return LANGUAGES.find((language) => language.code === code)?.name || code;
}

function getBrandMarkSrc(): string {
  const resolvedTheme =
    overlay?.dataset.theme ||
    resolveThemePreference(settings.appearance, getSystemPrefersDark());

  const assetPath =
    resolvedTheme === "dark" ? "logo-mark-dark.svg" : "logo-mark-light.svg";

  const runtime = getExtensionRuntime();
  if (typeof runtime?.getURL === "function") {
    return runtime.getURL(assetPath);
  }

  return assetPath;
}

function createBrandMark(className: string): HTMLElement {
  const t = getUiRuntimeTranslator();

  return createElement("div", { className }, [
    createElement("img", {
      className: "mc-brand-mark-image",
      src: getBrandMarkSrc(),
      alt: t("common.appName"),
      draggable: "false",
    }),
  ]);
}

export function syncBrandMarkTheme(): void {
  const src = getBrandMarkSrc();
  document.querySelectorAll<HTMLImageElement>(".mc-brand-mark-image").forEach((image) => {
    image.src = src;
  });
}

export function syncSessionProfileRailSize(): void {
  const control = document.getElementById("mc-header-profile-control");

  if (!(control instanceof HTMLElement)) {
    return;
  }

  const overlayWidth = overlay?.getBoundingClientRect().width;

  if (!overlayWidth || !Number.isFinite(overlayWidth)) {
    control.style.removeProperty("--mc-header-profile-control-open-width");
    return;
  }

  const openWidth = Math.round(
    clampNumber(
      overlayWidth * 0.42,
      PROFILE_CONTROL_OPEN_MIN_WIDTH,
      PROFILE_CONTROL_OPEN_MAX_WIDTH
    )
  );

  control.style.setProperty(
    "--mc-header-profile-control-open-width",
    `${openWidth}px`
  );
}

function getCompactStatusCopy(): { title: string; detail: string } {
  const t = getUiRuntimeTranslator();
  const aiAvailability = getOpenAiServiceAvailability(settings);

  if (!aiAvailability.operational) {
    return {
      title: t("content.header.compactStatus.aiNeedsAttentionTitle"),
      detail:
        aiAvailability.state === "setup"
          ? t("content.header.compactStatus.finishOpenAiSetup")
          : t("content.header.compactStatus.openAiUnavailable"),
    };
  }

  if (captureConsentState === "pending") {
    return {
      title: t("content.header.compactStatus.capturePendingTitle"),
      detail: t("content.header.compactStatus.waitingForAnswer"),
    };
  }

  if (captureConsentState === "approved") {
    return {
      title: t("content.header.compactStatus.startingCaptureTitle"),
      detail: t("content.header.compactStatus.preparingMeeting"),
    };
  }

  if (captureConsentState === "dismissed") {
    return {
      title: t("content.header.compactStatus.captureSkippedTitle"),
      detail: t("content.header.compactStatus.meetingStaysOff"),
    };
  }

  if (meetingPresenceState === "ended") {
    return {
      title: t("content.header.compactStatus.sessionEndedTitle"),
      detail: t("content.header.compactStatus.rejoinToContinue"),
    };
  }

  if (meetingPresenceState !== "joined") {
    return {
      title: t("content.header.compactStatus.waitingToJoinTitle"),
      detail: t("content.header.compactStatus.sessionStartsAfterJoin"),
    };
  }

  if (captionActivationState === "attempting") {
    return {
      title: t("content.header.compactStatus.enablingCaptionsTitle"),
      detail: t("content.header.compactStatus.tryingLiveCaptions"),
    };
  }

  if (isCaptureGuideOpen && !isCCEnabled && captions.length === 0) {
    return {
      title: t("content.header.compactStatus.setupRequiredTitle"),
      detail: t("content.header.compactStatus.turnOnMeetingCaptions"),
    };
  }

  const overlayItems = getOverlayItems();
  const hasTranslationError = overlayItems.some(
    (caption) => caption.translationStatus === TranslationStatus.Error
  );

  const hasPendingTranslation = overlayItems.some((caption) =>
    PENDING_TRANSLATION_STATES.includes(caption.translationStatus)
  );

  if (hasTranslationError) {
    return {
      title: t("content.header.compactStatus.translationIssueTitle"),
      detail: t("content.header.compactStatus.retryAvailable"),
    };
  }

  if (hasPendingTranslation && settings.translationEnabled) {
    return {
      title: t("content.header.compactStatus.translatingLiveTitle"),
      detail: getLanguageName(settings.targetLanguage),
    };
  }

  if (overlayItems.length > 0) {
    return settings.translationEnabled
      ? {
          title: t("content.header.compactStatus.liveTranslationTitle"),
          detail: getLanguageName(settings.targetLanguage),
        }
      : {
          title: t("content.header.compactStatus.capturingLiveTitle"),
          detail: t("content.header.compactStatus.originalCaptionsOnly"),
        };
  }

  if (isCCEnabled) {
    return {
      title: t("content.header.compactStatus.readyToCaptureTitle"),
      detail: t("content.header.compactStatus.waitingForSpeech"),
    };
  }

  return {
    title: t("content.header.compactStatus.waitingForCaptionsTitle"),
    detail: t("content.header.compactStatus.turnOnMeetingCaptions"),
  };
}

function getHeaderCopy(): { title: string; subtitle: string } {
  const t = getUiRuntimeTranslator();

  if (captureConsentState === "pending") {
    return {
      title: t("content.header.main.captureOnHoldTitle"),
      subtitle: t("content.header.main.waitingForAnswer"),
    };
  }

  if (captureConsentState === "approved") {
    return {
      title: t("content.header.main.startingCaptureTitle"),
      subtitle: t("content.header.main.preparingMeeting"),
    };
  }

  if (captureConsentState === "dismissed") {
    return {
      title: t("content.header.main.captureSkippedTitle"),
      subtitle: t("content.header.main.meetingStaysOff"),
    };
  }

  if (meetingPresenceState === "ended") {
    return {
      title: t("content.header.main.sessionEndedTitle"),
      subtitle: t("content.header.main.rejoinToContinue"),
    };
  }

  if (meetingPresenceState !== "joined") {
    return {
      title: t("content.header.main.waitingToJoinTitle"),
      subtitle: t("content.header.main.meetingOverlay"),
    };
  }

  if (captionActivationState === "attempting") {
    return {
      title: t("content.header.main.enablingLiveCaptionsTitle"),
      subtitle: t("content.header.main.preparingCapture"),
    };
  }

  return {
    title: t("content.header.main.liveCaptureTitle"),
    subtitle: t("content.header.main.meetingOverlay"),
  };
}

function shouldShowSessionProfileHeaderControl(): boolean {
  const activeSession = getCurrentSessionSnapshot() || getPendingSessionPreviewSnapshot();
  return (
    settings.meetingProfiles.length > 1 &&
    (meetingPresenceState === "prejoin" ||
      meetingPresenceState === "joined" ||
      !!activeSession)
  );
}

function canChangeSessionProfileHeaderControl(): boolean {
  const pendingPreview = getPendingSessionPreviewSnapshot();
  const pendingSelection = getPendingSessionProfileSelection();
  return (
    shouldShowSessionProfileHeaderControl() &&
    !pendingPreview &&
    meetingPresenceState === "prejoin" &&
    captureConsentState === "idle" &&
    !pendingSelection.locked
  );
}

function closeSessionProfileRail(): void {
  sessionProfileRailOpen = false;
  const control = document.getElementById("mc-header-profile-control");
  const trigger = document.getElementById("mc-header-profile-control-toggle");
  control?.classList.remove("is-open");
  trigger?.setAttribute("aria-expanded", "false");
  sessionProfileSelectHandle?.close();
  syncSessionProfileRailTooltip();
}

function syncSessionProfileRailTooltip(): void {
  const mount = document.getElementById("mc-header-profile-panel-mount");
  const trigger = mount?.querySelector<HTMLElement>(".mc-dropdown-trigger");
  const label = mount?.querySelector<HTMLElement>(".mc-dropdown-label");

  if (!trigger || !label) {
    return;
  }

  const text = label.textContent?.trim() || "";
  const shouldShowTooltip =
    sessionProfileRailOpen &&
    !!text &&
    label.scrollWidth > label.clientWidth + 1;

  if (shouldShowTooltip) {
    trigger.setAttribute("data-tooltip", text);
  } else {
    trigger.removeAttribute("data-tooltip");
  }
}

function syncSessionProfileRail(): void {
  const t = getUiRuntimeTranslator();
  const subtitleLabelEl = document.getElementById("mc-header-subtitle-label");
  const control = document.getElementById("mc-header-profile-control");
  const trigger = document.getElementById(
    "mc-header-profile-control-toggle"
  ) as HTMLButtonElement | null;
  const selectMount = document.getElementById("mc-header-profile-panel-mount");

  if (
    !subtitleLabelEl ||
    !control ||
    !trigger ||
    !selectMount
  ) {
    return;
  }

  const shouldRender = shouldShowSessionProfileHeaderControl();
  const canChange = canChangeSessionProfileHeaderControl();
  control.hidden = !shouldRender;
  syncSessionProfileRailSize();
  if (!shouldRender) {
    closeSessionProfileRail();
    selectMount.replaceChildren();
    sessionProfileSelectHandle = null;
    return;
  }

  ensurePendingSessionProfileSelection();
  const pendingSelection = getPendingSessionProfileSelection();
  const activeValue =
    pendingSelection.profileId ||
    settings.defaultMeetingProfileId ||
    settings.meetingProfiles[0]?.id ||
    "";

  if (!sessionProfileSelectHandle) {
    sessionProfileSelectHandle = createOverlayDropdownSelect({
      id: "mc-session-profile-select",
      value: activeValue,
      options: settings.meetingProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        description: profile.description,
        badgeLabel:
          profile.id === settings.defaultMeetingProfileId
            ? t("content.header.profileControl.defaultBadge")
            : undefined,
        badgeTone:
          profile.id === settings.defaultMeetingProfileId ? "accent" : undefined,
      })),
      className: "mc-header-profile-panel-select",
      triggerClassName: "mc-header-profile-panel-select-trigger",
      menuClassName: "mc-header-profile-panel-select-menu",
      optionClassName: "mc-header-profile-panel-select-option",
      disabled: !canChange,
      onChange: (value) => {
        setPendingSessionProfileSelection(value, { locked: false });
        syncHeaderCopy();
        syncOverlayFooter();
        window.requestAnimationFrame(syncSessionProfileRailTooltip);
      },
    });
    selectMount.replaceChildren(sessionProfileSelectHandle.element);
  } else {
    sessionProfileSelectHandle.setValue(activeValue);
  }
  sessionProfileSelectHandle.setDisabled(!canChange);
  sessionProfileSelectHandle.element.classList.toggle("is-readonly", !canChange);

  control.classList.toggle("is-open", sessionProfileRailOpen);
  trigger.setAttribute("aria-expanded", String(sessionProfileRailOpen));
  window.requestAnimationFrame(syncSessionProfileRailTooltip);
}

function getTranslationDockState(): TranslationDockState {
  const t = getUiRuntimeTranslator();
  const aiAvailability = getOpenAiServiceAvailability(settings);
  const languageName = getLanguageName(settings.targetLanguage);
  const overlayItems = getOverlayItems();
  const hasTranslationError = overlayItems.some(
    (caption) => caption.translationStatus === TranslationStatus.Error
  );
  const hasPendingTranslation = overlayItems.some((caption) =>
    PENDING_TRANSLATION_STATES.includes(caption.translationStatus)
  );
  const hasTranslatedCaptions = overlayItems.some((caption) => !!caption.translation);

  if (captureConsentState === "pending") {
    return {
      status: "consent",
      title: t("content.header.translationDock.consent.title"),
      body: t("content.header.translationDock.consent.body"),
      badge: t("content.header.translationDock.consent.badge"),
    };
  }

  if (captureConsentState === "approved") {
    return {
      status: "starting",
      title: t("content.header.translationDock.starting.title"),
      body: t("content.header.translationDock.starting.body"),
      badge: t("content.header.translationDock.starting.badge"),
    };
  }

  if (captureConsentState === "dismissed") {
    return {
      status: "dismissed",
      title: t("content.header.translationDock.dismissed.title"),
      body: t("content.header.translationDock.dismissed.body"),
      badge: t("content.header.translationDock.dismissed.badge"),
    };
  }

  if (!aiAvailability.operational) {
    return {
      status: "unavailable",
      title:
        aiAvailability.state === "setup"
          ? t("content.header.translationDock.setup.title")
          : t("content.header.translationDock.unavailable.title"),
      body:
        aiAvailability.state === "setup"
          ? t("content.header.translationDock.setup.body")
          : t("content.header.translationDock.unavailable.body"),
      badge:
        aiAvailability.state === "setup"
          ? t("content.header.translationDock.setup.badge")
          : t("content.header.translationDock.unavailable.badge"),
    };
  }

  if (!settings.translationEnabled) {
    return {
      status: "off",
      title: t("content.header.translationDock.off.title"),
      body: t("content.header.translationDock.off.body", {
        language: languageName,
      }),
      badge: t("content.header.translationDock.off.badge"),
    };
  }

  if (hasTranslationError) {
    return {
      status: "error",
      title: t("content.header.translationDock.error.title"),
      body: t("content.header.translationDock.error.body"),
      badge: t("content.header.translationDock.error.badge"),
    };
  }

  if (hasPendingTranslation) {
    return {
      status: "translating",
      title: t("content.header.translationDock.translating.title", {
        language: languageName,
      }),
      body: t("content.header.translationDock.translating.body"),
      badge: t("content.header.translationDock.translating.badge"),
    };
  }

  if (hasTranslatedCaptions) {
    return {
      status: "live",
      title: t("content.header.translationDock.live.title"),
      body: t("content.header.translationDock.live.body", {
        language: languageName,
      }),
      badge: languageName,
    };
  }

  if (isCCEnabled) {
    return {
      status: "ready",
      title: t("content.header.translationDock.ready.title"),
      body: t("content.header.translationDock.ready.body", {
        language: languageName,
      }),
      badge: t("content.header.translationDock.ready.badge"),
    };
  }

  return {
    status: "waiting",
    title: t("content.header.translationDock.waiting.title"),
    body: t("content.header.translationDock.waiting.body"),
    badge: t("content.header.translationDock.waiting.badge"),
  };
}

export function syncHeaderCopy(): void {
  const titleEl = document.getElementById("mc-header-title");
  const subtitleEl = document.getElementById("mc-header-subtitle-label");

  if (!titleEl || !subtitleEl) {
    void overlayHeaderDiagnostics.trace("overlay_header_copy_sync_skipped_missing_nodes");
    return;
  }

  const copy = getHeaderCopy();
  titleEl.textContent = copy.title;
  subtitleEl.textContent = copy.subtitle;
  void overlayHeaderDiagnostics.trace("overlay_header_copy_synced", {
    title: copy.title,
    subtitle: copy.subtitle,
  });
  syncSessionProfileRail();
}

export function syncCompactStatus(): void {
  const t = getUiRuntimeTranslator();
  const titleEl = document.getElementById("mc-minimized-status-title");
  const detailEl = document.getElementById("mc-minimized-status-detail");
  const issueEl = document.getElementById("mc-minimized-ai-warning");

  if (!titleEl || !detailEl) {
    void overlayHeaderDiagnostics.trace("overlay_header_compact_status_skipped_missing_nodes");
    return;
  }

  const copy = getCompactStatusCopy();
  const aiAvailability = getOpenAiServiceAvailability(settings);
  titleEl.textContent = copy.title;
  detailEl.textContent = copy.detail;
  void overlayHeaderDiagnostics.trace("overlay_header_compact_status_synced", {
    title: copy.title,
    detail: copy.detail,
  });

  if (issueEl instanceof HTMLElement) {
    const showIssue = !aiAvailability.operational;
    issueEl.hidden = !showIssue;
    issueEl.style.display = showIssue ? "" : "none";
    issueEl.setAttribute(
      "data-tooltip",
      aiAvailability.state === "setup"
        ? t("content.header.tooltips.compactAiSetup")
        : t("content.header.tooltips.compactAiIssue", {
            message: aiAvailability.message,
          })
    );
  }
}

export function applyCompactOverlayState(overlayEl: HTMLElement): void {
  if (!savedPosition) {
    const rect = overlayEl.getBoundingClientRect();
    setSavedPosition({
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }

  overlayEl.style.width = `${COMPACT_OVERLAY_WIDTH}px`;
  overlayEl.style.height = `${COMPACT_OVERLAY_HEIGHT}px`;
  overlayEl.style.minWidth = "0px";
  overlayEl.style.minHeight = "0px";
  overlayEl.style.right = "auto";
  overlayEl.style.bottom = "auto";
  overlayEl.classList.remove("mc-transitioning", "mc-collapsing", "mc-expanding");
  overlayEl.classList.add("minimized");
  setMinimized(true);
  syncCompactStatus();
  syncTranslationDock();
}

export function syncTranslationDock(): void {
  const t = getUiRuntimeTranslator();
  const dock = document.getElementById("mc-translation-dock");
  const eyebrowEl = document.getElementById("mc-translation-dock-eyebrow");
  const titleEl = document.getElementById("mc-translation-dock-title");
  const bodyEl = document.getElementById("mc-translation-dock-body");
  const badgeEl = document.getElementById("mc-translation-dock-badge");
  const langSelect = document.getElementById("mc-lang-select");
  const translateToggle = document.getElementById("mc-translate-toggle");

  const state = getTranslationDockState();

  void overlayHeaderDiagnostics.trace("overlay_header_translation_dock_synced", {
    status: state.status,
    translationEnabled: settings.translationEnabled,
    targetLanguage: settings.targetLanguage,
  });

  if (dock) {
    dock.dataset.enabled = String(settings.translationEnabled);
    dock.dataset.configured = String(isTranslationConfigured());
    dock.dataset.status = state.status;
    dock.dataset.unavailable = String(!getOpenAiServiceAvailability(settings).operational);
  }

  if (eyebrowEl) {
    eyebrowEl.textContent = t("content.header.translationDock.eyebrow");
  }

  if (titleEl) {
    titleEl.textContent = state.title;
  }

  if (bodyEl) {
    bodyEl.textContent = state.body;
  }

  if (badgeEl) {
    badgeEl.textContent = state.badge;
  }

  if (langSelect) {
    langSelect.setAttribute("data-value", settings.targetLanguage);
    langSelect.classList.remove("is-open");
    langSelect
      .querySelector(".mc-dropdown-trigger")
      ?.setAttribute("aria-expanded", "false");

    const label = langSelect.querySelector(".mc-dropdown-label");
    if (label) {
      label.textContent = getLanguageName(settings.targetLanguage);
    }

    const options = langSelect.querySelectorAll(".mc-dropdown-option");
    options.forEach((option) => {
      option.classList.toggle(
        "is-selected",
        option.getAttribute("data-value") === settings.targetLanguage
      );
      option.setAttribute(
        "aria-selected",
        String(option.getAttribute("data-value") === settings.targetLanguage)
      );
    });
  }

  if (translateToggle) {
    const aiAvailability = getOpenAiServiceAvailability(settings);
    const toggleLabel = translateToggle.querySelector<HTMLElement>(
      ".mc-toggle-label"
    );

    if (toggleLabel) {
      toggleLabel.textContent = t("content.header.translationToggle.label");
    }

    translateToggle.classList.toggle("mc-active", settings.translationEnabled);
    translateToggle.setAttribute("aria-pressed", String(settings.translationEnabled));
    (translateToggle as HTMLButtonElement).disabled = !aiAvailability.operational;
    translateToggle.setAttribute(
      "data-tooltip",
      aiAvailability.operational
        ? settings.translationEnabled
          ? t("content.header.tooltips.translationOff")
          : t("content.header.tooltips.translationOn")
        : aiAvailability.state === "setup"
          ? t("content.header.tooltips.translationSetup")
          : t("content.header.tooltips.translationUnavailable")
    );
  }
}

function createLanguageSelect(): HTMLElement {
  const sortedLanguages = [...LANGUAGES].sort((left, right) =>
    left.name.localeCompare(right.name, "en", { sensitivity: "base" })
  );

  const selectLanguage = async (targetLanguage: string) => {
    const previousLanguage = settings.targetLanguage;

    if (targetLanguage === previousLanguage) {
      await overlayHeaderDiagnostics.trace("overlay_header_language_change_skipped_same_value", {
        targetLanguage,
      });
      return;
    }

    await overlayHeaderDiagnostics.info("overlay_header_language_change_started", {
      previousLanguage,
      targetLanguage,
    });
    await saveOverlaySettings({ targetLanguage });

    if (settings.translationEnabled && isTranslationConfigured()) {
      void translateAllExistingCaptions({
        force: true,
        includeTranslated: true,
        resetExisting: true,
        overridePending: true,
      });
    }

    await overlayHeaderDiagnostics.info("overlay_header_language_change_completed", {
      previousLanguage,
      targetLanguage,
      translationEnabled: settings.translationEnabled,
    });
  };

  return createOverlayDropdownSelect({
    id: "mc-lang-select",
    value: settings.targetLanguage,
    options: sortedLanguages.map((language) => ({
      id: language.code,
      name: language.name,
    })),
    className: "mc-lang-select",
    onChange: (value) => selectLanguage(value),
  }).element;
}

function createTranslationToggle(): HTMLButtonElement {
  const t = getUiRuntimeTranslator();
  const toggleSwitch = createElement("div", { className: "mc-toggle-switch" });
  const toggleLabel = createElement("span", {
    className: "mc-toggle-label",
    textContent: t("content.header.translationToggle.label"),
  });

  return createElement(
    "button",
    {
      id: "mc-translate-toggle",
      className: "mc-toggle" + (settings.translationEnabled ? " mc-active" : ""),
      type: "button",
      "aria-pressed": String(settings.translationEnabled),
      onClick: async () => {
        if (!settings.translationEnabled && !isTranslationConfigured()) {
          openTranslationSettings();
          return;
        }

        const newEnabled = !settings.translationEnabled;
        await saveOverlaySettings({ translationEnabled: newEnabled });

        if (newEnabled) {
          void translateAllExistingCaptions();
        }
      },
    },
    [toggleLabel, toggleSwitch]
  ) as HTMLButtonElement;
}

export function createHeader(): {
  header: HTMLElement;
  translationDock: HTMLElement;
} {
  const t = getUiRuntimeTranslator();
  const initialTranslationState = getTranslationDockState();

  const settingsBtn = createElement(
    "button",
    {
      className: "mc-btn mc-btn-settings",
      onClick: () => {
        void overlayHeaderDiagnostics.debug("overlay_header_open_options_requested");
        const runtime = getExtensionRuntime();
        if (!runtime) {
          void overlayHeaderDiagnostics.warn("overlay_header_open_options_skipped_missing_runtime");
          return;
        }

        void runtime.sendMessage({ action: "openOptions" }).catch(() => {
          void overlayHeaderDiagnostics.warn("overlay_header_open_options_failed");
          // Ignore context invalidation during extension reloads.
        });
      },
    },
    [createContentIcon("settings", { className: "mc-icon" }) as unknown as HTMLElement]
  );

  const captureHelpBtn = createElement(
    "button",
    {
      id: "mc-capture-guide-toggle",
      className: `mc-btn mc-btn-capture-help${isCaptureGuideOpen ? " mc-active" : ""}`,
      "data-tooltip": t("content.header.tooltips.captureHelp"),
      "aria-label": t("content.header.tooltips.captureHelp"),
      "aria-pressed": String(isCaptureGuideOpen),
      onClick: () => {
        if (isCaptureGuideOpen) {
          void overlayHeaderDiagnostics.debug("overlay_header_capture_guide_close_requested");
          closeCaptureGuide();
          return;
        }

        void overlayHeaderDiagnostics.debug("overlay_header_capture_guide_open_requested");
        openCaptureGuide();
      },
    },
    [createContentIcon("info", { className: "mc-icon" }) as unknown as HTMLElement]
  );

  const compactBtn = createElement(
    "button",
    {
      className: "mc-btn mc-btn-compact-toggle",
      "aria-label": t("content.header.tooltips.switchToCompactView"),
      onClick: async () => {
        const overlayEl = overlay;
        if (!overlayEl || isOverlayTransitioning || isMinimized) {
          await overlayHeaderDiagnostics.trace("overlay_header_minimize_skipped", {
            hasOverlay: Boolean(overlayEl),
            isOverlayTransitioning,
            isMinimized,
          });
          return;
        }

        await overlayHeaderDiagnostics.info("overlay_header_minimize_started", {
          width: overlayEl.getBoundingClientRect().width,
          height: overlayEl.getBoundingClientRect().height,
        });

        sessionProfileSelectHandle?.close();
        isOverlayTransitioning = true;
        const rect = overlayEl.getBoundingClientRect();

        setSavedPosition({
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });

        overlayEl.style.left = `${rect.left}px`;
        overlayEl.style.top = `${rect.top}px`;
        overlayEl.style.width = `${rect.width}px`;
        overlayEl.style.height = `${rect.height}px`;
        overlayEl.style.minWidth = "0px";
        overlayEl.style.minHeight = "0px";
        overlayEl.style.right = "auto";
        overlayEl.style.bottom = "auto";
        overlayEl.classList.add("mc-transitioning", "mc-collapsing");

        requestAnimationFrame(() => {
          overlayEl.style.height = `${COMPACT_OVERLAY_HEIGHT}px`;
        });

        await waitForOverlayStage(overlayEl, "height");

        overlayEl.classList.add("minimized");
        requestAnimationFrame(() => {
          overlayEl.style.width = `${COMPACT_OVERLAY_WIDTH}px`;
        });

        await waitForOverlayStage(overlayEl, "width");

        overlayEl.classList.remove("mc-collapsing", "mc-transitioning");
        setMinimized(true);
        persistOverlayPosition(overlayEl, { view: "minimized" });
        isOverlayTransitioning = false;
        await overlayHeaderDiagnostics.info("overlay_header_minimize_completed", {
          width: overlayEl.getBoundingClientRect().width,
          height: overlayEl.getBoundingClientRect().height,
        });
      },
    },
    [createContentIcon("collapse", { className: "mc-icon" }) as unknown as HTMLElement]
  ) as HTMLButtonElement;

  const headerBrandMark = createBrandMark("mc-brand-mark mc-brand-mark--header");

  const headerLeft = createElement("div", { className: "mc-header-left" }, [
    headerBrandMark,
      createElement("div", { className: "mc-header-copy" }, [
        createElement("span", {
          id: "mc-header-title",
          className: "mc-title",
        }),
        createElement("div", { className: "mc-header-meta" }, [
        createElement("span", {
          id: "mc-header-subtitle-label",
          className: "mc-header-subtitle",
        }),
        ]),
      ]),
  ]);

  const profileRail = createElement(
    "div",
    {
      id: "mc-header-profile-control",
      className: "mc-header-profile-control",
      hidden: true,
    },
    [
      createElement(
        "button",
        {
          id: "mc-header-profile-control-toggle",
          className: "mc-header-profile-control-toggle",
          type: "button",
          "aria-label": t("content.header.tooltips.openProfilePicker"),
          "aria-expanded": "false",
          onClick: () => {
            if (!shouldShowSessionProfileHeaderControl()) {
              return;
            }

            sessionProfileRailOpen = !sessionProfileRailOpen;
            profileRail.classList.toggle("is-open", sessionProfileRailOpen);
            const trigger = document.getElementById(
              "mc-header-profile-control-toggle"
            );
            trigger?.setAttribute("aria-expanded", String(sessionProfileRailOpen));
            if (!sessionProfileRailOpen) {
              sessionProfileSelectHandle?.close();
            }
            window.requestAnimationFrame(syncSessionProfileRailTooltip);
          },
        },
        [
          createContentIcon("chevron-down", {
            className: "mc-icon",
            size: 14,
            strokeWidth: 2.1,
          }) as unknown as HTMLElement,
        ]
      ),
      createElement("span", {
        className: "mc-header-profile-control-divider mc-header-profile-control-divider--primary",
      }),
      createElement("div", {
        id: "mc-header-profile-panel-mount",
        className: "mc-header-profile-panel-mount",
      }),
      createElement("span", {
        className: "mc-header-profile-control-divider mc-header-profile-control-divider--secondary",
      }),
      createElement("span", { className: "mc-header-profile-control-mark" }, [
        createContentIcon("sparkles", {
          className: "mc-icon",
          size: 16,
          strokeWidth: 1.9,
        }) as unknown as HTMLElement,
      ]),
    ]
  );

  const headerRight = createElement("div", { className: "mc-header-right" }, [
    profileRail,
    captureHelpBtn,
    settingsBtn,
    compactBtn,
  ]);

  const waveIndicator = createElement("div", { className: "mc-wave" }, [
    createElement("div", { className: "mc-wave-bar" }),
    createElement("div", { className: "mc-wave-bar" }),
    createElement("div", { className: "mc-wave-bar" }),
  ]);
  setWaveElement(waveIndicator);

  const expandBtn = createElement("button", {
    className: "mc-btn mc-btn-expand mc-btn-expand-toggle",
    "aria-label": t("content.header.tooltips.expandOverlay"),
    onClick: async () => {
      const overlayEl = overlay;
      if (!overlayEl || isOverlayTransitioning || !isMinimized) {
        await overlayHeaderDiagnostics.trace("overlay_header_expand_skipped", {
          hasOverlay: Boolean(overlayEl),
          isOverlayTransitioning,
          isMinimized,
        });
        return;
      }

      await overlayHeaderDiagnostics.info("overlay_header_expand_started", {
        width: overlayEl.getBoundingClientRect().width,
        height: overlayEl.getBoundingClientRect().height,
      });

      sessionProfileSelectHandle?.close();
      isOverlayTransitioning = true;
      const rect = overlayEl.getBoundingClientRect();
      const targetWidth = Number.parseFloat(savedPosition?.width || "") || 520;
      const targetHeight = Number.parseFloat(savedPosition?.height || "") || 545;
      const nextPosition = clampOverlayPosition(
        rect.left,
        rect.top,
        targetWidth,
        targetHeight
      );

      overlayEl.style.left = `${rect.left}px`;
      overlayEl.style.top = `${rect.top}px`;
      overlayEl.style.width = `${rect.width}px`;
      overlayEl.style.height = `${rect.height}px`;
      overlayEl.style.minWidth = "0px";
      overlayEl.style.minHeight = "0px";
      overlayEl.style.right = "auto";
      overlayEl.style.bottom = "auto";
      overlayEl.classList.add("mc-transitioning", "mc-expanding");
      overlayEl.classList.remove("minimized");

      requestAnimationFrame(() => {
        overlayEl.style.left = `${nextPosition.left}px`;
        overlayEl.style.width = `${targetWidth}px`;
      });

      await waitForOverlayStage(overlayEl, "width");

      requestAnimationFrame(() => {
        overlayEl.style.top = `${nextPosition.top}px`;
        overlayEl.style.height = `${targetHeight}px`;
      });

      await waitForOverlayStage(overlayEl, "height");

      overlayEl.classList.remove("mc-expanding", "mc-transitioning");
      overlayEl.style.minWidth = "";
      overlayEl.style.minHeight = "";
      setSavedPosition(null);
      setMinimized(false);
      persistOverlayPosition(overlayEl, { view: "expanded" });
      syncHeaderCopy();
      syncCompactStatus();
      syncTranslationDock();
      isOverlayTransitioning = false;
      await overlayHeaderDiagnostics.info("overlay_header_expand_completed", {
        width: overlayEl.getBoundingClientRect().width,
        height: overlayEl.getBoundingClientRect().height,
      });
    },
  });
  expandBtn.appendChild(
    createContentIcon("expand", {
      className: "mc-icon mc-btn-expand-glyph",
      size: 16,
    })
  );

  const minimizedStatus = createElement(
    "div",
    { className: "mc-minimized-status" },
    [
      createElement("div", {
        id: "mc-minimized-status-title",
        className: "mc-minimized-status-title",
      }),
      createElement("div", {
        id: "mc-minimized-status-detail",
        className: "mc-minimized-status-detail",
      }),
    ]
  );

  const minimizedControls = createElement(
    "div",
    { className: "mc-minimized-controls" },
    [
      createElement("div", { className: "mc-minimized-leading" }, [
        createBrandMark("mc-brand-mark mc-brand-mark--compact"),
        waveIndicator,
      ]),
      minimizedStatus,
      createElement(
        "span",
        {
          id: "mc-minimized-ai-warning",
          className: "mc-minimized-ai-warning",
          tabindex: "0",
          hidden: true,
        },
        [
          createContentIcon("info", {
            className: "mc-icon mc-minimized-ai-warning-icon",
            size: 11,
            strokeWidth: 2,
          }) as unknown as HTMLElement,
        ]
      ),
      expandBtn,
    ]
  );

  const header = createElement("div", { className: "mc-header" }, [
    headerLeft,
    headerRight,
    minimizedControls,
  ]);

  const translationDock = createElement(
    "div",
    {
      id: "mc-translation-dock",
      className: "mc-translation-dock",
    },
    [
      createElement("div", { className: "mc-translation-dock-copy" }, [
        createElement("div", { className: "mc-translation-dock-mark" }, [
          createContentIcon("sparkles", {
            className: "mc-icon",
            size: 14,
          }) as unknown as HTMLElement,
        ]),
        createElement("div", { className: "mc-translation-dock-text" }, [
          createElement("div", {
            id: "mc-translation-dock-eyebrow",
            className: "mc-translation-dock-eyebrow",
            textContent: t("content.header.translationDock.eyebrow"),
          }),
          createElement("div", { className: "mc-translation-dock-headline" }, [
            createElement("div", {
              id: "mc-translation-dock-title",
              className: "mc-translation-dock-title",
              textContent: initialTranslationState.title,
            }),
            createElement("div", {
              id: "mc-translation-dock-badge",
              className: "mc-translation-dock-badge",
              textContent: initialTranslationState.badge,
            }),
          ]),
          createElement("div", {
            id: "mc-translation-dock-body",
            className: "mc-translation-dock-body",
            textContent: initialTranslationState.body,
          }),
        ]),
      ]),
      createElement("div", { className: "mc-translation-dock-controls" }, [
        createElement("div", { className: "mc-translation-dock-actions" }, [
          createLanguageSelect(),
          createTranslationToggle(),
        ]),
      ]),
    ]
  );

  syncHeaderCopy();
  syncCompactStatus();
  syncTranslationDock();
  syncSessionProfileRail();

  return {
    header,
    translationDock,
  };
}
