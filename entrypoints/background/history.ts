import type {
  FindMeetingSessionContinuationCandidateRequest,
  FindMeetingSessionContinuationCandidateResponse,
  FinalizeMeetingSessionEndRequest,
  FinalizeMeetingSessionEndResponse,
  GenerateMeetingSummaryRequest,
  GenerateMeetingSummaryResponse,
  MeetingSession,
  ResolveMeetingSessionRequest,
  ResolveMeetingSessionResponse,
  SavedCaption,
  TranslateRequest,
  TranslateSessionCaptionRequest,
  TranslateSessionCaptionResponse,
  TranslateSessionCaptionsRequest,
  TranslateSessionCaptionsResponse,
  UpdateMeetingHistoryViewStateRequest,
} from "./types";
import {
  buildMeetingSessionDerivedData,
  buildMeetingSessionFingerprint,
  getMeetingSessionLastActivityTimestamp,
  getMeetingIdentityTokens,
  normalizeMeetingSession,
  sanitizeMeetingSessionIdentifiers,
} from "../shared/meeting-session";
import {
  clearStoredMeetingSessionRecords,
  deleteStoredMeetingSessionRecord,
  enforceMeetingHistoryRetentionPolicy,
  estimateMeetingHistoryBytes,
  findLatestStoredMeetingSessionRecordByFingerprint,
  getStoredMeetingSessionRecord,
  listStoredMeetingSessionIndexRecords,
  listStoredMeetingSessionRecords,
  putStoredMeetingSessionRecord,
} from "./history-db";
import {
  buildEvidenceBackedMeetingSummaryPrompt,
  findLatestMeetingSummary,
  buildMeetingSummaryPrompt,
  buildMeetingSummaryContinuationPrompt,
  buildMeetingSummaryReconciliationPrompt,
  buildStructuredMeetingSummaryPrompt,
  buildSummaryEvidenceExtractionPrompt,
  createMeetingSummaryArtifact,
} from "../shared/meeting-summary";
import {
  buildSummarySourceTimeline,
  mergeSummaryEvidence,
  planMeetingSummaryExecution,
  splitSummarySourceIntoChunks,
  type SummaryEvidence,
  type SummaryJobStatus,
  type SummarySourceChunk,
} from "../shared/summary-generation";
import {
  isAutomaticSummaryEnabledForProfile,
  resolveMeetingProfile,
  resolveMeetingProfilePrompt,
} from "../shared/meeting-profiles";
import { getSettings } from "./settings";
import { getOpenAiServiceAvailability } from "../shared/openai-service";
import {
  generateText,
  generateTextChunk,
  translate,
} from "./translation";
import {
  noteMeetingArchiveCleared,
  noteMeetingSessionDeleted,
  noteMeetingSessionSaved,
} from "./cloud-sync";
import {
  clearMeetingAssistantRuntimeState,
  queueMeetingAssistantProcessing,
} from "./assistant";
import { createBackgroundDiagnosticsLogger } from "./diagnostics";
import { getMeetingHistoryPageUrl } from "../shared/legal";
import {
  buildMeetingHistorySummaryTargetUrl,
  readMeetingHistoryUrlState,
} from "../meeting-history/url-state";
import { getSummaryReadyNotificationCopy } from "../shared/summary-ready-notification";

const meetingSummaryJobStatuses = new Map<string, SummaryJobStatus>();
const activeMeetingSummaryJobs = new Map<string, { controller: AbortController }>();
const MEETING_SUMMARY_QUEUE_STORAGE_KEY = "meetingSummaryQueue";
const SUMMARY_JOB_RETRY_ALARM = "meeting-summary-job-retry";
const SUMMARY_READY_NOTIFICATION_PREFIX = "summary-ready";
const SUMMARY_READY_NOTIFICATION_ICON = "icon-128.png";
const AUTO_SUMMARY_MAX_ATTEMPTS = 3;
const AUTO_SUMMARY_RECONCILE_WINDOW_MS = 60 * 60 * 1000;
const AUTO_SUMMARY_RECONCILE_LIMIT = 5;
const historyDiagnosticsLogger = createBackgroundDiagnosticsLogger({
  domain: "history",
  feature: "session-continuation",
});

const summaryDiagnosticsLogger = createBackgroundDiagnosticsLogger({
  domain: "history",
  feature: "meeting-summary-queue",
});

type PersistedMeetingSummaryJob = {
  request: GenerateMeetingSummaryRequest;
  source: "manual" | "automatic";
  enqueuedAt: number;
  status: SummaryJobStatus;
  attemptCount: number;
  maxAttempts: number;
  retryAfter?: number;
  lastError?: string;
};

type MeetingHistoryViewState = {
  key: string;
  tabId: number | null;
  selectedSessionId: string | null;
  visible: boolean;
  focused: boolean;
  updatedAt: number;
};

let meetingSummaryQueueInitialized = false;
let meetingSummaryQueueProcessingPromise: Promise<void> | null = null;
const meetingHistoryViewStates = new Map<string, MeetingHistoryViewState>();

class SummaryJobCancelledError extends Error {
  constructor() {
    super("Summary generation was cancelled.");
    this.name = "SummaryJobCancelledError";
  }
}

function isPersistedMeetingSummaryJob(value: unknown): value is PersistedMeetingSummaryJob {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PersistedMeetingSummaryJob;
  return (
    !!candidate.request &&
    typeof candidate.request.sessionId === "string" &&
    typeof candidate.request.targetLanguage === "string" &&
    typeof candidate.request.profileId === "string" &&
    (candidate.source === "manual" || candidate.source === "automatic") &&
    typeof candidate.enqueuedAt === "number" &&
    typeof candidate.attemptCount === "number" &&
    typeof candidate.maxAttempts === "number" &&
    !!candidate.status &&
    typeof candidate.status.sessionId === "string" &&
    typeof candidate.status.state === "string" &&
    typeof candidate.status.message === "string" &&
    typeof candidate.status.updatedAt === "number"
  );
}

async function loadPersistedMeetingSummaryJobs(): Promise<PersistedMeetingSummaryJob[]> {
  const result = await chrome.storage.local.get(MEETING_SUMMARY_QUEUE_STORAGE_KEY);
  const stored = result[MEETING_SUMMARY_QUEUE_STORAGE_KEY];
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const candidate = item as Partial<PersistedMeetingSummaryJob>;
      const source = candidate.source === "automatic" ? "automatic" : "manual";
      return {
        request: candidate.request!,
        source,
        enqueuedAt:
          typeof candidate.enqueuedAt === "number" ? candidate.enqueuedAt : Date.now(),
        status: candidate.status!,
        attemptCount:
          typeof candidate.attemptCount === "number" ? candidate.attemptCount : 0,
        maxAttempts:
          typeof candidate.maxAttempts === "number"
            ? candidate.maxAttempts
            : source === "automatic"
              ? AUTO_SUMMARY_MAX_ATTEMPTS
              : 1,
        retryAfter:
          typeof candidate.retryAfter === "number" ? candidate.retryAfter : undefined,
        lastError:
          typeof candidate.lastError === "string" ? candidate.lastError : undefined,
      };
    })
    .filter(isPersistedMeetingSummaryJob);
}

async function savePersistedMeetingSummaryJobs(
  jobs: PersistedMeetingSummaryJob[]
): Promise<void> {
  await chrome.storage.local.set({
    [MEETING_SUMMARY_QUEUE_STORAGE_KEY]: jobs,
  });
}

async function getPersistedMeetingSummaryJob(
  sessionId: string
): Promise<PersistedMeetingSummaryJob | null> {
  const jobs = await loadPersistedMeetingSummaryJobs();
  return jobs.find((job) => job.request.sessionId === sessionId) || null;
}

async function upsertPersistedMeetingSummaryJob(
  nextJob: PersistedMeetingSummaryJob
): Promise<void> {
  const jobs = await loadPersistedMeetingSummaryJobs();
  const nextJobs = jobs.filter(
    (job) => job.request.sessionId !== nextJob.request.sessionId
  );
  nextJobs.push(nextJob);
  nextJobs.sort((left, right) => left.enqueuedAt - right.enqueuedAt);
  await savePersistedMeetingSummaryJobs(nextJobs);
}

async function updatePersistedMeetingSummaryJobStatus(
  sessionId: string,
  status: SummaryJobStatus
): Promise<void> {
  const jobs = await loadPersistedMeetingSummaryJobs();
  const nextJobs = jobs.map((job) =>
    job.request.sessionId === sessionId
      ? {
          ...job,
          status,
        }
      : job
  );
  await savePersistedMeetingSummaryJobs(nextJobs);
}

async function removePersistedMeetingSummaryJob(sessionId: string): Promise<void> {
  const jobs = await loadPersistedMeetingSummaryJobs();
  const nextJobs = jobs.filter((job) => job.request.sessionId !== sessionId);
  await savePersistedMeetingSummaryJobs(nextJobs);
}

function getSummaryJobBackoffMs(attemptCount: number): number {
  const steps = [15_000, 60_000, 5 * 60_000];
  return steps[Math.min(attemptCount, steps.length - 1)];
}

function isRetryableSummaryError(error: string): boolean {
  const normalized = error.toLowerCase();
  return (
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("connection") ||
    normalized.includes("fetch failed") ||
    normalized.includes("service unavailable") ||
    normalized.includes("502") ||
    normalized.includes("503") ||
    normalized.includes("504") ||
    normalized.includes("429")
  );
}

async function scheduleMeetingSummaryRetryAlarm(): Promise<void> {
  const jobs = await loadPersistedMeetingSummaryJobs();
  const retryTimestamps = jobs
    .map((job) => job.retryAfter)
    .filter((value): value is number => typeof value === "number" && value > Date.now())
    .sort((left, right) => left - right);

  if (retryTimestamps.length === 0) {
    await chrome.alarms.clear(SUMMARY_JOB_RETRY_ALARM);
    return;
  }

  await chrome.alarms.create(SUMMARY_JOB_RETRY_ALARM, {
    when: retryTimestamps[0],
  });
}

