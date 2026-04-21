# Shared Dropdown Layering And Theme Toggle Sizing

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Fix shared UI control defects that currently make options-page dropdown menus render underneath neighboring cards and make the shared theme toggle stretch wider than its content. Done means dropdown menus layer correctly across all shipped surfaces that use the shared control and the theme toggle sizes to its content instead of stretching.

## Problem Statement

The current shared dropdown relies on local stacking contexts, which causes opened menus to fall behind adjacent panels in the options UI and likely elsewhere the shared control is reused. The shared theme toggle also stretches within flex-column layouts, making the control look visually oversized.

## Scope

- fix shared dropdown menu layering in a project-wide way
- fix shared theme toggle sizing in shared CSS
- add regression coverage for dropdown layering behavior and theme-toggle sizing contract
- run the required repository validation commands and a fresh development build

## Non-Goals

- redesign dropdown visuals or option content
- change copy, localization catalogs, or settings behavior
- add new UI frameworks or dependencies

## Repository Context

- `entrypoints/shared/dropdown-select.tsx`
- `entrypoints/shared/theme-toggle.tsx`
- `entrypoints/shared/app-theme.css`
- `entrypoints/options/components/select.tsx`
- `entrypoints/options/App.tsx`
- `entrypoints/meeting-history/components/session-detail.tsx`
- `entrypoints/meeting-history/components/action-card.tsx`
- `tests/google-meet/*.contract.test.ts`

## Constraints

- keep the fix shared so all consumers of `DropdownSelect` benefit
- preserve accessibility semantics and keyboard interaction for the dropdown
- keep the theme toggle usable in popup/options without layout regressions
- use existing React/TypeScript stack patterns only

## Risks and Unknowns

- moving the dropdown menu outside its local DOM tree can break outside-click handling if containment checks are not updated
- menu positioning must stay stable enough for current extension UI surfaces
- CSS sizing changes to the theme toggle must not cause clipping in compact layouts

## Documentation Impact

- execution plan only unless implementation reveals a broader testing or UI contract that needs documentation

## Testing and Coverage Impact

- add a focused contract test for shared dropdown portal/layering behavior
- add a focused contract test for the theme-toggle sizing CSS contract
- run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - `pnpm build:development`

## Milestones

### Milestone 1 - Shared Control Fix

Implement the dropdown layering fix in the shared control and tighten theme-toggle sizing in shared CSS. Acceptance signal: no consumer-specific patching is needed and both issues are resolved at the shared layer.

### Milestone 2 - Regression Coverage And Validation

Add focused tests for the shared behavior and run repository validation. Acceptance signal: tests and build pass with the new shared behavior.

## Verification

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm build:development`

## Progress

- [x] Inspect shared dropdown, theme toggle, and affected options layout
- [x] Implement shared control fixes
- [x] Add focused regression tests
- [x] Run validation
- [ ] Move this plan to `completed/`

## Surprises and Discoveries

- Observation: the select card already tries to raise itself with `focus-within:z-20`, but the shared dropdown menu still relies on ancestor stacking contexts.
  Evidence: `entrypoints/options/components/select.tsx`, `entrypoints/shared/dropdown-select.tsx`

## Decision Log

- Decision: fix dropdown layering in the shared control instead of patching each page section.
  Rationale: the same shared dropdown is used in options and meeting history, so a local page-level z-index patch would remain fragile and incomplete.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

- `DropdownSelect` now renders its menu through a fixed portal layer attached to `document.body`, which removes dependence on local card/section stacking contexts and fixes menus rendering under adjacent panels.
- shared outside-click handling was updated so portal-rendered menus still close correctly.
- `mc-theme-toggle` now sizes to content in flex layouts instead of stretching to the card width.
- focused regression coverage was added in `tests/google-meet/shared-ui-controls.contract.test.ts` for dropdown portal layering and the shared theme-toggle sizing contract.
- full suite, coverage, targeted plan, and development build all passed after a small sync fix in `tests/google-meet/manual-smoke-launch.contract.test.ts` to match the repository's current deterministic smoke-launch policy.
