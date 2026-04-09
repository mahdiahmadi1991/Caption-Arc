# CaptionArc Architecture Overview

## Product Boundary

CaptionArc is a browser-only capture and translation product for supported web meeting surfaces:

- Google Meet
- Microsoft Teams Web
- Zoom Web App

It captures only what the browser page exposes visibly through native captions, subtitles, or supported meeting chat surfaces. It does not support native desktop meeting clients.

## Runtime Layers

### Content Script

The content script is responsible for:

- detecting the active meeting provider
- loading user settings
- applying startup behavior:
  - `off`
  - `ask`
  - `always`
- mounting the overlay UI
- starting the provider observer only after capture is allowed

If startup behavior is `ask`, capture does not begin until the approval prompt is accepted.

### Provider Adapters

Provider adapters are isolated per platform and handle:

- DOM detection
- caption extraction
- supported meeting chat extraction
- provider-specific metadata
- capture guidance when native captions are unavailable

### Background Layer

The background service worker owns:

- settings persistence
- translation requests
- adaptive summary generation
- durable summary job persistence and recovery
- summary job progress state
- summary cancel/retry orchestration
- session save/update/delete flows
- backup export/import
- optional cloud sync orchestration

### Summary Execution Pipeline

The summary pipeline is orchestration-first.

It currently supports:

- preflight planning based on session size and profile complexity
- per-profile summary effort with `Balanced` as the default for new profiles
- routing between:
  - `single_shot`
  - `structured_single_shot`
  - `multi_stage`
- evidence extraction and evidence merge for larger or riskier sessions
- final synthesis shaped by the user's original summary profile
- continuation fallback only when the final synthesis still hits output limits
- reconciliation after continuation when needed

Session Detail can subscribe to summary job status while the background job is running.

Queued or interrupted summary jobs are now persisted in extension storage so the background layer can resume them after restart.

Automatic end-of-meeting summaries are queued from the background session-finalization path so the trigger is less dependent on a single long-lived content-script request.

## Canonical Session Model

The session archive is event-log based.

- `SavedMeetingEvent` is the canonical unit
- event sources currently include:
  - `caption`
  - `chat`
- derived views are rebuilt from the event log:
  - preview captions
  - preview chat
  - searchable text
  - extraction report inputs

This keeps provider extraction separate from history presentation and export flows.

## Storage Model

CaptionArc is local-first.

### Local Storage Responsibilities

- `chrome.storage.local`
  - structured settings state
  - device-local secrets
  - device-local sync metadata
- `IndexedDB`
  - session index
  - chunked meeting-event storage
  - derived session preview data

### Retention

The local archive applies retention and compaction policies to avoid uncontrolled growth:

- archived session count limits
- age-based pruning for ended, non-starred sessions
- storage-pressure cleanup

## Privacy Boundaries

CaptionArc is not fully offline-only.

### Stays Device-Local

- API keys
- verification snapshots
- device identity
- local UI state

### May Leave The Device

- caption text and summary context sent to:
  - OpenAI
- mirrored archive data sent to:
  - Google Drive App Data Folder
  - OneDrive App Folder

Cloud sync is optional. If it is not configured, the archive remains local.

## Continuity Model

There are two continuity paths:

1. Personal Cloud Vault
   - primary multi-device continuity path
   - background reconciliation into the user's own cloud account
2. Encrypted Backup
   - fallback recovery path
   - `.mcbak` export/import with passphrase-based encryption

## Business/UX Alignment

The current product story is:

- local-first archive
- fixed OpenAI AI service
- adaptive summary reliability without reducing profile freedom
- optional cloud continuity in the user's own account
- explicit startup control before capture begins
- session review and follow-up through searchable history and summaries

Documentation and product copy should avoid saying that all meeting data always stays local, because that is only true when cloud providers are not used.
