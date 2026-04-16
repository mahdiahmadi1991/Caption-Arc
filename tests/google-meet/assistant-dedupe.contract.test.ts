import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
  MeetingAssistantOutput,
  MeetingProfile,
  MeetingSession,
  SavedMeetingEvent,
} from "../../entrypoints/background/types";
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
  const baseProfile = defaults.meetingProfiles[0];
  return {
    ...baseProfile,
    assistant: {
      ...baseProfile.assistant,
      enabledByDefault: true,
      triggerPolicy: "questions_requests_only",
      participantScope: "others_only",
      ...overrides,
    },
  };
}

function createEvent(
  eventId: string,
  text: string,
  overrides: Partial<SavedMeetingEvent> = {}
): SavedMeetingEvent {
  return {
    eventId,
    stableEventKey: `stable-${eventId}`,
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
    lastSeenAt: now,
    updatedAt: now,
    searchableText: "",
    events,
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
  };
}

describe("Assistant dedupe contract", () => {
  beforeEach(() => {
    assistantGenerationInternals.resetAssistantInternalsForTests();
  });

  test("filters already answered clauses and keeps only the unresolved question", () => {
    const firstAnswer: MeetingAssistantOutput = {
      id: "out-1",
      triggerEventId: "evt-1",
      triggerStableEventKey: "stable-evt-1",
      source: "caption",
      speaker: "Interviewer",
      triggerText: "Why do you want this job?",
      triggerTimestamp: 1_000,
      profileId: "interview",
      content: "Because the role matches my backend background.",
      createdAt: 1_500,
      provider: "openai",
      model: "gpt-5-mini",
    };

    const repeatedAndNewEvent = createEvent(
      "evt-2",
      "Why do you want this job? Why should we hire you?"
    );

    const resolvedTrigger = assistantGenerationInternals.resolveAssistantTrigger(
      repeatedAndNewEvent,
      { "stable-evt-1": firstAnswer }
    );

    expect(resolvedTrigger).not.toBeNull();
    expect(resolvedTrigger?.triggerText).toBe("Why should we hire you?");
    expect(resolvedTrigger?.clauseKeys).toEqual(["why should we hire you"]);
  });

  test("returns null when every clause in the event was already answered", () => {
    const priorOutput: MeetingAssistantOutput = {
      id: "out-1",
      triggerEventId: "evt-1",
      triggerStableEventKey: "stable-evt-1",
      source: "caption",
      speaker: "Interviewer",
      triggerText: "Walk me through your resume, please.",
      triggerTimestamp: 1_000,
      profileId: "interview",
      content: "I have 8+ years in .NET backend engineering.",
      createdAt: 1_500,
      provider: "openai",
      model: "gpt-5-mini",
    };

    const repeatedEvent = createEvent("evt-2", "Walk me through your resume, please.");

    expect(
      assistantGenerationInternals.resolveAssistantTrigger(repeatedEvent, {
        "stable-evt-1": priorOutput,
      })
    ).toBeNull();
  });

  test("coalesces nearby caption candidates from the same speaker to the latest finalized event", () => {
    const profile = createProfile();
    const earlyCaption = createEvent("evt-1", "Why do you want this job?", {
      timestamp: 10_000,
    });
    const laterCaption = createEvent(
      "evt-2",
      "Why do you want this job? Why should we hire you?",
      {
        timestamp: 11_800,
      }
    );
    const chatRequest = createEvent("evt-3", "Can you share your availability?", {
      source: "chat",
      timestamp: 12_000,
    });
    const session = createSession([earlyCaption, laterCaption, chatRequest]);
    const selfSpeakerAliases = assistantGenerationInternals.getSelfSpeakerAliases(session);

    const consideredCandidates = session.events!.filter((event) =>
      assistantGenerationInternals.shouldConsiderEvent(
        selfSpeakerAliases,
        event,
        profile
      )
    );
    const coalescedCandidates = assistantGenerationInternals.coalesceAssistantCandidates(
      session,
      consideredCandidates
    );

    expect(coalescedCandidates.map((event) => event.eventId)).toEqual(["evt-2", "evt-3"]);
  });
});
