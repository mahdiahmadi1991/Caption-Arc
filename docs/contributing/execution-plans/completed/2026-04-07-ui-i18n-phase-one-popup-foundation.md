# Implement UI I18n Phase 1 Popup Foundation

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Implement the Phase 1 UI i18n foundation described by the repository strategy so CaptionArc can resolve a device-local UI language, provide one shared typed translator for React and non-React surfaces, and render the popup through that translator with correct `lang` and `dir`.

## Problem Statement

Popup UI copy is currently hardcoded and there is no shared UI locale runtime, no dedicated local `uiLanguage` setting, and no typed message catalog structure. Without this foundation, later options, history, and overlay localization phases would likely fork translation logic or conflate UI locale with caption translation language.

## Scope

- create the shared i18n core under `entrypoints/shared/i18n/`
- add local device `uiLanguage: "system" | "en" | "fa"` support to settings types, defaults, normalization, and persistence
- keep `uiLanguage` out of shared synced settings and portable export/import settings payloads
- add thin React integration with `I18nProvider`, `useI18n()`, and `useT()`
- migrate popup UI copy in `entrypoints/popup/App.tsx` to `popup.*` and `common.*` keys
- set popup root `lang` and `dir` from the resolved locale in `entrypoints/popup/main.tsx`
- update directly related popup support code only where required for localized popup integration
- add or update scoped tests for the new locale and translator behavior if needed for repository quality gates

## Non-Goals

- migrate options UI strings
- migrate meeting history UI strings
- migrate content overlay or prompt strings
- add `_locales` or manifest metadata localization
- add an external i18n dependency
- refactor unrelated popup or settings behavior
- move translation target language handling into the UI i18n layer

## Repository Context

- `docs/architecture/ui-i18n-strategy.md`
- `docs/features/ui/ui-i18n-implementation-guide.md`
- `docs/contributing/execution-plans.md`
- `docs/templates/execution-plan-template.md`
- `entrypoints/popup/App.tsx`
- `entrypoints/popup/main.tsx`
- `entrypoints/shared/theme-toggle.tsx`
- `entrypoints/shared/settings-defaults.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/background/data-transfer.ts`
- `entrypoints/background/cloud-sync/providers/index.ts`
- `entrypoints/background/cloud-sync/serialization.ts`
- `entrypoints/shared/language-metadata.ts`
- `package.json`
- `tests/google-meet/**`

## Constraints

- follow repository evidence over prompt assumptions when they conflict
- keep docs ASCII-only and public-safe
- keep `uiLanguage` local device state only
- fallback locale must remain `en`
- React pages must consume the translator through the shared i18n API rather than raw catalog imports
- popup migration must preserve current behavior and structure
- no `any`

## Risks and Unknowns

- `PortableSettings` currently omits explicit local fields only, so adding `uiLanguage` without updating that contract would leak device-local state into export/import payloads
- popup depends on `ThemeToggle`, which currently embeds hardcoded labels that may need an optional localization hook to avoid leaving popup-facing strings untranslated
- the repository instruction file references `docs/contributing/plans-standard.md`, but that file is absent in the workspace; implementation will rely on the existing `docs/contributing/execution-plans.md` policy and template instead
- tests currently run through `tests/google-meet`, so any new coverage for shared i18n behavior must fit the existing Vitest setup or be justified by direct validation commands

## Documentation Impact

- create this execution plan under `docs/contributing/execution-plans/active/`
- update `docs/api/storage-schema.md` to record that `uiLanguage` is local-only device state
- update this plan during implementation and move it to `docs/contributing/execution-plans/completed/` when finished
- review whether current canonical docs already cover the new `uiLanguage` storage/runtime behavior; update any affected canonical doc only if repository evidence shows a gap

## Testing and Coverage Impact

