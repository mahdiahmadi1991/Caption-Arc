# Runtime Message Contracts

Message dispatch implementation: [`entrypoints/background/index.ts`](../../entrypoints/background/index.ts).

## Contract Shape

Request shape:

```ts
{ action: string, ...payload }
```

Response shape:

```ts
{ success: boolean, ...result, error?: string }
```

## Actions

### Settings

- `getSettings`
- `saveSettings`

### Cloud Sync

- `getCloudSyncState`
- `connectCloudSyncProvider`
- `disconnectCloudSyncProvider`
- `retryCloudSync`
- `resolveCloudSyncSettingsChoice`

### Translation And AI

- `translate`
- `generateText`
- `getMeetingAssistantLiveState`

### Meeting Sessions And History

- `getMeetingHistory`
- `getMeetingHistoryIndex`
- `getMeetingSession`
- `resolveMeetingSession`
- `findMeetingSessionContinuationCandidate`
- `saveMeetingSession`
- `storeMeetingSessionShell`
- `finalizeMeetingSessionEnd`
- `updateMeetingSession`
- `deleteMeetingSession`

### Summary Jobs

- `getMeetingSummaryJobStatus`
- `getMeetingSummaryJobStatuses`
- `generateMeetingSummary`
- `cancelMeetingSummaryJob`

### Session Translation

- `translateSessionCaption`
- `translateSessionCaptions`

### Data Transfer

- `exportAppDataBundle`
- `importAppDataBundle`

### Runtime Utilities

- `getStorageUsage`
- `openOptions`
- `updateQuickAccessRuntimeStatus`
- `clearQuickAccessRuntimeStatus`
- `getQuickAccessRuntimeStatus`

### Development Diagnostics

- `debugHandleSummaryReadyNotificationClick`
  Development-only diagnostics hook that invokes the summary-ready notification click handler with either a full `notificationId` or a `sessionId` + `summaryKey` pair.

## Source Types

Detailed request/response types live in [`entrypoints/background/types/index.ts`](../../entrypoints/background/types/index.ts).
