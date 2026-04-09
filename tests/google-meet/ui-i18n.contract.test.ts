import { beforeAll, describe, expect, test } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import {
  loadUiMessageCatalog,
  SUPPORTED_UI_LOCALES,
  UI_MESSAGE_CATALOGS,
  createTranslator,
  getLocaleDirection,
  normalizeUiLanguageSetting,
  resolveUiLocale,
} from "../../entrypoints/shared/i18n";

const USER_FACING_NAMESPACE_PREFIXES = [
  "common.",
  "options.",
  "history.",
  "content.",
  "popup.",
] as const;

const ALLOWED_EXACT_ENGLISH_VALUES = new Set([
  "B",
  "KB",
  "MB",
  "(optional)",
  "Attention",
  "Chrome",
  "Console",
  "CSV",
  "Direct",
  "English",
  "GPT-4.1",
  "GPT-4.1 Mini",
  "GPT-5 Mini",
  "GPT-5 Nano",
  "GPT-5.1",
  "GPT-5.2",
  "Google Drive",
  "Google Meet",
  "JSON",
  "Markdown",
  "Message",
  "CaptionArc",
  "Microsoft Teams",
  "Microsoft Teams Web",
  "OpenAI (GPT)",
  "OneDrive",
  "OpenAI",
  "Persian",
  "Teams",
  "Visible",
  "Zoom Web App",
  "{count} live",
  "{count} total",
  "{fallback} Details: {details}",
  "{count}h",
  "{count}m",
  "{count}s",
  "{hours}h {minutes}m",
  "{minutes} min",
  "{minutes}m {seconds}s",
  "v{version}",
  "Zoom",
  "© {year} CaptionArc",
]);

function collectMessageKeys(
  node: Record<string, unknown>,
  prefix = ""
): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      return [nextKey];
    }

    if (value && typeof value === "object") {
      return collectMessageKeys(value as Record<string, unknown>, nextKey);
    }

    return [];
  });
}

function collectMessageEntries(
  node: Record<string, unknown>,
  prefix = ""
): Array<[key: string, value: string]> {
  return Object.entries(node).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      return [[nextKey, value]];
    }

    if (value && typeof value === "object") {
      return collectMessageEntries(value as Record<string, unknown>, nextKey);
    }

    return [];
  });
}

function isSuspiciousExactEnglishMatch(key: string, value: string): boolean {
  if (key.startsWith("common.uiLanguage.locales.")) {
    return false;
  }

  if (
    !USER_FACING_NAMESPACE_PREFIXES.some((prefix) => key.startsWith(prefix))
  ) {
    return false;
  }

  if (!/[A-Za-z]/.test(value)) {
    return false;
  }

  if (ALLOWED_EXACT_ENGLISH_VALUES.has(value)) {
    return false;
  }

  const normalizedValue = value.trim();
  const wordCount = normalizedValue.split(/\s+/).filter(Boolean).length;

  // Single-word ASCII matches create too many false positives for
  // cognates and short UI labels across European locales.
  if (wordCount === 1 && /^[A-Za-z][A-Za-z()/-]*$/.test(normalizedValue)) {
    return false;
  }

  return true;
}

const NON_ENGLISH_UI_LOCALES = SUPPORTED_UI_LOCALES.filter(
  (locale) => locale !== "en"
);

function getCatalog(locale: (typeof SUPPORTED_UI_LOCALES)[number]) {
  const catalog = UI_MESSAGE_CATALOGS[locale];
  expect(catalog, `catalog for ${locale}`).toBeDefined();
  return catalog!;
}

