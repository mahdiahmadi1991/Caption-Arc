import type {
  SummaryExecutionStrategy,
  SummaryGenerationMode,
} from "./summary-generation";
import type {
  AssistantDeliveryBias,
  AssistantResponseDepth,
  AssistantResponseFormat,
  AssistantResponseIntent,
  AssistantResponseTone,
} from "./meeting-profiles";

export type MeetingPlatform = "google-meet" | "microsoft-teams" | "zoom-web";
export type MeetingEventSource = "caption" | "chat";
export type MeetingEventMetaValue = string | number | boolean | null;
export type SessionLifecycleState = "live" | "ended" | "reopened";

export type MeetingSessionIdentifiers = {
  meetingCode?: string;
  meetingId?: string;
  conferenceId?: string;
  meetingNumber?: string;
  threadId?: string;
  callType?: "scheduled-meeting" | "direct-call";
};

export type MeetingSessionRejoin = {
  previousEndTime: number;
  resumedAt: number;
  gapMs: number;
};

export type MeetingSessionTimelineSegment = {
  index: number;
  startTime: number;
  endTime?: number;
  isContinuation: boolean;
  resumedAt?: number;
  previousEndTime?: number;
  gapMs: number;
};

export type SavedCaption = {
  eventId?: string;
  stableEventKey?: string;
  providerEventId?: string;
  speaker: string;
  text: string;
  translation?: string;
  translationLanguage?: string;
  time: string;
  timestamp: number;
  sessionOffsetMs?: number;
  isFinal?: boolean;
  updatedAt?: number;
  updatedByDeviceId?: string;
};

export type SavedChatMessage = {
  eventId?: string;
  stableEventKey?: string;
  providerEventId?: string;
  speaker: string;
  text: string;
  formattedHtml?: string;
  translation?: string;
  translationLanguage?: string;
  time: string;
  timestamp: number;
  sessionOffsetMs?: number;
  own?: boolean;
  updatedAt?: number;
  updatedByDeviceId?: string;
};

export type SavedMeetingEvent = {
  eventId: string;
  stableEventKey?: string;
  source: MeetingEventSource;
  speaker: string;
  text: string;
  formattedHtml?: string;
  translation?: string;
  translationLanguage?: string;
  time: string;
  timestamp: number;
  sessionOffsetMs?: number;
  providerEventId?: string;
  own?: boolean;
  isFinal?: boolean;
  metadata?: Record<string, MeetingEventMetaValue>;
  updatedAt?: number;
  updatedByDeviceId?: string;
};

export type MeetingEventDraft = {
  source: MeetingEventSource;
  speaker: string;
  text: string;
  formattedHtml?: string;
  time?: string;
  timestamp?: number;
  historyTimestamp?: number;
  translation?: string;
  translationLanguage?: string;
  providerEventId?: string;
  own?: boolean;
  isFinal?: boolean;
  metadata?: Record<string, MeetingEventMetaValue>;
};

export type MeetingSummary = {
  key: string;
  groupKey: string;
  profileId: string;
  profileName: string;
  language: string;
  content: string;
  generatedAt: number;
  provider: string;
  model: string;
  instructionSnapshot: string;
  sourceFingerprint: string;
  captionCount: number;
  generationMode?: SummaryGenerationMode;
  requestSource?: "automatic" | "manual";
  sourceSessionProfileId?: string;
  executionStrategy?: SummaryExecutionStrategy;
  continuationCount?: number;
  evidenceChunkCount?: number;
  reconciled?: boolean;
};

export type MeetingAssistantOutput = {
  id: string;
  triggerEventId: string;
  triggerStableEventKey?: string;
  source: MeetingEventSource;
  speaker: string;
  triggerText: string;
  triggerTimestamp: number;
  profileId: string;
  content: string;
  createdAt: number;
  provider: string;
  model: string;
  responseIntent?: AssistantResponseIntent;
  responseFormat?: AssistantResponseFormat;
  responseDepth?: AssistantResponseDepth;
  responseTone?: AssistantResponseTone;
  deliveryBias?: AssistantDeliveryBias;
};

export type MeetingAssistantMemorySnapshot = {
  updatedAt: number;
  content: string;
  sourceEventCount?: number;
};

export type MeetingAssistantPendingOutput = {
  triggerEventId: string;
  triggerStableEventKey?: string;
  source: MeetingEventSource;
  speaker: string;
  triggerText: string;
  queuedAt: number;
  partialContent?: string;
};

export type MeetingAssistantState = {
  enabled: boolean;
  updatedAt: number;
};

export type MeetingSessionDerivedData = {
  searchableText: string;
  captionCount: number;
  chatMessageCount: number;
  translatedCaptionCount: number;
  previewCaptions: SavedCaption[];
  previewChatMessages: SavedChatMessage[];
  lastEventTimestamp?: number;
};

