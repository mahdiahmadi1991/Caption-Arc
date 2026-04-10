import {
  createTranslator,
  isUiMessageCatalogLoaded,
  loadUiMessageCatalog,
} from "./catalog";
import {
  createDiagnosticsLogger,
  initializeDiagnosticsClient,
} from "../diagnostics-client";
import { isExtensionPageProtocol } from "../browser-capabilities";
import type { DiagnosticsRuntimeContext } from "../diagnostics";
import {
  DEFAULT_UI_LANGUAGE_SETTING,
  DEFAULT_UI_LOCALE,
  getLocaleDirection,
  resolveUiLocale,
} from "./locale";
import type {
  LocaleDirection,
  SupportedUiLocale,
  UiTranslator,
} from "./types";

type LocaleListener = (locale: SupportedUiLocale) => void;

const SETTINGS_STORAGE_KEYS = new Set(["settings", "settingsState"]);

void initializeDiagnosticsClient();

let currentLocale: SupportedUiLocale = DEFAULT_UI_LOCALE;
let currentTranslator: UiTranslator = createTranslator(DEFAULT_UI_LOCALE);
let localeLoadRequestId = 0;
const localeListeners = new Set<LocaleListener>();

function inferDiagnosticsRuntimeContext():
  | DiagnosticsRuntimeContext
  | null {
  if (typeof location === "undefined") {
    return null;
  }

  if (isExtensionPageProtocol(location.protocol)) {
    if (location.pathname.endsWith("/options.html")) {
      return "options";
    }

    if (location.pathname.endsWith("/popup.html")) {
      return "popup";
    }

    if (location.pathname.endsWith("/meeting-history.html")) {
      return "meeting-history";
    }

    if (location.pathname.endsWith("/privacy-policy.html")) {
      return "privacy-policy";
    }

    if (location.pathname.endsWith("/terms-of-service.html")) {
      return "terms-of-service";
    }
  }

  if (location.protocol === "http:" || location.protocol === "https:") {
    return "content";
  }

  return null;
}

const i18nDiagnosticsContext = inferDiagnosticsRuntimeContext();
const i18nDiagnostics = i18nDiagnosticsContext
  ? createDiagnosticsLogger({
      runtime: i18nDiagnosticsContext,
      domain: "runtime",
      feature: "ui-i18n",
    })
  : null;

function emitI18nDiagnostics(
  level: "trace" | "debug" | "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
): void {
  if (!i18nDiagnostics) {
    return;
  }

  void i18nDiagnostics[level](message, data);
}

function notifyLocaleListeners(locale: SupportedUiLocale): void {
  for (const listener of localeListeners) {
    listener(locale);
  }

  emitI18nDiagnostics("trace", "ui_locale_listeners_notified", {
    locale,
    listenerCount: localeListeners.size,
  });
}

export async function setUiRuntimeLocale(
  locale: SupportedUiLocale
): Promise<void> {
  const nextRequestId = ++localeLoadRequestId;
  const catalogLoadedBeforeRequest = isUiMessageCatalogLoaded(locale);

  emitI18nDiagnostics("debug", "ui_locale_set_requested", {
    locale,
    requestId: nextRequestId,
    catalogLoadedBeforeRequest,
    previousLocale: currentLocale,
  });

  if (!catalogLoadedBeforeRequest) {
    emitI18nDiagnostics("trace", "ui_locale_catalog_load_started", {
      locale,
      requestId: nextRequestId,
    });
  }

  try {
    if (!catalogLoadedBeforeRequest) {
      await loadUiMessageCatalog(locale);
      emitI18nDiagnostics("trace", "ui_locale_catalog_load_completed", {
        locale,
        requestId: nextRequestId,
      });
    }
  } catch (error) {
    emitI18nDiagnostics("error", "ui_locale_catalog_load_failed", {
      locale,
      requestId: nextRequestId,
      error:
        error instanceof Error ? error.message : String(error ?? "unknown error"),
    });
    throw error;
  }

  if (nextRequestId !== localeLoadRequestId) {
    emitI18nDiagnostics("warn", "ui_locale_set_superseded", {
      locale,
      requestId: nextRequestId,
      activeRequestId: localeLoadRequestId,
    });
    return;
  }

  const localeChanged = currentLocale !== locale;
  currentLocale = locale;
  currentTranslator = createTranslator(locale);

  if (localeChanged || nextRequestId === 1) {
    notifyLocaleListeners(locale);
  }

  emitI18nDiagnostics("info", "ui_locale_set_completed", {
    locale,
    requestId: nextRequestId,
    localeChanged,
    direction: getLocaleDirection(locale),
    listenerCount: localeListeners.size,
  });
}

