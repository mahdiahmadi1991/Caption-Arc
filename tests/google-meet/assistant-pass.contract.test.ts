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

vi.mock("../../entrypoints/background/providers/openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../entrypoints/background/providers/openai")>();
  return {
    ...actual,
    generateStreamWithOpenAI: generateStreamWithOpenAIMock,
  };
});

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
  assistantGenerationInternals,
  getMeetingAssistantLiveState,
} from "../../entrypoints/background/assistant";

function createProfile(
  overrides: Partial<MeetingProfile["assistant"]> = {}
): MeetingProfile {
  const defaults = createDefaultSettings();
  const profile = defaults.meetingProfiles.find((item) => item.id === "interview")!;
  return {
    ...profile,
    assistant: {
      ...profile.assistant,
      enabledByDefault: true,
      triggerPolicy: "questions_requests_only",
      participantScope: "others_only",
      ...overrides,
    },
  };
}

function createSession(
  profile: MeetingProfile,
  overrides: Partial<MeetingSession> = {}
): MeetingSession {
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
        text: "Why do you want this job?",
        time: "10:00",
        timestamp: now - 20_000,
        sessionOffsetMs: 1_000,
        isFinal: true,
      },
      {
        eventId: "evt-2",
        stableEventKey: "stable-evt-2",
        source: "caption",
        speaker: "Interviewer",
        text: "Why do you want this job? Why should we hire you?",
        time: "10:01",
        timestamp: now - 10_000,
        sessionOffsetMs: 2_000,
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
      assistantOutputs: {
        "stable-evt-1": {
          id: "assistant-1",
          triggerEventId: "evt-1",
          triggerStableEventKey: "stable-evt-1",
          source: "caption",
          speaker: "Interviewer",
          triggerText: "Why do you want this job?",
          triggerTimestamp: now - 20_000,
          profileId: profile.id,
          content: "Because the role matches my backend background.",
          createdAt: now - 19_000,
          provider: "openai",
          model: "gpt-5-mini",
        },
      },
    },
    ...overrides,
  };
}

describe("Assistant pass contract", () => {
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
    generateStreamWithOpenAIMock.mockResolvedValue(
      "You should hire me because I can improve reliability and delivery speed."
    );
  });

  afterEach(() => {
    assistantGenerationInternals.resetAssistantInternalsForTests();
  });

  test("persists only the unresolved clause when a later caption repeats an already answered question", async () => {
    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);
    const prompt = generateStreamWithOpenAIMock.mock.calls[0][0] as string;
    expect(prompt).toContain("Question(s) to answer now:\nWhy should we hire you?");
    expect(prompt).not.toContain(
      "Question(s) to answer now:\nWhy do you want this job? Why should we hire you?"
    );

    const finalPersistedSession =
      putStoredMeetingSessionRecordMock.mock.calls.at(-1)?.[0] as MeetingSession;
    const outputs = finalPersistedSession.artifacts?.assistantOutputs || {};
    expect(Object.keys(outputs)).toEqual(["stable-evt-1", "stable-evt-2"]);
    expect(outputs["stable-evt-2"]?.triggerText).toBe("Why should we hire you?");
    expect(outputs["stable-evt-2"]?.content).toContain("You should hire me");

    const liveState = assistantGenerationInternals.getAssistantLiveStatesForTests().get(
      currentSession.id
    );
    expect(liveState?.status).toBe("done");
    expect(liveState?.pendingOutputs).toEqual([]);
  });

  test("suppresses the pass when assistant state is disabled for the session", async () => {
    currentSession = createSession(profile, {
      artifacts: {
        ...currentSession.artifacts,
        assistantState: {
          enabled: false,
          updatedAt: Date.now(),
        },
      },
    });

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).not.toHaveBeenCalled();
    const liveState = assistantGenerationInternals.getAssistantLiveStatesForTests().get(
      currentSession.id
    );
    expect(liveState?.status).toBe("suppressed");
    expect(liveState?.pendingOutputs).toEqual([]);
  });

  test("retries with a larger token budget after a truncated streaming response", async () => {
    generateStreamWithOpenAIMock
      .mockRejectedValueOnce(
        new Error(
          'OpenAI streaming response was truncated before completion. status=incomplete; incomplete={"reason":"max_output_tokens"}'
        )
      )
      .mockResolvedValueOnce(
        "You should hire me because I improve reliability, delivery speed, and operational clarity."
      );

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(2);
    expect(recordOpenAiVerificationFailureMock).not.toHaveBeenCalled();
    expect(recordOpenAiVerificationSuccessMock).toHaveBeenCalledTimes(1);

    const firstBudget = generateStreamWithOpenAIMock.mock.calls[0]?.[4] as number;
    const secondBudget = generateStreamWithOpenAIMock.mock.calls[1]?.[4] as number;
    expect(secondBudget).toBeGreaterThan(firstBudget);

    const finalPersistedSession =
      putStoredMeetingSessionRecordMock.mock.calls.at(-1)?.[0] as MeetingSession;
    expect(finalPersistedSession.artifacts?.assistantOutputs?.["stable-evt-2"]?.content).toContain(
      "improve reliability"
    );
  });

  test("requeues an errored assistant pass after a newer OpenAI verification succeeds", async () => {
    const unavailableSettings = {
      ...createDefaultSettings(),
      meetingProfiles: [profile],
      defaultMeetingProfileId: profile.id,
      openaiApiKey: "sk-live",
      model: "gpt-5-mini",
      meetingOutputLanguage: "en",
      connectedCloudProviders: [],
      verificationSnapshot: null,
    };
    const recoveredSettings = {
      ...createDefaultSettings(),
      meetingProfiles: [profile],
      defaultMeetingProfileId: profile.id,
      openaiApiKey: "sk-live",
      model: "gpt-5-mini",
      meetingOutputLanguage: "en",
      connectedCloudProviders: [],
      verificationSnapshot: {
        status: "verified" as const,
        message: "OpenAI is ready.",
        signature: JSON.stringify({
          service: "openai",
          apiKey: "sk-live",
          model: "gpt-5-mini",
        }),
        verifiedAt: Date.now() + 5_000,
      },
    };

    getSettingsMock
      .mockResolvedValueOnce({ settings: unavailableSettings })
      .mockResolvedValueOnce({ settings: recoveredSettings })
      .mockResolvedValueOnce({ settings: recoveredSettings });
    generateStreamWithOpenAIMock.mockResolvedValueOnce(
      "You should hire me because I can raise reliability and execution quality."
    );

    await assistantGenerationInternals.runAssistantPass(currentSession.id);
    expect(
      assistantGenerationInternals.getAssistantLiveStatesForTests().get(currentSession.id)?.status
    ).toBe("error");

    const beforeRetryCalls = generateStreamWithOpenAIMock.mock.calls.length;
    const stateResponse = await getMeetingAssistantLiveState(currentSession.id);
    expect(stateResponse.success).toBe(true);

    await vi.waitFor(() => {
      expect(generateStreamWithOpenAIMock.mock.calls.length).toBe(beforeRetryCalls + 1);
    });

    expect(
      assistantGenerationInternals.getAssistantLiveStatesForTests().get(currentSession.id)?.status
    ).toBe("done");
  });
});
