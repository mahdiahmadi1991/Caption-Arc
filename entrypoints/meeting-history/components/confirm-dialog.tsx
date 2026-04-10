import { useEffect, type ReactNode } from "react";
import { IconButton } from "../../shared/icon-button";
import { useT } from "../../shared/i18n";
import { CloseIcon } from "../../shared/icons";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  tone?: "neutral" | "warning" | "danger";
  eyebrow?: string;
  dismissible?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
  tone = "neutral",
  eyebrow,
  dismissible = true,
}: ConfirmDialogProps) {
  const t = useT();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dismissible && event.key === "Escape" && !busy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, dismissible, onCancel, open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const confirmClassName =
    tone === "danger"
      ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)] hover:bg-[var(--app-danger-hover)]"
      : tone === "warning"
        ? "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)] hover:bg-[color:color-mix(in_srgb,var(--app-warning-soft)_72%,var(--app-surface))]"
      : "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] hover:bg-[var(--app-surface-strong)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:color-mix(in_srgb,var(--app-bg)_68%,transparent)] px-4">
      {dismissible ? (
        <button
          type="button"
          aria-label={t("history.confirmDialog.closeDialog")}
          onClick={busy ? undefined : onCancel}
          className="absolute inset-0"
        />
      ) : null}
      <div className="relative w-full max-w-md rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 shadow-[0_24px_60px_var(--app-shadow)]">
        {dismissible ? (
          <div className="absolute right-4 top-4">
            <IconButton
              onClick={onCancel}
              disabled={busy}
              icon={<CloseIcon />}
              label={t("history.confirmDialog.closeDialog")}
              size="sm"
            />
          </div>
        ) : null}
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-accent)]">
          {eyebrow || t("history.confirmDialog.confirmAction")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-[var(--app-text)]">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-[var(--app-text-muted)]">
          {description}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          {dismissible ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)] disabled:cursor-default disabled:opacity-60"
            >
              {t("common.actions.cancel")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-60 ${confirmClassName}`}
          >
            {busy ? t("common.actions.working") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
