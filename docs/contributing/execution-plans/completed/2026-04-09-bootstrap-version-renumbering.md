# Bootstrap Version Renumbering

This Execution Plan is a completed historical record.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Renumber the local bootstrap release history so the governed release line starts at `v1.0.0` instead of `v2.0.0`, while keeping commit content, tags, changelog material, tests, and release docs aligned with the rewritten version sequence.

## Problem Statement

The local bootstrap history originally started at `v2.0.0` and ended at `v2.3.0`. The repository owner wanted the bootstrap release line to start at `v1.0.0`. Simple retagging was insufficient because each tagged commit also had to match the canonical version inside `package.json`, `wxt.config.ts`, changelog entries, and release documentation.

## Scope

- rewrite the local bootstrap release sequence from `2.x` to `1.x`
- update canonical version sources in each rewritten release commit
- update changelog, release notes, tests, and version-bearing docs to the new numbering
- recreate annotated tags with the new `v1.x.y` names

## Non-Goals

- change product behavior unrelated to version alignment
- push rewritten history to any remote
- alter dependency versions in `pnpm-lock.yaml`

## Repository Context

- `package.json`
- `wxt.config.ts`
- `CHANGELOG.md`
- `tests/google-meet/ui-i18n.contract.test.ts`
- `docs/operations/release-notes/release-1.3.0.md`
- `docs/contributing/execution-plans/completed/2026-04-09-curated-bootstrap-git-history.md`
- `docs/contributing/repository-governance.md`

## Constraints

- the final history must remain linear on `main`
- every rewritten release commit must have a matching canonical version and annotated tag
- docs and tests must reflect the renumbered release sequence
- local history rewrite must preserve a safe recovery path

## Risks and Unknowns

- history rewrite mistakes can leave tag/version drift if not verified at the end
- completed execution-plan docs contain historical version references that must be renumbered carefully

## Documentation Impact

- update changelog release headings and references
- rename and update the final bootstrap release note to `release-1.3.0.md`
- update version-bearing completed-plan docs that reference the bootstrap release sequence
- archive this plan under `completed/`

## Testing and Coverage Impact

- run:
  - `pnpm docs:check`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm build:chrome:production`
  - `pnpm build:firefox:production`

## Milestones

### Milestone 1 - Prepare rewrite inputs

Record the mapping from `2.x` to `1.x`, create a safe backup reference, and add this plan.

### Milestone 2 - Rewrite the bootstrap history

Rebuild the local linear history so each release commit carries the correct `1.x` canonical version and matching docs/tests.

### Milestone 3 - Retag and verify

Recreate annotated tags, run final validation on the new final version, and archive the plan.

## Verification

- `git log --oneline --decorate --graph --reverse`
- `git tag -n`
- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:chrome:production`
- `pnpm build:firefox:production`

## Progress

- [x] Inspect current tag/version references
- [x] Create the renumbering execution plan
- [x] Rewrite the local bootstrap history
- [x] Run final verification
- [x] Archive the completed plan

## Surprises and Discoveries

- Observation: the test suite hardcoded the repository release version string in the popup i18n contract.
  Evidence: `tests/google-meet/ui-i18n.contract.test.ts` expected `popup.footer.version` to contain `2.3.0`.

- Observation: multiple completed execution-plan docs also encoded the final bootstrap version in artifact names and validation notes.
  Evidence: `docs/contributing/execution-plans/completed/2026-04-07-diagnostics-snapshot-isolation-and-release-hardening.md` and `docs/contributing/execution-plans/completed/2026-04-09-cross-browser-release-and-dual-browser-governance.md` referenced `caption-arc-2.3.0-*` artifacts.

- Observation: broad tree-wide version replacement was unsafe because it also touched non-release dependency metadata.
  Evidence: an initial rewrite attempt changed `jsdom` from `22.1.0` to `21.1.0` and corrupted `pnpm-lock.yaml`, so the final rewrite was narrowed to the known version-bearing files only.

## Decision Log

- Decision: rewrite commit contents and tags together instead of retagging only.
  Rationale: the repository governance model requires the tag, canonical version, and release docs to stay aligned on each release commit.
  Date/Author: 2026-04-09 / Codex

- Decision: preserve the old `2.x` history behind backup refs while rebuilding `main` and the rewrite branch onto the new `1.x` sequence.
  Rationale: this kept a safe local recovery path while allowing the canonical branch and release tags to move to the corrected numbering.
  Date/Author: 2026-04-09 / Codex

- Decision: scope the final rewrite to explicit version-bearing files rather than all tracked files.
  Rationale: exact repository version strings appeared in historical docs, but a full-tree transform also risked changing unrelated dependency versions and lock metadata.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

The bootstrap release line now runs from `v1.0.0` through `v1.3.0`, with each rewritten commit carrying the matching canonical version in `package.json` and `wxt.config.ts`. The final repository state also updates the changelog, release note filename, contract test expectation, and the completed plan docs that referenced the old final `2.3.0` artifact names.

Final verification recorded during this plan:

- `pnpm docs:check` passed on the final `1.3.0` state.
- `pnpm test:targeted:plan` recommended the base Google regression because no flow-mapped file changes remained in `git diff`.
- `pnpm test:google` passed on the final `1.3.0` state.
- `pnpm test:google:coverage` passed on the final `1.3.0` state.
- `pnpm build:chrome:production` passed on the final `1.3.0` state.
- `pnpm build:firefox:production` passed on the final `1.3.0` state.
- `git log --oneline --decorate --graph --reverse` confirmed the linear rewritten history.
- `git tag -n` confirmed the new annotated release tag sequence through `v1.3.0`.
