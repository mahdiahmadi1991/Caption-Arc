import { beforeEach, describe, expect, test, vi } from "vitest";
import type { MeetingProvider } from "../../entrypoints/content/providers/types";

const {
  getProviderByPlatformMock,
  getProviderForUrlMock,
  getProviderForPageContextMock,
} = vi.hoisted(() => ({
  getProviderByPlatformMock: vi.fn(),
  getProviderForUrlMock: vi.fn(),
  getProviderForPageContextMock: vi.fn(),
}));

vi.mock("../../entrypoints/content/providers/registry", () => ({
  getProviderByPlatform: getProviderByPlatformMock,
  getProviderForUrl: getProviderForUrlMock,
  getProviderForPageContext: getProviderForPageContextMock,
  PLANNED_PROVIDERS: [],
}));

function setPath(path: string): void {
  window.history.replaceState({}, "", path);
}

function createTeamsProviderStub(): MeetingProvider {
  return {
    platform: "microsoft-teams",
    matchesUrl: () => true,
    matchesPageContext: () => false,
    bootstrap: () => undefined,
    getMeetingPresence: () => "unknown",
    startCaptionObserver: () => () => undefined,
    getSessionMetadata: () => ({
      platform: "microsoft-teams",
      providerLabel: "Microsoft Teams Web",
      sourceUrl: "https://teams.live.com/v2/",
      identifiers: {},
    }),
    getEmptyState: () => ({ waitingTitle: "", waitingBody: "" }),
    getCaptureGuide: () => ({ modalTitle: "", modalBody: "", steps: [] }),
    isCaptioningCurrentlyAvailable: () => false,
  };
}

async function loadPlatformRuntimeModule() {
  vi.resetModules();
  return await import("../../entrypoints/content/platform-runtime");
}

beforeEach(() => {
  setPath("/v2/");
  getProviderByPlatformMock.mockReset();
  getProviderForUrlMock.mockReset();
  getProviderForPageContextMock.mockReset();
});

describe("Provider routing contract: runtime order and fallback", () => {
  test("PROUTE-005: isSupportedMeetingPage prefers URL routing before page-context fallback", async () => {
    getProviderForUrlMock.mockReturnValue(createTeamsProviderStub());
    getProviderForPageContextMock.mockReturnValue(null);

    const { isSupportedMeetingPage } = await loadPlatformRuntimeModule();
    expect(isSupportedMeetingPage()).toBe(true);
    expect(getProviderForPageContextMock).not.toHaveBeenCalled();
  });

  test("PROUTE-005: initializePlatformRuntime resolves explicit platform before URL/page-context", async () => {
    getProviderByPlatformMock.mockReturnValue(createTeamsProviderStub());
    getProviderForUrlMock.mockReturnValue(createTeamsProviderStub());
    getProviderForPageContextMock.mockReturnValue(createTeamsProviderStub());

    const { initializePlatformRuntime } = await loadPlatformRuntimeModule();
    await expect(initializePlatformRuntime("microsoft-teams")).resolves.toBeNull();

    expect(getProviderByPlatformMock).toHaveBeenCalledTimes(1);
    expect(getProviderForUrlMock).not.toHaveBeenCalled();
    expect(getProviderForPageContextMock).not.toHaveBeenCalled();
  });

  test("PROUTE-005: initializePlatformRuntime resolves URL match before page-context fallback", async () => {
    getProviderByPlatformMock.mockReturnValue(null);
    getProviderForUrlMock.mockReturnValue(createTeamsProviderStub());
    getProviderForPageContextMock.mockReturnValue(createTeamsProviderStub());

    const { initializePlatformRuntime } = await loadPlatformRuntimeModule();
    await expect(initializePlatformRuntime()).resolves.toBeNull();

    expect(getProviderForUrlMock).toHaveBeenCalledTimes(1);
    expect(getProviderForPageContextMock).not.toHaveBeenCalled();
  });
});
