# Automated Release, Versioning, And Changelog Governance

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Introduce a professional, end-to-end release governance system that automates versioning, release notes, changelog maintenance, and Git tagging for CaptionArc while respecting the repository's long-lived `develop` and `main` branch model.

The target operating model is:

- `develop` automatically carries preview versions after integration changes land
- `main` is promoted through an explicit release PR
- merging the release PR to `main` automatically creates the stable tag, GitHub release, and packaged Chrome/Firefox artifacts
- version data remains canonical and internally consistent across package metadata, extension manifests, tags, changelog content, and release assets

## Problem Statement

The repository currently has partial release automation:

- `package.json` is the canonical version source for builds
- `wxt.config.ts` copies that version directly into the extension manifest
- release artifacts are built from tag pushes
- `CHANGELOG.md` and `docs/operations/release-notes/` are maintained manually

This creates several gaps:

- version bumps are not automated
- changelog entries are manual and can drift
- Git tags are manual
- release notes are split between GitHub-generated notes and repo-local markdown
- `develop` and `main` do not have a coherent shared versioning policy
- browser-extension manifest rules prevent using plain semver prerelease strings directly as the manifest version on `develop`
- the current `.release/` layout still version-prefixes development artifacts, which makes runtime tooling and documentation less stable than the desired environment-first contract

## Scope

- create a shared versioning utility that:
  - parses stable and preview semver values
  - derives a manifest-safe numeric extension version
  - derives a display-friendly extension `version_name`
  - computes next preview and stable versions from conventional commits
- update build/config code so extension manifests stay valid for preview builds on `develop`
- automate `develop` preview version bumps and preview tag creation
- automate stable release PR generation from `develop` to `main`
- automate stable tag creation, GitHub release publication, release-note body generation, and packaged asset upload after release merges to `main`
- make `CHANGELOG.md` the canonical in-repo changelog
- normalize canonical artifact paths so:
  - development builds emit to `.release/development/<browser>`
  - production builds and packaged assets emit to `.release/production/<version>/<browser>`
- reduce or retire duplicate repo-local per-release note files where appropriate
- document the new workflow and commit conventions

## Non-Goals

- publish to browser extension stores automatically
- introduce package-manager publication
- rewrite the repository's full historical changelog beyond the level needed to support the new automation baseline
- rework unrelated CI or branch-governance areas that do not affect release/versioning automation

## Repository Context

- `package.json`
- `wxt.config.ts`
- `CHANGELOG.md`
- `.github/workflows/quality-gates.yml`
- `.github/workflows/release.yml`
- `scripts/release/validate-release-config.mjs`
- `scripts/release/package-target.mjs`
- `scripts/start-windows-chrome-debug.sh`
- `scripts/manual-smoke/ensure-cdp-ready.sh`
- `docs/contributing/repository-governance.md`
- `docs/contributing/development-workflow.md`
- `docs/architecture/build-packaging-and-release.md`
- `docs/operations/release-runbook.md`
- `docs/operations/release-notes/release-1.3.0.md`

## Constraints

- keep release/version/tag alignment exact
- preserve the repository's graph-preserving merge policy
- do not introduce hidden version sources that drift from the canonical package version model
- keep extension manifests valid for Chromium-family browsers and Firefox
- do not commit secrets or machine-local release metadata
- keep automation compatible with the repository's dual-target Chrome/Firefox packaging model

## Risks and Unknowns

- `main` is currently behind `develop`, so the first adoption of the new release PR flow must tolerate an outdated stable branch baseline
- action-created pull requests do not always trigger downstream workflows when authenticated only with the default `GITHUB_TOKEN`
- preview semver strings must be mapped carefully so manifest versions remain numeric and monotonically increasing for local test builds
- release-note generation must avoid duplicating the same source of truth across GitHub Releases, `CHANGELOG.md`, and docs

## Documentation Impact

- create this execution plan
- update `docs/contributing/execution-plans/active/README.md`
- update `docs/contributing/repository-governance.md`
- update `docs/contributing/development-workflow.md`
- update `docs/architecture/build-packaging-and-release.md`
- update `docs/operations/release-runbook.md`
- update `docs/operations/README.md`
- add `docs/operations/release-notes/README.md`
- update `CHANGELOG.md` usage guidance if needed

## Testing and Coverage Impact

- add unit/contract coverage for shared versioning and changelog-generation logic
- run:
  - `pnpm docs:check`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - any recommended targeted tests
  - `pnpm build:target:chrome:development`
  - `pnpm build:target:firefox:development`

## Milestones

### Milestone 1 - Establish Shared Versioning Rules

Create a reusable versioning module that can:

- parse canonical package versions
- compute preview and stable release targets
- map preview versions to extension-safe numeric manifest versions
- generate release-note/changelog sections from commit history

Verification:

- version utility tests cover stable, preview, and release-impact cases
- `wxt.config.ts` can derive a valid manifest version from preview package versions

### Milestone 2 - Automate The Develop Preview Train

Add workflow and scripts so pushes to `develop` can:

- compute the next preview version
- create a preview version bump commit when needed
- create a matching preview tag and GitHub prerelease
- keep the preview versioning model deterministic

Verification:

