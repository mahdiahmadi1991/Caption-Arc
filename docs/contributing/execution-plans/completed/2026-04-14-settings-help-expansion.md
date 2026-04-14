# Expand Settings Help Coverage

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Expand the reusable settings help-popover pattern across the options page so more advanced fields, especially the Meeting AI controls, have localized plain-language guidance directly in context.

## Problem Statement

The first help-popover rollout established the reusable component and covered a small subset of advanced fields, but important high-complexity controls remain undocumented in-place. The Meeting AI area in particular exposes several nuanced controls that are likely confusing without guidance.

## Scope

- Audit the options page for additional complex or high-risk controls that would benefit from contextual help.
- Add help popovers to the selected fields, with emphasis on Meeting AI controls and other advanced settings.
- Add localized markdown help content for every shipped UI locale.
- Run focused validation and fresh Chrome/Firefox development builds before handoff.

## Non-Goals

- Adding help to every single field regardless of complexity.
- Reworking settings layout or changing settings behavior.
- Introducing remote or dynamic help content.

## Repository Context

- Shared help component: `entrypoints/shared/help-popover.tsx`
- Options page: `entrypoints/options/App.tsx`
- Reusable option controls: `entrypoints/options/components/*.tsx`
- Locale catalogs: `entrypoints/shared/i18n/messages/*.ts`
- Prior help-popover docs: `docs/architecture/ui-i18n-strategy.md`, `docs/features/ui/ui-i18n-implementation-guide.md`

## Constraints

- Keep help content compact enough for popovers.
- Maintain localization parity across all shipped locales.
- Preserve the existing project visual language and interaction model.
- Produce fresh development builds for Chrome and Firefox before handoff.

## Risks and Unknowns

- Over-annotating the page could increase visual noise.
- Adding many new help strings increases the chance of i18n shape drift if not validated carefully.
- Some controls may look complex but still not justify persistent help; selection should stay curated.

## Documentation Impact

- Update docs only if the implementation introduces a new help-authoring pattern or meaningful governance change.

## Testing and Coverage Impact

- Run targeted shared UI tests.
- Run relevant i18n tests because locale catalogs change.
- Run `pnpm docs:check`.
- Run `pnpm test:google`.
- Run `pnpm test:google:coverage`.
- Run fresh Chrome and Firefox development builds.

## Milestones

### Milestone 1 - Audit settings help coverage

Review current options controls and choose additional fields that genuinely benefit from inline help.

### Milestone 2 - Wire expanded help coverage

Add help popovers to the selected controls across options, especially Meeting AI.

### Milestone 3 - Localize and validate

Add locale content, run tests, docs checks, and fresh development builds.

## Progress

- [x] Audit remaining settings fields and choose expanded help coverage.
- [x] Wire the new help popovers in options controls.
- [x] Add locale content and run validation/builds.

## Surprises and Discoveries

- Bulk-editing locale help content was more error-prone than the React wiring because template-literal markdown needs careful escaping across many catalogs.
- The repo currently has unrelated branch-wide TypeScript and coverage instability outside this change scope, so targeted validation was more reliable than a repository-wide `tsc --noEmit` signal.

## Decision Log

- Decision: keep help expansion curated instead of universal.
  Rationale: the options page should stay scannable; only fields with real comprehension cost should gain popovers.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

- Added contextual help to additional high-complexity settings, with emphasis on Meeting AI and adjacent settings that are easy to misread.
- Newly covered fields include UI language, overlay click-through, meeting output language, meeting profile name/description, summary controls, and the full Meeting AI control set.
- Localized `options.help.*` content was added for every shipped UI locale.
- Validation passed for `pnpm docs:check`, targeted UI/i18n Vitest suites, `pnpm test:google`, and fresh Chrome/Firefox development builds.
- `pnpm test:google:coverage` failed in existing diagnostics collector tests (`DIAG-COL-005`, `DIAG-COL-006`) that are outside the settings-help change surface.
