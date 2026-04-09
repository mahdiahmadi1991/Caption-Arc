import { describe, expect, test } from "vitest";
import { getAppEnvironmentConfig } from "../../entrypoints/shared/environment";
import { createDiagnosticsEvent } from "../../entrypoints/shared/diagnostics";
import {
  areAllDiagnosticsViewerLevelsSelected,
  createDiagnosticsPayloadFingerprint,
  describeDiagnosticsEvent,
  filterDiagnosticsViewerEvents,
  getDiagnosticsViewerDefaultLevelFilter,
  getDiagnosticsSessionEnableLevel,
  getDiagnosticsViewerStatus,
  hasDiagnosticsPayloadChanged,
  humanizeDiagnosticsMessage,
  isDiagnosticsViewerNearLatest,
  selectAllDiagnosticsViewerLevels,
  matchesDiagnosticsViewerSearch,
  serializeDiagnosticsViewerEvents,
  toggleDiagnosticsViewerLevel,
} from "../../entrypoints/options/diagnostics-viewer";

describe("Diagnostics viewer: filtering", () => {
  test("DIAG-VIEW-001: multi-select level filter and search term work together", () => {
    const events = [
      createDiagnosticsEvent({
        level: "info",
        runtime: "options",
        domain: "runtime",
        feature: "diagnostics-console",
        provider: "google-meet",
        message: "console_opened",
      }),
      createDiagnosticsEvent({
        level: "error",
        runtime: "background",
        domain: "translation",
        feature: "openai-translation-service",
        provider: "microsoft-teams",
        message: "translation_failed",
      }),
    ];

    const filtered = filterDiagnosticsViewerEvents(events, {
      levelFilter: ["warn", "error"],
      searchTerm: "teams",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.message).toBe("translation_failed");
  });

  test("DIAG-VIEW-001B: multi-select filter keeps multiple active levels visible", () => {
    const events = [
      createDiagnosticsEvent({
        level: "info",
        runtime: "options",
        domain: "runtime",
        feature: "diagnostics-console",
        message: "console_opened",
      }),
      createDiagnosticsEvent({
        level: "warn",
        runtime: "background",
        domain: "cloud-sync",
        feature: "cloud-sync-provider",
        message: "cloud_sync_remote_settings_invalid",
      }),
      createDiagnosticsEvent({
        level: "error",
        runtime: "background",
        domain: "translation",
        feature: "openai-translation-service",
        message: "translation_failed",
      }),
    ];

    const filtered = filterDiagnosticsViewerEvents(events, {
      levelFilter: ["info", "warn"],
    });

    expect(filtered.map((event) => event.message)).toEqual([
      "console_opened",
      "cloud_sync_remote_settings_invalid",
    ]);
  });

  test("DIAG-VIEW-001C: all shortcut resets selection to every diagnostics level", () => {
    const narrowedSelection = toggleDiagnosticsViewerLevel(
      getDiagnosticsViewerDefaultLevelFilter(),
      "trace"
    );

    expect(areAllDiagnosticsViewerLevelsSelected(narrowedSelection)).toBe(false);
    expect(narrowedSelection).not.toContain("trace");

    const resetSelection = selectAllDiagnosticsViewerLevels();

    expect(areAllDiagnosticsViewerLevelsSelected(resetSelection)).toBe(true);
    expect(resetSelection).toEqual(getDiagnosticsViewerDefaultLevelFilter());
  });
});

describe("Diagnostics viewer: search", () => {
  test("DIAG-VIEW-002: search matches message, domain, feature, and provider", () => {
    const event = createDiagnosticsEvent({
      level: "warn",
      runtime: "content",
      domain: "provider",
      feature: "teams-caption-pipeline",
      provider: "microsoft-teams",
      message: "observer_detached",
    });

    expect(matchesDiagnosticsViewerSearch(event, "observer")).toBe(true);
    expect(matchesDiagnosticsViewerSearch(event, "provider")).toBe(true);
    expect(matchesDiagnosticsViewerSearch(event, "caption")).toBe(true);
    expect(matchesDiagnosticsViewerSearch(event, "teams")).toBe(true);
    expect(matchesDiagnosticsViewerSearch(event, "google")).toBe(false);
  });

  test("DIAG-VIEW-002B: search matches the humanized message label as well as the raw key", () => {
    const event = createDiagnosticsEvent({
      level: "info",
      runtime: "options",
      domain: "runtime",
      feature: "diagnostics-console",
      message: "options_settings_load_completed",
    });

    expect(matchesDiagnosticsViewerSearch(event, "options settings load completed")).toBe(
      true
    );
    expect(matchesDiagnosticsViewerSearch(event, "options_settings_load_completed")).toBe(
      true
    );
  });

  test("DIAG-VIEW-002H: search also matches generated summaries", () => {
    const event = createDiagnosticsEvent({
      level: "trace",
      runtime: "background",
      domain: "runtime",
      feature: "background-message-router",
      message: "message_completed",
      data: { action: "getSettings" },
    });

    expect(matchesDiagnosticsViewerSearch(event, "finished handling the get settings message")).toBe(
      true
    );
    expect(matchesDiagnosticsViewerSearch(event, "background message completed")).toBe(
      true
    );
  });
});

describe("Diagnostics viewer: message humanization", () => {
  test("DIAG-VIEW-002C: snake_case becomes a readable label", () => {
    expect(humanizeDiagnosticsMessage("options_settings_load_completed")).toBe(
      "Options settings load completed"
    );
  });

  test("DIAG-VIEW-002D: kebab-case becomes a readable label", () => {
    expect(humanizeDiagnosticsMessage("provider-parser-wave-four")).toBe(
      "Provider parser wave four"
    );
  });

  test("DIAG-VIEW-002E: dot.case becomes a readable label", () => {
    expect(humanizeDiagnosticsMessage("zoom.caption_stream_started")).toBe(
      "Zoom caption stream started"
    );
  });

  test("DIAG-VIEW-002F: already human-readable strings stay stable", () => {
    expect(humanizeDiagnosticsMessage("Observer detached")).toBe(
      "Observer detached"
    );
  });

  test("DIAG-VIEW-002G: common acronyms stay uppercase when recognized", () => {
    expect(humanizeDiagnosticsMessage("api_url_sync_failed")).toBe(
      "API URL sync failed"
    );
  });

  test("DIAG-VIEW-002I: camelCase fragments are separated into readable words", () => {
    expect(humanizeDiagnosticsMessage("getSettings")).toBe("Get settings");
  });
});

describe("Diagnostics viewer: event descriptions", () => {
  test("DIAG-VIEW-002J: known events use richer mapped titles and summaries", () => {
    const event = createDiagnosticsEvent({
      level: "info",
      runtime: "options",
      domain: "cloud-sync",
      feature: "cloud-sync-settings",
      message: "options_cloud_sync_load_completed",
    });

    expect(describeDiagnosticsEvent(event)).toEqual({
      title: "Cloud sync settings loaded",
      summary:
        "The options page finished loading the current cloud sync configuration for this session.",
      rawMessage: "options_cloud_sync_load_completed",
    });
  });

  test("DIAG-VIEW-002K: unknown events use a deterministic fallback summary", () => {
    const event = createDiagnosticsEvent({
      level: "debug",
      runtime: "content",
      domain: "provider",
      feature: "caption-parser",
      provider: "google-meet",
      message: "observer_cycle_recorded",
    });

    expect(describeDiagnosticsEvent(event)).toEqual({
      title: "Observer cycle recorded",
      summary:
        "A diagnostics event was recorded in the caption parser feature for the provider domain in the content runtime for the google meet provider.",
      rawMessage: "observer_cycle_recorded",
    });
  });
});

describe("Diagnostics viewer: serialization", () => {
  test("DIAG-VIEW-003: visible logs serialize to ndjson with stable raw fields", () => {
    const event = createDiagnosticsEvent({
      level: "error",
      runtime: "background",
      domain: "assistant",
      feature: "live-assistant",
      provider: "google-meet",
      message: "assistant_generation_failed",
      sessionId: "session-123",
      requestId: "request-456",
      correlationId: "corr-789",
      data: { prompt: "private prompt" },
    });

    const serialized = serializeDiagnosticsViewerEvents([event]);
    const parsed = JSON.parse(serialized) as Record<string, unknown>;

    expect(parsed.level).toBe("error");
    expect(parsed.runtime).toBe("background");
    expect(parsed.domain).toBe("assistant");
    expect(parsed.feature).toBe("live-assistant");
    expect(parsed.provider).toBe("google-meet");
    expect(parsed.message).toBe("assistant_generation_failed");
    expect(parsed.sessionId).toBe("session-123");
    expect(parsed.requestId).toBe("request-456");
    expect(parsed.correlationId).toBe("corr-789");
    expect(parsed.data).toEqual({ prompt: "[redacted]" });
    expect(describeDiagnosticsEvent(event).rawMessage).toBe(
      "assistant_generation_failed"
    );
  });
});

describe("Diagnostics viewer: status derivation", () => {
  test("DIAG-VIEW-004: status reflects connection, disablement, and live polling", () => {
    const baseConfig = {
      environment: "production",
      environmentLevels: {
        development: "debug",
        production: "off",
      },
      overrideMinLevel: null,
      enabled: false,
      minLevel: "debug",
      maxEvents: 400,
    } as const;

    expect(
      getDiagnosticsViewerStatus({
        viewerEnabled: true,
        config: null,
        drawerOpen: false,
        pageVisible: true,
        hasError: false,
      }).label
    ).toBe("Connecting");

    expect(
      getDiagnosticsViewerStatus({
        viewerEnabled: true,
        config: baseConfig,
        drawerOpen: true,
        pageVisible: true,
        hasError: false,
      }).label
    ).toBe("Session off");

    expect(
      getDiagnosticsViewerStatus({
        viewerEnabled: true,
        config: { ...baseConfig, enabled: true },
        drawerOpen: true,
        pageVisible: true,
        hasError: false,
      }).label
    ).toBe("Live");
  });

  test("DIAG-VIEW-005: enabling a disabled production session uses info level", () => {
    expect(
      getDiagnosticsSessionEnableLevel({
        environment: "production",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: "off",
        enabled: false,
        minLevel: "debug",
        maxEvents: 400,
      })
    ).toBe("info");
  });
});

describe("Diagnostics viewer: payload stability", () => {
  test("DIAG-VIEW-007: fingerprinting treats identical payloads as no-op updates", () => {
    const event = createDiagnosticsEvent({
      level: "info",
      runtime: "options",
      domain: "runtime",
      feature: "diagnostics-console",
      message: "console_opened",
    });
    const payload = {
      config: {
        environment: "development",
        environmentLevels: {
          development: "debug",
          production: "off",
        },
        overrideMinLevel: null,
        enabled: true,
        minLevel: "debug",
        maxEvents: 400,
      } as const,
      events: [event],
      counts: {
        trace: 0,
        debug: 0,
        info: 1,
        warn: 0,
        error: 0,
      },
      resolvedSnapshot: null,
      snapshotCount: 0,
    };

    const fingerprint = createDiagnosticsPayloadFingerprint(payload);

    expect(hasDiagnosticsPayloadChanged(null, payload)).toBe(true);
    expect(hasDiagnosticsPayloadChanged(fingerprint, payload)).toBe(false);
  });
});

describe("Diagnostics viewer: environment consistency", () => {
  test("DIAG-VIEW-008: production keeps viewer available while capture stays off", () => {
    expect(getAppEnvironmentConfig("production").diagnostics.viewerEnabled).toBe(true);
    expect(getAppEnvironmentConfig("production").diagnostics.minLevel).toBe("off");
  });

  test("DIAG-VIEW-009: development baseline defaults to debug", () => {
    expect(getAppEnvironmentConfig("development").diagnostics.minLevel).toBe(
      "debug"
    );
  });
});

describe("Diagnostics viewer: autoscroll", () => {
  test("DIAG-VIEW-006: near-latest helper pauses only when user scrolls meaningfully away", () => {
    expect(
      isDiagnosticsViewerNearLatest({
        scrollTop: 720,
        scrollHeight: 1000,
        clientHeight: 260,
      })
    ).toBe(true);

    expect(
      isDiagnosticsViewerNearLatest({
        scrollTop: 600,
        scrollHeight: 1000,
        clientHeight: 260,
      })
    ).toBe(false);
  });
});