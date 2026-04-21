# Options Legal-Risk Dialog Regression

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Restore the options-page legal-risk confirmation dialog so risky meeting-flow changes such as `Capture startup = always` visibly prompt the user again instead of rendering as a clipped or half-mounted surface.

## Problem Statement

The repository owner reported that the `Capture startup` warning dialog used to appear correctly in Settings and now no longer displays properly. The regression matters because the setting still needs a legal-risk acknowledgement gate, and the owner explicitly wants the cause identified in addition to a product fix.

## Scope

- trace the options-page regression to the responsible rendering or styling change
- patch the dialog path so it renders reliably above the options shell
- add regression coverage for the dialog layering behavior
- run targeted verification and required repo checks for the touched surfaces

## Non-Goals

- redesigning the legal-risk copy or acknowledgement policy
- broader options-page visual redesign unrelated to dialog reliability
- changing DLS or runtime smoke flows unless verification specifically benefits from them

## Repository Context

- `entrypoints/options/App.tsx`
- `entrypoints/meeting-history/components/confirm-dialog.tsx`
- `entrypoints/shared/app-theme.css`
- `tests/google-meet/shared-ui-controls.contract.test.ts`

## Risks and Unknowns

- the regression may involve both CSS containing-block behavior and local stacking contexts
- moving dialog rendering into a portal could affect scroll locking or dismissal behavior if not covered by tests
- diagnostics drawer blur/scale behavior must remain intact after the dialog fix

## Chromium And Firefox Impact

- Chromium-family impact: direct on the options page legal-risk confirmation path
- Firefox impact: same extension-page rendering path, so the fix must remain browser-neutral

## Testing And Verification Impact

- targeted Vitest coverage for confirm-dialog layering/portal behavior
- `pnpm test:targeted:plan`
- `pnpm vitest run tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:target:chrome:development`
- `pnpm build:target:firefox:development`

## Progress

- [x] Plan created before implementation
- [x] Confirm root cause from repo evidence
- [x] Implement dialog rendering fix
- [x] Add regression coverage
- [x] Run required verification and builds

## Surprises and Discoveries

- Observation: the regression was introduced after the options page gained `mc-options-page-shell`, and the legal-risk `ConfirmDialog` started rendering inside that shell.
  Evidence: `git diff 59c20de..4a26879 -- entrypoints/options/App.tsx`.

- Observation: `mc-options-page-shell` advertises `will-change: filter, opacity, transform`, and the diagnostics-open state applies a real `transform`.
  Evidence: `entrypoints/shared/app-theme.css`.

- Observation: the shared `ConfirmDialog` still rendered inline, unlike the shared dropdown and help-popover surfaces that already escape local stacking contexts through `createPortal(...)`.
  Evidence: `entrypoints/meeting-history/components/confirm-dialog.tsx`, `entrypoints/shared/dropdown-select.tsx`, and `entrypoints/shared/help-popover.tsx`.

- Observation: the repo docs gate initially failed for an unrelated active plan because it still contained a literal local CDP endpoint.
  Evidence: `pnpm docs:check` before sanitizing `2026-04-20-cdp-extension-materialization-and-runtime-detection.md`.

## Decision Log

- Decision: fix the issue at the shared `ConfirmDialog` layer instead of only rearranging the options page tree.
  Rationale: the failure mode comes from local containing/stacking contexts, and a portal-based dialog is the more durable shared behavior.
  Date/Author: 2026-04-20 / Codex

## Outcomes and Retrospective

- Root cause: the regression came from the options-page refactor in `4a26879` that introduced `mc-options-page-shell` and moved the legal-risk `ConfirmDialog` inside it. Because that shell declares `will-change: ... transform`, browsers can treat it as a containing/staking context for fixed descendants, which caused the warning modal to render clipped or only partially visible instead of as a true page overlay.
- Fix: `ConfirmDialog` now renders through `createPortal(..., document.body)` and exposes explicit dialog semantics (`role="dialog"`, `aria-modal="true"`). This removes the legal-risk modal from local containing contexts and makes the fix durable for other confirm-dialog callers too.
- Regression coverage: `tests/google-meet/shared-ui-controls.contract.test.ts` now asserts that confirm dialogs render outside a transformed `mc-options-page-shell`, so the specific clipping failure will fail fast if it returns.
- Additional repo hygiene: sanitized the unrelated active CDP plan so `pnpm docs:check` remains green.
- Verification:
  - `pnpm test:targeted:plan`
  - `pnpm vitest run tests/google-meet/shared-ui-controls.contract.test.ts`
  - `pnpm vitest run tests/google-meet/use-diagnostics-console.contract.test.ts`
  - `pnpm vitest run tests/google-meet/diagnostics-viewer.contract.test.ts`
  - `pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm docs:check`
  - `pnpm build:target:chrome:development`
  - `pnpm build:target:firefox:development`
