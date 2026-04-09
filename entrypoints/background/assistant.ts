import type {
  MeetingAssistantMemorySnapshot,
  MeetingAssistantOutput,
  MeetingAssistantPendingOutput,
  MeetingSession,
  SavedMeetingEvent,
  Settings,
  SummaryProfile,
} from "./types";
import {
  getSettings,
  recordOpenAiVerificationFailure,
  recordOpenAiVerificationSuccess,
} from "./settings";
import {
  getStoredMeetingSessionRecord,
  putStoredMeetingSessionRecord,
} from "./history-db";
import { noteMeetingSessionSaved } from "./cloud-sync";
import { generateStreamWithOpenAI } from "./providers/openai";
import {
  getOpenAiServiceAvailability,
  getOpenAiVerificationFailureMessage,
  getOpenAiVerificationSuccessMessage,
} from "../shared/openai-service";
import { normalizeMeetingSession } from "../shared/meeting-session";
import { resolveSummaryProfile } from "../shared/summary-profiles";
import { createBackgroundDiagnosticsLogger } from "./diagnostics";

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

function looksQuestionLike(text: string): boolean {
  const normalized = sanitizeLine(text).toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized.includes("?") || normalized.includes("؟")) {
    return true;
  }

  return /^(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|am|will|have|has|آیا|ایا|چه|چی|چطور|چگونه|چرا|کجا|کی|چند|میشه|ميشه|میشه|میتونی|می‌تونی|میتونید|می‌تونید|ممکنه|ممکن است)\b/.test(
    normalized
  );
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

