# Cloud Sync Code-Derived Behavior Contract

## Purpose

This document captures how cloud-sync orchestration, checkpoint baselines, queue processing, retries, provider connect/disconnect flows, and options-surface state feedback behave.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/background/cloud-sync/index.ts](../../entrypoints/background/cloud-sync/index.ts)
- [../../entrypoints/background/cloud-sync/engine.ts](../../entrypoints/background/cloud-sync/engine.ts)
- [../../entrypoints/background/cloud-sync/policy.ts](../../entrypoints/background/cloud-sync/policy.ts)
- [../../entrypoints/background/cloud-sync/providers/index.ts](../../entrypoints/background/cloud-sync/providers/index.ts)
- [../../entrypoints/background/cloud-sync/checkpoints.ts](../../entrypoints/background/cloud-sync/checkpoints.ts)
- [../../entrypoints/background/cloud-sync/types.ts](../../entrypoints/background/cloud-sync/types.ts)
- [../../entrypoints/background/cloud-sync/providers/google-drive.ts](../../entrypoints/background/cloud-sync/providers/google-drive.ts)
- [../../entrypoints/background/cloud-sync/providers/onedrive-auth.ts](../../entrypoints/background/cloud-sync/providers/onedrive-auth.ts)
- [../../entrypoints/background/cloud-sync/providers/identity-api.ts](../../entrypoints/background/cloud-sync/providers/identity-api.ts)
- [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)
- [../../entrypoints/options/use-cloud-sync.ts](../../entrypoints/options/use-cloud-sync.ts)
- [../../entrypoints/options/cloud-sync-view-model.ts](../../entrypoints/options/cloud-sync-view-model.ts)

## Rule ID Convention

- Contract rule IDs: `C-CSYNC-<NNN>`
- Traceability case IDs: `CSYNC-<NNN>`

## Contract Rules

## C-CSYNC-001: Browser-governed cloud providers always start from baseline checkpoints that encode support and disconnect state

Source: `getCloudSyncProviderBaselineCheckpoints`, `normalizeCloudSyncProviderCheckpoint`, `mergeCloudSyncProviderCheckpoints`, `createUnsupportedCheckpoint`, `createSupportedDisconnectedCheckpoint` in [../../entrypoints/background/cloud-sync/providers/index.ts](../../entrypoints/background/cloud-sync/providers/index.ts)

Rules:

1. Baseline checkpoints are created for every browser-governed provider.
2. Supported providers start as disconnected with `healthState: "disconnected"`.
3. Unsupported providers start disconnected with `supported: false`, `healthState: "action-required"`, and an explicit unsupported reason for the current browser/configuration state.
4. Normalization always rewrites unsupported checkpoints back to the canonical unsupported shape for the current browser/configuration state.
5. Merged checkpoint lists preserve one checkpoint per provider over the baseline set.

## C-CSYNC-002: Initialization and local-change hooks enqueue reconciliation and follow-up runs instead of syncing inline

Source: `initializeCloudSyncEngine`, `noteCloudSyncSettingsSaved`, `noteMeetingSessionSaved`, `noteMeetingSessionDeleted`, `noteMeetingArchiveCleared` in [../../entrypoints/background/cloud-sync/index.ts](../../entrypoints/background/cloud-sync/index.ts)

Rules:

1. Cloud-sync initialization synchronizes checkpoint connections, queues reconciliation, and schedules a delayed background-start run.
2. Settings saves enqueue both shared-settings and device-profile sync tasks before scheduling a follow-up run, and shared-settings sync includes the meeting archive retention preference.
3. Session saves enqueue session-metadata, session-events, and session-artifacts sync tasks keyed by session sync ID.
4. Session-event sync now writes an event-manifest plus chunk files, updating only the chunks whose content hash changed.
5. Live sessions use an adaptive delayed sync window so repeated saves coalesce before provider writes, and large event streams widen that delay further to reduce full event-stream rewrites while ended sessions keep the shorter follow-up delay.
6. Session deletion, retention-driven auto-prune deletion, and archive-clear flows enqueue tombstone tasks and schedule a follow-up run instead of applying remote deletion inline.
7. When the archive-retention setting is `Off`, retention-driven auto-prune deletion does not enqueue any deletion work because all automatic archive deletion is disabled.
8. Provider targets are filtered through browser support before tasks are enqueued.

## C-CSYNC-003: Queue processing retries transient provider failures with capped exponential delay and manual-retry promotion

Source: `createRetryDelayMs`, `processTaskAcrossProviders`, `processCloudSyncCycle`, `scheduleCloudSyncRun`, `runCloudSyncNow` in [../../entrypoints/background/cloud-sync/engine.ts](../../entrypoints/background/cloud-sync/engine.ts)

Rules:

1. Tasks targeting no connected providers are removed without further processing.
2. Successful task processing updates the successful provider checkpoint to `up-to-date` and clears retry-related error fields for that provider.
3. Successful session-task processing stores the last uploaded content hash per provider/task dedupe key so unchanged payloads can be skipped in later cycles.
4. Multi-provider task fan-out continues across the remaining target providers even after one provider fails.
5. Retryable failures increment transient retry count and schedule the next attempt using capped exponential backoff with jitter.
6. After the maximum transient retry count is reached, retryable failures promote the checkpoint into a manual-retry state instead of continuing automatic retries.
7. Non-retryable failures move checkpoints to `action-required` or `needs-attention` based on the classified error kind.
8. When only a subset of providers fail, the queued task is rewritten to keep only the failed provider targets for the retry path.
9. Each processing cycle re-queues reconciliation for connected providers and schedules a paced follow-up cycle when due work remains instead of immediately draining backlog at zero delay.
10. Processing cycles cap the number of due tasks handled in one burst based on the number of connected providers.
11. When meaningful local upload backlog is already due, reconcile tasks can be deferred to a later cycle so expensive remote scans do not compete with the active upload wave.
12. Successful reconcile tasks persist provider-specific reconciliation cursors so later scans can use provider delta/change feeds instead of repeating a full namespace walk.
13. When a connected provider checkpoint is still marked `syncing` but the engine is idle and no due task targets that provider, state snapshots normalize that provider back to `up-to-date` instead of leaving the UI stuck on a stale syncing badge.

## C-CSYNC-004: Connect, disconnect, retry, and settings-choice flows reconcile state through checkpoints plus persisted settings

Source: `resolveCloudSyncSettingsChoice`, `retryCloudSync`, `connectCloudSyncProvider`, `disconnectCloudSyncProvider` in [../../entrypoints/background/cloud-sync/index.ts](../../entrypoints/background/cloud-sync/index.ts); `getCloudSyncPendingSettingsDecision`, `saveCloudSyncPendingSettingsDecision`, `clearCloudSyncPendingSettingsDecision` in [../../entrypoints/background/cloud-sync/checkpoints.ts](../../entrypoints/background/cloud-sync/checkpoints.ts)

Rules:

1. Resolving a pending settings choice writes either local or remote shared settings, clears the pending decision, then queues reconciliation and an immediate run.
2. Retrying cloud sync resets queued task retry metadata before reconciliation and an immediate run.
3. Provider connect attempts persist the returned checkpoint even when the browser marks the provider unsupported.
4. Unsupported connect attempts fail with `success: false` and surface the browser-support reason without adding the provider to connected settings.
5. Successful connect and disconnect operations update `settings.connectedCloudProviders` through background settings persistence.
6. Interactive browser-auth windows are launched only from explicit provider connect flows; background access-token retrieval now throws reconnect-required errors when stored tokens are missing or refresh fails instead of opening interactive auth during sync work.
7. Stored Google Drive and OneDrive tokens are wrapped with the cloud-sync local vault encryption before persisting in local extension storage, and non-encrypted token entries are treated as invalid instead of being upgraded implicitly.

## C-CSYNC-005: The options Cloud Sync surface keeps overview copy stable while mutations expose explicit provider-scoped feedback

Source: `useCloudSync` in [../../entrypoints/options/use-cloud-sync.ts](../../entrypoints/options/use-cloud-sync.ts); `buildCloudSyncProviderCardModels`, `getCloudSyncOverviewMeta` in [../../entrypoints/options/cloud-sync-view-model.ts](../../entrypoints/options/cloud-sync-view-model.ts)

Rules:

1. Cloud Sync load responses that arrive late do not overwrite newer state that was already fetched from a later request.
2. Connect, disconnect, retry, reconnect, shared-settings choice, and refresh actions expose explicit loading and success copy scoped to the active intent and provider.
3. Success feedback remains visible briefly, then returns to the derived idle summary for the latest loaded state instead of sticking indefinitely.
4. Provider rows derive busy labels and status detail only for the provider currently being acted on, while the top-level overview copy stays anchored to overall vault health instead of mutation text.
5. First-connect overview and disconnected idle copy stay simple even when the local queue already contains pending sync work.
6. Cloud Sync status pills visually separate active processing from steady healthy state: `syncing` uses an active accent treatment, `retrying-automatically` uses warning pulse feedback, and `up-to-date` uses a calm success treatment instead of sharing the same badge color as in-flight work.

## Test Traceability

- [../quality/references/cloud-sync-traceability-matrix.md](../quality/references/cloud-sync-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If browser support gating, queue scheduling, retry behavior, provider connect/disconnect semantics, or options-surface state feedback change in code, update this contract and its traceability matrix in the same change set.
