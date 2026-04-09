import type { Caption } from "./types";
import {
  captions,
  captionActivationState,
  liveChatMessages,
  settings,
  isCCEnabled,
  captureConsentState,
  captureGuideElement,
  meetingPresenceState,
  captionList,
  overlay,
  emptyStateMessage,
} from "./state";
import { createElement, copyToClipboard } from "./libs";
import { updateCaptionTranslation, startEditTranslation } from "./caption-ui";
import { TranslationStatus } from "./constants";
import {
  detectTextDirection,
  getLanguageDirection,
} from "../shared/language-metadata";
import {
  formatSessionOffset,
  getSegmentedSessionOffsetMs,
  getMeetingSessionTimelineSegmentForTimestamp,
  type MeetingSessionTimelineSegment,
} from "../shared/meeting-session";
import { sanitizeStoredRichTextHtml } from "../shared/rich-text";
import { getUiRuntimeTranslator } from "../shared/i18n";
import { syncOverlayFooter } from "./overlay/footer";
import {
  syncCompactStatus,
  syncHeaderCopy,
  syncTranslationDock,
} from "./overlay/header";
import { syncAssistantSurface } from "./overlay/assistant-surface";
import {
  getCurrentSessionOffsetForTimestamp,
  getCurrentSessionSnapshot,
  getPendingSessionPreviewSnapshot,
} from "./history-service";

export const SESSION_ENDED_CLOSE_REQUEST_EVENT =
  "captionarc:session-ended-close-request";

type RenderableTimelineEntry =
  | { kind: "item"; item: Caption }
  | { kind: "separator"; segment: MeetingSessionTimelineSegment };

function getOverlayContentElement(): HTMLElement | null {
  if (!overlay) {
    return null;
  }

  const content = overlay.querySelector(".mc-content");
  return content instanceof HTMLElement ? content : null;
}

export function scrollToBottomIfNeeded(): void {
  const content = getOverlayContentElement();
  if (!content) return;

  const isEditing = content.querySelector(".mc-translation-edit") !== null;
  if (isEditing) return;

  const isNearBottom =
    content.scrollHeight - content.scrollTop - content.clientHeight < 100;
  if (isNearBottom) {
    content.scrollTop = content.scrollHeight;
  }
}

function shouldStickToBottom(): boolean {
  const content = getOverlayContentElement();
  if (!content) {
    return false;
  }

  const isEditing = content.querySelector(".mc-translation-edit") !== null;
  if (isEditing) {
    return false;
  }

  return content.scrollHeight - content.scrollTop - content.clientHeight < 100;
}

export function scrollOverlayToBottom(): void {
  const content = getOverlayContentElement();
  if (!content) {
    return;
  }

  content.scrollTop = content.scrollHeight;
}

function showCopyFeedback(element: HTMLElement): void {
  const caption = element.closest(".mc-caption");
  if (!caption) return;

  const t = getUiRuntimeTranslator();

  const existing = caption.querySelector(".mc-copy-indicator");
  if (existing) existing.remove();

  element.classList.add("mc-copied");

  const indicator = document.createElement("span");
  indicator.className = "mc-copy-indicator";
  indicator.textContent = `✓ ${t("content.copyFeedback")}`;

  caption.appendChild(indicator);

  setTimeout(() => {
    element.classList.remove("mc-copied");
    indicator.remove();
  }, 2000);
}

function getMeetingChatBadgeLabel(): string {
  return getUiRuntimeTranslator()("content.timeline.meetingChat");
}

