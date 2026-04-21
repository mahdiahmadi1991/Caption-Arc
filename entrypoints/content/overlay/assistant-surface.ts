import {
  ASSISTANT_LIVE_UPDATED_EVENT,
  clearAssistantUnreadState,
  toggleAssistantSessionEnabled,
} from "../assistant-service";
import { getCurrentSessionId } from "../history-service";
import { createContentIcon } from "../icons";
import { createElement } from "../libs";
import { getOpenAiServiceAvailability } from "../../shared/openai-service";
import { getUiRuntimeTranslator } from "../../shared/i18n";
import { getDynamicTextDirection } from "../../shared/text-direction";
import {
  assistantLiveOutputs,
  assistantLivePendingOutputs,
  assistantLiveState,
  assistantSurface,
  assistantSurfaceHeight,
  assistantSurfaceList,
  assistantSurfaceOpen,
  assistantSurfaceUnread,
  assistantSurfaceUnreadCount,
  assistantSurfaceVisible,
  assistantSessionEnabled,
  meetingPresenceState,
  overlay,
  settings,
  setAssistantSurface,
  setAssistantSurfaceHeight,
  setAssistantSurfaceList,
  setAssistantSurfaceOpen,
} from "../state";

const MIN_ASSISTANT_PANEL_HEIGHT = 300;
const MAX_ASSISTANT_PANEL_HEIGHT = 560;
const SOFT_MIN_ASSISTANT_PANEL_HEIGHT = 0;
const SNAP_BACK_RELEASE_RATIO = 0.3;
const COLLAPSE_MAGNET_HEIGHT = Math.round(
  MIN_ASSISTANT_PANEL_HEIGHT * (1 - SNAP_BACK_RELEASE_RATIO)
);
const RESIZE_MAGNET_SPLIT_HEIGHT =
  MIN_ASSISTANT_PANEL_HEIGHT +
  (MAX_ASSISTANT_PANEL_HEIGHT - MIN_ASSISTANT_PANEL_HEIGHT) / 2;
const AUTO_RESIZE_TRANSITION_MS = 190;

let assistantShell: HTMLElement | null = null;
let assistantPanel: HTMLElement | null = null;
let assistantPanelShape: SVGSVGElement | null = null;
let assistantPanelShapeFill: SVGPathElement | null = null;
let assistantPanelShapeStroke: SVGPathElement | null = null;
let assistantDock: HTMLElement | null = null;
let assistantDockStatus: HTMLElement | null = null;
let assistantDockDescription: HTMLElement | null = null;
let assistantDockUnread: HTMLElement | null = null;
let assistantDockIssue: HTMLElement | null = null;
let assistantToggleButton: HTMLButtonElement | null = null;
let assistantBottomHandle: HTMLButtonElement | null = null;
let assistantEmptyState: HTMLElement | null = null;
let assistantBrandImage: HTMLImageElement | null = null;
let assistantHeaderBrandImage: HTMLImageElement | null = null;
let assistantFooterSubtitle: HTMLElement | null = null;
let assistantFooterLiveState: HTMLElement | null = null;
let assistantFooterCount: HTMLElement | null = null;
let assistantFooterPending: HTMLElement | null = null;
let assistantFooterAiAlert: HTMLElement | null = null;
let overlayMutationObserver: MutationObserver | null = null;
let stopAssistantEventListener: (() => void) | null = null;
let stopAssistantResizeListener: (() => void) | null = null;
let stopAssistantKeydownListener: (() => void) | null = null;
let stopOverlayPointerListener: (() => void) | null = null;
let shouldResetHeightAfterClose = false;
let preserveSoftHeightOnClose = false;
let floatingSurfaceFocusOwner: "overlay" | "assistant" = "overlay";
let assistantHeightAnimationFrameId: number | null = null;
let assistantEnterAnimationFrameId: number | null = null;
let assistantEnterTimeoutId: number | null = null;
let assistantHasEntered = false;

const ASSISTANT_PANEL_ID = "captionarc-assistant-top-panel";
const ASSISTANT_LIST_ID = "captionarc-assistant-top-panel-list";
const OVERLAY_SURFACE_Z_INDEX = 1000000;
const ASSISTANT_SURFACE_Z_INDEX = 1000001;
const OVERLAY_SURFACE_BACK_Z_INDEX = 999999;
const ASSISTANT_SURFACE_BACK_Z_INDEX = 999998;
const ASSISTANT_DOCK_POCKET_DEPTH = 76;
const ASSISTANT_ENTER_TRANSFORM =
  "translateY(calc(-1 * (var(--mc-assistant-panel-total-height) - var(--mc-assistant-dock-height) + 54px))) scale(0.992)";
const ASSISTANT_CLOSED_TRANSFORM =
  "translateY(calc(-1 * (var(--mc-assistant-panel-total-height) - var(--mc-assistant-dock-height) - 8px))) scale(0.99)";
