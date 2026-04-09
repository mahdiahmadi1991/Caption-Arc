import { useMemo } from "react";
import type { MeetingSession } from "./types";
import {
  createMeetingSessionExtractionReport,
  type MeetingSessionExtractionReport,
  formatSessionOffset,
  getMeetingDisplayTitle,
  getMeetingIdentifierLabel,
  getMeetingSessionTimelineSegmentForTimestamp,
  getPrimaryMeetingIdentifier,
  isDirectCallIdentifiers,
  getSegmentedSessionOffsetMs,
} from "../../shared/meeting-session";
import { useI18n, useT, type UiTranslator } from "../../shared/i18n";

export type MarkdownExportOptions = {
  includeTranslations: boolean;
  includeSummaries: boolean;
};

type SessionDetailMetadataRow = {
  label: string;
  value: string;
  href?: string;
};

export const formatDateTime = (timestamp: number, locale: string): string =>
  new Date(timestamp).toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatTime = (timestamp: number, locale: string): string =>
  new Date(timestamp).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

function formatDurationLabel(
  hours: number,
  minutes: number,
  t?: UiTranslator
): string {
  if (!t) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return minutes > 0
    ? t("history.detail.durationShort.hoursMinutes", { hours, minutes })
    : t("history.detail.durationShort.hours", { count: hours });
}

export const formatDuration = (
  start: number,
  end?: number,
  t?: UiTranslator
): string | null => {
  if (!end) {
    return null;
  }

  const diff = Math.max(end - start, 0);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return t
      ? t("history.detail.durationShort.minutes", { count: minutes })
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return formatDurationLabel(hours, remainingMinutes, t);
};

