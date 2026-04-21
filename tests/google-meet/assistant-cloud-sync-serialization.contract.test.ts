import { describe, expect, test } from "vitest";
import {
  buildSessionArtifactsPayload,
  getSessionArtifactsSyncContentHash,
  parseSessionArtifactsPayload,
} from "../../entrypoints/background/cloud-sync/serialization";

function createSessionFixture() {
  return {
    id: "session-1",
    sessionSyncId: "sync-1",
    updatedAt: 1_700_000_000_000,
    summaries: {
      "default:en:1": {
        key: "default:en:1",
        groupKey: "default:en",
        profileId: "default",
        profileName: "Default",
        language: "en",
        content: "Summary A",
        generatedAt: 1_700_000_000_000,
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
          generatedAt: 1_700_000_000_000,
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
          triggerStableEventKey: "stable-1",
          source: "caption",
          speaker: "Alex",
          triggerText: "Summarize the rollout blocker",
          triggerTimestamp: 1_700_000_000_000,
          profileId: "client_call",
          content: "Assistant output",
          createdAt: 1_700_000_000_000,
          provider: "openai",
          model: "gpt-5",
          responseIntent: "surface_risks",
          responseFormat: "structured_sections",
          responseDepth: "expanded",
          responseTone: "analytical",
          deliveryBias: "careful",
        },
      },
      assistantMemory: {
        updatedAt: 1_700_000_000_100,
        content: "Memory A",
        sourceEventCount: 4,
      },
      assistantState: {
        enabled: true,
        updatedAt: 1_700_000_000_200,
      },
    },
  } as const;
}

describe("Assistant cloud-sync serialization contract", () => {
  test("ACSYNC-001: assistant artifacts payloads preserve response metadata and memory counts through parse", () => {
    const session = createSessionFixture();

    const payload = buildSessionArtifactsPayload(session as never);
    expect(payload).toMatchObject({
      sessionSyncId: "sync-1",
      assistantOutputs: {
        "assistant-1": {
          triggerStableEventKey: "stable-1",
          source: "caption",
          profileId: "client_call",
          responseIntent: "surface_risks",
          responseFormat: "structured_sections",
          responseDepth: "expanded",
          responseTone: "analytical",
          deliveryBias: "careful",
        },
      },
      assistantMemory: {
        content: "Memory A",
        sourceEventCount: 4,
      },
      assistantState: {
        enabled: true,
      },
    });

    const parsed = parseSessionArtifactsPayload(payload);
    expect(parsed).toMatchObject({
      sessionSyncId: "sync-1",
      assistantOutputs: {
        "assistant-1": {
          triggerStableEventKey: "stable-1",
          source: "caption",
          speaker: "Alex",
          triggerText: "Summarize the rollout blocker",
          profileId: "client_call",
          responseIntent: "surface_risks",
          responseFormat: "structured_sections",
          responseDepth: "expanded",
          responseTone: "analytical",
          deliveryBias: "careful",
        },
      },
      assistantMemory: {
        content: "Memory A",
        sourceEventCount: 4,
      },
      assistantState: {
        enabled: true,
      },
    });
  });

  test("ACSYNC-002: assistant artifact hash is order-stable but changes when assistant metadata changes", () => {
    const session = createSessionFixture();
    const reorderedSession = {
      ...session,
      artifacts: {
        ...session.artifacts,
        assistantOutputs: {
          "assistant-2": {
            id: "assistant-2",
            triggerEventId: "event-2",
            triggerStableEventKey: "stable-2",
            source: "chat" as const,
            speaker: "Moderator",
            triggerText: "Post the blocker in chat",
            triggerTimestamp: 1_700_000_000_050,
            profileId: "daily_sync",
            content: "Post the blocker in chat",
            createdAt: 1_700_000_000_050,
            provider: "openai",
            model: "gpt-5",
            responseIntent: "suggest_next_point" as const,
            responseFormat: "bullets" as const,
            responseDepth: "brief" as const,
            responseTone: "direct" as const,
            deliveryBias: "fastest" as const,
          },
          "assistant-1": session.artifacts.assistantOutputs["assistant-1"],
        },
      },
    };
    const reorderedSessionSameSemantic = {
      ...reorderedSession,
      artifacts: {
        ...reorderedSession.artifacts,
        assistantOutputs: {
          "assistant-1": session.artifacts.assistantOutputs["assistant-1"],
          "assistant-2": reorderedSession.artifacts.assistantOutputs["assistant-2"],
        },
      },
    };
    const metadataChangedSession = {
      ...reorderedSessionSameSemantic,
      artifacts: {
        ...reorderedSessionSameSemantic.artifacts,
        assistantOutputs: {
          ...reorderedSessionSameSemantic.artifacts.assistantOutputs,
          "assistant-1": {
            ...reorderedSessionSameSemantic.artifacts.assistantOutputs["assistant-1"],
            responseFormat: "script" as const,
          },
        },
      },
    };

    expect(getSessionArtifactsSyncContentHash(reorderedSession as never)).toBe(
      getSessionArtifactsSyncContentHash(reorderedSessionSameSemantic as never)
    );
    expect(getSessionArtifactsSyncContentHash(metadataChangedSession as never)).not.toBe(
      getSessionArtifactsSyncContentHash(reorderedSession as never)
    );
  });

  test("ACSYNC-003: parseSessionArtifactsPayload sanitizes invalid assistant metadata instead of persisting garbage", () => {
    const parsed = parseSessionArtifactsPayload({
      sessionSyncId: "sync-1",
      assistantOutputs: {
        "assistant-1": {
          id: "",
          triggerEventId: "event-1",
          triggerStableEventKey: "stable-1",
          source: "bad-source",
          speaker: 77,
          triggerText: "Trigger text",
          triggerTimestamp: "bad-time",
          profileId: 42,
          content: "Assistant output",
          createdAt: "bad-created-at",
          provider: 22,
          model: 33,
          responseIntent: "bad-intent",
          responseFormat: "bad-format",
          responseDepth: "bad-depth",
          responseTone: "bad-tone",
          deliveryBias: "bad-bias",
        },
      },
      assistantMemory: {
        updatedAt: "bad-updated-at",
        content: "Memory A",
        sourceEventCount: "bad-count",
      },
      assistantState: {
        enabled: false,
        updatedAt: "bad-state-time",
      },
    });

    expect(parsed).toMatchObject({
      sessionSyncId: "sync-1",
      assistantOutputs: {
        "assistant-1": {
          id: "assistant-1",
          triggerEventId: "event-1",
          triggerStableEventKey: "stable-1",
          source: "caption",
          speaker: "Unknown",
          triggerText: "Trigger text",
          profileId: "",
          content: "Assistant output",
          responseIntent: undefined,
          responseFormat: undefined,
          responseDepth: undefined,
          responseTone: undefined,
          deliveryBias: undefined,
        },
      },
      assistantMemory: {
        content: "Memory A",
        sourceEventCount: undefined,
      },
      assistantState: {
        enabled: false,
      },
    });
  });
});
