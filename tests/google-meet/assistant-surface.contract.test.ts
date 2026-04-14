import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const {
  getCurrentSessionIdMock,
  toggleAssistantSessionEnabledMock,
  clearAssistantUnreadStateMock,
} = vi.hoisted(() => ({
  getCurrentSessionIdMock: vi.fn(),
  toggleAssistantSessionEnabledMock: vi.fn(async () => true),
  clearAssistantUnreadStateMock: vi.fn(),
}));

vi.mock("../../entrypoints/content/history-service", () => ({
  getCurrentSessionId: getCurrentSessionIdMock,
}));

vi.mock("../../entrypoints/content/assistant-service", () => ({
  ASSISTANT_LIVE_UPDATED_EVENT: "captionarc:assistant-live-updated",
  toggleAssistantSessionEnabled: toggleAssistantSessionEnabledMock,
  clearAssistantUnreadState: clearAssistantUnreadStateMock,
}));

import {
  resetContentState,
  setAssistantLiveOutputs,
  setAssistantLivePendingOutputs,
  setAssistantLiveState,
  setAssistantSessionEnabled,
  setAssistantSurfaceOpen,
  setAssistantSurfaceUnread,
  setAssistantSurfaceUnreadCount,
  setAssistantSurfaceVisible,
  setMeetingPresenceState,
  setOverlay,
  updateSettings,
} from "../../entrypoints/content/state";
import {
  createAssistantSurface,
  destroyAssistantSurface,
  syncAssistantSurface,
} from "../../entrypoints/content/overlay/assistant-surface";

function stubMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

function mountOverlay(): HTMLElement {
  const overlayEl = document.createElement("div");
  overlayEl.id = "captionarc-overlay";
  overlayEl.dataset.theme = "light";
  document.body.appendChild(overlayEl);
  setOverlay(overlayEl);
  return overlayEl;
}

function seedOperationalOpenAiSettings(): void {
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
    overlayVisible: true,
    overlayClickThrough: false,
  });
}

describe("Assistant surface contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn(() => undefined));
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: (assetPath: string) => `chrome-extension://test/${assetPath}`,
        sendMessage: vi.fn(async () => ({ success: true })),
      },
    });
    stubMatchMedia();
    document.body.innerHTML = "";
    resetContentState();
    getCurrentSessionIdMock.mockReturnValue("session-1");
    seedOperationalOpenAiSettings();
    mountOverlay();
    setMeetingPresenceState("joined");
    setAssistantSurfaceVisible(true);
    setAssistantSurfaceOpen(false);
    setAssistantSurfaceUnread(false);
    setAssistantSurfaceUnreadCount(0);
    setAssistantLiveOutputs([]);
    setAssistantLivePendingOutputs([]);
    setAssistantLiveState("watching");
    setAssistantSessionEnabled(true);
  });

  afterEach(() => {
    destroyAssistantSurface();
    resetContentState();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  test("OVLAY-011: render state follows runtime state without synthetic streaming fallback", () => {
    setAssistantLiveState("watching");
    setAssistantLivePendingOutputs([]);

    createAssistantSurface();
    syncAssistantSurface();

    const shell = document.querySelector("#captionarc-assistant-top-shell");
    expect(shell).toBeInstanceOf(HTMLElement);
    expect(shell?.getAttribute("data-state")).toBe("watching");
    expect(document.querySelectorAll(".mc-assistant-card-pending")).toHaveLength(0);
  });

  test("OVLAY-012: pending cards are rendered only from live pending outputs", () => {
    setAssistantLiveState("triggered");
    setAssistantLivePendingOutputs([
      {
        triggerEventId: "evt-1",
        triggerStableEventKey: "stable-1",
        source: "caption",
        speaker: "Participant",
        triggerText: "Can you summarize the risk for this timeline?",
        queuedAt: Date.now(),
        partialContent: "Working on a concise reply...",
      },
    ]);

    createAssistantSurface();
    syncAssistantSurface();

    const shell = document.querySelector("#captionarc-assistant-top-shell");
    expect(shell?.getAttribute("data-state")).toBe("triggered");
    const pendingCards = document.querySelectorAll(".mc-assistant-card-pending");
    expect(pendingCards).toHaveLength(1);
    expect(pendingCards[0]?.textContent).toContain("Working on a concise reply...");
  });

  test("OVLAY-013: live toggle active state depends on assistant session enablement only", () => {
    setAssistantSessionEnabled(false);
    setAssistantLiveState("suppressed");
    setAssistantLivePendingOutputs([]);

    createAssistantSurface();
    syncAssistantSurface();

    const shell = document.querySelector("#captionarc-assistant-top-shell");
    const toggleButton = document.querySelector(".mc-assistant-toggle");
    expect(shell?.getAttribute("data-state")).toBe("suppressed");
    expect(toggleButton).toBeInstanceOf(HTMLButtonElement);
    expect(toggleButton?.classList.contains("mc-active")).toBe(false);
  });
});
