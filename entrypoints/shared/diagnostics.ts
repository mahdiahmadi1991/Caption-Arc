import { getAppEnvironmentConfig } from "./environment";
import {
  APP_ENVIRONMENTS,
  detectAppEnvironment,
  type AppEnvironment,
} from "./runtime-environment";

export const DIAGNOSTICS_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
] as const;

export type DiagnosticsLevel = (typeof DIAGNOSTICS_LEVELS)[number];

export const DIAGNOSTICS_THRESHOLDS = [
  "off",
  ...DIAGNOSTICS_LEVELS,
] as const;

export type DiagnosticsThreshold = (typeof DIAGNOSTICS_THRESHOLDS)[number];

export const DIAGNOSTICS_ENVIRONMENTS = APP_ENVIRONMENTS;

export type DiagnosticsEnvironment = AppEnvironment;

export type DiagnosticsRuntimeContext =
  | "background"
  | "content"
  | "options"
  | "popup"
  | "meeting-history"
  | "smoke";

export type DiagnosticsSenderMetadata = {
  tabId?: number;
  frameId?: number;
  documentId?: string;
  origin?: string;
  url?: string;
};

export type DiagnosticsEventInput = {
  level: DiagnosticsLevel;
  domain: string;
  feature: string;
  message: string;
  runtime: DiagnosticsRuntimeContext;
  provider?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  data?: Record<string, unknown>;
};

export type DiagnosticsEvent = DiagnosticsEventInput & {
  id: string;
  timestamp: string;
  sender?: DiagnosticsSenderMetadata;
};

export type DiagnosticsSnapshot = {
  key: string;
  baseKey: string;
  runtime: DiagnosticsRuntimeContext;
  updatedAt: string;
  provider?: string;
  sender?: DiagnosticsSenderMetadata;
  data: Record<string, unknown>;
};

export type DiagnosticsEnvironmentLevels = Record<
  DiagnosticsEnvironment,
  DiagnosticsThreshold
>;

export type DiagnosticsConfig = {
  environment: DiagnosticsEnvironment;
  environmentLevels: DiagnosticsEnvironmentLevels;
  overrideMinLevel: DiagnosticsThreshold | null;
  enabled: boolean;
  minLevel: DiagnosticsLevel;
  maxEvents: number;
};

export type DiagnosticsState = {
  config: DiagnosticsConfig;
  events: DiagnosticsEvent[];
  snapshots: Record<string, DiagnosticsSnapshot>;
};

export type DiagnosticsQuery = {
  minLevel?: DiagnosticsLevel;
  domain?: string;
  feature?: string;
  provider?: string;
  runtime?: DiagnosticsRuntimeContext;
  tabId?: number;
  frameId?: number;
  documentId?: string;
  pageUrl?: string;
  snapshotKey?: string;
  snapshotBaseKey?: string;
  limit?: number;
};

export type DiagnosticsRuntimeSettings = {
  environmentLevels: DiagnosticsEnvironmentLevels;
  maxEvents?: number;
};

function getDefaultDiagnosticsEnvironmentLevels(): DiagnosticsEnvironmentLevels {
  return {
    development: normalizeDiagnosticsThreshold(
      getAppEnvironmentConfig("development").diagnostics.minLevel,
      "debug"
    ),
    production: normalizeDiagnosticsThreshold(
      getAppEnvironmentConfig("production").diagnostics.minLevel,
      "off"
    ),
  };
}

export const DEFAULT_DIAGNOSTICS_ENVIRONMENT_LEVELS: DiagnosticsEnvironmentLevels =
  getDefaultDiagnosticsEnvironmentLevels();

type DiagnosticsConfigInput = Partial<DiagnosticsConfig> & {
  environmentLevels?: Partial<DiagnosticsEnvironmentLevels>;
  overrideMinLevel?: DiagnosticsThreshold | null;
};

export function detectDiagnosticsEnvironment(): DiagnosticsEnvironment {
  return detectAppEnvironment();
}