export type MeetingSessionArtifacts = {
  summaries?: Record<string, MeetingSummary>;
  assistantOutputs?: Record<string, MeetingAssistantOutput>;
  assistantMemory?: MeetingAssistantMemorySnapshot;
  assistantState?: MeetingAssistantState;
};

export type MeetingSessionExtractionCoverage = {
  eventsWithMetadata: number;
  eventsWithProviderEventId: number;
  eventsWithSessionOffset: number;
  translatedEvents: number;
  finalCaptionEvents: number;
};

export type MeetingSessionExtractionIntegrity = {
  eventLogFingerprint: string;
  searchableTextFingerprint: string;
  summaryFingerprint: string;
};

export type MeetingSessionExtractionReport = {
  generatedAt: number;
  schemaVersion: number;
  sessionId: string;
  sessionFingerprint?: string;
  platform: MeetingPlatform;
  providerLabel: string;
  lifecycleState: SessionLifecycleState;
  startTime: number;
  endTime?: number;
  firstEventTimestamp?: number;
  lastEventTimestamp?: number;
  eventCount: number;
  captionCount: number;
  chatMessageCount: number;
  summaryCount: number;
  uniqueSpeakerCount: number;
  speakers: string[];
  coverage: MeetingSessionExtractionCoverage;
  integrity: MeetingSessionExtractionIntegrity;
  warnings: string[];
};

export type MeetingSession = {
  id: string;
  sessionSyncId?: string;
  schemaVersion?: number;
  platform: MeetingPlatform;
  providerLabel: string;
  meetingUrl: string;
  title?: string;
  starred?: boolean;
  identifiers: MeetingSessionIdentifiers;
  sessionFingerprint?: string;
  lifecycleState?: SessionLifecycleState;
  resumedFromSessionId?: string;
  rejoinHistory?: MeetingSessionRejoin[];
  lastSeenAt?: number;
  meetingProfileId?: string;
  updatedAt?: number;
  updatedByDeviceId?: string;
  syncContentHash?: string;
  derived?: MeetingSessionDerivedData;
  artifacts?: MeetingSessionArtifacts;
  searchableText: string;
  startTime: number;
  endTime?: number;
  events?: SavedMeetingEvent[];
  captions: SavedCaption[];
  chatMessages: SavedChatMessage[];
  summaries?: Record<string, MeetingSummary>;
};

export type StoredMeetingSession = MeetingSession;

const PLATFORM_LABELS: Record<MeetingPlatform, string> = {
  "google-meet": "Google Meet",
  "microsoft-teams": "Microsoft Teams Web",
  "zoom-web": "Zoom Web App",
};

function isMeetingPlatform(value: unknown): value is MeetingPlatform {
  return (
    value === "google-meet" ||
    value === "microsoft-teams" ||
    value === "zoom-web"
  );
}

export function getProviderLabel(platform: MeetingPlatform): string {
  return PLATFORM_LABELS[platform];
}

function normalizeNumericMeetingCode(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && /^\d{6,}$/.test(normalized) ? normalized : undefined;
}

export function sanitizeMeetingSessionIdentifiers(
  platform: MeetingPlatform,
  identifiers: MeetingSessionIdentifiers
): MeetingSessionIdentifiers {
  if (platform !== "microsoft-teams") {
    return { ...identifiers };
  }

  if (identifiers.callType === "direct-call") {
    return {
      callType: "direct-call",
    };
  }

  const meetingCode =
    normalizeNumericMeetingCode(identifiers.meetingCode) ||
    normalizeNumericMeetingCode(identifiers.meetingId) ||
    normalizeNumericMeetingCode(identifiers.meetingNumber);

  return {
    meetingCode,
    meetingId: meetingCode,
    callType: identifiers.callType,
  };
}

export function isDirectCallIdentifiers(
  identifiers: MeetingSessionIdentifiers
): boolean {
  return identifiers.callType === "direct-call";
}

export function getMeetingIdentityTokens(
  platform: MeetingPlatform,
  identifiers: MeetingSessionIdentifiers
): string[] {
  const normalizedIdentifiers = sanitizeMeetingSessionIdentifiers(
    platform,
    identifiers
  );

  if (platform === "microsoft-teams") {
    return normalizedIdentifiers.meetingCode ? [normalizedIdentifiers.meetingCode] : [];
  }

  return [
    normalizedIdentifiers.meetingCode,
    normalizedIdentifiers.meetingId,
    normalizedIdentifiers.conferenceId,
    normalizedIdentifiers.meetingNumber,
    normalizedIdentifiers.threadId,
  ].filter((value): value is string => Boolean(value && value.trim()));
}

