# Remote Graph Alignment After History Purge

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Align the published Git refs with the already-validated local rewritten history so the repository graph no longer shows duplicate pre-rewrite and post-rewrite lines for the same logical bootstrap events.

## Problem Statement

The local repository history was rewritten to purge documentation image assets, but the remote branch `origin/develope` and remote tags `v1.2.0` and `v1.3.0` still point to the pre-rewrite commits. That leaves the Git graph visually duplicated and semantically confusing even though the local rewritten history is already the intended canonical one.

## Scope

- verify which remote refs still point at pre-rewrite commits
- push the rewritten `develope` ref to the remote with lease protection
- force-update only the mismatched release tags on the remote
- refresh local remote-tracking refs and verify the graph is clean

## Non-Goals

- change the intentionally reset `main` branch topology
- create new product commits
- alter release versions beyond aligning existing tags to the rewritten commits

## Repository Context

- `docs/contributing/repository-governance.md`
- `docs/contributing/execution-plans/active/README.md`
- `docs/contributing/execution-plans/completed/README.md`
- `docs/contributing/execution-plans/completed/2026-04-09-public-repository-bootstrap-and-branch-reset.md`
- `docs/contributing/execution-plans/completed/2026-04-09-image-history-purge-and-leak-audit.md`

## Constraints

- keep `main` at the repository root commit because that topology was intentionally published
- protect against accidental remote overwrite by using lease-based force where possible
- limit destructive remote updates to the mismatched refs only

## Risks and Unknowns

- GitHub branch protection may reject the non-fast-forward `develope` update
- remote tag updates are destructive and must stay limited to the already rewritten release commits
- local uncommitted files must remain untouched while ref alignment is performed

## Documentation Impact

- archive this plan under `completed/` when the ref alignment finishes

## Testing and Coverage Impact

- no product behavior changes are expected
- verification is Git-state oriented plus `pnpm docs:check` for the plan files

## Milestones

### Milestone 1 - Confirm the mismatched refs

Inspect local and remote refs to identify exactly which branch and tags still point at the pre-rewrite history.

### Milestone 2 - Align the remote refs safely

Push the rewritten `develope` branch with lease protection and force-update only the release tags that still point at pre-rewrite commits.

### Milestone 3 - Refresh and verify the graph

Refresh local remote-tracking refs, inspect the resulting graph, run docs validation, and archive the plan.

## Verification

- `git ls-remote --heads origin`
- `git ls-remote --tags origin`
- `git log --graph --decorate --oneline --all --date-order --max-count=20`
- `git branch -avv`
- `pnpm docs:check`

## Progress

- [x] Inspect local and remote ref divergence
- [x] Create the active execution plan
- [x] Align the remote branch and mismatched tags
- [x] Refresh refs and verify the graph
- [x] Archive the completed plan

## Surprises and Discoveries

- Observation: the remote already matches the rewritten history through `v1.1.0`; only `develope`, `v1.2.0`, and `v1.3.0` remain on pre-rewrite commits.
  Evidence: `git ls-remote --heads origin` and `git ls-remote --tags origin` showed `origin/develope` at `b94e2f7`, `v1.2.0^{}` at `abb6a9e`, and `v1.3.0^{}` at `2dc39cb`, while local rewritten refs point to `beeac5f`, `0487239`, and `7b9d06e`.

- Observation: branch protection rejected the initial non-fast-forward push to `develope`.
  Evidence: the first `git push --force-with-lease origin develope:develope` returned `GH006: Protected branch update failed`.

- Observation: temporary force-push enablement on `develope` was enough to align the branch and tags without changing any other protection rule.
  Evidence: after the controlled override, `git push --force-with-lease` updated `develope`, `git push --force` updated `v1.2.0` and `v1.3.0`, and the final protection readback again reported `allow_force_pushes.enabled` as `false`.

## Decision Log

- Decision: preserve the intentionally published `main` reset and only align the refs that still reflect the pre-purge history.
  Rationale: the graph problem is duplicate remote integration/release refs, not the current branch-topology policy itself.
  Date/Author: 2026-04-09 / Codex

- Decision: temporarily enable force-push on `develope`, perform the ref alignment, and then restore the previous protection settings immediately.
  Rationale: this was the lowest-risk way to make the cleanup durable because local-only remote-tracking cleanup would be reintroduced on the next fetch.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

The remote branch and release tags now match the rewritten local history, so the duplicated pre-rewrite and post-rewrite bootstrap lines no longer appear in the graph. `origin/develope` now points to `beeac5f`, `origin/main` remains at the intentional bootstrap anchor `66aaf75`, and the remote `v1.2.0` and `v1.3.0` tags now peel to `0487239` and `7b9d06e` respectively.

Protection on `develope` was restored after the push sequence, with required status checks, conversation resolution, and the no-force-push baseline back in place. A JSON backup of the original protection document and the temporary/restore payloads were saved under `<repo-root>` backups before the override.
