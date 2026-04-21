import type {
  LocaleDirection,
  SupportedUiLocale,
} from "./types";
import {
  DEFAULT_UI_LANGUAGE_SETTING,
  DEFAULT_UI_LOCALE,
  isSupportedUiLocale,
  normalizeUiLanguageSetting,
  SUPPORTED_UI_LOCALES,
} from "../ui-language";

export {
  DEFAULT_UI_LANGUAGE_SETTING,
  DEFAULT_UI_LOCALE,
  isSupportedUiLocale,
  normalizeUiLanguageSetting,
  SUPPORTED_UI_LOCALES,
};

function normalizeBrowserLocale(
  browserLocale: string | null | undefined
): SupportedUiLocale {
  if (typeof browserLocale !== "string") {
    return DEFAULT_UI_LOCALE;
  }

  const normalizedLocale = browserLocale.trim().replace(/_/g, "-").toLowerCase();
  const [baseLocale] = normalizedLocale.split("-");

  return isSupportedUiLocale(baseLocale) ? baseLocale : DEFAULT_UI_LOCALE;
}

export function resolveUiLocale(
  setting: unknown,
  browserLocale?: string | null
): SupportedUiLocale {
  const normalizedSetting = normalizeUiLanguageSetting(setting);

  if (
    normalizedSetting !== DEFAULT_UI_LANGUAGE_SETTING &&
    isSupportedUiLocale(normalizedSetting)
  ) {
    return normalizedSetting;
  }

  return normalizeBrowserLocale(browserLocale);
}

export function getLocaleDirection(
  locale: SupportedUiLocale
): LocaleDirection {
  return locale === "fa" || locale === "ar" ? "rtl" : "ltr";
}