export function getMeetingIdentifierLabel(
  key: keyof MeetingSessionIdentifiers
): string {
  switch (key) {
    case "meetingCode":
      return "Meeting Code";
    case "meetingId":
      return "Meeting ID";
    case "conferenceId":
      return "Conference ID";
    case "meetingNumber":
      return "Meeting Number";
    case "threadId":
      return "Thread ID";
    case "callType":
      return "Call Type";
    default:
      return key;
  }
}

export function inferMeetingPlatform(
  meetingUrl: string,
  fallback: MeetingPlatform = "google-meet"
): MeetingPlatform {
  if (meetingUrl.includes("meet.google.com")) {
    return "google-meet";
  }

  if (meetingUrl.includes("teams.microsoft.com")) {
    return "microsoft-teams";
  }

  if (meetingUrl.includes("zoom.us")) {
    return "zoom-web";
  }

  return fallback;
}

export function getPrimaryMeetingIdentifier(
  identifiers: MeetingSessionIdentifiers
): string | null {
  return (
    identifiers.meetingCode ||
    identifiers.meetingId ||
    identifiers.meetingNumber ||
    identifiers.conferenceId ||
    identifiers.threadId ||
    null
  );
}

export function getMeetingDisplayTitle(
  session: Pick<MeetingSession, "title" | "identifiers">
): string {
  const title = session.title?.trim();
  const primaryIdentifier = getPrimaryMeetingIdentifier(session.identifiers);

  if (isDirectCallIdentifiers(session.identifiers)) {
    return title ? `Direct call with ${title}` : "Direct call";
  }

  if (title) {
    return title;
  }

  return primaryIdentifier ? `Meeting ${primaryIdentifier}` : "Meeting session";
}

export function buildMeetingSessionFingerprint(
  input: Pick<MeetingSession, "platform" | "meetingUrl" | "identifiers" | "title">
): string {
  const normalizedIdentifiers = sanitizeMeetingSessionIdentifiers(
    input.platform,
    input.identifiers
  );
  const identifierParts = getMeetingIdentityTokens(
    input.platform,
    normalizedIdentifiers
  )
    .map((value) => value.trim().toLowerCase());

  let normalizedUrl = input.meetingUrl.trim().toLowerCase();
  try {
    const parsedUrl = new URL(input.meetingUrl);
    normalizedUrl = `${parsedUrl.origin}${parsedUrl.pathname}`.toLowerCase();
  } catch {
    // Fall back to the raw meeting URL when parsing fails.
  }

  const fallbackTitle = input.title?.trim().toLowerCase();
  const parts = [
    input.platform,
    ...(identifierParts.length > 0
      ? identifierParts
      : [normalizedUrl, fallbackTitle || "untitled"]),
  ];

  return parts.join("|");
}

export function getSessionOffsetMs(
  sessionStartTime: number,
  itemTimestamp: number
): number {
  return Math.max(0, itemTimestamp - sessionStartTime);
}

export function getMeetingSessionLastActivityTimestamp(
  session: Pick<MeetingSession, "lastSeenAt" | "endTime" | "startTime">
): number {
  const startTime =
    typeof session.startTime === "number" ? session.startTime : 0;
  const endTime =
    typeof session.endTime === "number" ? session.endTime : Number.NEGATIVE_INFINITY;
  const lastSeenAt =
    typeof session.lastSeenAt === "number"
      ? session.lastSeenAt
      : Number.NEGATIVE_INFINITY;

  return Math.max(startTime, endTime, lastSeenAt);
}

export function buildMeetingSessionTimelineSegments(
  sessionStartTime: number,
  rejoinHistory: MeetingSessionRejoin[] = [],
  sessionEndTime?: number
): MeetingSessionTimelineSegment[] {
  const sortedRejoins = [...rejoinHistory].sort(
    (left, right) => left.resumedAt - right.resumedAt
  );

  const segments: MeetingSessionTimelineSegment[] = [
    {
      index: 0,
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      isContinuation: false,
      gapMs: 0,
    },
  ];

  for (const entry of sortedRejoins) {
    const currentSegment = segments[segments.length - 1];
    if (!currentSegment) {
      continue;
    }

    const previousEndTime = Math.max(
      entry.previousEndTime,
      currentSegment.startTime
    );
    currentSegment.endTime = previousEndTime;

    const resumedAt = Math.max(entry.resumedAt, previousEndTime);
    segments.push({
      index: segments.length,
      startTime: resumedAt,
      endTime: sessionEndTime,
      isContinuation: true,
      resumedAt: entry.resumedAt,
      previousEndTime: entry.previousEndTime,
      gapMs:
        typeof entry.gapMs === "number"
          ? Math.max(0, entry.gapMs)
          : Math.max(0, entry.resumedAt - entry.previousEndTime),
    });
  }

  const lastSegment = segments[segments.length - 1];
  if (lastSegment) {
    lastSegment.endTime =
      typeof sessionEndTime === "number"
        ? Math.max(sessionEndTime, lastSegment.startTime)
        : lastSegment.endTime;
  }

  return segments;
}

