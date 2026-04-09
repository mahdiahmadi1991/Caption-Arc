# Repository Governance Standard

This document defines the governance model for this repository when development is performed by a single human developer with AI agents assisting implementation.

It is the canonical policy for:
- Git workflow
- branch and merge discipline
- versioning and tagging
- release readiness and release execution
- repository hygiene
- AI-agent behavioral constraints related to repository management

This standard is intentionally stricter than an ad hoc solo workflow.
The goal is to keep the repository auditable, releasable, easy to reason about, and visually clean in Git history.

---

## 1. Governance goals

This repository must remain:
- **releasable from `main` at all times**
- **easy to inspect in Git history**
- **safe for AI-assisted development**
- **traceable from idea -> plan -> implementation -> merge -> tag -> release**
- **consistent in versioning and release semantics**

For this repository, Git history is treated as a product artifact, not just a storage mechanism.

---

## 2. Repository operating model

### 2.1 Ownership model

- There is one human owner/developer.
- AI agents may assist with research, planning, implementation, documentation, testing, and release preparation.
- AI agents are not the authority on release decisions; they operate within repository policy.

### 2.2 Repository model

- `main` is the **protected release branch**.
- Every change that reaches `main` must be intentional, traceable, versioned, and releasable.
- Direct pushes to `main` are not part of the normal workflow.
- Work must be developed in short-lived topic branches and merged into `main` through a pull request, even for a solo-maintainer repository.

### 2.3 Plan-first requirement

- Non-trivial work must follow the planning standard in `docs/contributing/plans-standard.md`.
- The relevant ExecPlan must exist before significant implementation begins.
- The pull request must be traceable to its plan when a plan is required.

---

## 3. Branching standard

### 3.1 Permanent branches

Allowed long-lived branches:
- `main` only

Avoid maintaining multiple long-lived branches unless a later governance revision explicitly introduces them.

### 3.2 Short-lived topic branches

Every non-trivial change should use a topic branch.

Recommended naming:
- `feat/<short-slug>`
- `fix/<short-slug>`
- `refactor/<short-slug>`
- `docs/<short-slug>`
- `chore/<short-slug>`
- `release/<version-or-short-slug>` only when a dedicated release-preparation branch is genuinely needed

Rules:
- one concern per branch
- branches should be short-lived
- avoid stacked unrelated work in one branch
- rebase or update the branch before merge if needed
- delete the branch after merge

### 3.3 Emergency changes

Emergency changes should still prefer a short-lived `fix/...` branch and a PR.
Only bypass the normal flow when production recovery is time-critical and the delay would cause more harm than the policy violation.
Any emergency bypass must be documented immediately afterward.

---

## 4. Pull request standard for a solo-maintainer repository

Even with one developer, pull requests are required for normal work because they provide:
- a checkpoint before merge
- a natural place for plan/reference links
- a stable review artifact
- a cleaner audit trail
- better compatibility with repository rules and automation

Every PR should include:
- purpose of the change
- linked ExecPlan path when applicable
- summary of affected areas
- validation performed
- documentation impact
- release impact
- version bump rationale when version changes

Recommended PR lifecycle:
1. open PR from topic branch into `main`
2. keep it draft while implementation is incomplete
3. convert to ready when checks pass and docs are updated
4. merge using the approved merge method
5. allow automatic branch deletion after merge

---

## 5. Git history standard ("beautiful graph" policy)

The repository history should be easy to read from top to bottom.

### 5.1 Preferred merge strategy

**Preferred default: Squash merge only.**

Rationale:
- keeps `main` visually linear
- collapses noisy branch-level commits into one deliberate history entry
- makes revert and release inspection easier
- works well for solo-maintainer + AI-assisted workflows

Alternative allowed only by explicit policy change:
- rebase merge

Disallowed as the normal default:
- merge commits into `main`

### 5.2 Main branch history rules

- `main` should remain linear
- each merge to `main` should correspond to one intentional history entry
- merge noise, WIP clutter, and fixup chains should stay off `main`
- topic branches may contain iterative commits, but the final `main` history should remain curated

