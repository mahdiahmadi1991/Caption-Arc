import type {
  MeetingAssistantMemorySnapshot,
  MeetingAssistantOutput,
  MeetingAssistantPendingOutput,
  MeetingSession,
  SavedMeetingEvent,
  Settings,
  MeetingProfile,
} from "./types";
import {
  getSettings,
  recordOpenAiVerificationFailure,
  recordOpenAiVerificationSuccess,
} from "./settings";
import {
  getStoredMeetingSessionRecord,
  listStoredMeetingSessionRecords,
  putStoredMeetingSessionRecord,
} from "./history-db";
import { noteMeetingSessionSaved } from "./cloud-sync";
import {
  classifyOpenAiFailure,
  generateStreamWithOpenAI,
  truncateForDiagnostics,
} from "./providers/openai";
import {
  getOpenAiServiceAvailability,
  getOpenAiVerificationFailureMessage,
  getOpenAiVerificationSuccessMessage,
} from "../shared/openai-service";
import { normalizeMeetingSession } from "../shared/meeting-session";
import { resolveMeetingProfile } from "../shared/meeting-profiles";
import { createBackgroundDiagnosticsLogger } from "./diagnostics";
import { getLanguageName } from "../shared/language-metadata";

const DEFAULT_ASSISTANT_MODEL = "gpt-5-mini";
const MAX_CANDIDATES_PER_PASS = 3;
const CONTEXT_WINDOW_ITEMS = 8;
const MEMORY_EVENT_WINDOW = 18;
const CAPTION_TRIGGER_COALESCE_WINDOW_MS = 2200;
const assistantDiagnosticsLogger = createBackgroundDiagnosticsLogger({
  domain: "assistant",
  feature: "live-assistant",
});

const activeAssistantPasses = new Map<string, Promise<void>>();
const assistantPassControllers = new Map<string, AbortController>();
const pendingAssistantPasses = new Set<string>();
const cancelledAssistantSessions = new Set<string>();
const assistantLiveStates = new Map<
  string,
  {
    status:
      | "watching"
      | "triggered"
      | "streaming"
      | "done"
      | "suppressed"
      | "error";
    pendingOutputs: MeetingAssistantPendingOutput[];
    updatedAt: number;
  }
>();

type ResolvedAssistantTrigger = {
  event: SavedMeetingEvent;
  triggerText: string;
  clauseKeys: string[];
};

const QUESTION_START_RE =
  /\b(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|am|will|have|has|آیا|ایا|چه|چی|چطور|چگونه|چرا|کجا|کی|چند|میشه|ميشه|میتونی|می‌تونی|میتونید|می‌تونید|ممکنه|ممکن است)\b/i;
const QUESTION_PREFIX_RE =
  /^(?:["'([{]\s*)?(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|am|will|have|has|آیا|ایا|چه|چی|چطور|چگونه|چرا|کجا|کی|چند|میشه|ميشه|میتونی|می‌تونی|میتونید|می‌تونید|ممکنه|ممکن است)\b/i;

function resolveAssistantModel(settings: Settings): string {
  return /^gpt-/i.test(settings.model) ? settings.model : DEFAULT_ASSISTANT_MODEL;
}

function getTriggerKey(event: SavedMeetingEvent): string {
  return event.stableEventKey || event.eventId;
}

function normalizeSpeakerLabel(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

function getSelfSpeakerAliases(session: MeetingSession): Set<string> {
  const aliases = new Set<string>(["you"]);

  for (const event of session.events || []) {
    if (!event.own) {
      continue;
    }

    const speaker = normalizeSpeakerLabel(event.speaker);
    if (speaker) {
      aliases.add(speaker);
    }
  }

  return aliases;
}

function isLikelySelfEvent(
  selfSpeakerAliases: Set<string>,
  event: SavedMeetingEvent
): boolean {
  if (event.own) {
    return true;
  }

  const speaker = normalizeSpeakerLabel(event.speaker);
  return selfSpeakerAliases.has(speaker);
}

function sanitizeLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeAssistantContent(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeAssistantErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return String((error as { message: string }).message).trim();
  }

  return String(error || "").trim();
}

function isAssistantGenerationTruncationError(error: unknown): boolean {
  const normalized = normalizeAssistantErrorMessage(error).toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    normalized.includes("truncated before completion") ||
    normalized.includes("max_output_tokens") ||
    normalized.includes("response was truncated")
  );
}

function looksQuestionLike(text: string): boolean {
  const normalized = sanitizeLine(text).toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized.includes("?") || normalized.includes("؟")) {
    return true;
  }

  return QUESTION_PREFIX_RE.test(normalized);
}

function looksRequestLike(text: string): boolean {
  const normalized = sanitizeLine(text).toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    /\b(can you|could you|please|need you to|want you to|would you|help me|help us|walk me through|tell me)\b/.test(
      normalized
    ) ||
    /\b(let'?s|we need to|i need to|need to|should we)\b/.test(normalized) ||
    /\b(لطفا|لطفاً|میشه|ميشه|ممکنه|ممکن است|کمک کن|کمکم کن|توضیح بده|توضیح بدید|بگو|بگید|بفرست|بررسی کن|نگاه کن)\b/.test(
      normalized
    )
  );
}

