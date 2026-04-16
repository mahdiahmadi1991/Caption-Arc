import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { SessionDetail } from "../../entrypoints/meeting-history/components/session-detail";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import { I18nProvider } from "../../entrypoints/shared/i18n";

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

async function mount(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let root: Root | null = createRoot(container);

  await act(async () => {
    root.render(element);
    await flushMicrotasks();
  });

  return {
    container,
    async cleanup() {
      await act(async () => {
        root?.unmount();
        await flushMicrotasks();
      });
      root = null;
      container.remove();
    },
  };
}

function createSession(): MeetingSession {
  const now = Date.now();
  return {
    id: "session-1",
    sessionSyncId: "session-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    title: "Client Interview",
    starred: false,
    identifiers: { meetingCode: "xxx-xxxx-xxx" },
    sessionFingerprint: "fingerprint-1",
    lifecycleState: "ended",
    startTime: now - 300000,
    endTime: now - 1000,
    lastSeenAt: now - 1000,
    updatedAt: now - 1000,
    searchableText: "client interview",
    captions: [
      {
        eventId: "evt-1",
        stableEventKey: "caption-1",
        speaker: "Interviewer",
        text: "How would you respond to a client concern?",
        time: "10:00",
        timestamp: now - 200000,
        sessionOffsetMs: 0,
        isFinal: true,
      },
    ],
    chatMessages: [],
    summaries: {},
    artifacts: {
      summaries: {},
      assistantOutputs: {
        "caption-1": {
          id: "assistant-1",
          triggerEventId: "evt-1",
          triggerStableEventKey: "caption-1",
          source: "caption",
          speaker: "Interviewer",
          triggerText: "How would you respond to a client concern?",
          triggerTimestamp: now - 200000,
          profileId: "client_call",
          content:
            "## Direct answer\n\n- Acknowledge the concern.\n- Clarify the impact.\n- Confirm the next step.",
          createdAt: now - 199000,
          provider: "openai",
          model: "gpt-5-mini",
          responseFormat: "structured_sections",
        },
      },
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Assistant meeting-history render contract", () => {
  test("AHIST-001: session detail renders stored assistant outputs with assistant chrome and markdown structure", async () => {
    const session = createSession();
    const settings = createDefaultSettings();

    const harness = await mount(
      React.createElement(
        I18nProvider,
        { locale: "en" },
        React.createElement(SessionDetail, {
          session,
          translationTargetLanguage: "en",
          meetingOutputDefaultLanguage: "en",
          meetingProfiles: settings.meetingProfiles,
          defaultMeetingProfileId: settings.defaultMeetingProfileId,
          openAiAvailability: {
            state: "ready",
            configured: true,
            operational: true,
            message: "Ready",
            snapshot: null,
          },
          translatingCaptionKey: null,
          translatingSessionId: null,
          summarizingSessionId: null,
          summaryJobStatus: null,
          requestedSummaryExpanded: false,
          requestedSummaryKey: null,
          onTranslateCaption: vi.fn(),
          onTranslateAllCaptions: vi.fn(),
          onGenerateSummary: vi.fn(),
          onCancelSummary: vi.fn(),
          onUpdateTitle: vi.fn(),
          onToggleStar: vi.fn(),
          onBack: vi.fn(),
          onRequestDelete: vi.fn(),
        })
      )
    );

    expect(harness.container.textContent).toContain("AI assistant");
    expect(harness.container.textContent).toContain("Triggered by this caption");
    expect(harness.container.textContent).toContain("Direct answer");
    expect(harness.container.textContent).toContain("Acknowledge the concern.");

    const heading = harness.container.querySelector("h2, h3");
    expect(heading?.textContent).toContain("Direct answer");

    await harness.cleanup();
  });
});
