import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type RuntimeModule = typeof import("../../entrypoints/shared/i18n/runtime");

async function loadRuntimeModule(): Promise<RuntimeModule> {
  return await import("../../entrypoints/shared/i18n/runtime");
}

describe("UI i18n runtime contracts", () => {
  const originalDocumentLang = document.documentElement.lang;
  const originalDocumentDir = document.documentElement.dir;
  const originalBodyLang = document.body.lang;
  const originalBodyDir = document.body.dir;

  beforeEach(async () => {
    vi.resetModules();
    (globalThis as typeof globalThis & { chrome?: unknown }).chrome = undefined;
    document.documentElement.lang = originalDocumentLang;
    document.documentElement.dir = originalDocumentDir;
    document.body.lang = originalBodyLang;
    document.body.dir = originalBodyDir;

    const runtime = await loadRuntimeModule();
    await runtime.setUiRuntimeLocale("en");
  });

  afterEach(() => {
    (globalThis as typeof globalThis & { chrome?: unknown }).chrome = undefined;
    document.documentElement.lang = originalDocumentLang;
    document.documentElement.dir = originalDocumentDir;
    document.body.lang = originalBodyLang;
    document.body.dir = originalBodyDir;
  });

  test("I18N-RT-001: applyLocaleAttributes sets lang and dir on both root and document", async () => {
    const runtime = await loadRuntimeModule();
    const root = document.createElement("div");

    runtime.applyLocaleAttributes("ar", root);

    expect(root.lang).toBe("ar");
    expect(root.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.body.lang).toBe("ar");
    expect(document.body.dir).toBe("rtl");
  });

  test("I18N-RT-002: readStoredUiLocale returns the persisted uiLanguage when settings lookup succeeds", async () => {
    const sendMessage = vi.fn(async () => ({
      settings: {
        uiLanguage: "ja",
      },
    }));
    (
      globalThis as typeof globalThis & {
        chrome?: { runtime?: { sendMessage?: typeof sendMessage } };
      }
    ).chrome = {
      runtime: {
        sendMessage,
      },
    };

    const runtime = await loadRuntimeModule();
    const result = await runtime.readStoredUiLocale("en-US");

    expect(result).toBe("ja");
    expect(sendMessage).toHaveBeenCalledWith({ action: "getSettings" });
  });

  test("I18N-RT-003: readStoredUiLocale falls back to browser locale when settings lookup fails", async () => {
    const sendMessage = vi.fn(async () => {
      throw new Error("runtime unavailable");
    });
    (
      globalThis as typeof globalThis & {
        chrome?: { runtime?: { sendMessage?: typeof sendMessage } };
      }
    ).chrome = {
      runtime: {
        sendMessage,
      },
    };

    const runtime = await loadRuntimeModule();
    const result = await runtime.readStoredUiLocale("fa-IR");

    expect(result).toBe("fa");
  });

  test("I18N-RT-004: setUiRuntimeLocale updates active listeners when a new locale is loaded", async () => {
    const runtime = await loadRuntimeModule();
    const observedLocales: string[] = [];
    const unsubscribe = runtime.subscribeUiRuntimeLocale((locale) => {
      observedLocales.push(locale);
    });

    await runtime.setUiRuntimeLocale("ja");
    unsubscribe();

    expect(runtime.getUiRuntimeLocale()).toBe("ja");
    expect(runtime.getUiRuntimeDirection()).toBe("ltr");
    expect(observedLocales).toEqual(["ja"]);
  });

  test("I18N-RT-005: unsubscribed locale listeners do not receive later locale changes", async () => {
    const runtime = await loadRuntimeModule();
    const observedLocales: string[] = [];
    const unsubscribe = runtime.subscribeUiRuntimeLocale((locale) => {
      observedLocales.push(locale);
    });

    unsubscribe();
    await runtime.setUiRuntimeLocale("fr");

    expect(observedLocales).toEqual([]);
    expect(runtime.getUiRuntimeLocale()).toBe("fr");
  });
});
