import type {
  MeetingAssistantOutput,
  MeetingAssistantPendingOutput,
  MeetingSession,
  MeetingProfile,
} from "./types";
import {
  getCurrentSessionId,
  setCurrentSessionAssistantEnabled,
} from "./history-service";
import {
  assistantLiveState,
  assistantLiveOutputs,
  assistantSurfaceOpen,
  assistantSessionEnabled,
  assistantSurfaceUnread,
  assistantSurfaceUnreadCount,
  assistantLivePendingOutputs,
  settings,
  setAssistantLivePendingOutputs,
  setAssistantLiveOutputs,
  setAssistantLiveState,
  setAssistantSurfaceUnread,
  setAssistantSurfaceUnreadCount,
  setAssistantSurfaceVisible,
  setAssistantSessionEnabled,
} from "./state";
import { getOpenAiServiceAvailability } from "../shared/openai-service";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";

export const ASSISTANT_LIVE_UPDATED_EVENT = "captionarc:assistant-live-updated";
const ASSISTANT_POLL_INTERVAL_MS = 1200;

const assistantServiceDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "assistant",
  feature: "assistant-service-sync",
});

let assistantPollTimer: number | null = null;

function emitAssistantUpdate(): void {
  window.dispatchEvent(new CustomEvent(ASSISTANT_LIVE_UPDATED_EVENT));
}

function getResolvedMeetingProfile(
  session: MeetingSession | null
): MeetingProfile | null {
  const profileId = session?.meetingProfileId || settings.defaultMeetingProfileId;
  return (
    settings.meetingProfiles.find((profile) => profile.id === profileId) ||
    settings.meetingProfiles[0] ||
    null
  );
}

function getResolvedAssistantEnabled(session: MeetingSession | null): boolean {
  const sessionOverride = session?.artifacts?.assistantState;
  if (typeof sessionOverride?.enabled === "boolean") {
    return sessionOverride.enabled;
  }

  return Boolean(getResolvedMeetingProfile(session)?.assistant.enabledByDefault);
}

function getAssistantOutputs(session: MeetingSession | null): MeetingAssistantOutput[] {
  return Object.values(session?.artifacts?.assistantOutputs || {}).sort(
    (left, right) => left.createdAt - right.createdAt
  );
}

function getAssistantPendingOutputs(
  liveState:
    | {
        pendingOutputs?: MeetingAssistantPendingOutput[];
      }
    | null
): MeetingAssistantPendingOutput[] {
  return [...(liveState?.pendingOutputs || [])].sort(
    (left, right) => left.queuedAt - right.queuedAt
  );
}

function areOutputsEqual(
  left: MeetingAssistantOutput[],
  right: MeetingAssistantOutput[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const other = right[index];
    return (
      item.id === other?.id &&
      item.content === other?.content &&
      item.createdAt === other?.createdAt
    );
  });
}

function arePendingOutputsEqual(
  left: MeetingAssistantPendingOutput[],
  right: MeetingAssistantPendingOutput[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const other = right[index];
    return (
      item.triggerEventId === other?.triggerEventId &&
      item.triggerStableEventKey === other?.triggerStableEventKey &&
      item.triggerText === other?.triggerText &&
      item.queuedAt === other?.queuedAt &&
      item.partialContent === other?.partialContent
    );
  });
}