export const DEFAULT_DIAGNOSTICS_CONFIG: DiagnosticsConfig = {
  environment: detectDiagnosticsEnvironment(),
  environmentLevels: { ...DEFAULT_DIAGNOSTICS_ENVIRONMENT_LEVELS },
  overrideMinLevel: null,
  enabled: true,
  minLevel: "debug",
  maxEvents: getAppEnvironmentConfig().diagnostics.maxEvents,
};

export const DEFAULT_DIAGNOSTICS_STATE: DiagnosticsState = {
  config: DEFAULT_DIAGNOSTICS_CONFIG,
  events: [],
  snapshots: {},
};

export const DIAGNOSTICS_SESSION_STORAGE_KEY =
  "captionarc-diagnostics-state";

const LEVEL_PRIORITY: Record<DiagnosticsLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

const MAX_SANITIZE_DEPTH = 4;
const MAX_OBJECT_KEYS = 24;
const MAX_ARRAY_ITEMS = 24;
const MAX_STRING_LENGTH = 240;
const SENSITIVE_KEY_PATTERN =
  /(^|_|-)(api.?key|authorization|token|prompt|meetingurl|sourceurl|url|rawtext|text|speaker|transcript|html|content|caption)(_|-|$)/i;
const DIAGNOSTICS_SNAPSHOT_SCOPE_SEPARATOR = "::";

function createFallbackDiagnosticsId(): string {
  return `diag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDiagnosticsId(): string {
  try {
    if (typeof crypto?.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to timestamp-based id.
  }

  return createFallbackDiagnosticsId();
}

export function compareDiagnosticsLevel(
  left: DiagnosticsLevel,
  right: DiagnosticsLevel
): number {
  return LEVEL_PRIORITY[left] - LEVEL_PRIORITY[right];
}

export function shouldCaptureDiagnosticsLevel(
  level: DiagnosticsLevel,
  minLevel: DiagnosticsLevel
): boolean {
  return compareDiagnosticsLevel(level, minLevel) >= 0;
}

export function normalizeDiagnosticsThreshold(
  value: unknown,
  fallback: DiagnosticsThreshold = "off"
): DiagnosticsThreshold {
  return DIAGNOSTICS_THRESHOLDS.includes(value as DiagnosticsThreshold)
    ? (value as DiagnosticsThreshold)
    : fallback;
}

export function normalizeDiagnosticsEnvironmentLevels(
  value: Partial<DiagnosticsEnvironmentLevels> | null | undefined,
  fallback: DiagnosticsEnvironmentLevels = DEFAULT_DIAGNOSTICS_ENVIRONMENT_LEVELS
): DiagnosticsEnvironmentLevels {
  return {
    development: normalizeDiagnosticsThreshold(
      value?.development,
      fallback.development
    ),
    production: normalizeDiagnosticsThreshold(
      value?.production,
      fallback.production
    ),
  };
}

export function resolveDiagnosticsThreshold(
  config: Pick<
    DiagnosticsConfig,
    "environment" | "environmentLevels" | "overrideMinLevel"
  >
): DiagnosticsThreshold {
  return (
    config.overrideMinLevel ??
    config.environmentLevels[config.environment] ??
    DEFAULT_DIAGNOSTICS_ENVIRONMENT_LEVELS[config.environment]
  );
}

function sanitizeDiagnosticsString(value: string, key?: string): string {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }

  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...`;
}

function sanitizeDiagnosticsUrl(value: string): string {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return "[redacted-url]";
  }
}

function sanitizeDiagnosticsSenderValue(
  key: keyof DiagnosticsSenderMetadata,
  value: unknown
): string | number | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  if (key === "url") {
    return sanitizeDiagnosticsUrl(value);
  }

  if (key === "origin") {
    try {
      return new URL(value).origin;
    } catch {
      return value;
    }
  }

  return value;
}

