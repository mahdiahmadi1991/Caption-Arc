import type { ReactNode } from "react";
import privacyPolicyMarkdown from "../../docs/security/privacy-policy.md?raw";
import { LegalDocument } from "../shared/legal-document";
import { LegalPageLayout } from "../shared/legal-page-layout";
import { useExtensionPageSettings } from "../shared/use-extension-page-settings";
import { useT } from "../shared/i18n";

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

export default function App() {
  const t = useT();
  const { settings, saveSettings } = useExtensionPageSettings();
  const manifestVersion = chrome.runtime.getManifest().version;

  return (
    <LegalPageLayout
      eyebrow={t("common.legalPages.shared.eyebrow")}
      title={t("common.legalPages.privacyPolicy.title")}
      subtitle={t("common.legalPages.privacyPolicy.subtitle")}
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
      <div className="mx-auto max-w-4xl">
        <SurfacePanel className="overflow-hidden">
          <div className="border-b border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_58%,var(--app-surface))] px-5 py-4 sm:px-6">
            <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">
              {t("common.legalPages.privacyPolicy.sourceNote")}
            </p>
          </div>
          <div className="px-5 py-6 sm:px-6 sm:py-7">
            <LegalDocument markdown={privacyPolicyMarkdown} />
          </div>
        </SurfacePanel>
      </div>
    </LegalPageLayout>
  );
}
