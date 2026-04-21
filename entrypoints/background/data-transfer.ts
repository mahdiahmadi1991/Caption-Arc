import type {
  AppDataBundle,
  ExportAppDataResponse,
  ImportAppDataResponse,
  PortableSettings,
  PortableMeetingSession,
  Settings,
  StoredMeetingSession,
} from "./types";
import { normalizeMeetingSession } from "../shared/meeting-session";
import { getSettings, saveSettings } from "./settings";
import {
  listStoredMeetingSessionRecords,
  replaceStoredMeetingSessionRecords,
} from "./history-db";
import { createBackgroundDiagnosticsLogger } from "./diagnostics";

const APP_DATA_BUNDLE_KIND = "captionarc-data-bundle";
const APP_DATA_BUNDLE_VERSION = 1 as const;

const dataTransferDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "storage",
  feature: "data-transfer",
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePortableSettingsInput(input: unknown): PortableSettings {
  if (!isRecord(input)) {
    throw new Error("The data bundle settings payload is invalid.");
  }

  const settings = input as Settings;

  return {
    model: settings.model,
    targetLanguage: settings.targetLanguage,
    translationEnabled: settings.translationEnabled,
    customPrompt: settings.customPrompt,
    meetingOutputLanguage: settings.meetingOutputLanguage || "en",
    meetingArchiveRetentionDays: settings.meetingArchiveRetentionDays,
    meetingProfiles: settings.meetingProfiles || [],
    defaultMeetingProfileId: settings.defaultMeetingProfileId || "",
    appearance: settings.appearance,
    overlayVisible: settings.overlayVisible,
    captureStartupBehavior: settings.captureStartupBehavior,
    captionActivationBehavior: settings.captionActivationBehavior,
    sessionContinuationWindowMinutes: settings.sessionContinuationWindowMinutes,
    overlayOpacity: settings.overlayOpacity,
    overlayClickThrough: settings.overlayClickThrough,
    storeMeetingChat: settings.storeMeetingChat,
    legalRiskAcknowledgements: { ...settings.legalRiskAcknowledgements },
  };
}

function createPortableSettings(settings: Settings): PortableSettings {
  return {
    model: settings.model,
    targetLanguage: settings.targetLanguage,
    translationEnabled: settings.translationEnabled,
    customPrompt: settings.customPrompt,
    meetingOutputLanguage: settings.meetingOutputLanguage,
    meetingArchiveRetentionDays: settings.meetingArchiveRetentionDays,
    meetingProfiles: settings.meetingProfiles.map((profile) => ({
      ...profile,
      assistant: { ...profile.assistant },
    })),
    defaultMeetingProfileId: settings.defaultMeetingProfileId,
    appearance: settings.appearance,
    overlayVisible: settings.overlayVisible,
    captureStartupBehavior: settings.captureStartupBehavior,
    captionActivationBehavior: settings.captionActivationBehavior,
    sessionContinuationWindowMinutes: settings.sessionContinuationWindowMinutes,
    overlayOpacity: settings.overlayOpacity,
    overlayClickThrough: settings.overlayClickThrough,
    storeMeetingChat: settings.storeMeetingChat,
    legalRiskAcknowledgements: { ...settings.legalRiskAcknowledgements },
  };
}

function createPortableSession(session: StoredMeetingSession): PortableMeetingSession {
  const normalized = normalizeMeetingSession(session);
  const {
    captions: _captions,
    chatMessages: _chatMessages,
    derived: _derived,
    searchableText: _searchableText,
    summaries: _summaries,
    ...portable
  } = normalized;

  return {
    ...portable,
    artifacts: portable.artifacts
      ? {
          ...portable.artifacts,
          assistantOutputs: portable.artifacts.assistantOutputs
            ? Object.fromEntries(
                Object.entries(portable.artifacts.assistantOutputs).map(
                  ([key, output]) => [key, { ...output }]
                )
              )
            : undefined,
          assistantMemory: portable.artifacts.assistantMemory
            ? { ...portable.artifacts.assistantMemory }
            : undefined,
          assistantState: portable.artifacts.assistantState
            ? {
                enabled: portable.artifacts.assistantState.enabled,
                updatedAt: portable.artifacts.assistantState.updatedAt,
              }
            : undefined,
          summaries: portable.artifacts.summaries
            ? { ...portable.artifacts.summaries }
            : undefined,
        }
      : undefined,
    events: (portable.events || []).map((event) => ({
      ...event,
      metadata: event.metadata ? { ...event.metadata } : undefined,
    })),
  };
}

