import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const originalUserAgent = navigator.userAgent;

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
}

async function loadProviderModule() {
  vi.resetModules();
  return await import("../../entrypoints/background/cloud-sync/providers");
}

async function loadCloudSyncModuleWithSettings(options?: {
  connectedCloudProviders?: Array<"google-drive" | "onedrive">;
}) {
  vi.resetModules();

  const settings = {
    connectedCloudProviders: [...(options?.connectedCloudProviders || [])],
  };
  const saveSettings = vi.fn(async (nextSettings: {
    connectedCloudProviders?: Array<"google-drive" | "onedrive">;
  }) => {
    if (nextSettings.connectedCloudProviders) {
      settings.connectedCloudProviders = [...nextSettings.connectedCloudProviders];
    }

    return { success: true, settings };
  });
  const upsertCloudSyncCheckpoint = vi.fn(async () => undefined);

  vi.doMock("../../entrypoints/background/diagnostics", () => ({
    createBackgroundDiagnosticsLogger: () => ({
      trace: vi.fn(async () => undefined),
      debug: vi.fn(async () => undefined),
      info: vi.fn(async () => undefined),
      warn: vi.fn(async () => undefined),
      error: vi.fn(async () => undefined),
    }),
  }));
  vi.doMock("../../entrypoints/background/settings", () => ({
    getSettings: vi.fn(async () => ({ settings })),
    saveSettings,
  }));
  vi.doMock("../../entrypoints/background/cloud-sync/checkpoints", () => ({
    clearCloudSyncPendingSettingsDecision: vi.fn(async () => undefined),
    getCloudSyncPendingSettingsDecision: vi.fn(async () => null),
    upsertCloudSyncCheckpoint,
  }));
  vi.doMock("../../entrypoints/background/cloud-sync/engine", () => ({
    getCloudSyncStateSnapshot: vi.fn(async () => ({
      queueSize: 0,
      dueTaskCount: 0,
      engine: { running: false },
      checkpoints: [],
      diagnostics: [],
      pendingSettingsDecision: null,
    })),
    queueCloudSyncReconciliation: vi.fn(async () => undefined),
    runCloudSyncNow: vi.fn(async () => undefined),
    scheduleCloudSyncRun: vi.fn(() => undefined),
    stopCloudSyncEngine: vi.fn(async () => undefined),
    syncCheckpointConnections: vi.fn(async () => undefined),
  }));
  vi.doMock("../../entrypoints/background/cloud-sync/outbox", () => ({
    enqueueCloudSyncTask: vi.fn(async () => undefined),
    listCloudSyncTasks: vi.fn(async () => []),
    updateCloudSyncTask: vi.fn(async () => undefined),
  }));

  const module = await import("../../entrypoints/background/cloud-sync");
  return { module, saveSettings, settings, upsertCloudSyncCheckpoint };
}

