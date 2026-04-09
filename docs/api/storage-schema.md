# Storage Schema

## Settings Schema

Settings models are declared in [`entrypoints/background/types/index.ts`](../../entrypoints/background/types/index.ts):

- `SharedSettings`
- `LocalDeviceSecrets`
- `LocalDeviceSettings`
- `SettingsState` (`schemaVersion: 1`)

Current settings boundary notes:

- `SharedSettings` contains synced cross-device preferences such as translation, summaries, appearance, and overlay behavior.
- `LocalDeviceSecrets` contains the device-local OpenAI API key.
- `LocalDeviceSettings` contains device-specific state such as `deviceId`, `deviceLabel`, `uiLanguage`, connected cloud providers, overlay positions, and the local OpenAI verification snapshot.
- `uiLanguage` is local-only and must not be added to synced shared settings or portable import/export settings payloads.
- `targetLanguage` and `summaryLanguage` must resolve to supported codes from [`entrypoints/shared/language-metadata.ts`](../../entrypoints/shared/language-metadata.ts). The current catalog includes `en`, `vi`, `fa`, `zh`, `ja`, `ko`, `es`, `fr`, `de`, `pt`, `ru`, `ar`, `hi`, `bn`, `ur`, `tl`, `ta`, `uk`, `ms`, `sw`, `te`, `it`, `th`, `id`, `nl`, `pl`, and `tr`.

## Session Schema

Meeting session models are declared in [`entrypoints/shared/meeting-session.ts`](../../entrypoints/shared/meeting-session.ts):

- `MeetingSession`
- `SavedMeetingEvent`
- `SavedCaption`
- `SavedChatMessage`
- `MeetingSummary`
- `MeetingSessionArtifacts`

## IndexedDB Schema

Defined in [`entrypoints/background/history-db.ts`](../../entrypoints/background/history-db.ts):

- DB name: `captionarc-history`
- DB version: `4`
- Stores:
  - `session-index`
  - `session-event-chunks`

## Migration Rule

When changing settings/session schema:

- update this file
- document migration strategy in PR
- keep backward compatibility behavior explicit
