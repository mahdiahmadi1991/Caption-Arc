import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { createTranslator } from "./catalog";
import { getLocaleDirection } from "./locale";
import type {
  LocaleDirection,
  SupportedUiLocale,
  UiTranslator,
} from "./types";

type I18nContextValue = {
  locale: SupportedUiLocale;
  direction: LocaleDirection;
  t: UiTranslator;
};

type I18nProviderProps = {
  locale: SupportedUiLocale;
  children: ReactNode;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: I18nProviderProps) {
  const direction = useMemo(() => getLocaleDirection(locale), [locale]);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const value = useMemo(
    () => ({ locale, direction, t }),
    [direction, locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider.");
  }

  return context;
}

export function useT(): UiTranslator {
  return useI18n().t;
}