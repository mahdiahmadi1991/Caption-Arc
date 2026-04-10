import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { MeetingSession } from "./types";
import type {
  MeetingAssistantOutput,
  SummaryJobStatus,
  SummaryProfile,
} from "../../background/types";
import {
  formatSessionOffset,
  getMeetingDisplayTitle,
  getMeetingSessionTimelineSegmentForTimestamp,
  getSegmentedSessionOffsetMs,
  type MeetingSessionTimelineSegment,
} from "../../shared/meeting-session";
import { sanitizeStoredRichTextHtml } from "../../shared/rich-text";
import {
  useSessionDetail,
  formatGapDuration,
  type MarkdownExportOptions,
} from "./use-session-detail";
import {
  findLatestMeetingSummary,
  getMeetingSummaryList,
} from "../../shared/meeting-summary";
import {
  detectTextDirection,
  LANGUAGE_OPTIONS,
  getLanguageDirection,
  getLanguageName,
} from "../../shared/language-metadata";
import { DYNAMIC_TEXT_STYLE } from "../../shared/text-direction";
import type { OpenAiServiceAvailability } from "../../shared/openai-service";
import { IconButton } from "../../shared/icon-button";
import { DropdownSelect } from "../../shared/dropdown-select";
import { ActionCard } from "./action-card";
import { AnimatedCollapse } from "../../shared/animated-collapse";
import { Tooltip } from "../../shared/tooltip";
import { useI18n, useT, type UiTranslator } from "../../shared/i18n";
import {
  AlertTriangleIcon,
  BackIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  EditIcon,
  ExportIcon,
  RefreshIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
} from "../../shared/icons";

const SUMMARY_MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 text-xl font-semibold text-[var(--app-text)] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 text-lg font-semibold text-[var(--app-text)] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 text-base font-semibold text-[var(--app-text)] first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-3 leading-7 text-[var(--app-text)] first:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--app-text)] marker:text-[var(--app-text-faint)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--app-text)] marker:text-[var(--app-text-faint)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-s-2 border-[var(--app-accent-border)] ps-4 text-[var(--app-text-muted)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-[var(--app-border)]" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--app-text)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-[var(--app-text)]">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="mc-app-scrollbar block overflow-x-auto rounded-2xl bg-[var(--app-surface)] px-4 py-3 text-[13px] leading-6 text-[var(--app-text)]">
          {children}
        </code>
      );
    }

    return (
      <code className="rounded-md bg-[var(--app-surface)] px-1.5 py-0.5 text-[13px] text-[var(--app-text)]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mc-app-scrollbar mt-4 overflow-x-auto">{children}</pre>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[var(--app-accent)] underline underline-offset-2"
    >
      {children}
    </a>
  ),
};

function getRequestedSummaryFallback(
  session: MeetingSession,
  requestedSummaryKey: string | null
) {
  if (!requestedSummaryKey) {
    return null;
  }

  const groupSeparatorIndex = requestedSummaryKey.lastIndexOf(":");
  if (groupSeparatorIndex <= 0) {
    return null;
  }

  const requestedGroupKey = requestedSummaryKey.slice(0, groupSeparatorIndex);
  return (
    getMeetingSummaryList(session.summaries).find(
      (summary) => summary.groupKey === requestedGroupKey
    ) || null
  );
}

type SessionDetailProps = {
  session: MeetingSession;
  translationTargetLanguage: string;
  summaryDefaultLanguage: string;
  summaryProfiles: SummaryProfile[];
  defaultSummaryProfileId: string;
  openAiAvailability: OpenAiServiceAvailability;
  translatingCaptionKey: string | null;
  translatingSessionId: string | null;
  summarizingSessionId: string | null;
  summaryJobStatus: SummaryJobStatus | null;
  requestedSummaryExpanded: boolean;
  requestedSummaryKey: string | null;
  onTranslateCaption: (
    sessionId: string,
    captionTimestamp: number,
    targetLanguage: string,
    source?: "caption" | "chat"
  ) => void;
  onTranslateAllCaptions: (sessionId: string, targetLanguage: string) => void;
  onGenerateSummary: (
    sessionId: string,
    targetLanguage: string,
    profileId: string
  ) => void;
  onCancelSummary: (sessionId: string) => void;
  onUpdateTitle: (sessionId: string, title: string) => void;
  onToggleStar: (sessionId: string, starred: boolean) => void;
  onBack: () => void;
  onRequestDelete: (session: MeetingSession) => void;
};

type TimelineContentItem =
  | (MeetingSession["captions"][number] & { source: "caption" })
  | (MeetingSession["chatMessages"][number] & { source: "chat" });

type TimelineEntry =
  | { kind: "separator"; segment: MeetingSessionTimelineSegment }
  | { kind: "item"; item: TimelineContentItem };

function getTimelineItemKey(item: TimelineContentItem): string {
  return item.stableEventKey || item.eventId || `${item.source}:${item.timestamp}`;
}

