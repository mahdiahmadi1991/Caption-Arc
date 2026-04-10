# Options Settings Polish And OpenAI Auto Verify

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Fix a small set of options-page behavior and UI polish issues without broad refactors: automatically verify a first-time OpenAI API key after the key pattern becomes valid, make the meeting-archive toggle span the full row, stabilize dropdown menu positioning during scroll, and improve shared slider affordances.

## Problem Statement

The options page currently requires a manual verification click after the user first enters a valid OpenAI API key, includes a half-width archive toggle that reads as unfinished, shows dropdown menus that visually lag behind their triggers while scrolling, and exposes sliders with weak interaction cues and an off-theme hover treatment.

## Scope

- adjust options-page OpenAI verification behavior for first-time valid API key entry
- preserve manual verification for subsequent re-checks and changed model/key combinations
- make the meeting-archive toggle card span the full row in settings
- harden shared dropdown menu positioning so scroll movement feels attached and stable across the system
- improve shared range-input affordances and hover/active visuals for options sliders
- update affected tests, behavior docs, and traceability references as required by repository governance

## Non-Goals

- redesigning the options page visual system
- changing OpenAI readiness semantics in background settings storage
- changing dropdown information architecture or keyboard interaction model beyond what is needed for positioning stability
- adding new user-visible settings or feature flags

## Repository Context

- `entrypoints/options/App.tsx`
- `entrypoints/options/use-settings.ts`
- `entrypoints/options/components/api-key-input.tsx`
- `entrypoints/shared/dropdown-select.tsx`
- `entrypoints/shared/app-theme.css`
- `entrypoints/options/styles.css`
- `tests/google-meet/shared-ui-controls.contract.test.ts`
- `tests/google-meet/settings-and-readiness.contract.test.ts`
- `docs/api/settings-and-readiness-behavior-contract.md`
- `docs/quality/references/settings-and-readiness-traceability-matrix.md`

## Constraints

- keep changes non-invasive and localized to the options/shared control surfaces involved
- preserve existing autosave behavior and snapshot semantics
- avoid regressing keyboard accessibility for dropdowns and sliders
- keep behavior documentation and traceability synchronized with behavior-sensitive code changes
- respect existing in-flight user changes in `entrypoints/options/App.tsx`

## Risks and Unknowns

- auto-verification must not repeatedly fire on every keystroke once the key becomes pattern-valid
- verification triggers must not race with autosave in a way that records stale snapshots
- dropdown scroll behavior should feel natural without introducing clipping or layering regressions
- slider styling must remain cross-browser compatible for Chrome and Firefox builds

## Documentation Impact

- update `docs/api/settings-and-readiness-behavior-contract.md` to record first-time valid-key auto-verification behavior if implementation changes behavior-sensitive settings/readiness flow
- update `docs/quality/references/settings-and-readiness-traceability-matrix.md` with matching traceability coverage

## Testing and Coverage Impact

- update or add targeted tests for first-time auto-verification behavior in options/settings flows
- update shared UI control tests for dropdown scroll-positioning behavior and slider styling assertions where appropriate
- run:
  - `pnpm test:module:plan entrypoints/options`
  - `pnpm test:module:run entrypoints/options`
  - `pnpm docs:check`
  - `pnpm docs:check:behavior`

## Milestones

### Milestone 1 - Plan And Behavior Boundaries

Confirm the options/settings, shared-controls, and docs/test surfaces involved; create the execution plan before any implementation edits.

### Milestone 2 - OpenAI Auto Verification

Implement a guarded first-time auto-verification path that runs once when a newly installed extension receives an API key matching the accepted OpenAI key pattern, while preserving existing manual verification and snapshot behavior. Verify with targeted settings tests.

### Milestone 3 - Shared Control Polish

Fix dropdown scroll positioning at the shared component level, make the meeting-archive toggle full width, and refine slider interaction cues and styling in shared/theme CSS. Verify with shared UI tests and targeted options coverage.

