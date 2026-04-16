import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import { planMeetingSummaryExecution } from "../../entrypoints/shared/summary-generation";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";

const {
  getSettingsMock,
  getStoredMeetingSessionRecordMock,
  putStoredMeetingSessionRecordMock,
  generateTextMock,
  generateTextChunkMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  getStoredMeetingSessionRecordMock: vi.fn(),
  putStoredMeetingSessionRecordMock: vi.fn(),
  generateTextMock: vi.fn(),
  generateTextChunkMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("../../entrypoints/background/history-db", () => ({
  clearStoredMeetingSessionRecords: vi.fn(),
  deleteStoredMeetingSessionRecord: vi.fn(),
  enforceMeetingHistoryRetentionPolicy: vi.fn(async () => ({ deletedSessionIds: [] })),
  estimateMeetingHistoryBytes: vi.fn(async () => 0),
  findLatestStoredMeetingSessionRecordByFingerprint: vi.fn(async () => null),
  getStoredMeetingSessionRecord: getStoredMeetingSessionRecordMock,
  listStoredMeetingSessionIndexRecords: vi.fn(async () => []),
  listStoredMeetingSessionRecords: vi.fn(async () => []),
  putStoredMeetingSessionRecord: putStoredMeetingSessionRecordMock,
}));

vi.mock("../../entrypoints/background/translation", () => ({
  generateText: generateTextMock,
  generateTextChunk: generateTextChunkMock,
  translate: vi.fn(),
}));

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteMeetingArchiveCleared: vi.fn(async () => undefined),
  noteMeetingSessionDeleted: vi.fn(async () => undefined),
  noteMeetingSessionSaved: vi.fn(async () => undefined),
}));

vi.mock("../../entrypoints/background/assistant", () => ({
  clearMeetingAssistantRuntimeState: vi.fn(),
  queueMeetingAssistantProcessing: vi.fn(),
}));

vi.mock("../../entrypoints/background/diagnostics", () => ({
  createBackgroundDiagnosticsLogger: vi.fn(() => ({
    trace: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
  })),
}));

import { historySummaryInternals } from "../../entrypoints/background/history";

function createSession(
  overrides: Partial<MeetingSession> = {},
  captionCount = 2,
  captionLength = 60
): MeetingSession {
  const now = Date.now();
  const text = "x".repeat(captionLength);
  return {
    id: "session-1",
    sessionSyncId: "session-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Team Sync",
    starred: false,
    identifiers: { meetingCode: "xxx-xxxx-xxx" },
    sessionFingerprint: "fp-1",
    lifecycleState: "ended",
    startTime: now - 500_000,
    endTime: now - 1_000,
    lastSeenAt: now - 1_000,
    updatedAt: now - 1_000,
    searchableText: "",
    events: Array.from({ length: captionCount }).map((_, index) => ({
      source: "caption" as const,
      speaker: "Speaker",
      text: `${text}-${index}`,
      time: "10:00",
      timestamp: now - 50_000 + index * 1000,
      sessionOffsetMs: index * 1000,
      isFinal: true,
      stableEventKey: `ev-${index}`,
    })),
    captions: Array.from({ length: captionCount }).map((_, index) => ({
      speaker: "Speaker",
      text: `${text}-${index}`,
      time: "10:00",
      timestamp: now - 50_000 + index * 1000,
      sessionOffsetMs: index * 1000,
      isFinal: true,
      stableEventKey: `ev-${index}`,
    })),
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
    ...overrides,
  };
}

