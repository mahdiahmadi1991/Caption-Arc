# Messaging And Events

Background message routing is implemented in [`entrypoints/background/index.ts`](../../entrypoints/background/index.ts).

## Main Message Contract Pattern

Pages and content scripts send `chrome.runtime.sendMessage({ action: ... })` requests.
Background dispatches by `action` and returns structured response objects.

## Action Families

- settings:
  - `getSettings`, `saveSettings`
- cloud sync:
  - `getCloudSyncState`, `connectCloudSyncProvider`, `disconnectCloudSyncProvider`, `retryCloudSync`, `resolveCloudSyncSettingsChoice`
- translation and text generation:
  - `translate`, `generateText`
- meeting history and sessions:
  - `getMeetingHistory`, `getMeetingHistoryIndex`, `getMeetingSession`, `saveMeetingSession`, `storeMeetingSessionShell`, `updateMeetingSession`, `deleteMeetingSession`, `resolveMeetingSession`, `findMeetingSessionContinuationCandidate`, `finalizeMeetingSessionEnd`, `updateMeetingHistoryViewState`
- summary jobs:
  - `getMeetingSummaryJobStatus`, `getMeetingSummaryJobStatuses`, `generateMeetingSummary`, `cancelMeetingSummaryJob`
- session translation:
  - `translateSessionCaption`, `translateSessionCaptions`
- data transfer:
  - `exportAppDataBundle`, `importAppDataBundle`
- runtime quick-access:
  - `updateQuickAccessRuntimeStatus`, `clearQuickAccessRuntimeStatus`, `getQuickAccessRuntimeStatus`
- diagnostics/utilities:
  - `getStorageUsage`, `openOptions`, `getMeetingAssistantLiveState`

## Reliability Notes

- background listener returns `true` for async responses.
- unknown actions return `{ success: false, error: "Unknown action" }`.
- summary retries use `chrome.alarms` and persisted queue state.
- Meeting History reports selected-session, visibility, and focus state so background can suppress same-session summary-ready notifications.
- summary-ready notification clicks route back into `meeting-history.html` with session and summary-target query state.
