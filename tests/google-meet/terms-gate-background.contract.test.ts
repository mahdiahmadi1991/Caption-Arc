import { beforeEach, describe, expect, test, vi } from "vitest";

const backgroundMocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  initializeCloudSyncEngine: vi.fn(),
  shutdownCloudSyncForTermsRevocation: vi.fn(async () => undefined),
  initializeMeetingSummaryQueue: vi.fn(async () => undefined),
  shutdownMeetingSummaryQueueForTermsRevocation: vi.fn(async () => undefined),
  debugHandleSummaryReadyNotificationClick: vi.fn(),
  tabsCreate: vi.fn(async () => undefined),
  tabsRemove: vi.fn(async () => undefined),
  listeners: {
    onInstalled: null as
      | ((details: chrome.runtime.InstalledDetails) => void)
      | null,
    onMessage: null as
      | ((
          message: Record<string, unknown>,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response: unknown) => void
        ) => boolean)
      | null,
  },
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: backgroundMocks.getSettings,
  saveSettings: backgroundMocks.saveSettings,
}));

vi.mock("../../entrypoints/background/translation", () => ({
  generateText: vi.fn(),
  translate: vi.fn(),
}));

vi.mock("../../entrypoints/background/data-transfer", () => ({
  exportAppDataBundle: vi.fn(),
  importAppDataBundle: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  connectCloudSyncProvider: vi.fn(),
  disconnectCloudSyncProvider: vi.fn(),
  getCloudSyncState: vi.fn(),
  initializeCloudSyncEngine: backgroundMocks.initializeCloudSyncEngine,
  resolveCloudSyncSettingsChoice: vi.fn(),
  retryCloudSync: vi.fn(),
  shutdownCloudSyncForTermsRevocation:
    backgroundMocks.shutdownCloudSyncForTermsRevocation,
}));

vi.mock("../../entrypoints/background/history", () => ({
  findMeetingSessionContinuationCandidate: vi.fn(),
  getMeetingHistory: vi.fn(),
  getMeetingHistoryIndex: vi.fn(),
  getMeetingSummaryJobStatus: vi.fn(),
  getMeetingSummaryJobStatuses: vi.fn(),
  handleMeetingSummaryRetryAlarm: vi.fn(),
  getMeetingSession: vi.fn(),
  initializeMeetingSummaryQueue: backgroundMocks.initializeMeetingSummaryQueue,
  resolveMeetingSession: vi.fn(),
  saveMeetingSession: vi.fn(),
  storeMeetingSessionShell: vi.fn(),
  deleteMeetingSession: vi.fn(),
  finalizeMeetingSessionEnd: vi.fn(),
  updateMeetingSession: vi.fn(),
  cancelMeetingSummaryJob: vi.fn(),
  translateSessionCaption: vi.fn(),
  translateSessionCaptions: vi.fn(),
  generateMeetingSummary: vi.fn(),
  clearMeetingHistory: vi.fn(),
  getStorageUsage: vi.fn(),
  debugHandleSummaryReadyNotificationClick:
    backgroundMocks.debugHandleSummaryReadyNotificationClick,
  shutdownMeetingSummaryQueueForTermsRevocation:
    backgroundMocks.shutdownMeetingSummaryQueueForTermsRevocation,
}));

vi.mock("../../entrypoints/background/quick-access-runtime", () => ({
  clearQuickAccessRuntimeStatus: vi.fn(),
  getQuickAccessRuntimeStatus: vi.fn(),
  initializeQuickAccessRuntimeRegistry: vi.fn(),
  requestQuickAccessSoftRefresh: vi.fn(),
  updateQuickAccessRuntimeStatus: vi.fn(),
}));

vi.mock("../../entrypoints/background/assistant", () => ({
  getMeetingAssistantLiveState: vi.fn(),
}));

vi.mock("../../entrypoints/background/diagnostics", () => {
  const logger = {
    trace: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
  };

  return {
    appendDiagnosticsEvent: vi.fn(),
    clearDiagnosticsData: vi.fn(),
    clearDiagnosticsSnapshot: vi.fn(),
    createBackgroundDiagnosticsLogger: vi.fn(() => logger),
    getDiagnosticsConfig: vi.fn(),
    getDiagnosticsPayload: vi.fn(),
    initializeDiagnosticsCollector: vi.fn(async () => undefined),
    setDiagnosticsConfig: vi.fn(),
    setDiagnosticsSnapshot: vi.fn(),
    syncDiagnosticsEnvironmentConfig: vi.fn(async () => undefined),
  };
});

