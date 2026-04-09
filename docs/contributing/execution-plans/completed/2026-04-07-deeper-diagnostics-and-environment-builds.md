# Deeper Diagnostics And Environment Builds

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Deepen extension diagnostics again so runtime behavior is reconstructable with fewer blind spots, then make development and production builds explicit and environment-driven for diagnostics behavior, including a future-facing environment flag that controls whether a log viewer UI is allowed to exist.

## Problem Statement

The repository now has stronger diagnostics coverage, but there are still lifecycle and ingestion areas where the execution story is thinner than desired. Build behavior is also not yet explicit enough from the developer workflow perspective for environment-targeted extension builds, even though diagnostics policy is now environment-backed. The future log-viewer UI also needs a configuration gate now, without implementing the UI itself.

## Scope

- deepen diagnostics coverage in remaining runtime lifecycle and ingestion paths
- expose explicit development and production build commands tied to environment policy
- keep production diagnostics off by default and allow per-environment policy via config
- add an environment-backed flag for future log-viewer UI enablement without implementing UI
- update tests and docs for environment build behavior and new environment flags

## Non-Goals

- implement any log-viewer UI
- add external telemetry backends
- move diagnostics policy back into user-facing settings

## Repository Context

- `package.json`
- `wxt.config.ts`
- `entrypoints/shared/environment/*.ts`
- `entrypoints/shared/environment/index.ts`
- `entrypoints/shared/diagnostics.ts`
- `entrypoints/content/index.ts`
- `entrypoints/content/event-ingestion.ts`
- `entrypoints/content/observer.ts`
- `entrypoints/content/platform-runtime.ts`
- `docs/setup/debugging.md`
- `docs/api/commands-and-shortcuts.md`
- `docs/operations/observability-and-support.md`

## Constraints

- no UI implementation in this workstream
- production builds must default to no captured diagnostics unless explicitly changed in environment policy
- environment controls must remain public-safe and repository-visible
- runtime override commands must continue to work

## Risks and Unknowns

- explicit build-mode scripting may need validation against WXT mode handling
- deeper logging in content lifecycle paths can become noisy if not kept structured

## Documentation Impact

- update environment-build and diagnostics docs
- record the future log-viewer gate in diagnostics documentation

## Testing and Coverage Impact

- run `pnpm test:google`
- run `pnpm build:development`
- run `pnpm build:production`
- run `pnpm docs:check`

## Milestones

### Milestone 1 - Explicit Environment Build Flow

Add explicit environment-targeted build commands and ensure diagnostics policy resolves correctly under both development and production builds.

### Milestone 2 - Deeper Runtime Logging

Add another diagnostics wave in lifecycle, observer, ingestion, and content bootstrap areas to reduce remaining runtime blind spots.

### Milestone 3 - Future UI Gate And Docs

Add an environment-backed flag for future log-viewer UI eligibility, document it, validate behavior, and archive the plan.

## Verification

- `pnpm test:google` -> passed (`57/57` tests)
- `pnpm build:development` -> passed
- `pnpm build:production` -> passed
- `pnpm docs:check` -> passed (`94 markdown files scanned`)

## Progress

- [x] active plan created
- [x] explicit environment build flow added
- [x] deeper runtime logging added
- [x] future UI environment gate added
- [x] validation commands passing

## Surprises and Discoveries

- Observation: the repository already behaved as production by default on `wxt build`, but the workflow did not expose this explicitly enough for environment-based diagnostics reasoning.
  Evidence: `package.json`, `entrypoints/shared/runtime-environment.ts`

## Decision Log

- Decision: keep the future log-viewer capability as an environment gate only for now.
  Rationale: the owner explicitly requested setup only, not UI implementation.
  Date/Author: 2026-04-07 / Copilot

## Outcomes and Retrospective

Implementation added explicit `build:development` and `build:production` commands, kept default `build` on the explicit production path, introduced a future-facing `diagnostics.viewerEnabled` environment gate without UI code, and deepened bootstrap, ingestion, observer, and platform lifecycle diagnostics. A later release-layout follow-up moved the environment artifacts under `release/development` and `release/production` for side-by-side testing.