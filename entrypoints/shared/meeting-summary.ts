import type { MeetingSession, MeetingSummary } from "./meeting-session";
import { getLanguageName } from "./language-metadata";
import { resolveMeetingProfilePrompt } from "./meeting-profiles";
import type {
  SummaryEvidence,
  SummaryExecutionStrategy,
  SummaryGenerationMode,
} from "./summary-generation";

function buildTranscriptText(session: MeetingSession): string {
  return session.captions
    .map(
      (caption) =>
        `[${caption.time}] ${caption.speaker || "Unknown"}: ${caption.text}`
    )
    .join("\n");
}

function buildMeetingChatText(session: MeetingSession): string {
  return session.chatMessages
    .map(
      (message) =>
        `[${message.time}] ${message.speaker || "Unknown"}: ${message.text}`
    )
    .join("\n");
}

export function buildMeetingSummaryPrompt(
  session: MeetingSession,
  targetLanguage: string,
  profileId: string,
  profileName: string,
  summaryPrompt: string
): string {
  const languageName = getLanguageName(targetLanguage);
  const transcript = buildTranscriptText(session);
  const meetingChat = buildMeetingChatText(session);

  return `You are summarizing a browser-captured meeting transcript.

Target language: ${languageName}
Meeting provider: ${session.providerLabel}
Meeting title: ${session.title || "Untitled session"}
Meeting type: ${profileName}

CRITICAL OUTPUT RULES:
- Write the entire summary in ${languageName}.
- Do not answer in English unless the target language is English.
- Translate headings, labels, bullets, and prose into ${languageName}.
- If the user's profile suggests English section titles or labels, preserve the structure but translate those titles and labels into ${languageName}.
- The final Markdown must read as if it were originally authored in ${languageName}, except for names and proper nouns that should stay unchanged.
- Keep names, product names, APIs, acronyms, and proper nouns in their original form when appropriate.
- Return only the summary in Markdown.

Summary instructions:
${resolveMeetingProfilePrompt({ id: profileId, prompt: summaryPrompt })}

Transcript:
${transcript || "No transcript content was captured."}

${meetingChat ? `Meeting chat:\n${meetingChat}\n\n` : ""}
Before returning, verify that the output language is ${languageName}.`;
}

export function buildStructuredMeetingSummaryPrompt(
  session: MeetingSession,
  targetLanguage: string,
  profileId: string,
  profileName: string,
  summaryPrompt: string
): string {
  const languageName = getLanguageName(targetLanguage);
  const transcript = buildTranscriptText(session);
  const meetingChat = buildMeetingChatText(session);

  return `You are summarizing a browser-captured meeting session.

Target language: ${languageName}
Meeting provider: ${session.providerLabel}
Meeting title: ${session.title || "Untitled session"}
Meeting type: ${profileName}

CRITICAL OUTPUT RULES:
- Write the entire summary in ${languageName}.
- Return only the final summary in Markdown.
- Stay faithful to the evidence.
- Prefer structured topic consolidation over transcript-like retelling.
- Translate all section titles, labels, bullets, and connective prose into ${languageName}, even if the user's profile names those sections in English.

Summary instructions:
${resolveMeetingProfilePrompt({ id: profileId, prompt: summaryPrompt })}

Session evidence:

Transcript timeline:
${transcript || "No transcript content was captured."}

${meetingChat ? `Meeting chat timeline:\n${meetingChat}\n` : ""}
Focus on extracting the strongest signals, decisions, actions, and unresolved questions before writing the final summary.`;
}

export function buildSummaryEvidenceExtractionPrompt(
  session: MeetingSession,
  targetLanguage: string,
  profileName: string,
  summaryPrompt: string,
  chunkContent: string,
  chunkIndex: number,
  chunkCount: number
): string {
  const languageName = getLanguageName(targetLanguage);

  return `You are extracting structured evidence from one chunk of a meeting session.

Target language for the final summary: ${languageName}
Meeting provider: ${session.providerLabel}
Meeting title: ${session.title || "Untitled session"}
Meeting type: ${profileName}
Chunk: ${chunkIndex + 1} of ${chunkCount}

The user's final summary instructions are below. Do not write the final summary yet. Use them only to understand what kinds of evidence will matter most in the final synthesis.

Summary instructions:
${summaryPrompt}

Return valid JSON only with this exact shape:
{
  "facts": ["..."],
  "decisions": ["..."],
  "actionItems": ["..."],
  "risks": ["..."],
  "openQuestions": ["..."],
  "notableDetails": ["..."],
  "snippets": ["..."],
  "speakerSignals": [{"speaker":"Name","signal":"..."}]
}

Rules:
- Extract evidence only from the chunk content provided.
- Do not invent facts.
- Keep each array concise but loss-aware.
- Keep names, products, APIs, and proper nouns in their original form when appropriate.
- \`snippets\` should contain only short, high-signal supporting lines when genuinely useful.
- If a field has nothing useful, return an empty array.
- Return JSON only. Do not wrap in Markdown fences.

Chunk content:
${chunkContent}`;
}

