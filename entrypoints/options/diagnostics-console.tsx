import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useT } from "../shared/i18n";
import { IconButton } from "../shared/icon-button";
import {
  BeakerIcon,
  CloseIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
} from "../shared/icons";
import type {
  DiagnosticsConfig,
  DiagnosticsEvent,
  DiagnosticsSnapshot,
} from "../shared/diagnostics";
import {
  areAllDiagnosticsViewerLevelsSelected,
  describeDiagnosticsEvent,
  DIAGNOSTICS_VIEWER_EVENT_LIMIT,
  filterDiagnosticsViewerEvents,
  getDiagnosticsViewerDefaultLevelFilter,
  getDiagnosticsViewerCounts,
  getDiagnosticsViewerLevelOptions,
  getDiagnosticsViewerStatus,
  isDiagnosticsViewerNearLatest,
  isDiagnosticsViewerLevelSelected,
  selectAllDiagnosticsViewerLevels,
  serializeDiagnosticsViewerEvents,
  type DiagnosticsViewerLevelFilter,
  toggleDiagnosticsViewerLevel,
} from "./diagnostics-viewer";
import { useDiagnosticsConsole } from "./use-diagnostics-console";

type DiagnosticsBadgeTone = "neutral" | "accent" | "warning" | "danger";
const DIAGNOSTICS_DRAWER_TRANSITION_MS = 800;
const DIAGNOSTICS_DRAWER_HEIGHT = "min(76vh, 48rem)";

const BADGE_CLASSNAMES: Record<DiagnosticsBadgeTone, string> = {
  neutral:
    "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]",
  accent:
    "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]",
  warning:
    "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)]",
  danger:
    "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]",
};

const LEVEL_BADGE_TONES: Record<DiagnosticsEvent["level"], DiagnosticsBadgeTone> = {
  trace: "neutral",
  debug: "neutral",
  info: "accent",
  warn: "warning",
  error: "danger",
};

const LEVEL_ROW_CLASSNAMES: Record<DiagnosticsEvent["level"], string> = {
  error:
    "border-[var(--app-danger-border)] bg-[color:color-mix(in_srgb,var(--app-danger-soft)_26%,var(--app-surface))]",
  warn:
    "border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_24%,var(--app-surface))]",
  info:
    "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_24%,var(--app-surface))]",
  debug:
    "border-[var(--app-border-strong)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_12%,var(--app-surface))]",
  trace:
    "border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface)_92%,transparent)]",
};

