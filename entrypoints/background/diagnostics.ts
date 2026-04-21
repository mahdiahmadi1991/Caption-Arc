import type { DiagnosticsLevel } from "../shared/diagnostics";
import { getDiagnosticsStorageSelection } from "../shared/browser-capabilities";
import {
  buildDiagnosticsConfigFromEnvironment,
  buildScopedDiagnosticsSnapshotKey,
  createDiagnosticsEvent,
  createDiagnosticsSnapshot,
  DEFAULT_DIAGNOSTICS_STATE,
  DIAGNOSTICS_SESSION_STORAGE_KEY,
  filterDiagnosticsEvents,
  filterDiagnosticsSnapshots,
  normalizeDiagnosticsConfig,
  normalizeDiagnosticsSnapshot,
  resolveDiagnosticsSnapshot,
  resolveDiagnosticsSnapshotProvider,
  sanitizeDiagnosticsData,
  shouldCaptureDiagnosticsLevel,
  summarizeDiagnosticsLevels,
  type DiagnosticsConfig,
  type DiagnosticsEventInput,
  type DiagnosticsQuery,
  type DiagnosticsRuntimeContext,
  type DiagnosticsSenderMetadata,
  type DiagnosticsSnapshot,
  type DiagnosticsState,
} from "../shared/diagnostics";

let diagnosticsState: DiagnosticsState = {
  ...DEFAULT_DIAGNOSTICS_STATE,
  config: { ...DEFAULT_DIAGNOSTICS_STATE.config },
  events: [],
  snapshots: {},
};
let diagnosticsHydrated = false;
let hydrationPromise: Promise<void> | null = null;
let diagnosticsPersistenceTimer: ReturnType<typeof setTimeout> | null = null;
let diagnosticsPersistencePromise: Promise<void> | null = null;
let resolveDiagnosticsPersistencePromise: (() => void) | null = null;
let diagnosticsPersistenceDirty = false;

const DIAGNOSTICS_PERSIST_DEBOUNCE_MS = 150;
const EXACT_DUPLICATE_EVENT_WINDOW_MS = 250;
const REPETITIVE_MESSAGE_WINDOWS_MS: Record<string, number> = {
  "observer-tick": 1000,
  observer_tick: 1000,
  caption_state_transition: 1000,
};

const recentDiagnosticsEventFingerprints = new Map<string, number>();
const recentDiagnosticsMessageWindows = new Map<string, number>();

function cloneDiagnosticsState(state: DiagnosticsState): DiagnosticsState {
  return {
    config: { ...state.config },
    events: [...state.events],
    snapshots: { ...state.snapshots },
  };
}

async function persistDiagnosticsState(): Promise<void> {
  const storageArea = getDiagnosticsStorageSelection().area;
  if (!storageArea?.set) {
    return;
  }

  try {
    await storageArea.set({
      [DIAGNOSTICS_SESSION_STORAGE_KEY]: diagnosticsState,
    });
  } catch {
    // Diagnostics persistence is best-effort only.
  }
}

function ensureDiagnosticsPersistencePromise(): Promise<void> {
  if (!diagnosticsPersistencePromise) {
    diagnosticsPersistencePromise = new Promise<void>((resolve) => {
      resolveDiagnosticsPersistencePromise = resolve;
    });
  }

  return diagnosticsPersistencePromise;
}

function settleDiagnosticsPersistencePromise(): void {
  resolveDiagnosticsPersistencePromise?.();
  resolveDiagnosticsPersistencePromise = null;
  diagnosticsPersistencePromise = null;
}

function scheduleDiagnosticsPersistence(options?: {
  immediate?: boolean;
}): Promise<void> {
  diagnosticsPersistenceDirty = true;

  if (options?.immediate) {
    return flushPendingDiagnosticsPersistence();
  }

  const promise = ensureDiagnosticsPersistencePromise();

  if (diagnosticsPersistenceTimer !== null) {
    clearTimeout(diagnosticsPersistenceTimer);
  }

  diagnosticsPersistenceTimer = setTimeout(() => {
    void flushPendingDiagnosticsPersistence();
  }, DIAGNOSTICS_PERSIST_DEBOUNCE_MS);

  return promise;
}

