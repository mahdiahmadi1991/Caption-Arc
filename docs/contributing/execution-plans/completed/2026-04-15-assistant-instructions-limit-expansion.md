# Assistant Instructions Limit Expansion

This Execution Plan is a living document.
Keep `Progress`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Raise the options-page `Assistant instructions` character limit from `3000` to `8000` without leaving mismatched UI constraints, tests, or handoff artifacts behind.

Done means:

- the assistant instructions editor accepts and counts up to `8000` characters
- no stricter repository-owned limit still truncates the same field unexpectedly
- focused UI coverage guards the new limit
- required validation and fresh Chrome/Firefox development builds are recorded

## Problem Statement

The current options page caps `Assistant instructions` at `3000` characters. That limit is now too restrictive for the meeting assistant profile workflow and needs to expand to `8000`.

If only the visible textarea cap changes while other repository-owned paths still assume `3000`, the settings surface can drift and regressions can hide behind autosave or browser reloads.

## Scope

- update the assistant instructions textarea cap on the options page
- verify adjacent repo-owned normalization/serialization paths do not impose a different lower cap
- add focused contract coverage for the new max length behavior
- produce the repository-required verification artifacts for a UI-affecting code change

## Non-Goals

- changing summary-instructions or live-translation instruction limits
- redesigning assistant profile copy or layout
- changing assistant prompt assembly semantics beyond allowing longer saved text
- release/version/tagging work

## Repository Context

Primary code:

- `entrypoints/options/App.tsx`
- `entrypoints/options/components/text-area.tsx`
- `entrypoints/shared/meeting-profiles.ts`
- `entrypoints/background/cloud-sync/serialization.ts`

Primary tests:

- `tests/google-meet/shared-ui-controls.contract.test.ts`

Docs/process surfaces:

- `docs/contributing/execution-plans/active/README.md`
- this plan file

Validation/tooling:

- `pnpm test:module:plan entrypoints/options/App.tsx tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm test:module:run entrypoints/options/App.tsx tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`

## Constraints

- repository is public; no secrets or local-machine details in docs/tests
- preserve existing options-page behavior except for the requested character-cap increase
- keep the change compatible with both Chrome and Firefox builds
- respect the repository completion gate for tests and fresh governed browser development builds

Browser impact requirements:

- Chrome impact: yes, options-page editing surface
- Firefox impact: yes, same options-page bundle and control
- No intentional browser gating
- Verification evidence: focused UI test coverage, full required repository test commands, docs check, and fresh development builds for both governed browsers

## Risks and Unknowns

- the visible textarea limit may not be the only place truncation happens
- UI tests in this repo are lightweight and require explicit harnessing for controlled input state

## Documentation Impact

- add and maintain this execution plan during the change
- update execution-plan index pointers if the plan file is moved on completion

## Verification

- `pnpm test:module:plan entrypoints/options/App.tsx tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm test:module:run entrypoints/options/App.tsx tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`

Verification outcomes (2026-04-15):

- Pass: `pnpm vitest run tests/google-meet/shared-ui-controls.contract.test.ts`
- Pass: `pnpm test:module:plan entrypoints/options/App.tsx tests/google-meet/shared-ui-controls.contract.test.ts`
- Pass: `pnpm test:module:run entrypoints/options/App.tsx tests/google-meet/shared-ui-controls.contract.test.ts`
- Pass: `pnpm test:targeted:plan`
- Pass: `pnpm test:google`
- Pass: `pnpm test:google:coverage`
- Pass: `pnpm docs:check`
- Pass: `pnpm build:development` (fresh Chrome + Firefox development builds)

## Progress

- [x] Audit the current limit and adjacent normalization/serialization paths
- [x] Increase the assistant instructions limit to `8000`
- [x] Add focused regression coverage for the new limit
- [x] Run required validation commands
- [x] Produce fresh Chrome and Firefox development builds

## Decision Log

- Decision: Treat this as a plan-tracked UI behavior change even though the implementation is small.
  Rationale: repository policy asks for plans on non-trivial code/behavior work, and this change affects a user-editable settings contract.
  Date/Author: 2026-04-15 / Codex

- Decision: Keep the change scoped to the assistant-profile textarea cap and a focused shared-control test.
  Rationale: repository-owned normalization and serialization paths do not apply a stricter prompt cap, so no deeper data-model migration was required.
  Date/Author: 2026-04-15 / Codex

## Outcomes and Retrospective

Shipped outcome:

- raised `ASSISTANT_PROFILE_PROMPT_MAX_LENGTH` from `3000` to `8000` in the options page
- added `UI-CTRL-007` to verify assistant-style textareas advertise and enforce the `8000` character ceiling
- confirmed adjacent repository-owned normalization and cloud-sync serialization paths do not impose a lower assistant-prompt cap
- refreshed Chrome and Firefox development builds for immediate browser reload testing

Scope changes from initial plan:

- none; the change stayed inside the requested settings surface, test coverage, and execution-plan bookkeeping

Remaining follow-up:

- user-side manual verification in browser after reloading the fresh development builds
