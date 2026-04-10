import {
  captions,
  isCCEnabled,
  liveChatMessages,
  setCCEnabled,
  settings,
} from "../state";
import { addOrUpdateCaption, finalizeCaption } from "../caption";
import { renderCaptions } from "../render";
import { closeCaptureGuide, openCaptureGuide } from "../overlay/capture-guide";
import { ingestLiveChatEvent } from "../event-ingestion";
import { getCurrentSessionSnapshot } from "../history-service";
import { updateContentDebugState } from "../debug-state";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";
import { getUiRuntimeTranslator } from "../../shared/i18n";
import { getProviderLabel } from "../../shared/meeting-session";
import { extractAllowedRichTextHtml } from "../../shared/rich-text";
import type { MeetingPresenceState, MeetingProvider } from "./types";

const STRONG_ENTRY_SELECTORS = [
  '[data-tid="closed-captions-v2-items-renderer"]',
  '[data-tid="author"]',
  '[data-tid="closed-caption-text"]',
  ".fui-ChatMessageCompact",
  '[data-tid*="caption-item"]',
  '[data-tid*="subtitle-item"]',
  '[data-tid*="transcript-message"]',
  '[data-tid*="closed-caption-item"]',
  '[class*="caption-item"]',
  '[class*="subtitle-item"]',
].join(", ");

const EXPLICIT_TEXT_SELECTOR = '[data-tid="closed-caption-text"]';
const EXPLICIT_AUTHOR_SELECTOR = '[data-tid="author"]';

const REGION_SELECTORS = [
  '[data-tid="closed-caption-renderer-wrapper"]',
  '[data-tid="closed-caption-v2-window-wrapper"]',
  '[data-tid="closed-caption-v2-virtual-list-content"]',
  '[aria-label="Live Captions"]',
  '[aria-label*="Hide live captions" i]',
  '[data-tid="captions-panel-dismiss-button"]',
].join(", ");

const ACTIVE_CAPTION_SURFACE_SELECTORS = [
  '[data-tid="closed-caption-v2-virtual-list-content"]',
  '[data-tid="closed-captions-v2-items-renderer"]',
  EXPLICIT_TEXT_SELECTOR,
].join(", ");

const CAPTION_PLACEHOLDER_SELECTORS = [
  '[data-tid="closed-caption-default-text-wrapper"]',
  '[data-tid="closed-caption-default-text"]',
].join(", ");

const CAPTION_WINDOW_SELECTORS = [
  '[data-tid="closed-caption-renderer-wrapper"]',
  '[data-tid="closed-caption-v2-window-wrapper"]',
].join(", ");

const CAPTION_DISMISS_CONTROL_SELECTORS = [
  '[data-tid="captions-panel-dismiss-button"]',
  '[aria-label*="Hide live captions" i]',
].join(", ");

const SPEAKER_SELECTORS = [
  EXPLICIT_AUTHOR_SELECTOR,
  '[data-tid*="speaker"]',
  '[class*="speaker"]',
  '[data-tid*="author"]',
].join(", ");

const TEXT_SELECTORS = [
  EXPLICIT_TEXT_SELECTOR,
  '[data-tid*="text"]',
  '[data-tid*="line"]',
  '[class*="text"]',
  '[class*="line"]',
  "span",
  "p",
].join(", ");

const FINALIZE_DELAY = 1500;
const RECENT_SIGNATURE_WINDOW_MS = 4000;
const TEAMS_CHAT_DUPLICATE_WINDOW_MS = 15000;
const TEAMS_CAPTION_ENABLE_POLL_INTERVAL_MS = 100;
const TEAMS_CAPTION_ENABLE_VERIFY_TIMEOUT_MS = 2200;
const TEAMS_CLOSED_CAPTIONS_STORAGE_KEY_FRAGMENT = ".react-web-client.closed-captions-settings";
const TEAMS_CHAT_REGION_SELECTORS = [
  "#chat-pane-list",
  '[data-tid="message-pane-list"]',
  '[data-tid="message-pane-list-runway"]',
  '[data-tid="message-pane-list-viewport"]',
].join(", ");
const TEAMS_ACTIONABLE_CONTROL_SELECTORS = [
  "button",
  '[role="button"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
].join(", ");
const TEAMS_CHAT_ITEM_SELECTORS = [
  '[data-tid="chat-pane-item"]',
  '[data-tid="message-pane-item"]',
  '[data-tid="chat-message-item"]',
].join(", ");
const CAPTION_KEYWORD_PATTERN =
  /(caption|captions|subtitle|subtitles|transcript|closed-caption|live-caption)/i;
const DISALLOWED_HINT_PATTERN =
  /(setting|settings|menu|trigger-button|dismiss-button|overflow)/i;
const SYSTEM_SPEAKER_PATTERN =
  /^(unknown|new notification|captions will be shown in .+|microsoft teams meeting)$/i;
