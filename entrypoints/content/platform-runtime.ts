import { DEFAULT_CUSTOM_PROMPT } from "./constants";
import {
  createOverlay,
  destroyOverlay,
  hideOverlay,
  showOverlay,
  updateUIFromSettings,
} from "./overlay";
import {
  initMeetingSession,
  getCurrentSessionSnapshot,
  getPendingSessionPreviewSnapshot,
  getPendingSessionProfileSelection,
  normalizePendingSessionProfileSelection,
  ensurePendingSessionProfileSelection,
  setPendingSessionProfileSelection,
  setPendingSessionMetadata,
  loadStoredSessionPreview,
  resetMeetingSession,
  updateSessionEndTime,
} from "./history-service";
import {
  getProviderByPlatform,
  getProviderForPageContext,
  getProviderForUrl,
} from "./providers/registry";
import { resetMicrosoftTeamsProviderState } from "./providers/microsoft-teams";
import {
  isTranslationConfigured,
  resetTranslationState,
  translateAllExistingCaptions,
} from "./translation";
import {
  renderCaptions,
  scrollOverlayToBottom,
  SESSION_ENDED_CLOSE_REQUEST_EVENT,
} from "./render";
import {
  resetContentDebugState,
  updateContentDebugState,
} from "./debug-state";
import {
  captions,
  liveChatMessages,
  meetingPresenceState,
  overlay,
  resetContentState,
  resetLiveCaptureState,
  settings,
  setCCEnabled,
  setCaptionActivationState,
  setCaptureConsentState,
  setCaptureGuide,
  setEmptyStateMessage,
  setActiveMeetingPlatform,
  setMeetingPresenceState,
  updateSettings,
} from "./state";
import { openCaptureGuide } from "./overlay/capture-guide";
import { closeCaptureGuide } from "./overlay/capture-guide";
import {
  startAssistantSync,
  stopAssistantSync,
  syncAssistantAvailabilityFromSettingsOnly,
} from "./assistant-service";
import {
  forceResolveActivePrompt,
  requestCaptureConsent,
  requestSessionEndedDecision,
  requestSessionContinuationDecision,
} from "./overlay/capture-consent";
import { buildMeetingSessionFingerprint } from "../shared/meeting-session";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import { hasAcceptedCurrentTerms } from "../shared/legal";
import type { QuickAccessRuntimeStatus } from "../shared/quick-access-status";
import type {
  FindMeetingSessionContinuationCandidateResponse,
  ResolveMeetingSessionRequest,
} from "../background/types";
import type { MeetingPresenceState, MeetingProvider } from "./providers/types";

let runtimeInitialized = false;
let stopObservingCurrentProvider: (() => void) | null = null;
let activeProviderPlatform: MeetingProvider["platform"] | null = null;
let lifecycleMonitorId: number | null = null;
let presenceMonitorId: number | null = null;
let stopSettingsSync: (() => void) | null = null;
let captureApprovedForLifecycle = false;
let captureBlockedForLifecycle = false;
let hasActiveMeetingSession = false;
let lifecycleSyncInProgress = false;
let lifecycleSyncRequested = false;
let lastObservedPresenceState: MeetingPresenceState = "unknown";
let lastObservedPresenceCount = 0;
let sessionEndDecisionPending = false;
let endedSessionReviewPinned = false;
let sessionContinuationDecisionPending = false;
let pendingSessionResolveOptions:
  | Pick<ResolveMeetingSessionRequest, "reusePolicy" | "resumeSessionId">
  | undefined;
let recentlyEndedSession:
  | {
      sessionId: string;
      endedAt: number;
    }
  | null = null;
let suppressEndedOverlayAutoShow = false;
let resetPageObservedAt: number | null = null;
let preparedMeetingFingerprint: string | null = null;

const SETTINGS_STORAGE_KEYS = new Set(["settings", "settingsState"]);
const LIFECYCLE_MONITOR_INTERVAL_MS = 1500;
const PRESENCE_MONITOR_INTERVAL_MS = 1000;
const PRESENCE_CONFIRMATION_TICKS = 2;
const CONTINUATION_LOOKUP_RETRY_DELAY_MS = 500;
const CONTINUATION_LOOKUP_MAX_WAIT_MS = 2500;
const RESET_PAGE_CONFIRMATION_MS = PRESENCE_CONFIRMATION_TICKS * PRESENCE_MONITOR_INTERVAL_MS;
const AUTO_CAPTION_ENABLE_TIMEOUT_MS = 5000;
const runtimeDiagnosticsLogger = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "platform-runtime",
});

function updateRuntimeDebugState(patch: Record<string, unknown>): void {
  updateContentDebugState(patch);
}

function resetRuntimeDebugState(): void {
  resetContentDebugState();
}

function recordLifecycleDebug(
  stage: string,
  details: Record<string, unknown> = {}
): void {
  void runtimeDiagnosticsLogger.debug(stage, {
    meetingPresenceState,
    hasActiveMeetingSession,
    captureApprovedForLifecycle,
    captureBlockedForLifecycle,
    sessionEndDecisionPending,
    sessionContinuationDecisionPending,
    endedSessionReviewPinned,
    preparedMeetingFingerprint,
    pendingSessionResolveOptions,
    recentlyEndedSession,
    ...details,
  });

  updateRuntimeDebugState({
    lifecycleDebug: {
      timestamp: new Date().toISOString(),
      stage,
      meetingPresenceState,
      hasActiveMeetingSession,
      captureApprovedForLifecycle,
      captureBlockedForLifecycle,
      sessionEndDecisionPending,
      sessionContinuationDecisionPending,
      endedSessionReviewPinned,
      preparedMeetingFingerprint,
      pendingSessionResolveOptions,
      recentlyEndedSession,
      ...details,
    },
  });
}

function getSessionContinuationWindowMs(): number {
  return settings.sessionContinuationWindowMinutes * 60 * 1000;
}

function publishQuickAccessRuntimeStatus(): void {
  if (!chrome?.runtime?.sendMessage) {
    return;
  }

  const status: QuickAccessRuntimeStatus = {
    platform: activeProviderPlatform,
    meetingPresence: meetingPresenceState,
    hasActiveMeetingSession,
    updatedAt: Date.now(),
  };

  void chrome.runtime
    .sendMessage({
      action: "updateQuickAccessRuntimeStatus",
      status,
    })
    .catch(() => {
      // Ignore context invalidation during extension reloads.
    });
}

