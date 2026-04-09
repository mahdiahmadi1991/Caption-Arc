import type { ReactNode } from "react";
import { DropdownSelect, type DropdownOption } from "../../shared/dropdown-select";
import { IconButton } from "../../shared/icon-button";

type ActionCardProps = {
  title: string;
  subtitle?: string;
  actionIcon: ReactNode;
  actionLabel: string;
  onAction: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  language: string;
  languageOptions: readonly DropdownOption[] | DropdownOption[];
  onLanguageChange: (value: string) => void;
  extraControl?: ReactNode;
  details?: ReactNode;
  className?: string;
};

export function ActionCard({
  title,
  subtitle,
  actionIcon,
  actionLabel,
  onAction,
  actionLoading = false,
  actionDisabled = false,
  language,
  languageOptions,
  onLanguageChange,
  extraControl,
  details,
  className = "",
}: ActionCardProps) {
  const interactionsDisabled = actionLoading || actionDisabled;

  return (
    <div
      className={`rounded-[2rem] border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] p-4 ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <IconButton
            onClick={onAction}
            icon={actionIcon}
            label={actionLabel}
            variant="accent"
            size="lg"
            loading={actionLoading}
            disabled={actionDisabled}
            className="shrink-0 border-[var(--app-accent-border)] bg-[var(--app-surface)] shadow-none"
          />

          <div className="min-w-0">
            <p className="text-lg font-semibold text-[var(--app-accent)]">
              {title}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 md:max-w-[420px]">
          <DropdownSelect
            value={language}
            onChange={onLanguageChange}
            options={languageOptions}
            disabled={interactionsDisabled}
            buttonClassName="rounded-full bg-[var(--app-surface)]"
            menuClassName="w-[min(15rem,calc(100vw-2rem))]"
          />
          {extraControl}
        </div>
      </div>

      {details && (
        <div className="mt-4 border-t border-[var(--app-accent-border)] pt-4">
          {details}
        </div>
      )}
    </div>
  );
}
