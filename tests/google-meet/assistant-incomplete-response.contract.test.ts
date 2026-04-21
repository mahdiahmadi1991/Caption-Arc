import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MeetingProfile, MeetingSession } from "../../entrypoints/background/types";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

const {
  getSettingsMock,
  recordOpenAiVerificationFailureMock,
  recordOpenAiVerificationSuccessMock,
  getStoredMeetingSessionRecordMock,
  putStoredMeetingSessionRecordMock,
  noteMeetingSessionSavedMock,
  generateStreamWithOpenAIMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  recordOpenAiVerificationFailureMock: vi.fn(),
  recordOpenAiVerificationSuccessMock: vi.fn(),
  getStoredMeetingSessionRecordMock: vi.fn(),
  putStoredMeetingSessionRecordMock: vi.fn(),
  noteMeetingSessionSavedMock: vi.fn(),
  generateStreamWithOpenAIMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
  recordOpenAiVerificationFailure: recordOpenAiVerificationFailureMock,
  recordOpenAiVerificationSuccess: recordOpenAiVerificationSuccessMock,
}));

vi.mock("../../entrypoints/background/history-db", () => ({
  getStoredMeetingSessionRecord: getStoredMeetingSessionRecordMock,
  putStoredMeetingSessionRecord: putStoredMeetingSessionRecordMock,
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteMeetingSessionSaved: noteMeetingSessionSavedMock,
}));

vi.mock("../../entrypoints/background/providers/openai", () => ({
  generateStreamWithOpenAI: generateStreamWithOpenAIMock,
  truncateForDiagnostics: (value: unknown) => String(value ?? ""),
  classifyOpenAiFailure: vi.fn(() => "truncation"),
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

import { assistantGenerationInternals } from "../../entrypoints/background/assistant";

function createProfile(): MeetingProfile {
  const defaults = createDefaultSettings();
  const profile = defaults.meetingProfiles.find((item) => item.id === "interview")!;
  return {
    ...profile,
    assistant: {
      ...profile.assistant,
      enabledByDefault: true,
      triggerPolicy: "questions_requests_only",
      participantScope: "others_only",
    },
  };
}

function createSession(profile: MeetingProfile): MeetingSession {
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
    meetingProfileId: profile.id,
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
        text: "Why should we hire you?",
        time: "10:00",
        timestamp: now - 10_000,
        sessionOffsetMs: 1_000,
        isFinal: true,
      },
    ],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: {
      summaries: {},
      assistantState: {
        enabled: true,
        updatedAt: now - 500,
      },
      assistantOutputs: {},
    },
  };
}

describe("Assistant incomplete-response contract", () => {
  let profile: MeetingProfile;
  let currentSession: MeetingSession;

  beforeEach(() => {
    vi.clearAllMocks();
    assistantGenerationInternals.resetAssistantInternalsForTests();

    profile = createProfile();
    currentSession = createSession(profile);

    getSettingsMock.mockResolvedValue({
      settings: {
        ...createDefaultSettings(),
        meetingProfiles: [profile],
        defaultMeetingProfileId: profile.id,
        openaiApiKey: "sk-live",
        model: "gpt-5-mini",
        meetingOutputLanguage: "en",
        connectedCloudProviders: [],
        verificationSnapshot: {
          status: "verified",
          message: "OpenAI is ready.",
          signature: JSON.stringify({
            service: "openai",
            apiKey: "sk-live",
            model: "gpt-5-mini",
          }),
          verifiedAt: Date.now(),
        },
      },
    });
    getStoredMeetingSessionRecordMock.mockImplementation(async () => currentSession);
    putStoredMeetingSessionRecordMock.mockImplementation(async (nextSession: MeetingSession) => {
      currentSession = nextSession;
    });
    noteMeetingSessionSavedMock.mockResolvedValue(undefined);
    recordOpenAiVerificationFailureMock.mockResolvedValue(undefined);
    recordOpenAiVerificationSuccessMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    assistantGenerationInternals.resetAssistantInternalsForTests();
  });

  test("AINCOMP-001: exhausted truncation retries do not persist a fake completed assistant output", async () => {
    generateStreamWithOpenAIMock
      .mockRejectedValueOnce(
        new Error(
          'OpenAI streaming response was truncated before completion. status=incomplete; incomplete={"reason":"max_output_tokens"}'
        )
      )
      .mockRejectedValueOnce(
        new Error(
          'OpenAI streaming response was truncated before completion. status=incomplete; incomplete={"reason":"max_output_tokens"}'
        )
      );

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(2);
    expect(recordOpenAiVerificationFailureMock).not.toHaveBeenCalled();
    expect(recordOpenAiVerificationSuccessMock).not.toHaveBeenCalled();
    expect(currentSession.artifacts?.assistantOutputs || {}).toEqual({});

    const liveState = assistantGenerationInternals.getAssistantLiveStatesForTests().get(
      currentSession.id
    );
    expect(liveState?.status).toBe("error");
  });

  test("AINCOMP-002: empty normalized provider output is treated as no completed assistant answer", async () => {
    generateStreamWithOpenAIMock.mockResolvedValueOnce(" \n \u00a0 ");

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);
    expect(recordOpenAiVerificationSuccessMock).toHaveBeenCalledTimes(1);
    expect(recordOpenAiVerificationFailureMock).not.toHaveBeenCalled();
    expect(currentSession.artifacts?.assistantOutputs || {}).toEqual({});

    const liveState = assistantGenerationInternals.getAssistantLiveStatesForTests().get(
      currentSession.id
    );
    expect(liveState?.status).toBe("watching");
  });
});
