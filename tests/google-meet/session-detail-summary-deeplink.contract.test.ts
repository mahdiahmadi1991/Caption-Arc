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
  const summary = {
    key: "default:fa:1712742000000",
    groupKey: "default:fa",
    profileId: "default",
    profileName: "Default",
    language: "fa",
    content: "# Summary\n\nReady.",
    generatedAt: now,
    provider: "openai",
    model: "gpt-5-mini",
    instructionSnapshot: "",
    sourceFingerprint: "fingerprint-1",
    captionCount: 2,
    requestSource: "manual" as const,
  };

  return {
    id: "session-1",
    sessionSyncId: "session-1",
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    title: "Team Sync",
    starred: false,
    identifiers: { meetingCode: "abc-defg-hij" },
    sessionFingerprint: "fingerprint-1",
    lifecycleState: "ended",
    startTime: now - 300000,
    endTime: now - 1000,
    lastSeenAt: now - 1000,
    updatedAt: now - 1000,
    searchableText: "team sync",
    captions: [
      {
        speaker: "Speaker",
        text: "First line",
        time: "10:00",
        timestamp: now - 200000,
        sessionOffsetMs: 0,
        isFinal: true,
        stableEventKey: "caption-1",
      },
    ],
    chatMessages: [],
    summaries: {
      [summary.key]: summary,
    },
    artifacts: { summaries: { [summary.key]: summary } },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Session detail summary deep-link behavior", () => {
  test("SDDL-001: notification deep-link expands and scrolls the summary section into view", async () => {
    const session = createSession();
    const settings = createDefaultSettings();
    const scrollIntoView = vi.fn();
    const requestAnimationFrameMock = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });

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
          requestedSummaryExpanded: true,
          requestedSummaryKey: "default:fa:1712742000000",
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

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(requestAnimationFrameMock).toHaveBeenCalled();

    await harness.cleanup();
  });

  test("SDDL-002: stale deep-link keys fall back to the latest summary from the requested group", async () => {
    const session = createSession();
    const settings = createDefaultSettings();
    const fallbackSummary = {
      ...session.summaries["default:fa:1712742000000"]!,
      content: "# Summary\n\nFallback summary.",
    };
    const unrelatedSummary = {
      ...fallbackSummary,
      key: "default:en:1712741000000",
      groupKey: "default:en",
      language: "en",
      content: "# Summary\n\nUnrelated summary.",
    };

    session.summaries = {
      [fallbackSummary.key]: fallbackSummary,
      [unrelatedSummary.key]: unrelatedSummary,
    };
    session.artifacts = { summaries: session.summaries };

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
          requestedSummaryExpanded: true,
          requestedSummaryKey: "default:fa:1999999999999",
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

    expect(harness.container.textContent).toContain("Fallback summary.");
    expect(harness.container.textContent).not.toContain("Unrelated summary.");

    await harness.cleanup();
  });
});