describe("Cloud sync browser support contracts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    setUserAgent(originalUserAgent);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setUserAgent(originalUserAgent);
  });

  test("CLD-BROW-001: Firefox baseline checkpoints expose configured providers as supported", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0"
    );
    vi.stubEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX", "firefox-google-client");
    vi.stubEnv(
      "WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX",
      "firefox-google-secret"
    );
    vi.stubEnv("WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX", "firefox-microsoft-client");

    const providers = await loadProviderModule();
    const checkpoints = providers.getCloudSyncProviderBaselineCheckpoints();

    expect(checkpoints).toHaveLength(2);
    expect(checkpoints.map((checkpoint) => checkpoint.provider).sort()).toEqual([
      "google-drive",
      "onedrive",
    ]);
    expect(checkpoints.every((checkpoint) => checkpoint.supported === true)).toBe(
      true
    );
    expect(checkpoints.every((checkpoint) => checkpoint.connected === false)).toBe(
      true
    );
    expect(
      checkpoints.every(
        (checkpoint) => checkpoint.healthState === "disconnected"
      )
    ).toBe(true);
  });

  test("CLD-BROW-002: connect adapter still returns an explicit unsupported checkpoint when Firefox OAuth config is missing", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0"
    );

    const providers = await loadProviderModule();
    const checkpoint = await providers.connectCloudSyncProviderAdapter(
      "google-drive"
    );

    expect(checkpoint.supported).toBe(false);
    expect(checkpoint.connected).toBe(false);
    expect(checkpoint.healthState).toBe("action-required");
    expect(checkpoint.lastError).toContain("Google Drive");
    expect(checkpoint.lastError).toContain("Firefox");
  });

  test("CLD-BROW-006: Google Drive connect stays blocked when the client secret is missing for the active browser", async () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
    );
    vi.stubEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME", "chromium-google-client");

    const providers = await loadProviderModule();
    const checkpoint = await providers.connectCloudSyncProviderAdapter(
      "google-drive"
    );

    expect(checkpoint.supported).toBe(false);
    expect(checkpoint.connected).toBe(false);
    expect(checkpoint.healthState).toBe("action-required");
    expect(checkpoint.lastError).toContain("client secret is missing");
  });

  test("CLD-BROW-003: providers that remain unsupported can still be removed from settings on Firefox", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0"
    );

    const cloudSync = await loadCloudSyncModuleWithSettings({
      connectedCloudProviders: ["google-drive"],
    });
    const response = await cloudSync.module.disconnectCloudSyncProvider(
      "google-drive"
    );

    expect(response.success).toBe(true);
    expect(response.checkpoint?.supported).toBe(false);
    expect(response.checkpoint?.connected).toBe(false);
    expect(response.checkpoint?.healthState).toBe("action-required");
    expect(cloudSync.saveSettings).toHaveBeenCalledWith({
      connectedCloudProviders: [],
    });
    expect(cloudSync.settings.connectedCloudProviders).toEqual([]);
    expect(cloudSync.upsertCloudSyncCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google-drive",
        supported: false,
      })
    );
  });

  test("CLD-BROW-004: a stale unsupported checkpoint is reset once the provider becomes configured for the current browser", async () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
    );
    vi.stubEnv(
      "WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME",
      "chromium-microsoft-client"
    );

    const providers = await loadProviderModule();
    const normalized = providers.normalizeCloudSyncProviderCheckpoint({
      provider: "onedrive",
      supported: false,
      unsupportedReason:
        "OneDrive cloud sync is not configured for Chrome yet because the required OAuth client is missing for this browser target.",
      connected: false,
      healthState: "action-required",
      lastError:
        "OneDrive cloud sync is not configured for Chrome yet because the required OAuth client is missing for this browser target.",
      lastErrorKind: "action-required",
      manualRetryAvailable: true,
    });

    expect(normalized).toEqual({
      provider: "onedrive",
      supported: true,
      unsupportedReason: undefined,
      connected: false,
      healthState: "disconnected",
      manualRetryAvailable: false,
      lastError: undefined,
      lastErrorKind: undefined,
    });
  });

  test("CLD-BROW-005: a stale missing-client error is cleared even when the stored checkpoint already says supported", async () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
    );
    vi.stubEnv(
      "WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME",
      "chromium-microsoft-client"
    );

    const providers = await loadProviderModule();
    const normalized = providers.normalizeCloudSyncProviderCheckpoint({
      provider: "onedrive",
      supported: true,
      connected: false,
      healthState: "disconnected",
      lastError:
        "OneDrive cloud sync is not configured for Chrome yet because the required OAuth client is missing for this browser target.",
      lastErrorKind: "action-required",
      manualRetryAvailable: false,
    });

    expect(normalized).toEqual({
      provider: "onedrive",
      supported: true,
      connected: false,
      healthState: "disconnected",
      lastError: undefined,
      lastErrorKind: undefined,
      manualRetryAvailable: false,
      unsupportedReason: undefined,
    });
  });

  test("CLD-BROW-007: connected provider checkpoints backfill a generic account label when old runtime state omitted it", async () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
    );
    vi.stubEnv(
      "WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME",
      "chromium-microsoft-client"
    );

    const providers = await loadProviderModule();
    const normalized = providers.normalizeCloudSyncProviderCheckpoint({
      provider: "onedrive",
      supported: true,
      connected: true,
      connectedAt: 1_000,
      healthState: "up-to-date",
    });

    expect(normalized).toEqual({
      provider: "onedrive",
      supported: true,
      connected: true,
      connectedAt: 1_000,
      healthState: "up-to-date",
      accountId: "OneDrive",
      accountLabel: "OneDrive",
      unsupportedReason: undefined,
    });
  });
});