function shouldConsiderEvent(
  selfSpeakerAliases: Set<string>,
  event: SavedMeetingEvent,
  profile: SummaryProfile
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

  switch (profile.assistant.triggerPolicy) {
    case "questions_requests_only":
      return questionLike;
    case "salience_first":
      return questionLike || salient;
    case "proactive":
      return questionLike || salient || text.length >= 48;
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

function getAssistantMaxTokens(profile: SummaryProfile): number {
  switch (profile.assistant.responseDepth) {
    case "ultra_brief":
      return 96;
    case "brief":
      return 180;
    case "expanded":
      return 420;
    case "standard":
    default:
      return 280;
  }
}

function getIntentInstruction(profile: SummaryProfile): string {
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

function getFormatInstruction(profile: SummaryProfile): string {
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

function getDepthInstruction(profile: SummaryProfile): string {
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

function getToneInstruction(profile: SummaryProfile): string {
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

function getDeliveryBiasInstruction(profile: SummaryProfile): string {
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

function getParticipantScopeInstruction(profile: SummaryProfile): string {
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

  const latestAssistantOutputs = Object.values(
    session.artifacts?.assistantOutputs || {}
  )
    .sort((left, right) => left.createdAt - right.createdAt)
    .slice(-3)
    .map((output) => `- ${sanitizeLine(output.content)}`);

  const parts = [
    speakers.length > 0 ? `Participants: ${speakers.join(", ")}` : "",
    openThreads.length > 0
      ? ["Current threads:", ...openThreads].join("\n")
      : "",
    latestAssistantOutputs.length > 0
      ? ["Recent assistant guidance:", ...latestAssistantOutputs].join("\n")
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

function buildPendingOutput(event: SavedMeetingEvent): MeetingAssistantPendingOutput {
  return {
    triggerEventId: event.eventId,
    triggerStableEventKey: event.stableEventKey,
    source: event.source,
    speaker: event.speaker || "Unknown",
    triggerText: sanitizeLine(event.text),
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
  const updated = normalizeMeetingSession({
    ...session,
    artifacts: {
      ...(session.artifacts || {}),
      summaries: session.artifacts?.summaries || session.summaries,
      assistantOutputs:
        updates.assistantOutputs ?? session.artifacts?.assistantOutputs,
      assistantMemory:
        updates.assistantMemory ?? session.artifacts?.assistantMemory,
      assistantState:
        updates.assistantState ?? session.artifacts?.assistantState,
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

export function getMeetingAssistantLiveState(sessionId: string): {
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
} {
  const liveState = assistantLiveStates.get(sessionId);
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
  profile: SummaryProfile
): boolean {
  const sessionOverride = session.artifacts?.assistantState;
  if (typeof sessionOverride?.enabled === "boolean") {
    return sessionOverride.enabled;
  }

  return profile.assistant.enabledByDefault;
}

function buildAssistantPrompt(params: {
  session: MeetingSession;
  profile: SummaryProfile;
  language: string;
  trigger: SavedMeetingEvent;
  memory?: MeetingAssistantMemorySnapshot;
}): string {
  const { session, profile, language, trigger, memory } = params;
  const events = session.events || [];
  const triggerIndex = events.findIndex((event) => event.eventId === trigger.eventId);
  const recentContext = events
    .slice(Math.max(0, triggerIndex - CONTEXT_WINDOW_ITEMS), triggerIndex + 1)
    .map(formatTimelineLine)
    .join("\n");

  return `You are generating one live meeting-assistant response for the extension user.

Output language: ${language}
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

Trigger item:
- Source: ${trigger.source === "chat" ? "meeting chat" : "caption"}
- Speaker: ${trigger.speaker || "Unknown"}
- Text: ${sanitizeLine(trigger.text)}

Rules:
- Return only the assistant response content.
- Be immediately usable in a live meeting.
- Stay grounded in the trigger and recent context.
- Do not mention internal settings, memory, or reasoning process.
- If the trigger is a question from another participant, answer for the extension user.
- If the trigger is a risk, blocker, or decision point, give the most useful concise guidance for the user.`;
}

async function generateAssistantOutput(
  session: MeetingSession,
  profile: SummaryProfile,
  settings: Settings,
  trigger: SavedMeetingEvent,
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
    language: settings.summaryLanguage,
    trigger,
    memory: session.artifacts?.assistantMemory,
  });
  await assistantDiagnosticsLogger.debug("assistant_generation_started", {
    sessionId: session.id,
    triggerEventId: trigger.eventId,
    model,
    promptLength: prompt.length,
  }, {
    sessionId: session.id,
  });
  const generatedContent = await generateStreamWithOpenAI(
    prompt,
    settings.openaiApiKey,
    model,
    {
      onTextDelta: (_delta, aggregatedText) =>
        onTextDelta?.(normalizeAssistantContent(aggregatedText)),
    },
    getAssistantMaxTokens(profile),
    signal
  );
  await recordOpenAiVerificationSuccess(
    settings,
    getOpenAiVerificationSuccessMessage()
  );
  const normalizedContent = normalizeAssistantContent(generatedContent);

  if (!normalizedContent) {
    await assistantDiagnosticsLogger.warn("assistant_generation_empty", {
      sessionId: session.id,
      triggerEventId: trigger.eventId,
      model,
    }, {
      sessionId: session.id,
    });
    return null;
  }

  const triggerKey = getTriggerKey(trigger);
  return {
    id: `${session.id}:${triggerKey}:assistant`,
    triggerEventId: trigger.eventId,
    triggerStableEventKey: trigger.stableEventKey,
    source: trigger.source,
    speaker: trigger.speaker || "Unknown",
    triggerText: sanitizeLine(trigger.text),
    triggerTimestamp: trigger.timestamp,
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
  const profile = resolveSummaryProfile(
    settings.summaryProfiles,
    session.summaryProfileId,
    settings.defaultSummaryProfileId
  ) as SummaryProfile;
  throwIfAborted(signal);

  if (!getOpenAiServiceAvailability(settings).operational) {
    await assistantDiagnosticsLogger.warn("assistant_pass_blocked_provider_unavailable", {
      sessionId,
      model: settings.model,
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
    .filter((event) => !existingOutputs[getTriggerKey(event)])
    .filter((event) => shouldConsiderEvent(selfSpeakerAliases, event, profile))
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
    let remainingPending = candidates
      .slice(candidateIndex + 1)
      .map(buildPendingOutput);
    let streamingPending = [buildPendingOutput(candidate), ...remainingPending];
    setAssistantLiveState(sessionId, "streaming", streamingPending);

    let lastStreamPersistAt = 0;
    let output: MeetingAssistantOutput | null = null;
    try {
      output = await generateAssistantOutput(
        workingSession,
        profile,
        settings,
        candidate,
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
      await recordOpenAiVerificationFailure(
        getOpenAiVerificationFailureMessage(error),
        settings
      );
      void assistantDiagnosticsLogger.error("assistant_generation_failed", {
        sessionId,
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

export function clearMeetingAssistantRuntimeState(sessionId?: string): void {
  if (sessionId) {
    void assistantDiagnosticsLogger.info("assistant_runtime_state_cleared", {
      sessionId,
      scope: "single-session",
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
  });
  for (const [id, controller] of assistantPassControllers.entries()) {
    cancelledAssistantSessions.add(id);
    controller.abort();
  }

  pendingAssistantPasses.clear();
  assistantLiveStates.clear();
}