describe("UI i18n contract", () => {
  beforeAll(async () => {
    await Promise.all(
      SUPPORTED_UI_LOCALES.map((locale) => loadUiMessageCatalog(locale))
    );
  });

  test("UI-I18N-001: default settings keep uiLanguage in system mode", () => {
    expect(createDefaultSettings().uiLanguage).toBe("system");
  });

  test("UI-I18N-002: locale resolution normalizes browser variants and invalid values", () => {
    expect(normalizeUiLanguageSetting("en")).toBe("en");
    expect(normalizeUiLanguageSetting("fa")).toBe("fa");
    expect(normalizeUiLanguageSetting("de")).toBe("de");
    expect(normalizeUiLanguageSetting("invalid-locale")).toBe("system");

    expect(resolveUiLocale("system", "en-US")).toBe("en");
    expect(resolveUiLocale("system", "en-GB")).toBe("en");
    expect(resolveUiLocale("system", "fa-IR")).toBe("fa");
    expect(resolveUiLocale("system", "de-DE")).toBe("de");
    expect(resolveUiLocale("fa", "en-US")).toBe("fa");

    expect(getLocaleDirection("en")).toBe("ltr");
    expect(getLocaleDirection("fa")).toBe("rtl");
    expect(getLocaleDirection("ar")).toBe("rtl");
    expect(getLocaleDirection("ja")).toBe("ltr");
  });

  test("UI-I18N-003: translators interpolate and fall back to English for every non-English locale", () => {
    for (const locale of NON_ENGLISH_UI_LOCALES) {
      const t = createTranslator(locale);

      expect(
        t("popup.rows.live.capturing.detail", {
          platform: "Google Meet",
        })
      ).toContain("Google Meet");
      expect(t("popup.footer.version", { version: "1.3.0" })).toContain(
        "1.3.0"
      );

      const liveCatalog = getCatalog(locale).popup.rows.live as unknown as Record<
        string,
        unknown
      >;
      const originalIdleLabel = liveCatalog.idle;

      delete liveCatalog.idle;

      try {
        expect(t("popup.rows.live.idle.label")).toBe(
          getCatalog("en").popup.rows.live.idle.label
        );
      } finally {
        liveCatalog.idle = originalIdleLabel;
      }
    }
  });

  test("UI-I18N-004: supported locale set matches the rollout contract", () => {
    expect(SUPPORTED_UI_LOCALES).toEqual([
      "en",
      "fa",
      "ar",
      "es",
      "fr",
      "de",
      "pt",
      "ru",
      "hi",
      "zh",
      "ja",
      "ko",
    ]);
    expect(Object.keys(UI_MESSAGE_CATALOGS).sort()).toEqual([
      ...SUPPORTED_UI_LOCALES,
    ].sort());
  });

  test("UI-I18N-005: every non-English catalog keeps key parity with English", () => {
    const englishKeys = collectMessageKeys(
      getCatalog("en") as unknown as Record<string, unknown>
    ).sort();

    for (const locale of NON_ENGLISH_UI_LOCALES) {
      const localizedKeys = collectMessageKeys(
        getCatalog(locale) as unknown as Record<string, unknown>
      ).sort();

      expect(localizedKeys, locale).toEqual(englishKeys);
    }
  });

  test("UI-I18N-006: every non-English locale ships a dedicated authored catalog", () => {
    for (const locale of NON_ENGLISH_UI_LOCALES) {
      expect(getCatalog(locale)).not.toBe(getCatalog("en"));
      expect(getCatalog(locale).common.quickAccess, locale).not.toBe(
        getCatalog("en").common.quickAccess
      );
    }
  });

  test("UI-I18N-007: every non-English locale localizes shipped high-signal UI chrome", () => {
    const localizedChromeKeys = [
      "common.quickAccess",
      "common.uiLanguage.system",
      "options.header.title",
      "options.sections.workspace.description",
      "history.page.title",
      "history.sessionList.removeStar",
      "content.empty.captureStartingTitle",
      "content.timeline.meetingChat",
      "content.translation.retryAction",
      "popup.header.openSettings",
      "popup.rows.summary.manual.badge",
    ] as const;

    for (const locale of NON_ENGLISH_UI_LOCALES) {
      const t = createTranslator(locale);
      const englishT = createTranslator("en");

      for (const key of localizedChromeKeys) {
        expect(t(key), `${locale}:${key}`).not.toBe(englishT(key));
      }
    }
  });

  test("UI-I18N-008: shipped non-English locales do not leave suspicious user-facing English in place", () => {
    const englishEntries = new Map(
      collectMessageEntries(
        getCatalog("en") as unknown as Record<string, unknown>
      )
    );

    for (const locale of NON_ENGLISH_UI_LOCALES) {
      const suspiciousKeys = collectMessageEntries(
        getCatalog(locale) as unknown as Record<string, unknown>
      )
        .filter(([key, value]) => englishEntries.get(key) === value)
        .filter((entry): entry is [string, string] =>
          isSuspiciousExactEnglishMatch(entry[0], entry[1])
        )
        .map(([key]) => key);

      expect(suspiciousKeys, locale).toEqual([]);
    }
  });
});
