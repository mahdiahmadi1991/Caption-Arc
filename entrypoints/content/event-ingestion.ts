import type { Caption, MeetingEventDraft } from "./types";
import { TranslationStatus } from "./constants";
import { renderCaptions } from "./render";
import { getNextCaptionId, settings, upsertLiveChatMessage } from "./state";
import {
  addChatMessageToHistory,
  getCurrentSessionOffsetForTimestamp,
} from "./history-service";
import { translateCaption } from "./translation";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";

const eventIngestionDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "provider",
  feature: "event-ingestion",
});

function normalizeSpeaker(speaker: string): string {
  const normalized = speaker.trim();
  return normalized || "Unknown";
}

function normalizeText(text: string): string {
  return text.trim();
}

function resolveEventTimestamp(event: MeetingEventDraft): {
  timestamp: number;
  historyTimestamp: number;
} {
  const timestamp = event.timestamp ?? Date.now();
  return {
    timestamp,
    historyTimestamp: event.historyTimestamp ?? timestamp,
  };
}

export function createOverlayItemFromEvent(event: MeetingEventDraft): Caption {
  const { timestamp, historyTimestamp } = resolveEventTimestamp(event);

  void eventIngestionDiagnostics.trace("overlay_item_created_from_event", {
    source: event.source,
    speaker: event.speaker,
    textLength: event.text.length,
    hasTranslation: Boolean(event.translation),
    providerEventId: event.providerEventId || null,
  });

  return {
    id: getNextCaptionId(),
    speaker: normalizeSpeaker(event.speaker),
    text: normalizeText(event.text),
    formattedHtml: event.formattedHtml,
    time: event.time || new Date(timestamp).toLocaleTimeString(),
    timestamp,
    historyTimestamp,
    sessionOffsetMs: getCurrentSessionOffsetForTimestamp(historyTimestamp),
    translation: event.translation || "",
    translationStatus: TranslationStatus.Pending,
    lastTranslatedLength: 0,
    own: event.own,
    source: event.source,
    providerEventId: event.providerEventId,
    messageId: event.source === "chat" ? event.providerEventId : undefined,
    metadata: event.metadata,
    isFinalized:
      typeof event.isFinal === "boolean"
        ? event.isFinal
        : event.source === "chat",
  };
}

export function ingestLiveChatEvent(
  event: Omit<MeetingEventDraft, "source"> & { source?: "chat" }
): Caption {
  void eventIngestionDiagnostics.debug("live_chat_event_ingested", {
    speaker: event.speaker,
    textLength: event.text.length,
    own: event.own,
    providerEventId: event.providerEventId || null,
  });
  const overlayChatMessage = createOverlayItemFromEvent({
    ...event,
    source: "chat",
    isFinal: event.isFinal ?? true,
  });

  upsertLiveChatMessage(overlayChatMessage);
  addChatMessageToHistory(overlayChatMessage);
  renderCaptions();

  if (settings.translationEnabled) {
    void eventIngestionDiagnostics.trace("live_chat_event_translation_requested", {
      messageId: overlayChatMessage.messageId || null,
      targetLanguage: settings.targetLanguage,
    });
    void translateCaption(overlayChatMessage, "semantic");
  }

  return overlayChatMessage;
}