const SYSTEM_TEXT_PATTERN =
  /^(microsoft teams meeting|camera is off|your microphone isn't working.*|captions will be shown in .+|english \(us\)|you have left the call|you left the call)$/i;
const TEAMS_LEAVE_BUTTON_SELECTOR =
  [
    'button[data-tid="hangup-main-btn"]',
    "button#hangup-button",
    '[data-inp="hangup-button"]',
    '[data-track-module-name="StopMeetingButton"]',
    '[aria-keyshortcuts="Ctrl+Shift+H"]',
  ].join(", ");

const teamsDiagnosticsLogger = createDiagnosticsLogger({
  runtime: "content",
  domain: "provider",
  feature: "teams-caption-pipeline",
  provider: "microsoft-teams",
});

let elementToCaptionId = new WeakMap<Element, number>();
let elementLastText = new WeakMap<Element, string>();
let elementLastSpeaker = new WeakMap<Element, string>();
const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();
const recentCaptionSignatures = new Map<string, number>();
const capturedTeamsChatMessageIds = new Set<string>();
const recentTeamsChatFingerprints = new Map<string, number>();
let teamsChatMessageCounter = 0;
let hasSeenTeamsLeaveControl = false;
let directCallChatCaptureFloorOverride: number | null | undefined = undefined;

export function resetMicrosoftTeamsProviderState(): void {
  hasSeenTeamsLeaveControl = false;
  for (const timer of finalizationTimers.values()) {
    clearTimeout(timer);
  }
  finalizationTimers.clear();
  recentCaptionSignatures.clear();
  elementToCaptionId = new WeakMap<Element, number>();
  elementLastText = new WeakMap<Element, string>();
  elementLastSpeaker = new WeakMap<Element, string>();
  capturedTeamsChatMessageIds.clear();
  recentTeamsChatFingerprints.clear();
  teamsChatMessageCounter = 0;
  directCallChatCaptureFloorOverride = undefined;
}

function buildTeamsCaptionMetadata(
  entry: Element,
  speaker: string,
  text: string
): Record<string, string | boolean> {
  return {
    domShape: entry.classList.contains("fui-ChatMessageCompact")
      ? "fui-ChatMessageCompact"
      : "teams-caption-entry",
    entryDataTid: entry.getAttribute("data-tid") || "",
    entryHint: collectElementHints(entry),
    speakerWasUnknown: speaker === "Unknown",
    hasExplicitAuthor: entry.querySelector(EXPLICIT_AUTHOR_SELECTOR) !== null,
    hasExplicitText: entry.querySelector(EXPLICIT_TEXT_SELECTOR) !== null,
    signature: buildCaptionSignature(speaker, text),
  };
}

function summarizeTeamsEntry(entry: Element): Record<string, string | number | boolean> {
  return {
    tag: entry.tagName,
    dataTid: entry.getAttribute("data-tid") || "",
    className: entry.getAttribute("class") || "",
    text: normalizeWhitespace(entry.textContent || "").slice(0, 240),
    visible: isVisibleElement(entry),
  };
}

function recordTeamsCaptionDebug(
  key: "teamsCaptionObserverDebug" | "teamsCaptionProcessDebug",
  outcome: string,
  details: Record<string, unknown>
): void {
  void teamsDiagnosticsLogger.debug(outcome, {
    channel: key,
    ...details,
  });

  updateContentDebugState({
    [key]: {
      timestamp: new Date().toISOString(),
      outcome,
      ...details,
    },
  });
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isInsideExtension(element: Element): boolean {
  return element.closest("#captionarc-overlay") !== null;
}

function isVisibleElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  return true;
}

function collectElementHints(element: Element): string {
  const attrs = [
    element.getAttribute("data-tid"),
    element.getAttribute("aria-label"),
    element.getAttribute("id"),
    element.getAttribute("role"),
    element.className,
  ];

  return attrs.filter(Boolean).join(" ");
}

function hasCaptionKeywordHint(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  return CAPTION_KEYWORD_PATTERN.test(collectElementHints(element));
}

function hasDisallowedHint(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  return DISALLOWED_HINT_PATTERN.test(collectElementHints(element));
}

function findCaptionRegionAncestor(element: Element | null): Element | null {
  let current = element;
  let depth = 0;

  while (current && depth < 6) {
    if (hasCaptionKeywordHint(current)) {
      return current;
    }

    current = current.parentElement;
    depth += 1;
  }

  return null;
}

function collectLeafTexts(element: Element): string[] {
  const descendants = Array.from(element.querySelectorAll("*"));
  const leaves = descendants.filter(
    (node) => node.children.length === 0 && !isInsideExtension(node)
  );

  const sourceNodes = leaves.length > 0 ? leaves : [element];

  return Array.from(
    new Set(
      sourceNodes
        .map((node) => normalizeWhitespace(node.textContent || ""))
        .filter(Boolean)
    )
  );
}

function isLikelyCaptionText(text: string): boolean {
  return text.length >= 3 && text.length <= 240;
}

function isLikelySystemMessage(speaker: string, text: string): boolean {
  if (SYSTEM_TEXT_PATTERN.test(text)) {
    return true;
  }

  if (SYSTEM_SPEAKER_PATTERN.test(speaker) && SYSTEM_TEXT_PATTERN.test(text)) {
    return true;
  }

  if (/^(english|persian|arabic|french|german|spanish)(\s*\(.+\))?$/i.test(text)) {
    return true;
  }

  return false;
}

function buildCaptionSignature(speaker: string, text: string): string {
  return `${speaker.toLowerCase()}::${text.toLowerCase()}`;
}

function createTeamsChatTimestamp(): number {
  teamsChatMessageCounter += 1;
  return Date.now() + teamsChatMessageCounter;
}

function parseTeamsChatTimestampFromMessageId(messageId: string | null): number | undefined {
  if (!messageId || !/^\d{10,}$/.test(messageId)) {
    return undefined;
  }

  const parsed = Number(messageId);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildTeamsChatFingerprint(
  speaker: string,
  text: string,
  own: boolean,
  time: string
): string {
  return `${own ? "self" : "other"}|${normalizeWhitespace(
    speaker
  ).toLowerCase()}|${normalizeWhitespace(text).toLowerCase()}|${normalizeWhitespace(
    time
  ).toLowerCase()}`;
}

function hasRecentTeamsChatFingerprint(fingerprint: string): boolean {
  const now = Date.now();

  for (const [key, timestamp] of recentTeamsChatFingerprints.entries()) {
    if (now - timestamp > TEAMS_CHAT_DUPLICATE_WINDOW_MS) {
      recentTeamsChatFingerprints.delete(key);
    }
  }

  const lastSeenAt = recentTeamsChatFingerprints.get(fingerprint);
  return typeof lastSeenAt === "number" && now - lastSeenAt <= TEAMS_CHAT_DUPLICATE_WINDOW_MS;
}

function rememberTeamsChatFingerprint(fingerprint: string): void {
  recentTeamsChatFingerprints.set(fingerprint, Date.now());
}

function hasCapturedTeamsChatMessageId(messageId: string | null): boolean {
  if (!messageId) {
    return false;
  }

  if (capturedTeamsChatMessageIds.has(messageId)) {
    return true;
  }

  return liveChatMessages.some((message) => message.messageId === messageId);
}

function hasExistingTeamsChatFingerprint(fingerprint: string): boolean {
  return liveChatMessages.some(
    (message) =>
      buildTeamsChatFingerprint(
        message.speaker,
        message.text,
        Boolean(message.own),
        message.time
      ) === fingerprint
  );
}

function hasRecentCaptionSignature(signature: string): boolean {
  const now = Date.now();

  for (const [key, timestamp] of recentCaptionSignatures.entries()) {
    if (now - timestamp > RECENT_SIGNATURE_WINDOW_MS) {
      recentCaptionSignatures.delete(key);
    }
  }

  const lastSeenAt = recentCaptionSignatures.get(signature);
  return typeof lastSeenAt === "number" && now - lastSeenAt <= RECENT_SIGNATURE_WINDOW_MS;
}

function rememberCaptionSignature(signature: string): void {
  recentCaptionSignatures.set(signature, Date.now());
}

function getLatestPendingCaption() {
  for (let index = captions.length - 1; index >= 0; index -= 1) {
    const caption = captions[index];
    if (!caption.isFinalized) {
      return caption;
    }
  }

  return null;
}

function decodeTeamsDisplayName(value: string): string {
  try {
    return normalizeWhitespace(decodeURIComponent(value));
  } catch {
    return normalizeWhitespace(value);
  }
}

function extractSpeakerFromAvatar(entry: Element): string | undefined {
  const image = entry.querySelector("img");
  if (!image) {
    return undefined;
  }

  const altText = normalizeWhitespace(image.getAttribute("alt") || "");
  if (altText && altText.toLowerCase() !== "avatar") {
    return altText;
  }

  const ariaLabel = normalizeWhitespace(image.getAttribute("aria-label") || "");
  if (ariaLabel) {
    return ariaLabel;
  }

  const src = image.getAttribute("src") || "";
  if (!src) {
    return undefined;
  }

  try {
    const url = new URL(src);
    const displayName = url.searchParams.get("displayname");
    return displayName ? decodeTeamsDisplayName(displayName) : undefined;
  } catch {
    const match = src.match(/[?&]displayname=([^&]+)/i);
    return match?.[1] ? decodeTeamsDisplayName(match[1]) : undefined;
  }
}

function isLikelyCaptionEntry(element: Element): boolean {
  if (isInsideExtension(element) || !isVisibleElement(element)) {
    return false;
  }

  if (hasDisallowedHint(element)) {
    return false;
  }

  if (
    element.querySelector(
      'button, input, textarea, select, [role="button"], [role="menuitem"]'
    )
  ) {
    return false;
  }

  if (!findCaptionRegionAncestor(element) && !hasCaptionKeywordHint(element)) {
    return false;
  }

  const text = normalizeWhitespace(element.textContent || "");
  if (!isLikelyCaptionText(text)) {
    return false;
  }

  if (element.childElementCount > 25) {
    return false;
  }

  return true;
}

function extractSpeakerAndText(entry: Element): { speaker: string; text: string } | null {
  const visibleLines =
    entry instanceof HTMLElement
      ? entry.innerText
          .split("\n")
          .map((line) => normalizeWhitespace(line))
          .filter(Boolean)
      : [];

  const explicitSpeakerNode = entry.querySelector(SPEAKER_SELECTORS);
  const explicitSpeakerText = normalizeWhitespace(
    explicitSpeakerNode?.textContent || ""
  );
  const avatarSpeakerText = extractSpeakerFromAvatar(entry) || "";
  const speakerText = explicitSpeakerText || avatarSpeakerText;

  const explicitTextNode = entry.querySelector(TEXT_SELECTORS);
  const explicitCaptionText = normalizeWhitespace(
    explicitTextNode?.textContent || ""
  );

  if (speakerText && explicitCaptionText && isLikelyCaptionText(explicitCaptionText)) {
    return {
      speaker: speakerText,
      text: explicitCaptionText,
    };
  }

  const explicitTexts = Array.from(entry.querySelectorAll(TEXT_SELECTORS))
    .map((node) => normalizeWhitespace(node.textContent || ""))
    .filter(Boolean)
    .filter((text) => text !== speakerText);

  const leafTexts = collectLeafTexts(entry).filter((text) => text !== speakerText);
  const candidateTexts = Array.from(new Set([...explicitTexts, ...leafTexts]))
    .filter((text) => isLikelyCaptionText(text))
    .sort((left, right) => right.length - left.length);

  if (speakerText && visibleLines.length > 0) {
    const lineTexts = visibleLines.filter(
      (line) =>
        line !== speakerText &&
        !line.startsWith(`${speakerText} `) &&
        !line.startsWith(`${speakerText}.`) &&
        !line.startsWith(speakerText) &&
        isLikelyCaptionText(line)
    );

    if (lineTexts.length > 0) {
      return {
        speaker: speakerText,
        text: lineTexts[0],
      };
    }
  }

  if (visibleLines.length >= 2) {
    const [firstLine, ...restLines] = visibleLines;
    const textLines = restLines.filter((line) => isLikelyCaptionText(line));

    if (textLines.length > 0) {
      return {
        speaker: firstLine,
        text: textLines[0],
      };
    }
  }

  if (speakerText && candidateTexts.length > 0) {
    const bestCandidate = candidateTexts.find(
      (candidate) =>
        candidate !== speakerText &&
        !candidate.startsWith(speakerText) &&
        !candidate.includes(`${speakerText}${speakerText}`) &&
        !candidate.includes(`${speakerText} ${speakerText}`)
    );

    if (bestCandidate) {
      return {
        speaker: speakerText,
        text: bestCandidate,
      };
    }
  }

  const fullText = normalizeWhitespace(entry.textContent || "");
  const speakerFromInline = fullText.match(/^([^:]{1,60}):\s+(.+)$/);
  if (speakerFromInline) {
    return {
      speaker: speakerFromInline[1].trim(),
      text: speakerFromInline[2].trim(),
    };
  }

  if (candidateTexts.length >= 2) {
    return {
      speaker: candidateTexts[0],
      text: candidateTexts[1],
    };
  }

  const text = candidateTexts[0] || fullText;
  if (!isLikelyCaptionText(text)) {
    return null;
  }

  return {
    speaker: speakerText || "Unknown",
    text,
  };
}

function normalizeEntryCandidate(candidate: Element): Element | null {
  if (candidate.getAttribute("data-tid") === "closed-captions-v2-items-renderer") {
    return candidate.closest(".fui-ChatMessageCompact");
  }

  if (candidate.getAttribute("data-tid") === "author") {
    return candidate.closest(".fui-ChatMessageCompact");
  }

  if (candidate.getAttribute("data-tid") === "closed-caption-text") {
    return candidate.closest(".fui-ChatMessageCompact");
  }

  if (candidate.classList.contains("fui-ChatMessageCompact")) {
    return candidate;
  }

  return candidate;
}

function getFallbackEntries(): Element[] {
  const regions = getCaptionRegions();

  const entries = new Set<Element>();

  for (const region of regions) {
    const chatMessageItems = Array.from(
      region.querySelectorAll(".fui-ChatMessageCompact")
    )
      .map(normalizeEntryCandidate)
      .filter((candidate): candidate is Element => Boolean(candidate))
      .filter((candidate) => candidate.querySelector('[data-tid="closed-caption-text"]'));

    if (chatMessageItems.length > 0) {
      for (const item of chatMessageItems) {
        entries.add(item);
      }
      continue;
    }

    const descendants = Array.from(region.querySelectorAll("*")).filter(
      isLikelyCaptionEntry
    );
    const leafCandidates = descendants.filter(
      (candidate) =>
        !descendants.some(
          (other) => other !== candidate && candidate.contains(other)
        )
    );

    const directChildren = Array.from(region.children).filter(isLikelyCaptionEntry);
    const preferredEntries = leafCandidates.length > 0 ? leafCandidates : directChildren;
    if (preferredEntries.length > 0) {
      for (const child of preferredEntries) {
        entries.add(child);
      }
      continue;
    }

    if (isLikelyCaptionEntry(region)) {
      entries.add(region);
    }
  }

  return Array.from(entries);
}

function getCaptionRegions(): Element[] {
  const candidates = Array.from(document.querySelectorAll(REGION_SELECTORS)).filter(
    (region) =>
      !isInsideExtension(region) &&
      isVisibleElement(region) &&
      !hasDisallowedHint(region)
  );

  const regions = candidates.filter((region) => {
    if (hasCaptionKeywordHint(region)) {
      return true;
    }

    return findCaptionRegionAncestor(region.parentElement) !== null;
  });

  return Array.from(new Set(regions));
}

function getCaptionEntries(): Element[] {
  const regions = getCaptionRegions();

  const explicitMatches = regions.flatMap((region) =>
    Array.from(region.querySelectorAll(EXPLICIT_TEXT_SELECTOR))
      .map((node) => node.closest(".fui-ChatMessageCompact"))
      .filter((candidate): candidate is Element => Boolean(candidate))
      .filter((candidate) => region.contains(candidate))
      .filter(
        (candidate) =>
          candidate.querySelector(EXPLICIT_TEXT_SELECTOR) !== null &&
          candidate.querySelector(EXPLICIT_AUTHOR_SELECTOR) !== null
      )
      .filter(isLikelyCaptionEntry)
  );

  if (explicitMatches.length > 0) {
    return Array.from(new Set(explicitMatches));
  }

  const strongMatches = regions
    .flatMap((region) =>
      Array.from(region.querySelectorAll(STRONG_ENTRY_SELECTORS))
        .map(normalizeEntryCandidate)
        .filter((candidate): candidate is Element => Boolean(candidate))
        .filter((candidate) => region.contains(candidate))
        .filter(
          (candidate) =>
            candidate.classList.contains("fui-ChatMessageCompact") ||
            candidate.querySelector('[data-tid="closed-caption-text"]') !== null
        )
        .filter(isLikelyCaptionEntry)
    );

  if (strongMatches.length > 0) {
    return Array.from(new Set(strongMatches));
  }

  return getFallbackEntries();
}

function getTeamsChatRegion(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(TEAMS_CHAT_REGION_SELECTORS)
  );

  return (
    candidates.find(
      (candidate) => !isInsideExtension(candidate) && isVisibleElement(candidate)
    ) || null
  );
}

function getTeamsChatEntries(region: Element): HTMLElement[] {
  const explicitEntries = Array.from(
    region.querySelectorAll<HTMLElement>(TEAMS_CHAT_ITEM_SELECTORS)
  ).filter((entry) => !isInsideExtension(entry) && isVisibleElement(entry));

  if (explicitEntries.length > 0) {
    return explicitEntries;
  }

  const fallbackEntries = Array.from(
    region.querySelectorAll<HTMLElement>("[data-mid]")
  )
    .map(
      (body) =>
        body.closest<HTMLElement>(
          '[data-tid="chat-pane-item"], [data-tid="message-pane-item"], [role="listitem"], li'
        ) || body
    )
    .filter((entry) => !isInsideExtension(entry) && isVisibleElement(entry));

  return Array.from(new Set(fallbackEntries));
}

function getTeamsChatMessageBodies(entry: Element): HTMLElement[] {
  return Array.from(
    entry.querySelectorAll<HTMLElement>(
      '[data-tid="chat-pane-message"][data-mid], [data-mid]'
    )
  ).filter((body) => !isInsideExtension(body) && isVisibleElement(body));
}

function getTeamsChatMessageBody(entry: Element): HTMLElement | null {
  return getTeamsChatMessageBodies(entry)[0] || null;
}

function getTeamsLabelledNode(
  body: Element,
  prefix: string
): HTMLElement | null {
  const labelledBy = body.getAttribute("aria-labelledby") || "";

  for (const id of labelledBy.split(/\s+/)) {
    if (!id.startsWith(prefix)) {
      continue;
    }

    const node = document.getElementById(id);
    if (node instanceof HTMLElement) {
      return node;
    }
  }

  return null;
}

function isTeamsControlMessageEntry(entry: Element): boolean {
  return (
    entry.querySelector(".fui-ChatControlMessageItem") !== null ||
    entry.querySelector('[data-tid="control-message-renderer"]') !== null
  );
}

function extractTeamsChatMessageId(body: Element): string | null {
  return body.getAttribute("data-mid")?.trim() || null;
}

function extractTeamsChatSpeaker(body: Element, entry: Element): string {
  const directAuthor = getTeamsLabelledNode(body, "author-");
  const directAuthorText = normalizeWhitespace(directAuthor?.textContent || "");
  if (directAuthorText) {
    return directAuthorText;
  }

  const explicitAuthor = normalizeWhitespace(
    body.querySelector('[data-tid="message-author-name"]')?.textContent ||
      entry.querySelector('[data-tid="message-author-name"]')?.textContent ||
      ""
  );
  if (explicitAuthor) {
    return explicitAuthor;
  }

  const authorContainerText = normalizeWhitespace(
    body.querySelector('[class*="ChatMessage__author"]')?.textContent ||
      entry.querySelector('[class*="ChatMessage__author"]')?.textContent ||
      ""
  );
  if (authorContainerText) {
    return authorContainerText;
  }

  const accessibilityHeading = normalizeWhitespace(
    entry.querySelector('[role="heading"]')?.textContent || ""
  );
  const byMatch = accessibilityHeading.match(/\bby\s+(.+)$/i);
  if (byMatch?.[1]) {
    return normalizeWhitespace(byMatch[1]);
  }

  return "Unknown";
}

function normalizeMultilineWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join("\n");
}

