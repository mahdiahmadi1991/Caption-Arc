# Compatibility Matrix

## Supported Meeting Platforms

- Google Meet (web)
- Microsoft Teams Web
- Zoom Web App

## Browser Scope

Governed release targets are Chromium-family and Firefox.

Core runtime expectations:

- browser-targeted builds and packages are produced for both the Chromium-family package and the Firefox package
- the Chromium-family package is the canonical distribution artifact for Chrome and compatible Chromium browsers such as Edge, Brave, Opera, and Vivaldi when their MV3 policies allow it
- Chrome remains the canonical automated smoke browser for the Chromium-family package
- provider detection, caption capture, translation, summaries, history, and options surfaces are expected to package on both governed release targets
- shared UI runtime detection must recognize both `chrome-extension:` and `moz-extension:` extension-page protocols
- runtime-sensitive changes must record Chrome smoke evidence for the Chromium-family package and Firefox verification evidence using [firefox-manual-verification-checklist.md](./firefox-manual-verification-checklist.md) until canonical Firefox automation exists

Optional browser-gated capabilities:

- Google Drive cloud sync: implemented for Chromium-family browsers and Firefox when the current browser target has the required OAuth registration and extension identity configured; Firefox runtime verification evidence remains required before broad support claims are promoted
- OneDrive cloud sync: implemented for Chromium-family browsers and Firefox when the current browser target has the required OAuth registration and extension identity configured; Firefox runtime verification evidence remains required before broad support claims are promoted
- diagnostics collector persistence: prefers extension session storage and falls back to extension local storage when session storage is unavailable on the current browser target

Firefox limitation removal rule:

- do not remove a temporary Firefox limitation without browser-specific implementation evidence, updated verification coverage, and matching docs or store copy updates

## Provider QA Matrix

See [../archive/feature-plans/provider-qa-baseline.md](../archive/feature-plans/provider-qa-baseline.md) for the consolidated provider QA baseline.
