# Behavior-Contract Gap Closure Wave Three

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Close the next set of deterministic behavior-contract traceability gaps so behavior docs can be used as reliable test source of truth.

Done means: planned cases in the current focus modules are either moved to `implemented` with real deterministic tests, or kept `planned` with explicit remaining rationale.

## Problem Statement

After wave two, core matrices still had uncovered `planned` cases in:

- provider routing
- Microsoft Teams provider behavior
- Zoom Web provider behavior
- runtime lifecycle behavior
- runtime session continuation behavior

This weakens confidence that contracts stay synchronized with executable repository verification.

## Scope

- add deterministic contract tests for remaining high-value planned cases in the five focus matrices
- extend/adjust testability seams only when necessary and without behavior change
- update traceability matrices to reflect real test coverage
- keep governance docs aligned with canonical contract/matrix set

## Non-Goals

- redesign runtime architecture
- production feature changes unrelated to testability
- full closure of every planned case across all repository matrices in this wave

## Repository Context

- `entrypoints/content/providers/registry.ts`
- `entrypoints/content/providers/microsoft-teams.ts`
- `entrypoints/content/providers/zoom-web.ts`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/background/history.ts`
- `tests/google-meet/`
- `docs/quality/references/*traceability-matrix.md`
- `docs/contributing/behavior-contract-governance.md`

## Constraints

- behavior claims must remain code-derived and deterministic
- no unsafe public-repo data in tests/docs
- no regressions to existing `test:google` suite
- keep docs and tests synchronized in the same change set

## Risks and Unknowns

- some runtime lifecycle branches are hard to assert without adding test-only seams
- JSDOM constraints around full URL-origin transitions can hide provider-host branches
- over-mocking can create false confidence if not tied to concrete code paths

## Documentation Impact

- update focused matrices in `docs/quality/references/`
- keep `docs/contributing/behavior-contract-governance.md` canonical list aligned

For behavior-sensitive changes include:

- affected `docs/api/*-behavior-contract.md` files
- affected `docs/quality/references/*traceability-matrix.md` files

## Testing and Coverage Impact

- add/extend deterministic tests under `tests/google-meet/`
- run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
- run docs validation:
  - `pnpm docs:check`
  - `pnpm docs:check:behavior`
  - `pnpm docs:check:business`

## Milestones

### Milestone 1 - Close Provider/Teams/Zoom planned gaps

Add and validate deterministic tests for planned cases in provider routing and provider-specific matrices (Teams and Zoom), then synchronize matrix status rows.

### Milestone 2 - Close continuation and lifecycle high-value gaps

Add deterministic tests for background continuation behaviors and runtime lifecycle initialization/rejection paths; update matrix rows and notes for residual planned items.

## Verification

- `pnpm vitest run tests/google-meet/provider-routing.contract.test.ts tests/google-meet/microsoft-teams-provider.contract.test.ts tests/google-meet/zoom-web-provider.contract.test.ts tests/google-meet/runtime-lifecycle.contract.test.ts tests/google-meet/runtime-session-continuation.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm docs:check:business`

## Progress

- [x] Plan created before wave-three implementation changes
- [x] Add/extend deterministic tests for remaining planned cases in focus modules
- [x] Update focused matrices from `planned` to `implemented` where validated
- [x] Record residual planned gaps with explicit rationale
- [x] Run full verification commands and capture outcomes
- [x] Move plan to completed after wave-three closure

## Surprises and Discoveries

- Observation: `docs:check:business` blocks behavior-sensitive code changes unless at least one canonical `docs/product/` file is updated, even when behavior changes are testability seams only.
  Evidence: failed run of `pnpm docs:check:business` before updating `docs/product/overview.md`.

## Decision Log

- Decision: execute this as a scoped wave against five matrices instead of all repository matrices.
  Rationale: keeps change set reviewable while materially improving source-of-truth reliability.
  Date/Author: 2026-04-10 / Codex

- Decision: add internal test seams (no intended runtime behavior change) to validate previously unreachable deterministic branches.
  Rationale: enables executable evidence for contract rows that were otherwise forced to remain `planned`.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

Delivered in this wave:

- added/extended deterministic tests for provider routing ordering, Teams metadata classification, Zoom transcript/chat helpers, and runtime reset confirmation timing
- synchronized focused traceability matrices to move validated rows from `planned` to `implemented`
- kept residual gaps explicitly marked `planned`

Verification executed:

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm vitest run tests/google-meet/google-meet-runtime-reset.contract.test.ts`
- `pnpm vitest run tests/google-meet/content-script-marker.contract.test.ts`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm docs:check:business`

Remaining follow-up after this wave:

- `microsoft-teams-traceability-matrix.md`: 3 planned rows
- `zoom-web-traceability-matrix.md`: 1 planned row
- `runtime-lifecycle-traceability-matrix.md`: 6 planned rows
- `runtime-session-continuation-traceability-matrix.md`: 6 planned rows
