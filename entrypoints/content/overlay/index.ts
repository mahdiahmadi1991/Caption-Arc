import "../styles/index.css";
import {
  activeMeetingPlatform,
  settings,
  overlay,
  setOverlay,
  setCaptionList,
  setCaptureGuideElement,
  setSavedPosition,
  setWaveElement,
  setMinimized,
} from "../state";
import { createElement } from "../libs";
import { renderCaptions } from "../render";
import { makeDraggable, makeResizable } from "./interactions";
import { createCaptureGuide, syncCaptureGuide } from "./capture-guide";
import {
  createOverlayFooter,
  startOverlayFooterTicker,
  stopOverlayFooterTicker,
  syncOverlayFooter,
} from "./footer";
import {
  applyCompactOverlayState,
  createHeader,
  syncBrandMarkTheme,
  syncCompactStatus,
  syncHeaderCopy,
  syncSessionProfileRailSize,
  syncTranslationDock,
} from "./header";
import { createScrollButton } from "./scroll-button";
import { resetCaptureConsentPrompt } from "./capture-consent";
import {
  destroyTooltipSystem,
  initTooltipSystem,
  syncTooltipTheme,
} from "./tooltip";
import {
  applyThemePreference,
  getSystemPrefersDark,
  observeSystemThemePreference,
} from "../../shared/theme";
import {
  applyLocaleAttributes,
  getUiRuntimeLocale,
  subscribeUiRuntimeLocale,
} from "../../shared/i18n";
import {
  hideOverlay,
  showOverlay,
  syncOverlayVisibilityPreference,
} from "./visibility";
import {
  createAssistantSurface,
  destroyAssistantSurface,
  syncAssistantSurface,
} from "./assistant-surface";

export { updateUIFromSettings } from "./settings";
export { hideOverlay, showOverlay } from "./visibility";

let stopOverlayThemeObserver: (() => void) | null = null;
let stopOverlayLocaleObserver: (() => void) | null = null;
let stopTooltipSystem: (() => void) | null = null;
let dockLayoutObserver: ResizeObserver | null = null;
const VIEWPORT_MARGIN = 16;
const DEFAULT_OVERLAY_WIDTH = 520;
const DEFAULT_OVERLAY_HEIGHT = 500;
const MIN_EXPANDED_OVERLAY_WIDTH = 520;
const MIN_EXPANDED_OVERLAY_HEIGHT = 380;
const COMPACT_OVERLAY_WIDTH = 296;
const COMPACT_OVERLAY_HEIGHT = 68;

function getStoredOverlayPosition() {
  if (!activeMeetingPlatform) {
    return null;
  }

  return settings.overlayPositionsByPlatform?.[activeMeetingPlatform] || null;
}

function clampOverlayMountPosition(
  left: number,
  top: number,
  width: number,
  height: number
): { left: number; top: number } {
  const maxLeft = Math.max(
    VIEWPORT_MARGIN,
    window.innerWidth - width - VIEWPORT_MARGIN
  );
  const maxTop = Math.max(
    VIEWPORT_MARGIN,
    window.innerHeight - height - VIEWPORT_MARGIN
  );

  return {
    left: Math.min(Math.max(VIEWPORT_MARGIN, left), maxLeft),
    top: Math.min(Math.max(VIEWPORT_MARGIN, top), maxTop),
  };
}

function clampOverlayMountSize(width: number, height: number): {
  width: number;
  height: number;
} {
  const maxWidth = Math.max(320, window.innerWidth - 24);
  const maxHeight = Math.max(MIN_EXPANDED_OVERLAY_HEIGHT, window.innerHeight - 24);

  return {
    width: Math.min(Math.max(MIN_EXPANDED_OVERLAY_WIDTH, width), maxWidth),
    height: Math.min(Math.max(MIN_EXPANDED_OVERLAY_HEIGHT, height), maxHeight),
  };
}

function applyStoredOverlayFrame(overlayEl: HTMLElement): void {
  const storedPosition = getStoredOverlayPosition();

  if (!storedPosition) {
    return;
  }

  const clampedSize = clampOverlayMountSize(
    storedPosition.width ?? DEFAULT_OVERLAY_WIDTH,
    storedPosition.height ?? DEFAULT_OVERLAY_HEIGHT
  );
  const nextPosition = clampOverlayMountPosition(
    storedPosition.left,
    storedPosition.top,
    clampedSize.width,
    clampedSize.height
  );

  overlayEl.style.width = `${clampedSize.width}px`;
  overlayEl.style.height = `${clampedSize.height}px`;
  overlayEl.style.left = `${nextPosition.left}px`;
  overlayEl.style.top = `${nextPosition.top}px`;
  overlayEl.style.right = "auto";
  overlayEl.style.bottom = "auto";
}

function primeCompactOverlayFrame(overlayEl: HTMLElement): void {
  const storedPosition = getStoredOverlayPosition();

  if (!storedPosition) {
    return;
  }

  const clampedSize = clampOverlayMountSize(
    storedPosition.width ?? DEFAULT_OVERLAY_WIDTH,
    storedPosition.height ?? DEFAULT_OVERLAY_HEIGHT
  );
  const nextPosition = clampOverlayMountPosition(
    storedPosition.left,
    storedPosition.top,
    COMPACT_OVERLAY_WIDTH,
    COMPACT_OVERLAY_HEIGHT
  );

  setSavedPosition({
    left: `${nextPosition.left}px`,
    top: `${nextPosition.top}px`,
    width: `${clampedSize.width}px`,
    height: `${clampedSize.height}px`,
  });
  applyCompactOverlayState(overlayEl);
  overlayEl.style.left = `${nextPosition.left}px`;
  overlayEl.style.top = `${nextPosition.top}px`;
}

