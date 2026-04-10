import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import {
  I18nProvider,
  UI_LOCALE_SWITCH_START_EVENT,
} from "../../entrypoints/shared/i18n";
import { useSettings } from "../../entrypoints/options/use-settings";

type UseSettingsState = ReturnType<typeof useSettings>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function installChromeMock(
  handler: (message: Record<string, unknown>) => Promise<unknown> | unknown
) {
  const onChangedListeners = new Set<
    (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => void
  >();
  const sendMessage = vi.fn((message: Record<string, unknown>) => handler(message));

  (
    globalThis as typeof globalThis & {
      chrome?: {
        runtime?: {
          sendMessage?: typeof sendMessage;
          getURL?: (path: string) => string;
        };
        storage?: {
          session?: {
            get?: (key?: string) => Promise<Record<string, unknown>>;
          };
          onChanged?: {
            addListener?: (
              listener: (
                changes: Record<string, chrome.storage.StorageChange>,
                areaName: string
              ) => void
            ) => void;
            removeListener?: (
              listener: (
                changes: Record<string, chrome.storage.StorageChange>,
                areaName: string
              ) => void
            ) => void;
          };
        };
      };
    }
  ).chrome = {
    runtime: {
      sendMessage,
      getURL: (path: string) => path,
    },
    storage: {
      session: {
        get: vi.fn(async () => ({})),
      },
      onChanged: {
        addListener: (listener) => {
          onChangedListeners.add(listener);
        },
        removeListener: (listener) => {
          onChangedListeners.delete(listener);
        },
      },
    },
  };

  return { sendMessage, onChangedListeners };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

async function mountUseSettingsHarness() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let root: Root | null = createRoot(container);
  let latestState: UseSettingsState | null = null;

  function Harness() {
    latestState = useSettings();
    return null;
  }

  await act(async () => {
    root!.render(
      React.createElement(
        I18nProvider,
        { locale: "en" },
        React.createElement(Harness)
      )
    );
    await flushMicrotasks();
  });

  return {
    getState(): UseSettingsState {
      if (!latestState) {
        throw new Error("useSettings harness has not rendered yet.");
      }

      return latestState;
    },
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

describe("Options UI language switch contracts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    (globalThis as typeof globalThis & { chrome?: unknown }).chrome = undefined;
  });

  test("OPTIONS-I18N-001: uiLanguage changes emit switch start and save immediately", async () => {
    const initialSettings = createDefaultSettings();
    const saveDeferred = createDeferred<{ success: boolean }>();
    const { sendMessage } = installChromeMock((message) => {
      if (message.action === "getSettings") {
        return { success: true, settings: initialSettings };
      }

      if (
        message.action === "saveSettings" &&
        (message.settings as { uiLanguage?: string }).uiLanguage === "fa"
      ) {
        return saveDeferred.promise;
      }

      return { success: true };
    });

    const localeSwitchStartListener = vi.fn();
    window.addEventListener(
      UI_LOCALE_SWITCH_START_EVENT,
      localeSwitchStartListener
    );

    const harness = await mountUseSettingsHarness();

    await act(async () => {
      harness.getState().updateSetting("uiLanguage", "fa");
      await flushMicrotasks();
    });

    expect(localeSwitchStartListener).toHaveBeenCalledTimes(1);
    expect(
      sendMessage.mock.calls.filter(
        ([message]) => message.action === "saveSettings"
      )
    ).toHaveLength(1);
    expect(harness.getState().saveState.status).toBe("saving");

    await act(async () => {
      saveDeferred.resolve({ success: true });
      await flushMicrotasks();
    });

    expect(harness.getState().saveState.status).toBe("saved");

    window.removeEventListener(
      UI_LOCALE_SWITCH_START_EVENT,
      localeSwitchStartListener
    );
    await harness.cleanup();
  });

  test("OPTIONS-I18N-002: non-uiLanguage settings stay on the delayed autosave path", async () => {
    const initialSettings = createDefaultSettings();
    const { sendMessage } = installChromeMock((message) => {
      if (message.action === "getSettings") {
        return { success: true, settings: initialSettings };
      }

      return { success: true };
    });

    const harness = await mountUseSettingsHarness();

    await act(async () => {
      harness.getState().updateSetting("model", "gpt-5.2");
      await flushMicrotasks();
    });

    expect(
      sendMessage.mock.calls.filter(
        ([message]) => message.action === "saveSettings"
      )
    ).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
      await flushMicrotasks();
    });

    expect(
      sendMessage.mock.calls.filter(
        ([message]) => message.action === "saveSettings"
      )
    ).toHaveLength(1);

    await harness.cleanup();
  });

  test("OPTIONS-I18N-003: transactional saves run immediately and surface background rejection", async () => {
    const initialSettings = createDefaultSettings();
    const { sendMessage } = installChromeMock((message) => {
      if (message.action === "getSettings") {
        return { success: true, settings: initialSettings };
      }

      if (
        message.action === "saveSettings" &&
        (message.settings as { storeMeetingChat?: boolean }).storeMeetingChat === true
      ) {
        return { success: false, error: "blocked" };
      }

      return { success: true };
    });

    const harness = await mountUseSettingsHarness();

    let result = false;
    await act(async () => {
      result = await harness.getState().persistSettingsNow({
        storeMeetingChat: true,
      });
      await flushMicrotasks();
    });

    expect(result).toBe(false);
    expect(
      sendMessage.mock.calls.filter(
        ([message]) => message.action === "saveSettings"
      )
    ).toHaveLength(1);
    expect(harness.getState().saveState.status).toBe("error");

    await harness.cleanup();
  });
});
