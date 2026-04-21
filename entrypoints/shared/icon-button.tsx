import type { ButtonHTMLAttributes, ReactNode } from "react";
import { SpinnerIcon } from "./icons";
import { Tooltip } from "./tooltip";

type Variant = "default" | "soft" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  icon: ReactNode;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  tooltipDisabled?: boolean;
};

const VARIANT_CLASSNAMES: Record<Variant, string> = {
  default:
    "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
  soft:
    "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]",
  accent:
    "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] hover:bg-[var(--app-surface-strong)]",
  danger:
    "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)] hover:bg-[var(--app-danger-hover)]",
};

const SIZE_CLASSNAMES: Record<Size, string> = {
  sm: "h-10 w-10",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function IconButton({
  icon,
  label,
  variant = "default",
  size = "md",
  loading = false,
  tooltipDisabled = false,
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip content={label} disabled={tooltipDisabled}>
      <button
        type={type}
        aria-label={label}
        aria-busy={loading}
        disabled={props.disabled || loading}
        className={`inline-flex items-center justify-center rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--app-accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-default disabled:opacity-60 ${SIZE_CLASSNAMES[size]} ${VARIANT_CLASSNAMES[variant]} ${className}`.trim()}
        {...props}
      >
        <span
          className={`h-4 w-4 [&>svg]:h-4 [&>svg]:w-4 ${loading ? "[&>svg]:animate-spin" : ""}`}
        >
          {loading ? <SpinnerIcon /> : icon}
        </span>
      </button>
    </Tooltip>
  );
}
