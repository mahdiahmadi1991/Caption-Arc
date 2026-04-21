# Cloud Sync Redesign And Hardening

This Execution Plan is a living document.
Keep `Progress`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Stabilize and simplify the cloud-sync module so provider failures do not block each other, the options surface communicates the real sync state clearly, and the module has focused automated coverage for its critical orchestration and UI/view-model behavior.

## Problem Statement

The current cloud-sync module mixes orchestration, provider fan-out, and options-page presentation logic across large files. Two concrete issues already stand out from repository evidence:

- `entrypoints/background/cloud-sync/engine.ts` processes multi-provider tasks in a way that can stop after the first failing provider, which blocks healthy providers behind the failing one.
- `entrypoints/options/App.tsx` and `entrypoints/options/use-cloud-sync.ts` keep cloud-sync state messaging spread across inline helpers and mutation state, which makes the section harder to maintain and can surface vague or stale status copy.

The user also asked for redesign/refactor work plus bug and gap fixing, so the work must improve maintainability and the UX shape of the Cloud Sync section while preserving current storage and provider contracts.

## Scope

- refactor cloud-sync task processing to isolate provider-specific failure handling
- tighten provider-target normalization used by cloud-sync fan-out helpers
- redesign the options-page cloud-sync section around clearer overview, provider state, and action surfaces
- extract or centralize cloud-sync UI/view-model logic so it is testable outside the main `App.tsx`
- add or update contract/unit coverage for the fixed orchestration behavior and the refactored UI/view-model logic

## Non-Goals

- adding new cloud providers
- changing archive encryption format or stored payload schemas
- shipping the larger Firefox provider-parity project described by the separate cross-browser cloud-sync plan
- changing unrelated options-page sections or unrelated assistant/runtime work already present in the dirty worktree

## Repository Context

Primary implementation surfaces:

- `entrypoints/background/cloud-sync/engine.ts`
- `entrypoints/background/cloud-sync/index.ts`
- `entrypoints/background/cloud-sync/providers/index.ts`
- `entrypoints/background/cloud-sync/outbox.ts`
- `entrypoints/options/use-cloud-sync.ts`
- `entrypoints/options/App.tsx`

Expected test surfaces:

- `tests/google-meet/cloud-sync-engine-retries.contract.test.ts`
- `tests/google-meet/cloud-sync-orchestration.contract.test.ts`
- new focused cloud-sync UI/view-model tests if extraction happens

## Constraints

- preserve current cloud-sync storage keys and payload compatibility
- do not revert or disturb unrelated user changes already present in the repository
- keep options-page visuals aligned with the existing design language instead of introducing a new standalone design system
- finish with targeted tests and extension builds as required by `AGENTS.md`

## Risks and Unknowns

- provider-aware retry handling changes task semantics; mistakes could strand tasks or over-retry them
- extracting cloud-sync UI logic from `App.tsx` can accidentally change copy or status precedence if not covered by tests
- remote fan-out behavior already couples settings/history persistence with sync scheduling, so small orchestration changes can have broad effects

## Documentation Impact

If behavior or support semantics change materially, update:

- `docs/api/cloud-sync-behavior-contract.md`
- `docs/quality/references/cloud-sync-traceability-matrix.md`

Record validation and outcomes in this plan before completion.

## Verification

- `pnpm test:targeted:plan`
- targeted `vitest` runs for touched cloud-sync tests
- `pnpm build:all:development`
- additional doc validation only if behavior docs are changed

## Progress

- [x] Capture the redesign/hardening scope and implementation approach
- [x] Fix provider-blocking orchestration gaps in the engine
- [x] Refactor cloud-sync options state/view-model and redesign the section UI
- [x] Add or update focused automated coverage
- [x] Run validation and record outcomes

## Decision Log

- Decision: Keep the redesign within the existing options-page visual language rather than introducing a new page-level aesthetic.
  Rationale: This is a governed existing product surface, so consistency matters more than novelty.
