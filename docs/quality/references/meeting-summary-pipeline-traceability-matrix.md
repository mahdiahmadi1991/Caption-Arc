# Meeting Summary Pipeline Traceability Matrix

## Purpose

This matrix maps meeting-summary-pipeline behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| MSUM-001 | C-MSUM-001 | persisted summary jobs use per-session queue entries, bounded retries, and earliest-deadline alarms | `tests/google-meet/meeting-summary-pipeline.contract.test.ts` | implemented |
| MSUM-002 | C-MSUM-002 | automatic summary requests require ended sessions, source content, and auto-summary-enabled profiles | `tests/google-meet/meeting-summary-pipeline.contract.test.ts` | implemented |
| MSUM-003 | C-MSUM-003 | summary planning selects strategy from weighted transcript, chat, and prompt size | `tests/google-meet/meeting-summary-pipeline.contract.test.ts` | implemented |
| MSUM-004 | C-MSUM-004 | long summaries continue segment-by-segment and optionally reconcile the final draft | `tests/google-meet/meeting-summary-pipeline.contract.test.ts` | implemented |
| MSUM-005 | C-MSUM-005 | strategy-specific execution chooses direct prompts or evidence extraction before persistence | `tests/google-meet/meeting-summary-pipeline.contract.test.ts` | implemented |
| MSUM-006 | C-MSUM-006 | successful summary completion emits one browser notification with browser-locale copy | `tests/google-meet/meeting-summary-pipeline.contract.test.ts` | implemented |
| MSUM-007 | C-MSUM-007 | same-session focused detail suppresses notifications and notification clicks deep-link to the exact saved summary | `tests/google-meet/meeting-summary-pipeline.contract.test.ts`, `tests/google-meet/meeting-history-url-state.contract.test.ts` | implemented |

## Notes

1. Summary-pipeline deterministic coverage now includes persistence-time notification emission, focus-aware suppression, and summary-target URL construction.
