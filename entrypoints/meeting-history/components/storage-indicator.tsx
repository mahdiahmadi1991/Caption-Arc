import { useT } from "../../shared/i18n";

interface StorageIndicatorProps {
  bytesUsed: number;
  quota: number;
}

const formatBytes = (
  bytes: number,
  t: ReturnType<typeof useT>
): string => {
  if (bytes < 1024) {
    return `${bytes} ${t("common.units.byte")}`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} ${t("common.units.kilobyte")}`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${t("common.units.megabyte")}`;
};

export function StorageIndicator({
  bytesUsed,
  quota,
}: StorageIndicatorProps) {
  const t = useT();
  const percentage = quota > 0 ? Math.min((bytesUsed / quota) * 100, 100) : 0;
  const tone =
    percentage >= 85
      ? {
          text: "text-[var(--app-danger)]",
          bar: "bg-[var(--app-danger)]",
          label: t("history.storageIndicator.highUsage"),
        }
      : percentage >= 70
        ? {
            text: "text-[var(--app-warning)]",
            bar: "bg-[var(--app-warning)]",
            label: t("history.storageIndicator.reviewSoon"),
          }
        : {
            text: "text-[var(--app-accent)]",
            bar: "bg-[var(--app-accent)]",
            label: t("history.storageIndicator.healthy"),
          };

  return (
    <div className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 shadow-[0_12px_28px_var(--app-shadow)] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--app-text)]">
            {t("history.storageIndicator.usage", {
              used: formatBytes(bytesUsed, t),
              quota: formatBytes(quota, t),
            })}
          </p>
          <p className={`text-xs font-medium ${tone.text}`}>{tone.label}</p>
        </div>
        <div className="w-28">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-soft)]">
            <div
              className={`h-full rounded-full transition-all ${tone.bar}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] text-[var(--app-text-faint)]">
            {percentage.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
