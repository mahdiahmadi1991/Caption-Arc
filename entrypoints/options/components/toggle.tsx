import { SwitchControl } from "../../shared/switch-control";

type ToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  className?: string;
};

export function Toggle({
  enabled,
  onChange,
  label,
  description,
  className,
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
          <h3 className="font-medium text-[var(--app-text)]">{label}</h3>
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
