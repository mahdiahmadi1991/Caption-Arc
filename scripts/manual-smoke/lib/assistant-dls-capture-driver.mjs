#!/usr/bin/env node

import { evaluateInTarget } from "./cdp-runtime.mjs";

const REQUEST_MESSAGE_TYPE = "captionarc:dls-capture-request";
const RESPONSE_MESSAGE_TYPE = "captionarc:dls-capture-response";

function randomRequestId() {
  return `assistant-dls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function dispatchBridgeRequest({
  webSocketDebuggerUrl,
  action,
  payload = undefined,
  timeoutMs = 12000,
} = {}) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    awaitPromise: true,
    delayMs: 120,
    expression: `(
      () => {
        const action = ${JSON.stringify(action)};
        const payload = ${JSON.stringify(payload ?? null)};
        const timeoutMs = ${JSON.stringify(timeoutMs)};
        const requestId = ${JSON.stringify(randomRequestId())};

        return new Promise((resolve, reject) => {
          let timeoutId = null;

          const cleanup = () => {
            window.removeEventListener("message", handleMessage);
            if (timeoutId !== null) {
              window.clearTimeout(timeoutId);
            }
          };

          const handleMessage = (event) => {
            if (event.source !== window) {
              return;
            }

            const detail = event?.data || null;
            if (!detail || detail.type !== ${JSON.stringify(RESPONSE_MESSAGE_TYPE)} || detail.requestId !== requestId) {
              return;
            }

            cleanup();
            if (detail.ok) {
              if (typeof detail.resultJson === "string") {
                try {
                  resolve(JSON.parse(detail.resultJson));
                  return;
                } catch (error) {
                  reject(
                    new Error(
                      \`Assistant DLS capture bridge returned invalid JSON for '\${action}': \${
                        error instanceof Error ? error.message : String(error)
                      }\`
                    )
                  );
                  return;
                }
              }

              resolve(detail.result || null);
              return;
            }

            reject(
              new Error(
                detail.error ||
                  \`Assistant DLS capture bridge request '\${action}' failed without an error message.\`
              )
            );
          };

          timeoutId = window.setTimeout(() => {
            cleanup();
            reject(
              new Error(
                \`Timed out waiting for assistant DLS capture bridge response for '\${action}'.\`
              )
            );
          }, Math.max(1000, timeoutMs));

          window.addEventListener("message", handleMessage);
          window.postMessage(
            {
              type: ${JSON.stringify(REQUEST_MESSAGE_TYPE)},
              requestId,
              action,
              payload,
            },
            "*"
          );
        });
      }
    )()`,
  });
}

export async function pingAssistantDlsCaptureBridge({
  webSocketDebuggerUrl,
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: "ping",
    timeoutMs: 5000,
  });
}

export async function resetAssistantDlsCaptureBridge({
  webSocketDebuggerUrl,
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: "reset",
    timeoutMs: 5000,
  });
}

export async function ensureAssistantDlsCaptureReady({
  webSocketDebuggerUrl,
  timeoutMs = 12000,
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: "ensure-capture",
    timeoutMs,
  });
}

export async function pushAssistantDlsCaption({
  webSocketDebuggerUrl,
  stableKey,
  speaker,
  text,
  own = false,
  finalize = false,
  mode = "caption",
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: mode,
    payload: {
      stableKey,
      speaker,
      text,
      own,
      finalize,
    },
    timeoutMs: 12000,
  });
}

export async function finalizeAssistantDlsCaption({
  webSocketDebuggerUrl,
  stableKey,
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: "finalize",
    payload: {
      stableKey,
    },
    timeoutMs: 8000,
  });
}

export async function getAssistantDlsCaptureSnapshot({
  webSocketDebuggerUrl,
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: "snapshot",
    timeoutMs: 5000,
  });
}

export async function switchAssistantDlsSessionProfile({
  webSocketDebuggerUrl,
  profileId,
  assistantEnabled,
  timeoutMs = 12000,
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: "switch-profile",
    payload: {
      profileId,
      ...(typeof assistantEnabled === "boolean"
        ? { assistantEnabled }
        : {}),
    },
    timeoutMs,
  });
}

export async function shutdownAssistantDlsCaptureBridge({
  webSocketDebuggerUrl,
  timeoutMs = 12000,
} = {}) {
  return await dispatchBridgeRequest({
    webSocketDebuggerUrl,
    action: "shutdown",
    timeoutMs,
  });
}
