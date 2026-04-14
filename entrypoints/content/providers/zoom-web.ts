import {
  captions,
  isCCEnabled,
  setCCEnabled,
  settings,
} from "../state";
import { addOrUpdateCaption, finalizeCaption } from "../caption";
import { closeCaptureGuide, openCaptureGuide } from "../overlay/capture-guide";
import { isSimilarText, isTextGrowing, querySelectorAllDeep } from "../libs";
import { ingestLiveChatEvent } from "../event-ingestion";
import { renderCaptions } from "../render";
import { updateContentDebugState } from "../debug-state";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";
import { getUiRuntimeTranslator } from "../../shared/i18n";
import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingPresenceState, MeetingProvider } from "./types";

const EXPLICIT_TEXT_SELECTOR = ".live-transcription-subtitle__item";

const SPEAKER_SELECTORS = [
  '[data-testid*="speaker"]',
  '[class*="speaker"]',
  '[aria-label*="speaker" i]',
].join(", ");

const TEXT_SELECTORS = [EXPLICIT_TEXT_SELECTOR].join(", ");

const FINALIZE_DELAY = 1500;
const ZOOM_CHAT_REGION_SELECTOR = "#wc-container-right .chat-container__chat-list";
const ZOOM_CHAT_ITEM_SELECTOR = ".chat-item-container[data-id]";
const ZOOM_LIVE_TRANSCRIPTION_ENABLED_PATTERN =
  /^you have turned on live transcription$/i;
const ZOOM_JOINED_SURFACE_SELECTORS = [
  ".meeting-client-inner",
  ".footer__btns-container",
  ".live-transcription-subtitle__box",
  ".live-transcription-subtitle__on-open",
  ZOOM_CHAT_REGION_SELECTOR,
].join(", ");
const ZOOM_JOINED_CONTROL_KEYWORDS = [
  "participants",
  "chat",
  "share",
  "more",
  "captions",
  "reactions",
  "host tools",
] as const;
const ZOOM_CAPTION_OFF_STABILITY_MS = 4000;
const ZOOM_CAPTION_OFF_FAST_STABILITY_MS = 1200;
const ZOOM_CAPTION_MENU_RECENCY_MS = 2500;
const ZOOM_STATE_POLL_INTERVAL_MS = 900;
const SYSTEM_TEXT_PATTERN =
  /^(connecting|local data storage.*|captions will be shown in .+|english \(us\)|you have left the meeting|you left the meeting|joining meeting.*|meeting recording.*)$/i;

let elementToCaptionId = new WeakMap<Element, number>();
let elementLastVisibleText = new WeakMap<Element, string>();
let elementLastSpeaker = new WeakMap<Element, string>();
let elementAccumulatedText = new WeakMap<Element, string>();
const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();
const captionUpdatedAt = new Map<number, number>();
const capturedZoomChatMessageIds = new Set<string>();
let zoomDebugState: Record<string, unknown> = {};
const zoomCaptionStateTrace: Array<Record<string, unknown>> = [];
const zoomDiagnosticsLogger = createDiagnosticsLogger({
  runtime: "content",
  domain: "provider",
  feature: "zoom-caption-pipeline",
  provider: "zoom-web",
});

export function resetZoomWebProviderState(): void {
  for (const timer of finalizationTimers.values()) {
    clearTimeout(timer);
  }
  finalizationTimers.clear();
  captionUpdatedAt.clear();
  capturedZoomChatMessageIds.clear();
  elementToCaptionId = new WeakMap<Element, number>();
  elementLastVisibleText = new WeakMap<Element, string>();
  elementLastSpeaker = new WeakMap<Element, string>();
  elementAccumulatedText = new WeakMap<Element, string>();
  zoomDebugState = {};
  zoomCaptionStateTrace.splice(0, zoomCaptionStateTrace.length);
}

function updateZoomDebugState(patch: Record<string, unknown>): void {
  zoomDebugState = {
    ...zoomDebugState,
    ...patch,
    timestamp: new Date().toISOString(),
  };

  updateContentDebugState({
    zoomDebug: zoomDebugState,
  });
}

function appendZoomCaptionStateTrace(entry: Record<string, unknown>): void {
  void zoomDiagnosticsLogger.trace("caption_state_transition", entry);

  zoomCaptionStateTrace.push({
    ts: new Date().toISOString(),
    ...entry,
  });

  if (zoomCaptionStateTrace.length > 40) {
    zoomCaptionStateTrace.splice(0, zoomCaptionStateTrace.length - 40);
  }

  updateZoomDebugState({
    captionStateTrace: [...zoomCaptionStateTrace],
  });
}

function getZoomWebClientFrameElement(): HTMLIFrameElement | null {
  const frame = document.querySelector("iframe#webclient");
  return frame instanceof HTMLIFrameElement ? frame : null;
}

function getZoomWebClientFrameDocument(): Document | null {
  const frame = getZoomWebClientFrameElement();
  if (!frame) {
    return null;
  }

  try {
    return frame.contentDocument || null;
  } catch {
    return null;
  }
}

function isTopLevelZoomShellContext(
  url: URL = new URL(window.location.href)
): boolean {
  return !isZoomIframeContext() && isZoomTopLevelShellRoute(url);
}

function getZoomMeetingSearchRoots(
  url: URL = new URL(window.location.href)
): ParentNode[] {
  if (isTopLevelZoomShellContext(url)) {
    const frameDocument = getZoomWebClientFrameDocument();
    return frameDocument ? [frameDocument] : [];
  }

  return [document];
}

function queryZoomMeetingSelectorAllDeep(
  selector: string,
  url: URL = new URL(window.location.href)
): Element[] {
  const results = new Set<Element>();

  for (const root of getZoomMeetingSearchRoots(url)) {
    for (const element of querySelectorAllDeep(selector, root)) {
      results.add(element);
    }
  }

  return Array.from(results);
}

function getZoomSearchRootDebugSnapshot(
  url: URL = new URL(window.location.href)
): Record<string, unknown> {
  const frame = getZoomWebClientFrameElement();
  const frameDocument = getZoomWebClientFrameDocument();
  const roots = getZoomMeetingSearchRoots(url);

  return {
    topHref: window.location.href,
    routePath: url.pathname,
    isIframeContext: isZoomIframeContext(),
    isTopLevelShell: isTopLevelZoomShellContext(url),
    framePresent: Boolean(frame),
    frameSrc: frame?.src || null,
    frameDocumentPresent: Boolean(frameDocument),
    frameDocumentUrl: frameDocument?.URL || null,
    rootCount: roots.length,
    rootKinds: roots.map((root) =>
      root instanceof Document
        ? {
            kind: "document",
            url: root.URL || null,
            readyState: root.readyState || null,
            bodyChildCount: root.body?.children.length ?? null,
          }
        : {
            kind: root.nodeName,
          }
    ),
    selectorCounts: {
      subtitleItems: getExplicitSubtitleItems().length,
      subtitleBox: queryZoomMeetingSelectorAllDeep(".live-transcription-subtitle__box", url)
        .length,
      subtitleBanner: queryZoomMeetingSelectorAllDeep(
        ".live-transcription-subtitle__on-open",
        url
      ).length,
      menus: queryZoomMeetingSelectorAllDeep('[role="menu"], .tip-wrapper', url)
        .length,
      chatRegion: queryZoomMeetingSelectorAllDeep(ZOOM_CHAT_REGION_SELECTOR, url).length,
      chatItems: queryZoomMeetingSelectorAllDeep(ZOOM_CHAT_ITEM_SELECTOR, url).length,
    },
  };
}

function getZoomMeetingBody(
  url: URL = new URL(window.location.href)
): HTMLElement | null {
  const root = getZoomMeetingSearchRoots(url)[0];
  if (!root) {
    return null;
  }

  if (root.nodeType === Node.DOCUMENT_NODE) {
    return (root as Document).body;
  }

  const ownerView =
    root instanceof Element ? root.ownerDocument?.defaultView : null;
  const HTMLElementCtor = ownerView?.HTMLElement;
  if (HTMLElementCtor && root instanceof HTMLElementCtor) {
    return root as HTMLElement;
  }

  return null;
}

