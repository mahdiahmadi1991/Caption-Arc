import type { QuickAccessRuntimeStatus } from "../shared/quick-access-status";
import {
  QUICK_ACCESS_RUNTIME_STATUS_STORAGE_KEY,
  QUICK_ACCESS_SOFT_REFRESH_RUNTIME_ACTION,
} from "../shared/quick-access-status";

type RuntimeStatusEntry = {
  key: string;
  tabId: number | null;
  frameId: number;
  receivedAt: number;
  status: QuickAccessRuntimeStatus;
};

const QUICK_ACCESS_STATUS_STALE_MS = 4500;
const runtimeStatusRegistry = new Map<string, RuntimeStatusEntry>();

function getSenderKey(sender: chrome.runtime.MessageSender): string | null {
  if (typeof sender.documentId === "string" && sender.documentId.length > 0) {
    return sender.documentId;
  }

  const tabId = sender.tab?.id;
  if (typeof tabId !== "number") {
    return null;
  }

  return `${tabId}:${sender.frameId ?? 0}`;
}

function removeEntriesForTab(tabId: number): void {
  for (const [key, entry] of runtimeStatusRegistry.entries()) {
    if (entry.tabId === tabId) {
      runtimeStatusRegistry.delete(key);
    }
  }
}

function pruneStaleEntries(now = Date.now()): void {
  for (const [key, entry] of runtimeStatusRegistry.entries()) {
    if (now - entry.receivedAt > QUICK_ACCESS_STATUS_STALE_MS) {
      runtimeStatusRegistry.delete(key);
    }
  }
}

function getStatusPriority(status: QuickAccessRuntimeStatus): number {
  if (status.hasActiveMeetingSession && status.meetingPresence === "joined") {
    return 4;
  }

  if (status.meetingPresence === "prejoin") {
    return 3;
  }

  if (status.meetingPresence === "joined") {
    return 2;
  }

  if (status.meetingPresence === "ended") {
    return 1;
  }

  return 0;
}

function pickBestRuntimeEntry(entries: RuntimeStatusEntry[]): RuntimeStatusEntry | null {
  return (
    [...entries]
      .filter((entry) => getStatusPriority(entry.status) > 0)
      .sort((left, right) => {
        const priorityDelta =
          getStatusPriority(right.status) - getStatusPriority(left.status);
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return right.receivedAt - left.receivedAt;
      })[0] ?? null
  );
}

function getBestRuntimeEntry(now = Date.now()): RuntimeStatusEntry | null {
  pruneStaleEntries(now);
  return pickBestRuntimeEntry([...runtimeStatusRegistry.values()]);
}

function getBestRuntimeEntryForTab(
  tabId: number,
  now = Date.now()
): RuntimeStatusEntry | null {
  pruneStaleEntries(now);
  return pickBestRuntimeEntry(
    [...runtimeStatusRegistry.values()].filter((entry) => entry.tabId === tabId)
  );
}

async function getLastFocusedActiveTabId(): Promise<number | null> {
  if (!chrome.tabs?.query) {
    return null;
  }

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    return typeof activeTab?.id === "number" ? activeTab.id : null;
  } catch {
    return null;
  }
}

export async function initializeQuickAccessRuntimeRegistry(): Promise<void> {
  runtimeStatusRegistry.clear();
  chrome.tabs.onRemoved.addListener(removeEntriesForTab);
  await chrome.storage.local.remove(QUICK_ACCESS_RUNTIME_STATUS_STORAGE_KEY);
}

export async function updateQuickAccessRuntimeStatus(
  status: QuickAccessRuntimeStatus,
  sender: chrome.runtime.MessageSender
): Promise<{ success: boolean }> {
  const key = getSenderKey(sender);
  if (!key) {
    return { success: false };
  }

  pruneStaleEntries();

  runtimeStatusRegistry.set(key, {
    key,
    tabId: sender.tab?.id ?? null,
    frameId: sender.frameId ?? 0,
    receivedAt: Date.now(),
    status,
  });

  return { success: true };
}

export async function clearQuickAccessRuntimeStatus(
  sender: chrome.runtime.MessageSender
): Promise<{ success: boolean }> {
  const key = getSenderKey(sender);
  if (!key) {
    return { success: false };
  }

  runtimeStatusRegistry.delete(key);
  return { success: true };
}

export async function getQuickAccessRuntimeStatus(): Promise<{
  status: QuickAccessRuntimeStatus | null;
}> {
  const bestEntry = getBestRuntimeEntry();

  return {
    status: bestEntry?.status ?? null,
  };
}

export async function requestQuickAccessSoftRefresh(): Promise<{
  success: boolean;
  error?: string;
}> {
  const activeTabId = await getLastFocusedActiveTabId();
  if (activeTabId === null) {
    return {
      success: false,
      error:
        "Open an active supported meeting tab where CaptionArc is active to use recovery refresh.",
    };
  }

  const bestEntry = getBestRuntimeEntryForTab(activeTabId);
  if (!bestEntry || bestEntry.tabId === null) {
    return {
      success: false,
      error:
        "Open an active supported meeting tab where CaptionArc is active to use recovery refresh.",
    };
  }

  if (!chrome.tabs?.sendMessage) {
    return {
      success: false,
      error: "Tab messaging is unavailable for recovery refresh.",
    };
  }

  try {
    const response = (await chrome.tabs.sendMessage(
      bestEntry.tabId,
      {
        action: QUICK_ACCESS_SOFT_REFRESH_RUNTIME_ACTION,
      },
      {
        frameId: bestEntry.frameId,
      }
    )) as
      | {
          success?: boolean;
          error?: string;
        }
      | undefined;

    if (response?.success) {
      return { success: true };
    }

    return {
      success: false,
      error:
        response?.error ||
        "The active meeting runtime did not accept the recovery refresh request.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
