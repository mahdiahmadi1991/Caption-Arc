# Microsoft Teams Traceability Matrix

## Purpose

This matrix maps Microsoft Teams provider behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| MTEAM-001 | C-MTEAMS-001 | Teams Live `/v2/` URL matching differs from scheduled meeting URL matching | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-002 | C-MTEAMS-002 | page-context detection uses join-now, leave, caption, title, and meeting-shell signals | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-003 | C-MTEAMS-003 | presence transitions through `prejoin`, `joined`, `ended`, and `unknown` using `hasSeenTeamsLeaveControl` | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-004 | C-MTEAMS-004 | live captions are considered enabled by visible caption UI or enabled menu state | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-005 | C-MTEAMS-004 | automatic caption enable uses `Alt+Shift+C` and bounded verification polling | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-006 | C-MTEAMS-005 | metadata distinguishes direct-call vs scheduled-meeting identifiers | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-007 | C-MTEAMS-006 | chat ingestion de-duplicates by Teams message ID and ignores pre-session history for direct calls | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-008 | C-MTEAMS-007 | caption extraction suppresses duplicate signatures, merges some unknown-speaker updates, and finalizes on speaker switches | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |
| MTEAM-009 | C-MTEAMS-008 | observer lifecycle rebinds caption and chat regions on a fixed poll cadence | `tests/google-meet/microsoft-teams-provider.contract.test.ts` | implemented |

## Notes

1. Deterministic Teams provider contract coverage now exists for URL matching, page-context signals, presence transitions, caption availability, automatic caption-enable preference short-circuit behavior, direct-call vs scheduled metadata classification, chat/caption ingestion behavior, and observer rebind lifecycle.