function DiagnosticsBadge({
  label,
  tone,
}: {
  label: string;
  tone: DiagnosticsBadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${BADGE_CLASSNAMES[tone]}`}
    >
      {label}
    </span>
  );
}

function DiagnosticsActionButton({
  label,
  onClick,
  disabled = false,
  tone = "neutral",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: DiagnosticsBadgeTone;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-default disabled:opacity-60",
        BADGE_CLASSNAMES[tone],
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function formatDiagnosticsTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        month: "short",
        day: "numeric",
      });
}

function formatDiagnosticsRelativeCount(
  t: ReturnType<typeof useT>,
  count: number,
  singularKey: Parameters<ReturnType<typeof useT>>[0],
  pluralKey: Parameters<ReturnType<typeof useT>>[0]
): string {
  return t(count === 1 ? singularKey : pluralKey, { count });
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function DiagnosticsConsoleSummary({
  loadedCount,
  visibleCount,
  snapshotCount,
  lastUpdatedAt,
  resolvedSnapshot,
}: {
  loadedCount: number;
  visibleCount: number;
  snapshotCount: number;
  lastUpdatedAt: string | null;
  resolvedSnapshot: DiagnosticsSnapshot | null;
}) {
  const t = useT();

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
          {t("options.diagnostics.summary.loadedWindowTitle")}
        </p>
        <p className="mt-1 text-xs font-semibold text-[var(--app-text)] sm:text-sm">
          {formatDiagnosticsRelativeCount(
            t,
            loadedCount,
            "options.diagnostics.summary.eventOne",
            "options.diagnostics.summary.eventOther"
          )}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--app-text-muted)]">
          {t("options.diagnostics.summary.loadedWindowBody", {
            limit: DIAGNOSTICS_VIEWER_EVENT_LIMIT,
          })}
        </p>
      </div>
      <div className="rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
          {t("options.diagnostics.summary.visibleNowTitle")}
        </p>
        <p className="mt-1 text-xs font-semibold text-[var(--app-text)] sm:text-sm">
          {formatDiagnosticsRelativeCount(
            t,
            visibleCount,
            "options.diagnostics.summary.eventOne",
            "options.diagnostics.summary.eventOther"
          )}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--app-text-muted)]">
          {t("options.diagnostics.summary.visibleNowBody")}
        </p>
      </div>
      <div className="rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
          {t("options.diagnostics.summary.snapshotsTitle")}
        </p>
        <p className="mt-1 text-xs font-semibold text-[var(--app-text)] sm:text-sm">
          {formatDiagnosticsRelativeCount(
            t,
            snapshotCount,
            "options.diagnostics.summary.snapshotOne",
            "options.diagnostics.summary.snapshotOther"
          )}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--app-text-muted)]">
          {resolvedSnapshot
            ? `${resolvedSnapshot.runtime} · ${resolvedSnapshot.provider || t("options.diagnostics.summary.noProvider")}`
            : t("options.diagnostics.summary.noResolvedSnapshot")}
        </p>
      </div>
      <div className="rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
          {t("options.diagnostics.summary.lastSyncTitle")}
        </p>
        <p className="mt-1 text-xs font-semibold text-[var(--app-text)] sm:text-sm">
          {lastUpdatedAt
            ? formatDiagnosticsTimestamp(lastUpdatedAt)
            : t("options.diagnostics.summary.waiting")}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--app-text-muted)]">
          {t("options.diagnostics.summary.lastSyncBody")}
        </p>
      </div>
    </div>
  );
}

function DiagnosticsConsoleEventRow({
  event,
}: {
  event: DiagnosticsEvent;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const detailBlocks = [
    event.sessionId ? { label: t("options.diagnostics.row.session"), value: event.sessionId } : null,
    event.requestId ? { label: t("options.diagnostics.row.request"), value: event.requestId } : null,
    event.correlationId
      ? { label: t("options.diagnostics.row.correlation"), value: event.correlationId }
      : null,
    event.sender?.tabId !== undefined
      ? { label: t("options.diagnostics.row.tab"), value: String(event.sender.tabId) }
      : null,
    event.sender?.frameId !== undefined
      ? { label: t("options.diagnostics.row.frame"), value: String(event.sender.frameId) }
      : null,
    event.sender?.documentId
      ? { label: t("options.diagnostics.row.document"), value: event.sender.documentId }
      : null,
    event.sender?.origin ? { label: t("options.diagnostics.row.origin"), value: event.sender.origin } : null,
  ].filter(
    (entry): entry is { label: string; value: string } => Boolean(entry)
  );
  const hasStructuredDetails = Boolean(
    event.data || detailBlocks.length > 0 || event.sender?.url
  );
  const description = describeDiagnosticsEvent(event);

  const handleCopyRow = async () => {
    await copyTextToClipboard(serializeDiagnosticsViewerEvents([event]));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <article
      dir="ltr"
      className={`rounded-[1.15rem] border border-l-[3px] p-2.5 text-left shadow-[0_10px_24px_var(--app-shadow)] backdrop-blur-xl ${LEVEL_ROW_CLASSNAMES[event.level]}`}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <DiagnosticsBadge
              label={event.level.toUpperCase()}
              tone={LEVEL_BADGE_TONES[event.level]}
            />
            <span className="text-[11px] font-medium text-[var(--app-text-faint)]">
              {formatDiagnosticsTimestamp(event.timestamp)}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-1 text-sm font-semibold leading-5 text-[var(--app-text)]">
            {description.title}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[var(--app-text-muted)]">
            {description.summary}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--app-text-muted)]">
            <span className="rounded-full border border-[var(--app-border)] px-1.5 py-0.5">
              {event.runtime}
            </span>
            <span className="rounded-full border border-[var(--app-border)] px-1.5 py-0.5">
              {event.domain}
            </span>
            <span className="rounded-full border border-[var(--app-border)] px-1.5 py-0.5">
              {event.feature}
            </span>
            {event.provider && (
              <span className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-1.5 py-0.5 text-[var(--app-accent)]">
                {event.provider}
              </span>
            )}
            <span className="max-w-full truncate rounded-full border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface)_92%,transparent)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--app-text-faint)]">
              {description.rawMessage}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-start">
          <DiagnosticsActionButton
            label={
              copied
                ? t("options.diagnostics.row.copied")
                : t("options.diagnostics.row.copyRow")
            }
            onClick={() => {
              void handleCopyRow();
            }}
            tone={copied ? "accent" : "neutral"}
          />
          {hasStructuredDetails && (
            <DiagnosticsActionButton
              label={
                expanded
                  ? t("options.diagnostics.row.hideDetails")
                  : t("options.diagnostics.row.showDetails")
              }
              onClick={() => setExpanded((current) => !current)}
            />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-2.5 rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-2.5">
          {detailBlocks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {detailBlocks.map((entry) => (
                <div
                  key={`${event.id}-${entry.label}`}
                  className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-0.5 text-[10px] text-[var(--app-text-muted)]"
                >
                  <span className="font-medium text-[var(--app-text)]">{entry.label}:</span>{" "}
                  {entry.value}
                </div>
              ))}
            </div>
          )}

          {event.sender?.url && (
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
                {t("options.diagnostics.row.senderUrl")}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--app-text-muted)]">
                {event.sender.url}
              </p>
            </div>
          )}

          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
              {t("options.diagnostics.row.eventKey")}
            </p>
            <p className="mt-1 font-mono text-[11px] leading-5 text-[var(--app-text-muted)]">
              {description.rawMessage}
            </p>
          </div>

          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
              {t("options.diagnostics.row.description")}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--app-text-muted)]">
              {description.summary}
            </p>
          </div>

          {event.data && (
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
                {t("options.diagnostics.row.eventData")}
              </p>
              <pre className="mc-app-scrollbar mt-1 max-h-48 overflow-auto overscroll-y-contain rounded-[0.9rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 text-[10px] leading-5 text-[var(--app-text-muted)] [scrollbar-gutter:stable]">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function DiagnosticsConsoleLauncher({
  open,
  onToggle,
  statusLabel,
  statusTone,
  disabled,
  buttonRef,
}: {
  open: boolean;
  onToggle: () => void;
  statusLabel: string;
  statusTone: DiagnosticsBadgeTone;
  disabled: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const t = useT();

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-5 sm:right-5">
      <div className="rounded-[1.7rem] border border-[var(--app-border-strong)] bg-[color:color-mix(in_srgb,var(--app-surface)_82%,transparent)] p-2 shadow-[0_20px_48px_var(--app-shadow)] backdrop-blur-2xl">
        <button
          ref={buttonRef}
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-expanded={open}
          aria-controls="diagnostics-console-drawer"
          className="group flex items-center gap-3 rounded-[1.2rem] bg-[linear-gradient(135deg,var(--app-surface),color-mix(in_srgb,var(--app-accent-soft)_36%,var(--app-surface)))] px-3.5 py-3 text-start transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-60"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <BeakerIcon className="h-5 w-5" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--app-text-faint)]">
              {t("options.diagnostics.launcherTitle")}
            </span>
            <span className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--app-text)]">
                {t("options.diagnostics.launcherSubtitle")}
              </span>
              <DiagnosticsBadge label={statusLabel} tone={statusTone} />
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

export function DiagnosticsConsoleDrawer({
  open,
  onClose,
  config,
  events,
  snapshotCount,
  resolvedSnapshot,
  manualRefreshInProgress,
  busyAction,
  requestError,
  pageVisible,
  lastUpdatedAt,
  onRefresh,
  onClear,
  onSetSessionCaptureEnabled,
}: {
  open: boolean;
  onClose: () => void;
  config: DiagnosticsConfig | null;
  events: DiagnosticsEvent[];
  snapshotCount: number;
  resolvedSnapshot: DiagnosticsSnapshot | null;
  manualRefreshInProgress: boolean;
  busyAction: null | "toggle" | "clear";
  requestError: string | null;
  pageVisible: boolean;
  lastUpdatedAt: string | null;
  onRefresh: () => Promise<void>;
  onClear: () => Promise<void>;
  onSetSessionCaptureEnabled: (enabled: boolean) => Promise<void>;
}) {
  const t = useT();
  const [rendered, setRendered] = useState(open);
  const [animatedOpen, setAnimatedOpen] = useState(open);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [levelFilter, setLevelFilter] = useState<DiagnosticsViewerLevelFilter>(
    () => getDiagnosticsViewerDefaultLevelFilter()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [copiedVisible, setCopiedVisible] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const filteredEvents = useMemo(
    () =>
      filterDiagnosticsViewerEvents(events, {
        levelFilter,
        searchTerm: deferredSearchTerm,
      }),
    [deferredSearchTerm, events, levelFilter]
  );
  const visibleCounts = useMemo(
    () => getDiagnosticsViewerCounts(filteredEvents),
    [filteredEvents]
  );

  useEffect(() => {
    if (open) {
      setRendered(true);
      let settleFrameId = 0;
      const frameId = window.requestAnimationFrame(() => {
        settleFrameId = window.requestAnimationFrame(() => {
          setAnimatedOpen(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frameId);
        window.cancelAnimationFrame(settleFrameId);
      };
    }

    setAnimatedOpen(false);
    const timeoutId = window.setTimeout(() => {
      setRendered(false);
    }, DIAGNOSTICS_DRAWER_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !listRef.current || autoScrollPaused) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [autoScrollPaused, filteredEvents.length, open]);

  useEffect(() => {
    if (!open) {
      setAutoScrollPaused(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousStyles = {
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehaviorY: body.style.overscrollBehaviorY,
      rootOverflow: root.style.overflow,
      rootOverscrollBehaviorY: root.style.overscrollBehaviorY,
    };

    body.style.overflow = "hidden";
    body.style.overscrollBehaviorY = "none";
    root.style.overflow = "hidden";
    root.style.overscrollBehaviorY = "none";

    return () => {
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.overscrollBehaviorY = previousStyles.bodyOverscrollBehaviorY;
      root.style.overflow = previousStyles.rootOverflow;
      root.style.overscrollBehaviorY = previousStyles.rootOverscrollBehaviorY;
    };
  }, [open]);

  if (!rendered) {
    return null;
  }

  const status = getDiagnosticsViewerStatus({
    viewerEnabled: true,
    config,
    drawerOpen: open,
    pageVisible,
    hasError: Boolean(requestError),
    t,
  });
  const canCopyVisible = filteredEvents.length > 0;
  const canClear = events.length > 0 || snapshotCount > 0;
  const handleCopyVisible = async () => {
    await copyTextToClipboard(serializeDiagnosticsViewerEvents(filteredEvents));
    setCopiedVisible(true);
    window.setTimeout(() => setCopiedVisible(false), 1200);
  };
  const hasNoMatches = filteredEvents.length === 0 && events.length > 0;

  return (
    <div
      className={[
        "fixed inset-0 z-[70] overscroll-y-none transition-opacity ease-out motion-reduce:transition-none",
        animatedOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      ].join(" ")}
      style={{ transitionDuration: `${DIAGNOSTICS_DRAWER_TRANSITION_MS}ms` }}
    >
      <button
        type="button"
        aria-label={t("options.diagnostics.closeConsole")}
        className={[
          "absolute inset-0 bg-[color:color-mix(in_srgb,var(--app-bg)_64%,transparent)] backdrop-blur-[2px] transition-opacity ease-out motion-reduce:transition-none",
          animatedOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{ transitionDuration: `${DIAGNOSTICS_DRAWER_TRANSITION_MS}ms` }}
        onClick={onClose}
      />

      <section
        id="diagnostics-console-drawer"
        aria-label={t("options.diagnostics.drawerLabel")}
        onWheel={(event) => {
          event.stopPropagation();
        }}
        onTouchMove={(event) => {
          event.stopPropagation();
        }}
        className={[
          "absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-7xl flex-col overflow-hidden overscroll-y-contain rounded-t-[2rem] border border-b-0 border-[var(--app-border-strong)] bg-[color:color-mix(in_srgb,var(--app-surface)_88%,transparent)] shadow-[0_-24px_72px_var(--app-shadow)] backdrop-blur-2xl transition-[height,opacity] motion-reduce:transition-none",
          animatedOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{
          height: animatedOpen ? DIAGNOSTICS_DRAWER_HEIGHT : "0px",
          transitionDuration: `${DIAGNOSTICS_DRAWER_TRANSITION_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.2, 0.9, 0.2, 1)",
          willChange: "height, opacity",
        }}
      >
        <div className="sticky top-0 z-10 border-b border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface-strong)_82%,transparent)] px-4 py-3 backdrop-blur-2xl sm:px-5">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--app-accent)]">
                  {t("options.diagnostics.drawerLabel")}
                </p>
                <DiagnosticsBadge label={status.label} tone={status.tone} />
              </div>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-[var(--app-text-muted)]">
                {status.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <DiagnosticsActionButton
                label={
                  config?.enabled
                    ? t("options.diagnostics.actions.disableSession")
                    : t("options.diagnostics.actions.enableSession")
                }
                onClick={() => {
                  void onSetSessionCaptureEnabled(!config?.enabled);
                }}
                disabled={busyAction !== null || !config}
                tone={config?.enabled ? "warning" : "accent"}
              />
              <DiagnosticsActionButton
                label={
                  copiedVisible
                    ? t("options.diagnostics.actions.copiedVisible")
                    : t("options.diagnostics.actions.copyVisible")
                }
                onClick={() => {
                  void handleCopyVisible();
                }}
                disabled={!canCopyVisible}
                tone={copiedVisible ? "accent" : "neutral"}
              />
              <IconButton
                icon={<RefreshIcon />}
                label={t("options.diagnostics.actions.refresh")}
                variant="soft"
                loading={manualRefreshInProgress}
                onClick={() => {
                  void onRefresh();
                }}
              />
              <IconButton
                icon={<TrashIcon />}
                label={t("options.diagnostics.actions.clear")}
                variant="danger"
                loading={busyAction === "clear"}
                disabled={!canClear || busyAction !== null}
                onClick={() => {
                  void onClear();
                }}
              />
              <IconButton
                icon={<CloseIcon />}
                label={t("options.diagnostics.closeDrawer")}
                variant="soft"
                onClick={onClose}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {getDiagnosticsViewerLevelOptions().map((option) => {
                const isActive =
                  option === "all"
                    ? areAllDiagnosticsViewerLevelsSelected(levelFilter)
                    : isDiagnosticsViewerLevelSelected(levelFilter, option);
                const optionLabel =
                  option === "all"
                    ? t("options.diagnostics.filters.all")
                    : t(`options.diagnostics.filters.${option}` as const);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setLevelFilter((current) =>
                        option === "all"
                          ? selectAllDiagnosticsViewerLevels()
                          : toggleDiagnosticsViewerLevel(current, option)
                      )
                    }
                    className={[
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      isActive
                        ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                        : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
                    ].join(" ")}
                  >
                    {optionLabel}
                  </button>
                );
              })}
            </div>

            <label className="relative block w-full max-w-sm xl:min-w-[320px]">
              <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-[var(--app-text-faint)]">
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("options.diagnostics.filters.searchPlaceholder")}
                className="w-full rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2 pl-9 pr-3 text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-faint)] focus:border-[var(--app-accent-border)]"
              />
            </label>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3 sm:px-5">
          <DiagnosticsConsoleSummary
            loadedCount={events.length}
            visibleCount={filteredEvents.length}
            snapshotCount={snapshotCount}
            lastUpdatedAt={lastUpdatedAt}
            resolvedSnapshot={resolvedSnapshot}
          />

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--app-text-muted)]">
            <span className="mr-1">{t("options.diagnostics.filters.visibleCounts")}</span>
            <DiagnosticsBadge label={`${t("options.diagnostics.filters.error")} ${visibleCounts.error}`} tone="danger" />
            <DiagnosticsBadge label={`${t("options.diagnostics.filters.warn")} ${visibleCounts.warn}`} tone="warning" />
            <DiagnosticsBadge label={`${t("options.diagnostics.filters.info")} ${visibleCounts.info}`} tone="accent" />
            <DiagnosticsBadge label={`${t("options.diagnostics.filters.debug")} ${visibleCounts.debug}`} tone="neutral" />
            <DiagnosticsBadge label={`${t("options.diagnostics.filters.trace")} ${visibleCounts.trace}`} tone="neutral" />
          </div>

          {requestError && (
            <div className="rounded-[1rem] border border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] px-3 py-2.5 text-[13px] leading-5 text-[var(--app-text-muted)]">
              {t("options.diagnostics.states.requestErrorPrefix")} {requestError}
            </div>
          )}

          <div
            ref={listRef}
            onScroll={(event) => {
              const element = event.currentTarget;
              setAutoScrollPaused(
                !isDiagnosticsViewerNearLatest({
                  scrollTop: element.scrollTop,
                  scrollHeight: element.scrollHeight,
                  clientHeight: element.clientHeight,
                })
              );
            }}
            onWheel={(event) => {
              event.stopPropagation();
            }}
            onTouchMove={(event) => {
              event.stopPropagation();
            }}
            className="mc-app-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-y-contain pb-2 [scrollbar-gutter:stable]"
          >
            {!config?.enabled && events.length === 0 && (
              <div className="rounded-[1.2rem] border border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_82%,var(--app-surface))] p-4">
                <p className="text-sm font-semibold text-[var(--app-text)] sm:text-base">
                  {t("options.diagnostics.states.captureOffTitle")}
                </p>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[var(--app-text-muted)]">
                  {t("options.diagnostics.states.captureOffBody")}
                </p>
                <div className="mt-3">
                  <DiagnosticsActionButton
                    label={t("options.diagnostics.actions.enableSessionDiagnostics")}
                    onClick={() => {
                      void onSetSessionCaptureEnabled(true);
                    }}
                    disabled={busyAction !== null || !config}
                    tone="accent"
                  />
                </div>
              </div>
            )}

            {config?.enabled && events.length === 0 && (
              <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--app-text)] sm:text-base">
                  {t("options.diagnostics.states.waitingTitle")}
                </p>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[var(--app-text-muted)]">
                  {t("options.diagnostics.states.waitingBody")}
                </p>
              </div>
            )}

            {hasNoMatches && (
              <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--app-text)] sm:text-base">
                  {t("options.diagnostics.states.noMatchesTitle")}
                </p>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[var(--app-text-muted)]">
                  {t("options.diagnostics.states.noMatchesBody")}
                </p>
              </div>
            )}

            {filteredEvents.map((event) => (
              <DiagnosticsConsoleEventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DiagnosticsConsole() {
  const t = useT();
  const launcherButtonRef = useRef<HTMLButtonElement | null>(null);
  const {
    viewerEnabled,
    drawerOpen,
    setDrawerOpen,
    pageVisible,
    config,
    events,
    snapshotCount,
    resolvedSnapshot,
    manualRefreshInProgress,
    busyAction,
    requestError,
    lastUpdatedAt,
    refreshPayload,
    clearDiagnostics,
    setSessionCaptureEnabled,
  } = useDiagnosticsConsole();

  if (!viewerEnabled) {
    return null;
  }

  const status = getDiagnosticsViewerStatus({
    viewerEnabled,
    config,
    drawerOpen,
    pageVisible,
    hasError: Boolean(requestError),
    t,
  });
  const handleCloseDrawer = () => {
    launcherButtonRef.current?.focus();
    setDrawerOpen(false);
  };

  return (
    <>
      <DiagnosticsConsoleLauncher
        buttonRef={launcherButtonRef}
        open={drawerOpen}
        onToggle={() => setDrawerOpen((current) => !current)}
        statusLabel={status.label}
        statusTone={status.tone}
        disabled={false}
      />
      <DiagnosticsConsoleDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        config={config}
        events={events}
        snapshotCount={snapshotCount}
        resolvedSnapshot={resolvedSnapshot}
        manualRefreshInProgress={manualRefreshInProgress}
        busyAction={busyAction}
        requestError={requestError}
        pageVisible={pageVisible}
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={refreshPayload}
        onClear={clearDiagnostics}
        onSetSessionCaptureEnabled={setSessionCaptureEnabled}
      />
    </>
  );
}
