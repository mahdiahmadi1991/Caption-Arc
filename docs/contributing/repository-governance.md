# Repository Governance Standard

> Graph-preserving workflow
>
> This version replaces the earlier linear-history / squash-oriented policy.
> It is designed to preserve branch topology so the Git graph remains visually similar to a classic integration-branch workflow.

This document defines the governance model for this repository when development is performed by a single human developer with AI agents assisting implementation.

High-priority implementation rule for all future threads:
- This repository has no real release/deployment history yet.
- AI agents must not add migration code, compatibility fallbacks, dual-write storage, legacy aliases, legacy-path discovery, or backward-compatibility shims unless the human owner explicitly requests that mechanism in the active thread.
- In the absence of that explicit request, touched systems must converge on one canonical shape, path, and contract; obsolete alternatives must be removed instead of preserved.

It is the canonical policy for:
- Git workflow
- branch model
- merge discipline
- versioning and tagging
- release readiness and release execution
- repository hygiene
- AI-agent behavioral constraints related to repository management

This policy intentionally favors a **readable branch graph** over a fully linear history.

---

## 1. Governance goals

This repository must remain:
- **releasable from `main`**
- **easy to inspect visually in the Git graph**
- **traceable from feature branch -> develop -> main -> tag -> release**
- **safe for AI-assisted development**
- **consistent in versioning and release semantics**
- **free of speculative migration scaffolding unless the owner explicitly requests it**

For this repository, Git history is treated as a first-class project artifact.
The graph should communicate how work flowed, not hide it.

---

## 2. Target Git graph model

The desired graph model is the following:

- `main` is the release branch
- `develop` is the long-lived integration branch
- feature work is created in short-lived `feature/*` branches from `develop`
- feature branches are merged into `develop` with explicit merge commits
- releases happen by merging `develop` into `main` with an explicit merge commit
- release tags are created on the corresponding merge commit on `main`
- after release, `develop` should be realigned to the released state before new feature work continues

This policy explicitly prefers preserving branch topology.

---

## 3. Repository operating model

### 3.1 Ownership model

- There is one human owner/developer.
- AI agents may assist with research, planning, implementation, documentation, testing, and release preparation.
- AI agents are not the source of truth for repository policy. They must follow repository governance.
- AI agents must not add migration code, compatibility fallbacks, dual-write storage, legacy aliases, or backward-compatibility shims unless the human owner explicitly requests that mechanism in the active thread.

### 3.2 Long-lived branches

Allowed permanent branches:
- `main`
- `develop`

Branch meanings:
- `main` = stable release line
- `develop` = integration line for upcoming work

Rules:
- `main` must stay release-ready
- `develop` may contain the next releasable integration state
- work should not be developed directly on either branch under normal circumstances

### 3.3 Short-lived branches

Every meaningful change should use a short-lived topic branch.

Recommended naming:
- `feature/<short-slug>`
- `fix/<short-slug>`
- `refactor/<short-slug>`
- `docs/<short-slug>`
- `chore/<short-slug>`
- `hotfix/<short-slug>` for urgent fixes that must start from `main`

Rules:
- branch from `develop` for normal work
- branch from `main` only for urgent hotfixes
- one concern per branch
- keep branches short-lived
- delete branches after merge

---

## 4. Merge topology policy

### 4.1 Core rule

This repository does **not** optimize for a linear history.
It optimizes for a graph that visibly shows:
- where feature work started
- where it was integrated
- when integration was released

### 4.2 Merge method

Normal merges into `develop` and `main` must preserve merge commits.

Preferred approach:
- merge commits with `--no-ff`

Normal policy:
- do **not** squash feature branches into `develop`
- do **not** rebase-merge feature branches into `develop`
- do **not** require linear history on `develop` or `main`

The merge commit itself is part of the governance model because it records the integration event.

### 4.3 Integration path

Normal path:
1. create topic branch from `develop`
2. implement and validate work
3. merge topic branch into `develop` with a merge commit
4. repeat for additional topics
5. when ready to release, merge `develop` into `main` with a merge commit
6. create release tag on the resulting `main` merge commit
7. realign `develop` to the released state

### 4.4 Develop branch realignment after release

