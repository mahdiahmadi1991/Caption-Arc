import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App, {
  getQuickAccessSoftRefreshPresentation,
} from "../../entrypoints/popup/App";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import {
  REQUEST_QUICK_ACCESS_SOFT_REFRESH_ACTION,
  type QuickAccessRuntimeStatus,
} from "../../entrypoints/shared/quick-access-status";
import {
  I18nProvider,
  createTranslator,
} from "../../entrypoints/shared/i18n";

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

async function mountApp() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let root: Root | null = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(
        I18nProvider,
        { locale: "en" },
        React.createElement(App)
      )
    );
    await flushMicrotasks();
  });

  return {
    container,
    async cleanup() {
      await act(async () => {
        root?.unmount();
        await flushMicrotasks();
      });
      root = null;
      container.remove();
    },
  };
}

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Popup quick-access recovery refresh contract", () => {
  test("POP-REFRESH-001: presentation becomes refreshable only when an active runtime snapshot is available", () => {
    const t = createTranslator("en");
    const readyPresentation = getQuickAccessSoftRefreshPresentation(
      {
        platform: "google-meet",
        meetingPresence: "joined",
        hasActiveMeetingSession: true,
        updatedAt: Date.now(),
      },
      false,
      t
    );

    expect(readyPresentation.enabled).toBe(true);
    expect(readyPresentation.stateLabel).toBe("Ready");
    expect(readyPresentation.detail).toContain("Google Meet");

    const unavailablePresentation = getQuickAccessSoftRefreshPresentation(
      null,
      false,
      t
    );

    expect(unavailablePresentation.enabled).toBe(false);
    expect(unavailablePresentation.stateLabel).toBe("Unavailable");
  });

  test("POP-REFRESH-002: popup dispatches the recovery refresh action when the control is enabled", async () => {
    let runtimeStatus: QuickAccessRuntimeStatus | null = {
      platform: "google-meet",
      meetingPresence: "joined",
      hasActiveMeetingSession: true,
      updatedAt: Date.now(),
    };
    const sendMessageMock = vi.fn(async (message: { action?: string }) => {
      switch (message.action) {
        case "getSettings":
          return {
            success: true,
            settings: createDefaultSettings(),
          };
        case "getMeetingHistoryIndex":
          return {
            success: true,
            sessions: [],
          };
        case "getMeetingSummaryJobStatuses":
          return {
            success: true,
            statuses: {},
          };
        case "getStorageUsage":
          return {
            success: true,
            bytesUsed: 0,
            quota: 1024,
          };
        case "getQuickAccessRuntimeStatus":
          return {
            status: runtimeStatus,
          };
        case REQUEST_QUICK_ACCESS_SOFT_REFRESH_ACTION:
          return { success: true };
        default:
          return { success: true };
      }
    });

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        openOptionsPage: vi.fn(),
        getManifest: vi.fn(() => ({ version: "1.0.0" })),
        getURL: vi.fn((resourcePath: string) => `chrome-extension://test/${resourcePath}`),
      },
      storage: {
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      tabs: {
        create: vi.fn(),
      },
    });

    const harness = await mountApp();
    const refreshButton = document.body.querySelector(
      'button[aria-label="Refresh CaptionArc artifacts in the active meeting tab"]'
    ) as HTMLButtonElement | null;

    expect(refreshButton).toBeTruthy();
    expect(refreshButton?.disabled).toBe(false);

    await act(async () => {
      refreshButton?.click();
      await flushMicrotasks();
    });

    expect(sendMessageMock).toHaveBeenCalledWith({
      action: REQUEST_QUICK_ACCESS_SOFT_REFRESH_ACTION,
    });

    runtimeStatus = null;
    await harness.cleanup();
  });

  test("POP-REFRESH-003: refresh helper copy wraps instead of truncating in the popup card", async () => {
    const sendMessageMock = vi.fn(async (message: { action?: string }) => {
      switch (message.action) {
        case "getSettings":
          return {
            success: true,
            settings: createDefaultSettings(),
          };
        case "getMeetingHistoryIndex":
          return {
            success: true,
            sessions: [],
          };
        case "getMeetingSummaryJobStatuses":
          return {
            success: true,
            statuses: {},
          };
        case "getStorageUsage":
          return {
            success: true,
            bytesUsed: 0,
            quota: 1024,
          };
        case "getQuickAccessRuntimeStatus":
          return {
            status: {
              platform: "google-meet",
              meetingPresence: "joined",
              hasActiveMeetingSession: true,
              updatedAt: Date.now(),
            },
          };
        default:
          return { success: true };
      }
    });

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        openOptionsPage: vi.fn(),
        getManifest: vi.fn(() => ({ version: "1.0.0" })),
        getURL: vi.fn((resourcePath: string) => `chrome-extension://test/${resourcePath}`),
      },
      storage: {
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      tabs: {
        create: vi.fn(),
      },
    });

    const harness = await mountApp();
    const helper = Array.from(document.body.querySelectorAll("p")).find((node) =>
      node.textContent?.includes("Rebuild CaptionArc artifacts in the active Google Meet tab")
    ) as HTMLParagraphElement | undefined;

    expect(helper).toBeTruthy();
    expect(helper?.className).toContain("leading-snug");
    expect(helper?.className).not.toContain("truncate");
    expect(helper?.closest(".mc-app-tooltip-trigger")).toBeNull();

    const overlayTitle = Array.from(document.body.querySelectorAll("p")).find(
      (node) => node.textContent === "Live visibility"
    ) as HTMLParagraphElement | undefined;
    const overlayHelper =
      overlayTitle?.parentElement?.querySelectorAll("p")[1] as
        | HTMLParagraphElement
        | undefined;

    expect(overlayHelper).toBeTruthy();
    expect(overlayHelper?.className).toContain("leading-snug");
    expect(overlayHelper?.className).not.toContain("truncate");
    expect(overlayHelper?.closest(".mc-app-tooltip-trigger")).toBeNull();

    await harness.cleanup();
  });

  test("POP-REFRESH-004: refresh icon button keeps its aria label without rendering tooltip wrappers or native title", async () => {
    const sendMessageMock = vi.fn(async (message: { action?: string }) => {
      switch (message.action) {
        case "getSettings":
          return {
            success: true,
            settings: createDefaultSettings(),
          };
        case "getMeetingHistoryIndex":
          return {
            success: true,
            sessions: [],
          };
        case "getMeetingSummaryJobStatuses":
          return {
            success: true,
            statuses: {},
          };
        case "getStorageUsage":
          return {
            success: true,
            bytesUsed: 0,
            quota: 1024,
          };
        case "getQuickAccessRuntimeStatus":
          return {
            status: null,
          };
        default:
          return { success: true };
      }
    });

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        openOptionsPage: vi.fn(),
        getManifest: vi.fn(() => ({ version: "1.0.0" })),
        getURL: vi.fn((resourcePath: string) => `chrome-extension://test/${resourcePath}`),
      },
      storage: {
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      tabs: {
        create: vi.fn(),
      },
    });

    const harness = await mountApp();
    const refreshButton = document.body.querySelector(
      'button[aria-label="Refresh CaptionArc artifacts in the active meeting tab"]'
    ) as HTMLButtonElement | null;

    expect(refreshButton).toBeTruthy();
    expect(refreshButton?.closest(".mc-app-tooltip-trigger")).toBeNull();
    expect(refreshButton?.getAttribute("title")).toBeNull();

    await harness.cleanup();
  });
});
