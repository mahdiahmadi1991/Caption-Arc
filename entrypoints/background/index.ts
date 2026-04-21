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
  shutdownCloudSyncForTermsRevocation,
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
  updateMeetingHistoryViewState,
  translateSessionCaption,
  translateSessionCaptions,
  generateMeetingSummary,
  clearMeetingHistory,
  getStorageUsage,
  handleMeetingHistoryTabRemoved,
  handleSummaryReadyNotificationClick,
  debugHandleSummaryReadyNotificationClick,
  shutdownMeetingSummaryQueueForTermsRevocation,
} from "./history";
import {
  clearQuickAccessRuntimeStatus,
  getQuickAccessRuntimeStatus,
  initializeQuickAccessRuntimeRegistry,
  requestQuickAccessSoftRefresh,
  updateQuickAccessRuntimeStatus,
} from "./quick-access-runtime";
import {
  getMeetingAssistantLiveState,
  requeueAssistantSessionsAfterSettingsRecovery,
} from "./assistant";
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
import {
  getMeetingHistoryPageUrl,
  getTermsOfServicePageUrl,
  hasAcceptedCurrentTerms,
} from "../shared/legal";
import { detectAppEnvironment } from "../shared/runtime-environment";

const backgroundLogger = createBackgroundDiagnosticsLogger({
  domain: "runtime",
  feature: "background-message-router",
});
let protectedBackgroundServicesStarted = false;
let protectedBackgroundServicesInitPromise: Promise<void> | null = null;

const TERMS_GATE_ALLOWED_ACTIONS = new Set([
  "getSettings",
  "openOptions",
  "closeExtensionPageTab",
  "saveTermsDeclineAndClosePage",
  "saveInstallTermsDeclineAndClosePage",
  "updateQuickAccessRuntimeStatus",
  "clearQuickAccessRuntimeStatus",
  "getQuickAccessRuntimeStatus",
  "recordDiagnosticsEvent",
  "setDiagnosticsSnapshot",
  "clearDiagnosticsSnapshot",
  "clearDiagnosticsData",
  "getDiagnosticsConfig",
  "setDiagnosticsConfig",
  "getDiagnosticsPayload",
  "debugHandleSummaryReadyNotificationClick",
]);

const TERMS_GATE_ALLOWED_SETTINGS_KEYS = new Set([
  "appearance",
  "termsAcceptance",
  "termsDecline",
]);

function createTermsRequiredResponse(source: string) {
  return {
    success: false,
    code: "terms_not_accepted",
    error: "The current Terms of Service must be accepted before using CaptionArc.",
    termsPageUrl: getTermsOfServicePageUrl({
      mode: "accept",
      source,
    }),
  };
}

function resolveMeetingSessionDetailUrl(sessionId: unknown): string | null {
  if (typeof sessionId !== "string") {
    return null;
  }

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    return null;
  }

  const query = new URLSearchParams({ session: normalizedSessionId }).toString();
  return `${getMeetingHistoryPageUrl()}?${query}`;
}

function isSafeBlockedSettingsWrite(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const keys = Object.keys(value);
  return (
    keys.length > 0 &&
    keys.every((key) => TERMS_GATE_ALLOWED_SETTINGS_KEYS.has(key))
  );
}

async function resolveExtensionPageTabIdForClose(
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender
): Promise<number | null> {
  if (typeof message.tabId === "number") {
    return message.tabId;
  }

  if (sender.tab?.id !== undefined) {
    return sender.tab.id;
  }

  const currentUrl =
    typeof message.currentUrl === "string" ? message.currentUrl.trim() : "";
  if (!currentUrl) {
    return null;
  }

  try {
    const tabs = await chrome.tabs.query({});
    const matchingTab = tabs.find((tab) => tab.url === currentUrl);
    return typeof matchingTab?.id === "number" ? matchingTab.id : null;
  } catch {
    return null;
  }
}

async function initializeProtectedBackgroundServices(
  source: string
): Promise<void> {
  if (protectedBackgroundServicesStarted) {
    return;
  }

  if (protectedBackgroundServicesInitPromise) {
    await protectedBackgroundServicesInitPromise;
    return;
  }

  protectedBackgroundServicesInitPromise = (async () => {
    const { settings } = await getSettings();
    if (!hasAcceptedCurrentTerms(settings.termsAcceptance)) {
      await backgroundLogger.info("protected_services_skipped_terms_required", {
        source,
      });
      return;
    }

    initializeCloudSyncEngine();
    await initializeMeetingSummaryQueue();
    protectedBackgroundServicesStarted = true;
    await backgroundLogger.info("protected_services_started", {
      source,
    });
  })();

  try {
    await protectedBackgroundServicesInitPromise;
  } finally {
    protectedBackgroundServicesInitPromise = null;
  }
}

