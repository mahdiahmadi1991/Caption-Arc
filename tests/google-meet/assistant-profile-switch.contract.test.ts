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
  classifyOpenAiFailure: vi.fn(() => "provider_error"),
  truncateForDiagnostics: vi.fn((value: string) => value),
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

function getProfile(profileId: string): MeetingProfile {
  const defaults = createDefaultSettings();
  const profile = defaults.meetingProfiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Expected profile ${profileId} to exist.`);
  }
  return profile;
}

function createVerifiedSettings(profiles: MeetingProfile[], defaultMeetingProfileId: string) {
  return {
    ...createDefaultSettings(),
    meetingProfiles: profiles,
    defaultMeetingProfileId,
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
      verifiedAt: Date.now(),
    },
  };
}

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
        text: "How would you respond to a client concern?",
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
    },
    ...overrides,
  };
}

describe("Assistant profile-switch contract", () => {
  let interviewProfile: MeetingProfile;
  let clientCallProfile: MeetingProfile;
  let currentSession: MeetingSession;

  beforeEach(() => {
    vi.clearAllMocks();
    assistantGenerationInternals.resetAssistantInternalsForTests();

    interviewProfile = getProfile("interview");
    clientCallProfile = getProfile("client_call");
    currentSession = createSession({
      meetingProfileId: interviewProfile.id,
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

  test("AGEN-007: switching a session to a profile with assistant disabled by default suppresses later passes", async () => {
    getSettingsMock
      .mockResolvedValueOnce({
        settings: createVerifiedSettings(
          [interviewProfile, clientCallProfile],
          interviewProfile.id
        ),
      })
      .mockResolvedValueOnce({
        settings: createVerifiedSettings(
          [interviewProfile, clientCallProfile],
          interviewProfile.id
        ),
      });

    generateStreamWithOpenAIMock.mockResolvedValueOnce(
      "I would answer directly and support it with one concrete example."
    );

    await assistantGenerationInternals.runAssistantPass(currentSession.id);
    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);

    currentSession = createSession({
      meetingProfileId: clientCallProfile.id,
      artifacts: {
        summaries: {},
      },
    });

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);
    const liveState = assistantGenerationInternals.getAssistantLiveStatesForTests().get(
      currentSession.id
    );
    expect(liveState?.status).toBe("suppressed");
  });

  test("AGEN-008: switching the session profile changes prompt semantics when session assistant state remains enabled", async () => {
    currentSession = createSession({
      meetingProfileId: clientCallProfile.id,
      artifacts: {
        summaries: {},
        assistantState: {
          enabled: true,
          updatedAt: Date.now(),
        },
      },
    });

    getSettingsMock.mockResolvedValue({
      settings: createVerifiedSettings(
        [interviewProfile, clientCallProfile],
        interviewProfile.id
      ),
    });
    generateStreamWithOpenAIMock.mockResolvedValueOnce(
      "I would acknowledge the client concern, clarify the impact, and propose the next step."
    );

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);
    const prompt = generateStreamWithOpenAIMock.mock.calls[0][0] as string;
    expect(prompt).toContain("Meeting profile: Client Call");
    expect(prompt).toContain("Assistant intent: suggest_next_point");
    expect(prompt).toContain("Response tone: direct");
  });

  test("AGEN-015: a mid-pass session profile switch is preserved when assistant output is persisted", async () => {
    let resolveGeneration: ((value: string) => void) | null = null;
    const generationPromise = new Promise<string>((resolve) => {
      resolveGeneration = resolve;
    });

    getSettingsMock.mockResolvedValue({
      settings: createVerifiedSettings(
        [interviewProfile, clientCallProfile],
        interviewProfile.id
      ),
    });
    generateStreamWithOpenAIMock.mockReturnValueOnce(generationPromise);

    const passPromise = assistantGenerationInternals.runAssistantPass(currentSession.id);
    await vi.waitFor(() => {
      expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);
    });

    currentSession = createSession({
      meetingProfileId: clientCallProfile.id,
      artifacts: {
        summaries: {},
        assistantState: {
          enabled: true,
          updatedAt: Date.now(),
        },
      },
    });

    resolveGeneration?.(
      "I would acknowledge the delivery risk, name the impact, and propose the mitigation path."
    );
    await passPromise;

    expect(currentSession.meetingProfileId).toBe(clientCallProfile.id);
    expect(currentSession.artifacts?.assistantOutputs).toBeTruthy();
    const savedOutput = Object.values(currentSession.artifacts?.assistantOutputs || {})[0];
    expect(savedOutput?.profileId).toBe(interviewProfile.id);
  });
});
