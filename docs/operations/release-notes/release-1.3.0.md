# Release 1.3.0

Historical note:

- this file documents the bootstrap release that predated the repository's automated release-note flow
- ongoing release notes now publish through GitHub Releases, with `CHANGELOG.md` as the canonical in-repo changelog

## Summary

This release finalizes the governed local bootstrap history for CaptionArc at version `1.3.0`.

The repository now carries a linear `main` history with annotated release tags, browser-aware build outputs, contributor governance, contract tests, release automation wiring, and public-safe documentation assets around the full current product surface.

## Highlights

- Finalized a curated squash-merge release history from a freshly re-initialized repository.
- Aligned the canonical repository version across `package.json`, `wxt.config.ts`, changelog material, and annotated release tags through `v1.3.0`.
- Preserved the current cross-browser extension product surface, including Google Meet, Microsoft Teams Web, Zoom Web App, meeting history, summaries, diagnostics, and optional cloud sync.
- Added repository governance, execution-planning, quality-gate, and release-workflow documentation as first-class versioned artifacts.
- Added GitHub workflow definitions for docs guardrails, quality gates, and tagged release packaging.
- Added repository-local Codex configuration and versioned documentation asset indexes for public-safe images.

## Notes

- This bootstrap was executed locally; hosted pull requests and GitHub Releases were intentionally not created in this workflow.
- Two early local tag/version mismatches were corrected immediately before any remote publication as part of documented incident recovery during the bootstrap process.
- Chromium-family and Firefox production targets remain the governed packaging targets for the repository, with Chrome preserved as the canonical automated smoke browser for the Chrome package.

## Recommended QA Before Release

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:target:chrome:production`
- `pnpm build:firefox:production`
