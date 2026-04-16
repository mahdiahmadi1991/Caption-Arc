import {
  deleteGoogleDriveFile,
  disconnectGoogleDrive,
  ensureGoogleDriveAppFolder,
  getGoogleDriveChangesCursor,
  listGoogleDriveFiles,
  listGoogleDriveChangedFiles,
  readGoogleDriveFile,
  writeGoogleDriveFile,
  connectGoogleDrive,
} from "./google-drive";
import {
  connectOneDrive,
  deleteOneDriveFile,
  disconnectOneDrive,
  ensureOneDriveAppFolder,
  getOneDriveChangesCursor,
  listOneDriveChangedFiles,
  listOneDriveFiles,
  readOneDriveFile,
  writeOneDriveFile,
} from "./onedrive";
import type {
  CloudSyncErrorKind,
  CloudSyncFileRecord,
  CloudSyncProviderCheckpoint,
  CloudSyncTask,
  CloudSyncTaskProcessingResult,
} from "../types";
import type { CloudSyncProvider } from "../../types";
import {
  buildClearArchivePayload,
  buildDeleteSessionPayload,
    buildDeviceProfilePayload,
    buildSharedSettingsPayload,
    buildSessionArtifactsPayload,
    buildSessionEventsChunkPayloads,
    buildSessionMetaPayload,
    getSessionArtifactsSyncContentHash,
    getSessionEventsSyncContentHash,
    parseSessionEventsChunkPayload,
    parseSessionEventsManifestPayload,
    parseClearArchivePayload,
    parseDeleteSessionPayload,
    parseSessionArtifactsPayload,
    parseSessionEventsPayload,
    parseSessionMetaPayload,
  parseSharedSettingsPayload,
} from "../serialization";
import {
  decryptCloudSyncPayload,
  encryptCloudSyncPayload,
  exportCloudSyncVaultKeyPayload,
  importCloudSyncVaultKeyPayload,
} from "../crypto";
import {
  clearCloudSyncPendingSettingsDecision,
  getCloudSyncPendingSettingsDecision,
  saveCloudSyncPendingSettingsDecision,
} from "../checkpoints";
import {
  BROWSER_GOVERNED_CLOUD_SYNC_PROVIDERS,
  filterSupportedCloudSyncProviders,
  getCloudSyncProviderSupport,
} from "../../../shared/browser-capabilities";
import {
  enqueueCloudSyncTask,
  listCloudSyncTasks,
  removeCloudSyncTask,
  updateCloudSyncTask,
} from "../outbox";
import { mergeMeetingSessions, mergeSharedSettings } from "../merge";
import { DEFAULT_SETTINGS } from "../../constants";
import { normalizeMeetingSession, type StoredMeetingSession } from "../../../shared/meeting-session";
import { createBackgroundDiagnosticsLogger } from "../../diagnostics";
import { getMeetingSessionSyncDelayMs } from "../policy";

const cloudSyncProviderDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "cloud-sync",
  feature: "provider-sync",
});

function createUnsupportedCheckpoint(
  provider: CloudSyncProvider
): CloudSyncProviderCheckpoint {
  const support = getCloudSyncProviderSupport(provider);
  return {
    provider,
    supported: false,
    unsupportedReason:
      support.reason || "This cloud provider is not available on this browser.",
    connected: false,
    manualRetryAvailable: false,
    healthState: "action-required",
    lastError:
      support.reason || "This cloud provider is not available on this browser.",
    lastErrorKind: "action-required",
  };
}

function createSupportedDisconnectedCheckpoint(
  provider: CloudSyncProvider
): CloudSyncProviderCheckpoint {
  return {
    provider,
    supported: true,
    unsupportedReason: undefined,
    connected: false,
    manualRetryAvailable: false,
    healthState: "disconnected",
  };
}

function isStaleMissingOAuthClientError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  return (
    /cloud sync is not configured/i.test(message) &&
    /required oauth client is missing for this browser target/i.test(message)
  );
}

export function getCloudSyncProviderBaselineCheckpoints(): CloudSyncProviderCheckpoint[] {
  return [...BROWSER_GOVERNED_CLOUD_SYNC_PROVIDERS].map((provider) => {
    const support = getCloudSyncProviderSupport(provider);
    return support.supported
      ? createSupportedDisconnectedCheckpoint(provider)
      : createUnsupportedCheckpoint(provider);
  });
}

export function normalizeCloudSyncProviderCheckpoint(
  checkpoint: CloudSyncProviderCheckpoint
): CloudSyncProviderCheckpoint {
  const support = getCloudSyncProviderSupport(checkpoint.provider);
  if (!support.supported) {
    return createUnsupportedCheckpoint(checkpoint.provider);
  }

  const wasUnsupportedCheckpoint =
    checkpoint.supported === false ||
    Boolean(checkpoint.unsupportedReason);
  const hasStaleUnsupportedConfigError =
    checkpoint.lastErrorKind === "action-required" &&
    isStaleMissingOAuthClientError(checkpoint.lastError);

  if (
    !checkpoint.connected &&
    (wasUnsupportedCheckpoint || hasStaleUnsupportedConfigError)
  ) {
    return {
      ...checkpoint,
      supported: true,
      unsupportedReason: undefined,
      healthState: "disconnected",
      manualRetryAvailable: false,
      lastError: undefined,
      lastErrorKind: undefined,
    };
  }

  const fallbackAccountLabel =
    checkpoint.connected && !checkpoint.accountLabel
      ? checkpoint.provider === "google-drive"
        ? "Google Drive"
        : checkpoint.provider === "onedrive"
          ? "OneDrive"
          : undefined
      : checkpoint.accountLabel;

  return {
    ...checkpoint,
    accountId: checkpoint.accountId || fallbackAccountLabel,
    accountLabel: fallbackAccountLabel,
    supported: true,
    unsupportedReason: undefined,
  };
}

export function mergeCloudSyncProviderCheckpoints(
  checkpoints: CloudSyncProviderCheckpoint[]
): CloudSyncProviderCheckpoint[] {
  const merged = new Map<CloudSyncProvider, CloudSyncProviderCheckpoint>();

  for (const checkpoint of getCloudSyncProviderBaselineCheckpoints()) {
    merged.set(checkpoint.provider, checkpoint);
  }

  for (const checkpoint of checkpoints) {
    merged.set(
      checkpoint.provider,
      normalizeCloudSyncProviderCheckpoint(checkpoint)
    );
  }

  return [...merged.values()];
}