function stripLeadingSpeakerFromChatText(text: string, speaker: string): string {
  if (!text || !speaker || speaker === "Unknown") {
    return text;
  }

  const normalizedText = normalizeMultilineWhitespace(text);
  const normalizedSpeaker = normalizeWhitespace(speaker);
  const [firstLine, ...restLines] = normalizedText.split("\n");

  const rebuildWithRest = (line: string): string =>
    [line, ...restLines].filter(Boolean).join("\n");

  if (firstLine?.startsWith(`${normalizedSpeaker}:`)) {
    return rebuildWithRest(
      normalizeWhitespace(firstLine.slice(normalizedSpeaker.length + 1))
    );
  }

  if (firstLine?.startsWith(normalizedSpeaker)) {
    return rebuildWithRest(
      normalizeWhitespace(firstLine.slice(normalizedSpeaker.length))
    );
  }

  const compactText = firstLine?.replace(/\s+/g, "") || "";
  const compactSpeaker = normalizedSpeaker.replace(/\s+/g, "");
  if (compactSpeaker && compactText.startsWith(compactSpeaker)) {
    return rebuildWithRest(
      normalizeWhitespace(firstLine.slice(normalizedSpeaker.length))
    );
  }

  return normalizedText;
}

function extractTeamsStructuredChatText(contentNode: HTMLElement): string {
  const directBlocks = Array.from(
    contentNode.querySelectorAll<HTMLElement>(":scope > p, :scope > div, :scope > li")
  )
    .map((node) => normalizeWhitespace(node.textContent || ""))
    .filter(Boolean);

  if (directBlocks.length > 1) {
    return directBlocks.join("\n");
  }

  return normalizeWhitespace(contentNode.textContent || "");
}

