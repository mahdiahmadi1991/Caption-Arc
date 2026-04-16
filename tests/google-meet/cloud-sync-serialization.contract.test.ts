import { describe, expect, test } from "vitest";

import {
  buildSessionEventsChunkPayloads,
  buildSessionArtifactsPayload,
  buildSessionEventsPayload,
  getSessionArtifactsSyncContentHash,
  getSessionEventsSyncContentHash,
  parseSessionArtifactsPayload,
  parseSessionEventsChunkPayload,
  parseSessionEventsManifestPayload,
  parseSessionEventsPayload,
} from "../../entrypoints/background/cloud-sync/serialization";

function createSessionFixture() {
  return {
    id: "session-1",
    sessionSyncId: "sync-1",
    updatedAt: 1_000_000,
    events: [
      {
        eventId: "event-1",
        stableEventKey: "stable-1",
        source: "caption",
        speaker: "Alex",
        text: "Hello world",
        time: "00:01",
        timestamp: 1_000_000,
        isFinal: true,
      },
    ],
    summaries: {
      "default:en:1": {
        key: "default:en:1",
        groupKey: "default:en",
        profileId: "default",
        profileName: "Default",
        language: "en",
        content: "Summary A",
        generatedAt: 1_000_000,
        provider: "openai",
        model: "gpt-5",
        instructionSnapshot: "",
        sourceFingerprint: "fp-1",
        captionCount: 1,
      },
    },
    artifacts: {
      summaries: {
        "default:en:1": {
          key: "default:en:1",
          groupKey: "default:en",
          profileId: "default",
          profileName: "Default",
          language: "en",
          content: "Summary A",
          generatedAt: 1_000_000,
          provider: "openai",
          model: "gpt-5",
          instructionSnapshot: "",
          sourceFingerprint: "fp-1",
          captionCount: 1,
        },
      },
      assistantOutputs: {
        "assistant-1": {
          id: "assistant-1",
          triggerEventId: "event-1",
          source: "caption",
          speaker: "Alex",
          triggerText: "Hello world",
          triggerTimestamp: 1_000_000,
          profileId: "default",
          content: "Assistant output",
          createdAt: 1_000_000,
          provider: "openai",
          model: "gpt-5",
        },
      },
      assistantMemory: {
        updatedAt: 1_000_000,
        content: "Memory A",
      },
      assistantState: {
        enabled: true,
        updatedAt: 1_000_000,
      },
    },
  } as const;
}

describe("Cloud sync serialization contract", () => {
  test("CSYNC-SER-001: split payloads keep event stream separate from artifacts", () => {
    const session = createSessionFixture();

    const eventsPayload = buildSessionEventsPayload(session);
    const artifactsPayload = buildSessionArtifactsPayload(session);

    expect(eventsPayload).toMatchObject({
      sessionSyncId: "sync-1",
      events: [
        expect.objectContaining({
          eventId: "event-1",
          text: "Hello world",
        }),
      ],
    });
    expect(eventsPayload).not.toHaveProperty("summaries");
    expect(eventsPayload).not.toHaveProperty("assistantOutputs");

    expect(artifactsPayload).toMatchObject({
      sessionSyncId: "sync-1",
      summaries: {
        "default:en:1": expect.objectContaining({
          content: "Summary A",
        }),
      },
      assistantOutputs: {
        "assistant-1": expect.objectContaining({
          content: "Assistant output",
        }),
      },
    });
  });

  test("CSYNC-SER-002: artifact-only changes do not perturb the event-stream hash", () => {
    const session = createSessionFixture();
    const changedArtifactsSession = {
      ...session,
      summaries: {
        ...session.summaries,
        "default:en:1": {
          ...session.summaries["default:en:1"],
          content: "Summary B",
        },
      },
      artifacts: {
        ...session.artifacts,
        summaries: {
          ...session.artifacts.summaries,
          "default:en:1": {
            ...session.artifacts.summaries["default:en:1"],
            content: "Summary B",
          },
        },
      },
    };

    expect(getSessionEventsSyncContentHash(changedArtifactsSession)).toBe(
      getSessionEventsSyncContentHash(session)
    );
    expect(getSessionArtifactsSyncContentHash(changedArtifactsSession)).not.toBe(
      getSessionArtifactsSyncContentHash(session)
    );
  });

  test("CSYNC-SER-003: canonical event payloads parse without embedded artifacts", () => {
    const parsedPayload = parseSessionEventsPayload({
      sessionSyncId: "sync-1",
      updatedAt: 1_000_000,
      syncContentHash: "hash-1",
      events: [
        {
          eventId: "event-1",
          source: "caption",
          speaker: "Alex",
          text: "Canonical event",
          time: "00:01",
          timestamp: 1_000_000,
        },
      ],
    });

    expect(parsedPayload).toMatchObject({
      sessionSyncId: "sync-1",
      events: [expect.objectContaining({ text: "Canonical event" })],
      summaries: {},
      assistantOutputs: {},
    });
  });

  test("CSYNC-SER-004: artifact payloads parse independently of event payloads", () => {
    const session = createSessionFixture();

    const artifactsPayload = parseSessionArtifactsPayload(
      buildSessionArtifactsPayload(session)
    );

    expect(artifactsPayload).toMatchObject({
      sessionSyncId: "sync-1",
      summaries: {
        "default:en:1": expect.objectContaining({ content: "Summary A" }),
      },
      assistantOutputs: {
        "assistant-1": expect.objectContaining({ content: "Assistant output" }),
      },
      assistantMemory: expect.objectContaining({ content: "Memory A" }),
      assistantState: expect.objectContaining({ enabled: true }),
    });
  });

  test("CSYNC-SER-005: large event streams serialize into a manifest plus stable chunks", () => {
    const session = {
      ...createSessionFixture(),
      events: Array.from({ length: 205 }, (_, index) => ({
        eventId: `event-${index + 1}`,
        stableEventKey: `stable-${index + 1}`,
        source: "caption" as const,
        speaker: "Alex",
        text: `Line ${index + 1}`,
        time: "00:01",
        timestamp: 1_000_000 + index,
        isFinal: true,
      })),
    };

    const chunked = buildSessionEventsChunkPayloads(session as never);

    expect(chunked.manifest.totalEventCount).toBe(205);
    expect(chunked.manifest.chunks).toHaveLength(3);
    expect(chunked.chunks.map((chunk) => chunk.events.length)).toEqual([100, 100, 5]);
    expect(
      chunked.chunks.every(
        (chunk) =>
          parseSessionEventsChunkPayload(chunk)?.contentHash === chunk.contentHash
      )
    ).toBe(true);
    expect(parseSessionEventsManifestPayload(chunked.manifest)).toMatchObject({
      sessionSyncId: "sync-1",
      totalEventCount: 205,
      chunkSize: 100,
      chunks: [
        expect.objectContaining({ index: 0, eventCount: 100 }),
        expect.objectContaining({ index: 1, eventCount: 100 }),
        expect.objectContaining({ index: 2, eventCount: 5 }),
      ],
    });
  });
});
