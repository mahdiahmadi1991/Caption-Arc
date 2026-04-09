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
  type SupportedUiLocale,
} from "../shared/i18n";
import { AppLoadingScreen } from "../shared/loading-screen";
import "./styles.css";

const popupRootElement = document.getElementById("root");

if (!popupRootElement) {
  throw new Error("Popup root element was not found.");
}

function PopupRoot() {
  const [locale, setLocale] = useState<SupportedUiLocale>(() =>
    resolveUiLocale("system", navigator.language)
  );
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const applyLocale = async (nextLocale: SupportedUiLocale) => {
      await setUiRuntimeLocale(nextLocale);

      if (!mounted) {
        return;
      }

      applyLocaleAttributes(nextLocale, popupRootElement);
      startTransition(() => {
        setLocale(nextLocale);
        setLocaleReady(true);
      });
    };

    const loadLocale = async () => {
      const nextLocale = await readStoredUiLocale(navigator.language);

      await applyLocale(nextLocale);
    };

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (!isUiLocaleStorageChange(changes, areaName)) {
        return;
      }

      void loadLocale();
    };

    void applyLocale(locale);
    void loadLocale();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [locale]);

  return (
    <React.StrictMode>
      <I18nProvider locale={locale}>
        <div className="relative min-h-screen">
          <App />
          {!localeReady && (
            <AppLoadingScreen
              variant="overlay"
              title={createTranslator(locale)("common.actions.loading")}
            />
          )}
        </div>
      </I18nProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(popupRootElement).render(<PopupRoot />);
