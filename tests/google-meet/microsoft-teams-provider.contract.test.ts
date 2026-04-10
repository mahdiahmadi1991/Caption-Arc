import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  microsoftTeamsProvider,
  microsoftTeamsProviderInternals,
  resetMicrosoftTeamsProviderState,
} from "../../entrypoints/content/providers/microsoft-teams";
import {
  captions,
  liveChatMessages,
  setCCEnabled,
  updateSettings,
} from "../../entrypoints/content/state";

function addButton(options: { text?: string; ariaLabel?: string; selectorAttr?: string }): void {
  const button = document.createElement("button");
  if (options.text) {
    button.textContent = options.text;
  }
  if (options.ariaLabel) {
    button.setAttribute("aria-label", options.ariaLabel);
  }
  if (options.selectorAttr) {
    button.setAttribute("data-tid", options.selectorAttr);
  }
  document.body.appendChild(button);
}

function ensureTeamsChatRegion(): HTMLElement {
  let region = document.getElementById("chat-pane-list") as HTMLElement | null;
  if (!region) {
    region = document.createElement("div");
    region.id = "chat-pane-list";
    document.body.appendChild(region);
  }
  return region;
}

function appendTeamsChatEntry(options: {
  messageId: string;
  speaker: string;
  text: string;
  timestampIso: string;
}): void {
  const region = ensureTeamsChatRegion();
  const entry = document.createElement("div");
  entry.setAttribute("data-tid", "chat-pane-item");
  const body = document.createElement("div");
  body.setAttribute("data-tid", "chat-pane-message");
  body.setAttribute("data-mid", options.messageId);
  const authorId = `author-${options.messageId}`;
  const timeId = `timestamp-${options.messageId}`;
  const contentId = `content-${options.messageId}`;
  body.setAttribute("aria-labelledby", `${authorId} ${timeId} ${contentId}`);

  const author = document.createElement("span");
  author.id = authorId;
  author.textContent = options.speaker;

  const time = document.createElement("time");
  time.id = timeId;
  time.setAttribute("datetime", options.timestampIso);
  time.textContent = "10:00";

  const content = document.createElement("div");
  content.id = contentId;
  content.textContent = options.text;

  entry.append(body, author, time, content);
  region.appendChild(entry);
}

