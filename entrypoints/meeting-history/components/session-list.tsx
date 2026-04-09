import { useEffect, useMemo, useRef, useState } from "react";
import type { MeetingSession } from "./types";
import type { SummaryJobStatus } from "../../background/types";
import { useI18n, useT } from "../../shared/i18n";
import {
  getMeetingDisplayTitle,
  getMeetingIdentifierLabel,
  getPrimaryMeetingIdentifier,
  isDirectCallIdentifiers,
} from "../../shared/meeting-session";
import { detectTextDirection } from "../../shared/language-metadata";
import { sanitizeStoredRichTextHtml } from "../../shared/rich-text";
import { DYNAMIC_TEXT_STYLE } from "../../shared/text-direction";
import { IconButton } from "../../shared/icon-button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  OpenIcon,
  SpinnerIcon,
  StarIcon,
  TrashIcon,
} from "../../shared/icons";

const ITEMS_PER_PAGE = 20;

interface SessionListProps {
  sessions: MeetingSession[];
  summaryJobStatuses: Record<string, SummaryJobStatus>;
  onSelect: (sessionId: string) => void;
  onRequestDelete: (session: MeetingSession) => void;
  onToggleStar: (sessionId: string, starred: boolean) => void;
}

function isActiveSummaryJob(status?: SummaryJobStatus | null): boolean {
  return Boolean(
    status &&
      status.state !== "completed" &&
      status.state !== "failed" &&
      status.state !== "cancelled"
  );
}

const formatDateLabel = (
  timestamp: number,
  locale: string,
  t: ReturnType<typeof useT>
): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return t("history.sessionList.today");
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return t("history.sessionList.yesterday");
  }

  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

const formatTime = (timestamp: number, locale: string): string =>
  new Date(timestamp).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRelativeTime = (
  timestamp: number,
  locale: string,
  t: ReturnType<typeof useT>
): string => {
  const elapsedMs = timestamp - Date.now();
  const elapsedSeconds = Math.round(elapsedMs / 1000);
  const absoluteSeconds = Math.abs(elapsedSeconds);
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  });

  if (absoluteSeconds < 30) {
    return t("history.sessionList.justNow");
  }

  if (absoluteSeconds < 60 * 60) {
    return relativeTimeFormatter.format(
      Math.round(elapsedSeconds / 60),
      "minute"
    );
  }

  if (absoluteSeconds < 24 * 60 * 60) {
    return relativeTimeFormatter.format(
      Math.round(elapsedSeconds / (60 * 60)),
      "hour"
    );
  }

  if (absoluteSeconds < 7 * 24 * 60 * 60) {
    return relativeTimeFormatter.format(
      Math.round(elapsedSeconds / (24 * 60 * 60)),
      "day"
    );
  }

  if (absoluteSeconds < 30 * 24 * 60 * 60) {
    return relativeTimeFormatter.format(
      Math.round(elapsedSeconds / (7 * 24 * 60 * 60)),
      "week"
    );
  }

  if (absoluteSeconds < 365 * 24 * 60 * 60) {
    return relativeTimeFormatter.format(
      Math.round(elapsedSeconds / (30 * 24 * 60 * 60)),
      "month"
    );
  }

  return relativeTimeFormatter.format(
    Math.round(elapsedSeconds / (365 * 24 * 60 * 60)),
    "year"
  );
};

const formatDuration = (
  start: number,
  end: number | undefined,
  t: ReturnType<typeof useT>
): string => {
  if (!end) {
    return t("history.sessionList.inProgress");
  }

  const diff = Math.max(end - start, 0);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const groupByDate = (
  sessions: MeetingSession[],
  locale: string,
  t: ReturnType<typeof useT>
): Map<string, MeetingSession[]> => {
  const groups = new Map<string, MeetingSession[]>();

  for (const session of sessions) {
    const key = formatDateLabel(session.startTime, locale, t);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(session);
  }

  return groups;
};

function buildCaptionPreview(session: MeetingSession): string {
  const previewSource =
    session.derived?.previewCaptions?.length
      ? session.derived.previewCaptions
      : session.captions;
  const preview = previewSource
    .slice(0, 2)
    .map((caption) => `${caption.speaker}: ${caption.text}`)
    .join(" ");

  if (preview) {
    return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
  }
 
  return "";
}

function getChatPreviewMessages(
  session: MeetingSession
): MeetingSession["chatMessages"] {
  const chatPreviewSource =
    session.derived?.previewChatMessages?.length
      ? session.derived.previewChatMessages
      : session.chatMessages;

  return chatPreviewSource.slice(0, 2);
}

function buildSessionPreview(
  session: MeetingSession,
  t: ReturnType<typeof useT>
): string {
  const captionPreview = buildCaptionPreview(session);
  if (captionPreview) {
    return captionPreview;
  }

  const chatPreview = getChatPreviewMessages(session)
    .map((message) => `${message.speaker}: ${message.text}`)
    .join(" ");

  if (!chatPreview) {
    return t("history.sessionList.noPreview");
  }

  return chatPreview.length > 180 ? `${chatPreview.slice(0, 177)}...` : chatPreview;
}

function getIdentifierEntries(session: MeetingSession) {
  return Object.entries(session.identifiers)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      label: getMeetingIdentifierLabel(
        key as keyof MeetingSession["identifiers"]
      ),
      value: value as string,
    }));
}

