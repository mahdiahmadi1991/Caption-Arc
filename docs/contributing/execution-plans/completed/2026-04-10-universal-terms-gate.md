# Universal Terms Gate

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Turn Terms acceptance into a real release-surface gate so CaptionArc stays inactive until the current Terms version is accepted on the local device.

Done for this wave means:

- protected background actions reject when the current Terms version is not accepted
- popup, options, and meeting-history render a blocked state instead of the normal product UI
- content runtime does not initialize the in-meeting experience while Terms are unaccepted
- direct "open settings" flows redirect to Terms acceptance when blocked

## Scope

- add a central Terms gate in `background`
- allow only safe settings writes needed for legal pages while blocked
- add a shared blocked-state wrapper for governed extension pages
- prevent content runtime initialization until Terms are accepted
- update behavior docs for the new gating posture

## Non-Goals

- introducing account-level or server-side acceptance tracking
- adding a separate declined-state storage model in this wave
- running the validation suite in this step

## Constraints

- keep the gate local-only and versioned
- avoid breaking the dedicated Terms and Privacy pages
- keep the implementation pragmatic and small enough to land quickly
- validation is intentionally deferred in this wave because the repository owner requested no tests in this step

## Repository Context

- `entrypoints/background/index.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/options/main.tsx`
- `entrypoints/popup/main.tsx`
- `entrypoints/meeting-history/main.tsx`
- `entrypoints/shared/legal.ts`
- `entrypoints/shared/use-extension-page-settings.ts`

## Documentation Impact

- update `docs/api/settings-and-readiness-behavior-contract.md`
- update `docs/quality/references/settings-and-readiness-traceability-matrix.md`
- record implementation and deferred validation in this plan

## Testing and Coverage Impact

Validation is intentionally deferred for this step at the repository owner's request.

## Progress

- [x] Inspect runtime/UI insertion points
- [x] Create this execution plan before implementation
- [x] Implement background and content Terms guards
- [x] Gate governed extension pages
- [x] Update docs and record deferred validation

## Surprises and Discoveries

- Observation: gating in `main.tsx` is the lowest-risk way to block popup, options, and meeting-history without refactoring each large UI surface individually.
  Evidence: `entrypoints/options/main.tsx`, `entrypoints/popup/main.tsx`, `entrypoints/meeting-history/main.tsx`
- Observation: background startup also needed a protected-services gate, otherwise persisted summary or sync work could continue even while user-facing surfaces were blocked.
  Evidence: `entrypoints/background/index.ts`, `entrypoints/background/history.ts`, `entrypoints/background/cloud-sync/index.ts`

## Decision Log

- Decision: keep the blocked-state implementation local-first and driven entirely by the existing `termsAcceptance` record.
  Rationale: this gives a strict gate without adding new storage schema or account concepts in the same wave.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

Completed with repository-owner-approved validation deferral.

Implemented outcomes:

- protected background actions now return a `terms_not_accepted` failure until the current Terms version is accepted
- `openOptions` now routes to Terms acceptance when blocked
- popup, options, and meeting-history now render a shared blocked state instead of mounting the normal app UI
- content runtime no longer initializes the provider/overlay flow when Terms are unaccepted
- protected background startup services now stay dormant until Terms are accepted
- behavior docs now describe the gate and explicitly mark validation for this wave as deferred

Validation status:

- no tests or build validation were run in this wave because the repository owner explicitly requested implementation without tests in this step
