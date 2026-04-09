import { getSettings, saveSettings } from "./settings";
import { generateText, translate } from "./translation";
import { exportAppDataBundle, importAppDataBundle } from "./data-transfer";
import {
  connectCloudSyncProvider,
  disconnectCloudSyncProvider,
  getCloudSyncState,
  initializeCloudSyncEngine,
  resolveCloudSyncSettingsChoice,
  retryCloudSync,
} from "./cloud-sync";
import {
  findMeetingSessionContinuationCandidate,
  getMeetingHistory,
  getMeetingHistoryIndex,
  getMeetingSummaryJobStatus,
  getMeetingSummaryJobStatuses,
  handleMeetingSummaryRetryAlarm,
  getMeetingSession,
  initializeMeetingSummaryQueue,
  resolveMeetingSession,
  saveMeetingSession,
  storeMeetingSessionShell,
  deleteMeetingSession,
  finalizeMeetingSessionEnd,
  updateMeetingSession,
  cancelMeetingSummaryJob,
  translateSessionCaption,
  translateSessionCaptions,
  generateMeetingSummary,
  clearMeetingHistory,
  getStorageUsage,
} from "./history";
import {
  clearQuickAccessRuntimeStatus,
  getQuickAccessRuntimeStatus,
  initializeQuickAccessRuntimeRegistry,
  updateQuickAccessRuntimeStatus,
} from "./quick-access-runtime";
import { getMeetingAssistantLiveState } from "./assistant";
import {
  appendDiagnosticsEvent,
  clearDiagnosticsData,
  clearDiagnosticsSnapshot,
  createBackgroundDiagnosticsLogger,
  getDiagnosticsConfig,
  getDiagnosticsPayload,
  initializeDiagnosticsCollector,
  setDiagnosticsConfig,
  setDiagnosticsSnapshot,
  syncDiagnosticsEnvironmentConfig,
} from "./diagnostics";

const backgroundLogger = createBackgroundDiagnosticsLogger({
  domain: "runtime",
  feature: "background-message-router",
});