function getAutomaticSummaryRequest(
  session: MeetingSession,
  settings: Awaited<ReturnType<typeof getSettings>>["settings"]
): GenerateMeetingSummaryRequest | null {
  if (!settings.meetingOutputLanguage || settings.meetingProfiles.length === 0) {
    return null;
  }

  if (!session.endTime && session.lifecycleState !== "ended") {
    return null;
  }

  if (session.captions.length === 0 && session.chatMessages.length === 0) {
    return null;
  }

  const summaryProfile = resolveMeetingProfile(
    settings.meetingProfiles,
    session.meetingProfileId,
    settings.defaultMeetingProfileId
  );

  if (!isAutomaticSummaryEnabledForProfile(summaryProfile)) {
    return null;
  }

  const existingSummary = findLatestMeetingSummary(
    session.summaries || session.artifacts?.summaries,
    {
      profileId: summaryProfile.id,
      language: settings.meetingOutputLanguage,
    }
  );
  const latestSessionBoundary = Math.max(
    typeof session.endTime === "number" ? session.endTime : 0,
    typeof session.lastSeenAt === "number" ? session.lastSeenAt : 0,
    typeof session.updatedAt === "number" ? session.updatedAt : 0,
    session.startTime
  );

  if (
    existingSummary &&
    existingSummary.generatedAt >= latestSessionBoundary
  ) {
    return null;
  }

  return {
    sessionId: session.id,
    targetLanguage: settings.meetingOutputLanguage,
    profileId: summaryProfile.id,
  };
}

async function maybeQueueAutomaticSummaryForEndedSession(
  session: MeetingSession,
  settings: Awaited<ReturnType<typeof getSettings>>["settings"]
): Promise<boolean> {
  const request = getAutomaticSummaryRequest(session, settings);
  if (!request) {
    return false;
  }

  if (
    activeMeetingSummaryJobs.has(request.sessionId) ||
    (await getPersistedMeetingSummaryJob(request.sessionId))
  ) {
    await replaceQueuedMeetingSummaryJob(request.sessionId);
  }

  await queueMeetingSummaryJob(request, "automatic");
  void processPersistedMeetingSummaryJobs();
  return true;
}

async function waitForMeetingSummaryJobToStop(
  sessionId: string,
  timeoutMs = 10_000
): Promise<void> {
  const startedAt = Date.now();

  while (activeMeetingSummaryJobs.has(sessionId)) {
    if (Date.now() - startedAt >= timeoutMs) {
      break;
    }

    await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
  }
}

async function replaceQueuedMeetingSummaryJob(sessionId: string): Promise<void> {
  const activeJob = activeMeetingSummaryJobs.get(sessionId);
  if (activeJob) {
    activeJob.controller.abort();
  }

  await removePersistedMeetingSummaryJob(sessionId);

  if (activeJob) {
    await waitForMeetingSummaryJobToStop(sessionId);
  }
}

async function reconcileAutomaticSummaryQueue(): Promise<void> {
  const { settings } = await getSettings();
  if (!settings.meetingProfiles.some((profile) => profile.autoSummarizeOnMeetingEnd)) {
    return;
  }

  const sessions = await loadStoredMeetingSessions();
  const reconcileCandidates = sessions
    .filter(
      (session) =>
        Boolean(session.endTime || session.lifecycleState === "ended") &&
        (session.endTime || 0) >= Date.now() - AUTO_SUMMARY_RECONCILE_WINDOW_MS
    )
    .sort((left, right) => (right.endTime || 0) - (left.endTime || 0))
    .slice(0, AUTO_SUMMARY_RECONCILE_LIMIT);

  for (const session of reconcileCandidates) {
    await maybeQueueAutomaticSummaryForEndedSession(session, settings);
  }
}

async function emitMeetingSummaryJobStatus(
  status: SummaryJobStatus
): Promise<void> {
  meetingSummaryJobStatuses.set(status.sessionId, status);

  try {
    await chrome.runtime.sendMessage({
      action: "meetingSummaryJobStatusChanged",
      status,
    });
  } catch {
    // No active listeners is fine.
  }
}

function clearMeetingSummaryJobStatus(sessionId: string): void {
  meetingSummaryJobStatuses.delete(sessionId);
}

function buildSummaryReadyNotificationId(
  sessionId: string,
  summaryKey: string
): string {
  return `${SUMMARY_READY_NOTIFICATION_PREFIX}:${encodeURIComponent(sessionId)}|${encodeURIComponent(summaryKey)}`;
}

function parseSummaryReadyNotificationId(notificationId: string): {
  sessionId: string;
  summaryKey: string;
} | null {
  if (!notificationId.startsWith(`${SUMMARY_READY_NOTIFICATION_PREFIX}:`)) {
    return null;
  }

  const encodedTarget = notificationId.slice(
    SUMMARY_READY_NOTIFICATION_PREFIX.length + 1
  );
  const separatorIndex = encodedTarget.indexOf("|");
  if (separatorIndex < 0) {
    return null;
  }

  const encodedSessionId = encodedTarget.slice(0, separatorIndex);
  const encodedSummaryKey = encodedTarget.slice(separatorIndex + 1);

  try {
    const sessionId = decodeURIComponent(encodedSessionId);
    const summaryKey = decodeURIComponent(encodedSummaryKey);

    return sessionId && summaryKey ? { sessionId, summaryKey } : null;
  } catch {
    return null;
  }
}

function getMeetingHistoryViewStateKey(
  request: UpdateMeetingHistoryViewStateRequest,
  sender: chrome.runtime.MessageSender
): string | null {
  if (typeof sender.documentId === "string" && sender.documentId.trim()) {
    return `document:${sender.documentId.trim()}`;
  }

  if (typeof sender.tab?.id === "number") {
    return `tab:${sender.tab.id}`;
  }

  if (
    typeof request.viewInstanceId === "string" &&
    request.viewInstanceId.trim()
  ) {
    return `view:${request.viewInstanceId.trim()}`;
  }

  return null;
}

function setMeetingHistoryViewState(
  key: string,
  sender: chrome.runtime.MessageSender,
  request: UpdateMeetingHistoryViewStateRequest
): void {
  meetingHistoryViewStates.set(key, {
    key,
    tabId: typeof sender.tab?.id === "number" ? sender.tab.id : null,
    selectedSessionId:
      typeof request.selectedSessionId === "string" && request.selectedSessionId.trim()
        ? request.selectedSessionId.trim()
        : null,
    visible: request.visible === true,
    focused: request.focused === true,
    updatedAt: Date.now(),
  });
}

function removeMeetingHistoryViewStateForTab(tabId: number): void {
  for (const [key, state] of meetingHistoryViewStates.entries()) {
    if (state.tabId === tabId) {
      meetingHistoryViewStates.delete(key);
    }
  }
}

function shouldSuppressSummaryReadyNotification(sessionId: string): boolean {
  for (const state of meetingHistoryViewStates.values()) {
    if (
      state.selectedSessionId === sessionId &&
      state.visible &&
      state.focused
    ) {
      return true;
    }
  }

  return false;
}

function resolveSummaryReadyNotificationCopy(session: MeetingSession): {
  title: string;
  message: string;
} {
  const browserLocale =
    chrome.i18n?.getUILanguage?.() || globalThis.navigator?.language || "en";
  const meetingLabel =
    session.title?.trim() || session.providerLabel || "Meeting";

  const copy = getSummaryReadyNotificationCopy({
    browserLocale,
    title: meetingLabel,
  });

  return {
    title: copy.title,
    message: copy.message,
  };
}

async function maybeShowSummaryReadyNotification(
  session: MeetingSession,
  summary: NonNullable<GenerateMeetingSummaryResponse["summary"]>
): Promise<boolean> {
  if (shouldSuppressSummaryReadyNotification(session.id)) {
    await summaryDiagnosticsLogger.debug("summary_ready_notification_suppressed", {
      sessionId: session.id,
      summaryKey: summary.key,
    }, {
      sessionId: session.id,
    });
    return false;
  }

  if (!chrome.notifications?.create) {
    return false;
  }

  try {
    const notificationId = buildSummaryReadyNotificationId(session.id, summary.key);
    const copy = resolveSummaryReadyNotificationCopy(session);

    await chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: SUMMARY_READY_NOTIFICATION_ICON,
      title: copy.title,
      message: copy.message,
    });

    await summaryDiagnosticsLogger.info("summary_ready_notification_created", {
      sessionId: session.id,
      summaryKey: summary.key,
      notificationId,
    }, {
      sessionId: session.id,
    });
    return true;
  } catch (error) {
    await summaryDiagnosticsLogger.warn("summary_ready_notification_failed", {
      sessionId: session.id,
      summaryKey: summary.key,
      error,
    }, {
      sessionId: session.id,
    });
    return false;
  }
}

async function openMeetingHistoryForSummaryTarget(params: {
  sessionId: string;
  summaryKey: string;
}): Promise<boolean> {
  const targetUrl = buildMeetingHistorySummaryTargetUrl(
    getMeetingHistoryPageUrl(),
    params
  );

  try {
    const [tabs, lastFocusedWindowTabs] = await Promise.all([
      chrome.tabs.query({}),
      chrome.tabs.query({ active: true, lastFocusedWindow: true }),
    ]);
    const historyBaseUrl = getMeetingHistoryPageUrl();
    const lastFocusedTab = lastFocusedWindowTabs[0];
    const matchingTab = tabs
      .filter(
        (tab): tab is chrome.tabs.Tab & { id: number; url: string } =>
          typeof tab.id === "number" &&
          typeof tab.url === "string" &&
          tab.url.startsWith(historyBaseUrl)
      )
      .map((tab) => {
        const historyUrlState = readMeetingHistoryUrlState(tab.url);
        let score = 0;

        if (tab.url === targetUrl) {
          score += 1_000;
        }

        if (typeof lastFocusedTab?.id === "number" && tab.id === lastFocusedTab.id) {
          score += 500;
        }

        if (
          typeof lastFocusedTab?.windowId === "number" &&
          tab.windowId === lastFocusedTab.windowId
        ) {
          score += 250;
        }

        if (historyUrlState.selectedSessionId === params.sessionId) {
          score += 100;
        }

        if (historyUrlState.targetSummaryKey === params.summaryKey) {
          score += 100;
        }

        if (tab.active) {
          score += 50;
        }

        return { tab, score };
      })
      .sort((left, right) => right.score - left.score)[0]?.tab;

    if (matchingTab) {
      await chrome.tabs.update(matchingTab.id, {
        active: true,
        url: targetUrl,
      });

      if (typeof matchingTab.windowId === "number" && chrome.windows?.update) {
        await chrome.windows.update(matchingTab.windowId, { focused: true });
      }

      return true;
    }

    await chrome.tabs.create({ url: targetUrl });
    return true;
  } catch (error) {
    await summaryDiagnosticsLogger.error("summary_ready_notification_navigation_failed", {
      sessionId: params.sessionId,
      summaryKey: params.summaryKey,
      error,
    }, {
      sessionId: params.sessionId,
    });
    return false;
  }
}

