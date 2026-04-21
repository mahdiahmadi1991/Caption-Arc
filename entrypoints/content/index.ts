import {
  createDiagnosticsLogger,
  initializeDiagnosticsClient,
} from "../shared/diagnostics-client";

const RETRY_INTERVAL_MS = 250;
const MAX_RETRY_ATTEMPTS = 30;

let bootStarted = false;

const contentBootLogger = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "content-boot",
});

let platformRuntimeModulePromise:
  | Promise<typeof import("./platform-runtime")>
  | null = null;
let assistantBridgeModulePromise:
  | Promise<typeof import("./assistant-dls-capture-bridge")>
  | null = null;

type ContentScriptContext = {
  signal?: AbortSignal;
  onInvalidated?: (callback: () => void) => void;
};

type BrowserLikeGlobal = typeof globalThis & {
  browser?: {
    runtime?: {
      id?: string;
    };
  };
};

function getExtensionRuntime(): { id?: string } | undefined {
  const browserGlobal = globalThis as BrowserLikeGlobal;
  return browserGlobal.chrome?.runtime ?? browserGlobal.browser?.runtime;
}

function hasActiveExtensionContext(): boolean {
  return Boolean(getExtensionRuntime()?.id);
}

function isExtensionContextInvalidated(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : String(error);

  return /extension context invalidated|context invalidated/i.test(message);
}

function shouldRetryBootIndefinitely(): boolean {
  try {
    const url = new URL(window.location.href);
    return /(^|\.)teams\.live\.com$/i.test(url.hostname) && /\/v2\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function loadPlatformRuntimeModule(): Promise<typeof import("./platform-runtime")> {
  if (!platformRuntimeModulePromise) {
    platformRuntimeModulePromise = import("./platform-runtime");
  }

  return platformRuntimeModulePromise;
}

function loadAssistantBridgeModule(): Promise<
  typeof import("./assistant-dls-capture-bridge")
> {
  if (!assistantBridgeModulePromise) {
    assistantBridgeModulePromise = import("./assistant-dls-capture-bridge");
  }

  return assistantBridgeModulePromise;
}

export default defineContentScript({
  matches: [
    "https://meet.google.com/*",
    "https://teams.microsoft.com/l/meetup-join/*",
    "https://teams.microsoft.com/meet/*",
    "https://teams.microsoft.com/v2/*",
    "https://*.teams.microsoft.com/l/meetup-join/*",
    "https://*.teams.microsoft.com/meet/*",
    "https://*.teams.microsoft.com/v2/*",
    "https://teams.live.com/v2/*",
    "https://*.teams.live.com/v2/*",
    "https://*.zoom.us/wc/*",
    "https://*.zoom.us/j/*",
    "https://*.zoom.us/w/*",
  ],
  allFrames: true,
  runAt: "document_start",

  main(ctx) {
    void initializeDiagnosticsClient();
    void contentBootLogger.info("content_script_main_started", {
      readyState: document.readyState,
      hasHead: Boolean(document.head),
    });

    const existingMeta = document.querySelector('meta[name="captionarc-injected"]');
    existingMeta?.remove();

    const meta = document.createElement("meta");
    meta.name = "captionarc-injected";
    const runtimeId = getExtensionRuntime()?.id || "unknown";
    meta.content = `${runtimeId}:${Date.now()}`;
    (document.head || document.documentElement).appendChild(meta);

    const cleanupMeta = () => {
      if (meta.isConnected) {
        meta.remove();
      }
    };
    ctx.onInvalidated?.(cleanupMeta);
    ctx.signal?.addEventListener("abort", cleanupMeta, { once: true });

    void contentBootLogger.debug("content_script_marker_injected", {
      runtimeId,
    });
    void loadAssistantBridgeModule().then((module) =>
      module.installAssistantDlsCaptureBridge()
    );

    void bootWithRetry(ctx);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        void bootWithRetry(ctx);
      });
    } else {
      void bootWithRetry(ctx);
    }
  },
});

async function bootWithRetry(ctx?: ContentScriptContext): Promise<void> {
  if (bootStarted) {
    await contentBootLogger.trace("boot_retry_skipped_already_started");
    return;
  }

  bootStarted = true;
  let attempts = 0;

  const tryInit = async () => {
    if (ctx?.signal?.aborted || !hasActiveExtensionContext()) {
      await contentBootLogger.trace("boot_retry_stopped_context_inactive", {
        aborted: Boolean(ctx?.signal?.aborted),
      });
      return;
    }

    attempts += 1;
    const retryIndefinitely = shouldRetryBootIndefinitely();
    await contentBootLogger.debug("boot_retry_attempt", {
      attempts,
      retryIndefinitely,
    });

    try {
      const { initializePlatformRuntime } = await loadPlatformRuntimeModule();
      const initialized = await initializePlatformRuntime();
      if (ctx?.signal?.aborted || !hasActiveExtensionContext()) {
        return;
      }

      await contentBootLogger.info("boot_retry_attempt_completed", {
        attempts,
        initialized,
      });

      if (!retryIndefinitely && (initialized || attempts >= MAX_RETRY_ATTEMPTS)) {
        return;
      }
    } catch (error) {
      if (
        ctx?.signal?.aborted ||
        !hasActiveExtensionContext() ||
        isExtensionContextInvalidated(error)
      ) {
        return;
      }

      void contentBootLogger.error("boot_retry_failed", {
        attempts,
        error,
      });
      if (!retryIndefinitely && attempts >= MAX_RETRY_ATTEMPTS) {
        return;
      }
    }

    if (ctx?.signal?.aborted || !hasActiveExtensionContext()) {
      return;
    }

    await contentBootLogger.trace("boot_retry_rescheduled", {
      attempts,
      retryIntervalMs: RETRY_INTERVAL_MS,
    });
    window.setTimeout(() => {
      void tryInit();
    }, RETRY_INTERVAL_MS);
  };

  await tryInit();
}
