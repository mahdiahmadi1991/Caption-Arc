import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  translateCaptionMock,
  renderCaptionsMock,
  addChatMessageToHistoryMock,
  upsertLiveChatMessageMock,
} = vi.hoisted(() => ({
  translateCaptionMock: vi.fn(),
  renderCaptionsMock: vi.fn(),
  addChatMessageToHistoryMock: vi.fn(),
  upsertLiveChatMessageMock: vi.fn(),
}));

const stateContext = vi.hoisted(() => ({
  nextCaptionId: 40,
  settings: {
    translationEnabled: true,
    targetLanguage: "fa",
  },
}));

vi.mock("../../entrypoints/content/render", () => ({
  renderCaptions: renderCaptionsMock,
}));

vi.mock("../../entrypoints/content/history-service", () => ({
  addChatMessageToHistory: addChatMessageToHistoryMock,
  getCurrentSessionOffsetForTimestamp: vi.fn((timestamp: number) => timestamp - 1_000),
}));

vi.mock("../../entrypoints/content/translation", () => ({
  translateCaption: translateCaptionMock,
}));

vi.mock("../../entrypoints/content/state", () => ({
  getNextCaptionId: vi.fn(() => {
    stateContext.nextCaptionId += 1;
    return stateContext.nextCaptionId;
  }),
  settings: stateContext.settings,
  upsertLiveChatMessage: upsertLiveChatMessageMock,
}));

import {
  createOverlayItemFromEvent,
  ingestLiveChatEvent,
} from "../../entrypoints/content/event-ingestion";

beforeEach(() => {
  stateContext.nextCaptionId = 40;
  stateContext.settings.translationEnabled = true;
  stateContext.settings.targetLanguage = "fa";
  renderCaptionsMock.mockReset();
  addChatMessageToHistoryMock.mockReset();
  upsertLiveChatMessageMock.mockReset();
  translateCaptionMock.mockReset();
});

describe("Event ingestion contract", () => {
  test("EINGEST-001: overlay items normalize speaker/text/timestamps and chat-finalization defaults", () => {
    const item = createOverlayItemFromEvent({
      source: "chat",
      speaker: "   ",
      text: "  hello team  ",
      own: false,
      providerEventId: "msg-1",
      timestamp: 5_000,
      historyTimestamp: 4_900,
    });

    expect(item.id).toBe(41);
    expect(item.speaker).toBe("Unknown");
    expect(item.text).toBe("hello team");
    expect(item.timestamp).toBe(5_000);
    expect(item.historyTimestamp).toBe(4_900);
    expect(item.sessionOffsetMs).toBe(3_900);
    expect(item.isFinalized).toBe(true);
    expect(item.messageId).toBe("msg-1");
  });

  test("EINGEST-002: chat ingestion updates overlay state, history, and rendering in one path", () => {
    const result = ingestLiveChatEvent({
      speaker: "Alice",
      text: "Can we finalize today?",
      own: true,
      providerEventId: "msg-2",
      timestamp: 7_000,
      historyTimestamp: 6_900,
      time: "10:00",
    });

    expect(result.source).toBe("chat");
    expect(result.messageId).toBe("msg-2");
    expect(upsertLiveChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "msg-2", speaker: "Alice" })
    );
    expect(addChatMessageToHistoryMock).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "msg-2", source: "chat" })
    );
    expect(renderCaptionsMock).toHaveBeenCalledTimes(1);
  });

  test("EINGEST-003: chat translation is requested only when translation is enabled", () => {
    ingestLiveChatEvent({
      speaker: "Bob",
      text: "Please share the latest numbers.",
      own: false,
      providerEventId: "msg-3",
      timestamp: 8_000,
      historyTimestamp: 8_000,
      time: "10:01",
    });
    expect(translateCaptionMock).toHaveBeenCalledTimes(1);

    translateCaptionMock.mockClear();
    stateContext.settings.translationEnabled = false;

    ingestLiveChatEvent({
      speaker: "Bob",
      text: "Another update",
      own: false,
      providerEventId: "msg-4",
      timestamp: 8_500,
      historyTimestamp: 8_500,
      time: "10:02",
    });
    expect(translateCaptionMock).not.toHaveBeenCalled();
  });
});
