import type {
  MeetingSession,
  SavedMeetingEvent,
  StoredMeetingSession,
} from "./types";
import {
  buildMeetingSessionDerivedData,
  normalizeMeetingSession,
} from "../shared/meeting-session";

const HISTORY_DB_NAME = "captionarc-history";
const HISTORY_DB_VERSION = 4;
const SESSION_INDEX_STORE = "session-index";
const SESSION_EVENT_CHUNK_STORE = "session-event-chunks";
const EVENT_CHUNK_SIZE = 250;
const MAX_ARCHIVED_SESSION_COUNT = 250;
const MAX_ARCHIVED_SESSION_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const STORAGE_PRESSURE_HIGH_RATIO = 0.7;
const STORAGE_PRESSURE_TARGET_RATIO = 0.55;

type StoredMeetingSessionIndex = Omit<
  MeetingSession,
  "events" | "captions" | "chatMessages"
> & {
  eventCount: number;
  updatedAt: number;
};

type StoredSessionEventChunk = {
  key: string;
  sessionId: string;
  chunkIndex: number;
  eventCount: number;
  startTimestamp: number;
  endTimestamp: number;
  events: SavedMeetingEvent[];
};

let openDbPromise: Promise<IDBDatabase> | null = null;

type MeetingHistoryRetentionResult = {
  deletedSessionIds: string[];
};

function openHistoryDb(): Promise<IDBDatabase> {
  if (openDbPromise) {
    return openDbPromise;
  }

  openDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(HISTORY_DB_NAME, HISTORY_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SESSION_INDEX_STORE)) {
        const sessionIndexStore = db.createObjectStore(SESSION_INDEX_STORE, {
          keyPath: "id",
        });
        sessionIndexStore.createIndex("startTime", "startTime");
        sessionIndexStore.createIndex("sessionFingerprint", "sessionFingerprint");
        sessionIndexStore.createIndex("sessionSyncId", "sessionSyncId");
      } else {
        const sessionIndexStore = request.transaction!.objectStore(SESSION_INDEX_STORE);
        if (!sessionIndexStore.indexNames.contains("sessionFingerprint")) {
          sessionIndexStore.createIndex("sessionFingerprint", "sessionFingerprint");
        }
        if (!sessionIndexStore.indexNames.contains("sessionSyncId")) {
          sessionIndexStore.createIndex("sessionSyncId", "sessionSyncId");
        }
      }

      if (!db.objectStoreNames.contains(SESSION_EVENT_CHUNK_STORE)) {
        const eventChunkStore = db.createObjectStore(SESSION_EVENT_CHUNK_STORE, {
          keyPath: "key",
        });
        eventChunkStore.createIndex("sessionId", "sessionId");
        eventChunkStore.createIndex("sessionChunk", ["sessionId", "chunkIndex"]);
      }

    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        openDbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open history database."));
    };
  });

  return openDbPromise;
}

function getRequestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("IndexedDB request failed."));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error || new Error("IndexedDB transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error || new Error("IndexedDB transaction aborted."));
  });
}

function buildStoredSessionIndex(
  session: MeetingSession,
  eventCount: number
): StoredMeetingSessionIndex {
  const { events: _events, captions: _captions, chatMessages: _chatMessages, ...rest } =
    session;
  const derived = buildMeetingSessionDerivedData(session);

  return {
    ...rest,
    schemaVersion: 3,
    sessionFingerprint: session.sessionFingerprint,
    lifecycleState: session.lifecycleState,
    lastSeenAt: session.lastSeenAt,
    derived,
    artifacts: session.artifacts
      ? {
          ...session.artifacts,
          summaries: session.artifacts.summaries
            ? { ...session.artifacts.summaries }
            : session.summaries,
          assistantOutputs: session.artifacts.assistantOutputs
            ? Object.fromEntries(
                Object.entries(session.artifacts.assistantOutputs).map(
                  ([key, output]) => [key, { ...output }]
                )
              )
            : undefined,
          assistantMemory: session.artifacts.assistantMemory
            ? { ...session.artifacts.assistantMemory }
            : undefined,
          assistantState: session.artifacts.assistantState
            ? {
                enabled: session.artifacts.assistantState.enabled,
                updatedAt: session.artifacts.assistantState.updatedAt,
              }
            : undefined,
        }
      : {
          summaries: session.summaries,
        },
    searchableText: derived.searchableText,
    eventCount,
    updatedAt: Date.now(),
  };
}