function getEmptyStateCopy(): {
  title: string;
  body: string;
  stateClass: string;
} {
  const t = getUiRuntimeTranslator();

  if (captureConsentState === "pending") {
    return {
      title: t("content.empty.capturePendingTitle"),
      body: t("content.empty.capturePendingBody"),
      stateClass: "mc-empty-pending",
    };
  }

  if (captureConsentState === "approved") {
    return {
      title: t("content.empty.captureStartingTitle"),
      body: t("content.empty.captureStartingBody"),
      stateClass: "mc-empty-starting",
    };
  }

  if (captureConsentState === "dismissed") {
    return {
      title: t("content.empty.captureDismissedTitle"),
      body: t("content.empty.captureDismissedBody"),
      stateClass: "mc-empty-dismissed",
    };
  }

  if (meetingPresenceState === "ended") {
    return {
      title: t("content.empty.sessionEndedTitle"),
      body: t("content.empty.sessionEndedBody"),
      stateClass: "mc-empty-ended",
    };
  }

  if (meetingPresenceState !== "joined") {
    return {
      title: t("content.empty.waitingToJoinTitle"),
      body: t("content.empty.waitingToJoinBody"),
      stateClass: "mc-empty-waiting",
    };
  }

  if (captionActivationState === "attempting") {
    return {
      title: t("content.empty.enablingCaptionsTitle"),
      body: t("content.empty.enablingCaptionsBody"),
      stateClass: "mc-empty-waiting",
    };
  }

  if (isCCEnabled) {
    return {
      title: t("content.empty.readyTitle"),
      body: t("content.empty.readyBody"),
      stateClass: "mc-empty-ready",
    };
  }

  return {
    title: emptyStateMessage.waitingTitle,
    body: emptyStateMessage.waitingBody,
    stateClass: "mc-empty-waiting",
  };
}

function createEmptyStateCard(inline = false): HTMLElement {
  const empty = createElement("div", {
    className: "mc-empty",
  });
  syncEmptyStateCard(empty, inline);

  return empty;
}

function syncEmptyStateCard(element: HTMLElement, inline = false): void {
  const t = getUiRuntimeTranslator();
  const emptyStateCopy = getEmptyStateCopy();
  element.className = `mc-empty ${emptyStateCopy.stateClass}${inline ? " mc-empty-inline" : ""}`;

  let visual = element.querySelector(".mc-empty-visual") as HTMLElement | null;
  if (!visual) {
    visual = createElement("div", { className: "mc-empty-visual" }, [
      createElement("span", { className: "mc-empty-visual-bar" }),
      createElement("span", { className: "mc-empty-visual-bar" }),
      createElement("span", { className: "mc-empty-visual-bar" }),
    ]);
    element.appendChild(visual);
  }

  let title = element.querySelector(".mc-empty-title") as HTMLElement | null;
  if (!title) {
    title = createElement("div", { className: "mc-empty-title" });
    element.appendChild(title);
  }

  let body = element.querySelector(".mc-empty-body") as HTMLElement | null;
  if (!body) {
    body = createElement("div", { className: "mc-empty-body" });
    element.appendChild(body);
  }

  title.textContent = emptyStateCopy.title;
  body.textContent = emptyStateCopy.body;

  let actions = element.querySelector(".mc-empty-actions") as HTMLElement | null;
  if (meetingPresenceState === "ended") {
    if (!actions) {
      actions = createElement("div", { className: "mc-empty-actions" }, [
        createElement(
          "button",
          {
            type: "button",
            className: "mc-empty-action mc-empty-action-secondary",
            onClick: () => {
              window.dispatchEvent(
                new CustomEvent(SESSION_ENDED_CLOSE_REQUEST_EVENT)
              );
            },
          },
          [t("content.empty.close")]
        ),
      ]);
      element.appendChild(actions);
    }
  } else {
    actions?.remove();
  }
}

function appendCaptureGuideToList(): void {
  if (!captionList || !captureGuideElement) {
    return;
  }

  if (captureGuideElement.parentElement !== captionList) {
    captionList.appendChild(captureGuideElement);
    return;
  }

  captionList.appendChild(captureGuideElement);
}