function extractTeamsStructuredChatHtml(
  contentNode: HTMLElement
): string | undefined {
  return extractAllowedRichTextHtml(contentNode);
}

function extractTeamsChatContent(
  body: Element,
  speaker: string
): {
  text: string;
  formattedHtml?: string;
} {
  const labelledContent = getTeamsLabelledNode(body, "content-");
  const labelledText = stripLeadingSpeakerFromChatText(
    labelledContent ? extractTeamsStructuredChatText(labelledContent) : "",
    speaker
  );
  if (labelledText) {
    return {
      text: labelledText,
      formattedHtml: labelledContent
        ? extractTeamsStructuredChatHtml(labelledContent)
        : undefined,
    };
  }

  const contentNode = body.querySelector<HTMLElement>(
    '[data-message-content], [id^="content-"]'
  );
  const contentText = stripLeadingSpeakerFromChatText(
    contentNode ? extractTeamsStructuredChatText(contentNode) : "",
    speaker
  );
  if (contentText) {
    return {
      text: contentText,
      formattedHtml: contentNode
        ? extractTeamsStructuredChatHtml(contentNode)
        : undefined,
    };
  }

  return {
    text: stripLeadingSpeakerFromChatText(
      normalizeWhitespace(contentNode?.getAttribute("aria-label") || ""),
      speaker
    ),
  };
}

function extractTeamsChatTime(body: Element, entry: Element): string {
  const labelledTime = getTeamsLabelledNode(body, "timestamp-");
  const timeNode = labelledTime || body.querySelector("time") || entry.querySelector("time");
  return normalizeWhitespace(timeNode?.textContent || "") || new Date().toLocaleTimeString();
}

