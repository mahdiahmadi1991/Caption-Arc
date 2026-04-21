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
import { TermsGate } from "../shared/terms-gate";
import "./styles.css";

const meetingHistoryRootElement = document.getElementById("root");

if (!meetingHistoryRootElement) {
  throw new Error("Meeting history root element was not found.");
}

function MeetingHistoryRoot() {
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

      applyLocaleAttributes(nextLocale, meetingHistoryRootElement);

      if (typeof document !== "undefined") {
        const t = createTranslator(nextLocale);
        document.title = `${t("history.page.title")} - ${t("common.appName")}`;
      }

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
          <TermsGate surface="meeting-history">
            <App />
          </TermsGate>
          {!localeReady && (
            <AppLoadingScreen
              variant="overlay"
              title={createTranslator(locale)("history.page.loadingTitle")}
              description={createTranslator(locale)(
                "history.page.loadingDescription"
              )}
            />
          )}
        </div>
      </I18nProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(meetingHistoryRootElement).render(<MeetingHistoryRoot />);
