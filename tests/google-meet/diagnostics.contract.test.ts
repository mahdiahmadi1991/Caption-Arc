import { describe, expect, test } from "vitest";
import {
  createDiagnosticsEvent,
  createDiagnosticsSnapshot,
  filterDiagnosticsEvents,
  shouldCaptureDiagnosticsLevel,
} from "../../entrypoints/shared/diagnostics";

describe("Diagnostics contract: level gating", () => {
  test("DIAG-LVL-001: debug captures warn and error but not trace", () => {
    expect(shouldCaptureDiagnosticsLevel("warn", "debug")).toBe(true);
    expect(shouldCaptureDiagnosticsLevel("error", "debug")).toBe(true);
    expect(shouldCaptureDiagnosticsLevel("trace", "debug")).toBe(false);
  });
});

describe("Diagnostics contract: sanitization", () => {
  test("DIAG-SAN-001: redacts sensitive keyed values", () => {
    const event = createDiagnosticsEvent({
      level: "error",
      runtime: "background",
      domain: "translation",
      feature: "openai-translation-service",
      message: "translation_failed",
      data: {
        apiKey: "secret-key",
        prompt: "very sensitive prompt",
        text: "caption text should not leak",
        harmless: "keep me",
      },
    });

    expect(event.data).toEqual({
      apiKey: "[redacted]",
      prompt: "[redacted]",
      text: "[redacted]",
      harmless: "keep me",
    });
  });

  test("DIAG-SAN-002: snapshots sanitize URLs and long strings", () => {
    const snapshot = createDiagnosticsSnapshot("content-runtime", "content", {
      sourceUrl: "https://meet.google.com/abc-defg-hij?authuser=1",
      note: "x".repeat(400),
    });

    expect(snapshot.data.sourceUrl).toBe("https://meet.google.com/abc-defg-hij");
    expect(String(snapshot.data.note)).toContain("...");
  });
});

describe("Diagnostics contract: filtering", () => {
  test("DIAG-FLT-001: filters by level and provider", () => {
    const events = [
      createDiagnosticsEvent({
        level: "debug",
        runtime: "content",
        domain: "provider",
        feature: "teams-caption-pipeline",
        message: "observer_tick",
        provider: "microsoft-teams",
      }),
      createDiagnosticsEvent({
        level: "error",
        runtime: "background",
        domain: "translation",
        feature: "openai-translation-service",
        message: "translation_failed",
        provider: "google-meet",
      }),
    ];

    const filtered = filterDiagnosticsEvents(events, {
      minLevel: "warn",
      provider: "google-meet",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.message).toBe("translation_failed");
  });
});