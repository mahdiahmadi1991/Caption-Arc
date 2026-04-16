import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type {
  FindMeetingSessionContinuationCandidateRequest,
  MeetingSession,
  ResolveMeetingSessionRequest,
} from "../../entrypoints/background/types";

const {
  getSettingsMock,
  findLatestStoredByFingerprintMock,
  getStoredMeetingSessionRecordMock,
  listStoredMeetingSessionIndexRecordsMock,
  putStoredMeetingSessionRecordMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  findLatestStoredByFingerprintMock: vi.fn(),
  getStoredMeetingSessionRecordMock: vi.fn(),
  listStoredMeetingSessionIndexRecordsMock: vi.fn(),
  putStoredMeetingSessionRecordMock: vi.fn(),
}));

const {
  forceResolveActivePromptMock,
  requestCaptureConsentMock,
  requestSessionContinuationDecisionMock,
  requestSessionEndedDecisionMock,
} = vi.hoisted(() => ({
  forceResolveActivePromptMock: vi.fn(),
  requestCaptureConsentMock: vi.fn(),
  requestSessionContinuationDecisionMock: vi.fn(),
  requestSessionEndedDecisionMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("../../entrypoints/background/history-db", () => ({
  clearStoredMeetingSessionRecords: vi.fn(),
  deleteStoredMeetingSessionRecord: vi.fn(),
  enforceMeetingHistoryRetentionPolicy: vi.fn(async () => ({ deletedSessionIds: [] })),
  estimateMeetingHistoryBytes: vi.fn(async () => 0),
  findLatestStoredMeetingSessionRecordByFingerprint:
    findLatestStoredByFingerprintMock,
  getStoredMeetingSessionRecord: getStoredMeetingSessionRecordMock,
  listStoredMeetingSessionIndexRecords: listStoredMeetingSessionIndexRecordsMock,
  listStoredMeetingSessionRecords: vi.fn(async () => []),
  putStoredMeetingSessionRecord: putStoredMeetingSessionRecordMock,
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteMeetingArchiveCleared: vi.fn(async () => undefined),
  noteMeetingSessionDeleted: vi.fn(async () => undefined),
  noteMeetingSessionSaved: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/background/assistant", () => ({
  clearMeetingAssistantRuntimeState: vi.fn(async () => undefined),
  queueMeetingAssistantProcessing: vi.fn(() => undefined),
}));

vi.mock(
  "../../entrypoints/content/overlay/capture-consent",
  async (importOriginal) => {
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
  }
);

import {
  findMeetingSessionContinuationCandidate,
  resolveMeetingSession,
} from "../../entrypoints/background/history";
import type { MeetingProvider } from "../../entrypoints/content/providers/types";

function createSession(
  overrides: Partial<MeetingSession> = {},
  now = Date.now()
): MeetingSession {
  return {
    id: "session-default",
    sessionSyncId: "session-default",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Daily Sync",
    starred: false,
    identifiers: {
      meetingId: "id-default",
    },
    sessionFingerprint: "fp-default",
    lifecycleState: "ended",
    lastSeenAt: now - 60_000,
    updatedAt: now - 60_000,
    searchableText: "",
    startTime: now - 120_000,
    endTime: now - 60_000,
    events: [],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
    ...overrides,
  };
}

function createContinuationRequest(
  overrides: Partial<FindMeetingSessionContinuationCandidateRequest> = {}
): FindMeetingSessionContinuationCandidateRequest {
  return {
    platform: "google-meet",
    providerLabel: "Google Meet",
    sourceUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Daily Sync",
    identifiers: { meetingId: "shared-42" },
    ...overrides,
  };
}

function createResolveRequest(
  overrides: Partial<ResolveMeetingSessionRequest> = {}
): ResolveMeetingSessionRequest {
  return {
    platform: "google-meet",
    providerLabel: "Google Meet",
    sourceUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Daily Sync",
    identifiers: { meetingId: "shared-42" },
    reusePolicy: "default",
    ...overrides,
  };
}

async function loadPlatformRuntimeModule() {
  vi.resetModules();
  return await import("../../entrypoints/content/platform-runtime");
}

function createRuntimeProvider(
  overrides: Partial<MeetingProvider> = {}
): MeetingProvider {
  const metadata = {
    platform: "google-meet" as const,
    providerLabel: "Google Meet",
    sourceUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Daily Sync",
    identifiers: {
      meetingId: "shared-42",
    },
  };

  let meetingPresence = overrides.getMeetingPresence?.() ?? "prejoin";

  return {
    platform: "google-meet",
    matchesUrl: () => true,
    matchesPageContext: () => true,
    bootstrap: () => undefined,
    getMeetingPresence: () => meetingPresence,
    startCaptionObserver: () => () => undefined,
    getSessionMetadata: () => metadata,
    getEmptyState: () => ({ waitingTitle: "", waitingBody: "" }),
    getCaptureGuide: () => ({ modalTitle: "", modalBody: "", steps: [] }),
    isCaptioningCurrentlyAvailable: () => true,
    ...overrides,
    __setPresenceForTests(nextPresence: "prejoin" | "joined" | "ended" | "unknown") {
      meetingPresence = nextPresence;
    },
  } as MeetingProvider;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-09T10:00:00.000Z"));

  getSettingsMock.mockResolvedValue({
    settings: {
      sessionContinuationWindowMinutes: 30,
    },
  });

  findLatestStoredByFingerprintMock.mockResolvedValue(null);
  getStoredMeetingSessionRecordMock.mockResolvedValue(null);
  listStoredMeetingSessionIndexRecordsMock.mockResolvedValue([]);
  putStoredMeetingSessionRecordMock.mockResolvedValue(undefined);
  forceResolveActivePromptMock.mockReset();
  requestCaptureConsentMock.mockReset();
  requestSessionContinuationDecisionMock.mockReset();
  requestSessionEndedDecisionMock.mockReset();
  requestCaptureConsentMock.mockResolvedValue("approved");
  requestSessionContinuationDecisionMock.mockResolvedValue("restart");
  requestSessionEndedDecisionMock.mockResolvedValue("stay");
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));

  const sendMessageMock = vi.fn(async (message: { action?: string; sessionId?: string }) => {
    if (message.action === "getMeetingSession" && message.sessionId) {
      return {
        success: true,
        session: createSession({
          id: message.sessionId,
          identifiers: { meetingId: "shared-42" },
          events: [],
          captions: [],
          chatMessages: [],
          summaries: {},
          artifacts: { summaries: {} },
        }),
      };
    }

    if (message.action === "findMeetingSessionContinuationCandidate") {
      return { success: true, candidate: null };
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
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Runtime session continuation contract", () => {
  test("RCONT-001: Teams direct-call requests are continuation-ineligible in candidate lookup and session resolution", async () => {
    const directCallCandidate = await findMeetingSessionContinuationCandidate(
      createContinuationRequest({
        platform: "microsoft-teams",
        providerLabel: "Microsoft Teams Web",
        sourceUrl: "https://teams.live.com/v2/",
        identifiers: { callType: "direct-call" },
      })
    );

    expect(directCallCandidate.success).toBe(true);
    expect(directCallCandidate.candidate).toBeNull();
    expect(findLatestStoredByFingerprintMock).not.toHaveBeenCalled();

    const directCallResolved = await resolveMeetingSession(
      createResolveRequest({
        platform: "microsoft-teams",
        providerLabel: "Microsoft Teams Web",
        sourceUrl: "https://teams.live.com/v2/",
        identifiers: { callType: "direct-call" },
        reusePolicy: "force-reuse",
        resumeSessionId: "session-legacy",
      })
    );

    expect(directCallResolved.success).toBe(true);
    expect(directCallResolved.reused).toBe(false);
    expect(directCallResolved.session?.identifiers.callType).toBe("direct-call");
    expect(getStoredMeetingSessionRecordMock).not.toHaveBeenCalled();
  });

  test("RCONT-006: fallback ranking prefers stable identity matches over URL/title heuristics", async () => {
    const now = Date.now();
    const sameUrlFallback = createSession({
      id: "session-url-fallback",
      identifiers: {},
      meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
      title: "Daily Sync",
      startTime: now - 300_000,
      endTime: now - 120_000,
      lastSeenAt: now - 120_000,
    });
    const stableIdentityCandidate = createSession({
      id: "session-stable-identity",
      identifiers: { meetingId: "shared-42" },
      meetingUrl: "https://meet.google.com/other-room",
      title: "Another title",
      startTime: now - 900_000,
      endTime: now - 180_000,
      lastSeenAt: now - 180_000,
    });

    listStoredMeetingSessionIndexRecordsMock.mockResolvedValue([
      sameUrlFallback,
      stableIdentityCandidate,
    ]);

    const result = await findMeetingSessionContinuationCandidate(
      createContinuationRequest()
    );

    expect(result.success).toBe(true);
    expect(result.candidate?.sessionId).toBe("session-stable-identity");
  });

  test("RCONT-007: live stored sessions are rejected as continuation candidates", async () => {
    const liveSession = createSession({
      id: "session-live",
      lifecycleState: "live",
      endTime: undefined,
      identifiers: { meetingId: "shared-42" },
    });
    findLatestStoredByFingerprintMock.mockResolvedValue(liveSession);

    const result = await findMeetingSessionContinuationCandidate(
      createContinuationRequest()
    );

    expect(result.success).toBe(true);
    expect(result.candidate).toBeNull();
  });

  test("RCONT-008: force-reuse resumes ended session and appends rejoinHistory", async () => {
    const previousEnd = Date.now() - 120_000;
    const storedEndedSession = createSession({
      id: "session-ended",
      identifiers: { meetingId: "shared-42" },
      lifecycleState: "ended",
      endTime: previousEnd,
      lastSeenAt: previousEnd,
      rejoinHistory: [],
    });
    getStoredMeetingSessionRecordMock.mockResolvedValue(storedEndedSession);

    const result = await resolveMeetingSession(
      createResolveRequest({
        reusePolicy: "force-reuse",
        resumeSessionId: "session-ended",
      })
    );

    expect(result.success).toBe(true);
    expect(result.reused).toBe(true);
    expect(result.session?.lifecycleState).toBe("reopened");
    expect(result.session?.endTime).toBeUndefined();
    expect(result.session?.rejoinHistory?.length).toBe(1);
    expect(result.session?.rejoinHistory?.[0]?.previousEndTime).toBe(previousEnd);
    expect(result.session?.rejoinHistory?.[0]?.resumedAt).toBe(Date.now());
    expect(result.session?.rejoinHistory?.[0]?.gapMs).toBeGreaterThanOrEqual(0);
    expect(putStoredMeetingSessionRecordMock).toHaveBeenCalledTimes(1);
  });
});

describe("Runtime session continuation contract (content runtime)", () => {
  test("RCONT-002: startup continuation lookup retries Teams pages without stable identifiers for up to 2500ms", async () => {
    const sendMessageMock = vi.mocked(chrome.runtime.sendMessage);
    sendMessageMock.mockResolvedValue({
      success: true,
      candidate: null,
    });

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const provider = createRuntimeProvider({
      platform: "microsoft-teams",
      getSessionMetadata: () => ({
        platform: "microsoft-teams",
        providerLabel: "Microsoft Teams Web",
        sourceUrl: "https://teams.live.com/v2/",
        title: "Teams Meeting",
        identifiers: {
          callType: "scheduled-meeting",
        },
      }),
    });

    const lookupPromise =
      platformRuntimeInternals.getPersistedContinuationCandidateWithRetry(provider);
    await vi.advanceTimersByTimeAsync(2600);

    await expect(lookupPromise).resolves.toBeNull();
    const continuationCalls = sendMessageMock.mock.calls.filter(
      ([message]) =>
        (message as { action?: string }).action ===
        "findMeetingSessionContinuationCandidate"
    );
    expect(continuationCalls.length).toBe(6);
  });

  test("RCONT-003: startup continuation resume sets pending force-reuse options and loads stored preview", async () => {
    const sendMessageMock = vi.mocked(chrome.runtime.sendMessage);
    sendMessageMock.mockImplementation(
      async (message: { action?: string; sessionId?: string }) => {
        if (message.action === "findMeetingSessionContinuationCandidate") {
          return {
            success: true,
            candidate: {
              sessionId: "session-resume",
              providerLabel: "Google Meet",
              endedAt: Date.now() - 120_000,
            },
          };
        }
        if (message.action === "getMeetingSession") {
          return {
            success: true,
            session: createSession({
              id: "session-resume",
              identifiers: { meetingId: "shared-42" },
              events: [],
              captions: [],
              chatMessages: [],
            }),
          };
        }
        return { success: true };
      }
    );
    requestSessionContinuationDecisionMock.mockResolvedValue("resume");

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const provider = createRuntimeProvider();
    await platformRuntimeInternals.prepareMeetingStartupDecision(provider);

    const state = platformRuntimeInternals.getRuntimeStateForTests();
    expect(state.pendingSessionResolveOptions).toEqual({
      reusePolicy: "force-reuse",
      resumeSessionId: "session-resume",
    });
    expect(state.captureApprovedForLifecycle).toBe(true);
    expect(requestSessionContinuationDecisionMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "getMeetingSession",
        sessionId: "session-resume",
      })
    );
  });

  test("RCONT-004: prejoin continuation prompt sets pending force-reuse or force-new options", async () => {
    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const provider = createRuntimeProvider();
    platformRuntimeInternals.setRuntimeStateForTests({
      meetingPresenceState: "prejoin",
      recentlyEndedSession: {
        sessionId: "session-recent",
        endedAt: Date.now() - 5_000,
      },
      pendingSessionResolveOptions: undefined,
      sessionContinuationDecisionPending: false,
    });

    requestSessionContinuationDecisionMock.mockResolvedValueOnce("resume");
    await platformRuntimeInternals.handleSessionContinuationDecision(provider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().pendingSessionResolveOptions).toEqual(
      {
        reusePolicy: "force-reuse",
        resumeSessionId: "session-recent",
      }
    );

    platformRuntimeInternals.setRuntimeStateForTests({
      meetingPresenceState: "prejoin",
      recentlyEndedSession: {
        sessionId: "session-recent-2",
        endedAt: Date.now() - 5_000,
      },
      pendingSessionResolveOptions: undefined,
      sessionContinuationDecisionPending: false,
    });
    requestSessionContinuationDecisionMock.mockResolvedValueOnce("restart");
    await platformRuntimeInternals.handleSessionContinuationDecision(provider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().pendingSessionResolveOptions).toEqual(
      {
        reusePolicy: "force-new",
      }
    );
  });

  test("RCONT-005: session-start option resolution consumes pending options before recent-session prompts", async () => {
    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const provider = createRuntimeProvider();

    platformRuntimeInternals.setRuntimeStateForTests({
      pendingSessionResolveOptions: {
        reusePolicy: "force-reuse",
        resumeSessionId: "session-pending",
      },
      recentlyEndedSession: {
        sessionId: "session-recent",
        endedAt: Date.now() - 1_000,
      },
    });

    const resolved = await platformRuntimeInternals.resolveSessionStartOptions(provider);
    expect(resolved).toEqual({
      reusePolicy: "force-reuse",
      resumeSessionId: "session-pending",
    });
    const state = platformRuntimeInternals.getRuntimeStateForTests();
    expect(state.pendingSessionResolveOptions).toBeUndefined();
    expect(state.recentlyEndedSession).toBeNull();
    expect(requestSessionContinuationDecisionMock).not.toHaveBeenCalled();
  });

  test("RCONT-010: Teams direct-call continuation paths force new-session options and clear pending prompts", async () => {
    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const directCallProvider = createRuntimeProvider({
      platform: "microsoft-teams",
      getSessionMetadata: () => ({
        platform: "microsoft-teams",
        providerLabel: "Microsoft Teams Web",
        sourceUrl: "https://teams.live.com/v2/",
        title: "Direct call",
        identifiers: {
          callType: "direct-call",
        },
      }),
    });

    platformRuntimeInternals.setRuntimeStateForTests({
      meetingPresenceState: "prejoin",
      recentlyEndedSession: {
        sessionId: "session-direct",
        endedAt: Date.now() - 2_000,
      },
      pendingSessionResolveOptions: {
        reusePolicy: "force-reuse",
        resumeSessionId: "session-direct",
      },
    });
    await platformRuntimeInternals.handleSessionContinuationDecision(directCallProvider);
    expect(platformRuntimeInternals.getRuntimeStateForTests().recentlyEndedSession).toBeNull();
    expect(
      platformRuntimeInternals.getRuntimeStateForTests().pendingSessionResolveOptions
    ).toBeUndefined();

    const startOptions =
      await platformRuntimeInternals.resolveSessionStartOptions(directCallProvider);
    expect(startOptions).toEqual({ reusePolicy: "force-new" });
    expect(requestSessionContinuationDecisionMock).not.toHaveBeenCalled();
  });

  test("RCONT-011: startup continuation falls back to capture consent when no continuation candidate exists", async () => {
    const sendMessageMock = vi.mocked(chrome.runtime.sendMessage);
    sendMessageMock.mockResolvedValue({
      success: true,
      candidate: null,
    });
    requestCaptureConsentMock.mockResolvedValue("approved");

    const { platformRuntimeInternals } = await loadPlatformRuntimeModule();
    const provider = createRuntimeProvider();
    await platformRuntimeInternals.prepareMeetingStartupDecision(provider);

    const state = platformRuntimeInternals.getRuntimeStateForTests();
    expect(requestCaptureConsentMock).toHaveBeenCalledTimes(1);
    expect(state.captureApprovedForLifecycle).toBe(true);
    expect(state.captureBlockedForLifecycle).toBe(false);
    expect(state.pendingSessionResolveOptions).toBeUndefined();
  });
});
