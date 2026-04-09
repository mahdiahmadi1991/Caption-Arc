# Compatibility Matrix

## Supported Meeting Platforms

- Google Meet (web)
- Microsoft Teams Web
- Zoom Web App

## Browser Scope

Governed browser targets are Chrome and Firefox.

Core runtime expectations:

- browser-targeted builds and packages are produced for both Chrome and Firefox
- provider detection, caption capture, translation, summaries, history, and options surfaces are expected to package on both governed browsers
- shared UI runtime detection must recognize both `chrome-extension:` and `moz-extension:` extension-page protocols
- runtime-sensitive changes must record Chrome smoke evidence and Firefox verification evidence using [firefox-manual-verification-checklist.md](./firefox-manual-verification-checklist.md) until canonical Firefox automation exists

Optional browser-gated capabilities:

- Google Drive cloud sync: supported on Chrome, explicitly blocked on Firefox until extension identity support is browser-verified
- OneDrive cloud sync: supported on Chrome, explicitly blocked on Firefox until extension identity support is browser-verified
- diagnostics collector persistence: prefers extension session storage and falls back to extension local storage when session storage is unavailable on the current browser target

Firefox limitation removal rule:

- do not remove a temporary Firefox limitation without browser-specific implementation evidence, updated verification coverage, and matching docs or store copy updates

## Provider QA Matrix

See [../archive/feature-plans/provider-qa-baseline.md](../archive/feature-plans/provider-qa-baseline.md) for the consolidated provider QA baseline.
