# Settings And Readiness Traceability Matrix

## Purpose

This matrix maps settings-and-readiness behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| SETRDY-001 | C-SETRDY-001 | settings loads merge legacy and split-state payloads before normalization | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-002 | C-SETRDY-002 | settings saves persist both shapes and notify cloud sync afterwards | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-003 | C-SETRDY-003 | OpenAI readiness derives from configuration plus verification snapshots bound to the current connection signature | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-004 | C-SETRDY-004 | verification success and failure clear stale readiness when OpenAI is no longer configured | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |

## Notes

1. Settings/readiness planned coverage is now closed with deterministic contract tests.
