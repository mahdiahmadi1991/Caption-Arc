import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import termsOfServiceMarkdown from "../../docs/security/terms-of-service.md?raw";
import { LegalDocument } from "../shared/legal-document";
import { LegalPageLayout } from "../shared/legal-page-layout";
import { useExtensionPageSettings } from "../shared/use-extension-page-settings";
import { useT } from "../shared/i18n";
import {
  createCurrentTermsAcceptance,
  createCurrentTermsDecline,
  getOptionsPageUrl,
  getTermsReturnTargetUrl,
  hasAcceptedCurrentTerms,
  hasDeclinedCurrentTerms,
  normalizeTermsReturnTarget,
} from "../shared/legal";

function SurfacePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl ${className}`.trim()}
    >
      {children}
    </div>
  );
}

function getAcceptMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("mode") === "accept";
}

function getTermsReturnTarget() {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeTermsReturnTarget(
    new URLSearchParams(window.location.search).get("returnTo")
  );
}

function getTermsSource(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const source = new URLSearchParams(window.location.search).get("source");
  return source?.trim() || null;
}

async function resolveCurrentTabId(): Promise<number | null> {
  try {
    const currentTab = await chrome.tabs.getCurrent();
    if (typeof currentTab?.id === "number") {
      return currentTab.id;
    }
  } catch {
    // Fall through to query-based lookup.
  }

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const currentUrl = window.location.href;
    const matchingTab = tabs.find((tab) => tab.url === currentUrl);
    if (typeof matchingTab?.id === "number") {
      return matchingTab.id;
    }

    const extensionPrefix = `${window.location.origin}/`;
    const activeExtensionTab = tabs.find(
      (tab) => tab.active && typeof tab.url === "string" && tab.url.startsWith(extensionPrefix)
    );
    if (typeof activeExtensionTab?.id === "number") {
      return activeExtensionTab.id;
    }
  } catch {
    // Fall through to final fallback.
  }

  return null;
}

async function closeCurrentPage(fallbackUrl?: string): Promise<void> {
  const tabId = await resolveCurrentTabId();
  const fallbackTimer =
    fallbackUrl && typeof window !== "undefined"
      ? window.setTimeout(() => {
          window.location.replace(fallbackUrl);
        }, 250)
      : null;

  try {
    const response = await chrome.runtime.sendMessage({
      action: "closeExtensionPageTab",
      tabId,
      currentUrl: window.location.href,
    });

    if (response?.success) {
      return;
    }
  } catch {
    // Fall back to direct tab/window closing below.
  }

  try {
    if (tabId !== null) {
      await chrome.tabs.remove(tabId);
      return;
    }
  } catch {
    // Fall back below.
  }

  if (fallbackUrl) {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
    }
    window.location.replace(fallbackUrl);
    return;
  }

  if (fallbackTimer !== null) {
    window.clearTimeout(fallbackTimer);
  }
  window.close();
}

export default function App() {
  const t = useT();
  const { settings, saveSettings } = useExtensionPageSettings();
  const manifestVersion = chrome.runtime.getManifest().version;
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const acceptMode = useMemo(() => getAcceptMode(), []);
  const returnTarget = useMemo(() => getTermsReturnTarget(), []);
  const source = useMemo(() => getTermsSource(), []);
  const alreadyAccepted = hasAcceptedCurrentTerms(settings.termsAcceptance);
  const alreadyDeclined = hasDeclinedCurrentTerms(settings.termsDecline);
  const resolvedReturnTarget =
    returnTarget ||
    (source === "meeting-history-gate"
      ? "meeting-history"
      : source === "popup-gate" || source === "install"
        ? "close"
        : "options");
  const acceptReturnTarget =
    resolvedReturnTarget === "close" ? "options" : resolvedReturnTarget;

  useEffect(() => {
    if (!acceptMode) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const updateScrollState = () => {
      const remaining =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setHasScrolledToEnd(remaining <= 12);
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [acceptMode]);

  const completeTermsFlow = async (
    target = resolvedReturnTarget
  ) => {
    const returnUrl = getTermsReturnTargetUrl(target);

    if (returnUrl) {
      window.location.replace(returnUrl);
      return;
    }

    await closeCurrentPage(getOptionsPageUrl());
  };

  const saveTermsDecision = async (payload: {
    termsAcceptance: typeof settings.termsAcceptance;
    termsDecline: typeof settings.termsDecline;
  }) => {
    if (resolvedReturnTarget === "close") {
      return chrome.runtime.sendMessage({
        action: "saveSettings",
        settings: payload,
      });
    }

    return saveSettings(payload);
  };

  const handleAccept = async () => {
    setBusy(true);
    try {
      if (!alreadyAccepted) {
        const response = await saveTermsDecision({
          termsAcceptance: createCurrentTermsAcceptance(),
          termsDecline: null,
        });

        if (!response?.success) {
          return;
        }
      }
      await completeTermsFlow(acceptReturnTarget);
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      if (resolvedReturnTarget === "close") {
        const response = await chrome.runtime.sendMessage({
          action: "saveTermsDeclineAndClosePage",
          termsDecline: createCurrentTermsDecline(),
          tabId: await resolveCurrentTabId(),
          currentUrl: window.location.href,
        });

        if (!response?.success) {
          return;
        }

        return;
      }

      const response = await saveTermsDecision({
        termsAcceptance: null,
        termsDecline: createCurrentTermsDecline(),
      });

      if (!response?.success) {
        return;
      }

      await completeTermsFlow();
    } finally {
      setBusy(false);
    }
  };

  return (
    <LegalPageLayout
      eyebrow={t(
        acceptMode
          ? "common.legalPages.termsOfService.acceptEyebrow"
          : "common.legalPages.shared.eyebrow"
      )}
      title={t("common.legalPages.termsOfService.title")}
      subtitle={t(
        acceptMode
          ? "common.legalPages.termsOfService.acceptSubtitle"
          : "common.legalPages.termsOfService.subtitle"
      )}
      version={manifestVersion}
      appearance={settings.appearance}
      onAppearanceChange={(value) => {
        void saveSettings({ appearance: value });
      }}
      themeToggleLabels={{
        group: t("common.theme.group"),
        options: {
          system: t("common.theme.system"),
          light: t("common.theme.light"),
          dark: t("common.theme.dark"),
        },
      }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {acceptMode ? (
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_56%,var(--app-surface))] px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--app-text)]">
                    {alreadyAccepted
                      ? t("common.legalPages.termsOfService.alreadyAcceptedTitle")
                      : alreadyDeclined
                        ? t("common.legalPages.termsOfService.declinedTitle")
                        : t("common.legalPages.termsOfService.acceptPrompt")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                    {alreadyAccepted
                      ? t("common.legalPages.termsOfService.alreadyAcceptedBody")
                      : alreadyDeclined
                        ? t("common.legalPages.termsOfService.declinedBody")
                      : hasScrolledToEnd
                        ? t("common.legalPages.termsOfService.scrollReady")
                        : t("common.legalPages.termsOfService.scrollRequired")}
                  </p>
                </div>
                <span className="inline-flex self-start rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                  {t("common.legalPages.termsOfService.version", {
                    version: manifestVersion,
                  })}
                </span>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <div
                ref={scrollContainerRef}
                className="mc-app-scrollbar max-h-[52vh] overflow-y-auto rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 py-5 sm:px-6"
              >
                <LegalDocument markdown={termsOfServiceMarkdown} />
              </div>

              <div className="mt-5">
                <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">
                  {t("common.legalPages.termsOfService.declineNote")}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleDecline();
                    }}
                    disabled={busy}
                    className="h-11 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)] disabled:cursor-default disabled:opacity-60"
                  >
                    {t("common.legalPages.termsOfService.decline")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleAccept();
                    }}
                    disabled={busy || (!alreadyAccepted && !hasScrolledToEnd)}
                    className="h-11 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-5 text-sm font-medium text-[var(--app-accent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--app-accent-soft)_78%,var(--app-surface))] disabled:cursor-default disabled:opacity-60"
                  >
                    {busy
                      ? t("common.actions.working")
                      : alreadyAccepted
                        ? acceptReturnTarget !== "close"
                          ? t("common.actions.continue")
                          : t("common.actions.close")
                        : t("common.legalPages.termsOfService.accept")}
                  </button>
                </div>
              </div>
            </div>
          </SurfacePanel>
        ) : (
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_58%,var(--app-surface))] px-5 py-4 sm:px-6">
              <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">
                {t("common.legalPages.termsOfService.sourceNote")}
              </p>
            </div>
            <div className="px-5 py-6 sm:px-6 sm:py-7">
              <LegalDocument markdown={termsOfServiceMarkdown} />
            </div>
          </SurfacePanel>
        )}
      </div>
    </LegalPageLayout>
  );
}