function clearQuickAccessRuntimeStatus(): void {
  if (!chrome?.runtime?.sendMessage) {
    return;
  }

  void chrome.runtime
    .sendMessage({
      action: "clearQuickAccessRuntimeStatus",
    })
    .catch(() => {
      // Ignore context invalidation during extension reloads.
    });
}

function syncContinuationWindowState(): void {
  const continuationWindowMs = getSessionContinuationWindowMs();
  if (!recentlyEndedSession) {
    return;
  }

  if (
    continuationWindowMs > 0 &&
    Date.now() - recentlyEndedSession.endedAt <= continuationWindowMs
  ) {
    return;
  }

  recentlyEndedSession = null;
  pendingSessionResolveOptions = undefined;
  forceResolveActivePrompt("session-continuation", "restart");

  if (!hasActiveMeetingSession && meetingPresenceState === "ended") {
    setMeetingPresenceState("unknown");
    renderCaptions(true);
  }

  requestLifecycleSync();
}

function shouldResetRuntimeOnCurrentPage(
  provider: MeetingProvider,
  currentUrl: URL
): boolean {
  if (
    provider.platform === "google-meet" &&
    provider.matchesUrl(currentUrl) &&
    !(provider.matchesPageContext?.(currentUrl) ?? false)
  ) {
    return true;
  }

  if (
    provider.platform === "microsoft-teams" &&
    /\/v2\/?$/i.test(currentUrl.pathname) &&
    !(provider.matchesPageContext?.(currentUrl) ?? false)
  ) {
    return true;
  }

  return false;
}

export const platformRuntimeInternals = {
  shouldResetRuntimeOnCurrentPage,
  observeResetPageState,
  syncPresenceState,
  resolveSessionStartOptions,
  shouldRetryContinuationLookup,
  getPersistedContinuationCandidateWithRetry,
  startMeetingCapture,
  stopMeetingCapture,
  handleSessionContinuationDecision,
  prepareMeetingStartupDecision,
  syncMeetingLifecycle,
  startLifecycleMonitor,
  teardownPlatformRuntime,
  getRuntimeStateForTests,
  setRuntimeStateForTests,
};

function getRuntimeStateForTests(): {
  runtimeInitialized: boolean;
  activeProviderPlatform: MeetingProvider["platform"] | null;
  captureApprovedForLifecycle: boolean;
  captureBlockedForLifecycle: boolean;
  hasActiveMeetingSession: boolean;
  meetingPresenceState: MeetingPresenceState;
  lastObservedPresenceState: MeetingPresenceState;
  lastObservedPresenceCount: number;
  lifecycleSyncInProgress: boolean;
  lifecycleSyncRequested: boolean;
  sessionEndDecisionPending: boolean;
  endedSessionReviewPinned: boolean;
  sessionContinuationDecisionPending: boolean;
  pendingSessionResolveOptions:
    | Pick<ResolveMeetingSessionRequest, "reusePolicy" | "resumeSessionId">
    | undefined;
  recentlyEndedSession:
    | {
        sessionId: string;
        endedAt: number;
      }
    | null;
  suppressEndedOverlayAutoShow: boolean;
  resetPageObservedAt: number | null;
  preparedMeetingFingerprint: string | null;
} {
  return {
    runtimeInitialized,
    activeProviderPlatform,
    captureApprovedForLifecycle,
    captureBlockedForLifecycle,
    hasActiveMeetingSession,
    meetingPresenceState,
    lastObservedPresenceState,
    lastObservedPresenceCount,
    lifecycleSyncInProgress,
    lifecycleSyncRequested,
    sessionEndDecisionPending,
    endedSessionReviewPinned,
    sessionContinuationDecisionPending,
    pendingSessionResolveOptions,
    recentlyEndedSession,
    suppressEndedOverlayAutoShow,
    resetPageObservedAt,
    preparedMeetingFingerprint,
  };
}

function setRuntimeStateForTests(
  patch: Partial<ReturnType<typeof getRuntimeStateForTests>> & {
    stopObservingCurrentProvider?: (() => void) | null;
    stopSettingsSync?: (() => void) | null;
  }
): void {
  if (patch.runtimeInitialized !== undefined) {
    runtimeInitialized = patch.runtimeInitialized;
  }
  if (patch.activeProviderPlatform !== undefined) {
    activeProviderPlatform = patch.activeProviderPlatform;
  }
  if (patch.captureApprovedForLifecycle !== undefined) {
    captureApprovedForLifecycle = patch.captureApprovedForLifecycle;
  }
  if (patch.captureBlockedForLifecycle !== undefined) {
    captureBlockedForLifecycle = patch.captureBlockedForLifecycle;
  }
  if (patch.hasActiveMeetingSession !== undefined) {
    hasActiveMeetingSession = patch.hasActiveMeetingSession;
  }
  if (patch.meetingPresenceState !== undefined) {
    setMeetingPresenceState(patch.meetingPresenceState);
  }
  if (patch.lastObservedPresenceState !== undefined) {
    lastObservedPresenceState = patch.lastObservedPresenceState;
  }
  if (patch.lastObservedPresenceCount !== undefined) {
    lastObservedPresenceCount = patch.lastObservedPresenceCount;
  }
  if (patch.lifecycleSyncInProgress !== undefined) {
    lifecycleSyncInProgress = patch.lifecycleSyncInProgress;
  }
  if (patch.lifecycleSyncRequested !== undefined) {
    lifecycleSyncRequested = patch.lifecycleSyncRequested;
  }
  if (patch.sessionEndDecisionPending !== undefined) {
    sessionEndDecisionPending = patch.sessionEndDecisionPending;
  }
  if (patch.endedSessionReviewPinned !== undefined) {
    endedSessionReviewPinned = patch.endedSessionReviewPinned;
  }
  if (patch.sessionContinuationDecisionPending !== undefined) {
    sessionContinuationDecisionPending = patch.sessionContinuationDecisionPending;
  }
  if ("pendingSessionResolveOptions" in patch) {
    pendingSessionResolveOptions = patch.pendingSessionResolveOptions;
  }
  if (patch.recentlyEndedSession !== undefined) {
    recentlyEndedSession = patch.recentlyEndedSession;
  }
  if (patch.suppressEndedOverlayAutoShow !== undefined) {
    suppressEndedOverlayAutoShow = patch.suppressEndedOverlayAutoShow;
  }
  if (patch.resetPageObservedAt !== undefined) {
    resetPageObservedAt = patch.resetPageObservedAt;
  }
  if (patch.preparedMeetingFingerprint !== undefined) {
    preparedMeetingFingerprint = patch.preparedMeetingFingerprint;
  }
  if ("stopObservingCurrentProvider" in patch) {
    stopObservingCurrentProvider = patch.stopObservingCurrentProvider;
  }
  if ("stopSettingsSync" in patch) {
    stopSettingsSync = patch.stopSettingsSync;
  }
}

