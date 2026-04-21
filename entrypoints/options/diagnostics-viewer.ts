import {
  DIAGNOSTICS_LEVELS,
  summarizeDiagnosticsLevels,
  type DiagnosticsConfig,
  type DiagnosticsEvent,
  type DiagnosticsLevel,
  type DiagnosticsSnapshot,
} from "../shared/diagnostics";
import type { UiTranslator } from "../shared/i18n";

export const DIAGNOSTICS_VIEWER_EVENT_LIMIT = 250;
export const DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS = 1500;
const DIAGNOSTICS_VIEWER_SCROLL_THRESHOLD_PX = 28;

export const DIAGNOSTICS_VIEWER_ALL_LEVELS = [
  ...DIAGNOSTICS_LEVELS,
] as readonly DiagnosticsLevel[];

export type DiagnosticsViewerLevelFilter = readonly DiagnosticsLevel[];
export type DiagnosticsViewerLevelOption = "all" | DiagnosticsLevel;

export type DiagnosticsViewerStatus = {
  label: string;
  tone: "neutral" | "accent" | "warning" | "danger";
  description: string;
};

export type DiagnosticsEventDescription = {
  title: string;
  summary: string;
  rawMessage: string;
};

export type DiagnosticsPayloadFingerprintInput = {
  config: DiagnosticsConfig;
  events: DiagnosticsEvent[];
  counts: Record<DiagnosticsLevel, number>;
  resolvedSnapshot: DiagnosticsSnapshot | null;
  snapshotCount: number;
};

const DIAGNOSTICS_ACRONYMS = new Set([
  "api",
  "url",
  "ui",
  "ai",
  "cdp",
  "http",
  "json",
]);

const DIAGNOSTICS_DESCRIPTION_REGISTRY: ReadonlyArray<{
  matches: (event: DiagnosticsEvent) => boolean;
  describe: (event: DiagnosticsEvent) => Omit<DiagnosticsEventDescription, "rawMessage">;
}> = [
  {
    matches: (event) => event.message === "options_cloud_sync_load_completed",
    describe: () => ({
      title: "Cloud sync settings loaded",
      summary:
        "The options page finished loading the current cloud sync configuration for this session.",
    }),
  },
  {
    matches: (event) => event.message === "options_cloud_sync_load_failed",
    describe: () => ({
      title: "Cloud sync settings failed to load",
      summary:
        "The options page could not load the current cloud sync configuration for this session.",
    }),
  },
  {
    matches: (event) => event.message === "options_settings_load_completed",
    describe: () => ({
      title: "Saved settings loaded",
      summary:
        "The options page finished loading the saved settings needed for this session.",
    }),
  },
  {
    matches: (event) => event.message === "options_settings_load_failed",
    describe: () => ({
      title: "Saved settings failed to load",
      summary:
        "The options page could not load the saved settings needed for this session.",
    }),
  },
  {
    matches: (event) => event.message === "message_completed",
    describe: (event) => {
      const action = getDiagnosticsActionLabel(event);
      return {
        title: "Background message completed",
        summary: action
          ? `The background runtime finished handling the ${action} message without reporting an error.`
          : "The background runtime finished handling a message without reporting an error.",
      };
    },
  },
  {
    matches: (event) => event.message === "message_handler_failed",
    describe: (event) => {
      const action = getDiagnosticsActionLabel(event);
      return {
        title: "Background message failed",
        summary: action
          ? `The background runtime reported an error while handling the ${action} message.`
          : "The background runtime reported an error while handling a message.",
      };
    },
  },
  {
    matches: (event) => event.message === "translation_failed",
    describe: () => ({
      title: "Translation request failed",
      summary:
        "The background translation pipeline could not finish the current translation request.",
    }),
  },
  {
    matches: (event) => event.message === "assistant_generation_failed",
    describe: () => ({
      title: "Live assistant response failed",
      summary:
        "The background assistant pipeline could not finish generating a response for the current request.",
    }),
  },
];

