import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const {
  processCloudSyncTaskForProviderMock,
  updateCloudSyncTaskMock,
  removeCloudSyncTaskMock,
  appendCloudSyncDiagnosticMock,
  getSettingsMock,
  listCloudSyncTasksMock,
  listCloudSyncCheckpointsMock,
  getCloudSyncEngineStateMock,
} = vi.hoisted(() => ({
  processCloudSyncTaskForProviderMock: vi.fn(),
  updateCloudSyncTaskMock: vi.fn(),
  removeCloudSyncTaskMock: vi.fn(),
  appendCloudSyncDiagnosticMock: vi.fn(),
  getSettingsMock: vi.fn(),
  listCloudSyncTasksMock: vi.fn(async () => []),
  listCloudSyncCheckpointsMock: vi.fn(async () => []),
  getCloudSyncEngineStateMock: vi.fn(async () => ({ running: false })),
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
  listCloudSyncTasks: listCloudSyncTasksMock,
  removeCloudSyncTask: removeCloudSyncTaskMock,
  updateCloudSyncTask: updateCloudSyncTaskMock,
}));

vi.mock("../../entrypoints/background/cloud-sync/checkpoints", () => ({
  appendCloudSyncDiagnostic: appendCloudSyncDiagnosticMock,
  getCloudSyncPendingSettingsDecision: vi.fn(async () => null),
  getCloudSyncEngineState: getCloudSyncEngineStateMock,
  listCloudSyncCheckpoints: listCloudSyncCheckpointsMock,
  listCloudSyncDiagnostics: vi.fn(async () => []),
  saveCloudSyncCheckpoints: vi.fn(async () => undefined),
  saveCloudSyncEngineState: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/shared/browser-capabilities", () => ({
  filterSupportedCloudSyncProviders: vi.fn((providers: string[]) => providers),
  getDiagnosticsStorageSelection: vi.fn(() => ({
    areaName: "local",
    area: undefined,
    usesFallback: true,
  })),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("../../entrypoints/background/diagnostics", () => ({
  createBackgroundDiagnosticsLogger: () => ({
    trace: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
  }),
}));

vi.mock("../../entrypoints/shared/legal", () => ({
  hasAcceptedCurrentTerms: vi.fn(
    (acceptance: { version?: string; acceptedAt?: number } | null | undefined) =>
      Boolean(
        acceptance &&
          acceptance.version === "2026-04-10" &&
          typeof acceptance.acceptedAt === "number"
      )
  ),
}));

import { cloudSyncEngineInternals } from "../../entrypoints/background/cloud-sync/engine";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  listCloudSyncTasksMock.mockResolvedValue([]);
  listCloudSyncCheckpointsMock.mockResolvedValue([]);
  getCloudSyncEngineStateMock.mockResolvedValue({ running: false });
  getSettingsMock.mockResolvedValue({
    settings: {
      termsAcceptance: {
        version: "2026-04-10",
        acceptedAt: 1_000_000,
      },
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Cloud sync engine retry contract", () => {
  test("CSYNC-009: one provider failure does not block successful fan-out to another provider", async () => {
    processCloudSyncTaskForProviderMock
      .mockResolvedValueOnce({
        success: false,
        retryable: true,
        errorKind: "transient",
        message: "google drive timed out",
      })
      .mockResolvedValueOnce({
        success: true,
        checkpointUpdates: {
          lastUploadedLocalChangeAt: 1_000_000,
        },
      });

    const task = {
      id: "task-0",
      dedupeKey: "shared-settings",
      kind: "sync-shared-settings",
      entityId: "shared-settings",
      providerTargets: ["google-drive", "onedrive"],
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
      {
        provider: "onedrive",
        connected: true,
        healthState: "syncing",
        manualRetryAvailable: false,
      },
    ] as const;

    const result = await cloudSyncEngineInternals.processTaskAcrossProviders(
      task,
      checkpoints as never
    );

    expect(processCloudSyncTaskForProviderMock).toHaveBeenCalledTimes(2);
    expect(updateCloudSyncTaskMock).toHaveBeenCalledTimes(1);
    expect(updateCloudSyncTaskMock.mock.calls[0]?.[0]).toMatchObject({
      providerTargets: ["google-drive"],
      transientRetryCount: 1,
      lastErrorKind: "transient",
    });
    expect(result.checkpoints[0]).toMatchObject({
      provider: "google-drive",
      healthState: "retrying-automatically",
      lastErrorKind: "transient",
    });
    expect(result.checkpoints[1]).toMatchObject({
      provider: "onedrive",
      healthState: "up-to-date",
      lastError: undefined,
    });
    expect(removeCloudSyncTaskMock).not.toHaveBeenCalled();
  });

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

  test("CSYNC-011: unchanged content hashes skip redundant provider uploads", async () => {
    const task = {
      id: "task-3",
      dedupeKey: "session-events:session-3",
      kind: "sync-session-events",
      entityId: "session-3",
      contentHash: "hash-3",
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
        lastUploadedLocalChangeAt: 900_000,
        lastTaskContentHashes: {
          "session-events:session-3": "hash-3",
        },
      },
    ] as const;

    const result = await cloudSyncEngineInternals.processTaskAcrossProviders(
      task,
      checkpoints as never
    );

    expect(processCloudSyncTaskForProviderMock).not.toHaveBeenCalled();
    expect(removeCloudSyncTaskMock).toHaveBeenCalledWith("task-3");
    expect(result.checkpoints[0]).toMatchObject({
      provider: "google-drive",
      healthState: "up-to-date",
      lastTaskContentHashes: {
        "session-events:session-3": "hash-3",
      },
    });
  });

  test("CSYNC-012: session delete clears cached content hashes for meta events and artifacts", async () => {
    processCloudSyncTaskForProviderMock.mockResolvedValueOnce({
      success: true,
      checkpointUpdates: {
        lastUploadedLocalChangeAt: 1_000_000,
      },
    });

    const task = {
      id: "task-4",
      dedupeKey: "delete-session:session-4",
      kind: "delete-session",
      entityId: "session-4",
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
        lastTaskContentHashes: {
          "session-meta:session-4": "meta-hash",
          "session-events:session-4": "events-hash",
          "session-artifacts:session-4": "artifacts-hash",
          "shared-settings": "shared-hash",
        },
      },
    ] as const;

    const result = await cloudSyncEngineInternals.processTaskAcrossProviders(
      task,
      checkpoints as never
    );

    expect(result.checkpoints[0]).toMatchObject({
      provider: "google-drive",
      healthState: "up-to-date",
      lastTaskContentHashes: {
        "shared-settings": "shared-hash",
      },
    });
  });

  test("CSYNC-019: meaningful upload backlog defers expensive reconcile scans to a later cycle", async () => {
    const tasks = [
      {
        id: "sync-1",
        dedupeKey: "session-meta:session-1",
        kind: "sync-session-meta",
        providerTargets: ["google-drive"],
        createdAt: 1_000_000,
        updatedAt: 1_000_000,
        nextAttemptAt: 1_000_000,
        attemptCount: 0,
        transientRetryCount: 0,
      },
      {
        id: "sync-2",
        dedupeKey: "session-events:session-1",
        kind: "sync-session-events",
        providerTargets: ["google-drive"],
        createdAt: 1_000_000,
        updatedAt: 1_000_000,
        nextAttemptAt: 1_000_000,
        attemptCount: 0,
        transientRetryCount: 0,
      },
      {
        id: "sync-3",
        dedupeKey: "session-artifacts:session-1",
        kind: "sync-session-artifacts",
        providerTargets: ["google-drive"],
        createdAt: 1_000_000,
        updatedAt: 1_000_000,
        nextAttemptAt: 1_000_000,
        attemptCount: 0,
        transientRetryCount: 0,
      },
      {
        id: "reconcile-1",
        dedupeKey: "reconcile:google-drive",
        kind: "reconcile-provider",
        providerTargets: ["google-drive"],
        createdAt: 1_000_000,
        updatedAt: 1_000_000,
        nextAttemptAt: 1_000_000,
        attemptCount: 0,
        transientRetryCount: 0,
      },
    ] as const;

    const selection = cloudSyncEngineInternals.selectDueTasksForCycle(
      tasks as never,
      1
    );

    expect(selection.tasksToProcess.map((task) => task.id)).toEqual([
      "sync-1",
      "sync-2",
      "sync-3",
    ]);
    expect(selection.deferredReconcileTasks.map((task) => task.id)).toEqual([
      "reconcile-1",
    ]);
  });

  test("CSYNC-020: reconcile success stamps lastScanAt only when a real reconcile task completes", async () => {
    processCloudSyncTaskForProviderMock.mockResolvedValueOnce({
      success: true,
      checkpointUpdates: {
        lastAppliedRemoteChangeAt: 1_000_000,
        lastScanAt: 1_000_000,
        reconciliationCursor: "cursor-next",
      },
    });

    const task = {
      id: "task-5",
      dedupeKey: "reconcile:google-drive",
      kind: "reconcile-provider",
      entityId: "google-drive",
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

    expect(result.checkpoints[0]).toMatchObject({
      provider: "google-drive",
      healthState: "up-to-date",
      lastAppliedRemoteChangeAt: 1_000_000,
      lastScanAt: 1_000_000,
      reconciliationCursor: "cursor-next",
    });
  });

  test("CSYNC-021: snapshot normalizes stale syncing checkpoints back to up-to-date when no due work remains", async () => {
    listCloudSyncTasksMock.mockResolvedValue([
      {
        id: "reconcile-google",
        dedupeKey: "reconcile:google-drive",
        kind: "reconcile-provider",
        entityId: "google-drive",
        providerTargets: ["google-drive"],
        createdAt: 1_000_000,
        updatedAt: 1_000_000,
        nextAttemptAt: 1_060_000,
        attemptCount: 0,
        transientRetryCount: 0,
      },
    ]);
    listCloudSyncCheckpointsMock.mockResolvedValue([
      {
        provider: "google-drive",
        connected: true,
        healthState: "syncing",
        lastSuccessfulSyncAt: 999_000,
        lastScanAt: 999_500,
      },
    ]);
    getCloudSyncEngineStateMock.mockResolvedValue({
      running: false,
      lastCompletedRunAt: 999_900,
    });

    const snapshot = await cloudSyncEngineInternals.getCloudSyncStateSnapshot();

    expect(snapshot.queueSize).toBe(1);
    expect(snapshot.dueTaskCount).toBe(0);
    expect(snapshot.checkpoints[0]).toMatchObject({
      provider: "google-drive",
      connected: true,
      healthState: "up-to-date",
    });
  });
});
