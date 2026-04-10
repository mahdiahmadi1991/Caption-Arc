# Terms Decline State And Return Flow

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Close the gaps left by the first universal Terms gate wave so CaptionArc can reliably block, recover, and return users through the Terms flow without stale blocked state.

Done for this wave means:

- local settings persist a versioned Terms decline record alongside acceptance
- accepting Terms reliably unblocks governed surfaces and protected background services
- declining Terms keeps the product blocked with clearer blocked-state messaging
- Terms acceptance pages know whether to return to settings/history or simply close

## Scope

- add a local-only versioned decline record
- normalize and persist acceptance/decline state together
- fix the unblock path after accepting current Terms
- add explicit return-flow handling for accept-mode Terms pages
- polish blocked-state and Terms accept-mode copy/UI
- update behavior and storage docs

## Non-Goals

- introducing account-level or remote legal acceptance tracking
- changing the public legal markdown content itself
- redesigning the full legal-page visual language

## Constraints

- keep the legal state local-only and versioned
- avoid introducing open redirect behavior in Terms-page return handling
- preserve dedicated view-mode legal pages
- align page-return behavior with the originating extension surface

## Repository Context

- `entrypoints/shared/legal.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/index.ts`
- `entrypoints/shared/use-extension-page-settings.ts`
- `entrypoints/shared/terms-gate.tsx`
- `entrypoints/terms-of-service/App.tsx`
- `docs/api/storage-schema.md`
- `docs/api/settings-and-readiness-behavior-contract.md`
- `docs/quality/references/settings-and-readiness-traceability-matrix.md`

## Documentation Impact

- update storage schema notes for local Terms decline state
- update settings/readiness contract for dual acceptance/decline normalization and return-flow behavior
- update traceability to reflect new coverage

## Testing and Coverage Impact

- extend settings/readiness contract coverage for decline normalization and save semantics
- run the required targeted and repository validation commands after implementation

## Progress

- [x] Inspect the current Terms gate, save path, and Terms page behavior
- [x] Create this execution plan before implementation
- [x] Add local decline-state storage and normalization
- [x] Fix unblock behavior and protected-service startup after acceptance
- [x] Implement safe return-flow handling for accept-mode Terms pages
- [x] Polish blocked-state and Terms-page UX copy
- [x] Update docs and validation evidence

## Surprises and Discoveries

- Observation: `saveSettings()` currently returns only `{ success: true }`, while both the page settings hook and the background Terms-unblock path already assume a `response.settings` payload exists.
  Evidence: `entrypoints/background/settings.ts`, `entrypoints/shared/use-extension-page-settings.ts`, `entrypoints/background/index.ts`
- Observation: current Terms accept-mode navigation is close-only and does not encode any return destination, which makes page-surface recovery brittle and prevents deterministic return-to-origin behavior.
  Evidence: `entrypoints/terms-of-service/App.tsx`, `entrypoints/shared/terms-gate.tsx`

## Decision Log

- Decision: store acceptance and decline as separate local-only versioned records rather than overloading one field with tri-state meaning.
  Rationale: this keeps the current acceptance gate simple while still capturing explicit rejection for UX and compliance posture.
  Date/Author: 2026-04-10 / Codex
- Decision: page-sized governed surfaces now navigate into the accept-mode Terms page in the same tab, while popup-origin Terms review still opens in a dedicated tab and closes on accept.
  Rationale: same-tab navigation gives deterministic return-to-origin behavior for settings/history without leaving duplicate blocked tabs behind, while popup still needs a closable review surface.
  Date/Author: 2026-04-10 / Codex
- Decision: keep the coverage-only timeout fix local to the two prompt tests instead of raising the suite-wide timeout.
  Rationale: the failures were isolated to fake-timer prompt tests under coverage instrumentation, so local timeouts preserve signal without slowing the entire test suite.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

Completed.

Implemented outcomes:

- local settings now persist `termsDecline` as a versioned local-only record alongside `termsAcceptance`
- settings normalization reconciles conflicting current-version accept/decline records to the latest local decision
- `saveSettings()` now returns normalized settings to callers, which fixes the stale unblock path after accepting Terms
- options/history blocked gates now navigate to accept-mode Terms in the same tab and return to the originating page after acceptance
- popup-origin Terms review still opens as a dedicated tab and closes after acceptance
- content runtime now re-attempts initialization after Terms acceptance arrives through storage sync, which closes the blocked-after-accept gap for meeting tabs
- blocked-state and Terms-page copy now distinguishes between first-time review and explicit current-version decline
- storage, behavior-contract, and traceability docs now reflect the local decline record and accept-mode return-flow behavior

Validation evidence:

- `pnpm test:targeted:plan`
- `pnpm vitest run tests/google-meet/google-meet-prompts.contract.test.ts tests/google-meet/google-meet-runtime-reset.contract.test.ts tests/google-meet/content-script-marker.contract.test.ts`
- `pnpm vitest run tests/google-meet/use-diagnostics-console.contract.test.ts tests/google-meet/diagnostics-viewer.contract.test.ts`
- `pnpm vitest run tests/google-meet/ui-i18n.contract.test.ts tests/google-meet/i18n-runtime.contract.test.ts tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`
- `pnpm vitest run tests/google-meet/data-transfer.contract.test.ts tests/google-meet/settings-and-readiness.contract.test.ts tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:business`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`
- `pnpm chrome:debug:reload`
- `pnpm chrome:smoke:live google-meet continuation`
- `pnpm chrome:smoke:live google-meet meeting`

Residual note:

- Firefox development builds were produced, but no Firefox manual runtime verification evidence was captured in this thread.
