import type { SummaryGenerationMode } from "./summary-generation";

export type AssistantResponseIntent =
  | "answer_for_me"
  | "improve_my_answer"
  | "suggest_next_point"
  | "summarize_what_was_just_said"
  | "surface_risks"
  | "coach_me";

export type AssistantResponseFormat =
  | "bullets"
  | "talking_points"
  | "short_paragraph"
  | "structured_sections"
  | "script";

export type AssistantResponseDepth =
  | "ultra_brief"
  | "brief"
  | "standard"
  | "expanded";

export type AssistantResponseTone =
  | "neutral"
  | "direct"
  | "supportive"
  | "confident"
  | "analytical";

export type AssistantDeliveryBias = "fastest" | "balanced" | "careful";

export type AssistantTriggerPolicy =
  | "questions_requests_only"
  | "salience_first"
  | "proactive";

export type AssistantParticipantScope = "all_participants" | "others_only";

export type AssistantProfileConfig = {
  enabledByDefault: boolean;
  prompt: string;
  responseIntent: AssistantResponseIntent;
  responseFormat: AssistantResponseFormat;
  responseDepth: AssistantResponseDepth;
  responseTone: AssistantResponseTone;
  deliveryBias: AssistantDeliveryBias;
  triggerPolicy: AssistantTriggerPolicy;
  participantScope: AssistantParticipantScope;
};

export type MeetingProfileShape = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  summaryGenerationMode: SummaryGenerationMode;
  autoSummarizeOnMeetingEnd: boolean;
  assistant: AssistantProfileConfig;
};

const DEFAULT_ASSISTANT_PROMPT = `Act as a live in-meeting assistant for the extension user.

Your job is to help the user respond quickly, clearly, and credibly in a way that matches the current meeting context.

Rules:
- Follow the configured response format, depth, tone, and delivery bias.
- Prefer direct, immediately usable output over analysis-heavy explanations.
- Stay grounded in what was actually said or strongly implied in the meeting context you receive.
- Give wording the user can realistically say out loud without rewriting it first.
- Do not answer your own invented questions.
- If context is incomplete, be helpful but avoid pretending certainty or inventing commitments.
- Return only the answer content for the rail.`;

export function createDefaultAssistantConfig(
  profileId?: string
): AssistantProfileConfig {
  switch (profileId) {
    case "interview":
      return {
        enabledByDefault: true,
        prompt: `Act as a live interview support assistant for the extension user.

Focus on helping the user answer the interviewer's question clearly, credibly, and fast.

Rules:
- Prioritize the interviewer's questions and requests over the user's own speech.
- Suggest concise, evidence-friendly talking points the user can say naturally.
- Prefer confidence, clarity, and structure over long explanations.
- When helpful, organize the answer as short points in a strong speaking order: answer first, evidence second, example third.
- Avoid overclaiming or inventing experience the user has not signaled.
- If the interviewer asks for specifics and the context is thin, help the user answer conservatively instead of fabricating detail.
- Return only the answer content for the rail.`,
        responseIntent: "answer_for_me",
        responseFormat: "talking_points",
        responseDepth: "brief",
        responseTone: "confident",
        deliveryBias: "fastest",
        triggerPolicy: "questions_requests_only",
        participantScope: "others_only",
      };
    case "client_call":
      return {
        enabledByDefault: false,
        prompt: `Act as a live client-call assistant for the extension user.

Help the user respond with crisp points, clarify requests, and surface risks, commitments, or follow-ups that matter during the call.

Rules:
- Prefer practical talking points over long prose.
- Highlight delivery risks, dependencies, assumptions, or follow-up commitments when they are implied.
- Keep suggestions professional, specific, and easy to say aloud.
- When the conversation is moving toward a decision, help the user state scope, timing, ownership, or next steps explicitly.
- Return only the answer content for the rail.`,
        responseIntent: "suggest_next_point",
        responseFormat: "talking_points",
        responseDepth: "brief",
        responseTone: "direct",
        deliveryBias: "balanced",
        triggerPolicy: "salience_first",
        participantScope: "all_participants",
      };
    case "daily_sync":
      return {
        enabledByDefault: false,
        prompt: `Act as a live daily-sync assistant for the extension user.

Help the user keep updates clear, brief, and operational.

Rules:
- Prefer terse bullets the user can say quickly.
- Focus on blockers, progress framing, ownership, and next-step clarity.
- Favor status-first wording: progress, blocker, next action.
- Return only the answer content for the rail.`,
        responseIntent: "suggest_next_point",
        responseFormat: "bullets",
        responseDepth: "ultra_brief",
        responseTone: "direct",
        deliveryBias: "fastest",
        triggerPolicy: "salience_first",
        participantScope: "all_participants",
      };
    case PROTECTED_MEETING_PROFILE_ID:
    case undefined:
    default:
      return {
        enabledByDefault: false,
        prompt: DEFAULT_ASSISTANT_PROMPT,
        responseIntent: "answer_for_me",
        responseFormat: "talking_points",
        responseDepth: "brief",
        responseTone: "neutral",
        deliveryBias: "balanced",
        triggerPolicy: "questions_requests_only",
        participantScope: "all_participants",
      };
  }
}

