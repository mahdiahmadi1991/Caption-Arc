import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import { planMeetingSummaryExecution } from "../../entrypoints/shared/summary-generation";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";

const {
  getSettingsMock,
  getStoredMeetingSessionRecordMock,
  putStoredMeetingSessionRecordMock,
  generateTextMock,
  generateTextChunkMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  getStoredMeetingSessionRecordMock: vi.fn(),
  putStoredMeetingSessionRecordMock: vi.fn(),
  generateTextMock: vi.fn(),
  generateTextChunkMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("../../entrypoints/background/history-db", () => ({
  clearStoredMeetingSessionRecords: vi.fn(),
  deleteStoredMeetingSessionRecord: vi.fn(),
  enforceMeetingHistoryRetentionPolicy: vi.fn(async () => ({ deletedSessionIds: [] })),
  estimateMeetingHistoryBytes: vi.fn(async () => 0),
  findLatestStoredMeetingSessionRecordByFingerprint: vi.fn(async () => null),
  getStoredMeetingSessionRecord: getStoredMeetingSessionRecordMock,
  listStoredMeetingSessionIndexRecords: vi.fn(async () => []),
  listStoredMeetingSessionRecords: vi.fn(async () => []),
  putStoredMeetingSessionRecord: putStoredMeetingSessionRecordMock,
}));

vi.mock("../../entrypoints/background/translation", () => ({
  generateText: generateTextMock,
  generateTextChunk: generateTextChunkMock,
  translate: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteMeetingArchiveCleared: vi.fn(async () => undefined),
  noteMeetingSessionDeleted: vi.fn(async () => undefined),
  noteMeetingSessionSaved: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/background/assistant", () => ({
  clearMeetingAssistantRuntimeState: vi.fn(),
  queueMeetingAssistantProcessing: vi.fn(),
}));

vi.mock("../../entrypoints/background/diagnostics", () => ({
  createBackgroundDiagnosticsLogger: vi.fn(() => ({
    trace: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
  })),
}));

import { historySummaryInternals } from "../../entrypoints/background/history";

function createSession(
  overrides: Partial<MeetingSession> = {},
  captionCount = 2,
  captionLength = 60
): MeetingSession {
  const now = Date.now();
  const text = "x".repeat(captionLength);
  return {
    id: "session-1",
    sessionSyncId: "session-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    title: "Team Sync",
    starred: false,
    identifiers: { meetingCode: "abc-defg-hij" },
    sessionFingerprint: "fp-1",
    lifecycleState: "ended",
    startTime: now - 500_000,
    endTime: now - 1_000,
    lastSeenAt: now - 1_000,
    updatedAt: now - 1_000,
    searchableText: "",
    events: Array.from({ length: captionCount }).map((_, index) => ({
      source: "caption" as const,
      speaker: "Speaker",
      text: `${text}-${index}`,
      time: "10:00",
      timestamp: now - 50_000 + index * 1000,
      sessionOffsetMs: index * 1000,
      isFinal: true,
      stableEventKey: `ev-${index}`,
    })),
    captions: Array.from({ length: captionCount }).map((_, index) => ({
      speaker: "Speaker",
      text: `${text}-${index}`,
      time: "10:00",
      timestamp: now - 50_000 + index * 1000,
      sessionOffsetMs: index * 1000,
      isFinal: true,
      stableEventKey: `ev-${index}`,
    })),
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
    ...overrides,
  };
}

function installChromeRuntime() {
  const storageState: Record<string, unknown> = {};
  const alarmsCreate = vi.fn(async () => undefined);
  const alarmsClear = vi.fn(async () => true);

  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storageState[key] })),
        set: vi.fn(async (payload: Record<string, unknown>) => {
          Object.assign(storageState, payload);
        }),
      },
    },
    alarms: {
      create: alarmsCreate,
      clear: alarmsClear,
    },
    runtime: {
      sendMessage: vi.fn(async () => ({ success: true })),
    },
  });

  return { storageState, alarmsCreate, alarmsClear };
}

