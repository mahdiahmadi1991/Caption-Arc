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

import { assistantGenerationInternals } from "../../entrypoints/background/assistant";

function createProfile(profileId: string): MeetingProfile {
  const defaults = createDefaultSettings();
  return defaults.meetingProfiles.find((item) => item.id === profileId)!;
}

function createVerifiedSettings(
  profiles: MeetingProfile[],
  defaultMeetingProfileId: string
) {
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

function createSession(
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
    ...overrides,
  };
}

describe("Assistant settings transition contract", () => {
  let interviewProfile: MeetingProfile;
  let clientCallProfile: MeetingProfile;
  let currentSession: MeetingSession;

  beforeEach(() => {
    vi.clearAllMocks();
    assistantGenerationInternals.resetAssistantInternalsForTests();

    interviewProfile = createProfile("interview");
    clientCallProfile = createProfile("client_call");
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

  test("assistant can be re-enabled mid-session after a suppressed pass", async () => {
    currentSession = createSession({
      meetingProfileId: interviewProfile.id,
      artifacts: {
        summaries: {},
        assistantState: {
          enabled: false,
          updatedAt: Date.now(),
        },
      },
    });

    getSettingsMock
      .mockResolvedValueOnce({
        settings: createVerifiedSettings([interviewProfile], interviewProfile.id),
      })
      .mockResolvedValueOnce({
        settings: createVerifiedSettings([interviewProfile], interviewProfile.id),
      });

    await assistantGenerationInternals.runAssistantPass(currentSession.id);
    expect(generateStreamWithOpenAIMock).not.toHaveBeenCalled();
    expect(
      assistantGenerationInternals.getAssistantLiveStatesForTests().get(currentSession.id)?.status
    ).toBe("suppressed");

    currentSession = {
      ...currentSession,
      artifacts: {
        ...(currentSession.artifacts || {}),
        assistantState: {
          enabled: true,
          updatedAt: Date.now() + 1,
        },
      },
    };
    generateStreamWithOpenAIMock.mockResolvedValueOnce(
      "Because the role aligns with my backend engineering background."
    );

    await assistantGenerationInternals.runAssistantPass(currentSession.id);

    expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(1);
    const output =
      currentSession.artifacts?.assistantOutputs?.["stable-evt-1"];
    expect(output?.triggerText).toBe("Why do you want this job?");
  });

  test("sessions without a pinned meeting profile follow the latest default profile", async () => {
    currentSession = createSession({
      meetingProfileId: undefined,
    });

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
          clientCallProfile.id
        ),
      });

    generateStreamWithOpenAIMock
      .mockResolvedValueOnce("Because the role fits my background.")
      .mockResolvedValueOnce("I would focus on the client need and the next commitment.");

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
          text: "How would you respond to a client concern?",
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

    expect(firstPrompt).toContain("Meeting profile: Interview");
    expect(secondPrompt).toContain("Meeting profile: Client Call");
    expect(secondPrompt).toContain("Assistant intent: suggest_next_point");
  });

  test("verified recovery is treated as a requeue-worthy assistant settings transition", () => {
    const unavailableSettings = {
      ...createVerifiedSettings([interviewProfile], interviewProfile.id),
      verificationSnapshot: null,
    };
    const recoveredSettings = {
      ...createVerifiedSettings([interviewProfile], interviewProfile.id),
      verificationSnapshot: {
        status: "verified" as const,
        message: "OpenAI is ready.",
        signature: JSON.stringify({
          service: "openai",
          apiKey: "sk-live",
          model: "gpt-5-mini",
        }),
        verifiedAt: Date.now() + 1_000,
      },
    };

    expect(
      assistantGenerationInternals.shouldRequeueAssistantAfterSettingsRecovery(
        unavailableSettings as never,
        recoveredSettings as never
      )
    ).toBe(true);
  });
});