function SessionTitle({
  session,
  onToggleStar,
}: {
  session: MeetingSession;
  onToggleStar: (sessionId: string, starred: boolean) => void;
}) {
  const t = useT();
  const displayTitle = getMeetingDisplayTitle(session);

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <h3
        className="min-w-0 text-lg font-semibold text-[var(--app-text)]"
        style={DYNAMIC_TEXT_STYLE}
      >
        {displayTitle}
      </h3>
    </div>
  );
}

function SessionCard({
  session,
  summaryJobStatus,
  onSelect,
  onRequestDelete,
  onToggleStar,
}: {
  session: MeetingSession;
  summaryJobStatus?: SummaryJobStatus | null;
  onSelect: (sessionId: string) => void;
  onRequestDelete: (session: MeetingSession) => void;
  onToggleStar: (sessionId: string, starred: boolean) => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const [showIdentifiers, setShowIdentifiers] = useState(false);
  const translatedCaptions =
    session.derived?.translatedCaptionCount ??
    session.captions.filter((caption) => Boolean(caption.translation)).length;
  const captionCount = session.derived?.captionCount ?? session.captions.length;
  const chatCount =
    session.derived?.chatMessageCount ?? session.chatMessages.length;
  const identifierEntries = getIdentifierEntries(session);
  const primaryIdentifier = getPrimaryMeetingIdentifier(session.identifiers);
  const identityLabel = isDirectCallIdentifiers(session.identifiers)
    ? t("history.sessionList.directCall")
    : primaryIdentifier;
  const preview = buildSessionPreview(session, t);
  const captionPreview = buildCaptionPreview(session);
  const previewChatMessages = captionPreview ? [] : getChatPreviewMessages(session);
  const hasActiveSummaryJob = isActiveSummaryJob(summaryJobStatus);
  const relativeSessionTime = formatRelativeTime(
    session.lastSeenAt || session.endTime || session.startTime,
    locale,
    t
  );
  const captionCountLabel = t(
    captionCount === 1
      ? "history.sessionList.captionCountOne"
      : "history.sessionList.captionCountOther",
    { count: captionCount }
  );
  const chatCountLabel = t(
    chatCount === 1
      ? "history.sessionList.chatCountOne"
      : "history.sessionList.chatCountOther",
    { count: chatCount }
  );

  return (
    <article
      className={`rounded-[2rem] border p-5 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl ${
        session.starred
          ? "border-[var(--app-accent-border)] bg-[linear-gradient(135deg,var(--app-accent-soft),var(--app-surface)_45%,var(--app-surface))]"
          : "border-[var(--app-border)] bg-[var(--app-surface)]"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <SessionTitle session={session} onToggleStar={onToggleStar} />
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => onSelect(session.id)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-4 text-sm font-medium text-[var(--app-accent)] transition-colors hover:bg-[var(--app-surface-strong)]"
          >
            <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">
              <OpenIcon />
            </span>
            <span>{t("history.sessionList.openDetails")}</span>
          </button>
          <IconButton
            onClick={() => onRequestDelete(session)}
            icon={<TrashIcon />}
            label={t("history.sessionList.deleteSession")}
            variant="danger"
            size="sm"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {hasActiveSummaryJob && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
            <span className="h-3.5 w-3.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:animate-spin">
              <SpinnerIcon />
            </span>
            <span>{t("history.sessionList.generatingSummary")}</span>
          </span>
        )}
        {session.starred && (
          <span className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
            {t("history.sessionList.starred")}
          </span>
        )}
        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
          {session.providerLabel}
        </span>
        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
          {captionCountLabel}
        </span>
        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
          {translatedCaptions > 0
            ? t("history.sessionList.translatedCount", {
                count: translatedCaptions,
              })
            : t("history.sessionList.translatedOriginalOnly")}
        </span>
        {chatCount > 0 && (
          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
            {chatCountLabel}
          </span>
        )}
        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]">
          {formatDuration(session.startTime, session.endTime, t)}
        </span>
      </div>

      {previewChatMessages.length > 0 ? (
        <div className="mt-4 space-y-3">
          {previewChatMessages.map((message, index) => {
            const sanitizedHtml = sanitizeStoredRichTextHtml(message.formattedHtml);
            const textDirection = detectTextDirection(message.text);

            return (
              <div
                key={`${message.eventId || message.providerEventId || message.timestamp}:${index}`}
                className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-accent)]">
                  {message.speaker}
                </div>
                {sanitizedHtml ? (
                  <div
                    className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--app-text-muted)] [&_a]:text-[var(--app-accent)] [&_a]:underline [&_a]:underline-offset-2 [&_em]:italic [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:font-semibold [&_u]:underline [&_ul]:list-disc [&_ul]:ps-5"
                    style={DYNAMIC_TEXT_STYLE}
                    dir={textDirection}
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]"
                    style={DYNAMIC_TEXT_STYLE}
                    dir={textDirection}
                  >
                    {message.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p
          className="mt-4 text-sm leading-relaxed text-[var(--app-text-muted)]"
          style={DYNAMIC_TEXT_STYLE}
          dir={detectTextDirection(preview)}
        >
          {preview}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--app-text-muted)] md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2.5 py-1 text-xs font-medium text-[var(--app-text-faint)]">
            {relativeSessionTime}
          </span>
          <span>{formatDateLabel(session.startTime, locale, t)}</span>
          <span className="text-[var(--app-text-faint)]">•</span>
          <span>
            {formatTime(session.startTime, locale)}
            {session.endTime ? ` - ${formatTime(session.endTime, locale)}` : ""}
          </span>
          {identityLabel ? (
            <>
              <span className="text-[var(--app-text-faint)]">•</span>
              <span style={DYNAMIC_TEXT_STYLE}>{identityLabel}</span>
            </>
          ) : null}
        </div>
        {identifierEntries.length > 1 && (
          <IconButton
            onClick={() => setShowIdentifiers((value) => !value)}
            icon={showIdentifiers ? <ChevronUpIcon /> : <ChevronDownIcon />}
            label={
              showIdentifiers
                ? t("history.sessionList.hideIdentifiers")
                : t("history.sessionList.showIdentifiers")
            }
            size="sm"
          />
        )}
      </div>

      {showIdentifiers && identifierEntries.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {identifierEntries.map((entry) => (
            <span
              key={entry.label}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-2 text-xs text-[var(--app-text-muted)]"
              style={DYNAMIC_TEXT_STYLE}
            >
              {entry.label}: {entry.value}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function SessionList({
  sessions,
  summaryJobStatuses,
  onSelect,
  onRequestDelete,
  onToggleStar,
}: SessionListProps) {
  const t = useT();
  const { locale } = useI18n();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [sessions]);

  const visibleSessions = useMemo(
    () => sessions.slice(0, visibleCount),
    [sessions, visibleCount]
  );
  const hasMore = visibleCount < sessions.length;
  const groupedSessions = useMemo(
    () => groupByDate(visibleSessions, locale, t),
    [locale, t, visibleSessions]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + ITEMS_PER_PAGE, sessions.length)
          );
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, sessions.length]);

  return (
    <div className="space-y-8">
      {Array.from(groupedSessions.entries()).map(([dateLabel, grouped]) => (
        <section key={dateLabel}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
              {dateLabel}
            </h2>
            <div className="h-px flex-1 bg-[var(--app-border)]" />
          </div>

          <div className="space-y-4">
            {grouped.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                summaryJobStatus={summaryJobStatuses[session.id]}
                onSelect={onSelect}
                onRequestDelete={onRequestDelete}
                onToggleStar={onToggleStar}
              />
            ))}
          </div>
        </section>
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <span className="text-sm text-[var(--app-text-faint)]">
            {t("history.sessionList.loadingMore")}
          </span>
        </div>
      )}
    </div>
  );
}
