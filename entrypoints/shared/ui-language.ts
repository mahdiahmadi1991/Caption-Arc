import type { SupportedUiLocale, UiLanguageSetting } from "./i18n/types";

export const DEFAULT_UI_LOCALE: SupportedUiLocale = "en";
export const DEFAULT_UI_LANGUAGE_SETTING: UiLanguageSetting = "system";

export const SUPPORTED_UI_LOCALES = [
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
] as const;

export function isSupportedUiLocale(value: unknown): value is SupportedUiLocale {
  return (
    typeof value === "string" &&
    SUPPORTED_UI_LOCALES.includes(value as SupportedUiLocale)
  );
}

export function normalizeUiLanguageSetting(value: unknown): UiLanguageSetting {
  return value === "system" || isSupportedUiLocale(value)
    ? value
    : DEFAULT_UI_LANGUAGE_SETTING;
}