export function sanitizeDiagnosticsSenderMetadata(
  sender: DiagnosticsSenderMetadata | undefined
): DiagnosticsSenderMetadata | undefined {
  if (!sender) {
    return undefined;
  }

  const sanitized: DiagnosticsSenderMetadata = {
    tabId:
      typeof sender.tabId === "number" && Number.isFinite(sender.tabId)
        ? sender.tabId
        : undefined,
    frameId:
      typeof sender.frameId === "number" && Number.isFinite(sender.frameId)
        ? sender.frameId
        : undefined,
    documentId:
      typeof sender.documentId === "string" && sender.documentId.trim()
        ? sender.documentId.trim()
        : undefined,
    origin: sanitizeDiagnosticsSenderValue("origin", sender.origin) as
      | string
      | undefined,
    url: sanitizeDiagnosticsSenderValue("url", sender.url) as
      | string
      | undefined,
  };

  if (Object.values(sanitized).every((value) => value === undefined)) {
    return undefined;
  }

  return sanitized;
}

export function resolveDiagnosticsSnapshotProvider(
  data: Record<string, unknown>
): string | undefined {
  const candidates = [
    data.provider,
    data.providerPlatform,
    data.platform,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
}

export function buildScopedDiagnosticsSnapshotKey(options: {
  baseKey: string;
  runtime: DiagnosticsRuntimeContext;
  sender?: DiagnosticsSenderMetadata;
  provider?: string;
}): string {
  const sanitizedSender = sanitizeDiagnosticsSenderMetadata(options.sender);
  const parts = [options.baseKey, `runtime=${options.runtime}`];

  if (typeof sanitizedSender?.tabId === "number") {
    parts.push(`tab=${sanitizedSender.tabId}`);
  }

  if (typeof sanitizedSender?.frameId === "number") {
    parts.push(`frame=${sanitizedSender.frameId}`);
  }

  if (sanitizedSender?.documentId) {
    parts.push(`document=${sanitizedSender.documentId}`);
  }

  if (options.provider?.trim()) {
    parts.push(`provider=${options.provider.trim()}`);
  }

  return parts.join(DIAGNOSTICS_SNAPSHOT_SCOPE_SEPARATOR);
}

export function normalizeDiagnosticsSnapshot(
  key: string,
  snapshot: Partial<DiagnosticsSnapshot> | undefined
): DiagnosticsSnapshot | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const baseKey =
    typeof snapshot.baseKey === "string" && snapshot.baseKey.trim()
      ? snapshot.baseKey.trim()
      : key;
  const runtime =
    typeof snapshot.runtime === "string" && snapshot.runtime
      ? (snapshot.runtime as DiagnosticsRuntimeContext)
      : "content";
  const data =
    snapshot.data && typeof snapshot.data === "object"
      ? (sanitizeDiagnosticsData(snapshot.data as Record<string, unknown>) || {})
      : {};
  const provider =
    typeof snapshot.provider === "string" && snapshot.provider.trim()
      ? snapshot.provider.trim()
      : resolveDiagnosticsSnapshotProvider(data);

  return {
    key,
    baseKey,
    runtime,
    updatedAt:
      typeof snapshot.updatedAt === "string" && snapshot.updatedAt.trim()
        ? snapshot.updatedAt
        : new Date().toISOString(),
    provider,
    sender: sanitizeDiagnosticsSenderMetadata(snapshot.sender),
    data,
  };
}

export function sanitizeDiagnosticsValue(
  value: unknown,
  key?: string,
  depth = 0
): unknown {
  if (value == null) {
    return value;
  }

  if (depth >= MAX_SANITIZE_DEPTH) {
    return "[truncated-depth]";
  }

  if (typeof value === "string") {
    if (key && /(^|_|-)(meetingurl|sourceurl|url)(_|-|$)/i.test(key)) {
      return sanitizeDiagnosticsUrl(value);
    }

    return sanitizeDiagnosticsString(value, key);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeDiagnosticsString(value.message, key),
    };
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((entry) => sanitizeDiagnosticsValue(entry, key, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const entryKey of Object.keys(value as Record<string, unknown>).slice(
      0,
      MAX_OBJECT_KEYS
    )) {
      result[entryKey] = sanitizeDiagnosticsValue(
        (value as Record<string, unknown>)[entryKey],
        entryKey,
        depth + 1
      );
    }
    return result;
  }

  return String(value);
}

