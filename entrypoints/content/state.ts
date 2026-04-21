import type {
  Caption,
  MeetingAssistantOutput,
  MeetingAssistantPendingOutput,
  MeetingSession,
  Settings,
} from "./types";
import { createDefaultSettings } from "../shared/settings-defaults";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import {
  applyLocaleAttributes,
  getUiRuntimeTranslator,
  resolveUiLocale,
  setUiRuntimeLocale,
} from "../shared/i18n";
import type {
  MeetingPresenceState,
  PlatformEmptyState,
  ProviderCaptureGuide,
} from "./providers/types";

const stateDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "content-state",
});

export const captions: Caption[] = [];
export const liveChatMessages: Caption[] = [];

export let settings: Settings = createDefaultSettings();
void setUiRuntimeLocale(resolveUiLocale(settings.uiLanguage, navigator.language));

export function updateSettings(newSettings: Partial<Settings>) {
  void stateDiagnostics.debug("settings_updated", {
    keys: Object.keys(newSettings),
  });
  settings = { ...settings, ...newSettings };

  const nextLocale = resolveUiLocale(settings.uiLanguage, navigator.language);
  void setUiRuntimeLocale(nextLocale);

  if (overlay) {
    applyLocaleAttributes(nextLocale, overlay);
  }
}

export let captionIdCounter = 0;
export function getNextCaptionId() {
  return ++captionIdCounter;
}

export function resetCaptionIdCounter() {
  captionIdCounter = 0;
}

export let isCCEnabled = false;
export function setCCEnabled(enabled: boolean) {
  void stateDiagnostics.debug("cc_enabled_changed", {
    previous: isCCEnabled,
    next: enabled,
  });
  isCCEnabled = enabled;
}

export type CaptionActivationState = "idle" | "attempting";
export let captionActivationState: CaptionActivationState = "idle";
export function setCaptionActivationState(state: CaptionActivationState) {
  void stateDiagnostics.trace("caption_activation_state_changed", {
    previous: captionActivationState,
    next: state,
  });
  captionActivationState = state;
}

export let meetingPresenceState: MeetingPresenceState = "unknown";
export function setMeetingPresenceState(state: MeetingPresenceState) {
  void stateDiagnostics.debug("meeting_presence_state_changed", {
    previous: meetingPresenceState,
    next: state,
  });
  meetingPresenceState = state;
}

export let activeMeetingPlatform: import("./types").MeetingPlatform | null = null;
export function setActiveMeetingPlatform(
  platform: import("./types").MeetingPlatform | null
) {
  void stateDiagnostics.debug("active_meeting_platform_changed", {
    previous: activeMeetingPlatform,
    next: platform,
  });
  activeMeetingPlatform = platform;
}

function createDefaultEmptyStateMessage(): PlatformEmptyState {
  const t = getUiRuntimeTranslator();

  return {
    waitingTitle: t("content.empty.waitingForCaptionsTitle"),
    waitingBody: t("content.empty.waitingForCaptionsBody"),
  };
}

export let emptyStateMessage: PlatformEmptyState = createDefaultEmptyStateMessage();

export function setEmptyStateMessage(message: PlatformEmptyState) {
  void stateDiagnostics.trace("empty_state_message_changed", {
    waitingTitle: message.waitingTitle,
    waitingBodyLength: message.waitingBody.length,
  });
  emptyStateMessage = message;
}

export const semanticTimers = new Map<number, ReturnType<typeof setTimeout>>();

export function clearSemanticTimer(captionId: number) {
  const timer = semanticTimers.get(captionId);
  if (timer) {
    clearTimeout(timer);
    semanticTimers.delete(captionId);
  }
}