function looksSalientStatement(text: string): boolean {
  const normalized = sanitizeLine(text).toLowerCase();
  if (!normalized) {
    return false;
  }

  return /\b(blocker|risk|issue|problem|deadline|decision|decide|stuck|constraint|trade-?off|concern|objection|timeline|budget|priority|incident|root cause|ریسک|مشکل|مسئله|مانع|بلاک|ددلاین|تصمیم|نگرانی|اعتراض|تایملاین|بودجه|اولویت|حادثه|علت ریشه‌ای)\b/.test(
    normalized
  );
}

function extractAssistantTriggerClauses(text: string): string[] {
  const normalized = sanitizeLine(text);
  if (!normalized) {
    return [];
  }

  const explicitClauses =
    normalized.match(/[^?؟!]+[?؟!]*/gu)?.map((clause) => clause.trim()) || [];
  const clauses = explicitClauses.length > 0 ? explicitClauses : [normalized];
  return clauses.filter(Boolean);
}

function normalizeAssistantClauseText(text: string): string {
  const normalized = sanitizeLine(text).replace(/^[\-\u2022•]\s*/, "");
  if (!normalized) {
    return "";
  }

  const starterMatch = QUESTION_START_RE.exec(normalized);
  const focused = starterMatch ? normalized.slice(starterMatch.index).trim() : normalized;
  return focused.replace(/\s+([?؟!])/g, "$1").trim();
}

function buildAssistantClauseKey(text: string): string {
  return normalizeAssistantClauseText(text)
    .toLowerCase()
    .replace(/[?؟!.,:;]+$/g, "")
    .trim();
}

function getAnsweredAssistantClauseKeys(
  outputs: Record<string, MeetingAssistantOutput>
): Set<string> {
  const keys = new Set<string>();

  Object.values(outputs).forEach((output) => {
    extractAssistantTriggerClauses(output.triggerText).forEach((clause) => {
      const clauseKey = buildAssistantClauseKey(clause);
      if (clauseKey) {
        keys.add(clauseKey);
      }
    });
  });

  return keys;
}

function resolveAssistantTrigger(
  event: SavedMeetingEvent,
  outputs: Record<string, MeetingAssistantOutput>
): ResolvedAssistantTrigger | null {
  const clauses = extractAssistantTriggerClauses(event.text)
    .map(normalizeAssistantClauseText)
    .filter(Boolean);
  const candidateClauses =
    clauses.length > 0
      ? clauses.filter(
          (clause) =>
            looksQuestionLike(clause) ||
            looksRequestLike(clause) ||
            looksSalientStatement(clause)
        )
      : [];
  const fallbackClauses =
    candidateClauses.length > 0 ? candidateClauses : [normalizeAssistantClauseText(event.text)];
  const answeredClauseKeys = getAnsweredAssistantClauseKeys(outputs);
  const unresolvedClauses = fallbackClauses.filter((clause) => {
    const clauseKey = buildAssistantClauseKey(clause);
    return clauseKey && !answeredClauseKeys.has(clauseKey);
  });

  if (unresolvedClauses.length === 0) {
    return null;
  }

  return {
    event,
    triggerText: unresolvedClauses.join(" "),
    clauseKeys: unresolvedClauses.map(buildAssistantClauseKey),
  };
}

function shouldConsiderEvent(
  selfSpeakerAliases: Set<string>,
  event: SavedMeetingEvent,
  profile: MeetingProfile
): boolean {
  const text = sanitizeLine(event.text);
  if (text.length < 8) {
    return false;
  }

  if (event.source === "caption" && event.isFinal === false) {
    return false;
  }

  if (
    profile.assistant.participantScope === "others_only" &&
    isLikelySelfEvent(selfSpeakerAliases, event)
  ) {
    return false;
  }

  const questionLike = looksQuestionLike(text) || looksRequestLike(text);
  const salient = looksSalientStatement(text);
  const summaryIntent = profile.assistant.responseIntent === "summarize_what_was_just_said";
  const summaryEligible = summaryIntent && text.length >= 48;

  switch (profile.assistant.triggerPolicy) {
    case "questions_requests_only":
      return questionLike;
    case "salience_first":
      return questionLike || salient || summaryEligible;
    case "proactive":
      return questionLike || salient || text.length >= 48 || summaryEligible;
    default:
      return questionLike;
  }
}

