import type { CloudSyncTask, CloudSyncTaskInput } from "./types";

const CLOUD_SYNC_OUTBOX_STORAGE_KEY = "cloudSyncOutbox";

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

  if (existing) {
    const updated: CloudSyncTask = {
      ...existing,
      entityId: input.entityId ?? existing.entityId,
      contentHash: input.contentHash ?? existing.contentHash,
      providerTargets: input.providerTargets
        ? [...input.providerTargets]
        : existing.providerTargets,
      updatedAt: Date.now(),
      nextAttemptAt: Math.min(existing.nextAttemptAt, scheduledAt),
      lastError: undefined,
      lastErrorKind: undefined,
    };
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
    attemptCount: 0,
    transientRetryCount: 0,
  };

  tasks.push(nextTask);
  await saveOutbox(tasks);
  return nextTask;
}

export async function removeCloudSyncTask(taskId: string): Promise<void> {
  const tasks = await loadOutbox();
  await saveOutbox(tasks.filter((task) => task.id !== taskId));
}

export async function updateCloudSyncTask(task: CloudSyncTask): Promise<void> {
  const tasks = await loadOutbox();
  await saveOutbox(
    tasks.map((current) => (current.id === task.id ? normalizeTask(task) : current))
  );
}

export async function listDueCloudSyncTasks(
  now = Date.now(),
  limit = 25
): Promise<CloudSyncTask[]> {
  const tasks = await loadOutbox();
  return tasks
    .filter((task) => task.nextAttemptAt <= now)
    .sort((left, right) => left.nextAttemptAt - right.nextAttemptAt)
    .slice(0, limit);
}

export async function clearCloudSyncOutbox(): Promise<void> {
  await saveOutbox([]);
}