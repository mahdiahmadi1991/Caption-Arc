import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useHistory } from "../../entrypoints/meeting-history/use-history";
import { I18nProvider } from "../../entrypoints/shared/i18n";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import type { MeetingSession } from "../../entrypoints/shared/meeting-session";

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

function createSession(id: string): MeetingSession {
  const now = Date.now();
  return {
    id,
    sessionSyncId: id,
    schemaVersion: 3,
    platform: "google-meet",
    providerLabel: "Google Meet",
    meetingUrl: `https://meet.google.com/${id}`,
    title: `Session ${id}`,
    starred: false,
    identifiers: { meetingCode: id },
    sessionFingerprint: `fingerprint-${id}`,
    lifecycleState: "ended",
    startTime: now - 300000,
    endTime: now - 1000,
    lastSeenAt: now - 1000,
    updatedAt: now - 1000,
    searchableText: id,
    captions: [],
    chatMessages: [],
    summaries: {},
    artifacts: { summaries: {} },
  };
}

type HistoryHarnessHandle = ReturnType<typeof useHistory>;

async function mountHarness(onReady: (handle: HistoryHarnessHandle) => void) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root | null = createRoot(container);

  function Harness() {
    const handle = useHistory();

    React.useEffect(() => {
      onReady(handle);
    }, [handle]);

    return null;
  }

  await act(async () => {
    root.render(
      React.createElement(
        I18nProvider,
        { locale: "en" },
        React.createElement(Harness)
      )
    );
    await flushMicrotasks();
  });

  return {
    async cleanup() {
      await act(async () => {
        root?.unmount();
        await flushMicrotasks();
      });
      root = null;
      container.remove();
    },
  };
}

describe("Meeting history view-state reporting", () => {
  const sessions = [createSession("session-1"), createSession("session-2")];
  let sendMessageMock: ReturnType<typeof vi.fn>;
  let historyHandle: HistoryHarnessHandle | null = null;

  beforeEach(() => {
    const settings = createDefaultSettings();
    sendMessageMock = vi.fn(async (message: { action?: string; sessionId?: string }) => {
      switch (message.action) {
        case "getMeetingHistoryIndex":
          return { success: true, sessions };
        case "getStorageUsage":
          return { success: true, bytesUsed: 0, quota: 5242880 };
        case "getSettings":
          return { success: true, settings };
        case "getMeetingSummaryJobStatuses":
          return { success: true, statuses: {} };
        case "getMeetingSession":
          return {
            success: true,
            session: sessions.find((session) => session.id === message.sessionId) || null,
          };
        case "updateMeetingHistoryViewState":
          return { success: true };
        default:
          return { success: true };
      }
    });

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      storage: {
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    historyHandle = null;
    document.body.innerHTML = "";
  });

  test("MHVS-001: changing the selected session does not emit inactive cleanup reports", async () => {
    const harness = await mountHarness((handle) => {
      historyHandle = handle;
    });

    expect(historyHandle).not.toBeNull();

    await act(async () => {
      historyHandle?.openSession("session-1");
      await flushMicrotasks();
    });

    await act(async () => {
      historyHandle?.openSession("session-2");
      await flushMicrotasks();
    });

    const viewStateCalls = sendMessageMock.mock.calls
      .map(([message]) => message)
      .filter((message) => message?.action === "updateMeetingHistoryViewState");

    expect(viewStateCalls).toHaveLength(3);
    expect(
      viewStateCalls.some((message) => message.visible === false)
    ).toBe(false);

    await harness.cleanup();
  });
});
