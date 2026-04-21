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

const privacyPolicyRootElement = document.getElementById("root");

if (!privacyPolicyRootElement) {
  throw new Error("Privacy Policy root element was not found.");
}

function PrivacyPolicyRoot() {
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

      applyLocaleAttributes(nextLocale, privacyPolicyRootElement);

      if (typeof document !== "undefined") {
        const t = createTranslator(nextLocale);
        document.title = `${t("common.legalPages.privacyPolicy.title")} - ${t(
          "common.appName"
        )}`;
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
          <App />
          {!localeReady && (
            <AppLoadingScreen
              variant="overlay"
              title={createTranslator(locale)("common.legalPages.privacyPolicy.loadingTitle")}
              description={createTranslator(locale)(
                "common.legalPages.shared.loadingDescription"
              )}
            />
          )}
        </div>
      </I18nProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(privacyPolicyRootElement).render(<PrivacyPolicyRoot />);
