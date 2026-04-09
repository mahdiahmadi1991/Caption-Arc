# Shared Loading Surface Unification

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Unify loading visuals across the extension so locale switching, options startup, and meeting-history loading all use the same project-native loading surface. Done means the temporary i18n-specific loader is removed, the existing history loading design becomes the shared implementation, and UI language switching uses that same surface instead of a mismatched overlay.

## Problem Statement

The current locale-switch loading path uses a custom loading screen that does not match the established visual language of the project. The meeting-history area already contains the preferred loading design, but it is implemented locally and cannot be reused by options or other surfaces.

## Scope

- extract the existing meeting-history loading UI into a shared loading component
- support page, panel, and overlay presentation modes from that shared component
- update options locale-switch loading to use the shared component
- update options startup loading to use the shared component
- update meeting-history to consume the shared component instead of a local copy
- update popup locale startup loading to use the shared component
- remove the temporary i18n loading implementation
- add focused regression coverage
- run required validation and a fresh development build

## Non-Goals

- redesign the loading aesthetic
- change localization copy or loading semantics beyond wiring
- introduce new dependencies or animation libraries

## Repository Context

- `entrypoints/meeting-history/App.tsx`
- `entrypoints/meeting-history/main.tsx`
- `entrypoints/options/App.tsx`
- `entrypoints/options/main.tsx`
- `entrypoints/shared/i18n/index.ts`
- `entrypoints/shared/i18n/loading-screen.tsx`
- `entrypoints/shared/`
- `tests/google-meet/shared-ui-controls.contract.test.ts`

## Constraints

- preserve the established loading look from meeting-history
- keep the shared component reviewable and dependency-free
- keep overlay usage high enough in stacking order to sit above dropdown portals

## Risks and Unknowns

- moving a local component into shared code can create small styling diffs if the old wrapper assumptions are missed
- removing the old i18n loader requires updating all imports cleanly to avoid dead exports

## Documentation Impact

- execution plan only

## Testing and Coverage Impact

- add or update focused shared UI coverage for the shared loading surface
- run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - `pnpm build:development`

## Milestones

### Milestone 1 - Shared Loading Component

Extract the meeting-history loading design into a shared component that supports page, panel, and overlay modes. Acceptance signal: the local loading implementation is no longer needed and the shared component can cover the existing usage patterns.

### Milestone 2 - Consumer Migration

Switch options and meeting-history loading paths to the shared component and remove the temporary i18n loader. Acceptance signal: locale switching and startup/loading paths use the same visual language.

### Milestone 3 - Regression Coverage And Validation

Update focused tests and run required validation. Acceptance signal: the suite and development build pass after unification.

## Verification

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm build:development`

## Progress

- [x] Inspect current loading implementations in options and meeting-history
- [x] Extract shared loading surface
- [x] Migrate consumers and remove temporary loader
- [x] Add or update focused tests
- [x] Run validation
- [ ] Move this plan to `completed/`

## Surprises and Discoveries

- Observation: the preferred loading design already exists in `meeting-history`, but it is local to `App.tsx` and therefore cannot be reused by locale switching in `options`.
  Evidence: `entrypoints/meeting-history/App.tsx`
- Observation: popup startup also still depended on the temporary i18n loading screen, so a full unification pass needed to migrate popup too.
  Evidence: `entrypoints/popup/main.tsx`

## Decision Log

- Decision: treat the meeting-history loading design as the canonical loading surface and generalize it instead of refining the temporary i18n loader.
  Rationale: the user explicitly prefers the existing project-native loading design and it already matches the visual language of the extension.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

- The meeting-history loading pattern is now the canonical shared loading surface in `entrypoints/shared/loading-screen.tsx`, with `page`, `panel`, and `overlay` variants.
- Options startup, options locale switching, meeting-history startup/detail loading, and popup locale startup now all use the same project-native loading surface.
- The temporary i18n-specific loading screen was removed from `entrypoints/shared/i18n/loading-screen.tsx` and from the i18n export surface.
- Focused regression coverage for the shared loading surface was added in `tests/google-meet/shared-ui-controls.contract.test.ts`.
- Validation passed:
  - `pnpm docs:check`
  - `pnpm vitest run tests/google-meet/shared-ui-controls.contract.test.ts tests/google-meet/options-ui-language-switch.contract.test.tsx`
  - `pnpm vitest run tests/google-meet/use-diagnostics-console.contract.test.ts tests/google-meet/diagnostics-viewer.contract.test.ts`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
  - `pnpm build:development`
