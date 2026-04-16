import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../entrypoints/background/diagnostics", () => ({
  createBackgroundDiagnosticsLogger: () => ({
    trace: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
  }),
}));

type StorageRecord = Record<string, unknown>;

const storageState: StorageRecord = {};

function installChromeStorageMock() {
  (
    globalThis as typeof globalThis & {
      chrome?: {
        storage?: {
          local?: {
            get: (key: string) => Promise<Record<string, unknown>>;
            set: (value: Record<string, unknown>) => Promise<void>;
          };
        };
      };
    }
  ).chrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storageState[key] })),
        set: vi.fn(async (value: Record<string, unknown>) => {
          Object.assign(storageState, value);
        }),
      },
    },
  };
}

describe("Cloud sync outbox contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.keys(storageState).forEach((key) => {
      delete storageState[key];
    });
    installChromeStorageMock();
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  });

  test("CSYNC-OUTBOX-001: latest scheduling strategy keeps pushing hot-session tasks outward to coalesce writes", async () => {
    const outbox = await import("../../entrypoints/background/cloud-sync/outbox");

    await outbox.enqueueCloudSyncTask(
      {
        dedupeKey: "session-events:sync-1",
        kind: "sync-session-events",
        entityId: "sync-1",
        contentHash: "hash-1",
        providerTargets: ["google-drive"],
        schedulingStrategy: "latest",
      },
      1_005_000
    );
    const updatedTask = await outbox.enqueueCloudSyncTask(
      {
        dedupeKey: "session-events:sync-1",
        kind: "sync-session-events",
        entityId: "sync-1",
        contentHash: "hash-2",
        providerTargets: ["google-drive"],
        schedulingStrategy: "latest",
      },
      1_015_000
    );

    expect(updatedTask.nextAttemptAt).toBe(1_015_000);
    expect(updatedTask.contentHash).toBe("hash-2");
    expect(updatedTask.schedulingStrategy).toBe("latest");
  });

  test("CSYNC-OUTBOX-002: default earliest scheduling preserves the earliest pending retry", async () => {
    const outbox = await import("../../entrypoints/background/cloud-sync/outbox");

    await outbox.enqueueCloudSyncTask(
      {
        dedupeKey: "shared-settings",
        kind: "sync-shared-settings",
        entityId: "shared-settings",
        contentHash: "hash-1",
        providerTargets: ["google-drive"],
      },
      1_005_000
    );
    const updatedTask = await outbox.enqueueCloudSyncTask(
      {
        dedupeKey: "shared-settings",
        kind: "sync-shared-settings",
        entityId: "shared-settings",
        contentHash: "hash-2",
        providerTargets: ["google-drive"],
      },
      1_015_000
    );

    expect(updatedTask.nextAttemptAt).toBe(1_005_000);
    expect(updatedTask.contentHash).toBe("hash-2");
    expect(updatedTask.schedulingStrategy).toBe("earliest");
  });
});
