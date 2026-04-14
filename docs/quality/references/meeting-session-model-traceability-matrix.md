# Meeting Session Model Traceability Matrix

## Purpose

This matrix maps meeting-session-model behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| MSESS-001 | C-MSESS-001 | Teams identifier sanitization collapses direct calls and normalizes numeric meeting codes | `tests/google-meet/meeting-session-model.contract.test.ts` | implemented |
| MSESS-002 | C-MSESS-002 | display titles distinguish direct calls from scheduled meetings | `tests/google-meet/meeting-session-model.contract.test.ts` | implemented |
| MSESS-003 | C-MSESS-003 | rejoin history produces segmented offsets and ordered timeline segments | `tests/google-meet/meeting-session-model.contract.test.ts` | implemented |
| MSESS-004 | C-MSESS-004 | stable event keys prefer provider IDs and otherwise derive a timestamp-bucket fingerprint | `tests/google-meet/meeting-session-model.contract.test.ts` | implemented |
| MSESS-005 | C-MSESS-005 | stored-session normalization rebuilds searchable text, derived data, and sync hashes | `tests/google-meet/meeting-session-model.contract.test.ts` | implemented |

## Notes

1. Session-model coverage remains responsible for stored-session compatibility paths, including legacy `summaryProfileId` values that now normalize into `meetingProfileId`.