function classifyProviderError(error: unknown): {
  kind: CloudSyncErrorKind;
  retryable: boolean;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("authentication") ||
    normalized.includes("authorization") ||
    normalized.includes("unauthorized") ||
    normalized.includes("invalid_grant") ||
    normalized.includes("401") ||
    normalized.includes("not connected yet") ||
    normalized.includes("reconnect") ||
    normalized.includes("cancelled") ||
    normalized.includes("not configured") ||
    normalized.includes("permission") ||
    normalized.includes("scope") ||
    normalized.includes("version conflict")
  ) {
    return {
      kind: "action-required",
      retryable: false,
      message,
    };
  }

  if (
    normalized.includes("quota") ||
    normalized.includes("403") ||
    normalized.includes("429")
  ) {
    return {
      kind: "needs-attention",
      retryable: false,
      message,
    };
  }

  if (
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("fetch") ||
    normalized.includes("502") ||
    normalized.includes("503")
  ) {
    return {
      kind: "transient",
      retryable: true,
      message,
    };
  }

  return {
    kind: "unknown",
    retryable: true,
    message,
  };
}

function getSessionMetaPath(sessionId: string): string {
  return `sessions/${sessionId}/meta.json.enc`;
}

function getSessionEventsPath(sessionId: string): string {
  return `sessions/${sessionId}/events.json.enc`;
}

function getSessionEventsManifestPath(sessionId: string): string {
  return `sessions/${sessionId}/events.manifest.json.enc`;
}

function getSessionEventsChunkDirectoryPath(sessionId: string): string {
  return `sessions/${sessionId}/events`;
}

function getSessionEventsChunkPath(sessionId: string, chunkIndex: number): string {
  return `${getSessionEventsChunkDirectoryPath(sessionId)}/${chunkIndex
    .toString()
    .padStart(4, "0")}.json.enc`;
}

function getSessionArtifactsPath(sessionId: string): string {
  return `sessions/${sessionId}/artifacts.json.enc`;
}

function getDeleteSessionPath(sessionId: string): string {
  return `tombstones/session-${sessionId}.json.enc`;
}

function getClearArchivePath(): string {
  return `tombstones/clear-archive.json.enc`;
}

async function ensureVaultKeyRemote(
  listFiles: (pathPrefix: string) => Promise<Awaited<ReturnType<typeof listGoogleDriveFiles>>>,
  readFile: (path: string) => Promise<Uint8Array>,
  writeFile: (
    path: string,
    bytes: Uint8Array,
    expectedVersionToken?: string
  ) => Promise<unknown>
): Promise<void> {
  const existingFiles = await listFiles("vault-key.json");
  if (existingFiles.length > 0) {
    try {
      const bytes = await readFile("vault-key.json");
      await importCloudSyncVaultKeyPayload(bytes);
      await cloudSyncProviderDiagnostics.trace("cloud_sync_vault_key_reused", {
        remoteFileCount: existingFiles.length,
      });
      return;
    } catch {
      await cloudSyncProviderDiagnostics.warn("cloud_sync_vault_key_refresh_required", {
        remoteFileCount: existingFiles.length,
      });
      // Fall back to overwriting the remote key payload with the local key.
    }
  }

  const bytes = await exportCloudSyncVaultKeyPayload();
  await writeFile("vault-key.json", bytes, existingFiles[0]?.versionToken);
  await cloudSyncProviderDiagnostics.info("cloud_sync_vault_key_uploaded", {
    hadExistingRemoteKey: existingFiles.length > 0,
  });
}

type SyncFileAdapters = {
  ensureAppFolder: () => Promise<void>;
  listFiles: (pathPrefix: string) => Promise<CloudSyncFileRecord[]>;
  listChangedFiles?: (
    cursor: string
  ) => Promise<{ files: CloudSyncFileRecord[]; cursor?: string }>;
  getLatestChangeCursor?: () => Promise<string | undefined>;
  readFile: (path: string) => Promise<Uint8Array>;
  writeFile: (
    path: string,
    bytes: Uint8Array,
    expectedVersionToken?: string
  ) => Promise<unknown>;
  deleteFile: (path: string, expectedVersionToken?: string) => Promise<void>;
};

type RemoteSessionEntry = {
  sessionId: string;
  metaFile?: CloudSyncFileRecord;
  eventsFile?: CloudSyncFileRecord;
  eventsManifestFile?: CloudSyncFileRecord;
  artifactsFile?: CloudSyncFileRecord;
};

