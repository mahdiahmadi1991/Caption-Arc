import type { CloudSyncProvider } from "../types";
import {
  appendCloudSyncDiagnostic,
  getCloudSyncPendingSettingsDecision,
  getCloudSyncEngineState,
  listCloudSyncCheckpoints,
  listCloudSyncDiagnostics,
  saveCloudSyncEngineState,
  saveCloudSyncCheckpoints,
} from "./checkpoints";
import {
  enqueueCloudSyncTask,
  listDueCloudSyncTasks,
  listCloudSyncTasks,
  removeCloudSyncTask,
  updateCloudSyncTask,
} from "./outbox";
import type {
  CloudSyncDiagnosticEvent,
  CloudSyncEngineState,
  CloudSyncProviderCheckpoint,
  CloudSyncState,
  CloudSyncTask,
  CloudSyncTaskProcessingResult,
} from "./types";
import {
  getCloudSyncProviderBaselineCheckpoints,
  mergeCloudSyncProviderCheckpoints,
  normalizeCloudSyncProviderCheckpoint,
  processCloudSyncTaskForProvider,
} from "./providers";
import { filterSupportedCloudSyncProviders } from "../../shared/browser-capabilities";

const MAX_TRANSIENT_RETRY_COUNT = 3;
const TRANSIENT_RETRY_BASE_DELAY_MS = 2_000;
const TRANSIENT_RETRY_MAX_DELAY_MS = 5 * 60_000;

let scheduledRunHandle: ReturnType<typeof timerApi.setTimeout> | null = null;
let scheduledRunAt: number | null = null;
let runInFlight: Promise<void> | null = null;

const timerApi = globalThis;

function createDiagnosticEvent(
  level: CloudSyncDiagnosticEvent["level"],
  message: string,
  provider?: CloudSyncProvider
): CloudSyncDiagnosticEvent {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    level,
    message,
    provider,
  };
}

async function updateEngineState(
  updates: Partial<CloudSyncEngineState>
): Promise<CloudSyncEngineState> {
  const current = await getCloudSyncEngineState();
  const next = {
    ...current,
    ...updates,
  };
  await saveCloudSyncEngineState(next);
  return next;
}

function updateCheckpointForSuccess(
  checkpoint: CloudSyncProviderCheckpoint,
  task: CloudSyncTask,
  result: Extract<CloudSyncTaskProcessingResult, { success: true }>
): CloudSyncProviderCheckpoint {
  const baseCheckpoint: CloudSyncProviderCheckpoint = {
    ...checkpoint,
    healthState: "up-to-date",
    manualRetryAvailable: false,
    lastError: undefined,
    lastErrorKind: undefined,
    lastSuccessfulSyncAt: Date.now(),
  };

  if (task.kind === "reconcile-provider") {
    return {
      ...baseCheckpoint,
      lastAppliedRemoteChangeAt:
        result.checkpointUpdates?.lastAppliedRemoteChangeAt ??
        checkpoint.lastAppliedRemoteChangeAt,
    };
  }

  return {
    ...baseCheckpoint,
    lastUploadedLocalChangeAt:
      result.checkpointUpdates?.lastUploadedLocalChangeAt ?? Date.now(),
  };
}

function updateCheckpointForFailure(
  checkpoint: CloudSyncProviderCheckpoint,
  message: string,
  kind: CloudSyncProviderCheckpoint["lastErrorKind"],
  retryable: boolean,
  manualRetryAvailable: boolean
): CloudSyncProviderCheckpoint {
  return {
    ...checkpoint,
    lastError: message,
    lastErrorKind: kind,
    manualRetryAvailable,
    healthState: retryable
      ? manualRetryAvailable
        ? "needs-attention"
        : "retrying-automatically"
      : kind === "action-required"
        ? "action-required"
        : "needs-attention",
  };
}

function createRetryDelayMs(transientRetryCount: number): number {
  const unclampedDelay =
    TRANSIENT_RETRY_BASE_DELAY_MS * Math.max(1, 2 ** Math.max(0, transientRetryCount - 1));
  const cappedDelay = Math.min(TRANSIENT_RETRY_MAX_DELAY_MS, unclampedDelay);
  const jitterRange = Math.max(250, Math.round(cappedDelay * 0.25));
  const jitterOffset = Math.round((Math.random() * jitterRange * 2) - jitterRange);
  return Math.max(TRANSIENT_RETRY_BASE_DELAY_MS, cappedDelay + jitterOffset);
}

