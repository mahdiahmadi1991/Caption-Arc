# Extension Runtime Model

CaptionArc runs as a browser extension with Chromium-family and Firefox governed release targets plus distinct runtime surfaces:

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
- optional cloud sync providers are gated by browser-targeted OAuth configuration and runtime verification evidence, not by a simplistic product-version split.
- Chromium-family packaging is intended for Chrome and compatible Chromium browsers, while Chrome remains the canonical automated smoke/runtime-validation browser for that package.
- removing or tightening a browser-targeted capability gate requires corresponding verification evidence and matching compatibility and release-doc updates.
