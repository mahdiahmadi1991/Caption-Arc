import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const {
  processCloudSyncTaskForProviderMock,
  updateCloudSyncTaskMock,
  removeCloudSyncTaskMock,
  appendCloudSyncDiagnosticMock,
} = vi.hoisted(() => ({
  processCloudSyncTaskForProviderMock: vi.fn(),
  updateCloudSyncTaskMock: vi.fn(),
  removeCloudSyncTaskMock: vi.fn(),
  appendCloudSyncDiagnosticMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync/providers", () => ({
  getCloudSyncProviderBaselineCheckpoints: vi.fn(() => []),
  mergeCloudSyncProviderCheckpoints: vi.fn((checkpoints: unknown[]) => checkpoints),
  normalizeCloudSyncProviderCheckpoint: vi.fn((checkpoint: unknown) => checkpoint),
  processCloudSyncTaskForProvider: processCloudSyncTaskForProviderMock,
}));

vi.mock("../../entrypoints/background/cloud-sync/outbox", () => ({
  enqueueCloudSyncTask: vi.fn(),
  listDueCloudSyncTasks: vi.fn(async () => []),
  listCloudSyncTasks: vi.fn(async () => []),
  removeCloudSyncTask: removeCloudSyncTaskMock,
  updateCloudSyncTask: updateCloudSyncTaskMock,
}));

vi.mock("../../entrypoints/background/cloud-sync/checkpoints", () => ({
  appendCloudSyncDiagnostic: appendCloudSyncDiagnosticMock,
  getCloudSyncPendingSettingsDecision: vi.fn(async () => null),
  getCloudSyncEngineState: vi.fn(async () => ({ running: false })),
  listCloudSyncCheckpoints: vi.fn(async () => []),
  listCloudSyncDiagnostics: vi.fn(async () => []),
  saveCloudSyncCheckpoints: vi.fn(async () => undefined),
  saveCloudSyncEngineState: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/shared/browser-capabilities", () => ({
  filterSupportedCloudSyncProviders: vi.fn((providers: string[]) => providers),
}));

import { cloudSyncEngineInternals } from "../../entrypoints/background/cloud-sync/engine";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  vi.spyOn(Date, "now").mockReturnValue(1_000_000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Cloud sync engine retry contract", () => {
  test("CSYNC-005: retryable transient failures back off with capped retry delay", async () => {
    processCloudSyncTaskForProviderMock.mockResolvedValueOnce({
      success: false,
      retryable: true,
      errorKind: "transient",
      message: "rate limited",
    });

    const task = {
      id: "task-1",
      dedupeKey: "sync-session",
      kind: "sync-session-meta",
      entityId: "session-1",
      providerTargets: ["google-drive"],
      createdAt: 1_000_000,
      updatedAt: 1_000_000,
      nextAttemptAt: 1_000_000,
      attemptCount: 0,
      transientRetryCount: 0,
    } as const;
    const checkpoints = [
      {
        provider: "google-drive",
        connected: true,
        healthState: "syncing",
        manualRetryAvailable: false,
      },
    ] as const;

    const result = await cloudSyncEngineInternals.processTaskAcrossProviders(
      task,
      checkpoints as never
    );

    expect(updateCloudSyncTaskMock).toHaveBeenCalledTimes(1);
    const updatedTask = updateCloudSyncTaskMock.mock.calls[0]?.[0];
    expect(updatedTask.transientRetryCount).toBe(1);
    expect(updatedTask.nextAttemptAt).toBeGreaterThan(1_000_000 + 1_900);
    expect(updatedTask.nextAttemptAt).toBeLessThan(1_000_000 + 2_100);
    expect(result.checkpoints[0]).toMatchObject({
      healthState: "retrying-automatically",
      manualRetryAvailable: false,
      lastErrorKind: "transient",
    });
    expect(appendCloudSyncDiagnosticMock).toHaveBeenCalledTimes(1);
    expect(removeCloudSyncTaskMock).not.toHaveBeenCalled();
  });

  test("CSYNC-005: reaching retry limit promotes checkpoint to manual retry", async () => {
    processCloudSyncTaskForProviderMock.mockResolvedValueOnce({
      success: false,
      retryable: true,
      errorKind: "transient",
      message: "still failing",
    });

    const task = {
      id: "task-2",
      dedupeKey: "sync-session",
      kind: "sync-session-events",
      entityId: "session-2",
      providerTargets: ["google-drive"],
      createdAt: 1_000_000,
      updatedAt: 1_000_000,
      nextAttemptAt: 1_000_000,
      attemptCount: 2,
      transientRetryCount: 2,
    } as const;
    const checkpoints = [
      {
        provider: "google-drive",
        connected: true,
        healthState: "syncing",
        manualRetryAvailable: false,
      },
    ] as const;

    const result = await cloudSyncEngineInternals.processTaskAcrossProviders(
      task,
      checkpoints as never
    );

    const updatedTask = updateCloudSyncTaskMock.mock.calls[0]?.[0];
    expect(updatedTask.transientRetryCount).toBe(3);
    expect(updatedTask.nextAttemptAt).toBe(1_000_000 + 24 * 60 * 60_000);
    expect(result.checkpoints[0]).toMatchObject({
      healthState: "needs-attention",
      manualRetryAvailable: true,
    });
  });
});
