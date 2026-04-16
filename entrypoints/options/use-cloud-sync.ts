import { startTransition, useEffect, useRef, useState } from "react";
import type { CloudSyncState } from "../background/cloud-sync/types";
import type { CloudSyncProvider } from "../background/types";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import { useT } from "../shared/i18n";

type CloudSyncMutationIntent =
  | "connect"
  | "disconnect"
  | "retry"
  | "reconnect"
  | "refresh"
  | "resolve-choice";

type CloudSyncMutationState = {
  status: "idle" | "loading" | "success" | "error";
  intent?: CloudSyncMutationIntent;
  provider?: CloudSyncProvider;
  message: string;
  detail?: string;
};

type Props = {
  onSettingsChanged?: () => Promise<void> | void;
};

const CLOUD_SYNC_POLL_INTERVAL_MS = 15_000;
const CLOUD_SYNC_SUCCESS_STATE_TTL_MS = 4_000;

const EMPTY_CLOUD_SYNC_STATE: CloudSyncState = {
  queueSize: 0,
  dueTaskCount: 0,
  engine: { running: false },
  checkpoints: [],
  diagnostics: [],
  pendingSettingsDecision: null,
};

const optionsCloudSyncDiagnostics = createDiagnosticsLogger({
  runtime: "options",
  domain: "cloud-sync",
  feature: "options-cloud-sync",
});

function deriveIdleMessage(
  state: CloudSyncState,
  t: ReturnType<typeof useT>
): string {
  if (state.pendingSettingsDecision) {
    return t("options.cloudSync.pendingChoice.description");
  }

  const connectedCheckpoints = state.checkpoints.filter(
    (checkpoint) => checkpoint.connected
  );

  if (connectedCheckpoints.length === 0) {
    return t("options.runtime.cloudSync.idleDisconnected");
  }

  if (state.engine.running || state.dueTaskCount > 0) {
    return t("options.cloudSync.overview.syncingDescription");
  }

  if (
    connectedCheckpoints.some(
      (checkpoint) =>
        checkpoint.healthState === "action-required" ||
        checkpoint.healthState === "needs-attention" ||
        checkpoint.healthState === "retrying-automatically"
    )
  ) {
    return t("options.cloudSync.overview.needsAttentionDescription");
  }

  return t("options.runtime.cloudSync.idleConnected");
}

function getCloudSyncProviderLabel(
  provider: CloudSyncProvider | undefined,
  t: ReturnType<typeof useT>
): string {
  if (provider === "google-drive") {
    return t("options.cloudSync.providers.googleDrive.title");
  }

  if (provider === "onedrive") {
    return t("options.cloudSync.providers.oneDrive.title");
  }

  return t("options.sections.cloudSync.title");
}

function getLoadingFeedback(
  intent: CloudSyncMutationIntent,
  provider: CloudSyncProvider | undefined,
  t: ReturnType<typeof useT>
): Pick<CloudSyncMutationState, "message" | "detail"> {
  const providerLabel = getCloudSyncProviderLabel(provider, t);

  switch (intent) {
    case "connect":
      return {
        message: t("options.runtime.cloudSync.connectingProvider", {
          provider: providerLabel,
        }),
        detail: t("options.runtime.cloudSync.connectHint"),
      };
    case "reconnect":
      return {
        message: t("options.runtime.cloudSync.reconnectingProvider", {
          provider: providerLabel,
        }),
        detail: t("options.runtime.cloudSync.connectHint"),
      };
    case "disconnect":
      return {
        message: t("options.runtime.cloudSync.disconnectingProvider", {
          provider: providerLabel,
        }),
        detail: t("options.runtime.cloudSync.disconnectHint"),
      };
    case "retry":
      return {
        message: t("options.runtime.cloudSync.retryingProvider", {
          provider: providerLabel,
        }),
        detail: t("options.runtime.cloudSync.retryHint"),
      };
    case "refresh":
      return {
        message: t("options.runtime.cloudSync.refreshing"),
        detail: t("options.runtime.cloudSync.refreshHint"),
      };
    case "resolve-choice":
      return {
        message: t("options.runtime.cloudSync.resolvingChoice"),
        detail: t("options.runtime.cloudSync.resolveChoiceHint"),
      };
    default:
      return {
        message: t("options.runtime.cloudSync.connecting"),
      };
  }
}