async function processTaskAcrossProviders(
  task: CloudSyncTask,
  checkpoints: CloudSyncProviderCheckpoint[]
): Promise<{ checkpoints: CloudSyncProviderCheckpoint[] }> {
  const targetProviders = (task.providerTargets || checkpoints.map((checkpoint) => checkpoint.provider))
    .map((provider) => checkpoints.find((checkpoint) => checkpoint.provider === provider))
    .filter((checkpoint): checkpoint is CloudSyncProviderCheckpoint =>
      Boolean(checkpoint && checkpoint.connected)
    );

  if (targetProviders.length === 0) {
    await removeCloudSyncTask(task.id);
    return { checkpoints };
  }

  let nextTask: CloudSyncTask | null = { ...task };
  const nextCheckpoints = [...checkpoints];

  for (const checkpoint of targetProviders) {
    const result = await processCloudSyncTaskForProvider(
      checkpoint.provider,
      nextTask,
      checkpoint
    );
    const checkpointIndex = nextCheckpoints.findIndex(
      (current) => current.provider === checkpoint.provider
    );

    if (result.success) {
      if (checkpointIndex >= 0) {
        nextCheckpoints[checkpointIndex] = updateCheckpointForSuccess(
          nextCheckpoints[checkpointIndex]!,
          nextTask,
          result
        );
      }
      continue;
    }

    const nextTransientRetryCount = result.retryable
      ? nextTask.transientRetryCount + 1
      : nextTask.transientRetryCount;
    const manualRetryAvailable =
      result.retryable && nextTransientRetryCount >= MAX_TRANSIENT_RETRY_COUNT;

    if (checkpointIndex >= 0) {
      nextCheckpoints[checkpointIndex] = updateCheckpointForFailure(
        nextCheckpoints[checkpointIndex]!,
        result.message,
        result.errorKind,
        result.retryable,
        manualRetryAvailable
      );
    }

    if (!nextTask) {
      break;
    }

    nextTask = {
      ...nextTask,
      attemptCount: nextTask.attemptCount + 1,
      updatedAt: Date.now(),
      lastError: result.message,
      lastErrorKind: result.errorKind,
      transientRetryCount: nextTransientRetryCount,
      nextAttemptAt: result.retryable
        ? Date.now() +
          (manualRetryAvailable
            ? 24 * 60 * 60_000
            : createRetryDelayMs(nextTransientRetryCount))
        : Date.now() + 60 * 60_000,
    };

    await appendCloudSyncDiagnostic(
      createDiagnosticEvent(
        result.retryable ? "warning" : "error",
        result.message,
        checkpoint.provider
      )
    );

    if (
      !result.retryable ||
      nextTask.transientRetryCount >= MAX_TRANSIENT_RETRY_COUNT
    ) {
      await updateCloudSyncTask(nextTask);
      return { checkpoints: nextCheckpoints };
    }

    await updateCloudSyncTask(nextTask);
    return { checkpoints: nextCheckpoints };
  }

  await removeCloudSyncTask(task.id);
  return { checkpoints: nextCheckpoints };
}

export async function syncCheckpointConnections(
  connectedProviders: CloudSyncProvider[]
): Promise<void> {
  const checkpoints = mergeCloudSyncProviderCheckpoints(
    await listCloudSyncCheckpoints()
  );
  const connectedSet = new Set(filterSupportedCloudSyncProviders(connectedProviders));
  const baselineProviders = getCloudSyncProviderBaselineCheckpoints().map(
    (checkpoint) => checkpoint.provider
  );
  const nextProviders = new Set<CloudSyncProvider>([
    ...baselineProviders,
    ...connectedProviders,
    ...checkpoints.map((checkpoint) => checkpoint.provider),
  ]);

  const nextCheckpoints: CloudSyncProviderCheckpoint[] = [...nextProviders].map(
    (provider) => {
      const existing = checkpoints.find((checkpoint) => checkpoint.provider === provider);

      if (!existing) {
        return normalizeCloudSyncProviderCheckpoint({
          provider,
          supported: true,
          connected: connectedSet.has(provider),
          connectedAt: connectedSet.has(provider) ? Date.now() : undefined,
          manualRetryAvailable: false,
          healthState: connectedSet.has(provider) ? "syncing" : "disconnected",
        });
      }

      return normalizeCloudSyncProviderCheckpoint({
        ...existing,
        connected: connectedSet.has(provider),
        manualRetryAvailable: connectedSet.has(provider)
          ? existing.manualRetryAvailable
          : false,
        connectedAt:
          connectedSet.has(provider) && !existing.connectedAt
            ? Date.now()
            : existing.connectedAt,
        healthState: connectedSet.has(provider)
          ? existing.healthState === "disconnected"
            ? "syncing"
            : existing.healthState
          : "disconnected",
      });
    }
  );

  await saveCloudSyncCheckpoints(nextCheckpoints);
}

