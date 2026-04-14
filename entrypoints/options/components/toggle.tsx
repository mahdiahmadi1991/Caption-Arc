import { SwitchControl } from "../../shared/switch-control";
import { HelpPopover } from "../../shared/help-popover";

type ToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  className?: string;
  helpMarkdown?: string;
};

export function Toggle({
  enabled,
  onChange,
  label,
  description,
  className,
  helpMarkdown,
}: ToggleProps) {
  return (
    <div
      className={[
        "rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] backdrop-blur-xl sm:p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="pointer-events-none flex items-center gap-2">
            <h3 className="pointer-events-auto font-medium text-[var(--app-text)]">
              {label}
            </h3>
            {helpMarkdown ? (
              <HelpPopover label={label} markdown={helpMarkdown} />
            ) : null}
          </div>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
              {description}
            </p>
          )}
        </div>
        <SwitchControl
          enabled={enabled}
          onToggle={() => onChange(!enabled)}
          ariaLabel={label}
        />
      </div>
    </div>
  );
}