- develop automation skips self-trigger loops
- preview tags follow the configured naming format
- no preview build produces an invalid manifest version

### Milestone 3 - Automate Stable Release PRs To Main

Add workflow and scripts so the repository can create or update a release PR from the current `develop` state to `main`, with:

- stable version finalization
- canonical changelog updates
- release-note body generation for the eventual GitHub release

Verification:

- generated release branch targets `main`
- stable version differs correctly from preview version
- `CHANGELOG.md` updates are deterministic and reviewable

### Milestone 4 - Publish Stable Tags And Assets From Main

Add workflow automation so merging a release PR to `main` can:

- create the stable annotated tag automatically
- create the GitHub release automatically
- package Chrome and Firefox artifacts
- upload those assets to the stable release

Verification:

- tag format is `vX.Y.Z`
- GitHub release body matches the canonical changelog section
- release assets come from the governed package commands

### Milestone 5 - Document And Validate The New Release Standard

Align the repository governance and contributor docs with the new operating model.

Verification:

- docs reflect the preview/stable split clearly
- duplication between changelog and repo-local release-note docs is resolved or explicitly scoped
- local validation commands pass

## Verification

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- recommended targeted tests
- `pnpm build:target:chrome:development`
- `pnpm build:target:firefox:development`

## Progress

- [x] Inspect current release, version, tag, and workflow state
- [x] Create and index the execution plan
- [x] Implement shared versioning and changelog utilities
- [x] Wire develop preview automation and main release PR automation
- [x] Wire stable release publication, tagging, and asset upload
- [x] Update governance/docs and run validation

## Surprises and Discoveries

- Observation: `package.json` is already the effective canonical version source, and `wxt.config.ts` reads it directly into the extension manifest.
  Evidence: `package.json`, `wxt.config.ts`
- Observation: Chromium-family extension manifests require one to four dot-separated integers for `version`, while `version_name` can carry descriptive prerelease text.
  Evidence: Chrome manifest version docs, MDN `version` and `version_name` docs
- Observation: `develop` is ahead of `main`, and `main` does not currently contain the active repository baseline.
  Evidence: `git branch -vv`, `git log --graph --decorate --simplify-by-decoration --all`
- Observation: unreleased history after `v1.3.0` already contains a few legacy non-conventional commit subjects.
  Evidence: `pnpm release:commits:check -- --base v1.3.0 --head HEAD`
- Observation: development runtime tooling only needs a stable browser-specific path, while production packaging still benefits from a versioned artifact directory.
  Evidence: `scripts/start-windows-chrome-debug.sh`, `scripts/manual-smoke/ensure-cdp-ready.sh`, `docs/setup/local-development.md`

## Decision Log

- Decision: Use a preview/stable split instead of trying to store plain prerelease semver directly in the manifest `version`.
  Rationale: browser-extension manifests require numeric versions, but package/release semantics still benefit from preview semver identifiers.
  Date/Author: 2026-04-21 / Codex
- Decision: Make `CHANGELOG.md` the canonical in-repo changelog and keep GitHub Releases as the canonical published release-note surface.
  Rationale: this avoids per-release markdown duplication while still preserving human-readable release history in-repo.
  Date/Author: 2026-04-21 / Codex
- Decision: Treat legacy non-conventional commits in unreleased history as minimum patch input instead of dropping them from the first automated release train.
  Rationale: the repository has pre-automation commits after `v1.3.0`, and ignoring them would make the first generated release/changelog incomplete.
  Date/Author: 2026-04-21 / Codex
- Decision: Use an environment-first `.release/` topology where development artifacts are unversioned and production artifacts remain versioned beneath `.release/production/<version>/<browser>`.
  Rationale: debug/runtime tooling wants a stable development path, while release packaging and published assets still need version-isolated production outputs.
  Date/Author: 2026-04-21 / Codex

## Outcomes and Retrospective

Implemented:

- shared release/versioning utilities under `scripts/release/`
- manifest-safe version mapping in `wxt.config.ts`
- canonical artifact topology:
  - development -> `.release/development/<browser>`
  - production -> `.release/production/<version>/<browser>`
- unified `CI` workflow with `docs-check` and `quality-checks` jobs
- commit-governance validation in `quality-gates.yml`
- `release-train.yml` for develop preview bumps, preview tags/prereleases, and stable release PR creation
- revised `release.yml` for stable release publication from `main`
- updated runtime tooling, packaging helpers, governance, runbook, and setup docs to the environment-first release layout

Validation completed:

- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm test:targeted:plan`
- `pnpm exec vitest run tests/google-meet/release-versioning.contract.test.ts`
- `pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts`
- `pnpm release:commits:check -- --base 65294eb --head HEAD`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:target:chrome:development`
- `pnpm build:target:firefox:development`
- `pnpm build:target:chrome:production`
- `pnpm build:target:firefox:production`
- `pnpm package:target:chrome`
- `pnpm package:target:firefox`

Additional runtime note:

- `pnpm chrome:smoke:live google-meet meeting` confirmed the new development artifact path resolves during CDP bootstrap, but the run remained blocked by the active profile-managed debug browser because no CaptionArc service worker was active (`chrome.runtime.sendMessage unavailable`).
