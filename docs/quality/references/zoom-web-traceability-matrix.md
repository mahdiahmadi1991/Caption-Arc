# Zoom Web Traceability Matrix

## Purpose

This matrix maps Zoom Web provider behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| ZOOM-001 | C-ZOOM-001 | provider activation distinguishes shell routes, iframe context, and standalone meeting routes | `tests/google-meet/zoom-web-provider.contract.test.ts` | implemented |
| ZOOM-002 | C-ZOOM-002 | page-context and presence depend on meeting-shell and joined-surface signals | `tests/google-meet/zoom-web-provider.contract.test.ts` | implemented |
| ZOOM-003 | C-ZOOM-003 | caption availability and disable-state handling use menu state, subtitle text, and recency windows | `tests/google-meet/zoom-web-provider.contract.test.ts` | implemented |
| ZOOM-004 | C-ZOOM-004 | rolling transcript updates merge deltas before finalization | `tests/google-meet/zoom-web-provider.contract.test.ts` | implemented |
| ZOOM-005 | C-ZOOM-005 | metadata extracts Zoom meeting identifiers with title and participant fallback | `tests/google-meet/zoom-web-provider.contract.test.ts` | implemented |
| ZOOM-006 | C-ZOOM-006 | Zoom chat capture gates on settings and de-duplicates by stable message ID | `tests/google-meet/zoom-web-provider.contract.test.ts` | implemented |
| ZOOM-007 | C-ZOOM-007 | observer lifecycle combines body observers, chat observers, and interaction-aware caption disable windows | `tests/google-meet/zoom-web-provider.contract.test.ts` | implemented |

## Notes

1. Deterministic Zoom provider contract coverage now exists for activation rules, shell/context presence behavior, caption availability signals, transcript delta/merge helpers, chat extraction de-dup, session metadata extraction, and observer lifecycle behavior.
