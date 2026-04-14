# Add Settings Help Popovers

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Add a reusable, project-native help-popover pattern to the Settings page so complex options can explain themselves in plain language without bloating the main form layout.

## Problem Statement

The Settings page already carries several advanced controls whose labels and short descriptions are not always enough for first-pass comprehension. The current UI has simple tooltips, but not a richer click-triggered help surface that can carry compact markdown guidance, examples, and localized longer-form explanation for complex settings.

## Scope

- Introduce a reusable shared help-popover component aligned with the existing extension visual language.
- Support markdown content, compact typography, max/min sizing, and animated show/hide transitions.
- Wire the new component into a curated subset of genuinely complex Settings fields.
- Localize all new trigger and help content for every shipped UI locale.
- Add focused automated coverage for the new base component and keep docs in sync where the i18n/content pattern changes.

## Non-Goals

- Annotating every settings field.
- Replacing the existing plain tooltip pattern across the whole product.
- Adding remote help content or documentation fetching.

## Repository Context

- Shared tooltip/theme/icon primitives: `entrypoints/shared/tooltip.tsx`, `entrypoints/shared/app-theme.css`, `entrypoints/shared/icons.tsx`
- Options controls: `entrypoints/options/components/*.tsx`
- Settings page composition: `entrypoints/options/App.tsx`
- Locale catalogs: `entrypoints/shared/i18n/messages/*.ts`
- UI i18n docs: `docs/architecture/ui-i18n-strategy.md`, `docs/features/ui/ui-i18n-implementation-guide.md`
- Shared UI tests: `tests/google-meet/shared-ui-controls.contract.test.ts`

## Constraints

- The new surface must feel native to the existing project theme and icon language.
- Markdown content must stay visually compact and not overwhelm the settings page.
- The new help content must be localized for all shipped locales, not just English and Persian.
- Fresh Chrome and Firefox development builds are required before handoff.

## Risks and Unknowns

- Over-annotating fields could make the page noisier instead of clearer.
- A hover-only interaction would not satisfy the requirement for richer, persistent help content.
- Markdown copy in locale catalogs adds a new content shape that should be documented so future updates stay consistent.

## Documentation Impact

- Update `docs/architecture/ui-i18n-strategy.md`
- Update `docs/features/ui/ui-i18n-implementation-guide.md`

## Testing and Coverage Impact

- Add/update focused UI control coverage for the new help popover.
- Run relevant i18n contract tests because all shipped locale catalogs change.
- Run `pnpm test:targeted:plan`
- Run targeted Vitest commands
- Run `pnpm docs:check`
- Run `pnpm test:google`
- Run `pnpm test:google:coverage`
- Build fresh Chrome and Firefox development bundles

## Milestones

### Milestone 1 - Build the reusable help surface

Create the shared icon-triggered popover with compact markdown rendering, positioning, outside-click/escape dismissal, and transitions.

### Milestone 2 - Wire curated settings fields

Integrate the popover into a controlled subset of complex settings controls and section-specific fields.

### Milestone 3 - Localize and document

Add all locale copy and document the new markdown help-content pattern for settings UI.

### Milestone 4 - Validate and close

Run tests, docs validation, dev builds, and move the plan to `completed/` when done.

## Progress

- [x] Inspect current shared tooltip/i18n/component structure and register the plan.
- [x] Implement the reusable help-popover component and wire selected settings fields.
- [x] Add locale markdown help content and sync docs.
- [x] Add/update tests and run verification.

## Surprises and Discoveries

- A partial implementation already existed in the worktree when this task resumed: the shared `HelpPopover` component, option-control wiring, and base styles were present, but locale coverage was incomplete and the new behavior had not been fully validated.
- The repository-wide diff-scope targeted-test planner surfaced many unrelated recommendations because the worktree already contained pre-existing changes outside this task. Validation therefore focused on the targeted UI/i18n coverage directly relevant to the help-popover work, plus the full Google Meet Vitest suite and coverage run.

## Decision Log

- Decision: use a click-triggered popover rather than extending the existing hover tooltip.
  Rationale: the requested content is longer-form markdown guidance and needs persistence, scrollability, and explicit dismissal behavior.
  Date/Author: 2026-04-14 / Codex
- Decision: keep help content scoped to a curated set of complex settings instead of annotating every field.
  Rationale: the options page already carries dense structure; adding help only to high-friction controls preserves scanability while still improving comprehension where labels alone are insufficient.
  Date/Author: 2026-04-14 / Codex
- Decision: store rich help copy as localized markdown under `options.help.*` and shared popover chrome under `common.helpPopover.*`.
  Rationale: this keeps the reusable component content-driven, preserves typed i18n shape parity, and gives future settings help a predictable authoring pattern.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

- Delivered a reusable shared help popover with project-native iconography, compact markdown rendering, escape/outside-click dismissal, fixed-layer positioning, and animated open/close transitions.
- Wired the help surface into the selected complex settings controls on the options page, including model selection, live-translation instructions, capture startup behavior, caption activation behavior, session continuation window, archive retention, and meeting-chat retention.
- Added localized help-popover chrome and field-level markdown content for all shipped UI locales: `en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`.
- Added focused shared UI coverage for portal rendering, markdown output, and escape dismissal.
- Updated the UI i18n strategy and implementation guide to document the new `common.helpPopover.*` and `options.help.*` authoring pattern.

Verification:

- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm exec vitest run tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm vitest run tests/google-meet/ui-i18n.contract.test.ts`
- `pnpm vitest run tests/google-meet/i18n-runtime.contract.test.ts`
- `pnpm vitest run tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`
- `pnpm vitest run tests/google-meet/use-diagnostics-console.contract.test.ts`
- `pnpm vitest run tests/google-meet/diagnostics-viewer.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:all:development`