const ASSISTANT_OPEN_TRANSFORM = "translateY(0) scale(1)";
const ASSISTANT_ENTER_TRANSITION =
  "transform 0.62s cubic-bezier(0.16, 0.88, 0.22, 1)";

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K
): SVGElementTagNameMap[K] {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function clampPanelHeight(
  value: number,
  minimumHeight = MIN_ASSISTANT_PANEL_HEIGHT
): number {
  const maxHeight = Math.max(
    minimumHeight,
    Math.min(MAX_ASSISTANT_PANEL_HEIGHT, window.innerHeight - 96)
  );
  return Math.max(
    minimumHeight,
    Math.min(maxHeight, value)
  );
}

function getAssistantMaxHeight(): number {
  return clampPanelHeight(MAX_ASSISTANT_PANEL_HEIGHT);
}

function cancelAssistantHeightAnimation(): void {
  if (assistantHeightAnimationFrameId === null) {
    return;
  }

  window.cancelAnimationFrame(assistantHeightAnimationFrameId);
  assistantHeightAnimationFrameId = null;
}

function cancelAssistantEnterAnimation(): void {
  if (assistantEnterAnimationFrameId === null) {
    if (assistantEnterTimeoutId !== null) {
      window.clearTimeout(assistantEnterTimeoutId);
      assistantEnterTimeoutId = null;
    }
    return;
  }

  window.cancelAnimationFrame(assistantEnterAnimationFrameId);
  assistantEnterAnimationFrameId = null;
  if (assistantEnterTimeoutId !== null) {
    window.clearTimeout(assistantEnterTimeoutId);
    assistantEnterTimeoutId = null;
  }
}

function scheduleAssistantSurfaceEnter(): void {
  if (
    !assistantShell ||
    !assistantPanel ||
    assistantHasEntered ||
    assistantEnterAnimationFrameId !== null ||
    assistantEnterTimeoutId !== null
  ) {
    return;
  }

  assistantPanel.style.transition = "none";
  assistantPanel.style.transform = ASSISTANT_ENTER_TRANSFORM;

  assistantEnterAnimationFrameId = window.requestAnimationFrame(() => {
    assistantEnterAnimationFrameId = window.requestAnimationFrame(() => {
      assistantEnterAnimationFrameId = null;
      if (!assistantShell || !assistantPanel || !assistantSurfaceVisible) {
        return;
      }

      assistantShell.style.visibility = "";
      void assistantPanel.offsetWidth;

      const finishEnter = () => {
        assistantEnterTimeoutId = null;
        if (!assistantShell || !assistantPanel || !assistantSurfaceVisible) {
          return;
        }

        assistantHasEntered = true;
        assistantPanel.style.transition = "";
        assistantPanel.style.transform = "";
        syncAssistantSurfaceState();
      };

      if (prefersReducedMotion()) {
        assistantPanel.style.transform = assistantSurfaceOpen
          ? ASSISTANT_OPEN_TRANSFORM
          : ASSISTANT_CLOSED_TRANSFORM;
        finishEnter();
        return;
      }

      assistantPanel.style.transition = ASSISTANT_ENTER_TRANSITION;
      assistantPanel.style.transform = assistantSurfaceOpen
        ? ASSISTANT_OPEN_TRANSFORM
        : ASSISTANT_CLOSED_TRANSFORM;

      assistantEnterTimeoutId = window.setTimeout(finishEnter, 640);
    });
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function animateAssistantHeightTo(
  targetHeight: number,
  options?: { duration?: number; onComplete?: () => void }
): void {
  cancelAssistantHeightAnimation();

  const duration = options?.duration ?? AUTO_RESIZE_TRANSITION_MS;
  const startHeight = assistantSurfaceHeight;
  const resolvedTargetHeight = clampPanelHeight(targetHeight);

  if (
    prefersReducedMotion() ||
    duration <= 0 ||
    Math.abs(resolvedTargetHeight - startHeight) < 1
  ) {
    setAssistantSurfaceHeight(resolvedTargetHeight);
    syncAssistantSurfaceState();
    options?.onComplete?.();
    return;
  }

  const startedAt = performance.now();

  const tick = (now: number) => {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);
    const nextHeight =
      startHeight + (resolvedTargetHeight - startHeight) * eased;
    setAssistantSurfaceHeight(nextHeight);
    syncAssistantSurfaceLayout();

    if (progress >= 1) {
      assistantHeightAnimationFrameId = null;
      setAssistantSurfaceHeight(resolvedTargetHeight);
      syncAssistantSurfaceState();
      options?.onComplete?.();
      return;
    }

    assistantHeightAnimationFrameId = window.requestAnimationFrame(tick);
  };

  assistantHeightAnimationFrameId = window.requestAnimationFrame(tick);
}

function getBottomHandleMode(): "expand" | "resize" | "collapse" {
  if (!assistantSurfaceOpen) {
    return "expand";
  }

  return assistantSurfaceHeight >= getAssistantMaxHeight() - 1
    ? "collapse"
    : "resize";
}

function getRenderableAssistantState():
  | "watching"
  | "triggered"
  | "streaming"
  | "done"
  | "suppressed"
  | "error" {
  if (
    assistantSessionEnabled &&
    !getOpenAiServiceAvailability(settings).operational
  ) {
    return "error";
  }

  if (assistantLiveState === "triggered" || assistantLiveState === "streaming") {
    return assistantLiveState;
  }

  return assistantLiveState;
}

function getRenderablePendingOutputs(): (typeof assistantLivePendingOutputs) {
  if (
    assistantSessionEnabled &&
    !getOpenAiServiceAvailability(settings).operational
  ) {
    return [];
  }

  if (assistantLivePendingOutputs.length > 0) {
    return assistantLivePendingOutputs;
  }

  return assistantLivePendingOutputs;
}

function getStatusLabel(): string {
  const t = getUiRuntimeTranslator();
  const aiAvailability = getOpenAiServiceAvailability(settings);
  switch (getRenderableAssistantState()) {
    case "triggered":
      return t("content.assistant.statusLabel.queued");
    case "streaming":
      return t("content.assistant.statusLabel.working");
    case "done":
      return t("content.assistant.statusLabel.ready");
    case "suppressed":
      return t("content.assistant.statusLabel.paused");
    case "error":
      return aiAvailability.operational
        ? t("content.assistant.statusLabel.issue")
        : t("content.assistant.statusLabel.unavailable");
    case "watching":
    default:
      return t("content.assistant.statusLabel.watching");
  }
}

function getStatusDescription(): string {
  const t = getUiRuntimeTranslator();
  const aiAvailability = getOpenAiServiceAvailability(settings);
  switch (getRenderableAssistantState()) {
    case "triggered":
      return t("content.assistant.statusDescription.queued");
    case "streaming":
      return t("content.assistant.statusDescription.working");
    case "done":
      return assistantLiveOutputs.length > 0
        ? t("content.assistant.statusDescription.latestReady")
        : t("content.assistant.statusDescription.ready");
    case "suppressed":
      return t("content.assistant.statusDescription.paused");
    case "error":
      return aiAvailability.operational
        ? t("content.assistant.statusDescription.issue")
        : t("content.assistant.statusDescription.unavailable");
    case "watching":
    default:
      return t("content.assistant.statusDescription.watching");
  }
}

function setTextIfChanged(el: HTMLElement | null, text: string): void {
  if (!el || el.textContent === text) {
    return;
  }

  el.textContent = text;
}

function getAssistantEmptyStateCopy(): {
  title: string;
  body: string;
  stateClass: string;
} {
  const t = getUiRuntimeTranslator();
  const aiAvailability = getOpenAiServiceAvailability(settings);
  if (!aiAvailability.operational && assistantSessionEnabled) {
    return {
      title:
        aiAvailability.state === "setup"
          ? t("content.assistant.emptyState.setupTitle")
          : t("content.assistant.emptyState.unavailableTitle"),
      body:
        aiAvailability.state === "setup"
          ? t("content.assistant.emptyState.setupBody")
          : t("content.assistant.emptyState.unavailableBody", {
              message: aiAvailability.message,
            }),
      stateClass: "mc-empty-error",
    };
  }

  if (meetingPresenceState !== "joined") {
    return {
      title: t("content.assistant.emptyState.watchingTitle"),
      body: t("content.assistant.emptyState.watchingBody"),
      stateClass: "mc-empty-waiting",
    };
  }

  switch (getRenderableAssistantState()) {
    case "suppressed":
      return {
        title: t("content.assistant.emptyState.offTitle"),
        body: t("content.assistant.emptyState.offBody"),
        stateClass: "mc-empty-dismissed",
      };
    case "error":
      return {
        title: t("content.assistant.emptyState.errorTitle"),
        body: t("content.assistant.emptyState.errorBody"),
        stateClass: "mc-empty-error",
      };
    case "triggered":
      return {
        title: t("content.assistant.emptyState.preparingTitle"),
        body: t("content.assistant.emptyState.preparingBody"),
        stateClass: "mc-empty-pending",
      };
    case "streaming":
      return {
        title: t("content.assistant.emptyState.workingTitle"),
        body: t("content.assistant.emptyState.workingBody"),
        stateClass: "mc-empty-starting",
      };
    case "done":
    case "watching":
    default:
      return {
        title: t("content.assistant.emptyState.watchingTitle"),
        body: t("content.assistant.emptyState.watchingBody"),
        stateClass: "mc-empty-ready",
      };
  }
}

function getAssistantFooterTone():
  | "live"
  | "armed"
  | "waiting"
  | "hold"
  | "off" {
  if (
    assistantSessionEnabled &&
    !getOpenAiServiceAvailability(settings).operational
  ) {
    return "hold";
  }

  if (meetingPresenceState !== "joined") {
    return "waiting";
  }

  switch (getRenderableAssistantState()) {
    case "triggered":
    case "streaming":
      return "live";
    case "suppressed":
      return "off";
    case "error":
      return "hold";
    case "done":
    case "watching":
    default:
      return "armed";
  }
}

function getAssistantFooterSubtitle(): string {
  const t = getUiRuntimeTranslator();
  const aiAvailability = getOpenAiServiceAvailability(settings);
  if (!aiAvailability.operational && assistantSessionEnabled) {
    return aiAvailability.state === "setup"
      ? t("content.assistant.footer.setup")
      : t("content.assistant.footer.unavailable");
  }

  if (meetingPresenceState !== "joined") {
    return t("content.assistant.footer.sessionStartsAfterJoin");
  }

  switch (getRenderableAssistantState()) {
    case "triggered":
    case "streaming":
      return t("content.assistant.footer.workingLiveGuidance");
    case "suppressed":
      return t("content.assistant.footer.turnedOffForSession");
    case "error":
      return t("content.assistant.footer.generationNeedsAttention");
    case "done":
      return t("content.assistant.footer.latestGuidanceReady");
    case "watching":
    default:
      return t("content.assistant.footer.watchingSession");
  }
}

function syncAssistantFooter(): void {
  const t = getUiRuntimeTranslator();
  if (
    !assistantFooterSubtitle ||
    !assistantFooterLiveState ||
    !assistantFooterCount ||
    !assistantFooterPending ||
    !assistantFooterAiAlert
  ) {
    return;
  }

  setTextIfChanged(assistantFooterSubtitle, getAssistantFooterSubtitle());
  setTextIfChanged(assistantFooterLiveState, getStatusLabel());
  assistantFooterLiveState.dataset.tone = getAssistantFooterTone();

  const outputsLabel = t("content.assistant.footer.notes", {
    count: assistantLiveOutputs.length,
  });
  setTextIfChanged(assistantFooterCount, outputsLabel);

  const pendingOutputs = getRenderablePendingOutputs();

  if (pendingOutputs.length > 0) {
    assistantFooterPending.style.display = "";
    setTextIfChanged(
      assistantFooterPending,
      t("content.assistant.footer.liveCount", {
        count: pendingOutputs.length,
      })
    );
  } else {
    assistantFooterPending.style.display = "none";
  }

  const aiAvailability = getOpenAiServiceAvailability(settings);
  const showAiIssue = assistantSessionEnabled && !aiAvailability.operational;
  assistantFooterAiAlert.hidden = !showAiIssue;
  assistantFooterAiAlert.style.display = showAiIssue ? "" : "none";
  assistantFooterAiAlert.setAttribute(
    "data-tooltip",
    aiAvailability.state === "setup"
      ? t("content.assistant.footer.aiAlertSetup")
      : t("content.assistant.footer.aiAlertUnavailable", {
          message: aiAvailability.message,
        })
  );
}

function getBrandMarkSrc(): string {
  const runtime = globalThis.chrome?.runtime ?? globalThis.browser?.runtime;
  const theme = overlay?.dataset.theme || "light";
  const assetPath = theme === "dark" ? "logo-mark-dark.svg" : "logo-mark-light.svg";
  return typeof runtime?.getURL === "function" ? runtime.getURL(assetPath) : assetPath;
}

function buildSnippet(text: string, maxLength = 80): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function buildSourceLabel(
  output:
    | (typeof assistantLiveOutputs)[number]
    | (typeof assistantLivePendingOutputs)[number]
): string {
  const t = getUiRuntimeTranslator();
  const source =
    output.source === "chat"
      ? t("content.assistant.source.meetingChat")
      : t("content.assistant.source.caption");
  const speaker = output.speaker?.trim() || t("content.assistant.source.unknownSpeaker");
  const snippet = buildSnippet(output.triggerText);
  return `${source} · ${speaker}${snippet ? ` · ${snippet}` : ""}`;
}

function renderAssistantMarkdown(content: string): HTMLElement {
  const direction = getDynamicTextDirection(content) || "ltr";
  const root = createElement("div", {
    className: "mc-assistant-card-copy",
    dir: direction,
  });
  const normalized = content.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return root;
  }

  const lines = normalized.split("\n");
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3);
      root.appendChild(
        createElement(`h${level}` as "h1" | "h2" | "h3", {
          textContent: headingMatch[2].trim(),
        })
      );
      index += 1;
      continue;
    }

    const unorderedMatch = /^[-*+]\s+(.*)$/.exec(line);
    if (unorderedMatch) {
      const list = createElement("ul");
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        const itemMatch = /^[-*+]\s+(.*)$/.exec(itemLine);
        if (!itemMatch) {
          break;
        }
        list.appendChild(
          createElement("li", {
            textContent: itemMatch[1].trim(),
          })
        );
        index += 1;
      }
      root.appendChild(list);
      continue;
    }

    const orderedMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (orderedMatch) {
      const list = createElement("ol");
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        const itemMatch = /^(\d+)\.\s+(.*)$/.exec(itemLine);
        if (!itemMatch) {
          break;
        }
        list.appendChild(
          createElement("li", {
            textContent: itemMatch[2].trim(),
          })
        );
        index += 1;
      }
      root.appendChild(list);
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const paragraphLine = lines[index].trim();
      if (
        !paragraphLine ||
        /^(#{1,3})\s+/.test(paragraphLine) ||
        /^[-*+]\s+/.test(paragraphLine) ||
        /^\d+\.\s+/.test(paragraphLine)
      ) {
        break;
      }
      paragraphLines.push(paragraphLine);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      root.appendChild(
        createElement("p", {
          textContent: paragraphLines.join(" "),
        })
      );
      continue;
    }

    index += 1;
  }

  return root;
}