function isSharedSettingsEqual(
  left: ReturnType<typeof buildSharedSettingsPayload>,
  right: ReturnType<typeof buildSharedSettingsPayload>
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function areSessionsEquivalent(
  left: StoredMeetingSession,
  right: StoredMeetingSession
): boolean {
  const leftNormalized = normalizeMeetingSession(left);
  const rightNormalized = normalizeMeetingSession(right);

  return JSON.stringify({
    title: leftNormalized.title,
    starred: leftNormalized.starred,
    lifecycleState: leftNormalized.lifecycleState,
    endTime: leftNormalized.endTime,
    updatedAt: leftNormalized.updatedAt,
    syncContentHash: leftNormalized.syncContentHash,
    summaries: Object.keys(leftNormalized.summaries || {}).sort(),
    assistantOutputs: Object.keys(
      leftNormalized.artifacts?.assistantOutputs || {}
    ).sort(),
    assistantMemoryUpdatedAt:
      leftNormalized.artifacts?.assistantMemory?.updatedAt || 0,
    assistantStateUpdatedAt:
      leftNormalized.artifacts?.assistantState?.updatedAt || 0,
    eventCount: (leftNormalized.events || []).length,
  }) === JSON.stringify({
    title: rightNormalized.title,
    starred: rightNormalized.starred,
    lifecycleState: rightNormalized.lifecycleState,
    endTime: rightNormalized.endTime,
    updatedAt: rightNormalized.updatedAt,
    syncContentHash: rightNormalized.syncContentHash,
    summaries: Object.keys(rightNormalized.summaries || {}).sort(),
    assistantOutputs: Object.keys(
      rightNormalized.artifacts?.assistantOutputs || {}
    ).sort(),
    assistantMemoryUpdatedAt:
      rightNormalized.artifacts?.assistantMemory?.updatedAt || 0,
    assistantStateUpdatedAt:
      rightNormalized.artifacts?.assistantState?.updatedAt || 0,
    eventCount: (rightNormalized.events || []).length,
  });
}

function getSessionTimeWindow(
  session: Pick<StoredMeetingSession, "startTime" | "endTime" | "lastSeenAt">
): { start: number; end: number } {
  return {
    start: session.startTime,
    end: session.endTime || session.lastSeenAt || session.startTime,
  };
}

function hasMeaningfulEventOverlap(
  left: StoredMeetingSession,
  right: StoredMeetingSession
): boolean {
  const leftEventKeys = new Set(
    (left.events || []).map((event) => event.stableEventKey || event.eventId)
  );
  const rightEventKeys = (right.events || []).map(
    (event) => event.stableEventKey || event.eventId
  );

  if (leftEventKeys.size === 0 || rightEventKeys.length === 0) {
    return false;
  }

  let overlapCount = 0;
  for (const eventKey of rightEventKeys) {
    if (leftEventKeys.has(eventKey)) {
      overlapCount += 1;
    }
  }

  return overlapCount > 0 && overlapCount >= Math.min(leftEventKeys.size, rightEventKeys.length) * 0.2;
}

function isLikelyDuplicateMeetingSession(
  left: StoredMeetingSession,
  right: StoredMeetingSession
): boolean {
  if (!left.sessionFingerprint || !right.sessionFingerprint) {
    return false;
  }

  if (left.sessionFingerprint !== right.sessionFingerprint) {
    return false;
  }

  const leftWindow = getSessionTimeWindow(left);
  const rightWindow = getSessionTimeWindow(right);
  const startDistanceMs = Math.abs(leftWindow.start - rightWindow.start);
  const overlapMs = Math.min(leftWindow.end, rightWindow.end) - Math.max(leftWindow.start, rightWindow.start);

  if (hasMeaningfulEventOverlap(left, right)) {
    return true;
  }

  return startDistanceMs <= 90 * 60_000 && overlapMs >= -10 * 60_000;
}

function chooseCanonicalSessionSyncId(
  left: StoredMeetingSession,
  right: StoredMeetingSession
): string {
  const leftSyncId = left.sessionSyncId || left.id;
  const rightSyncId = right.sessionSyncId || right.id;

  if (left.startTime === right.startTime) {
    return leftSyncId.localeCompare(rightSyncId) <= 0 ? leftSyncId : rightSyncId;
  }

  return left.startTime < right.startTime ? leftSyncId : rightSyncId;
}

async function listLocalSessionsBySyncId(): Promise<Map<string, StoredMeetingSession>> {
  const historyDbModule = await import("../../history-db");
  const sessions = await historyDbModule.listStoredMeetingSessionRecords();
  return new Map(
    sessions.map((session) => [session.sessionSyncId || session.id, session] as const)
  );
}

async function loadConnectedProviders(): Promise<CloudSyncProvider[]> {
  const settingsModule = await import("../../settings");
  const { settings } = await settingsModule.getSettings();
  return [...settings.connectedCloudProviders];
}

function buildProviderTargets(
  connectedProviders: CloudSyncProvider[],
  excludedProviders: CloudSyncProvider[] = []
): CloudSyncProvider[] | null {
  const excludedSet = new Set(excludedProviders);
  const supportedProviders = filterSupportedCloudSyncProviders(connectedProviders).filter(
    (provider) => !excludedSet.has(provider)
  );
  return supportedProviders.length > 0 ? supportedProviders : null;
}

async function enqueueSessionFanOut(
  session: StoredMeetingSession,
  options?: {
    excludedProviders?: CloudSyncProvider[];
  }
): Promise<void> {
  const connectedProviders = await loadConnectedProviders();
  const normalized = normalizeMeetingSession(session);
  const sessionSyncId = normalized.sessionSyncId || normalized.id;
  const providerTargets = buildProviderTargets(
    connectedProviders,
    options?.excludedProviders || []
  );
  const scheduledAt = Date.now() + getMeetingSessionSyncDelayMs(normalized);

  if (!providerTargets || providerTargets.length === 0) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_fan_out_skipped_no_targets", {
      sessionSyncId,
      excludedProviders: options?.excludedProviders || [],
    }, {
      sessionId: normalized.id,
    });
    return;
  }

  await enqueueCloudSyncTask(
    {
      dedupeKey: `session-meta:${sessionSyncId}`,
      kind: "sync-session-meta",
      entityId: sessionSyncId,
      contentHash: normalized.syncContentHash,
      providerTargets,
      schedulingStrategy: "latest",
    },
    scheduledAt
  );
  await enqueueCloudSyncTask(
    {
      dedupeKey: `session-events:${sessionSyncId}`,
      kind: "sync-session-events",
      entityId: sessionSyncId,
      contentHash: getSessionEventsSyncContentHash(normalized),
      providerTargets,
      schedulingStrategy: "latest",
    },
    scheduledAt
  );
  await enqueueCloudSyncTask(
    {
      dedupeKey: `session-artifacts:${sessionSyncId}`,
      kind: "sync-session-artifacts",
      entityId: sessionSyncId,
      contentHash: getSessionArtifactsSyncContentHash(normalized),
      providerTargets,
      schedulingStrategy: "latest",
    },
    scheduledAt
  );
  await cloudSyncProviderDiagnostics.debug("cloud_sync_fan_out_enqueued", {
    sessionSyncId,
    providerTargets,
    scheduledAt,
    eventCount: (normalized.events || []).length,
  }, {
    sessionId: normalized.id,
  });
}

async function enqueueDeleteFanOut(
  sessionId: string,
  options?: {
    excludedProviders?: CloudSyncProvider[];
  }
): Promise<void> {
  const connectedProviders = await loadConnectedProviders();
  const providerTargets = buildProviderTargets(
    connectedProviders,
    options?.excludedProviders || []
  );
  if (!providerTargets || providerTargets.length === 0) {
    return;
  }
  await enqueueCloudSyncTask({
    dedupeKey: `delete-session:${sessionId}`,
    kind: "delete-session",
    entityId: sessionId,
    providerTargets,
  });
}

async function enqueueClearArchiveFanOut(options?: {
  excludedProviders?: CloudSyncProvider[];
}): Promise<void> {
  const connectedProviders = await loadConnectedProviders();
  const providerTargets = buildProviderTargets(
    connectedProviders,
    options?.excludedProviders || []
  );
  if (!providerTargets || providerTargets.length === 0) {
    return;
  }
  await enqueueCloudSyncTask({
    dedupeKey: "clear-archive",
    kind: "clear-archive",
    entityId: "vault",
    providerTargets,
  });
}