function formatCompactGap(gapMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(gapMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (totalMinutes > 0) {
    return `${totalMinutes}m`;
  }

  return `${totalSeconds}s`;
}

function formatSegmentResumeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function syncSessionSeparatorContent(
  element: HTMLElement,
  segment: MeetingSessionTimelineSegment
): void {
  const t = getUiRuntimeTranslator();

  element.dataset.segmentIndex = String(segment.index);
  const titleEl = element.querySelector(
    ".mc-session-separator-title"
  ) as HTMLElement | null;
  const detailEl = element.querySelector(
    ".mc-session-separator-detail"
  ) as HTMLElement | null;

  if (titleEl) {
    titleEl.textContent = t("content.sessionSeparator.title", {
      index: segment.index + 1,
    });
  }

  if (detailEl) {
    detailEl.textContent = t("content.sessionSeparator.detail", {
      time: formatSegmentResumeTime(segment.startTime),
      gap: formatCompactGap(segment.gapMs),
    });
  }
}

function createSessionSeparatorElement(
  segment: MeetingSessionTimelineSegment
): HTMLElement {
  const t = getUiRuntimeTranslator();
  const element = createElement("div", {
    className: "mc-session-separator",
    "data-segment-index": String(segment.index),
    "aria-label": t("content.sessionSeparator.ariaLabel", {
      index: segment.index + 1,
    }),
  });

  element.appendChild(createElement("span", { className: "mc-session-separator-line" }));
  element.appendChild(
    createElement("div", { className: "mc-session-separator-pill" }, [
      createElement("div", { className: "mc-session-separator-title" }),
      createElement("div", { className: "mc-session-separator-detail" }),
    ])
  );
  element.appendChild(createElement("span", { className: "mc-session-separator-line" }));

  syncSessionSeparatorContent(element, segment);
  return element;
}

function getOverlayTimelineContext() {
  return getCurrentSessionSnapshot() || getPendingSessionPreviewSnapshot();
}

function getRenderableEntries(): RenderableTimelineEntry[] {
  const items = getRenderableItems();
  const session = getOverlayTimelineContext();

  if (!session || !session.rejoinHistory || session.rejoinHistory.length === 0) {
    return items.map((item) => ({ kind: "item", item }));
  }

  const entries: RenderableTimelineEntry[] = [];
  let previousSegmentIndex: number | null = null;

  for (const item of items) {
    const segment = getMeetingSessionTimelineSegmentForTimestamp(
      item.historyTimestamp || item.timestamp,
      session.startTime,
      session.rejoinHistory
    );

    if (segment.index > 0 && segment.index !== previousSegmentIndex) {
      entries.push({ kind: "separator", segment });
    }

    entries.push({ kind: "item", item });
    previousSegmentIndex = segment.index;
  }

  return entries;
}

export function renderCaptions(updateOnly = false): void {
  if (!captionList) return;
  const content = getOverlayContentElement();
  const stickToBottom = shouldStickToBottom();
  const preservedScrollTop = !stickToBottom ? content?.scrollTop ?? null : null;
  const previousScrollHeight = content?.scrollHeight ?? 0;
  const renderableItems = getRenderableItems();
  const renderableEntries = getRenderableEntries();
  const spacerSelector = ".mc-list-end-spacer";
  const inlineEmptySelector = ".mc-empty-inline";
  captionList.classList.toggle("mc-list-empty", renderableItems.length === 0);

  if (renderableItems.length === 0) {
    while (captionList.firstChild) {
      captionList.removeChild(captionList.firstChild);
    }
    captionList.appendChild(createEmptyStateCard());
    appendCaptureGuideToList();
    syncHeaderCopy();
    syncCompactStatus();
    syncTranslationDock();
    syncOverlayFooter();
    syncAssistantSurface();
    return;
  }

  const inlineEmptyEl = captionList.querySelector(
    inlineEmptySelector
  ) as HTMLElement | null;
  const emptyEl = captionList.querySelector(
    ".mc-empty:not(.mc-empty-inline)"
  ) as HTMLElement | null;
  emptyEl?.remove();
  captionList.querySelector(spacerSelector)?.remove();

  const existingEntries = Array.from(
    captionList.querySelectorAll(".mc-caption, .mc-session-separator")
  );

  renderableEntries.forEach((entry, index) => {
    const existing = existingEntries[index] as HTMLElement | undefined;

    if (entry.kind === "separator") {
      if (existing?.classList.contains("mc-session-separator")) {
        syncSessionSeparatorContent(existing, entry.segment);
      } else {
        const separatorEl = createSessionSeparatorElement(entry.segment);
        if (existing) {
          existing.replaceWith(separatorEl);
        } else {
          captionList?.appendChild(separatorEl);
        }
      }
      return;
    }

    const c = entry.item;
    if (existing?.classList.contains("mc-caption")) {
      const item = existing;

      const currentId = item.getAttribute("data-caption-id");
      if (currentId !== String(c.id)) {
        item.setAttribute("data-caption-id", String(c.id));
      }

      item.classList.toggle("mc-chat-caption", c.source === "chat");
      item.dataset.captionSource = c.source || "caption";
      item.dataset.chatOwner = c.source === "chat" && c.own ? "self" : "participant";
      syncCaptionMeta(item, c);

      const textEl = item.querySelector(".mc-original");
      const timeEl = item.querySelector(".mc-time");
      const offsetEl = item.querySelector(".mc-session-offset");
      if (textEl instanceof HTMLElement) {
        syncOriginalContent(textEl, c);
      }
      if (timeEl) {
        timeEl.textContent = c.time;
      }
      syncSessionOffsetMeta(item, c, offsetEl as HTMLElement | null);
      updateCaptionTranslation(c);
      return;
    }

    const captionEl = createCaptionElement(c);
    if (existing) {
      existing.replaceWith(captionEl);
    } else {
      captionList?.appendChild(captionEl);
    }
    updateCaptionTranslation(c);
  });

  existingEntries.slice(renderableEntries.length).forEach((entry) => entry.remove());

  if (meetingPresenceState !== "joined") {
    const nextInlineEmpty = inlineEmptyEl || createEmptyStateCard(true);
    syncEmptyStateCard(nextInlineEmpty, true);
    captionList.appendChild(nextInlineEmpty);
  } else {
    inlineEmptyEl?.remove();
  }

  appendCaptureGuideToList();
  captionList.appendChild(
    createElement("div", {
      className: "mc-list-end-spacer",
      "aria-hidden": "true",
    })
  );

  if (!updateOnly && stickToBottom) {
    scrollOverlayToBottom();
  }

  if (stickToBottom && content && content.scrollHeight > previousScrollHeight) {
    scrollOverlayToBottom();
  }

  syncHeaderCopy();
  syncCompactStatus();
  syncTranslationDock();
  syncOverlayFooter();
  syncAssistantSurface();

  if (preservedScrollTop !== null && content) {
    const maxScrollTop = Math.max(0, content.scrollHeight - content.clientHeight);
    content.scrollTop = Math.min(preservedScrollTop, maxScrollTop);
  }
}

function getRenderableItems(): Caption[] {
  return [...captions, ...(settings.storeMeetingChat ? liveChatMessages : [])].sort(
    (left, right) => left.timestamp - right.timestamp
  );
}

function syncCaptionMeta(item: HTMLElement, caption: Caption): void {
  let metaEl = item.querySelector(".mc-caption-meta") as HTMLElement | null;
  let speakerEl = item.querySelector(".mc-speaker") as HTMLElement | null;

  if (!metaEl) {
    metaEl = createElement("div", { className: "mc-caption-meta" });
    if (speakerEl) {
      metaEl.appendChild(speakerEl);
      item.prepend(metaEl);
    }
  }

  if (!speakerEl) {
    speakerEl = createElement("div", { className: "mc-speaker" });
    metaEl?.prepend(speakerEl);
  }

  if (speakerEl.textContent !== caption.speaker) {
    speakerEl.textContent = caption.speaker;
  }

  const existingBadge = item.querySelector(".mc-chat-source-badge");
  if (caption.source === "chat") {
    if (!existingBadge) {
      metaEl?.appendChild(
        createElement("span", {
          className: "mc-chat-source-badge",
          textContent: getMeetingChatBadgeLabel(),
        })
      );
    } else if (existingBadge.textContent !== getMeetingChatBadgeLabel()) {
      existingBadge.textContent = getMeetingChatBadgeLabel();
    }
  } else if (existingBadge) {
    existingBadge.remove();
  }
}

function getRenderableSessionOffset(caption: Caption): number | undefined {
  const session = getOverlayTimelineContext();
  if (session) {
    return getSegmentedSessionOffsetMs(
      session.startTime,
      session.rejoinHistory || [],
      caption.historyTimestamp || caption.timestamp
    );
  }

  return getCurrentSessionOffsetForTimestamp(
    caption.historyTimestamp || caption.timestamp
  );
}

function syncSessionOffsetMeta(
  item: HTMLElement,
  caption: Caption,
  existingOffsetEl?: HTMLElement | null
): void {
  const sessionOffsetMs = getRenderableSessionOffset(caption);
  let offsetEl = existingOffsetEl;

  if (sessionOffsetMs === undefined) {
    offsetEl?.remove();
    return;
  }

  if (!offsetEl) {
    const footer = item.querySelector(".mc-caption-footer");
    if (!footer) {
      return;
    }

    offsetEl = createElement("span", {
      className: "mc-session-offset",
    });
    footer.appendChild(offsetEl);
  }

  const formattedOffset = formatSessionOffset(sessionOffsetMs);
  offsetEl.textContent = `+${formattedOffset}`;
}

function getSanitizedChatHtml(caption: Caption): string | undefined {
  if (caption.source !== "chat") {
    return undefined;
  }

  return sanitizeStoredRichTextHtml(caption.formattedHtml);
}

function syncOriginalContent(element: HTMLElement, caption: Caption): void {
  const sanitizedHtml = getSanitizedChatHtml(caption);
  const direction = detectTextDirection(caption.text);
  element.setAttribute("dir", direction);

  if (sanitizedHtml) {
    element.classList.add("mc-original-rich");
    if (element.innerHTML !== sanitizedHtml) {
      element.innerHTML = sanitizedHtml;
    }
    return;
  }

  element.classList.remove("mc-original-rich");
  if (element.textContent !== caption.text) {
    element.textContent = caption.text;
  }
}

function createCaptionElement(c: Caption): HTMLElement {
  const translationDirection = getLanguageDirection(settings.targetLanguage);

  const speaker = createElement("div", {
    className: "mc-speaker",
    textContent: c.speaker,
  });

  const metaRow = createElement("div", { className: "mc-caption-meta" }, [speaker]);

  if (c.source === "chat") {
    metaRow.appendChild(
      createElement("span", {
        className: "mc-chat-source-badge",
        textContent: getMeetingChatBadgeLabel(),
      })
    );
  }

  const original = createElement("div", {
    className: "mc-original",
    onDblClick: async (e: Event) => {
      e.stopPropagation();
      const success = await copyToClipboard(c.text);
      if (success) {
        showCopyFeedback((e.currentTarget || e.target) as HTMLElement);
      }
    },
  });
  syncOriginalContent(original, c);

  const translationWrapper = createElement("div", {
    className: "mc-translation-wrapper",
  });

  const translation = createElement("div", {
    className:
      "mc-translation" +
      (c.translationStatus === TranslationStatus.Translating ? " mc-translating" : ""),
    textContent: c.translation || (settings.translationEnabled ? "..." : ""),
    onClick: () => startEditTranslation(c),
    onDblClick: async (e: Event) => {
      e.stopPropagation();
      if (c.translation) {
        const success = await copyToClipboard(c.translation);
        if (success) showCopyFeedback(e.target as HTMLElement);
      }
    },
    dir: translationDirection,
  });
  translationWrapper.appendChild(translation);

  const contentRow = createElement("div", { className: "mc-caption-content" }, [
    original,
    translationWrapper,
  ]);

  const time = createElement("div", {
    className: "mc-time",
    textContent: c.time,
  });

  const footer = createElement("div", { className: "mc-caption-footer" }, [time]);
  const sessionOffsetMs = getRenderableSessionOffset(c);
  if (sessionOffsetMs !== undefined) {
    footer.appendChild(
      createElement("span", {
        className: "mc-session-offset",
        textContent: `+${formatSessionOffset(sessionOffsetMs)}`,
      })
    );
  }

  return createElement(
    "div",
    {
      className: "mc-caption" + (c.source === "chat" ? " mc-chat-caption" : ""),
      "data-caption-id": c.id,
      "data-caption-source": c.source || "caption",
      "data-chat-owner": c.source === "chat" && c.own ? "self" : "participant",
    },
    [metaRow, contentRow, footer]
  );
}