export const formatGapDuration = (gapMs: number, t?: UiTranslator): string => {
  const totalSeconds = Math.max(0, Math.floor(gapMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return formatDurationLabel(hours, minutes, t);
  }

  if (minutes > 0) {
    if (!t) {
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }

    return seconds > 0
      ? t("history.detail.durationShort.minutesSeconds", {
          minutes,
          seconds,
        })
      : t("history.detail.durationShort.minutes", { count: minutes });
  }

  return t
    ? t("history.detail.durationShort.seconds", { count: seconds })
    : `${seconds}s`;
};

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function translateIdentifierLabel(label: string, t: UiTranslator): string {
  switch (label) {
    case "Meeting Code":
      return t("history.detail.metadataLabels.meetingCode");
    case "Meeting ID":
      return t("history.detail.metadataLabels.meetingId");
    case "Conference ID":
      return t("history.detail.metadataLabels.conferenceId");
    case "Meeting Number":
      return t("history.detail.metadataLabels.meetingNumber");
    case "Thread ID":
      return t("history.detail.metadataLabels.threadId");
    case "Call Type":
      return t("history.detail.metadataLabels.callType");
    default:
      return label;
  }
}

function getSessionStatusLabel(
  lifecycleState: string | undefined,
  hasEnded: boolean,
  t: UiTranslator
): string {
  if (lifecycleState === "ended" || hasEnded) {
    return t("history.detail.status.ended");
  }

  if (lifecycleState === "live") {
    return t("history.detail.status.live");
  }

  return lifecycleState || t("history.detail.inProgress");
}

function formatSummaryGenerationMode(
  value: string | undefined,
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

function buildMarkdownExport(
  session: MeetingSession,
  options: MarkdownExportOptions,
  t: UiTranslator,
  locale: string
): string {
  const title = getMeetingDisplayTitle(session);
  const duration = formatDuration(session.startTime, session.endTime, t);
  const summaries = Object.values(session.summaries || {}).sort(
    (left, right) => right.generatedAt - left.generatedAt
  );
  const translatedItemCount = [...session.captions, ...session.chatMessages].filter(
    (item) => Boolean(item.translation?.trim())
  ).length;
  const rejoinHistory = [...(session.rejoinHistory || [])].sort(
    (left, right) => left.resumedAt - right.resumedAt
  );
  const totalRejoinGapMs = rejoinHistory.reduce(
    (sum, entry) => sum + entry.gapMs,
    0
  );
  const identifierEntries = Object.entries(session.identifiers).filter(([, value]) =>
    Boolean(value)
  );
  const timeline = [
    ...session.captions.map((caption) => ({
      ...caption,
      source: "caption" as const,
    })),
    ...session.chatMessages.map((message) => ({
      ...message,
      source: "chat" as const,
    })),
  ].sort((left, right) => left.timestamp - right.timestamp);
  const lines = [
    `# ${title}`,
    "",
    `## ${t("history.detail.export.sessionDetailsHeading")}`,
    "",
    `- ${t("history.detail.export.titleLabel")}: ${title}`,
    `- ${t("history.detail.export.providerLabel")}: ${session.providerLabel}`,
    `- ${t("history.detail.export.startedLabel")}: ${formatDateTime(session.startTime, locale)}`,
  ];

  const primaryIdentifier = getPrimaryMeetingIdentifier(session.identifiers);
  if (primaryIdentifier) {
    lines.push(`- ${t("history.detail.export.primaryIdLabel")}: ${primaryIdentifier}`);
  }

  if (session.endTime) {
    lines.push(`- ${t("history.detail.export.endedLabel")}: ${formatDateTime(session.endTime, locale)}`);
  }

  if (duration) {
    lines.push(`- ${t("history.detail.export.durationLabel")}: ${duration}`);
  }

  lines.push(
    `- ${t("history.detail.export.statusLabel")}: ${getSessionStatusLabel(
      session.lifecycleState,
      Boolean(session.endTime),
      t
    )}`
  );
  lines.push(
    `- ${t("history.detail.stats.capturedCaptions")}: ${session.captions.length}`
  );
  lines.push(
    `- ${t("history.detail.export.capturedChatMessagesLabel")}: ${session.chatMessages.length}`
  );
  lines.push(
    `- ${t("history.detail.export.savedTranslationsLabel")}: ${translatedItemCount}`
  );
  if (rejoinHistory.length > 0) {
    lines.push(`- ${t("history.detail.stats.rejoins")}: ${rejoinHistory.length}`);
    lines.push(
      `- ${t("history.detail.export.totalAwayBeforeRejoinsLabel")}: ${formatGapDuration(totalRejoinGapMs, t)}`
    );
  }

  if (identifierEntries.length > 1) {
    for (const [key, value] of identifierEntries) {
      if (key === "meetingCode") {
        continue;
      }

      lines.push(
        `- ${translateIdentifierLabel(
          getMeetingIdentifierLabel(key as keyof typeof session.identifiers),
          t
        )}: ${value}`
      );
    }
  }

  if (session.meetingUrl) {
    lines.push(`- ${t("history.detail.metadataLabels.meetingUrl")}: ${session.meetingUrl}`);
  }

  if (options.includeSummaries && summaries.length > 0) {
    lines.push("", `## ${t("history.detail.export.savedSummariesHeading")}`, "");

    summaries.forEach((summary) => {
      lines.push(`### ${summary.profileName} · ${summary.language}`);
      lines.push("");
      lines.push(`- ${t("history.detail.export.generatedLabel")}: ${formatDateTime(summary.generatedAt, locale)}`);
      lines.push(`- ${t("history.detail.export.providerLabel")}: ${summary.provider}`);
      lines.push(`- ${t("history.detail.export.modelLabel")}: ${summary.model}`);
      const generationModeLabel = formatSummaryGenerationMode(
        summary.generationMode,
        t
      );
      if (generationModeLabel) {
        lines.push(`- ${t("history.detail.export.summaryEffortLabel")}: ${generationModeLabel}`);
      }
      const executionStrategyLabel = formatSummaryExecutionStrategy(
        summary.executionStrategy,
        t
      );
      if (executionStrategyLabel) {
        lines.push(`- ${t("history.detail.export.executionStrategyLabel")}: ${executionStrategyLabel}`);
      }
      if (typeof summary.evidenceChunkCount === "number") {
        lines.push(`- ${t("history.detail.export.evidenceChunksLabel")}: ${summary.evidenceChunkCount}`);
      }
      if (typeof summary.continuationCount === "number") {
        lines.push(`- ${t("history.detail.export.continuationsLabel")}: ${summary.continuationCount}`);
      }
      if (summary.reconciled) {
        lines.push(`- ${t("history.detail.export.reconciledLabel")}: ${t("history.detail.export.yes")}`);
      }
      lines.push(`- ${t("history.detail.export.coveredCaptionsLabel")}: ${summary.captionCount}`);
      lines.push("");
      lines.push(summary.content);
      lines.push("");
    });
  }

  if (rejoinHistory.length > 0) {
    lines.push("", `## ${t("history.detail.export.sessionContinuationsHeading")}`, "");

    rejoinHistory.forEach((entry, index) => {
      lines.push(`### ${t("history.detail.rejoin.label", { index: index + 1 })}`);
      lines.push("");
      lines.push(`- ${t("history.detail.export.leftAtLabel")}: ${formatDateTime(entry.previousEndTime, locale)}`);
      lines.push(`- ${t("history.detail.export.rejoinedAtLabel")}: ${formatDateTime(entry.resumedAt, locale)}`);
      lines.push(`- ${t("history.detail.export.awayForLabel")}: ${formatGapDuration(entry.gapMs, t)}`);
      lines.push("");
    });
  }

  lines.push("", `## ${t("history.detail.sections.transcript.title")}`, "");

  let previousSegmentIndex: number | null = null;
  for (const item of timeline) {
    const segment = getMeetingSessionTimelineSegmentForTimestamp(
      item.timestamp,
      session.startTime,
      session.rejoinHistory || [],
      session.endTime
    );
    if (segment.index > 0 && segment.index !== previousSegmentIndex) {
      lines.push(
        `### ${t("history.detail.export.sessionResumeHeading", {
          index: segment.index + 1,
          time: formatDateTime(segment.startTime, locale),
          gap: formatGapDuration(segment.gapMs, t),
        })}`
      );
      lines.push("");
    }

    const sessionOffset = formatSessionOffset(
      getSegmentedSessionOffsetMs(
        session.startTime,
        session.rejoinHistory || [],
        item.timestamp,
        session.endTime
      )
    );
    lines.push(
      `### ${item.speaker} · ${item.time} · +${sessionOffset}${
        item.source === "chat"
          ? ` · ${t("history.detail.transcript.meetingChat")}`
          : ""
      }`
    );
    lines.push("");
    lines.push(item.text);
    lines.push("");

    if (options.includeTranslations && item.translation) {
      lines.push(`> ${t("history.detail.transcript.translation")}`);
      lines.push(">");
      lines.push(`> ${item.translation}`);
      lines.push("");
    }

    previousSegmentIndex = segment.index;
  }

  return lines.join("\n");
}

export function useSessionDetail(session: MeetingSession) {
  const { locale } = useI18n();
  const t = useT();
  const hasTranslations = useMemo(
    () =>
      [...session.captions, ...session.chatMessages].some((item) =>
        Boolean(item.translation?.trim())
      ),
    [session.captions, session.chatMessages]
  );
  const hasSummaries = useMemo(
    () => Object.keys(session.summaries || {}).length > 0,
    [session.summaries]
  );

  const translatedCaptionCount = useMemo(
    () =>
      session.captions.filter((caption) => Boolean(caption.translation)).length,
    [session.captions]
  );
  const chatMessageCount = session.chatMessages.length;

  const displayTitle = getMeetingDisplayTitle(session);
  const displayIdentifier = getPrimaryMeetingIdentifier(session.identifiers);
  const isDirectCall = isDirectCallIdentifiers(session.identifiers);
  const identifierEntries = Object.entries(session.identifiers)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      key,
      label: getMeetingIdentifierLabel(
        key as keyof typeof session.identifiers
      ),
      value: value as string,
    }));

  const formattedStartTime = formatDateTime(session.startTime, locale);
  const formattedEndTime = session.endTime
    ? formatDateTime(session.endTime, locale)
    : null;
  const formattedDuration = formatDuration(session.startTime, session.endTime, t);
  const rejoinHistory = [...(session.rejoinHistory || [])].sort(
    (left, right) => left.resumedAt - right.resumedAt
  );
  const totalRejoinGapMs = rejoinHistory.reduce(
    (sum, entry) => sum + entry.gapMs,
    0
  );

  const metadataRows: SessionDetailMetadataRow[] = [
    { label: t("history.detail.metadataLabels.provider"), value: session.providerLabel },
    {
      label: isDirectCall
        ? t("history.detail.metadataLabels.callTitle")
        : t("history.detail.metadataLabels.meetingTitle"),
      value: displayTitle,
    },
    {
      label: t("history.detail.metadataLabels.meetingUrl"),
      value: session.meetingUrl,
      href: session.meetingUrl,
    },
    { label: t("history.detail.metadataLabels.started"), value: formattedStartTime },
    ...(formattedEndTime
      ? [{ label: t("history.detail.metadataLabels.ended"), value: formattedEndTime }]
      : []),
    ...(formattedDuration
      ? [{ label: t("history.detail.stats.duration"), value: formattedDuration }]
      : [
          {
            label: t("history.detail.metadataLabels.status"),
            value: getSessionStatusLabel(
              session.lifecycleState,
              Boolean(session.endTime),
              t
            ),
          },
        ]),
    { label: t("history.detail.stats.capturedCaptions"), value: String(session.captions.length) },
    {
      label: t("history.detail.export.capturedChatMessagesLabel"),
      value: String(chatMessageCount),
    },
    {
      label: t("history.detail.stats.translatedCaptions"),
      value: String(translatedCaptionCount),
    },
    ...(rejoinHistory.length > 0
      ? [
          { label: t("history.detail.stats.rejoins"), value: String(rejoinHistory.length) },
          {
            label: t("history.detail.stats.totalAwayTime"),
            value: formatGapDuration(totalRejoinGapMs, t),
          },
        ]
      : []),
    ...(displayIdentifier
      ? [{ label: t("history.detail.metadataLabels.primaryId"), value: displayIdentifier }]
      : []),
    ...identifierEntries.map((entry) => ({
      label: translateIdentifierLabel(entry.label, t),
      value: entry.value,
    })),
  ].filter((row) => Boolean(row.value));
  const extractionReport: MeetingSessionExtractionReport = useMemo(
    () => createMeetingSessionExtractionReport(session),
    [session]
  );
  const exportMarkdownTranscript = (options: MarkdownExportOptions) => {
    const date = new Date(session.startTime).toISOString().slice(0, 10);
    const baseName = sanitizeFilenamePart(
      displayTitle || displayIdentifier || "meeting_session"
    );

    downloadFile(
      buildMarkdownExport(session, options, t, locale),
      `${baseName}_${date}_transcript.md`,
      "text/markdown"
    );
  };

  return {
    hasTranslations,
    hasSummaries,
    chatMessageCount,
    translatedCaptionCount,
    displayTitle,
    displayIdentifier,
    metadataRows,
    formattedDuration,
    extractionReport,
    exportMarkdownTranscript,
  };
}