export async function initializeMeetingSummaryQueue(): Promise<void> {
  const jobs = await loadPersistedMeetingSummaryJobs();

  meetingSummaryJobStatuses.clear();
  for (const job of jobs) {
    const status =
      job.status.state === "completed" ||
      job.status.state === "failed" ||
      job.status.state === "cancelled"
        ? job.status
        : {
            ...job.status,
            state: "preflighting",
            message:
              job.status.state === "preflighting"
                ? job.status.message
                : "Resuming summary generation",
            updatedAt: Date.now(),
          };

    meetingSummaryJobStatuses.set(job.request.sessionId, status);

    if (status !== job.status) {
      await updatePersistedMeetingSummaryJobStatus(job.request.sessionId, status);
    }
  }

  meetingSummaryQueueInitialized = true;
  await reconcileAutomaticSummaryQueue();
  await scheduleMeetingSummaryRetryAlarm();
  void processPersistedMeetingSummaryJobs();
}

export async function handleMeetingSummaryRetryAlarm(): Promise<void> {
  if (!meetingSummaryQueueInitialized) {
    await initializeMeetingSummaryQueue();
    return;
  }

  await processPersistedMeetingSummaryJobs();
}

export async function shutdownMeetingSummaryQueueForTermsRevocation(): Promise<void> {
  const activeControllers = [...activeMeetingSummaryJobs.values()].map(
    (job) => job.controller
  );

  for (const controller of activeControllers) {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }

  activeMeetingSummaryJobs.clear();
  meetingSummaryJobStatuses.clear();
  meetingSummaryQueueInitialized = false;
  meetingSummaryQueueProcessingPromise = null;
  await chrome.alarms.clear(SUMMARY_JOB_RETRY_ALARM);
}

function ensureSummaryJobActive(sessionId: string): AbortController {
  const job = activeMeetingSummaryJobs.get(sessionId);
  if (!job) {
    throw new SummaryJobCancelledError();
  }

  if (job.controller.signal.aborted) {
    throw new SummaryJobCancelledError();
  }

  return job.controller;
}

async function loadStoredMeetingSessions(): Promise<MeetingSession[]> {
  const records = await listStoredMeetingSessionRecords();
  return records
    .map(normalizeMeetingSession)
    .sort((left, right) => right.startTime - left.startTime);
}

async function loadStoredMeetingSessionIndexes(): Promise<MeetingSession[]> {
  const records = await listStoredMeetingSessionIndexRecords();
  return records
    .map(
      (record) =>
        ({
          ...record,
          captions: record.derived?.previewCaptions || record.captions || [],
          chatMessages:
            record.derived?.previewChatMessages || record.chatMessages || [],
          summaries: record.artifacts?.summaries || record.summaries || {},
          events: [],
          searchableText:
            record.derived?.searchableText || record.searchableText || "",
        }) as MeetingSession
    )
    .sort((left, right) => right.startTime - left.startTime);
}

async function loadStoredMeetingSession(
  sessionId: string
): Promise<MeetingSession | null> {
  const record = await getStoredMeetingSessionRecord(sessionId);
  return record ? normalizeMeetingSession(record) : null;
}

function createResolvedSession(
  request: ResolveMeetingSessionRequest
): MeetingSession {
  const now = Date.now();
  const identifiers = sanitizeMeetingSessionIdentifiers(
    request.platform,
    request.identifiers
  );
  const session: MeetingSession = {
    id: now.toString(36) + Math.random().toString(36).slice(2),
    sessionSyncId: undefined,
    schemaVersion: 3,
    platform: request.platform,
    providerLabel: request.providerLabel,
    meetingUrl: request.sourceUrl,
    title: request.title,
    starred: false,
    identifiers,
    sessionFingerprint: buildMeetingSessionFingerprint({
      platform: request.platform,
      meetingUrl: request.sourceUrl,
      identifiers,
      title: request.title,
    }),
    lifecycleState: "live",
    lastSeenAt: now,
    updatedAt: now,
    searchableText: "",
    startTime: now,
    meetingProfileId: request.meetingProfileId?.trim() || undefined,
    events: [],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
  };

  session.sessionSyncId = session.id;

  return updateSessionSearchableText(session);
}

function shouldReuseStoredSession(
  session: MeetingSession,
  request: ResolveMeetingSessionRequest
): boolean {
  return session.lifecycleState === "live" || !session.endTime;
}