async function suppressProviderFromQueuedTaskTargets(
  provider: CloudSyncProvider,
  dedupeKeys: string[]
): Promise<void> {
  const tasks = await listCloudSyncTasks();
  const targetTasks = tasks.filter((task) => dedupeKeys.includes(task.dedupeKey));

  await Promise.all(
    targetTasks.map(async (task) => {
      if (!task.providerTargets) {
        return;
      }

      const nextTargets = task.providerTargets.filter(
        (currentProvider) => currentProvider !== provider
      );

      if (nextTargets.length === task.providerTargets.length) {
        return;
      }

      if (nextTargets.length === 0) {
        await removeCloudSyncTask(task.id);
        await cloudSyncProviderDiagnostics.debug("cloud_sync_queue_target_removed", {
          provider,
          dedupeKey: task.dedupeKey,
          reason: "no-targets-remaining",
        });
        return;
      }

      await updateCloudSyncTask({
        ...task,
        providerTargets: nextTargets,
        updatedAt: Date.now(),
      });
      await cloudSyncProviderDiagnostics.trace("cloud_sync_queue_targets_filtered", {
        provider,
        dedupeKey: task.dedupeKey,
        nextTargets,
      });
    })
  );
}

async function applyRemoteSharedSettings(
  bytes: Uint8Array,
  provider: CloudSyncProvider,
  checkpoint?: CloudSyncProviderCheckpoint
): Promise<{ changed: boolean; blockedByPendingChoice: boolean }> {
  const payload = await decryptCloudSyncPayload<unknown>(bytes);
  const remoteSharedSettings = parseSharedSettingsPayload(payload);
  if (!remoteSharedSettings) {
    await cloudSyncProviderDiagnostics.warn("cloud_sync_remote_settings_invalid", {
      provider,
    }, {
      provider,
    });
    return { changed: false, blockedByPendingChoice: false };
  }

  const pendingDecision = await getCloudSyncPendingSettingsDecision();
  if (pendingDecision) {
    await cloudSyncProviderDiagnostics.debug("cloud_sync_remote_settings_blocked_pending_choice", {
      provider,
      pendingProvider: pendingDecision.provider,
    }, {
      provider,
    });
    return { changed: false, blockedByPendingChoice: true };
  }

  const settingsModule = await import("../../settings");
  const { settings } = await settingsModule.getSettings();
  const localSharedSettings = buildSharedSettingsPayload(settings);
  const defaultSharedSettings = buildSharedSettingsPayload(DEFAULT_SETTINGS);

  if (isSharedSettingsEqual(localSharedSettings, remoteSharedSettings)) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_remote_settings_noop", {
      provider,
      reason: "already-equal",
    }, {
      provider,
    });
    return { changed: false, blockedByPendingChoice: false };
  }

  const requiresFirstConnectChoice =
    !checkpoint?.lastAppliedRemoteChangeAt &&
    !isSharedSettingsEqual(localSharedSettings, defaultSharedSettings) &&
    !isSharedSettingsEqual(remoteSharedSettings, defaultSharedSettings);

  if (requiresFirstConnectChoice) {
    await saveCloudSyncPendingSettingsDecision({
      provider,
      detectedAt: Date.now(),
      localSettings: localSharedSettings,
      remoteSettings: remoteSharedSettings,
    });

    await cloudSyncProviderDiagnostics.info("cloud_sync_remote_settings_requires_choice", {
      provider,
    }, {
      provider,
    });

    return { changed: false, blockedByPendingChoice: true };
  }

  const nextSharedSettings = isSharedSettingsEqual(localSharedSettings, defaultSharedSettings)
    ? remoteSharedSettings
    : isSharedSettingsEqual(remoteSharedSettings, defaultSharedSettings)
      ? localSharedSettings
      : mergeSharedSettings(localSharedSettings, remoteSharedSettings);

  if (isSharedSettingsEqual(localSharedSettings, nextSharedSettings)) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_remote_settings_merge_noop", {
      provider,
    }, {
      provider,
    });
    return { changed: false, blockedByPendingChoice: false };
  }

  const saveSettingsResponse = await settingsModule.saveSettings(nextSharedSettings);
  await suppressProviderFromQueuedTaskTargets(provider, [
    "shared-settings",
    `device-profile:${saveSettingsResponse.settings.deviceId}`,
  ]);
  await clearCloudSyncPendingSettingsDecision();
  await cloudSyncProviderDiagnostics.info("cloud_sync_remote_settings_applied", {
    provider,
  }, {
    provider,
  });
  return { changed: true, blockedByPendingChoice: false };
}

function buildRemoteSession(
  metaBytes: Uint8Array,
  eventsBytes: Uint8Array | null,
  eventsPayloadOverride?: {
    sessionSyncId: string;
    updatedAt?: number;
    syncContentHash?: string;
    events: StoredMeetingSession["events"];
    summaries: Record<string, never>;
    assistantOutputs: Record<string, never>;
  } | null,
  artifactsBytes?: Uint8Array
): Promise<StoredMeetingSession | null> {
  return (async () => {
    const metaPayload = parseSessionMetaPayload(
      await decryptCloudSyncPayload<unknown>(metaBytes)
    );
    const eventsPayload =
      eventsPayloadOverride ||
      (eventsBytes
        ? parseSessionEventsPayload(
            await decryptCloudSyncPayload<unknown>(eventsBytes)
          )
        : null);
    const artifactsPayload = artifactsBytes
      ? parseSessionArtifactsPayload(
          await decryptCloudSyncPayload<unknown>(artifactsBytes)
        )
      : null;

    if (!metaPayload || !eventsPayload) {
      return null;
    }

    const sessionSummaries = artifactsPayload?.summaries || eventsPayload.summaries;
    const assistantOutputs =
      artifactsPayload?.assistantOutputs || eventsPayload.assistantOutputs;
    const assistantMemory =
      artifactsPayload?.assistantMemory || eventsPayload.assistantMemory;
    const assistantState =
      artifactsPayload?.assistantState || eventsPayload.assistantState;

    return normalizeMeetingSession({
      id: metaPayload.sessionSyncId,
      sessionSyncId: metaPayload.sessionSyncId,
      schemaVersion: 3,
      platform: metaPayload.platform,
      providerLabel: metaPayload.providerLabel,
      meetingUrl: metaPayload.meetingUrl,
      title: metaPayload.title,
      starred: metaPayload.starred,
      identifiers: metaPayload.identifiers,
      sessionFingerprint: metaPayload.sessionFingerprint,
      lifecycleState: metaPayload.lifecycleState,
      lastSeenAt: metaPayload.lastSeenAt,
      meetingProfileId: metaPayload.meetingProfileId,
      updatedAt:
        Math.max(
          metaPayload.updatedAt || 0,
          eventsPayload.updatedAt || 0,
          artifactsPayload?.updatedAt || 0
        ) ||
        undefined,
      updatedByDeviceId: metaPayload.updatedByDeviceId,
      searchableText: "",
      startTime: metaPayload.startTime,
      endTime: metaPayload.endTime,
      events: eventsPayload.events,
      captions: [],
      chatMessages: [],
      summaries: sessionSummaries,
      artifacts: {
        summaries: sessionSummaries,
        assistantOutputs,
        assistantMemory,
        assistantState,
      },
    });
  })();
}