async function stopProtectedBackgroundServices(
  source: string
): Promise<void> {
  protectedBackgroundServicesStarted = false;
  protectedBackgroundServicesInitPromise = null;
  await backgroundLogger.warn("protected_services_stopped", {
    source,
  });
  await Promise.all([
    shutdownCloudSyncForTermsRevocation(),
    shutdownMeetingSummaryQueueForTermsRevocation(),
  ]);
}

function shouldPromptTermsOnInstalled(
  reason: chrome.runtime.OnInstalledReason,
  acceptedCurrentTerms: boolean
): boolean {
  if (acceptedCurrentTerms) {
    return false;
  }

  return reason === "install" || reason === "update";
}

async function reconcileProtectedBackgroundServicesForTermsTransition(
  previousAcceptance: unknown,
  nextAcceptance: unknown
): Promise<void> {
  const previouslyAccepted = hasAcceptedCurrentTerms(
    previousAcceptance as Parameters<typeof hasAcceptedCurrentTerms>[0]
  );
  const acceptedNow = hasAcceptedCurrentTerms(
    nextAcceptance as Parameters<typeof hasAcceptedCurrentTerms>[0]
  );

  if (!previouslyAccepted && acceptedNow) {
    await initializeProtectedBackgroundServices("save-settings");
    return;
  }

  if (previouslyAccepted && !acceptedNow) {
    await stopProtectedBackgroundServices("terms-revoked");
  }
}