function buildSessionEventChunks(
  sessionId: string,
  events: SavedMeetingEvent[]
): StoredSessionEventChunk[] {
  const sortedEvents = [...events].sort((left, right) => left.timestamp - right.timestamp);
  const chunks: StoredSessionEventChunk[] = [];

  for (let index = 0; index < sortedEvents.length; index += EVENT_CHUNK_SIZE) {
    const chunkEvents = sortedEvents.slice(index, index + EVENT_CHUNK_SIZE);
    chunks.push({
      key: `${sessionId}:${chunks.length}`,
      sessionId,
      chunkIndex: chunks.length,
      eventCount: chunkEvents.length,
      startTimestamp: chunkEvents[0]?.timestamp || 0,
      endTimestamp: chunkEvents[chunkEvents.length - 1]?.timestamp || 0,
      events: chunkEvents,
    });
  }

  return chunks;
}

function composeStoredMeetingSession(
  index: StoredMeetingSessionIndex,
  events: SavedMeetingEvent[]
): StoredMeetingSession {
  return {
    ...index,
    events,
    captions: [],
    chatMessages: [],
  };
}

function composeStoredMeetingSessionPreview(
  index: StoredMeetingSessionIndex
): StoredMeetingSession {
  return {
    ...index,
    captions: index.derived?.previewCaptions || [],
    chatMessages: index.derived?.previewChatMessages || [],
    summaries: index.artifacts?.summaries || index.summaries || {},
    events: [],
  };
}

function areMeetingEventsEqual(
  left: SavedMeetingEvent,
  right: SavedMeetingEvent
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function areEventChunksEqual(
  left: StoredSessionEventChunk,
  right: StoredSessionEventChunk
): boolean {
  if (
    left.key !== right.key ||
    left.sessionId !== right.sessionId ||
    left.chunkIndex !== right.chunkIndex ||
    left.eventCount !== right.eventCount ||
    left.startTimestamp !== right.startTimestamp ||
    left.endTimestamp !== right.endTimestamp ||
    left.events.length !== right.events.length
  ) {
    return false;
  }

  return left.events.every((event, index) =>
    areMeetingEventsEqual(event, right.events[index]!)
  );
}

function extractCanonicalEvents(session: StoredMeetingSession): SavedMeetingEvent[] {
  return [...(session.events || [])];
}

function getSessionReferenceTimestamp(
  session: Pick<MeetingSession, "lastSeenAt" | "endTime" | "startTime">
): number {
  return session.lastSeenAt || session.endTime || session.startTime;
}

function canPruneSession(
  session: Pick<MeetingSession, "starred" | "lifecycleState" | "endTime">
): boolean {
  if (session.starred) {
    return false;
  }

  if (session.lifecycleState === "live") {
    return false;
  }

  return Boolean(session.endTime);
}

async function deleteStoredMeetingSessionRecordsByIds(
  sessionIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) {
    return;
  }

  const db = await openHistoryDb();
  const chunkKeysBySession = await Promise.all(
    sessionIds.map(async (sessionId) => ({
      sessionId,
      chunkKeys: await listStoredSessionEventChunkKeys(sessionId, {
        skipMigration: true,
      }),
    }))
  );

  const transaction = db.transaction(
    [SESSION_INDEX_STORE, SESSION_EVENT_CHUNK_STORE],
    "readwrite"
  );
  const sessionStore = transaction.objectStore(SESSION_INDEX_STORE);
  const chunkStore = transaction.objectStore(SESSION_EVENT_CHUNK_STORE);

  chunkKeysBySession.forEach(({ sessionId, chunkKeys }) => {
    sessionStore.delete(sessionId);
    chunkKeys.forEach((key) => {
      chunkStore.delete(key);
    });
  });

  await waitForTransaction(transaction);
}

async function estimateStoragePressureRatio(): Promise<number | null> {
  const estimate = await navigator.storage?.estimate?.();
  if (!estimate?.quota || estimate.quota <= 0) {
    return null;
  }

  const bytesUsed = await estimateMeetingHistoryBytes();
  return bytesUsed / estimate.quota;
}

export async function enforceMeetingHistoryRetentionPolicy(): Promise<
  MeetingHistoryRetentionResult
