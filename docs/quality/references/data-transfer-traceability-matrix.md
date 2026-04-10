# Data Transfer Traceability Matrix

## Purpose

This matrix maps data-transfer behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| DXFER-001 | C-DXFER-001 | export bundles use the fixed bundle manifest plus portable settings and normalized sessions | `tests/google-meet/data-transfer.contract.test.ts` | implemented |
| DXFER-002 | C-DXFER-002 | import normalization rejects malformed bundle kinds, versions, and payload shapes | `tests/google-meet/data-transfer.contract.test.ts` | implemented |
| DXFER-003 | C-DXFER-003 | import apply failures attempt settings rollback before surfacing errors | `tests/google-meet/data-transfer.contract.test.ts` | implemented |

## Notes

1. Data-transfer planned coverage is now closed with deterministic contract tests.
