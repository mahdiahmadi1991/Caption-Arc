import { enMessages } from "./messages/en";
import type {
  InterpolationValues,
  SupportedUiLocale,
  UiMessageCatalog,
  UiMessageKey,
  UiTranslator,
} from "./types";

type LocaleCatalogLoader = () => Promise<UiMessageCatalog>;

export const UI_MESSAGE_CATALOGS: Partial<
  Record<SupportedUiLocale, UiMessageCatalog>
> = {
  en: enMessages,
};

const UI_MESSAGE_CATALOG_LOADERS: Record<
  Exclude<SupportedUiLocale, "en">,
  LocaleCatalogLoader
> = {
  fa: () => import("./messages/fa").then((module) => module.faMessages),
  ar: () => import("./messages/ar").then((module) => module.arMessages),
  es: () => import("./messages/es").then((module) => module.esMessages),
  fr: () => import("./messages/fr").then((module) => module.frMessages),
  de: () => import("./messages/de").then((module) => module.deMessages),
  pt: () => import("./messages/pt").then((module) => module.ptMessages),
  ru: () => import("./messages/ru").then((module) => module.ruMessages),
  hi: () => import("./messages/hi").then((module) => module.hiMessages),
  zh: () => import("./messages/zh").then((module) => module.zhMessages),
  ja: () => import("./messages/ja").then((module) => module.jaMessages),
  ko: () => import("./messages/ko").then((module) => module.koMessages),
};

const localeCatalogPromises = new Map<
  SupportedUiLocale,
  Promise<UiMessageCatalog>
>();

function lookupMessage(
  catalog: UiMessageCatalog | undefined,
  key: UiMessageKey
): string | undefined {
  let current: unknown = catalog;

  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolateMessage(
  template: string,
  params?: InterpolationValues
): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      return match;
    }

    const value = params[name];
    return value === null || value === undefined ? match : String(value);
  });
}

export function isUiMessageCatalogLoaded(
  locale: SupportedUiLocale
): boolean {
  return locale in UI_MESSAGE_CATALOGS;
}

export async function loadUiMessageCatalog(
  locale: SupportedUiLocale
): Promise<UiMessageCatalog> {
  const existing = UI_MESSAGE_CATALOGS[locale];
  if (existing) {
    return existing;
  }

  const pending = localeCatalogPromises.get(locale);
  if (pending) {
    return pending;
  }

  const loadPromise =
    locale === "en"
      ? Promise.resolve(enMessages)
      : UI_MESSAGE_CATALOG_LOADERS[locale]().then((catalog) => {
          UI_MESSAGE_CATALOGS[locale] = catalog;
          return catalog;
        });

  localeCatalogPromises.set(locale, loadPromise);
  return loadPromise;
}

export async function preloadUiMessageCatalogs(
  locales: readonly SupportedUiLocale[]
): Promise<void> {
  await Promise.all(locales.map((locale) => loadUiMessageCatalog(locale)));
}

export function createTranslator(locale: SupportedUiLocale): UiTranslator {
  return (key, params) => {
    const localizedMessage = lookupMessage(UI_MESSAGE_CATALOGS[locale], key);
    const fallbackMessage = lookupMessage(enMessages, key);
    const message = localizedMessage ?? fallbackMessage ?? key;

    return interpolateMessage(message, params);
  };
}
