# UI Locale Catalog Sync Enforcement

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Add a durable repository guard that prevents shipped UI locale catalogs from drifting when one locale catalog changes, especially when `en.ts` is updated and the remaining shipped locale files are not touched in the same change.

The owner explicitly wants this pattern eliminated rather than relying on memory or chat reminders.

## Problem Statement

The repository already protects:

- locale key parity across shipped catalogs
- fallback behavior
- selected high-signal localization coverage

But it does not currently enforce changed-file synchronization across all shipped locale catalogs. That leaves a gap:

- a contributor can update `entrypoints/shared/i18n/messages/en.ts`
- maybe also update `fa.ts`
- and unintentionally leave the other shipped locale catalogs untouched

Existing type safety and UI i18n contract tests do not always catch this because unchanged locale files can still remain structurally valid.

## Scope

- inspect current i18n validation and quality-gate workflow
- add a repository validation script that enforces shipped-locale synchronization when the canonical English locale catalog changes
- wire the new guard into package scripts and CI quality gates
- update contributor docs and i18n architecture guidance to describe the new enforcement rule

## Non-Goals

- automatic machine translation generation
- changing the supported locale inventory
- replacing current i18n runtime or catalog architecture
- solving every possible semantic translation quality issue

## Repository Context

Primary surfaces:

- `entrypoints/shared/i18n/messages/*.ts`
- `entrypoints/shared/i18n/catalog.ts`
- `tests/google-meet/ui-i18n.contract.test.ts`
- `package.json`
- `.github/workflows/quality-gates.yml`
- `docs/architecture/ui-i18n-strategy.md`
- `docs/contributing/development-workflow.md`
- `docs/contributing/definition-of-done.md`

## Proposed Design Direction

- create a dedicated validation script under `scripts/`
- when the canonical English locale catalog changes in a diff scope, require every shipped locale catalog file to be touched in the same diff scope
- support explicit `--base` / `--head` refs for CI event-based validation
- support a local developer mode that evaluates the current working tree against `HEAD`

This guard complements, rather than replaces:

- key parity tests
- fallback tests
- localization quality tests

## Risks And Unknowns

- strict changed-file enforcement may feel heavy for one-locale fixes, but that is aligned with the owner's explicit request for guaranteed synchronization
- CI diff detection must work for both `pull_request` and `push` events
- local developer ergonomics should remain clear when the working tree is dirty

## Chromium And Firefox Impact

- no browser-runtime behavior change
- repository workflow and contributor process change only

## Testing And Verification Impact

Required validation should include:

- targeted validation of the new i18n sync script
- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- quality-gate workflow config sanity

## Progress

- [x] Plan created before implementation
- [x] Inspect existing i18n guardrails and identify the specific enforcement gap
- [x] Implement locale catalog sync validation
- [x] Wire the validation into package scripts and CI
- [x] Update relevant docs
- [x] Run validation

## Surprises and Discoveries

- Observation: existing UI i18n tests already guarantee key parity and basic localization quality, but they do not fail when `en.ts` changes and untouched non-English catalogs remain structurally valid.
  Evidence: `tests/google-meet/ui-i18n.contract.test.ts`

- Observation: the repository's earlier i18n rollout history explicitly normalized authored `en` plus prioritized `fa`, which likely reinforced a contributor habit of treating the remaining locale catalogs as secondary even after all 12 shipped catalogs existed.
  Evidence: `docs/contributing/execution-plans/completed/2026-04-07-full-ui-i18n-rollout.md`

## Decision Log

- Decision: enforce locale-catalog synchronization at the changed-file level, not only through runtime or structural tests.
  Rationale: the owner wants a durable guarantee that shipped locale files move together, and current parity tests do not cover that workflow failure mode.
  Date/Author: 2026-04-20 / Codex

## Outcomes and Retrospective

- Implementation completed with:
  - `pnpm i18n:check` passing on the current working tree
  - focused UI i18n and guard tests passing
  - `pnpm docs:check` passing
  - `pnpm test:google` passing
  - `pnpm test:google:coverage` passing
  - fresh Chrome and Firefox development builds produced