> {
  const indexes = (await listStoredMeetingSessionIndexes()).sort(
    (left, right) => getSessionReferenceTimestamp(left) - getSessionReferenceTimestamp(right)
  );
  const now = Date.now();
  const deletedSessionIds = new Set<string>();

  const agePrunedIds = indexes
    .filter((session) => canPruneSession(session))
    .filter(
      (session) => now - getSessionReferenceTimestamp(session) > MAX_ARCHIVED_SESSION_AGE_MS
    )
    .map((session) => session.id);

  if (agePrunedIds.length > 0) {
    await deleteStoredMeetingSessionRecordsByIds(agePrunedIds);
    agePrunedIds.forEach((id) => deletedSessionIds.add(id));
  }

  let retainedIndexes = (await listStoredMeetingSessionIndexes()).sort(
    (left, right) => getSessionReferenceTimestamp(left) - getSessionReferenceTimestamp(right)
  );

  const archivedSessions = retainedIndexes.filter((session) => session.endTime);
  const excessArchivedCount = Math.max(
    0,
    archivedSessions.length - MAX_ARCHIVED_SESSION_COUNT
  );

  if (excessArchivedCount > 0) {
    const countPrunedIds = retainedIndexes
      .filter((session) => canPruneSession(session))
      .slice(0, excessArchivedCount)
      .map((session) => session.id);

    if (countPrunedIds.length > 0) {
      await deleteStoredMeetingSessionRecordsByIds(countPrunedIds);
      countPrunedIds.forEach((id) => deletedSessionIds.add(id));
      retainedIndexes = (await listStoredMeetingSessionIndexes()).sort(
        (left, right) =>
          getSessionReferenceTimestamp(left) - getSessionReferenceTimestamp(right)
      );
    }
  }

  let pressureRatio = await estimateStoragePressureRatio();
  if (
    pressureRatio !== null &&
    pressureRatio > STORAGE_PRESSURE_HIGH_RATIO
  ) {
    const pressureCandidates = retainedIndexes
      .filter((session) => canPruneSession(session))
      .map((session) => session.id);

    for (const sessionId of pressureCandidates) {
      await deleteStoredMeetingSessionRecordsByIds([sessionId]);
      deletedSessionIds.add(sessionId);
      pressureRatio = await estimateStoragePressureRatio();
      if (
        pressureRatio === null ||
        pressureRatio <= STORAGE_PRESSURE_TARGET_RATIO
      ) {
        break;
      }
    }
  }

  return {
    deletedSessionIds: [...deletedSessionIds],
  };
}

async function putCompositeSessionRecord(
  session: StoredMeetingSession
): Promise<void> {
  const normalized = normalizeMeetingSession(session);
  const events = normalized.events || [];
  const chunks = buildSessionEventChunks(normalized.id, events);
  const index = buildStoredSessionIndex(normalized, events.length);
  const existingChunks = await listStoredSessionEventChunks(normalized.id, {
    skipMigration: true,
  });
  const existingChunksByKey = new Map(
    existingChunks.map((chunk) => [chunk.key, chunk] as const)
  );
  const nextChunkKeys = new Set(chunks.map((chunk) => chunk.key));

  const db = await openHistoryDb();
  const transaction = db.transaction(
    [SESSION_INDEX_STORE, SESSION_EVENT_CHUNK_STORE],
    "readwrite"
  );

  transaction.objectStore(SESSION_INDEX_STORE).put(index);

  const chunkStore = transaction.objectStore(SESSION_EVENT_CHUNK_STORE);
  existingChunks.forEach((chunk) => {
    if (!nextChunkKeys.has(chunk.key)) {
      chunkStore.delete(chunk.key);
    }
  });

  chunks.forEach((chunk) => {
    const existingChunk = existingChunksByKey.get(chunk.key);
    if (!existingChunk || !areEventChunksEqual(existingChunk, chunk)) {
      chunkStore.put(chunk);
    }
  });

  await waitForTransaction(transaction);
}

async function listStoredMeetingSessionIndexes(): Promise<StoredMeetingSessionIndex[]> {
  const db = await openHistoryDb();
  const transaction = db.transaction(SESSION_INDEX_STORE, "readonly");
  return getRequestResult(
    transaction.objectStore(SESSION_INDEX_STORE).getAll() as IDBRequest<
      StoredMeetingSessionIndex[]
    >
  );
}

async function listStoredSessionEvents(
  sessionId: string,
  options: { skipMigration?: boolean } = {}
): Promise<SavedMeetingEvent[]> {
  const chunks = await listStoredSessionEventChunks(sessionId, options);
  return chunks.flatMap((chunk) => chunk.events);
}

async function listStoredSessionEventChunks(
  sessionId: string,
  _options: { skipMigration?: boolean } = {}
): Promise<StoredSessionEventChunk[]> {
  const db = await openHistoryDb();
  const transaction = db.transaction(SESSION_EVENT_CHUNK_STORE, "readonly");
  const chunks = await getRequestResult(
    transaction
      .objectStore(SESSION_EVENT_CHUNK_STORE)
      .index("sessionId")
      .getAll(IDBKeyRange.only(sessionId)) as IDBRequest<StoredSessionEventChunk[]>
  );

  return chunks.sort((left, right) => left.chunkIndex - right.chunkIndex);
}

async function listStoredSessionEventChunkKeys(
  sessionId: string,
  options: { skipMigration?: boolean } = {}
): Promise<string[]> {
  const chunks = await listStoredSessionEventChunks(sessionId, options);
  return chunks.map((chunk) => chunk.key);
}