- Decision: Fix the highest-confidence orchestration bug by isolating retry state to failed providers within a fan-out task, instead of trying to redesign the whole queue schema in one pass.
  Rationale: This removes real cross-provider blocking while staying compatible with current storage and provider contracts.

## Outcomes and Retrospective

- Implemented provider-isolated fan-out retries in `entrypoints/background/cloud-sync/engine.ts`, so a failure in one provider no longer blocks successful processing for another provider in the same queued task.
- Added provider-target normalization in provider-side fan-out helpers and extracted cloud-sync options view-model logic into `entrypoints/options/cloud-sync-view-model.ts`.
- Hardened `entrypoints/options/use-cloud-sync.ts` against stale async responses and changed idle messaging to reflect real sync health instead of only connected/disconnected state.
- Redesigned the cloud-sync provider cards in `entrypoints/options/App.tsx` around a clearer status narrative plus account/sync facts, while keeping the existing options-page design system.
- Performed a second-pass UI refinement after live Chrome review to reduce repeated backlog messaging, remove redundant provider status pills, and compress the noisy device identity into a shorter scan-friendly label.
- Performed a third-pass UI simplification for non-technical users by collapsing technical metadata behind a single disclosure, converting the tall provider cards into compact provider rows, and tightening refresh/loading feedback so the section uses materially less vertical space without hiding the primary actions.
- Refined the first-connect UX again so queued task counts no longer dominate the top-level narrative, and moved queue telemetry into the collapsed technical details instead of treating it as the primary user-facing headline.
- Added a fourth-pass Cloud Sync interaction polish: mutation feedback is now intent-scoped, provider rows expose provider-specific busy labels or hints, the overview narrative stays stable while actions run, and success feedback briefly acknowledges completion before returning to the derived idle summary.
- Hardened provider checkpoint normalization against stale browser-config errors, so a newly configured provider does not keep surfacing a previous `missing OAuth client` action-required message after rebuild/reload.
- Fixed a live Google Drive connect regression where the new redirect-based OAuth flow reached token exchange but failed in background diagnostics with `client_secret is missing.` because browser-targeted Google client secrets were not yet wired into runtime config or token exchange calls.
- Strengthened provider-auth diagnostics in `identity-api.ts`, `google-drive.ts`, and `onedrive-auth.ts` so live debugging now includes auth-flow start/completion/failure, token reuse, token exchange, and refresh-failure evidence without logging secrets.
- Fixed a remaining OneDrive behavior gap where background sync could fall back to interactive auth if stored tokens disappeared; background token lookup now throws a reconnect-required error instead of opening an auth window unexpectedly.
- Updated cloud-sync behavior/setup docs plus the shared localization governance guardrails so user-facing localization work now explicitly requires the full shipped locale set instead of only `en` and `fa`.
- Authored the latest Cloud Sync runtime-feedback copy across all shipped locale catalogs (`en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, `ko`) and strengthened the UI i18n contract to keep those keys from drifting back to English fallback.
- Added focused coverage in:
  - `tests/google-meet/cloud-sync-engine-retries.contract.test.ts`
  - `tests/google-meet/use-cloud-sync.contract.test.ts`
  - `tests/google-meet/cloud-sync-view-model.contract.test.ts`
- Verification results:
  - `pnpm vitest run tests/google-meet/cloud-sync-engine-retries.contract.test.ts tests/google-meet/cloud-sync-orchestration.contract.test.ts tests/google-meet/use-cloud-sync.contract.test.ts tests/google-meet/cloud-sync-view-model.contract.test.ts` -> passed
  - `pnpm vitest run tests/google-meet/use-cloud-sync.contract.test.ts tests/google-meet/cloud-sync-view-model.contract.test.ts` -> passed after the second-pass UI cleanup
  - `pnpm vitest run tests/google-meet/use-cloud-sync.contract.test.ts tests/google-meet/cloud-sync-view-model.contract.test.ts tests/google-meet/cloud-sync-engine-retries.contract.test.ts tests/google-meet/cloud-sync-orchestration.contract.test.ts` -> passed after the compact/non-technical UI pass
  - `pnpm test:module:plan entrypoints/background/cloud-sync` -> completed; suggested only generic smoke coverage because the recommender has no direct module mapping for this surface yet
  - `pnpm test:targeted:plan` -> completed; output was noisy because of unrelated dirty-worktree changes outside cloud sync
  - `pnpm vitest run tests/google-meet/cloud-sync-browser-support.contract.test.ts tests/google-meet/meeting-history-retention.contract.test.ts` -> partially failed due an unrelated pre-existing expectation mismatch in `tests/google-meet/meeting-history-retention.contract.test.ts` against `clearMeetingAssistantRuntimeState` arguments from `entrypoints/background/history.ts`
  - `pnpm build:all:development` -> passed
  - `pnpm build:all:development` -> passed again after the second-pass UI refinement
  - `pnpm build:all:development` -> passed again after the compact/non-technical UI pass and disclosure-label fix
  - Remote Chrome CDP verification -> passed after reloading the extension runtime; captured the Cloud Sync section from `options.html`, confirmed the compact layout on the live extension page, verified the technical disclosure label rendered correctly as `Expand`, and measured the Cloud Sync section at about `767.56px` tall in the captured state
  - `pnpm vitest run tests/google-meet/browser-capabilities.contract.test.ts tests/google-meet/cloud-sync-browser-support.contract.test.ts tests/google-meet/cloud-sync-view-model.contract.test.ts tests/google-meet/use-cloud-sync.contract.test.ts` -> passed after adding the stale-OneDrive-checkpoint regression
  - `pnpm vitest run tests/google-meet/browser-capabilities.contract.test.ts tests/google-meet/cloud-sync-browser-support.contract.test.ts tests/google-meet/cloud-sync-view-model.contract.test.ts tests/google-meet/use-cloud-sync.contract.test.ts` -> passed again after wiring browser-targeted Google OAuth client secrets into capability resolution and token exchange
  - `pnpm build:all:development` -> passed again after the stale-OneDrive-checkpoint fix
  - `pnpm build:all:development` -> passed again after the Google OAuth client-secret runtime fix
  - `pnpm vitest run tests/google-meet/use-cloud-sync.contract.test.ts tests/google-meet/cloud-sync-view-model.contract.test.ts tests/google-meet/ui-i18n.contract.test.ts tests/google-meet/onedrive-auth.contract.test.ts` -> passed after the interaction-polish, full-locale, and background-auth fixes
  - `pnpm docs:check` -> passed again after the Cloud Sync docs, troubleshooting, setup, and localization-governance updates
  - `pnpm docs:check:behavior` -> passed again after the Cloud Sync behavior-contract update
  - `pnpm build:all:development` -> passed again after the interaction-polish, diagnostics, and localization pass
  - Remote Chrome CDP verification -> passed again after runtime reload; `getCloudSyncState` showed both providers as supported/disconnected with no lingering OneDrive error, and the live options page showed the simplified `Not connected` summary while leaving queue count only inside the expanded technical details
  - Remote Chrome CDP diagnostics verification -> confirmed the previous live Google Drive connect failure came from background diagnostics event `cloud_sync_connect_failed` with message `client_secret is missing.`, and the rebuilt background bundle now contains the browser-targeted Google client secret plus token-exchange calls that include `client_secret`
  - Remote Chrome CDP verification -> passed after the latest interaction pass; the live `options.html` page showed the Cloud Sync success banner after `Refresh status`, and the polished provider rows remained stable while mutation feedback appeared separately from the overview summary
  - `pnpm docs:check && pnpm docs:check:behavior` -> passed
