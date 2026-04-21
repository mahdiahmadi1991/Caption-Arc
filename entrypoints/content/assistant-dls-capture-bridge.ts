import { addOrUpdateCaption, finalizeCaption } from "./caption";
import { captions, activeMeetingPlatform, meetingPresenceState } from "./state";
import {
  getCurrentSessionSnapshot,
  setCurrentSessionAssistantEnabled,
  setCurrentSessionMeetingProfile,
} from "./history-service";
import { platformRuntimeInternals } from "./platform-runtime";
import { getProviderForPageContext, getProviderForUrl } from "./providers/registry";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";

const REQUEST_EVENT = "captionarc:dls-capture-request";
const RESPONSE_EVENT = "captionarc:dls-capture-response";
const REQUEST_MESSAGE_TYPE = "captionarc:dls-capture-request";
const RESPONSE_MESSAGE_TYPE = "captionarc:dls-capture-response";
const FINALIZE_DELAY_MS = 1500;

type CaptureBridgeRequest =
  | {
      requestId: string;
      action: "ping" | "reset" | "snapshot" | "ensure-capture" | "shutdown";
      payload?: undefined;
    }
  | {
      requestId: string;
      action: "caption" | "update";
      payload?: {
        stableKey?: string;
        speaker?: string;
        text?: string;
        own?: boolean;
        finalize?: boolean;
      };
    }
  | {
      requestId: string;
      action: "finalize";
      payload?: {
        stableKey?: string;
      };
    }
  | {
      requestId: string;
      action: "switch-profile";
      payload?: {
        profileId?: string;
        assistantEnabled?: boolean;
      };
    };

const dlsBridgeDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "assistant",
  feature: "assistant-dls-capture-bridge",
});

let bridgeInstalled = false;
const stableKeyToCaptionId = new Map<string, number>();
const finalizationTimers = new Map<string, ReturnType<typeof setTimeout>>();

function normalizeStableKey(value: string | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-");
}

function buildBridgeSnapshot() {
  return {
    installed: true,
    activeMeetingPlatform,
    meetingPresenceState,
    currentSession: getCurrentSessionSnapshot(),
    captionCount: captions.length,
    fixtureKeys: [...stableKeyToCaptionId.keys()],
  };
}

function toSerializableBridgeResult(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value));
}

function dispatchBridgeResponse(requestId: string, response: Record<string, unknown>): void {
  const serializedResult =
    typeof response.result === "undefined"
      ? undefined
      : JSON.stringify(response.result);
  document.dispatchEvent(
    new CustomEvent(RESPONSE_EVENT, {
      detail: {
        requestId,
        ...(typeof serializedResult === "string"
          ? { resultJson: serializedResult }
          : {}),
        ...response,
      },
    })
  );
  window.postMessage(
    {
      type: RESPONSE_MESSAGE_TYPE,
      requestId,
      ...(typeof serializedResult === "string"
        ? { resultJson: serializedResult }
        : {}),
      ...response,
    },
    "*"
  );
}

function clearFinalizeTimer(stableKey: string): void {
  const timer = finalizationTimers.get(stableKey);
  if (timer) {
    clearTimeout(timer);
    finalizationTimers.delete(stableKey);
  }
}

function scheduleFinalization(stableKey: string, captionId: number): void {
  clearFinalizeTimer(stableKey);
  const timer = window.setTimeout(() => {
    finalizationTimers.delete(stableKey);
    finalizeCaption(captionId);
    void dlsBridgeDiagnostics.debug("assistant_dls_caption_finalized", {
      stableKey,
      captionId,
    }, {
      sessionId: getCurrentSessionSnapshot()?.id,
    });
  }, FINALIZE_DELAY_MS);
  finalizationTimers.set(stableKey, timer);
}

