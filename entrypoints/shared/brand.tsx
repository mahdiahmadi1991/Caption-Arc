type BrandTheme = "light" | "dark";

type BrandMarkProps = {
  size?: number;
  className?: string;
  theme?: BrandTheme;
};

type BrandLockupProps = {
  title: string;
  subtitle?: string;
  size?: number;
  className?: string;
  theme?: BrandTheme;
};

const BRAND_MARK_SRC: Record<BrandTheme, string> = {
  light: "/logo-mark-light.svg",
  dark: "/logo-mark-dark.svg",
};

export function BrandMark({
  size = 44,
  className = "",
  theme = "light",
}: BrandMarkProps) {
  return (
    <img
      src={BRAND_MARK_SRC[theme]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={["block shrink-0", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
    />
  );
}

export function BrandLockup({
  title,
  subtitle,
  size = 48,
  className = "",
  theme = "light",
}: BrandLockupProps) {
  return (
    <div className={["flex items-start gap-3", className].filter(Boolean).join(" ")}>
      <BrandMark
        size={size}
        theme={theme}
        className=""
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
