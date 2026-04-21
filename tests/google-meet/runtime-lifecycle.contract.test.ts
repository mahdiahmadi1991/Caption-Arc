import { describe, expect, test, vi } from "vitest";
import type { MeetingProvider } from "../../entrypoints/content/providers/types";

const {
  closeCaptureGuideMock,
  createOverlayMock,
  destroyOverlayMock,
  forceResolveActivePromptMock,
  hideOverlayMock,
  openCaptureGuideMock,
  resetGoogleMeetProviderStateMock,
  renderCaptionsMock,
  requestCaptureConsentMock,
  requestSessionContinuationDecisionMock,
  requestSessionEndedDecisionMock,
  showOverlayMock,
  activeProviderOverride,
} = vi.hoisted(() => ({
  closeCaptureGuideMock: vi.fn(),
  createOverlayMock: vi.fn(),
  destroyOverlayMock: vi.fn(),
  forceResolveActivePromptMock: vi.fn(),
  hideOverlayMock: vi.fn(),
  openCaptureGuideMock: vi.fn(),
  resetGoogleMeetProviderStateMock: vi.fn(),
  renderCaptionsMock: vi.fn(),
  requestCaptureConsentMock: vi.fn(),
  requestSessionContinuationDecisionMock: vi.fn(),
  requestSessionEndedDecisionMock: vi.fn(),
  showOverlayMock: vi.fn(),
  activeProviderOverride: {
    current: null as MeetingProvider | null,
  },
}));

vi.mock("../../entrypoints/content/overlay/capture-consent", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../entrypoints/content/overlay/capture-consent")
  >();
  return {
    ...actual,
    forceResolveActivePrompt: forceResolveActivePromptMock,
    requestCaptureConsent: requestCaptureConsentMock,
    requestSessionContinuationDecision: requestSessionContinuationDecisionMock,
    requestSessionEndedDecision: requestSessionEndedDecisionMock,
  };
});

vi.mock("../../entrypoints/content/overlay", async () => {
  const state = await import("../../entrypoints/content/state");

  return {
    createOverlay: vi.fn(() => {
      createOverlayMock();
      if (state.overlay) {
        return;
      }

      const overlayEl = document.createElement("div");
      overlayEl.id = "captionarc-overlay";
      overlayEl.setAttribute("aria-hidden", "false");
      document.body.appendChild(overlayEl);
      state.setOverlay(overlayEl);
    }),
    destroyOverlay: vi.fn(() => {
      destroyOverlayMock();
      state.overlay?.remove();
      state.setOverlay(null);
      state.setCaptionList(null);
      state.setWaveElement(null);
      state.setCaptureGuideElement(null);
    }),
    hideOverlay: vi.fn(() => {
      hideOverlayMock();
      if (!state.overlay) {
        return;
      }

      state.overlay.classList.add("mc-hidden");
      state.overlay.setAttribute("aria-hidden", "true");
    }),
    showOverlay: vi.fn(() => {
      showOverlayMock();
      if (!state.overlay) {
        return;
      }

      state.overlay.classList.remove(
        "mc-hidden",
        "mc-overlay-exiting",
        "mc-capture-consent-dismissed"
      );
      state.overlay.setAttribute("aria-hidden", "false");
    }),
    updateUIFromSettings: vi.fn(),
  };
});

vi.mock("../../entrypoints/content/overlay/capture-guide", () => ({
  openCaptureGuide: openCaptureGuideMock,
  closeCaptureGuide: closeCaptureGuideMock,
}));

vi.mock("../../entrypoints/content/render", () => ({
  renderCaptions: renderCaptionsMock,
  scrollOverlayToBottom: vi.fn(),
  SESSION_ENDED_CLOSE_REQUEST_EVENT: "captionarc:session-ended-close-request",
}));

vi.mock("../../entrypoints/content/providers/registry", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../entrypoints/content/providers/registry")
  >();

  return {
    ...actual,
    getProviderByPlatform: vi.fn((platform: MeetingProvider["platform"]) => {
      if (
        activeProviderOverride.current &&
        activeProviderOverride.current.platform === platform
      ) {
        return activeProviderOverride.current;
      }

      return actual.getProviderByPlatform(platform);
    }),
  };
});

vi.mock("../../entrypoints/content/providers/google-meet", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../entrypoints/content/providers/google-meet")
  >();

  return {
    ...actual,
    resetGoogleMeetProviderState: resetGoogleMeetProviderStateMock,
  };
});

function setPath(path: string): void {
  window.history.replaceState({}, "", path);
}

