# Cloud Sync Code-Derived Behavior Contract

## Purpose

This document captures how cloud-sync orchestration, checkpoint baselines, queue processing, retries, and provider connect/disconnect flows behave.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/background/cloud-sync/index.ts](../../entrypoints/background/cloud-sync/index.ts)
- [../../entrypoints/background/cloud-sync/engine.ts](../../entrypoints/background/cloud-sync/engine.ts)
- [../../entrypoints/background/cloud-sync/providers/index.ts](../../entrypoints/background/cloud-sync/providers/index.ts)
- [../../entrypoints/background/cloud-sync/checkpoints.ts](../../entrypoints/background/cloud-sync/checkpoints.ts)
- [../../entrypoints/background/cloud-sync/types.ts](../../entrypoints/background/cloud-sync/types.ts)
- [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)

## Rule ID Convention

- Contract rule IDs: `C-CSYNC-<NNN>`
- Traceability case IDs: `CSYNC-<NNN>`

## Contract Rules

## C-CSYNC-001: Browser-governed cloud providers always start from baseline checkpoints that encode support and disconnect state

Source: `getCloudSyncProviderBaselineCheckpoints`, `normalizeCloudSyncProviderCheckpoint`, `mergeCloudSyncProviderCheckpoints`, `createUnsupportedCheckpoint`, `createSupportedDisconnectedCheckpoint` in [../../entrypoints/background/cloud-sync/providers/index.ts](../../entrypoints/background/cloud-sync/providers/index.ts)

Rules:

1. Baseline checkpoints are created for every browser-governed provider.
2. Supported providers start as disconnected with `healthState: "disconnected"`.
3. Unsupported providers start disconnected with `supported: false`, `healthState: "action-required"`, and an explicit unsupported-browser reason.
4. Normalization always rewrites unsupported checkpoints back to the canonical unsupported shape for the current browser.
5. Merged checkpoint lists preserve one checkpoint per provider over the baseline set.

## C-CSYNC-002: Initialization and local-change hooks enqueue reconciliation and follow-up runs instead of syncing inline

Source: `initializeCloudSyncEngine`, `noteCloudSyncSettingsSaved`, `noteMeetingSessionSaved`, `noteMeetingSessionDeleted`, `noteMeetingArchiveCleared` in [../../entrypoints/background/cloud-sync/index.ts](../../entrypoints/background/cloud-sync/index.ts)

Rules:

1. Cloud-sync initialization synchronizes checkpoint connections, queues reconciliation, and schedules a delayed background-start run.
2. Settings saves enqueue both shared-settings and device-profile sync tasks before scheduling a follow-up run.
3. Session saves enqueue both session-metadata and session-events sync tasks keyed by session sync ID.
4. Session deletion and archive-clear flows enqueue tombstone tasks and schedule a follow-up run instead of applying remote deletion inline.
5. Provider targets are filtered through browser support before tasks are enqueued.

## C-CSYNC-003: Queue processing retries transient provider failures with capped exponential delay and manual-retry promotion

Source: `createRetryDelayMs`, `processTaskAcrossProviders`, `processCloudSyncCycle`, `scheduleCloudSyncRun`, `runCloudSyncNow` in [../../entrypoints/background/cloud-sync/engine.ts](../../entrypoints/background/cloud-sync/engine.ts)

Rules:

1. Tasks targeting no connected providers are removed without further processing.
2. Successful task processing updates checkpoint health to `up-to-date` and clears retry-related error fields.
3. Retryable failures increment transient retry count and schedule the next attempt using capped exponential backoff with jitter.
4. After the maximum transient retry count is reached, retryable failures promote the checkpoint into a manual-retry state instead of continuing automatic retries.
5. Non-retryable failures move checkpoints to `action-required` or `needs-attention` based on the classified error kind.
6. Each processing cycle re-queues reconciliation for connected providers and schedules an immediate follow-up cycle when due work remains.

## C-CSYNC-004: Connect, disconnect, retry, and settings-choice flows reconcile state through checkpoints plus persisted settings

Source: `resolveCloudSyncSettingsChoice`, `retryCloudSync`, `connectCloudSyncProvider`, `disconnectCloudSyncProvider` in [../../entrypoints/background/cloud-sync/index.ts](../../entrypoints/background/cloud-sync/index.ts); `getCloudSyncPendingSettingsDecision`, `saveCloudSyncPendingSettingsDecision`, `clearCloudSyncPendingSettingsDecision` in [../../entrypoints/background/cloud-sync/checkpoints.ts](../../entrypoints/background/cloud-sync/checkpoints.ts)

Rules:

1. Resolving a pending settings choice writes either local or remote shared settings, clears the pending decision, then queues reconciliation and an immediate run.
2. Retrying cloud sync resets queued task retry metadata before reconciliation and an immediate run.
3. Provider connect attempts persist the returned checkpoint even when the browser marks the provider unsupported.
4. Unsupported connect attempts fail with `success: false` and surface the browser-support reason without adding the provider to connected settings.
5. Successful connect and disconnect operations update `settings.connectedCloudProviders` through background settings persistence.

## Test Traceability

- [../quality/references/cloud-sync-traceability-matrix.md](../quality/references/cloud-sync-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If browser support gating, queue scheduling, retry behavior, or provider connect/disconnect semantics change in code, update this contract and its traceability matrix in the same change set.