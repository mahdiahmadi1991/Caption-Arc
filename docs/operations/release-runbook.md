# Release Runbook

## Preconditions

- changes merged to release-ready branch
- docs updated for behavior/permission/scope changes
- target version/tag decided
- production env values available either through CI secrets or local `.secrets/.env.production.local`
- Chrome-package identity material prepared:
  - `WXT_CHROME_EXTENSION_KEY_PRODUCTION` available to the production build environment
  - matching production private key retained in a secure local or CI secret store outside tracked repo files
  - development and production Chrome identities are intentionally distinct unless an explicit release policy says otherwise
- Firefox production identity prepared:
  - `WXT_FIREFOX_EXTENSION_ID_PRODUCTION` available to the production build environment
- governed production cloud-sync OAuth config available to the production build environment:
  - `WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME` or `WXT_GOOGLE_OAUTH_CLIENT_ID`
  - `WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME` or `WXT_GOOGLE_OAUTH_CLIENT_SECRET`
  - `WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX` or `WXT_GOOGLE_OAUTH_CLIENT_ID`
  - `WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX` or `WXT_GOOGLE_OAUTH_CLIENT_SECRET`
  - `WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME` or `WXT_MICROSOFT_OAUTH_CLIENT_ID`
  - `WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX` or `WXT_MICROSOFT_OAUTH_CLIENT_ID`
  - `WXT_MICROSOFT_OAUTH_TENANT` when OneDrive auth is tenant-scoped instead of `common`
- release tag must match `package.json` version exactly

## Build And Package

```bash
pnpm install
pnpm release:validate
pnpm release:prepare
```

Notes:

- `pnpm package:target:chrome` and `pnpm package:target:firefox` already emit the unpacked production artifact plus the zip asset for that target
- `pnpm release:prepare` therefore packages directly instead of running a redundant standalone production build first

Expected release artifacts:

- `.release/v<version>/production/chrome/*.zip`
- `.release/v<version>/production/firefox/*.zip`

## GitHub Release Flow

- push tag in form `v<version>`
- release workflow installs with `--frozen-lockfile`, validates release config, refuses tag/package version drift, and packages targets directly without a duplicate pre-build step
- release workflow builds and uploads distribution-target zip assets from `.release/v<version>/production/chrome/` and `.release/v<version>/production/firefox/`
- verify release assets and generated notes

## Post-Release Validation

- load the Chrome package in Chrome and run the required DLS coverage for the release-sensitive paths
- if the release will also be published to Edge Add-ons or another Chromium-compatible store, validate install and permissions there before submission
- load the Firefox package and execute [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md)
- verify provider detection and summary paths
- verify no release-time permission drift
- verify release notes and store submission text describe Chromium-family browsers, Firefox, and any browser-gated optional capabilities accurately