function normalizeAssistantConfig(
  assistant: Partial<AssistantProfileConfig> | null | undefined,
  fallback: AssistantProfileConfig
): AssistantProfileConfig {
  return {
    enabledByDefault:
      typeof assistant?.enabledByDefault === "boolean"
        ? assistant.enabledByDefault
        : fallback.enabledByDefault,
    prompt:
      typeof assistant?.prompt === "string" && assistant.prompt.trim()
        ? assistant.prompt
        : fallback.prompt,
    responseIntent:
      assistant?.responseIntent === "answer_for_me" ||
      assistant?.responseIntent === "improve_my_answer" ||
      assistant?.responseIntent === "suggest_next_point" ||
      assistant?.responseIntent === "summarize_what_was_just_said" ||
      assistant?.responseIntent === "surface_risks" ||
      assistant?.responseIntent === "coach_me"
        ? assistant.responseIntent
        : fallback.responseIntent,
    responseFormat:
      assistant?.responseFormat === "bullets" ||
      assistant?.responseFormat === "talking_points" ||
      assistant?.responseFormat === "short_paragraph" ||
      assistant?.responseFormat === "structured_sections" ||
      assistant?.responseFormat === "script"
        ? assistant.responseFormat
        : fallback.responseFormat,
    responseDepth:
      assistant?.responseDepth === "ultra_brief" ||
      assistant?.responseDepth === "brief" ||
      assistant?.responseDepth === "standard" ||
      assistant?.responseDepth === "expanded"
        ? assistant.responseDepth
        : fallback.responseDepth,
    responseTone:
      assistant?.responseTone === "neutral" ||
      assistant?.responseTone === "direct" ||
      assistant?.responseTone === "supportive" ||
      assistant?.responseTone === "confident" ||
      assistant?.responseTone === "analytical"
        ? assistant.responseTone
        : fallback.responseTone,
    deliveryBias:
      assistant?.deliveryBias === "fastest" ||
      assistant?.deliveryBias === "balanced" ||
      assistant?.deliveryBias === "careful"
        ? assistant.deliveryBias
        : fallback.deliveryBias,
    triggerPolicy:
      assistant?.triggerPolicy === "questions_requests_only" ||
      assistant?.triggerPolicy === "salience_first" ||
      assistant?.triggerPolicy === "proactive"
        ? assistant.triggerPolicy
        : fallback.triggerPolicy,
    participantScope:
      assistant?.participantScope === "all_participants" ||
      assistant?.participantScope === "others_only"
        ? assistant.participantScope
        : fallback.participantScope,
  };
}

export const PROTECTED_MEETING_PROFILE_ID = "general_summary";

