# Event Ingestion Traceability Matrix

## Purpose

This matrix maps event-ingestion behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| EINGEST-001 | C-EINGEST-001 | overlay items normalize speaker, text, timestamps, session offsets, and chat finalization defaults | `tests/google-meet/event-ingestion.contract.test.ts` | implemented |
| EINGEST-002 | C-EINGEST-002 | live chat ingestion updates overlay state, meeting history, and rendering in one path | `tests/google-meet/event-ingestion.contract.test.ts` | implemented |
| EINGEST-003 | C-EINGEST-003 | live chat translation is requested only when translation is enabled | `tests/google-meet/event-ingestion.contract.test.ts` | implemented |

## Notes

1. Event-ingestion planned coverage is now closed with deterministic contract tests.
