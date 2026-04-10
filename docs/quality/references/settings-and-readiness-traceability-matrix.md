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
| SETRDY-005 | C-SETRDY-001, C-SETRDY-002 | legal-risk acknowledgments normalize from split state and persist with shared settings | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-006 | C-SETRDY-001, C-SETRDY-002 | local Terms acceptance normalizes from device state and persists outside shared settings | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-008 | C-SETRDY-001, C-SETRDY-002 | current-version Terms acceptance and decline reconcile to the latest local decision and saves return normalized settings | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-003 | C-SETRDY-003 | OpenAI readiness derives from configuration plus verification snapshots bound to the current connection signature | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-004 | C-SETRDY-004 | verification success and failure clear stale readiness when OpenAI is no longer configured | `tests/google-meet/settings-and-readiness.contract.test.ts` | implemented |
| SETRDY-007 | C-SETRDY-005 | current Terms acceptance blocks protected actions and governed UI surfaces until accepted | validation deferred in this step by repository-owner request | planned |
| SETRDY-009 | C-SETRDY-005 | installs and extension updates prompt for the current Terms when the current version is not yet accepted | `tests/google-meet/terms-gate-background.contract.test.ts` | implemented |
| SETRDY-010 | C-SETRDY-005 | declining the current Terms after acceptance stops protected background services and closes the Terms page | `tests/google-meet/terms-gate-background.contract.test.ts` | implemented |

## Notes

1. Settings/readiness planned coverage is now closed with deterministic contract tests.
2. `SETRDY-007` remains `planned` until the universal Terms-gate behavior receives dedicated automated validation beyond storage normalization coverage.