function observeResetPageState(
  provider: MeetingProvider,
  currentUrl: URL
): "none" | "pending" | "confirmed" {
  if (!shouldResetRuntimeOnCurrentPage(provider, currentUrl)) {
    resetPageObservedAt = null;
    return "none";
  }

  const now = Date.now();
  if (resetPageObservedAt === null) {
    resetPageObservedAt = now;
    return "pending";
  }

  return now - resetPageObservedAt >= RESET_PAGE_CONFIRMATION_MS
    ? "confirmed"
    : "pending";
}

function shouldKeepRuntimeForEndedSessionOnResetPage(): boolean {
  return (
    hasActiveMeetingSession ||
    sessionEndDecisionPending ||
    Boolean(recentlyEndedSession && !suppressEndedOverlayAutoShow)
  );
}

function getProviderSessionFingerprint(provider: MeetingProvider): string {
  const metadata = provider.getSessionMetadata();
  return buildMeetingSessionFingerprint({
    platform: metadata.platform,
    meetingUrl: metadata.sourceUrl,
    identifiers: metadata.identifiers,
    title: metadata.title,
  });
}

function isDirectCallSessionMetadata(
  metadata: ReturnType<MeetingProvider["getSessionMetadata"]>
): boolean {
  return (
    metadata.platform === "microsoft-teams" &&
    metadata.identifiers.callType === "direct-call"
  );
}

async function prepareMeetingStartupDecision(
  provider: MeetingProvider
): Promise<void> {
  recordLifecycleDebug("startup-decision-begin", {
    provider: provider.platform,
    captureStartupBehavior: settings.captureStartupBehavior,
  });
  if (settings.captureStartupBehavior === "off") {
    recordLifecycleDebug("startup-decision-skipped-config-off", {
      provider: provider.platform,
    });
    return;
  }

  const meetingFingerprint = getProviderSessionFingerprint(provider);
  if (
    preparedMeetingFingerprint === meetingFingerprint ||
    sessionEndDecisionPending ||
    sessionContinuationDecisionPending
  ) {
    recordLifecycleDebug("startup-decision-skipped-existing-state", {
      provider: provider.platform,
      meetingFingerprint,
    });
    return;
  }

  const metadata = provider.getSessionMetadata();
  setPendingSessionMetadata(metadata);
  normalizePendingSessionProfileSelection();
  ensurePendingSessionProfileSelection();
  const initialPendingProfileId = getPendingSessionProfileSelection().profileId;
  const allowsContinuation = !isDirectCallSessionMetadata(metadata);
  setPendingSessionProfileSelection(initialPendingProfileId, {
    locked: allowsContinuation,
  });

  const persistedContinuationCandidate =
    !allowsContinuation
      ? null
      : await getPersistedContinuationCandidateWithRetry(provider);

  if (persistedContinuationCandidate) {
    setPendingSessionProfileSelection(initialPendingProfileId, { locked: true });
    const decision = await requestSessionContinuationDecision(
      persistedContinuationCandidate.providerLabel
    );
    updateRuntimeDebugState({
      startupPrompt: {
        type: "session-continuation",
        decision,
        candidate: persistedContinuationCandidate,
      },
    });
    if (decision === "resume") {
      await loadStoredSessionPreview(persistedContinuationCandidate.sessionId);
      const previewSession = getPendingSessionPreviewSnapshot();
      setPendingSessionProfileSelection(
        previewSession?.summaryProfileId || initialPendingProfileId,
        { locked: true }
      );
      renderCaptions(true);
      requestAnimationFrame(scrollOverlayToBottom);
      pendingSessionResolveOptions = {
        reusePolicy: "force-reuse",
        resumeSessionId: persistedContinuationCandidate.sessionId,
      };
    } else {
      setPendingSessionProfileSelection(initialPendingProfileId, {
        locked: false,
      });
      pendingSessionResolveOptions = { reusePolicy: "force-new" };
      renderCaptions(true);
    }
    recordLifecycleDebug("startup-decision-continuation-resolved", {
      provider: provider.platform,
      decision,
      candidateSessionId: persistedContinuationCandidate.sessionId,
    });
    captureApprovedForLifecycle = true;
    captureBlockedForLifecycle = false;
    preparedMeetingFingerprint = meetingFingerprint;
    return;
  }

  setPendingSessionProfileSelection(initialPendingProfileId, { locked: false });
  renderCaptions(true);

  if (settings.captureStartupBehavior === "ask") {
    updateRuntimeDebugState({
      startupPrompt: {
        type: "capture-consent",
        reason: allowsContinuation
          ? "no-continuation-candidate"
          : "direct-call-no-continuation",
      },
    });
    const decision = await requestCaptureConsent(metadata.providerLabel);
    updateRuntimeDebugState({
      startupPrompt: {
        type: "capture-consent",
        reason: allowsContinuation
          ? "no-continuation-candidate"
          : "direct-call-no-continuation",
        decision,
      },
    });

    preparedMeetingFingerprint = meetingFingerprint;

    if (decision !== "approved") {
      recordLifecycleDebug("startup-decision-capture-denied", {
        provider: provider.platform,
        decision,
      });
      captureBlockedForLifecycle = true;
      captureApprovedForLifecycle = false;
      resetLiveCaptureState();
      resetTranslationState();
      hideOverlay();
      renderCaptions(true);
      return;
    }

    recordLifecycleDebug("startup-decision-capture-approved", {
      provider: provider.platform,
      decision,
    });
    captureApprovedForLifecycle = true;
    captureBlockedForLifecycle = false;
    setCaptureConsentState("idle");
    renderCaptions(true);
    return;
  }

  captureApprovedForLifecycle = true;
  captureBlockedForLifecycle = false;
  preparedMeetingFingerprint = meetingFingerprint;
  recordLifecycleDebug("startup-decision-auto-approved", {
    provider: provider.platform,
  });
}

