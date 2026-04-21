import type { ReactNode } from "react";
import { AppLoadingScreen } from "./loading-screen";
import { BrandLockup } from "./brand";
import { LegalFooter } from "./extension-page-frame";
import { ThemeToggle } from "./theme-toggle";
import { useExtensionPageSettings } from "./use-extension-page-settings";
import { useResolvedTheme } from "./use-resolved-theme";
import { useT } from "./i18n";
import {
  getPrivacyPolicyPageUrl,
  getTermsOfServicePageUrl,
  hasAcceptedCurrentTerms,
  hasDeclinedCurrentTerms,
} from "./legal";

type TermsGateProps = {
  children: ReactNode;
  surface?: "options" | "meeting-history" | "popup";
};

async function openExtensionPageInTab(url: string): Promise<void> {
  if (chrome?.tabs?.create) {
    await chrome.tabs.create({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function TermsGate({
  children,
  surface = "options",
}: TermsGateProps) {
  const t = useT();
  const { settings, loading, saveSettings } = useExtensionPageSettings();
  const resolvedTheme = useResolvedTheme(settings.appearance, {
    deferDocumentApply: loading,
  });
  const manifestVersion = chrome.runtime.getManifest().version;
  const compact = surface === "popup";
  const declinedCurrentTerms = hasDeclinedCurrentTerms(settings.termsDecline);

  const handleOpenTerms = async () => {
    const targetUrl = getTermsOfServicePageUrl({
      mode: "accept",
      source: `${surface}-gate`,
      returnTo:
        surface === "popup"
          ? "close"
          : surface === "meeting-history"
            ? "meeting-history"
            : "options",
    });

    if (surface === "popup") {
      await openExtensionPageInTab(targetUrl);
      window.close();
      return;
    }

    window.location.href = targetUrl;
  };

  const handleOpenPrivacy = async () => {
    await openExtensionPageInTab(getPrivacyPolicyPageUrl());
  };

  if (loading) {
    return (
      <AppLoadingScreen
        variant="overlay"
        title={t("common.actions.loading")}
        description={t("common.firstRunTerms.body")}
      />
    );
  }

  if (hasAcceptedCurrentTerms(settings.termsAcceptance)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div
        className={[
          "mx-auto flex min-h-screen flex-col px-4",
          surface === "popup"
            ? "py-4"
            : "max-w-4xl py-5 sm:px-6 sm:py-7 xl:px-8 xl:py-8",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl sm:p-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--app-accent)]">
            {t("common.firstRunTerms.eyebrow")}
          </p>
          <BrandLockup
            title={t("common.firstRunTerms.title")}
            subtitle={t(
              declinedCurrentTerms
                ? "common.firstRunTerms.declinedBody"
                : "common.firstRunTerms.body"
            )}
            size={compact ? 48 : 56}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
          />

          <div className="mt-6 rounded-[1.7rem] border border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_52%,var(--app-surface))] px-4 py-4 sm:px-5">
            <p className="text-sm leading-relaxed text-[var(--app-text)]">
              {t(
                declinedCurrentTerms
                  ? "common.firstRunTerms.declinedPrompt"
                  : "common.firstRunTerms.reviewPrompt"
              )}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--app-text-muted)]">
              {t(
                declinedCurrentTerms
                  ? "common.firstRunTerms.declinedNote"
                  : "common.firstRunTerms.acceptanceNote"
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleOpenTerms();
                }}
                className="h-11 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-5 text-sm font-medium text-[var(--app-accent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--app-accent-soft)_78%,var(--app-surface))]"
              >
                {t("common.links.termsOfService")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleOpenPrivacy();
                }}
                className="h-11 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-5 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)]"
              >
                {t("common.links.privacyPolicy")}
              </button>
            </div>
          </div>
        </div>

        <LegalFooter
          className="mt-auto pt-4"
          version={manifestVersion}
          compact={compact}
          accessory={
            <ThemeToggle
              value={settings.appearance}
              onChange={(value) => {
                void saveSettings({ appearance: value });
              }}
              className={compact ? "scale-[0.86] shadow-none" : undefined}
              labels={{
                group: t("common.theme.group"),
                options: {
                  system: t("common.theme.system"),
                  light: t("common.theme.light"),
                  dark: t("common.theme.dark"),
                },
              }}
            />
          }
        />
      </div>
    </div>
  );
}