vi.mock("../../entrypoints/shared/legal", () => ({
  getTermsOfServicePageUrl: vi.fn(
    ({
      mode,
      source,
      returnTo,
    }: {
      mode?: "accept" | "view";
      source?: string;
      returnTo?: string;
    } = {}) =>
      `chrome-extension://test/terms-of-service.html?mode=${
        mode || "view"
      }&source=${source || ""}&returnTo=${returnTo || ""}`
  ),
  hasAcceptedCurrentTerms: vi.fn(
    (acceptance: { version?: string; acceptedAt?: number } | null | undefined) =>
      Boolean(
        acceptance &&
          acceptance.version === "2026-04-10" &&
          typeof acceptance.acceptedAt === "number"
      )
  ),
}));

function installExtensionRuntime() {
  vi.stubGlobal("defineBackground", (main: () => void) => {
    main();
    return {};
  });

  vi.stubGlobal("chrome", {
    runtime: {
      onStartup: {
        addListener: vi.fn(),
      },
      onInstalled: {
        addListener: vi.fn(
          (listener: (details: chrome.runtime.InstalledDetails) => void) => {
            backgroundMocks.listeners.onInstalled = listener;
          }
        ),
      },
      onMessage: {
        addListener: vi.fn(
          (
            listener: (
              message: Record<string, unknown>,
              sender: chrome.runtime.MessageSender,
              sendResponse: (response: unknown) => void
            ) => boolean
          ) => {
            backgroundMocks.listeners.onMessage = listener;
          }
        ),
      },
      openOptionsPage: vi.fn(),
    },
    alarms: {
      onAlarm: {
        addListener: vi.fn(),
      },
    },
    tabs: {
      create: backgroundMocks.tabsCreate,
      remove: backgroundMocks.tabsRemove,
    },
  });
}

async function loadBackgroundModule() {
  installExtensionRuntime();
  return await import("../../entrypoints/background/index");
}

async function flushAsyncWork() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function dispatchBackgroundMessage(
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender = {}
) {
  if (!backgroundMocks.listeners.onMessage) {
    throw new Error("Background onMessage listener was not registered.");
  }

  return await new Promise((resolve) => {
    backgroundMocks.listeners.onMessage?.(message, sender, resolve);
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  backgroundMocks.listeners.onInstalled = null;
  backgroundMocks.listeners.onMessage = null;
  backgroundMocks.getSettings.mockResolvedValue({
    success: true,
    settings: {
      termsAcceptance: null,
    },
  });
  backgroundMocks.saveSettings.mockResolvedValue({
    success: true,
    settings: {
      termsAcceptance: null,
      termsDecline: null,
    },
  });
  backgroundMocks.debugHandleSummaryReadyNotificationClick.mockResolvedValue({
    success: true,
    notificationId: "summary-ready:session-1|default%3Afa%3A1",
  });
});

describe("Terms gate background contract", () => {
  test("SETRDY-009: extension updates prompt for the current Terms when the current version is not yet accepted", async () => {
    await loadBackgroundModule();

    backgroundMocks.listeners.onInstalled?.({
      reason: "update",
      previousVersion: "1.2.9",
    });
    await flushAsyncWork();

    expect(backgroundMocks.tabsCreate).toHaveBeenCalledWith({
      url: expect.stringContaining("source=update"),
    });
  });

  test("SETRDY-010: declining the current Terms after acceptance shuts down protected background work", async () => {
    backgroundMocks.getSettings.mockResolvedValue({
      success: true,
      settings: {
        termsAcceptance: {
          version: "2026-04-10",
          acceptedAt: 123,
        },
      },
    });
    backgroundMocks.saveSettings.mockResolvedValue({
      success: true,
      settings: {
        termsAcceptance: null,
        termsDecline: {
          version: "2026-04-10",
          declinedAt: 456,
        },
      },
    });

    await loadBackgroundModule();

    const response = await dispatchBackgroundMessage(
      {
        action: "saveTermsDeclineAndClosePage",
        termsDecline: {
          version: "2026-04-10",
          declinedAt: 456,
        },
      },
      {
        tab: { id: 42 } as chrome.tabs.Tab,
      }
    );

    expect(response).toEqual(
      expect.objectContaining({
        success: true,
      })
    );
    expect(backgroundMocks.shutdownCloudSyncForTermsRevocation).toHaveBeenCalledTimes(1);
    expect(backgroundMocks.shutdownMeetingSummaryQueueForTermsRevocation).toHaveBeenCalledTimes(1);
    expect(backgroundMocks.tabsRemove).toHaveBeenCalledWith(42);
  });

  test("SETRDY-011: development diagnostics can invoke the summary notification click handler through background messaging", async () => {
    await loadBackgroundModule();

    const response = await dispatchBackgroundMessage({
      action: "debugHandleSummaryReadyNotificationClick",
      sessionId: "session-1",
      summaryKey: "default:fa:1",
    });

    expect(
      backgroundMocks.debugHandleSummaryReadyNotificationClick
    ).toHaveBeenCalledWith({
      notificationId: null,
      sessionId: "session-1",
      summaryKey: "default:fa:1",
    });
    expect(response).toEqual({
      success: true,
      notificationId: "summary-ready:session-1|default%3Afa%3A1",
    });
  });
});
