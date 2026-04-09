import type { MeetingSession } from "../../shared/meeting-session";
import type { CloudSyncProvider, Settings } from "../types";
import {
  getCloudSyncStateSnapshot,
  queueCloudSyncReconciliation,
  runCloudSyncNow,
  scheduleCloudSyncRun,
  syncCheckpointConnections,
} from "./engine";
import {
  clearCloudSyncPendingSettingsDecision,
  getCloudSyncPendingSettingsDecision,
  upsertCloudSyncCheckpoint,
} from "./checkpoints";
import {
  enqueueCloudSyncTask,
  listCloudSyncTasks,
  updateCloudSyncTask,
} from "./outbox";
import {
  connectCloudSyncProviderAdapter,
  disconnectCloudSyncProviderAdapter,
} from "./providers";
import { filterSupportedCloudSyncProviders } from "../../shared/browser-capabilities";
import { createBackgroundDiagnosticsLogger } from "../diagnostics";

const cloudSyncDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "cloud-sync",
  feature: "orchestration",
});

function buildProviderTargets(
  connectedProviders: CloudSyncProvider[]
): CloudSyncProvider[] | null {
  const supportedProviders = filterSupportedCloudSyncProviders(connectedProviders);
  return supportedProviders.length > 0 ? [...supportedProviders] : null;
}

export function initializeCloudSyncEngine(): void {
  void (async () => {
    await cloudSyncDiagnostics.info("cloud_sync_initialize_started");
    const settingsModule = await import("../settings");
    const { settings } = await settingsModule.getSettings();
    await syncCheckpointConnections(settings.connectedCloudProviders);
    await queueCloudSyncReconciliation(settings.connectedCloudProviders);
    scheduleCloudSyncRun("background-start", 5_000);
    await cloudSyncDiagnostics.info("cloud_sync_initialize_completed", {
      connectedProviders: settings.connectedCloudProviders,
    });
  })().catch((error) => {
    void cloudSyncDiagnostics.error("cloud_sync_initialize_failed", {
      error,
    });
  });
}

export async function noteCloudSyncSettingsSaved(settings: Settings): Promise<void> {
  const providerTargets = buildProviderTargets(settings.connectedCloudProviders);
  await cloudSyncDiagnostics.debug("cloud_sync_settings_saved", {
    connectedProviders: settings.connectedCloudProviders,
    providerTargetCount: providerTargets?.length || 0,
  });
  await syncCheckpointConnections(settings.connectedCloudProviders);
  await enqueueCloudSyncTask({
    dedupeKey: "shared-settings",
    kind: "sync-shared-settings",
    entityId: "shared-settings",
    contentHash: JSON.stringify({
      model: settings.model,
      targetLanguage: settings.targetLanguage,
      summaryLanguage: settings.summaryLanguage,
      appearance: settings.appearance,
      connectedCloudProviders: settings.connectedCloudProviders,
    }),
    providerTargets,
  });
  await enqueueCloudSyncTask({
    dedupeKey: `device-profile:${settings.deviceId}`,
    kind: "sync-device-profile",
    entityId: settings.deviceId,
    contentHash: JSON.stringify({
      deviceId: settings.deviceId,
      deviceLabel: settings.deviceLabel,
      connectedCloudProviders: settings.connectedCloudProviders,
    }),
    providerTargets,
  });
  scheduleCloudSyncRun("settings-saved", 1_000);
}

export async function noteMeetingSessionSaved(
  session: MeetingSession,
  connectedProviders: CloudSyncProvider[]
): Promise<void> {
  const providerTargets = buildProviderTargets(connectedProviders);
  const sessionSyncId = session.sessionSyncId || session.id;
  await cloudSyncDiagnostics.trace("cloud_sync_session_saved", {
    sessionId: session.id,
    sessionSyncId,
    providerTargets,
    eventCount: (session.events || []).length,
  }, {
    sessionId: session.id,
  });
  await enqueueCloudSyncTask({
    dedupeKey: `session-meta:${sessionSyncId}`,
    kind: "sync-session-meta",
    entityId: sessionSyncId,
    contentHash: session.syncContentHash,
    providerTargets,
  });
  await enqueueCloudSyncTask({
    dedupeKey: `session-events:${sessionSyncId}`,
    kind: "sync-session-events",
    entityId: sessionSyncId,
    contentHash: `${session.syncContentHash || ""}:${(session.events || []).length}`,
    providerTargets,
  });
  scheduleCloudSyncRun("meeting-session-saved", 2_000);
}

export async function noteMeetingSessionDeleted(
  sessionId: string,
  connectedProviders: CloudSyncProvider[]
): Promise<void> {
  await cloudSyncDiagnostics.info("cloud_sync_session_deleted", {
    sessionId,
    connectedProviders,
  }, {
    sessionId,
  });
  await enqueueCloudSyncTask({
    dedupeKey: `delete-session:${sessionId}`,
    kind: "delete-session",
    entityId: sessionId,
    providerTargets: buildProviderTargets(connectedProviders),
  });
  scheduleCloudSyncRun("meeting-session-deleted", 1_000);
}

export async function noteMeetingArchiveCleared(
  connectedProviders: CloudSyncProvider[]
): Promise<void> {
  await cloudSyncDiagnostics.warn("cloud_sync_archive_cleared", {
    connectedProviders,
  });
  await enqueueCloudSyncTask({
    dedupeKey: "clear-archive",
    kind: "clear-archive",
    entityId: "vault",
    providerTargets: buildProviderTargets(connectedProviders),
  });
  scheduleCloudSyncRun("meeting-archive-cleared", 500);
}

