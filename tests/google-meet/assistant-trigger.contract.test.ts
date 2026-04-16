import { describe, expect, test, vi } from "vitest";
import type { MeetingProfile, MeetingSession, SavedMeetingEvent } from "../../entrypoints/background/types";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: vi.fn(),
  recordOpenAiVerificationFailure: vi.fn(),
  recordOpenAiVerificationSuccess: vi.fn(),
}));

vi.mock("../../entrypoints/background/history-db", () => ({
  getStoredMeetingSessionRecord: vi.fn(),
  putStoredMeetingSessionRecord: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteMeetingSessionSaved: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/background/providers/openai", () => ({
  generateStreamWithOpenAI: vi.fn(),
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

function createEvent(
  text: string,
  overrides: Partial<SavedMeetingEvent> = {}
): SavedMeetingEvent {
  return {
    eventId: "evt-1",
    stableEventKey: "stable-evt-1",
    source: "caption",
    speaker: "Interviewer",
    text,
    time: "10:00",
    timestamp: 1_000,
    sessionOffsetMs: 1_000,
    isFinal: true,
    ...overrides,
  };
}

function createSession(events: SavedMeetingEvent[]): MeetingSession {
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
    events,
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
  };
}

describe("Assistant trigger contract", () => {
  test("AGEN-001: questions_requests_only accepts direct questions and requests but suppresses salient non-questions", () => {
    const profile = createProfile({
      triggerPolicy: "questions_requests_only",
    });
    const session = createSession([]);
    const aliases = assistantGenerationInternals.getSelfSpeakerAliases(session);

    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent("Why do you want this job?"),
        profile
      )
    ).toBe(true);
    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent("Please walk me through your resume."),
        profile
      )
    ).toBe(true);
    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent("This deadline is a blocker for the release."),
        profile
      )
    ).toBe(false);
  });

  test("AGEN-002: salience_first accepts salient events while proactive also accepts long non-question statements", () => {
    const salienceProfile = createProfile({
      triggerPolicy: "salience_first",
    });
    const proactiveProfile = createProfile({
      triggerPolicy: "proactive",
    });
    const session = createSession([]);
    const aliases = assistantGenerationInternals.getSelfSpeakerAliases(session);

    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent("This blocker will delay the client commitment."),
        salienceProfile
      )
    ).toBe(true);
    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent(
          "I want to outline the project context and the delivery trade-offs before we proceed."
        ),
        proactiveProfile
      )
    ).toBe(true);
  });

  test("AGEN-003: participant scope, final-caption gating, and minimum-length gating suppress invalid triggers", () => {
    const profile = createProfile({
      participantScope: "others_only",
    });
    const session = createSession([
      createEvent("I can take that question.", {
        own: true,
        speaker: "Me",
      }),
    ]);
    const aliases = assistantGenerationInternals.getSelfSpeakerAliases(session);

    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent("Can I add one point?", {
          own: true,
          speaker: "Me",
        }),
        profile
      )
    ).toBe(false);
    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent("Why now?", {
          isFinal: false,
        }),
        profile
      )
    ).toBe(false);
    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent("Hi?", {
          text: "Hi?",
        }),
        profile
      )
    ).toBe(false);
  });

  test("AGEN-004: summarize_what_was_just_said accepts long non-question updates under salience_first", () => {
    const profile = createProfile({
      triggerPolicy: "salience_first",
      responseIntent: "summarize_what_was_just_said",
      participantScope: "all_participants",
    });
    const session = createSession([]);
    const aliases = assistantGenerationInternals.getSelfSpeakerAliases(session);

    expect(
      assistantGenerationInternals.shouldConsiderEvent(
        aliases,
        createEvent(
          "The migration work is mostly on track, but procurement still has not approved the data vendor and the release window is tightening because two dependencies are still pending sign-off."
        ),
        profile
      )
    ).toBe(true);
  });
});
