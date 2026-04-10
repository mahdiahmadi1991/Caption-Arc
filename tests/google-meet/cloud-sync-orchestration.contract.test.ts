import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  syncCheckpointConnectionsMock,
  queueCloudSyncReconciliationMock,
  scheduleCloudSyncRunMock,
  runCloudSyncNowMock,
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
  syncCheckpointConnections: syncCheckpointConnectionsMock,
}));

vi.mock("../../entrypoints/background/cloud-sync/outbox", () => ({
  enqueueCloudSyncTask: enqueueCloudSyncTaskMock,
  listCloudSyncTasks: vi.fn(async () => []),
  updateCloudSyncTask: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/shared/browser-capabilities", () => ({
  filterSupportedCloudSyncProviders: vi.fn((providers: string[]) => providers),
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

import {
  initializeCloudSyncEngine,
  noteMeetingSessionSaved,
  resolveCloudSyncSettingsChoice,
} from "../../entrypoints/background/cloud-sync";

beforeEach(() => {
  vi.clearAllMocks();
  getSettingsMock.mockResolvedValue({
    settings: {
      connectedCloudProviders: ["google-drive"],
      model: "gpt-5-mini",
      targetLanguage: "en",
      summaryLanguage: "en",
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
      summaryLanguage: "en",
      summaryProfiles: [],
      defaultSummaryProfileId: "default",
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
      summaryLanguage: "fa",
      summaryProfiles: [],
      defaultSummaryProfileId: "default",
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

    expect(enqueueCloudSyncTaskMock).toHaveBeenCalledTimes(2);
    expect(enqueueCloudSyncTaskMock.mock.calls[0]?.[0]).toMatchObject({
      dedupeKey: "session-meta:sync-1",
      kind: "sync-session-meta",
    });
    expect(enqueueCloudSyncTaskMock.mock.calls[1]?.[0]).toMatchObject({
      dedupeKey: "session-events:sync-1",
      kind: "sync-session-events",
    });
    expect(scheduleCloudSyncRunMock).toHaveBeenCalledWith("meeting-session-saved", 2_000);
    expect(runCloudSyncNowMock).not.toHaveBeenCalled();
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
