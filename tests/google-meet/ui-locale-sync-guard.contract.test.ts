import { describe, expect, test } from "vitest";
import {
  CANONICAL_UI_LOCALE_CATALOG_PATH,
  UI_LOCALE_CATALOG_PATHS,
  evaluateUiLocaleCatalogSync,
} from "../../scripts/i18n/validate-locale-catalog-sync.mjs";

describe("UI locale sync guard contract", () => {
  test("I18N-SYNC-001: no locale-catalog diff means the sync guard is skipped", () => {
    expect(evaluateUiLocaleCatalogSync([])).toEqual({
      success: true,
      applies: false,
      reason: "no_locale_catalog_changes",
      changedCatalogs: [],
      missingCatalogs: [],
    });
  });

  test("I18N-SYNC-002: canonical English catalog changes require every shipped locale catalog to change too", () => {
    const result = evaluateUiLocaleCatalogSync([
      CANONICAL_UI_LOCALE_CATALOG_PATH,
      "entrypoints/shared/i18n/messages/fa.ts",
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("missing_shipped_locale_updates");
    expect(result.missingCatalogs).toEqual(
      UI_LOCALE_CATALOG_PATHS.filter(
        (file) =>
          ![
            CANONICAL_UI_LOCALE_CATALOG_PATH,
            "entrypoints/shared/i18n/messages/fa.ts",
          ].includes(file),
      ),
    );
  });

  test("I18N-SYNC-003: canonical English catalog changes pass only when every shipped locale catalog is touched", () => {
    const result = evaluateUiLocaleCatalogSync(UI_LOCALE_CATALOG_PATHS);

    expect(result).toEqual({
      success: true,
      applies: true,
      reason: "all_shipped_locale_catalogs_updated",
      changedCatalogs: UI_LOCALE_CATALOG_PATHS,
      missingCatalogs: [],
    });
  });

  test("I18N-SYNC-004: locale-only fixes are allowed when the canonical English catalog stays unchanged", () => {
    const result = evaluateUiLocaleCatalogSync([
      "entrypoints/shared/i18n/messages/es.ts",
    ]);

    expect(result).toEqual({
      success: true,
      applies: true,
      reason: "canonical_catalog_unchanged",
      changedCatalogs: ["entrypoints/shared/i18n/messages/es.ts"],
      missingCatalogs: [],
    });
  });
});