- run `pnpm docs:check` because canonical docs changed
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan` and execute relevant recommended targeted commands for popup or settings changes
- run `pnpm build:development`
- keep any added tests scoped to locale resolution, translation fallback, or popup integration behavior changed here

## Milestones

### Milestone 1 - Add Shared Locale And Translation Core

Create the typed locale model, English and Persian popup-scope catalogs, locale resolution helpers, translator creation, and React provider/hooks in `entrypoints/shared/i18n/`. Verification: TypeScript build usage compiles, locale resolution supports `system`, `en`, and `fa`, directionality resolves to `ltr` or `rtl`, and missing non-English keys fall back to English.

### Milestone 2 - Wire Device-Local UI Language Setting

Extend settings types, defaults, normalization, and persistence so `uiLanguage` is stored under local device settings only and invalid stored values normalize to `system`. Verification: background settings normalization accepts only `system`, `en`, or `fa`, state splitting keeps `uiLanguage` in `local`, and portable/shared settings paths do not include it.

### Milestone 3 - Migrate Popup To Shared Translator

Replace popup hardcoded copy with catalog keys, pass localized labels to shared popup dependencies as needed, and apply root `lang` and `dir`. Verification: popup uses `useT()`, no direct catalog imports exist in popup components, and hardcoded popup-facing strings are removed from migrated popup code.

### Milestone 4 - Validate, Close, And Archive The Plan

Run required tests and build validation, record outcomes and follow-ups, then move the plan to completed. Verification: required commands finish successfully or any directly relevant failure is recorded with evidence and scope.

## Verification

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- relevant targeted commands recommended for popup or settings changes
- `pnpm build:development`

Expected observations:

- shared i18n code compiles cleanly
- popup renders with locale-aware `lang` and `dir`
- local-only `uiLanguage` persistence does not leak into shared or portable settings flows

Recorded outcomes:

- `pnpm docs:check` -> passed
- `pnpm test:google` -> passed (12 files, 90 tests)
- `pnpm test:google:coverage` -> passed (`All files`: 11.81% statements, 6.85% branches, 10.49% functions, 11.97% lines)
- `pnpm test:targeted:plan` -> passed; recommended `pnpm test:google` and `pnpm chrome:smoke:provider google-meet lobby`
- `pnpm chrome:smoke:provider google-meet lobby` -> failed because the configured Chrome executable path `/mnt/c/path/to/chrome.exe` was missing after CDP checks; treated as environment/setup failure rather than code regression
- `pnpm build:development` -> passed

## Progress

- [x] Inspect repository docs, popup code, settings persistence, and related shared UI helpers
- [x] Create the shared i18n foundation files
- [x] Add local `uiLanguage` settings plumbing and normalization
- [x] Migrate popup copy and root locale wiring
- [x] Add or update scoped tests as needed
- [x] Run required validation commands
- [x] Finalize notes and move the plan to completed

## Surprises and Discoveries

- Observation: `docs/contributing/plans-standard.md` is referenced by repository instructions but does not exist in the workspace.
  Evidence: direct file read failed while `docs/contributing/execution-plans.md` and `docs/templates/execution-plan-template.md` do exist.
- Observation: popup-localized integration likely needs a small `ThemeToggle` extension because that shared component currently embeds theme labels and group text internally.
  Evidence: `entrypoints/shared/theme-toggle.tsx`
- Observation: portable settings export is allowlist-by-omission, so `uiLanguage` must be explicitly excluded when added as local state.
  Evidence: `entrypoints/background/types/index.ts`
- Observation: `docs/api/storage-schema.md` is the canonical storage-schema index and needed an explicit boundary note for `uiLanguage` after the settings change landed.
  Evidence: `docs/api/storage-schema.md`

## Decision Log

- Decision: treat `docs/contributing/execution-plans.md` as the canonical planning source for this implementation instead of the missing `docs/contributing/plans-standard.md` reference.
  Rationale: repository evidence requires preferring existing canonical files over prompt or instruction references that do not exist.
  Date/Author: 2026-04-07 / Copilot
- Decision: localize popup setup and summary state copy through catalog-backed generic status text instead of rendering raw OpenAI or summary-status service messages directly.
  Rationale: the existing shared status helpers currently emit English-only strings, and Phase 1 needs popup copy to flow through the new translator without expanding scope into repository-wide status-message refactors.
  Date/Author: 2026-04-07 / Copilot
- Decision: extend `ThemeToggle` with optional external labels rather than making it depend on the new i18n context directly.
  Rationale: popup needs localized theme labels now, while options remains out of scope for Phase 1 and can continue using the component defaults unchanged.
  Date/Author: 2026-04-07 / Copilot

## Outcomes and Retrospective

Completed implementation:

- added the shared UI i18n foundation under `entrypoints/shared/i18n/`
- added local-only `uiLanguage` defaults, typing, normalization, and persistence plumbing
- kept `uiLanguage` out of shared synced settings and portable data-transfer payloads
- migrated popup copy, accessibility labels, theme-toggle labels, and popup root locale attributes to the shared translator
- added scoped i18n contract tests
- updated the canonical storage schema doc for the new local settings boundary

What changed from the original plan:

- the implementation needed one additional shared UI helper update (`ThemeToggle`) so popup-specific theme labels could be localized without pulling options migration into Phase 1
- the implementation needed one canonical docs update beyond the execution plan because the storage schema index describes settings boundaries

What remains:

- Phase 2 options migration
- Phase 3 meeting history migration
- Phase 4 overlay migration
- Phase 5 browser metadata localization through `_locales`

Post-completion correction note (2026-04-07):

- popup runtime detail messages were restored after the initial Phase 1 popup i18n migration so unavailable OpenAI setup states and active or failed summary states once again show their real runtime-generated detail when present

Phase 2 carry-forward note:

- keep using the shared i18n core
- do not replace runtime-generated detail messages with generic localized copy unless there is a repository-wide localization plan for those message producers
- when migrating options and meeting history, preserve user-visible diagnostic detail in the same way