function isAssistantListNearBottom(): boolean {
  if (!assistantSurfaceList) {
    return true;
  }

  return (
    assistantSurfaceList.scrollHeight -
      assistantSurfaceList.scrollTop -
      assistantSurfaceList.clientHeight <
    72
  );
}

function createPendingCard(
  output: (typeof assistantLivePendingOutputs)[number]
): HTMLElement {
  const t = getUiRuntimeTranslator();
  const partialContent = output.partialContent?.trim() || "";
  const sourceLabel = buildSourceLabel(output);
  const sourceDirection = getDynamicTextDirection(sourceLabel) || "ltr";
  const contentDirection = getDynamicTextDirection(partialContent) || "ltr";
  return createElement("article", {
    className: "mc-assistant-card mc-assistant-card-pending",
  }, [
    createElement("div", { className: "mc-assistant-card-source" }, [
      createElement("span", {
        className: "mc-assistant-card-source-badge",
        textContent:
          output.source === "chat"
            ? t("content.assistant.source.meetingChat")
            : t("content.assistant.source.caption"),
      }),
      createElement("span", {
        className: "mc-assistant-card-source-text",
        textContent: sourceLabel,
        dir: sourceDirection,
      }),
    ]),
    createElement("div", { className: "mc-assistant-card-body" }, [
      createElement("div", { className: "mc-assistant-card-loading" }, [
        createElement("span", { className: "mc-assistant-card-loading-dot" }),
        createElement("span", { className: "mc-assistant-card-loading-dot" }),
        createElement("span", { className: "mc-assistant-card-loading-dot" }),
      ]),
      createElement("p", {
        className: "mc-assistant-card-copy",
        textContent:
          partialContent || t("content.assistant.pendingReply"),
        dir: contentDirection,
      }),
    ]),
  ]);
}

