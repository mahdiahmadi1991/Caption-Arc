import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { I18nProvider } from "../../entrypoints/shared/i18n";
import type {
  DiagnosticsConfig,
  DiagnosticsEvent,
  DiagnosticsLevel,
  DiagnosticsSnapshot,
} from "../../entrypoints/shared/diagnostics";
import { DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS } from "../../entrypoints/options/diagnostics-viewer";
import { useDiagnosticsConsole } from "../../entrypoints/options/use-diagnostics-console";

type DiagnosticsPayloadResponse = {
  success: boolean;
  error?: string;
  config: DiagnosticsConfig;
  events: DiagnosticsEvent[];
  snapshots: Record<string, DiagnosticsSnapshot>;
  resolvedSnapshot: DiagnosticsSnapshot | null;
  counts: Record<DiagnosticsLevel, number>;
};

type DiagnosticsHookState = ReturnType<typeof useDiagnosticsConsole>;

function createDiagnosticsConfig(
  overrides: Partial<DiagnosticsConfig> = {}
): DiagnosticsConfig {
  return {
    environment: "development",
    environmentLevels: {
      development: "debug",
      production: "off",
    },
    overrideMinLevel: null,
    enabled: true,
    minLevel: "debug",
    maxEvents: 400,
    ...overrides,
  };
}