async function resetTeamsRuntimeForNextMeeting(): Promise<void> {
  if (
    !runtimeInitialized ||
    activeProviderPlatform !== "microsoft-teams" ||
    (meetingPresenceState === "unknown" &&
      !hasActiveMeetingSession &&
      !preparedMeetingFingerprint &&
      !recentlyEndedSession &&
      !pendingSessionResolveOptions)
  ) {
    return;
  }

  stopObservingCurrentProvider?.();
  stopObservingCurrentProvider = null;
  closeCaptureGuide();
  forceResolveActivePrompt("capture-consent", "dismissed");
  forceResolveActivePrompt("session-continuation", "restart");
  forceResolveActivePrompt("session-ended", "exit");
  resetMeetingSession();
  resetTranslationState();
  resetLiveCaptureState();
  resetMicrosoftTeamsProviderState();
  setPendingSessionMetadata(null);
  setCaptureConsentState("idle");
  setMeetingPresenceState("unknown");
  hideOverlay();
  renderCaptions(true);

  hasActiveMeetingSession = false;
  captureApprovedForLifecycle = settings.captureStartupBehavior !== "ask";
  captureBlockedForLifecycle = false;
  sessionEndDecisionPending = false;
  endedSessionReviewPinned = false;
  sessionContinuationDecisionPending = false;
  pendingSessionResolveOptions = undefined;
  recentlyEndedSession = null;
  suppressEndedOverlayAutoShow = false;
  preparedMeetingFingerprint = null;
  resetPageObservedAt = null;
}

async function handleEndedSessionExit(provider: MeetingProvider): Promise<void> {
  endedSessionReviewPinned = false;
  if (provider.platform === "microsoft-teams") {
    suppressEndedOverlayAutoShow = true;
    hideOverlay();
    renderCaptions(true);
    return;
  }

  await teardownPlatformRuntime();
}

async function handleEndedSessionCloseRequest(): Promise<void> {
  if (meetingPresenceState !== "ended") {
    return;
  }

  const provider = getActiveProvider();
  if (!provider) {
    return;
  }

  await handleEndedSessionExit(provider);
}

async function loadSettings(): Promise<boolean> {
  const previousSettings = { ...settings };
  recordLifecycleDebug("settings-load-begin", {
    previousTranslationEnabled: previousSettings.translationEnabled,
    previousTargetLanguage: previousSettings.targetLanguage,
  });
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getSettings",
    });

    if (response?.success && response.settings) {
      const saved = response.settings;
      const termsAccepted = hasAcceptedCurrentTerms(saved.termsAcceptance);
      updateSettings(saved);
      normalizePendingSessionProfileSelection();
      if (saved.customPrompt !== undefined) {
        updateSettings({ customPrompt: saved.customPrompt });
      } else {
        updateSettings({ customPrompt: DEFAULT_CUSTOM_PROMPT });
      }
      if (previousSettings.overlayVisible && !saved.overlayVisible) {
        hideOverlay();
      }
      updateUIFromSettings();
      if (
        overlay &&
        (previousSettings.storeMeetingChat !== settings.storeMeetingChat ||
          previousSettings.targetLanguage !== settings.targetLanguage ||
          previousSettings.translationEnabled !== settings.translationEnabled ||
          previousSettings.uiLanguage !== settings.uiLanguage ||
          previousSettings.defaultSummaryProfileId !==
            settings.defaultSummaryProfileId ||
          previousSettings.summaryProfiles !== settings.summaryProfiles)
      ) {
        renderCaptions(true);
      }

      if (
        overlay &&
        isTranslationConfigured() &&
        settings.translationEnabled &&
        (previousSettings.targetLanguage !== settings.targetLanguage ||
          previousSettings.translationEnabled !== settings.translationEnabled)
      ) {
        void translateAllExistingCaptions({
          force: true,
          includeTranslated: true,
          resetExisting: true,
          overridePending: true,
        });
      }

      syncContinuationWindowState();
      syncAssistantAvailabilityFromSettingsOnly();
      if (!termsAccepted) {
        clearQuickAccessRuntimeStatus();
        if (runtimeInitialized) {
          await teardownPlatformRuntime();
        }
        recordLifecycleDebug("settings-load-blocked-terms-unaccepted");
        return false;
      }
      recordLifecycleDebug("settings-load-complete", {
        overlayVisible: settings.overlayVisible,
        translationEnabled: settings.translationEnabled,
        targetLanguage: settings.targetLanguage,
      });
      return true;
    }
  } catch (error) {
    void runtimeDiagnosticsLogger.error("settings_load_failed", {
      error,
    });
    // Settings could not be loaded, using defaults
  }

  return true;
}

function startSettingsSync(): void {
  if (stopSettingsSync) {
    recordLifecycleDebug("settings-sync-skipped-existing-listener");
    return;
  }

  if (!chrome?.storage?.onChanged) {
    recordLifecycleDebug("settings-sync-skipped-no-storage-listener");
    return;
  }

  const handleStorageChange = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName !== "local") {
      return;
    }

    if (!Object.keys(changes).some((key) => SETTINGS_STORAGE_KEYS.has(key))) {
      return;
    }

    recordLifecycleDebug("settings-sync-change-detected", {
      keys: Object.keys(changes),
    });

    void (async () => {
      const termsAccepted = await loadSettings();

      if (termsAccepted && !runtimeInitialized && activeMeetingPlatform) {
        recordLifecycleDebug("settings-sync-reinitialize-after-terms-accept", {
          platform: activeMeetingPlatform,
        });
        await initializePlatformRuntime(activeMeetingPlatform);
      }
    })();
  };

  chrome.storage.onChanged.addListener(handleStorageChange);
  recordLifecycleDebug("settings-sync-started");
  stopSettingsSync = () => {
    chrome.storage.onChanged.removeListener(handleStorageChange);
    stopSettingsSync = null;
    recordLifecycleDebug("settings-sync-stopped");
  };
}

function getActiveProvider(): MeetingProvider | null {
  return activeProviderPlatform
    ? getProviderByPlatform(activeProviderPlatform)
    : null;
}

