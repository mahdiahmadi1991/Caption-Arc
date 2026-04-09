# Curated Bootstrap Git History

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Rebuild a clean, governed Git history from the current repository snapshot after repository re-initialization. Done means `main` ends with a readable linear release history, each intentional `main` entry is versioned and tagged, and the repository retains release notes/changelog material that explains each step.

## Problem Statement

The repository was re-initialized and currently has no commits. The owner wants the current codebase decomposed into smaller, reviewable topic-branch units that land on `main` through the governance model in `docs/contributing/repository-governance.md` instead of one monolithic initial commit.

## Scope

- create a governed bootstrap history from the current working tree
- use short-lived topic branches
- squash-merge each topic branch onto `main`
- keep `main` linear and versioned
- create annotated tags that match the canonical version for each `main` release step
- maintain changelog/release-note material so each release step is understandable
- end on the current canonical repository version

## Non-Goals

- push branches, tags, or releases to a remote hosting provider
- fabricate external pull requests in a remote system that does not exist for this local bootstrap
- rewrite product behavior beyond version/changelog/governance artifacts needed for the history bootstrap

## Repository Context

- `AGENTS.md`
- `docs/contributing/repository-governance.md`
- `docs/contributing/execution-plans.md`
- `docs/operations/release-runbook.md`
- `docs/operations/release-notes/release-2.3.0.md`
- `package.json`
- `wxt.config.ts`
- `.github/workflows/release.yml`

## Constraints

- `main` must remain linear and curated
- each `main` release step must have aligned version/tag/changelog state
- canonical version sources must stay synchronized between `package.json` and `wxt.config.ts`
- topic branches should stay short-lived and be deleted after squash merge
- local-only execution means PRs and GitHub Releases can only be approximated through local branch discipline, squash merges, tags, and release notes

## Risks and Unknowns

- the current repository snapshot is tightly integrated, so the smallest buildable history slices may still be larger than ideal
- creating too many micro-releases can make semantic versioning less defensible than a moderate number of coherent release steps
- local bootstrap cannot produce actual hosted PR artifacts

## Documentation Impact

- add and update `CHANGELOG.md`
- update release-note material as needed for the reconstructed history
- archive this plan under `docs/contributing/execution-plans/completed/` when done

## Testing and Coverage Impact

- verify final repository state with:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm build:chrome:production`
  - `pnpm build:firefox:production`
  - `pnpm docs:check`

## Milestones

### Milestone 1 - Prepare governance artifacts

Create the planning/changelog artifacts needed to execute the bootstrap under repository policy, define the release sequence, and confirm canonical version sources.

### Milestone 2 - Rebuild the linear release history

Create topic branches from `main`, stage scoped repository slices, squash-merge them back onto `main`, bump versions deliberately, create annotated tags, and delete merged topic branches.

### Milestone 3 - Verify and archive

Run repository validation against the final reconstructed state, move this plan to `completed/`, and ensure the history/changelog/tag state matches the intended release narrative.

## Verification

- `git log --oneline --decorate --graph`
- `git tag -n`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:chrome:production`
- `pnpm build:firefox:production`
- `pnpm docs:check`

## Progress

- [x] Inspect governance, versioning, and release docs
- [x] Create the bootstrap execution plan
- [ ] Reconstruct the governed `main` history
- [ ] Run final verification
- [ ] Archive the completed plan

## Surprises and Discoveries

- Observation: the repository is currently on a freshly initialized Git history with no commits on `main`.
  Evidence: `git status --short --branch` reported `## No commits yet on main`.

- Observation: the canonical version is duplicated in both `package.json` and `wxt.config.ts`, and both currently resolve to `2.3.0`.
  Evidence: `package.json` and `wxt.config.ts` both declare version `2.3.0`.

## Decision Log

- Decision: reconstruct the history as a local bootstrap narrative with short-lived topic branches and squash merges rather than a single giant initial commit.
  Rationale: this is the closest local approximation to the repository governance model while keeping `main` readable and reviewable.
  Date/Author: 2026-04-09 / Codex

- Decision: use a changelog as the durable per-release note surface for the reconstructed local history.
  Rationale: a single canonical running document is easier to keep aligned across multiple local release steps than many independent new release-note files.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

Implementation pending.
