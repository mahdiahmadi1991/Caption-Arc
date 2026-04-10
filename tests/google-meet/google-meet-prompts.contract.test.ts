import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { updateSettings, setOverlay } from "../../entrypoints/content/state";
import {
  forceResolveActivePrompt,
  requestCaptureConsent,
  requestSessionEndedDecision,
  requestSessionContinuationDecision,
} from "../../entrypoints/content/overlay/capture-consent";

function mountOverlayRoot(): HTMLDivElement {
  const overlayEl = document.createElement("div");
  overlayEl.id = "captionarc-overlay";
  document.body.appendChild(overlayEl);
  setOverlay(overlayEl);
  return overlayEl;
}

function getPromptButtons(): {
  primary: HTMLButtonElement;
  secondary: HTMLButtonElement;
} {
  const primary = document.querySelector(
    ".mc-capture-consent-action-primary"
  ) as HTMLButtonElement | null;
  const secondary = document.querySelector(
    ".mc-capture-consent-action-secondary"
  ) as HTMLButtonElement | null;

  if (!primary || !secondary) {
    throw new Error("Prompt action buttons are not available.");
  }

  return { primary, secondary };
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  document.body.innerHTML = "";
  setOverlay(null);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Google Meet startup prompts contract", () => {
  test("GM-PRM-001: capture startup prompt resolves to approved on primary action", async () => {
    vi.useFakeTimers();
    mountOverlayRoot();
    updateSettings({ overlayVisible: true });

    const decisionPromise = requestCaptureConsent("Google Meet");
    await Promise.resolve();

    const prompt = document.querySelector(".mc-capture-consent");
    expect(prompt).not.toBeNull();

    const { primary } = getPromptButtons();
    primary.click();

    await expect(decisionPromise).resolves.toBe("approved");
    expect(document.querySelector(".mc-capture-consent")).toBeNull();
  });

  test("GM-PRM-002: session continuation prompt resolves to restart on secondary action", async () => {
    vi.useFakeTimers();
    mountOverlayRoot();
    updateSettings({ overlayVisible: true });

    const decisionPromise = requestSessionContinuationDecision("Google Meet");
    await Promise.resolve();

    const promptTitle =
      document.querySelector(".mc-capture-consent-title")?.textContent || "";
    expect(promptTitle.toLowerCase()).toContain("continue the previous session");

    const { secondary } = getPromptButtons();
    secondary.click();

    await expect(decisionPromise).resolves.toBe("restart");
    expect(document.querySelector(".mc-capture-consent")).toBeNull();
  });

  test("GM-PRM-003: session continuation prompt timeout defaults to restart", async () => {
    vi.useFakeTimers();
    mountOverlayRoot();
    updateSettings({ overlayVisible: true });

    const decisionPromise = requestSessionContinuationDecision("Google Meet");
    await Promise.resolve();

    await vi.advanceTimersByTimeAsync(31_000);
    await expect(decisionPromise).resolves.toBe("restart");
    expect(document.querySelector(".mc-capture-consent")).toBeNull();
  });

  test("RPROMPT-004: hidden overlay session-ended prompt resolves timeout decision immediately", async () => {
    updateSettings({ overlayVisible: false });

    await expect(requestSessionEndedDecision("Google Meet")).resolves.toBe("exit");
    expect(document.querySelector(".mc-capture-consent")).toBeNull();
  });

  test("RPROMPT-005: opening a new prompt replaces the previous active prompt lifecycle", async () => {
    vi.useFakeTimers();
    mountOverlayRoot();
    updateSettings({ overlayVisible: true });

    void requestCaptureConsent("Google Meet");
    await Promise.resolve();
    const continuationDecisionPromise = requestSessionContinuationDecision("Google Meet");
    await Promise.resolve();

    expect(document.querySelectorAll(".mc-capture-consent")).toHaveLength(1);
    expect(forceResolveActivePrompt("capture-consent", "dismissed")).toBe(false);
    expect(forceResolveActivePrompt("session-continuation", "restart")).toBe(true);
    await expect(continuationDecisionPromise).resolves.toBe("restart");
  });

  test("RPROMPT-006: escape resolves configured escape decision", async () => {
    vi.useFakeTimers();
    mountOverlayRoot();
    updateSettings({ overlayVisible: true });

    const decisionPromise = requestCaptureConsent("Google Meet");
    await Promise.resolve();

    const prompt = document.querySelector(".mc-capture-consent");
    expect(prompt).not.toBeNull();
    prompt?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    await expect(decisionPromise).resolves.toBe("dismissed");
  });

  test("RPROMPT-007: session-ended timeout resolves exit", async () => {
    vi.useFakeTimers();
    mountOverlayRoot();
    updateSettings({ overlayVisible: true });

    const decisionPromise = requestSessionEndedDecision("Google Meet");
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(31_000);
    await expect(decisionPromise).resolves.toBe("exit");
  });

  test("RPROMPT-008: force-resolve applies only to matching active prompt kind", async () => {
    vi.useFakeTimers();
    mountOverlayRoot();
    updateSettings({ overlayVisible: true });

    const decisionPromise = requestSessionEndedDecision("Google Meet");
    await Promise.resolve();

    expect(forceResolveActivePrompt("capture-consent", "dismissed")).toBe(false);
    expect(forceResolveActivePrompt("session-ended", "exit")).toBe(true);
    await expect(decisionPromise).resolves.toBe("exit");
  });
});