async function applyRemoteSessionEntry(
  entry: RemoteSessionEntry,
  adapters: SyncFileAdapters,
  localSessionsBySyncId: Map<string, StoredMeetingSession>,
  provider: CloudSyncProvider
): Promise<boolean> {
  if (!entry.metaFile || (!entry.eventsFile && !entry.eventsManifestFile)) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_remote_session_skipped", {
      sessionId: entry.sessionId,
      reason: "missing-meta-or-event-stream",
    }, {
      sessionId: entry.sessionId,
    });
    return false;
  }

  const chunkedEventsPayload = entry.eventsManifestFile
    ? await readChunkedSessionEventsPayload(entry, adapters)
    : null;
  const remoteSession = await buildRemoteSession(
    await adapters.readFile(getSessionMetaPath(entry.sessionId)),
    entry.eventsFile ? await adapters.readFile(getSessionEventsPath(entry.sessionId)) : null,
    chunkedEventsPayload,
    entry.artifactsFile
      ? await adapters.readFile(getSessionArtifactsPath(entry.sessionId))
      : undefined
  );

  if (!remoteSession) {
    await cloudSyncProviderDiagnostics.warn("cloud_sync_remote_session_invalid", {
      sessionId: entry.sessionId,
    }, {
      sessionId: entry.sessionId,
    });
    return false;
  }

  const historyDbModule = await import("../../history-db");
  const localSession = localSessionsBySyncId.get(
    remoteSession.sessionSyncId || remoteSession.id
  );
  const duplicateSessionCandidate =
    !localSession && remoteSession.sessionFingerprint
      ? await historyDbModule.findLatestStoredMeetingSessionRecordByFingerprint(
          remoteSession.sessionFingerprint
        )
      : undefined;
  const duplicateSession =
    duplicateSessionCandidate &&
    duplicateSessionCandidate.id !== remoteSession.id &&
    isLikelyDuplicateMeetingSession(duplicateSessionCandidate, remoteSession)
      ? duplicateSessionCandidate
      : undefined;
  const baseSession = localSession || duplicateSession;

  if (!baseSession) {
    await historyDbModule.putStoredMeetingSessionRecord(remoteSession);
    localSessionsBySyncId.set(remoteSession.sessionSyncId || remoteSession.id, remoteSession);
    await enqueueSessionFanOut(remoteSession, {
      excludedProviders: [provider],
    });
    await cloudSyncProviderDiagnostics.info("cloud_sync_remote_session_created", {
      sessionId: remoteSession.id,
      sessionSyncId: remoteSession.sessionSyncId || remoteSession.id,
      eventCount: (remoteSession.events || []).length,
    }, {
      sessionId: remoteSession.id,
    });
    return true;
  }

  const previousSessionSyncId = baseSession.sessionSyncId || baseSession.id;
  const mergedSession = normalizeMeetingSession({
    ...mergeMeetingSessions(baseSession, remoteSession),
    sessionSyncId: chooseCanonicalSessionSyncId(baseSession, remoteSession),
  });
  if (areSessionsEquivalent(baseSession, mergedSession)) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_remote_session_noop", {
      sessionId: mergedSession.id,
      sessionSyncId: mergedSession.sessionSyncId || mergedSession.id,
    }, {
      sessionId: mergedSession.id,
    });
    return false;
  }

  await historyDbModule.putStoredMeetingSessionRecord(mergedSession);
  if (previousSessionSyncId !== (mergedSession.sessionSyncId || mergedSession.id)) {
    localSessionsBySyncId.delete(previousSessionSyncId);
    await enqueueDeleteFanOut(previousSessionSyncId, {
      excludedProviders: [provider],
    });
  }
  localSessionsBySyncId.set(mergedSession.sessionSyncId || mergedSession.id, mergedSession);
  await enqueueSessionFanOut(mergedSession, {
    excludedProviders: [provider],
  });
  await cloudSyncProviderDiagnostics.info("cloud_sync_remote_session_merged", {
    sessionId: mergedSession.id,
    previousSessionSyncId,
    nextSessionSyncId: mergedSession.sessionSyncId || mergedSession.id,
    eventCount: (mergedSession.events || []).length,
  }, {
    sessionId: mergedSession.id,
  });
  return true;
}

async function applyRemoteDeleteSession(
  bytes: Uint8Array,
  provider: CloudSyncProvider
): Promise<boolean> {
  const payload = parseDeleteSessionPayload(
    await decryptCloudSyncPayload<unknown>(bytes)
  );
  if (!payload) {
    await cloudSyncProviderDiagnostics.warn("cloud_sync_remote_delete_invalid");
    return false;
  }

  const localSessionsBySyncId = await listLocalSessionsBySyncId();
  const localSession =
    localSessionsBySyncId.get(payload.deletedSessionId) ||
    [...localSessionsBySyncId.values()].find((session) => session.id === payload.deletedSessionId);

  if (!localSession) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_remote_delete_noop", {
      sessionId: payload.deletedSessionId,
    }, {
      sessionId: payload.deletedSessionId,
    });
    return false;
  }

  const historyDbModule = await import("../../history-db");
  await historyDbModule.deleteStoredMeetingSessionRecord(localSession.id);
  await enqueueDeleteFanOut(payload.deletedSessionId, {
    excludedProviders: [provider],
  });
  await cloudSyncProviderDiagnostics.info("cloud_sync_remote_delete_applied", {
    sessionId: payload.deletedSessionId,
  }, {
    sessionId: payload.deletedSessionId,
  });
  return true;
}

async function applyRemoteClearArchive(
  bytes: Uint8Array,
  provider: CloudSyncProvider
): Promise<boolean> {
  const payload = parseClearArchivePayload(
    await decryptCloudSyncPayload<unknown>(bytes)
  );
  if (!payload) {
    await cloudSyncProviderDiagnostics.warn("cloud_sync_remote_clear_invalid");
    return false;
  }

  const historyDbModule = await import("../../history-db");
  const existingSessions = await historyDbModule.listStoredMeetingSessionRecords();
  if (existingSessions.length === 0) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_remote_clear_noop");
    return false;
  }

  await historyDbModule.clearStoredMeetingSessionRecords();
  await enqueueClearArchiveFanOut({
    excludedProviders: [provider],
  });
  await cloudSyncProviderDiagnostics.warn("cloud_sync_remote_clear_applied", {
    clearedSessionCount: existingSessions.length,
  });
  return true;
}

