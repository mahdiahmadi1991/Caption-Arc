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
  return {
    ...defaults.meetingProfiles.find((item) => item.id === "interview")!,
    assistant: {
      ...defaults.meetingProfiles.find((item) => item.id === "interview")!.assistant,
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

describe("Assistant cancellation contract", () => {
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

  test("AGEN-010: already-aborted signals exit before provider generation starts", async () => {
    const controller = new AbortController();
    controller.abort();

    await assistantGenerationInternals.runAssistantPass(currentSession.id, controller.signal);

    expect(generateStreamWithOpenAIMock).not.toHaveBeenCalled();
    expect(putStoredMeetingSessionRecordMock).not.toHaveBeenCalled();
  });

  test("AGEN-011: abort during provider generation does not persist a completed assistant output or settle live state to done", async () => {
    let notifyProviderStarted: (() => void) | null = null;
    const providerStarted = new Promise<void>((resolve) => {
      notifyProviderStarted = resolve;
    });
    generateStreamWithOpenAIMock.mockImplementation(
      async (
        _prompt: string,
        _apiKey: string,
        _model: string,
        _handlers: unknown,
        _maxTokens: number,
        signal?: AbortSignal
      ) =>
        new Promise<string>((_resolve, reject) => {
          notifyProviderStarted?.();
          signal?.addEventListener("abort", () => {
            reject(new DOMException("Assistant generation aborted.", "AbortError"));
          });
        })
    );

    const controller = new AbortController();
    const passPromise = assistantGenerationInternals.runAssistantPass(
      currentSession.id,
      controller.signal
    );

    await providerStarted;
    controller.abort();
    await passPromise;

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);
    expect(currentSession.artifacts?.assistantOutputs || {}).toEqual({});
    const liveState = assistantGenerationInternals.getAssistantLiveStatesForTests().get(
      currentSession.id
    );
    expect(liveState?.status).not.toBe("done");
  });
});
