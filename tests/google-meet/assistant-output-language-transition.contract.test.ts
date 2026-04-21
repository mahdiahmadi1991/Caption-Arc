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
      responseFormat: "talking_points",
      responseDepth: "brief",
      responseTone: "confident",
      deliveryBias: "balanced",
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
    artifacts: {
      summaries: {},
      assistantState: {
        enabled: true,
        updatedAt: now - 500,
      },
    },
  };
}

describe("Assistant output-language transition contract", () => {
  let profile: MeetingProfile;
  let currentSession: MeetingSession;
  let englishSettings: ReturnType<typeof createDefaultSettings>;
  let persianSettings: ReturnType<typeof createDefaultSettings>;

  beforeEach(() => {
    vi.clearAllMocks();
    assistantGenerationInternals.resetAssistantInternalsForTests();

    profile = createProfile();
    currentSession = createSession(profile);
    englishSettings = {
      ...createDefaultSettings(),
      meetingProfiles: [profile],
      defaultMeetingProfileId: profile.id,
      openaiApiKey: "sk-live",
      model: "gpt-5-mini",
      meetingOutputLanguage: "en",
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
    };
    persianSettings = {
      ...englishSettings,
      meetingOutputLanguage: "fa",
    };

    getStoredMeetingSessionRecordMock.mockImplementation(async () => currentSession);
    putStoredMeetingSessionRecordMock.mockImplementation(async (nextSession: MeetingSession) => {
      currentSession = nextSession;
    });
    noteMeetingSessionSavedMock.mockResolvedValue(undefined);
    recordOpenAiVerificationFailureMock.mockResolvedValue(undefined);
    recordOpenAiVerificationSuccessMock.mockResolvedValue(undefined);
    generateStreamWithOpenAIMock
      .mockResolvedValueOnce("Because the role matches my backend background.")
      .mockResolvedValueOnce("چون این نقش با تجربه بک‌اند من هم‌راستا است.");
  });

  afterEach(() => {
    assistantGenerationInternals.resetAssistantInternalsForTests();
  });

  test("uses the latest meeting output language for new assistant passes in the same session", async () => {
    getSettingsMock
      .mockResolvedValueOnce({ settings: englishSettings })
      .mockResolvedValueOnce({ settings: persianSettings });

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    currentSession = {
      ...currentSession,
      events: [
        ...(currentSession.events || []),
        {
          eventId: "evt-2",
          stableEventKey: "stable-evt-2",
          source: "caption",
          speaker: "Interviewer",
          text: "Why should we hire you?",
          time: "10:01",
          timestamp: Date.now(),
          sessionOffsetMs: 2_000,
          isFinal: true,
        },
      ],
    };

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(2);

    const firstPrompt = generateStreamWithOpenAIMock.mock.calls[0][0] as string;
    const secondPrompt = generateStreamWithOpenAIMock.mock.calls[1][0] as string;

    expect(firstPrompt).toContain("Output language code: en");
    expect(firstPrompt).toContain("Output language name: English");
    expect(secondPrompt).toContain("Output language code: fa");
    expect(secondPrompt).toContain("Output language name: Persian");
    expect(secondPrompt).toContain("Write the entire response in Persian.");
    expect(secondPrompt).toContain(
      'Do not answer in English unless the requested output language is English.'
    );
    expect(secondPrompt).toContain("Question(s) to answer now:\nWhy should we hire you?");
  });
});