function renderAssistantMarkdown(content: string): ReactNode {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={SUMMARY_MARKDOWN_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}

function formatSummaryGenerationMode(
  value: SummaryJobStatus["mode"] | string | undefined,
  t: UiTranslator
): string | null {
  if (value === "economy") {
    return t("options.profiles.summary.modes.economy.name");
  }

  if (value === "balanced") {
    return t("options.profiles.summary.modes.balanced.name");
  }

  if (value === "thorough") {
    return t("options.profiles.summary.modes.thorough.name");
  }

  return null;
}

function formatSummaryExecutionStrategy(
  value: string | undefined,
  t: UiTranslator
): string | null {
  if (value === "single_shot") {
    return t("history.detail.summary.executionStrategy.singleShot");
  }

  if (value === "structured_single_shot") {
    return t("history.detail.summary.executionStrategy.structuredSingleShot");
  }

  if (value === "multi_stage") {
    return t("history.detail.summary.executionStrategy.multiStage");
  }

  return null;
}

function getSummaryJobStatusTitle(
  state: SummaryJobStatus["state"],
  t: UiTranslator
): string {
  switch (state) {
    case "preflighting":
      return t("history.detail.summaryJob.states.preflighting");
    case "extracting":
      return t("history.detail.summaryJob.states.extracting");
    case "merging":
      return t("history.detail.summaryJob.states.merging");
    case "synthesizing":
      return t("history.detail.summaryJob.states.synthesizing");
    case "continuing":
      return t("history.detail.summaryJob.states.continuing");
    case "reconciling":
      return t("history.detail.summaryJob.states.reconciling");
    case "completed":
      return t("history.detail.summaryJob.states.completed");
    case "failed":
      return t("history.detail.summaryJob.states.failed");
    case "cancelled":
      return t("history.detail.summaryJob.states.cancelled");
    default:
      return t("history.detail.summaryJob.states.default");
  }
}

function getSummaryJobProgress(
  status: SummaryJobStatus,
  t: UiTranslator
): {
  value: number | null;
  label: string | null;
} {
  if (status.state === "completed") {
    return { value: 100, label: t("history.detail.summaryJob.progress.ready") };
  }

  if (status.state === "preflighting") {
    return {
      value: 8,
      label: t("history.detail.summaryJob.progress.preparing"),
    };
  }

  if (
    status.state === "extracting" &&
    typeof status.progressCurrent === "number" &&
    typeof status.progressTotal === "number" &&
    status.progressTotal > 0
  ) {
    const ratio = Math.max(
      0,
      Math.min(status.progressCurrent / status.progressTotal, 1)
    );
    return {
      value: 12 + ratio * 58,
      label: t("history.detail.summaryJob.progress.step", {
        current: status.progressCurrent,
        total: status.progressTotal,
      }),
    };
  }

  if (status.state === "merging") {
    return {
      value: 78,
      label: t("history.detail.summaryJob.progress.mergingEvidence"),
    };
  }

  if (status.state === "synthesizing") {
    return {
      value: 88,
      label: t("history.detail.summaryJob.progress.preparingFinal"),
    };
  }

  if (
    status.state === "continuing" &&
    typeof status.progressCurrent === "number" &&
    typeof status.progressTotal === "number" &&
    status.progressTotal > 0
  ) {
    const ratio = Math.max(
      0,
      Math.min(status.progressCurrent / status.progressTotal, 1)
    );
    return {
      value: 90 + ratio * 6,
      label: t("history.detail.summaryJob.progress.continuation", {
        current: status.progressCurrent,
        total: status.progressTotal,
      }),
    };
  }

  if (status.state === "continuing") {
    return {
      value: 92,
      label: t("history.detail.summaryJob.progress.continuing"),
    };
  }

  if (status.state === "reconciling") {
    return {
      value: 97,
      label: t("history.detail.summaryJob.progress.finalChecks"),
    };
  }

  return { value: null, label: null };
}

function SessionHeaderTitle({
  session,
  displayTitle,
  onUpdateTitle,
  onToggleStar,
}: {
  session: MeetingSession;
  displayTitle: string;
  onUpdateTitle: (sessionId: string, title: string) => void;
  onToggleStar: (sessionId: string, starred: boolean) => void;
}) {
  const t = useT();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title || "");

  useEffect(() => {
    setEditValue(session.title || "");
  }, [session.title]);

  const finishEditing = (shouldSave: boolean) => {
    const trimmed = editValue.trim();
    if (shouldSave && trimmed !== (session.title || "")) {
      onUpdateTitle(session.id, trimmed);
    }
    setEditValue(session.title || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start gap-3">
          <IconButton
            onClick={() => onToggleStar(session.id, !session.starred)}
            icon={<StarIcon />}
            label={
              session.starred
                ? t("history.sessionList.removeStar")
                : t("history.sessionList.starSession")
            }
            variant={session.starred ? "accent" : "soft"}
            size="sm"
            className={session.starred ? "text-[var(--app-accent)]" : ""}
          />
          <input
            type="text"
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onBlur={() => finishEditing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                finishEditing(true);
              }
              if (event.key === "Escape") {
                finishEditing(false);
              }
            }}
            placeholder={getMeetingDisplayTitle(session)}
            className="w-full min-w-0 flex-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-lg font-semibold text-[var(--app-text)] outline-none transition-colors focus:border-[var(--app-accent)] sm:min-w-[280px]"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => finishEditing(true)}
            icon={<CheckIcon />}
            label={t("history.detail.actions.saveTitle")}
            variant="accent"
            size="sm"
          />
          <IconButton
            onClick={() => finishEditing(false)}
            icon={<CloseIcon />}
            label={t("history.detail.actions.cancelTitleEditing")}
            size="sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton
        onClick={() => onToggleStar(session.id, !session.starred)}
        icon={<StarIcon />}
        label={
          session.starred
            ? t("history.sessionList.removeStar")
            : t("history.sessionList.starSession")
        }
        variant={session.starred ? "accent" : "soft"}
        size="sm"
        className={session.starred ? "text-[var(--app-accent)]" : ""}
      />
      <h1
        className="min-w-0 text-2xl font-semibold text-[var(--app-text)]"
        style={DYNAMIC_TEXT_STYLE}
      >
        {displayTitle}
      </h1>
      <IconButton
        onClick={() => setIsEditing(true)}
        icon={<EditIcon />}
        label={t("history.detail.actions.renameSession")}
        size="sm"
      />
    </div>
  );
}

function formatSegmentResumeLabel(
  segment: MeetingSessionTimelineSegment,
  locale: string
): string {
  return new Date(segment.startTime).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "accent" | "warning" | "danger";
}) {
  const className =
    tone === "accent"
      ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
      : tone === "warning"
        ? "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)]"
        : tone === "danger"
          ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}

function DependencyIndicator({
  availability,
  label,
}: {
  availability: OpenAiServiceAvailability;
  label: string;
}) {
  if (availability.operational) {
    return null;
  }

  return (
    <Tooltip content={availability.message}>
      <span className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-warning)]">
        <AlertTriangleIcon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </span>
    </Tooltip>
  );
}

