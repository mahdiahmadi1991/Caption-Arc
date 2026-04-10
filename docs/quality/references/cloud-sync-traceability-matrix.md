# Cloud Sync Traceability Matrix

## Purpose

This matrix maps cloud-sync behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| CSYNC-001 | C-CSYNC-001 | Firefox baseline checkpoints expose browser-governed providers as explicitly unsupported | `tests/google-meet/cloud-sync-browser-support.contract.test.ts` | implemented |
| CSYNC-002 | C-CSYNC-001 | unsupported browser checkpoints resolve to `action-required` and disconnected state | `tests/google-meet/cloud-sync-browser-support.contract.test.ts` | implemented |
| CSYNC-003 | C-CSYNC-004 | unsupported providers can still be disconnected and removed from persisted settings | `tests/google-meet/cloud-sync-browser-support.contract.test.ts` | implemented |
| CSYNC-004 | C-CSYNC-002 | initialization and local-change hooks enqueue reconciliation and delayed runs instead of syncing inline | `tests/google-meet/cloud-sync-orchestration.contract.test.ts` | implemented |
| CSYNC-005 | C-CSYNC-003 | transient failures back off with capped retry delay and promote to manual retry after the retry limit | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-006 | C-CSYNC-004 | resolving pending settings choices writes selected settings and immediately re-runs reconciliation | `tests/google-meet/cloud-sync-orchestration.contract.test.ts` | implemented |

## Notes

1. Cloud-sync orchestration and retry behavior now include deterministic contract coverage.
