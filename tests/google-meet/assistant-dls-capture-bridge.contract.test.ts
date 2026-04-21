import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const captions: Array<unknown> = [];

  return {
    captions,
    addOrUpdateCaptionMock: vi.fn(),
    finalizeCaptionMock: vi.fn(),
    getCurrentSessionSnapshotMock: vi.fn(),
    setCurrentSessionAssistantEnabledMock: vi.fn(),
    setCurrentSessionMeetingProfileMock: vi.fn(),
    startMeetingCaptureMock: vi.fn(),
    teardownPlatformRuntimeMock: vi.fn(),
    getProviderForPageContextMock: vi.fn(),
    getProviderForUrlMock: vi.fn(),
    traceMock: vi.fn(async () => undefined),
    debugMock: vi.fn(async () => undefined),
    infoMock: vi.fn(async () => undefined),
    warnMock: vi.fn(async () => undefined),
    errorMock: vi.fn(async () => undefined),
  };
});

vi.mock("../../entrypoints/content/caption", () => ({
  addOrUpdateCaption: mocks.addOrUpdateCaptionMock,
  finalizeCaption: mocks.finalizeCaptionMock,
}));

vi.mock("../../entrypoints/content/state", () => ({
  captions: mocks.captions,
  activeMeetingPlatform: "google-meet",
  meetingPresenceState: "joined",
}));

vi.mock("../../entrypoints/content/history-service", () => ({
  getCurrentSessionSnapshot: mocks.getCurrentSessionSnapshotMock,
  setCurrentSessionAssistantEnabled: mocks.setCurrentSessionAssistantEnabledMock,
  setCurrentSessionMeetingProfile: mocks.setCurrentSessionMeetingProfileMock,
}));

vi.mock("../../entrypoints/content/platform-runtime", () => ({
  platformRuntimeInternals: {
    startMeetingCapture: mocks.startMeetingCaptureMock,
    teardownPlatformRuntime: mocks.teardownPlatformRuntimeMock,
  },
}));

vi.mock("../../entrypoints/content/providers/registry", () => ({
  getProviderForPageContext: mocks.getProviderForPageContextMock,
  getProviderForUrl: mocks.getProviderForUrlMock,
}));

vi.mock("../../entrypoints/shared/diagnostics-client", () => ({
  createDiagnosticsLogger: vi.fn(() => ({
    trace: mocks.traceMock,
    debug: mocks.debugMock,
    info: mocks.infoMock,
    warn: mocks.warnMock,
    error: mocks.errorMock,
  })),
}));

type BridgeModule = typeof import("../../entrypoints/content/assistant-dls-capture-bridge");

async function loadBridgeModule(): Promise<BridgeModule> {
  return await import("../../entrypoints/content/assistant-dls-capture-bridge");
}

async function sendBridgeRequest(
  request: {
    action:
      | "ping"
      | "snapshot"
      | "reset"
      | "ensure-capture"
      | "shutdown"
      | "caption"
      | "update"
      | "finalize"
      | "switch-profile";
    payload?: Record<string, unknown>;
  }
) {
  return await new Promise<Record<string, unknown>>((resolve) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const handleResponse = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      if (customEvent.detail?.requestId !== requestId) {
        return;
      }

      document.removeEventListener(
        "captionarc:dls-capture-response",
        handleResponse as EventListener
      );
      resolve(customEvent.detail);
    };

    document.addEventListener(
      "captionarc:dls-capture-response",
      handleResponse as EventListener
    );
    document.dispatchEvent(
      new CustomEvent("captionarc:dls-capture-request", {
        detail: {
          requestId,
          action: request.action,
          payload: request.payload,
        },
      })
    );
  });
}