export function buildEvidenceBackedMeetingSummaryPrompt(
  session: MeetingSession,
  targetLanguage: string,
  profileId: string,
  profileName: string,
  summaryPrompt: string,
  evidence: SummaryEvidence
): string {
  const languageName = getLanguageName(targetLanguage);
  const evidenceJson = JSON.stringify(evidence, null, 2);

  return `You are summarizing a browser-captured meeting session from structured evidence.

Target language: ${languageName}
Meeting provider: ${session.providerLabel}
Meeting title: ${session.title || "Untitled session"}
Meeting type: ${profileName}

CRITICAL OUTPUT RULES:
- Write the entire summary in ${languageName}.
- Return only the final summary in Markdown.
- Use the evidence below as the source of truth.
- Do not invent facts that are not supported by the evidence.
- Preserve the user's requested structure, emphasis, and analytical strategy.
- Translate all headings, section labels, and explanatory text into ${languageName}, even when the user's profile describes them in English.

Summary instructions:
${resolveMeetingProfilePrompt({ id: profileId, prompt: summaryPrompt })}

Merged session evidence:
${evidenceJson}

Before returning, verify that:
- the summary is fully in ${languageName}
- the requested structure from the user's summary instructions is respected
- the content stays faithful to the evidence`;
}

export function buildMeetingSummaryContinuationPrompt(
  basePrompt: string,
  partialSummary: string
): string {
  return `${basePrompt}

The previous response stopped before the summary was complete.

Continue the same Markdown summary from exactly where it stopped.

Rules for the continuation:
- Do not restart from the beginning.
- Do not repeat completed sections unless a heading must be reopened for continuity.
- Continue seamlessly in the same language, structure, and tone.
- Keep every heading, label, bullet, and sentence in the target language from the original prompt.
- Return only the continuation text in Markdown.

Summary generated so far:
${partialSummary}`;
}

export function buildMeetingSummaryReconciliationPrompt(
  targetLanguage: string,
  summaryDraft: string
): string {
  const languageName = getLanguageName(targetLanguage);

  return `You are cleaning up a generated meeting summary that was assembled from multiple output segments.

Target language: ${languageName}

Your job:
- preserve the meaning exactly
- remove accidental repetition
- repair heading hierarchy
- repair numbering and bullets
- smooth visible seams between segments
- keep the final output fully in ${languageName}
- translate any remaining English headings, labels, or connective phrases into ${languageName} unless they are proper nouns

Rules:
- Do not add new facts.
- Do not remove important content.
- Return only the repaired summary in Markdown.

Summary draft:
${summaryDraft}`;
}

export function createTextFingerprint(input: string): string {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}

export function getMeetingSummaryGroupKey(
  profileId: string,
  targetLanguage: string
): string {
  return `${profileId}:${targetLanguage}`;
}

export function getMeetingSummaryArtifactKey(
  profileId: string,
  targetLanguage: string,
  generatedAt: number
): string {
  return `${getMeetingSummaryGroupKey(profileId, targetLanguage)}:${generatedAt}`;
}

export function getMeetingSummaryList(
  summaries: Record<string, MeetingSummary> | undefined
): MeetingSummary[] {
  return Object.values(summaries || {}).sort(
    (left, right) => right.generatedAt - left.generatedAt
  );
}

export function findLatestMeetingSummary(
  summaries: Record<string, MeetingSummary> | undefined,
  options?: {
    profileId?: string;
    language?: string;
    requestSource?: "automatic" | "manual";
  }
): MeetingSummary | null {
  return (
    getMeetingSummaryList(summaries).find((summary) => {
      if (options?.profileId && summary.profileId !== options.profileId) {
        return false;
      }
      if (options?.language && summary.language !== options.language) {
        return false;
      }
      if (options?.requestSource && summary.requestSource !== options.requestSource) {
        return false;
      }
      return true;
    }) || null
  );
}

export function createMeetingSummaryArtifact(
  session: MeetingSession,
  profileId: string,
  profileName: string,
  targetLanguage: string,
  content: string,
  provider: string,
  model: string,
  instructionSnapshot: string,
  metadata?: {
    generationMode?: SummaryGenerationMode;
    requestSource?: "automatic" | "manual";
    sourceSessionProfileId?: string;
    executionStrategy?: SummaryExecutionStrategy;
    continuationCount?: number;
    evidenceChunkCount?: number;
    reconciled?: boolean;
  }
): MeetingSummary {
  const generatedAt = Date.now();
  const sourceFingerprint = createTextFingerprint(
    [
      ...session.captions.map(
        (caption) => `${caption.timestamp}|${caption.speaker}|${caption.text}`
      ),
      ...session.chatMessages.map(
        (message) =>
          `chat:${message.timestamp}|${message.speaker}|${message.text}`
      ),
    ].join("\n")
  );

  return {
    key: getMeetingSummaryArtifactKey(profileId, targetLanguage, generatedAt),
    groupKey: getMeetingSummaryGroupKey(profileId, targetLanguage),
    profileId,
    profileName,
    language: targetLanguage,
    content,
    generatedAt,
    provider,
    model,
    instructionSnapshot,
    sourceFingerprint,
    captionCount: session.captions.length,
    generationMode: metadata?.generationMode,
    requestSource: metadata?.requestSource,
    sourceSessionProfileId: metadata?.sourceSessionProfileId,
    executionStrategy: metadata?.executionStrategy,
    continuationCount: metadata?.continuationCount,
    evidenceChunkCount: metadata?.evidenceChunkCount,
    reconciled: metadata?.reconciled,
  };
}