export function getDiagnosticsViewerStatus(options: {
  viewerEnabled: boolean;
  config: DiagnosticsConfig | null;
  drawerOpen: boolean;
  pageVisible: boolean;
  hasError: boolean;
  t?: UiTranslator;
}): DiagnosticsViewerStatus {
  const translate = (key: Parameters<UiTranslator>[0], fallback: string): string => {
    return options.t ? options.t(key) : fallback;
  };

  if (!options.viewerEnabled) {
    return {
      label: translate("options.diagnostics.status.unavailableLabel", "Unavailable"),
      tone: "neutral",
      description: translate(
        "options.diagnostics.status.unavailableDescription",
        "Diagnostics viewer is not enabled for this environment."
      ),
    };
  }

  if (options.hasError) {
    return {
      label: translate("options.diagnostics.status.syncIssueLabel", "Sync issue"),
      tone: "danger",
      description: translate(
        "options.diagnostics.status.syncIssueDescription",
        "The viewer could not refresh diagnostics from the runtime."
      ),
    };
  }

  if (!options.config) {
    return {
      label: translate("options.diagnostics.status.connectingLabel", "Connecting"),
      tone: "neutral",
      description: translate(
        "options.diagnostics.status.connectingDescription",
        "The viewer is loading the current diagnostics configuration."
      ),
    };
  }

  if (!options.config?.enabled) {
    return {
      label: translate("options.diagnostics.status.sessionOffLabel", "Session off"),
      tone: "warning",
      description: translate(
        "options.diagnostics.status.sessionOffDescription",
        "Diagnostics capture is currently disabled for this session. Existing captured events remain visible."
      ),
    };
  }

  if (options.drawerOpen && !options.pageVisible) {
    return {
      label: translate("options.diagnostics.status.pausedLabel", "Paused"),
      tone: "neutral",
      description: translate(
        "options.diagnostics.status.pausedDescription",
        "Polling pauses while the options tab is hidden and resumes when it becomes visible again."
      ),
    };
  }

  if (options.drawerOpen) {
    return {
      label: translate("options.diagnostics.status.liveLabel", "Live"),
      tone: "accent",
      description: translate(
        "options.diagnostics.status.liveDescription",
        "The viewer is polling the latest canonical diagnostics payload."
      ),
    };
  }

  return {
    label: translate("options.diagnostics.status.readyLabel", "Ready"),
    tone: "neutral",
    description: translate(
      "options.diagnostics.status.readyDescription",
      "Open the drawer to inspect the latest canonical diagnostics."
    ),
  };
}

export function getDiagnosticsSessionEnableLevel(
  config: DiagnosticsConfig
): DiagnosticsLevel {
  const environmentLevel = config.environmentLevels[config.environment];
  return environmentLevel === "off" ? "info" : environmentLevel;
}

export function createDiagnosticsConfigFingerprint(
  config: DiagnosticsConfig
): string {
  return JSON.stringify({
    environment: config.environment,
    environmentLevels: config.environmentLevels,
    overrideMinLevel: config.overrideMinLevel,
    enabled: config.enabled,
    minLevel: config.minLevel,
    maxEvents: config.maxEvents,
  });
}

export function createDiagnosticsPayloadFingerprint(
  input: DiagnosticsPayloadFingerprintInput
): string {
  return JSON.stringify({
    config: createDiagnosticsConfigFingerprint(input.config),
    counts: input.counts,
    events: input.events.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
    })),
    resolvedSnapshot: input.resolvedSnapshot
      ? {
          key: input.resolvedSnapshot.key,
          baseKey: input.resolvedSnapshot.baseKey,
          updatedAt: input.resolvedSnapshot.updatedAt,
          runtime: input.resolvedSnapshot.runtime,
          provider: input.resolvedSnapshot.provider || null,
        }
      : null,
    snapshotCount: input.snapshotCount,
  });
}

