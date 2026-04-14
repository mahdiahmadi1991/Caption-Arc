# Meeting Assistant Audit And Surface Hardening

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Audit and harden the in-meeting assistant module so UI state reflects real runtime data, assistant tests cover the surface contract gaps, and docs stay synchronized with the implemented behavior.

Done means:

- assistant surface no longer shows synthetic processing/output states when no real pending data exists
- assistant behavior is covered by deterministic contract tests at service and surface layers
- behavior-contract and traceability docs match the resulting code
- required quality gates and governed browser development builds are executed for handoff

## Problem Statement

Current assistant runtime tests validate `entrypoints/content/assistant-service.ts`, but direct assistant surface behavior (`entrypoints/content/overlay/assistant-surface.ts`) has no dedicated contract tests. During audit, a concrete risk surfaced: a hardcoded processing preview path can force streaming/pending UI even without real live assistant output.

This can mislead users about live assistant activity and creates drift between runtime state and rendered UI.

## Scope

- audit `assistant-service`, `assistant-surface`, and related overlay/runtime integration points
- remove synthetic processing preview behavior from assistant surface runtime flow
- add focused contract tests for assistant surface state rendering and pending-card behavior
- sync behavior docs and traceability matrices for changed behavior surfaces
- run required test/docs gates and fresh governed browser development builds (Chrome + Firefox)

## Non-Goals

- redesigning assistant UI visuals or copy beyond behavior correctness
- changing background assistant trigger heuristics/model prompt strategy
- adding new providers or new assistant feature settings
- release/version/tagging operations

## Repository Context

Primary code:

- `entrypoints/content/assistant-service.ts`
- `entrypoints/content/overlay/assistant-surface.ts`
- `entrypoints/content/overlay/index.ts`
- `entrypoints/content/overlay/settings.ts`
- `entrypoints/content/state.ts`

Primary tests:

- `tests/google-meet/assistant-runtime.contract.test.ts`
- `tests/google-meet/overlay-lifecycle.contract.test.ts`
- `tests/google-meet/google-meet-overlay-settings.contract.test.ts`
- new assistant-surface contract tests (to be added)

Primary docs:

- `docs/api/assistant-runtime-behavior-contract.md`
- `docs/api/overlay-behavior-contract.md`
- `docs/quality/references/assistant-runtime-traceability-matrix.md`
- `docs/quality/references/overlay-traceability-matrix.md`
- `docs/quality/references/runtime-testing-readme.md`

Validation/tooling:

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`

## Constraints

- repository is public; no secrets/private/local-machine details in code/docs/tests
- follow behavior-contract governance when behavior-sensitive code changes
- keep changes deterministic and contract-test-friendly (no flaky timing assumptions)
- keep compatibility for both Chrome and Firefox content runtime behavior
- preserve existing overlay/assistant integration boundaries and avoid unrelated refactors

Browser impact requirements:

- Chrome impact: yes (content runtime and overlay assistant surface)
- Firefox impact: yes (same content runtime path via WXT multi-browser build)
- No intentional browser gating in this wave
- Verification evidence: green automated tests plus fresh development builds for both browsers; runtime automation remains Chrome-first, Firefox remains manual-runtime path outside this thread unless specifically requested

## Risks and Unknowns

- assistant surface DOM logic is large and imperative; narrow changes may still affect layout state transitions
- removing synthetic preview paths can expose previously hidden empty-state assumptions
- tests must avoid brittle style/layout assertions and focus on deterministic data-state outcomes

## Documentation Impact

Behavior-sensitive docs to update:

- `docs/api/overlay-behavior-contract.md` (assistant-surface rendering semantics and source references)
- `docs/quality/references/overlay-traceability-matrix.md` (new/updated case mappings for assistant surface behavior)

Potentially update if assistant-service behavior contract needs clarifying cross-reference:

- `docs/api/assistant-runtime-behavior-contract.md`
- `docs/quality/references/assistant-runtime-traceability-matrix.md`

## Testing and Coverage Impact

Tests to add/update:

- add assistant-surface contract tests under `tests/google-meet/` for:
  - no synthetic pending card when runtime pending outputs are empty
  - render state mirrors real assistant state (watching/suppressed/done/etc.) without forced streaming fallback
  - real pending outputs still render correctly
- update existing tests only if behavior-contract IDs or references require alignment

Coverage scope:

- `pnpm test:google`
- `pnpm test:google:coverage`

Targeted/runtime scope:

- `pnpm test:targeted:plan`
- module-scoped plan/run for touched assistant surface files
- DLS smoke only if runtime behavior changes beyond deterministic contract/test validation

## Milestones

### Milestone 1 - Assistant Surface Audit And Bug Fix

Implement the smallest safe code change in `assistant-surface` so rendered state and pending cards are driven by real runtime data only.

Acceptance:

- no hardcoded preview state path remains active in runtime
- assistant status/pending render logic is consistent with live state + pending arrays

### Milestone 2 - Contract Tests For Assistant Surface Behavior

Add deterministic tests that fail on synthetic preview regressions and validate expected assistant surface rendering decisions.

Acceptance:

- new tests fail on old behavior and pass on fixed behavior
- no regressions in existing assistant/overlay tests

### Milestone 3 - Docs Sync And Quality Gates

Update behavior contract + traceability docs to match implemented behavior and execute repository-required checks.

Acceptance:

- docs and traceability references reflect final behavior
- required test/docs gates pass
- fresh Chrome and Firefox development builds are produced for user reload verification

## Verification

- `pnpm test:module:plan entrypoints/content/overlay/assistant-surface.ts tests/google-meet/assistant-surface.contract.test.ts`
- `pnpm test:module:run entrypoints/content/overlay/assistant-surface.ts tests/google-meet/assistant-surface.contract.test.ts`
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`