After merging `develop` into `main` for a release, `develop` should not drift from the released state unnecessarily.

Preferred post-release behavior:
- fast-forward `develop` to the release merge commit if possible, or
- merge `main` back into `develop` if needed

Goal:
- both long-lived branches should share the released commit as the new baseline before subsequent feature work diverges again

This is important if you want the graph to resemble the example style where `main` and `develop` often meet again at release points.

---

## 5. Pull request policy

Even in a solo-maintainer repository, pull requests are the standard integration checkpoint.

Recommended PR directions:
- topic branch -> `develop`
- `develop` -> `main`
- `hotfix/*` -> `main`
- after hotfix release, merge `main` back into `develop`

Every PR should include:
- purpose of the change
- linked ExecPlan path when applicable
- impacted areas
- validation performed
- documentation impact
- business-doc impact when product/business-sensitive behavior changed
- behavior-contract impact when runtime/system behavior changed
- release impact
- version bump rationale when targeting `main`

Draft PRs are encouraged while work is still evolving.

---

## 6. Commit and merge message conventions

### 6.1 Topic branch commits

Within topic branches, use meaningful commits.
Recommended style:
- `feat(scope): summary`
- `fix(scope): summary`
- `refactor(scope): summary`
- `docs(scope): summary`
- `chore(scope): summary`

### 6.2 Merge commit messages

To preserve a graph similar to the desired example, merge commit messages should remain explicit and predictable.

Recommended patterns:
- `Merge branch 'feature/<name>' into develop`
- `Merge branch 'fix/<name>' into develop`
- `Merge branch 'hotfix/<name>' into main`
- `Merge branch 'develop'`
- `Merge branch 'main' into develop` when realigning after a hotfix or release

Do not rewrite merge commit messages into vague summaries when the merge event itself is part of the repository story.

---

## 7. Plan-first requirement

- Non-trivial code/behavior work must follow `docs/contributing/execution-plans.md`.
- The relevant ExecPlan must exist before significant implementation begins.
- When a plan is required, the merge path should be traceable from branch/PR to plan document.

---

## 8. Versioning standard

### 8.1 Versioning model

Use Semantic Versioning.

Format:
- `MAJOR.MINOR.PATCH`
- Git tag format: `vMAJOR.MINOR.PATCH`

Interpretation:
- increment **MAJOR** for incompatible public changes
- increment **MINOR** for backward-compatible features
- increment **PATCH** for backward-compatible fixes

### 8.2 Canonical version source

This repository must have one canonical version source.

For a browser-extension repository, the preferred canonical source is the shipped artifact version definition, such as the extension manifest version used in packaging.

Any secondary version locations must remain synchronized.

### 8.3 Release version timing

This repository keeps the earlier rule:
- every merge from `develop` into `main` is a release event
- every merge into `main` must correspond to one version and one matching tag

That means:
- no unversioned merge to `main`
- no untagged merge to `main`
- no version drift between tag, release, and canonical version source

---

## 9. Tagging standard

### 9.1 Tag creation rule

Every merge into `main` must result in exactly one release tag on the resulting `main` merge commit.

Required format:
- `vX.Y.Z`

Examples:
- `v0.9.0`
- `v1.2.4`

### 9.2 Tag type

Use annotated tags for official releases.

Preferred if operationally available:
- signed annotated tags

Fallback:
- unsigned annotated tags

Do not use lightweight tags for official releases.

### 9.3 Tag immutability

Release tags are immutable.

Rules:
- do not move existing release tags
- do not delete existing release tags except in a documented incident-recovery case
- do not reuse version numbers
- if a release is wrong, publish a new version

---

## 10. Release standard

### 10.1 Release path

The normal release path is:
1. integrate work into `develop`
2. validate `develop`
3. bump the release version appropriately
4. merge `develop` into `main` with a merge commit
5. create annotated tag `vX.Y.Z` on that merge commit
6. create a GitHub Release from the tag
7. if applicable, publish the browser extension package that matches that version
8. realign `develop` to the released baseline

### 10.2 Release readiness criteria

A release merge must not occur unless all applicable conditions are true:
- the version bump is correct
- relevant checks pass
- release notes/changelog material is ready
- docs are updated
- permissions/security/privacy implications are understood
- packaging/build path is valid
- distribution implications are understood

