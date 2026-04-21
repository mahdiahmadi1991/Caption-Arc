# Release Runbook

## Preconditions

- changes merged to `develop`
- docs updated for behavior/permission/scope changes
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
- recommended for full PR-check participation:
  - `RELEASE_AUTOMATION_TOKEN` configured for release-automation pull requests

## Release Train Flow

1. Merge reviewed work into `develop`.
2. `release-train.yml` computes the next preview version, updates `package.json` on `develop`, and creates the preview tag/prerelease.
3. The same workflow creates or updates the stable release PR targeting `main`.
4. Review the release PR.
5. Merge the release PR into `main`.
6. `release.yml` validates the stable version, creates the annotated stable tag, creates the GitHub release, and uploads the packaged Chrome/Firefox artifacts.

## Local Verification Before Merging The Release PR

```bash
pnpm install
pnpm docs:check
pnpm test:google
pnpm test:google:coverage
pnpm build:target:chrome:development
pnpm build:target:firefox:development
```

If you want a full local production packaging rehearsal before merging the release PR:

```bash
pnpm release:prepare
```

Expected packaged stable release artifacts:

- `.release/v<version>/production/chrome/*.zip`
- `.release/v<version>/production/firefox/*.zip`

## GitHub Release Flow

- do not push stable tags manually
- allow the automated release PR merge into `main` to trigger stable publication
- `release.yml` creates the stable annotated tag in the form `v<version>`
- `release.yml` creates the GitHub release body from the canonical `CHANGELOG.md` section
- `release.yml` packages and uploads Chromium-family and Firefox assets
- preview tags and preview GitHub releases are created automatically from `develop`

## Post-Release Validation

- load the Chrome package in Chrome and run the required DLS coverage for the release-sensitive paths
- if the release will also be published to Edge Add-ons or another Chromium-compatible store, validate install and permissions there before submission
- load the Firefox package and execute [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md)
- verify provider detection and summary paths
- verify no release-time permission drift
- verify release notes and store submission text describe Chromium-family browsers, Firefox, and any browser-gated optional capabilities accurately
