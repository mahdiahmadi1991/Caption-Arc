# Build, Packaging, And Release

## Local Build Flow

From [`package.json`](../../package.json):

- `pnpm dev`: WXT dev mode
- `pnpm build`: all-target production build alias
- `pnpm build:target:chrome:*` / `pnpm build:target:firefox:*`: canonical distribution-target build commands
- `pnpm build:chrome:*`: short-form alias family for the Chrome target
- `pnpm package`: all-target production packaging alias
- `pnpm package:target:chrome` / `pnpm package:target:firefox`: canonical distribution-target package commands

## CI Release Flow

From [`.github/workflows/release.yml`](../../.github/workflows/release.yml):

- triggered on tags matching `v*`
- install dependencies via pnpm
- run distribution-target production packaging for Chromium-family and Firefox
- publish `.release/v<version>/production/chrome/*.zip` and `.release/v<version>/production/firefox/*.zip` as GitHub release assets
- the packaging step is the source of truth for release artifacts because WXT packaging already emits the unpacked production build before zipping

## Artifact Expectations

- unpacked extension build artifacts are produced under `.release/v<version>/<mode>/chrome` and `.release/v<version>/<mode>/firefox`
- packaged release zip files are expected under `.release/v<version>/production/chrome/*.zip` and `.release/v<version>/production/firefox/*.zip`

## Release Governance

Operational release checklist lives in [../operations/release-runbook.md](../operations/release-runbook.md).

Release validation remains browser-aware even though packaging is target-oriented:

- Chrome runtime evidence follows the DLS guidance in [../setup/agent-testing-onboarding.md](../setup/agent-testing-onboarding.md) for the Chrome package that is also used on compatible Chromium-family browsers
- Firefox release validation follows [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md) until canonical Firefox automation is documented
