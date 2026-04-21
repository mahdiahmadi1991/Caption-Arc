# Fix Popup I18n Runtime Detail Regressions

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Restore popup runtime-detail fidelity that regressed during Phase 1 UI i18n while keeping the shared i18n foundation intact. Done means popup setup and summary rows still use localized labels and fallback text, but real runtime detail messages from OpenAI availability and summary jobs are shown whenever present.

## Problem Statement

The initial popup i18n migration replaced some dynamic runtime detail with generic localized fallback copy. As a result, the popup no longer surfaces the real unavailable OpenAI message or the real active/failed summary job message even though those runtime producers still generate user-visible detail.

## Scope

- fix popup OpenAI unavailable description preference logic
- fix popup AI service tooltip preference logic
- fix popup active and failed summary row detail preference logic
- add focused regression tests for those popup behaviors
- add a short correction note and Phase 2 carry-forward note to the completed Phase 1 execution plan

## Non-Goals

- Phase 2 options migration
- meeting history migration
- overlay migration
- manifest localization
- new dependencies
- repository-wide localization of runtime message producers

## Repository Context

- `entrypoints/popup/App.tsx`
- `entrypoints/shared/openai-service.ts`
- `entrypoints/shared/summary-generation.ts`
- `docs/architecture/ui-i18n-strategy.md`
- `docs/features/ui/ui-i18n-implementation-guide.md`
- `docs/contributing/execution-plans/completed/2026-04-07-ui-i18n-phase-one-popup-foundation.md`
- `tests/google-meet/**`

## Constraints

- keep the fix popup-scoped
- preserve current UI structure and styling
- keep labels and fallback copy localized
- prefer runtime-generated detail when non-empty
- no `any`

## Risks and Unknowns

- popup regression tests need a small pure seam or helper export to stay focused without rendering the full popup
- documentation changes trigger repository docs validation even though code scope is small

## Documentation Impact

- create this short-lived execution plan and move it to completed when done
- update `docs/contributing/execution-plans/completed/2026-04-07-ui-i18n-phase-one-popup-foundation.md` with a correction note and Phase 2 carry-forward note
- update completed execution-plan index if needed

## Testing and Coverage Impact

- add or update focused regression tests for popup runtime detail handling
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan` and any directly relevant recommended command
- run `pnpm build:development`
- run `pnpm docs:check` because documentation changes are required

## Milestones

### Milestone 1 - Restore Popup Runtime Detail Selection

Reintroduce runtime detail preference in popup setup and summary sections while preserving localized labels and fallback copy. Verification: popup logic prefers `availability.message` for unavailable OpenAI state and prefers `SummaryJobStatus.message` for active or failed summary states when those strings are non-empty.

### Milestone 2 - Add Focused Regression Tests

Add a popup-scoped regression test that covers runtime-message preference and localized fallback behavior. Verification: tests assert the runtime message wins when present and the localized fallback wins only when runtime detail is absent.

### Milestone 3 - Validate And Record The Correction

Run required validation, update the completed Phase 1 plan with a short correction note and carry-forward note, and archive this plan. Verification: required commands pass or any directly relevant environment failure is recorded with scope.

## Verification

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- directly relevant recommended targeted command(s)
- `pnpm build:development`

Recorded outcomes:

- `pnpm docs:check` -> passed
- `pnpm test:google` -> passed (13 files, 94 tests)
- `pnpm test:google:coverage` -> passed (`All files`: 11.99% statements, 6.9% branches, 10.64% functions, 12.14% lines)
- `pnpm test:targeted:plan` -> passed; recommended `pnpm test:google` and `pnpm chrome:smoke:provider google-meet lobby`
- `pnpm chrome:smoke:provider google-meet lobby` -> failed because the configured Chrome executable path `/mnt/c/path/to/chrome.exe` was not found; treated as environment/setup failure rather than a popup runtime-detail regression
- `pnpm build:development` -> passed

## Progress

- [x] Inspect required docs and popup runtime detail sources
- [x] Restore popup runtime detail preference logic
- [x] Add focused regression tests
- [x] Run required validation
- [x] Update plan notes and move this plan to completed

## Surprises and Discoveries

- Observation: the regression came from replacing already-generated runtime detail with generic localized fallback, not from missing runtime producers.
  Evidence: `entrypoints/shared/openai-service.ts` and `entrypoints/shared/summary-generation.ts`
- Observation: a very small pure seam exported from `entrypoints/popup/App.tsx` is enough to test the regression without rendering the full popup tree.
  Evidence: `getSetupStatus(...)` and `resolvePopupSummaryDetail(...)` in `entrypoints/popup/App.tsx`

## Decision Log

- Decision: keep the correction popup-scoped and preserve the shared i18n foundation rather than localizing runtime-message producers in Phase 1.5.
  Rationale: the user requested a targeted correction, and repository strategy still separates popup migration from later surface migrations.
  Date/Author: 2026-04-07 / Copilot

## Outcomes and Retrospective

Completed implementation:

- restored runtime-detail preference for popup OpenAI unavailable descriptions while keeping localized labels and fallback copy
- restored runtime-detail preference for popup active and failed summary rows while keeping localized labels and badges
- added focused popup regression tests for runtime-message preference and fallback behavior
- recorded the correction and a Phase 2 carry-forward note in the completed Phase 1 execution plan

What changed from the original plan:

- the correction only needed a tiny pure seam exported from `entrypoints/popup/App.tsx`; no extra helper file or broader refactor was required

What remains:

- Phase 2 options migration should preserve runtime-generated detail messages the same way rather than replacing them with generic localized copy