function extractTeamsChatTimestamp(
  body: Element,
  entry: Element,
  messageId: string
): number {
  const labelledTime = getTeamsLabelledNode(body, "timestamp-");
  const timeNode = labelledTime || body.querySelector("time") || entry.querySelector("time");
  const explicitDateTime = timeNode?.getAttribute("datetime");

  if (explicitDateTime) {
    const parsed = Date.parse(explicitDateTime);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const bodyDateTime = body.querySelector("time")?.getAttribute("datetime");
  if (bodyDateTime) {
    const parsed = Date.parse(bodyDateTime);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const messageIdTimestamp = parseTeamsChatTimestampFromMessageId(messageId);
  if (typeof messageIdTimestamp === "number") {
    return messageIdTimestamp;
  }

  return createTeamsChatTimestamp();
}

function isOwnTeamsChatMessage(body: Element, entry: Element): boolean {
  if (body.className.includes("ChatMyMessage")) {
    return true;
  }

  if (entry.querySelector(".fui-ChatMyMessage")) {
    return true;
  }

  return false;
}

function getDirectCallChatCaptureFloorTimestamp(): number | null {
  if (directCallChatCaptureFloorOverride !== undefined) {
    return directCallChatCaptureFloorOverride;
  }

  const session = getCurrentSessionSnapshot();
  if (!session || session.identifiers.callType !== "direct-call") {
    return null;
  }

  return session.startTime;
}

function extractTeamsChatMessages(): void {
  if (!settings.storeMeetingChat) {
    return;
  }

  const region = getTeamsChatRegion();
  if (!region) {
    return;
  }

  const entries = getTeamsChatEntries(region);
  if (entries.length === 0) {
    return;
  }

  entries.forEach((entry) => {
    if (isTeamsControlMessageEntry(entry)) {
      return;
    }

    const bodies = getTeamsChatMessageBodies(entry);
    if (bodies.length === 0) {
      return;
    }

    bodies.forEach((body) => {
      const messageId = extractTeamsChatMessageId(body);
      if (!messageId || hasCapturedTeamsChatMessageId(messageId)) {
        return;
      }

      const speaker = extractTeamsChatSpeaker(body, entry);
      const { text, formattedHtml } = extractTeamsChatContent(body, speaker);
      if (!text) {
        return;
      }

      const own = isOwnTeamsChatMessage(body, entry);
      const time = extractTeamsChatTime(body, entry);
      const timestamp = extractTeamsChatTimestamp(body, entry, messageId);
      const directCallChatFloorTimestamp = getDirectCallChatCaptureFloorTimestamp();
      if (
        typeof directCallChatFloorTimestamp === "number" &&
        timestamp < directCallChatFloorTimestamp
      ) {
        capturedTeamsChatMessageIds.add(messageId);
        return;
      }

      const fingerprint = buildTeamsChatFingerprint(speaker, text, own, time);

      if (
        hasExistingTeamsChatFingerprint(fingerprint) ||
        hasRecentTeamsChatFingerprint(fingerprint)
      ) {
        capturedTeamsChatMessageIds.add(messageId);
        rememberTeamsChatFingerprint(fingerprint);
        return;
      }

      rememberTeamsChatFingerprint(fingerprint);
      capturedTeamsChatMessageIds.add(messageId);
      ingestLiveChatEvent({
        speaker,
        text,
        formattedHtml,
        time,
        timestamp,
        historyTimestamp: timestamp,
        own,
        providerEventId: messageId,
      });
    });
  });
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
}

function finalizePendingCaptions(): void {
  const pendingIds = Array.from(finalizationTimers.keys());
  for (const captionId of pendingIds) {
    cancelFinalization(captionId);
    finalizeCaption(captionId);
  }
}

function processCaptionEntry(entry: Element): void {
  const extracted = extractSpeakerAndText(entry);
  if (!extracted || !isLikelyCaptionText(extracted.text)) {
    recordTeamsCaptionDebug("teamsCaptionProcessDebug", "ignored-invalid-text", {
      entry: summarizeTeamsEntry(entry),
      extracted: extracted
        ? {
            speaker: extracted.speaker,
            text: extracted.text,
          }
        : null,
      captionsCount: captions.length,
    });
    return;
  }

  const { speaker, text } = extracted;
  if (isLikelySystemMessage(speaker, text)) {
    recordTeamsCaptionDebug("teamsCaptionProcessDebug", "ignored-system-message", {
      entry: summarizeTeamsEntry(entry),
      extracted: { speaker, text },
      captionsCount: captions.length,
    });
    return;
  }

  const signature = buildCaptionSignature(speaker, text);
  const metadata = buildTeamsCaptionMetadata(entry, speaker, text);

  const lastText = elementLastText.get(entry);
  const lastSpeaker = elementLastSpeaker.get(entry);
  if (lastText === text && lastSpeaker === speaker) {
    recordTeamsCaptionDebug("teamsCaptionProcessDebug", "ignored-same-entry-text", {
      entry: summarizeTeamsEntry(entry),
      extracted: { speaker, text },
      signature,
      captionsCount: captions.length,
    });
    return;
  }

  elementLastText.set(entry, text);
  elementLastSpeaker.set(entry, speaker);

  const existingCaptionId = elementToCaptionId.get(entry);
  if (existingCaptionId !== undefined) {
    const caption = captions.find((item) => item.id === existingCaptionId);

    if (!caption) {
      cancelFinalization(existingCaptionId);
      const newId = addOrUpdateCaption(null, speaker, text, { metadata });
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
      recordTeamsCaptionDebug("teamsCaptionProcessDebug", "recreated-missing-caption", {
        entry: summarizeTeamsEntry(entry),
        extracted: { speaker, text },
        signature,
        existingCaptionId,
        newCaptionId: newId,
        captionsCount: captions.length,
      });
      return;
    }

    if (caption.speaker === speaker) {
      if (caption.text !== text) {
        addOrUpdateCaption(existingCaptionId, speaker, text, { metadata });
        rememberCaptionSignature(signature);
        scheduleFinalization(existingCaptionId);
        recordTeamsCaptionDebug("teamsCaptionProcessDebug", "updated-existing-caption", {
          entry: summarizeTeamsEntry(entry),
          extracted: { speaker, text },
          signature,
          existingCaptionId,
          captionsCount: captions.length,
        });
      } else {
        recordTeamsCaptionDebug("teamsCaptionProcessDebug", "ignored-existing-caption-same-text", {
          entry: summarizeTeamsEntry(entry),
          extracted: { speaker, text },
          signature,
          existingCaptionId,
          captionsCount: captions.length,
        });
      }
      return;
    }

    cancelFinalization(existingCaptionId);
    finalizeCaption(existingCaptionId);

    const newId = addOrUpdateCaption(null, speaker, text, { metadata });
    elementToCaptionId.set(entry, newId);
    rememberCaptionSignature(signature);
    scheduleFinalization(newId);
    recordTeamsCaptionDebug("teamsCaptionProcessDebug", "speaker-switched-new-caption", {
      entry: summarizeTeamsEntry(entry),
      extracted: { speaker, text },
      signature,
      existingCaptionId,
      newCaptionId: newId,
      captionsCount: captions.length,
    });
    return;
  }

  if (speaker === "Unknown") {
    const latestPendingCaption = getLatestPendingCaption();
    if (
      latestPendingCaption &&
      latestPendingCaption.speaker !== "Unknown" &&
      !latestPendingCaption.text.includes(text)
    ) {
      const mergedText = normalizeWhitespace(
        `${latestPendingCaption.text} ${text}`
      );
      addOrUpdateCaption(
        latestPendingCaption.id,
        latestPendingCaption.speaker,
        mergedText,
        {
          metadata: buildTeamsCaptionMetadata(
            entry,
            latestPendingCaption.speaker,
            mergedText
          ),
        }
      );
      rememberCaptionSignature(
        buildCaptionSignature(latestPendingCaption.speaker, mergedText)
      );
      scheduleFinalization(latestPendingCaption.id);
      elementToCaptionId.set(entry, latestPendingCaption.id);
      recordTeamsCaptionDebug("teamsCaptionProcessDebug", "merged-unknown-into-latest-pending", {
        entry: summarizeTeamsEntry(entry),
        extracted: { speaker, text },
        mergedSpeaker: latestPendingCaption.speaker,
        mergedText,
        pendingCaptionId: latestPendingCaption.id,
        captionsCount: captions.length,
      });
      return;
    }
  }

  if (hasRecentCaptionSignature(signature)) {
    recordTeamsCaptionDebug("teamsCaptionProcessDebug", "ignored-recent-signature", {
      entry: summarizeTeamsEntry(entry),
      extracted: { speaker, text },
      signature,
      captionsCount: captions.length,
    });
    return;
  }

  finalizePendingCaptions();

  const newId = addOrUpdateCaption(null, speaker, text, { metadata });
  elementToCaptionId.set(entry, newId);
  rememberCaptionSignature(signature);
  scheduleFinalization(newId);
  recordTeamsCaptionDebug("teamsCaptionProcessDebug", "created-new-caption", {
    entry: summarizeTeamsEntry(entry),
    extracted: { speaker, text },
    signature,
    newCaptionId: newId,
    captionsCount: captions.length,
  });
}

function extractCaptions(): void {
  const entries = getCaptionEntries();
  if (entries.length === 0) {
    return;
  }

  entries.forEach(processCaptionEntry);
}

function hasVisibleTeamsCaptionContent(): boolean {
  const entries = getCaptionEntries();
  if (entries.length === 0) {
    return false;
  }

  return entries.some((entry) => {
    const extracted = extractSpeakerAndText(entry);
    return Boolean(
      extracted &&
        isLikelyCaptionText(extracted.text) &&
        !isLikelySystemMessage(extracted.speaker, extracted.text)
    );
  });
}

function hasTeamsCaptionPlaceholderState(): boolean {
  const placeholders = Array.from(document.querySelectorAll(CAPTION_PLACEHOLDER_SELECTORS)).filter(
    (element) => !isInsideExtension(element) && isVisibleElement(element)
  );

  if (placeholders.length === 0) {
    return false;
  }

  return placeholders.some((element) =>
    /captions will be shown in/i.test(normalizeWhitespace(element.textContent || ""))
  );
}

function hasOpenedTeamsCaptionWindow(): boolean {
  const hasPlaceholder = hasTeamsCaptionPlaceholderState();
  const visibleWindows = Array.from(document.querySelectorAll(CAPTION_WINDOW_SELECTORS)).filter(
    (element) => !isInsideExtension(element) && isVisibleElement(element)
  );

  if (visibleWindows.length === 0) {
    return false;
  }

  const hasDismissControl = Array.from(
    document.querySelectorAll(CAPTION_DISMISS_CONTROL_SELECTORS)
  ).some((element) => !isInsideExtension(element) && isVisibleElement(element));

  if (!hasDismissControl) {
    return false;
  }

  return visibleWindows.some(
    (windowElement) =>
      hasPlaceholder ||
      windowElement.querySelector(ACTIVE_CAPTION_SURFACE_SELECTORS) !== null
  );
}

function hasActiveTeamsCaptionSurface(): boolean {
  if (hasVisibleTeamsCaptionContent()) {
    return true;
  }

  const activeSurfaceNodes = Array.from(
    document.querySelectorAll(ACTIVE_CAPTION_SURFACE_SELECTORS)
  ).filter((element) => !isInsideExtension(element) && isVisibleElement(element));

  if (activeSurfaceNodes.length > 0) {
    return true;
  }

  const regions = getCaptionRegions();
  if (regions.length === 0) {
    return false;
  }

  return regions.some((region) => {
    const hasActiveSurface = region.querySelector(ACTIVE_CAPTION_SURFACE_SELECTORS) !== null;
    const hasPlaceholder = region.querySelector(CAPTION_PLACEHOLDER_SELECTORS) !== null;
    return hasActiveSurface && !hasPlaceholder;
  });
}

function hasTeamsCaptionSurface(): boolean {
  if (hasActiveTeamsCaptionSurface()) {
    return true;
  }

  if (hasOpenedTeamsCaptionWindow()) {
    return true;
  }

  return false;
}

function getVisibleTeamsActionableControls(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(TEAMS_ACTIONABLE_CONTROL_SELECTORS)).filter(
    (element) => !isInsideExtension(element) && isVisibleElement(element)
  );
}

function matchesTeamsControlLabel(element: Element, pattern: RegExp): boolean {
  const ariaLabel = normalizeWhitespace(element.getAttribute("aria-label") || "");
  const visibleText = normalizeWhitespace(element.textContent || "");
  return pattern.test(ariaLabel) || pattern.test(visibleText);
}

function getTeamsLiveCaptionsMenuItem(): HTMLElement | null {
  const explicitToggle = document.querySelector<HTMLElement>(
    '#closed-captions-button, [data-inp="closed-captions-button"]'
  );
  if (explicitToggle && !isInsideExtension(explicitToggle) && isVisibleElement(explicitToggle)) {
    return explicitToggle;
  }

  return (
    getVisibleTeamsActionableControls().find((element) =>
      matchesTeamsControlLabel(element, /^(show|hide) live captions$/i)
    ) || null
  );
}

function isTeamsLiveCaptionsToggleEnabled(toggle: Element | null): boolean {
  if (!toggle) {
    return false;
  }

  const ariaChecked = normalizeWhitespace(toggle.getAttribute("aria-checked") || "");
  if (ariaChecked === "true") {
    return true;
  }

  const moduleName = normalizeWhitespace(toggle.getAttribute("data-track-module-name") || "");
  if (/stoplivecaptionsbutton/i.test(moduleName)) {
    return true;
  }

  return matchesTeamsControlLabel(toggle, /^hide live captions$/i);
}

function isTeamsLiveCaptionsEnabled(): boolean {
  if (hasTeamsCaptionSurface()) {
    return true;
  }

  return isTeamsLiveCaptionsToggleEnabled(getTeamsLiveCaptionsMenuItem());
}

function getTeamsStoredClosedCaptionsPreference(): boolean | null {
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.includes(TEAMS_CLOSED_CAPTIONS_STORAGE_KEY_FRAGMENT)) {
        continue;
      }

      const rawValue = window.localStorage.getItem(key);
      if (!rawValue) {
        continue;
      }

      const parsed = JSON.parse(rawValue) as { stickyClosedCaptions?: unknown };
      if (typeof parsed.stickyClosedCaptions === "boolean") {
        return parsed.stickyClosedCaptions;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function dispatchTeamsLiveCaptionsShortcut(): void {
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const targets = [activeElement, document.body, document.documentElement, document, window]
    .filter((target): target is EventTarget => Boolean(target));
  const uniqueTargets = Array.from(new Set(targets));

  const createKeyboardEvent = (type: "keydown" | "keyup") => {
    const event = new KeyboardEvent(type, {
      key: "C",
      code: "KeyC",
      altKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    Object.defineProperty(event, "keyCode", {
      configurable: true,
      get: () => 67,
    });
    Object.defineProperty(event, "which", {
      configurable: true,
      get: () => 67,
    });

    return event;
  };

  for (const target of uniqueTargets) {
    target.dispatchEvent(createKeyboardEvent("keydown"));
  }

  for (const target of uniqueTargets) {
    target.dispatchEvent(createKeyboardEvent("keyup"));
  }
}

function normalizeTeamsTitle(rawTitle: string): string | undefined {
  const title = rawTitle
    .replace(/^\(\d+\)\s*/i, "")
    .replace(/^(chat|files|photos)\s*\|\s*/i, "")
    .replace(/\s*\|\s*Microsoft Teams\s*$/i, "")
    .replace(/\s*\|\s*Teams\s*$/i, "")
    .trim();

  if (!title) {
    return undefined;
  }

  if (
    /^microsoft teams$/i.test(title) ||
    /^teams$/i.test(title) ||
    /^microsoft teams meeting$/i.test(title)
  ) {
    return undefined;
  }

  return title || undefined;
}

function extractTeamsVisibleMeetingTitle(): string | undefined {
  const candidates = [
    document.querySelector('[data-tid="meeting-title"]'),
    document.querySelector('[data-tid="prejoin-meeting-title"]'),
    document.querySelector('[data-tid="calling-meeting-title"]'),
  ];

  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLElement)) {
      continue;
    }

    const text = normalizeTeamsTitle(candidate.textContent || "");
    if (text) {
      return text;
    }
  }

  return undefined;
}

function extractTeamsMeetingCodeFromLastMeetingContext(): string | undefined {
  try {
    const rawValue = window.localStorage.getItem("lastMeetingContext");
    if (!rawValue) {
      return undefined;
    }

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") {
      return undefined;
    }

    const entries = Object.entries(parsed)
      .map(([meetingCode, value]) => ({
        meetingCode,
        timestamp:
          typeof (value as { timestamp?: unknown })?.timestamp === "number"
            ? (value as { timestamp: number }).timestamp
            : 0,
      }))
      .filter((entry) => /^\d{6,}$/.test(entry.meetingCode))
      .sort((left, right) => right.timestamp - left.timestamp);

    return entries[0]?.meetingCode;
  } catch {
    return undefined;
  }
}

