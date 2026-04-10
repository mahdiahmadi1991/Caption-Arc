import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  zoomWebProvider,
  zoomWebProviderInternals,
} from "../../entrypoints/content/providers/zoom-web";
import {
  captions,
  isCCEnabled,
  liveChatMessages,
  setCCEnabled,
  updateSettings,
} from "../../entrypoints/content/state";

function setPath(path: string): void {
  window.history.replaceState({}, "", path);
}

function ensureZoomChatRegion(): HTMLElement {
  let root = document.getElementById("wc-container-right");
  if (!root) {
    root = document.createElement("div");
    root.id = "wc-container-right";
    document.body.appendChild(root);
  }

  let list = root.querySelector(".chat-container__chat-list") as HTMLElement | null;
  if (!list) {
    list = document.createElement("div");
    list.className = "chat-container__chat-list";
    root.appendChild(list);
  }

  return list;
}

function appendZoomChatEntry(options: {
  messageId: string;
  speaker: string;
  text: string;
}): void {
  const chatList = ensureZoomChatRegion();
  const entry = document.createElement("div");
  entry.className = "chat-item-container";
  entry.setAttribute("data-id", options.messageId);

  const sender = document.createElement("div");
  sender.className = "chat-item__sender";
  sender.setAttribute("data-name", options.speaker);
  sender.textContent = options.speaker;

  const container = document.createElement("div");
  container.className = "new-chat-message__container";
  container.setAttribute(
    "aria-label",
    `${options.speaker} to Everyone, ${options.text}`
  );

  const text = document.createElement("div");
  text.className = "new-chat-message__text-box";
  text.textContent = options.text;

  entry.append(sender, container, text);
  chatList.appendChild(entry);
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.title = "";
  setPath("/");
  captions.length = 0;
  liveChatMessages.length = 0;
  setCCEnabled(false);
  zoomWebProviderInternals.resetZoomWebProviderState();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Zoom Web provider contract", () => {
  test("ZOOM-001: provider activation follows supported-route and webclient-frame rules", () => {
    expect(
      zoomWebProviderInternals.shouldActivateZoomProvider(
        new URL("https://us05web.zoom.us/landing")
      )
    ).toBe(false);
    expect(
      zoomWebProviderInternals.shouldActivateZoomProvider(
        new URL("https://us05web.zoom.us/j/123456789")
      )
    ).toBe(true);

    const frame = document.createElement("iframe");
    frame.id = "webclient";
    document.body.appendChild(frame);

    expect(
      zoomWebProviderInternals.shouldActivateZoomProvider(
        new URL("https://us05web.zoom.us/j/123456789")
      )
    ).toBe(false);
  });

  test("ZOOM-002: meeting context and presence depend on shell/frame and joined-surface signals", () => {
    const shellUrl = new URL("https://us05web.zoom.us/wc/123456789/join");
    expect(zoomWebProviderInternals.isZoomMeetingContext(shellUrl)).toBe(false);
    expect(zoomWebProviderInternals.getZoomMeetingPresence(shellUrl)).toBe("unknown");

    const joinedSurface = document.createElement("div");
    joinedSurface.className = "meeting-client-inner";
    document.body.appendChild(joinedSurface);

    const meetingUrl = new URL("https://us05web.zoom.us/j/123456789");
    expect(zoomWebProviderInternals.getZoomMeetingPresence(meetingUrl)).toBe("joined");
  });

  test("ZOOM-003: caption availability uses subtitle content and menu enabled/disabled states", () => {
    const subtitle = document.createElement("div");
    subtitle.className = "live-transcription-subtitle__item";
    subtitle.textContent = "we should align on release scope";
    document.body.appendChild(subtitle);

    expect(zoomWebProviderInternals.isZoomCaptioningSurfaceAvailable()).toBe(true);

    document.body.innerHTML = "";
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    menu.textContent = "Show captions";
    document.body.appendChild(menu);

    expect(zoomWebProviderInternals.hasZoomOpenCaptionsMenuDisabledState()).toBe(true);
    expect(zoomWebProviderInternals.hasZoomOpenCaptionsMenuEnabledState()).toBe(false);
  });

  test("ZOOM-005: metadata resolves meetingNumber, meetingId, and normalized title", () => {
    setPath("/j/987654321?mn=session-token");
    document.title = "Weekly Sync - Zoom";

    const metadata = zoomWebProvider.getSessionMetadata();
    expect(metadata.identifiers.meetingNumber).toBe("987654321");
    expect(metadata.identifiers.meetingId).toBe("session-token");
    expect(metadata.title).toBe("Weekly Sync");
  });

  test("ZOOM-004: rolling transcript helpers append only visible deltas", () => {
    expect(
      zoomWebProviderInternals.extractZoomDeltaText(
        "hello world",
        "hello world again"
      )
    ).toBe("again");
    expect(
      zoomWebProviderInternals.extractZoomDeltaText("hello world", "hello world")
    ).toBe("");

    expect(
      zoomWebProviderInternals.mergeZoomRollingTranscript(
        "hello world",
        "hello world",
        "hello world again"
      )
    ).toBe("hello world again");
  });

  test("ZOOM-006: chat extraction respects storeMeetingChat and de-duplicates by stable message ID", () => {
    updateSettings({ storeMeetingChat: true });

    const chatRoot = document.createElement("div");
    chatRoot.id = "wc-container-right";
    const chatList = document.createElement("div");
    chatList.className = "chat-container__chat-list";
    chatRoot.appendChild(chatList);
    document.body.appendChild(chatRoot);

    const entry = document.createElement("div");
    entry.className = "chat-item-container";
    entry.setAttribute("data-id", "msg-1");

    const sender = document.createElement("div");
    sender.className = "chat-item__sender";
    sender.setAttribute("data-name", "Alice");
    sender.textContent = "Alice";

    const container = document.createElement("div");
    container.className = "new-chat-message__container";
    container.setAttribute("aria-label", "Alice to Everyone, hello");

    const text = document.createElement("div");
    text.className = "new-chat-message__text-box";
    text.textContent = "hello from chat";

    entry.appendChild(sender);
    entry.appendChild(container);
    entry.appendChild(text);
    chatList.appendChild(entry);

    zoomWebProviderInternals.extractChatMessages();
    expect(liveChatMessages.length).toBe(1);
    expect(liveChatMessages[0]?.providerEventId).toBe("msg-1");

    zoomWebProviderInternals.extractChatMessages();
    expect(liveChatMessages.length).toBe(1);
  });

  test("ZOOM-007: observer lifecycle rebinds meeting/chat surfaces and honors interaction-aware caption disable windows", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T12:00:00.000Z"));
    setPath("/j/987654321");
    updateSettings({ storeMeetingChat: true });

    const joinedSurface = document.createElement("div");
    joinedSurface.className = "meeting-client-inner";
    document.body.appendChild(joinedSurface);

    const subtitle = document.createElement("div");
    subtitle.className = "live-transcription-subtitle__item";
    subtitle.textContent = "caption line";
    document.body.appendChild(subtitle);

    const hideCaptionsButton = document.createElement("button");
    hideCaptionsButton.textContent = "Hide captions";
    document.body.appendChild(hideCaptionsButton);

    appendZoomChatEntry({
      messageId: "msg-1",
      speaker: "Alice",
      text: "first region",
    });

    const dispose = zoomWebProviderInternals.startCaptionObserver();
    expect(liveChatMessages.map((item) => item.providerEventId)).toContain("msg-1");
    expect(isCCEnabled).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    hideCaptionsButton.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
    subtitle.remove();
    await vi.advanceTimersByTimeAsync(2300);
    expect(isCCEnabled).toBe(false);

    const firstRegion = ensureZoomChatRegion();
    firstRegion.parentElement?.remove();
    appendZoomChatEntry({
      messageId: "msg-2",
      speaker: "Alice",
      text: "second region",
    });
    await vi.advanceTimersByTimeAsync(950);
    expect(liveChatMessages.map((item) => item.providerEventId)).toContain("msg-2");

    dispose();

    const secondRegion = ensureZoomChatRegion();
    secondRegion.parentElement?.remove();
    appendZoomChatEntry({
      messageId: "msg-3",
      speaker: "Alice",
      text: "post-dispose region",
    });
    await vi.advanceTimersByTimeAsync(950);
    expect(liveChatMessages.map((item) => item.providerEventId)).not.toContain(
      "msg-3"
    );
  });
});
