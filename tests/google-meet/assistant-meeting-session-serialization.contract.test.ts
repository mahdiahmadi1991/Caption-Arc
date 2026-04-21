import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  buildMeetingSessionSearchableText,
  normalizeMeetingSession,
} from "../../entrypoints/shared/meeting-session";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";

function createBaseStoredSession(
  overrides: Partial<MeetingSession> = {}
): MeetingSession {
  return {
    id: "session-1",
    sessionSyncId: "sync-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Assistant Serialization Review",
    starred: false,
    identifiers: { meetingCode: "xxx-xxxx-xxx" },
    sessionFingerprint: "fp-1",
    lifecycleState: "ended",
    startTime: 1_700_000_000_000,
    endTime: 1_700_000_060_000,
    lastSeenAt: 1_700_000_060_000,
    updatedAt: 1_700_000_070_000,
    searchableText: "",
    events: [],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
    ...overrides,
  };
}

describe("Assistant meeting-session serialization contract", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("AMSESS-001: normalizeMeetingSession sanitizes assistant artifacts and keeps searchable assistant text", () => {
    const storedSession = createBaseStoredSession({
      artifacts: {
        summaries: {},
        assistantOutputs: {
          "assistant-output-1": {
            id: "",
            triggerEventId: "evt-1",
            triggerStableEventKey: "stable-evt-1",
            source: "unexpected",
            speaker: "",
            triggerText: "Client asked for a rollout summary",
            triggerTimestamp: 1_700_000_010_000,
            profileId: "client_call",
            content: "## Summary\n\n- Keep the rollout narrow.",
            createdAt: 1_700_000_020_000,
            provider: "openai",
            model: "gpt-5-mini",
            responseIntent: "surface_risks",
            responseFormat: "structured_sections",
            responseDepth: "expanded",
            responseTone: "confident",
            deliveryBias: "careful",
          },
          "assistant-output-2": {
            id: "assistant-output-2",
            triggerEventId: "evt-2",
            source: "chat",
            speaker: "Moderator",
            triggerText: "Post the blocker in chat.",
            triggerTimestamp: 1_700_000_030_000,
            profileId: "daily_sync",
            content: "Short assistant note",
            createdAt: 1_700_000_040_000,
            provider: "openai",
            model: "gpt-5-mini",
            responseIntent: "bad-intent",
            responseFormat: "bad-format",
            responseDepth: "bad-depth",
            responseTone: "bad-tone",
            deliveryBias: "bad-bias",
          },
        },
        assistantMemory: {
          updatedAt: "bad-updated-at",
          content: "Memory line for the current risk thread.",
          sourceEventCount: "bad-source-count",
        },
        assistantState: {
          enabled: true,
          updatedAt: "bad-state-time",
        },
      },
    });

    const normalized = normalizeMeetingSession(storedSession);
    const firstOutput =
      normalized.artifacts?.assistantOutputs?.["assistant-output-1"];
    const secondOutput =
      normalized.artifacts?.assistantOutputs?.["assistant-output-2"];

    expect(firstOutput).toMatchObject({
      id: "assistant-output-1",
      triggerEventId: "evt-1",
      triggerStableEventKey: "stable-evt-1",
      source: "caption",
      speaker: "",
      triggerText: "Client asked for a rollout summary",
      profileId: "client_call",
      content: "## Summary\n\n- Keep the rollout narrow.",
      responseIntent: "surface_risks",
      responseFormat: "structured_sections",
      responseDepth: "expanded",
      responseTone: "confident",
      deliveryBias: "careful",
    });
    expect(secondOutput).toMatchObject({
      id: "assistant-output-2",
      source: "chat",
      speaker: "Moderator",
      responseIntent: undefined,
      responseFormat: undefined,
      responseDepth: undefined,
      responseTone: undefined,
      deliveryBias: undefined,
    });

    expect(normalized.artifacts?.assistantMemory).toEqual({
      updatedAt: Date.now(),
      content: "Memory line for the current risk thread.",
      sourceEventCount: undefined,
    });
    expect(normalized.artifacts?.assistantState).toEqual({
      enabled: true,
      updatedAt: Date.now(),
    });

    expect(normalized.searchableText).toContain("client asked for a rollout summary");
    expect(normalized.searchableText).toContain("keep the rollout narrow");
    expect(normalized.searchableText).toContain("post the blocker in chat.");
  });

  test("AMSESS-002: normalized assistant artifacts are cloned rather than aliasing the stored input", () => {
    const storedSession = createBaseStoredSession({
      artifacts: {
        summaries: {},
        assistantOutputs: {
          "assistant-output-1": {
            id: "assistant-output-1",
            triggerEventId: "evt-1",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "What is the biggest rollout risk?",
            triggerTimestamp: 1_700_000_010_000,
            profileId: "client_call",
            content: "Name the blocker and the next safe milestone.",
            createdAt: 1_700_000_020_000,
            provider: "openai",
            model: "gpt-5-mini",
          },
        },
        assistantMemory: {
          updatedAt: 1_700_000_030_000,
          content: "Memory before normalization",
          sourceEventCount: 3,
        },
        assistantState: {
          enabled: false,
          updatedAt: 1_700_000_040_000,
        },
      },
    });

    const normalized = normalizeMeetingSession(storedSession);
    normalized.artifacts!.assistantOutputs!["assistant-output-1"]!.content =
      "Mutated normalized output";
    normalized.artifacts!.assistantMemory!.content = "Mutated normalized memory";
    normalized.artifacts!.assistantState!.enabled = true;

    expect(
      storedSession.artifacts?.assistantOutputs?.["assistant-output-1"]?.content
    ).toBe("Name the blocker and the next safe milestone.");
    expect(storedSession.artifacts?.assistantMemory?.content).toBe(
      "Memory before normalization"
    );
    expect(storedSession.artifacts?.assistantState?.enabled).toBe(false);
  });

  test("AMSESS-003: buildMeetingSessionSearchableText indexes assistant trigger text and assistant content", () => {
    const searchable = buildMeetingSessionSearchableText(
      createBaseStoredSession({
        artifacts: {
          summaries: {},
          assistantOutputs: {
            "assistant-output-1": {
              id: "assistant-output-1",
              triggerEventId: "evt-1",
              source: "caption",
              speaker: "Client",
              triggerText: "Can you summarize the procurement blocker?",
              triggerTimestamp: 1_700_000_010_000,
              profileId: "client_call",
              content: "Summarize the procurement blocker and the next dependency.",
              createdAt: 1_700_000_020_000,
              provider: "openai",
              model: "gpt-5-mini",
            },
          },
        },
      })
    );

    expect(searchable).toContain("client");
    expect(searchable).toContain("can you summarize the procurement blocker?");
    expect(searchable).toContain(
      "summarize the procurement blocker and the next dependency."
    );
  });
});