export async function flushPendingDiagnosticsPersistence(): Promise<void> {
  if (diagnosticsPersistenceTimer !== null) {
    clearTimeout(diagnosticsPersistenceTimer);
    diagnosticsPersistenceTimer = null;
  }

  if (!diagnosticsPersistenceDirty) {
    settleDiagnosticsPersistencePromise();
    return;
  }

  diagnosticsPersistenceDirty = false;
  await persistDiagnosticsState();
  settleDiagnosticsPersistencePromise();
}

function getSenderMetadata(
  sender: chrome.runtime.MessageSender | undefined
): DiagnosticsSenderMetadata {
  const origin = (() => {
    try {
      return sender?.origin || (sender?.url ? new URL(sender.url).origin : undefined);
    } catch {
      return sender?.origin;
    }
  })();

  return {
    tabId: sender?.tab?.id,
    frameId: sender?.frameId,
    documentId: sender?.documentId,
    origin,
    url: sender?.url,
  };
}

function buildExactDiagnosticsEventFingerprint(
  input: DiagnosticsEventInput,
  sender: DiagnosticsSenderMetadata
): string {
  return JSON.stringify({
    level: input.level,
    runtime: input.runtime,
    domain: input.domain,
    feature: input.feature,
    provider: input.provider || null,
    message: input.message,
    sessionId: input.sessionId || null,
    requestId: input.requestId || null,
    correlationId: input.correlationId || null,
    sender,
    data: sanitizeDiagnosticsData(input.data),
  });
}

function buildRepetitiveDiagnosticsMessageFingerprint(
  input: DiagnosticsEventInput,
  sender: DiagnosticsSenderMetadata
): string {
  return JSON.stringify({
    runtime: input.runtime,
    domain: input.domain,
    feature: input.feature,
    provider: input.provider || null,
    message: input.message,
    tabId: sender.tabId ?? null,
    frameId: sender.frameId ?? null,
    documentId: sender.documentId ?? null,
  });
}

function shouldDropDiagnosticsEvent(
  input: DiagnosticsEventInput,
  sender: DiagnosticsSenderMetadata
): boolean {
  const now = Date.now();
  const repetitiveWindowMs = REPETITIVE_MESSAGE_WINDOWS_MS[input.message] || 0;

  if (repetitiveWindowMs > 0) {
    const messageFingerprint = buildRepetitiveDiagnosticsMessageFingerprint(
      input,
      sender
    );
    const lastSeenAt = recentDiagnosticsMessageWindows.get(messageFingerprint) || 0;

    if (now - lastSeenAt < repetitiveWindowMs) {
      recentDiagnosticsMessageWindows.set(messageFingerprint, now);
      return true;
    }

    recentDiagnosticsMessageWindows.set(messageFingerprint, now);
  }

  const exactFingerprint = buildExactDiagnosticsEventFingerprint(input, sender);
  const lastSeenAt = recentDiagnosticsEventFingerprints.get(exactFingerprint) || 0;
  recentDiagnosticsEventFingerprints.set(exactFingerprint, now);

  return now - lastSeenAt < EXACT_DUPLICATE_EVENT_WINDOW_MS;
}