function createOutputCard(
  output: (typeof assistantLiveOutputs)[number]
): HTMLElement {
  const t = getUiRuntimeTranslator();
  const copy = renderAssistantMarkdown(output.content);
  const sourceLabel = buildSourceLabel(output);
  const sourceDirection = getDynamicTextDirection(sourceLabel) || "ltr";
  return createElement("article", { className: "mc-assistant-card" }, [
    createElement("div", { className: "mc-assistant-card-source" }, [
      createElement("span", {
        className: "mc-assistant-card-source-badge",
        textContent:
          output.source === "chat"
            ? t("content.assistant.source.meetingChat")
            : t("content.assistant.source.caption"),
      }),
      createElement("span", {
        className: "mc-assistant-card-source-text",
        textContent: sourceLabel,
        dir: sourceDirection,
      }),
    ]),
    createElement("div", { className: "mc-assistant-card-body" }, [
      copy,
    ]),
  ]);
}

function renderAssistantOutputs(): void {
  if (!assistantSurfaceList || !assistantEmptyState) {
    return;
  }

  if (
    assistantSessionEnabled &&
    !getOpenAiServiceAvailability(settings).operational
  ) {
    assistantEmptyState.style.display = "";
    assistantSurfaceList.style.display = "none";
    while (assistantSurfaceList.firstChild) {
      assistantSurfaceList.removeChild(assistantSurfaceList.firstChild);
    }
    return;
  }

  const shouldStick = isAssistantListNearBottom();

  while (assistantSurfaceList.firstChild) {
    assistantSurfaceList.removeChild(assistantSurfaceList.firstChild);
  }

  const pendingOutputs = getRenderablePendingOutputs();
  const hasCards =
    assistantLiveOutputs.length > 0 || pendingOutputs.length > 0;
  assistantEmptyState.style.display = hasCards ? "none" : "";
  assistantSurfaceList.style.display = hasCards ? "flex" : "none";

  assistantLiveOutputs.forEach((output) => {
    assistantSurfaceList.appendChild(createOutputCard(output));
  });

  pendingOutputs.forEach((pending) => {
    assistantSurfaceList.appendChild(createPendingCard(pending));
  });

  if (shouldStick) {
    assistantSurfaceList.scrollTop = assistantSurfaceList.scrollHeight;
  }
}

function syncAssistantEmptyState(): void {
  if (!assistantEmptyState) {
    return;
  }

  const emptyStateCopy = getAssistantEmptyStateCopy();
  assistantEmptyState.className = `mc-empty mc-assistant-empty-surface ${emptyStateCopy.stateClass}`;

  const titleEl = assistantEmptyState.querySelector(".mc-empty-title");
  const bodyEl = assistantEmptyState.querySelector(".mc-empty-body");
  if (!(titleEl instanceof HTMLElement) || !(bodyEl instanceof HTMLElement)) {
    return;
  }

  titleEl.textContent = emptyStateCopy.title;
  bodyEl.textContent = emptyStateCopy.body;
}

function syncAssistantSurfaceTheme(): void {
  if (!assistantShell) {
    return;
  }

  assistantShell.dataset.theme = overlay?.dataset.theme || "light";
  assistantShell.style.setProperty(
    "--mc-assistant-overlay-opacity",
    `${Math.max(40, Math.min(100, settings.overlayOpacity))}%`
  );
  if (assistantHeaderBrandImage) {
    assistantHeaderBrandImage.src = getBrandMarkSrc();
  }
  if (assistantBrandImage) {
    assistantBrandImage.src = getBrandMarkSrc();
  }
}

function syncAssistantSurfaceVisibilityPreference(): void {
  if (!assistantShell) {
    return;
  }

  const shouldBeHidden = !settings.overlayVisible;
  assistantShell.classList.toggle("mc-hidden", shouldBeHidden);
  assistantShell.classList.toggle("mc-click-through", settings.overlayClickThrough);
  assistantShell.setAttribute(
    "aria-hidden",
    !assistantSurfaceVisible || shouldBeHidden ? "true" : "false"
  );
}

