import { DEFAULT_MEETING_PROFILES } from "./meeting-profiles";
import { createDefaultDeviceLabel, createDeviceId } from "./device-identity";
import { DEFAULT_MEETING_ARCHIVE_RETENTION_DAYS } from "./meeting-archive-retention";

export const DEFAULT_SESSION_CONTINUATION_WINDOW_MINUTES = 120;
export const MIN_SESSION_CONTINUATION_WINDOW_MINUTES = 0;
export const MAX_SESSION_CONTINUATION_WINDOW_MINUTES = 720;
export const SESSION_CONTINUATION_WINDOW_MINUTE_STOPS = [
  0, 5, 10, 15, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720,
] as const;

export const DEFAULT_CUSTOM_PROMPT =
  `Translate browser-captured live meeting captions into the target language so they stay clear, natural, and fast to read.

Rules:
- Preserve the speaker's meaning, intent, and perspective.
- Treat provider captions as imperfect ASR: they may contain homophone mistakes, dropped words, broken sentence boundaries, partial rewrites, or punctuation noise.
- Correct obvious captioning mistakes only when the intended meaning is reasonably clear from the current line or nearby context. If it is not clear, stay conservative and do not invent meaning.
- Preserve pronouns and who-is-speaking-to-whom. Never flip I/you/we/they unless the source and nearby context clearly require it.
- Keep names, product names, APIs, acronyms, codes, numbers, and technical terms in their original form unless a standard translated form is clearly better.
- Prefer short, readable subtitle-style phrasing over long or literal wording.
- If a line is noisy, fragmented, or slightly ungrammatical, produce the most likely readable translation without adding facts, explanations, or guesses.
- Do not add explanations, labels, or extra commentary.`;

export function normalizeSessionContinuationWindowMinutes(
  value: number | undefined
): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_SESSION_CONTINUATION_WINDOW_MINUTES;
  }

  return Math.min(
    MAX_SESSION_CONTINUATION_WINDOW_MINUTES,
    Math.max(
      MIN_SESSION_CONTINUATION_WINDOW_MINUTES,
      Math.round(numericValue)
    )
  );
}

export function createDefaultSettings() {
  return {
    openaiApiKey: "",
    model: "gpt-5-mini",
    targetLanguage: "en",
    translationEnabled: false,
    customPrompt: DEFAULT_CUSTOM_PROMPT,
    meetingOutputLanguage: "en",
    meetingArchiveRetentionDays: DEFAULT_MEETING_ARCHIVE_RETENTION_DAYS,
    meetingProfiles: DEFAULT_MEETING_PROFILES.map((profile) => ({ ...profile })),
    defaultMeetingProfileId: DEFAULT_MEETING_PROFILES[0].id,
    appearance: "system" as const,
    overlayVisible: true,
    captureStartupBehavior: "ask" as const,
    captionActivationBehavior: "guided" as const,
    sessionContinuationWindowMinutes:
      DEFAULT_SESSION_CONTINUATION_WINDOW_MINUTES,
    overlayOpacity: 80,
    overlayClickThrough: false,
    storeMeetingChat: false,
    legalRiskAcknowledgements: {},
    deviceId: createDeviceId(),
    deviceLabel: createDefaultDeviceLabel(),
    uiLanguage: "system" as const,
    connectedCloudProviders: [],
    overlayPositionsByPlatform: {},
    verificationSnapshot: null,
    termsAcceptance: null,
    termsDecline: null,
  };
}