function buildZoomCaptionMetadata(
  entry: Element,
  speaker: string
): Record<string, string | boolean> {
  const subtitleContainer = getSubtitleContainer(entry);
  const avatarSrc =
    subtitleContainer?.querySelector("img")?.getAttribute("src") || "";

  return {
    domShape:
      isOwnRealmHTMLElement(entry) && entry.matches(EXPLICIT_TEXT_SELECTOR)
        ? "live-transcription-subtitle__item"
        : "zoom-caption-entry",
    entryClass: entry.className || "",
    subtitleContainerClass: subtitleContainer?.className || "",
    usedAvatarSpeakerResolution: Boolean(avatarSrc && speaker !== "Unknown"),
    hasSubtitleContainer: subtitleContainer !== null,
  };
}

function isOwnRealmHTMLElement(element: Element | null | undefined): element is HTMLElement {
  if (!element) {
    return false;
  }

  const ownerView = element.ownerDocument?.defaultView || window;
  const HTMLElementCtor = ownerView.HTMLElement;
  return Boolean(HTMLElementCtor && element instanceof HTMLElementCtor);
}

function isOwnRealmHTMLImageElement(
  element: Element | null | undefined
): element is HTMLImageElement {
  if (!element) {
    return false;
  }

  const ownerView = element.ownerDocument?.defaultView || window;
  const HTMLImageElementCtor = ownerView.HTMLImageElement;
  return Boolean(HTMLImageElementCtor && element instanceof HTMLImageElementCtor);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeZoomSpeaker(rawSpeaker: string): string {
  const normalized = normalizeWhitespace(rawSpeaker)
    .replace(/\s*,?\s*computer audio unmuted.*$/i, "")
    .replace(/\s*,?\s*computer audio muted.*$/i, "")
    .replace(/\s*,?\s*audio unmuted.*$/i, "")
    .replace(/\s*,?\s*audio muted.*$/i, "")
    .replace(/\s*,?\s*video off.*$/i, "")
    .replace(/\s*,?\s*video on.*$/i, "")
    .replace(/\s*\((host|me|host,\s*me)\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim()
    .replace(/[,\s]+$/g, "");

  return normalized || "Unknown";
}

function isOwnZoomSpeakerLabel(rawSpeaker: string | null | undefined): boolean {
  const normalized = normalizeWhitespace(rawSpeaker || "");
  if (!normalized) {
    return false;
  }

  return (
    /^you$/i.test(normalized) ||
    /\((host,\s*)?me\)/i.test(normalized) ||
    /(^|,\s*)you\b/i.test(normalized)
  );
}

function isInsideExtension(element: Element): boolean {
  return element.closest("#captionarc-overlay") !== null;
}

function isVisibleElement(element: Element): boolean {
  const ownerView = element.ownerDocument?.defaultView || window;
  const HTMLElementCtor = ownerView.HTMLElement;
  if (!(element instanceof HTMLElementCtor)) {
    return false;
  }

  const style = ownerView.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function getZoomCaptionToggleIntent(
  target: EventTarget | null
): "show" | "hide" | null {
  if (!target || typeof target !== "object") {
    return null;
  }

  const targetNode = target as { nodeType?: number; parentElement?: Element | null };
  const baseElement =
    targetNode.nodeType === Node.ELEMENT_NODE
      ? (target as Element)
      : targetNode.parentElement || null;
  if (!baseElement) {
    return null;
  }

  const ownerView = baseElement.ownerDocument?.defaultView || window;
  const HTMLElementCtor = ownerView.HTMLElement;

  let current: Element | null = baseElement;
  for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
    if (!(current instanceof HTMLElementCtor)) {
      continue;
    }

    const text = normalizeWhitespace(
      [
        current.textContent || "",
        current.getAttribute("aria-label") || "",
        current.getAttribute("title") || "",
        current.getAttribute("data-name") || "",
      ].join(" ")
    );

    if (/(^|\s)hide captions(\s|$)/i.test(text)) {
      return "hide";
    }

    if (/(^|\s)show captions(\s|$)/i.test(text)) {
      return "show";
    }
  }

  return null;
}

function summarizeZoomDebugElement(element: Element): Record<string, unknown> {
  const ownerView = element.ownerDocument?.defaultView || window;
  const HTMLElementCtor = ownerView.HTMLElement;
  const style =
    element instanceof HTMLElementCtor ? ownerView.getComputedStyle(element) : null;
  const rect =
    element instanceof HTMLElementCtor ? element.getBoundingClientRect() : null;
  const text = normalizeWhitespace(element.textContent || "");

  return {
    tag: element.tagName,
    id: element.id || "",
    className: element.className || "",
    visible: isVisibleElement(element),
    text: text.slice(0, 240),
    hasShowCaptions: /(^|\s)show captions(\s|$)/i.test(text),
    hasHideCaptions: /(^|\s)hide captions(\s|$)/i.test(text),
    display: style?.display || null,
    visibility: style?.visibility || null,
    opacity: style?.opacity || null,
    rect: rect
      ? {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
        }
      : null,
  };
}

function getZoomCaptionSignalDebugSnapshot(): Record<string, unknown> {
  const menuCandidates = queryZoomMeetingSelectorAllDeep('[role="menu"], .tip-wrapper')
    .slice(0, 8)
    .map((element) => summarizeZoomDebugElement(element));

  const bannerCandidates = queryZoomMeetingSelectorAllDeep(
    ".live-transcription-subtitle__box, .live-transcription-subtitle__on-open"
  )
    .slice(0, 8)
    .map((element) => summarizeZoomDebugElement(element));

  const controlCandidates = queryZoomMeetingSelectorAllDeep(
    [
      '[aria-label*="caption" i]',
      '[aria-label*="subtitle" i]',
      '[aria-label*="transcription" i]',
      '[title*="caption" i]',
      '[title*="subtitle" i]',
    ].join(", ")
  )
    .filter((element) => !isInsideExtension(element))
    .slice(0, 12)
    .map((element) => summarizeZoomDebugElement(element));

  return {
    menuCandidates,
    bannerCandidates,
    controlCandidates,
  };
}

function isLikelyCaptionText(text: string): boolean {
  return text.length >= 2 && text.length <= 260;
}

function isLikelySystemMessage(text: string): boolean {
  return SYSTEM_TEXT_PATTERN.test(text);
}

function isLikelySpeakerCandidateText(text: string): boolean {
  const normalized = normalizeWhitespace(text);
  if (!normalized || normalized.length < 2 || normalized.length > 80) {
    return false;
  }

  if (isLikelySystemMessage(normalized)) {
    return false;
  }

  if (!/[a-z]/i.test(normalized)) {
    return false;
  }

  if (/[.!?]$/.test(normalized)) {
    return false;
  }

  return normalized.split(/\s+/).length <= 8;
}

function hasZoomLiveTranscriptionEnabledBanner(): boolean {
  return queryZoomMeetingSelectorAllDeep(
    ".live-transcription-subtitle__box, .live-transcription-subtitle__on-open"
  ).some((element) => {
    if (isInsideExtension(element) || !isVisibleElement(element)) {
      return false;
    }

    const text = normalizeWhitespace(element.textContent || "");
    return ZOOM_LIVE_TRANSCRIPTION_ENABLED_PATTERN.test(text);
  });
}

function hasZoomOpenCaptionsMenuEnabledState(): boolean {
  return queryZoomMeetingSelectorAllDeep('[role="menu"], .tip-wrapper').some((element) => {
    if (isInsideExtension(element) || !isVisibleElement(element)) {
      return false;
    }

    const text = normalizeWhitespace(element.textContent || "");
    return /(^|\s)hide captions(\s|$)/i.test(text);
  });
}

function hasZoomOpenCaptionsMenuDisabledState(): boolean {
  return queryZoomMeetingSelectorAllDeep('[role="menu"], .tip-wrapper').some((element) => {
    if (isInsideExtension(element) || !isVisibleElement(element)) {
      return false;
    }

    const text = normalizeWhitespace(element.textContent || "");
    return (
      /(^|\s)show captions(\s|$)/i.test(text) &&
      !/(^|\s)hide captions(\s|$)/i.test(text)
    );
  });
}

function collectZoomControlText(element: Element): string {
  return normalizeWhitespace(
    [
      element.textContent || "",
      element.getAttribute("aria-label") || "",
      element.getAttribute("title") || "",
      element.getAttribute("data-name") || "",
    ].join(" ")
  ).toLowerCase();
}

function hasZoomJoinedToolbarControls(
  url: URL = new URL(window.location.href)
): boolean {
  const matchedKeywords = new Set<string>();

  queryZoomMeetingSelectorAllDeep(
    'button, [role="button"], a[role="button"], .footer-button-base__button',
    url
  )
    .filter((element) => !isInsideExtension(element) && isVisibleElement(element))
    .forEach((element) => {
      const text = collectZoomControlText(element);
      for (const keyword of ZOOM_JOINED_CONTROL_KEYWORDS) {
        if (text.includes(keyword)) {
          matchedKeywords.add(keyword);
        }
      }
    });

  return matchedKeywords.size >= 2;
}

function hasZoomJoinedMeetingSurface(
  url: URL = new URL(window.location.href)
): boolean {
  const hasCaptionSurface =
    getExplicitSubtitleItems().length > 0 ||
    hasZoomLiveTranscriptionEnabledBanner() ||
    hasZoomOpenCaptionsMenuEnabledState() ||
    hasZoomOpenCaptionsMenuDisabledState();
  const hasJoinedShell = queryZoomMeetingSelectorAllDeep(
    ZOOM_JOINED_SURFACE_SELECTORS,
    url
  ).some((element) => !isInsideExtension(element) && isVisibleElement(element));

  return hasCaptionSurface || hasJoinedShell || hasZoomJoinedToolbarControls(url);
}

function isZoomCaptioningSurfaceAvailable(): boolean {
  const hasExplicitSubtitleText = getExplicitSubtitleItems().some((item) => {
    if (isInsideExtension(item) || !isVisibleElement(item)) {
      return false;
    }

    const text = normalizeWhitespace(item.textContent || "");
    return Boolean(text) && !isLikelySystemMessage(text);
  });

  return (
    hasExplicitSubtitleText ||
    hasZoomLiveTranscriptionEnabledBanner() ||
    hasZoomOpenCaptionsMenuEnabledState()
  );
}

function rememberCaptionUpdate(captionId: number): void {
  captionUpdatedAt.set(captionId, Date.now());
}

function cleanupCaptionUpdate(captionId: number): void {
  captionUpdatedAt.delete(captionId);
}

function getOverlapLength(previousText: string, nextText: string): number {
  const maxLength = Math.min(previousText.length, nextText.length);

  for (let length = maxLength; length > 0; length -= 1) {
    if (previousText.slice(-length) === nextText.slice(0, length)) {
      return length;
    }
  }

  return 0;
}

function resolveZoomTextTransition(
  previousText: string,
  nextText: string
): { mode: "update" | "replace"; text: string } {
  if (!previousText) {
    return { mode: "replace", text: nextText };
  }

  if (nextText.startsWith(previousText)) {
    return { mode: "update", text: nextText };
  }

  if (nextText.includes(previousText) && nextText.length > previousText.length) {
    return { mode: "update", text: nextText };
  }

  if (isTextGrowing(previousText, nextText) || isSimilarText(previousText, nextText)) {
    return { mode: "update", text: nextText };
  }

  const overlapLength = getOverlapLength(previousText, nextText);
  if (overlapLength >= 8) {
    const deltaText = normalizeWhitespace(nextText.slice(overlapLength));
    return {
      mode: "replace",
      text: deltaText || nextText,
    };
  }

  return { mode: "replace", text: nextText };
}

function extractZoomDeltaText(
  previousVisibleText: string,
  nextVisibleText: string
): string {
  const previousText = normalizeWhitespace(previousVisibleText);
  const nextText = normalizeWhitespace(nextVisibleText);

  if (!previousText) {
    return nextText;
  }

  if (previousText === nextText) {
    return "";
  }

  if (nextText.startsWith(previousText)) {
    return normalizeWhitespace(nextText.slice(previousText.length));
  }

  if (previousText.includes(nextText)) {
    return "";
  }

  if (nextText.includes(previousText)) {
    const startIndex = nextText.indexOf(previousText) + previousText.length;
    return normalizeWhitespace(nextText.slice(startIndex));
  }

  const overlapLength = getOverlapLength(previousText, nextText);
  if (overlapLength >= 4) {
    return normalizeWhitespace(nextText.slice(overlapLength));
  }

  return nextText;
}

function mergeZoomRollingTranscript(
  accumulatedText: string,
  previousVisibleText: string,
  nextVisibleText: string
): string {
  const normalizedAccumulated = normalizeWhitespace(accumulatedText);
  const normalizedPreviousVisible = normalizeWhitespace(previousVisibleText);
  const normalizedNextVisible = normalizeWhitespace(nextVisibleText);

  if (!normalizedAccumulated) {
    return normalizedNextVisible;
  }

  if (!normalizedPreviousVisible || normalizedPreviousVisible === normalizedNextVisible) {
    return normalizedAccumulated;
  }

  if (normalizedAccumulated.endsWith(normalizedNextVisible)) {
    return normalizedAccumulated;
  }

  if (normalizedPreviousVisible.includes(normalizedNextVisible)) {
    return normalizedAccumulated;
  }

  if (normalizedNextVisible.includes(normalizedPreviousVisible)) {
    const startIndex =
      normalizedNextVisible.indexOf(normalizedPreviousVisible) +
      normalizedPreviousVisible.length;
    const deltaText = normalizeWhitespace(normalizedNextVisible.slice(startIndex));
    return deltaText
      ? normalizeWhitespace(`${normalizedAccumulated} ${deltaText}`)
      : normalizedAccumulated;
  }

  const overlapLength = getOverlapLength(normalizedPreviousVisible, normalizedNextVisible);
  if (overlapLength >= 6) {
    const deltaText = normalizeWhitespace(normalizedNextVisible.slice(overlapLength));
    return deltaText
      ? normalizeWhitespace(`${normalizedAccumulated} ${deltaText}`)
      : normalizedAccumulated;
  }

  if (
    isTextGrowing(normalizedPreviousVisible, normalizedNextVisible) ||
    isSimilarText(normalizedPreviousVisible, normalizedNextVisible)
  ) {
    const suffixGuess = normalizeWhitespace(
      normalizedNextVisible.slice(normalizedPreviousVisible.length)
    );

    return suffixGuess
      ? normalizeWhitespace(`${normalizedAccumulated} ${suffixGuess}`)
      : normalizedAccumulated;
  }

  return normalizeWhitespace(`${normalizedAccumulated} ${normalizedNextVisible}`);
}

function isShortContinuationText(text: string): boolean {
  if (text.length <= 24) {
    return true;
  }

  if (/^[a-z]/.test(text)) {
    return true;
  }

  return /^(and|but|or|so|because|then|okay|ok|yes|no|yeah|uh|um|hmm|mm-hmm)\b/i.test(
    text
  );
}

function hasTerminalPunctuation(text: string): boolean {
  return /[.!?]["')\]]?$/.test(text.trim());
}

function mergeRollingTexts(previousText: string, nextText: string): string {
  if (!previousText) {
    return nextText;
  }

  if (previousText.includes(nextText)) {
    return previousText;
  }

  if (nextText.includes(previousText)) {
    return nextText;
  }

  const overlapLength = getOverlapLength(previousText, nextText);
  if (overlapLength >= 1) {
    return normalizeWhitespace(previousText + nextText.slice(overlapLength));
  }

  return normalizeWhitespace(`${previousText} ${nextText}`);
}

function shouldMergeIntoExistingCaption(
  previousText: string,
  nextText: string
): boolean {
  if (isSimilarText(previousText, nextText) || isTextGrowing(previousText, nextText)) {
    return true;
  }

  if (isShortContinuationText(nextText)) {
    return true;
  }

  if (!hasTerminalPunctuation(previousText)) {
    return true;
  }

  const overlapLength = getOverlapLength(previousText, nextText);
  return overlapLength >= 8;
}

function getExplicitSubtitleItems(): Element[] {
  return queryZoomMeetingSelectorAllDeep(EXPLICIT_TEXT_SELECTOR).filter(
    (item) =>
      !isInsideExtension(item) &&
      isVisibleElement(item) &&
      normalizeWhitespace(item.textContent || "").length > 0
  );
}

function getZoomChatRegion(): HTMLElement | null {
  const region = queryZoomMeetingSelectorAllDeep(ZOOM_CHAT_REGION_SELECTOR).find(
    (item) => !isInsideExtension(item) && isVisibleElement(item)
  );

  if (!region) {
    return null;
  }

  const ownerView = region.ownerDocument?.defaultView || window;
  const HTMLElementCtor = ownerView.HTMLElement;
  return region instanceof HTMLElementCtor ? region : null;
}

function getZoomChatEntries(region: Element): HTMLElement[] {
  return Array.from(region.querySelectorAll<HTMLElement>(ZOOM_CHAT_ITEM_SELECTOR)).filter(
    (item) =>
      !isInsideExtension(item) &&
      isVisibleElement(item) &&
      Boolean(item.getAttribute("data-id")?.trim())
  );
}

function extractZoomChatMessageId(entry: Element): string | null {
  const explicitId = entry.getAttribute("data-id")?.trim();
  if (explicitId) {
    return explicitId;
  }

  const contentId = entry
    .querySelector(".new-chat-message__container")
    ?.getAttribute("id")
    ?.trim();

  return contentId || null;
}

function extractZoomChatMessageText(entry: Element): string {
  const richText = normalizeWhitespace(
    entry.querySelector("._rtfEditor_1n3rs_1")?.textContent || ""
  );
  if (richText) {
    return richText;
  }

  const textBox = normalizeWhitespace(
    entry.querySelector(".new-chat-message__text-box")?.textContent || ""
  );

  return textBox;
}

function extractZoomChatSpeaker(entry: Element): string {
  const explicitSpeaker =
    entry.querySelector(".chat-item__sender")?.getAttribute("data-name") ||
    entry.querySelector(".chat-item__sender")?.getAttribute("title") ||
    entry.querySelector(".chat-item__sender")?.textContent ||
    "";

  const normalizedExplicitSpeaker = normalizeZoomSpeaker(explicitSpeaker);
  if (normalizedExplicitSpeaker && normalizedExplicitSpeaker !== "Unknown") {
    return normalizedExplicitSpeaker;
  }

  const ariaLabel = normalizeWhitespace(
    entry.querySelector(".new-chat-message__container")?.getAttribute("aria-label") || ""
  );
  const ariaSpeakerMatch = ariaLabel.match(/^(.+?)\s+to\s+.+?,\s+.+$/i);
  if (ariaSpeakerMatch?.[1]) {
    const normalizedAriaSpeaker = normalizeZoomSpeaker(ariaSpeakerMatch[1]);
    if (normalizedAriaSpeaker && normalizedAriaSpeaker !== "Unknown") {
      return normalizedAriaSpeaker;
    }
  }

  return "Unknown";
}

function extractZoomChatTime(entry: Element): string {
  return (
    normalizeWhitespace(
      entry.querySelector(".new-chat-item__chat-info-time-stamp")?.textContent || ""
    ) || new Date().toLocaleTimeString()
  );
}

function isOwnZoomChatMessage(entry: Element, speaker: string): boolean {
  if (speaker === "You") {
    return true;
  }

  if (entry.querySelector(".new-chat-message__text-box--self")) {
    return true;
  }

  const ariaLabel = entry
    .querySelector(".new-chat-message__container")
    ?.getAttribute("aria-label");

  return /(^|,\s*)You\b/i.test(ariaLabel || "");
}

function extractChatMessages(): void {
  if (!settings.storeMeetingChat) {
    updateZoomDebugState({
      chatDebug: {
        stage: "skip-store-disabled",
        storeMeetingChat: settings.storeMeetingChat,
      },
    });
    return;
  }

  const region = getZoomChatRegion();
  if (!region) {
    updateZoomDebugState({
      chatDebug: {
        stage: "no-region",
        storeMeetingChat: settings.storeMeetingChat,
      },
    });
    return;
  }

  const entries = getZoomChatEntries(region);
  if (entries.length === 0) {
    updateZoomDebugState({
      chatDebug: {
        stage: "no-entries",
        storeMeetingChat: settings.storeMeetingChat,
      },
    });
    return;
  }

  let addedCount = 0;
  entries.forEach((entry, index) => {
    const messageId = extractZoomChatMessageId(entry);
    if (!messageId || capturedZoomChatMessageIds.has(messageId)) {
      return;
    }

    const text = extractZoomChatMessageText(entry);
    if (!text) {
      return;
    }

    const speaker = extractZoomChatSpeaker(entry);
    const timestamp = Date.now() + index;
    capturedZoomChatMessageIds.add(messageId);
    ingestLiveChatEvent({
      speaker,
      text,
      time: extractZoomChatTime(entry),
      timestamp,
      historyTimestamp: timestamp,
      own: isOwnZoomChatMessage(entry, speaker),
      providerEventId: messageId,
    });
    addedCount += 1;
  });

  updateZoomDebugState({
    chatDebug: {
      stage: "processed",
      storeMeetingChat: settings.storeMeetingChat,
      regionFound: true,
      entryCount: entries.length,
      addedCount,
      visibleSample: normalizeWhitespace(entries[0]?.textContent || "").slice(0, 200),
    },
  });
}

function syncZoomChatCapture(): void {
  if (!settings.storeMeetingChat) {
    return;
  }

  extractChatMessages();
}

function getCaptionEntries(): Element[] {
  return getExplicitSubtitleItems();
}

function getSubtitleContainer(entry: Element): Element | null {
  return (
    entry.closest("#live-transcription-subtitle") ||
    entry.closest(".live-transcription-subtitle__box")
  );
}

function getEntrySpeakerFallback(entry: Element): string | undefined {
  const entrySpeaker = elementLastSpeaker.get(entry);
  if (entrySpeaker && entrySpeaker !== "Unknown") {
    return entrySpeaker;
  }

  return undefined;
}

function extractShortTextCandidates(container: Element): string[] {
  const lines = normalizeWhitespace(container.textContent || "")
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const descendants = Array.from(container.querySelectorAll("*"))
    .map((node) => normalizeWhitespace(node.textContent || ""))
    .filter(Boolean);

  return Array.from(new Set([...lines, ...descendants])).filter(
    (text) => isLikelySpeakerCandidateText(text)
  );
}

function extractZoomSpeakerFromAvatar(entry: Element): string | undefined {
  const subtitleContainer = getSubtitleContainer(entry);
  const avatarSrc =
    subtitleContainer?.querySelector("img")?.getAttribute("src") || "";

  if (!avatarSrc) {
    return undefined;
  }

  const matchingImages = queryZoomMeetingSelectorAllDeep("img")
    .filter((node) => isOwnRealmHTMLImageElement(node))
    .filter((image) => image.getAttribute("src") === avatarSrc)
    .filter((image) => !subtitleContainer?.contains(image));

  for (const image of matchingImages) {
    const avatarRoot = image.closest(".video-avatar__avatar");
    if (avatarRoot) {
      const avatarText = normalizeWhitespace(avatarRoot.textContent || "");
      if (isLikelySpeakerCandidateText(avatarText)) {
        return normalizeZoomSpeaker(avatarText);
      }
    }

    let current: Element | null = image;
    let depth = 0;

    while (current && depth < 5) {
      const ariaLabel = normalizeWhitespace(
        current.getAttribute("aria-label") || ""
      );
      if (
        ariaLabel &&
        isLikelySpeakerCandidateText(ariaLabel) &&
        !/^(participant|video|audio|mute|unmute)$/i.test(ariaLabel)
      ) {
        return normalizeZoomSpeaker(ariaLabel);
      }

      const candidates = extractShortTextCandidates(current);
      const speakerCandidate = candidates.find(
        (candidate) =>
          isLikelySpeakerCandidateText(candidate) &&
          candidate.length <= 60 &&
          candidate.split(" ").length <= 6
      );

      if (speakerCandidate) {
        return normalizeZoomSpeaker(speakerCandidate);
      }

      current = current.parentElement;
      depth += 1;
    }
  }

  return undefined;
}

function extractSpeakerAndText(
  entry: Element
): { speaker: string; text: string; own: boolean } | null {
  if (isOwnRealmHTMLElement(entry) && entry.matches(EXPLICIT_TEXT_SELECTOR)) {
    const directText = normalizeWhitespace(entry.textContent || "");
    if (!directText || !isLikelyCaptionText(directText)) {
      return null;
    }

    const rawAvatarSpeaker = extractZoomSpeakerFromAvatar(entry) || "Unknown";
    const avatarSpeaker = normalizeZoomSpeaker(rawAvatarSpeaker);
    const resolvedSpeaker =
      avatarSpeaker !== "Unknown"
        ? avatarSpeaker
        : getEntrySpeakerFallback(entry) || "Unknown";

    return {
      speaker: resolvedSpeaker,
      text: directText,
      own: isOwnZoomSpeakerLabel(rawAvatarSpeaker) || resolvedSpeaker === "You",
    };
  }

  const explicitSpeakerRaw = entry.querySelector(SPEAKER_SELECTORS)?.textContent || "";
  const explicitSpeaker = normalizeZoomSpeaker(explicitSpeakerRaw);

  const visibleLines =
    isOwnRealmHTMLElement(entry)
      ? entry.innerText
          .split("\n")
          .map((line) => normalizeWhitespace(line))
          .filter(Boolean)
      : [];

  const candidateTexts = Array.from(
    new Set(
      Array.from(entry.querySelectorAll(TEXT_SELECTORS))
        .map((node) => normalizeWhitespace(node.textContent || ""))
        .concat(visibleLines)
        .filter(Boolean)
    )
  ).filter((text) => isLikelyCaptionText(text) && text !== explicitSpeaker);

  if (explicitSpeaker && candidateTexts.length > 0) {
    return {
      speaker: explicitSpeaker,
      text: candidateTexts[0],
      own: isOwnZoomSpeakerLabel(explicitSpeakerRaw) || explicitSpeaker === "You",
    };
  }

  const fullText = normalizeWhitespace(entry.textContent || "");
  const inlineSpeaker = fullText.match(/^([^:]{1,60}):\s+(.+)$/);
  if (inlineSpeaker) {
    return {
      speaker: inlineSpeaker[1].trim(),
      text: inlineSpeaker[2].trim(),
      own: isOwnZoomSpeakerLabel(inlineSpeaker[1]) || /^you$/i.test(inlineSpeaker[1].trim()),
    };
  }

  const text = candidateTexts[0] || fullText;
  if (!isLikelyCaptionText(text)) {
    return null;
  }

  return {
    speaker:
      explicitSpeaker ||
      getEntrySpeakerFallback(entry) ||
      "Unknown",
    text,
    own: isOwnZoomSpeakerLabel(explicitSpeakerRaw) || explicitSpeaker === "You",
  };
}

function normalizeZoomTitle(rawTitle: string): string | undefined {
  const title = rawTitle
    .replace(/\s*-\s*Zoom\s*$/i, "")
    .replace(/\s*\|\s*Zoom\s*$/i, "")
    .trim();

  if (!title) {
    return undefined;
  }

  if (/^zoom$/i.test(title) || /^zoom meeting$/i.test(title)) {
    return undefined;
  }

  return title || undefined;
}

function extractZoomMeetingNumber(url: URL): string | undefined {
  const pathMatch = url.pathname.match(
    /^\/(?:wc\/(\d+)\/(?:start|join)|wc\/join\/(\d+)|j\/(\d+)|w\/(\d+))(?:\/|$)/
  );
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }
  if (pathMatch?.[2]) {
    return pathMatch[2];
  }
  if (pathMatch?.[3]) {
    return pathMatch[3];
  }
  if (pathMatch?.[4]) {
    return pathMatch[4];
  }

  const confno = url.searchParams.get("confno");
  return confno || undefined;
}

function extractZoomMeetingId(url: URL): string | undefined {
  const meetingId =
    url.searchParams.get("mn") ||
    url.searchParams.get("mid") ||
    url.searchParams.get("meetingId");

  if (meetingId) {
    return meetingId;
  }

  return extractZoomMeetingNumber(url);
}

function extractZoomFallbackIdentifier(): string | undefined {
  const title = normalizeZoomTitle(document.title || "");
  if (title) {
    return title;
  }

  const participantLabel = normalizeWhitespace(
    queryZoomMeetingSelectorAllDeep('[aria-label*="participant" i]')[0]?.getAttribute("aria-label") ||
      queryZoomMeetingSelectorAllDeep('[class*="participant"]')[0]?.textContent ||
      ""
  );

  return participantLabel || undefined;
}

function isZoomIframeContext(): boolean {
  return window.top !== window;
}

function hasZoomWebClientFrame(): boolean {
  return getZoomWebClientFrameElement() !== null;
}

function isZoomSupportedRoute(url: URL): boolean {
  return (
    url.hostname.endsWith(".zoom.us") &&
    (/^\/wc\/\d+\/(?:start|join)(?:\/|$)/.test(url.pathname) ||
      /^\/wc\/join\/\d+(?:\/|$)/.test(url.pathname) ||
      /^\/j\/\d+(?:\/|$)/.test(url.pathname) ||
      /^\/w\/\d+(?:\/|$)/.test(url.pathname))
  );
}

function isZoomHomeShellRoute(url: URL): boolean {
  return /^\/wc\/home(?:\/|$)/.test(url.pathname);
}

function isZoomWebClientShellRoute(url: URL): boolean {
  return (
    /^\/wc\/\d+\/(?:start|join)(?:\/|$)/.test(url.pathname) ||
    /^\/wc\/join\/\d+(?:\/|$)/.test(url.pathname)
  );
}

function isZoomTopLevelShellRoute(url: URL): boolean {
  return isZoomWebClientShellRoute(url) || isZoomHomeShellRoute(url);
}

function shouldActivateZoomProvider(url: URL): boolean {
  const isMeetingRoute = isZoomSupportedRoute(url);
  const isHomeShell = isZoomHomeShellRoute(url);
  const isMatchingPath = isMeetingRoute || isHomeShell;

  if (!isMatchingPath) {
    return false;
  }

  if (isHomeShell) {
    if (isZoomIframeContext()) {
      return false;
    }

    // Zoom dashboard route (`/wc/home`) should only activate when the embedded
    // webclient iframe is currently hosting an actual meeting route.
    return isZoomSupportedRoute(getZoomEffectiveMeetingUrl(url));
  }

  if (isZoomTopLevelShellRoute(url)) {
    return !isZoomIframeContext();
  }

  if (isZoomIframeContext()) {
    return isZoomMeetingContext(url);
  }

  // In Zoom PWA/app shell, the actual meeting surface usually lives inside
  // iframe#webclient. Avoid initializing the overlay in the top document.
  if (hasZoomWebClientFrame()) {
    return false;
  }

  return true;
}

function isZoomMeetingContext(url: URL): boolean {
  if (isTopLevelZoomShellContext(url) && !getZoomWebClientFrameDocument()) {
    return false;
  }

  const title = normalizeZoomTitle(document.title || "");
  // In top-level Zoom shell routes, generic titles (for example "Home") are noisy.
  const hasMeetingTitle = !isTopLevelZoomShellContext(url) && Boolean(title);

  const hasCaptionControls =
    queryZoomMeetingSelectorAllDeep('[aria-label*="caption" i]', url).length > 0 ||
    queryZoomMeetingSelectorAllDeep('[aria-label*="subtitle" i]', url).length > 0 ||
    queryZoomMeetingSelectorAllDeep('[aria-label*="transcript" i]', url).length > 0;
  const hasMeetingChrome = hasZoomJoinedMeetingSurface(url);
  const hasExplicitCaptions = getExplicitSubtitleItems().length > 0;

  if (
    /^\/wc\/\d+\/(?:start|join)(?:\/|$)/.test(url.pathname) ||
    /^\/wc\/join\/\d+(?:\/|$)/.test(url.pathname) ||
    /^\/j\/\d+(?:\/|$)/.test(url.pathname)
  ) {
    return true;
  }

  return hasExplicitCaptions || hasCaptionControls || hasMeetingChrome || hasMeetingTitle;
}

function getZoomEffectiveMeetingUrl(
  url: URL = new URL(window.location.href)
): URL {
  if (isZoomSupportedRoute(url)) {
    return url;
  }

  if (!isTopLevelZoomShellContext(url)) {
    return url;
  }

  const frame = getZoomWebClientFrameElement();
  const frameSrc = frame?.getAttribute("src")?.trim() || "";
  if (frameSrc) {
    try {
      const parsedFrameSrc = new URL(frameSrc, window.location.href);
      if (isZoomSupportedRoute(parsedFrameSrc)) {
        return parsedFrameSrc;
      }
    } catch {
      // Ignore malformed frame src.
    }
  }

  const frameDocument = getZoomWebClientFrameDocument();
  const frameUrl = frameDocument?.URL || "";
  if (frameUrl) {
    try {
      const parsedFrameUrl = new URL(frameUrl, window.location.href);
      if (isZoomSupportedRoute(parsedFrameUrl)) {
        return parsedFrameUrl;
      }
    } catch {
      // Ignore malformed frame URL.
    }
  }

  return url;
}

function getZoomMeetingPresence(url: URL): MeetingPresenceState {
  if (!shouldActivateZoomProvider(url)) {
    return "unknown";
  }

  if (isTopLevelZoomShellContext(url) && !getZoomWebClientFrameDocument()) {
    return "unknown";
  }

  if (hasZoomJoinedMeetingSurface(url)) {
    return "joined";
  }

  return isZoomMeetingContext(url) ? "prejoin" : "unknown";
}

function scheduleFinalization(captionId: number): void {
  cancelFinalization(captionId);

  const timer = setTimeout(() => {
    finalizationTimers.delete(captionId);
    const caption = captions.find((item) => item.id === captionId);
    if (caption) {
      finalizeCaption(captionId);
    }
  }, FINALIZE_DELAY);

  finalizationTimers.set(captionId, timer);
}

function cancelFinalization(captionId: number): void {
  const timer = finalizationTimers.get(captionId);
  if (!timer) {
    return;
  }

  clearTimeout(timer);
  finalizationTimers.delete(captionId);
  cleanupCaptionUpdate(captionId);
}

function finalizePendingCaptions(): void {
  const pendingIds = Array.from(finalizationTimers.keys());
  for (const captionId of pendingIds) {
    cancelFinalization(captionId);
    finalizeCaption(captionId);
  }
}

function getLatestCaptionForSpeaker(
  speaker: string,
  excludeCaptionId?: number
): (typeof captions)[number] | null {
  for (let index = captions.length - 1; index >= 0; index -= 1) {
    const caption = captions[index];
    if (caption.speaker !== speaker) {
      continue;
    }

    if (excludeCaptionId !== undefined && caption.id === excludeCaptionId) {
      continue;
    }

    return caption;
  }

  return null;
}

function deriveNextCaptionTextForSpeaker(
  speaker: string,
  visibleText: string,
  excludeCaptionId?: number
): string {
  const latestSpeakerCaption = getLatestCaptionForSpeaker(speaker, excludeCaptionId);
  if (!latestSpeakerCaption) {
    return visibleText;
  }

  const deltaText = extractZoomDeltaText(latestSpeakerCaption.text, visibleText);
  if (deltaText) {
    return deltaText;
  }

  return visibleText;
}

function hasInterveningSpeakerAfterCaption(
  captionId: number,
  speaker: string
): boolean {
  const captionIndex = captions.findIndex((item) => item.id === captionId);
  if (captionIndex < 0) {
    return false;
  }

  return captions
    .slice(captionIndex + 1)
    .some((item) => item.speaker !== speaker);
}

function processCaptionEntry(entry: Element): void {
  const extracted = extractSpeakerAndText(entry);
  if (!extracted) {
    return;
  }

  const { speaker, own } = extracted;
  const text = normalizeWhitespace(extracted.text);

  if (isLikelySystemMessage(text)) {
    return;
  }

  const lastVisibleText = elementLastVisibleText.get(entry);
  const lastSpeaker = elementLastSpeaker.get(entry);
  if (lastVisibleText === text && lastSpeaker === speaker) {
    return;
  }

  elementLastVisibleText.set(entry, text);
  elementLastSpeaker.set(entry, speaker);
  const metadata = buildZoomCaptionMetadata(entry, speaker);

  const existingCaptionId = elementToCaptionId.get(entry);
  if (existingCaptionId !== undefined) {
    const caption = captions.find((item) => item.id === existingCaptionId);
    if (!caption) {
      cancelFinalization(existingCaptionId);
      const newId = addOrUpdateCaption(null, speaker, text, { metadata, own });
      elementToCaptionId.set(entry, newId);
      elementAccumulatedText.set(entry, text);
      rememberCaptionUpdate(newId);
      scheduleFinalization(newId);
      return;
    }

    const resolvedSpeaker =
      speaker === "Unknown" && caption.speaker !== "Unknown"
        ? caption.speaker
        : speaker;

    if (caption.speaker === resolvedSpeaker) {
      if (hasInterveningSpeakerAfterCaption(existingCaptionId, resolvedSpeaker)) {
        const previousVisibleText = lastVisibleText || caption.text;
        const nextCaptionText =
          deriveNextCaptionTextForSpeaker(
            resolvedSpeaker,
            extractZoomDeltaText(previousVisibleText, text) || text,
            existingCaptionId
          ) || text;

        cancelFinalization(existingCaptionId);
        finalizeCaption(existingCaptionId);

        const newId = addOrUpdateCaption(null, resolvedSpeaker, nextCaptionText, {
          metadata: buildZoomCaptionMetadata(entry, resolvedSpeaker),
          own,
        });
        elementToCaptionId.set(entry, newId);
        elementAccumulatedText.set(entry, nextCaptionText);
        rememberCaptionUpdate(newId);
        scheduleFinalization(newId);
        return;
      }

      if (caption.text !== text) {
        const previousVisibleText = lastVisibleText || caption.text;
        const accumulatedText =
          elementAccumulatedText.get(entry) || caption.text || previousVisibleText;
        const mergedTranscript = mergeZoomRollingTranscript(
          accumulatedText,
          previousVisibleText,
          text
        );
        const transition = resolveZoomTextTransition(caption.text, mergedTranscript);

        if (transition.mode === "update") {
          addOrUpdateCaption(existingCaptionId, resolvedSpeaker, transition.text, {
            metadata: buildZoomCaptionMetadata(entry, resolvedSpeaker),
            own,
          });
          elementAccumulatedText.set(entry, transition.text);
          rememberCaptionUpdate(existingCaptionId);
          scheduleFinalization(existingCaptionId);
          return;
        }

        if (shouldMergeIntoExistingCaption(caption.text, transition.text)) {
          const mergedText = mergeRollingTexts(caption.text, transition.text);
          addOrUpdateCaption(existingCaptionId, resolvedSpeaker, mergedText, {
            metadata: buildZoomCaptionMetadata(entry, resolvedSpeaker),
            own,
          });
          rememberCaptionUpdate(existingCaptionId);
          scheduleFinalization(existingCaptionId);
          return;
        }

        cancelFinalization(existingCaptionId);
        finalizeCaption(existingCaptionId);

        const newId = addOrUpdateCaption(null, resolvedSpeaker, transition.text, {
          metadata: buildZoomCaptionMetadata(entry, resolvedSpeaker),
          own,
        });
        elementToCaptionId.set(entry, newId);
        elementAccumulatedText.set(entry, transition.text);
        rememberCaptionUpdate(newId);
        scheduleFinalization(newId);
        return;
      } else {
        elementAccumulatedText.set(entry, caption.text);
        rememberCaptionUpdate(existingCaptionId);
        scheduleFinalization(existingCaptionId);
      }
      return;
    }

    cancelFinalization(existingCaptionId);
    finalizeCaption(existingCaptionId);

    const nextCaptionText =
      deriveNextCaptionTextForSpeaker(speaker, text, existingCaptionId) || text;

    const newId = addOrUpdateCaption(null, speaker, nextCaptionText, {
      metadata,
      own,
    });
    elementToCaptionId.set(entry, newId);
    elementAccumulatedText.set(entry, nextCaptionText);
    rememberCaptionUpdate(newId);
    scheduleFinalization(newId);
    return;
  }

  finalizePendingCaptions();

  const newId = addOrUpdateCaption(null, speaker, text, { metadata, own });
  elementToCaptionId.set(entry, newId);
  elementAccumulatedText.set(entry, text);
  rememberCaptionUpdate(newId);
  scheduleFinalization(newId);
}

function extractCaptions(): void {
  const entries = getCaptionEntries();
  updateZoomDebugState({
    captionExtractDebug: {
      entryCount: entries.length,
      sampleTexts: entries
        .slice(0, 3)
        .map((entry) => normalizeWhitespace(entry.textContent || "").slice(0, 200)),
    },
  });
  if (entries.length === 0) {
    return;
  }

  entries.forEach(processCaptionEntry);
}

export const zoomWebProvider: MeetingProvider = {
  platform: "zoom-web",

  matchesUrl(url) {
    return shouldActivateZoomProvider(url);
  },

  matchesPageContext(url) {
    return shouldActivateZoomProvider(url);
  },

  bootstrap() {
    return undefined;
  },

  getMeetingPresence() {
    return getZoomMeetingPresence(new URL(window.location.href));
  },

  startCaptionObserver() {
    let observer: MutationObserver | null = null;
    let meetingObserver: MutationObserver | null = null;
    let currentMeetingBody: HTMLElement | null = null;
    let currentMeetingInteractionDocument: Document | null = null;
    let chatObserver: MutationObserver | null = null;
    let currentChatRegion: HTMLElement | null = null;
    let extractTimeout: ReturnType<typeof setTimeout> | null = null;
    let chatExtractTimeout: ReturnType<typeof setTimeout> | null = null;
    let captionSignalsMissingSince: number | null = null;
    let lastEnabledMenuVisibleAt: number | null = null;
    let lastHideCaptionsInteractionAt: number | null = null;

    const handleMeetingInteraction = (event: Event) => {
      if (event.type === "keydown") {
        const key = "key" in event ? String((event as KeyboardEvent).key) : "";
        if (key !== "Enter" && key !== " " && key !== "Spacebar") {
          return;
        }
      }

      const intent = getZoomCaptionToggleIntent(event.target);
      if (intent === "hide") {
        lastHideCaptionsInteractionAt = Date.now();
      }

      if (intent === "show") {
        lastHideCaptionsInteractionAt = null;
      }
    };

    const debouncedExtract = () => {
      updateCaptioningState();

      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }

      extractTimeout = setTimeout(() => {
        extractCaptions();
        syncZoomChatCapture();
      }, 120);
    };

    const debouncedExtractChat = () => {
      if (chatExtractTimeout) {
        clearTimeout(chatExtractTimeout);
      }

      chatExtractTimeout = setTimeout(() => {
        extractChatMessages();
      }, 120);
    };

    const updateCaptioningState = () => {
      const now = Date.now();
      const hasCaptions = isZoomCaptioningSurfaceAvailable();
      const hasExplicitDisableState = hasZoomOpenCaptionsMenuDisabledState();
      const enabledBannerVisible = hasZoomLiveTranscriptionEnabledBanner();
      const enabledMenuVisible = hasZoomOpenCaptionsMenuEnabledState();
      const explicitSubtitleCount = getExplicitSubtitleItems().length;

      if (enabledMenuVisible) {
        lastEnabledMenuVisibleAt = now;
      }

      if (hasCaptions) {
        captionSignalsMissingSince = null;
      } else if (isCCEnabled && captionSignalsMissingSince === null) {
        captionSignalsMissingSince = now;
      }

      const recentHideCaptionsInteraction =
        lastHideCaptionsInteractionAt !== null &&
        now - lastHideCaptionsInteractionAt <= ZOOM_CAPTION_MENU_RECENCY_MS;
      const recentEnabledMenuInteraction =
        recentHideCaptionsInteraction ||
        (lastEnabledMenuVisibleAt !== null &&
          now - lastEnabledMenuVisibleAt <= ZOOM_CAPTION_MENU_RECENCY_MS);
      const requiredOffStabilityMs = recentEnabledMenuInteraction
        ? ZOOM_CAPTION_OFF_FAST_STABILITY_MS
        : ZOOM_CAPTION_OFF_STABILITY_MS;

      const stableCaptionSignalAbsence =
        isCCEnabled &&
        !hasCaptions &&
        captionSignalsMissingSince !== null &&
        now - captionSignalsMissingSince >= requiredOffStabilityMs;
      const canTreatAbsenceAsDisable = recentEnabledMenuInteraction;
      const shouldDisableCaptions =
        hasExplicitDisableState ||
        (canTreatAbsenceAsDisable && stableCaptionSignalAbsence);

      updateZoomDebugState({
        rootDebug: getZoomSearchRootDebugSnapshot(),
        captionStateDebug: {
          hasCaptions,
          hasExplicitDisableState,
          isCCEnabled,
          explicitSubtitleCount,
          enabledBannerVisible,
          enabledMenuVisible,
          disabledMenuVisible: hasExplicitDisableState,
          stableCaptionSignalAbsence,
          canTreatAbsenceAsDisable,
          shouldDisableCaptions,
          captionSignalsMissingSince,
          recentHideCaptionsInteraction,
          recentEnabledMenuInteraction,
          requiredOffStabilityMs,
          lastEnabledMenuVisibleAt,
          lastHideCaptionsInteractionAt,
        },
        captionSignalDebug: getZoomCaptionSignalDebugSnapshot(),
      });
      appendZoomCaptionStateTrace({
        hasCaptions,
        hasExplicitDisableState,
        isCCEnabled,
        explicitSubtitleCount,
        enabledBannerVisible,
        enabledMenuVisible,
        disabledMenuVisible: hasExplicitDisableState,
        stableCaptionSignalAbsence,
        canTreatAbsenceAsDisable,
        shouldDisableCaptions,
        captionSignalsMissingSince,
        recentHideCaptionsInteraction,
        recentEnabledMenuInteraction,
        requiredOffStabilityMs,
        lastEnabledMenuVisibleAt,
        lastHideCaptionsInteractionAt,
      });

      if (hasCaptions && !isCCEnabled) {
        setCCEnabled(true);
        closeCaptureGuide();
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      if (shouldDisableCaptions && isCCEnabled) {
        setCCEnabled(false);
        captionSignalsMissingSince = null;
        lastEnabledMenuVisibleAt = null;
        lastHideCaptionsInteractionAt = null;
        if (getZoomMeetingPresence(new URL(window.location.href)) === "joined") {
          openCaptureGuide();
        } else {
          closeCaptureGuide();
        }
        finalizePendingCaptions();
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      if (hasCaptions) {
        extractCaptions();
      }
    };

    const observeChatRegion = () => {
      if (!settings.storeMeetingChat) {
        if (chatObserver) {
          chatObserver.disconnect();
          chatObserver = null;
        }
        currentChatRegion = null;
        return;
      }

      const chatRegion = getZoomChatRegion();
      const needsReobserve =
        chatRegion &&
        (!currentChatRegion ||
          chatRegion !== currentChatRegion ||
          !currentChatRegion.isConnected);

      if (needsReobserve && chatRegion) {
        if (chatObserver) {
          chatObserver.disconnect();
          chatObserver = null;
        }

        currentChatRegion = chatRegion;
        chatObserver = new MutationObserver(debouncedExtractChat);
        chatObserver.observe(chatRegion, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
        });

        syncZoomChatCapture();
      }

      if (!chatRegion && currentChatRegion) {
        currentChatRegion = null;
        if (chatObserver) {
          chatObserver.disconnect();
          chatObserver = null;
        }
      }
    };

    const observeMeetingBody = () => {
      const meetingBody = getZoomMeetingBody();
      const needsReobserve =
        meetingBody &&
        (!currentMeetingBody ||
          meetingBody !== currentMeetingBody ||
          !currentMeetingBody.isConnected);

      if (needsReobserve && meetingBody) {
        if (meetingObserver) {
          meetingObserver.disconnect();
          meetingObserver = null;
        }

        const meetingDocument = meetingBody.ownerDocument;
        if (currentMeetingInteractionDocument !== meetingDocument) {
          currentMeetingInteractionDocument?.removeEventListener(
            "click",
            handleMeetingInteraction,
            true
          );
          currentMeetingInteractionDocument?.removeEventListener(
            "keydown",
            handleMeetingInteraction,
            true
          );
          meetingDocument.addEventListener("click", handleMeetingInteraction, true);
          meetingDocument.addEventListener("keydown", handleMeetingInteraction, true);
          currentMeetingInteractionDocument = meetingDocument;
        }

        currentMeetingBody = meetingBody;
        meetingObserver = new MutationObserver(debouncedExtract);
        meetingObserver.observe(meetingBody, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        debouncedExtract();
      }

      if (!meetingBody && currentMeetingBody) {
        currentMeetingBody = null;
        if (meetingObserver) {
          meetingObserver.disconnect();
          meetingObserver = null;
        }
      }
    };

    if (document.body) {
      observer = new MutationObserver(debouncedExtract);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    const intervalId = window.setInterval(() => {
      updateCaptioningState();
      observeMeetingBody();
      observeChatRegion();
      syncZoomChatCapture();
    }, ZOOM_STATE_POLL_INTERVAL_MS);
    updateCaptioningState();
    observeMeetingBody();
    observeChatRegion();
    syncZoomChatCapture();

    return () => {
      window.clearInterval(intervalId);
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      if (chatExtractTimeout) {
        clearTimeout(chatExtractTimeout);
      }
      if (observer) {
        observer.disconnect();
      }
      if (meetingObserver) {
        meetingObserver.disconnect();
      }
      if (chatObserver) {
        chatObserver.disconnect();
      }
      currentMeetingInteractionDocument?.removeEventListener(
        "click",
        handleMeetingInteraction,
        true
      );
      currentMeetingInteractionDocument?.removeEventListener(
        "keydown",
        handleMeetingInteraction,
        true
      );
      currentMeetingInteractionDocument = null;
      currentMeetingBody = null;
      currentChatRegion = null;
      capturedZoomChatMessageIds.clear();
      setCCEnabled(false);
      finalizePendingCaptions();
    };
  },

  getSessionMetadata() {
    const url = new URL(window.location.href);
    const effectiveMeetingUrl = getZoomEffectiveMeetingUrl(url);
    const meetingNumber =
      extractZoomMeetingNumber(effectiveMeetingUrl) ||
      extractZoomMeetingNumber(url);
    const meetingId =
      extractZoomMeetingId(effectiveMeetingUrl) ||
      extractZoomMeetingId(url) ||
      extractZoomFallbackIdentifier();

    return {
      platform: "zoom-web",
      providerLabel: getProviderLabel("zoom-web"),
      title: normalizeZoomTitle(document.title),
      sourceUrl:
        isZoomSupportedRoute(effectiveMeetingUrl)
          ? effectiveMeetingUrl.toString()
          : window.location.href,
      identifiers: {
        meetingId,
        meetingNumber,
      },
    };
  },

  getEmptyState() {
    const t = getUiRuntimeTranslator();

    return {
      waitingTitle: t("content.empty.waitingForCaptionsTitle"),
      waitingBody: t("content.empty.waitingForCaptionsZoom"),
    };
  },

  getCaptureGuide() {
    const t = getUiRuntimeTranslator();

    return {
      modalTitle: t("content.captureGuide.providers.zoomWeb.title"),
      modalBody: t("content.captureGuide.providers.zoomWeb.body"),
      statusLabel: t("content.captureGuide.providers.zoomWeb.status"),
      footerNote: t("content.captureGuide.providers.zoomWeb.footer"),
      steps: [
        {
          title: t("content.captureGuide.providers.zoomWeb.steps.openControls.title"),
          detail: t(
            "content.captureGuide.providers.zoomWeb.steps.openControls.detail"
          ),
        },
        {
          title: t("content.captureGuide.providers.zoomWeb.steps.openMore.title"),
          detail: t(
            "content.captureGuide.providers.zoomWeb.steps.openMore.detail"
          ),
        },
        {
          title: t("content.captureGuide.providers.zoomWeb.steps.openCaptions.title"),
          detail: t(
            "content.captureGuide.providers.zoomWeb.steps.openCaptions.detail"
          ),
        },
        {
          title: t("content.captureGuide.providers.zoomWeb.steps.chooseShow.title"),
          detail: t(
            "content.captureGuide.providers.zoomWeb.steps.chooseShow.detail"
          ),
        },
      ],
      troubleshootingHint: t(
        "content.captureGuide.providers.zoomWeb.troubleshooting"
      ),
    };
  },

  isCaptioningCurrentlyAvailable() {
    return isZoomCaptioningSurfaceAvailable();
  },
};

export const zoomWebProviderInternals = {
  extractChatMessages,
  startCaptionObserver: () => zoomWebProvider.startCaptionObserver(),
  extractCaptionEntries: getCaptionEntries,
  extractZoomDeltaText,
  extractSpeakerAndText,
  extractZoomFallbackIdentifier,
  extractZoomChatMessageId,
  extractZoomMeetingId,
  extractZoomMeetingNumber,
  getZoomMeetingPresence,
  getExplicitSubtitleItems,
  hasZoomLiveTranscriptionEnabledBanner,
  hasZoomOpenCaptionsMenuDisabledState,
  hasZoomOpenCaptionsMenuEnabledState,
  isZoomCaptioningSurfaceAvailable,
  getZoomMeetingBody,
  getZoomMeetingSearchRoots,
  getZoomWebClientFrameDocument,
  getZoomWebClientFrameElement,
  getZoomEffectiveMeetingUrl,
  hasZoomWebClientFrame,
  isZoomHomeShellRoute,
  isZoomTopLevelShellRoute,
  isZoomWebClientShellRoute,
  isZoomIframeContext,
  hasZoomJoinedMeetingSurface,
  isZoomSupportedRoute,
  isTopLevelZoomShellContext,
  isZoomMeetingContext,
  mergeZoomRollingTranscript,
  normalizeZoomTitle,
  resetZoomWebProviderState,
  shouldActivateZoomProvider,
};