function coalesceAssistantCandidates(
  session: MeetingSession,
  candidates: SavedMeetingEvent[]
): SavedMeetingEvent[] {
  if (candidates.length <= 1) {
    return candidates;
  }

  const candidateIds = new Set(candidates.map((event) => event.eventId));
  const orderedEvents = (session.events || []).filter((event) =>
    candidateIds.has(event.eventId)
  );
  const selectedEventIds = new Set<string>();

  for (let index = 0; index < orderedEvents.length; index += 1) {
    const event = orderedEvents[index];
    if (event.source !== "caption") {
      selectedEventIds.add(event.eventId);
      continue;
    }

    let selected = event;
    for (let nextIndex = index + 1; nextIndex < orderedEvents.length; nextIndex += 1) {
      const nextEvent = orderedEvents[nextIndex];
      if (nextEvent.source !== "caption") {
        break;
      }

      if (normalizeSpeakerLabel(nextEvent.speaker) !== normalizeSpeakerLabel(event.speaker)) {
        break;
      }

      if (nextEvent.timestamp - selected.timestamp > CAPTION_TRIGGER_COALESCE_WINDOW_MS) {
        break;
      }

      selected = nextEvent;
      index = nextIndex;
    }

    selectedEventIds.add(selected.eventId);
  }

  return candidates.filter((event) => selectedEventIds.has(event.eventId));
}

function getAssistantMaxTokens(profile: MeetingProfile): number {
  switch (profile.assistant.responseDepth) {
    case "ultra_brief":
      return 220;
    case "brief":
      return 360;
    case "expanded":
      return 560;
    case "standard":
    default:
      return 420;
  }
}

function getAssistantRetryMaxTokens(initialMaxTokens: number): number {
  return Math.min(Math.max(initialMaxTokens + 180, Math.round(initialMaxTokens * 1.75)), 720);
}

function shouldRequeueAssistantAfterSettingsRecovery(
  previousSettings: Settings,
  nextSettings: Settings
): boolean {
  const previousAvailability = getOpenAiServiceAvailability(previousSettings);
  const nextAvailability = getOpenAiServiceAvailability(nextSettings);

  if (previousAvailability.operational || !nextAvailability.operational) {
    return false;
  }

  if (nextSettings.verificationSnapshot?.status !== "verified") {
    return false;
  }

  return (
    (nextSettings.verificationSnapshot?.verifiedAt || 0) >
    (previousSettings.verificationSnapshot?.verifiedAt || 0)
  );
}

function getIntentInstruction(profile: MeetingProfile): string {
  switch (profile.assistant.responseIntent) {
    case "improve_my_answer":
      return "Improve the user's likely answer so it becomes clearer, stronger, and easier to say aloud.";
    case "suggest_next_point":
      return "Suggest the most useful next point the user should say or clarify.";
    case "summarize_what_was_just_said":
      return "Summarize the immediate discussion into a short, practical recap for the user.";
    case "surface_risks":
      return "Highlight the most relevant risk, blocker, or caveat the user should mention next.";
    case "coach_me":
      return "Coach the user on how to answer or respond effectively in this moment.";
    case "answer_for_me":
    default:
      return "Draft the most useful direct answer for the user to say next.";
  }
}

function getFormatInstruction(profile: MeetingProfile): string {
  switch (profile.assistant.responseFormat) {
    case "bullets":
      return "Format the answer as compact bullets.";
    case "short_paragraph":
      return "Format the answer as one short spoken-style paragraph.";
    case "structured_sections":
      return "Format the answer in short labeled sections.";
    case "script":
      return "Format the answer as a direct script the user can say nearly verbatim.";
    case "talking_points":
    default:
      return "Format the answer as short talking points optimized for speaking.";
  }
}

function getDepthInstruction(profile: MeetingProfile): string {
  switch (profile.assistant.responseDepth) {
    case "ultra_brief":
      return "Keep the answer extremely short.";
    case "brief":
      return "Keep the answer short and high-signal.";
    case "expanded":
      return "Allow a more complete answer with supporting detail when useful.";
    case "standard":
    default:
      return "Keep the answer concise but complete enough to be useful immediately.";
  }
}

function getToneInstruction(profile: MeetingProfile): string {
  switch (profile.assistant.responseTone) {
    case "direct":
      return "Use direct, low-friction phrasing.";
    case "supportive":
      return "Use supportive, steady phrasing.";
    case "confident":
      return "Use confident, assertive phrasing without overclaiming.";
    case "analytical":
      return "Use analytical, precise phrasing.";
    case "neutral":
    default:
      return "Use neutral professional phrasing.";
  }
}

function getDeliveryBiasInstruction(profile: MeetingProfile): string {
  switch (profile.assistant.deliveryBias) {
    case "fastest":
      return "Prefer the fastest useful answer over completeness.";
    case "careful":
      return "Prefer careful wording and precision over speed when needed.";
    case "balanced":
    default:
      return "Balance speed and precision.";
  }
}

function getParticipantScopeInstruction(profile: MeetingProfile): string {
  return profile.assistant.participantScope === "others_only"
    ? "Only respond to moments triggered by other participants, not the user's own speech."
    : "You may respond to useful moments from any participant when the trigger policy allows it.";
}

function formatTimelineLine(event: SavedMeetingEvent): string {
  const sourceLabel = event.source === "chat" ? "meeting chat" : "caption";
  return `- [${sourceLabel}] ${event.speaker || "Unknown"}: ${sanitizeLine(
    event.text
  )}`;
}

