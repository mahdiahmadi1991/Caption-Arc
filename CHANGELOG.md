# Changelog

All notable repository releases are recorded here.

The format follows the repository governance contract:

- every `main` release step is versioned
- every `main` release step has a matching annotated Git tag
- the changelog summarizes what changed without requiring diff inspection
## Unreleased

- No unreleased stable changes.

## 1.4.0 - 2026-04-21

### Added

- assistant: expand coverage and harden DLS
- release: automate preview and stable release governance
- quick-access: add soft refresh recovery control
- assistant: harden runtime, overlay, and DLS coverage
- cloud-sync: harden browser-aware sync and provider auth
- settings: roll up meeting profiles, help popovers, and env split
- runtime: sync meeting assistant lifecycle, providers, docs, and tests
- add summary completion notifications
- legal: harden compliance and terms gating

### Fixed

- release: normalize artifact output layout
- release: use rest api for release pr sync
- ci: skip commit lint on release pull requests
- release: push release branch directly from develop
- ci: ignore preview tag pushes in guardrails
- ci: stabilize release-train and smoke-launch checks
- ui: restore legal risk dialog portal behavior
- summary: dedupe automatic segment summaries

### Changed

- product: record release artifact layout
- ci: unify docs and quality workflow orchestration
- manifest: use spaced extension display name
- runtime: align response typing and terms-gate coverage
- governance: align branch naming to develop
- runtime: harden chrome debug and DLS automation
- i18n: enforce shipped locale catalog sync
- release: harden build env and repository governance
- product: refresh monetization readiness foundation
- product: add monetization readiness foundation
- rollback temporary Radix PoC and remove dependencies
- marketing: refresh public positioning and brand assets
- plans: archive public repository bootstrap plan
- governance: adopt graph-preserving branch workflow
## 1.3.0 - 2026-04-09

### Added

- Final governed local bootstrap release alignment for the repository at version `1.3.0`.
- A completed execution-plan record for the bootstrap process and a revised `release-1.3.0.md` note that explains the final repository state.

### Changed

- Archived the active bootstrap execution plan into the completed-plan index.
- Confirmed the final tagged state against docs, tests, coverage, and dual-browser production builds.

## 1.2.0 - 2026-04-09

### Added

- Canonical README indexes for `docs/assets/images/` and its public-safe image subdirectories.
- A versioned place for future sanitized design, branding, origin, and GitHub-facing documentation imagery.

## 1.1.0 - 2026-04-09

### Added

- Repository-local Codex configuration tuned for long-thread work on this codebase.
- A public-safe `docs/assets/` index to reserve documentation asset storage under version control.

## 1.0.3 - 2026-04-09

### Added

- GitHub Actions workflows for docs guardrails, quality gates, and tagged release packaging.
- Repository instruction files for GitHub Copilot and docs-focused markdown editing.

## 1.0.2 - 2026-04-09

### Added

- Vitest configuration and setup wiring for repository-level contract testing.
- Contract coverage for diagnostics, browser capability selection, UI i18n, popup/runtime details, Google Meet provider behavior, and smoke-launch utilities.

## 1.0.1 - 2026-04-09

### Added

- Repository governance, execution-planning, and documentation workflow standards.
- The remaining canonical `docs/` section indexes and templates needed for contributor navigation.
- Public-safe local secret scaffolding under `.secrets/.env.example`.

### Changed

- Tightened ignore rules for local editor and generated workspace files.
- Introduced the canonical changelog for versioned `main` history.

## 1.0.0 - 2026-04-09

### Added

- Core CaptionArc extension runtime, including background orchestration, content runtime, popup, options, and meeting-history entrypoints.
- Shared browser build configuration, packaging scripts, and Windows/WSL smoke tooling.
- Architecture, product, setup, quality, API, and security documentation for the initial governed runtime surface.