### 5.3 Commit message discipline on `main`

Because `main` is release-facing history, the squash commit message or final merged commit title must be meaningful.

Recommended format:
- `feat(scope): concise summary`
- `fix(scope): concise summary`
- `refactor(scope): concise summary`
- `docs(scope): concise summary`
- `chore(scope): concise summary`

Avoid vague messages such as:
- `update`
- `changes`
- `fix stuff`
- `final`
- `wip`

---

## 6. Versioning standard

### 6.1 Versioning model

Use **Semantic Versioning** for repository releases.

Format:
- `MAJOR.MINOR.PATCH`
- Git tag format: `vMAJOR.MINOR.PATCH`

Interpretation:
- increment **MAJOR** for incompatible public changes
- increment **MINOR** for backward-compatible features
- increment **PATCH** for backward-compatible bug fixes

### 6.2 Canonical version source

This repository must have **one canonical source of truth for the release version**.

For a browser-extension repository, the preferred source of truth is:
1. the shipped extension version field in the release artifact definition (for example the manifest used to package the extension)
2. any secondary tooling version file must be synchronized to that canonical version

Rules:
- the canonical version must match the Git tag
- the canonical version must match the release version
- do not allow version drift between tag, release, and shipped artifact metadata

### 6.3 Version bump timing

For this repository, every merge to `main` must follow one of these two models:

**Model A - Release-on-merge (recommended here):**
- every merge to `main` produces a releasable version
- the merged commit on `main` gets a new version and a matching tag

**Model B - Staging-on-main (not recommended for this repository):**
- some merges to `main` are unreleased and tags are created later

This governance standard adopts **Model A**.

That means:
- no unversioned merge to `main`
- no untagged merge to `main`
- no tag without a corresponding versioned state in the repository

### 6.4 Version bump responsibility

Before merge, the change must already contain the correct version bump or use an approved automation that performs it deterministically.

Version bump selection must not be guessed casually.
It must reflect the actual change type.

---

## 7. Tagging standard

### 7.1 Tag policy

Every merge to `main` must result in exactly one release tag on the merged `main` commit.

Required format:
- `vX.Y.Z`

Examples:
- `v0.4.2`
- `v1.0.0`

### 7.2 Tag type

Use **annotated tags** for releases.

Preferred if your environment supports it safely:
- signed annotated tags

Fallback if signing is not yet operational:
- unsigned annotated tags

Do not use lightweight tags for official releases.

### 7.3 Tag immutability

Release tags are immutable.

Rules:
- do not move existing release tags
- do not delete release tags except for a documented incident recovery scenario
- do not reuse a released version number
- if a released version is wrong, publish a new version

### 7.4 Tag metadata

Each release tag should include a meaningful annotation message, for example:
- release version
- short summary
- PR number or change reference if useful

---

## 8. Release standard

### 8.1 Release model

For this repository, a release is the combination of:
- a versioned state on `main`
- a matching release tag
- release notes or changelog material sufficient to understand what changed
- a build artifact that is ready for packaging/publishing when applicable

### 8.2 Release readiness criteria

A change must not be merged to `main` unless all applicable release conditions are satisfied:
- correct version bump applied
- tests/checks appropriate to the change pass
- relevant docs updated
- release impact understood
- permissions/security/privacy implications reviewed when relevant
- packaging/build path remains valid
- user-visible changes are described in release notes/changelog material

### 8.3 Release notes standard

Every release should have notes that are understandable without reading the diff.

Release notes should cover, as applicable:
- new features
- bug fixes
- refactors with user or maintainer impact
- breaking changes
- migration or upgrade notes
- security/privacy changes
- known limitations

### 8.4 GitHub Release policy

Recommended:
- create a GitHub Release for every official `vX.Y.Z` tag
- keep the GitHub Release version identical to the Git tag
- use auto-generated release notes only if they are reviewed and, if needed, edited for clarity

### 8.5 Store or distribution release alignment

