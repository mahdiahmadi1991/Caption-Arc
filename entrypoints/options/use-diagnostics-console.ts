import { useCallback, useEffect, useRef, useState } from "react";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import { isDiagnosticsViewerEnabledForEnvironment } from "../shared/environment";
import { useT } from "../shared/i18n";
import type {
  DiagnosticsConfig,
  DiagnosticsEvent,
  DiagnosticsLevel,
  DiagnosticsSnapshot,
} from "../shared/diagnostics";
import {
  DIAGNOSTICS_VIEWER_EVENT_LIMIT,
  DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS,
  createDiagnosticsConfigFingerprint,
  createDiagnosticsPayloadFingerprint,
  getDiagnosticsSessionEnableLevel,
} from "./diagnostics-viewer";

const optionsDiagnosticsConsoleLogger = createDiagnosticsLogger({
  runtime: "options",
  domain: "runtime",
  feature: "diagnostics-console",
});

type DiagnosticsPayloadResponse = {
  success: boolean;
  error?: string;
  config: DiagnosticsConfig;
  events: DiagnosticsEvent[];
  snapshots: Record<string, DiagnosticsSnapshot>;
  resolvedSnapshot: DiagnosticsSnapshot | null;
  counts: Record<DiagnosticsLevel, number>;
};

type DiagnosticsConfigResponse = {
  success: boolean;
  error?: string;
  config: DiagnosticsConfig;
};

type RuntimeMessageCapable = {
  sendMessage?: (message: Record<string, unknown>) => Promise<unknown> | unknown;
};

function getRuntime(): RuntimeMessageCapable | undefined {
  return (globalThis as typeof globalThis & {
    chrome?: { runtime?: RuntimeMessageCapable };
  }).chrome?.runtime;
}

function resolveDiagnosticsConsoleErrorMessage(
  t: ReturnType<typeof useT>,
  message: string
): string {
  switch (message) {
    case "options.diagnostics.requestErrors.runtimeUnavailable":
      return t("options.diagnostics.requestErrors.runtimeUnavailable");
    default:
      return message;
  }
}

async function requestRuntime<TResponse>(
  message: Record<string, unknown>
): Promise<TResponse> {
  const runtime = getRuntime();

  if (!runtime?.sendMessage) {
    throw new Error(
      "options.diagnostics.requestErrors.runtimeUnavailable"
    );
  }

  return (await runtime.sendMessage(message)) as TResponse;
}

