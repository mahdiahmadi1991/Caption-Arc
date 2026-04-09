# Build, Packaging, And Release

## Local Build Flow

From [`package.json`](../../package.json):

- `pnpm dev`: WXT dev mode
- `pnpm build`: all-browser production build alias
- `pnpm build:chrome:*` / `pnpm build:firefox:*`: explicit browser-aware build commands
- `pnpm zip`: all-browser production packaging alias
- `pnpm zip:chrome:production` / `pnpm zip:firefox:production`: explicit browser-aware package commands

## CI Release Flow

From [`.github/workflows/release.yml`](../../.github/workflows/release.yml):

- triggered on tags matching `v*`
- install dependencies via pnpm
- run browser-specific production builds for Chrome and Firefox
- run browser-specific production packaging for Chrome and Firefox
- publish `.release/chrome/production/*.zip` and `.release/firefox/production/*.zip` as GitHub release assets

## Artifact Expectations

- extension build artifacts are produced under `.release/chrome/<mode>` and `.release/firefox/<mode>`
- release zip files are expected under `.release/<browser>/production/*.zip`

## Release Governance

Operational release checklist lives in [../operations/release-runbook.md](../operations/release-runbook.md).

Release validation remains browser-aware:

- Chrome runtime evidence follows the DLS guidance in [../setup/agent-testing-onboarding.md](../setup/agent-testing-onboarding.md)
- Firefox release validation follows [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md) until canonical Firefox automation is documented
