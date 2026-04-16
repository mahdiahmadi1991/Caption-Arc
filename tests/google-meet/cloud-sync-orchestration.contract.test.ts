import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const {
  syncCheckpointConnectionsMock,
  queueCloudSyncReconciliationMock,
  scheduleCloudSyncRunMock,
  runCloudSyncNowMock,
  stopCloudSyncEngineMock,
  enqueueCloudSyncTaskMock,
  getSettingsMock,
  saveSettingsMock,
  getCloudSyncPendingSettingsDecisionMock,
  clearCloudSyncPendingSettingsDecisionMock,
} = vi.hoisted(() => ({
  syncCheckpointConnectionsMock: vi.fn(),
  queueCloudSyncReconciliationMock: vi.fn(),
  scheduleCloudSyncRunMock: vi.fn(),
  runCloudSyncNowMock: vi.fn(),
  stopCloudSyncEngineMock: vi.fn(),
  enqueueCloudSyncTaskMock: vi.fn(),
  getSettingsMock: vi.fn(),
  saveSettingsMock: vi.fn(),
  getCloudSyncPendingSettingsDecisionMock: vi.fn(),
  clearCloudSyncPendingSettingsDecisionMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync/engine", () => ({
  getCloudSyncStateSnapshot: vi.fn(async () => ({})),
  queueCloudSyncReconciliation: queueCloudSyncReconciliationMock,
  runCloudSyncNow: runCloudSyncNowMock,
  scheduleCloudSyncRun: scheduleCloudSyncRunMock,
  stopCloudSyncEngine: stopCloudSyncEngineMock,
  syncCheckpointConnections: syncCheckpointConnectionsMock,
}));

vi.mock("../../entrypoints/background/cloud-sync/outbox", () => ({
  enqueueCloudSyncTask: enqueueCloudSyncTaskMock,
  listCloudSyncTasks: vi.fn(async () => []),
  updateCloudSyncTask: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/shared/browser-capabilities", () => ({
  filterSupportedCloudSyncProviders: vi.fn((providers: string[]) => providers),
  getDiagnosticsStorageSelection: vi.fn(() => ({
    areaName: "local",
    area: undefined,
    usesFallback: true,
  })),
}));