function createTeamsCaptionEntry(speaker: string, text: string): HTMLElement {
  const entry = document.createElement("div");
  entry.className = "fui-ChatMessageCompact";

  const author = document.createElement("span");
  author.setAttribute("data-tid", "author");
  author.textContent = speaker;

  const captionText = document.createElement("div");
  captionText.setAttribute("data-tid", "closed-caption-text");
  captionText.textContent = text;

  entry.append(captionText, author);
  document.body.appendChild(entry);
  Object.defineProperty(entry, "innerText", {
    configurable: true,
    get: () => `${author.textContent || ""}\n${captionText.textContent || ""}`,
  });
  return entry;
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.title = "";
  window.localStorage.clear();
  captions.length = 0;
  liveChatMessages.length = 0;
  setCCEnabled(false);
  updateSettings({ storeMeetingChat: true });
  resetMicrosoftTeamsProviderState();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Microsoft Teams provider contract", () => {
  test("MTEAM-001: URL matcher differentiates Teams Live /v2 and scheduled meeting URLs", () => {
    expect(microsoftTeamsProvider.matchesUrl(new URL("https://teams.live.com/v2/"))).toBe(
      true
    );
    expect(microsoftTeamsProvider.matchesUrl(new URL("https://teams.live.com/meet/123"))).toBe(
      false
    );
    expect(
      microsoftTeamsProvider.matchesUrl(
        new URL("https://teams.microsoft.com/l/meetup-join/abc")
      )
    ).toBe(true);
    expect(microsoftTeamsProvider.matchesUrl(new URL("https://example.com/meeting"))).toBe(
      false
    );
  });

  test("MTEAM-002: page context uses Teams signals and rejects non-Teams hosts", () => {
    addButton({ text: "Join now" });

    expect(
      microsoftTeamsProviderInternals.isTeamsMeetingContext(
        new URL("https://teams.live.com/v2/meeting")
      )
    ).toBe(true);
    expect(
      microsoftTeamsProvider.matchesPageContext?.(
        new URL("https://teams.live.com/v2/meeting")
      )
    ).toBe(true);
    expect(
      microsoftTeamsProvider.matchesPageContext?.(new URL("https://example.com/meeting"))
    ).toBe(false);
  });

  test("MTEAM-003: presence transitions from joined to ended after leave control disappears", () => {
    const url = new URL("https://teams.live.com/v2/meeting");
    addButton({ text: "Leave", ariaLabel: "Leave", selectorAttr: "hangup-main-btn" });

    expect(microsoftTeamsProviderInternals.getTeamsMeetingPresence(url)).toBe("joined");

    document.body.innerHTML = "";
    expect(microsoftTeamsProviderInternals.getTeamsMeetingPresence(url)).toBe("ended");

    addButton({ text: "Join now", ariaLabel: "Join now" });
    expect(microsoftTeamsProviderInternals.getTeamsMeetingPresence(url)).toBe("prejoin");
  });

  test("MTEAM-004: caption availability is true when menu state indicates captions are enabled", () => {
    const captionToggle = document.createElement("button");
    captionToggle.setAttribute("aria-label", "Hide live captions");
    document.body.appendChild(captionToggle);

    expect(microsoftTeamsProvider.isCaptioningCurrentlyAvailable()).toBe(true);
  });

  test("MTEAM-005: caption enable attempt returns true from stored closed-caption preference", async () => {
    window.localStorage.setItem(
      "foo.react-web-client.closed-captions-settings",
      JSON.stringify({ stickyClosedCaptions: true })
    );

    await expect(microsoftTeamsProvider.tryEnableLiveCaptions?.(500)).resolves.toBe(true);
  });

  test("MTEAM-006: metadata helper distinguishes direct-call and scheduled meeting identifiers", () => {
    addButton({ text: "Leave", ariaLabel: "Leave", selectorAttr: "hangup-main-btn" });
    const directCallMetadata =
      microsoftTeamsProviderInternals.getTeamsSessionMetadataForUrl(
        new URL("https://teams.live.com/v2/")
      );

    expect(directCallMetadata.identifiers.callType).toBe("direct-call");
    expect(directCallMetadata.identifiers.meetingId).toBeUndefined();
    expect(directCallMetadata.identifiers.meetingCode).toBeUndefined();

    document.body.innerHTML = "";
    const scheduledMetadata =
      microsoftTeamsProviderInternals.getTeamsSessionMetadataForUrl(
        new URL("https://teams.microsoft.com/meet/987654321")
      );

    expect(scheduledMetadata.identifiers.callType).toBe("scheduled-meeting");
    expect(scheduledMetadata.identifiers.meetingId).toBe("987654321");
    expect(scheduledMetadata.identifiers.meetingCode).toBe("987654321");
  });

  test("MTEAM-007: chat ingestion de-duplicates by message ID and ignores pre-session direct-call history", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T10:00:00.000Z"));
    const floorTimestamp = Date.now() - 2_000;
    microsoftTeamsProviderInternals.setDirectCallChatCaptureFloorOverride(
      floorTimestamp
    );

    appendTeamsChatEntry({
      messageId: "msg-before-floor",
      speaker: "Alice",
      text: "old backlog",
      timestampIso: new Date(floorTimestamp - 30_000).toISOString(),
    });
    appendTeamsChatEntry({
      messageId: "msg-after-floor",
      speaker: "Alice",
      text: "new live message",
      timestampIso: new Date(floorTimestamp + 2_000).toISOString(),
    });

    microsoftTeamsProviderInternals.extractTeamsChatMessages();
    expect(liveChatMessages.length).toBe(1);
    expect(liveChatMessages[0]?.providerEventId).toBe("msg-after-floor");

    microsoftTeamsProviderInternals.extractTeamsChatMessages();
    expect(liveChatMessages.length).toBe(1);
  });

  test("MTEAM-008: caption processing merges unknown fragments, suppresses duplicates, and finalizes on speaker switch", () => {
    vi.useFakeTimers();
    const primaryEntry = createTeamsCaptionEntry("Alice", "Initial line");
    microsoftTeamsProviderInternals.processCaptionEntry(primaryEntry);
    expect(captions.length).toBe(1);
    expect(captions[0]?.speaker).toBe("Alice");

    microsoftTeamsProviderInternals.processCaptionEntry(primaryEntry);
    expect(captions.length).toBe(1);

    const primaryTextNode = primaryEntry.querySelector(
      '[data-tid="closed-caption-text"]'
    ) as HTMLElement;
    primaryTextNode.textContent = "Initial line extended";
    Object.defineProperty(primaryEntry, "innerText", {
      configurable: true,
      get: () => "Alice\nInitial line extended",
    });
    microsoftTeamsProviderInternals.processCaptionEntry(primaryEntry);
    expect(captions.length).toBe(1);
    expect(captions[0]?.text).toContain("Initial line extended");

    const unknownEntry = createTeamsCaptionEntry("Unknown", "context fragment");
    microsoftTeamsProviderInternals.processCaptionEntry(unknownEntry);
    expect(captions.length).toBe(1);
    expect(captions[0]?.text).toContain("context fragment");

    const primaryAuthorNode = primaryEntry.querySelector(
      '[data-tid="author"]'
    ) as HTMLElement;
    primaryAuthorNode.textContent = "Bob";
    primaryTextNode.textContent = "New speaker line";
    Object.defineProperty(primaryEntry, "innerText", {
      configurable: true,
      get: () => "Bob\nNew speaker line",
    });
    microsoftTeamsProviderInternals.processCaptionEntry(primaryEntry);
    expect(captions.length).toBe(2);
    expect(captions[0]?.isFinalized).toBe(true);
    expect(captions[1]?.speaker).toBe("Bob");

    const duplicateEntry = createTeamsCaptionEntry("Bob", "New speaker line");
    microsoftTeamsProviderInternals.processCaptionEntry(duplicateEntry);
    expect(captions.length).toBe(2);
  });

  test("MTEAM-009: observer lifecycle rebinds chat regions on poll cadence and disposer stops future ingestion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T11:00:00.000Z"));

    appendTeamsChatEntry({
      messageId: "msg-1",
      speaker: "Alice",
      text: "first region",
      timestampIso: new Date(Date.now()).toISOString(),
    });

    const dispose = microsoftTeamsProviderInternals.startCaptionObserver();
    expect(liveChatMessages.map((item) => item.providerEventId)).toContain("msg-1");

    const firstRegion = ensureTeamsChatRegion();
    firstRegion.remove();

    appendTeamsChatEntry({
      messageId: "msg-2",
      speaker: "Alice",
      text: "second region",
      timestampIso: new Date(Date.now() + 1000).toISOString(),
    });

    await vi.advanceTimersByTimeAsync(1900);
    expect(liveChatMessages.map((item) => item.providerEventId)).toContain("msg-2");

    dispose();

    const secondRegion = ensureTeamsChatRegion();
    secondRegion.remove();
    appendTeamsChatEntry({
      messageId: "msg-3",
      speaker: "Alice",
      text: "post-dispose region",
      timestampIso: new Date(Date.now() + 2000).toISOString(),
    });

    await vi.advanceTimersByTimeAsync(1900);
    expect(liveChatMessages.map((item) => item.providerEventId)).not.toContain(
      "msg-3"
    );
  });
});