async function ensureCaptureReady() {
  const existingSession = getCurrentSessionSnapshot();
  if (existingSession?.id) {
    return {
      sessionId: existingSession.id,
      platform: existingSession.platform,
      meetingProfileId: existingSession.meetingProfileId || null,
    };
  }

  const currentUrl = new URL(window.location.href);
  const provider =
    getProviderForUrl(currentUrl) || getProviderForPageContext(currentUrl);

  if (!provider) {
    throw new Error("No active meeting provider could be resolved for assistant DLS capture.");
  }

  await dlsBridgeDiagnostics.debug("assistant_dls_capture_ensure_started", {
    providerPlatform: provider.platform,
    providerPresence: provider.getMeetingPresence(),
    meetingPresenceState,
  }, {
    sessionId: existingSession?.id,
  });

  if (provider.getMeetingPresence() !== "joined") {
    throw new Error(
      `Assistant DLS capture requires a joined meeting. Current presence: ${provider.getMeetingPresence()}`
    );
  }

  await platformRuntimeInternals.startMeetingCapture(provider);

  const startedAt = Date.now();
  while (Date.now() - startedAt <= 8000) {
    const session = getCurrentSessionSnapshot();
    if (session?.id) {
      return {
        sessionId: session.id,
        platform: session.platform,
        meetingProfileId: session.meetingProfileId || null,
      };
    }
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }

  throw new Error("Assistant DLS capture could not initialize a meeting session.");
}

async function upsertFixtureCaption(
  request: Extract<CaptureBridgeRequest, { action: "caption" | "update" }>
) {
  const stableKey = normalizeStableKey(request.payload?.stableKey);
  if (!stableKey) {
    throw new Error("Assistant DLS capture requires payload.stableKey.");
  }

  const text = String(request.payload?.text || "").trim();
  if (!text) {
    throw new Error("Assistant DLS capture requires payload.text.");
  }

  await ensureCaptureReady();

  const existingCaptionId = stableKeyToCaptionId.get(stableKey) ?? null;
  const own = Boolean(request.payload?.own);
  const speaker = own
    ? "You"
    : String(request.payload?.speaker || "Participant").trim() || "Participant";
  const timestamp = Date.now();
  const time = new Date(timestamp).toLocaleTimeString();
  const captionId = addOrUpdateCaption(existingCaptionId, speaker, text, {
    providerEventId: stableKey,
    own,
    time,
    timestamp,
    historyTimestamp: timestamp,
    metadata: {
      dlsInjected: true,
      dlsCaptureBridge: true,
      stableKey,
    },
  });

  stableKeyToCaptionId.set(stableKey, captionId);

  if (request.payload?.finalize === true) {
    clearFinalizeTimer(stableKey);
    finalizeCaption(captionId);
  } else {
    scheduleFinalization(stableKey, captionId);
  }

  await dlsBridgeDiagnostics.debug("assistant_dls_caption_upserted", {
    action: request.action,
    stableKey,
    captionId,
    own,
    speaker,
    textLength: text.length,
    finalize: Boolean(request.payload?.finalize),
  }, {
    sessionId: getCurrentSessionSnapshot()?.id,
  });

  return {
    stableKey,
    captionId,
    own,
    speaker,
    textLength: text.length,
    currentSessionId: getCurrentSessionSnapshot()?.id || null,
  };
}

async function finalizeFixtureCaption(
  request: Extract<CaptureBridgeRequest, { action: "finalize" }>
) {
  const stableKey = normalizeStableKey(request.payload?.stableKey);
  if (!stableKey) {
    throw new Error("Assistant DLS capture finalize requires payload.stableKey.");
  }

  const captionId = stableKeyToCaptionId.get(stableKey);
  if (typeof captionId !== "number") {
    throw new Error(`No assistant DLS caption exists for stableKey '${stableKey}'.`);
  }

  clearFinalizeTimer(stableKey);
  finalizeCaption(captionId);
  return {
    stableKey,
    captionId,
  };
}

async function switchFixtureSessionProfile(
  request: Extract<CaptureBridgeRequest, { action: "switch-profile" }>
) {
  const profileId = String(request.payload?.profileId || "").trim();
  if (!profileId) {
    throw new Error("Assistant DLS capture switch-profile requires payload.profileId.");
  }

  await ensureCaptureReady();

  const profileSwitchSucceeded = await setCurrentSessionMeetingProfile(profileId);
  if (!profileSwitchSucceeded) {
    throw new Error(`Assistant DLS capture could not switch the active session profile to '${profileId}'.`);
  }

  if (typeof request.payload?.assistantEnabled === "boolean") {
    const assistantToggleSucceeded = await setCurrentSessionAssistantEnabled(
      request.payload.assistantEnabled
    );
    if (!assistantToggleSucceeded) {
      throw new Error(
        `Assistant DLS capture switched the session profile to '${profileId}', but assistant enabled state could not be updated.`
      );
    }
  }

  return {
    currentSession: getCurrentSessionSnapshot(),
    profileId,
    assistantEnabled:
      typeof request.payload?.assistantEnabled === "boolean"
        ? request.payload.assistantEnabled
        : null,
  };
}

