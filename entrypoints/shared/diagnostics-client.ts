import type { DiagnosticsLevel } from "./diagnostics";
import {
  getDiagnosticsStorageSelection,
  getExtensionStorageApi,
  type StorageAreaLike,
} from "./browser-capabilities";
import {
  DEFAULT_DIAGNOSTICS_CONFIG,
  DIAGNOSTICS_SESSION_STORAGE_KEY,
  normalizeDiagnosticsConfig,
  shouldCaptureDiagnosticsLevel,
  type DiagnosticsConfig,
  type DiagnosticsRuntimeContext,
} from "./diagnostics";

type RuntimeMessageCapable = {
  sendMessage?: (
    message: Record<string, unknown>
  ) => Promise<unknown> | unknown;
};

type BrowserLikeGlobal = typeof globalThis & {
  browser?: {
    runtime?: RuntimeMessageCapable;
  };
  chrome?: object;
};

let diagnosticsConfig: DiagnosticsConfig = { ...DEFAULT_DIAGNOSTICS_CONFIG };
let diagnosticsClientInitialized = false;
let diagnosticsConfigPromise: Promise<void> | null = null;

function getRuntime(): RuntimeMessageCapable | undefined {
  const browserGlobal = globalThis as BrowserLikeGlobal;
  return browserGlobal.chrome?.runtime ?? browserGlobal.browser?.runtime;
}

function getStorageArea(): {
  areaName: "session" | "local";
  area?: StorageAreaLike;
} {
  const { areaName, area } = getDiagnosticsStorageSelection();
  return { areaName, area };
}

async function readDiagnosticsConfigFromStorage(): Promise<void> {
  try {
    const storageArea = getStorageArea();
    if (!storageArea.area?.get) {
      diagnosticsConfig = normalizeDiagnosticsConfig(
        { overrideMinLevel: "off" },
        DEFAULT_DIAGNOSTICS_CONFIG
      );
      return;
    }

    const result = await storageArea.area.get(DIAGNOSTICS_SESSION_STORAGE_KEY);
    const stored = result?.[DIAGNOSTICS_SESSION_STORAGE_KEY] as
      | { config?: Partial<DiagnosticsConfig> }
      | undefined;
    diagnosticsConfig = normalizeDiagnosticsConfig(stored?.config);
  } catch {
    diagnosticsConfig = normalizeDiagnosticsConfig(
      { overrideMinLevel: "off" },
      DEFAULT_DIAGNOSTICS_CONFIG
    );
  }
}

export function initializeDiagnosticsClient(): Promise<void> {
  if (diagnosticsClientInitialized) {
    return Promise.resolve();
  }

  if (diagnosticsConfigPromise) {
    return diagnosticsConfigPromise;
  }

  diagnosticsConfigPromise = (async () => {
    await readDiagnosticsConfigFromStorage();

    const storageApi = getExtensionStorageApi();
    const storageArea = getStorageArea();
    storageApi?.onChanged?.addListener?.((changes, areaName) => {
      if (areaName !== storageArea.areaName) {
        return;
      }

      const change = changes[DIAGNOSTICS_SESSION_STORAGE_KEY];
      if (!change?.newValue) {
        diagnosticsConfig = { ...DEFAULT_DIAGNOSTICS_CONFIG };
        return;
      }

      const nextValue = change.newValue as { config?: Partial<DiagnosticsConfig> };
      diagnosticsConfig = normalizeDiagnosticsConfig(nextValue.config);
    });

    diagnosticsClientInitialized = true;
  })();

  return diagnosticsConfigPromise;
}

export function getDiagnosticsClientConfig(): DiagnosticsConfig {
  return { ...diagnosticsConfig };
}

export function isDiagnosticsCaptureEnabled(level?: DiagnosticsLevel): boolean {
  if (!diagnosticsConfig.enabled) {
    return false;
  }

  if (!level) {
    return true;
  }

  return shouldCaptureDiagnosticsLevel(level, diagnosticsConfig.minLevel);
}

async function postDiagnosticsMessage(message: Record<string, unknown>): Promise<void> {
  const runtime = getRuntime();
  if (!runtime?.sendMessage) {
    return;
  }

  try {
    await runtime.sendMessage(message);
  } catch {
    // Diagnostics must never break primary behavior.
  }
}

export function createDiagnosticsLogger(context: {
  runtime: DiagnosticsRuntimeContext;
  domain: string;
  feature: string;
  provider?: string;
}) {
  const emit = async (
    level: DiagnosticsLevel,
    message: string,
    data?: Record<string, unknown>,
    extra?: {
      provider?: string;
      sessionId?: string;
      requestId?: string;
      correlationId?: string;
    }
  ): Promise<void> => {
    if (!isDiagnosticsCaptureEnabled(level)) {
      return;
    }

    await postDiagnosticsMessage({
      action: "recordDiagnosticsEvent",
      event: {
        level,
        runtime: context.runtime,
        domain: context.domain,
        feature: context.feature,
        provider: extra?.provider || context.provider,
        sessionId: extra?.sessionId,
        requestId: extra?.requestId,
        correlationId: extra?.correlationId,
        message,
        data,
      },
    });
  };

  const snapshot = async (key: string, data: Record<string, unknown>): Promise<void> => {
    if (!isDiagnosticsCaptureEnabled()) {
      return;
    }

    await postDiagnosticsMessage({
      action: "setDiagnosticsSnapshot",
      key,
      runtime: context.runtime,
      data,
    });
  };

  const clearSnapshot = async (key: string): Promise<void> => {
    await postDiagnosticsMessage({
      action: "clearDiagnosticsSnapshot",
      key,
    });
  };

  return {
    trace: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("trace", message, data, extra),
    debug: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("debug", message, data, extra),
    info: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("info", message, data, extra),
    warn: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("warn", message, data, extra),
    error: (message: string, data?: Record<string, unknown>, extra?: Parameters<typeof emit>[3]) =>
      emit("error", message, data, extra),
    snapshot,
    clearSnapshot,
  };
}