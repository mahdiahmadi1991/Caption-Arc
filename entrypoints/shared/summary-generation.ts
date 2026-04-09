import type { MeetingEventSource, MeetingSession } from "./meeting-session";

export type SummaryGenerationMode = "economy" | "balanced" | "thorough";
export type SummaryExecutionStrategy =
  | "single_shot"
  | "structured_single_shot"
  | "multi_stage";
export type SummaryRiskLevel = "low" | "medium" | "high";

export type SummaryExecutionPlan = {
  mode: SummaryGenerationMode;
  strategy: SummaryExecutionStrategy;
  riskLevel: SummaryRiskLevel;
  transcriptChars: number;
  chatChars: number;
  totalSourceChars: number;
  instructionChars: number;
  turnCount: number;
  evidenceChunkTargetChars: number;
  shouldAllowContinuationFallback: boolean;
  shouldRunReconciliationPass: boolean;
};

export type SummarySourceTimelineItem = {
  source: MeetingEventSource;
  timestamp: number;
  speaker: string;
  text: string;
  time: string;
};

export type SummarySourceChunk = {
  chunkIndex: number;
  items: SummarySourceTimelineItem[];
  estimatedChars: number;
  startTimestamp?: number;
  endTimestamp?: number;
};

export type SummaryEvidence = {
  facts: string[];
  decisions: string[];
  actionItems: string[];
  risks: string[];
  openQuestions: string[];
  notableDetails: string[];
  snippets: string[];
  speakerSignals: Array<{
    speaker: string;
    signal: string;
  }>;
};

export type SummaryJobState =
  | "idle"
  | "preflighting"
  | "extracting"
  | "merging"
  | "synthesizing"
  | "continuing"
  | "reconciling"
  | "completed"
  | "failed"
  | "cancelled";

export type SummaryJobStatus = {
  sessionId: string;
  state: SummaryJobState;
  message: string;
  updatedAt: number;
  mode?: SummaryGenerationMode;
  strategy?: SummaryExecutionStrategy;
  progressCurrent?: number;
  progressTotal?: number;
  detail?: string;
};

const MODE_CONFIGURATION: Record<
  SummaryGenerationMode,
  {
    lowRiskThreshold: number;
    mediumRiskThreshold: number;
    chunkTargetChars: number;
  }
> = {
  economy: {
    lowRiskThreshold: 7000,
    mediumRiskThreshold: 17000,
    chunkTargetChars: 6500,
  },
  balanced: {
    lowRiskThreshold: 5000,
    mediumRiskThreshold: 13000,
    chunkTargetChars: 5200,
  },
  thorough: {
    lowRiskThreshold: 3500,
    mediumRiskThreshold: 10000,
    chunkTargetChars: 4200,
  },
};

function normalizeSummaryTextItems(
  items: Array<{
    speaker?: string;
    text?: string;
    timestamp?: number;
    time?: string;
    source: MeetingEventSource;
  }>
): SummarySourceTimelineItem[] {
  return items
    .filter((item) => typeof item.text === "string" && item.text.trim())
    .map((item) => ({
      source: item.source,
      timestamp: typeof item.timestamp === "number" ? item.timestamp : Date.now(),
      speaker: item.speaker?.trim() || "Unknown",
      text: item.text?.trim() || "",
      time: item.time?.trim() || "",
    }))
    .sort((left, right) => left.timestamp - right.timestamp);
}

export function buildSummarySourceTimeline(
  session: MeetingSession
): SummarySourceTimelineItem[] {
  return normalizeSummaryTextItems([
    ...session.captions.map((caption) => ({
      source: "caption" as const,
      timestamp: caption.timestamp,
      speaker: caption.speaker,
      text: caption.text,
      time: caption.time,
    })),
    ...session.chatMessages.map((message) => ({
      source: "chat" as const,
      timestamp: message.timestamp,
      speaker: message.speaker,
      text: message.text,
      time: message.time,
    })),
  ]);
}

