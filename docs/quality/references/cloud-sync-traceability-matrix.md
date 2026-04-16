# Cloud Sync Traceability Matrix

## Purpose

This matrix maps cloud-sync behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| CSYNC-001 | C-CSYNC-001 | Firefox baseline checkpoints expose configured cloud-sync providers as supported but disconnected | `tests/google-meet/cloud-sync-browser-support.contract.test.ts` | implemented |
| CSYNC-002 | C-CSYNC-001 | providers with missing browser-targeted OAuth config still resolve to `action-required` and disconnected state | `tests/google-meet/cloud-sync-browser-support.contract.test.ts` | implemented |
| CSYNC-003 | C-CSYNC-004 | unsupported providers can still be disconnected and removed from persisted settings | `tests/google-meet/cloud-sync-browser-support.contract.test.ts` | implemented |
| CSYNC-004 | C-CSYNC-002 | initialization and local-change hooks enqueue reconciliation and delayed runs instead of syncing inline | `tests/google-meet/cloud-sync-orchestration.contract.test.ts` | implemented |
| CSYNC-005 | C-CSYNC-003 | transient failures back off with capped retry delay and promote to manual retry after the retry limit | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-006 | C-CSYNC-004 | resolving pending settings choices writes selected settings and immediately re-runs reconciliation | `tests/google-meet/cloud-sync-orchestration.contract.test.ts` | implemented |
| CSYNC-007 | C-CSYNC-002 | retention-driven auto-prune deletions enqueue the same delete-session cloud tombstones as manual archive deletion | `tests/google-meet/meeting-history-retention.contract.test.ts` | implemented |
| CSYNC-008 | C-CSYNC-002 | archive-retention `Off` prevents retention-driven auto-prune deletion from enqueueing any cloud tombstones | `tests/google-meet/meeting-history-retention.contract.test.ts` | implemented |
| CSYNC-009 | C-CSYNC-003 | one provider failure does not block successful fan-out to another provider, and retries keep only failed targets | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-010 | C-CSYNC-002 | live sessions debounce session-meta, session-events, and session-artifacts tasks while ended sessions keep the short delay | `tests/google-meet/cloud-sync-orchestration.contract.test.ts` | implemented |
| CSYNC-011 | C-CSYNC-003 | unchanged session payload hashes skip redundant provider uploads | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-012 | C-CSYNC-003 | deleting a session clears cached per-provider content hashes for meta, events, and artifacts | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-013 | C-CSYNC-002 | split session payloads keep event-stream data separate from session artifacts | `tests/google-meet/cloud-sync-serialization.contract.test.ts` | implemented |
| CSYNC-014 | C-CSYNC-005 | stale Cloud Sync load responses do not overwrite newer hook state and refresh exposes explicit loading or success feedback | `tests/google-meet/use-cloud-sync.contract.test.ts` | implemented |
| CSYNC-015 | C-CSYNC-005 | success acknowledgement returns to the derived idle Cloud Sync summary after the short feedback window | `tests/google-meet/use-cloud-sync.contract.test.ts` | implemented |
| CSYNC-016 | C-CSYNC-005 | view-model overview and provider rows keep first-connect copy simple while exposing reconnect, unsupported-removal, and provider-scoped busy state | `tests/google-meet/cloud-sync-view-model.contract.test.ts`, `tests/google-meet/use-cloud-sync.contract.test.ts` | implemented |
| CSYNC-017 | C-CSYNC-004 | background OneDrive token lookup fails with reconnect-required state instead of launching an interactive auth window when stored tokens are missing or refresh fails | `tests/google-meet/onedrive-auth.contract.test.ts` | implemented |
| CSYNC-018 | C-CSYNC-002 | large live sessions widen the deferred sync window so full event-stream payload rewrites happen less aggressively during active meetings | `tests/google-meet/cloud-sync-orchestration.contract.test.ts` | implemented |
| CSYNC-019 | C-CSYNC-003 | meaningful local backlog defers reconcile scans so remote listing work does not compete with active upload waves | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-020 | C-CSYNC-003 | `lastScanAt` is stamped only when a reconcile task actually completes instead of every engine cycle heartbeat | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-021 | C-CSYNC-002 | large session event streams serialize into a manifest plus stable chunk payloads instead of a single rewritten event blob | `tests/google-meet/cloud-sync-serialization.contract.test.ts` | implemented |
| CSYNC-022 | C-CSYNC-003 | reconcile success persists the provider change cursor alongside the scan checkpoint so later cycles can reuse delta feeds | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts`, `tests/google-meet/onedrive-provider.contract.test.ts` | implemented |
| CSYNC-023 | C-CSYNC-004 | stored Google Drive and OneDrive OAuth tokens stay encrypted in local storage and background refresh stays non-interactive | `tests/google-meet/google-drive-auth.contract.test.ts`, `tests/google-meet/onedrive-auth.contract.test.ts` | implemented |
| CSYNC-024 | C-CSYNC-003 | stale connected checkpoints normalize from `syncing` back to `up-to-date` when the engine is idle and only future provider work remains queued | `tests/google-meet/cloud-sync-engine-retries.contract.test.ts` | implemented |
| CSYNC-025 | C-CSYNC-005 | Cloud Sync view-model exposes distinct visual tones for active syncing versus healthy up-to-date provider state | `tests/google-meet/cloud-sync-view-model.contract.test.ts` | implemented |

## Notes

1. Cloud-sync orchestration and retry behavior now include deterministic contract coverage.
