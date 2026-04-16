# License Release And Public Repo Hardening

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Align the repository's public license to `AGPL-3.0-or-later`, integrate the ongoing monetization-readiness documentation into `develope`, publish only the release-ready relicensing subset to `main` under a proper versioned release, and harden the public GitHub repository configuration so future public-repo operations are safer by default.

## Problem Statement

The working tree currently contains uncommitted monetization-readiness documentation and repository relicensing changes on `develope`.

The user wants:

- the working changes merged into `develope`
- only the relicensing/release-ready subset promoted to `main`
- the result pushed to GitHub
- stricter public-repository settings enabled on GitHub

Repository governance adds constraints:

- normal work should flow through topic branches
- merges into `main` are release events
- every `main` merge must carry a version bump and matching annotated tag
- merge commits must be preserved

## Scope

- create a topic branch for the current work and merge it into `develope` with a merge commit
- create a release-ready hotfix branch from `main` carrying only the relicensing subset
- bump the canonical version for the `main` release
- update release notes/changelog for the `main` release
- merge the hotfix into `main` with a merge commit
- create and push an annotated release tag
- realign `develope` with the released `main` baseline
- enable stricter GitHub repository settings and rulesets for this public repository

## Non-Goals

- implement the monetization website or backend
- choose the final Merchant of Record provider
- rewrite legal terms for paid subscriptions
- clean up all historical CI failures unrelated to this release

## Repository Context

- `docs/contributing/repository-governance.md`
- `docs/operations/release-runbook.md`
- `CHANGELOG.md`
- `package.json`
- `wxt.config.ts`
- `LICENSE`
- `README.md`
- `.github/workflows/docs-guardrails.yml`
- `.github/workflows/quality-gates.yml`
- `.github/workflows/release.yml`
- `docs/contributing/execution-plans/active/2026-04-14-monetization-readiness-foundation.md`
- `docs/product/monetization-readiness-checklist.md`

## Constraints

- preserve merge commits
- do not merge all `develope` documentation work into `main`
- keep version/tag alignment exact for the `main` release
- keep GitHub hardening compatible with the repository's graph-preserving workflow
- avoid force pushes and history rewrites

## Risks and Unknowns

- current GitHub Actions `Quality Gates` runs are failing on recent pushes, so required-check rulesets could block future merges if enabled carelessly
- GitHub license detection and release automation will update only after remote pushes
- selective promotion from `develope` to `main` requires careful branch choreography to avoid leaking extra docs into the release branch
- release build or tag push could fail if local version sources drift
- `main` may be too stale to accept a meaningful release-only subset without first receiving the current repository baseline

## Documentation Impact

- create this execution plan
- update `docs/contributing/execution-plans/active/README.md`
- update `CHANGELOG.md`
- add `docs/operations/release-notes/release-1.3.1.md`
- keep the monetization-readiness docs in sync with the branch/release actions executed here

## Testing and Coverage Impact

- run `pnpm docs:check`
- run `pnpm build:chrome:production`
- run `pnpm build:firefox:production`
- rely on GitHub release workflow to rebuild packaged artifacts after tag push

## Milestones

### Milestone 1 - Capture The Work On A Topic Branch

Create a short-lived topic branch from `develope`, commit the current monetization-readiness and relicensing work there, and merge it back into `develope` with an explicit merge commit.

Verification:

- the topic branch has a clean commit history for this concern
- `develope` contains the merged work via `--no-ff`

### Milestone 2 - Publish A Release-Ready Relicensing Hotfix

Create a `hotfix/*` branch from `main` containing only the relicensing subset plus the required release-version metadata and release notes, then merge it into `main` with a merge commit.

Verification:

- `main` receives only relicensing/release files, not the full monetization planning docs
- canonical version sources match
- changelog and release note exist for the release

### Milestone 3 - Tag And Push The Release