function getSuccessFeedback(
  intent: CloudSyncMutationIntent,
  provider: CloudSyncProvider | undefined,
  t: ReturnType<typeof useT>
): Pick<CloudSyncMutationState, "message" | "detail"> {
  const providerLabel = getCloudSyncProviderLabel(provider, t);

  switch (intent) {
    case "connect":
      return {
        message: t("options.runtime.cloudSync.connectSuccess", {
          provider: providerLabel,
        }),
        detail: t("options.runtime.cloudSync.connectSuccessHint"),
      };
    case "reconnect":
      return {
        message: t("options.runtime.cloudSync.reconnectSuccess", {
          provider: providerLabel,
        }),
        detail: t("options.runtime.cloudSync.connectSuccessHint"),
      };
    case "disconnect":
      return {
        message: t("options.runtime.cloudSync.disconnectSuccess", {
          provider: providerLabel,
        }),
        detail: t("options.runtime.cloudSync.disconnectSuccessHint"),
      };
    case "retry":
      return {
        message: t("options.runtime.cloudSync.retrySuccess"),
        detail: t("options.runtime.cloudSync.retrySuccessHint"),
      };
    case "refresh":
      return {
        message: t("options.runtime.cloudSync.refreshSuccess"),
        detail: t("options.runtime.cloudSync.refreshSuccessHint"),
      };
    case "resolve-choice":
      return {
        message: t("options.runtime.cloudSync.choiceSuccess"),
        detail: t("options.runtime.cloudSync.choiceSuccessHint"),
      };
    default:
      return {
        message: t("options.runtime.cloudSync.updated"),
      };
  }
}