export async function initializeDiagnosticsCollector(): Promise<void> {
  if (diagnosticsHydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    try {
      const storageArea = getDiagnosticsStorageSelection().area;
      const result = storageArea?.get
        ? await storageArea.get(DIAGNOSTICS_SESSION_STORAGE_KEY)
        : undefined;
      const stored = result?.[DIAGNOSTICS_SESSION_STORAGE_KEY] as
        | Partial<DiagnosticsState>
        | undefined;

      diagnosticsState = {
        config: normalizeDiagnosticsConfig(stored?.config),
        events: Array.isArray(stored?.events) ? stored.events : [],
        snapshots: Object.fromEntries(
          Object.entries(
            stored?.snapshots && typeof stored.snapshots === "object"
              ? (stored.snapshots as Record<string, Partial<DiagnosticsSnapshot>>)
              : {}
          )
            .map(([key, snapshot]) => [key, normalizeDiagnosticsSnapshot(key, snapshot)])
            .filter((entry): entry is [string, DiagnosticsSnapshot] => Boolean(entry[1]))
        ),
      };
    } catch {
      diagnosticsState = cloneDiagnosticsState(DEFAULT_DIAGNOSTICS_STATE);
    } finally {
      diagnosticsHydrated = true;
    }
  })();

  return hydrationPromise;
}

export function getDiagnosticsConfig(): DiagnosticsConfig {
  return { ...diagnosticsState.config };
}

export async function setDiagnosticsConfig(
  config: Partial<DiagnosticsConfig>
): Promise<{ success: boolean; config: DiagnosticsConfig }> {
  await initializeDiagnosticsCollector();
  diagnosticsState.config = normalizeDiagnosticsConfig(config, diagnosticsState.config);
  await scheduleDiagnosticsPersistence({ immediate: true });
  return { success: true, config: getDiagnosticsConfig() };
}

export async function syncDiagnosticsEnvironmentConfig(): Promise<{
  success: boolean;
  config: DiagnosticsConfig;
}> {
  await initializeDiagnosticsCollector();
  diagnosticsState.config = buildDiagnosticsConfigFromEnvironment(
    undefined,
    diagnosticsState.config
  );
  await scheduleDiagnosticsPersistence({ immediate: true });
  return { success: true, config: getDiagnosticsConfig() };
}

export async function appendDiagnosticsEvent(
  input: DiagnosticsEventInput,
  sender?: chrome.runtime.MessageSender
): Promise<{ success: boolean; accepted: boolean }> {
  await initializeDiagnosticsCollector();
  const senderMetadata = getSenderMetadata(sender);

  if (!diagnosticsState.config.enabled) {
    return { success: true, accepted: false };
  }

  if (!shouldCaptureDiagnosticsLevel(input.level, diagnosticsState.config.minLevel)) {
    return { success: true, accepted: false };
  }

  if (shouldDropDiagnosticsEvent(input, senderMetadata)) {
    return { success: true, accepted: false };
  }

  diagnosticsState.events.push(createDiagnosticsEvent(input, senderMetadata));
  if (diagnosticsState.events.length > diagnosticsState.config.maxEvents) {
    diagnosticsState.events.splice(
      0,
      diagnosticsState.events.length - diagnosticsState.config.maxEvents
    );
  }

  void scheduleDiagnosticsPersistence();
  return { success: true, accepted: true };
}

export async function setDiagnosticsSnapshot(
  key: string,
  runtime: DiagnosticsRuntimeContext,
  data: Record<string, unknown>,
  sender?: chrome.runtime.MessageSender
): Promise<{ success: boolean; accepted: boolean }> {
  await initializeDiagnosticsCollector();

  if (!diagnosticsState.config.enabled) {
    return { success: true, accepted: false };
  }

  const senderMetadata = getSenderMetadata(sender);
  const provider = resolveDiagnosticsSnapshotProvider(data);
  const scopedKey = buildScopedDiagnosticsSnapshotKey({
    baseKey: key,
    runtime,
    sender: senderMetadata,
    provider,
  });
  const nextSnapshot = createDiagnosticsSnapshot(scopedKey, runtime, data, {
    baseKey: key,
    sender: senderMetadata,
    provider,
  });
  const existingSnapshot = diagnosticsState.snapshots[scopedKey];

  if (
    existingSnapshot &&
    JSON.stringify(existingSnapshot.data) === JSON.stringify(nextSnapshot.data) &&
    JSON.stringify(existingSnapshot.sender || null) ===
      JSON.stringify(nextSnapshot.sender || null) &&
    existingSnapshot.provider === nextSnapshot.provider &&
    existingSnapshot.baseKey === nextSnapshot.baseKey &&
    existingSnapshot.runtime === nextSnapshot.runtime
  ) {
    return { success: true, accepted: false };
  }

  diagnosticsState.snapshots[scopedKey] = nextSnapshot;
  void scheduleDiagnosticsPersistence();
  return { success: true, accepted: true };
}

