import React, { startTransition, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  applyLocaleAttributes,
  createTranslator,
  I18nProvider,
  isUiLocaleStorageChange,
  readStoredUiLocale,
  resolveUiLocale,
  setUiRuntimeLocale,
  UI_LOCALE_SWITCH_ABORT_EVENT,
  UI_LOCALE_SWITCH_START_EVENT,
  type SupportedUiLocale,
} from "../shared/i18n";
import { AppLoadingScreen } from "../shared/loading-screen";
import "./styles.css";

const optionsRootElement = document.getElementById("root");

if (!optionsRootElement) {
  throw new Error("Options root element was not found.");
}

function OptionsRoot() {
  const [locale, setLocale] = useState<SupportedUiLocale>(() =>
    resolveUiLocale("system", navigator.language)
  );
  const [localeReady, setLocaleReady] = useState(false);
  const [localeSwitching, setLocaleSwitching] = useState(false);

  useEffect(() => {
    let mounted = true;

    const applyLocale = async (
      nextLocale: SupportedUiLocale,
      transition: boolean
    ) => {
      if (transition) {
        setLocaleSwitching(true);
      }

      await setUiRuntimeLocale(nextLocale);

      if (!mounted) {
        return;
      }

      applyLocaleAttributes(nextLocale, optionsRootElement);

      if (typeof document !== "undefined") {
        document.title = createTranslator(nextLocale)("options.header.title");
      }

      startTransition(() => {
        setLocale(nextLocale);
        setLocaleReady(true);
        setLocaleSwitching(false);
      });
    };

    const loadLocale = async (transition: boolean) => {
      const nextLocale = await readStoredUiLocale(navigator.language);

      await applyLocale(nextLocale, transition && nextLocale !== locale);
    };

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (!isUiLocaleStorageChange(changes, areaName)) {
        return;
      }

      void loadLocale(true);
    };

    const handleLocaleSwitchStart = () => {
      setLocaleReady(false);
      setLocaleSwitching(true);
    };

    const handleLocaleSwitchAbort = () => {
      setLocaleReady(true);
      setLocaleSwitching(false);
    };

    void applyLocale(locale, false);
    void loadLocale(false);
    chrome.storage.onChanged.addListener(handleStorageChange);
    window.addEventListener(UI_LOCALE_SWITCH_START_EVENT, handleLocaleSwitchStart);
    window.addEventListener(UI_LOCALE_SWITCH_ABORT_EVENT, handleLocaleSwitchAbort);

    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
      window.removeEventListener(
        UI_LOCALE_SWITCH_START_EVENT,
        handleLocaleSwitchStart
      );
      window.removeEventListener(
        UI_LOCALE_SWITCH_ABORT_EVENT,
        handleLocaleSwitchAbort
      );
    };
  }, [locale]);

  return (
    <React.StrictMode>
      <I18nProvider locale={locale}>
        <div className="relative min-h-screen">
          <App />
          {(!localeReady || localeSwitching) && (
            <AppLoadingScreen
              variant="overlay"
              title={createTranslator(locale)("options.loading")}
              description={createTranslator(locale)("common.uiLanguage.description")}
            />
          )}
        </div>
      </I18nProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(optionsRootElement).render(<OptionsRoot />);