export function hasDiagnosticsPayloadChanged(
  previousFingerprint: string | null,
  input: DiagnosticsPayloadFingerprintInput
): boolean {
  return createDiagnosticsPayloadFingerprint(input) !== previousFingerprint;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeDiagnosticsViewerLevelFilter(
  levelFilter?: Iterable<DiagnosticsLevel> | null
): DiagnosticsViewerLevelFilter {
  const requestedLevels = new Set(levelFilter || []);
  const normalizedLevels = DIAGNOSTICS_LEVELS.filter((level) =>
    requestedLevels.has(level)
  );

  return normalizedLevels.length > 0
    ? normalizedLevels
    : DIAGNOSTICS_VIEWER_ALL_LEVELS;
}

function humanizeDiagnosticsLabelForSentence(value: string): string {
  return humanizeDiagnosticsMessage(value).toLowerCase();
}

function getDiagnosticsActionLabel(event: DiagnosticsEvent): string | null {
  const action = event.data?.action;
  return typeof action === "string" && action.trim().length > 0
    ? humanizeDiagnosticsLabelForSentence(action)
    : null;
}

function getDiagnosticsMessageState(message: string):
  | "started"
  | "completed"
  | "failed"
  | "succeeded"
  | "requested"
  | "changed"
  | "recorded"
  | null {
  if (message.endsWith("_started")) {
    return "started";
  }

  if (message.endsWith("_completed")) {
    return "completed";
  }

  if (message.endsWith("_failed")) {
    return "failed";
  }

  if (message.endsWith("_succeeded")) {
    return "succeeded";
  }

  if (message.endsWith("_requested")) {
    return "requested";
  }

  if (message.endsWith("_changed")) {
    return "changed";
  }

  if (message.endsWith("_recorded")) {
    return "recorded";
  }

  return null;
}

function getDiagnosticsFallbackSummary(event: DiagnosticsEvent): string {
  const featureLabel = humanizeDiagnosticsLabelForSentence(event.feature);
  const domainLabel = humanizeDiagnosticsLabelForSentence(event.domain);
  const runtimeLabel = humanizeDiagnosticsLabelForSentence(event.runtime);
  const providerClause = event.provider
    ? ` for the ${humanizeDiagnosticsLabelForSentence(event.provider)} provider`
    : "";
  const messageState = getDiagnosticsMessageState(event.message);

  if (messageState === "completed" || messageState === "succeeded") {
    return `The ${runtimeLabel} runtime finished work in the ${featureLabel} feature for the ${domainLabel} domain${providerClause} without reporting an error.`;
  }

  if (messageState === "failed") {
    return `The ${runtimeLabel} runtime reported a failure in the ${featureLabel} feature for the ${domainLabel} domain${providerClause}.`;
  }

  if (messageState === "started") {
    return `The ${runtimeLabel} runtime started work in the ${featureLabel} feature for the ${domainLabel} domain${providerClause}.`;
  }

  if (messageState === "requested") {
    return `The ${runtimeLabel} runtime recorded a request in the ${featureLabel} feature for the ${domainLabel} domain${providerClause}.`;
  }

  if (messageState === "changed") {
    return `The ${runtimeLabel} runtime recorded a state change in the ${featureLabel} feature for the ${domainLabel} domain${providerClause}.`;
  }

  return `A diagnostics event was recorded in the ${featureLabel} feature for the ${domainLabel} domain in the ${runtimeLabel} runtime${providerClause}.`;
}

export function humanizeDiagnosticsMessage(message: string): string {
  const collapsed = message.trim().replace(/\s+/g, " ");

  if (!collapsed) {
    return "";
  }

  if (collapsed.includes(" ") && !/[._-]/.test(collapsed)) {
    return collapsed;
  }

  const normalized = collapsed
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return collapsed;
  }

  const words = normalized.split(" ");
  return words
    .map((word, index) => {
      const lowerWord = word.toLowerCase();

      if (DIAGNOSTICS_ACRONYMS.has(lowerWord)) {
        return lowerWord.toUpperCase();
      }

      if (/^\d+$/.test(word)) {
        return word;
      }

      if (index === 0) {
        return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
      }

      return lowerWord;
    })
    .join(" ");
}

export function describeDiagnosticsEvent(
  event: DiagnosticsEvent
): DiagnosticsEventDescription {
  const matchedDescription = DIAGNOSTICS_DESCRIPTION_REGISTRY.find((entry) =>
    entry.matches(event)
  );

  if (matchedDescription) {
    return {
      ...matchedDescription.describe(event),
      rawMessage: event.message,
    };
  }

  return {
    title: humanizeDiagnosticsMessage(event.message),
    summary: getDiagnosticsFallbackSummary(event),
    rawMessage: event.message,
  };
}

