import { describe, expect, test } from "vitest";
import type {
  MeetingProfile,
  MeetingSession,
  SavedMeetingEvent,
} from "../../entrypoints/background/types";
import { assistantGenerationInternals } from "../../entrypoints/background/assistant";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

function createProfile(): MeetingProfile {
  const defaults = createDefaultSettings();
  const baseProfile = defaults.meetingProfiles.find((item) => item.id === "interview")!;

  return {
    ...baseProfile,
    assistant: {
      ...baseProfile.assistant,
      enabledByDefault: true,
    },
  };
}

function createEvent(
  eventId: string,
  text: string,
  overrides: Partial<SavedMeetingEvent> = {}
): SavedMeetingEvent {
  return {
    eventId,
    stableEventKey: `stable-${eventId}`,
    source: "caption",
    speaker: "Interviewer",
    text,
    time: "10:00",
    timestamp: Date.now(),
    sessionOffsetMs: 1_000,
    isFinal: true,
    ...overrides,
  };
}

function createSession(profile: MeetingProfile): MeetingSession {
  return {
    id: "session-1",
    sessionSyncId: "session-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Interview",
    starred: false,
    identifiers: { meetingCode: "xxx-xxxx-xxx" },
    lifecycleState: "live",
    meetingProfileId: profile.id,
    startTime: Date.now() - 60_000,
    lastSeenAt: Date.now() - 1_000,
    updatedAt: Date.now() - 1_000,
    searchableText: "",
    events: [createEvent("evt-1", "Why do you want this role?")],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: {
      summaries: {},
      assistantOutputs: {},
    },
  };
}

function createPrompt(language: string): string {
  const profile = createProfile();
  const session = createSession(profile);
  return assistantGenerationInternals.buildAssistantPrompt({
    session,
    profile,
    language,
    trigger: {
      event: session.events![0]!,
      triggerText: "Why do you want this role?",
      clauseKeys: [assistantGenerationInternals.buildAssistantClauseKey("Why do you want this role?")],
    },
  });
}

describe("Assistant language contract", () => {
  test("ALANG-001: buildAssistantPrompt maps supported output languages to the right language name and final-language rules", () => {
    const cases: Array<[string, string]> = [
      ["en", "English"],
      ["fa", "Persian"],
      ["ar", "Arabic"],
    ];

    for (const [languageCode, languageName] of cases) {
      const prompt = createPrompt(languageCode);
      expect(prompt).toContain(`Output language code: ${languageCode}`);
      expect(prompt).toContain(`Output language name: ${languageName}`);
      expect(prompt).toContain(`Write the entire response in ${languageName}.`);
      expect(prompt).toContain(
        `If the profile instructions or recent context contain English section labels or example wording, keep the structure but still translate the final response into ${languageName}.`
      );
      expect(prompt).toContain(
        `Before returning, verify that the final response is fully written in ${languageName}.`
      );
    }
  });

  test("ALANG-002: normalizeAssistantContent removes whitespace noise while preserving non-English content", () => {
    const normalized = assistantGenerationInternals.normalizeAssistantContent(
      "  \u00a0## پاسخ  \r\n\r\n- نکته اول   \r\n\r\n\r\n- نکته دوم  "
    );

    expect(normalized).toBe("## پاسخ\n\n- نکته اول\n\n- نکته دوم");
    expect(normalized).toContain("پاسخ");
    expect(normalized).toContain("نکته اول");
    expect(normalized).toContain("نکته دوم");
  });
});