export const PROTECTED_MEETING_PROFILE = {
  id: PROTECTED_MEETING_PROFILE_ID,
  name: "General Meeting",
  description:
    "A safe default for any meeting when you do not want a specialized meeting profile.",
  summaryGenerationMode: "balanced",
  autoSummarizeOnMeetingEnd: false,
  prompt: `Create a clear, accurate, and practical meeting summary from the transcript, regardless of meeting type, participant count, or speaking style.

First infer the likely meeting context from the transcript if possible. This may be a work meeting, daily sync, project review, planning session, retrospective, client call, sales call, interview, screening call, consultation, coaching session, support call, technical discussion, incident review, training session, or another multi-person conversation. Adapt emphasis to the conversation type without inventing facts.

Always look for:
- The main purpose of the meeting
- The most important topics discussed
- Decisions, agreements, or explicit non-decisions
- Action items, owners, deadlines, and follow-ups when they are explicitly stated
- Risks, blockers, objections, concerns, or unresolved questions
- Important names, dates, numbers, deliverables, scope, budget, timeline, or commitments when mentioned
- Signals about next steps, pending dependencies, or items requiring clarification

When the meeting type appears to be:
- A work or project meeting:
  Focus on progress updates, blockers, ownership, dependencies, deadlines, decisions, and execution next steps.
- An interview:
  Focus on candidate background, relevant experience, strengths, concerns, examples, evaluation signals, and recommended next step only if supported by the transcript.
- A consultation, coaching, or advisory session:
  Focus on goals, current situation, recommendations, cautions, options considered, and suggested follow-up actions.
- A client, sales, or stakeholder call:
  Focus on client needs, requests, objections, commitments, commercial or delivery constraints, and follow-up responsibilities for each side.

Preferred structure:
1. Meeting Context
   Briefly describe the apparent meeting type, purpose, and participants or roles if they are clear from the transcript.
2. Executive Summary
   A concise overview of what mattered most.
3. Key Discussion Points
   Organize the main topics into clean bullets or short subsections.
4. Decisions and Commitments
   Include only decisions or commitments that were actually stated or strongly implied by the discussion.
5. Action Items
   List each action item with owner and timing only when explicit. If owner or date is unclear, say so.
6. Risks, Blockers, or Open Questions
   Capture unresolved issues, dependencies, or uncertainties.
7. Notable Details
   Include important factual details such as names, deadlines, numbers, or deliverables if they materially help follow-up.

Rules:
- Write in the requested language.
- Stay faithful to the transcript and do not invent facts, participants, outcomes, or recommendations.
- If the transcript is messy, fragmented, repetitive, or has many speakers, consolidate by topic instead of repeating every line.
- If ownership, deadlines, or decisions are ambiguous, explicitly say that they were not clearly stated.
- If the meeting type is unclear, still produce a useful general-purpose summary without forcing a category.
- Keep the result readable, structured, and practical for someone who needs to act on the meeting afterward.
- Return only the summary in Markdown.`,
  assistant: createDefaultAssistantConfig(PROTECTED_MEETING_PROFILE_ID),
} as const satisfies MeetingProfileShape;

export const STARTER_MEETING_PROFILES = [
  PROTECTED_MEETING_PROFILE,
  {
    id: "daily_sync",
    name: "Daily Sync",
    description:
      "Best for short recurring team check-ins focused on progress, blockers, and next steps.",
    summaryGenerationMode: "balanced",
    autoSummarizeOnMeetingEnd: false,
    prompt: `Create a concise daily sync summary from the transcript.

Focus on:
- What each person completed or reported as progress
- Current blockers or risks
- Immediate next steps for the next work block
- Ownership and timing when they are explicit

Preferred structure:
1. Snapshot
2. Progress Updates
3. Blockers
4. Next Steps

Rules:
- Keep it brief and operational.
- Mention names only when the owner is explicit.
- If updates are fragmented, summarize by topic instead of forcing per-person bullets.
- If there is no real blocker or decision, do not invent one just to fill the structure.`,
    assistant: createDefaultAssistantConfig("daily_sync"),
  },
  {
    id: "interview",
    name: "Interview",
    description:
      "Good for candidate interviews, screening calls, and structured evaluation conversations.",
    summaryGenerationMode: "balanced",
    autoSummarizeOnMeetingEnd: false,
    prompt: `Create an interview summary from the transcript.

Focus on:
- Candidate background and relevant experience
- Key strengths demonstrated in the conversation
- Concerns, gaps, or follow-up areas
- Concrete examples, achievements, or technical signals mentioned

Preferred structure:
1. Candidate Snapshot
2. Strengths
3. Concerns or Gaps
4. Notable Evidence
5. Recommended Next Step

Rules:
- Stay evidence-based and neutral in tone.
- Do not invent a hiring recommendation if the transcript does not support one.
- Separate observed evidence from interpretation when needed.
- Distinguish what the candidate claimed from what was directly demonstrated in the conversation when that difference matters.`,
    assistant: createDefaultAssistantConfig("interview"),
  },
  {
    id: "client_call",
    name: "Client Call",
    description:
      "Designed for discovery calls, client status updates, and external stakeholder meetings.",
    summaryGenerationMode: "balanced",
    autoSummarizeOnMeetingEnd: false,
    prompt: `Create a client call summary from the transcript.

Focus on:
- Client goals, needs, and context
- Requests, decisions, and commitments
- Timeline, scope, budget, or delivery details if mentioned
- Clear follow-up actions for each side

Preferred structure:
1. Client Context
2. Key Discussion Points
3. Decisions and Commitments
4. Follow-up Actions
5. Risks or Open Questions

Rules:
- Make the summary easy to share internally after the call.
- Highlight commitments carefully and only when they are explicit.
- If no decision was made, say that clearly instead of implying agreement.
- Call out delivery risks, dependencies, and open commercial questions when they materially affect follow-up.`,
    assistant: createDefaultAssistantConfig("client_call"),
  },
] as const satisfies readonly MeetingProfileShape[];