export let overlay: HTMLElement | null = null;
export let captionList: HTMLElement | null = null;
export let assistantSurface: HTMLElement | null = null;
export let assistantSurfaceList: HTMLElement | null = null;
export let waveElement: HTMLElement | null = null;
export let waveTimeout: ReturnType<typeof setTimeout> | null = null;
export let captureGuide: ProviderCaptureGuide | null = null;
export let isCaptureGuideOpen = false;
export let captureGuideElement: HTMLElement | null = null;
export let isMinimized = false;
export type CaptureConsentState = "idle" | "pending" | "approved" | "dismissed";
export let captureConsentState: CaptureConsentState = "idle";
export let savedPosition: {
  left: string;
  top: string;
  width: string;
  height: string;
} | null = null;
export let assistantSurfaceOpen = false;
export let assistantSurfaceHeight = 320;
export let assistantSurfaceVisible = false;
export let assistantSurfaceUnread = false;
export let assistantSurfaceUnreadCount = 0;
export let assistantLiveOutputs: MeetingAssistantOutput[] = [];
export let assistantLivePendingOutputs: MeetingAssistantPendingOutput[] = [];
export let assistantSessionEnabled = false;
export let assistantLiveState:
  | "watching"
  | "triggered"
  | "streaming"
  | "done"
  | "suppressed"
  | "error" = "watching";

export function setOverlay(el: HTMLElement | null) {
  overlay = el;
}

export function setCaptionList(el: HTMLElement | null) {
  captionList = el;
}

export function setAssistantSurface(el: HTMLElement | null) {
  assistantSurface = el;
}

export function setAssistantSurfaceList(el: HTMLElement | null) {
  assistantSurfaceList = el;
}

export function setWaveElement(el: HTMLElement | null) {
  waveElement = el;
}

export function upsertLiveChatMessage(message: Caption): void {
  const existingIndex = liveChatMessages.findIndex(
    (item) => item.messageId === message.messageId
  );
  if (existingIndex >= 0) {
    void stateDiagnostics.trace("live_chat_message_updated", {
      messageId: message.messageId,
      speaker: message.speaker,
      textLength: message.text.length,
    });
    liveChatMessages[existingIndex] = message;
    return;
  }

  void stateDiagnostics.trace("live_chat_message_added", {
    messageId: message.messageId,
    speaker: message.speaker,
    textLength: message.text.length,
  });
  liveChatMessages.push(message);

  const MAX_LIVE_CHAT_MESSAGES = 80;
  if (liveChatMessages.length > MAX_LIVE_CHAT_MESSAGES) {
    liveChatMessages.splice(0, liveChatMessages.length - MAX_LIVE_CHAT_MESSAGES);
  }
}

export function setWaveTimeout(timeout: ReturnType<typeof setTimeout> | null) {
  waveTimeout = timeout;
}

export function setCaptureGuide(guide: ProviderCaptureGuide | null) {
  void stateDiagnostics.trace("capture_guide_changed", {
    hasGuide: Boolean(guide),
  });
  captureGuide = guide;
}

export function setCaptureGuideOpen(open: boolean) {
  void stateDiagnostics.trace("capture_guide_open_changed", {
    previous: isCaptureGuideOpen,
    next: open,
  });
  isCaptureGuideOpen = open;
}

export function setCaptureGuideElement(el: HTMLElement | null) {
  captureGuideElement = el;
}

export function setMinimized(minimized: boolean) {
  void stateDiagnostics.trace("overlay_minimized_changed", {
    previous: isMinimized,
    next: minimized,
  });
  isMinimized = minimized;
}

export function setCaptureConsentState(state: CaptureConsentState) {
  void stateDiagnostics.debug("capture_consent_state_changed", {
    previous: captureConsentState,
    next: state,
  });
  captureConsentState = state;
}

export function setSavedPosition(
  pos: { left: string; top: string; width: string; height: string } | null
) {
  savedPosition = pos;
}

export function setAssistantSurfaceOpen(open: boolean) {
  void stateDiagnostics.trace("assistant_surface_open_changed", {
    previous: assistantSurfaceOpen,
    next: open,
  });
  assistantSurfaceOpen = open;
}