function buildAssistantMemorySnapshot(
  session: MeetingSession
): MeetingAssistantMemorySnapshot | undefined {
  const recentEvents = (session.events || []).slice(-MEMORY_EVENT_WINDOW);
  if (recentEvents.length === 0) {
    return undefined;
  }

  const speakers = Array.from(
    new Set(recentEvents.map((event) => sanitizeLine(event.speaker)).filter(Boolean))
  ).slice(0, 8);

  const openThreads = recentEvents
    .filter((event) => looksQuestionLike(event.text) || looksSalientStatement(event.text))
    .slice(-6)
    .map((event) => `- ${sanitizeLine(event.speaker)}: ${sanitizeLine(event.text)}`);

  const answeredPrompts = Object.values(
    session.artifacts?.assistantOutputs || {}
  )
    .sort((left, right) => left.createdAt - right.createdAt)
    .slice(-3)
    .map((output) => `- ${sanitizeLine(output.triggerText)}`);

  const parts = [
    speakers.length > 0 ? `Participants: ${speakers.join(", ")}` : "",
    openThreads.length > 0
      ? ["Current threads:", ...openThreads].join("\n")
      : "",
    answeredPrompts.length > 0
      ? ["Previously answered prompts:", ...answeredPrompts].join("\n")
      : "",
  ].filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  return {
    updatedAt: Date.now(),
    content: parts.join("\n\n"),
    sourceEventCount: recentEvents.length,
  };
}

function buildPendingOutput(
  event: SavedMeetingEvent,
  triggerTextOverride?: string
): MeetingAssistantPendingOutput {
  return {
    triggerEventId: event.eventId,
    triggerStableEventKey: event.stableEventKey,
    source: event.source,
    speaker: event.speaker || "Unknown",
    triggerText: sanitizeLine(triggerTextOverride || event.text),
    queuedAt: Date.now(),
  };
}

function applyPendingOutputPartialText(
  pendingOutputs: MeetingAssistantPendingOutput[],
  triggerEventId: string,
  partialContent: string
): MeetingAssistantPendingOutput[] {
  return pendingOutputs.map((pending) =>
    pending.triggerEventId === triggerEventId
      ? { ...pending, partialContent }
      : pending
  );
}

async function persistAssistantSessionState(
  session: MeetingSession,
  settings: Settings,
  updates: Partial<NonNullable<MeetingSession["artifacts"]>>
): Promise<MeetingSession> {
  const latestStoredRecord = await getStoredMeetingSessionRecord(session.id);
  const baseSession = latestStoredRecord
    ? normalizeMeetingSession(latestStoredRecord)
    : session;
  const updated = normalizeMeetingSession({
    ...baseSession,
    artifacts: {
      ...(baseSession.artifacts || {}),
      summaries: baseSession.artifacts?.summaries || baseSession.summaries,
      assistantOutputs:
        updates.assistantOutputs ?? baseSession.artifacts?.assistantOutputs,
      assistantMemory:
        updates.assistantMemory ?? baseSession.artifacts?.assistantMemory,
      assistantState:
        updates.assistantState ?? baseSession.artifacts?.assistantState,
    },
  });

  await putStoredMeetingSessionRecord(updated);
  await noteMeetingSessionSaved(updated, settings.connectedCloudProviders);
  return updated;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Assistant generation aborted.", "AbortError");
  }
}

function setAssistantLiveState(
  sessionId: string,
  status:
    | "watching"
    | "triggered"
    | "streaming"
    | "done"
    | "suppressed"
    | "error",
  pendingOutputs: MeetingAssistantPendingOutput[] = []
): void {
  assistantLiveStates.set(sessionId, {
    status,
    pendingOutputs: pendingOutputs.map((pending) => ({ ...pending })),
    updatedAt: Date.now(),
  });
}

async function shouldAutoRetryAssistantAfterVerificationRecovery(
  sessionId: string,
  liveState:
    | {
        status:
          | "watching"
          | "triggered"
          | "streaming"
          | "done"
          | "suppressed"
          | "error";
        pendingOutputs: MeetingAssistantPendingOutput[];
        updatedAt: number;
      }
    | undefined
): Promise<boolean> {
  if (!liveState || liveState.status !== "error") {
    return false;
  }

  const { settings } = await getSettings();
  const availability = getOpenAiServiceAvailability(settings);
  if (!availability.operational || settings.verificationSnapshot?.status !== "verified") {
    return false;
  }

  if ((settings.verificationSnapshot?.verifiedAt || 0) <= liveState.updatedAt) {
    return false;
  }

  if (activeAssistantPasses.has(sessionId)) {
    return false;
  }

  return true;
}

