import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const providerState = vi.hoisted(() => ({
  captions: [] as Array<{ id: number; speaker: string; text: string }>,
  nextCaptionId: 1,
  isCCEnabled: false,
  settings: {
    storeMeetingChat: true,
  },
}));

const addOrUpdateCaptionMock = vi.hoisted(() =>
  vi.fn((captionId: number | null, speaker: string, text: string) => {
    if (captionId !== null) {
      const existing = providerState.captions.find((item) => item.id === captionId);
      if (existing) {
        existing.speaker = speaker;
        existing.text = text;
      }
      return captionId;
    }

    const nextId = providerState.nextCaptionId++;
    providerState.captions.push({ id: nextId, speaker, text });
    return nextId;
  })
);
const finalizeCaptionMock = vi.hoisted(() => vi.fn());
const ingestLiveChatEventMock = vi.hoisted(() => vi.fn());
const closeCaptureGuideMock = vi.hoisted(() => vi.fn());
const openCaptureGuideMock = vi.hoisted(() => vi.fn());
const renderCaptionsMock = vi.hoisted(() => vi.fn());

vi.mock("../../entrypoints/content/state", () => ({
  captions: providerState.captions,
  settings: providerState.settings,
  setCCEnabled: vi.fn((next: boolean) => {
    providerState.isCCEnabled = next;
  }),
  get isCCEnabled() {
    return providerState.isCCEnabled;
  },
}));

vi.mock("../../entrypoints/content/caption", () => ({
  addOrUpdateCaption: addOrUpdateCaptionMock,
  finalizeCaption: finalizeCaptionMock,
}));

vi.mock("../../entrypoints/content/event-ingestion", () => ({
  ingestLiveChatEvent: ingestLiveChatEventMock,
}));

vi.mock("../../entrypoints/content/overlay/capture-guide", () => ({
  closeCaptureGuide: closeCaptureGuideMock,
  openCaptureGuide: openCaptureGuideMock,
}));

vi.mock("../../entrypoints/content/render", () => ({
  renderCaptions: renderCaptionsMock,
}));

vi.mock("../../entrypoints/shared/diagnostics-client", () => ({
  createDiagnosticsLogger: vi.fn(() => ({
    trace: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
  })),
}));

vi.mock("../../entrypoints/shared/i18n", () => ({
  getUiRuntimeTranslator: vi.fn(() => (_key: string) => ""),
}));

import {
  googleMeetProvider,
  googleMeetProviderInternals,
} from "../../entrypoints/content/providers/google-meet";

function createCaptionEntry(speaker: string, text: string): HTMLElement {
  const entry = document.createElement("div");
  entry.className = "nMcdL";
  const speakerEl = document.createElement("span");
  speakerEl.className = "NWpY1d";
  speakerEl.textContent = speaker;
  const textEl = document.createElement("span");
  textEl.className = "ygicle";
  textEl.textContent = text;
  entry.appendChild(speakerEl);
  entry.appendChild(textEl);
  return entry;
}

