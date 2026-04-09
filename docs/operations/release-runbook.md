# Release Runbook

## Preconditions

- changes merged to release-ready branch
- docs updated for behavior/permission/scope changes
- target version/tag decided

## Build And Package

```bash
pnpm install
pnpm build:all:production
pnpm zip:all:production
```

Expected release artifacts:

- `.release/chrome/production/*.zip`
- `.release/firefox/production/*.zip`

## GitHub Release Flow

- push tag in form `v<version>`
- release workflow builds and uploads browser-specific zip assets from `.release/chrome/production/` and `.release/firefox/production/`
- verify release assets and generated notes

## Post-Release Validation

- load the Chrome package and run the required DLS coverage for the release-sensitive paths
- load the Firefox package and execute [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md)
- verify provider detection and summary paths
- verify no release-time permission drift
- verify release notes and store submission text describe Chrome, Firefox, and any browser-gated optional capabilities accurately