function installExtensionRuntime() {
  const storageState: Record<string, unknown> = {};
  const alarmsCreate = vi.fn(async () => undefined);
  const alarmsClear = vi.fn(async () => true);
  const notificationsCreate = vi.fn(async (notificationId: string) => notificationId);
  const notificationsClear = vi.fn(async () => true);
  const tabsQuery = vi.fn(async () => []);
  const tabsUpdate = vi.fn(async () => undefined);
  const tabsCreate = vi.fn(async () => undefined);
  const windowsUpdate = vi.fn(async () => undefined);
  const getUILanguage = vi.fn(() => "en-US");

  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storageState[key] })),
        set: vi.fn(async (payload: Record<string, unknown>) => {
          Object.assign(storageState, payload);
        }),
      },
    },
    alarms: {
      create: alarmsCreate,
      clear: alarmsClear,
    },
    runtime: {
      sendMessage: vi.fn(async () => ({ success: true })),
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
    },
    notifications: {
      create: notificationsCreate,
      clear: notificationsClear,
    },
    tabs: {
      query: tabsQuery,
      update: tabsUpdate,
      create: tabsCreate,
    },
    windows: {
      update: windowsUpdate,
    },
    i18n: {
      getUILanguage,
    },
  });

  return {
    storageState,
    alarmsCreate,
    alarmsClear,
    notificationsCreate,
    notificationsClear,
    tabsQuery,
    tabsUpdate,
    tabsCreate,
    windowsUpdate,
    getUILanguage,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  const defaults = createDefaultSettings();
  getSettingsMock.mockResolvedValue({
    settings: {
      ...defaults,
      meetingOutputLanguage: "fa",
      defaultMeetingProfileId: defaults.meetingProfiles[0]?.id,
      meetingProfiles: defaults.meetingProfiles.map((profile) => ({
        ...profile,
        autoSummarizeOnMeetingEnd: true,
        summaryGenerationMode: "balanced",
      })),
      model: "gpt-5-mini",
      connectedCloudProviders: [],
    },
  });
  putStoredMeetingSessionRecordMock.mockResolvedValue(undefined);
  historySummaryInternals.resetMeetingSummaryInternalsForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Meeting summary pipeline contract", () => {
  test("MSUM-001: queue persistence is per-session with bounded retries and earliest retry alarm", async () => {
    const { alarmsCreate } = installExtensionRuntime();
    await historySummaryInternals.queueMeetingSummaryJob(
      {
        sessionId: "session-1",
        targetLanguage: "fa",
        profileId: "default",
      },
      "automatic"
    );
    await historySummaryInternals.queueMeetingSummaryJob(
      {
        sessionId: "session-1",
        targetLanguage: "fa",
        profileId: "default",
      },
      "automatic"
    );

    const jobs = await historySummaryInternals.loadPersistedMeetingSummaryJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.maxAttempts).toBe(3);

    await historySummaryInternals.savePersistedMeetingSummaryJobs([
      {
        ...jobs[0]!,
        retryAfter: Date.now() + 10_000,
      },
      {
        ...jobs[0]!,
        request: { ...jobs[0]!.request, sessionId: "session-2" },
        retryAfter: Date.now() + 2_000,
      },
    ]);
    await historySummaryInternals.scheduleMeetingSummaryRetryAlarm();

    expect(alarmsCreate).toHaveBeenCalledWith(
      "meeting-summary-job-retry",
      expect.objectContaining({ when: expect.any(Number) })
    );
    const when = alarmsCreate.mock.calls[0]?.[1]?.when as number;
    expect(when).toBeLessThanOrEqual(Date.now() + 2_500);
  });

  test("MSUM-002: automatic summary gating requires ended sessions, content, and enabled profile", () => {
    const defaults = createDefaultSettings();
    const settings = {
      ...defaults,
      meetingOutputLanguage: "fa",
      meetingProfiles: defaults.meetingProfiles.map((profile) => ({
        ...profile,
        autoSummarizeOnMeetingEnd: true,
      })),
      defaultMeetingProfileId: defaults.meetingProfiles[0]?.id,
    };
    const endedWithContent = createSession({}, 1, 40);
    const request = historySummaryInternals.getAutomaticSummaryRequest(
      endedWithContent,
      settings as never
    );
    expect(request).toEqual({
      sessionId: "session-1",
      targetLanguage: "fa",
      profileId: settings.defaultMeetingProfileId,
    });

    const liveSession = createSession({ endTime: undefined, lifecycleState: "live" }, 1, 40);
    expect(
      historySummaryInternals.getAutomaticSummaryRequest(liveSession, settings as never)
    ).toBeNull();

    const emptyContent = createSession({ captions: [], chatMessages: [] }, 0, 0);
    expect(
      historySummaryInternals.getAutomaticSummaryRequest(emptyContent, settings as never)
    ).toBeNull();
  });

  test("MSUM-003: summary planning picks strategy by weighted source and instruction size", () => {
    const lowRiskPlan = planMeetingSummaryExecution(createSession({}, 1, 20), "short", "balanced");
    expect(lowRiskPlan.strategy).toBe("single_shot");

    const highRiskPlan = planMeetingSummaryExecution(
      createSession({}, 120, 180),
      "extensive instructions ".repeat(80),
      "balanced"
    );
    expect(highRiskPlan.strategy).toBe("multi_stage");
    expect(highRiskPlan.riskLevel).toBe("high");
  });

  test("MSUM-004: long summaries continue segment-by-segment and reconcile final draft", async () => {
    installExtensionRuntime();
    historySummaryInternals.setActiveMeetingSummaryJobForTests("session-continue");

    generateTextChunkMock
      .mockResolvedValueOnce({ success: true, text: "segment-1", truncated: true })
      .mockResolvedValueOnce({ success: true, text: "segment-2", truncated: false });
    generateTextMock.mockResolvedValueOnce({
      success: true,
      text: "reconciled-final",
    });

    const response = await historySummaryInternals.generateMeetingSummaryText(
      "session-continue",
      "base prompt",
      "fa",
      true
    );

    expect(response).toEqual({
      success: true,
      text: "reconciled-final",
      continuationCount: 1,
      reconciled: true,
    });
    historySummaryInternals.clearActiveMeetingSummaryJobForTests("session-continue");
  });

  test("MSUM-005: execution path uses direct prompts for small sessions and evidence extraction for large sessions", async () => {
    installExtensionRuntime();
    const smallSession = createSession({}, 2, 40);
    const largeSession = createSession({}, 120, 180);

    generateTextChunkMock.mockImplementation(async (prompt: string) => {
      if (prompt.includes("Return valid JSON only with this exact shape")) {
        return {
          success: true,
          text: JSON.stringify({
            facts: ["fact"],
            decisions: [],
            actionItems: [],
            risks: [],
            openQuestions: [],
            notableDetails: [],
            snippets: [],
            speakerSignals: [],
          }),
          truncated: false,
        };
      }
      return { success: true, text: "summary-output", truncated: false };
    });
    generateTextMock.mockResolvedValue({
      success: true,
      text: "summary-output",
    });

    getStoredMeetingSessionRecordMock.mockResolvedValueOnce(smallSession);
    const smallResult = await historySummaryInternals.runMeetingSummaryJob(
      {
        sessionId: smallSession.id,
        targetLanguage: "fa",
        profileId: createDefaultSettings().meetingProfiles[0]!.id,
      },
      "manual"
    );
    expect(smallResult.success).toBe(true);
    expect(
      generateTextChunkMock.mock.calls.some((call) =>
        String(call[0]).includes("extracting structured evidence")
      )
    ).toBe(false);

    generateTextChunkMock.mockClear();
    getStoredMeetingSessionRecordMock.mockResolvedValueOnce(largeSession);
    const largeResult = await historySummaryInternals.runMeetingSummaryJob(
      {
        sessionId: largeSession.id,
        targetLanguage: "fa",
        profileId: "default",
      },
      "manual"
    );
    expect(largeResult.success).toBe(true);
    expect(
      generateTextChunkMock.mock.calls.some((call) =>
        String(call[0]).includes("extracting structured evidence")
      )
    ).toBe(true);
    expect(putStoredMeetingSessionRecordMock).toHaveBeenCalled();
  });

  test("MSUM-006: successful summary completion creates a summary-ready notification when the user is not focused on the same session", async () => {
    const { notificationsCreate } = installExtensionRuntime();
    const session = createSession({}, 2, 40);

    generateTextChunkMock.mockResolvedValue({
      success: true,
      text: "summary-output",
      truncated: false,
    });
    getStoredMeetingSessionRecordMock.mockResolvedValueOnce(session);

    const result = await historySummaryInternals.runMeetingSummaryJob(
      {
        sessionId: session.id,
        targetLanguage: "fa",
        profileId: createDefaultSettings().meetingProfiles[0]!.id,
      },
      "manual"
    );

    expect(result.success).toBe(true);
    expect(notificationsCreate).toHaveBeenCalledTimes(1);
    expect(notificationsCreate).toHaveBeenCalledWith(
      expect.stringMatching(/^summary-ready:/),
      expect.objectContaining({
        type: "basic",
        iconUrl: "icon-128.png",
      })
    );
  });

  test("MSUM-007: summary-ready notifications are suppressed when the same session detail is visible and focused", async () => {
    const { notificationsCreate } = installExtensionRuntime();
    const session = createSession({}, 2, 40);

    historySummaryInternals.setMeetingHistoryViewStateForTests(9, {
      selectedSessionId: session.id,
      visible: true,
      focused: true,
    });

    generateTextChunkMock.mockResolvedValue({
      success: true,
      text: "summary-output",
      truncated: false,
    });
    getStoredMeetingSessionRecordMock.mockResolvedValueOnce(session);

    const result = await historySummaryInternals.runMeetingSummaryJob(
      {
        sessionId: session.id,
        targetLanguage: "fa",
        profileId: createDefaultSettings().meetingProfiles[0]!.id,
      },
      "manual"
    );

    expect(result.success).toBe(true);
    expect(notificationsCreate).not.toHaveBeenCalled();
  });

  test("MSUM-008: presence updates use a stable view instance when sender.tab is unavailable", async () => {
    installExtensionRuntime();
    const response = await historySummaryInternals.updateMeetingHistoryViewState(
      {
        selectedSessionId: "session-1",
        currentUrl:
          "chrome-extension://test/meeting-history.html?session=session-1&summary=default%3Afa%3A1712742000000&summaryExpanded=1",
        viewInstanceId: "meeting-history-view-1",
        visible: true,
        focused: true,
      },
      {
      } as chrome.runtime.MessageSender
    );

    expect(response).toEqual({ success: true });
    expect(
      historySummaryInternals
        .getMeetingHistoryViewStatesForTests()
        .get("view:meeting-history-view-1")
    ).toMatchObject({
      selectedSessionId: "session-1",
      visible: true,
      focused: true,
    });
  });

  test("MSUM-010: same-url meeting-history views keep independent presence state without sender tabs", async () => {
    installExtensionRuntime();

    await historySummaryInternals.updateMeetingHistoryViewState(
      {
        selectedSessionId: "session-1",
        currentUrl: "chrome-extension://test/meeting-history.html?session=session-1",
        viewInstanceId: "meeting-history-view-a",
        visible: true,
        focused: true,
      },
      {} as chrome.runtime.MessageSender
    );

    await historySummaryInternals.updateMeetingHistoryViewState(
      {
        selectedSessionId: "session-1",
        currentUrl: "chrome-extension://test/meeting-history.html?session=session-1",
        viewInstanceId: "meeting-history-view-b",
        visible: false,
        focused: false,
      },
      {} as chrome.runtime.MessageSender
    );

    const states = historySummaryInternals.getMeetingHistoryViewStatesForTests();
    expect(states.size).toBe(2);
    expect(states.get("view:meeting-history-view-a")).toMatchObject({
      visible: true,
      focused: true,
    });
    expect(states.get("view:meeting-history-view-b")).toMatchObject({
      visible: false,
      focused: false,
    });
  });

  test("MSUM-009: clicking a summary-ready notification prefers the best matching meeting-history tab instead of the first one", async () => {
    const {
      notificationsClear,
      tabsQuery,
      tabsUpdate,
      windowsUpdate,
    } = installExtensionRuntime();

    tabsQuery.mockImplementation(
      async (queryInfo?: { active?: boolean; lastFocusedWindow?: boolean }) => {
        if (queryInfo?.active && queryInfo?.lastFocusedWindow) {
          return [
            {
              id: 34,
              url: "chrome-extension://test/meeting-history.html?session=recent-session",
              windowId: 7,
              active: true,
            },
          ];
        }

        return [
          {
            id: 12,
            url: "chrome-extension://test/meeting-history.html?session=older-session",
            windowId: 4,
          },
          {
            id: 34,
            url: "chrome-extension://test/meeting-history.html?session=recent-session",
            windowId: 7,
            active: true,
          },
        ];
      }
    );

    const notificationId = historySummaryInternals.buildSummaryReadyNotificationId(
      "session-1",
      "default:fa:1712742000000"
    );

    const handled = await historySummaryInternals.handleSummaryReadyNotificationClick(
      notificationId
    );

    expect(handled).toBe(true);
    expect(notificationsClear).toHaveBeenCalledWith(notificationId);
    expect(tabsUpdate).toHaveBeenCalledWith(
      34,
      expect.objectContaining({
        active: true,
        url: expect.stringContaining("session=session-1"),
      })
    );
    expect(String(tabsUpdate.mock.calls[0]?.[1]?.url)).toContain(
      "summary=default%3Afa%3A1712742000000"
    );
    expect(String(tabsUpdate.mock.calls[0]?.[1]?.url)).toContain(
      "summaryExpanded=1"
    );
    expect(windowsUpdate).toHaveBeenCalledWith(7, { focused: true });
  });
});
