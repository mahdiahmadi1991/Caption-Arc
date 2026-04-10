import { beforeEach, describe, expect, test, vi } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

const {
  getSettingsMock,
  saveSettingsMock,
  listStoredMeetingSessionRecordsMock,
  replaceStoredMeetingSessionRecordsMock,
  normalizeMeetingSessionMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  saveSettingsMock: vi.fn(),
  listStoredMeetingSessionRecordsMock: vi.fn(),
  replaceStoredMeetingSessionRecordsMock: vi.fn(),
  normalizeMeetingSessionMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
  saveSettings: saveSettingsMock,
}));

vi.mock("../../entrypoints/background/history-db", () => ({
  listStoredMeetingSessionRecords: listStoredMeetingSessionRecordsMock,
  replaceStoredMeetingSessionRecords: replaceStoredMeetingSessionRecordsMock,
}));

vi.mock("../../entrypoints/shared/meeting-session", () => ({
  normalizeMeetingSession: normalizeMeetingSessionMock,
}));

import {
  exportAppDataBundle,
  importAppDataBundle,
} from "../../entrypoints/background/data-transfer";

beforeEach(() => {
  vi.clearAllMocks();
  const base = createDefaultSettings();
  getSettingsMock.mockResolvedValue({
    settings: {
      ...base,
      openaiApiKey: "sk-live",
      model: "gpt-5-mini",
      connectedCloudProviders: ["google-drive"],
    },
  });
  saveSettingsMock.mockResolvedValue({ success: true });
  listStoredMeetingSessionRecordsMock.mockResolvedValue([
    {
      id: "s-1",
      sessionSyncId: "s-1",
      schemaVersion: 3,
      platform: "google-meet",
      providerLabel: "Google Meet",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      title: "Daily",
      starred: false,
      identifiers: { meetingCode: "abc-defg-hij" },
      sessionFingerprint: "fp-1",
      lifecycleState: "ended",
      startTime: Date.now() - 2000,
      endTime: Date.now() - 1000,
      lastSeenAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
      searchableText: "",
      events: [],
      captions: [],
      chatMessages: [],
      summaries: {},
      artifacts: { summaries: {} },
    },
  ]);
  replaceStoredMeetingSessionRecordsMock.mockResolvedValue(undefined);
  normalizeMeetingSessionMock.mockImplementation((session: unknown) => session);
});

describe("Data transfer contract", () => {
  test("DXFER-001: export uses fixed manifest and portable payload fields", async () => {
    const response = await exportAppDataBundle();
    expect(response.success).toBe(true);
    expect(response.data?.manifest.kind).toBe("captionarc-data-bundle");
    expect(response.data?.bundleVersion).toBe(1);
    expect(response.data?.manifest.sessionCount).toBe(1);
    expect(response.data?.settings.connectedCloudProviders).toBeUndefined();
    expect(response.data?.sessions).toHaveLength(1);
  });

  test("DXFER-002: import rejects malformed bundle version/kind/payload", async () => {
    const badVersion = await importAppDataBundle({
      bundleVersion: 2,
      manifest: { kind: "captionarc-data-bundle" },
      settings: {},
      sessions: [],
    });
    expect(badVersion.success).toBe(false);
    expect(badVersion.error).toContain("Unsupported data bundle version");

    const badKind = await importAppDataBundle({
      bundleVersion: 1,
      manifest: { kind: "wrong-kind" },
      settings: {},
      sessions: [],
    });
    expect(badKind.success).toBe(false);
    expect(badKind.error).toContain("CaptionArc data bundle");

    const badPayload = await importAppDataBundle({
      bundleVersion: 1,
      manifest: { kind: "captionarc-data-bundle" },
      settings: {},
      sessions: "invalid",
    });
    expect(badPayload.success).toBe(false);
    expect(badPayload.error).toContain("session list");
  });

  test("DXFER-003: apply failures trigger settings rollback before returning error", async () => {
    replaceStoredMeetingSessionRecordsMock.mockRejectedValueOnce(
      new Error("cannot replace records")
    );
    const portableSession = {
      id: "s-1",
      sessionSyncId: "s-1",
      schemaVersion: 3,
      platform: "google-meet",
      providerLabel: "Google Meet",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      title: "Daily",
      starred: false,
      identifiers: { meetingCode: "abc-defg-hij" },
      sessionFingerprint: "fp-1",
      lifecycleState: "ended",
      startTime: Date.now() - 2000,
      endTime: Date.now() - 1000,
      lastSeenAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
      searchableText: "",
      events: [],
      captions: [],
      chatMessages: [],
      summaries: {},
      artifacts: { summaries: {} },
    };

    const imported = await importAppDataBundle({
      bundleVersion: 1,
      manifest: {
        kind: "captionarc-data-bundle",
        bundleVersion: 1,
        exportedAt: Date.now(),
        sessionCount: 1,
      },
      settings: {
        ...createDefaultSettings(),
        model: "gpt-5.2",
      },
      sessions: [portableSession],
    });

    expect(imported.success).toBe(false);
    expect(saveSettingsMock).toHaveBeenCalledTimes(2);
    expect(saveSettingsMock.mock.calls[0]?.[0]).toMatchObject({ model: "gpt-5.2" });
    expect(saveSettingsMock.mock.calls[1]?.[0]).toMatchObject({ model: "gpt-5-mini" });
  });
});
