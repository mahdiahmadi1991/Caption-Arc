import { describe, expect, test } from "vitest";
import { assertAssistantScenarioExpectations } from "../../scripts/manual-smoke/lib/assistant-dls-observer.mjs";

describe("Assistant DLS observer contract", () => {
  test("ADLS-OBS-001: latest trigger include/exclude assertions protect the q1 -> q1 + q2 regression shape", () => {
    const summary = assertAssistantScenarioExpectations(
      {
        outputs: [
          {
            triggerText: "Why do you want this job?",
            profileId: "interview",
            responseIntent: "answer_for_me",
            content: "I want this role because it matches my backend experience.",
          },
          {
            triggerText: "Why you should be hire you?",
            profileId: "interview",
            responseIntent: "answer_for_me",
            content: "I bring strong backend delivery ownership and reliability focus.",
          },
        ],
        liveState: { status: "done" },
        overlay: { cardCount: 2 },
        diagnostics: { events: [{ message: "assistant_pass_completed" }] },
      },
      {
        outputCount: 2,
        overlayCardCount: 2,
        liveState: "done",
        latestOutputTriggerIncludes: "hire",
        latestOutputTriggerExcludes: "Why do you want this job",
        latestOutputProfileId: "interview",
        latestOutputResponseIntent: "answer_for_me",
        diagnosticsMessages: ["assistant_pass_completed"],
      }
    );

    expect(summary.outputCount).toBe(2);
    expect(summary.liveState).toBe("done");
  });

  test("ADLS-OBS-002: Persian output assertions require visible Persian script in the final response", () => {
    expect(() =>
      assertAssistantScenarioExpectations(
        {
          outputs: [
            {
              triggerText: "Why are you leaving your current job?",
              profileId: "interview",
              responseIntent: "answer_for_me",
              content: "این نقش با مسیر حرفه‌ای من هم‌راستا است.",
            },
          ],
          liveState: { status: "done" },
          overlay: { cardCount: 1 },
          diagnostics: { events: [] },
        },
        {
          outputCount: 1,
          latestOutputLanguage: "fa",
        }
      )
    ).not.toThrow();

    expect(() =>
      assertAssistantScenarioExpectations(
        {
          outputs: [
            {
              triggerText: "Why are you leaving your current job?",
              profileId: "interview",
              responseIntent: "answer_for_me",
              content: "I am looking for stronger backend ownership.",
            },
          ],
          liveState: { status: "done" },
          overlay: { cardCount: 1 },
          diagnostics: { events: [] },
        },
        {
          outputCount: 1,
          latestOutputLanguage: "fa",
        }
      )
    ).toThrow(/Persian script/i);
  });

  test("ADLS-OBS-003: no-output scenarios stay valid only when no assistant outputs were persisted", () => {
    expect(() =>
      assertAssistantScenarioExpectations(
        {
          outputs: [],
          liveState: { status: "watching" },
          overlay: { cardCount: 0 },
          diagnostics: { events: [] },
        },
        {
          outputCount: 0,
          overlayCardCount: 0,
          liveState: "watching",
          requireNoOutputs: true,
        }
      )
    ).not.toThrow();

    expect(() =>
      assertAssistantScenarioExpectations(
        {
          outputs: [{ triggerText: "hello", content: "oops" }],
          liveState: { status: "done" },
          overlay: { cardCount: 1 },
          diagnostics: { events: [] },
        },
        {
          requireNoOutputs: true,
        }
      )
    ).toThrow(/Expected no assistant outputs/i);
  });

  test("ADLS-OBS-004: metadata and render-shape assertions validate format-sensitive DLS cases", () => {
    expect(() =>
      assertAssistantScenarioExpectations(
        {
          outputs: [
            {
              triggerText: "Could you summarize the migration plan?",
              profileId: "client_call",
              responseIntent: "summarize_what_was_just_said",
              responseFormat: "structured_sections",
              responseDepth: "expanded",
              responseTone: "analytical",
              deliveryBias: "careful",
              content: "Summary marker: Migration status and risks.",
            },
          ],
          liveState: { status: "done" },
          overlay: {
            cardCount: 1,
            cards: [
              {
                body: "Summary marker: Migration status and risks.",
                listItemCount: 2,
                paragraphCount: 1,
                headingCount: 2,
              },
            ],
          },
          diagnostics: { events: [] },
        },
        {
          outputCount: 1,
          latestOutputResponseIntent: "summarize_what_was_just_said",
          latestOutputResponseFormat: "structured_sections",
          latestOutputResponseDepth: "expanded",
          latestOutputResponseTone: "analytical",
          latestOutputDeliveryBias: "careful",
          latestOutputContentIncludes: "Summary marker",
          latestOverlayMinListItemCount: 2,
          latestOverlayMinParagraphCount: 1,
          latestOverlayMinHeadingCount: 2,
        }
      )
    ).not.toThrow();
  });
});
