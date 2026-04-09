# Expand Live Translation Language Coverage

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Expand the live caption translation and summary target-language catalog so the extension can offer eight additional high-value languages across options, popup, meeting history, and in-meeting UI surfaces without breaking direction handling or existing language selectors.

## Problem Statement

The current shared language catalog only ships 19 target languages and does not include the next eight product-priority additions requested for live translation coverage: Bengali, Urdu, Filipino/Tagalog, Tamil, Ukrainian, Malay, Swahili, and Telugu. Because the catalog is shared across multiple surfaces, the implementation must update metadata, docs, and tests together.

## Scope

- Add the eight requested target languages to the shared language metadata.
- Preserve correct RTL/LTR direction metadata for the new languages.
- Ensure all selectors fed by `LANGUAGE_OPTIONS` pick up the new languages.
- Add or update tests that lock the expanded target-language catalog.
- Update docs that describe live translation language support.

## Non-Goals

- UI locale expansion or changes to UI i18n catalogs.
- Provider-specific speech recognition or ASR source-language changes.
- Model/prompt redesign for translation quality.
- Reordering the entire language list beyond inserting the new languages in a sensible, stable order.

## Repository Context

- `entrypoints/shared/language-metadata.ts`
- `entrypoints/options/components/constants.ts`
- `entrypoints/content/constants.ts`
- `entrypoints/content/overlay/header.ts`
- `entrypoints/shared/meeting-summary.ts`
- `entrypoints/options/App.tsx`
- `entrypoints/meeting-history/components/session-detail.tsx`
- `entrypoints/popup/App.tsx`
- `tests/google-meet/`
- `docs/features/ui/`
- `docs/api/storage-schema.md`

## Constraints

- Keep the change data-driven through the shared metadata source of truth.
- Avoid regressions in direction handling for translation output and summary output.
- Keep logs and diagnostics English-only.
- Update docs in the same change.
- Run the repository quality gate commands for code changes.

## Risks and Unknowns

- Some UI lists may assume the old catalog length or ordering.
- The best display names for some languages may need native-friendly but English-readable naming.
- There may be hidden test coverage gaps around language selector behavior.

## Documentation Impact

- Update any docs that describe supported live translation or summary languages.
- Record the expansion in the execution plan outcome.

## Testing and Coverage Impact

- Add or update a contract test for `LANGUAGE_OPTIONS`, name lookup, and direction lookup.
- Run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - relevant targeted tests if recommended
  - `pnpm build:development`

## Milestones

### Milestone 1 - Expand shared language metadata

Add the eight new language entries to the shared metadata source and verify all consumers receive the expanded list without requiring bespoke per-surface changes.

### Milestone 2 - Lock coverage with tests and docs

Add regression coverage for the expanded catalog and update docs so supported live translation languages are accurately documented.

## Verification

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- execute any recommended targeted tests relevant to language metadata
- `pnpm build:development`

## Progress

- [x] Inspect shared language metadata consumers and current catalog.
- [x] Expand the shared live-translation language catalog.
- [x] Add or update regression tests for the expanded catalog.
- [x] Update affected docs.
- [x] Run verification and archive the plan.

## Surprises and Discoveries

- Observation: `LANGUAGE_OPTIONS` is the single source of truth for options selectors, overlay selectors, popup labels, and meeting-history language menus.
  Evidence: `entrypoints/shared/language-metadata.ts`, `entrypoints/options/components/constants.ts`, `entrypoints/content/constants.ts`
- Observation: settings persistence and cloud-sync payload parsing previously accepted any arbitrary `targetLanguage` or `summaryLanguage` string.
  Evidence: `entrypoints/background/settings.ts`, `entrypoints/background/cloud-sync/serialization.ts`

## Decision Log

- Decision: Implement the feature via the shared language metadata contract instead of per-surface edits.
  Rationale: This keeps the change small, reviewable, and consistent across all existing translation language selectors.
  Date/Author: 2026-04-09 / Codex
- Decision: Add language-code normalization where settings and cloud-sync payloads enter the system.
  Rationale: Once supported translation languages are treated as a formal catalog, persisted and imported values should fall back safely instead of storing unsupported codes.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

- Result: added `bn`, `ur`, `tl`, `ta`, `uk`, `ms`, `sw`, and `te` to the shared live-translation language catalog with correct direction metadata.
- Result: added `normalizeLanguageCode(...)` and used it in settings persistence and cloud-sync shared-settings parsing so unsupported target-language values fall back safely.
- Result: added `tests/google-meet/language-metadata.contract.test.ts` to lock the expanded language inventory, name/direction lookup, selector propagation, and cloud-sync normalization behavior.
- Result: updated background/content/storage docs so supported target-language metadata has a clear canonical reference.
- Verification:
  - `pnpm vitest run tests/google-meet/language-metadata.contract.test.ts`
  - `pnpm test:targeted:plan`
  - `pnpm docs:check`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm build:development`