async function loadPlatformRuntimeModule() {
  vi.resetModules();
  return await import("../../entrypoints/content/platform-runtime");
}

function createRuntimeProvider(
  overrides: Partial<MeetingProvider> = {}
): {
  provider: MeetingProvider;
  setPresence: (next: "unknown" | "prejoin" | "joined" | "ended") => void;
  startObserverMock: ReturnType<typeof vi.fn>;
} {
  let meetingPresence: "unknown" | "prejoin" | "joined" | "ended" = "unknown";
  const startObserverMock = vi.fn(() => () => undefined);

  const provider: MeetingProvider = {
    platform: "google-meet",
    matchesUrl: () => true,
    matchesPageContext: () => true,
    bootstrap: () => undefined,
    getMeetingPresence: () => meetingPresence,
    startCaptionObserver: startObserverMock,
    getSessionMetadata: () => ({
      platform: "google-meet",
      providerLabel: "Google Meet",
      sourceUrl: "https://meet.google.com/xxx-xxxx-xxx",
      identifiers: { meetingId: "shared-42" },
    }),
    getEmptyState: () => ({ waitingTitle: "", waitingBody: "" }),
    getCaptureGuide: () => ({ modalTitle: "", modalBody: "", steps: [] }),
    isCaptioningCurrentlyAvailable: () => true,
    ...overrides,
  };

  return {
    provider,
    setPresence: (next) => {
      meetingPresence = next;
    },
    startObserverMock,
  };
}

