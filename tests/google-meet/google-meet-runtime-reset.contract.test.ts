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
      sourceUrl: "https://meet.google.com/xxx-xxxx-xxx",
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

describe("Provider runtime reset-page guard contract", () => {
  test("GM-RT-001: reset candidate is true when URL matches provider and page-context is false", () => {
    const provider = createProviderStub({
      platform: "google-meet",
      matchesUrl: () => true,
      matchesPageContext: () => false,
    });

    const candidate = platformRuntimeInternals.shouldResetRuntimeOnCurrentPage(
      provider,
      new URL("https://meet.google.com/xxx-xxxx-xxx")
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
      new URL("https://meet.google.com/xxx-xxxx-xxx")
    );

    expect(candidate).toBe(false);
  });

  test("ZOOM-RT-001: reset candidate is true on zoom wc/home shell route", () => {
    const provider = createProviderStub({
      platform: "zoom-web",
      matchesUrl: () => false,
      matchesPageContext: () => false,
      getSessionMetadata: () => ({
        platform: "zoom-web",
        providerLabel: "Zoom Web App",
        sourceUrl: "https://us05web.zoom.us/wc/home",
        identifiers: {},
      }),
    });

    const candidate = platformRuntimeInternals.shouldResetRuntimeOnCurrentPage(
      provider,
      new URL("https://app.zoom.us/wc/home")
    );

    expect(candidate).toBe(true);
  });

  test("ZOOM-RT-001: reset candidate is false on non-home zoom route", () => {
    const provider = createProviderStub({
      platform: "zoom-web",
      matchesUrl: () => true,
      matchesPageContext: () => true,
      getSessionMetadata: () => ({
        platform: "zoom-web",
        providerLabel: "Zoom Web App",
        sourceUrl: "https://us05web.zoom.us/j/123456789",
        identifiers: { meetingId: "123456789" },
      }),
    });

    const candidate = platformRuntimeInternals.shouldResetRuntimeOnCurrentPage(
      provider,
      new URL("https://us05web.zoom.us/j/123456789")
    );

    expect(candidate).toBe(false);
  });
});
