import type {
  CloudSyncProviderCheckpoint,
  CloudSyncProviderHealthState,
} from "../background/cloud-sync/types";
import type { CloudSyncProvider } from "../background/types";
import type { UiTranslator } from "../shared/i18n";

export type CloudSyncStatusTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger";

export type CloudSyncStatusMotion = "none" | "pulse" | "processing";

export type CloudSyncMutationSnapshot = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  detail?: string;
  provider?: CloudSyncProvider;
  intent?: "connect" | "disconnect" | "retry" | "reconnect" | "refresh" | "resolve-choice";
};

export type CloudSyncProviderDetail = {
  id: CloudSyncProvider;
  title: string;
  subtitle: string;
};

export type CloudSyncProviderCardModel = {
  provider: CloudSyncProvider;
  title: string;
  subtitle: string;
  checkpoint?: CloudSyncProviderCheckpoint;
  health: {
    label: string;
    tone: CloudSyncStatusTone;
    motion: CloudSyncStatusMotion;
  };
  connection: { title: string; description: string };
  sync: { title: string; description: string };
  statusMessage: string;
  statusDetail?: string;
  isBusy: boolean;
  canRetry: boolean;
  needsReconnect: boolean;
  canRemoveUnsupportedProvider: boolean;
  providerSupported: boolean;
  busyLabel?: string;
  busyIntent?: CloudSyncMutationSnapshot["intent"];
};

function getProviderBusyLabel(
  mutationState: CloudSyncMutationSnapshot,
  t: UiTranslator
): string | undefined {
  if (mutationState.status !== "loading") {
    return undefined;
  }

  switch (mutationState.intent) {
    case "connect":
      return t("options.cloudSync.actions.connect");
    case "disconnect":
      return t("options.cloudSync.actions.disconnect");
    case "retry":
      return t("options.cloudSync.actions.retryNow");
    case "reconnect":
      return t("options.cloudSync.actions.reconnect");
    default:
      return undefined;
  }
}

export function getCloudSyncProviderDetails(
  t: UiTranslator
): readonly CloudSyncProviderDetail[] {
  return [
    {
      id: "google-drive",
      title: t("options.cloudSync.providers.googleDrive.title"),
      subtitle: t("options.cloudSync.providers.googleDrive.subtitle"),
    },
    {
      id: "onedrive",
      title: t("options.cloudSync.providers.oneDrive.title"),
      subtitle: t("options.cloudSync.providers.oneDrive.subtitle"),
    },
  ] as const;
}

export function getCloudSyncScopeShared(t: UiTranslator): string[] {
  return [
    t("options.cloudSync.scope.shared.meetingSessions"),
    t("options.cloudSync.scope.shared.translations"),
    t("options.cloudSync.scope.shared.summaries"),
    t("options.cloudSync.scope.shared.meetingProfiles"),
    t("options.cloudSync.scope.shared.sharedSettings"),
  ];
}

export function getCloudSyncScopeLocal(t: UiTranslator): string[] {
  return [
    t("options.cloudSync.scope.local.apiKeys"),
    t("options.cloudSync.scope.local.verificationStatus"),
    t("options.cloudSync.scope.local.deviceIdentity"),
  ];
}

