import { useEffect, useRef, useState } from "react";
import type { CloudSyncState } from "../background/cloud-sync/types";
import type { CloudSyncProvider } from "../background/types";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import { useT } from "../shared/i18n";

type CloudSyncMutationIntent =
  | "connect"
  | "disconnect"
  | "retry"
  | "reconnect"
  | "refresh";

type CloudSyncMutationState = {
  status: "idle" | "loading" | "error";
  intent?: CloudSyncMutationIntent;
  provider?: CloudSyncProvider;
  message: string;
};

type Props = {
  onSettingsChanged?: () => Promise<void> | void;
};

const CLOUD_SYNC_POLL_INTERVAL_MS = 15_000;

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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCloudSyncState = async () => {
    await optionsCloudSyncDiagnostics.trace("options_cloud_sync_load_started");
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getCloudSyncState",
      });

      if (!response?.success || !response.state) {
        throw new Error(response?.error || "Could not load cloud sync state.");
      }

      if (!isMountedRef.current) {
        await optionsCloudSyncDiagnostics.trace("options_cloud_sync_load_discarded_unmounted");
        return;
      }

      setCloudSyncState(response.state as CloudSyncState);
      await optionsCloudSyncDiagnostics.info("options_cloud_sync_load_completed", {
        checkpointCount: response.state.checkpoints.length,
        queueSize: response.state.queueSize,
        diagnosticsCount: response.state.diagnostics.length,
      });
      setMutationState((current) =>
        current.status === "loading"
          ? current
          : {
              status: "idle",
              message:
                response.state.checkpoints.some(
                  (checkpoint: CloudSyncState["checkpoints"][number]) => checkpoint.connected
                )
                  ? t("options.runtime.cloudSync.idleConnected")
                  : t("options.runtime.cloudSync.idleDisconnected"),
            }
      );
    } catch (error) {
      if (!isMountedRef.current) {
        await optionsCloudSyncDiagnostics.trace("options_cloud_sync_load_failed_unmounted");
        return;
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
    } finally {
      if (isMountedRef.current) {
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
    operation: () => Promise<unknown>,
    loadingMessage: string
  ) => {
    await optionsCloudSyncDiagnostics.info("options_cloud_sync_mutation_started", {
      intent,
      provider,
    });
    setMutationState({
      status: "loading",
      intent,
      provider,
      message: loadingMessage,
    });

    try {
      await operation();
      await onSettingsChanged?.();
      await loadCloudSyncState();

      if (!isMountedRef.current) {
        await optionsCloudSyncDiagnostics.trace("options_cloud_sync_mutation_completed_unmounted", {
          intent,
          provider,
        });
        return;
      }

      await optionsCloudSyncDiagnostics.info("options_cloud_sync_mutation_completed", {
        intent,
        provider,
      });
      setMutationState({
        status: "idle",
        message: t("options.runtime.cloudSync.updated"),
      });
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
      },
      t("options.runtime.cloudSync.connecting")
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
      },
      t("options.runtime.cloudSync.disconnecting")
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
      },
      t("options.runtime.cloudSync.retrying")
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
      },
      t("options.runtime.cloudSync.reconnecting")
    );
  };

  const resolveSettingsChoice = async (
    choice: "keep-local" | "use-cloud"
  ) => {
    await runMutation(
      "refresh",
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
      },
      t("options.runtime.cloudSync.resolvingChoice")
    );
  };

  return {
    cloudSyncState,
    cloudSyncLoading: loading,
    cloudSyncMutationState: mutationState,
    refreshCloudSyncState: loadCloudSyncState,
    connectProvider,
    disconnectProvider,
    retryProvider,
    reconnectProvider,
    resolveSettingsChoice,
  };
};