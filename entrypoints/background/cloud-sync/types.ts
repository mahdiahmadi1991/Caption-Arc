import type { CloudSyncProvider, SharedSettings } from "../types";

export type CloudSyncTaskKind =
  | "sync-shared-settings"
  | "sync-device-profile"
  | "sync-session-meta"
  | "sync-session-events"
  | "delete-session"
  | "clear-archive"
  | "reconcile-provider";

export type CloudSyncErrorKind =
  | "transient"
  | "action-required"
  | "needs-attention"
  | "unknown";

export type CloudSyncProviderHealthState =
  | "disconnected"
  | "syncing"
  | "up-to-date"
  | "retrying-automatically"
  | "needs-attention"
  | "action-required";

export type CloudSyncFileRecord = {
  path: string;
  versionToken: string;
  updatedAt: number;
  size: number;
};

export type CloudSyncTask = {
  id: string;
  dedupeKey: string;
  kind: CloudSyncTaskKind;
  entityId?: string;
  contentHash?: string;
  providerTargets: CloudSyncProvider[] | null;
  createdAt: number;
  updatedAt: number;
  nextAttemptAt: number;
  attemptCount: number;
  transientRetryCount: number;
  lastError?: string;
  lastErrorKind?: CloudSyncErrorKind;
};

export type CloudSyncTaskInput = Pick<
  CloudSyncTask,
  "dedupeKey" | "kind" | "providerTargets"
> & {
  entityId?: string;
  contentHash?: string;
};

export type CloudSyncProviderCheckpoint = {
  provider: CloudSyncProvider;
  supported?: boolean;
  unsupportedReason?: string;
  connected: boolean;
  accountId?: string;
  accountLabel?: string;
  connectedAt?: number;
  lastScanAt?: number;
  lastAppliedRemoteChangeAt?: number;
  lastUploadedLocalChangeAt?: number;
  lastSuccessfulSyncAt?: number;
  healthState: CloudSyncProviderHealthState;
  manualRetryAvailable?: boolean;
  lastError?: string;
  lastErrorKind?: CloudSyncErrorKind;
};

export type CloudSyncDiagnosticEvent = {
  id: string;
  timestamp: number;
  level: "info" | "warning" | "error";
  message: string;
  provider?: CloudSyncProvider;
};

export type CloudSyncEngineState = {
  running: boolean;
  lastRunAt?: number;
  lastCompletedRunAt?: number;
  lastRunReason?: string;
  scheduledAt?: number;
};

export type CloudSyncPendingSettingsDecision = {
  provider: CloudSyncProvider;
  detectedAt: number;
  localSettings: SharedSettings;
  remoteSettings: SharedSettings;
};

export type CloudSyncState = {
  queueSize: number;
  dueTaskCount: number;
  engine: CloudSyncEngineState;
  checkpoints: CloudSyncProviderCheckpoint[];
  diagnostics: CloudSyncDiagnosticEvent[];
  pendingSettingsDecision: CloudSyncPendingSettingsDecision | null;
};

export type CloudSyncTaskProcessingResult =
  | {
      success: true;
      checkpointUpdates?: Partial<
        Pick<
          CloudSyncProviderCheckpoint,
          "lastAppliedRemoteChangeAt" | "lastUploadedLocalChangeAt"
        >
      >;
    }
  | {
      success: false;
      errorKind: CloudSyncErrorKind;
      message: string;
      retryable: boolean;
    };