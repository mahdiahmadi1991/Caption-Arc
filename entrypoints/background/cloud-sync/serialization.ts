import type {
  MeetingAssistantMemorySnapshot,
  MeetingAssistantState,
  MeetingAssistantOutput,
  MeetingEventMetaValue,
  MeetingEventSource,
  MeetingPlatform,
  MeetingSession,
  MeetingSessionIdentifiers,
  MeetingSessionRejoin,
  MeetingSummary,
  SavedMeetingEvent,
  SessionLifecycleState,
} from "../../shared/meeting-session";
import { createTextFingerprint } from "../../shared/meeting-summary";
import type { Settings, SharedSettings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";
import { normalizeLanguageCode } from "../../shared/language-metadata";
import { normalizeMeetingArchiveRetentionDays } from "../../shared/meeting-archive-retention";
import { normalizeSessionContinuationWindowMinutes } from "../../shared/settings-defaults";

export type SerializedSessionMetaPayload = {
  sessionSyncId: string;
  sessionFingerprint?: string;
  updatedAt?: number;
  updatedByDeviceId?: string;
  syncContentHash?: string;
  lifecycleState?: SessionLifecycleState;
  title?: string;
  starred?: boolean;
  platform: MeetingPlatform;
  providerLabel: string;
  meetingUrl: string;
  identifiers: MeetingSessionIdentifiers;
  startTime: number;
  endTime?: number;
  lastSeenAt?: number;
  meetingProfileId?: string;
  rejoinHistory?: MeetingSessionRejoin[];
};

export type SerializedSessionEventsPayload = {
  sessionSyncId: string;
  updatedAt?: number;
  syncContentHash?: string;
  events: SavedMeetingEvent[];
  summaries: Record<string, MeetingSummary>;
  assistantOutputs: Record<string, MeetingAssistantOutput>;
  assistantMemory?: MeetingAssistantMemorySnapshot;
  assistantState?: MeetingAssistantState;
};

export type SerializedSessionEventsChunkDescriptor = {
  index: number;
  eventCount: number;
  contentHash: string;
};

export type SerializedSessionEventsManifestPayload = {
  sessionSyncId: string;
  updatedAt?: number;
  syncContentHash?: string;
  chunkSize: number;
  totalEventCount: number;
  chunks: SerializedSessionEventsChunkDescriptor[];
};

export type SerializedSessionEventsChunkPayload = {
  sessionSyncId: string;
  chunkIndex: number;
  contentHash: string;
  events: SavedMeetingEvent[];
};

export type SerializedSessionArtifactsPayload = {
  sessionSyncId: string;
  updatedAt?: number;
  syncContentHash?: string;
  summaries: Record<string, MeetingSummary>;
  assistantOutputs: Record<string, MeetingAssistantOutput>;
  assistantMemory?: MeetingAssistantMemorySnapshot;
  assistantState?: MeetingAssistantState;
};

type MeetingSessionArtifactsShape = Pick<
  MeetingSession,
  "updatedAt" | "summaries" | "artifacts"
>;

const SESSION_EVENT_CHUNK_SIZE = 100;

function serializeSavedMeetingEvent(
  event: SavedMeetingEvent
): Record<string, unknown> {
  return {
    eventId: event.eventId,
    stableEventKey: event.stableEventKey,
    source: event.source,
    speaker: event.speaker,
    text: event.text,
    formattedHtml: event.formattedHtml,
    translation: event.translation,
    translationLanguage: event.translationLanguage,
    time: event.time,
    timestamp: event.timestamp,
    sessionOffsetMs: event.sessionOffsetMs,
    providerEventId: event.providerEventId,
    own: event.own,
    isFinal: event.isFinal,
    metadata: event.metadata,
    updatedByDeviceId: event.updatedByDeviceId,
    updatedAt: event.updatedAt,
  };
}

function buildSerializedSessionEvents(
  session: Pick<MeetingSession, "events">
): Record<string, unknown>[] {
  return (session.events || []).map((event) => serializeSavedMeetingEvent(event));
}

function buildSessionEventsSyncContentHash(
  session: Pick<MeetingSession, "events">
): string {
  return createTextFingerprint(
    JSON.stringify(buildSerializedSessionEvents(session))
  );
}

function buildSessionEventChunkContentHash(events: SavedMeetingEvent[]): string {
  return createTextFingerprint(
    JSON.stringify(events.map((event) => serializeSavedMeetingEvent(event)))
  );
}

function buildSessionArtifactsSyncContentHash(
  session: MeetingSessionArtifactsShape
): string {
  return createTextFingerprint(
    JSON.stringify({
      summaries: Object.values(session.summaries || {}).map((summary) => ({
        key: summary.key,
        language: summary.language,
        generatedAt: summary.generatedAt,
        content: summary.content,
      })),
      assistantOutputs: Object.values(session.artifacts?.assistantOutputs || {}).map(
        (output) => ({
          id: output.id,
          triggerEventId: output.triggerEventId,
          content: output.content,
          createdAt: output.createdAt,
        })
      ),
      assistantMemory: session.artifacts?.assistantMemory
        ? {
            updatedAt: session.artifacts.assistantMemory.updatedAt,
            content: session.artifacts.assistantMemory.content,
          }
        : undefined,
      assistantState: session.artifacts?.assistantState
        ? {
            enabled: session.artifacts.assistantState.enabled,
            updatedAt: session.artifacts.assistantState.updatedAt,
          }
        : undefined,
    })
  );
}

export function getSessionEventsSyncContentHash(
  session: Pick<MeetingSession, "events">
): string {
  return buildSessionEventsSyncContentHash(session);
}

export function getSessionArtifactsSyncContentHash(
  session: MeetingSessionArtifactsShape
): string {
  return buildSessionArtifactsSyncContentHash(session);
}

function buildSerializedSessionArtifacts(
  session: MeetingSessionArtifactsShape
): Omit<SerializedSessionArtifactsPayload, "sessionSyncId"> {
  return {
    updatedAt: session.updatedAt,
    syncContentHash: buildSessionArtifactsSyncContentHash(session),
    summaries: session.summaries || {},
    assistantOutputs: session.artifacts?.assistantOutputs || {},
    assistantMemory: session.artifacts?.assistantMemory,
    assistantState: session.artifacts?.assistantState
      ? {
          enabled: session.artifacts.assistantState.enabled,
          updatedAt: session.artifacts.assistantState.updatedAt,
        }
      : undefined,
  };
}

export type SerializedDeleteSessionPayload = {
  deletedSessionId: string;
  deletedAt: number;
};

export type SerializedClearArchivePayload = {
  operation: "clear-archive";
  createdAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMeetingPlatform(value: unknown): value is MeetingPlatform {
  return (
    value === "google-meet" ||
    value === "microsoft-teams" ||
    value === "zoom-web"
  );
}

function isMeetingEventSource(value: unknown): value is MeetingEventSource {
  return value === "caption" || value === "chat";
}

function isSessionLifecycleState(value: unknown): value is SessionLifecycleState {
  return value === "live" || value === "ended" || value === "reopened";
}

function sanitizeMeetingIdentifiers(value: unknown): MeetingSessionIdentifiers {
  if (!isRecord(value)) {
    return {};
  }

  return {
    meetingCode:
      typeof value.meetingCode === "string" ? value.meetingCode : undefined,
    meetingId: typeof value.meetingId === "string" ? value.meetingId : undefined,
    conferenceId:
      typeof value.conferenceId === "string" ? value.conferenceId : undefined,
    meetingNumber:
      typeof value.meetingNumber === "string" ? value.meetingNumber : undefined,
    threadId: typeof value.threadId === "string" ? value.threadId : undefined,
    callType:
      value.callType === "scheduled-meeting" || value.callType === "direct-call"
        ? value.callType
        : undefined,
  };
}

function sanitizeMeetingSummaryRecord(
  value: unknown
): Record<string, MeetingSummary> {
  if (!isRecord(value)) {
    return {};
  }

  const entries = Object.entries(value).reduce<Record<string, MeetingSummary>>(
    (result, [key, summaryValue]) => {
      if (!isRecord(summaryValue)) {
        return result;
      }

      const content =
        typeof summaryValue.content === "string" ? summaryValue.content : "";
      const profileId =
        typeof summaryValue.profileId === "string" ? summaryValue.profileId : "";
      const profileName =
        typeof summaryValue.profileName === "string" ? summaryValue.profileName : "";
      const language =
        typeof summaryValue.language === "string" ? summaryValue.language : "en";
      const provider =
        typeof summaryValue.provider === "string" ? summaryValue.provider : "";
      const model =
        typeof summaryValue.model === "string" ? summaryValue.model : "";
      const instructionSnapshot =
        typeof summaryValue.instructionSnapshot === "string"
          ? summaryValue.instructionSnapshot
          : "";
      const sourceFingerprint =
        typeof summaryValue.sourceFingerprint === "string"
          ? summaryValue.sourceFingerprint
          : "";

      result[key] = {
        key:
          typeof summaryValue.key === "string" && summaryValue.key.trim()
            ? summaryValue.key
            : key,
        groupKey:
          typeof summaryValue.groupKey === "string" && summaryValue.groupKey.trim()
            ? summaryValue.groupKey
            : `${profileId}:${language}`,
        profileId,
        profileName,
        language,
        content,
        generatedAt:
          typeof summaryValue.generatedAt === "number"
            ? summaryValue.generatedAt
            : Date.now(),
        provider,
        model,
        instructionSnapshot,
        sourceFingerprint,
        captionCount:
          typeof summaryValue.captionCount === "number"
            ? summaryValue.captionCount
            : 0,
        requestSource:
          summaryValue.requestSource === "automatic" ||
          summaryValue.requestSource === "manual"
            ? summaryValue.requestSource
            : undefined,
        sourceSessionProfileId:
          typeof summaryValue.sourceSessionProfileId === "string"
            ? summaryValue.sourceSessionProfileId
            : undefined,
        sourceSegmentIndex:
          typeof summaryValue.sourceSegmentIndex === "number"
            ? summaryValue.sourceSegmentIndex
            : undefined,
      };
      return result;
    },
    {}
  );

  return entries;
}

function sanitizeMeetingAssistantOutputs(
  value: unknown
): Record<string, MeetingAssistantOutput> {
  if (!isRecord(value)) {
    return {};
  }

  const entries = Object.entries(value).reduce<Record<string, MeetingAssistantOutput>>(
    (result, [key, outputValue]) => {
      if (!isRecord(outputValue)) {
        return result;
      }

      result[key] = {
        id:
          typeof outputValue.id === "string" && outputValue.id.trim()
            ? outputValue.id
            : key,
        triggerEventId:
          typeof outputValue.triggerEventId === "string"
            ? outputValue.triggerEventId
            : "",
        triggerStableEventKey:
          typeof outputValue.triggerStableEventKey === "string"
            ? outputValue.triggerStableEventKey
            : undefined,
        source: outputValue.source === "chat" ? "chat" : "caption",
        speaker:
          typeof outputValue.speaker === "string"
            ? outputValue.speaker
            : "Unknown",
        triggerText:
          typeof outputValue.triggerText === "string"
            ? outputValue.triggerText
            : "",
        triggerTimestamp:
          typeof outputValue.triggerTimestamp === "number"
            ? outputValue.triggerTimestamp
            : Date.now(),
        profileId:
          typeof outputValue.profileId === "string"
            ? outputValue.profileId
            : "",
        content:
          typeof outputValue.content === "string" ? outputValue.content : "",
        createdAt:
          typeof outputValue.createdAt === "number"
            ? outputValue.createdAt
            : Date.now(),
        provider:
          typeof outputValue.provider === "string" ? outputValue.provider : "",
        model: typeof outputValue.model === "string" ? outputValue.model : "",
        responseIntent:
          outputValue.responseIntent === "answer_for_me" ||
          outputValue.responseIntent === "improve_my_answer" ||
          outputValue.responseIntent === "suggest_next_point" ||
          outputValue.responseIntent === "summarize_what_was_just_said" ||
          outputValue.responseIntent === "surface_risks" ||
          outputValue.responseIntent === "coach_me"
            ? outputValue.responseIntent
            : undefined,
        responseFormat:
          outputValue.responseFormat === "bullets" ||
          outputValue.responseFormat === "talking_points" ||
          outputValue.responseFormat === "short_paragraph" ||
          outputValue.responseFormat === "structured_sections" ||
          outputValue.responseFormat === "script"
            ? outputValue.responseFormat
            : undefined,
        responseDepth:
          outputValue.responseDepth === "ultra_brief" ||
          outputValue.responseDepth === "brief" ||
          outputValue.responseDepth === "standard" ||
          outputValue.responseDepth === "expanded"
            ? outputValue.responseDepth
            : undefined,
        responseTone:
          outputValue.responseTone === "neutral" ||
          outputValue.responseTone === "direct" ||
          outputValue.responseTone === "supportive" ||
          outputValue.responseTone === "confident" ||
          outputValue.responseTone === "analytical"
            ? outputValue.responseTone
            : undefined,
        deliveryBias:
          outputValue.deliveryBias === "fastest" ||
          outputValue.deliveryBias === "balanced" ||
          outputValue.deliveryBias === "careful"
            ? outputValue.deliveryBias
            : undefined,
      };
      return result;
    },
    {}
  );

  return entries;
}

function sanitizeMeetingAssistantMemory(
  value: unknown
): MeetingAssistantMemorySnapshot | undefined {
  if (!isRecord(value) || typeof value.content !== "string") {
    return undefined;
  }

  return {
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : Date.now(),
    content: value.content,
    sourceEventCount:
      typeof value.sourceEventCount === "number"
        ? value.sourceEventCount
        : undefined,
  };
}

function sanitizeMeetingAssistantState(
  value: unknown
): MeetingAssistantState | undefined {
  if (!isRecord(value) || typeof value.enabled !== "boolean") {
    return undefined;
  }

  return {
    enabled: value.enabled,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : Date.now(),
  };
}

function sanitizeMeetingSessionRejoinHistory(
  value: unknown
): MeetingSessionRejoin[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value
    .filter(isRecord)
    .map((entry) => {
      if (
        typeof entry.previousEndTime !== "number" ||
        typeof entry.resumedAt !== "number"
      ) {
        return null;
      }

      return {
        previousEndTime: entry.previousEndTime,
        resumedAt: entry.resumedAt,
        gapMs:
          typeof entry.gapMs === "number"
            ? Math.max(0, entry.gapMs)
            : Math.max(0, entry.resumedAt - entry.previousEndTime),
      } satisfies MeetingSessionRejoin;
    })
    .filter((entry): entry is MeetingSessionRejoin => Boolean(entry))
    .sort((left, right) => left.resumedAt - right.resumedAt);

  return entries.length > 0 ? entries : undefined;
}

function sanitizeMeetingEventMeta(
  value: unknown
): Record<string, MeetingEventMetaValue> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const result: Record<string, MeetingEventMetaValue> = {};

  Object.entries(value).forEach(([key, metaValue]) => {
    if (
      typeof metaValue === "string" ||
      typeof metaValue === "number" ||
      typeof metaValue === "boolean" ||
      metaValue === null
    ) {
      result[key] = metaValue;
    }
  });

  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeSavedMeetingEvent(value: unknown): SavedMeetingEvent | null {
  if (!isRecord(value) || typeof value.eventId !== "string" || !isMeetingEventSource(value.source)) {
    return null;
  }

  return {
    eventId: value.eventId,
    stableEventKey:
      typeof value.stableEventKey === "string" ? value.stableEventKey : undefined,
    source: value.source,
    speaker: typeof value.speaker === "string" ? value.speaker : "Unknown",
    text: typeof value.text === "string" ? value.text : "",
    formattedHtml:
      typeof value.formattedHtml === "string" ? value.formattedHtml : undefined,
    translation:
      typeof value.translation === "string" ? value.translation : undefined,
    translationLanguage:
      typeof value.translationLanguage === "string"
        ? value.translationLanguage
        : undefined,
    time: typeof value.time === "string" ? value.time : "",
    timestamp:
      typeof value.timestamp === "number" ? value.timestamp : Date.now(),
    sessionOffsetMs:
      typeof value.sessionOffsetMs === "number" ? value.sessionOffsetMs : undefined,
    providerEventId:
      typeof value.providerEventId === "string" ? value.providerEventId : undefined,
    own: typeof value.own === "boolean" ? value.own : undefined,
    isFinal: typeof value.isFinal === "boolean" ? value.isFinal : undefined,
    metadata: sanitizeMeetingEventMeta(value.metadata),
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : undefined,
    updatedByDeviceId:
      typeof value.updatedByDeviceId === "string"
        ? value.updatedByDeviceId
        : undefined,
  };
}

export function buildSharedSettingsPayload(settings: Settings): SharedSettings {
  return {
    model: settings.model,
    targetLanguage: settings.targetLanguage,
    translationEnabled: settings.translationEnabled,
    customPrompt: settings.customPrompt,
    meetingOutputLanguage: settings.meetingOutputLanguage,
    meetingArchiveRetentionDays: settings.meetingArchiveRetentionDays,
    meetingProfiles: settings.meetingProfiles.map((profile) => ({
      ...profile,
      assistant: { ...profile.assistant },
    })),
    defaultMeetingProfileId: settings.defaultMeetingProfileId,
    appearance: settings.appearance,
    overlayVisible: settings.overlayVisible,
    captureStartupBehavior: settings.captureStartupBehavior,
    captionActivationBehavior: settings.captionActivationBehavior,
    sessionContinuationWindowMinutes: settings.sessionContinuationWindowMinutes,
    overlayOpacity: settings.overlayOpacity,
    overlayClickThrough: settings.overlayClickThrough,
    storeMeetingChat: settings.storeMeetingChat,
    legalRiskAcknowledgements: { ...settings.legalRiskAcknowledgements },
  };
}

export function buildDeviceProfilePayload(settings: Settings): {
  deviceId: string;
  deviceLabel: string;
  connectedCloudProviders: Settings["connectedCloudProviders"];
} {
  return {
    deviceId: settings.deviceId,
    deviceLabel: settings.deviceLabel,
    connectedCloudProviders: [...settings.connectedCloudProviders],
  };
}

export function buildSessionMetaPayload(session: MeetingSession): Record<string, unknown> {
  return {
    sessionSyncId: session.sessionSyncId || session.id,
    sessionFingerprint: session.sessionFingerprint,
    updatedAt: session.updatedAt,
    updatedByDeviceId: session.updatedByDeviceId,
    syncContentHash: session.syncContentHash,
    lifecycleState: session.lifecycleState,
    title: session.title,
    starred: session.starred,
    platform: session.platform,
    providerLabel: session.providerLabel,
    meetingUrl: session.meetingUrl,
    identifiers: session.identifiers,
    startTime: session.startTime,
    endTime: session.endTime,
    lastSeenAt: session.lastSeenAt,
    meetingProfileId: session.meetingProfileId,
    rejoinHistory: session.rejoinHistory,
    summaryKeys: Object.keys(session.summaries || {}),
    eventCount: (session.events || []).length,
  };
}

export function buildSessionEventsPayload(
  session: MeetingSession
): Record<string, unknown> {
  return {
    sessionSyncId: session.sessionSyncId || session.id,
    updatedAt: session.updatedAt,
    syncContentHash: buildSessionEventsSyncContentHash(session),
    events: buildSerializedSessionEvents(session),
  };
}

export function buildSessionEventsChunkPayloads(session: MeetingSession): {
  manifest: SerializedSessionEventsManifestPayload;
  chunks: SerializedSessionEventsChunkPayload[];
} {
  const sessionSyncId = session.sessionSyncId || session.id;
  const events = (session.events || []).map((event) => ({
    ...event,
  }));
  const chunks: SerializedSessionEventsChunkPayload[] = [];

  for (let index = 0; index < events.length; index += SESSION_EVENT_CHUNK_SIZE) {
    const chunkEvents = events.slice(index, index + SESSION_EVENT_CHUNK_SIZE);
    const chunkIndex = Math.floor(index / SESSION_EVENT_CHUNK_SIZE);
    chunks.push({
      sessionSyncId,
      chunkIndex,
      contentHash: buildSessionEventChunkContentHash(chunkEvents),
      events: chunkEvents,
    });
  }

  return {
    manifest: {
      sessionSyncId,
      updatedAt: session.updatedAt,
      syncContentHash: buildSessionEventsSyncContentHash(session),
      chunkSize: SESSION_EVENT_CHUNK_SIZE,
      totalEventCount: events.length,
      chunks: chunks.map((chunk) => ({
        index: chunk.chunkIndex,
        eventCount: chunk.events.length,
        contentHash: chunk.contentHash,
      })),
    },
    chunks,
  };
}

export function buildSessionArtifactsPayload(
  session: MeetingSession
): Record<string, unknown> {
  return {
    sessionSyncId: session.sessionSyncId || session.id,
    ...buildSerializedSessionArtifacts(session),
  };
}

export function buildDeleteSessionPayload(sessionId: string): Record<string, unknown> {
  return {
    deletedSessionId: sessionId,
    deletedAt: Date.now(),
  };
}

export function buildClearArchivePayload(): Record<string, unknown> {
  return {
    operation: "clear-archive",
    createdAt: Date.now(),
  };
}

export function parseSharedSettingsPayload(payload: unknown): SharedSettings | null {
  if (!isRecord(payload)) {
    return null;
  }

  const fallback = buildSharedSettingsPayload(DEFAULT_SETTINGS);
  const rawMeetingProfiles = Array.isArray(payload.meetingProfiles)
    ? payload.meetingProfiles
    : null;

  return {
    model: typeof payload.model === "string" ? payload.model : fallback.model,
    targetLanguage: normalizeLanguageCode(
      payload.targetLanguage,
      fallback.targetLanguage
    ),
    translationEnabled:
      typeof payload.translationEnabled === "boolean"
        ? payload.translationEnabled
        : fallback.translationEnabled,
    customPrompt:
      typeof payload.customPrompt === "string"
        ? payload.customPrompt
        : fallback.customPrompt,
    meetingOutputLanguage: normalizeLanguageCode(
      payload.meetingOutputLanguage,
      fallback.meetingOutputLanguage
    ),
    meetingArchiveRetentionDays: normalizeMeetingArchiveRetentionDays(
      typeof payload.meetingArchiveRetentionDays === "number"
        ? payload.meetingArchiveRetentionDays
        : fallback.meetingArchiveRetentionDays
    ),
    meetingProfiles: Array.isArray(rawMeetingProfiles)
      ? rawMeetingProfiles.filter(isRecord).map((profile, index) => ({
          id:
            typeof profile.id === "string" && profile.id.trim()
              ? profile.id
              : `remote-profile-${index}`,
          name: typeof profile.name === "string" ? profile.name : "Imported Profile",
          description:
            typeof profile.description === "string" ? profile.description : "",
          prompt: typeof profile.prompt === "string" ? profile.prompt : "",
          summaryGenerationMode:
            profile.summaryGenerationMode === "economy" ||
            profile.summaryGenerationMode === "balanced" ||
            profile.summaryGenerationMode === "thorough"
              ? profile.summaryGenerationMode
              : undefined,
          assistant:
            typeof profile.assistant === "object" && profile.assistant !== null
              ? {
                  enabledByDefault:
                    typeof profile.assistant.enabledByDefault === "boolean"
                      ? profile.assistant.enabledByDefault
                      : undefined,
                  prompt:
                    typeof profile.assistant.prompt === "string"
                      ? profile.assistant.prompt
                      : undefined,
                  responseIntent:
                    profile.assistant.responseIntent === "answer_for_me" ||
                    profile.assistant.responseIntent === "improve_my_answer" ||
                    profile.assistant.responseIntent === "suggest_next_point" ||
                    profile.assistant.responseIntent ===
                      "summarize_what_was_just_said" ||
                    profile.assistant.responseIntent === "surface_risks" ||
                    profile.assistant.responseIntent === "coach_me"
                      ? profile.assistant.responseIntent
                      : undefined,
                  responseFormat:
                    profile.assistant.responseFormat === "bullets" ||
                    profile.assistant.responseFormat === "talking_points" ||
                    profile.assistant.responseFormat === "short_paragraph" ||
                    profile.assistant.responseFormat === "structured_sections" ||
                    profile.assistant.responseFormat === "script"
                      ? profile.assistant.responseFormat
                      : undefined,
                  responseDepth:
                    profile.assistant.responseDepth === "ultra_brief" ||
                    profile.assistant.responseDepth === "brief" ||
                    profile.assistant.responseDepth === "standard" ||
                    profile.assistant.responseDepth === "expanded"
                      ? profile.assistant.responseDepth
                      : undefined,
                  responseTone:
                    profile.assistant.responseTone === "neutral" ||
                    profile.assistant.responseTone === "direct" ||
                    profile.assistant.responseTone === "supportive" ||
                    profile.assistant.responseTone === "confident" ||
                    profile.assistant.responseTone === "analytical"
                      ? profile.assistant.responseTone
                      : undefined,
                  deliveryBias:
                    profile.assistant.deliveryBias === "fastest" ||
                    profile.assistant.deliveryBias === "balanced" ||
                    profile.assistant.deliveryBias === "careful"
                      ? profile.assistant.deliveryBias
                      : undefined,
                  triggerPolicy:
                    profile.assistant.triggerPolicy ===
                      "questions_requests_only" ||
                    profile.assistant.triggerPolicy === "salience_first" ||
                    profile.assistant.triggerPolicy === "proactive"
                      ? profile.assistant.triggerPolicy
                      : undefined,
                  participantScope:
                    profile.assistant.participantScope === "all_participants" ||
                    profile.assistant.participantScope === "others_only"
                      ? profile.assistant.participantScope
                      : undefined,
                }
              : undefined,
        }))
      : fallback.meetingProfiles,
    defaultMeetingProfileId:
      typeof payload.defaultMeetingProfileId === "string"
        ? payload.defaultMeetingProfileId
        : fallback.defaultMeetingProfileId,
    appearance:
      payload.appearance === "light" ||
      payload.appearance === "dark" ||
      payload.appearance === "system"
        ? payload.appearance
        : fallback.appearance,
    overlayVisible:
      typeof payload.overlayVisible === "boolean"
        ? payload.overlayVisible
        : fallback.overlayVisible,
    captureStartupBehavior:
      payload.captureStartupBehavior === "off" ||
      payload.captureStartupBehavior === "always"
        ? payload.captureStartupBehavior
        : fallback.captureStartupBehavior,
    captionActivationBehavior:
      payload.captionActivationBehavior === "automatic"
        ? "automatic"
        : fallback.captionActivationBehavior,
    sessionContinuationWindowMinutes:
      normalizeSessionContinuationWindowMinutes(
        typeof payload.sessionContinuationWindowMinutes === "number"
          ? payload.sessionContinuationWindowMinutes
          : fallback.sessionContinuationWindowMinutes
      ),
    overlayOpacity:
      typeof payload.overlayOpacity === "number"
        ? payload.overlayOpacity
        : fallback.overlayOpacity,
    overlayClickThrough:
      typeof payload.overlayClickThrough === "boolean"
        ? payload.overlayClickThrough
        : fallback.overlayClickThrough,
    storeMeetingChat:
      typeof payload.storeMeetingChat === "boolean"
        ? payload.storeMeetingChat
        : fallback.storeMeetingChat,
    legalRiskAcknowledgements:
      typeof payload.legalRiskAcknowledgements === "object" &&
      payload.legalRiskAcknowledgements !== null
        ? {
            ...(typeof payload.legalRiskAcknowledgements.storeMeetingChat === "number"
              ? {
                  storeMeetingChat:
                    payload.legalRiskAcknowledgements.storeMeetingChat,
                }
              : {}),
            ...(typeof payload.legalRiskAcknowledgements.captureStartupAlways === "number"
              ? {
                  captureStartupAlways:
                    payload.legalRiskAcknowledgements.captureStartupAlways,
                }
              : {}),
            ...(typeof payload.legalRiskAcknowledgements
              .captionActivationAutomatic === "number"
              ? {
                  captionActivationAutomatic:
                    payload.legalRiskAcknowledgements
                      .captionActivationAutomatic,
                }
              : {}),
          }
        : fallback.legalRiskAcknowledgements,
  };
}

export function parseSessionMetaPayload(
  payload: unknown
): SerializedSessionMetaPayload | null {
  if (
    !isRecord(payload) ||
    typeof payload.sessionSyncId !== "string" ||
    !isMeetingPlatform(payload.platform) ||
    typeof payload.providerLabel !== "string" ||
    typeof payload.startTime !== "number"
  ) {
    return null;
  }

  return {
    sessionSyncId: payload.sessionSyncId,
    sessionFingerprint:
      typeof payload.sessionFingerprint === "string"
        ? payload.sessionFingerprint
        : undefined,
    updatedAt: typeof payload.updatedAt === "number" ? payload.updatedAt : undefined,
    updatedByDeviceId:
      typeof payload.updatedByDeviceId === "string"
        ? payload.updatedByDeviceId
        : undefined,
    syncContentHash:
      typeof payload.syncContentHash === "string"
        ? payload.syncContentHash
        : undefined,
    lifecycleState: isSessionLifecycleState(payload.lifecycleState)
      ? payload.lifecycleState
      : undefined,
    title: typeof payload.title === "string" ? payload.title : undefined,
    starred: typeof payload.starred === "boolean" ? payload.starred : undefined,
    platform: payload.platform,
    providerLabel: payload.providerLabel,
    meetingUrl: typeof payload.meetingUrl === "string" ? payload.meetingUrl : "",
    identifiers: sanitizeMeetingIdentifiers(payload.identifiers),
    startTime: payload.startTime,
    endTime: typeof payload.endTime === "number" ? payload.endTime : undefined,
    lastSeenAt:
      typeof payload.lastSeenAt === "number" ? payload.lastSeenAt : undefined,
    meetingProfileId:
      typeof payload.meetingProfileId === "string"
        ? payload.meetingProfileId
        : undefined,
    rejoinHistory: sanitizeMeetingSessionRejoinHistory(payload.rejoinHistory),
  };
}

export function parseSessionEventsPayload(
  payload: unknown
): SerializedSessionEventsPayload | null {
  if (!isRecord(payload) || typeof payload.sessionSyncId !== "string") {
    return null;
  }

  return {
    sessionSyncId: payload.sessionSyncId,
    updatedAt: typeof payload.updatedAt === "number" ? payload.updatedAt : undefined,
    syncContentHash:
      typeof payload.syncContentHash === "string"
        ? payload.syncContentHash
        : undefined,
    events: Array.isArray(payload.events)
      ? payload.events
          .map((event) => sanitizeSavedMeetingEvent(event))
          .filter((event): event is SavedMeetingEvent => Boolean(event))
      : [],
    summaries: sanitizeMeetingSummaryRecord(payload.summaries),
    assistantOutputs: sanitizeMeetingAssistantOutputs(payload.assistantOutputs),
    assistantMemory: sanitizeMeetingAssistantMemory(payload.assistantMemory),
      assistantState: sanitizeMeetingAssistantState(payload.assistantState),
  };
}

export function parseSessionEventsManifestPayload(
  payload: unknown
): SerializedSessionEventsManifestPayload | null {
  if (!isRecord(payload) || typeof payload.sessionSyncId !== "string") {
    return null;
  }

  const rawChunks = Array.isArray(payload.chunks) ? payload.chunks : [];
  const chunks = rawChunks
    .map((chunk) => {
      if (
        !isRecord(chunk) ||
        typeof chunk.index !== "number" ||
        typeof chunk.eventCount !== "number" ||
        typeof chunk.contentHash !== "string"
      ) {
        return null;
      }

      return {
        index: chunk.index,
        eventCount: chunk.eventCount,
        contentHash: chunk.contentHash,
      };
    })
    .filter(
      (
        chunk
      ): chunk is SerializedSessionEventsChunkDescriptor => Boolean(chunk)
    )
    .sort((left, right) => left.index - right.index);

  return {
    sessionSyncId: payload.sessionSyncId,
    updatedAt: typeof payload.updatedAt === "number" ? payload.updatedAt : undefined,
    syncContentHash:
      typeof payload.syncContentHash === "string"
        ? payload.syncContentHash
        : undefined,
    chunkSize: typeof payload.chunkSize === "number" ? payload.chunkSize : 0,
    totalEventCount:
      typeof payload.totalEventCount === "number" ? payload.totalEventCount : 0,
    chunks,
  };
}

export function parseSessionEventsChunkPayload(
  payload: unknown
): SerializedSessionEventsChunkPayload | null {
  if (
    !isRecord(payload) ||
    typeof payload.sessionSyncId !== "string" ||
    typeof payload.chunkIndex !== "number"
  ) {
    return null;
  }

  return {
    sessionSyncId: payload.sessionSyncId,
    chunkIndex: payload.chunkIndex,
    contentHash:
      typeof payload.contentHash === "string" ? payload.contentHash : "",
    events: Array.isArray(payload.events)
      ? payload.events
          .map((event) => sanitizeSavedMeetingEvent(event))
          .filter((event): event is SavedMeetingEvent => Boolean(event))
      : [],
  };
}

export function parseSessionArtifactsPayload(
  payload: unknown
): SerializedSessionArtifactsPayload | null {
  if (!isRecord(payload) || typeof payload.sessionSyncId !== "string") {
    return null;
  }

  return {
    sessionSyncId: payload.sessionSyncId,
    updatedAt: typeof payload.updatedAt === "number" ? payload.updatedAt : undefined,
    syncContentHash:
      typeof payload.syncContentHash === "string"
        ? payload.syncContentHash
        : undefined,
    summaries: sanitizeMeetingSummaryRecord(payload.summaries),
    assistantOutputs: sanitizeMeetingAssistantOutputs(payload.assistantOutputs),
    assistantMemory: sanitizeMeetingAssistantMemory(payload.assistantMemory),
    assistantState: sanitizeMeetingAssistantState(payload.assistantState),
  };
}

export function parseDeleteSessionPayload(
  payload: unknown
): SerializedDeleteSessionPayload | null {
  if (
    !isRecord(payload) ||
    typeof payload.deletedSessionId !== "string" ||
    typeof payload.deletedAt !== "number"
  ) {
    return null;
  }

  return {
    deletedSessionId: payload.deletedSessionId,
    deletedAt: payload.deletedAt,
  };
}

export function parseClearArchivePayload(
  payload: unknown
): SerializedClearArchivePayload | null {
  if (
    !isRecord(payload) ||
    payload.operation !== "clear-archive" ||
    typeof payload.createdAt !== "number"
  ) {
    return null;
  }

  return {
    operation: "clear-archive",
    createdAt: payload.createdAt,
  };
}
