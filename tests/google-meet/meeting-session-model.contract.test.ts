import { describe, expect, test } from "vitest";
import {
  buildMeetingSessionTimelineSegments,
  buildStableMeetingEventKey,
  getMeetingDisplayTitle,
  normalizeMeetingSession,
  sanitizeMeetingSessionIdentifiers,
} from "../../entrypoints/shared/meeting-session";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";

function createBaseStoredSession(
  overrides: Partial<MeetingSession> = {}
): MeetingSession {
  const now = Date.now();
  return {
    id: "session-1",
    sessionSyncId: "session-1",
    schemaVersion: 3,
    platform: "microsoft-teams",
    providerLabel: "Microsoft Teams Web",
    meetingUrl: "https://teams.microsoft.com/l/meetup-join/123",
    title: "Weekly Sync",
    starred: false,
    identifiers: {
      meetingCode: "123456789",
    },
    sessionFingerprint: "fp-1",
    lifecycleState: "ended",
    startTime: now - 60_000,
    endTime: now - 30_000,
    lastSeenAt: now - 30_000,
    updatedAt: now - 20_000,
    searchableText: "",
    events: [],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
    ...overrides,
  };
}

describe("Meeting session model contract", () => {
  test("MSESS-001: Teams sanitization keeps direct calls isolated and normalizes numeric identifiers", () => {
    const direct = sanitizeMeetingSessionIdentifiers("microsoft-teams", {
      meetingCode: "123456",
      callType: "direct-call",
    });
    expect(direct).toEqual({ callType: "direct-call" });

    const normalized = sanitizeMeetingSessionIdentifiers("microsoft-teams", {
      meetingId: " 123456789 ",
    });
    expect(normalized).toEqual({
      meetingCode: "123456789",
      meetingId: "123456789",
      callType: undefined,
    });
  });

  test("MSESS-002: display title distinguishes direct calls from scheduled meetings", () => {
    expect(
      getMeetingDisplayTitle({
        title: "Alice",
        identifiers: { callType: "direct-call" },
      })
    ).toBe("Direct call with Alice");

    expect(
      getMeetingDisplayTitle({
        title: "",
        identifiers: { meetingCode: "654321" },
      })
    ).toBe("Meeting 654321");
  });

  test("MSESS-003: timeline segments are ordered and preserve continuation gap metadata", () => {
    const segments = buildMeetingSessionTimelineSegments(
      1_000,
      [
        { previousEndTime: 4_000, resumedAt: 8_000, gapMs: 4_000 },
        { previousEndTime: 10_000, resumedAt: 12_000, gapMs: 2_000 },
      ],
      16_000
    );

    expect(segments).toHaveLength(3);
    expect(segments.map((segment) => segment.index)).toEqual([0, 1, 2]);
    expect(segments[0]).toMatchObject({
      startTime: 1_000,
      endTime: 4_000,
      isContinuation: false,
    });
    expect(segments[1]).toMatchObject({
      startTime: 8_000,
      endTime: 10_000,
      isContinuation: true,
      gapMs: 4_000,
    });
    expect(segments[2]).toMatchObject({
      startTime: 12_000,
      endTime: 16_000,
      isContinuation: true,
      gapMs: 2_000,
    });
  });

  test("MSESS-004: stable event keys prefer provider IDs and otherwise hash timestamp buckets", () => {
    const fromProvider = buildStableMeetingEventKey("fp", {
      source: "chat",
      providerEventId: "MESSAGE-42",
      speaker: "Alice",
      text: "Hello",
      timestamp: 10_001,
    });
    expect(fromProvider).toBe("fp:chat:provider:message-42");

    const derivedA = buildStableMeetingEventKey("fp", {
      source: "caption",
      speaker: "Alice",
      text: "Same text",
      timestamp: 10_010,
    });
    const derivedB = buildStableMeetingEventKey("fp", {
      source: "caption",
      speaker: "Alice",
      text: "Same text",
      timestamp: 10_020,
    });
    expect(derivedA).toBe(derivedB);
  });

  test("MSESS-005: normalization rebuilds derived/searchable data and sync hash", () => {
    const normalized = normalizeMeetingSession(
      createBaseStoredSession({
        searchableText: "",
        syncContentHash: undefined,
        captions: [
          {
            speaker: "Bob",
            text: "Need to ship by Friday",
            time: "10:00",
            timestamp: 1_500,
            sessionOffsetMs: 500,
          },
        ],
        summaries: {
          "profile:fa:1": {
            key: "profile:fa:1",
            groupKey: "profile:fa",
            profileId: "profile",
            profileName: "Default",
            language: "fa",
            content: "خلاصه جلسه",
            generatedAt: Date.now(),
            provider: "openai",
            model: "gpt-5-mini",
            instructionSnapshot: "prompt",
            sourceFingerprint: "fp",
            captionCount: 1,
          },
        },
      })
    );

    expect(normalized.derived?.captionCount).toBe(0);
    expect(normalized.searchableText).toContain("weekly sync");
    expect(normalized.searchableText).toContain("خلاصه جلسه");
    expect(typeof normalized.syncContentHash).toBe("string");
    expect(normalized.syncContentHash?.length).toBeGreaterThan(0);
  });
});