export function getUiRuntimeLocale(): SupportedUiLocale {
  return currentLocale;
}

export function getUiRuntimeDirection(): LocaleDirection {
  return getLocaleDirection(currentLocale);
}

export function getUiRuntimeTranslator(): UiTranslator {
  return currentTranslator;
}

export function subscribeUiRuntimeLocale(
  listener: LocaleListener
): () => void {
  localeListeners.add(listener);

  return () => {
    localeListeners.delete(listener);
  };
}

export function applyLocaleAttributes(
  locale: SupportedUiLocale,
  rootElement?: HTMLElement | null
): void {
  const direction = getLocaleDirection(locale);

  if (rootElement) {
    rootElement.lang = locale;
    rootElement.dir = direction;
  }

  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = direction;

  if (document.body) {
    document.body.lang = locale;
    document.body.dir = direction;
  }

  emitI18nDiagnostics("trace", "ui_locale_attributes_applied", {
    locale,
    direction,
    hasRootElement: Boolean(rootElement),
    hasBody: Boolean(document.body),
  });
}

export async function readStoredUiLocale(
  browserLocale?: string | null
): Promise<SupportedUiLocale> {
  emitI18nDiagnostics("debug", "ui_locale_settings_lookup_started", {
    browserLocale: browserLocale ?? null,
  });

  try {
    const response = await chrome.runtime.sendMessage({
      action: "getSettings",
    });
    const rawUiLanguage = response?.settings?.uiLanguage;
    const resolvedLocale = resolveUiLocale(rawUiLanguage, browserLocale);

    if (
      rawUiLanguage !== undefined &&
      rawUiLanguage !== null &&
      rawUiLanguage !== DEFAULT_UI_LANGUAGE_SETTING &&
      resolvedLocale === DEFAULT_UI_LOCALE &&
      rawUiLanguage !== DEFAULT_UI_LOCALE
    ) {
      emitI18nDiagnostics("warn", "ui_locale_invalid_setting_fallback", {
        browserLocale: browserLocale ?? null,
        rawUiLanguage: String(rawUiLanguage),
        resolvedLocale,
      });
    }

    emitI18nDiagnostics("info", "ui_locale_settings_lookup_completed", {
      browserLocale: browserLocale ?? null,
      rawUiLanguage:
        rawUiLanguage === undefined || rawUiLanguage === null
          ? null
          : String(rawUiLanguage),
      resolvedLocale,
    });

    return resolvedLocale;
  } catch (error) {
    const fallbackLocale = resolveUiLocale(
      DEFAULT_UI_LANGUAGE_SETTING,
      browserLocale
    );

    emitI18nDiagnostics("warn", "ui_locale_settings_lookup_failed", {
      browserLocale: browserLocale ?? null,
      fallbackLocale,
      error:
        error instanceof Error ? error.message : String(error ?? "unknown error"),
    });

    return fallbackLocale;
  }
}

export function isUiLocaleStorageChange(
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
): boolean {
  const relevantChangeDetected =
    areaName === "local" &&
    Object.keys(changes).some((key) => SETTINGS_STORAGE_KEYS.has(key));

  emitI18nDiagnostics("trace", "ui_locale_storage_change_evaluated", {
    areaName,
    changedKeys: Object.keys(changes),
    relevantChangeDetected,
  });

  return relevantChangeDetected;
}
