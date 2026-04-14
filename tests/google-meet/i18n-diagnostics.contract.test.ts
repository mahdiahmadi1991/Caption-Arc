import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type DiagnosticsEventRecord = {
  level?: string;
  message?: string;
  runtime?: string;
  data?: Record<string, unknown>;
};

type ChromeRuntimeMessage =
  | { action: "recordDiagnosticsEvent"; event?: DiagnosticsEventRecord }
  | { action: "getSettings" }
  | Record<string, unknown>;

type RuntimeModule = typeof import("../../entrypoints/shared/i18n/runtime");
type DiagnosticsClientModule = typeof import("../../entrypoints/shared/diagnostics-client");

function createStorageSessionMock(minLevel = "trace") {
  return {
    get: vi.fn(async () => ({
      "captionarc-diagnostics-state": {
        config: {
          enabled: true,
          overrideMinLevel: minLevel,
        },
      },
    })),
    set: vi.fn(async () => undefined),
  };
}

function installExtensionMock(
  handler: (message: ChromeRuntimeMessage) => Promise<unknown> | unknown,
  minLevel = "trace"
) {
  const sendMessage = vi.fn((message: ChromeRuntimeMessage) => handler(message));
  const storageSession = createStorageSessionMock(minLevel);
  const storageLocal = {
    get: vi.fn(async () => ({
      "captionarc-diagnostics-state": {
        config: {
          enabled: true,
          overrideMinLevel: minLevel,
        },
      },
    })),
    set: vi.fn(async () => undefined),
  };
  const storageOnChanged = {
    addListener: vi.fn(),
  };

  (
    globalThis as typeof globalThis & {
      chrome?: {
        runtime?: { sendMessage?: typeof sendMessage };
        storage?: {
          session?: typeof storageSession;
          local?: typeof storageLocal;
          onChanged?: typeof storageOnChanged;
        };
      };
    }
  ).chrome = {
    runtime: {
      sendMessage,
    },
    storage: {
      session: storageSession,
      local: storageLocal,
      onChanged: storageOnChanged,
    },
  };

  return { sendMessage, storageSession };
}

async function importRuntimeModule(): Promise<{
  runtime: RuntimeModule;
  diagnosticsClient: DiagnosticsClientModule;
}> {
  const runtime = await import("../../entrypoints/shared/i18n/runtime");
  const diagnosticsClient = await import(
    "../../entrypoints/shared/diagnostics-client"
  );
  await diagnosticsClient.initializeDiagnosticsClient();

  return { runtime, diagnosticsClient };
}

describe("UI i18n diagnostics contracts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    (globalThis as typeof globalThis & { chrome?: unknown }).chrome = undefined;
    vi.doUnmock("../../entrypoints/shared/i18n/catalog");
  });

  test("I18N-DIAG-001: locale application emits trace, debug, and info diagnostics in healthy flows", async () => {
    const recordedEvents: DiagnosticsEventRecord[] = [];
    installExtensionMock((message) => {
      if (message.action === "recordDiagnosticsEvent") {
        recordedEvents.push(message.event || {});
        return { success: true };
      }

      if (message.action === "getSettings") {
        return { settings: { uiLanguage: "ja" } };
      }

      throw new Error(`Unexpected runtime action: ${String(message.action)}`);
    });

    const { runtime } = await importRuntimeModule();
    const root = document.createElement("div");

    await runtime.setUiRuntimeLocale("ja");
    runtime.applyLocaleAttributes("ja", root);

    const levelsSeen = new Set(recordedEvents.map((event) => event.level));
    const messagesSeen = new Set(recordedEvents.map((event) => event.message));
    const runtimesSeen = new Set(recordedEvents.map((event) => event.runtime));

    expect(levelsSeen).toEqual(new Set(["debug", "trace", "info"]));
    expect([...messagesSeen]).toEqual(
      expect.arrayContaining([
        "ui_locale_set_requested",
        "ui_locale_catalog_load_started",
        "ui_locale_catalog_load_completed",
        "ui_locale_set_completed",
        "ui_locale_attributes_applied",
      ])
    );
    expect(runtimesSeen).toEqual(new Set(["content"]));
  });

  test("I18N-DIAG-002: invalid persisted uiLanguage falls back and emits a warn diagnostics event", async () => {
    const recordedEvents: DiagnosticsEventRecord[] = [];
    installExtensionMock((message) => {
      if (message.action === "recordDiagnosticsEvent") {
        recordedEvents.push(message.event || {});
        return { success: true };
      }

      if (message.action === "getSettings") {
        return { settings: { uiLanguage: "invalid-locale" } };
      }

      throw new Error(`Unexpected runtime action: ${String(message.action)}`);
    });

    const { runtime } = await importRuntimeModule();
    const resolvedLocale = await runtime.readStoredUiLocale("en-US");

    expect(resolvedLocale).toBe("en");
    expect(recordedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "warn",
          message: "ui_locale_invalid_setting_fallback",
        }),
      ])
    );
  });

  test("I18N-DIAG-003: settings lookup failure falls back safely and emits a warn diagnostics event", async () => {
    const recordedEvents: DiagnosticsEventRecord[] = [];
    installExtensionMock((message) => {
      if (message.action === "recordDiagnosticsEvent") {
        recordedEvents.push(message.event || {});
        return { success: true };
      }

      if (message.action === "getSettings") {
        throw new Error("runtime unavailable");
      }

      throw new Error(`Unexpected runtime action: ${String(message.action)}`);
    });

    const { runtime } = await importRuntimeModule();
    const resolvedLocale = await runtime.readStoredUiLocale("fa-IR");

    expect(resolvedLocale).toBe("fa");
    expect(recordedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "warn",
          message: "ui_locale_settings_lookup_failed",
        }),
      ])
    );
  });

  test("I18N-DIAG-004: catalog load failures emit an error diagnostics event before rethrowing", async () => {
    vi.doMock("../../entrypoints/shared/i18n/catalog", async () => {
      const actual = await vi.importActual<
        typeof import("../../entrypoints/shared/i18n/catalog")
      >("../../entrypoints/shared/i18n/catalog");

      return {
        ...actual,
        isUiMessageCatalogLoaded: vi.fn(() => false),
        loadUiMessageCatalog: vi.fn(async () => {
          throw new Error("catalog exploded");
        }),
      };
    });

    const recordedEvents: DiagnosticsEventRecord[] = [];
    installExtensionMock((message) => {
      if (message.action === "recordDiagnosticsEvent") {
        recordedEvents.push(message.event || {});
        return { success: true };
      }

      if (message.action === "getSettings") {
        return { settings: { uiLanguage: "en" } };
      }

      throw new Error(`Unexpected runtime action: ${String(message.action)}`);
    });

    const { runtime } = await importRuntimeModule();

    await expect(runtime.setUiRuntimeLocale("ja")).rejects.toThrow(
      "catalog exploded"
    );
    expect(recordedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "error",
          message: "ui_locale_catalog_load_failed",
        }),
      ])
    );
  });
});
