type AppLoadingScreenProps = {
  title: string;
  description?: string;
  variant?: "page" | "panel" | "overlay";
};

export function AppLoadingScreen({
  title,
  description,
  variant = "page",
}: AppLoadingScreenProps) {
  const wrapperClassName =
    variant === "overlay"
      ? "fixed inset-0 z-[220] flex items-center justify-center bg-[color:color-mix(in_srgb,var(--app-bg)_78%,transparent)] px-6 py-14 backdrop-blur-md"
      : `flex items-center justify-center px-6 py-14 ${
          variant === "page" ? "min-h-screen" : ""
        }`;
  const surfaceClassName =
    variant === "overlay"
      ? "w-full max-w-xl rounded-[2rem] border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface)_94%,transparent)] p-5 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl"
      : "w-full rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl";

  return (
    <div
      className={wrapperClassName}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={surfaceClassName}>
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)]/70" />
            <span className="absolute inset-1 animate-spin rounded-full border border-[var(--app-accent-border)]/55 border-t-[var(--app-accent)]" />
            <span className="absolute h-11 w-11 rounded-full bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--app-accent)_24%,transparent),transparent_62%),var(--app-surface)] shadow-[0_10px_28px_var(--app-shadow)]" />
            <span className="absolute flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--app-accent)] [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--app-accent)] [animation-delay:180ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--app-accent)] [animation-delay:360ms]" />
            </span>
          </div>
          <p className="mt-6 text-xl font-semibold text-[var(--app-text)]">
            {title}
          </p>
          {description ? (
            <p className="mt-3 text-sm leading-relaxed text-[var(--app-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