beforeEach(() => {
  vi.clearAllMocks();
  const defaults = createDefaultSettings();
  getSettingsMock.mockResolvedValue({
    settings: {
      ...defaults,
      summaryLanguage: "fa",
      defaultSummaryProfileId: defaults.summaryProfiles[0]?.id,
      summaryProfiles: defaults.summaryProfiles.map((profile) => ({
        ...profile,
        autoSummarizeOnMeetingEnd: true,
        summaryGenerationMode: "balanced",
      })),
      model: "gpt-5-mini",
      connectedCloudProviders: [],
    },
  });
  putStoredMeetingSessionRecordMock.mockResolvedValue(undefined);
  historySummaryInternals.resetMeetingSummaryInternalsForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Meeting summary pipeline contract", () => {
  test("MSUM-001: queue persistence is per-session with bounded retries and earliest retry alarm", async () => {
    const { alarmsCreate } = installChromeRuntime();
    await historySummaryInternals.queueMeetingSummaryJob(
      {
        sessionId: "session-1",
        targetLanguage: "fa",
        profileId: "default",
      },
      "automatic"
    );
    await historySummaryInternals.queueMeetingSummaryJob(
      {
        sessionId: "session-1",
        targetLanguage: "fa",
        profileId: "default",
      },
      "automatic"
    );

    const jobs = await historySummaryInternals.loadPersistedMeetingSummaryJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.maxAttempts).toBe(3);

    await historySummaryInternals.savePersistedMeetingSummaryJobs([
      {
        ...jobs[0]!,
        retryAfter: Date.now() + 10_000,
      },
      {
        ...jobs[0]!,
        request: { ...jobs[0]!.request, sessionId: "session-2" },
        retryAfter: Date.now() + 2_000,
      },
    ]);
    await historySummaryInternals.scheduleMeetingSummaryRetryAlarm();

    expect(alarmsCreate).toHaveBeenCalledWith(
      "meeting-summary-job-retry",
      expect.objectContaining({ when: expect.any(Number) })
    );
    const when = alarmsCreate.mock.calls[0]?.[1]?.when as number;
    expect(when).toBeLessThanOrEqual(Date.now() + 2_500);
  });

  test("MSUM-002: automatic summary gating requires ended sessions, content, and enabled profile", () => {
    const defaults = createDefaultSettings();
    const settings = {
      ...defaults,
      summaryLanguage: "fa",
      summaryProfiles: defaults.summaryProfiles.map((profile) => ({
        ...profile,
        autoSummarizeOnMeetingEnd: true,
      })),
      defaultSummaryProfileId: defaults.summaryProfiles[0]?.id,
    };
    const endedWithContent = createSession({}, 1, 40);
    const request = historySummaryInternals.getAutomaticSummaryRequest(
      endedWithContent,
      settings as never
    );
    expect(request).toEqual({
      sessionId: "session-1",
      targetLanguage: "fa",
      profileId: settings.defaultSummaryProfileId,
    });

    const liveSession = createSession({ endTime: undefined, lifecycleState: "live" }, 1, 40);
    expect(
      historySummaryInternals.getAutomaticSummaryRequest(liveSession, settings as never)
    ).toBeNull();

    const emptyContent = createSession({ captions: [], chatMessages: [] }, 0, 0);
    expect(
      historySummaryInternals.getAutomaticSummaryRequest(emptyContent, settings as never)
    ).toBeNull();
  });

  test("MSUM-003: summary planning picks strategy by weighted source and instruction size", () => {
    const lowRiskPlan = planMeetingSummaryExecution(createSession({}, 1, 20), "short", "balanced");
    expect(lowRiskPlan.strategy).toBe("single_shot");

    const highRiskPlan = planMeetingSummaryExecution(
      createSession({}, 120, 180),
      "extensive instructions ".repeat(80),
      "balanced"
    );
    expect(highRiskPlan.strategy).toBe("multi_stage");
    expect(highRiskPlan.riskLevel).toBe("high");
  });

  test("MSUM-004: long summaries continue segment-by-segment and reconcile final draft", async () => {
    installChromeRuntime();
    historySummaryInternals.setActiveMeetingSummaryJobForTests("session-continue");

    generateTextChunkMock
      .mockResolvedValueOnce({ success: true, text: "segment-1", truncated: true })
      .mockResolvedValueOnce({ success: true, text: "segment-2", truncated: false });
    generateTextMock.mockResolvedValueOnce({
      success: true,
      text: "reconciled-final",
    });

    const response = await historySummaryInternals.generateMeetingSummaryText(
      "session-continue",
      "base prompt",
      "fa",
      true
    );

    expect(response).toEqual({
      success: true,
      text: "reconciled-final",
      continuationCount: 1,
      reconciled: true,
    });
    historySummaryInternals.clearActiveMeetingSummaryJobForTests("session-continue");
  });

  test("MSUM-005: execution path uses direct prompts for small sessions and evidence extraction for large sessions", async () => {
    installChromeRuntime();
    const smallSession = createSession({}, 2, 40);
    const largeSession = createSession({}, 120, 180);

    generateTextChunkMock.mockImplementation(async (prompt: string) => {
      if (prompt.includes("Return valid JSON only with this exact shape")) {
        return {
          success: true,
          text: JSON.stringify({
            facts: ["fact"],
            decisions: [],
            actionItems: [],
            risks: [],
            openQuestions: [],
            notableDetails: [],
            snippets: [],
            speakerSignals: [],
          }),
          truncated: false,
        };
      }
      return { success: true, text: "summary-output", truncated: false };
    });
    generateTextMock.mockResolvedValue({
      success: true,
      text: "summary-output",
    });

    getStoredMeetingSessionRecordMock.mockResolvedValueOnce(smallSession);
    const smallResult = await historySummaryInternals.runMeetingSummaryJob(
      {
        sessionId: smallSession.id,
        targetLanguage: "fa",
        profileId: createDefaultSettings().summaryProfiles[0]!.id,
      },
      "manual"
    );
    expect(smallResult.success).toBe(true);
    expect(
      generateTextChunkMock.mock.calls.some((call) =>
        String(call[0]).includes("extracting structured evidence")
      )
    ).toBe(false);

    generateTextChunkMock.mockClear();
    getStoredMeetingSessionRecordMock.mockResolvedValueOnce(largeSession);
    const largeResult = await historySummaryInternals.runMeetingSummaryJob(
      {
        sessionId: largeSession.id,
        targetLanguage: "fa",
        profileId: "default",
      },
      "manual"
    );
    expect(largeResult.success).toBe(true);
    expect(
      generateTextChunkMock.mock.calls.some((call) =>
        String(call[0]).includes("extracting structured evidence")
      )
    ).toBe(true);
    expect(putStoredMeetingSessionRecordMock).toHaveBeenCalled();
  });
});
