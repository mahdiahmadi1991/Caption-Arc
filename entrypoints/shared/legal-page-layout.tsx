import type { ReactNode } from "react";
import { BrandLockup } from "./brand";
import {
  GitHubHeaderLink,
  LegalFooter,
} from "./extension-page-chrome";
import { ThemeToggle, type ThemeToggleLabels } from "./theme-toggle";
import type { ThemePreference } from "./theme";
import { useResolvedTheme } from "./use-resolved-theme";

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

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  version: string;
  appearance: ThemePreference;
  onAppearanceChange: (value: ThemePreference) => void;
  themeToggleLabels: ThemeToggleLabels;
  children: ReactNode;
};

export function LegalPageLayout({
  eyebrow,
  title,
  subtitle,
  version,
  appearance,
  onAppearanceChange,
  themeToggleLabels,
  children,
}: LegalPageLayoutProps) {
  const resolvedTheme = useResolvedTheme(appearance);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 sm:py-7 xl:px-8 xl:py-8">
        <SurfacePanel className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--app-accent)]">
                {eyebrow}
              </p>
              <BrandLockup
                title={title}
                subtitle={subtitle}
                size={56}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <ThemeToggle
                value={appearance}
                onChange={onAppearanceChange}
                labels={themeToggleLabels}
              />
              <GitHubHeaderLink compact />
            </div>
          </div>
        </SurfacePanel>

        <main className="flex-1 py-6 sm:py-7">{children}</main>

        <LegalFooter className="mt-auto" version={version} />
      </div>
    </div>
  );
}