export const DEFAULT_MEETING_PROFILES = STARTER_MEETING_PROFILES;

const STARTER_PROFILE_MAP = new Map(
  STARTER_MEETING_PROFILES.map((profile) => [profile.id, profile])
);

export function isProtectedMeetingProfile(profileId: string): boolean {
  return profileId === PROTECTED_MEETING_PROFILE_ID;
}

export function getDefaultMeetingProfilePrompt(profileId?: string): string {
  if (!profileId) {
    return PROTECTED_MEETING_PROFILE.prompt;
  }

  return STARTER_PROFILE_MAP.get(profileId)?.prompt || PROTECTED_MEETING_PROFILE.prompt;
}

export function normalizeMeetingProfiles<T extends MeetingProfileShape>(
  profiles: readonly T[] | T[] | undefined | null
): MeetingProfileShape[] {
  const normalized = new Map<string, MeetingProfileShape>();

  for (const profile of profiles || []) {
    if (!profile?.id) {
      continue;
    }

    const starterProfile = STARTER_PROFILE_MAP.get(profile.id);
    normalized.set(profile.id, {
      id: profile.id,
      name: profile.name?.trim() || starterProfile?.name || "Untitled profile",
      description:
        profile.description?.trim() ||
        starterProfile?.description ||
        "Custom meeting profile",
      prompt:
        profile.prompt?.trim() || getDefaultMeetingProfilePrompt(profile.id),
      summaryGenerationMode:
        profile.summaryGenerationMode === "economy" ||
        profile.summaryGenerationMode === "balanced" ||
        profile.summaryGenerationMode === "thorough"
          ? profile.summaryGenerationMode
          : starterProfile?.summaryGenerationMode || "balanced",
      autoSummarizeOnMeetingEnd:
        typeof profile.autoSummarizeOnMeetingEnd === "boolean"
          ? profile.autoSummarizeOnMeetingEnd
          : starterProfile?.autoSummarizeOnMeetingEnd || false,
      assistant: normalizeAssistantConfig(
        profile.assistant,
        starterProfile?.assistant || createDefaultAssistantConfig(profile.id)
      ),
    });
  }

  if (!normalized.has(PROTECTED_MEETING_PROFILE_ID)) {
    normalized.set(PROTECTED_MEETING_PROFILE_ID, { ...PROTECTED_MEETING_PROFILE });
  }

  const protectedProfile = normalized.get(PROTECTED_MEETING_PROFILE_ID);
  normalized.set(PROTECTED_MEETING_PROFILE_ID, {
    ...PROTECTED_MEETING_PROFILE,
    summaryGenerationMode:
      protectedProfile?.summaryGenerationMode ||
      PROTECTED_MEETING_PROFILE.summaryGenerationMode,
    assistant: normalizeAssistantConfig(
      protectedProfile?.assistant,
      PROTECTED_MEETING_PROFILE.assistant
    ),
  });

  const orderedProfiles = [normalized.get(PROTECTED_MEETING_PROFILE_ID)!];

  for (const profile of normalized.values()) {
    if (profile.id !== PROTECTED_MEETING_PROFILE_ID) {
      orderedProfiles.push(profile);
    }
  }

  return orderedProfiles;
}

export function resolveMeetingProfile<T extends MeetingProfileShape>(
  profiles: readonly T[] | T[],
  requestedProfileId?: string,
  fallbackProfileId?: string
): T | MeetingProfileShape {
  return (
    profiles.find((profile) => profile.id === requestedProfileId) ||
    profiles.find((profile) => profile.id === fallbackProfileId) ||
    profiles.find((profile) => profile.id === PROTECTED_MEETING_PROFILE_ID) ||
    profiles[0] ||
    PROTECTED_MEETING_PROFILE
  );
}

export function resolveMeetingProfilePrompt(
  profile?: Pick<MeetingProfileShape, "id" | "prompt"> | null
): string {
  return profile?.prompt?.trim() || getDefaultMeetingProfilePrompt(profile?.id);
}

export function isAutomaticSummaryEnabledForProfile(
  profile?: Pick<MeetingProfileShape, "autoSummarizeOnMeetingEnd"> | null
): boolean {
  return Boolean(profile?.autoSummarizeOnMeetingEnd);
}
