# Public Repository Bootstrap And Branch Reset

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Create the first public GitHub repository for this project, align repository-governance summaries with the new graph-preserving workflow, and publish the requested branch topology where `develope` carries the current integration state and `main` is reset to the repository root commit.

## Problem Statement

The local repository has no remote configured yet, Git governance documentation was revised toward a graph-preserving `develope -> main` model, and the owner wants the public repository created and configured in a way that matches the project's current public positioning and Git workflow expectations.

## Scope

- clean the local worktree and remove non-semantic noise changes
- align governance summary docs with the new graph-preserving policy
- commit the intended repository-governance changes with a reviewable topic-branch commit
- create a public GitHub repository for the project
- configure the repository's public metadata and baseline settings
- create and push `develope` from the current integration state
- reset `main` to the initial repository commit and push that state

## Non-Goals

- implement product features
- change extension runtime behavior
- modify application version numbers or create a new release tag
- introduce new CI workflows beyond what is already in the repository

## Repository Context

- `README.md`
- `AGENTS.md`
- `docs/contributing/repository-governance.md`
- `docs/contributing/execution-plans.md`
- `.github/workflows/docs-guardrails.yml`
- `.github/workflows/quality-gates.yml`
- `.github/workflows/release.yml`

## Constraints

- keep the repository public-safe
- preserve the requested Git graph intent
- do not leave the repository in a detached-head or untracked remote state
- keep `AGENTS.md` aligned with the canonical governance document
- use repository-derived public metadata for GitHub description and topics

## Risks and Unknowns

- the current local history contains a duplicate final bootstrap commit, so branch and tag state must be reviewed carefully before publication
- resetting `main` to the root commit is intentionally destructive relative to current local branch tips and must only happen after `develope` safely holds the current state
- GitHub repository settings available through CLI may vary by installed `gh` capabilities and token scopes

## Documentation Impact

- update `AGENTS.md` to match the graph-preserving governance summary
- update the execution-plan indexes as this plan becomes active and later completed

## Testing and Coverage Impact

- run `pnpm docs:check`
- validate branch and remote state with Git inspection commands
- no code-level runtime changes are expected, so full product test/build gates are not required for this doc/repository-management task

## Milestones

### Milestone 1 - Clean and align local governance docs

Remove non-semantic worktree noise, add this plan, and align `AGENTS.md` with the canonical graph-preserving governance policy so the local repository is internally consistent.

### Milestone 2 - Publish and configure the public repository

Create the GitHub repository, set public metadata and baseline repo settings, and attach the local repository to the new remote.

### Milestone 3 - Publish the requested branch topology

Push the current integration state to `develope`, reset `main` to the root commit, push the reset branch, and confirm the final remote layout.

## Verification

- `git status --short --branch`
- `git log --oneline --decorate --graph --max-count=12 --all`
- `pnpm docs:check`
- `git remote -v`
- `git ls-remote --heads origin`

## Progress

- [x] Inspect the current local Git state and governance sources
- [ ] Create the active execution plan
- [ ] Clean noise changes and align governance summary docs
- [ ] Create and configure the public GitHub repository
- [ ] Publish the requested branch topology
- [ ] Archive the completed plan

## Surprises and Discoveries

- Observation: the worktree initially appeared to contain many changed files, but almost all of them were EOL-only noise rather than semantic edits.
  Evidence: normalized diff inspection showed `docs/contributing/repository-governance.md` as the only content-changing file before cleanup.

- Observation: local branch `main` points to commit `2dc39cb`, while annotated tag `v1.3.0` points to `a78f1c0`.
  Evidence: `git log --oneline --decorate --graph --max-count=12 --all`.

## Decision Log

- Decision: treat this task as non-trivial repository work and record it with an execution plan before continuing to remote publication steps.
  Rationale: repository creation, branch publication, and `main` reset are governance-sensitive operations with irreversible consequences once pushed.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

To be completed after repository creation, branch publication, and final verification.