function applyAssistantSession(
  session: MeetingSession | null,
  liveState:
    | {
        status?:
          | "watching"
          | "triggered"
          | "streaming"
          | "done"
          | "suppressed"
          | "error";
        pendingOutputs?: MeetingAssistantPendingOutput[];
      }
    | null
): void {
  const sessionStatus = liveState?.status;
  const aiAvailability = getOpenAiServiceAvailability(settings);
  const previousOutputs = assistantLiveOutputs;
  const previousPending = assistantLivePendingOutputs;
  const previousState = assistantLiveState;
  const nextOutputs = getAssistantOutputs(session);
  const nextPending = getAssistantPendingOutputs(liveState);
  const outputsChanged = !areOutputsEqual(assistantLiveOutputs, nextOutputs);
  const pendingChanged = !arePendingOutputsEqual(previousPending, nextPending);
  const nextEnabled = getResolvedAssistantEnabled(session);
  const profile = getResolvedMeetingProfile(session);
  const nextVisible = Boolean(profile?.assistant.enabledByDefault);

  void assistantServiceDiagnostics.trace("assistant_service_session_applied", {
    sessionId: session?.id || null,
    nextEnabled,
    nextVisible,
    liveState: sessionStatus || null,
    outputCount: nextOutputs.length,
    pendingCount: nextPending.length,
  }, {
    sessionId: session?.id,
  });

  setAssistantSessionEnabled(nextEnabled);
  setAssistantSurfaceVisible(nextVisible);

  if (outputsChanged) {
    setAssistantLiveOutputs(nextOutputs);
  }

  if (pendingChanged) {
    setAssistantLivePendingOutputs(nextPending);
  }

  if (!nextEnabled) {
    setAssistantLiveState("suppressed");
  } else if (!aiAvailability.operational) {
    setAssistantLiveState("error");
  } else if (sessionStatus === "triggered" || sessionStatus === "streaming") {
    setAssistantLiveState(sessionStatus);
  } else if (sessionStatus === "error") {
    setAssistantLiveState("error");
  } else if (nextOutputs.length > 0) {
    setAssistantLiveState("done");
  } else {
    setAssistantLiveState("watching");
  }

  const nextState =
    !nextEnabled
      ? "suppressed"
      : !aiAvailability.operational
        ? "error"
      : sessionStatus === "triggered" || sessionStatus === "streaming"
        ? sessionStatus
        : sessionStatus === "error"
          ? "error"
          : nextOutputs.length > 0
            ? "done"
            : "watching";

  if (
    !assistantSurfaceOpen &&
    (nextOutputs.length > previousOutputs.length ||
      nextPending.length > previousPending.length ||
      nextState !== previousState)
  ) {
    setAssistantSurfaceUnread(true);
    if (nextOutputs.length > previousOutputs.length) {
      setAssistantSurfaceUnreadCount(
        assistantSurfaceUnreadCount + (nextOutputs.length - previousOutputs.length)
      );
    }
  }

  emitAssistantUpdate();
}

async function pollAssistantState(): Promise<void> {
  const sessionId = getCurrentSessionId();
  if (!sessionId) {
    await assistantServiceDiagnostics.trace("assistant_service_poll_skipped_no_session");
    applyAssistantSession(null, null);
    return;
  }

  await assistantServiceDiagnostics.trace("assistant_service_poll_started", {
    sessionId,
  }, {
    sessionId,
  });

  const [response, liveStateResponse] = await Promise.all([
    chrome.runtime
      .sendMessage({
        action: "getMeetingSession",
        sessionId,
      })
      .catch(() => null),
    chrome.runtime
      .sendMessage({
        action: "getMeetingAssistantLiveState",
        sessionId,
      })
      .catch(() => null),
  ]);

  if (!response?.success || !response.session) {
    await assistantServiceDiagnostics.warn("assistant_service_poll_missing_session", {
      sessionId,
      liveStateAvailable: Boolean(liveStateResponse?.success),
    }, {
      sessionId,
    });
    applyAssistantSession(null, null);
    return;
  }

  await assistantServiceDiagnostics.debug("assistant_service_poll_completed", {
    sessionId,
    outputCount: Object.keys(response.session.artifacts?.assistantOutputs || {}).length,
    liveState: liveStateResponse?.success ? liveStateResponse.liveState?.status || null : null,
  }, {
    sessionId,
  });

  applyAssistantSession(
    response.session as MeetingSession,
    (liveStateResponse?.success ? liveStateResponse.liveState : null) || null
  );
}

export function startAssistantSync(): void {
  stopAssistantSync();
  void assistantServiceDiagnostics.info("assistant_service_sync_started", {
    pollIntervalMs: ASSISTANT_POLL_INTERVAL_MS,
  });
  void pollAssistantState();
  assistantPollTimer = window.setInterval(() => {
    void pollAssistantState();
  }, ASSISTANT_POLL_INTERVAL_MS);
}

