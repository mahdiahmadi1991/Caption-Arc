# Build, Packaging, And Release

## Local Build Flow

From [`package.json`](../../package.json):

- `pnpm dev`: WXT dev mode
- `pnpm build`: all-target production build alias
- `pnpm build:target:chrome:*` / `pnpm build:target:firefox:*`: canonical distribution-target build commands
- `pnpm build:chrome:*`: short-form alias family for the Chrome target
- `pnpm package`: all-target production packaging alias
- `pnpm package:target:chrome` / `pnpm package:target:firefox`: canonical distribution-target package commands

## Canonical Version Wiring

- `package.json` is the canonical version source
- [`wxt.config.ts`](../../wxt.config.ts) maps that package version into:
  - manifest `version`
  - manifest `version_name`
- preview package versions on `develop` are converted to numeric manifest versions so extension packaging remains valid across Chromium-family browsers and Firefox

See [../operations/release-versioning.md](../operations/release-versioning.md) for the full versioning model.

## CI Release Flow

From [`.github/workflows/release-train.yml`](../../.github/workflows/release-train.yml):

- triggered on pushes to `develop`
- computes the next preview version for the integration branch
- creates preview tags and GitHub prereleases
- creates or updates the stable release PR targeting `main`

From [`.github/workflows/release.yml`](../../.github/workflows/release.yml):

- triggered on pushes to `main`
- install dependencies via pnpm
- validate the stable release tag/version relationship
- run distribution-target production packaging for Chromium-family and Firefox
- create the stable annotated tag if it does not exist yet
- publish `.release/v<version>/production/chrome/*.zip` and `.release/v<version>/production/firefox/*.zip` to the GitHub release
- the packaging step remains the source of truth for release artifacts because WXT packaging already emits the unpacked production build before zipping

## Artifact Expectations

- unpacked extension build artifacts are produced under `.release/v<version>/<mode>/chrome` and `.release/v<version>/<mode>/firefox`
- packaged release zip files are expected under `.release/v<version>/production/chrome/*.zip` and `.release/v<version>/production/firefox/*.zip`

## Release Governance

Operational release checklist lives in [../operations/release-runbook.md](../operations/release-runbook.md).

Release validation remains browser-aware even though packaging is target-oriented:

- Chrome runtime evidence follows the DLS guidance in [../setup/agent-testing-onboarding.md](../setup/agent-testing-onboarding.md) for the Chrome package that is also used on compatible Chromium-family browsers
- Firefox release validation follows [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md) until canonical Firefox automation is documented