async function readOptionalCloudSyncFile(
  adapters: Pick<SyncFileAdapters, "readFile">,
  path: string
): Promise<Uint8Array | null> {
  try {
    return await adapters.readFile(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found|404/i.test(message)) {
      return null;
    }

    throw error;
  }
}

async function syncSessionEventChunks(
  adapters: SyncFileAdapters,
  session: StoredMeetingSession,
  sessionId: string
): Promise<void> {
  const { manifest, chunks } = buildSessionEventsChunkPayloads(session);
  const existingManifestBytes = await readOptionalCloudSyncFile(
    adapters,
    getSessionEventsManifestPath(sessionId)
  );
  const existingManifest = existingManifestBytes
    ? parseSessionEventsManifestPayload(
        await decryptCloudSyncPayload<unknown>(existingManifestBytes)
      )
    : null;

  const existingChunkHashes = new Map(
    (existingManifest?.chunks || []).map((chunk) => [chunk.index, chunk.contentHash] as const)
  );

  await Promise.all(
    chunks
      .filter((chunk) => existingChunkHashes.get(chunk.chunkIndex) !== chunk.contentHash)
      .map(async (chunk) =>
        adapters.writeFile(
          getSessionEventsChunkPath(sessionId, chunk.chunkIndex),
          await encryptCloudSyncPayload(chunk)
        )
      )
  );

  const staleChunkIndexes =
    existingManifest?.chunks
      .map((chunk) => chunk.index)
      .filter((index) => index >= chunks.length) || [];
  await Promise.all(
    staleChunkIndexes.map((chunkIndex) =>
      adapters.deleteFile(getSessionEventsChunkPath(sessionId, chunkIndex)).catch(() => undefined)
    )
  );

  await adapters.writeFile(
    getSessionEventsManifestPath(sessionId),
    await encryptCloudSyncPayload(manifest)
  );

  await adapters.deleteFile(getSessionEventsPath(sessionId)).catch(() => undefined);
}

async function readChunkedSessionEventsPayload(
  entry: RemoteSessionEntry,
  adapters: SyncFileAdapters
): Promise<{
  sessionSyncId: string;
  updatedAt?: number;
  syncContentHash?: string;
  events: StoredMeetingSession["events"];
  summaries: Record<string, never>;
  assistantOutputs: Record<string, never>;
} | null> {
  if (!entry.eventsManifestFile) {
    return null;
  }

  const manifestBytes = await adapters.readFile(entry.eventsManifestFile.path);
  const manifest = parseSessionEventsManifestPayload(
    await decryptCloudSyncPayload<unknown>(manifestBytes)
  );
  if (!manifest) {
    return null;
  }

  const chunkPayloads = await Promise.all(
    manifest.chunks.map(async (chunk) => {
      const bytes = await adapters.readFile(
        getSessionEventsChunkPath(entry.sessionId, chunk.index)
      );
      return parseSessionEventsChunkPayload(
        await decryptCloudSyncPayload<unknown>(bytes)
      );
    })
  );

  if (chunkPayloads.some((chunk) => !chunk)) {
    return null;
  }

  return {
    sessionSyncId: manifest.sessionSyncId,
    updatedAt: manifest.updatedAt,
    syncContentHash: manifest.syncContentHash,
    events: chunkPayloads
      .sort((left, right) => left!.chunkIndex - right!.chunkIndex)
      .flatMap((chunk) => chunk!.events),
    summaries: {},
    assistantOutputs: {},
  };
}

async function listFilesForReconciliation(
  adapters: SyncFileAdapters,
  provider: CloudSyncProvider,
  checkpoint?: CloudSyncProviderCheckpoint
): Promise<{ files: CloudSyncFileRecord[]; reconciliationCursor?: string }> {
  if (checkpoint?.reconciliationCursor && adapters.listChangedFiles) {
    try {
      const delta = await adapters.listChangedFiles(checkpoint.reconciliationCursor);
      await cloudSyncProviderDiagnostics.debug("cloud_sync_reconcile_delta_loaded", {
        provider,
        fileCount: delta.files.length,
      });
      return {
        files: delta.files,
        reconciliationCursor: delta.cursor || checkpoint.reconciliationCursor,
      };
    } catch (error) {
      await cloudSyncProviderDiagnostics.warn("cloud_sync_reconcile_delta_failed", {
        provider,
        error,
      }, {
        provider,
      });
    }
  }

  const prefixes = ["settings/", "tombstones/", "sessions/"];
  const groupedFiles = await Promise.all(prefixes.map((prefix) => adapters.listFiles(prefix)));
  const dedupedFiles = new Map<string, CloudSyncFileRecord>();

  groupedFiles.flat().forEach((file) => {
    dedupedFiles.set(file.path, file);
  });

  await cloudSyncProviderDiagnostics.debug("cloud_sync_reconcile_file_scan_completed", {
    provider,
    prefixes,
    fileCount: dedupedFiles.size,
  });

  return {
    files: [...dedupedFiles.values()],
    reconciliationCursor: adapters.getLatestChangeCursor
      ? await adapters.getLatestChangeCursor()
      : checkpoint?.reconciliationCursor,
  };
}