function createAppDataBundle(
  settings: Settings,
  sessions: StoredMeetingSession[],
  exportedAt = Date.now()
): AppDataBundle {
  return {
    bundleVersion: APP_DATA_BUNDLE_VERSION,
    manifest: {
      kind: APP_DATA_BUNDLE_KIND,
      bundleVersion: APP_DATA_BUNDLE_VERSION,
      exportedAt,
      sessionCount: sessions.length,
    },
    settings: createPortableSettings(settings),
    sessions: sessions.map((session) => createPortableSession(session)),
  };
}

function normalizeAppDataBundle(input: unknown): AppDataBundle {
  if (!isRecord(input)) {
    throw new Error("The imported file is not a valid data bundle.");
  }

  if (input.bundleVersion !== APP_DATA_BUNDLE_VERSION) {
    throw new Error("Unsupported data bundle version.");
  }

  if (!isRecord(input.manifest) || input.manifest.kind !== APP_DATA_BUNDLE_KIND) {
    throw new Error("The imported file is not a CaptionArc data bundle.");
  }

  if (!isRecord(input.settings)) {
    throw new Error("The data bundle settings payload is missing.");
  }

  if (!Array.isArray(input.sessions)) {
    throw new Error("The data bundle does not contain a session list.");
  }

  const settings = normalizePortableSettingsInput(input.settings);
  const sessions = input.sessions.map((session) =>
    normalizeMeetingSession(session as StoredMeetingSession)
  );
  const exportedAt =
    typeof input.manifest.exportedAt === "number"
      ? input.manifest.exportedAt
      : Date.now();

  return createAppDataBundle(settings, sessions, exportedAt);
}

export async function exportAppDataBundle(): Promise<ExportAppDataResponse> {
  try {
    await dataTransferDiagnostics.info("app_data_export_started");
    const [{ settings }, sessions] = await Promise.all([
      getSettings(),
      listStoredMeetingSessionRecords(),
    ]);

    await dataTransferDiagnostics.info("app_data_export_completed", {
      sessionCount: sessions.length,
      connectedCloudProviders: settings.connectedCloudProviders.length,
    });

    return {
      success: true,
      data: createAppDataBundle(settings, sessions),
    };
  } catch (error) {
    await dataTransferDiagnostics.error("app_data_export_failed", {
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function importAppDataBundle(
  bundle: unknown
): Promise<ImportAppDataResponse> {
  try {
    await dataTransferDiagnostics.info("app_data_import_started");
    const normalizedBundle = normalizeAppDataBundle(bundle);
    const { settings: previousSettings } = await getSettings();

    await dataTransferDiagnostics.debug("app_data_import_normalized", {
      sessionCount: normalizedBundle.sessions.length,
      exportedAt: normalizedBundle.manifest.exportedAt,
    });

    try {
      await saveSettings(normalizedBundle.settings);
      await replaceStoredMeetingSessionRecords(
        normalizedBundle.sessions as StoredMeetingSession[]
      );
    } catch (error) {
      await dataTransferDiagnostics.warn("app_data_import_apply_failed", {
        error,
        sessionCount: normalizedBundle.sessions.length,
      });
      try {
        await saveSettings(previousSettings);
      } catch (rollbackError) {
        await dataTransferDiagnostics.error("app_data_import_rollback_failed", {
          error,
          rollbackError,
        });
        throw new Error(
          `Data import failed and the previous settings could not be restored. Original error: ${
            error instanceof Error ? error.message : String(error)
          }. Rollback error: ${
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError)
          }`
        );
      }
      throw error;
    }

    await dataTransferDiagnostics.info("app_data_import_completed", {
      importedSessionCount: normalizedBundle.sessions.length,
    });

    return {
      success: true,
      importedSessionCount: normalizedBundle.sessions.length,
    };
  } catch (error) {
    await dataTransferDiagnostics.error("app_data_import_failed", {
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