function syncOverlayDockLayout(
  overlayEl: HTMLElement,
  headerEl: HTMLElement,
  dockEl: HTMLElement
): void {
  overlayEl.style.setProperty("--mc-header-height", `${headerEl.offsetHeight}px`);
  overlayEl.style.setProperty("--mc-dock-height", `${dockEl.offsetHeight}px`);
  syncSessionProfileRailSize();
}

export function applyOverlayAppearance(): void {
  if (!overlay) {
    return;
  }

  applyThemePreference(overlay, settings.appearance, getSystemPrefersDark());
  syncBrandMarkTheme();
  overlay.style.setProperty(
    "--mc-overlay-opacity",
    `${settings.overlayOpacity}%`
  );
  overlay.classList.toggle("mc-click-through", settings.overlayClickThrough);
  syncTooltipTheme();
}

export function createOverlay(): void {
  if (overlay) return;

  const storedOverlayFrame = getStoredOverlayPosition();
  const shouldStartCompact = storedOverlayFrame?.view === "minimized";
  const { header, translationDock } = createHeader();
  const footer = createOverlayFooter();

  const captionListEl = createElement("div", { className: "mc-list" });
  setCaptionList(captionListEl);
  captionListEl.appendChild(createCaptureGuide());

  const content = createElement("div", { className: "mc-content" }, [
    captionListEl,
  ]);

  const resizeHandleBR = createElement("div", {
    className: "mc-resize mc-resize-br",
  });
  const resizeHandleBL = createElement("div", {
    className: "mc-resize mc-resize-bl",
  });
  const resizeHandleB = createElement("div", {
    className: "mc-resize mc-resize-b",
  });

  const overlayEl = createElement("div", { id: "captionarc-overlay" }, [
    header,
    translationDock,
    content,
    footer,
    resizeHandleBR,
    resizeHandleBL,
    resizeHandleB,
  ]);

  if (shouldStartCompact || storedOverlayFrame) {
    overlayEl.style.visibility = "hidden";
    overlayEl.style.transition = "none";
  }

  if (!settings.translationEnabled) {
    overlayEl.classList.add("translation-off");
  }

  if (storedOverlayFrame) {
    if (shouldStartCompact) {
      primeCompactOverlayFrame(overlayEl);
    } else {
      applyStoredOverlayFrame(overlayEl);
    }
  }

  document.body.appendChild(overlayEl);
  setOverlay(overlayEl);
  applyLocaleAttributes(getUiRuntimeLocale(), overlayEl);
  applyThemePreference(overlayEl, settings.appearance, getSystemPrefersDark());
  applyOverlayAppearance();
  syncOverlayVisibilityPreference();
  syncTranslationDock();
  syncOverlayFooter();
  syncOverlayDockLayout(overlayEl, header, translationDock);

  dockLayoutObserver?.disconnect();
  dockLayoutObserver = new ResizeObserver(() => {
    syncOverlayDockLayout(overlayEl, header, translationDock);
  });
  dockLayoutObserver.observe(overlayEl);
  dockLayoutObserver.observe(header);
  dockLayoutObserver.observe(translationDock);

  if (shouldStartCompact) {
    overlayEl.style.visibility = "";
    requestAnimationFrame(() => {
      overlayEl.style.transition = "";
    });
  } else if (storedOverlayFrame) {
    overlayEl.style.visibility = "";
    requestAnimationFrame(() => {
      overlayEl.style.transition = "";
    });
  } else {
    setMinimized(false);
  }

  if (!stopOverlayThemeObserver) {
    stopOverlayThemeObserver = observeSystemThemePreference(() => {
      applyOverlayAppearance();
    });
  }

  const scrollBtn = createScrollButton(content, overlayEl);
  overlayEl.appendChild(scrollBtn);
  stopTooltipSystem = initTooltipSystem(overlayEl);
  startOverlayFooterTicker();

  makeDraggable(overlayEl, header);
  makeResizable(overlayEl, resizeHandleBR, "br");
  makeResizable(overlayEl, resizeHandleBL, "bl");
  makeResizable(overlayEl, resizeHandleB, "b");

  stopOverlayLocaleObserver?.();
  stopOverlayLocaleObserver = subscribeUiRuntimeLocale((locale) => {
    if (!overlay) {
      return;
    }

    applyLocaleAttributes(locale, overlay);
    syncCaptureGuide();
    syncHeaderCopy();
    syncCompactStatus();
    syncTranslationDock();
    syncOverlayFooter();
    syncAssistantSurface();
    renderCaptions(true);
  });

  createAssistantSurface();
  renderCaptions();
  syncCaptureGuide();
  syncAssistantSurface();
}

export function destroyOverlay(): void {
  resetCaptureConsentPrompt();
  stopOverlayThemeObserver?.();
  stopOverlayThemeObserver = null;
  stopOverlayLocaleObserver?.();
  stopOverlayLocaleObserver = null;
  stopTooltipSystem?.();
  stopTooltipSystem = null;
  dockLayoutObserver?.disconnect();
  dockLayoutObserver = null;
  stopOverlayFooterTicker();
  destroyTooltipSystem();

  if (overlay?.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }

  destroyAssistantSurface();
  setOverlay(null);
  setCaptionList(null);
  setWaveElement(null);
  setCaptureGuideElement(null);
}
