import { beforeEach, describe, expect, test, vi } from "vitest";

const DIAGNOSTICS_STATE_KEY = "captionarc-diagnostics-state";

type StorageChangeListener = (
  changes: Record<string, { newValue?: unknown }>,
  areaName: string
) => void;

function installExtensionClientApis(options?: {
  storedConfig?: Record<string, unknown>;
  runtimeSendMessageError?: Error;
  includeSession?: boolean;
  sessionWriteEnabled?: boolean;
}) {
  const listeners: StorageChangeListener[] = [];
  const sendMessage = vi.fn(async (_message: unknown) => {
    if (options?.runtimeSendMessageError) {
      throw options.runtimeSendMessageError;
    }

    return { success: true };
  });

  (globalThis as { chrome?: unknown }).chrome = {
    runtime: {
      sendMessage,
    },
    storage: {
      ...(options?.includeSession === false
        ? {}
        : {
            session: {
              get: vi.fn(async (key?: string) => ({
                [key || DIAGNOSTICS_STATE_KEY]: {
                  config: options?.storedConfig,
                },
              })),
              ...(options?.sessionWriteEnabled === false
                ? {}
                : {
                    set: vi.fn(async () => undefined),
                  }),
            },
          }),
      local: {
        get: vi.fn(async (key?: string) => ({
          [key || DIAGNOSTICS_STATE_KEY]: {
            config: options?.storedConfig,
          },
        })),
        set: vi.fn(async () => undefined),
      },
      onChanged: {
        addListener: vi.fn((listener: StorageChangeListener) => {
          listeners.push(listener);
        }),
      },
    },
  };

  return { listeners, sendMessage };
}

async function loadDiagnosticsClient() {
  vi.resetModules();
  return await import("../../entrypoints/shared/diagnostics-client");
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Diagnostics client contract", () => {
  test("DIAG-CLI-001: client remains safe and disabled when browser APIs are unavailable", async () => {
    (globalThis as { chrome?: unknown }).chrome = undefined;
    const diagnosticsClient = await loadDiagnosticsClient();

    await expect(diagnosticsClient.initializeDiagnosticsClient()).resolves.toBeUndefined();
    expect(diagnosticsClient.getDiagnosticsClientConfig()).toEqual({
      environment: "development",
      environmentLevels: {
        development: "debug",
        production: "off",
      },
      overrideMinLevel: "off",
      enabled: false,
      minLevel: "debug",
      maxEvents: 400,
    });
    expect(diagnosticsClient.isDiagnosticsCaptureEnabled()).toBe(false);

    const logger = diagnosticsClient.createDiagnosticsLogger({
      runtime: "content",
      domain: "runtime",
      feature: "content-boot",
    });

    await expect(logger.error("boot_retry_failed", { reason: "missing-runtime" })).resolves.toBeUndefined();
  });

  test("DIAG-CLI-002: enabled client forwards events and snapshots through runtime messaging", async () => {
    const extensionApis = installExtensionClientApis({
      storedConfig: {
        environment: "development",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: null,
        maxEvents: 200,
      },
    });
    const diagnosticsClient = await loadDiagnosticsClient();
    await diagnosticsClient.initializeDiagnosticsClient();

    const logger = diagnosticsClient.createDiagnosticsLogger({
      runtime: "content",
      domain: "provider",
      feature: "teams-caption-pipeline",
      provider: "microsoft-teams",
    });

    await logger.debug("observer_attached", { sourceUrl: "https://teams.microsoft.com/meet/abc" });
    await logger.snapshot("content-runtime", { providerPlatform: "microsoft-teams" });
    await logger.clearSnapshot("content-runtime");

    expect(extensionApis.sendMessage).toHaveBeenNthCalledWith(1, {
      action: "recordDiagnosticsEvent",
      event: {
        level: "debug",
        runtime: "content",
        domain: "provider",
        feature: "teams-caption-pipeline",
        provider: "microsoft-teams",
        sessionId: undefined,
        requestId: undefined,
        correlationId: undefined,
        message: "observer_attached",
        data: { sourceUrl: "https://teams.microsoft.com/meet/abc" },
      },
    });
    expect(extensionApis.sendMessage).toHaveBeenNthCalledWith(2, {
      action: "setDiagnosticsSnapshot",
      key: "content-runtime",
      runtime: "content",
      data: { providerPlatform: "microsoft-teams" },
    });
    expect(extensionApis.sendMessage).toHaveBeenNthCalledWith(3, {
      action: "clearDiagnosticsSnapshot",
      key: "content-runtime",
    });
  });

  test("DIAG-CLI-003: storage changes can disable capture without breaking callers", async () => {
    const extensionApis = installExtensionClientApis({
      storedConfig: {
        environment: "development",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: "info",
        maxEvents: 100,
      },
    });
    const diagnosticsClient = await loadDiagnosticsClient();
    await diagnosticsClient.initializeDiagnosticsClient();

    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("warn")).toBe(true);
    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("debug")).toBe(false);

    extensionApis.listeners[0]?.(
      {
        [DIAGNOSTICS_STATE_KEY]: {
          newValue: {
            config: {
              environment: "production",
              environmentLevels: {
                development: "debug",
                production: "off",
              },
              overrideMinLevel: null,
              maxEvents: 100,
            },
          },
        },
      },
      "session"
    );

    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("error")).toBe(false);

    const logger = diagnosticsClient.createDiagnosticsLogger({
      runtime: "content",
      domain: "runtime",
      feature: "platform-runtime",
    });

    await expect(logger.error("lifecycle_sync_failed", { reason: "disabled-after-change" })).resolves.toBeUndefined();
    expect(extensionApis.sendMessage).not.toHaveBeenCalled();
  });

  test("DIAG-CLI-004: runtime send failures are swallowed so diagnostics never break primary behavior", async () => {
    installExtensionClientApis({
      storedConfig: {
        environment: "development",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: null,
        maxEvents: 100,
      },
      runtimeSendMessageError: new Error("runtime-send-failed"),
    });
    const diagnosticsClient = await loadDiagnosticsClient();
    await diagnosticsClient.initializeDiagnosticsClient();

    const logger = diagnosticsClient.createDiagnosticsLogger({
      runtime: "content",
      domain: "runtime",
      feature: "content-boot",
    });

    await expect(logger.warn("boot_retry_failed", { attempts: 3 })).resolves.toBeUndefined();
  });

  test("DIAG-CLI-005: client reads diagnostics config from local storage when session storage is unavailable", async () => {
    installExtensionClientApis({
      includeSession: false,
      storedConfig: {
        environment: "development",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: "warn",
        maxEvents: 150,
      },
    });
    const diagnosticsClient = await loadDiagnosticsClient();
    await diagnosticsClient.initializeDiagnosticsClient();

    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("info")).toBe(false);
    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("error")).toBe(true);
  });
});
