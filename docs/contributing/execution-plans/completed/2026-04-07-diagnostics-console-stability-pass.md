# Diagnostics Console Stability Pass

This Execution Plan is a completed record.
It captures the corrective diagnostics console stability work that shipped on 2026-04-07.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Deliver a narrow corrective pass for the options diagnostics console that removes refresh churn, keeps manual and background refresh behavior distinct, restores sane environment defaults, and preserves the existing UI structure.

## Problem Statement

The diagnostics console was polling every second and mutating UI state on every heartbeat, even when the payload was effectively unchanged. That caused avoidable rerenders and reused the same loading state for both auto-poll and explicit refresh. The pass stabilizes polling and config behavior without redesigning the drawer or changing the canonical diagnostics pipeline.

## Scope

- make diagnostics polling state updates data-driven instead of timer-driven
- add payload fingerprint comparison to skip no-op payload state writes
- separate silent background polling from manual refresh loading UI
- prevent overlapping polls
- reduce polling cadence while preserving open-only and visible-only behavior
- restore development diagnostics baseline to `debug`
- ensure production keeps `viewerEnabled: true` with capture baseline `off`
- update docs where polling behavior wording was misleading
- add tests for polling stability, overlap guards, visibility pause, and environment consistency

## Non-Goals

- redesigning the diagnostics drawer or floating launcher
- changing canonical diagnostics message contracts or collector behavior
- changing sanitization or redaction logic
- adding a new diagnostics pipeline or extra storage layer

## Constraints

- keep change set focused on stability, UX correctness, and config/doc consistency
- do not redesign the current drawer or FAB structure
- do not introduce new logging systems
- preserve pause-on-hidden behavior
- run and pass the required focused validation commands

## Milestones

### Milestone 1 - Stabilize Polling Logic

Completed. Added payload and config fingerprint helpers, silent background polling, manual-refresh-only spinner state, and an in-flight guard that reuses the current request instead of starting overlapping polls.

### Milestone 2 - Sync Configs, Docs, And Tests

Completed. Restored development to `debug`, restored production viewer visibility with baseline capture still `off`, clarified docs wording around silent polling, and added both helper and hook-level regression tests.

### Milestone 3 - Validate And Archive

Completed. Focused tests, production build, and docs validation all passed. This plan is now archived.

## Verification

- `pnpm vitest run tests/google-meet/diagnostics-viewer.contract.test.ts`
- `pnpm vitest run tests/google-meet/use-diagnostics-console.contract.test.ts`
- `pnpm build:production`
- `pnpm docs:check`

Observed outcomes:

- no-op auto-polls no longer rewrite diagnostics console state
- manual refresh remains the only source of refresh-button spinner activity
- hidden tabs pause polling and overlapping polls are skipped
- development diagnostics baseline is `debug`
- production viewer is visible while production baseline capture remains `off`

## Progress

- [x] Create active execution plan for this corrective pass
- [x] Extract and implement polling stability guards
- [x] Separate manual refresh loading from silent auto-polling
- [x] Sync development and production diagnostics environment defaults
- [x] Add and pass targeted stability tests
- [x] Run build and docs validation

## Surprises and Discoveries

- Observation: Current repo state had drifted from the previously documented diagnostics defaults.
  Evidence: `entrypoints/shared/environment/development.ts` had returned to `trace`, and `entrypoints/shared/environment/production.ts` had `viewerEnabled: false` before this pass.

- Observation: Hook-level tests were necessary to prove that no-op polls preserved state references and did not re-trigger refresh UI behavior.
  Evidence: helper-only assertions were not enough to cover polling cadence, hidden-tab pause, or overlap suppression.

## Decision Log

- Decision: Use payload fingerprints based on relevant config fields, ordered event ids and timestamps, counts, resolved snapshot identity, and snapshot count.
  Rationale: That is stable enough to detect meaningful collector changes without diffing large sanitized payload objects on every poll.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Keep auto-poll fully silent and reserve spinner activity for manual refresh only.
  Rationale: Background polling should not make the drawer feel busy when the user is simply reading logs.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Reduce diagnostics drawer polling cadence to `1500ms`.
  Rationale: It lowers UI pressure while still feeling live enough for diagnostics use.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

The stability pass corrected the biggest UX problem in the drawer: repeated auto-poll heartbeats no longer rewrite state when the underlying payload is unchanged. The hook now keeps state updates data-driven, and `lastUpdatedAt` changes only on meaningful payload changes or explicit manual refresh success.

Manual refresh and background polling are now clearly separated. Silent auto-polls do not trigger the refresh-button spinner, and overlapping polls are avoided through a single in-flight request guard. That removed the header churn without changing the surface layout.

Environment and docs consistency were restored as part of the same pass: development defaults back to `debug`, production viewer visibility is on again, and production capture baseline remains `off` until a session override enables it.