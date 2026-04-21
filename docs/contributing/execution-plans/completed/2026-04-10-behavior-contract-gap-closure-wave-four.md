# Behavior-Contract Gap Closure Wave Four

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Close all remaining `planned` cases in the focused behavior matrices so this thread's target set reaches full deterministic closure.

## Problem Statement

After wave three, the focused matrices still contain `planned` rows:

- Microsoft Teams: 3
- Zoom Web: 1
- Runtime lifecycle: 6
- Runtime session continuation: 6

## Scope

- add deterministic tests for all remaining planned rows in the four focused matrices
- add minimal internal test seams where needed, with no intended runtime behavior change
- update the four matrices to `implemented` for covered rows
- keep plan and indexes synchronized

## Non-Goals

- broad closure of every `planned` row in all repository matrices
- product feature changes

## Repository Context

- `entrypoints/content/providers/microsoft-teams.ts`
- `entrypoints/content/providers/zoom-web.ts`
- `entrypoints/content/platform-runtime.ts`
- `tests/google-meet/`
- `docs/quality/references/microsoft-teams-traceability-matrix.md`
- `docs/quality/references/zoom-web-traceability-matrix.md`
- `docs/quality/references/runtime-lifecycle-traceability-matrix.md`
- `docs/quality/references/runtime-session-continuation-traceability-matrix.md`

## Constraints

- code-derived behavior only
- deterministic assertions only
- no privacy/safety regressions
- no intentional runtime behavior changes

## Risks and Unknowns

- runtime continuation/lifecycle internals require careful test seams to avoid brittle global-state coupling
- asynchronous timers and prompt flows can produce flaky tests if not isolated

## Documentation Impact

- update the four focused traceability matrices
- update product overview note if business-doc sync gate requires it

## Testing and Coverage Impact

- add/extend tests under `tests/google-meet/`
- run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - targeted vitest runs for touched suites
- run docs checks:
  - `pnpm docs:check`
  - `pnpm docs:check:behavior`
  - `pnpm docs:check:business`

## Milestones

### Milestone 1 - Teams and Zoom closure

Close remaining Teams and Zoom planned rows with deterministic tests and matrix updates.

### Milestone 2 - Runtime lifecycle and continuation closure

Close remaining runtime lifecycle and continuation planned rows with deterministic tests, internal state seams as needed, and matrix updates.

## Verification

- `pnpm vitest run tests/google-meet/microsoft-teams-provider.contract.test.ts tests/google-meet/zoom-web-provider.contract.test.ts tests/google-meet/runtime-lifecycle.contract.test.ts tests/google-meet/runtime-session-continuation.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm docs:check:business`

## Progress

- [x] Plan created before wave-four implementation changes
- [x] Close remaining Teams planned rows
- [x] Close remaining Zoom planned row
- [x] Close remaining runtime lifecycle planned rows
- [x] Close remaining runtime continuation planned rows
- [x] Sync matrices and notes
- [x] Run full verification
- [x] Move plan to completed

## Surprises and Discoveries

- Observation: `pnpm docs:check` initially failed on a non-ASCII apostrophe in this plan file.
  Evidence: validator output flagged `U+2019` in this file; replacing it with ASCII fixed the check.
- Observation: one targeted DLS smoke (`zoom-web lobby`) failed due provider-host redirect/auth gate in debug profile.
  Evidence: smoke output ended at `about:blank` and reported host mismatch; `zoom-web meeting`, `microsoft-teams meeting`, and `microsoft-teams lobby` completed with PASS.

## Decision Log

- Decision: keep wave-four scope strictly to the 16 planned rows in the four focused matrices.
  Rationale: achieve complete closure for this thread without widening scope.
  Date/Author: 2026-04-10 / Codex
- Decision: add small runtime/provider internal test seams to enable deterministic contract coverage without runtime behavior changes.
  Rationale: remaining cases were on private lifecycle/continuation paths and observer internals.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

- Added deterministic contract tests for all remaining planned rows in the four focused matrices:
  - Microsoft Teams: MTEAM-007..009
  - Zoom Web: ZOOM-007
  - Runtime lifecycle: RLIFE-007..012
  - Runtime continuation: RCONT-002..005, RCONT-010..011
- Updated the four focused traceability matrices from `planned` to `implemented`.
- Verification completed:
  - `pnpm vitest run tests/google-meet/microsoft-teams-provider.contract.test.ts tests/google-meet/zoom-web-provider.contract.test.ts tests/google-meet/runtime-lifecycle.contract.test.ts tests/google-meet/runtime-session-continuation.contract.test.ts`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan` plus targeted commands (with one known auth-gated smoke limitation for `zoom-web lobby`)
  - `pnpm docs:check`
  - `pnpm docs:check:behavior`
  - `pnpm docs:check:business`