function syncAssistantSurfaceLayout(): void {
  if (!assistantShell || !assistantPanel) {
    return;
  }

  const shouldShow = assistantSurfaceVisible;

  assistantShell.style.display = shouldShow ? "" : "none";
  if (!shouldShow) {
    assistantShell.style.visibility = "hidden";
    cancelAssistantEnterAnimation();
    assistantHasEntered = false;
    assistantPanel.style.transition = "";
    assistantPanel.style.transform = "";
    assistantShell.classList.remove("mc-hidden");
    assistantShell.setAttribute("aria-hidden", "true");
    return;
  }

  syncAssistantSurfaceVisibilityPreference();

  if (!assistantHasEntered && !settings.overlayVisible) {
    assistantHasEntered = true;
  }

  const minHeight = assistantShell.classList.contains("mc-resizing") ||
    preserveSoftHeightOnClose
    ? SOFT_MIN_ASSISTANT_PANEL_HEIGHT
    : MIN_ASSISTANT_PANEL_HEIGHT;
  const clampedHeight = clampPanelHeight(assistantSurfaceHeight, minHeight);
  if (clampedHeight !== assistantSurfaceHeight) {
    setAssistantSurfaceHeight(clampedHeight);
  }

  assistantShell.style.setProperty(
    "--mc-assistant-panel-height",
    `${clampedHeight}px`
  );
  assistantShell.style.setProperty(
    "--mc-assistant-panel-total-height",
    `${clampedHeight + ASSISTANT_DOCK_POCKET_DEPTH}px`
  );
  const collapseTravel = Math.max(0, MIN_ASSISTANT_PANEL_HEIGHT - clampedHeight);
  assistantShell.style.setProperty(
    "--mc-assistant-collapse-progress",
    `${Math.min(1, collapseTravel / MIN_ASSISTANT_PANEL_HEIGHT)}`
  );

  const panelWidth = assistantPanel.clientWidth;
  const pocketWidth = Math.max(
    368,
    Math.min(456, Math.round(panelWidth * 0.56))
  );
  assistantShell.style.setProperty(
    "--mc-assistant-dock-pocket-width",
    `${pocketWidth}px`
  );

  syncAssistantPanelShape(clampedHeight, pocketWidth);

  if (!assistantHasEntered) {
    scheduleAssistantSurfaceEnter();
  }
}

function syncAssistantPanelShape(
  mainHeight = assistantSurfaceHeight,
  pocketWidth?: number
): void {
  if (
    !assistantPanel ||
    !assistantPanelShape ||
    !assistantPanelShapeFill ||
    !assistantPanelShapeStroke
  ) {
    return;
  }

  const width = assistantPanel.clientWidth;
  if (!width) {
    return;
  }

  const baseY = Math.max(0, mainHeight);
  const totalHeight = baseY + ASSISTANT_DOCK_POCKET_DEPTH;
  const outerRadius = Math.min(28, Math.max(baseY, 0.001));
  const shoulderRadius = Math.min(36, Math.max(baseY, 0.001));
  const pocketRadius = 36;
  const resolvedPocketWidth =
    pocketWidth ??
    Math.max(220, Math.min(296, Math.round(width * 0.31)));
  const pocketLeft = (width - resolvedPocketWidth) / 2;
  const pocketRight = pocketLeft + resolvedPocketWidth;
  const shoulderLeft = pocketLeft - shoulderRadius;
  const shoulderRight = pocketRight + shoulderRadius;

  const d = [
    `M 0 0`,
    `H ${width}`,
    `V ${baseY - outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${width - outerRadius} ${baseY}`,
    `H ${shoulderRight}`,
    `Q ${pocketRight} ${baseY} ${pocketRight} ${baseY + shoulderRadius}`,
    `V ${totalHeight - pocketRadius}`,
    `Q ${pocketRight} ${totalHeight} ${pocketRight - pocketRadius} ${totalHeight}`,
    `H ${pocketLeft + pocketRadius}`,
    `Q ${pocketLeft} ${totalHeight} ${pocketLeft} ${totalHeight - pocketRadius}`,
    `V ${baseY + shoulderRadius}`,
    `Q ${pocketLeft} ${baseY} ${shoulderLeft} ${baseY}`,
    `H ${outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 0 ${baseY - outerRadius}`,
    `Z`,
  ].join(" ");

  assistantPanelShape.setAttribute("viewBox", `0 0 ${width} ${totalHeight}`);
  assistantPanelShape.setAttribute("width", String(width));
  assistantPanelShape.setAttribute("height", String(totalHeight));
  assistantPanelShapeFill.setAttribute("d", d);
  assistantPanelShapeStroke.setAttribute("d", d);
}

function syncFloatingSurfaceStacking(): void {
  if (!assistantShell || !overlay) {
    return;
  }

  const overlayIsMinimized = overlay.classList.contains("minimized");
  if (overlayIsMinimized) {
    overlay.style.zIndex = String(OVERLAY_SURFACE_Z_INDEX);
    assistantShell.style.zIndex = String(ASSISTANT_SURFACE_BACK_Z_INDEX);
    return;
  }

  if (floatingSurfaceFocusOwner === "assistant") {
    assistantShell.style.zIndex = String(ASSISTANT_SURFACE_Z_INDEX);
    overlay.style.zIndex = String(OVERLAY_SURFACE_BACK_Z_INDEX);
    return;
  }

  overlay.style.zIndex = String(OVERLAY_SURFACE_Z_INDEX);
  assistantShell.style.zIndex = String(ASSISTANT_SURFACE_BACK_Z_INDEX);
}

function bringAssistantSurfaceToFront(): void {
  floatingSurfaceFocusOwner = "assistant";
  syncFloatingSurfaceStacking();
}

function bringOverlayToFront(): void {
  floatingSurfaceFocusOwner = "overlay";
  syncFloatingSurfaceStacking();
}

