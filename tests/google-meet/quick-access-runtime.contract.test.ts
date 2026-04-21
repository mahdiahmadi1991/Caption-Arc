import { beforeEach, describe, expect, test, vi } from "vitest";
import type { QuickAccessRuntimeStatus } from "../../entrypoints/shared/quick-access-status";

function createRuntimeStatus(
  overrides: Partial<QuickAccessRuntimeStatus> = {}
): QuickAccessRuntimeStatus {
  return {
    platform: "google-meet",
    meetingPresence: "joined",
    hasActiveMeetingSession: true,
    updatedAt: Date.now(),
    ...overrides,
  };
}

async function loadQuickAccessRuntimeModule() {
  vi.resetModules();
  return await import("../../entrypoints/background/quick-access-runtime");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Quick access runtime registry contract", () => {
  test("QACC-RT-001: soft refresh targets the active meeting tab instead of a fresher runtime in another tab", async () => {
    const tabSendMessageMock = vi.fn(async () => ({ success: true }));
    const tabsQueryMock = vi.fn(async (queryInfo?: chrome.tabs.QueryInfo) => {
      if (queryInfo?.active && queryInfo?.lastFocusedWindow) {
        return [{ id: 3 }] as chrome.tabs.Tab[];
      }

      return [] as chrome.tabs.Tab[];
    });
    vi.stubGlobal("chrome", {
      tabs: {
        onRemoved: {
          addListener: vi.fn(),
        },
        query: tabsQueryMock,
        sendMessage: tabSendMessageMock,
      },
      storage: {
        local: {
          remove: vi.fn(async () => undefined),
        },
      },
    });

    const runtimeRegistry = await loadQuickAccessRuntimeModule();
    await runtimeRegistry.initializeQuickAccessRuntimeRegistry();
    await runtimeRegistry.updateQuickAccessRuntimeStatus(createRuntimeStatus(), {
      tab: { id: 7 } as chrome.tabs.Tab,
      frameId: 4,
    });
    await runtimeRegistry.updateQuickAccessRuntimeStatus(
      createRuntimeStatus({
        meetingPresence: "prejoin",
        hasActiveMeetingSession: false,
      }),
      {
        tab: { id: 3 } as chrome.tabs.Tab,
        frameId: 0,
      }
    );

    await expect(runtimeRegistry.requestQuickAccessSoftRefresh()).resolves.toEqual({
      success: true,
    });
    expect(tabSendMessageMock).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        action: "softRefreshQuickAccessArtifacts",
      }),
      {
        frameId: 0,
      }
    );
  });

  test("QACC-RT-002: soft refresh returns a guarded failure when no active runtime is registered", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        onRemoved: {
          addListener: vi.fn(),
        },
        query: vi.fn(async () => []),
        sendMessage: vi.fn(),
      },
      storage: {
        local: {
          remove: vi.fn(async () => undefined),
        },
      },
    });

    const runtimeRegistry = await loadQuickAccessRuntimeModule();
    await runtimeRegistry.initializeQuickAccessRuntimeRegistry();

    await expect(runtimeRegistry.requestQuickAccessSoftRefresh()).resolves.toEqual({
      success: false,
      error:
        "Open an active supported meeting tab where CaptionArc is active to use recovery refresh.",
    });
  });

  test("QACC-RT-003: soft refresh refuses to reset a background meeting when the active tab is not refreshable", async () => {
    const tabSendMessageMock = vi.fn(async () => ({ success: true }));
    const tabsQueryMock = vi.fn(async (queryInfo?: chrome.tabs.QueryInfo) => {
      if (queryInfo?.active && queryInfo?.lastFocusedWindow) {
        return [{ id: 99 }] as chrome.tabs.Tab[];
      }

      return [] as chrome.tabs.Tab[];
    });
    vi.stubGlobal("chrome", {
      tabs: {
        onRemoved: {
          addListener: vi.fn(),
        },
        query: tabsQueryMock,
        sendMessage: tabSendMessageMock,
      },
      storage: {
        local: {
          remove: vi.fn(async () => undefined),
        },
      },
    });

    const runtimeRegistry = await loadQuickAccessRuntimeModule();
    await runtimeRegistry.initializeQuickAccessRuntimeRegistry();
    await runtimeRegistry.updateQuickAccessRuntimeStatus(createRuntimeStatus(), {
      tab: { id: 7 } as chrome.tabs.Tab,
      frameId: 4,
    });

    await expect(runtimeRegistry.requestQuickAccessSoftRefresh()).resolves.toEqual({
      success: false,
      error:
        "Open an active supported meeting tab where CaptionArc is active to use recovery refresh.",
    });
    expect(tabSendMessageMock).not.toHaveBeenCalled();
  });
});