function getEffectivePresenceState(
  observedPresence: MeetingPresenceState
): MeetingPresenceState {
  if (getSessionContinuationWindowMs() <= 0) {
    recentlyEndedSession = null;
    return observedPresence;
  }

  if (
    recentlyEndedSession &&
    Date.now() - recentlyEndedSession.endedAt > getSessionContinuationWindowMs()
  ) {
    recentlyEndedSession = null;
  }

  if (
    observedPresence === "unknown" &&
    !hasActiveMeetingSession &&
    recentlyEndedSession
  ) {
    return "ended";
  }

  return observedPresence;
}

async function doesStoredSessionExist(sessionId: string): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getMeetingSession",
      sessionId,
    });
    return Boolean(response?.success && response.session);
  } catch {
    return false;
  }
}

function syncPresenceState(provider: MeetingProvider): void {
  const effectivePresence = getEffectivePresenceState(
    provider.getMeetingPresence()
  );

  if (effectivePresence === lastObservedPresenceState) {
    lastObservedPresenceCount += 1;
  } else {
    lastObservedPresenceState = effectivePresence;
    lastObservedPresenceCount = 1;
  }

  if (
    effectivePresence !== meetingPresenceState &&
    lastObservedPresenceCount < PRESENCE_CONFIRMATION_TICKS
  ) {
    return;
  }

  if (meetingPresenceState !== effectivePresence) {
    recordLifecycleDebug("presence-state-updated", {
      provider: provider.platform,
      previous: meetingPresenceState,
      next: effectivePresence,
      confirmationTicks: lastObservedPresenceCount,
    });
    setMeetingPresenceState(effectivePresence);
    publishQuickAccessRuntimeStatus();
    renderCaptions(true);
  }
}

async function resolveSessionStartOptions(
  provider: MeetingProvider
): Promise<
  Pick<ResolveMeetingSessionRequest, "reusePolicy" | "resumeSessionId"> | undefined
> {
  if (isDirectCallSessionMetadata(provider.getSessionMetadata())) {
    recordLifecycleDebug("session-start-options-direct-call", {
      provider: provider.platform,
    });
    recentlyEndedSession = null;
    pendingSessionResolveOptions = undefined;
    forceResolveActivePrompt("session-continuation", "restart");
    return { reusePolicy: "force-new" };
  }

  if (pendingSessionResolveOptions) {
    const resolveOptions = pendingSessionResolveOptions;
    pendingSessionResolveOptions = undefined;
    if (
      resolveOptions.resumeSessionId &&
      !(await doesStoredSessionExist(resolveOptions.resumeSessionId))
    ) {
      recordLifecycleDebug("session-start-options-missing-resume-session", {
        provider: provider.platform,
        resumeSessionId: resolveOptions.resumeSessionId,
      });
      recentlyEndedSession = null;
      return { reusePolicy: "force-new" };
    }
    recentlyEndedSession = null;
    recordLifecycleDebug("session-start-options-from-pending", {
      provider: provider.platform,
      resolveOptions,
    });
    return resolveOptions;
  }

  if (!recentlyEndedSession) {
    recordLifecycleDebug("session-start-options-default", {
      provider: provider.platform,
    });
    return undefined;
  }

  if (getSessionContinuationWindowMs() <= 0) {
    recentlyEndedSession = null;
    return { reusePolicy: "force-new" };
  }

  if (Date.now() - recentlyEndedSession.endedAt > getSessionContinuationWindowMs()) {
    recentlyEndedSession = null;
    return { reusePolicy: "force-new" };
  }

  if (!(await doesStoredSessionExist(recentlyEndedSession.sessionId))) {
    recentlyEndedSession = null;
    return { reusePolicy: "force-new" };
  }

  const decision = await requestSessionContinuationDecision(
    provider.getSessionMetadata().providerLabel
  );
  const recentSessionId = recentlyEndedSession.sessionId;
  recentlyEndedSession = null;

  if (decision === "resume") {
    await loadStoredSessionPreview(recentSessionId);
    renderCaptions(true);
    requestAnimationFrame(scrollOverlayToBottom);
    return {
      reusePolicy: "force-reuse",
      resumeSessionId: recentSessionId,
    };
  }

  recordLifecycleDebug("session-start-options-force-new", {
    provider: provider.platform,
    decision,
  });

  return { reusePolicy: "force-new" };
}

async function getPersistedContinuationCandidate(
  provider: MeetingProvider
): Promise<{
  sessionId: string;
  providerLabel: string;
  title?: string;
  endedAt: number;
} | null> {
  try {
    const metadata = provider.getSessionMetadata();
    const response = await chrome.runtime.sendMessage({
      action: "findMeetingSessionContinuationCandidate",
      platform: metadata.platform,
      providerLabel: metadata.providerLabel,
      sourceUrl: metadata.sourceUrl,
      title: metadata.title,
      identifiers: metadata.identifiers,
    });
    const typedResponse =
      response as FindMeetingSessionContinuationCandidateResponse | null;

    updateRuntimeDebugState({
      lastContinuationLookup: {
        phase: "lookup",
        timestamp: new Date().toISOString(),
        metadata: {
          platform: metadata.platform,
          providerLabel: metadata.providerLabel,
          sourceUrl: metadata.sourceUrl,
          title: metadata.title,
          identifiers: metadata.identifiers,
        },
        response: typedResponse,
      },
    });

    if (typedResponse?.success && typedResponse.candidate) {
      recordLifecycleDebug("continuation-candidate-found", {
        provider: provider.platform,
        sessionId: typedResponse.candidate.sessionId,
      });
      return typedResponse.candidate as {
        sessionId: string;
        providerLabel: string;
        title?: string;
        endedAt: number;
      };
    }
  } catch (error) {
    void runtimeDiagnosticsLogger.error("continuation_candidate_lookup_failed", {
      provider: provider.platform,
      error,
    });
    updateRuntimeDebugState({
      lastContinuationLookup: {
        phase: "lookup-error",
        timestamp: new Date().toISOString(),
        error: String(error),
      },
    });
  }

  return null;
}

function shouldRetryContinuationLookup(provider: MeetingProvider): boolean {
  if (provider.platform !== "microsoft-teams") {
    return false;
  }

  const metadata = provider.getSessionMetadata();
  const hasStableIdentifiers = [
    metadata.identifiers.meetingCode,
    metadata.identifiers.meetingId,
    metadata.identifiers.conferenceId,
    metadata.identifiers.threadId,
    metadata.identifiers.meetingNumber,
  ].some((value) => Boolean(value && value.trim()));

  return !hasStableIdentifiers;
}