export function getMeetingSessionTimelineSegmentForTimestamp(
  itemTimestamp: number,
  sessionStartTime: number,
  rejoinHistory: MeetingSessionRejoin[] = [],
  sessionEndTime?: number
): MeetingSessionTimelineSegment {
  const segments = buildMeetingSessionTimelineSegments(
    sessionStartTime,
    rejoinHistory,
    sessionEndTime
  );

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (!segment) {
      continue;
    }

    if (itemTimestamp >= segment.startTime) {
      return segment;
    }
  }

  return segments[0]!;
}

export function getSegmentedSessionOffsetMs(
  sessionStartTime: number,
  rejoinHistory: MeetingSessionRejoin[] = [],
  itemTimestamp: number,
  sessionEndTime?: number
): number {
  const segment = getMeetingSessionTimelineSegmentForTimestamp(
    itemTimestamp,
    sessionStartTime,
    rejoinHistory,
    sessionEndTime
  );

  return Math.max(0, itemTimestamp - segment.startTime);
}

export function formatSessionOffset(offsetMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(offsetMs / 1000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function createTextFingerprint(input: string): string {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}

function normalizeStableText(input: string | undefined): string {
  return (input || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getTimestampBucket(timestamp: number): number {
  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  return Math.round(timestamp / 2_000);
}

export function buildStableMeetingEventKey(
  sessionFingerprint: string,
  event: Pick<
    SavedMeetingEvent,
    "source" | "providerEventId" | "speaker" | "text" | "timestamp"
  >
): string {
  const providerEventId = event.providerEventId?.trim().toLowerCase();
  if (providerEventId) {
    return `${sessionFingerprint}:${event.source}:provider:${providerEventId}`;
  }

  return `${sessionFingerprint}:${event.source}:derived:${createTextFingerprint(
    JSON.stringify({
      speaker: normalizeStableText(event.speaker),
      text: normalizeStableText(event.text),
      timestampBucket: getTimestampBucket(event.timestamp),
    })
  )}`;
}

function buildSessionSyncContentHash(
  session: Pick<
    MeetingSession,
    | "title"
    | "starred"
    | "lifecycleState"
    | "events"
    | "summaries"
    | "endTime"
    | "startTime"
  >
): string {
  return createTextFingerprint(
    JSON.stringify({
      title: session.title || "",
      starred: Boolean(session.starred),
      lifecycleState: session.lifecycleState || "live",
      startTime: session.startTime,
      endTime: session.endTime,
      rejoinHistory: (session as MeetingSession).rejoinHistory || [],
      events: (session.events || []).map((event) => ({
        stableEventKey: event.stableEventKey,
        text: event.text,
        formattedHtml: event.formattedHtml,
        translation: event.translation,
        translationLanguage: event.translationLanguage,
        isFinal: event.isFinal,
      })),
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

function normalizeSavedMeetingEvent(
  sessionStartTime: number,
  rejoinHistory: MeetingSessionRejoin[],
  sessionFingerprint: string,
  event: SavedMeetingEvent
): SavedMeetingEvent {
  return {
    ...event,
    speaker: event.speaker || "Unknown",
    text: event.text || "",
    formattedHtml:
      typeof event.formattedHtml === "string" && event.formattedHtml.trim()
        ? event.formattedHtml
        : undefined,
    time: event.time || "",
    timestamp: Number.isFinite(event.timestamp) ? event.timestamp : Date.now(),
    stableEventKey:
      typeof event.stableEventKey === "string" && event.stableEventKey.trim()
        ? event.stableEventKey
        : buildStableMeetingEventKey(sessionFingerprint, event),
    sessionOffsetMs: getSegmentedSessionOffsetMs(
      sessionStartTime,
      rejoinHistory,
      event.timestamp
    ),
    updatedAt:
      typeof event.updatedAt === "number" ? event.updatedAt : undefined,
    updatedByDeviceId:
      typeof event.updatedByDeviceId === "string"
        ? event.updatedByDeviceId
        : undefined,
  };
}

export function materializeMeetingSessionCollections(
  sessionStartTime: number,
  events: SavedMeetingEvent[]
): {
  captions: SavedCaption[];
  chatMessages: SavedChatMessage[];
} {
  const sortedEvents = [...events].sort((left, right) => left.timestamp - right.timestamp);

  return {
    captions: sortedEvents
      .filter((event) => event.source === "caption")
      .map((event) => ({
        eventId: event.eventId,
        stableEventKey: event.stableEventKey,
        providerEventId: event.providerEventId,
        speaker: event.speaker,
        text: event.text,
        formattedHtml: event.formattedHtml,
        translation: event.translation,
        translationLanguage: event.translationLanguage,
        time: event.time,
        timestamp: event.timestamp,
        sessionOffsetMs:
          typeof event.sessionOffsetMs === "number"
            ? event.sessionOffsetMs
            : getSessionOffsetMs(sessionStartTime, event.timestamp),
        isFinal: event.isFinal,
        updatedAt: event.updatedAt,
        updatedByDeviceId: event.updatedByDeviceId,
      })),
    chatMessages: sortedEvents
      .filter((event) => event.source === "chat")
      .map((event) => ({
        eventId: event.eventId,
        stableEventKey: event.stableEventKey,
        providerEventId: event.providerEventId,
        speaker: event.speaker,
        text: event.text,
        formattedHtml: event.formattedHtml,
        translation: event.translation,
        translationLanguage: event.translationLanguage,
        time: event.time,
        timestamp: event.timestamp,
        sessionOffsetMs:
          typeof event.sessionOffsetMs === "number"
            ? event.sessionOffsetMs
            : getSessionOffsetMs(sessionStartTime, event.timestamp),
        own: event.own,
        updatedAt: event.updatedAt,
        updatedByDeviceId: event.updatedByDeviceId,
      })),
  };
}

export function buildMeetingSessionSearchableText(
  session: Pick<
    MeetingSession,
    | "providerLabel"
    | "title"
    | "meetingUrl"
    | "identifiers"
    | "artifacts"
    | "captions"
    | "chatMessages"
    | "summaries"
  >
): string {
  const metadataParts = [
    session.providerLabel,
    session.title,
    session.meetingUrl,
    session.identifiers.meetingCode,
    session.identifiers.meetingId,
    session.identifiers.meetingNumber,
    session.identifiers.conferenceId,
    session.identifiers.threadId,
    session.identifiers.callType,
  ];

  const captionParts = session.captions.flatMap((caption) => [
    caption.speaker,
    caption.text,
    caption.translation,
  ]);

  const chatParts = session.chatMessages.flatMap((message) => [
    message.speaker,
    message.text,
    message.translation,
  ]);

  const summaryParts = Object.values(session.summaries || {}).map(
    (summary) => summary.content
  );

  const assistantParts = Object.values(
    session.artifacts?.assistantOutputs || {}
  ).flatMap((output) => [output.speaker, output.triggerText, output.content]);

  return [
    ...metadataParts,
    ...captionParts,
    ...chatParts,
    ...summaryParts,
    ...assistantParts,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n")
    .toLowerCase();
}

export function buildMeetingSessionDerivedData(
  session: Pick<
    MeetingSession,
    | "providerLabel"
    | "title"
    | "meetingUrl"
    | "identifiers"
    | "artifacts"
    | "captions"
    | "chatMessages"
    | "summaries"
    | "events"
  >
): MeetingSessionDerivedData {
  return {
    searchableText: buildMeetingSessionSearchableText(session),
    captionCount: session.captions.length,
    chatMessageCount: session.chatMessages.length,
    translatedCaptionCount: session.captions.filter((caption) =>
      Boolean(caption.translation?.trim())
    ).length,
    previewCaptions: session.captions.slice(0, 2).map((caption) => ({ ...caption })),
    previewChatMessages: session.chatMessages
      .slice(0, 2)
      .map((message) => ({ ...message })),
    lastEventTimestamp: (session.events || []).reduce<number | undefined>(
      (latest, event) =>
        latest === undefined || event.timestamp > latest
          ? event.timestamp
          : latest,
      undefined
    ),
  };
}

export function normalizeMeetingSession(
  storedSession: StoredMeetingSession
): MeetingSession {
  const platform = isMeetingPlatform(storedSession.platform)
    ? storedSession.platform
    : inferMeetingPlatform(storedSession.meetingUrl);
  const identifiers = sanitizeMeetingSessionIdentifiers(platform, {
    ...(storedSession.identifiers || {}),
  });
  const providerLabel = storedSession.providerLabel || getProviderLabel(platform);
  const sessionFingerprint =
    typeof storedSession.sessionFingerprint === "string"
      ? storedSession.sessionFingerprint
      : buildMeetingSessionFingerprint({
          platform,
          meetingUrl: storedSession.meetingUrl,
          identifiers,
          title: storedSession.title,
        });

  const normalizedRejoinHistory: MeetingSessionRejoin[] = Array.isArray(
    storedSession.rejoinHistory
  )
    ? storedSession.rejoinHistory
        .filter(
          (entry): entry is MeetingSessionRejoin =>
            Boolean(entry) &&
            typeof entry.previousEndTime === "number" &&
            typeof entry.resumedAt === "number"
        )
        .map((entry) => ({
          previousEndTime: entry.previousEndTime,
          resumedAt: entry.resumedAt,
          gapMs:
            typeof entry.gapMs === "number"
              ? Math.max(0, entry.gapMs)
              : Math.max(0, entry.resumedAt - entry.previousEndTime),
        }))
        .sort((left, right) => left.resumedAt - right.resumedAt)
    : [];

  const normalized: MeetingSession = {
    id: storedSession.id,
    sessionSyncId:
      typeof storedSession.sessionSyncId === "string" &&
      storedSession.sessionSyncId.trim()
        ? storedSession.sessionSyncId
        : storedSession.id,
    schemaVersion:
      typeof storedSession.schemaVersion === "number"
        ? storedSession.schemaVersion
        : 3,
    platform,
    providerLabel,
    meetingUrl: storedSession.meetingUrl,
    title: storedSession.title,
    starred: Boolean(storedSession.starred),
    identifiers,
    sessionFingerprint,
    lifecycleState:
      (storedSession.lifecycleState === "live" ||
        storedSession.lifecycleState === "ended" ||
        storedSession.lifecycleState === "reopened")
        ? storedSession.lifecycleState
        : undefined,
    resumedFromSessionId: storedSession.resumedFromSessionId,
    rejoinHistory: normalizedRejoinHistory,
    updatedAt:
      typeof storedSession.updatedAt === "number"
        ? storedSession.updatedAt
        : undefined,
    updatedByDeviceId:
      typeof storedSession.updatedByDeviceId === "string"
        ? storedSession.updatedByDeviceId
        : undefined,
    syncContentHash:
      typeof storedSession.syncContentHash === "string"
        ? storedSession.syncContentHash
        : undefined,
    lastSeenAt:
      typeof storedSession.lastSeenAt === "number"
        ? storedSession.lastSeenAt
        : undefined,
    meetingProfileId:
      typeof storedSession.meetingProfileId === "string"
        ? storedSession.meetingProfileId
        : typeof (storedSession as { summaryProfileId?: unknown }).summaryProfileId ===
            "string"
          ? String((storedSession as { summaryProfileId?: unknown }).summaryProfileId)
          : undefined,
    derived: storedSession.derived
      ? {
          ...storedSession.derived,
          previewCaptions: (storedSession.derived.previewCaptions || []).map(
            (caption) => ({ ...caption })
          ),
          previewChatMessages: (
            storedSession.derived.previewChatMessages || []
          ).map((message) => ({ ...message })),
        }
      : undefined,
    artifacts: storedSession.artifacts
      ? {
          summaries: storedSession.artifacts.summaries
            ? { ...storedSession.artifacts.summaries }
            : undefined,
          assistantOutputs: storedSession.artifacts.assistantOutputs
            ? Object.fromEntries(
                Object.entries(storedSession.artifacts.assistantOutputs).map(
                  ([key, output]) => [
                    key,
                    {
                      id:
                        typeof output.id === "string" && output.id.trim()
                          ? output.id
                          : key,
                      triggerEventId:
                        typeof output.triggerEventId === "string"
                          ? output.triggerEventId
                          : "",
                      triggerStableEventKey:
                        typeof output.triggerStableEventKey === "string"
                          ? output.triggerStableEventKey
                          : undefined,
                      source: output.source === "chat" ? "chat" : "caption",
                      speaker:
                        typeof output.speaker === "string"
                          ? output.speaker
                          : "Unknown",
                      triggerText:
                        typeof output.triggerText === "string"
                          ? output.triggerText
                          : "",
                      triggerTimestamp:
                        typeof output.triggerTimestamp === "number"
                          ? output.triggerTimestamp
                          : storedSession.startTime,
                      profileId:
                        typeof output.profileId === "string"
                          ? output.profileId
                          : "",
                      content:
                        typeof output.content === "string" ? output.content : "",
                      createdAt:
                        typeof output.createdAt === "number"
                          ? output.createdAt
                          : Date.now(),
                      provider:
                        typeof output.provider === "string"
                          ? output.provider
                          : "",
                      model:
                        typeof output.model === "string" ? output.model : "",
                      responseIntent:
                        output.responseIntent === "answer_for_me" ||
                        output.responseIntent === "improve_my_answer" ||
                        output.responseIntent === "suggest_next_point" ||
                        output.responseIntent ===
                          "summarize_what_was_just_said" ||
                        output.responseIntent === "surface_risks" ||
                        output.responseIntent === "coach_me"
                          ? output.responseIntent
                          : undefined,
                      responseFormat:
                        output.responseFormat === "bullets" ||
                        output.responseFormat === "talking_points" ||
                        output.responseFormat === "short_paragraph" ||
                        output.responseFormat === "structured_sections" ||
                        output.responseFormat === "script"
                          ? output.responseFormat
                          : undefined,
                      responseDepth:
                        output.responseDepth === "ultra_brief" ||
                        output.responseDepth === "brief" ||
                        output.responseDepth === "standard" ||
                        output.responseDepth === "expanded"
                          ? output.responseDepth
                          : undefined,
                      responseTone:
                        output.responseTone === "neutral" ||
                        output.responseTone === "direct" ||
                        output.responseTone === "supportive" ||
                        output.responseTone === "confident" ||
                        output.responseTone === "analytical"
                          ? output.responseTone
                          : undefined,
                      deliveryBias:
                        output.deliveryBias === "fastest" ||
                        output.deliveryBias === "balanced" ||
                        output.deliveryBias === "careful"
                          ? output.deliveryBias
                          : undefined,
                    } satisfies MeetingAssistantOutput,
                  ]
                )
              )
            : undefined,
          assistantMemory:
            storedSession.artifacts.assistantMemory &&
            typeof storedSession.artifacts.assistantMemory.content === "string"
              ? {
                  updatedAt:
                    typeof storedSession.artifacts.assistantMemory.updatedAt ===
                    "number"
                      ? storedSession.artifacts.assistantMemory.updatedAt
                      : Date.now(),
                  content: storedSession.artifacts.assistantMemory.content,
                  sourceEventCount:
                    typeof storedSession.artifacts.assistantMemory
                      .sourceEventCount === "number"
                      ? storedSession.artifacts.assistantMemory.sourceEventCount
                      : undefined,
                }
              : undefined,
          assistantState:
            storedSession.artifacts.assistantState &&
            typeof storedSession.artifacts.assistantState.enabled === "boolean"
              ? {
                  enabled: storedSession.artifacts.assistantState.enabled,
                  updatedAt:
                    typeof storedSession.artifacts.assistantState.updatedAt ===
                    "number"
                      ? storedSession.artifacts.assistantState.updatedAt
                      : Date.now(),
                }
              : undefined,
        }
      : undefined,
    searchableText: "",
    startTime: storedSession.startTime,
    endTime: storedSession.endTime,
    events: (storedSession.events || []).map((event) =>
      normalizeSavedMeetingEvent(
        storedSession.startTime,
        normalizedRejoinHistory,
        sessionFingerprint,
        event
      )
    ),
    captions: (storedSession.captions || []).map((caption) => ({
      ...caption,
      sessionOffsetMs: getSegmentedSessionOffsetMs(
        storedSession.startTime,
        normalizedRejoinHistory,
        caption.timestamp,
        storedSession.endTime
      ),
    })),
    chatMessages: (storedSession.chatMessages || []).map((message) => ({
      ...message,
      sessionOffsetMs: getSegmentedSessionOffsetMs(
        storedSession.startTime,
        normalizedRejoinHistory,
        message.timestamp,
        storedSession.endTime
      ),
    })),
    summaries: {},
  };

  const rawSummaries =
    storedSession.summaries && Object.keys(storedSession.summaries).length > 0
      ? storedSession.summaries
      : normalized.artifacts?.summaries;

  normalized.summaries = rawSummaries
    ? Object.fromEntries(
        Object.entries(rawSummaries).map(([key, summary]) => [
          summary.key || key,
          {
            key: summary.key || key,
            groupKey:
              typeof summary.groupKey === "string" && summary.groupKey.trim()
                ? summary.groupKey
                : `${summary.profileId}:${summary.language}`,
            profileId: summary.profileId,
            profileName: summary.profileName,
            language: summary.language,
            content: summary.content,
            generatedAt: summary.generatedAt,
            provider: summary.provider,
            model: summary.model,
            instructionSnapshot: summary.instructionSnapshot,
            sourceFingerprint: summary.sourceFingerprint,
            captionCount: summary.captionCount,
            generationMode: summary.generationMode,
            requestSource:
              summary.requestSource === "automatic" ||
              summary.requestSource === "manual"
                ? summary.requestSource
                : undefined,
            sourceSessionProfileId:
              typeof summary.sourceSessionProfileId === "string"
                ? summary.sourceSessionProfileId
                : undefined,
            executionStrategy: summary.executionStrategy,
            continuationCount: summary.continuationCount,
            evidenceChunkCount: summary.evidenceChunkCount,
            reconciled: summary.reconciled,
          },
        ])
      )
    : {};

  normalized.artifacts = {
    ...(normalized.artifacts || {}),
    summaries: normalized.summaries,
    assistantOutputs: normalized.artifacts?.assistantOutputs
      ? { ...normalized.artifacts.assistantOutputs }
      : undefined,
    assistantMemory: normalized.artifacts?.assistantMemory
      ? { ...normalized.artifacts.assistantMemory }
      : undefined,
    assistantState: normalized.artifacts?.assistantState
      ? {
          enabled: normalized.artifacts.assistantState.enabled,
          updatedAt: normalized.artifacts.assistantState.updatedAt,
        }
      : undefined,
  };

  const materialized = materializeMeetingSessionCollections(
    storedSession.startTime,
    normalized.events
  );
  normalized.captions = materialized.captions;
  normalized.chatMessages = materialized.chatMessages;

  normalized.sessionFingerprint =
    normalized.sessionFingerprint || buildMeetingSessionFingerprint(normalized);
  normalized.lifecycleState =
    normalized.lifecycleState || (normalized.endTime ? "ended" : "live");
  normalized.lastSeenAt = getMeetingSessionLastActivityTimestamp(normalized);
  normalized.updatedAt =
    Math.max(
      typeof normalized.updatedAt === "number"
        ? normalized.updatedAt
        : Number.NEGATIVE_INFINITY,
      normalized.lastSeenAt,
      normalized.startTime
    );
  normalized.syncContentHash =
    normalized.syncContentHash || buildSessionSyncContentHash(normalized);
  normalized.derived = buildMeetingSessionDerivedData(normalized);
  normalized.searchableText = normalized.derived.searchableText;

  return normalized;
}

export function createMeetingSessionExtractionReport(
  session: StoredMeetingSession,
  generatedAt = Date.now()
): MeetingSessionExtractionReport {
  const normalized = normalizeMeetingSession(session);
  const rawEvents = Array.isArray(session.events) ? session.events : [];
  const events = normalized.events || [];
  const orderedEvents = [...events].sort((left, right) => left.timestamp - right.timestamp);
  const firstEventTimestamp = orderedEvents[0]?.timestamp;
  const lastEventTimestamp = orderedEvents[orderedEvents.length - 1]?.timestamp;
  const speakers = Array.from(
    new Set(
      orderedEvents
        .map((event) => event.speaker.trim())
        .filter((speaker) => Boolean(speaker))
    )
  ).sort((left, right) => left.localeCompare(right));
  const coverage: MeetingSessionExtractionCoverage = {
    eventsWithMetadata: orderedEvents.filter(
      (event) => event.metadata && Object.keys(event.metadata).length > 0
    ).length,
    eventsWithProviderEventId: orderedEvents.filter((event) =>
      Boolean(event.providerEventId?.trim())
    ).length,
    eventsWithSessionOffset: orderedEvents.filter(
      (event) => typeof event.sessionOffsetMs === "number"
    ).length,
    translatedEvents: orderedEvents.filter((event) =>
      Boolean(event.translation?.trim())
    ).length,
    finalCaptionEvents: orderedEvents.filter(
      (event) => event.source === "caption" && Boolean(event.isFinal)
    ).length,
  };
  const summaries = normalized.summaries || {};
  const warnings: string[] = [];

  if (orderedEvents.length === 0) {
    warnings.push("No canonical events were captured for this session.");
  }

  if (normalized.captions.length === 0 && normalized.chatMessages.length === 0) {
    warnings.push("The session has no materialized transcript or chat timeline.");
  }

  if (
    rawEvents.some(
      (event, index) =>
        index > 0 &&
        Number.isFinite(event.timestamp) &&
        Number.isFinite(rawEvents[index - 1]!.timestamp) &&
        event.timestamp < rawEvents[index - 1]!.timestamp
    )
  ) {
    warnings.push("The raw event log was not stored in chronological order.");
  }

  if (!normalized.endTime && normalized.lifecycleState !== "live") {
    warnings.push("The session lifecycle is non-live, but no end time was stored.");
  }

  if (
    typeof normalized.endTime === "number" &&
    typeof lastEventTimestamp === "number" &&
    lastEventTimestamp > normalized.endTime + 60_000
  ) {
    warnings.push("The last captured event occurs noticeably after the stored end time.");
  }

  if (
    typeof firstEventTimestamp === "number" &&
    firstEventTimestamp + 60_000 < normalized.startTime
  ) {
    warnings.push("The first captured event occurs noticeably before the stored start time.");
  }

  return {
    generatedAt,
    schemaVersion: normalized.schemaVersion || 3,
    sessionId: normalized.id,
    sessionFingerprint: normalized.sessionFingerprint,
    platform: normalized.platform,
    providerLabel: normalized.providerLabel,
    lifecycleState: normalized.lifecycleState || "live",
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    firstEventTimestamp,
    lastEventTimestamp,
    eventCount: orderedEvents.length,
    captionCount: normalized.captions.length,
    chatMessageCount: normalized.chatMessages.length,
    summaryCount: Object.keys(summaries).length,
    uniqueSpeakerCount: speakers.length,
    speakers,
    coverage,
    integrity: {
      eventLogFingerprint: createTextFingerprint(JSON.stringify(orderedEvents)),
      searchableTextFingerprint: createTextFingerprint(
        normalized.searchableText || ""
      ),
      summaryFingerprint: createTextFingerprint(JSON.stringify(summaries)),
    },
    warnings,
  };
}
