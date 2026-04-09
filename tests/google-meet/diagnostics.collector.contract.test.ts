import { beforeEach, describe, expect, test, vi } from "vitest";

type SessionStore = Record<string, unknown>;
type ChromeTabLike = { id?: number };

function installChromeStorageSession(
  initialState: SessionStore = {},
  options?: { includeSession?: boolean }
) {
  const sessionState: SessionStore = { ...initialState };
  const localState: SessionStore = { ...initialState };

  const session = {
    get: vi.fn(async (key?: string | string[] | Record<string, unknown>) => {
      if (typeof key === "string") {
        return { [key]: sessionState[key] };
      }

      if (Array.isArray(key)) {
        return key.reduce<Record<string, unknown>>((result, entry) => {
          result[entry] = sessionState[entry];
          return result;
        }, {});
      }

      if (key && typeof key === "object") {
        return Object.keys(key).reduce<Record<string, unknown>>((result, entry) => {
          result[entry] = sessionState[entry] ?? (key as Record<string, unknown>)[entry];
          return result;
        }, {});
      }

      return { ...sessionState };
    }),
    set: vi.fn(async (nextState: SessionStore) => {
      Object.assign(sessionState, nextState);
    }),
  };

  const local = {
    get: vi.fn(async (key?: string | string[] | Record<string, unknown>) => {
      if (typeof key === "string") {
        return { [key]: localState[key] };
      }

      if (Array.isArray(key)) {
        return key.reduce<Record<string, unknown>>((result, entry) => {
          result[entry] = localState[entry];
          return result;
        }, {});
      }

      if (key && typeof key === "object") {
        return Object.keys(key).reduce<Record<string, unknown>>((result, entry) => {
          result[entry] = localState[entry] ?? (key as Record<string, unknown>)[entry];
          return result;
        }, {});
      }

      return { ...localState };
    }),
    set: vi.fn(async (nextState: SessionStore) => {
      Object.assign(localState, nextState);
    }),
  };

  (globalThis as { chrome?: unknown }).chrome = {
    storage: {
      ...(options?.includeSession === false ? {} : { session }),
      local,
    },
  };

  return {
    session,
    sessionState,
    local,
    localState,
  };
}

