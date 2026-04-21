# Runtime Lifecycle Traceability Matrix

## Purpose

This matrix maps runtime-lifecycle behavior-contract rules to repository validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| RLIFE-001 | C-RLIFE-002 | content-script boot injects a marker on active pages | `tests/google-meet/content-script-marker.contract.test.ts` | implemented |
| RLIFE-002 | C-RLIFE-002 | content-script boot replaces an existing marker and preserves a single-marker invariant | `tests/google-meet/content-script-marker.contract.test.ts` | implemented |
| RLIFE-003 | C-RLIFE-001 | initialization returns `null` when no provider resolves or body is missing | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-004 | C-RLIFE-001 | Teams `/v2/` pages without page context are rejected at initialization time | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-005 | C-RLIFE-003 | Google Meet reset-page candidate requires URL match and missing page context | `tests/google-meet/google-meet-runtime-reset.contract.test.ts` | implemented |
| RLIFE-006 | C-RLIFE-003 | reset-page observation transitions from `pending` to `confirmed` after `2000` ms | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-007 | C-RLIFE-004 | presence transitions require two consecutive matching observations | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-008 | C-RLIFE-005 | capture starts only when presence is `joined` and lifecycle guards are clear | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-009 | C-RLIFE-005 | stop flow records `recentlyEndedSession` and sets presence to `ended` when `markEnded !== false` | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-010 | C-RLIFE-006 | teardown clears quick-access runtime status and resets runtime-local flags | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-011 | C-RLIFE-006 | lifecycle sync force-resolves capture, continuation, and ended prompts during unknown or joined transitions | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-012 | C-RLIFE-006 | confirmed Teams reset pages prefer in-place reset flows over immediate teardown | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-013 | C-RLIFE-007 | quick-access soft refresh rebuilds extension-owned artifacts and keeps the same meeting session active | `tests/google-meet/runtime-lifecycle.contract.test.ts` | implemented |
| RLIFE-014 | C-RLIFE-007 | quick-access soft refresh background typing and terms-gate routing stay aligned to the success/error response contract | `tests/google-meet/terms-gate-background.contract.test.ts`, `tests/google-meet/quick-access-runtime.contract.test.ts` | implemented |

## Notes

1. Runtime lifecycle coverage stays aligned with provider-specific reset-page detection and visibility rules exercised through deterministic browser smoke and contract tests.
