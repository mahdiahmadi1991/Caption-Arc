import { DEFAULT_SUMMARY_PROFILES } from "./summary-profiles";
import { createDefaultDeviceLabel, createDeviceId } from "./device-identity";

export const DEFAULT_SESSION_CONTINUATION_WINDOW_MINUTES = 120;
export const MIN_SESSION_CONTINUATION_WINDOW_MINUTES = 0;
export const MAX_SESSION_CONTINUATION_WINDOW_MINUTES = 720;
export const SESSION_CONTINUATION_WINDOW_MINUTE_STOPS = [
  0, 5, 10, 15, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720,
] as const;

export const DEFAULT_CUSTOM_PROMPT =
  `Translate live captions into the target language so they stay clear, natural, and fast to read.

Rules:
- Preserve the speaker's meaning, intent, and perspective.
- Correct obvious speech-recognition mistakes only when the intended meaning is clear from the current line or nearby context.
- Keep names, product names, APIs, acronyms, and technical terms in their original form unless a standard translated form is clearly better.
- Prefer short, readable subtitle-style phrasing over long or literal wording.
- If a line is noisy, fragmented, or slightly ungrammatical, produce the most likely readable translation without inventing new meaning.
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
    summaryLanguage: "en",
    summaryProfiles: DEFAULT_SUMMARY_PROFILES.map((profile) => ({ ...profile })),
    defaultSummaryProfileId: DEFAULT_SUMMARY_PROFILES[0].id,
    appearance: "system" as const,
    overlayVisible: true,
    captureStartupBehavior: "ask" as const,
    captionActivationBehavior: "guided" as const,
    sessionContinuationWindowMinutes:
      DEFAULT_SESSION_CONTINUATION_WINDOW_MINUTES,
    overlayOpacity: 96,
    overlayClickThrough: false,
    storeMeetingChat: true,
    deviceId: createDeviceId(),
    deviceLabel: createDefaultDeviceLabel(),
    uiLanguage: "system" as const,
    connectedCloudProviders: [],
    overlayPositionsByPlatform: {},
    verificationSnapshot: null,
  };
}