function formatCoverage(value: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function shortenFingerprint(value: string): string {
  return value.length > 16 ? `${value.slice(0, 16)}…` : value;
}

function renderTimelineItemText(
  item: {
    source: "caption" | "chat";
    text: string;
    formattedHtml?: string;
  }
): JSX.Element {
  const textDirection = detectTextDirection(item.text);
  const sanitizedHtml =
    item.source === "chat"
      ? sanitizeStoredRichTextHtml(item.formattedHtml)
      : undefined;

  if (sanitizedHtml) {
    return (
      <div
        className="mc-rich-scrollbars mt-3 text-sm leading-relaxed text-[var(--app-text)] [&_a]:text-[var(--app-accent)] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded-md [&_code]:bg-[var(--app-surface-strong)] [&_code]:px-1.5 [&_code]:py-0.5 [&_em]:italic [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:ps-5 [&_p]:m-0 [&_p+p]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[var(--app-surface-strong)] [&_pre]:p-3 [&_strong]:font-semibold [&_u]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:ps-5"
        style={DYNAMIC_TEXT_STYLE}
        dir={textDirection}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  return (
    <p
      className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--app-text)]"
      style={DYNAMIC_TEXT_STYLE}
      dir={textDirection}
    >
      {item.text}
    </p>
  );
}

function isTerminalSummaryJobState(
  state?: SummaryJobStatus["state"] | null
): boolean {
  return (
    state === "completed" || state === "failed" || state === "cancelled"
  );
}

function SummaryJobStatusPanel({
  status,
  canCancel,
  canRetry,
  onCancel,
  onRetry,
  embedded = false,
}: {
  status: SummaryJobStatus;
  canCancel: boolean;
  canRetry: boolean;
  onCancel: () => void;
  onRetry: () => void;
  embedded?: boolean;
}) {
  const t = useT();
  const toneClassName =
    status.state === "failed"
      ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)]"
      : status.state === "completed"
        ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)]"
        : "border-[var(--app-border)] bg-[var(--app-surface-soft)]";
  const titleClassName =
    status.state === "failed"
      ? "text-[var(--app-danger)]"
      : status.state === "completed"
        ? "text-[var(--app-accent)]"
        : "text-[var(--app-text)]";
  const progress = getSummaryJobProgress(status, t);

  return (
    <div
      className={`${
        embedded ? "rounded-[1.25rem] border p-4" : "mb-5 rounded-[1.5rem] border p-4"
      } ${toneClassName}`.trim()}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${titleClassName}`}>
            {getSummaryJobStatusTitle(status.state, t)}
          </p>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {status.message}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {formatSummaryGenerationMode(status.mode, t) && (
            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
              {formatSummaryGenerationMode(status.mode, t)}
            </span>
          )}
          {formatSummaryExecutionStrategy(status.strategy, t) && (
            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
              {formatSummaryExecutionStrategy(status.strategy, t)}
            </span>
          )}
        </div>
      </div>

      {progress.value !== null && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--app-text-faint)]">
            <span>{progress.label}</span>
            <span>{Math.round(progress.value)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface)]">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                status.state === "failed"
                  ? "bg-[var(--app-danger)]"
                  : "bg-[var(--app-accent)]"
              }`}
              style={{ width: `${progress.value}%` }}
            />
          </div>
        </div>
      )}

      {status.detail && (
        <div className="mc-app-scrollbar mt-4 max-h-32 overflow-y-auto rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs leading-6 text-[var(--app-text-muted)]">
          {status.detail}
        </div>
      )}

      {(canCancel || canRetry) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-strong)]"
            >
              {t("common.actions.cancel")}
            </button>
          )}
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="h-10 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-4 text-sm font-medium text-[var(--app-accent)] transition-colors hover:bg-[var(--app-surface-soft)]"
            >
              {t("history.detail.actions.retry")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExportMenu({
  includeTranslations,
  includeSummaries,
  canIncludeTranslations,
  canIncludeSummaries,
  onChange,
  onExport,
}: {
  includeTranslations: boolean;
  includeSummaries: boolean;
  canIncludeTranslations: boolean;
  canIncludeSummaries: boolean;
  onChange: (updates: Partial<MarkdownExportOptions>) => void;
  onExport: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative z-[80]" ref={menuRef}>
      <IconButton
        onClick={() => setOpen((value) => !value)}
        icon={open ? <ChevronDownIcon /> : <ExportIcon />}
        label={
          open
            ? t("history.detail.exportMenu.close")
            : t("history.detail.exportMenu.open")
        }
        variant="accent"
      />

      {open && (
        <div className="absolute right-0 z-[90] mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2 shadow-[0_24px_48px_var(--app-shadow)] ring-1 ring-[color-mix(in_srgb,var(--app-shadow)_10%,transparent)]">
          <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
            <div>
              <div className="text-sm font-medium text-[var(--app-text)]">
                {t("history.detail.exportMenu.title")}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
                {t("history.detail.exportMenu.description")}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() =>
                  canIncludeTranslations &&
                  onChange({ includeTranslations: !includeTranslations })
                }
                disabled={!canIncludeTranslations}
                className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-3 text-start transition-colors hover:bg-[var(--app-surface-soft)] disabled:cursor-default disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--app-text)]">
                    {t("history.detail.exportMenu.includeTranslationsLabel")}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--app-text-muted)]">
                    {canIncludeTranslations
                      ? t(
                          "history.detail.exportMenu.includeTranslationsAvailable"
                        )
                      : t(
                          "history.detail.exportMenu.includeTranslationsUnavailable"
                        )}
                  </span>
                </span>
                <span
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all ${
                    includeTranslations && canIncludeTranslations
                      ? "border-[var(--app-accent-border)] bg-[var(--app-accent)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface)]"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 h-5 w-5 rounded-full border bg-white transition-transform ${
                      includeTranslations && canIncludeTranslations
                        ? "translate-x-5 border-white/60"
                        : "translate-x-0 border-[var(--app-border)]"
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  canIncludeSummaries &&
                  onChange({ includeSummaries: !includeSummaries })
                }
                disabled={!canIncludeSummaries}
                className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-3 text-start transition-colors hover:bg-[var(--app-surface-soft)] disabled:cursor-default disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--app-text)]">
                    {t("history.detail.exportMenu.includeSummariesLabel")}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--app-text-muted)]">
                    {canIncludeSummaries
                      ? t(
                          "history.detail.exportMenu.includeSummariesAvailable"
                        )
                      : t(
                          "history.detail.exportMenu.includeSummariesUnavailable"
                        )}
                  </span>
                </span>
                <span
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all ${
                    includeSummaries && canIncludeSummaries
                      ? "border-[var(--app-accent-border)] bg-[var(--app-accent)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface)]"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 h-5 w-5 rounded-full border bg-white transition-transform ${
                      includeSummaries && canIncludeSummaries
                        ? "translate-x-5 border-white/60"
                        : "translate-x-0 border-[var(--app-border)]"
                    }`}
                  />
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onExport();
                setOpen(false);
              }}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-4 text-sm font-medium text-[var(--app-accent)] transition-colors hover:bg-[var(--app-surface-soft)]"
            >
              {t("history.detail.exportMenu.export")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SessionDetail({
  session,
  translationTargetLanguage,
  summaryDefaultLanguage,
  summaryProfiles,
  defaultSummaryProfileId,
  openAiAvailability,
  translatingCaptionKey,
  translatingSessionId,
  summarizingSessionId,
  summaryJobStatus,
  requestedSummaryExpanded,
  requestedSummaryKey,
  onTranslateCaption,
  onTranslateAllCaptions,
  onGenerateSummary,
  onCancelSummary,
  onUpdateTitle,
  onToggleStar,
  onBack,
  onRequestDelete,
}: SessionDetailProps) {
  const { locale } = useI18n();
  const t = useT();
  const {
    chatMessageCount,
    translatedCaptionCount,
    displayTitle,
    displayIdentifier,
    metadataRows,
    formattedDuration,
    extractionReport,
    hasTranslations,
    hasSummaries,
    exportMarkdownTranscript,
  } = useSessionDetail(session);
  const [summaryLanguage, setSummaryLanguage] = useState(summaryDefaultLanguage);
  const [bulkTranslationLanguage, setBulkTranslationLanguage] = useState(
    translationTargetLanguage
  );
  const [itemTranslationLanguages, setItemTranslationLanguages] =
    useState<Record<string, string>>({});
  const [exportOptions, setExportOptions] = useState<MarkdownExportOptions>({
    includeTranslations: hasTranslations,
    includeSummaries: hasSummaries,
  });
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [reportExpanded, setReportExpanded] = useState(false);
  const [continuationsExpanded, setContinuationsExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [selectedSummaryKey, setSelectedSummaryKey] = useState<string>("");
  const summarySectionRef = useRef<HTMLDivElement | null>(null);
  const handledSummaryDeepLinkScrollRef = useRef<string | null>(null);
  const latestSavedSummary = useMemo(
    () => getMeetingSummaryList(session.summaries)[0] || null,
    [session.summaries]
  );
  const [selectedProfileId, setSelectedProfileId] = useState(
    session.summaryProfileId || defaultSummaryProfileId || summaryProfiles[0]?.id || ""
  );

  useEffect(() => {
    setSummaryLanguage(summaryDefaultLanguage);
  }, [summaryDefaultLanguage, session.id]);

  useEffect(() => {
    setItemTranslationLanguages({});
  }, [translationTargetLanguage, session.id]);

  useEffect(() => {
    setBulkTranslationLanguage(translationTargetLanguage);
  }, [translationTargetLanguage, session.id]);

  useEffect(() => {
    setExportOptions({
      includeTranslations: hasTranslations,
      includeSummaries: hasSummaries,
    });
  }, [hasSummaries, hasTranslations, session.id]);

  useEffect(() => {
    const preferredProfileId =
      session.summaryProfileId || defaultSummaryProfileId || summaryProfiles[0]?.id || "";
    const nextProfileId = summaryProfiles.some(
      (profile) => profile.id === preferredProfileId
    )
      ? preferredProfileId
      : summaryProfiles[0]?.id || "";
    setSelectedProfileId(nextProfileId);
  }, [defaultSummaryProfileId, session.id, session.summaryProfileId, summaryProfiles]);

  useEffect(() => {
    const requestedSummary =
      (requestedSummaryKey && session.summaries?.[requestedSummaryKey]) || null;
    const fallbackSummary = requestedSummary
      ? null
      : getRequestedSummaryFallback(session, requestedSummaryKey);

    if (!requestedSummary && !fallbackSummary) {
      if (requestedSummaryExpanded) {
        setSummaryExpanded(true);
      }
      return;
    }

    const summaryTarget = requestedSummary || fallbackSummary;
    if (!summaryTarget) {
      return;
    }

    setSummaryLanguage(summaryTarget.language);
    setSelectedProfileId(summaryTarget.profileId);
    setSelectedSummaryKey(summaryTarget.key);
    setSummaryExpanded(true);
  }, [requestedSummaryExpanded, requestedSummaryKey, session.id, session.summaries]);

  const selectedProfile =
    summaryProfiles.find((profile) => profile.id === selectedProfileId) || null;
  const sessionProfile =
    summaryProfiles.find((profile) => profile.id === session.summaryProfileId) || null;
  const matchingSummaries = useMemo(
    () =>
      getMeetingSummaryList(session.summaries).filter(
        (summary) =>
          summary.profileId === selectedProfileId &&
          summary.language === summaryLanguage
      ),
    [selectedProfileId, session.summaries, summaryLanguage]
  );
  const activeSummary =
    matchingSummaries.find((summary) => summary.key === selectedSummaryKey) ||
    findLatestMeetingSummary(session.summaries, {
      profileId: selectedProfileId,
      language: summaryLanguage,
    });
  const summaryVersionOptions = matchingSummaries.map((summary, index) => {
    const generatedAt = new Date(summary.generatedAt).toLocaleString(locale);

    return {
      id: summary.key,
      name:
        index === 0
          ? t("history.detail.summary.version.latest", {
              time: generatedAt,
            })
          : generatedAt,
      description: [
        summary.profileName,
        summary.requestSource === "automatic"
          ? t("history.detail.summary.version.automatic")
          : t("history.detail.summary.version.manual"),
        summary.model,
      ]
        .filter(Boolean)
        .join(" · "),
      badgeLabel:
        summary.requestSource === "automatic"
          ? t("history.detail.summary.version.auto")
          : summary.sourceSessionProfileId &&
              summary.sourceSessionProfileId !== summary.profileId
            ? t("history.detail.summary.version.alt")
            : undefined,
      badgeTone:
        summary.requestSource === "automatic"
          ? "accent"
          : summary.sourceSessionProfileId &&
              summary.sourceSessionProfileId !== summary.profileId
            ? "warning"
            : undefined,
    };
  });
  const summaryDirection = getLanguageDirection(summaryLanguage);
  const hasActiveSummaryJob =
    Boolean(summaryJobStatus) && !isTerminalSummaryJobState(summaryJobStatus?.state);
  const isSummarizing = summarizingSessionId === session.id || hasActiveSummaryJob;
  const summaryActionsDisabled = !openAiAvailability.operational;
  const translationActionsDisabled = !openAiAvailability.operational;
  const visibleSummary = isSummarizing ? null : activeSummary;
  const isTranslatingAllCaptions = translatingSessionId === session.id;
  const getItemTranslationLanguage = (
    source: "caption" | "chat",
    timestamp: number
  ): string =>
    itemTranslationLanguages[`${source}:${timestamp}`] || translationTargetLanguage;
  const timelineItems = useMemo<TimelineContentItem[]>(
    () =>
      [
        ...session.captions.map((caption) => ({
          ...caption,
          source: "caption" as const,
        })),
        ...session.chatMessages.map((message) => ({
          ...message,
          source: "chat" as const,
        })),
      ].sort((left, right) => left.timestamp - right.timestamp),
    [session.captions, session.chatMessages]
  );
  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    if (timelineItems.length === 0) {
      return [];
    }

    if (!session.rejoinHistory || session.rejoinHistory.length === 0) {
      return timelineItems.map((item) => ({ kind: "item", item }));
    }

    const entries: TimelineEntry[] = [];
    let previousSegmentIndex: number | null = null;

    for (const item of timelineItems) {
      const segment = getMeetingSessionTimelineSegmentForTimestamp(
        item.timestamp,
        session.startTime,
        session.rejoinHistory,
        session.endTime
      );

      if (segment.index > 0 && segment.index !== previousSegmentIndex) {
        entries.push({ kind: "separator", segment });
      }

      entries.push({ kind: "item", item });
      previousSegmentIndex = segment.index;
    }

    return entries;
  }, [session.endTime, session.rejoinHistory, session.startTime, timelineItems]);
  const assistantOutputsByTriggerKey = useMemo(() => {
    const grouped = new Map<string, MeetingAssistantOutput[]>();

    Object.values(session.artifacts?.assistantOutputs || {})
      .sort((left, right) => left.createdAt - right.createdAt)
      .forEach((output) => {
        const key = output.triggerStableEventKey || output.triggerEventId;
        const existing = grouped.get(key) || [];
        existing.push(output);
        grouped.set(key, existing);
      });

    return grouped;
  }, [session.artifacts?.assistantOutputs]);
  const rejoinHistory = useMemo(
    () =>
      [...(session.rejoinHistory || [])].sort(
        (left, right) => left.resumedAt - right.resumedAt
      ),
    [session.rejoinHistory]
  );
  const totalRejoinGapMs = useMemo(
    () => rejoinHistory.reduce((sum, entry) => sum + entry.gapMs, 0),
    [rejoinHistory]
  );
  const getTimelineItemOffsetLabel = (timestamp: number): string =>
    formatSessionOffset(
      getSegmentedSessionOffsetMs(
        session.startTime,
        session.rejoinHistory || [],
        timestamp,
        session.endTime
      )
    );
  const shouldShowSummaryStatus =
    Boolean(summaryJobStatus) &&
    (isSummarizing ||
      summaryJobStatus?.state === "failed" ||
      summaryJobStatus?.state === "cancelled" ||
      (summaryJobStatus?.state === "completed" && !activeSummary));
  const summaryActionDetails =
    shouldShowSummaryStatus ? (
      <div className="space-y-4">
        {shouldShowSummaryStatus && summaryJobStatus && (
          <SummaryJobStatusPanel
            status={summaryJobStatus}
            canCancel={isSummarizing}
            canRetry={
              Boolean(selectedProfile) &&
              (summaryJobStatus.state === "failed" ||
                summaryJobStatus.state === "cancelled")
            }
            onCancel={() => onCancelSummary(session.id)}
            onRetry={() =>
              selectedProfile &&
              onGenerateSummary(session.id, summaryLanguage, selectedProfile.id)
            }
            embedded
          />
        )}
      </div>
    ) : null;

  useEffect(() => {
    setSummaryExpanded(false);
  }, [session.id]);

  useEffect(() => {
    setSelectedSummaryKey((current) => {
      if (current && matchingSummaries.some((summary) => summary.key === current)) {
        return current;
      }

      return matchingSummaries[0]?.key || "";
    });
  }, [matchingSummaries, session.id]);

  useEffect(() => {
    if (isSummarizing) {
      setSummaryExpanded(true);
    }
  }, [isSummarizing]);

  useEffect(() => {
    if (requestedSummaryExpanded) {
      setSummaryExpanded(true);
    }
  }, [requestedSummaryExpanded]);

  useEffect(() => {
    if (!requestedSummaryExpanded || !summaryExpanded) {
      return;
    }

    const deepLinkTargetKey = `${session.id}:${requestedSummaryKey || "expanded"}`;
    if (handledSummaryDeepLinkScrollRef.current === deepLinkTargetKey) {
      return;
    }

    handledSummaryDeepLinkScrollRef.current = deepLinkTargetKey;

    const scrollToSummary = () => {
      summarySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    if (typeof window.requestAnimationFrame === "function") {
      let secondFrameId = 0;
      const firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(scrollToSummary);
      });

      return () => {
        window.cancelAnimationFrame(firstFrameId);
        if (secondFrameId) {
          window.cancelAnimationFrame(secondFrameId);
        }
      };
    }

    const timeoutId = window.setTimeout(scrollToSummary, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [requestedSummaryExpanded, requestedSummaryKey, session.id, summaryExpanded]);

  return (
    <div className="space-y-6">
      <div className="relative z-20 overflow-visible rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <IconButton
              onClick={onBack}
              icon={<BackIcon />}
              label={t("history.detail.backToHistory")}
              variant="soft"
            />

            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                  {session.providerLabel}
                </span>
                <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                  {displayIdentifier}
                </span>
                {sessionProfile && (
                  <span className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
                    {t("history.detail.summary.version.sessionProfile", {
                      name: sessionProfile.name,
                    })}
                  </span>
                )}
              </div>
              <SessionHeaderTitle
                session={session}
                displayTitle={displayTitle}
                onUpdateTitle={onUpdateTitle}
                onToggleStar={onToggleStar}
              />
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--app-text-muted)]">
                {t("history.detail.reviewDescription")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <ExportMenu
              includeTranslations={exportOptions.includeTranslations}
              includeSummaries={exportOptions.includeSummaries}
              canIncludeTranslations={hasTranslations}
              canIncludeSummaries={hasSummaries}
              onChange={(updates) =>
                setExportOptions((current) => ({ ...current, ...updates }))
              }
              onExport={() => exportMarkdownTranscript(exportOptions)}
            />
            <IconButton
              onClick={() => onRequestDelete(session)}
              icon={<TrashIcon />}
              label={t("history.sessionList.deleteSession")}
              variant="danger"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("history.detail.stats.capturedCaptions")}
            value={String(session.captions.length)}
          />
          <StatCard
            label={t("history.detail.stats.translatedCaptions")}
            value={String(translatedCaptionCount)}
          />
          <StatCard
            label={t("history.detail.stats.duration")}
            value={formattedDuration || t("history.detail.inProgress")}
          />
          <StatCard
            label={t("history.detail.stats.meetingChatMessages")}
            value={String(chatMessageCount)}
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
              {t("history.detail.sections.metadata.title")}
            </h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {t("history.detail.sections.metadata.description")}
            </p>
          </div>
          <IconButton
            onClick={() => setMetadataExpanded((value) => !value)}
            icon={metadataExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            label={
              metadataExpanded
                ? t("history.detail.sections.metadata.collapse")
                : t("history.detail.sections.metadata.expand")
            }
            variant="soft"
            aria-expanded={metadataExpanded}
            aria-controls="meeting-metadata-panel"
          />
        </div>
        <AnimatedCollapse open={metadataExpanded}>
          <div id="meeting-metadata-panel" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {metadataRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                    {row.label}
                  </div>
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-sm text-[var(--app-accent)] hover:underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <div className="mt-2 break-words text-sm text-[var(--app-text)]">
                      {row.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedCollapse>
      </div>

      {rejoinHistory.length > 0 && (
        <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[var(--app-text)]">
                {t("history.detail.sections.continuations.title")}
              </h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {t("history.detail.sections.continuations.description")}
              </p>
            </div>
            <IconButton
              onClick={() => setContinuationsExpanded((value) => !value)}
              icon={
                continuationsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />
              }
              label={
                continuationsExpanded
                  ? t("history.detail.sections.continuations.collapse")
                  : t("history.detail.sections.continuations.expand")
              }
              variant="soft"
              aria-expanded={continuationsExpanded}
              aria-controls="session-continuations-panel"
            />
          </div>

          <AnimatedCollapse open={continuationsExpanded}>
            <div id="session-continuations-panel" className="mt-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  label={t("history.detail.stats.rejoins")}
                  value={String(rejoinHistory.length)}
                />
                <StatCard
                  label={t("history.detail.stats.totalAwayTime")}
                  value={formatGapDuration(totalRejoinGapMs, t)}
                />
                <StatCard
                  label={t("history.detail.stats.lastRejoin")}
                  value={new Date(
                    rejoinHistory[rejoinHistory.length - 1]!.resumedAt
                  ).toLocaleString(locale)}
                />
              </div>

              <div className="mt-4 space-y-3">
                {rejoinHistory.map((entry, index) => (
                  <div
                    key={`${entry.previousEndTime}:${entry.resumedAt}:${index}`}
                    className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--app-text)]">
                          {t("history.detail.rejoin.label", {
                            index: index + 1,
                          })}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                          {t("history.detail.rejoin.awayFor", {
                            gap: formatGapDuration(entry.gapMs, t),
                          })}
                        </div>
                      </div>
                      <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                        {new Date(entry.resumedAt).toLocaleString(locale)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                          {t("history.detail.rejoin.leftMeeting")}
                        </div>
                        <div className="mt-2 text-sm text-[var(--app-text)]">
                          {new Date(entry.previousEndTime).toLocaleString(locale)}
                        </div>
                      </div>
                      <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                          {t("history.detail.rejoin.returnedToMeeting")}
                        </div>
                        <div className="mt-2 text-sm text-[var(--app-text)]">
                          {new Date(entry.resumedAt).toLocaleString(locale)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCollapse>
        </div>
      )}

      <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
                {t("history.detail.sections.extraction.title")}
            </h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {t("history.detail.sections.extraction.description")}
            </p>
          </div>
          <IconButton
            onClick={() => setReportExpanded((value) => !value)}
            icon={reportExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            label={
              reportExpanded
                ? t("history.detail.sections.extraction.collapse")
                : t("history.detail.sections.extraction.expand")
            }
            variant="soft"
            aria-expanded={reportExpanded}
            aria-controls="extraction-report-panel"
          />
        </div>

        <AnimatedCollapse open={reportExpanded}>
          <div id="extraction-report-panel" className="mt-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("history.detail.stats.canonicalEvents")}
            value={String(extractionReport.eventCount)}
          />
          <StatCard
            label={t("history.detail.stats.uniqueSpeakers")}
            value={String(extractionReport.uniqueSpeakerCount)}
          />
          <StatCard
            label={t("history.detail.stats.metadataCoverage")}
            value={`${formatCoverage(
              extractionReport.coverage.eventsWithMetadata,
              extractionReport.eventCount
            )} (${extractionReport.coverage.eventsWithMetadata}/${extractionReport.eventCount})`}
          />
          <StatCard
            label={t("history.detail.stats.providerIds")}
            value={`${formatCoverage(
              extractionReport.coverage.eventsWithProviderEventId,
              extractionReport.eventCount
            )} (${extractionReport.coverage.eventsWithProviderEventId}/${extractionReport.eventCount})`}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
              {t("history.detail.extraction.eventLogFingerprint")}
            </div>
            <div className="mt-2 break-all text-sm text-[var(--app-text)]">
              {shortenFingerprint(extractionReport.integrity.eventLogFingerprint)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
              {t("history.detail.extraction.searchFingerprint")}
            </div>
            <div className="mt-2 break-all text-sm text-[var(--app-text)]">
              {shortenFingerprint(extractionReport.integrity.searchableTextFingerprint)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
              {t("history.detail.extraction.summaryFingerprint")}
            </div>
            <div className="mt-2 break-all text-sm text-[var(--app-text)]">
              {shortenFingerprint(extractionReport.integrity.summaryFingerprint)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
              {t("history.detail.extraction.timelineRange")}
            </div>
            <div className="mt-2 text-sm text-[var(--app-text)]">
              {extractionReport.firstEventTimestamp
                ? new Date(extractionReport.firstEventTimestamp).toLocaleString(
                    locale
                  )
                : t("history.detail.extraction.noEvents")}
            </div>
            <div className="mt-1 text-sm text-[var(--app-text-muted)]">
              {t("history.detail.extraction.lastEvent")} {" "}
              {extractionReport.lastEventTimestamp
                ? new Date(extractionReport.lastEventTimestamp).toLocaleString(
                    locale
                  )
                : t("history.detail.extraction.noEvents")}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
              {t("history.detail.extraction.coverageBreakdown")}
            </div>
            <div className="mt-2 space-y-1 text-sm text-[var(--app-text)]">
              <p>
                {t("history.detail.extraction.sessionOffsets")} {extractionReport.coverage.eventsWithSessionOffset}/
                {extractionReport.eventCount}
              </p>
              <p>
                {t("history.detail.extraction.translatedEvents")} {extractionReport.coverage.translatedEvents}/
                {extractionReport.eventCount}
              </p>
              <p>
                {t("history.detail.extraction.finalCaptionEvents")} {extractionReport.coverage.finalCaptionEvents}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
            {t("history.detail.extraction.speakers")}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {extractionReport.speakers.length > 0 ? (
              extractionReport.speakers.map((speaker) => (
                <span
                  key={speaker}
                  className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text)]"
                >
                  {speaker}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--app-text-muted)]">
                {t("history.detail.extraction.noSpeakers")}
              </span>
            )}
          </div>
        </div>

        {extractionReport.warnings.length > 0 && (
          <div className="mt-4 rounded-[1.5rem] border border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--app-danger)]">
              {t("history.detail.extraction.warnings")}
            </div>
            <div className="mt-3 space-y-2 text-sm text-[var(--app-danger)]">
              {extractionReport.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        )}
          </div>
        </AnimatedCollapse>
      </div>

      <div
        ref={summarySectionRef}
        className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--app-text)]">
                {t("history.detail.sections.summary.title")}
              </h2>
              <DependencyIndicator
                availability={openAiAvailability}
                label={t("history.detail.summary.openAiUnavailable")}
              />
            </div>
            <p className="mt-1 max-w-3xl text-sm text-[var(--app-text-muted)]">
              {t("history.detail.sections.summary.description")}
            </p>
          </div>
          <IconButton
            onClick={() => setSummaryExpanded((value) => !value)}
            icon={summaryExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            label={
              summaryExpanded
                ? t("history.detail.sections.summary.collapse")
                : t("history.detail.sections.summary.expand")
            }
            variant="soft"
            aria-expanded={summaryExpanded}
            aria-controls="meeting-summary-panel"
          />
        </div>

        <AnimatedCollapse open={summaryExpanded}>
          <div id="meeting-summary-panel" className="mt-5">
            {!openAiAvailability.operational && (
              <div className="mb-5 rounded-[1.5rem] border border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--app-text)]">
                    {t("history.detail.summary.unavailable")}
                  </p>
                  <StatusPill
                    label={
                      openAiAvailability.state === "unavailable"
                        ? t("history.dependency.actionRequired")
                        : t("history.dependency.needsVerification")
                    }
                    tone={
                      openAiAvailability.state === "unavailable"
                        ? "danger"
                        : "warning"
                    }
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                  {openAiAvailability.message}
                </p>
              </div>
            )}

            <ActionCard
              title={
                isSummarizing
                  ? t("history.detail.summary.generating")
                  : matchingSummaries.length > 0
                    ? t("history.detail.summary.generateAnother")
                    : t("history.detail.summary.generate")
              }
              subtitle={
                selectedProfile
                  ? t("history.detail.summary.generateWithProfile", {
                      profile: selectedProfile.name,
                    })
                  : t("history.detail.summary.selectMeetingType")
              }
              actionIcon={matchingSummaries.length > 0 ? <RefreshIcon /> : <SparklesIcon />}
              actionLabel={
                matchingSummaries.length > 0
                  ? t("history.detail.summary.generateAnotherAction", {
                      profile:
                        selectedProfile?.name ||
                        t("history.detail.summary.genericProfile"),
                    })
                  : t("history.detail.summary.generateAction", {
                      profile:
                        selectedProfile?.name ||
                        t("history.detail.summary.genericProfile"),
                    })
              }
              onAction={() =>
                selectedProfile &&
                onGenerateSummary(session.id, summaryLanguage, selectedProfile.id)
              }
              actionLoading={isSummarizing}
              actionDisabled={
                !selectedProfile || hasActiveSummaryJob || summaryActionsDisabled
              }
              language={summaryLanguage}
              onLanguageChange={setSummaryLanguage}
              languageOptions={LANGUAGE_OPTIONS.map((language) => ({
                id: language.code,
                name: language.name,
              }))}
              extraControl={
                <DropdownSelect
                  value={selectedProfileId}
                  onChange={(nextProfileId) => {
                    setSelectedProfileId(nextProfileId);
                  }}
                  options={summaryProfiles.map((profile) => ({
                    id: profile.id,
                    name: profile.name,
                    description: profile.description,
                    badgeLabel:
                      profile.id === session.summaryProfileId
                        ? t("history.detail.summary.version.session")
                        : profile.id === defaultSummaryProfileId
                          ? t("history.detail.summary.version.default")
                          : undefined,
                    badgeTone:
                      profile.id === session.summaryProfileId
                        ? "accent"
                        : profile.id === defaultSummaryProfileId
                          ? "neutral"
                          : undefined,
                  }))}
                  disabled={isSummarizing}
                  buttonClassName="rounded-full bg-[var(--app-surface)]"
                  menuClassName="w-[320px]"
                />
              }
              details={summaryActionDetails}
              className="mb-5"
            />

            {visibleSummary ? (
              <div className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                      {t("history.detail.summary.version.sessionProfile", {
                        name:
                          sessionProfile?.name ||
                          t("history.detail.summary.version.unknownProfile"),
                      })}
                    </span>
                    {visibleSummary.sourceSessionProfileId &&
                      visibleSummary.sourceSessionProfileId !== visibleSummary.profileId && (
                        <span className="rounded-full border border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] px-3 py-1 text-xs font-medium text-[var(--app-warning)]">
                          {t(
                            "history.detail.summary.version.generatedWithAnotherProfile"
                          )}
                        </span>
                      )}
                  </div>
                  {summaryVersionOptions.length > 1 && (
                    <div className="w-full sm:w-[320px]">
                      <DropdownSelect
                        value={visibleSummary.key}
                        onChange={setSelectedSummaryKey}
                        options={summaryVersionOptions}
                        buttonClassName="rounded-full bg-[var(--app-surface)]"
                        menuClassName="w-[320px]"
                      />
                    </div>
                  )}
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-faint)]">
                  <span>
                    {t("history.detail.summary.version.generatedAt", {
                      time: new Date(visibleSummary.generatedAt).toLocaleString(
                        locale
                      ),
                    })}
                  </span>
                  <span>•</span>
                  <span>{visibleSummary.profileName}</span>
                  <span>•</span>
                  <span>{visibleSummary.provider}</span>
                  <span>•</span>
                  <span>{visibleSummary.model}</span>
                  {visibleSummary.requestSource && (
                    <>
                      <span>•</span>
                      <span>
                        {visibleSummary.requestSource === "automatic"
                          ? t("history.detail.summary.version.automatic")
                          : t("history.detail.summary.version.manual")}
                      </span>
                    </>
                  )}
                  {formatSummaryGenerationMode(visibleSummary.generationMode, t) && (
                    <>
                      <span>•</span>
                      <span>
                        {formatSummaryGenerationMode(
                          visibleSummary.generationMode,
                          t
                        )}
                      </span>
                    </>
                  )}
                  {formatSummaryExecutionStrategy(
                    visibleSummary.executionStrategy,
                    t
                  ) && (
                    <>
                      <span>•</span>
                      <span>
                        {formatSummaryExecutionStrategy(
                          visibleSummary.executionStrategy,
                          t
                        )}
                      </span>
                    </>
                  )}
                </div>
                {(visibleSummary.evidenceChunkCount ||
                  visibleSummary.continuationCount ||
                  visibleSummary.reconciled) && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {typeof visibleSummary.evidenceChunkCount === "number" &&
                      visibleSummary.evidenceChunkCount > 0 && (
                        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                          {t("history.detail.summary.evidenceChunks", {
                            count: visibleSummary.evidenceChunkCount,
                          })}
                        </span>
                      )}
                    {typeof visibleSummary.continuationCount === "number" &&
                      visibleSummary.continuationCount > 0 && (
                        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                          {t("history.detail.summary.continuations", {
                            count: visibleSummary.continuationCount,
                          })}
                        </span>
                      )}
                    {visibleSummary.reconciled && (
                      <span className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
                        {t("history.detail.summary.reconciled")}
                      </span>
                    )}
                  </div>
                )}
                <div
                  dir={summaryDirection}
                  className="mc-app-textarea max-h-[34rem] overflow-y-auto px-2 py-1 text-sm text-[var(--app-text)]"
                  style={DYNAMIC_TEXT_STYLE}
                >
                  <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--app-text)_3%,transparent)]">
                    <div className="px-2 sm:px-3">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={SUMMARY_MARKDOWN_COMPONENTS}
                      >
                        {visibleSummary.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ) : isSummarizing ? (
              <div className="rounded-[1.75rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] px-6 py-12 text-center">
                <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-accent-border)] bg-[var(--app-surface)]">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--app-accent)] border-e-transparent" />
                </div>
                <p className="text-base font-medium text-[var(--app-text)]">
                  {t("history.detail.summary.inProgress")}
                </p>
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] px-6 py-10 text-center">
                <p className="text-base font-medium text-[var(--app-text)]">
                  {t("history.detail.summary.noSummaryYet", {
                    profile:
                      selectedProfile?.name ||
                      t("history.detail.summary.genericProfile"),
                    language: getLanguageName(summaryLanguage),
                  })}
                </p>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                  {t("history.detail.summary.noSummaryHint")}
                </p>
                {latestSavedSummary && (
                  <p className="mt-3 text-xs leading-relaxed text-[var(--app-text-faint)]">
                    {t("history.detail.summary.latestSaved", {
                      profile: latestSavedSummary.profileName,
                      language: getLanguageName(latestSavedSummary.language),
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </AnimatedCollapse>
      </div>

      <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
              {t("history.detail.sections.transcript.title")}
            </h2>
            <DependencyIndicator
              availability={openAiAvailability}
              label={t("history.detail.summary.openAiUnavailable")}
            />
          </div>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {t("history.detail.sections.transcript.description")}
          </p>
        </div>

        {!openAiAvailability.operational && (
          <div className="mb-5 rounded-[1.5rem] border border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[var(--app-text)]">
                {t("history.detail.transcript.savedCaptionTranslationUnavailable")}
              </p>
              <StatusPill
                label={
                  openAiAvailability.state === "unavailable"
                    ? t("history.dependency.actionRequired")
                    : t("history.dependency.needsVerification")
                }
                tone={
                  openAiAvailability.state === "unavailable"
                    ? "danger"
                    : "warning"
                }
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
              {openAiAvailability.message}
            </p>
          </div>
        )}

        {session.captions.length > 0 && (
          <ActionCard
            title={
              isTranslatingAllCaptions
                ? t("history.detail.transcript.translatingAllCaptions")
                : t("history.detail.transcript.translateAllCaptions")
            }
            subtitle={t("history.detail.transcript.batchTranslateSubtitle", {
              language: getLanguageName(bulkTranslationLanguage),
            })}
            actionIcon={<SparklesIcon />}
            actionLabel={t("history.detail.transcript.translateAllCaptionsTo", {
              language: getLanguageName(bulkTranslationLanguage),
            })}
            onAction={() =>
              onTranslateAllCaptions(session.id, bulkTranslationLanguage)
            }
            actionLoading={isTranslatingAllCaptions}
            actionDisabled={translationActionsDisabled}
            language={bulkTranslationLanguage}
            onLanguageChange={setBulkTranslationLanguage}
            languageOptions={LANGUAGE_OPTIONS.map((language) => ({
              id: language.code,
              name: language.name,
            }))}
            className="mb-5"
          />
        )}

        {timelineItems.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] px-6 py-14 text-center">
            <p className="text-base font-medium text-[var(--app-text)]">
              {t("history.detail.transcript.emptyTitle")}
            </p>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              {t("history.detail.transcript.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineEntries.map((entry, index) => {
              if (entry.kind === "separator") {
                return (
                  <div
                    key={`segment-${entry.segment.index}-${entry.segment.startTime}`}
                    className="flex items-center gap-3 py-1"
                  >
                    <div className="h-px flex-1 bg-[var(--app-border)]" />
                    <div className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-2 text-center">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-text-muted)]">
                        {t("content.sessionSeparator.title", {
                          index: entry.segment.index + 1,
                        })}
                      </div>
                      <div className="mt-1 text-xs text-[var(--app-text-faint)]">
                        {t("content.sessionSeparator.detail", {
                          time: formatSegmentResumeLabel(entry.segment, locale),
                          gap: formatGapDuration(entry.segment.gapMs, t),
                        })}
                      </div>
                    </div>
                    <div className="h-px flex-1 bg-[var(--app-border)]" />
                  </div>
                );
              }

              const item = entry.item;
              const assistantOutputs =
                assistantOutputsByTriggerKey.get(getTimelineItemKey(item)) || [];
              return (
                <article
                  key={`${item.source}-${item.timestamp}-${index}`}
                  className={`rounded-[1.75rem] border p-5 ${
                    item.source === "chat"
                      ? "border-[var(--app-accent-border)] bg-[color-mix(in_srgb,var(--app-accent-soft)_18%,var(--app-surface-soft))]"
                      : "border-[var(--app-border)] bg-[var(--app-surface-soft)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
                      {item.speaker}
                    </span>
                    <span className="text-xs text-[var(--app-text-faint)]">
                      {item.time}
                    </span>
                    <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                      +{getTimelineItemOffsetLabel(item.timestamp)}
                    </span>
                    {item.source === "chat" && (
                      <span className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
                        {t("history.detail.transcript.meetingChat")}
                      </span>
                    )}
                    {item.translation && (
                      <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                        {t("history.detail.transcript.translationAvailable")}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <section className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                        {item.source === "chat"
                          ? t("history.detail.transcript.message")
                          : t("history.detail.transcript.caption")}
                      </div>
                      {renderTimelineItemText(item)}
                    </section>

                    <section className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                        {t("history.detail.transcript.translation")}
                      </div>
                      {item.translation ? (
                        <p
                          className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--app-accent)]"
                          style={DYNAMIC_TEXT_STYLE}
                          dir={
                            item.translationLanguage
                              ? getLanguageDirection(item.translationLanguage)
                              : detectTextDirection(item.translation)
                          }
                        >
                          {item.translation}
                        </p>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm leading-relaxed text-[var(--app-text-faint)]">
                            {item.source === "chat"
                              ? t("history.detail.transcript.noChatTranslation")
                              : t("history.detail.transcript.noCaptionTranslation")}
                          </p>
                          <ActionCard
                            title={
                              translatingCaptionKey ===
                              `${session.id}:${item.source}:${item.timestamp}`
                                ? item.source === "chat"
                                  ? t("history.detail.transcript.translatingChatMessage")
                                  : t("history.detail.transcript.translatingCaption")
                                : item.source === "chat"
                                  ? t("history.detail.transcript.translateChatMessage")
                                  : t("history.detail.transcript.translateCaption")
                            }
                            subtitle={getLanguageName(
                              getItemTranslationLanguage(item.source, item.timestamp)
                            )}
                            actionIcon={<SparklesIcon />}
                            actionLabel={t("history.detail.transcript.translateThisItem", {
                              item:
                                item.source === "chat"
                                  ? t("history.detail.transcript.message")
                                  : t("history.detail.transcript.caption"),
                              language: getLanguageName(
                                getItemTranslationLanguage(
                                  item.source,
                                  item.timestamp
                                )
                              ),
                            })}
                            onAction={() =>
                              onTranslateCaption(
                                session.id,
                                item.timestamp,
                                getItemTranslationLanguage(
                                  item.source,
                                  item.timestamp
                                ),
                                item.source
                              )
                            }
                            actionLoading={
                              translatingCaptionKey ===
                              `${session.id}:${item.source}:${item.timestamp}`
                            }
                            actionDisabled={
                              translationActionsDisabled ||
                              (isTranslatingAllCaptions && item.source === "caption")
                            }
                            language={getItemTranslationLanguage(
                              item.source,
                              item.timestamp
                            )}
                            onLanguageChange={(value) =>
                              setItemTranslationLanguages((current) => ({
                                ...current,
                                [`${item.source}:${item.timestamp}`]: value,
                              }))
                            }
                            languageOptions={LANGUAGE_OPTIONS.map((language) => ({
                              id: language.code,
                              name: language.name,
                            }))}
                            className="mt-3"
                          />
                        </div>
                      )}
                    </section>
                  </div>

                  {assistantOutputs.length > 0 && (
                    <div className="mt-4 pl-3">
                      <div className="border-s-2 border-[var(--app-accent-border)] pl-4">
                        {assistantOutputs.map((output) => (
                          <section
                            key={output.id}
                            className="rounded-[1.35rem] border border-[var(--app-accent-border)] bg-[color-mix(in_srgb,var(--app-accent-soft)_24%,var(--app-surface))] p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--app-accent)_10%,transparent)]"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
                                {t("history.detail.transcript.aiAssistant")}
                              </span>
                              <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
                                {output.responseFormat === "talking_points"
                                  ? t("options.profiles.assistant.formats.talkingPoints.name")
                                  : output.responseFormat === "short_paragraph"
                                    ? t("options.profiles.assistant.formats.shortParagraph.name")
                                    : output.responseFormat === "structured_sections"
                                      ? t(
                                          "options.profiles.assistant.formats.structuredSections.name"
                                        )
                                      : output.responseFormat === "script"
                                        ? t("options.profiles.assistant.formats.script.name")
                                        : t("options.profiles.assistant.formats.bullets.name")}
                              </span>
                              <span className="text-xs text-[var(--app-text-faint)]">
                                {item.source === "chat"
                                  ? t("history.detail.transcript.triggeredByChat")
                                  : t("history.detail.transcript.triggeredByCaption")}
                              </span>
                            </div>

                            <div
                              className="mt-3 text-sm leading-relaxed text-[var(--app-text)]"
                              dir={detectTextDirection(output.content)}
                            >
                              {renderAssistantMarkdown(output.content)}
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
