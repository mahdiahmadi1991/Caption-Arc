# Diagnostics Fallback And Unsupported Provider Cleanup

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Close two review gaps without reopening broader browser-governance scope: diagnostics storage selection must use one shared fallback policy, and unsupported cloud-sync providers must remain removable from settings so Firefox users do not get stuck in a dead-end state.

## Problem Statement

The current diagnostics client can still choose a different storage area than the collector when `chrome.storage.session` is only partially available. Separately, unsupported cloud providers are intentionally blocked from connect and retry flows, but the UI hides the cleanup action once the provider is unsupported and disconnected.

## Scope

- unify diagnostics storage selection so collector and client both use the same write-capable selection policy
- expose one explicit diagnostics storage selection API from `entrypoints/shared/browser-capabilities.ts`
- keep unsupported providers removable from `settings.connectedCloudProviders` without re-enabling connect or retry
- add focused contract coverage for both fixes
- update only the minimum docs needed for the behavior change

## Non-Goals

- no new browser support work beyond the existing unsupported-provider cleanup path
- no broader cloud-sync UX redesign
- no unrelated diagnostics refactor outside storage selection policy

## Repository Context

- `entrypoints/shared/browser-capabilities.ts`
- `entrypoints/shared/diagnostics-client.ts`
- `entrypoints/background/diagnostics.ts`
- `entrypoints/background/cloud-sync/index.ts`
- `entrypoints/options/App.tsx`
- `tests/google-meet/diagnostics-client.contract.test.ts`
- `tests/google-meet/diagnostics.collector.contract.test.ts`
- `tests/google-meet/cloud-sync-browser-support.contract.test.ts`

## Constraints

- keep scope limited to the two requested review fixes
- do not re-enable unsupported browser connect or retry flows
- keep docs updates minimal and only where behavior contract changed
- required validation for this thread is limited to:
  - `pnpm test:google`
  - `pnpm build:chrome:production`
  - `pnpm build:firefox:production`
  - `pnpm docs:check`

## Risks and Unknowns

- UI cleanup semantics must stay explicit enough for unsupported providers without introducing a broader localization or layout change
- diagnostics tests need to prove shared policy selection, not just incidental fallback behavior

## Documentation Impact

- update docs only if the unsupported-provider cleanup behavior or diagnostics policy needs a canonical note

## Testing and Coverage Impact

- add a diagnostics contract case for `session.get` present but `session.set` missing
- add a cloud-sync contract case proving unsupported providers remain removable
- run the required validation commands after implementation

## Milestones

### Milestone 1 - Unify Diagnostics Storage Selection

Objective:

- make client and collector use the same diagnostics storage fallback policy

Implementation approach:

- replace the current read-vs-write split helper usage with one explicit diagnostics storage selection API
- update client and collector to use that single API
- add contract coverage for partial session availability

Acceptance signals:

- client and collector both choose local storage when session storage is not write-capable
- the new test proves the `session.get` without `session.set` scenario

### Milestone 2 - Preserve Unsupported Provider Cleanup

Objective:

- ensure unsupported providers never trap settings in a non-removable state

Implementation approach:

- keep connect and retry unavailable for unsupported providers
- expose a remove or disconnect cleanup action that clears `settings.connectedCloudProviders`
- add contract coverage for the cleanup path

Acceptance signals:

- unsupported providers remain non-connectable
- users can still remove unsupported providers from settings state

## Verification

Run and record:

```bash
pnpm test:google
pnpm build:chrome:production
pnpm build:firefox:production
pnpm docs:check
```

Verification results recorded on 2026-04-09:

- `pnpm test:google` -> passed; 23 test files and 134 tests passed after the diagnostics storage harnesses were aligned with the unified storage-selection policy.
- `pnpm build:chrome:production` -> passed; WXT emitted the Chrome MV3 production artifact under `.release/chrome/production`.
- `pnpm build:firefox:production` -> passed; WXT emitted the Firefox MV2 production artifact under `.release/firefox/production`.
- `pnpm docs:check` -> passed after correcting one pre-existing broken relative link in the still-active cross-browser execution plan; the final pass reported `Documentation validation passed (125 markdown files scanned).`
- After the plan was archived to `completed/`, `pnpm docs:check` was re-run and passed again with the same 125-file validation result.

## Progress

- [x] Plan created
- [x] Diagnostics storage policy unified
- [x] Unsupported provider cleanup shipped
- [x] Required validation recorded
- [x] Plan moved to `completed/`

## Surprises and Discoveries

- Observation: The current diagnostics helper still allows client read selection to diverge from collector persistence selection when session storage is read-only.
  Evidence: `entrypoints/shared/diagnostics-client.ts` calls `getPreferredDiagnosticsStorageAreaForAccess()` without the collector's write-capable constraint.
- Observation: existing diagnostics and i18n test harnesses assumed read-only storage mocks were sufficient, so the new unified selection policy surfaced unrelated test failures until those mocks gained write-capable storage areas.
  Evidence: `tests/google-meet/diagnostics-client.contract.test.ts` and `tests/google-meet/i18n-diagnostics.contract.test.ts` initially failed under `pnpm test:google` until their storage mocks added `set` support for the selected area.
- Observation: `pnpm docs:check` was blocked by a broken relative link in the pre-existing active cross-browser plan, not by the behavior changes in this scope.
  Evidence: the failing path was `docs/contributing/execution-plans/active/2026-04-09-cross-browser-release-and-dual-browser-governance.md` and the fix was a relative link correction from `../execution-plans.md` to `../../execution-plans.md`.

## Decision Log

- Decision: Diagnostics storage selection for this repository should be policy-driven from one shared helper, not split separately between client and collector.
  Rationale: The review fix requires collector and client to converge on the same area selection when session storage is not fully usable.
  Date/Author: 2026-04-09 / Codex
- Decision: Unsupported-provider cleanup should reuse the existing disconnect action label and mutation path instead of introducing new locale keys in this scoped fix.
  Rationale: The required behavior change is to restore a cleanup path without reopening localization churn or broader cloud-sync UI semantics.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

- Shipped one explicit diagnostics storage selection API in `entrypoints/shared/browser-capabilities.ts`, and both the diagnostics client and collector now use that same policy so read-only session storage falls back entirely to local storage.
- Unsupported cloud providers now keep a cleanup action in the options UI when they are still configured in `settings.connectedCloudProviders`, while connect, retry, and reconnect remain unavailable.
- Added focused contract coverage in `tests/google-meet/diagnostics-storage-selection.contract.test.ts` and `tests/google-meet/cloud-sync-browser-support.contract.test.ts`, and updated existing diagnostics harnesses so repository-wide diagnostics tests still reflect the new storage policy.
- No behavior docs needed canonical updates beyond execution-plan bookkeeping; the only extra docs change was correcting the unrelated broken link that blocked `pnpm docs:check`.