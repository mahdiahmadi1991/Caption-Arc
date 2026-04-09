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
    setUserAgent(originalUserAgent);
  });

  afterEach(() => {
    setUserAgent(originalUserAgent);
  });

  test("CLD-BROW-001: Firefox baseline checkpoints expose both providers as explicitly unsupported", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0"
    );

    const providers = await loadProviderModule();
    const checkpoints = providers.getCloudSyncProviderBaselineCheckpoints();

    expect(checkpoints).toHaveLength(2);
    expect(checkpoints.map((checkpoint) => checkpoint.provider).sort()).toEqual([
      "google-drive",
      "onedrive",
    ]);
    expect(checkpoints.every((checkpoint) => checkpoint.supported === false)).toBe(
      true
    );
    expect(checkpoints.every((checkpoint) => checkpoint.connected === false)).toBe(
      true
    );
    expect(
      checkpoints.every(
        (checkpoint) => checkpoint.healthState === "action-required"
      )
    ).toBe(true);
  });

  test("CLD-BROW-002: connect adapter returns an explicit unsupported-browser checkpoint on Firefox", async () => {
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

  test("CLD-BROW-003: unsupported providers can still be removed from settings on Firefox", async () => {
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
});