Verification outcomes (2026-04-13):

- Pass: `pnpm test:module:plan entrypoints/content/overlay/assistant-surface.ts tests/google-meet/assistant-surface.contract.test.ts`
- Partial: `pnpm test:module:run ...` executed; Vitest targets passed, but live DLS smoke commands failed in this environment due CDP/runtime orchestration instability
- Pass: `pnpm vitest run tests/google-meet/google-meet-overlay-settings.contract.test.ts tests/google-meet/google-meet-prompts.contract.test.ts tests/google-meet/assistant-surface.contract.test.ts`
- Pass: `pnpm test:targeted:plan`
- Pass: `pnpm test:google`
- Pass: `pnpm test:google:coverage`
- Pass: `pnpm docs:check`
- Pass: `pnpm docs:check:behavior`
- Pass: `pnpm build:all:development` (fresh Chrome + Firefox development builds)

## Progress

- [x] Baseline audit run (`pnpm test:google`, `pnpm test:google:coverage`) completed and green
- [x] Fix assistant-surface synthetic processing preview behavior
- [x] Add assistant-surface contract tests
- [x] Sync behavior-contract and traceability docs
- [x] Run targeted/module tests + repository quality gates
- [x] Produce fresh Chrome and Firefox development builds for reload handoff

## Surprises and Discoveries

- Observation: `entrypoints/content/overlay/assistant-surface.ts` currently includes hardcoded preview constants that can force `streaming` status and mock pending output.
  Evidence: `ASSISTANT_PROCESSING_PREVIEW = true` plus fallback logic in `getRenderableAssistantState()` and `getRenderablePendingOutputs()`.
- Observation: Live DLS smoke automation is still environment-fragile in this thread despite auto-start logic (CDP readiness and top-level-await runtime exits were observed).
  Evidence: `pnpm test:module:run ...` failed on `pnpm chrome:smoke:live*` while deterministic Vitest contract suites remained green.

## Decision Log

- Decision: Treat synthetic processing preview in assistant surface as a bug for this hardening pass and remove it from runtime behavior.
  Rationale: it diverges from real assistant runtime/session state and can present false live activity.
  Date/Author: 2026-04-13 / Codex

## Outcomes and Retrospective

Shipped outcome:

- removed synthetic assistant processing preview fallback from runtime assistant surface rendering
- added assistant surface contract tests to guard against false `streaming` status and mock pending-card regressions
- synced overlay behavior contract and traceability matrix with assistant-surface rendering rules
- executed required repository tests/docs checks and produced fresh Chrome + Firefox development builds for reload validation

Scope changes from initial plan:

- no major scope expansion; changes remained inside assistant-surface behavior, tests, and docs synchronization

Remaining follow-up:

- rerun live DLS smoke validations in a stable CDP runtime session if release evidence requires fresh runtime-level logs for this exact patch set
