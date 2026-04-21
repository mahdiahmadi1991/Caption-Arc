# Browser Capabilities Code-Derived Behavior Contract

## Purpose

This document captures how browser family detection, extension storage selection, cloud-sync support, and default device labels are derived.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)
- [../../entrypoints/shared/device-identity.ts](../../entrypoints/shared/device-identity.ts)

## Rule ID Convention

- Contract rule IDs: `C-BCAP-<NNN>`
- Traceability case IDs: `BCAP-<NNN>`

## Contract Rules

## C-BCAP-001: Browser family detection prefers extension-page protocol, then user agent, then runtime namespace hints

Source: `detectBrowserRuntimeFamily`, `getBrowserRuntimeFamily`, `isExtensionPageProtocol` in [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)

Rules:

1. `moz-extension:` resolves to Firefox before any user-agent or namespace check runs.
2. `chrome-extension:` resolves to Chrome before any user-agent or namespace check runs.
3. Firefox user-agent detection wins over Chrome-family detection when protocol is not decisive.
4. Chrome-family user-agent detection recognizes Chrome, Chromium, Edge, and Opera families.
5. Namespace fallbacks use `chrome.runtime` before the presence of a `browser` namespace.
6. `isExtensionPageProtocol(protocol)` recognizes only Chrome and Firefox extension protocols.

## C-BCAP-002: Diagnostics storage selection prefers writable session storage and otherwise falls back to local storage

Source: `getExtensionStorageApi`, `getDiagnosticsStorageSelection` in [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)

Rules:

1. Extension storage prefers `chrome.storage` before `browser.storage` when both exist.
2. Diagnostics storage selects `session` only when both `get` and `set` exist for session storage.
3. When writable session storage is unavailable, diagnostics storage falls back to local storage.
4. The fallback response reports `usesFallback: true`.

## C-BCAP-003: Browser-governed cloud sync is available only when the current browser target has the required OAuth configuration

Source: `getBrowserProductLabel`, `getCloudSyncProviderSupport`, `filterSupportedCloudSyncProviders`, `BROWSER_GOVERNED_CLOUD_SYNC_PROVIDERS` in [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)

Rules:

1. Browser-governed cloud sync currently applies only to `google-drive` and `onedrive`.
2. Chrome and Firefox can both mark `onedrive` supported when the current browser target resolves the required provider-specific OAuth client ID.
3. Chrome and Firefox can both mark `google-drive` supported only when the current browser target resolves both the provider-specific OAuth client ID and client secret.
4. Chrome and Firefox mark a governed provider unsupported when its required browser-targeted OAuth configuration is missing, and return a browser-specific reason string that identifies the missing configuration for that browser target.
5. `filterSupportedCloudSyncProviders(...)` removes unsupported governed providers while preserving unrelated provider strings.

## C-BCAP-004: Default device labels combine resolved browser product and platform labels

Source: `createDefaultDeviceLabel` in [../../entrypoints/shared/device-identity.ts](../../entrypoints/shared/device-identity.ts); `getBrowserProductLabel` in [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)

Rules:

1. Default device labels derive browser product names from the resolved browser family.
2. Platform labels prefer ChromeOS, Windows, macOS, and Linux user-agent matches before falling back to `This Device`.
3. When no concrete platform label is found, default device labels use the form `<Browser> on this device`.
4. Otherwise default device labels use the form `<Browser> on <Platform>`.

## Test Traceability

- [../quality/references/browser-capabilities-traceability-matrix.md](../quality/references/browser-capabilities-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If browser-family detection, diagnostics storage fallback, cloud-sync support gating, or default device label composition changes in code, update this contract and its traceability matrix in the same change set.