export function stopAssistantSync(): void {
  if (assistantPollTimer !== null) {
    void assistantServiceDiagnostics.info("assistant_service_sync_stopped");
    window.clearInterval(assistantPollTimer);
    assistantPollTimer = null;
  }
}

export async function toggleAssistantSessionEnabled(
  enabled: boolean
): Promise<boolean> {
  await assistantServiceDiagnostics.info("assistant_service_toggle_started", {
    enabled,
    sessionId: getCurrentSessionId(),
  }, {
    sessionId: getCurrentSessionId() || undefined,
  });
  if (enabled && !getOpenAiServiceAvailability(settings).operational) {
    setAssistantLivePendingOutputs([]);
    setAssistantLiveState("error");
    emitAssistantUpdate();
    await assistantServiceDiagnostics.warn("assistant_service_toggle_blocked_unavailable", {
      enabled,
    });
    return false;
  }

  const success = await setCurrentSessionAssistantEnabled(enabled);
  if (!success) {
    await assistantServiceDiagnostics.warn("assistant_service_toggle_failed", {
      enabled,
      sessionId: getCurrentSessionId(),
    }, {
      sessionId: getCurrentSessionId() || undefined,
    });
    return false;
  }

  setAssistantSessionEnabled(enabled);
  setAssistantLivePendingOutputs([]);
  setAssistantLiveState(enabled ? "watching" : "suppressed");
  if (!enabled) {
    setAssistantSurfaceUnread(false);
    setAssistantSurfaceUnreadCount(0);
  }
  emitAssistantUpdate();
  await assistantServiceDiagnostics.info("assistant_service_toggle_completed", {
    enabled,
    sessionId: getCurrentSessionId(),
  }, {
    sessionId: getCurrentSessionId() || undefined,
  });
  void pollAssistantState();
  return true;
}

export function clearAssistantUnreadState(): void {
  if (!assistantSurfaceUnread && assistantSurfaceUnreadCount === 0) {
    return;
  }

  void assistantServiceDiagnostics.debug("assistant_service_unread_cleared", {
    unreadCount: assistantSurfaceUnreadCount,
  });

  setAssistantSurfaceUnread(false);
  setAssistantSurfaceUnreadCount(0);
  emitAssistantUpdate();
}

export function syncAssistantAvailabilityFromSettingsOnly(): void {
  if (getCurrentSessionId()) {
    void assistantServiceDiagnostics.trace("assistant_service_availability_sync_deferred_to_session", {
      sessionId: getCurrentSessionId(),
    }, {
      sessionId: getCurrentSessionId() || undefined,
    });
    void pollAssistantState();
    return;
  }

  const defaultProfile = getResolvedMeetingProfile(null);
  const aiAvailability = getOpenAiServiceAvailability(settings);
  setAssistantSurfaceVisible(Boolean(defaultProfile?.assistant.enabledByDefault));
  setAssistantSessionEnabled(Boolean(defaultProfile?.assistant.enabledByDefault));
  setAssistantLivePendingOutputs([]);
  setAssistantSurfaceUnread(false);
  setAssistantSurfaceUnreadCount(0);
  setAssistantLiveState(
    !defaultProfile?.assistant.enabledByDefault
      ? "suppressed"
      : aiAvailability.operational
        ? "watching"
        : "error"
  );
  void assistantServiceDiagnostics.debug("assistant_service_availability_synced_from_settings", {
    hasDefaultProfile: Boolean(defaultProfile),
    operational: aiAvailability.operational,
  });
  emitAssistantUpdate();
}

export const assistantServiceInternals = {
  getResolvedMeetingProfile,
  getResolvedAssistantEnabled,
  getAssistantOutputs,
  getAssistantPendingOutputs,
  applyAssistantSession,
  pollAssistantState,
  getAssistantPollIntervalMs: () => ASSISTANT_POLL_INTERVAL_MS,
};