export async function getMeetingAssistantLiveState(sessionId: string): Promise<{
  success: boolean;
  liveState: {
    status:
      | "watching"
      | "triggered"
      | "streaming"
      | "done"
      | "suppressed"
      | "error";
    pendingOutputs: MeetingAssistantPendingOutput[];
    updatedAt: number;
  } | null;
}> {
  const liveState = assistantLiveStates.get(sessionId);
  if (await shouldAutoRetryAssistantAfterVerificationRecovery(sessionId, liveState)) {
    await assistantDiagnosticsLogger.info("assistant_pass_requeued_after_verification_recovery", {
      sessionId,
      failedAt: liveState?.updatedAt || null,
    }, {
      sessionId,
    });
    queueMeetingAssistantProcessing(sessionId);
  }

  return {
    success: true,
    liveState: liveState
      ? {
          status: liveState.status,
          pendingOutputs: liveState.pendingOutputs.map((pending) => ({ ...pending })),
          updatedAt: liveState.updatedAt,
        }
      : null,
  };
}

function isAssistantEnabledForSession(
  session: MeetingSession,
  profile: MeetingProfile
): boolean {
  const sessionOverride = session.artifacts?.assistantState;
  if (typeof sessionOverride?.enabled === "boolean") {
    return sessionOverride.enabled;
  }

  return profile.assistant.enabledByDefault;
}

function buildAssistantPrompt(params: {
  session: MeetingSession;
  profile: MeetingProfile;
  language: string;
  trigger: ResolvedAssistantTrigger;
  memory?: MeetingAssistantMemorySnapshot;
}): string {
  const { session, profile, language, trigger, memory } = params;
  const languageName = getLanguageName(language);
  const events = session.events || [];
  const triggerIndex = events.findIndex((event) => event.eventId === trigger.event.eventId);
  const recentContext = events
    .slice(Math.max(0, triggerIndex - CONTEXT_WINDOW_ITEMS), triggerIndex + 1)
    .map(formatTimelineLine)
    .join("\n");

  return `You are generating one live meeting-assistant response for the extension user.

Output language code: ${language}
Output language name: ${languageName}
Meeting profile: ${profile.name}
Assistant intent: ${profile.assistant.responseIntent}
Response format: ${profile.assistant.responseFormat}
Response depth: ${profile.assistant.responseDepth}
Response tone: ${profile.assistant.responseTone}
Delivery bias: ${profile.assistant.deliveryBias}
Participant scope: ${profile.assistant.participantScope}

Behavior contract:
- ${getIntentInstruction(profile)}
- ${getFormatInstruction(profile)}
- ${getDepthInstruction(profile)}
- ${getToneInstruction(profile)}
- ${getDeliveryBiasInstruction(profile)}
- ${getParticipantScopeInstruction(profile)}

Assistant instructions from the current profile:
${profile.assistant.prompt}

Relevant meeting memory:
${memory?.content || "No distilled memory yet."}

Recent meeting context:
${recentContext || "(no recent context)"}

Current trigger item:
- Source: ${trigger.event.source === "chat" ? "meeting chat" : "caption"}
- Speaker: ${trigger.event.speaker || "Unknown"}
- Full text: ${sanitizeLine(trigger.event.text)}

Question(s) to answer now:
${trigger.triggerText}

Rules:
- Return only the assistant response content.
- Be immediately usable in a live meeting.
- Write the entire response in ${languageName}.
- Translate all bullets, headings, labels, connective phrases, and explanatory text into ${languageName}.
- Do not answer in English unless the requested output language is English.
- If the profile instructions or recent context contain English section labels or example wording, keep the structure but still translate the final response into ${languageName}.
- Stay grounded in the current question(s) to answer, the trigger, and recent context.
- Do not mention internal settings, memory, or reasoning process.
- Answer only the unresolved question(s) listed under "Question(s) to answer now".
- Do not repeat an answer for a previously answered prompt unless the current question directly requires it.
- If prior assistant guidance is not directly relevant to the current question, ignore it.
- For interview questions, answer the exact question asked instead of defaulting to a generic career summary.
- If the trigger is a question from another participant, answer for the extension user.
- If the trigger is a risk, blocker, or decision point, give the most useful concise guidance for the user.
- Before returning, verify that the final response is fully written in ${languageName}.`;
}