export function getDiagnosticsViewerDefaultLevelFilter(): DiagnosticsViewerLevelFilter {
  return DIAGNOSTICS_VIEWER_ALL_LEVELS;
}

export function isDiagnosticsViewerLevelSelected(
  levelFilter: DiagnosticsViewerLevelFilter,
  level: DiagnosticsLevel
): boolean {
  return normalizeDiagnosticsViewerLevelFilter(levelFilter).includes(level);
}

export function areAllDiagnosticsViewerLevelsSelected(
  levelFilter: DiagnosticsViewerLevelFilter
): boolean {
  return (
    normalizeDiagnosticsViewerLevelFilter(levelFilter).length ===
    DIAGNOSTICS_VIEWER_ALL_LEVELS.length
  );
}

export function selectAllDiagnosticsViewerLevels(): DiagnosticsViewerLevelFilter {
  return DIAGNOSTICS_VIEWER_ALL_LEVELS;
}

export function toggleDiagnosticsViewerLevel(
  levelFilter: DiagnosticsViewerLevelFilter,
  level: DiagnosticsLevel
): DiagnosticsViewerLevelFilter {
  const normalizedLevels = normalizeDiagnosticsViewerLevelFilter(levelFilter);

  if (normalizedLevels.includes(level)) {
    return normalizedLevels.length === 1
      ? normalizedLevels
      : normalizedLevels.filter((entry) => entry !== level);
  }

  const nextLevels = new Set(normalizedLevels);
  nextLevels.add(level);
  return DIAGNOSTICS_LEVELS.filter((entry) => nextLevels.has(entry));
}

function buildDiagnosticsSearchText(event: DiagnosticsEvent): string {
  const description = describeDiagnosticsEvent(event);

  return [
    event.message,
    humanizeDiagnosticsMessage(event.message),
    description.title,
    description.summary,
    event.domain,
    event.feature,
    event.provider,
    event.runtime,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

export function matchesDiagnosticsViewerSearch(
  event: DiagnosticsEvent,
  searchTerm: string
): boolean {
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  if (!normalizedSearchTerm) {
    return true;
  }

  return buildDiagnosticsSearchText(event).includes(normalizedSearchTerm);
}

export function filterDiagnosticsViewerEvents(
  events: DiagnosticsEvent[],
  options: {
    levelFilter?: DiagnosticsViewerLevelFilter;
    searchTerm?: string;
  } = {}
): DiagnosticsEvent[] {
  const selectedLevels = new Set(
    normalizeDiagnosticsViewerLevelFilter(options.levelFilter)
  );
  const searchTerm = options.searchTerm || "";

  return events.filter((event) => {
    if (!selectedLevels.has(event.level)) {
      return false;
    }

    return matchesDiagnosticsViewerSearch(event, searchTerm);
  });
}

function getDiagnosticsEventCopyShape(event: DiagnosticsEvent): Record<string, unknown> {
  return {
    timestamp: event.timestamp,
    level: event.level,
    runtime: event.runtime,
    domain: event.domain,
    feature: event.feature,
    provider: event.provider || null,
    message: event.message,
    sessionId: event.sessionId || null,
    requestId: event.requestId || null,
    correlationId: event.correlationId || null,
    sender: event.sender || null,
    data: event.data || null,
  };
}

export function serializeDiagnosticsViewerEvents(events: DiagnosticsEvent[]): string {
  return events
    .map((event) => JSON.stringify(getDiagnosticsEventCopyShape(event)))
    .join("\n");
}

export function getDiagnosticsViewerCounts(events: DiagnosticsEvent[]) {
  return summarizeDiagnosticsLevels(events);
}

export function getDiagnosticsViewerLevelOptions(): DiagnosticsViewerLevelOption[] {
  return ["all", ...DIAGNOSTICS_LEVELS];
}

export function isDiagnosticsViewerNearLatest(options: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  thresholdPx?: number;
}): boolean {
  const thresholdPx = options.thresholdPx ?? DIAGNOSTICS_VIEWER_SCROLL_THRESHOLD_PX;
  const distanceFromBottom =
    options.scrollHeight - (options.scrollTop + options.clientHeight);
  return distanceFromBottom <= thresholdPx;
}