export async function listStoredMeetingSessionRecords(): Promise<
  StoredMeetingSession[]
> {
  const indexes = await listStoredMeetingSessionIndexes();
  const sessions = await Promise.all(
    indexes.map(async (index) =>
      composeStoredMeetingSession(index, await listStoredSessionEvents(index.id))
    )
  );

  return sessions;
}

export async function listStoredMeetingSessionIndexRecords(): Promise<
  StoredMeetingSession[]
> {
  const indexes = await listStoredMeetingSessionIndexes();
  return indexes.map((index) => composeStoredMeetingSessionPreview(index));
}

export async function findLatestStoredMeetingSessionRecordByFingerprint(
  sessionFingerprint: string
): Promise<StoredMeetingSession | undefined> {
  const db = await openHistoryDb();
  const transaction = db.transaction(SESSION_INDEX_STORE, "readonly");
  const matches = await getRequestResult(
    transaction
      .objectStore(SESSION_INDEX_STORE)
      .index("sessionFingerprint")
      .getAll(IDBKeyRange.only(sessionFingerprint)) as IDBRequest<
      StoredMeetingSessionIndex[]
    >
  );

  if (matches.length === 0) {
    return undefined;
  }

  const latest = [...matches].sort((left, right) => {
    return getSessionReferenceTimestamp(right) - getSessionReferenceTimestamp(left);
  })[0]!;

  const events = await listStoredSessionEvents(latest.id);
  return composeStoredMeetingSession(latest, events);
}

export async function getStoredMeetingSessionRecord(
  sessionId: string
): Promise<StoredMeetingSession | undefined> {
  const db = await openHistoryDb();
  const transaction = db.transaction(SESSION_INDEX_STORE, "readonly");
  const index = await getRequestResult(
    transaction.objectStore(SESSION_INDEX_STORE).get(sessionId) as IDBRequest<
      StoredMeetingSessionIndex | undefined
    >
  );

  if (!index) {
    return undefined;
  }

  const events = await listStoredSessionEvents(sessionId);
  return composeStoredMeetingSession(index, events);
}

export async function getStoredMeetingSessionRecordBySyncId(
  sessionSyncId: string
): Promise<StoredMeetingSession | undefined> {
  const db = await openHistoryDb();
  const transaction = db.transaction(SESSION_INDEX_STORE, "readonly");
  const matches = await getRequestResult(
    transaction
      .objectStore(SESSION_INDEX_STORE)
      .index("sessionSyncId")
      .getAll(IDBKeyRange.only(sessionSyncId)) as IDBRequest<
      StoredMeetingSessionIndex[]
    >
  );

  const index = matches[0];
  if (!index) {
    return undefined;
  }

  const events = await listStoredSessionEvents(index.id);
  return composeStoredMeetingSession(index, events);
}

export async function putStoredMeetingSessionRecord(
  session: StoredMeetingSession
): Promise<void> {
  await putCompositeSessionRecord({
    ...session,
    events: extractCanonicalEvents(session),
  });
}

export async function replaceStoredMeetingSessionRecords(
  sessions: StoredMeetingSession[]
): Promise<void> {
  const normalizedSessions = sessions.map((session) =>
    normalizeMeetingSession(session)
  );
  const db = await openHistoryDb();
  const transaction = db.transaction(
    [SESSION_INDEX_STORE, SESSION_EVENT_CHUNK_STORE],
    "readwrite"
  );
  const sessionStore = transaction.objectStore(SESSION_INDEX_STORE);
  const chunkStore = transaction.objectStore(SESSION_EVENT_CHUNK_STORE);

  sessionStore.clear();
  chunkStore.clear();

  normalizedSessions.forEach((session) => {
    const events = session.events || [];
    sessionStore.put(buildStoredSessionIndex(session, events.length));
    buildSessionEventChunks(session.id, events).forEach((chunk) => {
      chunkStore.put(chunk);
    });
  });

  await waitForTransaction(transaction);
}

export async function deleteStoredMeetingSessionRecord(
  sessionId: string
): Promise<void> {
  await deleteStoredMeetingSessionRecordsByIds([sessionId]);
}

export async function clearStoredMeetingSessionRecords(): Promise<void> {
  const db = await openHistoryDb();
  const transaction = db.transaction(
    [SESSION_INDEX_STORE, SESSION_EVENT_CHUNK_STORE],
    "readwrite"
  );
  transaction.objectStore(SESSION_INDEX_STORE).clear();
  transaction.objectStore(SESSION_EVENT_CHUNK_STORE).clear();
  await waitForTransaction(transaction);
}

export async function estimateMeetingHistoryBytes(): Promise<number> {
  const sessions = await listStoredMeetingSessionRecords();
  return new Blob([JSON.stringify(sessions)]).size;
}