export function setAssistantSurfaceHeight(height: number) {
  assistantSurfaceHeight = height;
}

export function setAssistantSurfaceVisible(visible: boolean) {
  void stateDiagnostics.trace("assistant_surface_visible_changed", {
    previous: assistantSurfaceVisible,
    next: visible,
  });
  assistantSurfaceVisible = visible;
}

export function setAssistantSurfaceUnread(unread: boolean) {
  void stateDiagnostics.trace("assistant_surface_unread_changed", {
    previous: assistantSurfaceUnread,
    next: unread,
  });
  assistantSurfaceUnread = unread;
}

export function setAssistantSurfaceUnreadCount(count: number) {
  void stateDiagnostics.trace("assistant_surface_unread_count_changed", {
    previous: assistantSurfaceUnreadCount,
    next: Math.max(0, count),
  });
  assistantSurfaceUnreadCount = Math.max(0, count);
}

export function setAssistantLiveOutputs(outputs: MeetingAssistantOutput[]) {
  void stateDiagnostics.trace("assistant_live_outputs_replaced", {
    count: outputs.length,
  });
  assistantLiveOutputs = outputs;
}

export function setAssistantLivePendingOutputs(
  outputs: MeetingAssistantPendingOutput[]
) {
  void stateDiagnostics.trace("assistant_live_pending_outputs_replaced", {
    count: outputs.length,
  });
  assistantLivePendingOutputs = outputs;
}

export function setAssistantSessionEnabled(enabled: boolean) {
  void stateDiagnostics.debug("assistant_session_enabled_changed", {
    previous: assistantSessionEnabled,
    next: enabled,
  });
  assistantSessionEnabled = enabled;
}

export function setAssistantLiveState(
  state: "watching" | "triggered" | "streaming" | "done" | "suppressed" | "error"
) {
  void stateDiagnostics.debug("assistant_live_state_changed", {
    previous: assistantLiveState,
    next: state,
  });
  assistantLiveState = state;
}

function clearSemanticTimers(): void {
  semanticTimers.forEach((timer) => clearTimeout(timer));
  semanticTimers.clear();
}

export function resetLiveCaptureState(): void {
  void stateDiagnostics.info("live_capture_state_reset", {
    captionCount: captions.length,
    chatCount: liveChatMessages.length,
    semanticTimerCount: semanticTimers.size,
  });
  captions.length = 0;
  liveChatMessages.length = 0;
  resetCaptionIdCounter();
  isCCEnabled = false;
  captionActivationState = "idle";

  clearSemanticTimers();

  if (waveTimeout) {
    clearTimeout(waveTimeout);
    waveTimeout = null;
  }
}

export function resetContentState(): void {
  void stateDiagnostics.info("content_state_reset", {
    hadOverlay: Boolean(overlay),
    hadAssistantSurface: Boolean(assistantSurface),
    captionCount: captions.length,
    chatCount: liveChatMessages.length,
  });
  resetLiveCaptureState();
  emptyStateMessage = createDefaultEmptyStateMessage();
  captureGuide = null;
  isCaptureGuideOpen = false;
  overlay = null;
  captionList = null;
  assistantSurface = null;
  assistantSurfaceList = null;
  waveElement = null;
  captureGuideElement = null;
  isMinimized = false;
  captureConsentState = "idle";
  meetingPresenceState = "unknown";
  activeMeetingPlatform = null;
  captionActivationState = "idle";
  savedPosition = null;
  assistantSurfaceOpen = false;
  assistantSurfaceHeight = 320;
  assistantSurfaceVisible = false;
  assistantSurfaceUnread = false;
  assistantSurfaceUnreadCount = 0;
  assistantLiveOutputs = [];
  assistantLivePendingOutputs = [];
  assistantSessionEnabled = false;
  assistantLiveState = "watching";
}