export const useCloudSync = ({ onSettingsChanged }: Props = {}) => {
  const t = useT();
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>(
    EMPTY_CLOUD_SYNC_STATE
  );
  const [loading, setLoading] = useState(true);
  const [mutationState, setMutationState] = useState<CloudSyncMutationState>({
    status: "idle",
    message: t("options.runtime.cloudSync.idleAvailable"),
  });
  const isMountedRef = useRef(true);
  const latestLoadRequestIdRef = useRef(0);
  const resetFeedbackTimerRef = useRef<number | null>(null);

  const clearResetFeedbackTimer = () => {
    if (resetFeedbackTimerRef.current !== null) {
      window.clearTimeout(resetFeedbackTimerRef.current);
      resetFeedbackTimerRef.current = null;
    }
  };

  const scheduleIdleMutationState = (nextState: CloudSyncState) => {
    clearResetFeedbackTimer();
    resetFeedbackTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      setMutationState({
        status: "idle",
        message: deriveIdleMessage(nextState, t),
      });
      resetFeedbackTimerRef.current = null;
    }, CLOUD_SYNC_SUCCESS_STATE_TTL_MS);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearResetFeedbackTimer();
    };
  }, []);

  const loadCloudSyncState = async (): Promise<CloudSyncState | null> => {
    const requestId = latestLoadRequestIdRef.current + 1;
    latestLoadRequestIdRef.current = requestId;
    await optionsCloudSyncDiagnostics.trace("options_cloud_sync_load_started");
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getCloudSyncState",
      });

      if (!response?.success || !response.state) {
        throw new Error(response?.error || "Could not load cloud sync state.");
      }

      if (
        !isMountedRef.current ||
        requestId !== latestLoadRequestIdRef.current
      ) {
        await optionsCloudSyncDiagnostics.trace("options_cloud_sync_load_discarded_unmounted");
        return;
      }

      const nextState = response.state as CloudSyncState;
      await optionsCloudSyncDiagnostics.info("options_cloud_sync_load_completed", {
        checkpointCount: nextState.checkpoints.length,
        queueSize: nextState.queueSize,
        diagnosticsCount: nextState.diagnostics.length,
      });
      startTransition(() => {
        setCloudSyncState(nextState);
        setMutationState((current) =>
          current.status === "loading" ||
          current.status === "error" ||
          current.status === "success"
            ? current
            : {
                status: "idle",
                message: deriveIdleMessage(nextState, t),
              }
        );
      });
      return nextState;
    } catch (error) {
      if (
        !isMountedRef.current ||
        requestId !== latestLoadRequestIdRef.current
      ) {
        await optionsCloudSyncDiagnostics.trace("options_cloud_sync_load_failed_unmounted");
        return null;
      }

      await optionsCloudSyncDiagnostics.warn("options_cloud_sync_load_failed", {
        error,
      });

      setMutationState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : t("options.runtime.cloudSync.loadFailed"),
      });
      return null;
    } finally {
      if (
        isMountedRef.current &&
        requestId === latestLoadRequestIdRef.current
      ) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadCloudSyncState();

    const intervalId = window.setInterval(() => {
      void loadCloudSyncState();
    }, CLOUD_SYNC_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadCloudSyncState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [t]);

  const runMutation = async (
    intent: CloudSyncMutationIntent,
    provider: CloudSyncProvider | undefined,
    operation: () => Promise<unknown>
  ) => {
    await optionsCloudSyncDiagnostics.info("options_cloud_sync_mutation_started", {
      intent,
      provider,
    });
    clearResetFeedbackTimer();
    const loadingFeedback = getLoadingFeedback(intent, provider, t);
    setMutationState({
      status: "loading",
      intent,
      provider,
      ...loadingFeedback,
    });

    try {
      await operation();
      await onSettingsChanged?.();
      const refreshedState = await loadCloudSyncState();

      if (!isMountedRef.current) {
        await optionsCloudSyncDiagnostics.trace("options_cloud_sync_mutation_completed_unmounted", {
          intent,
          provider,
        });
        return;
      }

      if (!refreshedState) {
        return;
      }

      await optionsCloudSyncDiagnostics.info("options_cloud_sync_mutation_completed", {
        intent,
        provider,
      });
      setMutationState({
        status: "success",
        intent,
        provider,
        ...getSuccessFeedback(intent, provider, t),
      });
      scheduleIdleMutationState(refreshedState);
    } catch (error) {
      if (!isMountedRef.current) {
        await optionsCloudSyncDiagnostics.trace("options_cloud_sync_mutation_failed_unmounted", {
          intent,
          provider,
        });
        return;
      }

      await optionsCloudSyncDiagnostics.error("options_cloud_sync_mutation_failed", {
        intent,
        provider,
        error,
      });

      setMutationState({
        status: "error",
        intent,
        provider,
        message:
          error instanceof Error
            ? error.message
            : t("options.runtime.cloudSync.actionFailed"),
      });
    }
  };

  const connectProvider = async (provider: CloudSyncProvider) => {
    await runMutation(
      "connect",
      provider,
      async () => {
        const response = await chrome.runtime.sendMessage({
          action: "connectCloudSyncProvider",
          provider,
        });

        if (!response?.success) {
          throw new Error(response?.error || "Could not connect cloud provider.");
        }
      }
    );
  };

  const disconnectProvider = async (provider: CloudSyncProvider) => {
    await runMutation(
      "disconnect",
      provider,
      async () => {
        const response = await chrome.runtime.sendMessage({
          action: "disconnectCloudSyncProvider",
          provider,
        });

        if (!response?.success) {
          throw new Error(response?.error || "Could not disconnect cloud provider.");
        }
      }
    );
  };

  const retryProvider = async (provider?: CloudSyncProvider) => {
    await runMutation(
      "retry",
      provider,
      async () => {
        const response = await chrome.runtime.sendMessage({
          action: "retryCloudSync",
          provider,
        });

        if (!response?.success) {
          throw new Error(response?.error || "Could not retry cloud sync.");
        }
      }
    );
  };

  const reconnectProvider = async (provider: CloudSyncProvider) => {
    await runMutation(
      "reconnect",
      provider,
      async () => {
        const disconnectResponse = await chrome.runtime.sendMessage({
          action: "disconnectCloudSyncProvider",
          provider,
        });

        if (!disconnectResponse?.success) {
          throw new Error(
            disconnectResponse?.error || "Could not disconnect cloud provider."
          );
        }

        const connectResponse = await chrome.runtime.sendMessage({
          action: "connectCloudSyncProvider",
          provider,
        });

        if (!connectResponse?.success) {
          throw new Error(connectResponse?.error || "Could not reconnect cloud provider.");
        }
      }
    );
  };

  const resolveSettingsChoice = async (
    choice: "keep-local" | "use-cloud"
  ) => {
    await runMutation(
      "resolve-choice",
      undefined,
      async () => {
        const response = await chrome.runtime.sendMessage({
          action: "resolveCloudSyncSettingsChoice",
          choice,
        });

        if (!response?.success) {
          throw new Error(
            response?.error || "Could not resolve the shared settings choice."
          );
        }
      }
    );
  };

  const refreshCloudSyncState = async () => {
    await optionsCloudSyncDiagnostics.info("options_cloud_sync_mutation_started", {
      intent: "refresh",
      provider: undefined,
    });

    clearResetFeedbackTimer();
    const loadingFeedback = getLoadingFeedback("refresh", undefined, t);
    setMutationState({
      status: "loading",
      intent: "refresh",
      ...loadingFeedback,
    });

    const refreshedState = await loadCloudSyncState();
    if (!isMountedRef.current || !refreshedState) {
      return;
    }

    await optionsCloudSyncDiagnostics.info("options_cloud_sync_mutation_completed", {
      intent: "refresh",
      provider: undefined,
    });
    setMutationState({
      status: "success",
      intent: "refresh",
      ...getSuccessFeedback("refresh", undefined, t),
    });
    scheduleIdleMutationState(refreshedState);
  };

  return {
    cloudSyncState,
    cloudSyncLoading: loading,
    cloudSyncMutationState: mutationState,
    refreshCloudSyncState,
    connectProvider,
    disconnectProvider,
    retryProvider,
    reconnectProvider,
    resolveSettingsChoice,
  };
};
