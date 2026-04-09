# Storage And State

CaptionArc is local-first with optional personal-cloud mirroring.

## Storage Layers

- `chrome.storage.local`
  - structured settings state
  - device-local secrets and local metadata
  - queue/checkpoint state for background jobs and cloud sync
- diagnostics state falls back here only when session-scoped extension storage is unavailable on the current browser target
- `chrome.storage.session`
  - preferred runtime store for diagnostics collector state when the browser exposes session-scoped extension storage
- IndexedDB (`captionarc-history`)
  - session index store (`session-index`)
  - event chunk store (`session-event-chunks`)

## IndexedDB Shape (Code-Derived)

From [`entrypoints/background/history-db.ts`](../../entrypoints/background/history-db.ts):

- db name: `captionarc-history`
- version: `4`
- event chunk size: `250`
- retention guardrails:
  - max archived sessions: `250`
  - max age for non-starred ended sessions: `180 days`
  - storage pressure thresholds: `0.7` high, `0.55` target

## Canonical Session Model

The canonical session/event schema is defined in [`entrypoints/shared/meeting-session.ts`](../../entrypoints/shared/meeting-session.ts):

- platforms: `google-meet`, `microsoft-teams`, `zoom-web`
- event sources: `caption`, `chat`
- lifecycle states: `live`, `ended`, `reopened`
- artifacts include summaries and assistant state/output snapshots

## Continuity Model

- primary: optional cloud sync to user-owned app-data folders (Google Drive / OneDrive), currently enabled on Chrome-family builds and explicitly gated on Firefox until browser identity support is verified
- fallback: encrypted bundle export/import (`app-data-backup`)
