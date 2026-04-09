import { describe, expect, test } from "vitest";
import type { MeetingProvider } from "../../entrypoints/content/providers/types";
import { platformRuntimeInternals } from "../../entrypoints/content/platform-runtime";

function createProviderStub(
  overrides: Partial<MeetingProvider>
): MeetingProvider {
  return {
    platform: "google-meet",
    matchesUrl: () => true,
    matchesPageContext: () => false,
    bootstrap: () => undefined,
    getMeetingPresence: () => "unknown",
    startCaptionObserver: () => () => undefined,
    getSessionMetadata: () => ({
      platform: "google-meet",
      providerLabel: "Google Meet",
      sourceUrl: "https://meet.google.com/abc-defg-hij",
      identifiers: {},
    }),
    getEmptyState: () => ({
      waitingTitle: "",
      waitingBody: "",
    }),
    getCaptureGuide: () => ({
      modalTitle: "",
      modalBody: "",
      steps: [],
    }),
    isCaptioningCurrentlyAvailable: () => false,
    ...overrides,
  };
}

describe("Google Meet runtime reset-page guard contract", () => {
  test("GM-RT-001: reset candidate is true when URL matches provider and page-context is false", () => {
    const provider = createProviderStub({
      platform: "google-meet",
      matchesUrl: () => true,
      matchesPageContext: () => false,
    });

    const candidate = platformRuntimeInternals.shouldResetRuntimeOnCurrentPage(
      provider,
      new URL("https://meet.google.com/abc-defg-hij")
    );

    expect(candidate).toBe(true);
  });

  test("GM-RT-001: reset candidate is false when page-context is true", () => {
    const provider = createProviderStub({
      platform: "google-meet",
      matchesUrl: () => true,
      matchesPageContext: () => true,
    });

    const candidate = platformRuntimeInternals.shouldResetRuntimeOnCurrentPage(
      provider,
      new URL("https://meet.google.com/abc-defg-hij")
    );

    expect(candidate).toBe(false);
  });
});
