# Release Versioning

This document defines the repository's automated versioning model for `develop` and `main`.

## Canonical Version Source

- `package.json` is the canonical repository version source.
- `wxt.config.ts` derives:
  - manifest `version`
  - manifest `version_name`
  from the canonical package version.

## Branch Version Tracks

### `develop`

`develop` carries preview versions in the form:

- `MAJOR.MINOR.PATCH-preview.N`

Examples:

- `1.3.1-preview.1`
- `1.4.0-preview.3`

Rules:

- every non-empty integration step on `develop` advances the preview train automatically
- the base stable target (`MAJOR.MINOR.PATCH`) is computed from conventional commits since the latest stable tag
- preview tags are created automatically as `vMAJOR.MINOR.PATCH-preview.N`
- preview GitHub releases are published as prereleases

### `main`

`main` carries stable release versions in the form:

- `MAJOR.MINOR.PATCH`

Examples:

- `1.3.1`
- `1.4.0`

Rules:

- stable releases are finalized only through the automated release PR targeting `main`
- merging that PR triggers stable tag creation, GitHub release publication, and packaged asset upload
- stable tags are created automatically as `vMAJOR.MINOR.PATCH`

## Manifest Version Mapping

Browser-extension manifests require a numeric `version`, but `develop` uses semver prerelease identifiers.

CaptionArc therefore maps package versions like this:

- package version `1.4.0` -> manifest `version: 1.4.0`, `version_name: 1.4.0`
- package version `1.4.0-preview.3` -> manifest `version: 1.4.0.3`, `version_name: 1.4.0-preview.3`

This keeps preview builds valid for Chromium-family browsers and Firefox while preserving readable preview semantics in the package version and displayed version name.

## Conventional Commit Impact

Release automation reads commit subjects and bodies using Conventional Commit rules.

Semver interpretation:

- `type!:` or `BREAKING CHANGE:` -> major
- `feat:` -> minor
- `fix:`, `perf:`, `refactor:` -> patch
- other conventional commit types still advance the release train with a minimum patch bump so the branch version changes on each governed integration or release event

Examples:

- `feat(summary): add release dashboard`
- `fix(runtime): restore notification navigation`
- `refactor(storage)!: rename archive schema`
- `docs(governance): update release runbook`

## Automation Surfaces

- [`.github/workflows/release-train.yml`](../../.github/workflows/release-train.yml)
  - updates `develop` preview versions
  - creates preview tags and prereleases
  - creates or updates the stable release PR targeting `main`
- [`.github/workflows/release.yml`](../../.github/workflows/release.yml)
  - validates the stable package version on `main`
  - creates the stable annotated tag
  - creates the stable GitHub release
  - packages and uploads Chrome/Firefox artifacts

## Token Recommendation

The release PR automation can operate with the default `GITHUB_TOKEN`, but GitHub may not run standard PR workflows for action-authored PRs created with that token.

Recommended:

- configure `RELEASE_AUTOMATION_TOKEN` with a PAT or GitHub App token that is allowed to create/update repository pull requests

If `RELEASE_AUTOMATION_TOKEN` is absent, the workflows fall back to `GITHUB_TOKEN`.
