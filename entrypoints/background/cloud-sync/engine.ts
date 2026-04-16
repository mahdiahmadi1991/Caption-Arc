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
import { getSettings } from "../settings";
import { hasAcceptedCurrentTerms } from "../../shared/legal";
import {
  getCloudSyncCycleTaskLimit,
  getCloudSyncFollowUpDelayMs,
  getCloudSyncReconciliationDeferralMs,
  getCloudSyncReconciliationDelayMs,
  shouldDeferCloudSyncReconciliation,
} from "./policy";
import { createBackgroundDiagnosticsLogger } from "../diagnostics";

const MAX_TRANSIENT_RETRY_COUNT = 3;
const TRANSIENT_RETRY_BASE_DELAY_MS = 2_000;
const TRANSIENT_RETRY_MAX_DELAY_MS = 5 * 60_000;
const cloudSyncEngineDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "cloud-sync",
  feature: "engine",
});

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
  let nextTaskContentHashes = checkpoint.lastTaskContentHashes;
  if (task.kind === "clear-archive") {
    nextTaskContentHashes = undefined;
  } else if (task.kind === "delete-session" && task.entityId) {
    nextTaskContentHashes = removeTaskContentHash(checkpoint.lastTaskContentHashes, [
      `session-meta:${task.entityId}`,
      `session-events:${task.entityId}`,
      `session-artifacts:${task.entityId}`,
    ]);
  } else if (task.contentHash) {
    nextTaskContentHashes = {
      ...(checkpoint.lastTaskContentHashes || {}),
      [task.dedupeKey]: task.contentHash,
    };
  }

  const baseCheckpoint: CloudSyncProviderCheckpoint = {
    ...checkpoint,
    healthState: "up-to-date",
    manualRetryAvailable: false,
    lastError: undefined,
    lastErrorKind: undefined,
    lastSuccessfulSyncAt: Date.now(),
    lastTaskContentHashes: nextTaskContentHashes,
  };

  if (task.kind === "reconcile-provider") {
    return {
      ...baseCheckpoint,
      lastScanAt:
        result.checkpointUpdates?.lastScanAt ?? checkpoint.lastScanAt ?? Date.now(),
      reconciliationCursor:
        result.checkpointUpdates?.reconciliationCursor ??
        checkpoint.reconciliationCursor,
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

function selectDueTasksForCycle(
  dueTasks: CloudSyncTask[],
  connectedProviderCount: number
): {
  tasksToProcess: CloudSyncTask[];
  deferredReconcileTasks: CloudSyncTask[];
  dueNonReconcileTaskCount: number;
} {
  const dueNonReconcileTasks = dueTasks.filter(
    (task) => task.kind !== "reconcile-provider"
  );
  const dueReconcileTasks = dueTasks.filter(
    (task) => task.kind === "reconcile-provider"
  );
  const cycleTaskLimit = getCloudSyncCycleTaskLimit(connectedProviderCount);
  const deferReconciliation = shouldDeferCloudSyncReconciliation(
    dueNonReconcileTasks.length,
    connectedProviderCount
  );
  const candidateTasks = deferReconciliation ? dueNonReconcileTasks : dueTasks;

  return {
    tasksToProcess: candidateTasks.slice(0, cycleTaskLimit),
    deferredReconcileTasks: deferReconciliation ? dueReconcileTasks : [],
    dueNonReconcileTaskCount: dueNonReconcileTasks.length,
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

async function runCloudSyncCycleWithDiagnostics(reason: string): Promise<void> {
  try {
    await processCloudSyncCycle(reason);
  } catch (error) {
    await cloudSyncEngineDiagnostics.error("cloud_sync_cycle_failed", {
      reason,
      error,
    });
    throw error;
  }
}

function removeTaskContentHash(
  taskContentHashes: Record<string, string> | undefined,
  dedupeKeys: string[]
): Record<string, string> | undefined {
  if (!taskContentHashes) {
    return undefined;
  }

  const nextHashes = { ...taskContentHashes };
  dedupeKeys.forEach((dedupeKey) => {
    delete nextHashes[dedupeKey];
  });

  return Object.keys(nextHashes).length > 0 ? nextHashes : undefined;
}

function hasDueTaskForProvider(
  tasks: CloudSyncTask[],
  provider: CloudSyncProvider,
  now = Date.now()
): boolean {
  return tasks.some(
    (task) =>
      task.nextAttemptAt <= now &&
      Array.isArray(task.providerTargets) &&
      task.providerTargets.includes(provider)
  );
}

function normalizeIdleCheckpointHealth(
  checkpoint: CloudSyncProviderCheckpoint,
  tasks: CloudSyncTask[],
  engine: CloudSyncEngineState,
  now = Date.now()
): CloudSyncProviderCheckpoint {
  if (
    !checkpoint.connected ||
    checkpoint.healthState !== "syncing" ||
    engine.running ||
    hasDueTaskForProvider(tasks, checkpoint.provider, now)
  ) {
    return checkpoint;
  }

  if (
    checkpoint.lastSuccessfulSyncAt ||
    checkpoint.lastScanAt ||
    checkpoint.lastUploadedLocalChangeAt ||
    checkpoint.lastAppliedRemoteChangeAt
  ) {
    return {
      ...checkpoint,
      healthState: "up-to-date",
    };
  }

  return checkpoint;
}

type CloudSyncProviderTaskFailure = {
  provider: CloudSyncProvider;
  result: Extract<CloudSyncTaskProcessingResult, { success: false }>;
  nextTransientRetryCount: number;
  manualRetryAvailable: boolean;
};

function getTaskFailureMessage(
  failures: CloudSyncProviderTaskFailure[]
): string {
  if (failures.length === 1) {
    return failures[0]!.result.message;
  }

  return failures
    .map((failure) => `${failure.provider}: ${failure.result.message}`)
    .join(" | ");
}

function getTaskFailureKind(
  failures: CloudSyncProviderTaskFailure[]
): CloudSyncTask["lastErrorKind"] {
  if (failures.length === 0) {
    return undefined;
  }

  const firstNonRetryable = failures.find((failure) => !failure.result.retryable);
  return (firstNonRetryable || failures[0])?.result.errorKind;
}

function shouldSkipTaskUploadForCheckpoint(
  task: CloudSyncTask,
  checkpoint: CloudSyncProviderCheckpoint
): boolean {
  if (
    task.kind === "reconcile-provider" ||
    task.kind === "delete-session" ||
    task.kind === "clear-archive" ||
    !task.contentHash
  ) {
    return false;
  }

  return checkpoint.lastTaskContentHashes?.[task.dedupeKey] === task.contentHash;
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

  const nextCheckpoints = [...checkpoints];
  const failures: CloudSyncProviderTaskFailure[] = [];

  for (const checkpoint of targetProviders) {
    if (shouldSkipTaskUploadForCheckpoint(task, checkpoint)) {
      const checkpointIndex = nextCheckpoints.findIndex(
        (current) => current.provider === checkpoint.provider
      );
      if (checkpointIndex >= 0) {
        nextCheckpoints[checkpointIndex] = updateCheckpointForSuccess(
          nextCheckpoints[checkpointIndex]!,
          task,
          {
            success: true,
            checkpointUpdates: {
              lastUploadedLocalChangeAt:
                checkpoint.lastUploadedLocalChangeAt ?? Date.now(),
            },
          }
        );
      }
      await cloudSyncEngineDiagnostics.trace("cloud_sync_task_skipped_unchanged", {
        provider: checkpoint.provider,
        dedupeKey: task.dedupeKey,
        kind: task.kind,
        entityId: task.entityId || null,
      });
      continue;
    }

    const result = await processCloudSyncTaskForProvider(
      checkpoint.provider,
      task,
      checkpoint
    );
    const checkpointIndex = nextCheckpoints.findIndex(
      (current) => current.provider === checkpoint.provider
    );

    if (result.success) {
      if (checkpointIndex >= 0) {
        nextCheckpoints[checkpointIndex] = updateCheckpointForSuccess(
          nextCheckpoints[checkpointIndex]!,
          task,
          result
        );
      }
      continue;
    }

    const nextTransientRetryCount = result.retryable
      ? task.transientRetryCount + 1
      : task.transientRetryCount;
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

    await appendCloudSyncDiagnostic(
      createDiagnosticEvent(
        result.retryable ? "warning" : "error",
        result.message,
        checkpoint.provider
      )
    );

    failures.push({
      provider: checkpoint.provider,
      result,
      nextTransientRetryCount,
      manualRetryAvailable,
    });
  }

  if (failures.length === 0) {
    await removeCloudSyncTask(task.id);
    return { checkpoints: nextCheckpoints };
  }

  const highestTransientRetryCount = failures.reduce(
    (maxRetryCount, failure) =>
      Math.max(maxRetryCount, failure.nextTransientRetryCount),
    task.transientRetryCount
  );
  const allFailuresRetryable = failures.every((failure) => failure.result.retryable);
  const manualRetryAvailable = failures.some(
    (failure) => failure.manualRetryAvailable
  );

  await updateCloudSyncTask({
    ...task,
    providerTargets: failures.map((failure) => failure.provider),
    attemptCount: task.attemptCount + 1,
    updatedAt: Date.now(),
    lastError: getTaskFailureMessage(failures),
    lastErrorKind: getTaskFailureKind(failures),
    transientRetryCount: highestTransientRetryCount,
    nextAttemptAt: allFailuresRetryable
      ? Date.now() +
        (manualRetryAvailable
          ? 24 * 60 * 60_000
          : createRetryDelayMs(highestTransientRetryCount))
      : Date.now() + 60 * 60_000,
  });

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
  await cloudSyncEngineDiagnostics.debug("cloud_sync_cycle_started", {
    reason,
  });
  const { settings } = await getSettings();
  if (!hasAcceptedCurrentTerms(settings.termsAcceptance)) {
    await updateEngineState({
      running: false,
      lastCompletedRunAt: Date.now(),
      scheduledAt: undefined,
      lastRunReason: `${reason}:terms-required`,
    });
    return;
  }

  await updateEngineState({
    running: true,
    lastRunAt: Date.now(),
    lastRunReason: reason,
    scheduledAt: undefined,
  });

  const dueTasks = await listDueCloudSyncTasks(Date.now(), 100);
  const checkpoints = await listCloudSyncCheckpoints();
  const connectedProviders = checkpoints.filter(
    (checkpoint) => checkpoint.connected && checkpoint.supported !== false
  );

  if (dueTasks.length === 0) {
    await cloudSyncEngineDiagnostics.trace("cloud_sync_cycle_no_due_tasks", {
      reason,
    });
    await updateEngineState({ running: false, lastCompletedRunAt: Date.now() });
    return;
  }

  if (connectedProviders.length === 0) {
    await cloudSyncEngineDiagnostics.warn("cloud_sync_cycle_skipped_no_connected_provider", {
      reason,
      dueTaskCount: dueTasks.length,
    });
    await appendCloudSyncDiagnostic(
      createDiagnosticEvent(
        "info",
        "Cloud sync cycle skipped because no cloud providers are connected."
      )
    );
    await updateEngineState({ running: false, lastCompletedRunAt: Date.now() });
    return;
  }

  const { tasksToProcess, deferredReconcileTasks, dueNonReconcileTaskCount } =
    selectDueTasksForCycle(dueTasks, connectedProviders.length);
  if (deferredReconcileTasks.length > 0) {
    const reconciliationDeferralMs = getCloudSyncReconciliationDeferralMs(
      dueNonReconcileTaskCount,
      connectedProviders.length
    );
    await Promise.all(
      deferredReconcileTasks.map((task) =>
        updateCloudSyncTask({
          ...task,
          updatedAt: Date.now(),
          nextAttemptAt: Date.now() + reconciliationDeferralMs,
        })
      )
    );
    await cloudSyncEngineDiagnostics.info("cloud_sync_reconcile_deferred_for_backlog", {
      reason,
      deferredReconcileTaskCount: deferredReconcileTasks.length,
      dueNonReconcileTaskCount,
      reconciliationDeferralMs,
    });
    await appendCloudSyncDiagnostic(
      createDiagnosticEvent(
        "info",
        `Deferred ${deferredReconcileTasks.length} remote reconcile scan${
          deferredReconcileTasks.length === 1 ? "" : "s"
        } while ${dueNonReconcileTaskCount} local sync task${
          dueNonReconcileTaskCount === 1 ? "" : "s"
        } remained queued.`
      )
    );
  }

  let updatedCheckpoints = checkpoints.map((checkpoint) =>
    checkpoint.connected
      ? {
          ...checkpoint,
          healthState:
            tasksToProcess.length > 0 ? "syncing" : checkpoint.healthState,
        }
      : checkpoint
  );
  await saveCloudSyncCheckpoints(updatedCheckpoints);

  await appendCloudSyncDiagnostic(
      createDiagnosticEvent(
        "info",
        `Cloud sync cycle ran with ${dueTasks.length} due task${
          dueTasks.length === 1 ? "" : "s"
        } and ${connectedProviders.length} connected provider${
          connectedProviders.length === 1 ? "" : "s"
        }, processing ${tasksToProcess.length}.`
      )
    );
  await cloudSyncEngineDiagnostics.info("cloud_sync_cycle_processing", {
    reason,
    dueTaskCount: dueTasks.length,
    processedTaskCount: tasksToProcess.length,
    deferredReconcileTaskCount: deferredReconcileTasks.length,
    connectedProviderCount: connectedProviders.length,
  });

  for (const task of tasksToProcess) {
    const { settings } = await getSettings();
    if (!hasAcceptedCurrentTerms(settings.termsAcceptance)) {
      await updateEngineState({
        running: false,
        scheduledAt: undefined,
        lastRunReason: `${reason}:terms-revoked`,
        lastCompletedRunAt: Date.now(),
      });
      return;
    }

    const processingResult = await processTaskAcrossProviders(task, updatedCheckpoints);
    updatedCheckpoints = processingResult.checkpoints;
    await saveCloudSyncCheckpoints(updatedCheckpoints);
  }

  await queueCloudSyncReconciliation(
    connectedProviders.map((checkpoint) => checkpoint.provider),
    Date.now() + getCloudSyncReconciliationDelayMs()
  );

  const remainingDueTaskCount = (await listCloudSyncTasks()).filter(
    (task) => task.nextAttemptAt <= Date.now()
  ).length;
  if (remainingDueTaskCount > 0) {
    const followUpDelayMs = getCloudSyncFollowUpDelayMs(
      remainingDueTaskCount,
      connectedProviders.length
    );
    await cloudSyncEngineDiagnostics.debug("cloud_sync_cycle_follow_up_scheduled", {
      remainingDueTaskCount,
      connectedProviderCount: connectedProviders.length,
      followUpDelayMs,
    });
    scheduleCloudSyncRun("follow-up", followUpDelayMs);
  }

  if (remainingDueTaskCount === 0) {
    updatedCheckpoints = updatedCheckpoints.map((checkpoint) =>
      checkpoint.connected && checkpoint.healthState === "syncing"
        ? {
            ...checkpoint,
            healthState:
              checkpoint.lastSuccessfulSyncAt ||
              checkpoint.lastScanAt ||
              checkpoint.lastUploadedLocalChangeAt ||
              checkpoint.lastAppliedRemoteChangeAt
                ? "up-to-date"
                : checkpoint.healthState,
          }
        : checkpoint
    );
    await saveCloudSyncCheckpoints(updatedCheckpoints);
  }

  await cloudSyncEngineDiagnostics.info("cloud_sync_cycle_completed", {
    reason,
    processedTaskCount: dueTasks.length,
  });
  await updateEngineState({ running: false, lastCompletedRunAt: Date.now() });
}

export function scheduleCloudSyncRun(reason: string, delayMs = 2_000): void {
  const nextRunAt = Date.now() + Math.max(0, delayMs);

  if (scheduledRunHandle !== null && scheduledRunAt !== null && scheduledRunAt <= nextRunAt) {
    void cloudSyncEngineDiagnostics.trace("cloud_sync_run_schedule_kept_existing", {
      reason,
      delayMs,
      scheduledRunAt,
      requestedRunAt: nextRunAt,
    });
    return;
  }

  if (scheduledRunHandle !== null) {
    timerApi.clearTimeout(scheduledRunHandle);
  }

  scheduledRunAt = nextRunAt;
  void cloudSyncEngineDiagnostics.debug("cloud_sync_run_scheduled", {
    reason,
    delayMs,
    nextRunAt,
  });
  void updateEngineState({ scheduledAt: nextRunAt, lastRunReason: reason });

  scheduledRunHandle = timerApi.setTimeout(() => {
    scheduledRunHandle = null;
    scheduledRunAt = null;
    runInFlight = runCloudSyncCycleWithDiagnostics(reason).finally(() => {
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

  runInFlight = runCloudSyncCycleWithDiagnostics(reason).finally(() => {
    runInFlight = null;
  });
  await runInFlight;
}

export async function stopCloudSyncEngine(): Promise<void> {
  if (scheduledRunHandle !== null) {
    timerApi.clearTimeout(scheduledRunHandle);
    scheduledRunHandle = null;
    scheduledRunAt = null;
  }

  if (runInFlight) {
    await runInFlight.catch(() => undefined);
    runInFlight = null;
  }

  await updateEngineState({
    running: false,
    scheduledAt: undefined,
    lastRunReason: "terms-revoked",
    lastCompletedRunAt: Date.now(),
  });
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
    checkpoints: mergeCloudSyncProviderCheckpoints(checkpoints).map((checkpoint) =>
      normalizeIdleCheckpointHealth(checkpoint, tasks, engine)
    ),
    diagnostics,
    pendingSettingsDecision,
  };
}

export const cloudSyncEngineInternals = {
  createRetryDelayMs,
  getCloudSyncStateSnapshot,
  normalizeIdleCheckpointHealth,
  processTaskAcrossProviders,
  selectDueTasksForCycle,
};