Create an annotated `v1.3.1` tag on the `main` release merge commit and push `develope`, `main`, and the tag.

Verification:

- `main` points at the release merge commit
- annotated tag `v1.3.1` exists on that merge commit
- remote branches and tag are updated

### Milestone 4 - Realign Develope

Merge `main` back into `develope` so the released baseline is shared again.

Verification:

- `develope` contains the `main` release merge and version bump
- no release-only changes are lost

### Milestone 5 - Harden The Public GitHub Repository

Enable public-repo settings and rulesets that align with repository governance:

- preserve merge-commit workflow
- block force pushes and branch deletions
- require PRs on `main`
- protect `v*` tags
- enable relevant public security features

Verification:

- repository merge settings match governance
- rulesets exist for `main`, `develope`, and `v*`
- security settings reflect the chosen hardening level

## Verification

- `pnpm docs:check`
- `pnpm build:chrome:production`
- `pnpm build:firefox:production`
- `git tag -n`
- `gh api repos/mahdiahmadi1991/Caption-Arc/rulesets`

## Progress

- [x] Create and index the execution plan
- [x] Capture current work on a topic branch and merge to `develope`
- [ ] Prepare the `main` hotfix release subset with version bump and notes
- [ ] Run local verification for docs and production builds
- [ ] Merge the hotfix to `main`, tag, and push
- [ ] Realign `develope` with `main`
- [x] Apply GitHub public-repo hardening settings

## Surprises and Discoveries

- Observation: `develope` is the current default branch on GitHub.
  Evidence: `gh repo view --json defaultBranchRef`
- Observation: No rulesets are currently configured on the GitHub repository.
  Evidence: `gh api repos/mahdiahmadi1991/Caption-Arc/rulesets`
- Observation: GitHub Actions check-run names are currently `docs-check` and `quality-checks`.
  Evidence: `gh api repos/mahdiahmadi1991/Caption-Arc/commits/765d86a/check-runs`
- Observation: `main` is currently 28 commits behind `develope` and does not contain the repository's active baseline.
  Evidence: `git rev-list --left-right --count origin/main...origin/develope`
- Observation: The repository already had classic branch protection on `develope`, but not equivalent required status checks on `main`.
  Evidence: `gh api repos/mahdiahmadi1991/Caption-Arc/branches/develope/protection`, `gh api repos/mahdiahmadi1991/Caption-Arc/branches/main/protection`

## Decision Log

- Decision: Use a topic branch for the in-progress working tree on `develope`.
  Rationale: This satisfies the repository's normal-work branch discipline before integrating back into `develope`.
  Date/Author: 2026-04-14 / Codex
- Decision: Use a `hotfix/*` branch from `main` for the selective release of only the relicensing subset.
  Rationale: The user explicitly requested promotion of only the license-related subset to `main`, and governance provides `hotfix/*` as the supported way to branch from `main`.
  Date/Author: 2026-04-14 / Codex
- Decision: Pause the `main` release path until the user confirms how to handle the stale `main` baseline.
  Rationale: With `main` 28 commits behind `develope`, promoting only the relicensing subset is not technically coherent without either releasing the current baseline or intentionally restructuring `main`.
  Date/Author: 2026-04-14 / Codex
- Decision: Harden the repository immediately through repository settings, security features, and stricter classic branch protection.
  Rationale: These protections are independently useful and do not require resolving the stale-`main` release decision first.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Interim 2026-04-14 state:

- current monetization and relicensing work was committed on `chore/monetization-license-foundation`
- that topic branch was merged into `develope` with a merge commit and pushed
- repository merge settings were confirmed/aligned to merge-commit workflow
- `dependabot_security_updates`, vulnerability alerts, and private vulnerability reporting were enabled
- `main` and `develope` now both require `docs-check` and `quality-checks`, enforce admin protection, and block force pushes and deletions
- release promotion to `main` is paused pending an explicit decision on how to handle the stale `main` branch baseline