function syncAssistantSurfaceState(): void {
  const t = getUiRuntimeTranslator();
  if (
    !assistantShell ||
    !assistantPanel ||
    !assistantDock ||
    !assistantDockStatus ||
    !assistantDockDescription ||
    !assistantDockUnread ||
    !assistantDockIssue ||
    !assistantToggleButton ||
    !assistantBottomHandle
  ) {
    return;
  }

  assistantShell.dataset.open = assistantSurfaceOpen ? "true" : "false";
  const renderableState = getRenderableAssistantState();
  assistantShell.dataset.state = renderableState;
  assistantShell.dataset.unread = assistantSurfaceUnread ? "true" : "false";
  assistantPanel.dataset.state = renderableState;
  syncAssistantSurfaceVisibilityPreference();
  assistantPanel.setAttribute(
    "aria-hidden",
    assistantSurfaceOpen ? "false" : "true"
  );
  assistantPanel.setAttribute(
    "aria-busy",
    renderableState === "triggered" || renderableState === "streaming"
      ? "true"
      : "false"
  );

  const aiAvailability = getOpenAiServiceAvailability(settings);
  assistantDockStatus.textContent = getStatusLabel();
  assistantDockDescription.textContent = getStatusDescription();
  const showAiIssue = assistantSessionEnabled && !aiAvailability.operational;
  assistantDockIssue.hidden = !showAiIssue;
  assistantDockIssue.style.display = showAiIssue ? "" : "none";
  assistantDockIssue.setAttribute(
    "data-tooltip",
    aiAvailability.state === "setup"
      ? t("content.assistant.footer.aiAlertSetup")
      : t("content.assistant.footer.aiAlertUnavailable", {
          message: aiAvailability.message,
        })
  );

  if (assistantSurfaceUnreadCount > 0) {
    assistantDockUnread.textContent =
      assistantSurfaceUnreadCount > 9 ? "9+" : String(assistantSurfaceUnreadCount);
    assistantDockUnread.style.display = "";
  } else {
    assistantDockUnread.style.display = "none";
  }

  const toggleShouldAppearActive = assistantSessionEnabled;
  assistantToggleButton.classList.toggle("mc-active", toggleShouldAppearActive);
  assistantToggleButton.dataset.enabled = assistantSessionEnabled ? "true" : "false";
  assistantToggleButton.dataset.processing =
    renderableState === "triggered" || renderableState === "streaming"
      ? "true"
      : "false";
  assistantToggleButton.disabled =
    !getCurrentSessionId() || !aiAvailability.operational;
  assistantToggleButton.setAttribute(
    "aria-label",
    !aiAvailability.operational
      ? aiAvailability.state === "setup"
        ? t("content.assistant.ui.setupBeforeEnable")
        : t("content.assistant.ui.unavailableUntilOpenAi")
      : assistantSessionEnabled
        ? t("content.assistant.ui.turnOffForSession")
        : t("content.assistant.ui.turnOnForSession")
  );
  assistantToggleButton.setAttribute(
    "data-tooltip",
    !aiAvailability.operational
      ? aiAvailability.state === "setup"
        ? t("content.assistant.footer.aiAlertSetup")
        : t("content.assistant.footer.aiAlertUnavailable", {
            message: aiAvailability.message,
          })
      : assistantSessionEnabled
        ? t("content.assistant.ui.turnOffForSession")
        : t("content.assistant.ui.turnOnForSession")
  );

  const bottomHandleMode = getBottomHandleMode();
  assistantBottomHandle.dataset.mode = bottomHandleMode;
  assistantBottomHandle.setAttribute(
    "aria-label",
    bottomHandleMode === "expand"
      ? t("content.assistant.ui.openPanel")
      : bottomHandleMode === "collapse"
        ? t("content.assistant.ui.collapsePanel")
        : t("content.assistant.ui.resizePanel")
  );
  assistantBottomHandle.setAttribute(
    "aria-expanded",
    assistantSurfaceOpen ? "true" : "false"
  );

  renderAssistantOutputs();
  syncAssistantEmptyState();
  syncAssistantFooter();
  syncAssistantSurfaceTheme();
  syncAssistantSurfaceLayout();
}

function setDockOpen(open: boolean): void {
  cancelAssistantHeightAnimation();

  if (open && !assistantSurfaceVisible) {
    return;
  }

  setAssistantSurfaceOpen(open);
  if (open) {
    shouldResetHeightAfterClose = false;
    preserveSoftHeightOnClose = false;
    setAssistantSurfaceHeight(MIN_ASSISTANT_PANEL_HEIGHT);
    clearAssistantUnreadState();
  } else {
    shouldResetHeightAfterClose = false;
  }
  syncAssistantSurfaceState();
}

function toggleDockOpen(): void {
  setDockOpen(!assistantSurfaceOpen);
}

