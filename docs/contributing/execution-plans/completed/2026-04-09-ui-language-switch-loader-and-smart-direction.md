# UI Language Switch Loader And Smart Direction

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Polish the UI i18n experience so language switching feels intentional and text direction behaves correctly across localized and user-authored content. Done means the options page shows the existing full-page loader immediately when the UI language changes, remaining RTL alignment defects are fixed, and user-entered or infrastructure-derived text uses a content-aware direction instead of blindly inheriting the UI locale direction.

## Problem Statement

The current options language switch waits too long before showing loading feedback, which makes the transition feel laggy. Some Persian UI surfaces still render left-aligned because they use physical alignment classes instead of logical ones. Separately, several user-entered values and runtime/infrastructure strings inherit RTL when the UI locale is Persian even when the actual content is English, which produces incorrect visual direction.

## Scope

- show the existing locale loading screen immediately when `uiLanguage` changes in options
- ensure the immediate loader clears correctly on successful locale application and on failed immediate-save paths
- add or consolidate shared smart-direction helpers for dynamic text
- apply smart direction to relevant options and meeting-history user/data-driven fields
- replace remaining obvious physical text alignment classes with logical alignment where they break RTL behavior
- add focused regression coverage
- run the required tests and a fresh development build

## Non-Goals

- redesign the loading screen or dropdown visuals
- rewrite all localization copy
- redesign unrelated form layouts or spacing
- change logging policy outside what is necessary for the locale-switch flow

## Repository Context

- `entrypoints/options/main.tsx`
- `entrypoints/options/use-settings.ts`
- `entrypoints/options/App.tsx`
- `entrypoints/options/components/text-area.tsx`
- `entrypoints/options/components/api-key-input.tsx`
- `entrypoints/options/diagnostics-console.tsx`
- `entrypoints/shared/i18n/runtime.ts`
- `entrypoints/shared/i18n/react.tsx`
- `entrypoints/shared/i18n/loading-screen.tsx`
- `entrypoints/shared/dropdown-select.tsx`
- `entrypoints/shared/language-metadata.ts`
- `entrypoints/shared/text-direction.ts`
- `entrypoints/meeting-history/components/session-detail.tsx`
- `entrypoints/meeting-history/components/session-list.tsx`
- `tests/google-meet/*.contract.test.ts`

## Constraints

- preserve the existing pretty loading screen instead of introducing a second loading pattern
- do not regress settings autosave behavior for non-`uiLanguage` settings
- keep user-facing direction smart while leaving developer-facing diagnostics untouched
- use shared helpers where practical instead of duplicating direction logic

## Risks and Unknowns

- an immediate loader event without a matching abort path could leave the options page stuck if the immediate save fails
- broad alignment changes can unintentionally shift compact layouts if applied too widely
- dynamic text direction can look unstable if applied to purely empty or whitespace-only fields

## Documentation Impact

- execution plan only unless implementation reveals a reusable direction/input rule that should be documented

## Testing and Coverage Impact

- add a focused contract test for the `uiLanguage` immediate-switch behavior
- add a focused contract test for the shared smart-direction helper
- keep existing i18n/runtime tests green
- run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - `pnpm build:development`

## Milestones

### Milestone 1 - Immediate Locale Switch Feedback

Implement an immediate start/abort/success flow for options locale switching so the loading screen appears as soon as the dropdown selection changes and disappears once the locale finishes applying. Acceptance signal: the options page no longer waits for delayed autosave before showing the loader, and failures do not leave the page stuck in a loading state.

### Milestone 2 - Smart Direction And RTL Cleanup

Consolidate smart-direction helpers and apply them to user/data-driven text while replacing remaining alignment classes that break RTL rendering. Acceptance signal: Persian UI surfaces use logical alignment, and English content entered under Persian UI remains visually LTR where appropriate.

### Milestone 3 - Regression Coverage And Validation

Add focused tests for the new event flow and text-direction helper, then run the required validation commands. Acceptance signal: the regression suite and development build pass with the new behavior.

## Verification

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm build:development`

## Progress

- [x] Inspect current locale-switch flow, shared loading screen, and smart-direction usage
- [x] Implement immediate locale-switch loader flow
- [x] Apply smart-direction and RTL alignment fixes
- [x] Add focused regression tests
- [x] Run validation
- [ ] Move this plan to `completed/`

## Surprises and Discoveries

- Observation: the options page already has the right loading-screen component and locale-ready state, but it only flips after the storage-driven locale application path starts.
  Evidence: `entrypoints/options/main.tsx`
- Observation: several remaining RTL defects come from shared or repeated `text-left` classes instead of missing `dir` attributes.
  Evidence: `entrypoints/shared/dropdown-select.tsx`, `entrypoints/options/App.tsx`, `entrypoints/options/diagnostics-console.tsx`, `entrypoints/meeting-history/components/session-detail.tsx`
- Observation: the loading screen itself sat below the shared dropdown portal because it used an absolute layer with a lower z-index than the menu portal.
  Evidence: `entrypoints/shared/i18n/loading-screen.tsx`, `entrypoints/shared/dropdown-select.tsx`

## Decision Log

- Decision: use an explicit locale-switch start/abort signal instead of trying to infer immediate loading exclusively from storage updates.
  Rationale: the loader must appear instantly on selection change, and the save path needs a way to clear loading if the immediate `uiLanguage` save fails before storage change propagation occurs.
  Date/Author: 2026-04-09 / Codex
- Decision: keep smart direction scoped to dynamic and user-entered content instead of forcing `dir="auto"` across all text.
  Rationale: localized UI copy should continue to follow the resolved locale direction, while user/infrastructure values need content-aware direction independent of UI locale.
  Date/Author: 2026-04-09 / Codex

## Outcomes And Retrospective

- The locale loading screen now mounts as a fixed high-priority layer and the options root explicitly toggles `localeReady` during start/abort, so a UI-language switch shows the existing loader immediately and keeps it above portal-rendered dropdown menus.
- Shared dropdown and the remaining obvious options/history controls now use logical `text-start` alignment, which resolves the Persian left-alignment defects seen in the UI language dropdown, section navigator, diagnostics launcher, and export menu controls.
- Smart direction now backs dynamic text rendering in profile identity fields, profile list/editor summaries, cloud-sync device/provider/runtime values, textarea previews, and user-entered inputs such as profile fields and backup passphrase, while API keys stay explicitly LTR.
- Focused regression coverage was added in `tests/google-meet/options-ui-language-switch.contract.test.tsx` and `tests/google-meet/text-direction.contract.test.ts`.
- Validation passed:
  - `pnpm docs:check`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - `pnpm vitest run tests/google-meet/use-diagnostics-console.contract.test.ts`
  - `pnpm build:development`
