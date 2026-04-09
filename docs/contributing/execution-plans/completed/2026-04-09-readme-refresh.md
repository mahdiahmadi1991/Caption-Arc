# Refresh Root README For Product Landing Clarity

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Replace the current root `README.md` with a stronger GitHub landing page that stays fully grounded in repository evidence while improving product clarity, trust, and non-technical readability.

## Problem Statement

The current README is accurate but utilitarian. It does not yet present CaptionArc as a polished, trust-building landing page for new visitors, evaluators, or stakeholders. The repository already contains richer product, privacy, compatibility, and visual evidence that should be reflected in the root README.

## Scope

- inspect repository evidence needed for README claims
- rewrite `README.md` for product-first positioning without speculative claims
- incorporate existing branding and demo assets where appropriate
- add an explicit assumptions and TODOs appendix for anything not fully verifiable
- record this documentation work in an active execution plan

## Non-Goals

- changing product behavior or code
- creating new UI assets or screenshots
- inventing roadmap details not already supported by repository docs
- changing canonical docs outside the plan and root README unless required for documentation indexing

## Repository Context

- `README.md`
- `package.json`
- `wxt.config.ts`
- `docs/product/overview.md`
- `docs/product/use-cases.md`
- `docs/architecture/overview.md`
- `docs/architecture/manifest-and-permissions.md`
- `docs/security/privacy-disclosure-notes.md`
- `docs/quality/compatibility-matrix.md`
- `docs/operations/store-listing.md`
- `docs/setup/local-development.md`
- `docs/setup/environment-and-config.md`
- `docs/assets/images/branding/github-banner.png`
- `.github/workflows/quality-gates.yml`
- `.github/workflows/release.yml`

## Constraints

- all README claims must be supported by code, config, docs, assets, or workflows in the repository
- privacy and browser-support wording must match the current implementation and browser gating
- documentation must remain public-safe and avoid machine-local details
- root README should prioritize non-technical readers in the upper half while staying credible for technical readers later
- links must remain relative and valid

## Risks and Unknowns

- some marketing assets may reflect older copy such as language counts or privacy phrasing that no longer matches current docs
- release and install language must stay aligned with actual build outputs and workflow artifacts
- optional cloud-sync differences between Chrome and Firefox must be described precisely to avoid overpromising parity

## Documentation Impact

- update `README.md`
- update `docs/contributing/execution-plans/active/README.md`
- update `docs/contributing/execution-plans/completed/README.md`
- keep this execution plan current during the task

## Testing and Coverage Impact

- no code tests are expected because the change is documentation-only
- run `pnpm docs:check`
- manually review README image paths and relative links

## Milestones

### Milestone 1 - Gather Product And Trust Evidence

Inspect repository files that define product scope, supported browsers, permissions, privacy boundaries, installation flow, and existing visuals. Verify which claims are safe and note any gaps that must become TODOs instead of assertions.

Completed. Repository evidence was gathered from code, config, docs, assets, and workflows before editing the README.

### Milestone 2 - Rewrite README As A Product Landing Page

Replace the existing README with a structured, scannable document that explains the problem, user value, verified features, high-level workflow, privacy/trust boundaries, compatibility, quick start, developer details, and contribution/license information.

Completed. The new README now uses the repository banner and live demo image, shifts the upper half to product and trust messaging, and keeps developer details later in the document.

### Milestone 3 - Validate Documentation Contract

Run the repository documentation check, then update this plan with outcomes, decisions, and any remaining manual review items.

Completed. `pnpm docs:check` passed after the README rewrite.

## Verification

- `pnpm docs:check` -> passed, `Documentation validation passed (136 markdown files scanned).`
- manual spot-check performed on README relative image and documentation links during authoring

## Progress

- [x] Inspect repository evidence for product, privacy, compatibility, setup, and visuals
- [x] Rewrite `README.md`
- [x] Run documentation validation
- [x] Record final outcomes in this plan

## Surprises and Discoveries

- Observation: The repository already contains a GitHub banner and a screenshot asset suitable for README use.
  Evidence: `docs/assets/images/branding/github-banner.png` and the now-removed README demo image were both available during authoring.
- Observation: Core product support covers Chrome and Firefox, but Google Drive and OneDrive cloud sync are intentionally gated off on Firefox.
  Evidence: `docs/quality/compatibility-matrix.md`, `entrypoints/shared/browser-capabilities.ts`
- Observation: Current architecture docs explicitly warn against claiming that all meeting data always stays local.
  Evidence: `docs/architecture/overview.md`, `docs/security/privacy-disclosure-notes.md`
- Observation: Some older visual assets still carried legacy branding or older positioning copy, so only the banner and a current screenshot were suitable for direct README use.
  Evidence: legacy documentation screenshots were excluded during the README audit because their branding and positioning copy lagged the current docs.

## Decision Log

- Decision: Prefer repository-backed product docs and architecture/security docs over promotional design copy when wording conflicts.
  Rationale: README accuracy has higher priority than visual marketing copy that may lag implementation.
  Date/Author: 2026-04-09 / GitHub Copilot
- Decision: Use only the current GitHub banner and a single current screenshot in the rewritten README.
  Rationale: Other available visual assets included legacy product naming or statements that were less reliable as current public-facing evidence.
  Date/Author: 2026-04-09 / GitHub Copilot

## Outcomes and Retrospective

The root README was rewritten as a more polished, product-grade landing page without adding speculative claims. The new version emphasizes user value, supported meeting platforms, verified privacy boundaries, Chrome and Firefox compatibility details, quick-start steps, and later developer guidance. The documentation contract validation passed, and the README now includes an explicit assumptions and TODOs appendix for unresolved public-facing gaps such as the minimal roadmap and lack of official browser-store install links.
