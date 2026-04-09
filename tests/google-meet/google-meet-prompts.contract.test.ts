import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { updateSettings, setOverlay } from "../../entrypoints/content/state";
import {
  requestCaptureConsent,
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
});