export async function getCloudSyncState(): Promise<{
  success: boolean;
  state: Awaited<ReturnType<typeof getCloudSyncStateSnapshot>>;
}> {
  return {
    success: true,
    state: await getCloudSyncStateSnapshot(),
  };
}

export async function resolveCloudSyncSettingsChoice(
  choice: "keep-local" | "use-cloud"
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudSyncDiagnostics.info("cloud_sync_settings_choice_started", {
      choice,
    });
    const pendingDecision = await getCloudSyncPendingSettingsDecision();
    if (!pendingDecision) {
      await cloudSyncDiagnostics.warn("cloud_sync_settings_choice_missing_pending", {
        choice,
      });
      return { success: false, error: "No pending cloud settings decision exists." };
    }

    const settingsModule = await import("../settings");
    await settingsModule.saveSettings(
      choice === "use-cloud"
        ? pendingDecision.remoteSettings
        : pendingDecision.localSettings
    );

    await clearCloudSyncPendingSettingsDecision();

    const { settings } = await settingsModule.getSettings();
    await queueCloudSyncReconciliation(settings.connectedCloudProviders);
    await runCloudSyncNow(`resolve-settings-choice:${choice}`);

    await cloudSyncDiagnostics.info("cloud_sync_settings_choice_completed", {
      choice,
      connectedProviders: settings.connectedCloudProviders,
    });

    return { success: true };
  } catch (error) {
    await cloudSyncDiagnostics.error("cloud_sync_settings_choice_failed", {
      choice,
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function retryCloudSync(provider?: CloudSyncProvider): Promise<{
  success: boolean;
}> {
  const settingsModule = await import("../settings");
  const { settings } = await settingsModule.getSettings();
  const providers = provider
    ? filterSupportedCloudSyncProviders([provider])
    : filterSupportedCloudSyncProviders(settings.connectedCloudProviders);

  await cloudSyncDiagnostics.info("cloud_sync_retry_started", {
    provider: provider || null,
    providers,
  });

  const existingTasks = await listCloudSyncTasks();
  await Promise.all(
    existingTasks
      .filter((task) => {
        if (!provider) {
          return true;
        }

        return task.providerTargets === null || task.providerTargets.includes(provider);
      })
      .map((task) =>
        updateCloudSyncTask({
          ...task,
          nextAttemptAt: Date.now(),
          transientRetryCount: 0,
          lastError: undefined,
          lastErrorKind: undefined,
          updatedAt: Date.now(),
        })
      )
  );

  await queueCloudSyncReconciliation(providers);
  await runCloudSyncNow(provider ? `retry:${provider}` : "retry:all");
  await cloudSyncDiagnostics.info("cloud_sync_retry_completed", {
    provider: provider || null,
    providers,
    taskCount: existingTasks.length,
  });
  return { success: true };
}

export async function connectCloudSyncProvider(provider: CloudSyncProvider): Promise<{
  success: boolean;
  checkpoint?: Awaited<ReturnType<typeof connectCloudSyncProviderAdapter>>;
  error?: string;
}> {
  try {
    await cloudSyncDiagnostics.info("cloud_sync_connect_started", {
      provider,
    }, {
      provider,
    });
    const checkpoint = await connectCloudSyncProviderAdapter(provider);
    await upsertCloudSyncCheckpoint(checkpoint);

    if (checkpoint.supported === false) {
      await cloudSyncDiagnostics.warn("cloud_sync_connect_blocked_unsupported_browser", {
        provider,
        reason: checkpoint.unsupportedReason || checkpoint.lastError || null,
      }, {
        provider,
      });

      return {
        success: false,
        checkpoint,
        error:
          checkpoint.unsupportedReason ||
          checkpoint.lastError ||
          "This cloud provider is not available on this browser.",
      };
    }

    const settingsModule = await import("../settings");
    const { settings } = await settingsModule.getSettings();
    if (!settings.connectedCloudProviders.includes(provider)) {
      await settingsModule.saveSettings({
        connectedCloudProviders: [...settings.connectedCloudProviders, provider],
      });
    }

    await queueCloudSyncReconciliation([provider]);
    await runCloudSyncNow(`connect:${provider}`);
    await cloudSyncDiagnostics.info("cloud_sync_connect_completed", {
      provider,
      connected: checkpoint.connected,
      healthState: checkpoint.healthState,
    }, {
      provider,
    });
    return { success: true, checkpoint };
  } catch (error) {
    await cloudSyncDiagnostics.error("cloud_sync_connect_failed", {
      provider,
      error,
    }, {
      provider,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function disconnectCloudSyncProvider(provider: CloudSyncProvider): Promise<{
  success: boolean;
  checkpoint?: Awaited<ReturnType<typeof disconnectCloudSyncProviderAdapter>>;
  error?: string;
}> {
  try {
    await cloudSyncDiagnostics.info("cloud_sync_disconnect_started", {
      provider,
    }, {
      provider,
    });
    const checkpoint = await disconnectCloudSyncProviderAdapter(provider);
    await upsertCloudSyncCheckpoint(checkpoint);

    const settingsModule = await import("../settings");
    const { settings } = await settingsModule.getSettings();
    if (settings.connectedCloudProviders.includes(provider)) {
      await settingsModule.saveSettings({
        connectedCloudProviders: settings.connectedCloudProviders.filter(
          (current) => current !== provider
        ),
      });
    }

    await cloudSyncDiagnostics.info("cloud_sync_disconnect_completed", {
      provider,
      connected: checkpoint.connected,
      healthState: checkpoint.healthState,
    }, {
      provider,
    });
    return { success: true, checkpoint };
  } catch (error) {
    await cloudSyncDiagnostics.error("cloud_sync_disconnect_failed", {
      provider,
      error,
    }, {
      provider,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