export function planMeetingSummaryExecution(
  session: MeetingSession,
  instructionPrompt: string,
  mode: SummaryGenerationMode
): SummaryExecutionPlan {
  const timeline = buildSummarySourceTimeline(session);
  const transcriptChars = session.captions.reduce(
    (sum, caption) => sum + (caption.text?.length || 0),
    0
  );
  const chatChars = session.chatMessages.reduce(
    (sum, message) => sum + (message.text?.length || 0),
    0
  );
  const instructionChars = instructionPrompt.trim().length;
  const turnCount = timeline.length;
  const weightedSize =
    transcriptChars + chatChars + Math.round(instructionChars * 1.35) + turnCount * 80;
  const config = MODE_CONFIGURATION[mode];

  let strategy: SummaryExecutionStrategy = "single_shot";
  let riskLevel: SummaryRiskLevel = "low";

  if (weightedSize >= config.mediumRiskThreshold) {
    strategy = "multi_stage";
    riskLevel = "high";
  } else if (weightedSize >= config.lowRiskThreshold) {
    strategy = "structured_single_shot";
    riskLevel = "medium";
  }

  return {
    mode,
    strategy,
    riskLevel,
    transcriptChars,
    chatChars,
    totalSourceChars: transcriptChars + chatChars,
    instructionChars,
    turnCount,
    evidenceChunkTargetChars: config.chunkTargetChars,
    shouldAllowContinuationFallback: true,
    shouldRunReconciliationPass: true,
  };
}

export function splitSummarySourceIntoChunks(
  items: SummarySourceTimelineItem[],
  targetChars: number
): SummarySourceChunk[] {
  const chunks: SummarySourceChunk[] = [];
  let currentItems: SummarySourceTimelineItem[] = [];
  let currentChars = 0;

  const flush = () => {
    if (currentItems.length === 0) {
      return;
    }

    chunks.push({
      chunkIndex: chunks.length,
      items: currentItems,
      estimatedChars: currentChars,
      startTimestamp: currentItems[0]?.timestamp,
      endTimestamp: currentItems[currentItems.length - 1]?.timestamp,
    });
    currentItems = [];
    currentChars = 0;
  };

  for (const item of items) {
    const itemSize = item.text.length + item.speaker.length + item.time.length + 32;
    const shouldSplit = currentItems.length > 0 && currentChars + itemSize > targetChars;

    if (shouldSplit) {
      flush();
    }

    currentItems.push(item);
    currentChars += itemSize;
  }

  flush();
  return chunks;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export function mergeSummaryEvidence(
  chunks: SummaryEvidence[]
): SummaryEvidence {
  const speakerSignalMap = new Map<string, Set<string>>();

  for (const chunk of chunks) {
    for (const signal of chunk.speakerSignals) {
      const speaker = signal.speaker.trim() || "Unknown";
      if (!speakerSignalMap.has(speaker)) {
        speakerSignalMap.set(speaker, new Set<string>());
      }

      const signalValue = signal.signal.trim();
      if (signalValue) {
        speakerSignalMap.get(speaker)?.add(signalValue);
      }
    }
  }

  return {
    facts: uniqueStrings(chunks.flatMap((chunk) => chunk.facts)),
    decisions: uniqueStrings(chunks.flatMap((chunk) => chunk.decisions)),
    actionItems: uniqueStrings(chunks.flatMap((chunk) => chunk.actionItems)),
    risks: uniqueStrings(chunks.flatMap((chunk) => chunk.risks)),
    openQuestions: uniqueStrings(chunks.flatMap((chunk) => chunk.openQuestions)),
    notableDetails: uniqueStrings(chunks.flatMap((chunk) => chunk.notableDetails)),
    snippets: uniqueStrings(chunks.flatMap((chunk) => chunk.snippets)),
    speakerSignals: [...speakerSignalMap.entries()].flatMap(([speaker, signals]) =>
      [...signals].map((signal) => ({
        speaker,
        signal,
      }))
    ),
  };
}
