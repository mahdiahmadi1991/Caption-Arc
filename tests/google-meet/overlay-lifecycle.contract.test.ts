import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const {
  makeDraggableMock,
  makeResizableMock,
  initTooltipSystemMock,
  destroyTooltipSystemMock,
  createAssistantSurfaceMock,
  destroyAssistantSurfaceMock,
  startOverlayFooterTickerMock,
  stopOverlayFooterTickerMock,
  resetCaptureConsentPromptMock,
  subscribeUiRuntimeLocaleMock,
  observeSystemThemePreferenceMock,
} = vi.hoisted(() => ({
  makeDraggableMock: vi.fn(),
  makeResizableMock: vi.fn(),
  initTooltipSystemMock: vi.fn(() => vi.fn()),
  destroyTooltipSystemMock: vi.fn(),
  createAssistantSurfaceMock: vi.fn(),
  destroyAssistantSurfaceMock: vi.fn(),
  startOverlayFooterTickerMock: vi.fn(),
  stopOverlayFooterTickerMock: vi.fn(),
  resetCaptureConsentPromptMock: vi.fn(),
  subscribeUiRuntimeLocaleMock: vi.fn(() => vi.fn()),
  observeSystemThemePreferenceMock: vi.fn(() => vi.fn()),
}));

vi.mock("../../entrypoints/content/overlay/interactions", () => ({
  makeDraggable: makeDraggableMock,
  makeResizable: makeResizableMock,
}));

vi.mock("../../entrypoints/content/overlay/capture-guide", () => ({
  createCaptureGuide: vi.fn(() => {
    const el = document.createElement("div");
    el.id = "capture-guide";
    return el;
  }),
  syncCaptureGuide: vi.fn(),
}));

vi.mock("../../entrypoints/content/overlay/footer", () => ({
  createOverlayFooter: vi.fn(() => document.createElement("div")),
  startOverlayFooterTicker: startOverlayFooterTickerMock,
  stopOverlayFooterTicker: stopOverlayFooterTickerMock,
  syncOverlayFooter: vi.fn(),
}));

vi.mock("../../entrypoints/content/overlay/header", () => ({
  applyCompactOverlayState: vi.fn((overlayEl: HTMLElement) => {
    overlayEl.dataset.compactApplied = "true";
  }),
  createHeader: vi.fn(() => ({
    header: document.createElement("div"),
    translationDock: document.createElement("div"),
  })),
  syncBrandMarkTheme: vi.fn(),
  syncCompactStatus: vi.fn(),
  syncHeaderCopy: vi.fn(),
  syncSessionProfileRailSize: vi.fn(),
  syncTranslationDock: vi.fn(),
}));

vi.mock("../../entrypoints/content/overlay/scroll-button", () => ({
  createScrollButton: vi.fn(() => document.createElement("button")),
}));

vi.mock("../../entrypoints/content/overlay/capture-consent", () => ({
  resetCaptureConsentPrompt: resetCaptureConsentPromptMock,
}));

vi.mock("../../entrypoints/content/overlay/tooltip", () => ({
  initTooltipSystem: initTooltipSystemMock,
  destroyTooltipSystem: destroyTooltipSystemMock,
  syncTooltipTheme: vi.fn(),
}));

vi.mock("../../entrypoints/content/overlay/assistant-surface", () => ({
  createAssistantSurface: createAssistantSurfaceMock,
  destroyAssistantSurface: destroyAssistantSurfaceMock,
  syncAssistantSurface: vi.fn(),
}));

vi.mock("../../entrypoints/content/render", () => ({
  renderCaptions: vi.fn(),
}));

vi.mock("../../entrypoints/shared/theme", () => ({
  applyThemePreference: vi.fn(),
  getSystemPrefersDark: vi.fn(() => false),
  observeSystemThemePreference: observeSystemThemePreferenceMock,
}));

vi.mock("../../entrypoints/shared/i18n", () => ({
  applyLocaleAttributes: vi.fn(),
  getUiRuntimeLocale: vi.fn(() => "en"),
  subscribeUiRuntimeLocale: subscribeUiRuntimeLocaleMock,
}));

import {
  activeMeetingPlatform,
  overlay,
  savedPosition,
  setActiveMeetingPlatform,
  setOverlay,
  updateSettings,
} from "../../entrypoints/content/state";
import {
  createOverlay,
  destroyOverlay,
  overlayInternals,
} from "../../entrypoints/content/overlay";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {
        return undefined;
      }
      disconnect() {
        return undefined;
      }
    }
  );
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  document.body.innerHTML = "";
  setOverlay(null);
  setActiveMeetingPlatform("google-meet");
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
  updateSettings({
    overlayPositionsByPlatform: {
      "google-meet": {
        left: 9_000,
        top: -900,
        width: 2_000,
        height: 2_000,
        view: "expanded",
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  destroyOverlay();
  setOverlay(null);
});

describe("Overlay lifecycle contract", () => {
  test("OVLAY-008: stored frames are clamped before restore and compact-start prime", () => {
    const overlayEl = document.createElement("div");
    overlayInternals.applyStoredOverlayFrame(overlayEl);

    expect(parseInt(overlayEl.style.left, 10)).toBeGreaterThanOrEqual(16);
    expect(parseInt(overlayEl.style.top, 10)).toBeGreaterThanOrEqual(16);
    expect(parseInt(overlayEl.style.width, 10)).toBeLessThanOrEqual(776);
    expect(parseInt(overlayEl.style.height, 10)).toBeLessThanOrEqual(576);

    overlayInternals.primeCompactOverlayFrame(overlayEl);
    expect(savedPosition).not.toBeNull();
    expect(savedPosition?.width).toMatch(/px$/);
    expect(savedPosition?.height).toMatch(/px$/);
    expect(overlayEl.dataset.compactApplied).toBe("true");
  });

  test("OVLAY-009: createOverlay stays single-instance while wiring interaction subsystems", () => {
    createOverlay();
    createOverlay();

    expect(document.querySelectorAll("#captionarc-overlay")).toHaveLength(1);
    expect(makeDraggableMock).toHaveBeenCalledTimes(1);
    expect(makeResizableMock).toHaveBeenCalledTimes(3);
    expect(initTooltipSystemMock).toHaveBeenCalledTimes(1);
    expect(createAssistantSurfaceMock).toHaveBeenCalledTimes(1);
    expect(startOverlayFooterTickerMock).toHaveBeenCalledTimes(1);
    expect(activeMeetingPlatform).toBe("google-meet");
  });

  test("OVLAY-010: destroyOverlay removes DOM and clears overlay-owned systems", () => {
    createOverlay();
    expect(overlay).not.toBeNull();

    destroyOverlay();

    expect(document.querySelector("#captionarc-overlay")).toBeNull();
    expect(resetCaptureConsentPromptMock).toHaveBeenCalledTimes(1);
    expect(stopOverlayFooterTickerMock).toHaveBeenCalledTimes(1);
    expect(destroyTooltipSystemMock).toHaveBeenCalledTimes(1);
    expect(destroyAssistantSurfaceMock).toHaveBeenCalledTimes(1);
    expect(overlay).toBeNull();
  });
});