export function useDiagnosticsConsole() {
  const t = useT();
  const viewerEnabled = isDiagnosticsViewerEnabledForEnvironment();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState !== "hidden"
  );
  const [config, setConfig] = useState<DiagnosticsConfig | null>(null);
  const [events, setEvents] = useState<DiagnosticsEvent[]>([]);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [resolvedSnapshot, setResolvedSnapshot] =
    useState<DiagnosticsSnapshot | null>(null);
  const [counts, setCounts] = useState<Record<DiagnosticsLevel, number>>({
    trace: 0,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
  });
  const [manualRefreshInProgress, setManualRefreshInProgress] = useState(false);
  const [busyAction, setBusyAction] = useState<null | "toggle" | "clear">(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const payloadFingerprintRef = useRef<string | null>(null);
  const configFingerprintRef = useRef<string | null>(null);
  const inFlightPayloadRequestRef = useRef<Promise<boolean> | null>(null);

  const refreshConfig = useCallback(async () => {
    if (!viewerEnabled) {
      return;
    }

    try {
      const response = await requestRuntime<DiagnosticsConfigResponse>({
        action: "getDiagnosticsConfig",
      });

      if (!response?.success || !response.config) {
        throw new Error(
          response?.error || t("options.diagnostics.requestErrors.loadConfigFailed")
        );
      }

      const nextConfigFingerprint = createDiagnosticsConfigFingerprint(response.config);
      if (configFingerprintRef.current !== nextConfigFingerprint) {
        configFingerprintRef.current = nextConfigFingerprint;
        setConfig(response.config);
      }
      setRequestError(null);
    } catch (error) {
      const message = resolveDiagnosticsConsoleErrorMessage(
        t,
        error instanceof Error ? error.message : String(error)
      );
      setRequestError(message);
      await optionsDiagnosticsConsoleLogger.warn(
        "diagnostics_console_config_refresh_failed",
        { message }
      );
    }
  }, [viewerEnabled]);

  const fetchPayload = useCallback(async (options?: { manual?: boolean }) => {
    if (!viewerEnabled) {
      return false;
    }

    if (options?.manual) {
      setManualRefreshInProgress(true);
    }

    if (inFlightPayloadRequestRef.current) {
      try {
        return await inFlightPayloadRequestRef.current;
      } finally {
        if (options?.manual) {
          setManualRefreshInProgress(false);
        }
      }
    }

    const requestPromise = (async () => {
      try {
        const response = await requestRuntime<DiagnosticsPayloadResponse>({
          action: "getDiagnosticsPayload",
          query: {
            limit: DIAGNOSTICS_VIEWER_EVENT_LIMIT,
          },
        });

        if (!response?.success || !response.config) {
          throw new Error(
            response?.error || t("options.diagnostics.requestErrors.loadPayloadFailed")
          );
        }

        const nextSnapshotCount = Object.keys(response.snapshots || {}).length;
        const nextPayloadFingerprint = createDiagnosticsPayloadFingerprint({
          config: response.config,
          events: Array.isArray(response.events) ? response.events : [],
          counts: response.counts,
          resolvedSnapshot: response.resolvedSnapshot || null,
          snapshotCount: nextSnapshotCount,
        });
        const hasMeaningfulChange =
          nextPayloadFingerprint !== payloadFingerprintRef.current;

        if (hasMeaningfulChange) {
          payloadFingerprintRef.current = nextPayloadFingerprint;
          configFingerprintRef.current = createDiagnosticsConfigFingerprint(
            response.config
          );
          setConfig(response.config);
          setEvents(Array.isArray(response.events) ? response.events : []);
          setCounts(response.counts);
          setResolvedSnapshot(response.resolvedSnapshot || null);
          setSnapshotCount(nextSnapshotCount);
          setLastUpdatedAt(new Date().toISOString());
        } else if (options?.manual) {
          setLastUpdatedAt(new Date().toISOString());
        }

        setRequestError(null);
        return hasMeaningfulChange;
      } catch (error) {
        const message = resolveDiagnosticsConsoleErrorMessage(
          t,
          error instanceof Error ? error.message : String(error)
        );
        setRequestError(message);
        await optionsDiagnosticsConsoleLogger.warn(
          "diagnostics_console_payload_refresh_failed",
          { message, manual: Boolean(options?.manual) }
        );
        return false;
      } finally {
        inFlightPayloadRequestRef.current = null;
      }
    })();

    inFlightPayloadRequestRef.current = requestPromise;

    try {
      return await requestPromise;
    } finally {
      if (options?.manual) {
        setManualRefreshInProgress(false);
      }
    }
  }, [viewerEnabled]);

  const refreshPayload = useCallback(async () => {
    await fetchPayload({ manual: true });
  }, [fetchPayload]);

  const setSessionCaptureEnabled = useCallback(
    async (enabled: boolean) => {
      if (!viewerEnabled || !config) {
        return;
      }

      setBusyAction("toggle");

      try {
        const response = await requestRuntime<DiagnosticsConfigResponse>({
          action: "setDiagnosticsConfig",
          config: {
            overrideMinLevel: enabled
              ? getDiagnosticsSessionEnableLevel(config)
              : "off",
          },
        });

        if (!response?.success || !response.config) {
          throw new Error(
            response?.error || t("options.diagnostics.requestErrors.updateConfigFailed")
          );
        }

        setConfig(response.config);
        setRequestError(null);
        await optionsDiagnosticsConsoleLogger.info(
          enabled
            ? "diagnostics_console_session_capture_enabled"
            : "diagnostics_console_session_capture_disabled",
          {
            minLevel: response.config.minLevel,
            overrideMinLevel: response.config.overrideMinLevel,
          }
        );

        await fetchPayload();
      } catch (error) {
        const message = resolveDiagnosticsConsoleErrorMessage(
          t,
          error instanceof Error ? error.message : String(error)
        );
        setRequestError(message);
        await optionsDiagnosticsConsoleLogger.error(
          "diagnostics_console_session_capture_toggle_failed",
          { message, enabled }
        );
      } finally {
        setBusyAction(null);
      }
    },
    [config, fetchPayload, viewerEnabled]
  );

  const clearDiagnostics = useCallback(async () => {
    if (!viewerEnabled) {
      return;
    }

    setBusyAction("clear");

    try {
      const response = (await requestRuntime<{ success: boolean; error?: string }>({
        action: "clearDiagnosticsData",
        includeSnapshots: true,
      })) as { success: boolean; error?: string };

      if (!response?.success) {
        throw new Error(
          response?.error || t("options.diagnostics.requestErrors.clearFailed")
        );
      }

      await optionsDiagnosticsConsoleLogger.info(
        "diagnostics_console_cleared"
      );
      await fetchPayload();
    } catch (error) {
      const message = resolveDiagnosticsConsoleErrorMessage(
        t,
        error instanceof Error ? error.message : String(error)
      );
      setRequestError(message);
      await optionsDiagnosticsConsoleLogger.error(
        "diagnostics_console_clear_failed",
        { message }
      );
    } finally {
      setBusyAction(null);
    }
  }, [fetchPayload, t, viewerEnabled]);

  useEffect(() => {
    if (!viewerEnabled) {
      setDrawerOpen(false);
      return;
    }

    void refreshConfig();
  }, [refreshConfig, viewerEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setPageVisible(document.visibilityState !== "hidden");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!viewerEnabled || !drawerOpen || !pageVisible) {
      return;
    }

    void fetchPayload();
    const intervalId = window.setInterval(() => {
      void fetchPayload();
    }, DIAGNOSTICS_VIEWER_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [drawerOpen, fetchPayload, pageVisible, viewerEnabled]);

  return {
    viewerEnabled,
    drawerOpen,
    setDrawerOpen,
    pageVisible,
    config,
    events,
    snapshotCount,
    resolvedSnapshot,
    counts,
    manualRefreshInProgress,
    busyAction,
    requestError,
    lastUpdatedAt,
    refreshPayload,
    clearDiagnostics,
    setSessionCaptureEnabled,
  };
}