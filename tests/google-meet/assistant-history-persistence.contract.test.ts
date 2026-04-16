import { beforeEach, describe, expect, test, vi } from "vitest";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

const {
  getSettingsMock,
  getStoredMeetingSessionRecordMock,
  putStoredMeetingSessionRecordMock,
  noteMeetingSessionSavedMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  getStoredMeetingSessionRecordMock: vi.fn(),
  putStoredMeetingSessionRecordMock: vi.fn(),
  noteMeetingSessionSavedMock: vi.fn(),
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
  generateText: vi.fn(),
  generateTextChunk: vi.fn(),
  translate: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteMeetingArchiveCleared: vi.fn(async () => undefined),
  noteMeetingSessionDeleted: vi.fn(async () => undefined),
  noteMeetingSessionSaved: noteMeetingSessionSavedMock,
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

import {
  historySummaryInternals,
  saveMeetingSession,
  storeMeetingSessionShell,
  updateMeetingSession,
} from "../../entrypoints/background/history";

function createSession(overrides: Partial<MeetingSession> = {}): MeetingSession {
  const now = Date.now();
  return {
    id: "session-1",
    sessionSyncId: "session-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Interview",
    starred: false,
    identifiers: { meetingCode: "xxx-xxxx-xxx" },
    lifecycleState: "live",
    startTime: now - 60_000,
    lastSeenAt: now - 1_000,
    updatedAt: now - 1_000,
    searchableText: "",
    events: [
      {
        eventId: "evt-1",
        stableEventKey: "stable-evt-1",
        source: "caption",
        speaker: "Interviewer",
        text: "Why do you want this job?",
        time: "10:00",
        timestamp: now - 10_000,
        sessionOffsetMs: 1_000,
        isFinal: true,
      },
    ],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getSettingsMock.mockResolvedValue({
    settings: {
      ...createDefaultSettings(),
      deviceId: "device-1",
      connectedCloudProviders: [],
      meetingArchiveRetentionDays: 0,
    },
  });
  noteMeetingSessionSavedMock.mockResolvedValue(undefined);
  putStoredMeetingSessionRecordMock.mockResolvedValue(undefined);
});

describe("Assistant history persistence contract", () => {
  test("mergeMeetingSessionArtifacts preserves existing assistant artifacts when incoming session omits them", () => {
    const existingSession = createSession({
      artifacts: {
        summaries: {},
        assistantOutputs: {
          "stable-evt-1": {
            id: "assistant-1",
            triggerEventId: "evt-1",
            triggerStableEventKey: "stable-evt-1",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "Why do you want this job?",
            triggerTimestamp: 1_000,
            profileId: "interview",
            content: "The role matches my backend experience.",
            createdAt: 2_000,
            provider: "openai",
            model: "gpt-5-mini",
          },
        },
        assistantMemory: {
          updatedAt: 5_000,
          content: "Previously answered prompts:\n- Why do you want this job?",
        },
        assistantState: {
          enabled: true,
          updatedAt: 7_000,
        },
      },
    });
    const incomingSession = createSession({
      artifacts: {
        summaries: {},
      },
    });

    const merged = historySummaryInternals.mergeMeetingSessionArtifacts(
      existingSession,
      incomingSession
    );

    expect(merged.assistantOutputs).toEqual(existingSession.artifacts?.assistantOutputs);
    expect(merged.assistantMemory).toEqual(existingSession.artifacts?.assistantMemory);
    expect(merged.assistantState).toEqual(existingSession.artifacts?.assistantState);
  });

  test("saveMeetingSession keeps stored assistant outputs when the incoming session carries stale empty artifacts", async () => {
    const existingSession = createSession({
      artifacts: {
        summaries: {},
        assistantOutputs: {
          "stable-evt-1": {
            id: "assistant-1",
            triggerEventId: "evt-1",
            triggerStableEventKey: "stable-evt-1",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "Why do you want this job?",
            triggerTimestamp: 1_000,
            profileId: "interview",
            content: "The role matches my backend experience.",
            createdAt: 2_000,
            provider: "openai",
            model: "gpt-5-mini",
          },
        },
        assistantState: {
          enabled: true,
          updatedAt: 5_000,
        },
      },
    });
    getStoredMeetingSessionRecordMock.mockResolvedValue(existingSession);

    await saveMeetingSession(
      createSession({
        artifacts: {
          summaries: {},
        },
      })
    );

    expect(putStoredMeetingSessionRecordMock).toHaveBeenCalledTimes(1);
    const savedSession = putStoredMeetingSessionRecordMock.mock.calls[0][0] as MeetingSession;
    expect(savedSession.artifacts?.assistantOutputs).toEqual(
      existingSession.artifacts?.assistantOutputs
    );
    expect(savedSession.artifacts?.assistantState).toEqual(
      existingSession.artifacts?.assistantState
    );
  });

  test("storeMeetingSessionShell keeps stored assistant artifacts instead of dropping them during shell refresh", async () => {
    const existingSession = createSession({
      artifacts: {
        summaries: {},
        assistantOutputs: {
          "stable-evt-1": {
            id: "assistant-1",
            triggerEventId: "evt-1",
            triggerStableEventKey: "stable-evt-1",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "Why do you want this job?",
            triggerTimestamp: 1_000,
            profileId: "interview",
            content: "The role matches my backend experience.",
            createdAt: 2_000,
            provider: "openai",
            model: "gpt-5-mini",
          },
        },
        assistantMemory: {
          updatedAt: 5_000,
          content: "Previously answered prompts:\n- Why do you want this job?",
        },
      },
    });
    getStoredMeetingSessionRecordMock.mockResolvedValue(existingSession);

    await storeMeetingSessionShell(
      createSession({
        events: [],
        artifacts: {
          summaries: {},
        },
      })
    );

    expect(putStoredMeetingSessionRecordMock).toHaveBeenCalledTimes(1);
    const savedSession = putStoredMeetingSessionRecordMock.mock.calls[0][0] as MeetingSession;
    expect(savedSession.artifacts?.assistantOutputs).toEqual(
      existingSession.artifacts?.assistantOutputs
    );
    expect(savedSession.artifacts?.assistantMemory).toEqual(
      existingSession.artifacts?.assistantMemory
    );
  });

  test("saveMeetingSession preserves an explicitly switched session profile instead of restoring the stale content profile", async () => {
    const existingSession = createSession({
      meetingProfileId: "client_call",
    });
    getStoredMeetingSessionRecordMock.mockResolvedValue(existingSession);

    await saveMeetingSession(
      createSession({
        meetingProfileId: "interview",
        artifacts: {
          summaries: {},
        },
      })
    );

    expect(putStoredMeetingSessionRecordMock).toHaveBeenCalledTimes(1);
    const savedSession = putStoredMeetingSessionRecordMock.mock.calls[0][0] as MeetingSession;
    expect(savedSession.meetingProfileId).toBe("client_call");
  });

  test("updateMeetingSession allows switching the persisted session profile mid-session", async () => {
    const existingSession = createSession({
      meetingProfileId: "interview",
    });
    getStoredMeetingSessionRecordMock.mockResolvedValue(existingSession);

    await updateMeetingSession(existingSession.id, {
      meetingProfileId: "client_call",
    });

    expect(putStoredMeetingSessionRecordMock).toHaveBeenCalledTimes(1);
    const savedSession = putStoredMeetingSessionRecordMock.mock.calls[0][0] as MeetingSession;
    expect(savedSession.meetingProfileId).toBe("client_call");
  });
});