export async function queueCloudSyncReconciliation(
  providers: CloudSyncProvider[],
  scheduledAt = Date.now()
): Promise<void> {
  const supportedProviders = filterSupportedCloudSyncProviders(providers);

  await Promise.all(
    supportedProviders.map((provider) =>
      enqueueCloudSyncTask(
        {
          dedupeKey: `reconcile:${provider}`,
          kind: "reconcile-provider",
          entityId: provider,
          providerTargets: [provider],
        },
        scheduledAt
      )
    )
  );
}

async function processCloudSyncCycle(reason: string): Promise<void> {
  await updateEngineState({
    running: true,
    lastRunAt: Date.now(),
    lastRunReason: reason,
    scheduledAt: undefined,
  });

  const dueTasks = await listDueCloudSyncTasks();
  const checkpoints = await listCloudSyncCheckpoints();
  const connectedProviders = checkpoints.filter(
    (checkpoint) => checkpoint.connected && checkpoint.supported !== false
  );

  if (dueTasks.length === 0) {
    await updateEngineState({ running: false, lastCompletedRunAt: Date.now() });
    return;
  }

  if (connectedProviders.length === 0) {
    await appendCloudSyncDiagnostic(
      createDiagnosticEvent(
        "info",
        "Cloud sync cycle skipped because no cloud providers are connected."
      )
    );
    await updateEngineState({ running: false, lastCompletedRunAt: Date.now() });
    return;
  }

  let updatedCheckpoints = checkpoints.map((checkpoint) =>
    checkpoint.connected
      ? {
          ...checkpoint,
          lastScanAt: Date.now(),
          healthState:
            dueTasks.length > 0 ? "syncing" : checkpoint.healthState,
        }
      : checkpoint
  );
  await saveCloudSyncCheckpoints(updatedCheckpoints);

  await appendCloudSyncDiagnostic(
    createDiagnosticEvent(
      "info",
      `Cloud sync cycle ran with ${dueTasks.length} queued task${
        dueTasks.length === 1 ? "" : "s"
      } and ${connectedProviders.length} connected provider${
        connectedProviders.length === 1 ? "" : "s"
      }.`
    )
  );

  for (const task of dueTasks) {
    const processingResult = await processTaskAcrossProviders(task, updatedCheckpoints);
    updatedCheckpoints = processingResult.checkpoints;
    await saveCloudSyncCheckpoints(updatedCheckpoints);
  }

  await queueCloudSyncReconciliation(
    connectedProviders.map((checkpoint) => checkpoint.provider),
    Date.now() + 5 * 60_000
  );

  if ((await listDueCloudSyncTasks()).length > 0) {
    scheduleCloudSyncRun("follow-up", 0);
  }

  await updateEngineState({ running: false, lastCompletedRunAt: Date.now() });
}

export function scheduleCloudSyncRun(reason: string, delayMs = 2_000): void {
  const nextRunAt = Date.now() + Math.max(0, delayMs);

  if (scheduledRunHandle !== null && scheduledRunAt !== null && scheduledRunAt <= nextRunAt) {
    return;
  }

  if (scheduledRunHandle !== null) {
    timerApi.clearTimeout(scheduledRunHandle);
  }

  scheduledRunAt = nextRunAt;
  void updateEngineState({ scheduledAt: nextRunAt, lastRunReason: reason });

  scheduledRunHandle = timerApi.setTimeout(() => {
    scheduledRunHandle = null;
    scheduledRunAt = null;
    runInFlight = processCloudSyncCycle(reason).finally(() => {
      runInFlight = null;
    });
  }, Math.max(0, delayMs));
}

export async function runCloudSyncNow(reason = "manual"): Promise<void> {
  if (scheduledRunHandle !== null) {
    timerApi.clearTimeout(scheduledRunHandle);
    scheduledRunHandle = null;
    scheduledRunAt = null;
  }

  if (runInFlight) {
    await runInFlight;
  }

  runInFlight = processCloudSyncCycle(reason).finally(() => {
    runInFlight = null;
  });
  await runInFlight;
}

export async function getCloudSyncStateSnapshot(): Promise<CloudSyncState> {
  const [tasks, engine, checkpoints, diagnostics, pendingSettingsDecision] = await Promise.all([
    listCloudSyncTasks(),
    getCloudSyncEngineState(),
    listCloudSyncCheckpoints(),
    listCloudSyncDiagnostics(),
    getCloudSyncPendingSettingsDecision(),
  ]);

  return {
    queueSize: tasks.length,
    dueTaskCount: tasks.filter((task) => task.nextAttemptAt <= Date.now()).length,
    engine,
    checkpoints: mergeCloudSyncProviderCheckpoints(checkpoints),
    diagnostics,
    pendingSettingsDecision,
  };
}

export const cloudSyncEngineInternals = {
  createRetryDelayMs,
  processTaskAcrossProviders,
};