async function loadDiagnosticsCollector(
  initialState: SessionStore = {},
  options?: { includeSession?: boolean }
) {
  vi.resetModules();
  const storage = installChromeStorageSession(initialState, options);
  const diagnosticsModule = await import("../../entrypoints/background/diagnostics");
  const sharedModule = await import("../../entrypoints/shared/diagnostics");

  return {
    ...storage,
    ...diagnosticsModule,
    ...sharedModule,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Diagnostics collector contract", () => {
  test("DIAG-COL-001: collector defaults to development thresholds and can resolve production-off behavior", async () => {
    const diagnostics = await loadDiagnosticsCollector();

    await diagnostics.initializeDiagnosticsCollector();
    expect(diagnostics.getDiagnosticsConfig()).toEqual({
      environment: "development",
      environmentLevels: {
        development: "debug",
        production: "off",
      },
      overrideMinLevel: null,
      enabled: true,
      minLevel: "debug",
      maxEvents: 400,
    });

    const appendResponse = await diagnostics.appendDiagnosticsEvent({
      level: "error",
      runtime: "background",
      domain: "runtime",
      feature: "background-message-router",
      message: "message_handler_failed",
      data: { reason: "development-default-check" },
    });

    expect(appendResponse).toEqual({ success: true, accepted: true });

    await diagnostics.setDiagnosticsConfig({
      environment: "production",
    });

    const disabledInProduction = await diagnostics.appendDiagnosticsEvent({
      level: "error",
      runtime: "background",
      domain: "runtime",
      feature: "background-message-router",
      message: "message_handler_blocked_in_production",
    });

    expect(disabledInProduction).toEqual({ success: true, accepted: false });

    const payload = await diagnostics.getDiagnosticsPayload();
    expect(payload.events).toHaveLength(1);
    expect(payload.counts).toEqual({
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 1,
    });
  });

  test("DIAG-COL-002: collector persists filtered events, sender metadata, and snapshots", async () => {
    const diagnostics = await loadDiagnosticsCollector();

    await diagnostics.initializeDiagnosticsCollector();
    await diagnostics.setDiagnosticsConfig({
      overrideMinLevel: "info",
      maxEvents: 3,
    });

    await diagnostics.appendDiagnosticsEvent({
      level: "debug",
      runtime: "content",
      domain: "runtime",
      feature: "content-boot",
      message: "boot_retry_failed",
    });

    await diagnostics.appendDiagnosticsEvent(
      {
        level: "info",
        runtime: "content",
        domain: "provider",
        feature: "teams-caption-pipeline",
        provider: "microsoft-teams",
        message: "observer_attached",
      },
      {
        frameId: 0,
        tab: { id: 17 } as ChromeTabLike,
        url: "https://teams.microsoft.com/meet/abc",
      }
    );

    await diagnostics.appendDiagnosticsEvent({
      level: "warn",
      runtime: "background",
      domain: "translation",
      feature: "openai-translation-service",
      provider: "google-meet",
      message: "translation_failed",
      data: { sourceUrl: "https://meet.google.com/abc-defg-hij?authuser=1" },
    });

    await diagnostics.appendDiagnosticsEvent({
      level: "error",
      runtime: "background",
      domain: "assistant",
      feature: "live-assistant",
      provider: "google-meet",
      message: "assistant_generation_failed",
      data: { prompt: "sensitive-prompt" },
    });

    await diagnostics.setDiagnosticsSnapshot("content-runtime", "content", {
      providerPlatform: "google-meet",
      sourceUrl: "https://meet.google.com/abc-defg-hij?authuser=1",
    });

    const payload = await diagnostics.getDiagnosticsPayload({
      minLevel: "warn",
      limit: 10,
    });

    expect(payload.events).toHaveLength(2);
    expect(payload.events[0]?.message).toBe("translation_failed");
    expect(payload.events[0]?.data).toEqual({
      sourceUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(payload.events[1]?.message).toBe("assistant_generation_failed");
    expect(payload.events[1]?.data).toEqual({
      prompt: "[redacted]",
    });
    expect(payload.counts).toEqual({
      trace: 0,
      debug: 0,
      info: 0,
      warn: 1,
      error: 1,
    });
    expect(Object.keys(payload.snapshots)).toHaveLength(1);
    expect(payload.resolvedSnapshot?.data).toEqual({
      providerPlatform: "google-meet",
      sourceUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(diagnostics.session.set).toHaveBeenCalled();

    const allPayload = await diagnostics.getDiagnosticsPayload({ minLevel: "info" });
    expect(allPayload.events).toHaveLength(3);
    expect(allPayload.events[0]?.message).toBe("observer_attached");
    expect(allPayload.events[0]?.sender).toEqual({
      tabId: 17,
      frameId: 0,
      documentId: undefined,
      origin: "https://teams.microsoft.com",
      url: "https://teams.microsoft.com/meet/abc",
    });
  });

  test("DIAG-COL-003: hydrated state can be read and cleared", async () => {
    const diagnosticsStateKey = "captionarc-diagnostics-state";
    const diagnostics = await loadDiagnosticsCollector({
      [diagnosticsStateKey]: {
        config: {
          environment: "development",
          environmentLevels: {
            development: "debug",
            production: "off",
          },
          overrideMinLevel: null,
          maxEvents: 150,
        },
        events: [
          {
            id: "event-1",
            timestamp: "2026-04-06T00:00:00.000Z",
            level: "info",
            runtime: "background",
            domain: "runtime",
            feature: "background-message-router",
            message: "hydrated_event",
          },
        ],
        snapshots: {
          "content-runtime": {
            key: "content-runtime",
            runtime: "content",
            updatedAt: "2026-04-06T00:00:00.000Z",
            data: { providerPlatform: "google-meet" },
          },
        },
      },
    });

    await diagnostics.initializeDiagnosticsCollector();
    const hydratedPayload = await diagnostics.getDiagnosticsPayload();
    expect(hydratedPayload.events).toHaveLength(1);
    expect(hydratedPayload.resolvedSnapshot?.data).toEqual({
      providerPlatform: "google-meet",
    });

    await diagnostics.clearDiagnosticsSnapshot("content-runtime");
    await diagnostics.clearDiagnosticsData({ includeSnapshots: true });

    const clearedPayload = await diagnostics.getDiagnosticsPayload();
    expect(clearedPayload.events).toHaveLength(0);
    expect(clearedPayload.snapshots).toEqual({});
  });

  test("DIAG-COL-004: scoped snapshots do not collide across provider or frame", async () => {
    const diagnostics = await loadDiagnosticsCollector();

    await diagnostics.initializeDiagnosticsCollector();
    await diagnostics.setDiagnosticsSnapshot(
      "content-runtime",
      "content",
      {
        providerPlatform: "google-meet",
        initialPresence: "joined",
      },
      {
        frameId: 0,
        tab: { id: 17 } as ChromeTabLike,
        url: "https://meet.google.com/abc-defg-hij",
      }
    );
    await diagnostics.setDiagnosticsSnapshot(
      "content-runtime",
      "content",
      {
        providerPlatform: "microsoft-teams",
        initialPresence: "lobby",
      },
      {
        frameId: 1,
        tab: { id: 17 } as ChromeTabLike,
        url: "https://teams.microsoft.com/meet/abc",
      }
    );

    const allPayload = await diagnostics.getDiagnosticsPayload({
      snapshotBaseKey: "content-runtime",
    });
    expect(Object.keys(allPayload.snapshots)).toHaveLength(2);

    const meetPayload = await diagnostics.getDiagnosticsPayload({
      provider: "google-meet",
      runtime: "content",
      pageUrl: "https://meet.google.com/abc-defg-hij",
      snapshotBaseKey: "content-runtime",
    });
    expect(Object.keys(meetPayload.snapshots)).toHaveLength(1);
    expect(meetPayload.resolvedSnapshot?.data).toEqual({
      providerPlatform: "google-meet",
      initialPresence: "joined",
    });

    const teamsPayload = await diagnostics.getDiagnosticsPayload({
      provider: "microsoft-teams",
      runtime: "content",
      pageUrl: "https://teams.microsoft.com/meet/abc",
      snapshotBaseKey: "content-runtime",
    });
    expect(Object.keys(teamsPayload.snapshots)).toHaveLength(1);
    expect(teamsPayload.resolvedSnapshot?.data).toEqual({
      providerPlatform: "microsoft-teams",
      initialPresence: "lobby",
    });
  });

  test("DIAG-COL-005: collector debounces persistence and drops repetitive events", async () => {
    vi.useFakeTimers();
    const diagnostics = await loadDiagnosticsCollector();

    await diagnostics.initializeDiagnosticsCollector();
    diagnostics.session.set.mockClear();

    const firstTick = await diagnostics.appendDiagnosticsEvent(
      {
        level: "debug",
        runtime: "content",
        domain: "provider",
        feature: "teams-caption-pipeline",
        provider: "microsoft-teams",
        message: "observer-tick",
        data: { tick: 1 },
      },
      {
        frameId: 0,
        tab: { id: 17 } as ChromeTabLike,
        url: "https://teams.microsoft.com/meet/abc",
      }
    );
    const duplicateTick = await diagnostics.appendDiagnosticsEvent(
      {
        level: "debug",
        runtime: "content",
        domain: "provider",
        feature: "teams-caption-pipeline",
        provider: "microsoft-teams",
        message: "observer-tick",
        data: { tick: 2 },
      },
      {
        frameId: 0,
        tab: { id: 17 } as ChromeTabLike,
        url: "https://teams.microsoft.com/meet/abc",
      }
    );
    const errorEvent = await diagnostics.appendDiagnosticsEvent({
      level: "error",
      runtime: "background",
      domain: "assistant",
      feature: "live-assistant",
      provider: "google-meet",
      message: "assistant_generation_failed",
    });

    expect(firstTick).toEqual({ success: true, accepted: true });
    expect(duplicateTick).toEqual({ success: true, accepted: false });
    expect(errorEvent).toEqual({ success: true, accepted: true });
    expect(diagnostics.session.set).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(149);
    expect(diagnostics.session.set).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(diagnostics.session.set).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    const lateTick = await diagnostics.appendDiagnosticsEvent(
      {
        level: "debug",
        runtime: "content",
        domain: "provider",
        feature: "teams-caption-pipeline",
        provider: "microsoft-teams",
        message: "observer-tick",
        data: { tick: 3 },
      },
      {
        frameId: 0,
        tab: { id: 17 } as ChromeTabLike,
        url: "https://teams.microsoft.com/meet/abc",
      }
    );
    expect(lateTick).toEqual({ success: true, accepted: true });

    await vi.advanceTimersByTimeAsync(150);
    expect(diagnostics.session.set).toHaveBeenCalledTimes(2);
  });

  test("DIAG-COL-006: unchanged snapshots do not trigger extra writes", async () => {
    vi.useFakeTimers();
    const diagnostics = await loadDiagnosticsCollector();

    await diagnostics.initializeDiagnosticsCollector();
    diagnostics.session.set.mockClear();

    const sender = {
      frameId: 0,
      tab: { id: 21 } as ChromeTabLike,
      url: "https://meet.google.com/abc-defg-hij",
    };

    const firstSnapshot = await diagnostics.setDiagnosticsSnapshot(
      "content-runtime",
      "content",
      {
        providerPlatform: "google-meet",
        initialPresence: "joined",
      },
      sender
    );
    expect(firstSnapshot).toEqual({ success: true, accepted: true });

    await vi.advanceTimersByTimeAsync(150);
    expect(diagnostics.session.set).toHaveBeenCalledTimes(1);

    diagnostics.session.set.mockClear();

    const unchangedSnapshot = await diagnostics.setDiagnosticsSnapshot(
      "content-runtime",
      "content",
      {
        providerPlatform: "google-meet",
        initialPresence: "joined",
      },
      sender
    );
    expect(unchangedSnapshot).toEqual({ success: true, accepted: false });

    await vi.advanceTimersByTimeAsync(150);
    expect(diagnostics.session.set).not.toHaveBeenCalled();
  });

  test("DIAG-COL-007: collector falls back to local storage when session storage is unavailable", async () => {
    const diagnosticsStateKey = "captionarc-diagnostics-state";
    const diagnostics = await loadDiagnosticsCollector(
      {
        [diagnosticsStateKey]: {
          config: {
            environment: "development",
            environmentLevels: {
              development: "debug",
              production: "off",
            },
            overrideMinLevel: null,
            maxEvents: 100,
          },
        },
      },
      { includeSession: false }
    );

    await diagnostics.initializeDiagnosticsCollector();
    expect(diagnostics.getDiagnosticsConfig().maxEvents).toBe(100);

    await diagnostics.appendDiagnosticsEvent({
      level: "warn",
      runtime: "background",
      domain: "runtime",
      feature: "background-message-router",
      message: "local_storage_fallback_active",
    });

    await diagnostics.flushPendingDiagnosticsPersistence();

    expect(diagnostics.local.set).toHaveBeenCalled();
    expect(
      diagnostics.localState[diagnosticsStateKey] as { events?: unknown[] }
    ).toEqual(
      expect.objectContaining({
        events: expect.arrayContaining([
          expect.objectContaining({ message: "local_storage_fallback_active" }),
        ]),
      })
    );
  });
});