vi.mock("../../entrypoints/background/cloud-sync/checkpoints", () => ({
  clearCloudSyncPendingSettingsDecision: clearCloudSyncPendingSettingsDecisionMock,
  getCloudSyncPendingSettingsDecision: getCloudSyncPendingSettingsDecisionMock,
  upsertCloudSyncCheckpoint: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/background/cloud-sync/providers", () => ({
  connectCloudSyncProviderAdapter: vi.fn(),
  disconnectCloudSyncProviderAdapter: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
  saveSettings: saveSettingsMock,
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

import {
  initializeCloudSyncEngine,
  noteMeetingSessionSaved,
  resolveCloudSyncSettingsChoice,
} from "../../entrypoints/background/cloud-sync";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  getSettingsMock.mockResolvedValue({
    settings: {
      connectedCloudProviders: ["google-drive"],
      model: "gpt-5-mini",
      targetLanguage: "en",
      meetingOutputLanguage: "en",
      appearance: "system",
      deviceId: "device-1",
      deviceLabel: "My Device",
    },
  });
  saveSettingsMock.mockResolvedValue({ success: true });
  getCloudSyncPendingSettingsDecisionMock.mockResolvedValue({
    provider: "google-drive",
    detectedAt: Date.now(),
    localSettings: {
      model: "gpt-5-mini",
      targetLanguage: "en",
      translationEnabled: false,
      customPrompt: "local",
      meetingOutputLanguage: "en",
      meetingArchiveRetentionDays: 180,
      meetingProfiles: [],
      defaultMeetingProfileId: "default",
      appearance: "system",
      overlayVisible: true,
      captureStartupBehavior: "ask",
      captionActivationBehavior: "guided",
      sessionContinuationWindowMinutes: 120,
      overlayOpacity: 96,
      overlayClickThrough: false,
      storeMeetingChat: true,
    },
    remoteSettings: {
      model: "gpt-5.2",
      targetLanguage: "fa",
      translationEnabled: true,
      customPrompt: "remote",
      meetingOutputLanguage: "fa",
      meetingArchiveRetentionDays: 365,
      meetingProfiles: [],
      defaultMeetingProfileId: "default",
      appearance: "dark",
      overlayVisible: true,
      captureStartupBehavior: "ask",
      captionActivationBehavior: "guided",
      sessionContinuationWindowMinutes: 120,
      overlayOpacity: 96,
      overlayClickThrough: false,
      storeMeetingChat: true,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Cloud sync orchestration contract", () => {
  test("CSYNC-004: initialization and local-save hooks queue deferred runs instead of syncing inline", async () => {
    initializeCloudSyncEngine();
    await vi.waitFor(() => {
      expect(syncCheckpointConnectionsMock).toHaveBeenCalledWith(["google-drive"]);
    });
    expect(queueCloudSyncReconciliationMock).toHaveBeenCalledWith(["google-drive"]);
    expect(scheduleCloudSyncRunMock).toHaveBeenCalledWith("background-start", 5_000);
    expect(runCloudSyncNowMock).not.toHaveBeenCalled();

    await noteMeetingSessionSaved(
      {
        id: "session-1",
        sessionSyncId: "sync-1",
        syncContentHash: "hash-1",
        events: [{ timestamp: 1 }],
      } as never,
      ["google-drive"]
    );

    expect(enqueueCloudSyncTaskMock).toHaveBeenCalledTimes(3);
    expect(enqueueCloudSyncTaskMock.mock.calls[0]?.[0]).toMatchObject({
      dedupeKey: "session-meta:sync-1",
      kind: "sync-session-meta",
      schedulingStrategy: "latest",
    });
    expect(enqueueCloudSyncTaskMock.mock.calls[1]?.[0]).toMatchObject({
      dedupeKey: "session-events:sync-1",
      kind: "sync-session-events",
      schedulingStrategy: "latest",
    });
    expect(enqueueCloudSyncTaskMock.mock.calls[2]?.[0]).toMatchObject({
      dedupeKey: "session-artifacts:sync-1",
      kind: "sync-session-artifacts",
      schedulingStrategy: "latest",
    });
    expect(enqueueCloudSyncTaskMock.mock.calls[0]?.[1]).toBe(Date.now() + 15_000);
    expect(enqueueCloudSyncTaskMock.mock.calls[1]?.[1]).toBe(Date.now() + 15_000);
    expect(enqueueCloudSyncTaskMock.mock.calls[2]?.[1]).toBe(Date.now() + 15_000);
    expect(scheduleCloudSyncRunMock).toHaveBeenCalledWith("meeting-session-saved", 15_000);
    expect(runCloudSyncNowMock).not.toHaveBeenCalled();
  });

  test("CSYNC-010: ended sessions keep the short sync delay instead of the live-session debounce", async () => {
    await noteMeetingSessionSaved(
      {
        id: "session-2",
        sessionSyncId: "sync-2",
        syncContentHash: "hash-2",
        lifecycleState: "ended",
        endTime: 123,
        events: [{ timestamp: 1 }],
      } as never,
      ["google-drive"]
    );

    expect(enqueueCloudSyncTaskMock.mock.calls[0]?.[1]).toBe(Date.now() + 2_000);
    expect(enqueueCloudSyncTaskMock.mock.calls[1]?.[1]).toBe(Date.now() + 2_000);
    expect(enqueueCloudSyncTaskMock.mock.calls[2]?.[1]).toBe(Date.now() + 2_000);
    expect(scheduleCloudSyncRunMock).toHaveBeenCalledWith("meeting-session-saved", 2_000);
  });

  test("CSYNC-018: long live sessions widen the deferred sync window to reduce full event-stream rewrites", async () => {
    await noteMeetingSessionSaved(
      {
        id: "session-3",
        sessionSyncId: "sync-3",
        syncContentHash: "hash-3",
        lifecycleState: "live",
        events: Array.from({ length: 140 }, (_, index) => ({
          timestamp: index + 1,
        })),
      } as never,
      ["google-drive"]
    );

    expect(enqueueCloudSyncTaskMock.mock.calls[0]?.[1]).toBe(Date.now() + 30_000);
    expect(enqueueCloudSyncTaskMock.mock.calls[1]?.[1]).toBe(Date.now() + 30_000);
    expect(enqueueCloudSyncTaskMock.mock.calls[2]?.[1]).toBe(Date.now() + 30_000);
    expect(scheduleCloudSyncRunMock).toHaveBeenCalledWith("meeting-session-saved", 30_000);
  });

  test("CSYNC-006: resolving pending settings writes selected settings and immediately reruns reconciliation", async () => {
    const response = await resolveCloudSyncSettingsChoice("use-cloud");

    expect(response).toEqual({ success: true });
    expect(saveSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5.2", targetLanguage: "fa" })
    );
    expect(clearCloudSyncPendingSettingsDecisionMock).toHaveBeenCalledTimes(1);
    expect(queueCloudSyncReconciliationMock).toHaveBeenCalledWith(["google-drive"]);
    expect(runCloudSyncNowMock).toHaveBeenCalledWith("resolve-settings-choice:use-cloud");
  });
});
