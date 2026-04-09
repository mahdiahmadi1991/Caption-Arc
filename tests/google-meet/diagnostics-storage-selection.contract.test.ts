import { beforeEach, describe, expect, test, vi } from "vitest";

const DIAGNOSTICS_STATE_KEY = "captionarc-diagnostics-state";

type StorageChangeListener = (
  changes: Record<string, { newValue?: unknown }>,
  areaName: string
) => void;

function installPartialSessionStorage() {
  const listeners: StorageChangeListener[] = [];
  const sessionState = {
    [DIAGNOSTICS_STATE_KEY]: {
      config: {
        environment: "development",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: "info",
        maxEvents: 40,
      },
    },
  };
  const localState = {
    [DIAGNOSTICS_STATE_KEY]: {
      config: {
        environment: "development",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: "warn",
        maxEvents: 150,
      },
      events: [],
      snapshots: {},
    },
  };

  const session = {
    get: vi.fn(async (key?: string) => ({
      [key || DIAGNOSTICS_STATE_KEY]:
        sessionState[key || DIAGNOSTICS_STATE_KEY as keyof typeof sessionState],
    })),
  };

  const local = {
    get: vi.fn(async (key?: string) => ({
      [key || DIAGNOSTICS_STATE_KEY]:
        localState[key || DIAGNOSTICS_STATE_KEY as keyof typeof localState],
    })),
    set: vi.fn(async (nextState: Record<string, unknown>) => {
      Object.assign(localState, nextState);
    }),
  };

  (globalThis as { chrome?: unknown }).chrome = {
    runtime: {
      sendMessage: vi.fn(async () => ({ success: true })),
    },
    storage: {
      session,
      local,
      onChanged: {
        addListener: vi.fn((listener: StorageChangeListener) => {
          listeners.push(listener);
        }),
      },
    },
  };

  return { listeners, session, local, localState };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Diagnostics storage selection contracts", () => {
  test("DIAG-STO-001: client and collector both fall back to local storage when session storage is read-only", async () => {
    const storage = installPartialSessionStorage();

    vi.resetModules();
    const diagnosticsClient = await import(
      "../../entrypoints/shared/diagnostics-client"
    );
    const diagnosticsCollector = await import(
      "../../entrypoints/background/diagnostics"
    );

    await diagnosticsClient.initializeDiagnosticsClient();
    await diagnosticsCollector.initializeDiagnosticsCollector();

    expect(diagnosticsClient.getDiagnosticsClientConfig().minLevel).toBe("warn");
    expect(diagnosticsCollector.getDiagnosticsConfig().maxEvents).toBe(150);

    storage.listeners[0]?.(
      {
        [DIAGNOSTICS_STATE_KEY]: {
          newValue: {
            config: {
              environment: "development",
              environmentLevels: {
                development: "debug",
                production: "off",
              },
              overrideMinLevel: "error",
              maxEvents: 90,
            },
          },
        },
      },
      "session"
    );
    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("warn")).toBe(true);

    storage.listeners[0]?.(
      {
        [DIAGNOSTICS_STATE_KEY]: {
          newValue: {
            config: {
              environment: "development",
              environmentLevels: {
                development: "debug",
                production: "off",
              },
              overrideMinLevel: "error",
              maxEvents: 90,
            },
          },
        },
      },
      "local"
    );
    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("warn")).toBe(false);
    expect(diagnosticsClient.isDiagnosticsCaptureEnabled("error")).toBe(true);

    await diagnosticsCollector.appendDiagnosticsEvent({
      level: "error",
      runtime: "background",
      domain: "runtime",
      feature: "background-message-router",
      message: "local_storage_selected_for_both_client_and_collector",
    });
    await diagnosticsCollector.flushPendingDiagnosticsPersistence();

    expect(storage.local.get).toHaveBeenCalled();
    expect(storage.local.set).toHaveBeenCalled();
    expect(storage.session.get).not.toHaveBeenCalled();
  });
});