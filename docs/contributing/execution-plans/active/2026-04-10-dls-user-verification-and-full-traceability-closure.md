# DLS User Verification And Full Traceability Closure

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Close all remaining `planned` behavior-traceability cases and enforce a mandatory human-in-the-loop DLS acceptance step where repository-owner visual approval is required before implementation is considered done.

## Problem Statement

Current repository traceability still includes `planned` rows across multiple behavior areas. The repository also needs explicit governance language that DLS acceptance is not complete until the repository owner reviews the live run and confirms behavior.

## Scope

- add governance language in DLS-related testing docs requiring explicit repository-owner visual confirmation for DLS completion
- implement tests for all currently `planned` rows across behavior traceability matrices
- update all affected traceability matrices from `planned` to `implemented` after real test coverage is added
- run required automation validation and DLS evidence runs for touched runtime-sensitive areas
- produce a canonical end-to-end DLS demo scenario from extension install to meeting exit

## Non-Goals

- changing product behavior unless required to expose deterministic test seams
- introducing non-deterministic or flaky assertions
- adding parallel duplicate contract sources

## Repository Context

- `docs/contributing/behavior-contract-governance.md`
- `docs/quality/testing-quality-gate.md`
- `docs/quality/testing-onboarding.md`
- `docs/quality/testing-strategy.md`
- `docs/quality/references/runtime-testing-readme.md`
- `docs/quality/references/agent-onboarding-cdp-runtime.md`
- `docs/quality/references/*traceability-matrix.md`
- `docs/api/*-behavior-contract.md`
- `entrypoints/background/`
- `entrypoints/content/`
- `tests/google-meet/`

## Constraints

- code-derived behavior only
- deterministic test assertions only
- keep runtime behavior unchanged except minimal test seams where needed
- public-repo safe documentation

## Risks and Unknowns

- some planned rows target private internals and may require careful test seams
- DLS provider scenarios can fail due auth gates and environment prerequisites
- full closure touches many behavior domains and increases integration risk if done without incremental verification

## Documentation Impact

- update DLS governance docs with repository-owner visual verification requirement
- update all touched traceability matrices
- add/update canonical full-flow DLS demo scenario documentation

## Testing and Coverage Impact

- add/extend deterministic contract tests for all current `planned` rows
- run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan` and execute recommended targeted commands
  - `pnpm docs:check`
  - `pnpm docs:check:behavior`
  - `pnpm docs:check:business`
- run DLS scenarios for touched runtime/provider surfaces and capture pass/fail evidence

## Milestones

### Milestone 1 - DLS Governance Sync

Add explicit human approval step to DLS-related docs: DLS execution is not complete until repository owner visually reviews and confirms expected behavior.

### Milestone 2 - Runtime And Provider Remaining Closures

Close remaining planned rows in runtime/provider-adjacent matrices with deterministic tests and matrix updates.

### Milestone 3 - Background/Domain Remaining Closures

Close remaining planned rows in assistant, cloud-sync, settings-readiness, data-transfer, translation, diagnostics, event-ingestion, meeting-session-model, meeting-summary matrices.

### Milestone 4 - Full DLS Demo Scenario

Add a canonical DLS scenario that covers install/bootstrap through meeting completion and exit, with explicit owner confirmation step.

### Milestone 5 - Verification And Completion

Run full validation suite, record evidence, and move plan to completed.

## Verification

- `pnpm vitest run tests/google-meet`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm docs:check:business`
- DLS runs per touched provider/scenario set, with explicit owner confirmation checkpoint

## Progress

- [x] Plan created before implementation
- [x] Add DLS owner-approval governance step in all DLS-related docs
- [x] Close all currently planned traceability rows with tests
- [x] Update all affected traceability matrices to implemented
- [x] Add canonical end-to-end DLS demo scenario doc
- [ ] Run full verification and capture evidence
- [ ] Owner visual review checkpoint acknowledged for DLS scenarios
- [ ] Move plan to completed

## Surprises and Discoveries

- Observation: Several behavior rows targeted private internals and needed explicit test seams.
  Evidence: Added test-internals exports in `assistant-service`, `capture-consent`, `cloud-sync/engine`, `google-meet` provider, `overlay`, and `history` summary pipeline.

- Observation: The cloud-sync state snapshot function had a pending-settings wiring bug.
  Evidence: `entrypoints/background/cloud-sync/engine.ts` now maps the resolved pending decision explicitly instead of `arguments[0]`.

## Decision Log

- Decision: execute closure in milestone waves while keeping each matrix status update tightly coupled to real test additions.
  Rationale: avoid false-positive documentation closure and preserve auditability.
  Date/Author: 2026-04-10 / Codex

- Decision: keep DLS owner-approval as a hard completion checkpoint, not an optional post-check.
  Rationale: command success alone is insufficient for behavior acceptance in runtime-sensitive flows.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

- Added deterministic contract tests covering all previously planned rows (45/45 closed in traceability matrices).
- Added canonical end-to-end DLS scenario doc with explicit owner-approval step.
- Remaining completion items are full-suite verification run and explicit owner visual approval sign-off.
