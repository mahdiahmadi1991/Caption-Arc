import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MeetingProfile, MeetingSession, SavedMeetingEvent } from "../../entrypoints/background/types";
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

type ReplayStep = {
  appendEvents?: SavedMeetingEvent[];
  expectedPromptIncludes: string[];
  expectedPromptExcludes?: string[];
  expectedNewOutputKey: string;
  expectedTriggerText: string;
};

type ReplayFixture = {
  name: string;
  profileId: string;
  generatedResponses: string[];
  settingsSequence: Array<{ meetingOutputLanguage: string }>;
  initialSession: {
    meetingProfileId: string;
    events: SavedMeetingEvent[];
    artifacts: MeetingSession["artifacts"];
  };
  steps: ReplayStep[];
};

function loadFixture(name: string): ReplayFixture {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "tests/google-meet/fixtures/assistant", `${name}.json`),
      "utf8"
    )
  ) as ReplayFixture;
}

function createProfile(profileId: string): MeetingProfile {
  const defaults = createDefaultSettings();
  const profile = defaults.meetingProfiles.find((item) => item.id === profileId)!;
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

function createSession(
  profile: MeetingProfile,
  fixture: ReplayFixture["initialSession"]
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
    meetingProfileId: fixture.meetingProfileId || profile.id,
    startTime: now - 60_000,
    lastSeenAt: now - 1_000,
    updatedAt: now - 1_000,
    searchableText: "",
    events: fixture.events,
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: fixture.artifacts,
  };
}

describe("Assistant replay contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assistantGenerationInternals.resetAssistantInternalsForTests();
    noteMeetingSessionSavedMock.mockResolvedValue(undefined);
    recordOpenAiVerificationFailureMock.mockResolvedValue(undefined);
    recordOpenAiVerificationSuccessMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    assistantGenerationInternals.resetAssistantInternalsForTests();
  });

  for (const fixtureName of [
    "q1-then-q1-plus-q2",
    "language-switch-en-to-fa-mid-session",
  ]) {
    test(`replays ${fixtureName} deterministically`, async () => {
      const fixture = loadFixture(fixtureName);
      const profile = createProfile(fixture.profileId);
      let currentSession = createSession(profile, fixture.initialSession);

      getStoredMeetingSessionRecordMock.mockImplementation(async () => currentSession);
      putStoredMeetingSessionRecordMock.mockImplementation(async (nextSession: MeetingSession) => {
        currentSession = nextSession;
      });

      generateStreamWithOpenAIMock.mockReset();
      fixture.generatedResponses.forEach((response) => {
        generateStreamWithOpenAIMock.mockResolvedValueOnce(response);
      });

      fixture.steps.forEach((step, index) => {
        const language = fixture.settingsSequence[index]?.meetingOutputLanguage || "en";
        getSettingsMock.mockResolvedValueOnce({
          settings: {
            ...createDefaultSettings(),
            meetingProfiles: [profile],
            defaultMeetingProfileId: profile.id,
            openaiApiKey: "sk-live",
            model: "gpt-5-mini",
            meetingOutputLanguage: language,
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
      });

      for (const [index, step] of fixture.steps.entries()) {
        if (step.appendEvents?.length) {
          currentSession = {
            ...currentSession,
            events: [...(currentSession.events || []), ...step.appendEvents],
          };
        }

        await assistantGenerationInternals.runAssistantPass(currentSession.id);

        const prompt = generateStreamWithOpenAIMock.mock.calls[index][0] as string;
        step.expectedPromptIncludes.forEach((value) => {
          expect(prompt).toContain(value);
        });
        step.expectedPromptExcludes?.forEach((value) => {
          expect(prompt).not.toContain(value);
        });

        const outputs = currentSession.artifacts?.assistantOutputs || {};
        expect(outputs[step.expectedNewOutputKey]?.triggerText).toBe(step.expectedTriggerText);
      }

      expect(generateStreamWithOpenAIMock).toHaveBeenCalledTimes(fixture.steps.length);
    });
  }
});
