# Cloud Sync Queue Quota Hardening

This Execution Plan is a living document.
Keep `Progress`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Reduce cloud-sync quota pressure and backlog churn so the module remains reliable as archives grow, providers accumulate more files, and active meetings generate frequent local updates.

## Problem Statement

Repository review plus live runtime inspection show the current cloud-sync design is functionally correct in simple cases but unnecessarily chatty:

- each meeting-session save enqueues both `sync-session-meta` and `sync-session-events`, then schedules another near-immediate cycle
- `sync-session-events` rewrites the full session event payload instead of writing deltas or segments
- provider reconciliation scans the entire provider namespace with `listFiles("")` instead of using scoped or incremental change detection
- remote-applied session changes are immediately fanned back into the outbox without origin-aware suppression
- engine follow-up runs drain backlog aggressively without provider-specific pacing

The result is avoidable provider traffic, noisy backlog growth, and a real risk of hitting provider rate limits or burning time on redundant work as the archive grows.

## Scope

- redesign session-event sync to reduce repeated full-payload writes
- add queue coalescing or debounce behavior for hot sessions
- reduce or restructure provider reconciliation so it no longer depends on full namespace scans for routine sync
- add origin-aware suppression for remote-applied fan-out where it is safe
- introduce provider-aware pacing/backpressure in the engine
- add focused regression coverage for the changed queue/orchestration semantics

## Non-Goals

- changing encryption primitives or storage keys without necessity
- introducing new cloud providers
- redesigning the options UI again unless queue-state messaging must change to match new semantics
- solving every possible cross-device merge policy problem in the same pass

## Repository Context

Primary implementation surfaces:

- `entrypoints/background/cloud-sync/index.ts`
- `entrypoints/background/cloud-sync/outbox.ts`
- `entrypoints/background/cloud-sync/engine.ts`
- `entrypoints/background/cloud-sync/providers/index.ts`
- `entrypoints/background/cloud-sync/serialization.ts`

Expected test surfaces:

- `tests/google-meet/cloud-sync-engine-retries.contract.test.ts`
- `tests/google-meet/cloud-sync-orchestration.contract.test.ts`
- new focused queue/provider regression coverage where needed

## Constraints

- keep the touched cloud-sync data model canonical unless the repository owner explicitly requests a compatibility mechanism
- do not disturb unrelated dirty-worktree changes
- keep provider behavior understandable and diagnosable from runtime checkpoints/diagnostics
- validation must include targeted tests plus a development build

## Risks and Unknowns

- changing session sync granularity could break remote merge assumptions if payload readers still expect full snapshots
- provider APIs may not expose equally capable delta/change-feed semantics
- origin-aware suppression must not block legitimate cross-provider fan-out
- stronger pacing reduces quota pressure but may make first-sync feel slower if not reflected well in status messaging

## Documentation Impact

If queue semantics or reconciliation behavior change materially, update:

- `docs/api/cloud-sync-behavior-contract.md`
- `docs/quality/references/cloud-sync-traceability-matrix.md`

## Verification

- targeted `vitest` runs for touched cloud-sync tests
- `pnpm build:all:development`
- runtime diagnostics verification if orchestration semantics materially change
- doc validation if behavior-contract docs are updated

## Milestones

### Milestone 1 - Instrument And Bound Hot Session Churn

- measure and cap repeated `sync-session-events` writes for active sessions
- use existing `contentHash`/session identity data or a new stronger hash to skip no-op writes
- add debounce/coalescing so fast local saves collapse into fewer provider writes

Exit criteria:

- repeated active-session saves no longer produce one full remote write per local save
- tests cover the coalescing/no-op behavior

### Milestone 2 - Reconcile More Selectively

- replace or narrow full-namespace reconciliation where feasible
- prefer provider-native delta/cursor mechanics when available; otherwise partition scans by known prefixes/checkpoints
- keep first-connect and recovery behavior explicit

Exit criteria:

- routine reconcile no longer depends on scanning the full app-data tree every cycle
- diagnostics still explain what the engine is doing

### Milestone 3 - Prevent Echo Churn Across Providers

- track remote-origin application sufficiently to suppress unnecessary fan-out back to the same provider
- preserve legitimate cross-provider propagation

Exit criteria:

- remote changes do not get re-uploaded to their source provider unless local state diverges afterward

### Milestone 4 - Add Provider-Aware Backpressure

- replace immediate follow-up draining with bounded pacing per provider
- preserve retry semantics for transient failures

Exit criteria:

- backlog draining respects provider budgets instead of issuing zero-delay bursts
- retry state remains visible and testable

## Progress

- [x] Capture the quota/rate-limit hardening problem and implementation milestones
- [x] Design the first concrete session-write reduction change
- [x] Implement and validate hot-session coalescing/no-op suppression
- [x] Implement and validate reconcile/backpressure changes
- [x] Implement and validate chunked event-stream persistence, provider delta cursors, and encrypted local token storage
- [x] Update contracts/docs if behavior changes materially

## Decision Log

- Decision: Prioritize write-amplification reduction before deeper queue-schema redesign.
  Rationale: Full event-payload rewrites are the clearest current quota risk and can likely be reduced without immediate storage redesign.
- Decision: Treat provider-aware pacing as part of correctness, not merely performance.
  Rationale: The current zero-delay backlog draining can turn benign backlog into burst traffic that is observable as provider instability.

