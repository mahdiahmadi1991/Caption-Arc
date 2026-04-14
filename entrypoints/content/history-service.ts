import type {
  MeetingSession,
  MeetingEventSource,
  SavedMeetingEvent,
  Caption,
  MeetingEventMetaValue,
} from "./types";
import type { MeetingSessionMetadata } from "./providers/types";
import { debounce } from "./libs";
import {
  captions,
  getNextCaptionId,
  liveChatMessages,
  resetCaptionIdCounter,
  settings,
} from "./state";
import { TranslationStatus } from "./constants";
import {
  buildMeetingSessionSearchableText,
  getSegmentedSessionOffsetMs,
  materializeMeetingSessionCollections,
  sanitizeMeetingSessionIdentifiers,
} from "../shared/meeting-session";
import type { ResolveMeetingSessionRequest } from "../background/types";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";

let currentSession: MeetingSession | null = null;
let getLatestMetadata: (() => MeetingSessionMetadata) | null = null;
let autoSummaryRequestedSessionId: string | null = null;
let pendingSessionMetadata: MeetingSessionMetadata | null = null;
let pendingSessionPreview: Pick<
  MeetingSession,
  | "id"
  | "platform"
  | "providerLabel"
  | "title"
  | "identifiers"
  | "meetingProfileId"
  | "startTime"
  | "rejoinHistory"
> | null = null;
let pendingSessionProfileId: string | null = null;
let pendingSessionProfileLocked = false;

const allEvents = new Map<string, SavedMeetingEvent>();
const contentItemEventIds = new Map<number, string>();

const historyDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "history",
  feature: "meeting-session",
});

function getCurrentSessionOffsetMs(itemTimestamp: number): number | undefined {
  if (!currentSession) {
    return undefined;
  }

  return getSegmentedSessionOffsetMs(
    currentSession.startTime,
    currentSession.rejoinHistory || [],
    itemTimestamp,
    currentSession.endTime
  );
}

function hydrateSessionOffsets(): void {
  if (!currentSession) {
    return;
  }

  allEvents.forEach((event) => {
    event.sessionOffsetMs = getSegmentedSessionOffsetMs(
      currentSession!.startTime,
      currentSession!.rejoinHistory || [],
      event.timestamp,
      currentSession!.endTime
    );
  });
}

function buildSessionEventId(
  source: MeetingEventSource,
  itemId: number,
  providerEventId?: string
): string {
  if (providerEventId?.trim()) {
    return `${source}:${providerEventId.trim()}`;
  }

  const sessionId = currentSession?.id || "pending-session";
  return `${sessionId}:${source}:${itemId}`;
}

function materializeCurrentSessionCollections(): ReturnType<
  typeof materializeMeetingSessionCollections