export async function clearDiagnosticsSnapshot(
  key: string,
  sender?: chrome.runtime.MessageSender
): Promise<{ success: boolean }> {
  await initializeDiagnosticsCollector();
  const senderMetadata = getSenderMetadata(sender);

  for (const [snapshotKey, snapshot] of Object.entries(diagnosticsState.snapshots)) {
    const shouldDeleteExact = snapshot.key === key;
    const shouldDeleteByBaseKey =
      snapshot.baseKey === key &&
      (!sender ||
        (snapshot.sender?.tabId === senderMetadata.tabId &&
          snapshot.sender?.frameId === senderMetadata.frameId &&
          snapshot.sender?.documentId === senderMetadata.documentId));

    if (shouldDeleteExact || shouldDeleteByBaseKey) {
      delete diagnosticsState.snapshots[snapshotKey];
    }
  }

  await scheduleDiagnosticsPersistence({ immediate: true });
  return { success: true };
}

export async function clearDiagnosticsData(options?: {
  includeSnapshots?: boolean;
}): Promise<{ success: boolean }> {
  await initializeDiagnosticsCollector();
  diagnosticsState.events = [];
  if (options?.includeSnapshots !== false) {
    diagnosticsState.snapshots = {};
  }
  await scheduleDiagnosticsPersistence({ immediate: true });
  return { success: true };
}

export async function getDiagnosticsPayload(query?: DiagnosticsQuery): Promise<{
  success: boolean;
  config: DiagnosticsConfig;
  events: DiagnosticsState["events"];
  snapshots: DiagnosticsState["snapshots"];
  resolvedSnapshot: DiagnosticsSnapshot | null;
  counts: ReturnType<typeof summarizeDiagnosticsLevels>;
}> {
  await initializeDiagnosticsCollector();
  const events = filterDiagnosticsEvents(diagnosticsState.events, query);
  const snapshots = filterDiagnosticsSnapshots(diagnosticsState.snapshots, query);

  return {
    success: true,
    config: getDiagnosticsConfig(),
    events,
    snapshots,
    resolvedSnapshot: resolveDiagnosticsSnapshot(snapshots, query),
    counts: summarizeDiagnosticsLevels(events),
  };
}

export function createBackgroundDiagnosticsLogger(context: {
  domain: string;
  feature: string;
  provider?: string;
}) {
  const runtime: DiagnosticsRuntimeContext = "background";

  const emit = (
    level: DiagnosticsLevel,
    message: string,
    data?: Record<string, unknown>,
    extra?: {
      provider?: string;
      sessionId?: string;
      requestId?: string;
      correlationId?: string;
    }
  ) =>
    appendDiagnosticsEvent({
      level,
      runtime,
      domain: context.domain,
      feature: context.feature,
      provider: extra?.provider || context.provider,
      sessionId: extra?.sessionId,
      requestId: extra?.requestId,
      correlationId: extra?.correlationId,
      message,
      data,
    });

  return {
    trace: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("trace", message, data, extra),
    debug: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("debug", message, data, extra),
    info: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("info", message, data, extra),
    warn: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("warn", message, data, extra),
    error: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("error", message, data, extra),
    snapshot: (key: string, data: Record<string, unknown>) =>
      setDiagnosticsSnapshot(key, runtime, data),
    clearSnapshot: (key: string) => clearDiagnosticsSnapshot(key),
  };
}