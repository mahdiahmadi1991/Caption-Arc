# 2026-04-16 Release Target Normalization

Status note:

- This completed plan records an intermediate refactor that briefly normalized release targets to `chromium` / `firefox`.
- The current repository contract has since been simplified back to `chrome` / `firefox`.
- Keep this document only as historical traceability, not as the current source of truth.

## Goal

Normalize CaptionArc release semantics from browser-first wording (`chrome` / `firefox`) to distribution-target wording (`chromium` / `firefox`) while keeping Chrome as the canonical automated runtime-validation browser.

## Why

- The product ships one versioned release with multiple distributable packages, not separate product releases per browser.
- Chromium-based browsers such as Chrome, Edge, Brave, Opera, and Vivaldi can usually consume the same Chromium MV3 package.
- Store submission and browser-specific verification may still differ, so the repository needs a clean distinction between:
  - product release version
  - distribution target
  - verification browser

## Implemented Decisions

1. Canonical build/package naming now uses `target:chromium` and `target:firefox`.
2. Legacy `build:chrome:*` and `zip:chrome:*` commands remain as compatibility aliases.
3. Release artifacts now emit to versioned paths under:
   - unpacked builds: `.release/v<version>/<mode>/chromium` and `.release/v<version>/<mode>/firefox`
   - packaged zips: `.release/v<version>/production/chromium/*.zip` and `.release/v<version>/production/firefox/*.zip`
4. GitHub Actions release and quality workflows now use the canonical target-oriented commands.
5. Chrome remains the canonical automated CDP and DLS runtime for validating the Chromium package.
6. Canonical docs now describe:
   - one product release
   - two governed release targets
   - Chromium-family install intent beyond Chrome where compatible

## Validation

- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm build:targets:production`
- `pnpm package:targets:production`