function appendChatMessage(options: {
  region: HTMLElement;
  messageId: string;
  speaker: string;
  text: string;
}): void {
  const group = document.createElement("div");
  group.className = "Ss4fHf ydIQ1d";

  const speaker = document.createElement("span");
  speaker.className = "poVWob";
  speaker.textContent = options.speaker;
  group.appendChild(speaker);

  const time = document.createElement("span");
  time.setAttribute("jsname", "biJjHb");
  time.textContent = "10:00";
  group.appendChild(time);

  const content = document.createElement("div");
  content.className = "beTDc";
  const message = document.createElement("div");
  message.className = "RLrADb";
  message.setAttribute("data-message-id", options.messageId);
  const messageText = document.createElement("span");
  messageText.setAttribute("jsname", "dTKtvb");
  messageText.textContent = options.text;
  message.appendChild(messageText);
  content.appendChild(message);
  group.appendChild(content);
  options.region.appendChild(group);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-10T10:00:00.000Z"));
  providerState.captions.length = 0;
  providerState.nextCaptionId = 1;
  providerState.isCCEnabled = false;
  providerState.settings.storeMeetingChat = true;
  addOrUpdateCaptionMock.mockClear();
  finalizeCaptionMock.mockClear();
  ingestLiveChatEventMock.mockClear();
  closeCaptureGuideMock.mockClear();
  openCaptureGuideMock.mockClear();
  renderCaptionsMock.mockClear();
  googleMeetProviderInternals.resetGoogleMeetProviderStateForTests();
  window.history.replaceState({}, "", "/abc-defg-hij");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Google Meet automation contract", () => {
  test("GM-007: duplicate caption updates are skipped and same-speaker updates reschedule finalization", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const entry = createCaptionEntry("Alice", "Hello team");

    googleMeetProviderInternals.processCaption(entry);
    googleMeetProviderInternals.processCaption(entry);
    expect(addOrUpdateCaptionMock).toHaveBeenCalledTimes(1);

    (entry.querySelector(".ygicle") as HTMLElement).textContent = "Hello team updated";
    googleMeetProviderInternals.processCaption(entry);

    expect(addOrUpdateCaptionMock).toHaveBeenCalledTimes(2);
    expect(addOrUpdateCaptionMock.mock.calls[1]?.[0]).toBe(1);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  test("GM-008: speaker switch finalizes previous caption and creates a new caption", () => {
    const entry = createCaptionEntry("Alice", "Initial text");
    googleMeetProviderInternals.processCaption(entry);

    (entry.querySelector(".NWpY1d") as HTMLElement).textContent = "Bob";
    (entry.querySelector(".ygicle") as HTMLElement).textContent = "Bob joins";
    googleMeetProviderInternals.processCaption(entry);

    expect(finalizeCaptionMock).toHaveBeenCalledWith(1);
    expect(addOrUpdateCaptionMock.mock.calls[1]?.[0]).toBeNull();
  });

  test("GM-009: chat extraction obeys storeMeetingChat and deduplicates by message-id/fingerprint", () => {
    const chatRegion = document.createElement("div");
    chatRegion.setAttribute("jsname", "xySENc");
    chatRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(chatRegion);

    providerState.settings.storeMeetingChat = false;
    appendChatMessage({
      region: chatRegion,
      messageId: "m-1",
      speaker: "Alice",
      text: "First message",
    });
    googleMeetProviderInternals.extractChatMessages();
    expect(ingestLiveChatEventMock).not.toHaveBeenCalled();

    providerState.settings.storeMeetingChat = true;
    googleMeetProviderInternals.extractChatMessages();
    expect(ingestLiveChatEventMock).toHaveBeenCalledTimes(1);

    googleMeetProviderInternals.extractChatMessages();
    expect(ingestLiveChatEventMock).toHaveBeenCalledTimes(1);

    appendChatMessage({
      region: chatRegion,
      messageId: "m-2",
      speaker: "Alice",
      text: "First message",
    });
    googleMeetProviderInternals.extractChatMessages();
    expect(ingestLiveChatEventMock).toHaveBeenCalledTimes(1);
  });

  test("GM-010: observer loop reattaches regions and respects chat-storage settings", async () => {
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();
    class MockMutationObserver {
      constructor(_cb: MutationCallback) {}
      observe = observeMock;
      disconnect = disconnectMock;
      takeRecords = vi.fn(() => []);
    }
    vi.stubGlobal("MutationObserver", MockMutationObserver as never);

    const captionRegion = document.createElement("div");
    captionRegion.setAttribute("role", "region");
    captionRegion.className = "vNKgIf UDinHf";
    document.body.appendChild(captionRegion);

    const chatRegion = document.createElement("div");
    chatRegion.setAttribute("jsname", "xySENc");
    chatRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(chatRegion);

    const dispose = googleMeetProvider.startCaptionObserver();
    expect(observeMock).toHaveBeenCalled();

    const nextCaptionRegion = captionRegion.cloneNode() as HTMLElement;
    captionRegion.remove();
    document.body.appendChild(nextCaptionRegion);

    await vi.advanceTimersByTimeAsync(2_000);
    expect(disconnectMock).toHaveBeenCalled();

    providerState.settings.storeMeetingChat = false;
    await vi.advanceTimersByTimeAsync(2_000);
    expect(disconnectMock).toHaveBeenCalled();

    dispose();
  });

  test("GM-011: observer teardown finalizes pending captions and resets capture state", () => {
    const captionRegion = document.createElement("div");
    captionRegion.setAttribute("role", "region");
    captionRegion.className = "vNKgIf UDinHf";
    const entry = createCaptionEntry("Alice", "Pending finalization");
    captionRegion.appendChild(entry);
    document.body.appendChild(captionRegion);

    const dispose = googleMeetProvider.startCaptionObserver();
    googleMeetProviderInternals.processCaption(entry);
    dispose();

    expect(finalizeCaptionMock).toHaveBeenCalled();
    expect(closeCaptureGuideMock).toHaveBeenCalled();
    expect(providerState.isCCEnabled).toBe(false);
  });
});
