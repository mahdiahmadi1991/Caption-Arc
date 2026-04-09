# Extension Runtime Model

CaptionArc runs as a browser extension with Chrome and Firefox build targets plus distinct runtime surfaces:

- `entrypoints/background/*`: background service worker orchestration.
- `entrypoints/content/*`: in-page capture, overlay, and provider adapters.
- `entrypoints/options/*`: settings UI.
- `entrypoints/popup/*`: popup UI and quick status.
- `entrypoints/meeting-history/*`: session-history UI.
- `entrypoints/shared/*`: shared domain models and UI helpers.

## Runtime Responsibility Split

- Background:
  - owns persistence, translation requests, summary jobs, cloud-sync orchestration, and command handling.
- Content script:
  - detects provider context, captures captions/chat, renders in-meeting surfaces, and dispatches runtime messages.
- UI pages:
  - read and mutate settings/session state through background message actions.

## Provider Layer

Provider adapters are isolated in `entrypoints/content/providers` and currently include:

- `google-meet.ts`
- `microsoft-teams.ts`
- `zoom-web.ts`

Shared runtime chooses provider behavior through the provider registry and platform runtime.

## Startup And Lifecycle

- background initializes cloud-sync engine and summary queue on extension startup.
- content runtime gates capture start with provider context and user settings.
- summary retry is scheduled via `chrome.alarms` from background orchestration.

## Browser Capability Boundaries

- extension-page runtime detection recognizes both `chrome-extension:` and `moz-extension:` protocols when resolving shared UI runtime context.
- diagnostics persistence prefers `chrome.storage.session` and falls back to `chrome.storage.local` when session storage is unavailable on the current browser target.
- optional cloud sync providers are browser-gated at runtime; Google Drive and OneDrive remain enabled on Chrome-family builds and are explicitly blocked on Firefox until the required identity flows are browser-verified.
- removing a temporary Firefox capability gate requires browser-specific verification evidence and corresponding documentation updates to the compatibility and release guidance.