describe("Runtime lifecycle contract", () => {
  test("RLIFE-007: presence transitions require two consecutive matching observations", async () => {
    const sendMessageMock = vi.fn(async () => ({ success: true }));
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const { provider, setPresence } = createRuntimeProvider();
    platformRuntimeInternals.setRuntimeStateForTests({
      meetingPresenceState: "unknown",
      lastObservedPresenceState: "unknown",
      lastObservedPresenceCount: 1,
    });

    setPresence("joined");
    platformRuntimeInternals.syncPresenceState(provider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().meetingPresenceState).toBe(
      "unknown"
    );

    platformRuntimeInternals.syncPresenceState(provider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().meetingPresenceState).toBe(
      "joined"
    );
    vi.unstubAllGlobals();
  });

  test("RLIFE-008: capture starts only when presence is joined and lifecycle guards are clear", async () => {
    const sendMessageMock = vi.fn(async (message: { action?: string }) => {
      if (message.action === "resolveMeetingSession") {
        return { success: false };
      }
      return { success: true };
    });
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const { provider, setPresence, startObserverMock } = createRuntimeProvider();
    platformRuntimeInternals.setRuntimeStateForTests({
      hasActiveMeetingSession: false,
      captureBlockedForLifecycle: false,
      sessionEndDecisionPending: false,
      sessionContinuationDecisionPending: false,
    });

    setPresence("prejoin");
    await platformRuntimeInternals.startMeetingCapture(provider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().hasActiveMeetingSession).toBe(
      false
    );

    setPresence("joined");
    await platformRuntimeInternals.startMeetingCapture(provider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().hasActiveMeetingSession).toBe(
      true
    );
    expect(startObserverMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  test("RLIFE-009: stop flow records recently ended session and marks presence as ended", async () => {
    const sendMessageMock = vi.fn(async (message: { action?: string }) => {
      if (message.action === "resolveMeetingSession") {
        return { success: false };
      }
      return { success: true };
    });
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const { provider, setPresence } = createRuntimeProvider();
    setPresence("joined");
    await platformRuntimeInternals.startMeetingCapture(provider);
    await platformRuntimeInternals.stopMeetingCapture();

    const runtimeState = platformRuntimeInternals.getRuntimeStateForTests();
    expect(runtimeState.hasActiveMeetingSession).toBe(false);
    expect(runtimeState.meetingPresenceState).toBe("ended");
    expect(runtimeState.recentlyEndedSession).not.toBeNull();
    vi.unstubAllGlobals();
  });

  test("RLIFE-010: teardown clears quick-access status and resets runtime-local flags", async () => {
    const sendMessageMock = vi.fn(async () => ({ success: true }));
    const stopSettingsSyncMock = vi.fn();
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    platformRuntimeInternals.setRuntimeStateForTests({
      runtimeInitialized: true,
      activeProviderPlatform: "google-meet",
      captureApprovedForLifecycle: true,
      captureBlockedForLifecycle: true,
      hasActiveMeetingSession: false,
      sessionEndDecisionPending: true,
      sessionContinuationDecisionPending: true,
      endedSessionReviewPinned: true,
      pendingSessionResolveOptions: { reusePolicy: "force-new" },
      recentlyEndedSession: {
        sessionId: "session-ended",
        endedAt: Date.now() - 5000,
      },
      suppressEndedOverlayAutoShow: true,
      resetPageObservedAt: Date.now() - 1000,
      preparedMeetingFingerprint: "fp",
      stopSettingsSync: stopSettingsSyncMock,
    });

    await platformRuntimeInternals.teardownPlatformRuntime();

    const state = platformRuntimeInternals.getRuntimeStateForTests();
    expect(state.runtimeInitialized).toBe(false);
    expect(state.activeProviderPlatform).toBeNull();
    expect(state.captureApprovedForLifecycle).toBe(false);
    expect(state.captureBlockedForLifecycle).toBe(false);
    expect(state.sessionEndDecisionPending).toBe(false);
    expect(state.sessionContinuationDecisionPending).toBe(false);
    expect(state.pendingSessionResolveOptions).toBeUndefined();
    expect(state.recentlyEndedSession).toBeNull();
    expect(stopSettingsSyncMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "clearQuickAccessRuntimeStatus" })
    );
    vi.unstubAllGlobals();
  });

  test("RLIFE-011: lifecycle sync force-resolves prompts during unknown and joined transitions", async () => {
    const sendMessageMock = vi.fn(async () => ({ success: true }));
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const { provider, setPresence } = createRuntimeProvider();
    platformRuntimeInternals.setRuntimeStateForTests({
      hasActiveMeetingSession: false,
      captureBlockedForLifecycle: false,
      meetingPresenceState: "unknown",
      lastObservedPresenceState: "unknown",
      lastObservedPresenceCount: 2,
    });

    setPresence("unknown");
    await platformRuntimeInternals.syncMeetingLifecycle(provider);
    expect(forceResolveActivePromptMock).toHaveBeenCalledWith(
      "capture-consent",
      "dismissed"
    );
    expect(forceResolveActivePromptMock).toHaveBeenCalledWith(
      "session-continuation",
      "restart"
    );
    expect(forceResolveActivePromptMock).toHaveBeenCalledWith("session-ended", "exit");

    forceResolveActivePromptMock.mockClear();
    platformRuntimeInternals.setRuntimeStateForTests({
      hasActiveMeetingSession: false,
      captureBlockedForLifecycle: false,
      sessionEndDecisionPending: true,
      meetingPresenceState: "joined",
      lastObservedPresenceState: "joined",
      lastObservedPresenceCount: 2,
    });
    setPresence("joined");
    await platformRuntimeInternals.syncMeetingLifecycle(provider);
    expect(forceResolveActivePromptMock).toHaveBeenCalledWith("session-ended", "stay");
    vi.unstubAllGlobals();
  });

  test("RLIFE-012: confirmed Teams reset pages prefer in-place reset flows over teardown", async () => {
    vi.useFakeTimers();
    setPath("/v2/");
    const sendMessageMock = vi.fn(async () => ({ success: true }));
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const teamsProvider = createRuntimeProvider({
      platform: "microsoft-teams",
      matchesUrl: () => true,
      matchesPageContext: () => false,
      getSessionMetadata: () => ({
        platform: "microsoft-teams",
        providerLabel: "Microsoft Teams Web",
        sourceUrl: "https://teams.live.com/v2/",
        identifiers: { callType: "scheduled-meeting" },
      }),
    }).provider;

    platformRuntimeInternals.setRuntimeStateForTests({
      runtimeInitialized: true,
      activeProviderPlatform: "microsoft-teams",
      hasActiveMeetingSession: true,
      meetingPresenceState: "joined",
      resetPageObservedAt: Date.now() - 3000,
      preparedMeetingFingerprint: "fp-teams",
    });
    await platformRuntimeInternals.syncMeetingLifecycle(teamsProvider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().runtimeInitialized).toBe(
      true
    );
    expect(platformRuntimeInternals.getRuntimeStateForTests().hasActiveMeetingSession).toBe(
      false
    );

    platformRuntimeInternals.setRuntimeStateForTests({
      runtimeInitialized: true,
      activeProviderPlatform: "microsoft-teams",
      hasActiveMeetingSession: false,
      meetingPresenceState: "unknown",
      resetPageObservedAt: Date.now() - 3000,
      preparedMeetingFingerprint: "fp-teams-monitor",
    });
    platformRuntimeInternals.startLifecycleMonitor();
    await vi.advanceTimersByTimeAsync(1600);
    expect(platformRuntimeInternals.getRuntimeStateForTests().runtimeInitialized).toBe(
      true
    );
    await platformRuntimeInternals.teardownPlatformRuntime();
    vi.unstubAllGlobals();
  });

  test("RLIFE-013: quick-access soft refresh rebuilds extension-owned artifacts and keeps the same session active", async () => {
    vi.useFakeTimers();
    const sendMessageMock = vi.fn(async () => ({ success: true }));
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const state = await import("../../entrypoints/content/state");
    const stopObservingCurrentProviderMock = vi.fn();
    const { provider, setPresence, startObserverMock } = createRuntimeProvider();
    setPresence("joined");
    activeProviderOverride.current = provider;
    state.updateSettings({
      overlayVisible: true,
      captureStartupBehavior: "always",
    });

    const overlayEl = document.createElement("div");
    overlayEl.id = "captionarc-overlay";
    overlayEl.setAttribute("aria-hidden", "false");
    document.body.appendChild(overlayEl);
    state.setOverlay(overlayEl);

    platformRuntimeInternals.setRuntimeStateForTests({
      runtimeInitialized: true,
      activeProviderPlatform: "google-meet",
      hasActiveMeetingSession: true,
      captureApprovedForLifecycle: true,
      captureBlockedForLifecycle: false,
      meetingPresenceState: "joined",
      stopObservingCurrentProvider: stopObservingCurrentProviderMock,
    });

    const refreshPromise = platformRuntimeInternals.softRefreshQuickAccessArtifacts();
    await vi.advanceTimersByTimeAsync(200);
    await expect(refreshPromise).resolves.toEqual({ success: true });

    expect(stopObservingCurrentProviderMock).toHaveBeenCalledTimes(1);
    expect(hideOverlayMock).toHaveBeenCalled();
    expect(destroyOverlayMock).toHaveBeenCalledTimes(1);
    expect(createOverlayMock).toHaveBeenCalledTimes(1);
    expect(resetGoogleMeetProviderStateMock).toHaveBeenCalledTimes(1);
    expect(startObserverMock).toHaveBeenCalledTimes(1);
    expect(showOverlayMock).toHaveBeenCalled();
    expect(renderCaptionsMock).toHaveBeenCalled();
    expect(platformRuntimeInternals.getRuntimeStateForTests().hasActiveMeetingSession).toBe(
      true
    );
    expect(sendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "updateQuickAccessRuntimeStatus" })
    );

    activeProviderOverride.current = null;
    vi.unstubAllGlobals();
  });

  test("RLIFE-003: initializePlatformRuntime returns null when no provider resolves", async () => {
    setPath("/unsupported");
    const { initializePlatformRuntime } = await loadPlatformRuntimeModule();

    await expect(initializePlatformRuntime()).resolves.toBeNull();
  });

  test("RLIFE-004: Teams /v2 page without page context is rejected even when platform is preselected", async () => {
    setPath("/v2/");
    const { initializePlatformRuntime } = await loadPlatformRuntimeModule();

    await expect(initializePlatformRuntime("microsoft-teams")).resolves.toBeNull();
  });

  test("RLIFE-006: reset-page observation transitions from pending to confirmed after 2000ms", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T10:00:00.000Z"));

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();

    const provider: MeetingProvider = {
      platform: "google-meet",
      matchesUrl: () => true,
      matchesPageContext: () => false,
      bootstrap: () => undefined,
      getMeetingPresence: () => "unknown",
      startCaptionObserver: () => () => undefined,
      getSessionMetadata: () => ({
        platform: "google-meet",
        providerLabel: "Google Meet",
        sourceUrl: "https://meet.google.com/xxx-xxxx-xxx",
        identifiers: {},
      }),
      getEmptyState: () => ({ waitingTitle: "", waitingBody: "" }),
      getCaptureGuide: () => ({ modalTitle: "", modalBody: "", steps: [] }),
      isCaptioningCurrentlyAvailable: () => false,
    };

    const url = new URL("https://meet.google.com/xxx-xxxx-xxx");
    expect(platformRuntimeInternals.observeResetPageState(provider, url)).toBe("pending");
    expect(platformRuntimeInternals.observeResetPageState(provider, url)).toBe("pending");

    await vi.advanceTimersByTimeAsync(2000);
    expect(platformRuntimeInternals.observeResetPageState(provider, url)).toBe("confirmed");
  });
});