If the extension is distributed through a browser store or another channel:
- the published artifact version must match the Git tag
- the published artifact version must match the canonical repository version source
- release notes should align with what was shipped

---

## 9. Merge-to-release contract

This repository adopts the following contract:

**Every successful merge to `main` is a release event.**

That means the following sequence should hold:
1. topic branch work is completed
2. PR is prepared and validated
3. version is bumped correctly
4. PR is merged to `main`
5. merged `main` commit receives annotated tag `vX.Y.Z`
6. GitHub Release is created from that tag
7. optional external distribution/publishing is performed from that versioned state

No merge to `main` should be left in an ambiguous "maybe release later" state.

---

## 10. Required repository protections and automation wiring

Documentation alone does not enforce governance.
The repository should also be wired with platform controls.

### 10.1 GitHub merge settings

Recommended repository settings:
- allow **squash merge**
- disable merge commits for PRs into `main`
- disable rebase merge unless you explicitly prefer it over squash merge
- enable automatic deletion of head branches after merge

### 10.2 Main branch ruleset

Create a branch ruleset targeting `main` with, at minimum:
- require pull request before merging
- require linear history
- block force pushes
- block deletions
- require conversation resolution before merging
- require required status checks once CI is in place

For a solo-maintainer repository, required approvals are optional.
A PR can still be valuable without a separate reviewer because it preserves process and traceability.

### 10.3 Tag ruleset

Create a tag ruleset targeting `v*` with, at minimum:
- restrict tag updates
- restrict tag deletions
- allow creation only through your approved workflow or your own account/app

### 10.4 CI/automation expectations

Recommended automation responsibilities:
- validate version consistency across canonical version file(s)
- validate that PRs targeting `main` include version bump when required
- validate docs/update requirements when applicable
- create the annotated release tag on merge to `main`, or fail if the tag/version policy is violated
- optionally create the GitHub Release from the tag

### 10.5 Signed tags and commits

Recommended where feasible:
- sign release tags
- sign commits on protected branches

If signing is not operational yet, do not block repository adoption of this policy. Start with annotated tags and add signing later.

---

## 11. AI-agent governance rules

Any AI agent operating in this repository must follow these rules:

1. Do not change Git workflow policy unless explicitly instructed.
2. Do not create new long-lived branches.
3. Do not push directly to `main` as part of normal work.
4. Do not merge work into `main` without satisfying versioning and documentation requirements.
5. Do not create or move release tags casually.
6. Do not publish or simulate a release version without checking the canonical version source.
7. For non-trivial work, follow `docs/contributing/plans-standard.md`.
8. For documentation updates, follow `docs/contributing/documentation-standards.md`.
9. For repository operations, follow this governance document.
10. If automation and documentation disagree, stop and surface the inconsistency.

### 11.1 AI-agent release behavior

Unless a task explicitly includes release execution, agents should prepare release-related changes but not assume they are authorized to publish or tag without the prescribed workflow.

If repository automation performs tagging/release creation, the agent must not invent a parallel manual process.

---

## 12. Solo-maintainer practical policy

Because this is a one-developer project, the process must stay strict but not bureaucratic.

Therefore:
- PRs are required for traceability, not for ceremony
- approvals are optional unless you later add collaborators
- squash merge is preferred to keep `main` elegant
- every merge to `main` is intentionally versioned and tagged
- release automation should reduce repetitive work, not obscure it

---

## 13. Definition of done for repository management

A change affecting repository behavior is not complete unless all applicable conditions are true:
- the work landed through the approved Git flow
- `main` history remains clean and linear
- version bump is correct
- tag matches version exactly
- release notes/changelog material is prepared
- relevant docs were updated
- topic branch is deleted after merge
- no mutable release tag policy was violated

---

## 14. Governance change policy

Changes to this document should be rare and intentional.

When updating this governance standard:
- explain why the old policy is insufficient
- explain what new behavior is expected
- update `AGENTS.md` references if needed
- update related docs such as planning or documentation standards if impacted

This document is the repository-level source of truth for Git governance, tagging, and release discipline.
