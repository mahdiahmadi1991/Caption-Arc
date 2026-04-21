# Harden Diagnostics Snapshot Isolation And Release Flow

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Make diagnostics snapshots reliable across multi-tab and multi-frame runtime scenarios, move generated release artifacts into a canonical hidden workspace path, reduce diagnostics persistence overhead, and ensure smoke automation leaves diagnostics state clean after execution.

## Problem Statement

The diagnostics snapshot model used globally reused keys that could collide across tabs, frames, and providers. The collector also persisted on every event, which was needlessly expensive for high-frequency traces. Separately, the release workflow still pointed to legacy artifact locations and the artifact folder policy was not yet canonicalized under a hidden generated-output directory.

## Scope

- isolate diagnostics snapshots so all-frames and multi-provider sessions cannot overwrite each other incorrectly
- improve diagnostics payload querying so runtime tooling can resolve the intended snapshot deterministically
- update smoke provider runtime reads and cleanup to use the improved snapshot/config contract
- move build and zip artifacts under `.release/development` and `.release/production`
- migrate scripts, workflows, docs, and ignore rules to `.release/`
- add debounced diagnostics persistence and repetitive-event dedupe/rate-limiting
- add or update tests for snapshot isolation, collector flushing/dedupe, and smoke cleanup behavior

## Non-Goals

- changing redaction policy or allowing raw transcript/speaker/prompt/url data into diagnostics
- changing the production default diagnostics threshold away from `off`
- adding any parallel logging pipeline or user-visible diagnostics UI

## Repository Context

- `entrypoints/shared/diagnostics.ts`
- `entrypoints/shared/diagnostics-client.ts`
- `entrypoints/background/diagnostics.ts`
- `entrypoints/background/index.ts`
- `scripts/manual-smoke/smoke-provider.mjs`
- `scripts/manual-smoke/lib/diagnostics-runtime.mjs`
- `wxt.config.ts`
- `package.json`
- `.github/workflows/release.yml`
- `.gitignore`
- `tests/google-meet/diagnostics.contract.test.ts`
- `tests/google-meet/diagnostics-client.contract.test.ts`
- `tests/google-meet/diagnostics.collector.contract.test.ts`
- `tests/google-meet/diagnostics-runtime.contract.test.ts`
- release/setup/runtime docs under `README.md`, `docs/setup/`, `docs/operations/`, and `docs/quality/`

## Constraints

- preserve canonical sanitization for `apiKey`, `token`, `prompt`, `url`, `text`, `speaker`, `transcript`, `caption`, and similar fields
- keep diagnostics debug-only and production default `off`
- keep changes minimal but complete; no second diagnostics system
- make `.release/` the only canonical artifact path throughout the repository

## Risks and Unknowns

- snapshot-key changes can break smoke tooling if query semantics are not updated in lockstep
- debounced storage persistence must stay reliable across background lifecycle boundaries
- release zip output path may have additional assumptions in workflow or docs beyond the obvious references

## Documentation Impact

- update build/release/runtime docs to `.release/` as the source of truth
- update any workflow or onboarding docs that still mention legacy artifact paths

## Testing and Coverage Impact

- run `pnpm vitest run tests/google-meet/diagnostics.contract.test.ts tests/google-meet/diagnostics-client.contract.test.ts tests/google-meet/diagnostics.collector.contract.test.ts tests/google-meet/diagnostics-runtime.contract.test.ts`
- run `pnpm test:targeted:plan`
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm build:production`
- run `pnpm zip:production`
- run `pnpm docs:check`

## Milestones

### Milestone 1 - Isolate Snapshot Addressing

Refactor diagnostics snapshot keys and payload query support so snapshots are namespaced by sender/runtime/provider context and can be read deterministically by smoke tooling and diagnostics consumers. Acceptance means multi-frame or multi-provider collisions no longer overwrite each other and tests cover the failure mode.

### Milestone 2 - Harden Collector Performance And Cleanup

Replace persist-per-event behavior with buffered debounced session writes, avoid redundant snapshot writes when payloads do not change, and dedupe/rate-limit repetitive diagnostics events. Acceptance means the collector remains bounded while writes no longer scale linearly with repeated trace spam, and smoke automation restores prior diagnostics config reliably.

### Milestone 3 - Canonicalize `.release/` Artifact Flow

Move build and zip outputs under `.release/`, update workflows/scripts/docs/ignore policy, and ensure no legacy artifact path remains as source of truth. Acceptance means production build and zip land under `.release/production` and `.release/` respectively, the release workflow references the actual zip output path, and generated artifacts are ignored by git.

## Verification

- `pnpm vitest run tests/google-meet/diagnostics.contract.test.ts tests/google-meet/diagnostics-client.contract.test.ts tests/google-meet/diagnostics.collector.contract.test.ts tests/google-meet/diagnostics-runtime.contract.test.ts` -> passed
- `pnpm test:targeted:plan` -> passed
- `pnpm test:google` -> passed
- `pnpm test:google:coverage` -> passed
- `pnpm build:production` -> passed
- `pnpm zip:production` -> passed
- `pnpm docs:check` -> passed

## Progress

- [x] Implement snapshot isolation and payload query improvements
- [x] Add collector buffering, snapshot change detection, and repetitive-event dedupe
- [x] Migrate artifacts and workflow references to `.release/`
- [x] Update smoke cleanup to restore prior diagnostics config
- [x] Add/update tests and sync docs
- [x] Run validation and archive this plan

## Surprises and Discoveries

- Observation: snapshot scoping changed more than retrieval; older assertions and smoke reads that referenced the fixed `content-runtime` key had to move to `snapshotBaseKey` plus `resolvedSnapshot`.
  Evidence: updated collector tests and `scripts/manual-smoke/smoke-provider.mjs`.
- Observation: WXT zip artifacts already resolve against `outBaseDir`, so changing `outDir` to `.release` also moved the canonical zip output into `.release/` without needing a custom packager.
  Evidence: `node_modules/wxt/dist/core/zip.mjs` and successful `pnpm zip:production` output.

## Decision Log

- Decision: keep redaction and threshold policy intact while changing addressing, persistence, and artifact location.
  Rationale: the owner explicitly requested reliability and consistency improvements without weakening debug-only gating or sanitization.
  Date/Author: 2026-04-07 / GitHub Copilot
- Decision: fix snapshot collisions collector-side through scoped keys and query resolution instead of introducing new content-side logging channels.
  Rationale: this preserved the single canonical diagnostics pipeline and kept content publishers minimal.
  Date/Author: 2026-04-07 / GitHub Copilot
- Decision: wrap smoke diagnostics overrides in a helper that restores prior config in `finally`.
  Rationale: this makes cleanup deterministic and independently testable.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

Implementation added scoped snapshot storage and query resolution, sender-aware snapshot metadata, collector write debouncing, repetitive-event dedupe, unchanged-snapshot suppression, smoke diagnostics config restoration, and repository-wide `.release/` artifact canonicalization. Validation passed across diagnostics-focused tests, the full Google Meet test suite and coverage run, production build/package, and docs checks. Final zip artifact: `.release/caption-arc-1.3.0-chrome.zip`.