export function formatCloudSyncTimestampLabel(
  value: number | undefined,
  t: UiTranslator
): string {
  if (!value) {
    return t("options.cloudSync.sync.notYet");
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function getCloudSyncProviderCheckpoint(
  checkpoints: CloudSyncProviderCheckpoint[],
  provider: CloudSyncProvider
): CloudSyncProviderCheckpoint | undefined {
  return checkpoints.find((checkpoint) => checkpoint.provider === provider);
}

export function getCloudSyncHealthMeta(
  healthState: CloudSyncProviderHealthState | undefined,
  t: UiTranslator
): {
  label: string;
  tone: CloudSyncStatusTone;
  motion: CloudSyncStatusMotion;
} {
  switch (healthState) {
    case "syncing":
      return {
        label: t("options.cloudSync.health.syncing"),
        tone: "accent",
        motion: "processing",
      };
    case "up-to-date":
      return {
        label: t("options.cloudSync.health.upToDate"),
        tone: "success",
        motion: "none",
      };
    case "retrying-automatically":
      return {
        label: t("options.cloudSync.health.retryingAutomatically"),
        tone: "warning",
        motion: "pulse",
      };
    case "needs-attention":
      return {
        label: t("options.cloudSync.health.needsAttention"),
        tone: "warning",
        motion: "none",
      };
    case "action-required":
      return {
        label: t("options.cloudSync.health.actionRequired"),
        tone: "danger",
        motion: "none",
      };
    default:
      return {
        label: t("options.cloudSync.health.off"),
        tone: "neutral",
        motion: "none",
      };
  }
}

export function getCloudSyncOverviewMeta(
  checkpoints: CloudSyncProviderCheckpoint[],
  isLoading: boolean,
  t: UiTranslator,
  queueState?: {
    queueSize: number;
    dueTaskCount: number;
  }
): { label: string; tone: CloudSyncStatusTone; description: string } {
  if (isLoading) {
    return {
      label: t("common.actions.loading"),
      tone: "neutral",
      description: t("options.cloudSync.overview.loadingDescription"),
    };
  }

  const connectedCheckpoints = checkpoints.filter(
    (checkpoint) => checkpoint.connected
  );
  if (connectedCheckpoints.length === 0) {
    if ((queueState?.queueSize || 0) > 0 || (queueState?.dueTaskCount || 0) > 0) {
      return {
        label: t("options.cloudSync.connection.notConnectedTitle"),
        tone: "neutral",
        description: t("options.runtime.cloudSync.idleDisconnected"),
      };
    }

    return {
      label: t("options.cloudSync.connection.notConnectedTitle"),
      tone: "neutral",
      description: t("options.runtime.cloudSync.idleDisconnected"),
    };
  }

  if (
    connectedCheckpoints.some(
      (checkpoint) =>
        checkpoint.healthState === "needs-attention" ||
        checkpoint.healthState === "action-required"
    )
  ) {
    return {
      label: t("options.cloudSync.health.needsAttention"),
      tone: "warning",
      description: t("options.cloudSync.overview.needsAttentionDescription"),
    };
  }

  if (
    connectedCheckpoints.some(
      (checkpoint) =>
        checkpoint.healthState === "syncing" ||
        checkpoint.healthState === "retrying-automatically"
    )
  ) {
    return {
      label: t("options.cloudSync.health.syncing"),
      tone: "accent",
      description: t("options.cloudSync.overview.syncingDescription"),
    };
  }

  return {
    label: t("options.cloudSync.health.upToDate"),
    tone: "success",
    description: t("options.cloudSync.overview.upToDateDescription"),
  };
}

export function getCloudSyncConnectionMeta(
  checkpoint: CloudSyncProviderCheckpoint | undefined,
  t: UiTranslator
): { title: string; description: string } {
  if (!checkpoint?.connected) {
    return {
      title: t("options.cloudSync.connection.notConnectedTitle"),
      description: t("options.cloudSync.connection.notConnectedDescription"),
    };
  }

  return {
    title:
      checkpoint.accountLabel || t("options.cloudSync.connection.connectedTitle"),
    description: checkpoint.connectedAt
      ? t("options.cloudSync.connection.connectedAt", {
          time: formatCloudSyncTimestampLabel(checkpoint.connectedAt, t),
        })
      : t("options.cloudSync.connection.connectedTitle"),
  };
}

export function getCloudSyncSyncMeta(
  checkpoint: CloudSyncProviderCheckpoint | undefined,
  t: UiTranslator
): { title: string; description: string } {
  return {
    title: formatCloudSyncTimestampLabel(checkpoint?.lastSuccessfulSyncAt, t),
    description: checkpoint?.lastScanAt
      ? t("options.cloudSync.sync.scannedAt", {
          time: formatCloudSyncTimestampLabel(checkpoint.lastScanAt, t),
        })
      : t("options.cloudSync.sync.noScanRecorded"),
  };
}

export function getCloudSyncStatusMessage(
  checkpoint: CloudSyncProviderCheckpoint | undefined,
  t: UiTranslator
): string {
  if (checkpoint?.lastError) {
    return checkpoint.lastError;
  }

  if (!checkpoint?.connected) {
    return t("options.cloudSync.statusMessage.disconnected");
  }

  if (checkpoint.manualRetryAvailable) {
    return t("options.cloudSync.statusMessage.manualRetryAvailable");
  }

  switch (checkpoint.healthState) {
    case "syncing":
      return t("options.cloudSync.statusMessage.syncing");
    case "retrying-automatically":
      return t("options.cloudSync.statusMessage.retryingAutomatically");
    case "needs-attention":
      return t("options.cloudSync.statusMessage.needsAttention");
    case "action-required":
      return t("options.cloudSync.statusMessage.actionRequired");
    case "up-to-date":
      return t("options.cloudSync.statusMessage.upToDate");
    default:
      return checkpoint.connected
        ? t("options.cloudSync.statusMessage.connectedWaiting")
        : t("options.cloudSync.health.off");
  }
}

export function buildCloudSyncProviderCardModels({
  checkpoints,
  providerDetails,
  mutationState,
  settingsConnectedCloudProviders,
  t,
}: {
  checkpoints: CloudSyncProviderCheckpoint[];
  providerDetails: readonly CloudSyncProviderDetail[];
  mutationState: CloudSyncMutationSnapshot;
  settingsConnectedCloudProviders: CloudSyncProvider[];
  t: UiTranslator;
}): CloudSyncProviderCardModel[] {
  return providerDetails.map((providerDetail) => {
    const checkpoint = getCloudSyncProviderCheckpoint(
      checkpoints,
      providerDetail.id
    );
    const health = getCloudSyncHealthMeta(checkpoint?.healthState, t);
    const connection = getCloudSyncConnectionMeta(checkpoint, t);
    const sync = getCloudSyncSyncMeta(checkpoint, t);
    const providerSupported = checkpoint?.supported !== false;

    return {
      provider: providerDetail.id,
      title: providerDetail.title,
      subtitle: providerDetail.subtitle,
      checkpoint,
      health,
      connection,
      sync,
      statusMessage:
        mutationState.status !== "idle" && mutationState.provider === providerDetail.id
          ? mutationState.message
          : getCloudSyncStatusMessage(checkpoint, t),
      statusDetail:
        mutationState.provider === providerDetail.id ? mutationState.detail : undefined,
      isBusy:
        mutationState.status === "loading" &&
        mutationState.provider === providerDetail.id,
      canRetry: Boolean(
        checkpoint?.connected && checkpoint.manualRetryAvailable
      ),
      needsReconnect: Boolean(
        checkpoint?.connected &&
          providerSupported &&
          !checkpoint.manualRetryAvailable &&
          (checkpoint.healthState === "action-required" ||
            checkpoint.healthState === "needs-attention")
      ),
      canRemoveUnsupportedProvider: Boolean(
        !providerSupported &&
          settingsConnectedCloudProviders.includes(providerDetail.id)
      ),
      providerSupported,
      busyLabel:
        mutationState.provider === providerDetail.id
          ? getProviderBusyLabel(mutationState, t)
          : undefined,
      busyIntent:
        mutationState.provider === providerDetail.id
          ? mutationState.intent
          : undefined,
    };
  });
}