export default defineBackground(() => {
  void backgroundLogger.info("background_runtime_started");
  void backgroundLogger.debug("background_runtime_capabilities", {
    hasNotificationsOnClickedListener:
      typeof chrome.notifications?.onClicked?.addListener === "function",
    hasTabsOnRemovedListener:
      typeof chrome.tabs?.onRemoved?.addListener === "function",
  });
  void initializeDiagnosticsCollector()
    .then(() => syncDiagnosticsEnvironmentConfig())
    .catch((error) => {
      void backgroundLogger.error("diagnostics_startup_sync_failed", { error });
    });
  void initializeQuickAccessRuntimeRegistry();
  void initializeProtectedBackgroundServices("background-start");

  chrome.runtime.onStartup.addListener(() => {
    void backgroundLogger.info("background_on_startup");
    void initializeProtectedBackgroundServices("background-on-startup");
  });

  chrome.runtime.onInstalled.addListener((details) => {
    void (async () => {
      await backgroundLogger.info("background_on_installed", {
        reason: details.reason,
      });

      const { settings } = await getSettings();
      if (!shouldPromptTermsOnInstalled(
        details.reason,
        hasAcceptedCurrentTerms(settings.termsAcceptance)
      )) {
        return;
      }

      await chrome.tabs.create({
        url: getTermsOfServicePageUrl({
          mode: "accept",
          source: details.reason === "install" ? "install" : "update",
          returnTo: "close",
        }),
      });
    })().catch((error) => {
      void backgroundLogger.error("background_on_installed_failed", {
        reason: details.reason,
        error,
      });
    });
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    void backgroundLogger.debug("background_alarm_received", {
      name: alarm.name,
    });
    if (alarm.name === "meeting-summary-job-retry") {
      void (async () => {
        const { settings } = await getSettings();
        if (!hasAcceptedCurrentTerms(settings.termsAcceptance)) {
          await backgroundLogger.info("summary_retry_alarm_skipped_terms_required");
          return;
        }
        await handleMeetingSummaryRetryAlarm();
      })();
    }
  });

  if (chrome.tabs?.onRemoved?.addListener) {
    chrome.tabs.onRemoved.addListener((tabId) => {
      handleMeetingHistoryTabRemoved(tabId);
    });
  }

  if (chrome.notifications?.onClicked?.addListener) {
    void backgroundLogger.info("summary_ready_notification_click_listener_registered");
    chrome.notifications.onClicked.addListener((notificationId) => {
      void backgroundLogger.info("summary_ready_notification_click_listener_invoked", {
        notificationId,
      });
      void handleSummaryReadyNotificationClick(notificationId);
    });
  } else {
    void backgroundLogger.warn("summary_ready_notification_click_listener_unavailable", {
      hasNotificationsObject: Boolean(chrome.notifications),
      hasOnClickedObject: Boolean(chrome.notifications?.onClicked),
    });
  }

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
  const action = typeof message.action === "string" ? message.action : null;

  if (action === "saveSettings") {
    const safeBlockedSettingsWrite = isSafeBlockedSettingsWrite(message.settings);
    if (!safeBlockedSettingsWrite) {
      const { settings } = await getSettings();
      if (!hasAcceptedCurrentTerms(settings.termsAcceptance)) {
        return createTermsRequiredResponse("save-settings");
      }
    }
  } else if (action && !TERMS_GATE_ALLOWED_ACTIONS.has(action)) {
    const { settings } = await getSettings();
    if (!hasAcceptedCurrentTerms(settings.termsAcceptance)) {
      return createTermsRequiredResponse(action);
    }
  }

  switch (message.action) {
    case "getSettings":
      return getSettings();

    case "saveSettings":
      {
        const { settings: previousSettings } = await getSettings();
        const response = await saveSettings(
          message.settings as Parameters<typeof saveSettings>[0]
        );
        if (response?.success && response.settings) {
          await reconcileProtectedBackgroundServicesForTermsTransition(
            previousSettings.termsAcceptance,
            response.settings.termsAcceptance
          );
          await requeueAssistantSessionsAfterSettingsRecovery(
            previousSettings,
            response.settings
          );
        }
        return response;
      }

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
      {
        const { settings } = await getSettings();
        if (hasAcceptedCurrentTerms(settings.termsAcceptance)) {
          chrome.runtime.openOptionsPage();
        } else {
          await chrome.tabs.create({
            url: getTermsOfServicePageUrl({
              mode: "accept",
              source: "open-options",
              returnTo: "options",
            }),
          });
        }
      }
      return { success: true };

    case "openMeetingSessionDetails":
      {
        const sessionDetailsUrl = resolveMeetingSessionDetailUrl(message.sessionId);
        if (!sessionDetailsUrl) {
          await backgroundLogger.warn("open_meeting_session_details_invalid_session_id", {
            senderOrigin: sender?.origin || sender?.url || null,
          });
          return { success: false, error: "A valid session id is required." };
        }

        await backgroundLogger.info("open_meeting_session_details_requested", {
          senderOrigin: sender?.origin || sender?.url || null,
        });
        await chrome.tabs.create({ url: sessionDetailsUrl });
      }
      return { success: true };

    case "closeExtensionPageTab":
      {
        const tabId = await resolveExtensionPageTabIdForClose(message, sender);
        if (tabId !== null) {
          await chrome.tabs.remove(tabId);
          return { success: true };
        }
      }
      return { success: false, error: "No sender tab to close." };

    case "saveInstallTermsDeclineAndClosePage":
    case "saveTermsDeclineAndClosePage":
      {
        const { settings: previousSettings } = await getSettings();
        const response = await saveSettings({
          termsAcceptance: null,
          termsDecline:
            message.termsDecline as Parameters<typeof saveSettings>[0]["termsDecline"],
        });

        if (!response?.success) {
          return response;
        }

        await reconcileProtectedBackgroundServicesForTermsTransition(
          previousSettings.termsAcceptance,
          response.settings?.termsAcceptance
        );

        const tabId = await resolveExtensionPageTabIdForClose(message, sender);
        if (tabId !== null) {
          await chrome.tabs.remove(tabId);
          return { success: true, settings: response.settings };
        }

        return { success: true };
      }

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
        message.updates as Parameters<typeof updateMeetingSession>[1],
        {
          senderTabId: sender.tab?.id ?? null,
          senderUrl: sender.url ?? null,
          senderOrigin: sender.origin ?? null,
        }
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

    case "updateMeetingHistoryViewState":
      return updateMeetingHistoryViewState(
        message as Parameters<typeof updateMeetingHistoryViewState>[0],
        sender
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

    case "requestQuickAccessSoftRefresh":
      return requestQuickAccessSoftRefresh();

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

    case "debugHandleSummaryReadyNotificationClick":
      if (detectAppEnvironment() !== "development") {
        return {
          success: false,
          error: "This diagnostics action is only available in development.",
        };
      }

      return debugHandleSummaryReadyNotificationClick({
        notificationId:
          typeof message.notificationId === "string"
            ? message.notificationId
            : null,
        sessionId:
          typeof message.sessionId === "string" ? message.sessionId : null,
        summaryKey:
          typeof message.summaryKey === "string" ? message.summaryKey : null,
      });

    default:
      await backgroundLogger.warn("message_unknown_action", {
        action: typeof message.action === "string" ? message.action : null,
      });
      return { success: false, error: "Unknown action" };
  }
}

export const backgroundTermsGateInternals = {
  shouldPromptTermsOnInstalled,
};
