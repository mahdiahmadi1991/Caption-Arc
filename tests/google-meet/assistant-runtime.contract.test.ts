import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { getCurrentSessionIdMock, setCurrentSessionAssistantEnabledMock } = vi.hoisted(() => ({
  getCurrentSessionIdMock: vi.fn(),
  setCurrentSessionAssistantEnabledMock: vi.fn(),
}));

vi.mock("../../entrypoints/content/history-service", () => ({
  getCurrentSessionId: getCurrentSessionIdMock,
  setCurrentSessionAssistantEnabled: setCurrentSessionAssistantEnabledMock,
}));

import {
  assistantLiveOutputs,
  assistantLivePendingOutputs,
  assistantLiveState,
  assistantSessionEnabled,
  assistantSurfaceUnread,
  assistantSurfaceUnreadCount,
  setAssistantLiveOutputs,
  setAssistantLivePendingOutputs,
  setAssistantLiveState,
  setAssistantSessionEnabled,
  setAssistantSurfaceOpen,
  setAssistantSurfaceUnread,
  setAssistantSurfaceUnreadCount,
  updateSettings,
} from "../../entrypoints/content/state";
import {
  assistantServiceInternals,
  clearAssistantUnreadState,
  startAssistantSync,
  stopAssistantSync,
  toggleAssistantSessionEnabled,
} from "../../entrypoints/content/assistant-service";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  getCurrentSessionIdMock.mockReturnValue("session-1");
  setCurrentSessionAssistantEnabledMock.mockResolvedValue(true);

  updateSettings({
    openaiApiKey: "sk-live",
    model: "gpt-5-mini",
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
  });

  setAssistantSurfaceOpen(false);
  setAssistantSurfaceUnread(false);
  setAssistantSurfaceUnreadCount(0);
  setAssistantLiveOutputs([]);
  setAssistantLivePendingOutputs([]);
  setAssistantSessionEnabled(false);
  setAssistantLiveState("watching");
});

afterEach(() => {
  stopAssistantSync();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Assistant runtime contract", () => {
  test("ASRT-001: profile resolution prefers session profile and deterministic default fallback", () => {
    const defaultProfile = {
      id: "default",
      name: "Default",
      autoSummarizeOnMeetingEnd: false,
      summaryGenerationMode: "balanced",
      prompt: "default",
      assistant: { enabledByDefault: false },
    };
    const enabledProfile = {
      ...defaultProfile,
      id: "focus",
      assistant: { enabledByDefault: true },
    };

    updateSettings({
      summaryProfiles: [defaultProfile as never, enabledProfile as never],
      defaultSummaryProfileId: "default",
    });

    const resolvedFromSession = assistantServiceInternals.getResolvedMeetingProfile({
      summaryProfileId: "focus",
    } as never);
    expect(resolvedFromSession?.id).toBe("focus");
    expect(
      assistantServiceInternals.getResolvedAssistantEnabled({
        summaryProfileId: "focus",
        artifacts: {},
      } as never)
    ).toBe(true);
  });

  test("ASRT-002: assistant session application sorts outputs and derives deterministic live state", () => {
    assistantServiceInternals.applyAssistantSession(
      {
        id: "session-1",
        summaryProfileId: "default",
        artifacts: {
          assistantOutputs: {
            b: { id: "b", content: "later", createdAt: 20 },
            a: { id: "a", content: "earlier", createdAt: 10 },
          },
          assistantState: { enabled: true, updatedAt: Date.now() },
        },
      } as never,
      {
        status: "triggered",
        pendingOutputs: [
          { triggerEventId: "2", triggerText: "b", queuedAt: 22 },
          { triggerEventId: "1", triggerText: "a", queuedAt: 11 },
        ],
      }
    );

    expect(assistantLiveOutputs.map((item) => item.id)).toEqual(["a", "b"]);
    expect(
      assistantLivePendingOutputs.map((item) => item.triggerEventId)
    ).toEqual(["1", "2"]);
    expect(assistantSessionEnabled).toBe(true);
    expect(assistantLiveState).toBe("triggered");
  });

  test("ASRT-003: unread advances only while assistant surface is closed", () => {
    assistantServiceInternals.applyAssistantSession(
      {
        id: "session-1",
        summaryProfileId: "default",
        artifacts: {
          assistantOutputs: {
            a: { id: "a", content: "first", createdAt: 1 },
          },
        },
      } as never,
      { status: "done", pendingOutputs: [] }
    );

    expect(assistantSurfaceUnread).toBe(true);
    expect(assistantSurfaceUnreadCount).toBe(1);

    clearAssistantUnreadState();
    setAssistantSurfaceOpen(true);
    assistantServiceInternals.applyAssistantSession(
      {
        id: "session-1",
        summaryProfileId: "default",
        artifacts: {
          assistantOutputs: {
            a: { id: "a", content: "first", createdAt: 1 },
            b: { id: "b", content: "second", createdAt: 2 },
          },
        },
      } as never,
      { status: "done", pendingOutputs: [] }
    );

    expect(assistantSurfaceUnread).toBe(false);
    expect(assistantSurfaceUnreadCount).toBe(0);
  });

  test("ASRT-004: sync polling hits session and live-state endpoints every 1200ms", async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn(async (payload: { action: string }) => {
          if (payload.action === "getMeetingSession") {
            return {
              success: true,
              session: {
                id: "session-1",
                artifacts: { assistantOutputs: {} },
              },
            };
          }
          return {
            success: true,
            liveState: { status: "watching", pendingOutputs: [] },
          };
        }),
      },
    });

    startAssistantSync();
    await vi.advanceTimersByTimeAsync(
      assistantServiceInternals.getAssistantPollIntervalMs() * 2 + 10
    );

    const sendMessageMock = (globalThis.chrome as never).runtime.sendMessage as ReturnType<
      typeof vi.fn
    >;
    const actions = sendMessageMock.mock.calls.map((call) => call[0]?.action);
    expect(actions.filter((action) => action === "getMeetingSession").length).toBeGreaterThan(1);
    expect(
      actions.filter((action) => action === "getMeetingAssistantLiveState").length
    ).toBeGreaterThan(1);
  });

  test("ASRT-005: enabling assistant is blocked when OpenAI availability is not operational", async () => {
    updateSettings({
      openaiApiKey: "",
      model: "",
      verificationSnapshot: null,
    });

    const result = await toggleAssistantSessionEnabled(true);
    expect(result).toBe(false);
    expect(setCurrentSessionAssistantEnabledMock).not.toHaveBeenCalled();
    expect(assistantLiveState).toBe("error");
  });
});
