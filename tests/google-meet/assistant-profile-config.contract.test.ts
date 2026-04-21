import { describe, expect, test } from "vitest";
import {
  createDefaultAssistantConfig,
  getDefaultMeetingProfilePrompt,
  isAutomaticSummaryEnabledForProfile,
  isProtectedMeetingProfile,
  normalizeMeetingProfiles,
  PROTECTED_MEETING_PROFILE,
  PROTECTED_MEETING_PROFILE_ID,
  resolveMeetingProfile,
  resolveMeetingProfilePrompt,
} from "../../entrypoints/shared/meeting-profiles";

describe("Assistant profile config contract", () => {
  test("APROF-001: starter assistant defaults stay stable for the built-in meeting types", () => {
    expect(createDefaultAssistantConfig("interview")).toMatchObject({
      enabledByDefault: true,
      responseIntent: "answer_for_me",
      responseFormat: "talking_points",
      responseDepth: "brief",
      responseTone: "confident",
      deliveryBias: "fastest",
      triggerPolicy: "questions_requests_only",
      participantScope: "others_only",
    });

    expect(createDefaultAssistantConfig("client_call")).toMatchObject({
      enabledByDefault: false,
      responseIntent: "suggest_next_point",
      responseFormat: "talking_points",
      responseDepth: "brief",
      responseTone: "direct",
      deliveryBias: "balanced",
      triggerPolicy: "salience_first",
      participantScope: "all_participants",
    });

    expect(createDefaultAssistantConfig("daily_sync")).toMatchObject({
      enabledByDefault: false,
      responseIntent: "suggest_next_point",
      responseFormat: "bullets",
      responseDepth: "ultra_brief",
      responseTone: "direct",
      deliveryBias: "fastest",
      triggerPolicy: "salience_first",
      participantScope: "all_participants",
    });

    expect(createDefaultAssistantConfig()).toMatchObject({
      enabledByDefault: false,
      responseIntent: "answer_for_me",
      responseFormat: "talking_points",
      responseDepth: "brief",
      responseTone: "neutral",
      deliveryBias: "balanced",
      triggerPolicy: "questions_requests_only",
      participantScope: "all_participants",
    });
  });

  test("APROF-002: normalizeMeetingProfiles injects the protected profile and falls back invalid assistant values", () => {
    const normalized = normalizeMeetingProfiles([
      {
        id: "custom-profile",
        name: "   ",
        description: "   ",
        prompt: "   ",
        summaryGenerationMode: "invalid",
        autoSummarizeOnMeetingEnd: undefined,
        assistant: {
          enabledByDefault: "yes",
          prompt: "   ",
          responseIntent: "bad-intent",
          responseFormat: "bad-format",
          responseDepth: "bad-depth",
          responseTone: "bad-tone",
          deliveryBias: "bad-bias",
          triggerPolicy: "bad-trigger",
          participantScope: "bad-scope",
        },
      } as never,
    ]);

    expect(normalized[0]?.id).toBe(PROTECTED_MEETING_PROFILE_ID);
    expect(normalized[0]).toMatchObject(PROTECTED_MEETING_PROFILE);

    const customProfile = normalized.find((profile) => profile.id === "custom-profile");
    expect(customProfile).toBeTruthy();
    expect(customProfile).toMatchObject({
      id: "custom-profile",
      name: "Untitled profile",
      description: "Custom meeting profile",
      prompt: getDefaultMeetingProfilePrompt("custom-profile"),
      summaryGenerationMode: "balanced",
      autoSummarizeOnMeetingEnd: false,
      assistant: createDefaultAssistantConfig("custom-profile"),
    });
  });

  test("APROF-003: starter profile assistant normalization keeps starter fallbacks while honoring valid overrides", () => {
    const normalized = normalizeMeetingProfiles([
      {
        id: "interview",
        name: "Interview Plus",
        description: "Custom interview framing",
        prompt: "Use a stricter interview summary.",
        summaryGenerationMode: "thorough",
        autoSummarizeOnMeetingEnd: true,
        assistant: {
          prompt: "   ",
          responseFormat: "script",
          responseTone: "analytical",
          participantScope: "all_participants",
        },
      } as never,
    ]);

    const interviewProfile = normalized.find((profile) => profile.id === "interview");
    expect(interviewProfile).toBeTruthy();
    expect(interviewProfile).toMatchObject({
      id: "interview",
      name: "Interview Plus",
      description: "Custom interview framing",
      prompt: "Use a stricter interview summary.",
      summaryGenerationMode: "thorough",
      autoSummarizeOnMeetingEnd: true,
    });
    expect(interviewProfile?.assistant).toMatchObject({
      enabledByDefault: true,
      prompt: createDefaultAssistantConfig("interview").prompt,
      responseIntent: "answer_for_me",
      responseFormat: "script",
      responseDepth: "brief",
      responseTone: "analytical",
      deliveryBias: "fastest",
      triggerPolicy: "questions_requests_only",
      participantScope: "all_participants",
    });
  });

  test("APROF-004: resolve helpers choose requested, fallback, and protected defaults deterministically", () => {
    const profiles = normalizeMeetingProfiles([
      {
        id: "daily_sync",
        name: "Daily Sync",
        description: "Daily",
        prompt: "Daily prompt",
        summaryGenerationMode: "balanced",
        autoSummarizeOnMeetingEnd: false,
        assistant: createDefaultAssistantConfig("daily_sync"),
      } as never,
      {
        id: "custom-profile",
        name: "Custom",
        description: "Custom",
        prompt: "Custom prompt",
        summaryGenerationMode: "economy",
        autoSummarizeOnMeetingEnd: true,
        assistant: createDefaultAssistantConfig("custom-profile"),
      } as never,
    ]);

    expect(resolveMeetingProfile(profiles, "custom-profile").id).toBe("custom-profile");
    expect(resolveMeetingProfile(profiles, "missing", "daily_sync").id).toBe("daily_sync");
    expect(resolveMeetingProfile([], "missing").id).toBe(PROTECTED_MEETING_PROFILE_ID);

    expect(resolveMeetingProfilePrompt({ id: "daily_sync", prompt: "  Focused prompt  " })).toBe(
      "Focused prompt"
    );
    expect(resolveMeetingProfilePrompt({ id: "daily_sync", prompt: "   " })).toBe(
      getDefaultMeetingProfilePrompt("daily_sync")
    );
    expect(resolveMeetingProfilePrompt(null)).toBe(
      getDefaultMeetingProfilePrompt(undefined)
    );

    expect(isProtectedMeetingProfile(PROTECTED_MEETING_PROFILE_ID)).toBe(true);
    expect(isProtectedMeetingProfile("daily_sync")).toBe(false);

    expect(isAutomaticSummaryEnabledForProfile({ autoSummarizeOnMeetingEnd: true })).toBe(
      true
    );
    expect(isAutomaticSummaryEnabledForProfile({ autoSummarizeOnMeetingEnd: false })).toBe(
      false
    );
    expect(isAutomaticSummaryEnabledForProfile(null)).toBe(false);
  });
});