> {
  if (!currentSession) {
    return { captions: [], chatMessages: [] };
  }

  return materializeMeetingSessionCollections(
    currentSession.startTime,
    Array.from(allEvents.values())
  );
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function hydrateOverlayItemsFromCurrentSession(): void {
  if (!currentSession) {
    resetCaptionIdCounter();
    captions.length = 0;
    liveChatMessages.length = 0;
    return;
  }

  const materialized = materializeCurrentSessionCollections();
  currentSession.captions = materialized.captions;
  currentSession.chatMessages = materialized.chatMessages;

  applyMaterializedCollectionsToOverlay(
    currentSession.captions,
    currentSession.chatMessages
  );
}

async function storeCurrentSessionShell(): Promise<void> {
  if (!currentSession) {
    return;
  }

  refreshSessionMetadata();

  await historyDiagnostics.debug("session_shell_store_started", {
    sessionId: currentSession.id,
    platform: currentSession.platform,
    eventCount: allEvents.size,
  }, {
    sessionId: currentSession.id,
  });

  try {
    await chrome.runtime.sendMessage({
      action: "storeMeetingSessionShell",
      session: currentSession,
    });
  } catch {
    await historyDiagnostics.warn("session_shell_store_failed", {
      sessionId: currentSession.id,
      platform: currentSession.platform,
    }, {
      sessionId: currentSession.id,
    });
    // Initial session shell storage failed silently.
  }
}

function getResolvedDefaultProfileId(): string {
  return settings.defaultMeetingProfileId || settings.meetingProfiles[0]?.id || "";
}

function resolveEffectivePendingSessionProfileId(
  explicitProfileId?: string | null
): string {
  return explicitProfileId?.trim() || pendingSessionProfileId || getResolvedDefaultProfileId();
}

export function setPendingSessionProfileSelection(
  profileId: string | null,
  options?: { locked?: boolean }
): void {
  pendingSessionProfileId = profileId?.trim() || null;
  pendingSessionProfileLocked = Boolean(options?.locked);
}

export function ensurePendingSessionProfileSelection(): void {
  if (pendingSessionProfileId) {
    return;
  }

  const defaultProfileId = getResolvedDefaultProfileId();
  pendingSessionProfileId = defaultProfileId || null;
  pendingSessionProfileLocked = false;
}

export function normalizePendingSessionProfileSelection(): void {
  const validProfileIds = new Set(settings.meetingProfiles.map((profile) => profile.id));
  const defaultProfileId = getResolvedDefaultProfileId();

  if (!pendingSessionProfileId || !validProfileIds.has(pendingSessionProfileId)) {
    pendingSessionProfileId = defaultProfileId || null;
  }

  if (!pendingSessionProfileId) {
    pendingSessionProfileLocked = false;
  }
}

export function getPendingSessionProfileSelection(): {
  profileId: string | null;
  locked: boolean;
} {
  if (currentSession) {
    return {
      profileId: currentSession.meetingProfileId || getResolvedDefaultProfileId() || null,
      locked: true,
    };
  }

  return {
    profileId: pendingSessionProfileId || getResolvedDefaultProfileId() || null,
    locked: pendingSessionProfileLocked,
  };
}

function applyMaterializedCollectionsToOverlay(
  sessionCaptions: MeetingSession["captions"],
  sessionChatMessages: MeetingSession["chatMessages"]
): void {
  resetCaptionIdCounter();
  captions.length = 0;
  liveChatMessages.length = 0;

  captions.push(
    ...sessionCaptions.map((caption) => ({
      id: getNextCaptionId(),
      eventId: caption.eventId,
      providerEventId: caption.providerEventId,
      speaker: caption.speaker,
      text: caption.text,
      formattedHtml: undefined,
      time: caption.time,
      timestamp: caption.timestamp,
      historyTimestamp: caption.timestamp,
      sessionOffsetMs: caption.sessionOffsetMs,
      translation: caption.translation || "",
      translationStatus: caption.translation
        ? TranslationStatus.Semantic
        : TranslationStatus.Pending,
      lastTranslatedLength: caption.translation?.length || 0,
      isFinalized: caption.isFinal,
      source: "caption" as const,
      metadata: undefined,
    }))
  );

  liveChatMessages.push(
    ...sessionChatMessages.map((message) => ({
      id: getNextCaptionId(),
      eventId: message.eventId,
      providerEventId: message.providerEventId,
      messageId: message.providerEventId,
      speaker: message.speaker,
      text: message.text,
      formattedHtml: message.formattedHtml,
      time: message.time,
      timestamp: message.timestamp,
      historyTimestamp: message.timestamp,
      sessionOffsetMs: message.sessionOffsetMs,
      translation: message.translation || "",
      translationStatus: message.translation
        ? TranslationStatus.Semantic
        : TranslationStatus.Pending,
      lastTranslatedLength: message.translation?.length || 0,
      isFinalized: true,
      source: "chat" as const,
      own: message.own,
      metadata: undefined,
    }))
  );
}

export async function loadStoredSessionPreview(
  sessionId: string
): Promise<boolean> {
  await historyDiagnostics.debug("session_preview_load_started", {
    sessionId,
  }, {
    sessionId,
  });

  const response = await chrome.runtime
    .sendMessage({
      action: "getMeetingSession",
      sessionId,
    })
    .catch(() => null);

  if (!response?.success || !response.session) {
    await historyDiagnostics.warn("session_preview_load_missing", {
      sessionId,
      success: response?.success ?? false,
    }, {
      sessionId,
    });
    return false;
  }

  const session = response.session as MeetingSession;
  const materialized = materializeMeetingSessionCollections(
    session.startTime,
    session.events || []
  );

  pendingSessionPreview = {
    id: session.id,
    platform: session.platform,
    providerLabel: session.providerLabel,
    title: session.title,
    identifiers: { ...(session.identifiers || {}) },
    meetingProfileId: session.meetingProfileId,
    startTime: session.startTime,
    rejoinHistory: [...(session.rejoinHistory || [])],
  };

  applyMaterializedCollectionsToOverlay(
    materialized.captions,
    materialized.chatMessages
  );

  await historyDiagnostics.info("session_preview_loaded", {
    sessionId,
    captionCount: materialized.captions.length,
    chatCount: materialized.chatMessages.length,
  }, {
    sessionId,
  });

  return true;
}

function isMeaningfulTitle(title: string | undefined): boolean {
  if (!title) {
    return false;
  }

  const normalized = title.trim();
  if (!normalized) {
    return false;
  }

  return (
    !/^microsoft teams$/i.test(normalized) &&
    !/^teams$/i.test(normalized) &&
    !/^microsoft teams meeting$/i.test(normalized)
  );
}

function getTitleQualityScore(title: string | undefined): number {
  if (!title || !title.trim()) {
    return 0;
  }

  const normalized = title.trim();

  if (
    /^microsoft teams$/i.test(normalized) ||
    /^teams$/i.test(normalized) ||
    /^microsoft teams meeting$/i.test(normalized)
  ) {
    return 1;
  }

  if (/^meeting with /i.test(normalized) || /^call with /i.test(normalized)) {
    return 3;
  }

  return 2;
}

function shouldReplaceTitle(
  currentTitle: string | undefined,
  nextTitle: string | undefined
): boolean {
  if (!nextTitle || !nextTitle.trim()) {
    return false;
  }

  const currentScore = getTitleQualityScore(currentTitle);
  const nextScore = getTitleQualityScore(nextTitle);

  if (nextScore > currentScore) {
    return true;
  }

  if (
    nextScore === currentScore &&
    nextTitle.trim().length > (currentTitle?.trim().length || 0)
  ) {
    return true;
  }

  return !isMeaningfulTitle(currentTitle) && isMeaningfulTitle(nextTitle);
}

function getSessionMetadataUrlQuality(sourceUrl: string | undefined): number {
  if (!sourceUrl?.trim()) {
    return 0;
  }

  try {
    const url = new URL(sourceUrl);
    const normalizedPath = url.pathname.toLowerCase();

    if (url.hostname.endsWith("teams.live.com") && normalizedPath.startsWith("/v2/")) {
      return 3;
    }

    if (
      normalizedPath.startsWith("/meet/") ||
      normalizedPath.includes("/l/meetup-join/") ||
      normalizedPath.startsWith("/j/") ||
      normalizedPath.startsWith("/w/") ||
      normalizedPath.startsWith("/wc/")
    ) {
      return 3;
    }

    return 2;
  } catch {
    return 1;
  }
}

function shouldReplaceSourceUrl(
  currentSourceUrl: string | undefined,
  nextSourceUrl: string | undefined
): boolean {
  if (!nextSourceUrl?.trim()) {
    return false;
  }

  if (!currentSourceUrl?.trim()) {
    return true;
  }

  const currentQuality = getSessionMetadataUrlQuality(currentSourceUrl);
  const nextQuality = getSessionMetadataUrlQuality(nextSourceUrl);

  if (nextQuality > currentQuality) {
    return true;
  }

  if (nextQuality < currentQuality) {
    return false;
  }

  return nextSourceUrl.trim().length > currentSourceUrl.trim().length;
}

function getIdentifierValueQuality(
  key: keyof MeetingSessionMetadata["identifiers"],
  value: string | undefined
): number {
  if (!value?.trim()) {
    return 0;
  }

  const normalized = value.trim();

  if (key === "callType") {
    return 1;
  }

  if (
    /^microsoft teams$/i.test(normalized) ||
    /^teams$/i.test(normalized) ||
    /^microsoft teams meeting$/i.test(normalized)
  ) {
    return 0;
  }

  if (/^(meeting with|call with|meet now|incoming call)\b/i.test(normalized)) {
    return 1;
  }

  if (
    key === "meetingCode" ||
    key === "conferenceId" ||
    key === "threadId" ||
    key === "meetingNumber"
  ) {
    return 3;
  }

  if (/^\d{6,}$/.test(normalized) || /^[0-9a-f-]{8,}$/i.test(normalized)) {
    return 3;
  }

  return 2;
}

function refreshSessionMetadata(): void {
  if (!currentSession || !getLatestMetadata) {
    return;
  }

  const metadata = getLatestMetadata();
  currentSession.platform = metadata.platform;
  currentSession.providerLabel = metadata.providerLabel;
  if (shouldReplaceSourceUrl(currentSession.meetingUrl, metadata.sourceUrl)) {
    currentSession.meetingUrl = metadata.sourceUrl;
  }

  const isTeamsDirectCall =
    metadata.platform === "microsoft-teams" &&
    metadata.identifiers.callType === "direct-call";
  const mergedIdentifiers: typeof currentSession.identifiers = isTeamsDirectCall
    ? {
        callType: "direct-call",
      }
    : {
        ...(currentSession.identifiers || {}),
      };
  if (metadata.identifiers) {
    for (const [key, value] of Object.entries(metadata.identifiers)) {
      const identifierKey = key as keyof typeof mergedIdentifiers;
      const currentValue = mergedIdentifiers[identifierKey];
      const nextValue =
        typeof value === "string" ? value.trim() : value;

      if (
        nextValue !== undefined &&
        nextValue !== null &&
        (typeof nextValue !== "string" || nextValue !== "")
      ) {
        const currentQuality =
          typeof currentValue === "string"
            ? getIdentifierValueQuality(identifierKey, currentValue)
            : 0;
        const nextQuality =
          typeof nextValue === "string"
            ? getIdentifierValueQuality(identifierKey, nextValue)
            : 0;

        if (
          currentValue === undefined ||
          currentValue === null ||
          nextQuality > currentQuality
        ) {
          mergedIdentifiers[identifierKey] = nextValue;
        }
      }
    }
  }
  currentSession.identifiers = sanitizeMeetingSessionIdentifiers(
    metadata.platform,
    mergedIdentifiers
  );

  if (shouldReplaceTitle(currentSession.title, metadata.title)) {
    currentSession.title = metadata.title;
  }
}

export async function initMeetingSession(
  metadata: MeetingSessionMetadata,
  metadataProvider?: () => MeetingSessionMetadata,
  resolveOptions?: Pick<
    ResolveMeetingSessionRequest,
    "reusePolicy" | "resumeSessionId"
  >,
  meetingProfileId?: string
) {
  if (currentSession) return;

  await historyDiagnostics.info("session_init_started", {
    platform: metadata.platform,
    providerLabel: metadata.providerLabel,
    hasResumeSessionId: Boolean(resolveOptions?.resumeSessionId),
    reusePolicy: resolveOptions?.reusePolicy || "default",
    meetingProfileId: meetingProfileId || null,
  });

  pendingSessionMetadata = null;
  pendingSessionPreview = null;
  const effectiveMeetingProfileId = resolveEffectivePendingSessionProfileId(
    meetingProfileId
  );
  const resolvedSession = await chrome.runtime
    .sendMessage({
      action: "resolveMeetingSession",
      platform: metadata.platform,
      providerLabel: metadata.providerLabel,
      sourceUrl: metadata.sourceUrl,
      title: metadata.title,
      identifiers: metadata.identifiers,
      meetingProfileId: effectiveMeetingProfileId,
      reusePolicy: resolveOptions?.reusePolicy,
      resumeSessionId: resolveOptions?.resumeSessionId,
    })
    .catch(() => null);

  currentSession =
    resolvedSession?.success && resolvedSession.session
      ? (resolvedSession.session as MeetingSession)
      : {
          id: generateId(),
          schemaVersion: 3,
          platform: metadata.platform,
          providerLabel: metadata.providerLabel,
          meetingUrl: metadata.sourceUrl,
          title: metadata.title,
          identifiers: metadata.identifiers,
          meetingProfileId: effectiveMeetingProfileId,
          searchableText: "",
          startTime: Date.now(),
          events: [],
          captions: [],
          chatMessages: [],
          summaries: {},
          artifacts: { summaries: {} },
          lifecycleState: "live",
          lastSeenAt: Date.now(),
        };

  await historyDiagnostics.info("session_init_resolved", {
    sessionId: currentSession.id,
    reused: Boolean(resolvedSession?.success && resolvedSession?.session),
    platform: currentSession.platform,
    providerLabel: currentSession.providerLabel,
    existingEventCount: (currentSession.events || []).length,
  }, {
    sessionId: currentSession.id,
  });

  if (!currentSession.meetingProfileId) {
    currentSession.meetingProfileId = effectiveMeetingProfileId;
  }

  getLatestMetadata = metadataProvider || null;

  allEvents.clear();
  for (const event of currentSession.events || []) {
    allEvents.set(event.eventId, { ...event });
  }

  hydrateSessionOffsets();
  hydrateOverlayItemsFromCurrentSession();
  await storeCurrentSessionShell();

  if (allEvents.size > 0) {
    await historyDiagnostics.debug("session_init_existing_events_detected", {
      sessionId: currentSession.id,
      eventCount: allEvents.size,
    }, {
      sessionId: currentSession.id,
    });
    saveCaptionsDebounced();
  }
}

export function addCaptionToHistory(caption: Caption): void {
  void historyDiagnostics.trace("caption_history_upsert", {
    captionId: caption.id,
    source: caption.source,
    hasProviderEventId: Boolean(caption.providerEventId),
    textLength: caption.text.length,
    isFinalized: caption.isFinalized,
  }, {
    sessionId: currentSession?.id,
  });
  upsertOverlayItemInHistory(caption, {
    source: "caption",
    own: caption.own,
    isFinal: caption.isFinalized,
    metadata: caption.metadata,
  });
}

export function updateCaptionInHistory(
  captionId: number,
  updates: Partial<
    Pick<
      Caption,
      | "speaker"
      | "text"
      | "translation"
      | "time"
      | "providerEventId"
      | "metadata"
      | "own"
    >
  > & {
    translationLanguage?: string;
    isFinal?: boolean;
  }
): void {
  const eventId = contentItemEventIds.get(captionId);
  if (!eventId) {
    void historyDiagnostics.trace("caption_history_update_skipped", {
      captionId,
      reason: "missing-event-id",
    }, {
      sessionId: currentSession?.id,
    });
    return;
  }

  const existing = allEvents.get(eventId);
  if (existing) {
    void historyDiagnostics.trace("caption_history_updated", {
      captionId,
      eventId,
      fields: Object.keys(updates),
    }, {
      sessionId: currentSession?.id,
    });
    existing.updatedAt = Date.now();
    if (updates.speaker !== undefined) {
      existing.speaker = updates.speaker;
    }
    if (updates.text !== undefined) {
      existing.text = updates.text;
    }
    if (updates.time !== undefined) {
      existing.time = updates.time;
    }
    if (updates.translation !== undefined) {
      existing.translation = updates.translation;
    }
    if (updates.translationLanguage !== undefined) {
      existing.translationLanguage = updates.translationLanguage;
    }
    if (updates.providerEventId !== undefined) {
      existing.providerEventId = updates.providerEventId;
    }
    if (updates.metadata !== undefined) {
      existing.metadata = updates.metadata;
    }
    if (updates.own !== undefined) {
      existing.own = updates.own;
    }
    if (updates.isFinal !== undefined) {
      existing.isFinal = updates.isFinal;
    }
  }
}

function upsertOverlayItemInHistory(
  item: Caption,
  options: {
    source: MeetingEventSource;
    own?: boolean;
    isFinal?: boolean;
    metadata?: Record<string, MeetingEventMetaValue>;
  }
): void {
  const historyTimestamp = item.historyTimestamp || item.timestamp || Date.now();
  const eventId = buildSessionEventId(
    options.source,
    item.id,
    item.providerEventId || item.messageId
  );
  item.eventId = eventId;
  allEvents.set(eventId, {
    eventId,
    source: options.source,
    speaker: item.speaker,
    text: item.text,
    formattedHtml: item.source === "chat" ? item.formattedHtml : undefined,
    translation: item.translation || undefined,
    translationLanguage: undefined,
    time: item.time,
    timestamp: historyTimestamp,
    sessionOffsetMs:
      item.sessionOffsetMs ?? getCurrentSessionOffsetMs(historyTimestamp),
    providerEventId: item.providerEventId || item.messageId,
    own: options.own,
    isFinal: options.isFinal,
    metadata: options.metadata ?? item.metadata,
    updatedAt: Date.now(),
  });
  contentItemEventIds.set(item.id, eventId);

  void historyDiagnostics.trace("history_event_upserted", {
    sessionId: currentSession?.id,
    eventId,
    source: options.source,
    itemId: item.id,
    totalEvents: allEvents.size,
  }, {
    sessionId: currentSession?.id,
  });
}

export function addChatMessageToHistory(
  chatMessage: Caption,
  options?: {
    metadata?: Record<string, MeetingEventMetaValue>;
  }
): void {
  void historyDiagnostics.trace("chat_history_upsert", {
    captionId: chatMessage.id,
    textLength: chatMessage.text.length,
    own: chatMessage.own,
  }, {
    sessionId: currentSession?.id,
  });
  upsertOverlayItemInHistory(chatMessage, {
    source: "chat",
    own: chatMessage.own,
    isFinal: true,
    metadata: options?.metadata ?? chatMessage.metadata,
  });
  saveCaptionsDebounced();
}

function materializeCurrentSessionForStorage(): MeetingSession | null {
  if (!currentSession) {
    return null;
  }

  refreshSessionMetadata();
  hydrateSessionOffsets();

  currentSession.events = Array.from(allEvents.values()).sort(
    (left, right) => left.timestamp - right.timestamp
  );
  const materialized = materializeCurrentSessionCollections();
  currentSession.captions = materialized.captions;
  currentSession.chatMessages = materialized.chatMessages;
  currentSession.searchableText = buildMeetingSessionSearchableText(
    currentSession
  );
  currentSession.lastSeenAt = Date.now();
  return currentSession;
}

async function saveToStorage(): Promise<void> {
  const session = materializeCurrentSessionForStorage();
  if (!session) return;

  await historyDiagnostics.debug("session_save_started", {
    sessionId: session.id,
    eventCount: (session.events || []).length,
    captionCount: session.captions.length,
    chatCount: session.chatMessages.length,
  }, {
    sessionId: session.id,
  });

  try {
    await chrome.runtime.sendMessage({
      action: "saveMeetingSession",
      session,
    });
    await historyDiagnostics.info("session_save_completed", {
      sessionId: session.id,
      eventCount: (session.events || []).length,
      searchableTextLength: session.searchableText.length,
    }, {
      sessionId: session.id,
    });
  } catch {
    await historyDiagnostics.error("session_save_failed", {
      sessionId: session.id,
      eventCount: (session.events || []).length,
    }, {
      sessionId: session.id,
    });
    // Session save failed silently
  }
}

export const saveCaptionsDebounced = debounce(saveToStorage, 500);

export async function updateSessionEndTime(): Promise<void> {
  const session = materializeCurrentSessionForStorage();
  if (!session) return;
  session.endTime = Date.now();
  session.searchableText = buildMeetingSessionSearchableText(session);

  await historyDiagnostics.info("session_finalize_started", {
    sessionId: session.id,
    eventCount: (session.events || []).length,
    autoSummaryAlreadyRequested: autoSummaryRequestedSessionId === session.id,
  }, {
    sessionId: session.id,
  });

  if (autoSummaryRequestedSessionId === session.id) {
    await saveToStorage();
    return;
  }

  autoSummaryRequestedSessionId = session.id;

  try {
    await chrome.runtime.sendMessage({
      action: "finalizeMeetingSessionEnd",
      session,
      enqueueAutomaticSummary: true,
    });
  } catch {
    await historyDiagnostics.warn("session_finalize_failed", {
      sessionId: session.id,
    }, {
      sessionId: session.id,
    });
    autoSummaryRequestedSessionId = null;
  }
}

export function getCurrentSessionId(): string | null {
  return currentSession?.id || null;
}

export async function setCurrentSessionAssistantEnabled(
  enabled: boolean
): Promise<boolean> {
  const session = materializeCurrentSessionForStorage();
  if (!session) {
    await historyDiagnostics.warn("assistant_toggle_skipped", {
      enabled,
      reason: "missing-session",
    });
    return false;
  }

  session.artifacts = {
    ...(session.artifacts || {}),
    summaries: session.artifacts?.summaries || session.summaries,
    assistantOutputs: session.artifacts?.assistantOutputs,
    assistantMemory: session.artifacts?.assistantMemory,
    assistantState: {
      enabled,
      updatedAt: Date.now(),
    },
  };

  try {
    await chrome.runtime.sendMessage({
      action: "updateMeetingSession",
      sessionId: session.id,
      updates: {
        artifacts: session.artifacts,
      },
    });
    await historyDiagnostics.info("assistant_toggle_completed", {
      sessionId: session.id,
      enabled,
    }, {
      sessionId: session.id,
    });
    return true;
  } catch {
    await historyDiagnostics.error("assistant_toggle_failed", {
      sessionId: session.id,
      enabled,
    }, {
      sessionId: session.id,
    });
    return false;
  }
}

export function getCurrentSessionOffsetForTimestamp(
  itemTimestamp: number
): number | undefined {
  return getCurrentSessionOffsetMs(itemTimestamp);
}

export function getCurrentSessionSnapshot(): Pick<
  MeetingSession,
  | "id"
  | "platform"
  | "providerLabel"
  | "title"
  | "identifiers"
  | "meetingProfileId"
  | "startTime"
  | "rejoinHistory"
> & {
  currentSegmentStartTime: number;
} | null {
  if (!currentSession) {
    return null;
  }

  refreshSessionMetadata();

  const currentSegmentStartTime =
    currentSession.rejoinHistory && currentSession.rejoinHistory.length > 0
      ? currentSession.rejoinHistory[currentSession.rejoinHistory.length - 1].resumedAt
      : currentSession.startTime;

  return {
    id: currentSession.id,
    platform: currentSession.platform,
    providerLabel: currentSession.providerLabel,
    title: currentSession.title,
    identifiers: { ...currentSession.identifiers },
    meetingProfileId: currentSession.meetingProfileId,
    startTime: currentSession.startTime,
    rejoinHistory: [...(currentSession.rejoinHistory || [])],
    currentSegmentStartTime,
  };
}

export function setPendingSessionMetadata(
  metadata: MeetingSessionMetadata | null
): void {
  void historyDiagnostics.debug("pending_session_metadata_updated", {
    hasMetadata: Boolean(metadata),
    platform: metadata?.platform,
    providerLabel: metadata?.providerLabel,
  });
  pendingSessionMetadata = metadata;
}

export function getPendingSessionMetadata(): MeetingSessionMetadata | null {
  if (currentSession) {
    return null;
  }

  return pendingSessionMetadata;
}

export function getPendingSessionPreviewSnapshot(): Pick<
  MeetingSession,
  | "id"
  | "platform"
  | "providerLabel"
  | "title"
  | "identifiers"
  | "meetingProfileId"
  | "startTime"
  | "rejoinHistory"
> | null {
  if (currentSession) {
    return null;
  }

  return pendingSessionPreview;
}

function hydratePendingSessionPreview(session: MeetingSession): void {
  pendingSessionPreview = {
    id: session.id,
    platform: session.platform,
    providerLabel: session.providerLabel,
    title: session.title,
    identifiers: { ...(session.identifiers || {}) },
    meetingProfileId: session.meetingProfileId,
    startTime: session.startTime,
    rejoinHistory: [...(session.rejoinHistory || [])],
  };

  const materialized = materializeMeetingSessionCollections(
    session.startTime,
    session.events || []
  );
  applyMaterializedCollectionsToOverlay(
    materialized.captions,
    materialized.chatMessages
  );
}

export function resetMeetingSession(options?: {
  preservePendingPreview?: boolean;
}): void {
  const pendingPreviewSession =
    options?.preservePendingPreview ? materializeCurrentSessionForStorage() : null;

  void historyDiagnostics.info("session_reset", {
    sessionId: currentSession?.id,
    preservePendingPreview: Boolean(options?.preservePendingPreview),
    hadPendingPreview: Boolean(pendingPreviewSession),
    eventCount: allEvents.size,
  }, {
    sessionId: currentSession?.id,
  });

  currentSession = null;
  pendingSessionMetadata = null;
  getLatestMetadata = null;
  autoSummaryRequestedSessionId = null;
  allEvents.clear();
  contentItemEventIds.clear();
  pendingSessionProfileId = null;
  pendingSessionProfileLocked = false;

  if (pendingPreviewSession) {
    hydratePendingSessionPreview(pendingPreviewSession);
    return;
  }

  pendingSessionPreview = null;
}