async function resetBridgeState() {
  for (const stableKey of finalizationTimers.keys()) {
    clearFinalizeTimer(stableKey);
  }
  stableKeyToCaptionId.clear();

  await dlsBridgeDiagnostics.info("assistant_dls_capture_bridge_reset", {
    captionCount: captions.length,
  }, {
    sessionId: getCurrentSessionSnapshot()?.id,
  });

  return buildBridgeSnapshot();
}

async function shutdownBridgeRuntime() {
  await dlsBridgeDiagnostics.info("assistant_dls_capture_bridge_shutdown_started", {
    captionCount: captions.length,
  }, {
    sessionId: getCurrentSessionSnapshot()?.id,
  });

  await resetBridgeState();
  await platformRuntimeInternals.teardownPlatformRuntime();

  await dlsBridgeDiagnostics.info("assistant_dls_capture_bridge_shutdown_completed", {
    captionCount: captions.length,
    meetingPresenceState,
  });

  return buildBridgeSnapshot();
}

async function handleBridgeRequest(event: Event): Promise<void> {
  const customEvent = event as CustomEvent<CaptureBridgeRequest | undefined>;
  const request = customEvent.detail;
  if (!request?.requestId || !request.action) {
    return;
  }

  try {
    await dlsBridgeDiagnostics.trace("assistant_dls_capture_bridge_request_received", {
      requestId: request.requestId,
      action: request.action,
    }, {
      sessionId: getCurrentSessionSnapshot()?.id,
    });

    let result: Record<string, unknown>;

    switch (request.action) {
      case "ping":
        result = buildBridgeSnapshot();
        break;
      case "snapshot":
        result = buildBridgeSnapshot();
        break;
      case "reset":
        result = await resetBridgeState();
        break;
      case "ensure-capture":
        result = {
          ...buildBridgeSnapshot(),
          currentSession: await ensureCaptureReady(),
        };
        break;
      case "shutdown":
        result = await shutdownBridgeRuntime();
        break;
      case "caption":
      case "update":
        result = await upsertFixtureCaption(request);
        break;
      case "finalize":
        result = await finalizeFixtureCaption(request);
        break;
      case "switch-profile":
        result = await switchFixtureSessionProfile(request);
        break;
      default:
        throw new Error(`Unsupported assistant DLS capture action '${String(request.action)}'.`);
    }

    dispatchBridgeResponse(request.requestId, {
      ok: true,
      result: toSerializableBridgeResult(result),
    });
  } catch (error) {
    await dlsBridgeDiagnostics.error("assistant_dls_capture_bridge_failed", {
      action: request.action,
      error,
    }, {
      sessionId: getCurrentSessionSnapshot()?.id,
    });
    dispatchBridgeResponse(request.requestId, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function installAssistantDlsCaptureBridge(): void {
  if (bridgeInstalled) {
    return;
  }

  bridgeInstalled = true;
  document.addEventListener(REQUEST_EVENT, (event) => {
    void handleBridgeRequest(event);
  });
  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    const data = event.data as
      | (CaptureBridgeRequest & { type?: string })
      | undefined;

    if (!data || data.type !== REQUEST_MESSAGE_TYPE) {
      return;
    }

    void handleBridgeRequest(
      new CustomEvent(REQUEST_EVENT, {
        detail: {
          requestId: data.requestId,
          action: data.action,
          payload: data.payload,
        },
      })
    );
  });

  void dlsBridgeDiagnostics.info("assistant_dls_capture_bridge_installed", {
    href: window.location.href,
  });
}

export const assistantDlsCaptureBridgeInternals = {
  normalizeStableKey,
  buildBridgeSnapshot,
};