async function getPersistedContinuationCandidateWithRetry(
  provider: MeetingProvider
): Promise<{
  sessionId: string;
  providerLabel: string;
  title?: string;
  endedAt: number;
} | null> {
  if (getSessionContinuationWindowMs() <= 0) {
    return null;
  }

  const startedAt = Date.now();

  while (true) {
    const candidate = await getPersistedContinuationCandidate(provider);
    if (candidate) {
      return candidate;
    }

    if (!shouldRetryContinuationLookup(provider)) {
      return null;
    }

    if (Date.now() - startedAt >= CONTINUATION_LOOKUP_MAX_WAIT_MS) {
      return null;
    }

    await new Promise((resolve) =>
      window.setTimeout(resolve, CONTINUATION_LOOKUP_RETRY_DELAY_MS)
    );
  }
}

async function startMeetingCapture(provider: MeetingProvider): Promise<void> {
  if (
    hasActiveMeetingSession ||
    captureBlockedForLifecycle ||
    sessionEndDecisionPending ||
    sessionContinuationDecisionPending
  ) {
    recordLifecycleDebug("start-skipped-guard", {
      providerPlatform: provider.platform,
    });
    return;
  }

  if (provider.getMeetingPresence() !== "joined") {
    recordLifecycleDebug("start-skipped-not-joined", {
      providerPlatform: provider.platform,
      providerPresence: provider.getMeetingPresence(),
    });
    return;
  }

  const resolveOptions = await resolveSessionStartOptions(provider);

  if (provider.getMeetingPresence() !== "joined") {
    if (resolveOptions) {
      pendingSessionResolveOptions = resolveOptions;
    }
    recordLifecycleDebug("start-aborted-presence-changed", {
      providerPlatform: provider.platform,
      providerPresence: provider.getMeetingPresence(),
      resolveOptions,
    });
    return;
  }

  const shouldPreservePreviewItems =
    resolveOptions?.reusePolicy === "force-reuse" &&
    (captions.length > 0 || liveChatMessages.length > 0);

  showOverlay();
  setPendingSessionMetadata(null);
  resetTranslationState();
  if (!shouldPreservePreviewItems) {
    resetLiveCaptureState();
    renderCaptions(true);
  }

  await initMeetingSession(provider.getSessionMetadata(), () =>
    provider.getSessionMetadata(),
    resolveOptions,
    getPendingSessionProfileSelection().profileId || undefined
  );

  if (provider.platform === "microsoft-teams") {
    resetMicrosoftTeamsProviderState();
  }
  stopObservingCurrentProvider?.();
  stopObservingCurrentProvider = provider.startCaptionObserver();
  hasActiveMeetingSession = true;
  recentlyEndedSession = null;
  setCaptureConsentState("idle");
  renderCaptions(true);
  recordLifecycleDebug("start-success", {
    providerPlatform: provider.platform,
    resolveOptions,
  });
  publishQuickAccessRuntimeStatus();
  if (resolveOptions?.reusePolicy === "force-reuse") {
    requestAnimationFrame(scrollOverlayToBottom);
  }

  if (!provider.isCaptioningCurrentlyAvailable()) {
    const autoEnabled = await attemptAutomaticCaptionActivation(provider);
    if (
      !autoEnabled &&
      provider.getMeetingPresence() === "joined" &&
      !provider.isCaptioningCurrentlyAvailable()
    ) {
      openCaptureGuide();
    }
    return;
  }

  closeCaptureGuide();
}

async function attemptAutomaticCaptionActivation(
  provider: MeetingProvider
): Promise<boolean> {
  if (
    settings.captionActivationBehavior !== "automatic" ||
    typeof provider.tryEnableLiveCaptions !== "function"
  ) {
    return false;
  }

  closeCaptureGuide();
  setCaptionActivationState("attempting");
  renderCaptions(true);
  recordLifecycleDebug("auto-caption-enable-begin", {
    providerPlatform: provider.platform,
  });

  try {
    const enabled = await provider.tryEnableLiveCaptions(
      AUTO_CAPTION_ENABLE_TIMEOUT_MS
    );

    recordLifecycleDebug("auto-caption-enable-complete", {
      providerPlatform: provider.platform,
      enabled,
    });

    if (enabled) {
      setCCEnabled(true);
      closeCaptureGuide();
      renderCaptions(true);
      return true;
    }

    return false;
  } catch (error) {
    recordLifecycleDebug("auto-caption-enable-error", {
      providerPlatform: provider.platform,
      error: String(error),
    });
    return false;
  } finally {
    setCaptionActivationState("idle");
    renderCaptions(true);
  }
}

async function stopMeetingCapture(options?: {
  markEnded?: boolean;
  preserveCapturedItems?: boolean;
}): Promise<void> {
  recordLifecycleDebug("stop-begin", {
    options,
  });
  const currentSessionSnapshot = hasActiveMeetingSession
    ? getCurrentSessionSnapshot()
    : null;
  stopObservingCurrentProvider?.();
  stopObservingCurrentProvider = null;
  if (activeProviderPlatform === "microsoft-teams") {
    resetMicrosoftTeamsProviderState();
  }
  setCaptionActivationState("idle");
  closeCaptureGuide();

  if (hasActiveMeetingSession) {
    await updateSessionEndTime();
  }

  hasActiveMeetingSession = false;
  resetMeetingSession({
    preservePendingPreview: options?.preserveCapturedItems,
  });
  resetTranslationState();
  if (!options?.preserveCapturedItems) {
    resetLiveCaptureState();
  }

  if (options?.markEnded !== false && currentSessionSnapshot) {
    endedSessionReviewPinned = false;
    recentlyEndedSession = {
      sessionId: currentSessionSnapshot.id,
      endedAt: Date.now(),
    };
    setMeetingPresenceState("ended");
  }

  recordLifecycleDebug("stop-complete", {
    options,
    currentSessionId: currentSessionSnapshot?.id || null,
  });
  publishQuickAccessRuntimeStatus();
  renderCaptions(true);
}

