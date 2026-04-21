import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { CloudSyncState } from "../../entrypoints/background/cloud-sync/types";
import { I18nProvider } from "../../entrypoints/shared/i18n";
import { useCloudSync } from "../../entrypoints/options/use-cloud-sync";

type UseCloudSyncState = ReturnType<typeof useCloudSync>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createCloudSyncState(
  overrides: Partial<CloudSyncState> = {}
): CloudSyncState {
  return {
    queueSize: 0,
    dueTaskCount: 0,
    engine: { running: false },
    checkpoints: [],
    diagnostics: [],
    pendingSettingsDecision: null,
    ...overrides,
  };
}

function installRuntimeMock(
  handler: (message: Record<string, unknown>) => Promise<unknown> | unknown
) {
  const sendMessage = vi.fn((message: Record<string, unknown>) => handler(message));
  (
    globalThis as typeof globalThis & {
      chrome?: { runtime?: { sendMessage?: typeof sendMessage } };
    }
  ).chrome = {
    runtime: {
      sendMessage,
    },
  };

  return { sendMessage };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

async function mountUseCloudSyncHarness() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let root: Root | null = createRoot(container);
  let latestState: UseCloudSyncState | null = null;

  function Harness() {
    latestState = useCloudSync();
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
    getState(): UseCloudSyncState {
      if (!latestState) {
        throw new Error("useCloudSync harness has not rendered yet.");
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

describe("Cloud sync hook contracts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    (globalThis as typeof globalThis & { chrome?: unknown }).chrome = undefined;
  });

  test("CSYNC-HOOK-001: stale cloud-sync responses do not overwrite newer state", async () => {
    const initialLoadDeferred = createDeferred<{
      success: boolean;
      state: CloudSyncState;
    }>();
    const latestState = createCloudSyncState({
      checkpoints: [
        {
          provider: "google-drive",
          connected: true,
          healthState: "up-to-date",
          manualRetryAvailable: false,
          lastSuccessfulSyncAt: 1_000_000,
        },
      ],
    });
    let loadCallCount = 0;

    installRuntimeMock((message) => {
      if (message.action !== "getCloudSyncState") {
        throw new Error(`Unexpected action: ${String(message.action)}`);
      }

      loadCallCount += 1;
      if (loadCallCount === 1) {
        return initialLoadDeferred.promise;
      }

      return { success: true, state: latestState };
    });

    const harness = await mountUseCloudSyncHarness();

    await act(async () => {
      void harness.getState().refreshCloudSyncState();
      await flushMicrotasks();
    });

    expect(harness.getState().cloudSyncState.checkpoints).toEqual(
      latestState.checkpoints
    );
    expect(harness.getState().cloudSyncMutationState.status).toBe("success");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "Cloud sync status refreshed."
    );

    await act(async () => {
      initialLoadDeferred.resolve({
        success: true,
        state: createCloudSyncState({
          checkpoints: [
            {
              provider: "google-drive",
              connected: false,
              healthState: "disconnected",
              manualRetryAvailable: false,
            },
          ],
        }),
      });
      await flushMicrotasks();
    });

    expect(harness.getState().cloudSyncState.checkpoints).toEqual(
      latestState.checkpoints
    );
    expect(harness.getState().cloudSyncMutationState.status).toBe("success");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "Cloud sync status refreshed."
    );

    await harness.cleanup();
  });

  test("CSYNC-HOOK-002: idle message reflects sync attention state, not just provider connectivity", async () => {
    installRuntimeMock(() => ({
      success: true,
      state: createCloudSyncState({
        checkpoints: [
          {
            provider: "google-drive",
            connected: true,
            healthState: "needs-attention",
            manualRetryAvailable: false,
          },
        ],
      }),
    }));

    const harness = await mountUseCloudSyncHarness();

    expect(harness.getState().cloudSyncMutationState.status).toBe("idle");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "At least one cloud destination needs intervention before the archive is fully protected again."
    );

    await harness.cleanup();
  });

  test("CSYNC-HOOK-003: disconnected state with queued work still keeps first-connect copy simple", async () => {
    installRuntimeMock(() => ({
      success: true,
      state: createCloudSyncState({
        queueSize: 12,
        dueTaskCount: 12,
      }),
    }));

    const harness = await mountUseCloudSyncHarness();

    expect(harness.getState().cloudSyncMutationState.status).toBe("idle");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "Connect a cloud provider to protect your archive automatically."
    );

    await harness.cleanup();
  });

  test("CSYNC-HOOK-004: manual refresh exposes loading state before the refreshed snapshot lands", async () => {
    const refreshDeferred = createDeferred<{
      success: boolean;
      state: CloudSyncState;
    }>();
    let loadCallCount = 0;

    installRuntimeMock(() => {
      loadCallCount += 1;
      if (loadCallCount === 1) {
        return {
          success: true,
          state: createCloudSyncState(),
        };
      }

      return refreshDeferred.promise;
    });

    const harness = await mountUseCloudSyncHarness();

    await act(async () => {
      void harness.getState().refreshCloudSyncState();
      await flushMicrotasks();
    });

    expect(harness.getState().cloudSyncMutationState.status).toBe("loading");
    expect(harness.getState().cloudSyncMutationState.intent).toBe("refresh");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "Checking the latest cloud sync state..."
    );

    await act(async () => {
      refreshDeferred.resolve({
        success: true,
        state: createCloudSyncState({
          queueSize: 4,
          dueTaskCount: 4,
        }),
      });
      await flushMicrotasks();
    });

    expect(harness.getState().cloudSyncMutationState.status).toBe("success");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "Cloud sync status refreshed."
    );

    await harness.cleanup();
  });

  test("CSYNC-HOOK-005: success feedback returns to the derived idle state after the short acknowledgement window", async () => {
    installRuntimeMock(() => ({
      success: true,
      state: createCloudSyncState({
        checkpoints: [
          {
            provider: "google-drive",
            connected: true,
            healthState: "up-to-date",
            manualRetryAvailable: false,
          },
        ],
      }),
    }));

    const harness = await mountUseCloudSyncHarness();

    await act(async () => {
      void harness.getState().refreshCloudSyncState();
      await flushMicrotasks();
    });

    expect(harness.getState().cloudSyncMutationState.status).toBe("success");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "Cloud sync status refreshed."
    );

    await act(async () => {
      vi.advanceTimersByTime(4_000);
      await flushMicrotasks();
    });

    expect(harness.getState().cloudSyncMutationState.status).toBe("idle");
    expect(harness.getState().cloudSyncMutationState.message).toBe(
      "Cloud sync status is up to date."
    );

    await harness.cleanup();
  });
});
