import { describe, expect, test } from "vitest";
import type {
  MeetingProfile,
  MeetingSession,
  SavedMeetingEvent,
} from "../../entrypoints/background/types";
import { assistantGenerationInternals } from "../../entrypoints/background/assistant";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

function createProfile(
  overrides: Partial<MeetingProfile["assistant"]> = {}
): MeetingProfile {
  const defaults = createDefaultSettings();
  const baseProfile = defaults.meetingProfiles.find((item) => item.id === "interview")!;

  return {
    ...baseProfile,
    assistant: {
      ...baseProfile.assistant,
      enabledByDefault: true,
      ...overrides,
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

function createSession(
  profile: MeetingProfile,
  overrides: Partial<MeetingSession> = {}
): MeetingSession {
  const firstQuestion = createEvent("evt-1", "Why do you want this job?");
  const secondQuestion = createEvent(
    "evt-2",
    "What is the biggest blocker in this timeline?"
  );

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
    events: [firstQuestion, secondQuestion],
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: {
      summaries: {},
      assistantOutputs: {},
    },
    ...overrides,
  };
}

function createResolvedTrigger(
  event: SavedMeetingEvent,
  triggerText: string
): {
  event: SavedMeetingEvent;
  triggerText: string;
  clauseKeys: string[];
} {
  return {
    event,
    triggerText,
    clauseKeys: [assistantGenerationInternals.buildAssistantClauseKey(triggerText)],
  };
}

describe("Assistant prompt contract", () => {
  test("APROMPT-001: buildAssistantMemorySnapshot keeps participants, active threads, and only the newest answered prompts", () => {
    const profile = createProfile();
    const session = createSession(profile, {
      events: [
        createEvent("evt-1", "Why do you want this job?", { speaker: "Interviewer" }),
        createEvent("evt-2", "We have a blocker on procurement approval.", {
          speaker: "Recruiter",
        }),
        createEvent("evt-3", "What would you improve first?", { speaker: "Panelist" }),
        createEvent("evt-4", "I would start with reliability ownership.", {
          speaker: "You",
          own: true,
        }),
      ],
      artifacts: {
        summaries: {},
        assistantOutputs: {
          a: {
            id: "a",
            triggerEventId: "a",
            triggerStableEventKey: "a",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "Old answered prompt 1",
            triggerTimestamp: 1,
            profileId: profile.id,
            content: "A1",
            createdAt: 1,
            provider: "openai",
            model: "gpt-5-mini",
          },
          b: {
            id: "b",
            triggerEventId: "b",
            triggerStableEventKey: "b",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "Old answered prompt 2",
            triggerTimestamp: 2,
            profileId: profile.id,
            content: "A2",
            createdAt: 2,
            provider: "openai",
            model: "gpt-5-mini",
          },
          c: {
            id: "c",
            triggerEventId: "c",
            triggerStableEventKey: "c",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "Recent answered prompt 3",
            triggerTimestamp: 3,
            profileId: profile.id,
            content: "A3",
            createdAt: 3,
            provider: "openai",
            model: "gpt-5-mini",
          },
          d: {
            id: "d",
            triggerEventId: "d",
            triggerStableEventKey: "d",
            source: "caption",
            speaker: "Interviewer",
            triggerText: "Latest answered prompt 4",
            triggerTimestamp: 4,
            profileId: profile.id,
            content: "A4",
            createdAt: 4,
            provider: "openai",
            model: "gpt-5-mini",
          },
        },
      },
    });

    const memory = assistantGenerationInternals.buildAssistantMemorySnapshot(session);

    expect(memory?.sourceEventCount).toBe(4);
    expect(memory?.content).toContain("Participants: Interviewer, Recruiter, Panelist, You");
    expect(memory?.content).toContain("Current threads:");
    expect(memory?.content).toContain("- Interviewer: Why do you want this job?");
    expect(memory?.content).toContain(
      "- Recruiter: We have a blocker on procurement approval."
    );
    expect(memory?.content).toContain(
      "- Panelist: What would you improve first?"
    );
    expect(memory?.content).toContain("Previously answered prompts:");
    expect(memory?.content).not.toContain("Old answered prompt 1");
    expect(memory?.content).toContain("Old answered prompt 2");
    expect(memory?.content).toContain("Recent answered prompt 3");
    expect(memory?.content).toContain("Latest answered prompt 4");
  });

  test("APROMPT-002: response intent instructions cover every live assistant intent", () => {
    const cases: Array<[MeetingProfile["assistant"]["responseIntent"], string]> = [
      ["answer_for_me", "Draft the most useful direct answer for the user to say next."],
      [
        "improve_my_answer",
        "Improve the user's likely answer so it becomes clearer, stronger, and easier to say aloud.",
      ],
      [
        "suggest_next_point",
        "Suggest the most useful next point the user should say or clarify.",
      ],
      [
        "summarize_what_was_just_said",
        "Summarize the immediate discussion into a short, practical recap for the user.",
      ],
      [
        "surface_risks",
        "Highlight the most relevant risk, blocker, or caveat the user should mention next.",
      ],
      [
        "coach_me",
        "Coach the user on how to answer or respond effectively in this moment.",
      ],
    ];

    for (const [responseIntent, expectedInstruction] of cases) {
      const profile = createProfile({ responseIntent });
      const session = createSession(profile);
      const prompt = assistantGenerationInternals.buildAssistantPrompt({
        session,
        profile,
        language: "en",
        trigger: createResolvedTrigger(session.events![0]!, "Why do you want this job?"),
      });

      expect(prompt).toContain(`Assistant intent: ${responseIntent}`);
      expect(prompt).toContain(expectedInstruction);
    }
  });

  test("APROMPT-003: format, depth, tone, delivery bias, and participant scope instructions cover every live assistant option", () => {
    const cases = [
      {
        overrides: {
          responseFormat: "bullets" as const,
          responseDepth: "ultra_brief" as const,
          responseTone: "neutral" as const,
          deliveryBias: "fastest" as const,
          participantScope: "others_only" as const,
        },
        expectedLines: [
          "Format the answer as compact bullets.",
          "Keep the answer extremely short.",
          "Use neutral professional phrasing.",
          "Prefer the fastest useful answer over completeness.",
          "Only respond to moments triggered by other participants, not the user's own speech.",
        ],
        expectedMaxTokens: 220,
      },
      {
        overrides: {
          responseFormat: "talking_points" as const,
          responseDepth: "brief" as const,
          responseTone: "direct" as const,
          deliveryBias: "balanced" as const,
          participantScope: "all_participants" as const,
        },
        expectedLines: [
          "Format the answer as short talking points optimized for speaking.",
          "Keep the answer short and high-signal.",
          "Use direct, low-friction phrasing.",
          "Balance speed and precision.",
          "You may respond to useful moments from any participant when the trigger policy allows it.",
        ],
        expectedMaxTokens: 360,
      },
      {
        overrides: {
          responseFormat: "short_paragraph" as const,
          responseDepth: "standard" as const,
          responseTone: "supportive" as const,
          deliveryBias: "careful" as const,
          participantScope: "all_participants" as const,
        },
        expectedLines: [
          "Format the answer as one short spoken-style paragraph.",
          "Keep the answer concise but complete enough to be useful immediately.",
          "Use supportive, steady phrasing.",
          "Prefer careful wording and precision over speed when needed.",
        ],
        expectedMaxTokens: 420,
      },
      {
        overrides: {
          responseFormat: "structured_sections" as const,
          responseDepth: "expanded" as const,
          responseTone: "confident" as const,
          deliveryBias: "balanced" as const,
          participantScope: "others_only" as const,
        },
        expectedLines: [
          "Format the answer in short labeled sections.",
          "Allow a more complete answer with supporting detail when useful.",
          "Use confident, assertive phrasing without overclaiming.",
        ],
        expectedMaxTokens: 560,
      },
      {
        overrides: {
          responseFormat: "script" as const,
          responseDepth: "brief" as const,
          responseTone: "analytical" as const,
          deliveryBias: "careful" as const,
          participantScope: "others_only" as const,
        },
        expectedLines: [
          "Format the answer as a direct script the user can say nearly verbatim.",
          "Use analytical, precise phrasing.",
        ],
        expectedMaxTokens: 360,
      },
    ];

    for (const { overrides, expectedLines, expectedMaxTokens } of cases) {
      const profile = createProfile(overrides);
      const session = createSession(profile);
      const prompt = assistantGenerationInternals.buildAssistantPrompt({
        session,
        profile,
        language: "en",
        trigger: createResolvedTrigger(session.events![0]!, "Why do you want this job?"),
      });

      expectedLines.forEach((line) => {
        expect(prompt).toContain(line);
      });
      expect(assistantGenerationInternals.getAssistantMaxTokens(profile)).toBe(
        expectedMaxTokens
      );
      expect(
        assistantGenerationInternals.getAssistantRetryMaxTokens(expectedMaxTokens)
      ).toBeGreaterThan(expectedMaxTokens);
    }
  });

  test("APROMPT-004: buildAssistantPrompt includes profile prompt, memory, context lines, and unresolved trigger text", () => {
    const profile = createProfile({
      prompt: "Stay concise and give one production-safe answer.",
      responseIntent: "surface_risks",
      responseFormat: "structured_sections",
    });
    const session = createSession(profile, {
      events: [
        createEvent("evt-1", "The rollout is at risk because security sign-off is still pending.", {
          speaker: "PM",
        }),
        createEvent("evt-2", "Please post the latest blocker in chat.", {
          source: "chat",
          speaker: "Moderator",
        }),
        createEvent("evt-3", "Can you summarize the delivery risk?", {
          speaker: "Client",
        }),
      ],
    });

    const prompt = assistantGenerationInternals.buildAssistantPrompt({
      session,
      profile,
      language: "en",
      memory: {
        updatedAt: Date.now(),
        sourceEventCount: 3,
        content:
          "Participants: PM, Client, Moderator\n\nCurrent threads:\n- PM: rollout risk\n\nPreviously answered prompts:\n- How is the rollout going?",
      },
      trigger: createResolvedTrigger(
        session.events![2]!,
        "Can you summarize the delivery risk?"
      ),
    });

    expect(prompt).toContain("Meeting profile: Interview");
    expect(prompt).toContain("Assistant instructions from the current profile:");
    expect(prompt).toContain("Stay concise and give one production-safe answer.");
    expect(prompt).toContain("Relevant meeting memory:");
    expect(prompt).toContain("Participants: PM, Client, Moderator");
    expect(prompt).toContain("Recent meeting context:");
    expect(prompt).toContain(
      "- [caption] PM: The rollout is at risk because security sign-off is still pending."
    );
    expect(prompt).toContain("- [caption] Client: Can you summarize the delivery risk?");
    expect(prompt).toContain("- [meeting chat] Moderator: Please post the latest blocker in chat.");
    expect(prompt).toContain("Current trigger item:");
    expect(prompt).toContain("Question(s) to answer now:\nCan you summarize the delivery risk?");
    expect(prompt).toContain(
      'Do not repeat an answer for a previously answered prompt unless the current question directly requires it.'
    );
  });
});
