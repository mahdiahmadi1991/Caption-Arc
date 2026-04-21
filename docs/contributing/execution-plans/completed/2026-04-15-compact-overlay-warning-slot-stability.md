# Compact Overlay Warning Slot Stability

This Execution Plan is a living document.
Keep `Progress`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Keep the compact overlay header layout stable when the OpenAI warning badge appears or disappears.

Done means:

- the compact warning badge no longer causes neighboring controls to shift position
- compact warning visibility is implemented without removing its layout slot
- regression coverage guards the compact-header warning-slot behavior
- required validation and fresh development builds are recorded

## Problem Statement

In compact mode, toggling the OpenAI warning badge changes the header layout enough to visibly shift neighboring controls. The warning is currently inserted as its own grid item and hidden through removal from layout flow.

That produces a jittery compact header and breaks the expected stable positioning of the trailing control cluster.

## Scope

- update compact overlay header warning visibility behavior
- keep the warning slot reserved in compact layout even when the warning is not currently visible
- add focused regression coverage for the compact warning slot behavior
- run required validation and fresh governed-browser development builds

## Non-Goals

- redesigning the compact overlay visuals
- changing compact status copy
- changing expanded overlay header layout
- unrelated overlay or assistant behavior refactors

## Repository Context

Primary code:

- `entrypoints/content/overlay/header.ts`
- `entrypoints/content/styles/header.css`

Primary tests:

- `tests/google-meet/google-meet-overlay-settings.contract.test.ts`

Validation/tooling:

- `pnpm test:module:plan entrypoints/content/overlay/header.ts entrypoints/content/styles/header.css tests/google-meet/google-meet-overlay-settings.contract.test.ts`
- `pnpm test:module:run entrypoints/content/overlay/header.ts entrypoints/content/styles/header.css tests/google-meet/google-meet-overlay-settings.contract.test.ts`
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`

## Constraints

- repository is public; no secrets or local-machine details in docs/tests
- keep the compact header behavior compatible with both Chrome and Firefox
- prefer the smallest safe change that stabilizes layout without broad refactoring
- satisfy repository quality gates for behavior-sensitive UI changes

Browser impact requirements:

- Chrome impact: yes, compact overlay header
- Firefox impact: yes, same content-style/layout path
- No intentional browser gating
- Verification evidence: focused regression coverage, full required tests, docs validation, and fresh Chrome/Firefox development builds

## Risks and Unknowns

- jsdom does not compute real browser layout, so regression coverage must guard the reserved-slot contract indirectly
- changing hidden-state semantics must not leave the warning focusable or interactive while visually hidden

## Documentation Impact

- add and maintain this execution plan during implementation
- move the plan to `completed/` with recorded verification when the fix is finished

## Verification

- `pnpm test:module:plan entrypoints/content/overlay/header.ts entrypoints/content/styles/header.css tests/google-meet/google-meet-overlay-settings.contract.test.ts`
- `pnpm test:module:run entrypoints/content/overlay/header.ts entrypoints/content/styles/header.css tests/google-meet/google-meet-overlay-settings.contract.test.ts`
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`

Verification outcomes (2026-04-15):

- Pass: `pnpm vitest run tests/google-meet/google-meet-overlay-settings.contract.test.ts`
- Pass: `pnpm test:module:plan entrypoints/content/overlay/header.ts entrypoints/content/styles/header.css tests/google-meet/google-meet-overlay-settings.contract.test.ts`
- Partial: `pnpm test:module:run ...` completed the recommended Vitest commands successfully, but the recommended Chrome DLS smoke commands failed in this environment because the Google Meet runtime probe did not surface the overlay after CDP startup
- Pass: `pnpm test:targeted:plan`
- Pass: `pnpm docs:check`
- Pass: `pnpm test:google`
- Pass: `pnpm test:google:coverage`
- Pass: `pnpm build:development` (fresh Chrome + Firefox development builds)

## Progress

- [x] Inspect compact overlay warning layout and identify the slot-collapse cause
- [x] Update compact warning visibility to preserve layout slot stability
- [x] Add regression coverage for the hidden-slot contract
- [x] Run required validation commands
- [x] Produce fresh Chrome and Firefox development builds

## Decision Log

- Decision: Treat the compact warning-slot jitter as a behavior fix rather than a cosmetic-only tweak.
  Rationale: the issue changes control position during runtime and affects predictable overlay interaction.
  Date/Author: 2026-04-15 / Codex

- Decision: Preserve the warning badge's layout slot when hidden instead of removing the element from flow.
  Rationale: this fixes the control-jump with the smallest safe change while also letting the badge become non-focusable and non-interactive when hidden.
  Date/Author: 2026-04-15 / Codex

## Outcomes and Retrospective

Shipped outcome:

- compact OpenAI warning visibility no longer removes its grid slot from flow
- `syncCompactStatus()` now toggles hidden/focusability semantics without forcing `display: none`
- hidden warning state is backed by CSS that preserves the slot while making the badge visually absent and non-interactive
- regression coverage now guards the reserved-slot contract for compact overlay warnings
- fresh Chrome and Firefox development builds are ready for manual reload verification

Scope changes from initial plan:

- none; the change remained inside compact header logic, styles, tests, and execution-plan bookkeeping

Remaining follow-up:

- manual browser verification against the reported compact pre-join state after reloading the fresh development builds