### 10.3 Release notes

Every release should describe:
- features
- fixes
- breaking changes
- migration or upgrade notes
- security/privacy changes when relevant
- known limitations if important

### 10.4 GitHub Releases

Recommended:
- create one GitHub Release per `vX.Y.Z` tag
- keep the GitHub Release version identical to the Git tag
- use generated release notes only after review/editing if necessary

---

## 11. Hotfix policy

When an urgent production fix is needed:
1. create `hotfix/<short-slug>` from `main`
2. implement and validate the fix
3. merge `hotfix/*` into `main` with a merge commit
4. tag the resulting `main` merge commit with the next release version
5. create the GitHub Release
6. merge `main` back into `develop` so the hotfix is not lost

Do not apply hotfixes only on `main` without propagating them back to `develop`.

---

## 12. Required repository wiring

Documentation alone does not enforce governance.
The repository should also be configured to support this workflow.

### 12.1 GitHub merge settings

Recommended repository settings:
- allow **merge commits**
- disable squash merge
- disable rebase merge
- enable automatic deletion of head branches after merge

These settings align the platform behavior with the intended graph topology.

### 12.2 `main` branch ruleset

Create a ruleset targeting `main` with, at minimum:
- require pull request before merging
- block force pushes
- block deletions
- require conversation resolution before merging
- require required status checks once CI exists
- do **not** require linear history

### 12.3 `develop` branch ruleset

Create a ruleset targeting `develop` with, at minimum:
- require pull request before merging, if you want the same integration ceremony for features
- block force pushes
- block deletions
- require status checks if `develop` serves as the integration gate
- do **not** require linear history

### 12.4 Tag ruleset

Create a tag ruleset targeting `v*` with, at minimum:
- restrict updates
- restrict deletions
- allow creation only through your approved workflow or your own account/app

### 12.5 Automation expectations

Recommended automation responsibilities:
- validate canonical version consistency
- validate that release merges into `main` have the correct version bump
- validate required docs/release notes presence where applicable
- create the annotated release tag on the resulting `main` merge commit, or fail if policy is violated
- optionally create the GitHub Release automatically

---

## 13. AI-agent governance rules

Any AI agent operating in this repository must follow these rules:

1. Do not change the branch model unless explicitly instructed.
2. Normal work branches from `develop`, not `main`.
3. Do not squash-merge normal work when the graph-preserving workflow is required.
4. Use explicit merge-commit-oriented integration behavior.
5. Do not merge to `main` unless the change is release-ready.
6. Do not tag arbitrary commits; release tags belong on the release merge commit on `main`.
7. For non-trivial code/behavior work, follow `docs/contributing/execution-plans.md`.
8. For documentation changes, follow `docs/contributing/documentation-standards.md`.
9. For repository operations, follow this governance document.
10. If automation, documentation, and local state disagree, stop and surface the inconsistency.

### 13.1 AI-agent release behavior

Unless a task explicitly includes release execution, agents may prepare release-related changes but should not assume they are authorized to publish or tag outside the approved workflow.

If automation handles tagging or release creation, the agent must not invent a parallel release process.

---

## 14. Solo-maintainer practicality rule

This workflow is intentionally structured but still optimized for one developer.

That means:
- PRs exist for traceability, not bureaucracy
- approvals are optional unless collaborators are added later
- graph readability is intentionally prioritized
- feature integration is visible in Git history
- every release to `main` remains versioned and tagged

---

## 15. Definition of done for repository management

A change affecting repository behavior is not complete unless all applicable conditions are true:
- it followed the approved branch path
- merge topology remains consistent with this governance model
- the resulting graph stays readable
- version bump is correct
- tag matches version exactly
- release notes/changelog material is prepared
- relevant docs were updated
- merged topic branches are deleted
- no release-tag immutability rule was violated

---

## 16. Governance change policy

Changes to this document should be rare and intentional.

When updating this governance standard:
- explain why the old policy is insufficient
- explain what new graph behavior is desired
- update `AGENTS.md` references if needed
- update related standards if impacted

This document is the repository-level source of truth for branch topology, Git governance, tagging, and release discipline.
