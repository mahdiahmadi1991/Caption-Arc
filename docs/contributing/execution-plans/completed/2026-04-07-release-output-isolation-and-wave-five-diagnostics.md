# Isolate Release Outputs And Complete Wave Five Diagnostics

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Prevent development and production extension builds from overwriting each other, make both artifacts easy to test side by side under a shared release folder, synchronize all affected documentation, and close the most important remaining logging gaps across the project.

## Problem Statement

The repository currently relies on WXT's default output naming, which can be easy to misread in operational docs and staging scripts. The owner wants deterministic environment-named release directories under a single parent path so builds can be staged and tested separately. In parallel, some UI hooks and content/extension support flows still have sparse diagnostics compared with the newer canonical logging coverage.

## Scope

- route development and production build outputs into `release/development` and `release/production`
- update scripts and docs that currently assume legacy `.output` extension build paths
- add fifth-wave structured diagnostics to high-value remaining modules that still have observability gaps
- validate the resulting build, docs, and test flows

## Non-Goals

- changing extension behavior beyond output location and diagnostics instrumentation
- adding any diagnostics UI or new visible product surface
- changing diagnostics environment policy semantics

## Repository Context

- `wxt.config.ts`
- `package.json`
- `scripts/start-windows-chrome-debug.sh`
- `scripts/manual-smoke/ensure-cdp-ready.sh`
- `README.md`
- `docs/setup/`
- `docs/quality/`
- `docs/operations/`
- `entrypoints/options/use-settings.ts`
- `entrypoints/meeting-history/use-history.ts`
- `entrypoints/content/assistant-service.ts`
- `entrypoints/content/overlay/header.ts`
- `entrypoints/content/overlay/capture-guide.ts`

## Constraints

- preserve current debug and production semantics
- keep documentation public-safe and repo-accurate
- use canonical diagnostics loggers rather than ad hoc console logging
- production logging remains off by default unless explicitly raised through environment policy

## Risks and Unknowns

- staging and smoke scripts may have more baked-in output path assumptions than the first search shows
- wave-five logging can sprawl if it is not kept to high-value lifecycle and failure-analysis points

## Documentation Impact

- update build/setup/debug/runtime docs for the new `release/*` output paths
- update root documentation that references unpacked extension paths
- archive this plan after completion

## Testing and Coverage Impact

- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan`
- run `pnpm build:development`
- run `pnpm build:production`
- run `pnpm docs:check`

## Milestones

### Milestone 1 - Isolate Environment Build Outputs

Configure WXT and any relevant scripts so development and production builds land in deterministic environment-specific directories under `release/`. Acceptance means the two builds can coexist without overwriting each other and debug scripts target the intended production bundle path explicitly.

### Milestone 2 - Complete Wave Five Diagnostics

Inspect remaining major modules without canonical diagnostics and add structured logging at meaningful lifecycle, persistence, failure, and recovery points. Acceptance means the highest-value remaining blind spots are covered without introducing UI or log spam in primary release behavior.

### Milestone 3 - Sync Docs And Validate

Update affected docs to reflect the new release layout and added diagnostics coverage, then run repository validation commands and archive the plan.

## Verification

- `pnpm build:development`
- `pnpm build:production`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm docs:check`

## Progress

- [x] Isolate development and production build outputs under `release/`
- [x] Update scripts that assume legacy output paths
- [x] Add fifth-wave diagnostics to remaining high-value modules
- [x] Sync affected docs and README references
- [x] Run validation commands and archive the plan

## Surprises and Discoveries

- Observation: WXT supports both `outDir` and `outDirTemplate`, so the release layout can be made deterministic directly in config rather than by shell-copy post-processing.
  Evidence: `node_modules/wxt/dist/types.d.ts`.

- Observation: one Windows launcher script and one archived execution plan still referenced the old output layout after the main docs sweep.
  Evidence: post-validation `rg` check across `README.md`, `docs/`, and `scripts/`.

## Decision Log

- Decision: use a single `release` parent directory with per-environment subfolders instead of keeping the default `.output` location visible to operators.
  Rationale: it matches the requested workflow and prevents ambiguity when both environments are built on the same machine.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: point debug and smoke launcher defaults at `release/production` while allowing `EXTENSION_DIR` override for `release/development`.
  Rationale: production remains the stable default for operator workflows, while development can still be tested side by side without rewriting scripts.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

Implementation moved WXT outputs under `release/development` and `release/production`, updated the launcher/staging scripts to use the production artifact by default, synchronized the main setup/debug/runbook docs, and added fifth-wave diagnostics coverage to settings, cloud sync, meeting history, assistant sync, and overlay header/capture-guide flows.

Verification outcomes:

- `pnpm build:development` passed and produced `release/development`
- `pnpm build:production` passed and produced `release/production`
- `pnpm test:google` passed with 57 tests
- `pnpm test:google:coverage` passed with 57 tests and coverage output
- `pnpm test:targeted:plan` passed and recommended the expected provider smoke scopes
- `pnpm docs:check` passed and scanned 96 markdown files
- post-validation reference sweep found and cleared the final legacy output-path references in scripts/docs

Remaining follow-up, if requested later, would be to add direct smoke assertions for the newly expanded options/history/overlay diagnostic events.