export default defineBackground(() => {
  void backgroundLogger.info("background_runtime_started");
  void initializeDiagnosticsCollector()
    .then(() => syncDiagnosticsEnvironmentConfig())
    .catch((error) => {
      void backgroundLogger.error("diagnostics_startup_sync_failed", { error });
    });
  initializeCloudSyncEngine();
  void initializeMeetingSummaryQueue();
  void initializeQuickAccessRuntimeRegistry();

  chrome.runtime.onStartup.addListener(() => {
    void backgroundLogger.info("background_on_startup");
    void initializeMeetingSummaryQueue();
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    void backgroundLogger.debug("background_alarm_received", {
      name: alarm.name,
    });
    if (alarm.name === "meeting-summary-job-retry") {
      void handleMeetingSummaryRetryAlarm();
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    void backgroundLogger.trace("message_received", {
      action: typeof message?.action === "string" ? message.action : null,
      hasSenderTab: Boolean(sender?.tab?.id),
      senderOrigin: sender?.origin || sender?.url || null,
    });
    handleMessage(message, sender)
      .then((response) => {
        void backgroundLogger.trace("message_completed", {
          action: typeof message?.action === "string" ? message.action : null,
          success:
            typeof response === "object" && response !== null && "success" in response
              ? Boolean((response as { success?: boolean }).success)
              : undefined,
        });
        sendResponse(response);
      })
      .catch((error) => {
        void backgroundLogger.error("message_handler_failed", {
          action: typeof message?.action === "string" ? message.action : null,
          error,
        });
        sendResponse({ success: false, error: String(error) });
      });

    return true;
  });
});

async function handleMessage(
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.action) {
    case "getSettings":
      return getSettings();

    case "saveSettings":
      return saveSettings(message.settings as Parameters<typeof saveSettings>[0]);

    case "getCloudSyncState":
      return getCloudSyncState();

    case "connectCloudSyncProvider":
      return connectCloudSyncProvider(
        message.provider as Parameters<typeof connectCloudSyncProvider>[0]
      );

    case "disconnectCloudSyncProvider":
      return disconnectCloudSyncProvider(
        message.provider as Parameters<typeof disconnectCloudSyncProvider>[0]
      );

    case "retryCloudSync":
      return retryCloudSync(
        message.provider as Parameters<typeof retryCloudSync>[0]
      );

    case "resolveCloudSyncSettingsChoice":
      return resolveCloudSyncSettingsChoice(
        message.choice as Parameters<typeof resolveCloudSyncSettingsChoice>[0]
      );

    case "translate":
      return translate(message as Parameters<typeof translate>[0]);

    case "generateText":
      return generateText(
        message.prompt as string,
        message.maxTokens as number | undefined
      );

    case "openOptions":
      await backgroundLogger.info("open_options_requested", {
        senderOrigin: sender?.origin || sender?.url || null,
      });
      chrome.runtime.openOptionsPage();
      return { success: true };

    case "getMeetingHistory":
      return getMeetingHistory();

    case "getMeetingHistoryIndex":
      return getMeetingHistoryIndex();

    case "getMeetingSession":
      return getMeetingSession(message.sessionId as string);

    case "getMeetingAssistantLiveState":
      return getMeetingAssistantLiveState(message.sessionId as string);

    case "getMeetingSummaryJobStatus":
      return getMeetingSummaryJobStatus(message.sessionId as string);

    case "getMeetingSummaryJobStatuses":
      return getMeetingSummaryJobStatuses();

    case "cancelMeetingSummaryJob":
      return cancelMeetingSummaryJob(message.sessionId as string);

    case "exportAppDataBundle":
      return exportAppDataBundle();

    case "importAppDataBundle":
      return importAppDataBundle(message.bundle);

    case "resolveMeetingSession":
      return resolveMeetingSession(
        message as Parameters<typeof resolveMeetingSession>[0]
      );

    case "findMeetingSessionContinuationCandidate":
      return findMeetingSessionContinuationCandidate(
        message as Parameters<typeof findMeetingSessionContinuationCandidate>[0]
      );

    case "saveMeetingSession":
      return saveMeetingSession(message.session as Parameters<typeof saveMeetingSession>[0]);

    case "storeMeetingSessionShell":
      return storeMeetingSessionShell(
        message.session as Parameters<typeof storeMeetingSessionShell>[0]
      );

    case "finalizeMeetingSessionEnd":
      return finalizeMeetingSessionEnd(
        message as Parameters<typeof finalizeMeetingSessionEnd>[0]
      );

    case "deleteMeetingSession":
      return deleteMeetingSession(message.sessionId as string);

    case "updateMeetingSession":
      return updateMeetingSession(
        message.sessionId as string,
        message.updates as Parameters<typeof updateMeetingSession>[1]
      );

    case "translateSessionCaption":
      return translateSessionCaption(
        message as Parameters<typeof translateSessionCaption>[0]
      );

    case "translateSessionCaptions":
      return translateSessionCaptions(
        message as Parameters<typeof translateSessionCaptions>[0]
      );

    case "generateMeetingSummary":
      return generateMeetingSummary(
        message as Parameters<typeof generateMeetingSummary>[0]
      );

    case "clearMeetingHistory":
      return clearMeetingHistory();

    case "getStorageUsage":
      return getStorageUsage();

    case "updateQuickAccessRuntimeStatus":
      return updateQuickAccessRuntimeStatus(
        message.status as Parameters<typeof updateQuickAccessRuntimeStatus>[0],
        sender
      );

    case "clearQuickAccessRuntimeStatus":
      return clearQuickAccessRuntimeStatus(sender);

    case "getQuickAccessRuntimeStatus":
      return getQuickAccessRuntimeStatus();

    case "recordDiagnosticsEvent":
      return appendDiagnosticsEvent(
        message.event as Parameters<typeof appendDiagnosticsEvent>[0],
        sender
      );

    case "setDiagnosticsSnapshot":
      return setDiagnosticsSnapshot(
        message.key as string,
        message.runtime as Parameters<typeof setDiagnosticsSnapshot>[1],
        (message.data as Record<string, unknown>) || {},
        sender
      );

    case "clearDiagnosticsSnapshot":
      return clearDiagnosticsSnapshot(message.key as string, sender);

    case "clearDiagnosticsData":
      return clearDiagnosticsData({
        includeSnapshots: message.includeSnapshots !== false,
      });

    case "getDiagnosticsConfig":
      return { success: true, config: getDiagnosticsConfig() };

    case "setDiagnosticsConfig":
      return setDiagnosticsConfig(
        (message.config as Parameters<typeof setDiagnosticsConfig>[0]) || {}
      );

    case "getDiagnosticsPayload":
      return getDiagnosticsPayload(
        (message.query as Parameters<typeof getDiagnosticsPayload>[0]) || {}
      );

    default:
      await backgroundLogger.warn("message_unknown_action", {
        action: typeof message.action === "string" ? message.action : null,
      });
      return { success: false, error: "Unknown action" };
  }
}