export function sanitizeDiagnosticsData(
  value: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!value) {
    return undefined;
  }

  return sanitizeDiagnosticsValue(value) as Record<string, unknown>;
}

export function normalizeDiagnosticsConfig(
  value: DiagnosticsConfigInput | null | undefined,
  fallback: DiagnosticsConfig = DEFAULT_DIAGNOSTICS_CONFIG
): DiagnosticsConfig {
  const maxEvents = Number(value?.maxEvents);

  const environment = DIAGNOSTICS_ENVIRONMENTS.includes(
    value?.environment as DiagnosticsEnvironment
  )
    ? (value?.environment as DiagnosticsEnvironment)
    : fallback.environment;

  const environmentLevels = normalizeDiagnosticsEnvironmentLevels(
    value?.environmentLevels,
    fallback.environmentLevels
  );

  const nextOverrideMinLevel =
    value?.enabled === false
      ? "off"
      : value?.overrideMinLevel !== undefined
        ? value.overrideMinLevel === null
          ? null
          : normalizeDiagnosticsThreshold(
              value.overrideMinLevel,
              fallback.overrideMinLevel ?? "off"
            )
        : value?.minLevel !== undefined
          ? normalizeDiagnosticsThreshold(value.minLevel, fallback.minLevel)
          : fallback.overrideMinLevel;

  const nextConfig: DiagnosticsConfig = {
    environment,
    environmentLevels,
    overrideMinLevel:
      nextOverrideMinLevel === null
        ? null
        : normalizeDiagnosticsThreshold(
            nextOverrideMinLevel,
            fallback.overrideMinLevel ?? "off"
          ),
    enabled: false,
    minLevel: fallback.minLevel,
    maxEvents:
      Number.isFinite(maxEvents) && maxEvents >= 100 && maxEvents <= 5000
        ? Math.round(maxEvents)
        : fallback.maxEvents,
  };

  const resolvedThreshold = resolveDiagnosticsThreshold(nextConfig);
  nextConfig.enabled = resolvedThreshold !== "off";
  nextConfig.minLevel =
    resolvedThreshold === "off"
      ? fallback.minLevel
      : (resolvedThreshold as DiagnosticsLevel);

  return nextConfig;
}

export function buildDiagnosticsConfigFromEnvironment(
  settings: DiagnosticsRuntimeSettings = {
    environmentLevels: DEFAULT_DIAGNOSTICS_ENVIRONMENT_LEVELS,
    maxEvents: getAppEnvironmentConfig().diagnostics.maxEvents,
  },
  fallback: DiagnosticsConfig = DEFAULT_DIAGNOSTICS_CONFIG
): DiagnosticsConfig {
  return normalizeDiagnosticsConfig(
    {
      environment: detectDiagnosticsEnvironment(),
      environmentLevels: settings.environmentLevels,
      maxEvents: settings.maxEvents,
      overrideMinLevel: fallback.overrideMinLevel,
    },
    fallback
  );
}

export function createDiagnosticsEvent(
  input: DiagnosticsEventInput,
  sender?: DiagnosticsSenderMetadata
): DiagnosticsEvent {
  return {
    id: createDiagnosticsId(),
    timestamp: new Date().toISOString(),
    ...input,
    data: sanitizeDiagnosticsData(input.data),
    sender: sanitizeDiagnosticsSenderMetadata(sender),
  };
}

export function createDiagnosticsSnapshot(
  key: string,
  runtime: DiagnosticsRuntimeContext,
  data: Record<string, unknown>,
  options?: {
    baseKey?: string;
    sender?: DiagnosticsSenderMetadata;
    provider?: string;
  }
): DiagnosticsSnapshot {
  const sanitizedData = sanitizeDiagnosticsData(data) || {};
  return {
    key,
    baseKey: options?.baseKey || key,
    runtime,
    updatedAt: new Date().toISOString(),
    provider: options?.provider || resolveDiagnosticsSnapshotProvider(sanitizedData),
    sender: sanitizeDiagnosticsSenderMetadata(options?.sender),
    data: sanitizedData,
  };
}

function normalizeDiagnosticsQueryPageUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return sanitizeDiagnosticsUrl(value.trim());
}

export function filterDiagnosticsEvents(
  events: DiagnosticsEvent[],
  query: DiagnosticsQuery = {}
): DiagnosticsEvent[] {
  let filtered = events;

  if (query.minLevel) {
    filtered = filtered.filter((event) =>
      shouldCaptureDiagnosticsLevel(event.level, query.minLevel as DiagnosticsLevel)
    );
  }

  if (query.domain) {
    filtered = filtered.filter((event) => event.domain === query.domain);
  }

  if (query.feature) {
    filtered = filtered.filter((event) => event.feature === query.feature);
  }

  if (query.provider) {
    filtered = filtered.filter((event) => event.provider === query.provider);
  }

  if (query.runtime) {
    filtered = filtered.filter((event) => event.runtime === query.runtime);
  }

  if (typeof query.tabId === "number") {
    filtered = filtered.filter((event) => event.sender?.tabId === query.tabId);
  }

  if (typeof query.frameId === "number") {
    filtered = filtered.filter((event) => event.sender?.frameId === query.frameId);
  }

  if (query.documentId) {
    filtered = filtered.filter(
      (event) => event.sender?.documentId === query.documentId
    );
  }

  const normalizedPageUrl = normalizeDiagnosticsQueryPageUrl(query.pageUrl);
  if (normalizedPageUrl) {
    filtered = filtered.filter(
      (event) => event.sender?.url === normalizedPageUrl
    );
  }

  if (query.limit && query.limit > 0) {
    filtered = filtered.slice(-query.limit);
  }

  return filtered;
}

export function filterDiagnosticsSnapshots(
  snapshots: Record<string, DiagnosticsSnapshot>,
  query: DiagnosticsQuery = {}
): Record<string, DiagnosticsSnapshot> {
  const normalizedPageUrl = normalizeDiagnosticsQueryPageUrl(query.pageUrl);

  return Object.fromEntries(
    Object.entries(snapshots).filter(([snapshotKey, snapshot]) => {
      if (query.snapshotKey && snapshotKey !== query.snapshotKey) {
        return false;
      }

      if (query.snapshotBaseKey && snapshot.baseKey !== query.snapshotBaseKey) {
        return false;
      }

      if (query.provider && snapshot.provider !== query.provider) {
        return false;
      }

      if (query.runtime && snapshot.runtime !== query.runtime) {
        return false;
      }

      if (typeof query.tabId === "number" && snapshot.sender?.tabId !== query.tabId) {
        return false;
      }

      if (
        typeof query.frameId === "number" &&
        snapshot.sender?.frameId !== query.frameId
      ) {
        return false;
      }

      if (query.documentId && snapshot.sender?.documentId !== query.documentId) {
        return false;
      }

      if (normalizedPageUrl && snapshot.sender?.url !== normalizedPageUrl) {
        return false;
      }

      return true;
    })
  );
}

export function resolveDiagnosticsSnapshot(
  snapshots: Record<string, DiagnosticsSnapshot>,
  query: DiagnosticsQuery = {}
): DiagnosticsSnapshot | null {
  const filtered = Object.values(filterDiagnosticsSnapshots(snapshots, query));
  if (filtered.length === 0) {
    return null;
  }

  return [...filtered].sort((left, right) =>
    left.updatedAt.localeCompare(right.updatedAt)
  )[filtered.length - 1] || null;
}

export function summarizeDiagnosticsLevels(
  events: DiagnosticsEvent[]
): Record<DiagnosticsLevel, number> {
  return events.reduce<Record<DiagnosticsLevel, number>>(
    (accumulator, event) => {
      accumulator[event.level] += 1;
      return accumulator;
    },
    {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    }
  );
}