function startDockResize(handle: HTMLElement): void {
  let startY = 0;
  let startHeight = 0;
  let nextHeight = MIN_ASSISTANT_PANEL_HEIGHT;
  let rawNextHeight = MIN_ASSISTANT_PANEL_HEIGHT;
  let resizing = false;
  let activePointerId: number | null = null;
  let didResizeDrag = false;
  let suppressNextClick = false;

  handle.addEventListener("pointerdown", (event) => {
    if (
      !(handle instanceof HTMLElement) ||
      handle.dataset.mode !== "resize" ||
      !assistantSurfaceOpen
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    resizing = true;
    activePointerId = event.pointerId;
    cancelAssistantHeightAnimation();
    assistantShell?.classList.add("mc-resizing");
    bringAssistantSurfaceToFront();
    startY = event.clientY;
    startHeight = assistantSurfaceHeight;
    nextHeight = assistantSurfaceHeight;
    rawNextHeight = assistantSurfaceHeight;
    didResizeDrag = false;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    if (handle instanceof HTMLElement && "setPointerCapture" in handle) {
      handle.setPointerCapture(event.pointerId);
    }

    const onMove = (moveEvent: PointerEvent) => {
      if (!resizing) {
        return;
      }

      const delta = moveEvent.clientY - startY;
      if (Math.abs(delta) > 3) {
        didResizeDrag = true;
      }
      rawNextHeight = startHeight + delta;
      nextHeight = clampPanelHeight(
        rawNextHeight,
        SOFT_MIN_ASSISTANT_PANEL_HEIGHT
      );
      setAssistantSurfaceHeight(nextHeight);
      syncAssistantSurfaceLayout();
    };

    const onUp = (upEvent: PointerEvent) => {
      if (activePointerId !== null && upEvent.pointerId !== activePointerId) {
        return;
      }

      const finalDelta = upEvent.clientY - startY;
      rawNextHeight = startHeight + finalDelta;
      nextHeight = clampPanelHeight(
        rawNextHeight,
        SOFT_MIN_ASSISTANT_PANEL_HEIGHT
      );

      resizing = false;
      activePointerId = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      assistantShell?.classList.remove("mc-resizing");
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      suppressNextClick = didResizeDrag;

      if (rawNextHeight <= COLLAPSE_MAGNET_HEIGHT) {
        preserveSoftHeightOnClose = true;
        setDockOpen(false);
        return;
      }

      if (rawNextHeight < MIN_ASSISTANT_PANEL_HEIGHT) {
        preserveSoftHeightOnClose = true;
        animateAssistantHeightTo(MIN_ASSISTANT_PANEL_HEIGHT, {
          onComplete: () => {
            preserveSoftHeightOnClose = false;
            syncAssistantSurfaceState();
          },
        });
        return;
      }

      const snappedHeight =
        rawNextHeight < RESIZE_MAGNET_SPLIT_HEIGHT
          ? MIN_ASSISTANT_PANEL_HEIGHT
          : getAssistantMaxHeight();
      animateAssistantHeightTo(snappedHeight);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });

  handle.addEventListener("click", (event) => {
    if (!(handle instanceof HTMLElement)) {
      return;
    }

    if (suppressNextClick) {
      suppressNextClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const mode = handle.dataset.mode;
    if (mode === "resize") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (mode === "expand") {
      setDockOpen(true);
      return;
    }

    if (mode === "collapse") {
      setDockOpen(false);
    }
  });
}

export function createAssistantSurface(): void {
  const t = getUiRuntimeTranslator();
  if (assistantShell || !document.body) {
    return;
  }

  assistantToggleButton = createElement("button", {
    type: "button",
    className: "mc-btn mc-assistant-toggle",
    onClick: async () => {
      if (!assistantToggleButton) {
        return;
      }

      assistantToggleButton.disabled = true;
      try {
        await toggleAssistantSessionEnabled(!assistantSessionEnabled);
      } finally {
        if (assistantToggleButton) {
          assistantToggleButton.disabled = !getCurrentSessionId();
        }
      }
    },
  }, [
    createElement("span", { className: "mc-assistant-toggle-ai-mark" }, [
      createContentIcon("sparkles", {
        className: "mc-icon",
        size: 13,
        strokeWidth: 2,
      }) as unknown as HTMLElement,
    ]),
    createElement("span", {
      className: "mc-assistant-toggle-ai-label",
      textContent: t("content.assistant.ui.toggleLiveLabel"),
    }),
    createElement("span", {
      className: "mc-assistant-toggle-unread",
      textContent: "0",
    }),
  ]) as HTMLButtonElement;

  assistantEmptyState = createElement("div", { className: "mc-assistant-empty" }, [
    createElement("div", { className: "mc-empty-visual" }, [
      createElement("span", { className: "mc-empty-visual-bar" }),
      createElement("span", { className: "mc-empty-visual-bar" }),
      createElement("span", { className: "mc-empty-visual-bar" }),
    ]),
    createElement("div", {
      className: "mc-empty-title",
      textContent: t("content.assistant.ui.readyTitle"),
    }),
    createElement("div", {
      className: "mc-empty-body",
      textContent: t("content.assistant.emptyState.watchingBody"),
    }),
  ]);

  const surfaceListEl = createElement("div", {
    id: ASSISTANT_LIST_ID,
    className: "mc-assistant-top-panel-list",
    "aria-live": "polite",
    "aria-relevant": "additions text",
  });
  setAssistantSurfaceList(surfaceListEl);

  assistantFooterSubtitle = createElement("span", {
    className: "mc-footer-subtitle",
    textContent: t("content.assistant.ui.watchingSession"),
  });

  assistantFooterLiveState = createElement("span", {
    className: "mc-footer-pill mc-footer-live-state",
    textContent: t("content.assistant.ui.watching"),
  });

  assistantFooterCount = createElement("span", {
    className: "mc-footer-pill mc-footer-pill--count",
    textContent: t("content.assistant.footer.notes", { count: 0 }),
  });

  assistantFooterPending = createElement("span", {
    className: "mc-footer-pill mc-footer-pill--count",
    textContent: t("content.assistant.footer.liveCount", { count: 0 }),
  });

  assistantFooterAiAlert = createElement(
    "span",
    {
      id: "mc-assistant-footer-ai-alert",
      className: "mc-footer-ai-alert",
      tabindex: "0",
      hidden: true,
    },
    [
      createContentIcon("info", {
        className: "mc-icon mc-footer-ai-alert-icon",
        size: 11,
        strokeWidth: 2,
      }) as unknown as HTMLElement,
    ]
  );

  assistantHeaderBrandImage = createElement("img", {
    className: "mc-brand-mark-image",
    src: getBrandMarkSrc(),
    alt: t("common.appName"),
    draggable: "false",
  }) as HTMLImageElement;

  const assistantHeader = createElement("div", {
    className: "mc-assistant-header",
  }, [
    createElement("div", { className: "mc-assistant-header-left" }, [
      createElement("div", {
        className: "mc-brand-mark mc-brand-mark--compact mc-assistant-header-brand",
      }, [assistantHeaderBrandImage]),
      createElement("div", { className: "mc-header-copy mc-assistant-header-copy" }, [
        createElement("span", {
          className: "mc-title mc-assistant-header-title",
          textContent: t("content.assistant.ui.headerTitle"),
        }),
      ]),
    ]),
    createElement("div", { className: "mc-assistant-header-right" }, [
      createElement("button", {
        type: "button",
        className: "mc-btn mc-assistant-header-settings",
        "aria-label": t("content.assistant.ui.openSettings"),
        onClick: () => {
          void chrome.runtime.sendMessage({ action: "openOptions" }).catch(() => {
            // Ignore context invalidation during extension reloads.
          });
        },
      }, [
        createContentIcon("settings", {
          className: "mc-icon",
        }) as unknown as HTMLElement,
      ]),
    ]),
  ]);

  const assistantStageBody = createElement("div", {
    className: "mc-assistant-top-panel-stage-body",
  }, [assistantEmptyState, surfaceListEl]);

  const assistantStage = createElement("div", {
    className: "mc-assistant-top-panel-stage",
  }, [assistantHeader, assistantStageBody]);

  const assistantFooter = createElement("div", {
    className: "mc-footer mc-assistant-footer",
  }, [
    createElement("div", { className: "mc-footer-session" }, [
      createElement("span", {
        className: "mc-footer-title",
        textContent: t("content.assistant.ui.footerTitle"),
      }),
      assistantFooterSubtitle,
    ]),
    createElement("div", { className: "mc-footer-stats" }, [
      assistantFooterLiveState,
      assistantFooterCount,
      assistantFooterPending,
      assistantFooterAiAlert,
    ]),
  ]);

  const assistantPanelContent = createElement("div", {
    className: "mc-assistant-top-panel-content",
  }, [assistantStage, assistantFooter]);

  const assistantPanelBody = createElement("div", {
    className: "mc-assistant-top-panel-body",
  }, [assistantPanelContent]);

  assistantPanel = createElement("aside", {
    id: ASSISTANT_PANEL_ID,
    className: "mc-assistant-top-panel",
    role: "region",
    "aria-label": t("content.assistant.ui.panelAriaLabel"),
  }, []);
  setAssistantSurface(assistantPanel);

  assistantPanelShape = createSvgElement("svg");
  assistantPanelShape.classList.add("mc-assistant-top-panel-shape");
  assistantPanelShape.setAttribute("aria-hidden", "true");
  assistantPanelShape.setAttribute("preserveAspectRatio", "none");
  assistantPanelShapeFill = createSvgElement("path");
  assistantPanelShapeFill.classList.add("mc-assistant-top-panel-shape-fill");
  assistantPanelShapeStroke = createSvgElement("path");
  assistantPanelShapeStroke.classList.add("mc-assistant-top-panel-shape-stroke");
  assistantPanelShape.appendChild(assistantPanelShapeFill);
  assistantPanelShape.appendChild(assistantPanelShapeStroke);

  assistantBrandImage = createElement("img", {
    className: "mc-assistant-top-dock-brand-image",
    src: getBrandMarkSrc(),
    alt: t("common.appName"),
    draggable: "false",
  }) as HTMLImageElement;

  assistantDockStatus = createElement("div", {
    className: "mc-assistant-top-dock-status",
    textContent: t("content.assistant.ui.watching"),
  });

  assistantDockDescription = createElement("div", {
    className: "mc-assistant-top-dock-description",
    textContent: t("content.assistant.ui.waitingForMoment"),
  });

  assistantDockUnread = createElement("span", {
    className: "mc-assistant-top-dock-unread",
    textContent: "0",
  });
  assistantDockUnread.style.display = "none";

  assistantDockIssue = createElement(
    "span",
    {
      className: "mc-assistant-top-dock-issue",
      tabindex: "0",
      hidden: true,
    },
    [
      createContentIcon("info", {
        className: "mc-icon mc-assistant-top-dock-issue-icon",
        size: 10,
        strokeWidth: 2,
      }) as unknown as HTMLElement,
    ]
  );

  const resizeHandle = createElement("button", {
    type: "button",
    className: "mc-assistant-top-bottom-handle",
    "aria-label": t("content.assistant.ui.resizePanel"),
    "aria-controls": ASSISTANT_PANEL_ID,
    "aria-expanded": "false",
  }, [
    createContentIcon("chevron-down", {
      className: "mc-assistant-handle-icon mc-assistant-handle-icon-expand",
      size: 16,
      strokeWidth: 2.1,
    }) as unknown as HTMLElement,
    createContentIcon("grip-horizontal", {
      className: "mc-assistant-handle-icon mc-assistant-handle-icon-resize",
      size: 16,
      strokeWidth: 1.9,
    }) as unknown as HTMLElement,
    createContentIcon("chevron-up", {
      className: "mc-assistant-handle-icon mc-assistant-handle-icon-collapse",
      size: 16,
      strokeWidth: 2.1,
    }) as unknown as HTMLElement,
  ]) as HTMLButtonElement;
  assistantBottomHandle = resizeHandle;
  startDockResize(resizeHandle);

  assistantDock = createElement("div", {
    className: "mc-assistant-top-dock",
    "aria-controls": ASSISTANT_PANEL_ID,
  }, [
    createElement("div", { className: "mc-assistant-top-dock-inner" }, [
      createElement("div", {
        className: "mc-brand-mark mc-brand-mark--compact mc-assistant-top-dock-brand",
      }, [
        assistantBrandImage,
      ]),
      createElement("div", { className: "mc-assistant-top-dock-copy" }, [
        createElement("div", { className: "mc-assistant-top-dock-title-row" }, [
          createElement("div", {
            className: "mc-assistant-top-dock-title",
            textContent: t("content.assistant.ui.headerTitle"),
          }),
          assistantDockStatus,
        ]),
        assistantDockDescription,
      ]),
      createElement("div", { className: "mc-assistant-top-dock-controls" }, [
        assistantDockIssue,
        assistantToggleButton,
      ]),
    ]),
  ]);

  assistantPanel.append(
    assistantPanelShape,
    assistantPanelBody,
    assistantDock,
    resizeHandle
  );

  assistantShell = createElement(
    "div",
    {
      id: "captionarc-assistant-top-shell",
      "data-open": "false",
      "data-state": "watching",
      "data-unread": "false",
    },
    [assistantPanel]
  );
  assistantShell.style.visibility = "hidden";

  document.body.appendChild(assistantShell);

  assistantShell.addEventListener(
    "pointerdown",
    () => {
      bringAssistantSurfaceToFront();
    },
    true
  );

  assistantPanel.addEventListener("transitionend", (event) => {
    if (
      event.propertyName !== "transform" ||
      assistantSurfaceOpen ||
      !shouldResetHeightAfterClose
    ) {
      return;
    }

    shouldResetHeightAfterClose = false;
    preserveSoftHeightOnClose = false;
  });

  overlayMutationObserver?.disconnect();
  if (overlay) {
    overlayMutationObserver = new MutationObserver(() => {
      syncAssistantSurfaceTheme();
      syncFloatingSurfaceStacking();
    });
    overlayMutationObserver.observe(overlay, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    const handleOverlayPointerDown = () => {
      bringOverlayToFront();
    };
    overlay.addEventListener("pointerdown", handleOverlayPointerDown, true);
    stopOverlayPointerListener = () => {
      overlay?.removeEventListener(
        "pointerdown",
        handleOverlayPointerDown,
        true
      );
    };
  }

  const handleAssistantUpdate = () => {
    syncAssistantSurfaceState();
  };
  window.addEventListener(ASSISTANT_LIVE_UPDATED_EVENT, handleAssistantUpdate);
  stopAssistantEventListener = () => {
    window.removeEventListener(
      ASSISTANT_LIVE_UPDATED_EVENT,
      handleAssistantUpdate
    );
  };

  window.addEventListener("resize", syncAssistantSurfaceLayout);
  stopAssistantResizeListener = () => {
    window.removeEventListener("resize", syncAssistantSurfaceLayout);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !assistantSurfaceOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      return;
    }

    setDockOpen(false);
  };

  window.addEventListener("keydown", handleKeydown);
  stopAssistantKeydownListener = () => {
    window.removeEventListener("keydown", handleKeydown);
  };

  syncAssistantSurfaceState();
  syncFloatingSurfaceStacking();
}

export function destroyAssistantSurface(): void {
  cancelAssistantHeightAnimation();
  cancelAssistantEnterAnimation();
  stopAssistantEventListener?.();
  stopAssistantEventListener = null;
  stopAssistantResizeListener?.();
  stopAssistantResizeListener = null;
  stopAssistantKeydownListener?.();
  stopAssistantKeydownListener = null;
  stopOverlayPointerListener?.();
  stopOverlayPointerListener = null;
  overlayMutationObserver?.disconnect();
  overlayMutationObserver = null;
  assistantShell?.remove();
  assistantShell = null;
  assistantPanel = null;
  assistantPanelShape = null;
  assistantPanelShapeFill = null;
  assistantPanelShapeStroke = null;
  assistantDock = null;
  assistantDockStatus = null;
  assistantDockDescription = null;
  assistantDockUnread = null;
  assistantDockIssue = null;
  assistantToggleButton = null;
  assistantEmptyState = null;
  assistantBrandImage = null;
  assistantFooterSubtitle = null;
  assistantFooterLiveState = null;
  assistantFooterCount = null;
  assistantFooterPending = null;
  assistantFooterAiAlert = null;
  assistantHeaderBrandImage = null;
  assistantEnterAnimationFrameId = null;
  assistantEnterTimeoutId = null;
  assistantHasEntered = false;
  if (overlay) {
    overlay.style.zIndex = "";
  }
  setAssistantSurface(null);
  setAssistantSurfaceList(null);
}

export function syncAssistantSurface(): void {
  syncAssistantSurfaceState();
}