function extractTeamsMeetingCodeFromCallHistory(): string | undefined {
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !/CallingDropsCollectorService:CallEntries:History/i.test(key)) {
        continue;
      }

      const rawValue = window.localStorage.getItem(key);
      if (!rawValue) {
        continue;
      }

      const entries = JSON.parse(rawValue);
      if (!Array.isArray(entries)) {
        continue;
      }

      const latestEntry = entries
        .map((entry) => ({
          meetingCode:
            typeof entry?.ids?.meetingCode === "string"
              ? entry.ids.meetingCode.trim()
              : undefined,
          heartbeatTimestamp:
            typeof entry?.aggregate?.heartbeatTimestamp === "number"
              ? entry.aggregate.heartbeatTimestamp
              : 0,
        }))
        .filter(
          (entry): entry is { meetingCode: string; heartbeatTimestamp: number } =>
            Boolean(entry.meetingCode && /^\d{6,}$/.test(entry.meetingCode))
        )
        .sort((left, right) => right.heartbeatTimestamp - left.heartbeatTimestamp)[0];

      if (latestEntry?.meetingCode) {
        return latestEntry.meetingCode;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function extractTeamsLocalMeetingCode(): string | undefined {
  return (
    extractTeamsMeetingCodeFromLastMeetingContext() ||
    extractTeamsMeetingCodeFromCallHistory()
  );
}

function extractTeamsThreadIdFromSessionStorage(): string | undefined {
  try {
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (!key || !/mainWindowNavHistory/i.test(key)) {
        continue;
      }

      const rawValue = window.sessionStorage.getItem(key);
      if (!rawValue) {
        continue;
      }

      const historyEntries = JSON.parse(rawValue);
      if (!Array.isArray(historyEntries)) {
        continue;
      }

      for (const entry of historyEntries) {
        const activeEntities = entry?.activeEntities;
        if (!activeEntities || typeof activeEntities !== "object") {
          continue;
        }

        const candidateIds = [
          activeEntities.headerEntity?.id,
          activeEntities.mainEntity?.id,
          activeEntities.midNavEntity?.id,
          activeEntities.startEntity?.id,
          activeEntities.endEntity?.id,
        ];

        const threadId = candidateIds.find(
          (value) =>
            typeof value === "string" &&
            /^19:meeting_.+@thread\.v2$/i.test(value.trim())
        );

        if (threadId) {
          return threadId.trim();
        }
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function extractTeamsThreadId(url: URL): string | undefined {
  const matchupPath = url.pathname.match(/\/l\/meetup-join\/([^/]+)/);
  if (matchupPath?.[1]) {
    try {
      return decodeURIComponent(matchupPath[1]);
    } catch {
      return matchupPath[1];
    }
  }

  const threadId = url.searchParams.get("threadId");
  if (threadId) {
    return threadId;
  }

  return extractTeamsThreadIdFromSessionStorage();
}

function isTeamsLiveHost(url: URL): boolean {
  return url.hostname === "teams.live.com" || url.hostname.endsWith(".teams.live.com");
}

function isTeamsMicrosoftHost(url: URL): boolean {
  return (
    url.hostname === "teams.microsoft.com" ||
    url.hostname.endsWith(".teams.microsoft.com")
  );
}

function extractTeamsLiveMeetingCode(url: URL): string | undefined {
  if (isTeamsLiveHost(url)) {
    return undefined;
  }

  const match = url.pathname.match(/^\/meet\/([^/?]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function extractTeamsLiveShareCode(url: URL): string | undefined {
  return url.searchParams.get("p") || undefined;
}

function shouldUseStorageBackedTeamsMeetingCode(url: URL): boolean {
  if (!isTeamsLiveHost(url) || !url.pathname.startsWith("/v2/")) {
    return true;
  }

  if (hasTeamsJoinNowControl()) {
    return true;
  }

  if (isTeamsScheduledMeetingUrl(url) || hasTeamsScheduledMeetingReferrer()) {
    return true;
  }

  return false;
}

function resolveTeamsMeetingCode(url: URL): string | undefined {
  const liveMeetingCode = extractTeamsLiveMeetingCode(url);
  const localMeetingCode = shouldUseStorageBackedTeamsMeetingCode(url)
    ? extractTeamsLocalMeetingCode()
    : undefined;

  // On Teams `/v2/`, storage-backed lobby state is often fresher than any
  // previously remembered `/meet/...` URL from an older visit.
  if (localMeetingCode && (!liveMeetingCode || liveMeetingCode !== localMeetingCode)) {
    return localMeetingCode;
  }

  return liveMeetingCode || localMeetingCode;
}

function extractTeamsMeetingId(url: URL): string | undefined {
  return resolveTeamsMeetingCode(url);
}

function extractTeamsParticipantLabel(): string | undefined {
  const candidate =
    document.querySelector('[data-tid="calling-pagination"] [data-tid]') ||
    document.querySelector('[data-tid="calling-pagination"] [aria-label]') ||
    document.querySelector('[data-tid="calling-screen-avatar"] img') ||
    document.querySelector('[data-tid="calling-participant-stream"]');

  if (!candidate) {
    return undefined;
  }

  const dataTid = normalizeWhitespace(candidate.getAttribute("data-tid") || "");
  if (
    dataTid &&
    !/^calling-pagination$/i.test(dataTid) &&
    !/^calling-screen-avatar$/i.test(dataTid) &&
    !/^calling-participant-stream$/i.test(dataTid)
  ) {
    return dataTid;
  }

  const ariaLabel = normalizeWhitespace(candidate.getAttribute("aria-label") || "");
  if (
    ariaLabel &&
    !/^(meeting controls|calling controls|calling indicators)$/i.test(ariaLabel)
  ) {
    return ariaLabel;
  }

  if (candidate instanceof HTMLImageElement) {
    const src = candidate.getAttribute("src") || "";
    const match = src.match(/[?&]displayname=([^&]+)/i);
    if (match?.[1]) {
      return decodeTeamsDisplayName(match[1]);
    }
  }

  return undefined;
}

function extractTeamsFallbackIdentifier(): string | undefined {
  const participantLabel = extractTeamsParticipantLabel();
  if (participantLabel) {
    return participantLabel;
  }

  const title =
    extractTeamsVisibleMeetingTitle() || normalizeTeamsTitle(document.title || "");
  return title || undefined;
}

function getTeamsCanonicalUrl(url: URL): URL {
  return url;
}

function hasTeamsLeaveControl(): boolean {
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>(TEAMS_LEAVE_BUTTON_SELECTOR)
  ).filter(
    (element) =>
      element.closest("#captionarc-overlay") === null &&
      isVisibleElement(element)
  );

  return buttons.some((button) => {
    const ariaLabel = normalizeWhitespace(button.getAttribute("aria-label") || "");
    const visibleText = normalizeWhitespace(button.textContent || "");

    return /^leave$/i.test(ariaLabel) || /^leave$/i.test(visibleText);
  });
}

function hasTeamsJoinNowControl(): boolean {
  const buttons = Array.from(document.querySelectorAll<HTMLElement>("button")).filter(
    (element) =>
      element.closest("#captionarc-overlay") === null &&
      isVisibleElement(element)
  );

  return buttons.some((button) => {
    const ariaLabel = normalizeWhitespace(button.getAttribute("aria-label") || "");
    const visibleText = normalizeWhitespace(button.textContent || "");

    return /^join now$/i.test(ariaLabel) || /^join now$/i.test(visibleText);
  });
}

function isTeamsScheduledMeetingUrl(url: URL): boolean {
  if (isTeamsLiveHost(url)) {
    return false;
  }

  if (!isTeamsMicrosoftHost(url)) {
    return false;
  }

  return (
    url.pathname.includes("/l/meetup-join/") || url.pathname.includes("/meet/")
  );
}

function hasTeamsScheduledMeetingReferrer(): boolean {
  const referrer = document.referrer;
  if (!referrer) {
    return false;
  }

  if (/teams\.live\.com\/meet\//i.test(referrer)) {
    return true;
  }

  return /teams\.live\.com\/dl\/launcher\/launcher\.html/i.test(referrer) &&
    /(?:url=|%2F)meet%2F/i.test(referrer);
}

function isTeamsDirectCallContext(url: URL): boolean {
  if (!isTeamsLiveHost(url) || !url.pathname.startsWith("/v2/")) {
    return false;
  }

  if (!hasTeamsLeaveControl() || hasTeamsJoinNowControl()) {
    return false;
  }

  if (isTeamsScheduledMeetingUrl(url) || hasTeamsScheduledMeetingReferrer()) {
    return false;
  }

  return true;
}

function isTeamsMeetingContext(url: URL): boolean {
  const title =
    extractTeamsVisibleMeetingTitle() || normalizeTeamsTitle(document.title || "");
  const hasMeetingTitle =
    Boolean(title) &&
    /^(meeting with|meet now|call with|incoming call|meeting)/i.test(title || "");

  const hasCaptionControls =
    document.querySelector('[data-tid="closed-captions-settings-menu-trigger-button"]') !==
      null ||
    document.querySelector('[data-tid="captions-panel-dismiss-button"]') !== null ||
    document.querySelector('[aria-label*="Live Caption" i]') !== null ||
    document.querySelector('[aria-label*="Hide live captions" i]') !== null;

  const hasMeetingChrome =
    document.querySelector('[data-tid*="calling-screen"]') !== null ||
    document.querySelector('[data-tid*="call-control"]') !== null ||
    document.querySelector('[data-tid*="meeting-stage"]') !== null;
  const hasJoinNowControl = hasTeamsJoinNowControl();
  const hasLeaveControl = hasTeamsLeaveControl();

  if (url.pathname.startsWith("/meet/")) {
    return true;
  }

  if (url.pathname.startsWith("/v2/")) {
    return (
      hasJoinNowControl ||
      hasLeaveControl ||
      hasCaptionControls ||
      getCaptionRegions().length > 0
    );
  }

  return (
    hasJoinNowControl ||
    hasLeaveControl ||
    hasCaptionControls ||
    hasMeetingChrome ||
    hasMeetingTitle
  );
}

function getTeamsMeetingPresence(url: URL): MeetingPresenceState {
  const hasLeaveControl = hasTeamsLeaveControl();
  if (hasLeaveControl) {
    hasSeenTeamsLeaveControl = true;
    return "joined";
  }

  const hasJoinNowControl = hasTeamsJoinNowControl();
  if (hasJoinNowControl) {
    hasSeenTeamsLeaveControl = false;
    return "prejoin";
  }

  if (
    !microsoftTeamsProvider.matchesUrl(url) &&
    !microsoftTeamsProvider.matchesPageContext(url)
  ) {
    return "unknown";
  }

  if (hasSeenTeamsLeaveControl) {
    return "ended";
  }

  if (isTeamsScheduledMeetingUrl(url)) {
    return "prejoin";
  }

  return isTeamsMeetingContext(url) ? "prejoin" : "unknown";
}

function getTeamsSessionMetadataForUrl(runtimeUrl: URL) {
  const canonicalUrl = getTeamsCanonicalUrl(runtimeUrl);
  const sourceUrl = canonicalUrl.href;
  const isDirectCall = isTeamsDirectCallContext(runtimeUrl);
  const resolvedMeetingCode = isDirectCall
    ? undefined
    : resolveTeamsMeetingCode(runtimeUrl);
  const meetingId = isDirectCall
    ? undefined
    : resolvedMeetingCode || extractTeamsMeetingId(canonicalUrl);
  const meetingCode = isDirectCall
    ? undefined
    : resolvedMeetingCode || extractTeamsLiveMeetingCode(canonicalUrl);
  const callType = isDirectCall ? "direct-call" : "scheduled-meeting";

  return {
    platform: "microsoft-teams" as const,
    providerLabel: getProviderLabel("microsoft-teams"),
    title:
      extractTeamsVisibleMeetingTitle() ||
      normalizeTeamsTitle(document.title),
    sourceUrl,
    identifiers: {
      meetingId,
      meetingCode,
      callType,
    },
  };
}

export const microsoftTeamsProvider: MeetingProvider = {
  platform: "microsoft-teams",

  matchesUrl(url) {
    if (isTeamsLiveHost(url)) {
      return url.pathname.startsWith("/v2/");
    }

    if (!isTeamsMicrosoftHost(url)) {
      return false;
    }

    return (
      url.pathname.includes("/l/meetup-join/") || url.pathname.includes("/meet/")
    );
  },

  matchesPageContext(url) {
    if (!isTeamsMicrosoftHost(url) && !isTeamsLiveHost(url)) {
      return false;
    }

    return (
      isTeamsScheduledMeetingUrl(url) ||
      hasTeamsLeaveControl() ||
      isTeamsMeetingContext(url)
    );
  },

  bootstrap() {
    return undefined;
  },

  getMeetingPresence() {
    return getTeamsMeetingPresence(new URL(window.location.href));
  },

  startCaptionObserver() {
    let observers: MutationObserver[] = [];
    let chatObserver: MutationObserver | null = null;
    let extractTimeout: ReturnType<typeof setTimeout> | null = null;
    let chatExtractTimeout: ReturnType<typeof setTimeout> | null = null;
    let currentChatRegion: HTMLElement | null = null;

    const debouncedExtract = () => {
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }

      extractTimeout = setTimeout(() => {
        extractCaptions();
      }, 120);
    };

    const debouncedExtractChat = () => {
      if (chatExtractTimeout) {
        clearTimeout(chatExtractTimeout);
      }

      chatExtractTimeout = setTimeout(() => {
        extractTeamsChatMessages();
      }, 120);
    };

    const resetObservers = () => {
      for (const observer of observers) {
        observer.disconnect();
      }
      observers = [];

      if (chatObserver) {
        chatObserver.disconnect();
        chatObserver = null;
      }
      currentChatRegion = null;
    };

    const bindObservers = () => {
      resetObservers();

      const regions = getCaptionRegions();
      for (const region of regions) {
        const observer = new MutationObserver(debouncedExtract);
        observer.observe(region, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        observers.push(observer);
      }
    };

    const observeChatRegion = () => {
      const chatRegion = getTeamsChatRegion();
      const needsReobserve =
        chatRegion &&
        (!currentChatRegion ||
          chatRegion !== currentChatRegion ||
          !document.body.contains(currentChatRegion));

      if (!needsReobserve || !chatRegion) {
        return;
      }

      if (chatObserver) {
        chatObserver.disconnect();
      }

      currentChatRegion = chatRegion;
      chatObserver = new MutationObserver(debouncedExtractChat);
      chatObserver.observe(chatRegion, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    };

    const updateCaptioningState = () => {
      bindObservers();
      observeChatRegion();

      const hasCaptionSurface = hasTeamsCaptionSurface();
      const hasCaptions = hasVisibleTeamsCaptionContent();
      const captionRegions = getCaptionRegions();
      const captionEntries = getCaptionEntries();
      recordTeamsCaptionDebug("teamsCaptionObserverDebug", "observer-tick", {
        hasCaptionSurface,
        hasCaptions,
        captionRegionCount: captionRegions.length,
        captionEntryCount: captionEntries.length,
        currentCaptionsCount: captions.length,
        currentLiveChatCount: liveChatMessages.length,
      });

      if (hasCaptionSurface && !isCCEnabled) {
        setCCEnabled(true);
        closeCaptureGuide();
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      if (!hasCaptionSurface && isCCEnabled) {
        setCCEnabled(false);
        if (getTeamsMeetingPresence(new URL(window.location.href)) === "joined") {
          openCaptureGuide();
        } else {
          closeCaptureGuide();
        }
        finalizePendingCaptions();
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      if (hasCaptionSurface) {
        extractCaptions();
      }

      extractTeamsChatMessages();
    };

    if (document.body) {
      bindObservers();
    }

    const intervalId = setInterval(updateCaptioningState, 1800);
    updateCaptioningState();

    return () => {
      clearInterval(intervalId);
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      if (chatExtractTimeout) {
        clearTimeout(chatExtractTimeout);
      }
      resetObservers();
      setCCEnabled(false);
      finalizePendingCaptions();
    };
  },

  getSessionMetadata() {
    return getTeamsSessionMetadataForUrl(new URL(window.location.href));
  },

  getEmptyState() {
    const t = getUiRuntimeTranslator();

    return {
      waitingTitle: t("content.empty.waitingForCaptionsTitle"),
      waitingBody: t("content.empty.waitingForCaptionsTeams"),
    };
  },

  getCaptureGuide() {
    const t = getUiRuntimeTranslator();

    return {
      modalTitle: t("content.captureGuide.providers.microsoftTeams.title"),
      modalBody: t("content.captureGuide.providers.microsoftTeams.body"),
      statusLabel: t("content.captureGuide.providers.microsoftTeams.status"),
      footerNote: t("content.captureGuide.providers.microsoftTeams.footer"),
      steps: [
        {
          title: t("content.captureGuide.providers.microsoftTeams.steps.openMore.title"),
          detail: t(
            "content.captureGuide.providers.microsoftTeams.steps.openMore.detail"
          ),
        },
        {
          title: t(
            "content.captureGuide.providers.microsoftTeams.steps.openLanguage.title"
          ),
          detail: t(
            "content.captureGuide.providers.microsoftTeams.steps.openLanguage.detail"
          ),
        },
        {
          title: t(
            "content.captureGuide.providers.microsoftTeams.steps.chooseCaptions.title"
          ),
          detail: t(
            "content.captureGuide.providers.microsoftTeams.steps.chooseCaptions.detail"
          ),
        },
      ],
      troubleshootingHint: t(
        "content.captureGuide.providers.microsoftTeams.troubleshooting"
      ),
    };
  },

  isCaptioningCurrentlyAvailable() {
    return isTeamsLiveCaptionsEnabled();
  },

  async tryEnableLiveCaptions(timeoutMs) {
    if (isTeamsLiveCaptionsEnabled()) {
      return true;
    }

    if (getTeamsStoredClosedCaptionsPreference() === true) {
      return true;
    }

    dispatchTeamsLiveCaptionsShortcut();

    const verifyDeadline = Math.min(
      Date.now() + Math.max(0, timeoutMs),
      Date.now() + TEAMS_CAPTION_ENABLE_VERIFY_TIMEOUT_MS
    );

    while (Date.now() < verifyDeadline) {
      if (
        isTeamsLiveCaptionsEnabled() ||
        getTeamsStoredClosedCaptionsPreference() === true
      ) {
        return true;
      }

      await delay(TEAMS_CAPTION_ENABLE_POLL_INTERVAL_MS);
    }

    return (
      isTeamsLiveCaptionsEnabled() ||
      getTeamsStoredClosedCaptionsPreference() === true
    );
  },
};

export const microsoftTeamsProviderInternals = {
  extractTeamsChatMessages,
  processCaptionEntry,
  startCaptionObserver: () => microsoftTeamsProvider.startCaptionObserver(),
  getCaptionRegions,
  extractCaptionEntries: getCaptionEntries,
  extractSpeakerAndText,
  extractTeamsFallbackIdentifier,
  extractTeamsMeetingId,
  extractTeamsParticipantLabel,
  extractTeamsThreadId,
  getTeamsMeetingPresence,
  getTeamsSessionMetadataForUrl,
  isTeamsDirectCallContext,
  isTeamsMeetingContext,
  normalizeTeamsTitle,
  setDirectCallChatCaptureFloorOverride: (value: number | null | undefined) => {
    directCallChatCaptureFloorOverride = value;
  },
};