async function handleEndedSessionDecision(provider: MeetingProvider): Promise<void> {
  if (sessionEndDecisionPending || endedSessionReviewPinned || !recentlyEndedSession) {
    return;
  }

  sessionEndDecisionPending = true;
  let shouldResumeLifecycle = false;

  try {
    const decision = await requestSessionEndedDecision(
      provider.getSessionMetadata().providerLabel
    );

    if (decision === "exit") {
      await handleEndedSessionExit(provider);
      return;
    }

    endedSessionReviewPinned = true;
    renderCaptions(true);
    shouldResumeLifecycle = provider.getMeetingPresence() === "joined";
  } finally {
    sessionEndDecisionPending = false;
    if (shouldResumeLifecycle) {
      requestLifecycleSync();
    }
  }
}

async function handleSessionContinuationDecision(
  provider: MeetingProvider
): Promise<void> {
  if (isDirectCallSessionMetadata(provider.getSessionMetadata())) {
    recentlyEndedSession = null;
    pendingSessionResolveOptions = undefined;
    forceResolveActivePrompt("session-continuation", "restart");
    return;
  }

  if (
    sessionContinuationDecisionPending ||
    pendingSessionResolveOptions ||
    !recentlyEndedSession ||
    getSessionContinuationWindowMs() <= 0 ||
    meetingPresenceState !== "prejoin"
  ) {
    return;
  }

  if (!(await doesStoredSessionExist(recentlyEndedSession.sessionId))) {
    recentlyEndedSession = null;
    pendingSessionResolveOptions = undefined;
    return;
  }

  sessionContinuationDecisionPending = true;

  try {
    const decision = await requestSessionContinuationDecision(
      provider.getSessionMetadata().providerLabel
    );
    const recentSessionId = recentlyEndedSession?.sessionId;

    if (decision === "resume" && recentSessionId) {
      await loadStoredSessionPreview(recentSessionId);
      renderCaptions(true);
      requestAnimationFrame(scrollOverlayToBottom);
      pendingSessionResolveOptions = {
        reusePolicy: "force-reuse",
        resumeSessionId: recentSessionId,
      };
    } else {
      pendingSessionResolveOptions = { reusePolicy: "force-new" };
    }

    recentlyEndedSession = null;
    captureApprovedForLifecycle = true;
    captureBlockedForLifecycle = false;
    preparedMeetingFingerprint = getProviderSessionFingerprint(provider);
  } finally {
    sessionContinuationDecisionPending = false;
  }
}

async function syncMeetingLifecycle(provider: MeetingProvider): Promise<void> {
  const currentUrl = new URL(window.location.href);
  const resetPageState = observeResetPageState(provider, currentUrl);
  recordLifecycleDebug("sync-begin", {
    providerPlatform: provider.platform,
    providerPresence: provider.getMeetingPresence(),
    resetPageState,
  });
  if (resetPageState === "pending") {
    return;
  }

  if (resetPageState === "confirmed") {
    if (provider.platform === "microsoft-teams") {
      if (hasActiveMeetingSession) {
        await stopMeetingCapture({ preserveCapturedItems: true });
        showOverlay();
        renderCaptions(true);
        await handleEndedSessionDecision(provider);
        return;
      }

      if (shouldKeepRuntimeForEndedSessionOnResetPage()) {
        if (!endedSessionReviewPinned) {
          showOverlay();
          renderCaptions(true);
        }
        await handleEndedSessionDecision(provider);
        return;
      }

      await resetTeamsRuntimeForNextMeeting();
      return;
    }

    if (hasActiveMeetingSession) {
      await stopMeetingCapture({ preserveCapturedItems: true });
      showOverlay();
      renderCaptions(true);
      await handleEndedSessionDecision(provider);
      return;
    }

    if (shouldKeepRuntimeForEndedSessionOnResetPage()) {
      if (!endedSessionReviewPinned) {
        showOverlay();
        renderCaptions(true);
      }
      await handleEndedSessionDecision(provider);
      return;
    }

    forceResolveActivePrompt("capture-consent", "dismissed");
    forceResolveActivePrompt("session-continuation", "restart");
    forceResolveActivePrompt("session-ended", "exit");
    await teardownPlatformRuntime();
    return;
  }

  setPendingSessionMetadata(
    hasActiveMeetingSession ? null : provider.getSessionMetadata()
  );
  syncPresenceState(provider);

  if (!hasActiveMeetingSession) {
    if (meetingPresenceState === "prejoin") {
      endedSessionReviewPinned = false;
      suppressEndedOverlayAutoShow = false;
      showOverlay();
      await handleSessionContinuationDecision(provider);
      await prepareMeetingStartupDecision(provider);
    } else if (meetingPresenceState === "ended") {
      if (!suppressEndedOverlayAutoShow) {
        showOverlay();
      }
    } else if (meetingPresenceState === "joined") {
      endedSessionReviewPinned = false;
      suppressEndedOverlayAutoShow = false;
      showOverlay();
      if (!captureApprovedForLifecycle && !captureBlockedForLifecycle) {
        await prepareMeetingStartupDecision(provider);
      }
    } else if (meetingPresenceState === "unknown") {
      endedSessionReviewPinned = false;
      forceResolveActivePrompt("capture-consent", "dismissed");
      forceResolveActivePrompt("session-continuation", "restart");
      forceResolveActivePrompt("session-ended", "exit");
      hideOverlay();
    }
  }

  if (captureBlockedForLifecycle) {
    recordLifecycleDebug("sync-skipped-capture-blocked", {
      providerPlatform: provider.platform,
    });
    return;
  }

  if (meetingPresenceState === "joined") {
    if (sessionEndDecisionPending) {
      forceResolveActivePrompt("session-ended", "stay");
      return;
    }

    if (captureApprovedForLifecycle) {
      await startMeetingCapture(provider);
    } else {
      recordLifecycleDebug("sync-waiting-for-approval", {
        providerPlatform: provider.platform,
      });
    }
    return;
  }

  if (hasActiveMeetingSession) {
    await stopMeetingCapture({ preserveCapturedItems: true });
    await handleEndedSessionDecision(provider);
  }
}

function requestLifecycleSync(): void {
  const provider = getActiveProvider();
  if (!provider || captureBlockedForLifecycle) {
    return;
  }

  if (lifecycleSyncInProgress) {
    lifecycleSyncRequested = true;
    return;
  }

  lifecycleSyncInProgress = true;

  void (async () => {
    try {
      do {
        lifecycleSyncRequested = false;
        try {
          await syncMeetingLifecycle(provider);
        } catch (error) {
          void runtimeDiagnosticsLogger.error("lifecycle_sync_failed", {
            activeProviderPlatform,
            meetingPresenceState,
            error,
          });
        }
      } while (lifecycleSyncRequested);
    } finally {
      lifecycleSyncInProgress = false;
    }
  })();
}

