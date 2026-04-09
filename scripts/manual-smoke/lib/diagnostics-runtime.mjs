#!/usr/bin/env node

import {
  evaluateInExtensionTarget,
  listTargets as listExtensionTargets,
  openExtensionUiTarget,
  parseTargetExtensionId,
  resolveCaptionArcExtensionTarget,
} from "./extension-target.mjs";

async function resolveDiagnosticsTarget({
  baseUrl,
  expectedRuntimeId = null,
} = {}) {
  let resolvedTarget = await resolveCaptionArcExtensionTarget({
    baseUrl,
    expectedId: expectedRuntimeId || undefined,
    allowNameFallback: !expectedRuntimeId,
  });

  if (!resolvedTarget && expectedRuntimeId) {
    resolvedTarget = await resolveCaptionArcExtensionTarget({
      baseUrl,
      expectedId: expectedRuntimeId,
      allowNameFallback: true,
    });
  }

  if (!resolvedTarget?.webSocketDebuggerUrl) {
    throw new Error("Could not resolve CaptionArc extension target.");
  }

  if (resolvedTarget.type !== "page" && resolvedTarget.runtimeId) {
    await openExtensionUiTarget(baseUrl, resolvedTarget.runtimeId);
    const refreshedTargets = await listExtensionTargets(baseUrl);
    const pageTarget = refreshedTargets.find((target) => {
      if (target?.type !== "page" || typeof target?.url !== "string") {
        return false;
      }

      const targetId = parseTargetExtensionId(target.url);
      return targetId && targetId.toLowerCase() === resolvedTarget.runtimeId.toLowerCase();
    });

    if (pageTarget?.webSocketDebuggerUrl) {
      resolvedTarget = {
        ...pageTarget,
        runtimeId: resolvedTarget.runtimeId,
        manifestName: resolvedTarget.manifestName || null,
      };
    }
  }

  return resolvedTarget;
}

export async function sendCaptionArcRuntimeMessage({
  baseUrl,
  message,
  expectedRuntimeId = null,
} = {}) {
  const target = await resolveDiagnosticsTarget({ baseUrl, expectedRuntimeId });
  const result = await evaluateInExtensionTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        try {
          if (!chrome?.runtime?.sendMessage) {
            return {
              ok: false,
              reason: "chrome.runtime.sendMessage unavailable",
            };
          }

          const response = await chrome.runtime.sendMessage(${JSON.stringify(message)});
          return {
            ok: true,
            response,
          };
        } catch (error) {
          return {
            ok: false,
            error: String(error),
          };
        }
      }
    )()`,
  });

  if (!result?.ok) {
    throw new Error(
      `CaptionArc runtime message failed: ${JSON.stringify(result || null)}`
    );
  }

  return result.response;
}

export async function enableDiagnosticsForDebugSession({
  baseUrl,
  minLevel = "debug",
  clearExisting = true,
  expectedRuntimeId = null,
} = {}) {
  if (clearExisting) {
    await sendCaptionArcRuntimeMessage({
      baseUrl,
      expectedRuntimeId,
      message: {
        action: "clearDiagnosticsData",
        includeSnapshots: true,
      },
    });
  }

  return await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "setDiagnosticsConfig",
      config: {
        enabled: true,
        minLevel,
      },
    },
  });
}

export async function getDiagnosticsConfigFromRuntime({
  baseUrl,
  expectedRuntimeId = null,
} = {}) {
  return await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "getDiagnosticsConfig",
    },
  });
}

export async function setDiagnosticsConfigInRuntime({
  baseUrl,
  config,
  expectedRuntimeId = null,
} = {}) {
  return await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "setDiagnosticsConfig",
      config: config || {},
    },
  });
}

export async function runWithTemporaryDiagnosticsConfig({
  baseUrl,
  expectedRuntimeId = null,
  minLevel = "debug",
  clearExisting = true,
  operation,
} = {}) {
  const diagnosticsConfigResponse = await getDiagnosticsConfigFromRuntime({
    baseUrl,
    expectedRuntimeId,
  }).catch(() => null);
  const restoreConfig = diagnosticsConfigResponse?.config || null;

  await enableDiagnosticsForDebugSession({
    baseUrl,
    expectedRuntimeId,
    minLevel,
    clearExisting,
  });

  try {
    return await operation?.({ restoreConfig });
  } finally {
    if (restoreConfig) {
      await setDiagnosticsConfigInRuntime({
        baseUrl,
        expectedRuntimeId,
        config: restoreConfig,
      }).catch(() => null);
    }
  }
}

export async function disableDiagnosticsForDebugSession({
  baseUrl,
  expectedRuntimeId = null,
} = {}) {
  return await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "setDiagnosticsConfig",
      config: {
        enabled: false,
      },
    },
  });
}

export async function getDiagnosticsPayloadFromRuntime({
  baseUrl,
  query = {},
  expectedRuntimeId = null,
} = {}) {
  return await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "getDiagnosticsPayload",
      query,
    },
  });
}

export async function clearDiagnosticsDataInRuntime({
  baseUrl,
  includeSnapshots = true,
  expectedRuntimeId = null,
} = {}) {
  return await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "clearDiagnosticsData",
      includeSnapshots,
    },
  });
}