describe("Assistant DLS capture bridge contract", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    document.body.innerHTML = "";
    mocks.captions.length = 0;
    mocks.addOrUpdateCaptionMock.mockReturnValue(77);
    mocks.getCurrentSessionSnapshotMock.mockReturnValue({
      id: "session-1",
      platform: "google-meet",
      meetingProfileId: "interview",
      artifacts: {},
    });
    mocks.setCurrentSessionMeetingProfileMock.mockResolvedValue(true);
    mocks.setCurrentSessionAssistantEnabledMock.mockResolvedValue(true);
    mocks.startMeetingCaptureMock.mockResolvedValue(undefined);
    mocks.teardownPlatformRuntimeMock.mockResolvedValue(undefined);
    mocks.getProviderForUrlMock.mockReturnValue(null);
    mocks.getProviderForPageContextMock.mockReturnValue(null);

    const module = await loadBridgeModule();
    module.installAssistantDlsCaptureBridge();
    await sendBridgeRequest({ action: "reset" });
  });

  afterEach(async () => {
    await sendBridgeRequest({ action: "reset" });
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("ADLS-BRIDGE-001: internals normalize stable keys and bridge snapshots expose the current session", async () => {
    const module = await loadBridgeModule();

    expect(
      module.assistantDlsCaptureBridgeInternals.normalizeStableKey(
        "  Q1 / Why should we hire you?  "
      )
    ).toBe("q1-why-should-we-hire-you-");

    const snapshot = module.assistantDlsCaptureBridgeInternals.buildBridgeSnapshot();
    expect(snapshot).toMatchObject({
      installed: true,
      activeMeetingPlatform: "google-meet",
      meetingPresenceState: "joined",
      currentSession: {
        id: "session-1",
        meetingProfileId: "interview",
      },
      captionCount: 0,
      fixtureKeys: [],
    });
  });

  test("ADLS-BRIDGE-002: ping and caption requests round-trip through the installed bridge and finalize after the timer", async () => {
    const module = await loadBridgeModule();

    const pingResponse = await sendBridgeRequest({ action: "ping" });
    expect(pingResponse.ok).toBe(true);
    expect(pingResponse.result).toMatchObject({
      installed: true,
      currentSession: {
        id: "session-1",
      },
    });

    const captionResponse = await sendBridgeRequest({
      action: "caption",
      payload: {
        stableKey: "evt-1",
        speaker: "Interviewer",
        text: "Could you summarize the migration risk?",
        own: false,
      },
    });

    expect(captionResponse.ok).toBe(true);
    expect(captionResponse.result).toMatchObject({
      stableKey: "evt-1",
      captionId: 77,
      own: false,
      speaker: "Interviewer",
      textLength: "Could you summarize the migration risk?".length,
      currentSessionId: "session-1",
    });
    expect(mocks.addOrUpdateCaptionMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1500);
    expect(mocks.finalizeCaptionMock).toHaveBeenCalledWith(77);

    const snapshot = module.assistantDlsCaptureBridgeInternals.buildBridgeSnapshot();
    expect(snapshot.fixtureKeys).toEqual(["evt-1"]);
  });

  test("ADLS-BRIDGE-003: switch-profile and shutdown requests update runtime state and clear bridge keys", async () => {
    const module = await loadBridgeModule();

    await sendBridgeRequest({
      action: "caption",
      payload: {
        stableKey: "evt-keep",
        speaker: "Participant",
        text: "Let's keep this key around before shutdown.",
      },
    });

    const switchResponse = await sendBridgeRequest({
      action: "switch-profile",
      payload: {
        profileId: "client_call",
        assistantEnabled: false,
      },
    });

    expect(switchResponse.ok).toBe(true);
    expect(mocks.setCurrentSessionMeetingProfileMock).toHaveBeenCalledWith(
      "client_call"
    );
    expect(mocks.setCurrentSessionAssistantEnabledMock).toHaveBeenCalledWith(false);

    const shutdownResponse = await sendBridgeRequest({ action: "shutdown" });
    expect(shutdownResponse.ok).toBe(true);
    expect(mocks.teardownPlatformRuntimeMock).toHaveBeenCalledTimes(1);
    expect(
      module.assistantDlsCaptureBridgeInternals.buildBridgeSnapshot().fixtureKeys
    ).toEqual([]);
  });

  test("ADLS-BRIDGE-004: invalid capture requests and missing providers surface deterministic bridge errors", async () => {
    await loadBridgeModule();

    const missingStableKey = await sendBridgeRequest({
      action: "caption",
      payload: {
        speaker: "Participant",
        text: "This payload is missing a stable key.",
      },
    });
    expect(missingStableKey.ok).toBe(false);
    expect(missingStableKey.error).toBe(
      "Assistant DLS capture requires payload.stableKey."
    );

    mocks.getCurrentSessionSnapshotMock.mockReturnValue(null);
    const ensureCapture = await sendBridgeRequest({ action: "ensure-capture" });
    expect(ensureCapture.ok).toBe(false);
    expect(ensureCapture.error).toBe(
      "No active meeting provider could be resolved for assistant DLS capture."
    );
  });
});