async function reconcileProviderState(
  adapters: SyncFileAdapters,
  provider: CloudSyncProvider,
  checkpoint?: CloudSyncProviderCheckpoint
): Promise<CloudSyncTaskProcessingResult> {
  const reconciliationListing = await listFilesForReconciliation(
    adapters,
    provider,
    checkpoint
  );
  const files = reconciliationListing.files;
  const lastAppliedRemoteChangeAt = checkpoint?.lastAppliedRemoteChangeAt || 0;
  const nextAppliedRemoteChangeAt = files.reduce(
    (latest, file) => Math.max(latest, file.updatedAt),
    lastAppliedRemoteChangeAt
  );

  if (nextAppliedRemoteChangeAt <= lastAppliedRemoteChangeAt) {
    await cloudSyncProviderDiagnostics.trace("cloud_sync_reconcile_no_changes", {
      provider,
      fileCount: files.length,
      lastAppliedRemoteChangeAt,
    }, {
      provider,
    });
    return {
      success: true,
      checkpointUpdates: {
        lastAppliedRemoteChangeAt,
        lastScanAt: Date.now(),
        reconciliationCursor:
          reconciliationListing.reconciliationCursor ?? checkpoint?.reconciliationCursor,
      },
    };
  }

  const localSessionsBySyncId = await listLocalSessionsBySyncId();
  const sessionEntries = new Map<string, RemoteSessionEntry>();
  const newDeleteFiles: CloudSyncFileRecord[] = [];
  let sharedSettingsFile: CloudSyncFileRecord | undefined;
  let clearArchiveFile: CloudSyncFileRecord | undefined;

  files.forEach((file) => {
    if (file.path === "settings/shared.json.enc") {
      sharedSettingsFile = file;
      return;
    }

    if (file.path === getClearArchivePath()) {
      clearArchiveFile = file;
      return;
    }

    const sessionMetaMatch = file.path.match(/^sessions\/([^/]+)\/meta\.json\.enc$/);
    if (sessionMetaMatch) {
      const sessionId = sessionMetaMatch[1]!;
      const existing = sessionEntries.get(sessionId) || { sessionId };
      existing.metaFile = file;
      sessionEntries.set(sessionId, existing);
      return;
    }

    const sessionEventsMatch = file.path.match(/^sessions\/([^/]+)\/events\.json\.enc$/);
    if (sessionEventsMatch) {
      const sessionId = sessionEventsMatch[1]!;
      const existing = sessionEntries.get(sessionId) || { sessionId };
      existing.eventsFile = file;
      sessionEntries.set(sessionId, existing);
      return;
    }

    const sessionEventsManifestMatch = file.path.match(
      /^sessions\/([^/]+)\/events\.manifest\.json\.enc$/
    );
    if (sessionEventsManifestMatch) {
      const sessionId = sessionEventsManifestMatch[1]!;
      const existing = sessionEntries.get(sessionId) || { sessionId };
      existing.eventsManifestFile = file;
      sessionEntries.set(sessionId, existing);
      return;
    }

    const sessionArtifactsMatch = file.path.match(
      /^sessions\/([^/]+)\/artifacts\.json\.enc$/
    );
    if (sessionArtifactsMatch) {
      const sessionId = sessionArtifactsMatch[1]!;
      const existing = sessionEntries.get(sessionId) || { sessionId };
      existing.artifactsFile = file;
      sessionEntries.set(sessionId, existing);
      return;
    }

    if (/^tombstones\/session-.+\.json\.enc$/.test(file.path)) {
      newDeleteFiles.push(file);
    }
  });

  if (clearArchiveFile && clearArchiveFile.updatedAt > lastAppliedRemoteChangeAt) {
    await applyRemoteClearArchive(
      await adapters.readFile(clearArchiveFile.path),
      provider
    );
    localSessionsBySyncId.clear();
  }

  for (const deleteFile of newDeleteFiles
    .filter((file) => file.updatedAt > lastAppliedRemoteChangeAt)
    .sort((left, right) => left.updatedAt - right.updatedAt)) {
    await applyRemoteDeleteSession(
      await adapters.readFile(deleteFile.path),
      provider
    );
    localSessionsBySyncId.delete(
      deleteFile.path
        .replace(/^tombstones\/session-/, "")
        .replace(/\.json\.enc$/, "")
    );
  }

  if (sharedSettingsFile && sharedSettingsFile.updatedAt > lastAppliedRemoteChangeAt) {
    await applyRemoteSharedSettings(
      await adapters.readFile(sharedSettingsFile.path),
      provider,
      checkpoint
    );
  }

  const newSessionEntries = [...sessionEntries.values()]
    .filter((entry) => {
      const newestFileUpdatedAt = Math.max(
        entry.metaFile?.updatedAt || 0,
        entry.eventsFile?.updatedAt || 0,
        entry.eventsManifestFile?.updatedAt || 0,
        entry.artifactsFile?.updatedAt || 0
      );
      return newestFileUpdatedAt > lastAppliedRemoteChangeAt;
    })
    .sort((left, right) => {
      const leftUpdatedAt = Math.max(
        left.metaFile?.updatedAt || 0,
        left.eventsFile?.updatedAt || 0,
        left.eventsManifestFile?.updatedAt || 0,
        left.artifactsFile?.updatedAt || 0
      );
      const rightUpdatedAt = Math.max(
        right.metaFile?.updatedAt || 0,
        right.eventsFile?.updatedAt || 0,
        right.eventsManifestFile?.updatedAt || 0,
        right.artifactsFile?.updatedAt || 0
      );
      return leftUpdatedAt - rightUpdatedAt;
    });

  for (const entry of newSessionEntries) {
    await applyRemoteSessionEntry(entry, adapters, localSessionsBySyncId, provider);
  }

  await cloudSyncProviderDiagnostics.info("cloud_sync_reconcile_completed", {
    provider,
    fileCount: files.length,
    newDeleteCount: newDeleteFiles.length,
    newSessionCount: newSessionEntries.length,
    appliedRemoteChangeAt: nextAppliedRemoteChangeAt,
  }, {
    provider,
  });

  return {
    success: true,
    checkpointUpdates: {
      lastAppliedRemoteChangeAt: nextAppliedRemoteChangeAt,
      lastScanAt: Date.now(),
      reconciliationCursor:
        reconciliationListing.reconciliationCursor ?? checkpoint?.reconciliationCursor,
    },
  };
}