async function generateAssistantOutput(
  session: MeetingSession,
  profile: MeetingProfile,
  settings: Settings,
  trigger: ResolvedAssistantTrigger,
  onTextDelta?: (partialContent: string) => Promise<void> | void,
  signal?: AbortSignal
): Promise<MeetingAssistantOutput | null> {
  if (!settings.openaiApiKey) {
    await assistantDiagnosticsLogger.warn("assistant_generation_skipped_missing_api_key", {
      sessionId: session.id,
    }, {
      sessionId: session.id,
    });
    return null;
  }

  const model = resolveAssistantModel(settings);
  const prompt = buildAssistantPrompt({
    session,
    profile,
    language: settings.meetingOutputLanguage,
    trigger,
    memory: session.artifacts?.assistantMemory,
  });
  const initialMaxTokens = getAssistantMaxTokens(profile);
  const retryMaxTokens = getAssistantRetryMaxTokens(initialMaxTokens);
  await assistantDiagnosticsLogger.debug("assistant_generation_started", {
    sessionId: session.id,
    triggerEventId: trigger.event.eventId,
    model,
    promptLength: prompt.length,
    triggerTextPreview: truncateForDiagnostics(trigger.triggerText, 180),
    responseDepth: profile.assistant.responseDepth,
    responseFormat: profile.assistant.responseFormat,
    responseIntent: profile.assistant.responseIntent,
    initialMaxTokens,
    retryMaxTokens,
  }, {
    sessionId: session.id,
  });
  let generatedContent: string;
  try {
    generatedContent = await generateStreamWithOpenAI(
      prompt,
      settings.openaiApiKey,
      model,
      {
        onTextDelta: (_delta, aggregatedText) =>
          onTextDelta?.(normalizeAssistantContent(aggregatedText)),
      },
      initialMaxTokens,
      signal
    );
  } catch (error) {
    if (!isAssistantGenerationTruncationError(error) || retryMaxTokens <= initialMaxTokens) {
      throw error;
    }

    await assistantDiagnosticsLogger.warn("assistant_generation_retrying_after_truncation", {
      sessionId: session.id,
      triggerEventId: trigger.event.eventId,
      failureKind: "truncation",
      triggerTextPreview: truncateForDiagnostics(trigger.triggerText, 180),
      errorMessage: truncateForDiagnostics(normalizeAssistantErrorMessage(error), 220),
      initialMaxTokens,
      retryMaxTokens,
    }, {
      sessionId: session.id,
    });

    generatedContent = await generateStreamWithOpenAI(
      prompt,
      settings.openaiApiKey,
      model,
      {
        onTextDelta: (_delta, aggregatedText) =>
          onTextDelta?.(normalizeAssistantContent(aggregatedText)),
      },
      retryMaxTokens,
      signal
    );
  }
  await recordOpenAiVerificationSuccess(
    settings,
    getOpenAiVerificationSuccessMessage()
  );
  const normalizedContent = normalizeAssistantContent(generatedContent);

  if (!normalizedContent) {
    await assistantDiagnosticsLogger.warn("assistant_generation_empty", {
      sessionId: session.id,
      triggerEventId: trigger.event.eventId,
      model,
    }, {
      sessionId: session.id,
    });
    return null;
  }

  const triggerKey = getTriggerKey(trigger.event);
  return {
    id: `${session.id}:${triggerKey}:assistant`,
    triggerEventId: trigger.event.eventId,
    triggerStableEventKey: trigger.event.stableEventKey,
    source: trigger.event.source,
    speaker: trigger.event.speaker || "Unknown",
    triggerText: sanitizeLine(trigger.triggerText),
    triggerTimestamp: trigger.event.timestamp,
    profileId: profile.id,
    content: normalizedContent,
    createdAt: Date.now(),
    provider: "openai",
    model,
    responseIntent: profile.assistant.responseIntent,
    responseFormat: profile.assistant.responseFormat,
    responseDepth: profile.assistant.responseDepth,
    responseTone: profile.assistant.responseTone,
    deliveryBias: profile.assistant.deliveryBias,
  };
}

