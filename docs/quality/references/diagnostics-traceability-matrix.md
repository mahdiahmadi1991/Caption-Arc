# Diagnostics Traceability Matrix

## Purpose

This matrix maps diagnostics behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| DIAG-001 | C-DIAG-001 | level gating accepts warn/error above debug and rejects trace below debug | `tests/google-meet/diagnostics.contract.test.ts` | implemented |
| DIAG-002 | C-DIAG-002 | diagnostics events redact sensitive keyed values | `tests/google-meet/diagnostics.contract.test.ts` | implemented |
| DIAG-003 | C-DIAG-002 | diagnostics snapshots sanitize URLs and long strings | `tests/google-meet/diagnostics.contract.test.ts` | implemented |
| DIAG-004 | C-DIAG-004 | the diagnostics client stays disabled and safe when browser APIs are unavailable | `tests/google-meet/diagnostics-client.contract.test.ts` | implemented |
| DIAG-005 | C-DIAG-004 | the diagnostics client forwards events, snapshots, and clear-snapshot messages when enabled | `tests/google-meet/diagnostics-client.contract.test.ts` | implemented |
| DIAG-006 | C-DIAG-004 | storage changes can disable capture without breaking diagnostics callers | `tests/google-meet/diagnostics-client.contract.test.ts` | implemented |
| DIAG-007 | C-DIAG-004 | runtime send failures are swallowed by the diagnostics client | `tests/google-meet/diagnostics-client.contract.test.ts` | implemented |
| DIAG-008 | C-DIAG-004 | diagnostics config falls back to local storage when writable session storage is unavailable | `tests/google-meet/diagnostics-client.contract.test.ts` | implemented |
| DIAG-009 | C-DIAG-004 | client and collector both fall back to local storage when session storage is read-only | `tests/google-meet/diagnostics-storage-selection.contract.test.ts` | implemented |
| DIAG-010 | C-DIAG-003 | collector duplicate suppression, repetitive-message windows, and snapshot dedupe remain covered | `tests/google-meet/diagnostics.collector.contract.test.ts` | implemented |

## Notes

1. Current deterministic diagnostics coverage is strongest in shared sanitization and diagnostics-client storage-selection paths.
