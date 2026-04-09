import { Tooltip } from "./tooltip";

type SwitchControlProps = {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  ariaLabel: string;
  title?: string;
  className?: string;
};

export function SwitchControl({
  enabled,
  onToggle,
  disabled = false,
  ariaLabel,
  title,
  className = "",
}: SwitchControlProps) {
  const isInteractive = !disabled;

  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      disabled={!isInteractive}
      onClick={onToggle}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--app-accent)_26%,transparent)]",
        enabled && !disabled
          ? "border-[var(--app-accent-border)] bg-[var(--app-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          : "border-[color:color-mix(in_srgb,var(--app-text)_10%,var(--app-border))] bg-[color:color-mix(in_srgb,var(--app-surface-soft)_70%,var(--app-text)_6%)]",
        disabled ? "cursor-not-allowed opacity-55 saturate-0" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border transition-transform duration-200",
          enabled && !disabled ? "translate-x-5" : "translate-x-0",
          enabled && !disabled
            ? "border-white/65 bg-white shadow-[0_3px_10px_rgba(255,255,255,0.35)]"
            : "border-[color:color-mix(in_srgb,var(--app-text)_10%,transparent)] bg-[var(--app-surface)] shadow-[0_2px_8px_rgba(15,23,42,0.08)]",
        ].join(" ")}
      />
    </button>
  );

  if (!title) {
    return button;
  }

  return <Tooltip content={title}>{button}</Tooltip>;
}