## Outcomes and Retrospective

- Added explicit queue scheduling policy in `entrypoints/background/cloud-sync/policy.ts` so active meeting sessions are debounced before provider sync instead of triggering near-immediate uploads on every save.
- Extended outbox task semantics with `schedulingStrategy`, allowing hot-session tasks to keep moving outward while users are still actively speaking and changing the same meeting session.
- Added content-hash checkpoint tracking in `entrypoints/background/cloud-sync/engine.ts`, so providers now skip redundant uploads when the latest queued payload hash already matches the last successful upload for that provider/task pair.
- Split cloud session payload writes so `events.json.enc` carries only the event stream while `artifacts.json.enc` carries summaries, assistant outputs, assistant memory, and assistant state.
- Replaced zero-delay backlog draining with paced follow-up scheduling in `entrypoints/background/cloud-sync/engine.ts`, which now derives a bounded follow-up delay from remaining due work and connected-provider count.
- Added adaptive live-session sync delays in `entrypoints/background/cloud-sync/policy.ts`, so larger active meeting transcripts wait longer before rewriting the full remote event-stream payload.
- Added cycle task caps plus backlog-aware reconcile deferral in `entrypoints/background/cloud-sync/engine.ts`, so remote listing work is postponed when enough local upload work is already queued.
- Narrowed reconcile scanning in `entrypoints/background/cloud-sync/providers/index.ts` to targeted prefixes (`settings/`, `tombstones/`, `sessions/`) instead of unconditional whole-namespace scans, and tightened provider list implementations to honor prefixes more selectively where possible.
- Corrected checkpoint scan semantics so `lastScanAt` now reflects a completed reconcile task rather than any generic engine cycle heartbeat.
- Replaced single-file `events.json.enc` writes with a manifest-plus-chunks event stream in `entrypoints/background/cloud-sync/serialization.ts` and `entrypoints/background/cloud-sync/providers/index.ts`, allowing unchanged event chunks to be skipped.
- Added provider-native incremental reconcile cursors in `entrypoints/background/cloud-sync/providers/google-drive.ts` and `entrypoints/background/cloud-sync/providers/onedrive.ts`, and persisted those cursors in checkpoints so routine scans can reuse Google Drive changes tokens and OneDrive delta links.
- Wrapped locally persisted Google Drive and OneDrive OAuth token records with the cloud-sync vault encryption in `entrypoints/background/cloud-sync/providers/google-drive.ts`, `entrypoints/background/cloud-sync/providers/onedrive-auth.ts`, and `entrypoints/background/cloud-sync/crypto.ts`.
- Added origin-aware suppression for remote-applied session, delete, clear-archive, and shared-settings fan-out so a provider does not immediately receive its own remote change back as a redundant local upload.
- Expanded runtime diagnostics coverage across orchestration, engine, outbox, and provider sync paths so future live debugging has trace/debug/info/warn/error evidence for queue updates, skip decisions, pacing, reconcile scans, and provider-target filtering.
- Extended auth-path diagnostics too, so Google Drive, OneDrive, and the shared identity bridge now emit structured auth-flow and token-lifecycle events that make background-sync failures diagnosable without exposing secrets.
- Closed a background-auth gap for OneDrive: missing or expired stored tokens now surface reconnect-required errors instead of falling back to an interactive auth popup during background sync work.
- Added focused regression coverage in:
  - `tests/google-meet/cloud-sync-engine-retries.contract.test.ts`
  - `tests/google-meet/cloud-sync-orchestration.contract.test.ts`
  - `tests/google-meet/cloud-sync-serialization.contract.test.ts`
  - `tests/google-meet/cloud-sync-outbox.contract.test.ts`
  - `tests/google-meet/google-drive-auth.contract.test.ts`
  - `tests/google-meet/onedrive-auth.contract.test.ts`
  - `tests/google-meet/onedrive-provider.contract.test.ts`
  - `tests/google-meet/cloud-sync-browser-support.contract.test.ts`
- Verification results:
  - `pnpm vitest run tests/google-meet/google-drive-auth.contract.test.ts tests/google-meet/onedrive-auth.contract.test.ts tests/google-meet/onedrive-provider.contract.test.ts tests/google-meet/cloud-sync-engine-retries.contract.test.ts` -> passed
  - `pnpm vitest run tests/google-meet/cloud-sync-serialization.contract.test.ts tests/google-meet/cloud-sync-engine-retries.contract.test.ts tests/google-meet/cloud-sync-orchestration.contract.test.ts` -> passed
  - `pnpm vitest run tests/google-meet/cloud-sync-engine-retries.contract.test.ts tests/google-meet/cloud-sync-orchestration.contract.test.ts tests/google-meet/cloud-sync-outbox.contract.test.ts tests/google-meet/onedrive-provider.contract.test.ts tests/google-meet/cloud-sync-browser-support.contract.test.ts` -> passed
  - `pnpm test:targeted:plan` -> completed; recommender output remained noisy because of the broader dirty worktree, but it still surfaced the directly changed cloud-sync contracts
  - `pnpm docs:check` -> passed
  - `pnpm build:all:development` -> passed
  - Remote Chrome CDP runtime verification -> passed after reload; live `getCloudSyncState` showed the normalized connected OneDrive checkpoint and current queue/checkpoint state after the new hardening changes loaded
