import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const LOGGER_ONLY_RUNTIME_MODULES = [
  "entrypoints/background/assistant.ts",
  "entrypoints/background/cloud-sync/index.ts",
  "entrypoints/background/cloud-sync/providers/index.ts",
  "entrypoints/background/data-transfer.ts",
  "entrypoints/background/diagnostics.ts",
  "entrypoints/background/history.ts",
  "entrypoints/background/index.ts",
  "entrypoints/background/providers/openai.ts",
  "entrypoints/background/settings.ts",
  "entrypoints/background/translation.ts",
  "entrypoints/content/assistant-service.ts",
  "entrypoints/content/debug-state.ts",
  "entrypoints/content/event-ingestion.ts",
  "entrypoints/content/history-service.ts",
  "entrypoints/content/index.ts",
  "entrypoints/content/observer.ts",
  "entrypoints/content/overlay/interactions.ts",
  "entrypoints/content/overlay/settings.ts",
  "entrypoints/content/overlay/visibility.ts",
  "entrypoints/content/platform-runtime.ts",
  "entrypoints/content/providers/registry.ts",
];

function getDiagnosticsBoundaryModules(): Array<{ label: string; path: string }> {
  return LOGGER_ONLY_RUNTIME_MODULES.map((label) => ({
    label,
    path: resolve(process.cwd(), label),
  }));
}

describe("Diagnostics i18n boundary", () => {
  test("DIAG-I18N-001: logger-only runtime modules do not import shared i18n", () => {
    const diagnosticsModules = getDiagnosticsBoundaryModules();

    expect(diagnosticsModules.length).toBe(21);

    for (const module of diagnosticsModules) {
      expect(existsSync(module.path), module.label).toBe(true);

      const source = readFileSync(module.path, "utf8");

      expect(source, module.label).not.toMatch(
        /from\s+["'][^"']*\/i18n(?:\/[^"']*)?["']/
      );
      expect(source, module.label).not.toMatch(
        /\buseT\b|\bI18nProvider\b|\bcreateTranslator\b|\bgetUiRuntimeTranslator\b/
      );
    }
  });
});