### Milestone 4 - Docs, Validation, And Closeout

Update required behavior docs and traceability, run targeted validation commands, record outcomes, and keep the plan current with final decisions.

## Verification

- `pnpm test:module:plan entrypoints/options` -> completed; repository mapping fell back to minimal smoke-harness coverage plus provider DLS.
- `pnpm test:module:plan entrypoints/shared` -> completed; repository mapping fell back to minimal smoke-harness coverage plus provider DLS.
- `pnpm test:module:run entrypoints/options` -> PASS (`manual-smoke-launch.contract.test.ts` + `chrome:smoke:live google-meet meeting`)
- `pnpm test:module:run entrypoints/shared` -> PASS (`manual-smoke-launch.contract.test.ts` + `chrome:smoke:live google-meet meeting`)
- `pnpm vitest run tests/google-meet/options-openai-auto-verification.contract.test.ts tests/google-meet/shared-ui-controls.contract.test.ts` -> PASS
- `pnpm docs:check` -> PASS
- `pnpm docs:check:behavior` -> PASS
- `pnpm build:all:development` -> PASS (fresh Chrome and Firefox development artifacts produced)
- `pnpm chrome:smoke:live:google:settings meeting` -> PASS

## Progress

- [x] Create plan before implementation
- [x] Implement first-time OpenAI API key auto-verification
- [x] Fix shared dropdown scroll positioning
- [x] Update options layout and shared slider affordances
- [x] Update behavior docs and traceability
- [x] Run validation and record results

## Surprises and Discoveries

- Observation: The dropdown menu is already rendered in a portal and repositioned on scroll; the perceived lag is likely due to fixed-position tracking during live scroll rather than clipping or stacking-context issues.
  Evidence: `entrypoints/shared/dropdown-select.tsx`

- Observation: Current OpenAI verification in the options page is entirely manual and stored through local verification snapshots bound to the connection signature.
  Evidence: `entrypoints/options/use-settings.ts`

- Observation: module-scoped test recommendation for both `entrypoints/options` and `entrypoints/shared` currently falls back to generic smoke-harness validation instead of mapping to the newer settings/shared-control contract tests.
  Evidence: `pnpm test:module:plan entrypoints/options`, `pnpm test:module:plan entrypoints/shared`

## Decision Log

- Decision: treat the dropdown fix as a shared-component change rather than patching individual settings selects.
  Rationale: the user asked for a system-wide fix and the issue originates in the shared dropdown control.
  Date/Author: 2026-04-10 / GitHub Copilot

- Decision: use a broad plausible-key gate (`sk-...` plus minimum meaningful length) for first-time auto-verification instead of restricting the trigger to `sk-proj-...` only.
  Rationale: the repository had no existing canonical key-pattern validator and the user explicitly selected the broader `sk-...` rule.
  Date/Author: 2026-04-10 / GitHub Copilot

- Decision: switch the shared dropdown portal menu from viewport-fixed positioning to document-relative absolute positioning.
  Rationale: the visual lag was caused by post-scroll fixed-position tracking; document-relative coordinates keep the open menu moving naturally with page scroll.
  Date/Author: 2026-04-10 / GitHub Copilot

## Outcomes and Retrospective

- Added a one-shot first-time OpenAI auto-verification path in the options page, guarded by a plausible `sk-...` key pattern and the absence of any existing key/snapshot.
- Made the meeting-archive toggle span the full row and upgraded the shared slider styling with grab/grabbing affordances plus calmer in-theme hover colors.
- Reworked the shared dropdown portal positioning so menus stay visually attached during scrolling across the settings surfaces that use the shared control.
- Added targeted regression coverage for the new options auto-verification behavior and updated shared UI control tests for dropdown positioning and slider affordances.
- Produced fresh Chrome and Firefox development builds and passed the focused Google settings smoke. Final visual acceptance of the UI changes still depends on the repository owner reloading the new development builds and reviewing the updated settings screen.