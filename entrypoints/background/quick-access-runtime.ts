import type { QuickAccessRuntimeStatus } from "../shared/quick-access-status";
import { QUICK_ACCESS_RUNTIME_STATUS_STORAGE_KEY } from "../shared/quick-access-status";

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
  pruneStaleEntries();

  const bestEntry = [...runtimeStatusRegistry.values()]
    .filter((entry) => getStatusPriority(entry.status) > 0)
    .sort((left, right) => {
      const priorityDelta =
        getStatusPriority(right.status) - getStatusPriority(left.status);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return right.receivedAt - left.receivedAt;
    })[0];

  return {
    status: bestEntry?.status ?? null,
  };
}