async function runAssistantPass(
  sessionId: string,
  signal?: AbortSignal
): Promise<void> {
  try {
    await assistantDiagnosticsLogger.info("assistant_pass_started", {
      sessionId,
    }, {
      sessionId,
    });
    throwIfAborted(signal);
    const record = await getStoredMeetingSessionRecord(sessionId);
    if (!record) {
      await assistantDiagnosticsLogger.warn("assistant_pass_missing_session", {
        sessionId,
      }, {
        sessionId,
      });
      return;
    }

    const session = normalizeMeetingSession(record);
    const { settings } = await getSettings();
    const profile = resolveMeetingProfile(
      settings.meetingProfiles,
      session.meetingProfileId,
      settings.defaultMeetingProfileId
    ) as MeetingProfile;
    throwIfAborted(signal);

    if (!getOpenAiServiceAvailability(settings).operational) {
      const availability = getOpenAiServiceAvailability(settings);
      await assistantDiagnosticsLogger.warn("assistant_pass_blocked_provider_unavailable", {
        sessionId,
        model: settings.model,
        availabilityState: availability.state,
        availabilityMessage: availability.message,
        verificationStatus: settings.verificationSnapshot?.status || null,
        verificationMessage: settings.verificationSnapshot?.message || null,
      }, {
        sessionId,
      });
      setAssistantLiveState(sessionId, "error");
      return;
    }

    if (!isAssistantEnabledForSession(session, profile)) {
      await assistantDiagnosticsLogger.debug("assistant_pass_suppressed", {
        sessionId,
        profileId: profile.id,
      }, {
        sessionId,
      });
      setAssistantLiveState(sessionId, "suppressed");
      return;
    }

    const existingOutputs = session.artifacts?.assistantOutputs || {};
    const selfSpeakerAliases = getSelfSpeakerAliases(session);
    const allCandidates = coalesceAssistantCandidates(
      session,
      (session.events || [])
        .filter((event) => shouldConsiderEvent(selfSpeakerAliases, event, profile))
        .filter((event) => resolveAssistantTrigger(event, existingOutputs) !== null)
    );
    const candidates = allCandidates.slice(0, MAX_CANDIDATES_PER_PASS);

    await assistantDiagnosticsLogger.debug("assistant_candidates_selected", {
      sessionId,
      candidateCount: candidates.length,
      totalCandidateCount: allCandidates.length,
      existingOutputCount: Object.keys(existingOutputs).length,
    }, {
      sessionId,
    });

    if (candidates.length === 0) {
      const nextMemory = buildAssistantMemorySnapshot(session);
      setAssistantLiveState(
        sessionId,
        Object.keys(existingOutputs).length > 0 ? "done" : "watching"
      );
      if (nextMemory?.content !== session.artifacts?.assistantMemory?.content) {
        throwIfAborted(signal);
        await persistAssistantSessionState(session, settings, {
          assistantOutputs: { ...existingOutputs },
          assistantMemory: nextMemory,
        });
      }
      await assistantDiagnosticsLogger.trace("assistant_pass_no_candidates", {
        sessionId,
      }, {
        sessionId,
      });
      return;
    }

    let workingSession = session;
    setAssistantLiveState(sessionId, "triggered", candidates.map(buildPendingOutput));

    const nextOutputs = { ...existingOutputs };
    let changed = false;

    for (const [candidateIndex, candidate] of candidates.entries()) {
      throwIfAborted(signal);
      const resolvedTrigger = resolveAssistantTrigger(candidate, nextOutputs);
      let remainingPending = candidates
        .slice(candidateIndex + 1)
        .map(buildPendingOutput);

      if (!resolvedTrigger) {
        setAssistantLiveState(
          sessionId,
          remainingPending.length > 0 ? "streaming" : "done",
          remainingPending
        );
        continue;
      }

      let streamingPending = [
        buildPendingOutput(candidate, resolvedTrigger.triggerText),
        ...remainingPending,
      ];
      setAssistantLiveState(sessionId, "streaming", streamingPending);

      let lastStreamPersistAt = 0;
      let output: MeetingAssistantOutput | null = null;
      try {
        output = await generateAssistantOutput(
          workingSession,
          profile,
          settings,
          resolvedTrigger,
          async (partialContent) => {
            if (!partialContent) {
              return;
            }

            const now = Date.now();
            const shouldFlush = now - lastStreamPersistAt >= 150;
            streamingPending = applyPendingOutputPartialText(
              streamingPending,
              candidate.eventId,
              partialContent
            );

            if (!shouldFlush) {
              return;
            }

            lastStreamPersistAt = now;
            setAssistantLiveState(sessionId, "streaming", streamingPending);
          },
          signal
        );
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        if (!isAssistantGenerationTruncationError(error)) {
          await recordOpenAiVerificationFailure(
            getOpenAiVerificationFailureMessage(error),
            settings
          );
        }
        void assistantDiagnosticsLogger.error("assistant_generation_failed", {
          sessionId,
          triggerEventId: candidate.eventId,
          triggerTextPreview: truncateForDiagnostics(candidate.text, 180),
          failureKind: classifyOpenAiFailure(error),
          errorMessage: truncateForDiagnostics(normalizeAssistantErrorMessage(error), 260),
          verificationStatus: settings.verificationSnapshot?.status || null,
          verificationMessage: settings.verificationSnapshot?.message || null,
          model: settings.model,
          error,
        });
        setAssistantLiveState(sessionId, "error");
        return;
      }

      if (!output) {
        await assistantDiagnosticsLogger.warn("assistant_output_empty", {
          sessionId,
          triggerEventId: candidate.eventId,
        }, {
          sessionId,
        });
        setAssistantLiveState(
          sessionId,
          remainingPending.length > 0 ? "streaming" : "watching",
          remainingPending
        );
        continue;
      }
      nextOutputs[getTriggerKey(candidate)] = output;
      changed = true;
      await assistantDiagnosticsLogger.info("assistant_output_persisted", {
        sessionId,
        triggerEventId: candidate.eventId,
        outputId: output.id,
      }, {
        sessionId,
      });
      workingSession = await persistAssistantSessionState(workingSession, settings, {
        assistantOutputs: { ...nextOutputs },
      });
      setAssistantLiveState(
        sessionId,
        remainingPending.length > 0 ? "streaming" : "done",
        remainingPending
      );
    }

    if (!changed) {
      await assistantDiagnosticsLogger.trace("assistant_pass_completed_without_changes", {
        sessionId,
      }, {
        sessionId,
      });
      setAssistantLiveState(
        sessionId,
        Object.keys(existingOutputs).length > 0 ? "done" : "watching"
      );
      return;
    }

    await persistAssistantSessionState(workingSession, settings, {
      assistantOutputs: nextOutputs,
      assistantMemory: buildAssistantMemorySnapshot({
        ...workingSession,
        artifacts: {
          ...(workingSession.artifacts || {}),
          summaries: workingSession.artifacts?.summaries || workingSession.summaries,
          assistantOutputs: nextOutputs,
        },
      }),
    });
    setAssistantLiveState(sessionId, "done");

    await assistantDiagnosticsLogger.info("assistant_pass_completed", {
      sessionId,
      outputCount: Object.keys(nextOutputs).length,
    }, {
      sessionId,
    });

    if (allCandidates.length > MAX_CANDIDATES_PER_PASS) {
      pendingAssistantPasses.add(sessionId);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    throw error;
  }
}

async function processQueuedAssistantPass(
  sessionId: string,
  signal: AbortSignal
): Promise<void> {
  try {
    await runAssistantPass(sessionId, signal);
  } finally {
    activeAssistantPasses.delete(sessionId);
    assistantPassControllers.delete(sessionId);

    if (cancelledAssistantSessions.delete(sessionId)) {
      pendingAssistantPasses.delete(sessionId);
      assistantLiveStates.delete(sessionId);
      return;
    }

    if (pendingAssistantPasses.delete(sessionId)) {
      queueMeetingAssistantProcessing(sessionId);
    }
  }
}

export function queueMeetingAssistantProcessing(sessionId: string): void {
  if (!sessionId) {
    return;
  }

  void assistantDiagnosticsLogger.trace("assistant_queue_requested", {
    sessionId,
    active: activeAssistantPasses.has(sessionId),
  }, {
    sessionId,
  });

  cancelledAssistantSessions.delete(sessionId);

  if (activeAssistantPasses.has(sessionId)) {
    pendingAssistantPasses.add(sessionId);
    return;
  }

  const controller = new AbortController();
  assistantPassControllers.set(sessionId, controller);
  const pass = processQueuedAssistantPass(sessionId, controller.signal);
  activeAssistantPasses.set(sessionId, pass);
  void pass;
}

export async function requeueAssistantSessionsAfterSettingsRecovery(
  previousSettings: Settings,
  nextSettings: Settings
): Promise<{ queuedSessionIds: string[] }> {
  if (!shouldRequeueAssistantAfterSettingsRecovery(previousSettings, nextSettings)) {
    return { queuedSessionIds: [] };
  }

  const records = await listStoredMeetingSessionRecords();
  const queuedSessionIds = records
    .map((record) => normalizeMeetingSession(record))
    .filter((session) => session.lifecycleState === "live" || !session.endTime)
    .map((session) => session.id);

  queuedSessionIds.forEach((sessionId) => {
    queueMeetingAssistantProcessing(sessionId);
  });

  await assistantDiagnosticsLogger.info("assistant_sessions_requeued_after_settings_recovery", {
    queuedSessionCount: queuedSessionIds.length,
  });

  return { queuedSessionIds };
}

export function clearMeetingAssistantRuntimeState(
  sessionId?: string,
  reason: string = "unspecified"
): void {
  if (sessionId) {
    void assistantDiagnosticsLogger.info("assistant_runtime_state_cleared", {
      sessionId,
      scope: "single-session",
      reason,
    }, {
      sessionId,
    });
    cancelledAssistantSessions.add(sessionId);
    pendingAssistantPasses.delete(sessionId);
    assistantLiveStates.delete(sessionId);
    assistantPassControllers.get(sessionId)?.abort();
    return;
  }

  void assistantDiagnosticsLogger.warn("assistant_runtime_state_cleared", {
    scope: "all-sessions",
    activeSessionCount: assistantPassControllers.size,
    reason,
  });
  for (const [id, controller] of assistantPassControllers.entries()) {
    cancelledAssistantSessions.add(id);
    controller.abort();
  }

  pendingAssistantPasses.clear();
  assistantLiveStates.clear();
}

export const assistantGenerationInternals = {
  resolveAssistantModel,
  getTriggerKey,
  normalizeSpeakerLabel,
  getSelfSpeakerAliases,
  isLikelySelfEvent,
  sanitizeLine,
  normalizeAssistantContent,
  looksQuestionLike,
  looksRequestLike,
  looksSalientStatement,
  extractAssistantTriggerClauses,
  normalizeAssistantClauseText,
  buildAssistantClauseKey,
  getAnsweredAssistantClauseKeys,
  resolveAssistantTrigger,
  shouldConsiderEvent,
  coalesceAssistantCandidates,
  getAssistantMaxTokens,
  getAssistantRetryMaxTokens,
  buildAssistantMemorySnapshot,
  buildAssistantPrompt,
  isAssistantGenerationTruncationError,
  shouldRequeueAssistantAfterSettingsRecovery,
  shouldAutoRetryAssistantAfterVerificationRecovery,
  runAssistantPass,
  getAssistantLiveStatesForTests() {
    return new Map(assistantLiveStates);
  },
  resetAssistantInternalsForTests() {
    pendingAssistantPasses.clear();
    cancelledAssistantSessions.clear();
    assistantLiveStates.clear();

    for (const controller of assistantPassControllers.values()) {
      controller.abort();
    }

    assistantPassControllers.clear();
    activeAssistantPasses.clear();
  },
};
