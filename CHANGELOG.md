# Changelog

All notable repository releases are recorded here.

The format follows the repository governance contract:

- every `main` release step is versioned
- every `main` release step has a matching annotated Git tag
- the changelog summarizes what changed without requiring diff inspection

## Unreleased

- No unreleased changes.

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