function getStableContinuationIdentifiers(
  platform: MeetingSession["platform"] | ResolveMeetingSessionRequest["platform"],
  identifiers: MeetingSession["identifiers"] | ResolveMeetingSessionRequest["identifiers"]
): string[] {
  return Array.from(
    new Set(
      getMeetingIdentityTokens(platform, identifiers)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function getSessionContinuationWindowMs(
  settings: Awaited<ReturnType<typeof getSettings>>["settings"]
): number {
  return settings.sessionContinuationWindowMinutes * 60 * 1000;
}

function getContinuationReferenceTimestamp(
  session: Pick<MeetingSession, "lastSeenAt" | "endTime" | "startTime">
): number {
  return getMeetingSessionLastActivityTimestamp(session);
}

function scoreContinuationCandidate(
  session: MeetingSession,
  request: FindMeetingSessionContinuationCandidateRequest,
  continuationWindowMs: number
): number {
  if (continuationWindowMs <= 0) {
    return -1;
  }

  if (session.platform !== request.platform) {
    return -1;
  }

  const referenceTime = getContinuationReferenceTimestamp(session);
  if (Date.now() - referenceTime > continuationWindowMs) {
    return -1;
  }

  if (!session.endTime && session.lifecycleState === "live") {
    return -1;
  }

  const sessionIdentifiers = getStableContinuationIdentifiers(
    session.platform,
    session.identifiers
  );
  const requestIdentifiers = getStableContinuationIdentifiers(
    request.platform,
    request.identifiers
  );
  const sharedIdentifierCount = sessionIdentifiers.filter((identifier) =>
    requestIdentifiers.includes(identifier)
  ).length;

  if (sharedIdentifierCount > 0) {
    return 100 + sharedIdentifierCount;
  }

  if (request.platform === "microsoft-teams") {
    return -1;
  }

  const sameUrl =
    normalizeReusableUrl(session.meetingUrl) ===
    normalizeReusableUrl(request.sourceUrl);
  if (sameUrl) {
    return 80;
  }

  const sessionTitle = normalizeReusableTitle(session.title);
  const requestTitle = normalizeReusableTitle(request.title);
  if (
    session.providerLabel === request.providerLabel &&
    sessionTitle &&
    requestTitle &&
    sessionTitle === requestTitle
  ) {
    return 60;
  }

  return -1;
}

async function findFallbackContinuationCandidate(
  request: FindMeetingSessionContinuationCandidateRequest,
  continuationWindowMs: number
): Promise<MeetingSession | null> {
  const recentSessions = await loadStoredMeetingSessionIndexes();
  const rankedCandidate = recentSessions
    .map((session) => ({
      session,
      score: scoreContinuationCandidate(session, request, continuationWindowMs),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightTimestamp = getContinuationReferenceTimestamp(right.session);
      const leftTimestamp = getContinuationReferenceTimestamp(left.session);
      return rightTimestamp - leftTimestamp;
    })[0];

  return rankedCandidate?.session || null;
}

function canResumeStoredSession(
  session: MeetingSession,
  request: ResolveMeetingSessionRequest,
  continuationWindowMs: number
): boolean {
  return evaluateContinuationResume(session, request, continuationWindowMs).ok;
}

function evaluateContinuationResume(
  session: MeetingSession,
  request: ResolveMeetingSessionRequest,
  continuationWindowMs: number
): {
  ok: boolean;
  reason: string;
  referenceTime: number;
  ageMs: number;
} {
  const referenceTime = getContinuationReferenceTimestamp(session);
  const ageMs = Date.now() - referenceTime;

  if (continuationWindowMs <= 0) {
    return {
      ok: false,
      reason: "continuation-disabled",
      referenceTime,
      ageMs,
    };
  }

  if (ageMs > continuationWindowMs) {
    return {
      ok: false,
      reason: "outside-window",
      referenceTime,
      ageMs,
    };
  }

  if (!session.endTime && session.lifecycleState === "live") {
    return {
      ok: true,
      reason: "live-session",
      referenceTime,
      ageMs,
    };
  }

  const sessionIdentifiers = getStableContinuationIdentifiers(
    session.platform,
    session.identifiers
  );
  const requestIdentifiers = getStableContinuationIdentifiers(
    request.platform,
    request.identifiers
  );
  if (sessionIdentifiers.length > 0 && requestIdentifiers.length > 0) {
    return {
      ok: sessionIdentifiers.some((identifier) =>
        requestIdentifiers.includes(identifier)
      ),
      reason: sessionIdentifiers.some((identifier) =>
        requestIdentifiers.includes(identifier)
      )
        ? "identifier-match"
        : "identifier-mismatch",
      referenceTime,
      ageMs,
    };
  }

  if (
    normalizeReusableUrl(session.meetingUrl) !==
    normalizeReusableUrl(request.sourceUrl)
  ) {
    return {
      ok: false,
      reason: "url-mismatch",
      referenceTime,
      ageMs,
    };
  }

  if (request.platform === "microsoft-teams") {
    return {
      ok: false,
      reason: "teams-missing-identifiers",
      referenceTime,
      ageMs,
    };
  }

  const sessionTitle = normalizeReusableTitle(session.title);
  const requestTitle = normalizeReusableTitle(request.title);
  if (sessionTitle && requestTitle && sessionTitle !== requestTitle) {
    return {
      ok: false,
      reason: "title-mismatch",
      referenceTime,
      ageMs,
    };
  }

  return {
    ok: true,
    reason: "url-match",
    referenceTime,
    ageMs,
  };
}

function buildTimelineContext(
  session: MeetingSession,
  source: "caption" | "chat",
  timestamp: number
): string | undefined {
  const timeline = [
    ...session.captions.map((caption) => ({
      source: "caption" as const,
      timestamp: caption.timestamp,
      speaker: caption.speaker,
      text: caption.text,
    })),
    ...session.chatMessages.map((message) => ({
      source: "chat" as const,
      timestamp: message.timestamp,
      speaker: message.speaker,
      text: message.text,
    })),
  ].sort((left, right) => left.timestamp - right.timestamp);

  const itemIndex = timeline.findIndex(
    (item) => item.source === source && item.timestamp === timestamp
  );

  if (itemIndex <= 0) {
    return undefined;
  }

  return timeline
    .slice(Math.max(0, itemIndex - 3), itemIndex)
    .map((item) => `[${item.speaker || "Unknown"}]: ${item.text}`)
    .join("\n");
}

function updateSessionSearchableText(session: MeetingSession): MeetingSession {
  const derived = buildMeetingSessionDerivedData(session);
  const summaries = session.summaries || session.artifacts?.summaries || {};
  return {
    ...session,
    summaries,
    derived,
    searchableText: derived.searchableText,
    artifacts: {
      ...(session.artifacts || {}),
      summaries,
    },
  };
}

function normalizeReusableUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function normalizeReusableTitle(title?: string): string | null {
  const normalized = title?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function syncSessionEventsWithItemUpdate(
  session: MeetingSession,
  source: "caption" | "chat",
  timestamp: number,
  updates: Partial<Pick<SavedCaption, "text" | "translation" | "translationLanguage">>
): MeetingSession {
  if (!Array.isArray(session.events) || session.events.length === 0) {
    return session;
  }

  return {
    ...session,
    events: session.events.map((event) =>
      event.source === source && event.timestamp === timestamp
        ? {
            ...event,
            text: updates.text ?? event.text,
            translation:
              updates.translation !== undefined
                ? updates.translation
                : event.translation,
            translationLanguage:
              updates.translationLanguage !== undefined
                ? updates.translationLanguage
                : event.translationLanguage,
          }
        : event
    ),
  };
}

const MAX_BATCH_CAPTIONS = 24;
const MAX_BATCH_CHARACTERS = 7000;
const SUMMARY_MAX_TOKENS = 3200;
const SUMMARY_RECONCILIATION_MAX_TOKENS = 2200;
const SUMMARY_EVIDENCE_MAX_TOKENS = 1800;
const MAX_SUMMARY_CONTINUATIONS = 12;

function isOutputLimitError(error?: string): boolean {
  const normalized = (error || "").toLowerCase();
  return (
    normalized.includes("truncated") ||
    normalized.includes("output token limit") ||
    normalized.includes("max_tokens")
  );
}

async function generateMeetingSummaryText(
  sessionId: string,
  prompt: string,
  targetLanguage: string,
  shouldReconcile: boolean,
  onProgress?: (status: Omit<SummaryJobStatus, "sessionId" | "updatedAt">) => Promise<void>
): Promise<{
  success: boolean;
  text?: string;
  error?: string;
  continuationCount: number;
  reconciled: boolean;
}> {
  let currentPrompt = prompt;
  let combinedText = "";
  let continuationCount = 0;

  for (
    let segmentIndex = 0;
    segmentIndex < MAX_SUMMARY_CONTINUATIONS;
    segmentIndex += 1
  ) {
    const controller = ensureSummaryJobActive(sessionId);

    if (segmentIndex > 0 && onProgress) {
      await onProgress({
        state: "continuing",
        message: "Continuing the summary",
        progressCurrent: segmentIndex,
        progressTotal: MAX_SUMMARY_CONTINUATIONS,
      });
    }

    const response = await generateTextChunk(
      currentPrompt,
      SUMMARY_MAX_TOKENS,
      controller.signal
    );

    ensureSummaryJobActive(sessionId);

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Summary generation failed.",
        continuationCount,
        reconciled: false,
      };
    }

    const nextChunk = response.text.trim();
    if (!nextChunk) {
      return {
        success: false,
        error: "The model returned an empty summary segment.",
        continuationCount,
        reconciled: false,
      };
    }

    combinedText = combinedText
      ? `${combinedText.replace(/\s+$/, "")}\n${nextChunk}`
      : nextChunk;

    if (!response.truncated) {
      const finalizedText = combinedText.trim();

      if (!shouldReconcile || continuationCount === 0) {
        return {
          success: true,
          text: finalizedText,
          continuationCount,
          reconciled: false,
        };
      }

      if (onProgress) {
        await onProgress({
          state: "reconciling",
          message: "Running final checks",
        });
      }

      const reconciledResponse = await generateText(
        buildMeetingSummaryReconciliationPrompt(targetLanguage, finalizedText),
        SUMMARY_RECONCILIATION_MAX_TOKENS,
        controller.signal
      );
      ensureSummaryJobActive(sessionId);

      if (reconciledResponse.success && reconciledResponse.text?.trim()) {
        return {
          success: true,
          text: reconciledResponse.text.trim(),
          continuationCount,
          reconciled: true,
        };
      }

      return {
        success: true,
        text: finalizedText,
        continuationCount,
        reconciled: false,
      };
    }

    continuationCount += 1;
    currentPrompt = buildMeetingSummaryContinuationPrompt(prompt, combinedText);
  }

  return {
    success: false,
    error:
      "The model kept returning truncated summary segments before the full response could be completed.",
    continuationCount,
    reconciled: false,
  };
}

function parseSummaryEvidence(text: string): SummaryEvidence {
  const parsed = JSON.parse(extractJsonPayload(text)) as Partial<SummaryEvidence>;

  const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const speakerSignals = Array.isArray(parsed.speakerSignals)
    ? parsed.speakerSignals
        .filter(
          (item): item is { speaker?: string; signal?: string } =>
            typeof item === "object" && item !== null
        )
        .map((item) => ({
          speaker: item.speaker?.trim() || "Unknown",
          signal: item.signal?.trim() || "",
        }))
        .filter((item) => Boolean(item.signal))
    : [];

  return {
    facts: toStringArray(parsed.facts),
    decisions: toStringArray(parsed.decisions),
    actionItems: toStringArray(parsed.actionItems),
    risks: toStringArray(parsed.risks),
    openQuestions: toStringArray(parsed.openQuestions),
    notableDetails: toStringArray(parsed.notableDetails),
    snippets: toStringArray(parsed.snippets),
    speakerSignals,
  };
}

function formatSummarySourceChunk(chunk: SummarySourceChunk): string {
  return chunk.items
    .map((item) => {
      const sourceLabel = item.source === "chat" ? "chat" : "caption";
      const timeLabel = item.time || new Date(item.timestamp).toLocaleTimeString("en-US");
      return `- source: ${sourceLabel}\n  time: ${timeLabel}\n  speaker: ${item.speaker}\n  text: ${item.text}`;
    })
    .join("\n");
}

async function extractSummaryEvidenceFromChunk(
  sessionId: string,
  session: MeetingSession,
  targetLanguage: string,
  profileName: string,
  summaryPrompt: string,
  chunk: SummarySourceChunk,
  chunkCount: number
): Promise<SummaryEvidence> {
  const controller = ensureSummaryJobActive(sessionId);
  const prompt = buildSummaryEvidenceExtractionPrompt(
    session,
    targetLanguage,
    profileName,
    summaryPrompt,
    formatSummarySourceChunk(chunk),
    chunk.chunkIndex,
    chunkCount
  );

  const response = await generateTextChunk(
    prompt,
    SUMMARY_EVIDENCE_MAX_TOKENS,
    controller.signal
  );

  ensureSummaryJobActive(sessionId);

  if (response.success && response.text && !response.truncated) {
    return parseSummaryEvidence(response.text);
  }

  if (
    (response.truncated || isOutputLimitError(response.error)) &&
    chunk.items.length > 1
  ) {
    const midpoint = Math.ceil(chunk.items.length / 2);
    const leftChunk: SummarySourceChunk = {
      ...chunk,
      items: chunk.items.slice(0, midpoint),
      estimatedChars: 0,
    };
    const rightChunk: SummarySourceChunk = {
      ...chunk,
      items: chunk.items.slice(midpoint),
      estimatedChars: 0,
    };

    const [leftEvidence, rightEvidence] = await Promise.all([
      extractSummaryEvidenceFromChunk(
        sessionId,
        session,
        targetLanguage,
        profileName,
        summaryPrompt,
        leftChunk,
        chunkCount + 1
      ),
      extractSummaryEvidenceFromChunk(
        sessionId,
        session,
        targetLanguage,
        profileName,
        summaryPrompt,
        rightChunk,
        chunkCount + 1
      ),
    ]);

    return mergeSummaryEvidence([leftEvidence, rightEvidence]);
  }

  throw new Error(response.error || "Evidence extraction failed.");
}

type CaptionBatchItem = {
  timestamp: number;
  speaker: string;
  text: string;
};

type ParsedCaptionTranslation = {
  timestamp: number;
  translation: string;
};

function buildCaptionTranslationBatchPrompt(
  session: MeetingSession,
  captions: CaptionBatchItem[],
  targetLanguage: string,
  customPrompt?: string
): string {
  const items = captions
    .map(
      (caption) =>
        `- timestamp: ${caption.timestamp}\n  speaker: ${caption.speaker || "Unknown"}\n  text: ${caption.text}`
    )
    .join("\n");

  return `You are translating browser meeting captions into ${targetLanguage}.

Translate each caption item independently, but use the surrounding chunk for context when useful.

Rules:
1. Translate every item completely and naturally.
2. Keep timestamps exactly the same.
3. Return valid JSON only. Do not wrap in markdown fences.
4. Output format:
{"translations":[{"timestamp":123,"translation":"..."}]}
5. Include exactly one translation entry for each input item, in the same order.
6. Do not omit any item, even if the text is short or repetitive.

Meeting provider: ${session.providerLabel}
Meeting title: ${session.title || "Untitled session"}

Additional instructions:
${customPrompt?.trim() || "Translate naturally and preserve the speaker's perspective."}

Items:
${items}`;
}

function stripJsonFences(input: string): string {
  return input.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonPayload(input: string): string {
  const cleaned = stripJsonFences(input);
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");

  if (objectStart >= 0 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }

  return cleaned;
}

function parseCaptionTranslations(text: string): ParsedCaptionTranslation[] {
  const parsed = JSON.parse(extractJsonPayload(text)) as
    | { translations?: Array<{ timestamp?: number | string; translation?: string }> }
    | Array<{ timestamp?: number | string; translation?: string }>;

  const items = Array.isArray(parsed) ? parsed : parsed.translations;
  if (!Array.isArray(items)) {
    throw new Error("Batch translation did not return a translations array.");
  }

  return items
    .map((item) => ({
      timestamp: Number(item.timestamp),
      translation: typeof item.translation === "string" ? item.translation.trim() : "",
    }))
    .filter(
      (item) =>
        Number.isFinite(item.timestamp) &&
        item.timestamp > 0 &&
        Boolean(item.translation)
    );
}

function splitCaptionBatch(items: CaptionBatchItem[]): CaptionBatchItem[][] {
  const chunks: CaptionBatchItem[][] = [];
  let currentChunk: CaptionBatchItem[] = [];
  let currentChars = 0;

  for (const item of items) {
    const itemSize = `${item.speaker}\n${item.text}`.length;
    const exceedsItemLimit = currentChunk.length >= MAX_BATCH_CAPTIONS;
    const exceedsCharLimit =
      currentChunk.length > 0 &&
      currentChars + itemSize > MAX_BATCH_CHARACTERS;

    if (exceedsItemLimit || exceedsCharLimit) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChars = 0;
    }

    currentChunk.push(item);
    currentChars += itemSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function translateCaptionIndividually(
  session: MeetingSession,
  caption: SavedCaption,
  captionIndex: number,
  targetLanguage: string,
  customPrompt: string
): Promise<string> {
  const response = await translate({
    id: `${session.id}:${caption.timestamp}`,
    text: caption.text,
    targetLang: targetLanguage,
    mode: "semantic",
    force: true,
    speaker: caption.speaker,
    context: buildTimelineContext(session, "caption", caption.timestamp),
    customPrompt,
  });

  if (!response.success || !response.translation) {
    throw new Error(response.error || "Translation failed.");
  }

  return response.translation;
}

async function translateCaptionBatch(
  session: MeetingSession,
  captions: Array<{ caption: SavedCaption; index: number }>,
  targetLanguage: string,
  customPrompt: string
): Promise<Map<number, string>> {
  const requestedItems = captions.map(({ caption }) => ({
    timestamp: caption.timestamp,
    speaker: caption.speaker,
    text: caption.text,
  }));
  const chunks = splitCaptionBatch(requestedItems);
  const translations = new Map<number, string>();
  const captionIndexByTimestamp = new Map(
    captions.map(({ caption, index }) => [caption.timestamp, index])
  );

  for (const chunk of chunks) {
    const prompt = buildCaptionTranslationBatchPrompt(
      session,
      chunk,
      targetLanguage,
      customPrompt
    );

    try {
      const response = await generateText(prompt, 2200);
      if (!response.success || !response.text) {
        throw new Error(response.error || "Batch translation failed.");
      }

      const parsed = parseCaptionTranslations(response.text);
      const parsedMap = new Map(
        parsed.map((item) => [item.timestamp, item.translation])
      );

      for (const item of chunk) {
        const translatedText = parsedMap.get(item.timestamp);
        if (translatedText) {
          translations.set(item.timestamp, translatedText);
          continue;
        }

        const captionIndex = captionIndexByTimestamp.get(item.timestamp);
        if (captionIndex === undefined) {
          continue;
        }

        const caption = session.captions[captionIndex];
        translations.set(
          item.timestamp,
          await translateCaptionIndividually(
            session,
            caption,
            captionIndex,
            targetLanguage,
            customPrompt
          )
        );
      }
    } catch {
      for (const item of chunk) {
        const captionIndex = captionIndexByTimestamp.get(item.timestamp);
        if (captionIndex === undefined) {
          continue;
        }

        const caption = session.captions[captionIndex];
        translations.set(
          item.timestamp,
          await translateCaptionIndividually(
            session,
            caption,
            captionIndex,
            targetLanguage,
            customPrompt
          )
        );
      }
    }
  }

  return translations;
}

async function queueMeetingSummaryJob(
  request: GenerateMeetingSummaryRequest,
  source: "manual" | "automatic"
): Promise<SummaryJobStatus> {
  await summaryDiagnosticsLogger.info("summary_job_queued", {
    sessionId: request.sessionId,
    source,
    profileId: request.profileId,
    targetLanguage: request.targetLanguage,
  }, {
    sessionId: request.sessionId,
  });
  const status: SummaryJobStatus = {
    sessionId: request.sessionId,
    state: "preflighting",
    message:
      source === "automatic"
        ? "Queued automatic summary"
        : "Analyzing transcript",
    updatedAt: Date.now(),
  };

  await upsertPersistedMeetingSummaryJob({
    request,
    source,
    enqueuedAt: Date.now(),
    status,
    attemptCount: 0,
    maxAttempts: source === "automatic" ? AUTO_SUMMARY_MAX_ATTEMPTS : 1,
  });
  await emitMeetingSummaryJobStatus(status);
  await scheduleMeetingSummaryRetryAlarm();
  return status;
}

async function processPersistedMeetingSummaryJobs(): Promise<void> {
  if (meetingSummaryQueueProcessingPromise) {
    await summaryDiagnosticsLogger.trace("summary_queue_processing_reused");
    return meetingSummaryQueueProcessingPromise;
  }

  meetingSummaryQueueProcessingPromise = (async () => {
    await summaryDiagnosticsLogger.info("summary_queue_processing_started");
    while (true) {
      const jobs = await loadPersistedMeetingSummaryJobs();
      const now = Date.now();
      const nextJob = jobs.find(
        (job) =>
          !activeMeetingSummaryJobs.has(job.request.sessionId) &&
          (!job.retryAfter || job.retryAfter <= now)
      );

      if (!nextJob) {
        await summaryDiagnosticsLogger.trace("summary_queue_processing_idle", {
          queuedJobCount: jobs.length,
        });
        break;
      }

      await summaryDiagnosticsLogger.debug("summary_queue_processing_job", {
        sessionId: nextJob.request.sessionId,
        source: nextJob.source,
        retryAfter: nextJob.retryAfter || null,
      }, {
        sessionId: nextJob.request.sessionId,
      });

      await runMeetingSummaryJob(nextJob.request, nextJob.source);
    }
  })().finally(() => {
    void summaryDiagnosticsLogger.info("summary_queue_processing_finished");
    meetingSummaryQueueProcessingPromise = null;
  });

  await scheduleMeetingSummaryRetryAlarm();
  return meetingSummaryQueueProcessingPromise;
}

function isSameSummaryRequest(
  left: GenerateMeetingSummaryRequest,
  right: GenerateMeetingSummaryRequest
): boolean {
  return (
    left.sessionId === right.sessionId &&
    left.targetLanguage === right.targetLanguage &&
    left.profileId === right.profileId
  );
}

export async function getMeetingHistory(): Promise<{
  success: boolean;
  sessions: MeetingSession[];
}> {
  const sessions = await loadStoredMeetingSessions();
  return { success: true, sessions };
}

export async function getMeetingHistoryIndex(): Promise<{
  success: boolean;
  sessions: MeetingSession[];
}> {
  const sessions = await loadStoredMeetingSessionIndexes();
  return { success: true, sessions };
}

export async function getMeetingSession(
  sessionId: string
): Promise<{ success: boolean; session?: MeetingSession; error?: string }> {
  const session = await loadStoredMeetingSession(sessionId);
  if (!session) {
    return { success: false, error: "Meeting session not found." };
  }

  return { success: true, session };
}

export async function getMeetingSummaryJobStatus(
  sessionId: string
): Promise<{ success: boolean; status?: SummaryJobStatus | null }> {
  if (!meetingSummaryQueueInitialized) {
    await initializeMeetingSummaryQueue();
  }

  if (meetingSummaryJobStatuses.has(sessionId)) {
    return {
      success: true,
      status: meetingSummaryJobStatuses.get(sessionId) || null,
    };
  }

  const persistedJob = await getPersistedMeetingSummaryJob(sessionId);
  return {
    success: true,
    status: persistedJob?.status || null,
  };
}

export async function getMeetingSummaryJobStatuses(): Promise<{
  success: boolean;
  statuses: Record<string, SummaryJobStatus>;
}> {
  if (!meetingSummaryQueueInitialized) {
    await initializeMeetingSummaryQueue();
  }

  const statuses = Object.fromEntries(meetingSummaryJobStatuses.entries());
  return {
    success: true,
    statuses,
  };
}

export async function cancelMeetingSummaryJob(
  sessionId: string
): Promise<{ success: boolean; cancelled: boolean }> {
  let cancelled = false;
  const activeJob = activeMeetingSummaryJobs.get(sessionId);
  if (activeJob) {
    activeJob.controller.abort();
    cancelled = true;
  }

  const persistedJob = await getPersistedMeetingSummaryJob(sessionId);
  if (persistedJob) {
    await removePersistedMeetingSummaryJob(sessionId);
    cancelled = true;
  }

  if (!cancelled) {
    return {
      success: true,
      cancelled: false,
    };
  }

  await emitMeetingSummaryJobStatus({
    sessionId,
    state: "cancelled",
    message: "Summary generation cancelled",
    updatedAt: Date.now(),
  });
  await scheduleMeetingSummaryRetryAlarm();

  return {
    success: true,
    cancelled: true,
  };
}

async function runMeetingSummaryJob(
  request: GenerateMeetingSummaryRequest,
  source: "manual" | "automatic"
): Promise<GenerateMeetingSummaryResponse> {
  await summaryDiagnosticsLogger.info("summary_job_started", {
    sessionId: request.sessionId,
    source,
    profileId: request.profileId,
  }, {
    sessionId: request.sessionId,
  });
  const persistedJob = await getPersistedMeetingSummaryJob(request.sessionId);
  const session = await loadStoredMeetingSession(request.sessionId);

  if (!session) {
    await summaryDiagnosticsLogger.error("summary_job_missing_session", {
      sessionId: request.sessionId,
      source,
    }, {
      sessionId: request.sessionId,
    });
    await removePersistedMeetingSummaryJob(request.sessionId);
    clearMeetingSummaryJobStatus(request.sessionId);
    return {
      success: false,
      error: "Meeting session not found.",
    };
  }
  if (session.captions.length === 0 && session.chatMessages.length === 0) {
    await summaryDiagnosticsLogger.warn("summary_job_missing_source_content", {
      sessionId: request.sessionId,
      source,
    }, {
      sessionId: request.sessionId,
    });
    await removePersistedMeetingSummaryJob(request.sessionId);
    clearMeetingSummaryJobStatus(request.sessionId);
    return {
      success: false,
      error: "No transcript or meeting chat content is available for summarization.",
    };
  }

  const { settings } = await getSettings();
  const summaryProfile = resolveMeetingProfile(
    settings.meetingProfiles,
    request.profileId,
    settings.defaultMeetingProfileId
  );
  const resolvedPrompt = resolveMeetingProfilePrompt(summaryProfile);
  const executionPlan = planMeetingSummaryExecution(
    session,
    resolvedPrompt,
    summaryProfile.summaryGenerationMode
  );

  await summaryDiagnosticsLogger.debug("summary_job_execution_planned", {
    sessionId: request.sessionId,
    source,
    mode: executionPlan.mode,
    strategy: executionPlan.strategy,
  }, {
    sessionId: request.sessionId,
  });

  const pushStatus = async (
    status: Omit<SummaryJobStatus, "sessionId" | "updatedAt">
  ) => {
    const nextStatus: SummaryJobStatus = {
      sessionId: request.sessionId,
      updatedAt: Date.now(),
      mode: executionPlan.mode,
      strategy: executionPlan.strategy,
      ...status,
    };

    await updatePersistedMeetingSummaryJobStatus(request.sessionId, nextStatus);
    await emitMeetingSummaryJobStatus(nextStatus);
  };

  const controller = new AbortController();
  activeMeetingSummaryJobs.set(request.sessionId, {
    controller,
  });

  try {
    await pushStatus({
      state: "preflighting",
      message:
        source === "automatic"
          ? "Preparing automatic summary"
          : "Analyzing transcript",
    });

    let response:
      | {
          success: boolean;
          text?: string;
          error?: string;
          continuationCount: number;
          reconciled: boolean;
        }
      | undefined;
    let evidenceChunkCount = 0;

    if (executionPlan.strategy === "single_shot") {
      await pushStatus({
        state: "synthesizing",
        message: "Preparing the final result",
      });
      const prompt = buildMeetingSummaryPrompt(
        session,
        request.targetLanguage,
        summaryProfile.id,
        summaryProfile.name,
        resolvedPrompt
      );
      response = await generateMeetingSummaryText(
        request.sessionId,
        prompt,
        request.targetLanguage,
        executionPlan.shouldRunReconciliationPass,
        pushStatus
      );
    } else if (executionPlan.strategy === "structured_single_shot") {
      await pushStatus({
        state: "synthesizing",
        message: "Preparing the final result",
      });
      const prompt = buildStructuredMeetingSummaryPrompt(
        session,
        request.targetLanguage,
        summaryProfile.id,
        summaryProfile.name,
        resolvedPrompt
      );
      response = await generateMeetingSummaryText(
        request.sessionId,
        prompt,
        request.targetLanguage,
        executionPlan.shouldRunReconciliationPass,
        pushStatus
      );
    } else {
      const timeline = buildSummarySourceTimeline(session);
      const chunks = splitSummarySourceIntoChunks(
        timeline,
        executionPlan.evidenceChunkTargetChars
      );
      evidenceChunkCount = chunks.length;

      const extractedEvidence: SummaryEvidence[] = [];

      for (const chunk of chunks) {
        ensureSummaryJobActive(request.sessionId);
        await pushStatus({
          state: "extracting",
          message: "Collecting evidence",
          progressCurrent: extractedEvidence.length + 1,
          progressTotal: chunks.length,
        });

        extractedEvidence.push(
          await extractSummaryEvidenceFromChunk(
            request.sessionId,
            session,
            request.targetLanguage,
            summaryProfile.name,
            resolvedPrompt,
            chunk,
            chunks.length
          )
        );
      }

      ensureSummaryJobActive(request.sessionId);
      await pushStatus({
        state: "merging",
        message: "Merging evidence",
      });
      const mergedEvidence = mergeSummaryEvidence(extractedEvidence);
      const prompt = buildEvidenceBackedMeetingSummaryPrompt(
        session,
        request.targetLanguage,
        summaryProfile.id,
        summaryProfile.name,
        resolvedPrompt,
        mergedEvidence
      );

      await pushStatus({
        state: "synthesizing",
        message: "Preparing the final result",
      });
      response = await generateMeetingSummaryText(
        request.sessionId,
        prompt,
        request.targetLanguage,
        executionPlan.shouldRunReconciliationPass,
        pushStatus
      );
    }

    if (!response.success || !response.text) {
      const errorMessage =
        response.error && response.error !== "Request failed"
          ? response.error
          : "Summary generation failed.";
      await pushStatus({
        state: "failed",
        message: "Summary generation failed",
        detail: errorMessage,
      });
      if (
        source === "automatic" &&
        persistedJob &&
        persistedJob.attemptCount + 1 < persistedJob.maxAttempts &&
        isRetryableSummaryError(errorMessage)
      ) {
        await summaryDiagnosticsLogger.warn("summary_job_scheduled_retry", {
          sessionId: request.sessionId,
          source,
          errorMessage,
          attemptCount: persistedJob.attemptCount + 1,
        }, {
          sessionId: request.sessionId,
        });
        const attemptCount = persistedJob.attemptCount + 1;
        const retryAfter = Date.now() + getSummaryJobBackoffMs(attemptCount - 1);
        const retryStatus: SummaryJobStatus = {
          sessionId: request.sessionId,
          state: "preflighting",
          message: "Retrying automatic summary",
          detail: errorMessage,
          updatedAt: Date.now(),
          mode: executionPlan.mode,
          strategy: executionPlan.strategy,
        };
        await upsertPersistedMeetingSummaryJob({
          ...persistedJob,
          status: retryStatus,
          attemptCount,
          retryAfter,
          lastError: errorMessage,
        });
        await emitMeetingSummaryJobStatus(retryStatus);
        await scheduleMeetingSummaryRetryAlarm();
      } else {
        await removePersistedMeetingSummaryJob(request.sessionId);
        await scheduleMeetingSummaryRetryAlarm();
      }
      await summaryDiagnosticsLogger.error("summary_job_failed", {
        sessionId: request.sessionId,
        source,
        errorMessage,
      }, {
        sessionId: request.sessionId,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }

    const summary = createMeetingSummaryArtifact(
      session,
      summaryProfile.id,
      summaryProfile.name,
      request.targetLanguage,
      response.text,
      "openai",
      settings.model,
      resolvedPrompt,
      {
        generationMode: executionPlan.mode,
        requestSource: source,
        sourceSessionProfileId: session.meetingProfileId,
        executionStrategy: executionPlan.strategy,
        continuationCount: response.continuationCount,
        evidenceChunkCount,
        reconciled: response.reconciled,
      }
    );

    const summaries = {
      ...(session.summaries || {}),
      [summary.key]: summary,
    };

    const updatedSession = updateSessionSearchableText({
      ...session,
      summaries,
      artifacts: {
        ...(session.artifacts || {}),
        summaries,
      },
    });

    await putStoredMeetingSessionRecord(updatedSession);
    await noteMeetingSessionSaved(updatedSession, settings.connectedCloudProviders);
    await pushStatus({
      state: "completed",
      message: "Summary ready",
    });
    await maybeShowSummaryReadyNotification(updatedSession, summary);
    await removePersistedMeetingSummaryJob(request.sessionId);
    await scheduleMeetingSummaryRetryAlarm();

    await summaryDiagnosticsLogger.info("summary_job_completed", {
      sessionId: request.sessionId,
      source,
      summaryKey: summary.key,
      evidenceChunkCount,
      continuationCount: response.continuationCount,
    }, {
      sessionId: request.sessionId,
    });

    return {
      success: true,
      session: updatedSession,
      summary,
    };
  } catch (error) {
    if (error instanceof SummaryJobCancelledError) {
      await summaryDiagnosticsLogger.warn("summary_job_cancelled", {
        sessionId: request.sessionId,
        source,
      }, {
        sessionId: request.sessionId,
      });
      await emitMeetingSummaryJobStatus({
        sessionId: request.sessionId,
        state: "cancelled",
        message: "Summary generation cancelled",
        updatedAt: Date.now(),
      });
      await removePersistedMeetingSummaryJob(request.sessionId);
      await scheduleMeetingSummaryRetryAlarm();
      return {
        success: false,
        error: "Summary generation cancelled.",
      };
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Summary generation failed.";

    await summaryDiagnosticsLogger.error("summary_job_exception", {
      sessionId: request.sessionId,
      source,
      message,
    }, {
      sessionId: request.sessionId,
    });

    await emitMeetingSummaryJobStatus({
      sessionId: request.sessionId,
      state: "failed",
      message: "Summary generation failed",
      detail: message,
      updatedAt: Date.now(),
    });
    if (
      source === "automatic" &&
      persistedJob &&
      persistedJob.attemptCount + 1 < persistedJob.maxAttempts &&
      isRetryableSummaryError(message)
    ) {
      const attemptCount = persistedJob.attemptCount + 1;
      const retryAfter = Date.now() + getSummaryJobBackoffMs(attemptCount - 1);
      const retryStatus: SummaryJobStatus = {
        sessionId: request.sessionId,
        state: "preflighting",
        message: "Retrying automatic summary",
        detail: message,
        updatedAt: Date.now(),
        mode: meetingSummaryJobStatuses.get(request.sessionId)?.mode,
        strategy: meetingSummaryJobStatuses.get(request.sessionId)?.strategy,
      };
      await upsertPersistedMeetingSummaryJob({
        ...(persistedJob || {
          request,
          source,
          enqueuedAt: Date.now(),
          maxAttempts: AUTO_SUMMARY_MAX_ATTEMPTS,
        }),
        status: retryStatus,
        attemptCount,
        retryAfter,
        lastError: message,
      } as PersistedMeetingSummaryJob);
      await emitMeetingSummaryJobStatus(retryStatus);
      await scheduleMeetingSummaryRetryAlarm();
    } else {
      await removePersistedMeetingSummaryJob(request.sessionId);
      await scheduleMeetingSummaryRetryAlarm();
    }
    return {
      success: false,
      error: message,
    };
  } finally {
    activeMeetingSummaryJobs.delete(request.sessionId);
  }
}

export async function resolveMeetingSession(
  request: ResolveMeetingSessionRequest
): Promise<ResolveMeetingSessionResponse> {
  const { settings } = await getSettings();
  const continuationWindowMs = getSessionContinuationWindowMs(settings);

  if (
    request.reusePolicy === "force-new" ||
    (request.platform === "microsoft-teams" &&
      request.identifiers.callType === "direct-call")
  ) {
    const freshSession = createResolvedSession(request);
    return { success: true, session: freshSession, reused: false };
  }

  const normalizedIdentifiers = sanitizeMeetingSessionIdentifiers(
    request.platform,
    request.identifiers
  );
  const hasStableIdentity =
    getStableContinuationIdentifiers(request.platform, normalizedIdentifiers).length > 0;

  if (
    request.platform === "microsoft-teams" &&
    !hasStableIdentity &&
    !(request.reusePolicy === "force-reuse" && request.resumeSessionId)
  ) {
    const freshSession = createResolvedSession({
      ...request,
      identifiers: normalizedIdentifiers,
    });
    return { success: true, session: freshSession, reused: false };
  }

  const sessionFingerprint = buildMeetingSessionFingerprint({
    platform: request.platform,
    meetingUrl: request.sourceUrl,
    identifiers: normalizedIdentifiers,
    title: request.title,
  });

  const explicitlyRequestedRecord =
    request.reusePolicy === "force-reuse" && request.resumeSessionId
      ? await getStoredMeetingSessionRecord(request.resumeSessionId)
      : null;

  const stored =
    explicitlyRequestedRecord ||
    (await findLatestStoredMeetingSessionRecordByFingerprint(sessionFingerprint));

  if (!stored) {
    const session = createResolvedSession(request);
    return { success: true, session, reused: false };
  }

  const session = normalizeMeetingSession(stored);
  const canReuse =
    request.reusePolicy === "force-reuse"
      ? canResumeStoredSession(session, request, continuationWindowMs)
      : shouldReuseStoredSession(session, request);

  if (!canReuse) {
    const freshSession = createResolvedSession(request);
    return { success: true, session: freshSession, reused: false };
  }

  const reopenedAt = Date.now();
  const mergedSession = updateSessionSearchableText({
    ...session,
    providerLabel: request.providerLabel || session.providerLabel,
    meetingUrl: request.sourceUrl || session.meetingUrl,
    title: request.title || session.title,
    meetingProfileId:
      session.meetingProfileId || request.meetingProfileId?.trim() || undefined,
    identifiers: sanitizeMeetingSessionIdentifiers(request.platform, {
      ...session.identifiers,
      ...normalizedIdentifiers,
    }),
    sessionFingerprint,
    rejoinHistory:
      request.reusePolicy === "force-reuse"
        ? [
            ...(session.rejoinHistory || []),
            {
              previousEndTime: getContinuationReferenceTimestamp(session),
              resumedAt: reopenedAt,
              gapMs: Math.max(
                reopenedAt - getContinuationReferenceTimestamp(session),
                0
              ),
            },
          ]
        : session.rejoinHistory,
    lifecycleState: session.endTime ? "reopened" : "live",
    endTime: undefined,
    lastSeenAt: reopenedAt,
    updatedAt: reopenedAt,
  });

  await putStoredMeetingSessionRecord(mergedSession);
  return { success: true, session: mergedSession, reused: true };
}

export async function findMeetingSessionContinuationCandidate(
  request: FindMeetingSessionContinuationCandidateRequest
): Promise<FindMeetingSessionContinuationCandidateResponse> {
  const { settings } = await getSettings();
  const continuationWindowMs = getSessionContinuationWindowMs(settings);
  const normalizedIdentifiers = sanitizeMeetingSessionIdentifiers(
    request.platform,
    request.identifiers
  );
  const hasStableIdentity =
    getStableContinuationIdentifiers(request.platform, normalizedIdentifiers).length > 0;
  const sessionFingerprint = buildMeetingSessionFingerprint({
    platform: request.platform,
    meetingUrl: request.sourceUrl,
    identifiers: normalizedIdentifiers,
    title: request.title,
  });
  const debugBase = {
    continuationWindowMs,
    normalizedIdentifiers: getStableContinuationIdentifiers(
      request.platform,
      normalizedIdentifiers
    ),
    fingerprint: sessionFingerprint,
  };

  if (
    request.platform === "microsoft-teams" &&
    request.identifiers.callType === "direct-call"
  ) {
    void historyDiagnosticsLogger.debug("continuation_direct_call_not_eligible", {
      platform: request.platform,
      ...debugBase,
    });
    return {
      success: true,
      candidate: null,
    };
  }

  if (request.platform === "microsoft-teams" && !hasStableIdentity) {
    void historyDiagnosticsLogger.debug("continuation_no_stable_identity", {
      platform: request.platform,
      ...debugBase,
    });
    return {
      success: true,
      candidate: null,
    };
  }

  let stored = await findLatestStoredMeetingSessionRecordByFingerprint(
    sessionFingerprint
  );
  let foundBy: "fingerprint" | "fallback" | undefined = stored
    ? "fingerprint"
    : undefined;

  if (!stored) {
    stored = await findFallbackContinuationCandidate(request, continuationWindowMs);
    if (stored) {
      foundBy = "fallback";
    }
  }

  if (!stored) {
    void historyDiagnosticsLogger.debug("continuation_no_stored_session", {
      platform: request.platform,
      ...debugBase,
    });
    return {
      success: true,
      candidate: null,
    };
  }

  const session = normalizeMeetingSession(stored);
  if (!session.endTime && session.lifecycleState === "live") {
    void historyDiagnosticsLogger.debug("continuation_stored_session_still_live", {
      platform: request.platform,
      ...debugBase,
      foundBy,
      candidateSessionId: session.id,
      referenceTime: getContinuationReferenceTimestamp(session),
      ageMs: Date.now() - getContinuationReferenceTimestamp(session),
    });
    return {
      success: true,
      candidate: null,
    };
  }

  const resumeCheck = evaluateContinuationResume(
    session,
    {
      ...request,
      identifiers: normalizedIdentifiers,
      reusePolicy: "force-reuse",
    },
    continuationWindowMs
  );
  if (!resumeCheck.ok) {
    void historyDiagnosticsLogger.debug("continuation_candidate_rejected", {
      platform: request.platform,
      ...debugBase,
      foundBy,
      candidateSessionId: session.id,
      referenceTime: resumeCheck.referenceTime,
      ageMs: resumeCheck.ageMs,
      reason: resumeCheck.reason,
    });
    return {
      success: true,
      candidate: null,
    };
  }

  void historyDiagnosticsLogger.info("continuation_candidate_found", {
    platform: request.platform,
    ...debugBase,
    foundBy,
    candidateSessionId: session.id,
    referenceTime: resumeCheck.referenceTime,
    ageMs: resumeCheck.ageMs,
  });

  return {
    success: true,
    candidate: {
      sessionId: session.id,
      title: session.title,
      endedAt: getContinuationReferenceTimestamp(session),
      providerLabel: session.providerLabel,
    },
  };
}

async function enforceRetentionPolicyAndPropagateDeletes(
  settings: Awaited<ReturnType<typeof getSettings>>["settings"]
): Promise<void> {
  const { deletedSessionIds } = await enforceMeetingHistoryRetentionPolicy(
    settings.meetingArchiveRetentionDays
  );

  if (deletedSessionIds.length === 0) {
    return;
  }

  deletedSessionIds.forEach((sessionId) => {
    clearMeetingAssistantRuntimeState(sessionId);
  });

  await Promise.all(
    deletedSessionIds.map((sessionId) =>
      noteMeetingSessionDeleted(sessionId, settings.connectedCloudProviders)
    )
  );
}

export async function saveMeetingSession(
  session: MeetingSession
): Promise<{ success: boolean }> {
  const { settings } = await getSettings();
  const now = Date.now();
  const normalizedSession = updateSessionSearchableText(
    normalizeMeetingSession({
      ...session,
      schemaVersion: 3,
      sessionSyncId: session.sessionSyncId || session.id,
      lastSeenAt: now,
      updatedAt: now,
      updatedByDeviceId: settings.deviceId,
      lifecycleState: session.endTime ? "ended" : session.lifecycleState || "live",
      events: (session.events || []).map((event) => ({
        ...event,
        updatedAt: event.updatedAt ?? now,
        updatedByDeviceId: event.updatedByDeviceId || settings.deviceId,
      })),
      artifacts: session.artifacts || {
        summaries: session.summaries,
      },
    })
  );
  await putStoredMeetingSessionRecord(normalizedSession);
  await noteMeetingSessionSaved(normalizedSession, settings.connectedCloudProviders);
  queueMeetingAssistantProcessing(normalizedSession.id);
  if (normalizedSession.endTime || normalizedSession.lifecycleState === "ended") {
    await enforceRetentionPolicyAndPropagateDeletes(settings);
    await maybeQueueAutomaticSummaryForEndedSession(normalizedSession, settings);
  }
  return { success: true };
}

export async function storeMeetingSessionShell(
  session: MeetingSession
): Promise<{ success: boolean }> {
  const { settings } = await getSettings();
  const now = Date.now();
  const normalizedSession = updateSessionSearchableText(
    normalizeMeetingSession({
      ...session,
      schemaVersion: 3,
      sessionSyncId: session.sessionSyncId || session.id,
      lastSeenAt: now,
      updatedAt: now,
      updatedByDeviceId: settings.deviceId,
      lifecycleState: session.endTime ? "ended" : session.lifecycleState || "live",
      events: session.events || [],
      artifacts: session.artifacts || {
        summaries: session.summaries,
      },
    })
  );

  await putStoredMeetingSessionRecord(normalizedSession);
  return { success: true };
}

export async function deleteMeetingSession(
  sessionId: string
): Promise<{ success: boolean }> {
  clearMeetingAssistantRuntimeState(sessionId);
  await deleteStoredMeetingSessionRecord(sessionId);
  const { settings } = await getSettings();
  await noteMeetingSessionDeleted(sessionId, settings.connectedCloudProviders);
  return { success: true };
}

export async function updateMeetingSession(
  sessionId: string,
  updates: Partial<MeetingSession>
): Promise<{ success: boolean }> {
  const session = await loadStoredMeetingSession(sessionId);

  if (session) {
    const { settings } = await getSettings();
    const now = Date.now();
    const normalizedUpdates = { ...updates };
    if (session.meetingProfileId) {
      delete normalizedUpdates.meetingProfileId;
    }
    const updated = updateSessionSearchableText(
      normalizeMeetingSession({
        ...session,
        ...normalizedUpdates,
        updatedAt: now,
        updatedByDeviceId: settings.deviceId,
      })
    );
    await putStoredMeetingSessionRecord(updated);
    await noteMeetingSessionSaved(updated, settings.connectedCloudProviders);
    if (updated.artifacts?.assistantState?.enabled === false) {
      clearMeetingAssistantRuntimeState(updated.id);
    } else {
      queueMeetingAssistantProcessing(updated.id);
    }
    if (updated.endTime || updated.lifecycleState === "ended") {
      await enforceRetentionPolicyAndPropagateDeletes(settings);
      await maybeQueueAutomaticSummaryForEndedSession(updated, settings);
    }
  }

  return { success: true };
}

export async function translateSessionCaption(
  request: TranslateSessionCaptionRequest
): Promise<TranslateSessionCaptionResponse> {
  const session = await loadStoredMeetingSession(request.sessionId);

  if (!session) {
    return {
      success: false,
      error: "Meeting session not found.",
    };
  }

  const source = request.source === "chat" ? "chat" : "caption";
  const items = source === "chat" ? session.chatMessages : session.captions;
  const itemIndex = items.findIndex(
    (item) => item.timestamp === request.captionTimestamp
  );

  if (itemIndex < 0) {
    return {
      success: false,
      error:
        source === "chat"
          ? "Chat message not found."
          : "Caption line not found.",
    };
  }

  const item = items[itemIndex];
  if (item.translation?.trim()) {
    return {
      success: true,
      session,
      translation: item.translation,
    };
  }

  const { settings } = await getSettings();
  const translateRequest: TranslateRequest = {
    id: `${request.sessionId}:${source}:${request.captionTimestamp}`,
    text: item.text,
    targetLang: request.targetLanguage || settings.targetLanguage,
    mode: "semantic",
    force: true,
    speaker: item.speaker,
    context: buildTimelineContext(session, source, item.timestamp),
    customPrompt: settings.customPrompt,
  };

  const response = await translate(translateRequest);
  if (!response.success || !response.translation) {
    return {
      success: false,
      error: response.error || "Translation failed.",
    };
  }

  const updatedSession = updateSessionSearchableText({
    ...syncSessionEventsWithItemUpdate(session, source, item.timestamp, {
      translation: response.translation,
      translationLanguage: request.targetLanguage || settings.targetLanguage,
    }),
    captions:
      source === "caption"
        ? session.captions.map((entry, index) =>
            index === itemIndex
              ? {
                  ...entry,
                  translation: response.translation,
                  translationLanguage:
                    request.targetLanguage || settings.targetLanguage,
                }
              : entry
          )
        : session.captions,
    chatMessages:
      source === "chat"
        ? session.chatMessages.map((entry, index) =>
            index === itemIndex
              ? {
                  ...entry,
                  translation: response.translation,
                  translationLanguage:
                    request.targetLanguage || settings.targetLanguage,
                }
              : entry
          )
        : session.chatMessages,
  });

  await putStoredMeetingSessionRecord(updatedSession);
  await noteMeetingSessionSaved(updatedSession, settings.connectedCloudProviders);
  await enforceRetentionPolicyAndPropagateDeletes(settings);

  return {
    success: true,
    session: updatedSession,
    translation: response.translation,
  };
}

export async function translateSessionCaptions(
  request: TranslateSessionCaptionsRequest
): Promise<TranslateSessionCaptionsResponse> {
  const session = await loadStoredMeetingSession(request.sessionId);

  if (!session) {
    return {
      success: false,
      error: "Meeting session not found.",
    };
  }
  if (session.captions.length === 0) {
    return {
      success: false,
      error: "No transcript content is available for translation.",
    };
  }

  const { settings } = await getSettings();
  const targetLanguage = request.targetLanguage || settings.targetLanguage;
  const candidates = session.captions
    .map((caption, index) => ({ caption, index }))
    .filter(
      ({ caption }) =>
        !caption.translation?.trim() || caption.translationLanguage !== targetLanguage
    );

  if (candidates.length === 0) {
    return {
      success: true,
      session,
      translatedCount: 0,
      skippedCount: session.captions.length,
    };
  }

  const translationMap = await translateCaptionBatch(
    session,
    candidates,
    targetLanguage,
    settings.customPrompt
  );

  const updatedSession = updateSessionSearchableText({
    ...session,
    captions: session.captions.map((caption) => {
      const translatedText = translationMap.get(caption.timestamp);
      if (!translatedText) {
        return caption;
      }

      return {
        ...caption,
        translation: translatedText,
        translationLanguage: targetLanguage,
      };
    }),
    events: (session.events || []).map((event) => {
      if (event.source !== "caption") {
        return event;
      }

      const translatedText = translationMap.get(event.timestamp);
      if (!translatedText) {
        return event;
      }

      return {
        ...event,
        translation: translatedText,
        translationLanguage: targetLanguage,
      };
    }),
  });

  await putStoredMeetingSessionRecord(updatedSession);
  await noteMeetingSessionSaved(updatedSession, settings.connectedCloudProviders);
  await enforceRetentionPolicyAndPropagateDeletes(settings);

  return {
    success: true,
    session: updatedSession,
    translatedCount: translationMap.size,
    skippedCount: session.captions.length - candidates.length,
  };
}

export async function generateMeetingSummary(
  request: GenerateMeetingSummaryRequest
): Promise<GenerateMeetingSummaryResponse> {
  if (!meetingSummaryQueueInitialized) {
    await initializeMeetingSummaryQueue();
  }

  const { settings } = await getSettings();
  const aiAvailability = getOpenAiServiceAvailability(settings);
  if (!aiAvailability.operational) {
    return {
      success: false,
      error: aiAvailability.message,
    };
  }

  const queuedJob = await getPersistedMeetingSummaryJob(request.sessionId);
  if (activeMeetingSummaryJobs.has(request.sessionId) || queuedJob) {
    return {
      success: false,
      error:
        queuedJob && !isSameSummaryRequest(queuedJob.request, request)
          ? "Another summary job is already queued for this session. Wait for it to finish or cancel it first."
          : "A summary is already being generated for this session.",
    };
  }

  await queueMeetingSummaryJob(request, "manual");
  await processPersistedMeetingSummaryJobs();

  const finalStatus = meetingSummaryJobStatuses.get(request.sessionId);
  const updatedSession = await loadStoredMeetingSession(request.sessionId);

  if (finalStatus?.state === "completed" && updatedSession) {
    return {
      success: true,
      session: updatedSession,
      summary:
        findLatestMeetingSummary(updatedSession.summaries, {
          profileId: request.profileId,
          language: request.targetLanguage,
        }) || undefined,
    };
  }

  if (finalStatus?.state === "cancelled") {
    return {
      success: false,
      error: "Summary generation cancelled.",
    };
  }

  return {
    success: false,
    error:
      finalStatus?.detail ||
      finalStatus?.message ||
      "Summary generation failed.",
  };
}

export async function finalizeMeetingSessionEnd(
  request: FinalizeMeetingSessionEndRequest
): Promise<FinalizeMeetingSessionEndResponse> {
  await saveMeetingSession(request.session);

  if (!request.enqueueAutomaticSummary) {
    return {
      success: true,
      autoSummaryQueued: false,
    };
  }

  const { settings } = await getSettings();
  return {
    success: true,
    autoSummaryQueued: Boolean(
      getAutomaticSummaryRequest(request.session, settings)
    ),
  };
}

export async function clearMeetingHistory(): Promise<{ success: boolean }> {
  clearMeetingAssistantRuntimeState();
  await clearStoredMeetingSessionRecords();
  const { settings } = await getSettings();
  await noteMeetingArchiveCleared(settings.connectedCloudProviders);
  return { success: true };
}

export async function getStorageUsage(): Promise<{
  success: boolean;
  bytesUsed: number;
  quota: number;
}> {
  const bytesUsed = await estimateMeetingHistoryBytes();
  const estimate = await navigator.storage?.estimate?.();
  const quota = estimate?.quota || 5242880;
  return { success: true, bytesUsed, quota };
}

export async function updateMeetingHistoryViewState(
  request: UpdateMeetingHistoryViewStateRequest,
  sender: chrome.runtime.MessageSender
): Promise<{ success: boolean; error?: string }> {
  const key = getMeetingHistoryViewStateKey(request, sender);
  if (!key) {
    await summaryDiagnosticsLogger.warn("meeting_history_view_state_tab_resolution_failed", {
      documentId: sender.documentId || null,
      senderUrl: sender.url || null,
      currentUrl: request.currentUrl || null,
      viewInstanceId: request.viewInstanceId || null,
      selectedSessionId: request.selectedSessionId || null,
      visible: request.visible,
      focused: request.focused,
    }, {
      sessionId:
        typeof request.selectedSessionId === "string" && request.selectedSessionId.trim()
          ? request.selectedSessionId.trim()
          : undefined,
    });
    return {
      success: false,
      error: "Meeting history view state requires a sender identity.",
    };
  }

  setMeetingHistoryViewState(key, sender, request);
  return { success: true };
}

export async function handleSummaryReadyNotificationClick(
  notificationId: string
): Promise<boolean> {
  const target = parseSummaryReadyNotificationId(notificationId);
  if (!target) {
    return false;
  }

  if (chrome.notifications?.clear) {
    try {
      await chrome.notifications.clear(notificationId);
    } catch {
      // Navigation should still continue if clear fails.
    }
  }

  return openMeetingHistoryForSummaryTarget(target);
}

export function handleMeetingHistoryTabRemoved(tabId: number): void {
  removeMeetingHistoryViewStateForTab(tabId);
}

export const historySummaryInternals = {
  getAutomaticSummaryRequest,
  generateMeetingSummaryText,
  queueMeetingSummaryJob,
  processPersistedMeetingSummaryJobs,
  runMeetingSummaryJob,
  scheduleMeetingSummaryRetryAlarm,
  getSummaryJobBackoffMs,
  loadPersistedMeetingSummaryJobs,
  savePersistedMeetingSummaryJobs,
  upsertPersistedMeetingSummaryJob,
  removePersistedMeetingSummaryJob,
  buildSummaryReadyNotificationId,
  handleSummaryReadyNotificationClick,
  updateMeetingHistoryViewState,
  handleMeetingHistoryTabRemoved,
  setMeetingHistoryViewStateForTests(
    key: number | string,
    state: UpdateMeetingHistoryViewStateRequest
  ) {
    const sender =
      typeof key === "number"
        ? ({ tab: { id: key } } as chrome.runtime.MessageSender)
        : ({ documentId: key } as chrome.runtime.MessageSender);
    const resolvedKey = getMeetingHistoryViewStateKey(state, sender);
    if (!resolvedKey) {
      throw new Error("Expected a stable meeting history view state key for tests.");
    }
    setMeetingHistoryViewState(resolvedKey, sender, state);
  },
  getMeetingHistoryViewStatesForTests() {
    return new Map(meetingHistoryViewStates);
  },
  setMeetingSummaryQueueInitializedForTests(nextValue: boolean) {
    meetingSummaryQueueInitialized = nextValue;
  },
  setActiveMeetingSummaryJobForTests(sessionId: string, aborted = false) {
    const controller = new AbortController();
    if (aborted) {
      controller.abort();
    }
    activeMeetingSummaryJobs.set(sessionId, { controller });
    return controller;
  },
  clearActiveMeetingSummaryJobForTests(sessionId: string) {
    activeMeetingSummaryJobs.delete(sessionId);
  },
  resetMeetingSummaryInternalsForTests() {
    activeMeetingSummaryJobs.clear();
    meetingSummaryJobStatuses.clear();
    meetingHistoryViewStates.clear();
    meetingSummaryQueueInitialized = false;
    meetingSummaryQueueProcessingPromise = null;
  },
};
