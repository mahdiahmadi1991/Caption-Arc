# Close-Mode Terms Accept Fix

This Execution Plan is a living document.

## Purpose / Big Picture

Fix the Terms acceptance path so accepting the current Terms works reliably for close-mode Terms pages, including install and popup-gate flows.

## Scope

- inspect the current accept path from the Terms page through background settings persistence
- patch the failure so acceptance succeeds and the page exits correctly
- verify install and popup-gate close-mode Terms URLs in the Chrome debug runtime

## Non-Goals

- redesigning the broader Terms UX
- changing non-close return targets unless needed for correctness

## Progress

- [x] Inspect current accept flow entrypoints
- [x] Implement accept-path fix
- [x] Validate install and popup-gate accept flows directly

## Outcomes and Retrospective

Implemented a background terms-gate fix so `saveSettings` writes that only touch
`appearance`, `termsAcceptance`, or `termsDecline` are not blocked by the generic
pre-acceptance gate. The failure was amplified by a stale extension runtime during
debug validation, so the recovery path now includes an explicit
`pnpm chrome:debug:reload-extension` step before re-running close-mode Terms checks.

Verification completed in the Chrome debug runtime with direct close-mode Terms URLs:

- `source=install&returnTo=close` -> `Accept and continue` persisted
  `termsAcceptance` and closed the Terms page
- `source=popup-gate&returnTo=close` -> `Accept and continue` persisted
  `termsAcceptance` and closed the Terms page

Supporting commands executed:

- `pnpm build:chrome:production`
- `pnpm build:all:development`
- `pnpm chrome:debug:reload`
- `pnpm chrome:debug:reload-extension`
