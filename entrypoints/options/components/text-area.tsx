import { useId, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "../../shared/icons";
import { HelpPopover } from "../../shared/help-popover";
import { useT } from "../../shared/i18n";
import { getDynamicTextDirection } from "../../shared/text-direction";

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  helpMarkdown?: string;
};

export function TextArea({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  hint,
  optional,
  collapsible = false,
  defaultCollapsed = false,
  maxLength,
  showCharacterCount = false,
  helpMarkdown,
}: TextAreaProps) {
  const t = useT();
  const textAreaId = useId();
  const [collapsed, setCollapsed] = useState(
    collapsible ? defaultCollapsed : false
  );
  const preview = useMemo(() => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return t("common.noContentYet");
    }

    return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
  }, [t, value]);

  return (
    <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] backdrop-blur-xl sm:p-4">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div
          className={`flex items-center gap-2 text-sm font-medium text-[var(--app-text)] pointer-events-none ${
            disabled ? "opacity-60" : ""
          }`}
        >
          <label htmlFor={textAreaId} className="pointer-events-auto">
            <span>{label}</span>
          </label>
          {helpMarkdown ? (
            <HelpPopover label={label} markdown={helpMarkdown} disabled={disabled} />
          ) : null}
          {optional && (
            <span className="pointer-events-auto ms-2 font-normal text-[var(--app-text-faint)]">
              {t("common.optional")}
            </span>
          )}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 text-xs font-medium text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-bg-elevated)] hover:text-[var(--app-text)]"
          >
            <span>{collapsed ? t("common.actions.expand") : t("common.actions.collapse")}</span>
            {collapsed ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {collapsed ? (
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 text-sm text-[var(--app-text-muted)]">
          <div dir={getDynamicTextDirection(preview)}>{preview}</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)]">
          <textarea
            id={textAreaId}
            value={value}
            disabled={disabled}
            onChange={(e) =>
              onChange(
                maxLength
                  ? e.target.value.slice(0, maxLength)
                  : e.target.value
              )
            }
            placeholder={placeholder}
            rows={3}
            maxLength={maxLength}
            dir="auto"
            className={`mc-app-textarea block min-h-[104px] w-full resize-y overflow-x-hidden overflow-y-auto border-0 bg-transparent px-4 py-3 text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-faint)] ${
              disabled ? "cursor-default opacity-60" : ""
            }`}
          />
          {(hint || (maxLength && showCharacterCount)) && (
            <div className="flex items-center justify-between gap-3 border-t border-[var(--app-border)] px-4 py-2.5">
              <div className="min-w-0">
                {hint && (
                  <p className="text-xs text-[var(--app-text-muted)]">{hint}</p>
                )}
              </div>
              {maxLength && showCharacterCount && (
                <div className="shrink-0 text-[11px] font-medium tabular-nums text-[var(--app-text-faint)]">
                  {value.length}/{maxLength}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
