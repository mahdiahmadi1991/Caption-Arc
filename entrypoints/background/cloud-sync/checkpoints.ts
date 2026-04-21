import type {
  CloudSyncDiagnosticEvent,
  CloudSyncEngineState,
  CloudSyncPendingSettingsDecision,
  CloudSyncProviderCheckpoint,
} from "./types";

const CLOUD_SYNC_CHECKPOINTS_STORAGE_KEY = "cloudSyncCheckpoints";
const CLOUD_SYNC_DIAGNOSTICS_STORAGE_KEY = "cloudSyncDiagnostics";
const CLOUD_SYNC_ENGINE_STATE_STORAGE_KEY = "cloudSyncEngineState";
const CLOUD_SYNC_PENDING_SETTINGS_DECISION_STORAGE_KEY =
  "cloudSyncPendingSettingsDecision";
const MAX_DIAGNOSTIC_EVENTS = 100;

async function getStoredValue<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  const value = result[key];
  return value === undefined ? fallback : (value as T);
}

export async function listCloudSyncCheckpoints(): Promise<
  CloudSyncProviderCheckpoint[]
> {
  const checkpoints = await getStoredValue<CloudSyncProviderCheckpoint[]>(
    CLOUD_SYNC_CHECKPOINTS_STORAGE_KEY,
    []
  );
  return Array.isArray(checkpoints) ? checkpoints : [];
}

export async function saveCloudSyncCheckpoints(
  checkpoints: CloudSyncProviderCheckpoint[]
): Promise<void> {
  await chrome.storage.local.set({
    [CLOUD_SYNC_CHECKPOINTS_STORAGE_KEY]: checkpoints,
  });
}

export async function upsertCloudSyncCheckpoint(
  checkpoint: CloudSyncProviderCheckpoint
): Promise<void> {
  const checkpoints = await listCloudSyncCheckpoints();
  const existingIndex = checkpoints.findIndex(
    (current) => current.provider === checkpoint.provider
  );

  if (existingIndex >= 0) {
    checkpoints[existingIndex] = checkpoint;
  } else {
    checkpoints.push(checkpoint);
  }

  await saveCloudSyncCheckpoints(checkpoints);
}

export async function getCloudSyncEngineState(): Promise<CloudSyncEngineState> {
  return getStoredValue<CloudSyncEngineState>(
    CLOUD_SYNC_ENGINE_STATE_STORAGE_KEY,
    { running: false }
  );
}

export async function saveCloudSyncEngineState(
  state: CloudSyncEngineState
): Promise<void> {
  await chrome.storage.local.set({
    [CLOUD_SYNC_ENGINE_STATE_STORAGE_KEY]: state,
  });
}

export async function listCloudSyncDiagnostics(): Promise<
  CloudSyncDiagnosticEvent[]
> {
  const events = await getStoredValue<CloudSyncDiagnosticEvent[]>(
    CLOUD_SYNC_DIAGNOSTICS_STORAGE_KEY,
    []
  );
  return Array.isArray(events) ? events : [];
}

export async function appendCloudSyncDiagnostic(
  event: CloudSyncDiagnosticEvent
): Promise<void> {
  const existing = await listCloudSyncDiagnostics();
  existing.unshift(event);
  await chrome.storage.local.set({
    [CLOUD_SYNC_DIAGNOSTICS_STORAGE_KEY]: existing.slice(0, MAX_DIAGNOSTIC_EVENTS),
  });
}

export async function getCloudSyncPendingSettingsDecision(): Promise<
  CloudSyncPendingSettingsDecision | null
> {
  return getStoredValue<CloudSyncPendingSettingsDecision | null>(
    CLOUD_SYNC_PENDING_SETTINGS_DECISION_STORAGE_KEY,
    null
  );
}

export async function saveCloudSyncPendingSettingsDecision(
  decision: CloudSyncPendingSettingsDecision
): Promise<void> {
  await chrome.storage.local.set({
    [CLOUD_SYNC_PENDING_SETTINGS_DECISION_STORAGE_KEY]: decision,
  });
}

export async function clearCloudSyncPendingSettingsDecision(): Promise<void> {
  await chrome.storage.local.remove(
    CLOUD_SYNC_PENDING_SETTINGS_DECISION_STORAGE_KEY
  );
}