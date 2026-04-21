import { beforeEach, describe, expect, test, vi } from "vitest";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

const {
  getSettingsMock,
  getStoredMeetingSessionRecordMock,
  putStoredMeetingSessionRecordMock,
  enforceMeetingHistoryRetentionPolicyMock,
  generateTextMock,
  noteMeetingSessionSavedMock,
  noteMeetingSessionDeletedMock,
  clearMeetingAssistantRuntimeStateMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  getStoredMeetingSessionRecordMock: vi.fn(),
  putStoredMeetingSessionRecordMock: vi.fn(),
  enforceMeetingHistoryRetentionPolicyMock: vi.fn(),
  generateTextMock: vi.fn(),
  noteMeetingSessionSavedMock: vi.fn(),
  noteMeetingSessionDeletedMock: vi.fn(),
  clearMeetingAssistantRuntimeStateMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("../../entrypoints/background/history-db", () => ({
  clearStoredMeetingSessionRecords: vi.fn(),
  deleteStoredMeetingSessionRecord: vi.fn(),
  enforceMeetingHistoryRetentionPolicy: enforceMeetingHistoryRetentionPolicyMock,
  estimateMeetingHistoryBytes: vi.fn(async () => 0),
  findLatestStoredMeetingSessionRecordByFingerprint: vi.fn(async () => null),
  getStoredMeetingSessionRecord: getStoredMeetingSessionRecordMock,
  listStoredMeetingSessionIndexRecords: vi.fn(async () => []),
  listStoredMeetingSessionRecords: vi.fn(async () => []),
  putStoredMeetingSessionRecord: putStoredMeetingSessionRecordMock,
}));

vi.mock("../../entrypoints/background/translation", () => ({
  generateText: generateTextMock,
  generateTextChunk: vi.fn(),
  translate: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteMeetingArchiveCleared: vi.fn(async () => undefined),
  noteMeetingSessionDeleted: noteMeetingSessionDeletedMock,
  noteMeetingSessionSaved: noteMeetingSessionSavedMock,
}));

vi.mock("../../entrypoints/background/assistant", () => ({
  clearMeetingAssistantRuntimeState: clearMeetingAssistantRuntimeStateMock,
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
  saveMeetingSession,
  translateSessionCaptions,
} from "../../entrypoints/background/history";

function createSession(overrides: Partial<MeetingSession> = {}): MeetingSession {
  const now = Date.now();
  return {
    id: "session-1",
    sessionSyncId: "sync-session-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Daily Sync",
    starred: false,
    identifiers: { meetingCode: "xxx-xxxx-xxx" },
    sessionFingerprint: "fp-1",
    lifecycleState: "ended",
    startTime: now - 10_000,
    endTime: now - 1_000,
    lastSeenAt: now - 1_000,
    updatedAt: now - 1_000,
    searchableText: "",
    events: [
      {
        source: "caption",
        speaker: "You",
        text: "hello",
        time: "10:00",
        timestamp: now - 5_000,
        sessionOffsetMs: 1_000,
        isFinal: true,
        stableEventKey: "ev-1",
      },
    ],
    captions: [
      {
        speaker: "You",
        text: "hello",
        time: "10:00",
        timestamp: now - 5_000,
        sessionOffsetMs: 1_000,
        isFinal: true,
        stableEventKey: "ev-1",
      },
    ],
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
      targetLanguage: "es",
      customPrompt: "translate-fast",
      connectedCloudProviders: ["google-drive"],
      meetingArchiveRetentionDays: 90,
    },
  });
  enforceMeetingHistoryRetentionPolicyMock.mockResolvedValue({
    deletedSessionIds: ["old-1", "old-2"],
  });
  noteMeetingSessionSavedMock.mockResolvedValue(undefined);
  noteMeetingSessionDeletedMock.mockResolvedValue(undefined);
  generateTextMock.mockResolvedValue({
    success: true,
    text: JSON.stringify({
      translations: [{ timestamp: 1, translation: "hola" }],
    }),
  });
});

describe("Meeting history retention contract", () => {
  test("HRET-001: ended session saves propagate retention deletes to assistant cleanup and cloud sync", async () => {
    const session = createSession();
    await saveMeetingSession(session);

    expect(enforceMeetingHistoryRetentionPolicyMock).toHaveBeenCalledWith(90);
    expect(clearMeetingAssistantRuntimeStateMock).toHaveBeenCalledWith(
      "old-1",
      "retention-policy-delete"
    );
    expect(clearMeetingAssistantRuntimeStateMock).toHaveBeenCalledWith(
      "old-2",
      "retention-policy-delete"
    );
    expect(noteMeetingSessionDeletedMock).toHaveBeenCalledWith("old-1", [
      "google-drive",
    ]);
    expect(noteMeetingSessionDeletedMock).toHaveBeenCalledWith("old-2", [
      "google-drive",
    ]);
  });

  test("HRET-002: batch translation also enforces retention with the configured archive window", async () => {
    const session = createSession({
      id: "session-2",
      sessionSyncId: "sync-session-2",
      captions: [
        {
          speaker: "You",
          text: "hello",
          time: "10:00",
          timestamp: 1,
          sessionOffsetMs: 1_000,
          isFinal: true,
          stableEventKey: "ev-1",
        },
      ],
      events: [
        {
          source: "caption",
          speaker: "You",
          text: "hello",
          time: "10:00",
          timestamp: 1,
          sessionOffsetMs: 1_000,
          isFinal: true,
          stableEventKey: "ev-1",
        },
      ],
    });
    getStoredMeetingSessionRecordMock.mockResolvedValue(session);

    const response = await translateSessionCaptions({
      sessionId: session.id,
      targetLanguage: "es",
    });

    expect(response.success).toBe(true);
    expect(enforceMeetingHistoryRetentionPolicyMock).toHaveBeenCalledWith(90);
    expect(noteMeetingSessionDeletedMock).toHaveBeenCalledWith("old-1", [
      "google-drive",
    ]);
    expect(noteMeetingSessionDeletedMock).toHaveBeenCalledWith("old-2", [
      "google-drive",
    ]);
  });

  test("HRET-003: off disables retention-driven cleanup propagation", async () => {
    const session = createSession({
      id: "session-3",
      sessionSyncId: "sync-session-3",
    });
    getSettingsMock.mockResolvedValue({
      settings: {
        ...createDefaultSettings(),
        deviceId: "device-1",
        connectedCloudProviders: ["google-drive"],
        meetingArchiveRetentionDays: 0,
      },
    });
    enforceMeetingHistoryRetentionPolicyMock.mockResolvedValue({
      deletedSessionIds: [],
    });

    await saveMeetingSession(session);

    expect(enforceMeetingHistoryRetentionPolicyMock).toHaveBeenCalledWith(0);
    expect(clearMeetingAssistantRuntimeStateMock).not.toHaveBeenCalled();
    expect(noteMeetingSessionDeletedMock).not.toHaveBeenCalled();
  });
});