function createDiagnosticsPayload(
  overrides: Partial<DiagnosticsPayloadResponse> = {}
): DiagnosticsPayloadResponse {
  return {
    success: true,
    config: createDiagnosticsConfig(),
    events: [],
    snapshots: {},
    resolvedSnapshot: null,
    counts: {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    },
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function installRuntimeMock(
  handler: (message: Record<string, unknown>) => Promise<unknown> | unknown
) {
  const sendMessage = vi.fn((message: Record<string, unknown>) => handler(message));
  (globalThis as typeof globalThis & {
    chrome?: { runtime?: { sendMessage?: typeof sendMessage } };
  }).chrome = {
    runtime: {
      sendMessage,
    },
  };

  return { sendMessage };
}

function setDocumentVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

async function mountDiagnosticsConsoleHarness() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let root: Root | null = createRoot(container);
  let latestState: DiagnosticsHookState | null = null;
  let renderCount = 0;

  function Harness() {
    latestState = useDiagnosticsConsole();
    renderCount += 1;
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
    getState(): DiagnosticsHookState {
      if (!latestState) {
        throw new Error("Diagnostics console harness has not rendered yet.");
      }

      return latestState;
    },
    getRenderCount(): number {
      return renderCount;
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

beforeEach(() => {
  vi.useFakeTimers();
  setDocumentVisibility("visible");
});

afterEach(() => {
  (globalThis as typeof globalThis & { chrome?: unknown }).chrome = undefined;
});

describe("Diagnostics console hook stability", () => {
  test("DIAG-HOOK-001: second no-op poll does not churn state", async () => {
    const payload = createDiagnosticsPayload({
      events: [
        {
          id: "event-1",
          timestamp: "2026-04-07T00:00:00.000Z",
          level: "info",
          runtime: "options",
          domain: "runtime",
          feature: "diagnostics-console",
          message: "console_opened",
        },
      ],
      counts: {
        trace: 0,
        debug: 0,
        info: 1,
        warn: 0,
        error: 0,
      },
    });
    installRuntimeMock((message) => {
      if (message.action === "getDiagnosticsConfig") {
        return { success: true, config: payload.config };
      }

      if (message.action === "getDiagnosticsPayload") {
        return payload;
      }

      throw new Error(`Unexpected action: ${String(message.action)}`);
    });

    const harness = await mountDiagnosticsConsoleHarness();

    await act(async () => {
      harness.getState().setDrawerOpen(true);
      await flushMicrotasks();
    });

    await act(async () => {
      await flushMicrotasks();
    });

    const stateBeforeSecondPoll = harness.getState();
    const configBeforeSecondPoll = stateBeforeSecondPoll.config;
    const eventsBeforeSecondPoll = stateBeforeSecondPoll.events;
    const countsBeforeSecondPoll = stateBeforeSecondPoll.counts;
    const resolvedSnapshotBeforeSecondPoll =
      stateBeforeSecondPoll.resolvedSnapshot;
    const snapshotCountBeforeSecondPoll = stateBeforeSecondPoll.snapshotCount;
    const lastUpdatedAtBeforeSecondPoll = stateBeforeSecondPoll.lastUpdatedAt;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS);
      await flushMicrotasks();
    });

    expect(harness.getState().config).toBe(configBeforeSecondPoll);
    expect(harness.getState().events).toBe(eventsBeforeSecondPoll);
    expect(harness.getState().counts).toBe(countsBeforeSecondPoll);
    expect(harness.getState().resolvedSnapshot).toBe(
      resolvedSnapshotBeforeSecondPoll
    );
    expect(harness.getState().snapshotCount).toBe(snapshotCountBeforeSecondPoll);
    expect(harness.getState().lastUpdatedAt).toBe(lastUpdatedAtBeforeSecondPoll);
    await harness.cleanup();
  });

  test("DIAG-HOOK-002: auto-poll stays silent while manual refresh owns spinner state", async () => {
    let payloadCallCount = 0;
    const manualRefreshDeferred = createDeferred<DiagnosticsPayloadResponse>();
    const payload = createDiagnosticsPayload();

    installRuntimeMock((message) => {
      if (message.action === "getDiagnosticsConfig") {
        return { success: true, config: payload.config };
      }

      if (message.action === "getDiagnosticsPayload") {
        payloadCallCount += 1;
        if (payloadCallCount === 1) {
          return payload;
        }

        return manualRefreshDeferred.promise;
      }

      throw new Error(`Unexpected action: ${String(message.action)}`);
    });

    const harness = await mountDiagnosticsConsoleHarness();

    await act(async () => {
      harness.getState().setDrawerOpen(true);
      await flushMicrotasks();
    });

    expect(harness.getState().manualRefreshInProgress).toBe(false);

    await act(async () => {
      void harness.getState().refreshPayload();
      await flushMicrotasks();
    });

    expect(harness.getState().manualRefreshInProgress).toBe(true);

    await act(async () => {
      manualRefreshDeferred.resolve(payload);
      await flushMicrotasks();
    });

    expect(harness.getState().manualRefreshInProgress).toBe(false);
    await harness.cleanup();
  });

  test("DIAG-HOOK-003: hidden tab pauses polling", async () => {
    let payloadCalls = 0;
    const payload = createDiagnosticsPayload();
    installRuntimeMock((message) => {
      if (message.action === "getDiagnosticsConfig") {
        return { success: true, config: payload.config };
      }

      if (message.action === "getDiagnosticsPayload") {
        payloadCalls += 1;
        return payload;
      }

      throw new Error(`Unexpected action: ${String(message.action)}`);
    });

    const harness = await mountDiagnosticsConsoleHarness();

    await act(async () => {
      harness.getState().setDrawerOpen(true);
      await flushMicrotasks();
    });

    expect(payloadCalls).toBe(1);

    await act(async () => {
      setDocumentVisibility("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      await flushMicrotasks();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS * 2);
      await flushMicrotasks();
    });

    expect(payloadCalls).toBe(1);
    await harness.cleanup();
  });

  test("DIAG-HOOK-004: overlapping polls are skipped while one request is in flight", async () => {
    let payloadCalls = 0;
    const payload = createDiagnosticsPayload();
    const firstPollDeferred = createDeferred<DiagnosticsPayloadResponse>();

    installRuntimeMock((message) => {
      if (message.action === "getDiagnosticsConfig") {
        return { success: true, config: payload.config };
      }

      if (message.action === "getDiagnosticsPayload") {
        payloadCalls += 1;
        if (payloadCalls === 1) {
          return firstPollDeferred.promise;
        }

        return payload;
      }

      throw new Error(`Unexpected action: ${String(message.action)}`);
    });

    const harness = await mountDiagnosticsConsoleHarness();

    await act(async () => {
      harness.getState().setDrawerOpen(true);
      await flushMicrotasks();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS * 3);
      await flushMicrotasks();
    });

    expect(payloadCalls).toBe(1);

    await act(async () => {
      firstPollDeferred.resolve(payload);
      await flushMicrotasks();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS);
      await flushMicrotasks();
    });

    expect(payloadCalls).toBe(2);
    await harness.cleanup();
  });
});