function startPresenceMonitor(): void {
  if (presenceMonitorId !== null) {
    window.clearInterval(presenceMonitorId);
  }

  presenceMonitorId = window.setInterval(() => {
    publishQuickAccessRuntimeStatus();
    requestLifecycleSync();
  }, PRESENCE_MONITOR_INTERVAL_MS);

  publishQuickAccessRuntimeStatus();
  requestLifecycleSync();
}

function stopPresenceMonitor(): void {
  if (presenceMonitorId !== null) {
    window.clearInterval(presenceMonitorId);
    presenceMonitorId = null;
  }
}

function handleBeforeUnload(): void {
  if (hasActiveMeetingSession) {
    void updateSessionEndTime();
  }
}

export function isSupportedMeetingPage(): boolean {
  const url = new URL(window.location.href);
  return (
    getProviderForUrl(url) !== null || getProviderForPageContext(url) !== null
  );
}

export async function initializePlatformRuntime(
  initialProviderPlatform?: MeetingProvider["platform"]
): Promise<(() => void) | null> {
  if (runtimeInitialized) {
    return () => undefined;
  }

  if (!document.body) {
    return null;
  }

  const currentUrl = new URL(window.location.href);
  const provider =
    (initialProviderPlatform
      ? getProviderByPlatform(initialProviderPlatform)
      : null) ||
    getProviderForUrl(currentUrl) ||
    getProviderForPageContext(currentUrl);

  if (!provider) {
    return null;
  }

  if (
    provider.platform === "microsoft-teams" &&
    /\/v2\/?$/i.test(currentUrl.pathname) &&
    !(provider.matchesPageContext?.(currentUrl) ?? false)
  ) {
    return null;
  }

  setEmptyStateMessage(provider.getEmptyState());
  setCaptureGuide(provider.getCaptureGuide());
  setActiveMeetingPlatform(provider.platform);

  const termsAccepted = await loadSettings();
  startSettingsSync();

  if (!termsAccepted) {
    clearQuickAccessRuntimeStatus();
    return null;
  }

  if (settings.captureStartupBehavior === "off") {
    return () => undefined;
  }

  await provider.bootstrap();
  setPendingSessionMetadata(provider.getSessionMetadata());
  createOverlay();
  startAssistantSync();
  const initialPresence = provider.getMeetingPresence();
  setMeetingPresenceState(initialPresence);
  lastObservedPresenceState = initialPresence;
  lastObservedPresenceCount = 1;

  runtimeInitialized = true;
  activeProviderPlatform = provider.platform;
  captureApprovedForLifecycle = settings.captureStartupBehavior !== "ask";
  captureBlockedForLifecycle = false;
  hasActiveMeetingSession = false;
  publishQuickAccessRuntimeStatus();

  renderCaptions(true);

  updateRuntimeDebugState({
    providerPlatform: provider.platform,
    startupBehavior: settings.captureStartupBehavior,
    initialPresence,
  });

  await prepareMeetingStartupDecision(provider);

  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener(
    SESSION_ENDED_CLOSE_REQUEST_EVENT,
    handleEndedSessionCloseRequest
  );
  startLifecycleMonitor();

  if (!captureBlockedForLifecycle) {
    startPresenceMonitor();
  }

  return () => {
    void teardownPlatformRuntime();
  };
}

function startLifecycleMonitor(): void {
  if (lifecycleMonitorId !== null) {
    window.clearInterval(lifecycleMonitorId);
  }

  lifecycleMonitorId = window.setInterval(() => {
    if (!runtimeInitialized || !activeProviderPlatform) {
      return;
    }

    const provider = getProviderByPlatform(activeProviderPlatform);
    if (!provider) {
      void teardownPlatformRuntime();
      return;
    }

    const currentUrl = new URL(window.location.href);
    const resetPageState = observeResetPageState(provider, currentUrl);
    if (resetPageState === "pending") {
      return;
    }

    if (resetPageState === "confirmed") {
      if (provider.platform === "microsoft-teams") {
        if (hasActiveMeetingSession || shouldKeepRuntimeForEndedSessionOnResetPage()) {
          requestLifecycleSync();
          return;
        }

        void resetTeamsRuntimeForNextMeeting();
        return;
      }

      if (shouldKeepRuntimeForEndedSessionOnResetPage()) {
        return;
      }

      void teardownPlatformRuntime();
      return;
    }

    const isStillActive =
      provider.matchesUrl(currentUrl) ||
      provider.matchesPageContext?.(currentUrl) ||
      false;

    if (!isStillActive) {
      void teardownPlatformRuntime();
    }
  }, LIFECYCLE_MONITOR_INTERVAL_MS);
}

async function teardownPlatformRuntime(): Promise<void> {
  if (!runtimeInitialized) {
    return;
  }

  stopPresenceMonitor();
  stopAssistantSync();
  stopSettingsSync?.();

  if (lifecycleMonitorId !== null) {
    window.clearInterval(lifecycleMonitorId);
    lifecycleMonitorId = null;
  }

  clearQuickAccessRuntimeStatus();

  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener(
    SESSION_ENDED_CLOSE_REQUEST_EVENT,
    handleEndedSessionCloseRequest
  );

  await stopMeetingCapture({ markEnded: false });
  destroyOverlay();
  resetContentState();

  if (activeProviderPlatform === "microsoft-teams") {
    resetMicrosoftTeamsProviderState();
  }

  runtimeInitialized = false;
  activeProviderPlatform = null;
  captureApprovedForLifecycle = false;
  captureBlockedForLifecycle = false;
  lifecycleSyncInProgress = false;
  lifecycleSyncRequested = false;
  lastObservedPresenceState = "unknown";
  lastObservedPresenceCount = 0;
  sessionEndDecisionPending = false;
  endedSessionReviewPinned = false;
  sessionContinuationDecisionPending = false;
  suppressEndedOverlayAutoShow = false;
  resetPageObservedAt = null;
  preparedMeetingFingerprint = null;
  pendingSessionResolveOptions = undefined;
  recentlyEndedSession = null;
  resetRuntimeDebugState();
}