async function syncProviderTask(
  task: CloudSyncTask,
  adapters: SyncFileAdapters,
  checkpoint?: CloudSyncProviderCheckpoint
): Promise<CloudSyncTaskProcessingResult> {
  try {
    await cloudSyncProviderDiagnostics.debug("cloud_sync_task_started", {
      provider: task.providerTargets,
      kind: task.kind,
      entityId: task.entityId || null,
    });
    await adapters.ensureAppFolder();
    await ensureVaultKeyRemote(adapters.listFiles, adapters.readFile, adapters.writeFile);

    const settingsModule = await import("../../settings");
    const { settings } = await settingsModule.getSettings();

    if (task.kind === "sync-shared-settings") {
      await adapters.writeFile(
        "settings/shared.json.enc",
        await encryptCloudSyncPayload(buildSharedSettingsPayload(settings))
      );
      return {
        success: true,
        checkpointUpdates: { lastUploadedLocalChangeAt: Date.now() },
      };
    }

    if (task.kind === "sync-device-profile") {
      await adapters.writeFile(
        `devices/${settings.deviceId}.json.enc`,
        await encryptCloudSyncPayload(buildDeviceProfilePayload(settings))
      );
      return {
        success: true,
        checkpointUpdates: { lastUploadedLocalChangeAt: Date.now() },
      };
    }

    if (
      task.kind === "sync-session-meta" ||
      task.kind === "sync-session-events" ||
      task.kind === "sync-session-artifacts"
    ) {
      if (!task.entityId) {
        return {
          success: false,
          errorKind: "action-required",
          message: "Cloud sync session task is missing a session id.",
          retryable: false,
        };
      }

      const historyDbModule = await import("../../history-db");
      const rawSession =
        (await historyDbModule.getStoredMeetingSessionRecordBySyncId?.(task.entityId)) ||
        (await historyDbModule.getStoredMeetingSessionRecord(task.entityId));
      if (!rawSession) {
        return { success: true };
      }

      const sessionModule = await import("../../../shared/meeting-session");
      const session = sessionModule.normalizeMeetingSession(rawSession);

      if (task.kind === "sync-session-meta") {
        await adapters.writeFile(
          getSessionMetaPath(task.entityId),
          await encryptCloudSyncPayload(buildSessionMetaPayload(session))
        );
      } else if (task.kind === "sync-session-events") {
        await syncSessionEventChunks(adapters, session, task.entityId);
      } else {
        await adapters.writeFile(
          getSessionArtifactsPath(task.entityId),
          await encryptCloudSyncPayload(buildSessionArtifactsPayload(session))
        );
      }

      return {
        success: true,
        checkpointUpdates: { lastUploadedLocalChangeAt: Date.now() },
      };
    }

    if (task.kind === "delete-session") {
      if (!task.entityId) {
        return { success: true };
      }

      await adapters.writeFile(
        getDeleteSessionPath(task.entityId),
        await encryptCloudSyncPayload(buildDeleteSessionPayload(task.entityId))
      );
      await adapters.deleteFile(getSessionMetaPath(task.entityId));
      await adapters.deleteFile(getSessionEventsPath(task.entityId));
      const eventChunkFiles = await adapters
        .listFiles(getSessionEventsChunkDirectoryPath(task.entityId))
        .catch(() => []);
      await adapters.deleteFile(getSessionEventsManifestPath(task.entityId)).catch(
        () => undefined
      );
      await Promise.all(
        eventChunkFiles.map((file) =>
          adapters.deleteFile(file.path, file.versionToken).catch(() => undefined)
        )
      );
      await adapters.deleteFile(getSessionArtifactsPath(task.entityId));
      return {
        success: true,
        checkpointUpdates: { lastUploadedLocalChangeAt: Date.now() },
      };
    }

    if (task.kind === "clear-archive") {
      const files = await adapters.listFiles("");
      await adapters.writeFile(
        getClearArchivePath(),
        await encryptCloudSyncPayload(buildClearArchivePayload())
      );
      await Promise.all(
        files
          .filter((file) => file.path !== "vault-key.json")
          .map((file) => adapters.deleteFile(file.path, file.versionToken))
      );
      return {
        success: true,
        checkpointUpdates: { lastUploadedLocalChangeAt: Date.now() },
      };
    }

    if (task.kind === "reconcile-provider") {
      return reconcileProviderState(
        adapters,
        (task.entityId as CloudSyncProvider) || "google-drive",
        checkpoint
      );
    }

    await cloudSyncProviderDiagnostics.trace("cloud_sync_task_noop", {
      kind: task.kind,
      entityId: task.entityId || null,
    });
    return {
      success: true,
      checkpointUpdates: { lastUploadedLocalChangeAt: Date.now() },
    };
  } catch (error) {
    const classified = classifyProviderError(error);
    await cloudSyncProviderDiagnostics.error("cloud_sync_task_failed", {
      kind: task.kind,
      entityId: task.entityId || null,
      error,
      errorKind: classified.kind,
      retryable: classified.retryable,
    });
    return {
      success: false,
      errorKind: classified.kind,
      retryable: classified.retryable,
      message: classified.message,
    };
  }
}

async function syncGoogleDriveTask(
  task: CloudSyncTask,
  checkpoint?: CloudSyncProviderCheckpoint
): Promise<CloudSyncTaskProcessingResult> {
  return syncProviderTask(task, {
    ensureAppFolder: ensureGoogleDriveAppFolder,
    listFiles: listGoogleDriveFiles,
    listChangedFiles: listGoogleDriveChangedFiles,
    getLatestChangeCursor: getGoogleDriveChangesCursor,
    readFile: readGoogleDriveFile,
    writeFile: writeGoogleDriveFile,
    deleteFile: deleteGoogleDriveFile,
  }, checkpoint);
}

async function syncOneDriveTask(
  task: CloudSyncTask,
  checkpoint?: CloudSyncProviderCheckpoint
): Promise<CloudSyncTaskProcessingResult> {
  return syncProviderTask(task, {
    ensureAppFolder: ensureOneDriveAppFolder,
    listFiles: listOneDriveFiles,
    listChangedFiles: listOneDriveChangedFiles,
    getLatestChangeCursor: getOneDriveChangesCursor,
    readFile: readOneDriveFile,
    writeFile: writeOneDriveFile,
    deleteFile: deleteOneDriveFile,
  }, checkpoint);
}

export async function connectCloudSyncProviderAdapter(
  provider: string
): Promise<CloudSyncProviderCheckpoint> {
  if (provider === "google-drive" || provider === "onedrive") {
    const support = getCloudSyncProviderSupport(provider);
    if (!support.supported) {
      return createUnsupportedCheckpoint(provider);
    }
  }

  if (provider === "google-drive") {
    return connectGoogleDrive();
  }

  if (provider === "onedrive") {
    return connectOneDrive();
  }

  return {
    provider: provider as CloudSyncProviderCheckpoint["provider"],
    connected: false,
    healthState: "needs-attention",
    lastError: "This cloud provider is not implemented yet.",
    lastErrorKind: "needs-attention",
  };
}

export async function disconnectCloudSyncProviderAdapter(
  provider: string
): Promise<CloudSyncProviderCheckpoint> {
  if (provider === "google-drive" || provider === "onedrive") {
    const support = getCloudSyncProviderSupport(provider);
    if (!support.supported) {
      return createUnsupportedCheckpoint(provider);
    }
  }

  if (provider === "google-drive") {
    return disconnectGoogleDrive();
  }

  if (provider === "onedrive") {
    return disconnectOneDrive();
  }

  return {
    provider: provider as CloudSyncProviderCheckpoint["provider"],
    connected: false,
    healthState: "disconnected",
  };
}

export async function processCloudSyncTaskForProvider(
  provider: string,
  task: CloudSyncTask,
  checkpoint?: CloudSyncProviderCheckpoint
): Promise<CloudSyncTaskProcessingResult> {
  await cloudSyncProviderDiagnostics.debug("cloud_sync_process_provider_task", {
    provider,
    kind: task.kind,
    entityId: task.entityId || null,
  }, {
    provider,
  });

  if (provider === "google-drive") {
    return syncGoogleDriveTask(task, checkpoint);
  }

  if (provider === "onedrive") {
    return syncOneDriveTask(task, checkpoint);
  }

  return {
    success: false,
    errorKind: "needs-attention",
    message: "This cloud provider is not implemented yet.",
    retryable: false,
  };
}
