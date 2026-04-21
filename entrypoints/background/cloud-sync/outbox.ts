import type { CloudSyncTask, CloudSyncTaskInput } from "./types";
import { createBackgroundDiagnosticsLogger } from "../diagnostics";

const CLOUD_SYNC_OUTBOX_STORAGE_KEY = "cloudSyncOutbox";
const cloudSyncOutboxDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "cloud-sync",
  feature: "outbox",
});

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function normalizeTask(task: CloudSyncTask): CloudSyncTask {
  return {
    ...task,
    providerTargets: task.providerTargets ? [...task.providerTargets] : null,
  };
}

async function loadOutbox(): Promise<CloudSyncTask[]> {
  const result = await chrome.storage.local.get(CLOUD_SYNC_OUTBOX_STORAGE_KEY);
  const tasks = result[CLOUD_SYNC_OUTBOX_STORAGE_KEY];

  if (!Array.isArray(tasks)) {
    if (tasks !== undefined) {
      await cloudSyncOutboxDiagnostics.warn("cloud_sync_outbox_invalid_state", {
        storedType: typeof tasks,
      });
    }
    return [];
  }

  return tasks.map((task) => normalizeTask(task as CloudSyncTask));
}

async function saveOutbox(tasks: CloudSyncTask[]): Promise<void> {
  await chrome.storage.local.set({
    [CLOUD_SYNC_OUTBOX_STORAGE_KEY]: tasks.map((task) => normalizeTask(task)),
  });
}

export async function listCloudSyncTasks(): Promise<CloudSyncTask[]> {
  return loadOutbox();
}

export async function enqueueCloudSyncTask(
  input: CloudSyncTaskInput,
  scheduledAt = Date.now()
): Promise<CloudSyncTask> {
  const tasks = await loadOutbox();
  const existing = tasks.find((task) => task.dedupeKey === input.dedupeKey);
  const schedulingStrategy = input.schedulingStrategy || existing?.schedulingStrategy || "earliest";

  if (existing) {
    const updated: CloudSyncTask = {
      ...existing,
      entityId: input.entityId ?? existing.entityId,
      contentHash: input.contentHash ?? existing.contentHash,
      providerTargets: input.providerTargets
        ? [...input.providerTargets]
        : existing.providerTargets,
      schedulingStrategy,
      updatedAt: Date.now(),
      nextAttemptAt:
        schedulingStrategy === "latest"
          ? Math.max(existing.nextAttemptAt, scheduledAt)
          : Math.min(existing.nextAttemptAt, scheduledAt),
      lastError: undefined,
      lastErrorKind: undefined,
    };
    await cloudSyncOutboxDiagnostics.debug("cloud_sync_outbox_task_updated", {
      dedupeKey: updated.dedupeKey,
      kind: updated.kind,
      schedulingStrategy,
      previousNextAttemptAt: existing.nextAttemptAt,
      nextAttemptAt: updated.nextAttemptAt,
      providerTargetCount: updated.providerTargets?.length || 0,
    });
    await saveOutbox(
      tasks.map((task) => (task.id === updated.id ? updated : task))
    );
    return updated;
  }

  const nextTask: CloudSyncTask = {
    id: createId(),
    dedupeKey: input.dedupeKey,
    kind: input.kind,
    entityId: input.entityId,
    contentHash: input.contentHash,
    providerTargets: input.providerTargets ? [...input.providerTargets] : null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nextAttemptAt: scheduledAt,
    schedulingStrategy,
    attemptCount: 0,
    transientRetryCount: 0,
  };

  tasks.push(nextTask);
  await cloudSyncOutboxDiagnostics.debug("cloud_sync_outbox_task_enqueued", {
    dedupeKey: nextTask.dedupeKey,
    kind: nextTask.kind,
    schedulingStrategy,
    nextAttemptAt: nextTask.nextAttemptAt,
    providerTargetCount: nextTask.providerTargets?.length || 0,
  });
  await saveOutbox(tasks);
  return nextTask;
}

export async function removeCloudSyncTask(taskId: string): Promise<void> {
  const tasks = await loadOutbox();
  const removedTask = tasks.find((task) => task.id === taskId);
  await saveOutbox(tasks.filter((task) => task.id !== taskId));
  await cloudSyncOutboxDiagnostics.trace("cloud_sync_outbox_task_removed", {
    taskId,
    dedupeKey: removedTask?.dedupeKey || null,
    kind: removedTask?.kind || null,
  });
}

export async function updateCloudSyncTask(task: CloudSyncTask): Promise<void> {
  const tasks = await loadOutbox();
  await saveOutbox(
    tasks.map((current) => (current.id === task.id ? normalizeTask(task) : current))
  );
  await cloudSyncOutboxDiagnostics.debug("cloud_sync_outbox_task_persisted", {
    taskId: task.id,
    dedupeKey: task.dedupeKey,
    kind: task.kind,
    nextAttemptAt: task.nextAttemptAt,
    attemptCount: task.attemptCount,
    transientRetryCount: task.transientRetryCount,
  });
}

export async function listDueCloudSyncTasks(
  now = Date.now(),
  limit = 25
): Promise<CloudSyncTask[]> {
  const tasks = await loadOutbox();
  const dueTasks = tasks
    .filter((task) => task.nextAttemptAt <= now)
    .sort((left, right) => left.nextAttemptAt - right.nextAttemptAt)
    .slice(0, limit);
  await cloudSyncOutboxDiagnostics.trace("cloud_sync_outbox_due_tasks_loaded", {
    now,
    limit,
    dueTaskCount: dueTasks.length,
    totalTaskCount: tasks.length,
  });
  return dueTasks;
}

export async function clearCloudSyncOutbox(): Promise<void> {
  await saveOutbox([]);
  await cloudSyncOutboxDiagnostics.info("cloud_sync_outbox_cleared");
}
