# Diagnostics Console Drawer

This Execution Plan is a completed record.
It captures the shipped implementation, validation, and follow-up notes for the diagnostics console drawer work.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Add a user-facing diagnostics console to the options page without changing the existing settings-map structure. The feature should surface canonical collector logs live inside a floating bottom drawer, let the user temporarily enable or disable diagnostics for the current session, and keep the extension's current privacy and redaction guarantees intact.

## Problem Statement

The repository had a canonical diagnostics collector and retrieval path, but no official user-facing viewer. The owner explicitly wanted a diagnostics UI in the options page, while also forbidding a new settings section or a parallel logging pipeline. The shipped UI now consumes only canonical collector APIs, fits the existing options visual system, keeps production diagnostics off by default, and preserves privacy-sensitive sanitization rules.

## Scope

- add a floating diagnostics launcher button to the options page
- add a fixed bottom drawer diagnostics console UI
- poll canonical diagnostics payload only while the drawer is open and the page is visible
- support session-scoped enable, disable, clear, close, copy-visible, level filtering, and lightweight search
- show disabled, empty, and no-match states with polished UX
- keep drawer keyboard accessible and screen-reader labeled
- expose diagnostics viewer gate through canonical environment config and honor it in UI
- add pure helpers for filtering, status derivation, copy serialization, and autoscroll behavior
- update docs for observability and debugging workflows
- add or update tests for viewer helper logic and diagnostics contract alignment where needed

## Non-Goals

- adding a new settings section, section card, or settings-map item for diagnostics
- introducing a second logging, buffering, or retrieval pipeline
- changing production diagnostics baseline away from `off`
- showing unsanitized transcripts, prompts, speaker details, URLs with identifiers, or secrets
- redesigning the overall options navigation or unrelated settings layout

## Repository Context

- `entrypoints/options/App.tsx`
- `entrypoints/options/diagnostics-console.tsx`
- `entrypoints/options/diagnostics-viewer.ts`
- `entrypoints/options/use-diagnostics-console.ts`
- `entrypoints/shared/diagnostics.ts`
- `entrypoints/shared/diagnostics-client.ts`
- `entrypoints/background/diagnostics.ts`
- `entrypoints/background/index.ts`
- `entrypoints/shared/environment/development.ts`
- `entrypoints/shared/environment/production.ts`
- `docs/operations/observability-and-support.md`
- `docs/setup/debugging.md`
- `tests/google-meet/diagnostics-viewer.contract.test.ts`

## Constraints

- use only canonical collector actions: `getDiagnosticsPayload`, `getDiagnosticsConfig`, `clearDiagnosticsData`, `setDiagnosticsConfig`
- do not add `console.*` instrumentation for this feature
- preserve current sanitization and redaction guarantees from shared diagnostics contract
- keep production `minLevel` as `off` even when the viewer is available
- honor `diagnostics.viewerEnabled` and set it to `true` for development and production
- keep polling bounded and paused when the drawer is closed or the tab is hidden
- avoid UI coupling that would break options layout, existing tooltips, or dialogs
- keep implementation aligned with current theme tokens and surface patterns

## Risks and Unknowns

- options page already contains dense stateful UI; fixed overlays could conflict with tooltips or confirmation dialogs if z-index is wrong
- live polling could cause unnecessary rerenders unless payload and UI updates stay bounded
- session-level enable or disable must not accidentally rewrite the environment baseline semantics
- copy/export format must remain useful for debugging while avoiding accidental leakage of redacted payloads
- auto-scroll behavior could become noisy if the list grows large without virtualization

## Documentation Impact

- updated `docs/operations/observability-and-support.md`
- updated `docs/setup/debugging.md`

## Testing and Coverage Impact

- added viewer helper coverage for level filtering logic
- added viewer helper coverage for search matching logic
- added viewer helper coverage for visible-log copy serialization
- added viewer helper coverage for status derivation and session enable defaults
- added viewer helper coverage for auto-scroll behavior
- updated diagnostics client and collector tests to match the current environment defaults and deterministic prompt test execution under coverage
- ran `pnpm test:targeted:plan`
- ran `pnpm test:google`
- ran `pnpm test:google:coverage`
- ran `pnpm build:production`
- ran `pnpm docs:check`

## Milestones

### Milestone 1 - Define Viewer Contract And Plan The UI Integration

Completed. Confirmed that viewer gating could remain environment-controlled while the UI consumed only canonical background actions. No diagnostics contract surface expansion was required.

### Milestone 2 - Implement Drawer, Polling, And User Actions

Completed. Added a floating launcher, bottom drawer UI, canonical polling hook, session-scoped enable or disable actions, clear, copy-visible export, exact level filters, lightweight search, per-row copy, expandable event details, and bounded auto-scroll behavior.

### Milestone 3 - Finalize Tests, Docs, And Validation

Completed. Added diagnostics viewer helper tests, updated observability and debugging docs, reconciled stale diagnostics expectations in existing tests, stabilized a prompt timeout coverage test, and completed the required validation commands successfully.

## Verification

- `pnpm test:targeted:plan`
- `pnpm exec vitest run tests/google-meet/diagnostics-viewer.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:production`
- `pnpm docs:check`

Observed outcomes:

- options page gained a floating diagnostics launcher without adding a new settings section
- drawer shows canonical sanitized diagnostics payload while open
- production baseline remains `off`, but session override can enable logs temporarily
- copy and clear actions operate on canonical collector output only
- required tests, production build, and docs validation all passed

## Progress

- [x] Create execution plan and capture scope, constraints, and verification
- [x] Inspect options UI surfaces and diagnostics touchpoints for implementation shape
- [x] Implement diagnostics console drawer UI and canonical polling hook
- [x] Update environment gating and any required diagnostics contract helpers
- [x] Add tests and update diagnostics docs
- [x] Run validation and archive completed plan

## Surprises and Discoveries

- Observation: The current branch already uses `trace` as the development diagnostics environment baseline.
  Evidence: `entrypoints/shared/environment/development.ts` resolved to `trace`, while older diagnostics tests still expected `debug`.

- Observation: The prompt timeout contract test became coverage-sensitive because the overlay prompt host continuously rescheduled `requestAnimationFrame`.
  Evidence: `pnpm test:google:coverage` timed out on `GM-PRM-003` until the test stubbed RAF and cleaned up timers and DOM explicitly.

## Decision Log

- Decision: Keep the diagnostics viewer outside the settings section map as a floating overlay mounted from the options page root.
  Rationale: The owner explicitly forbids adding a new settings section while still wanting an official UI.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Reuse only canonical background diagnostics actions rather than introducing options-local stateful logging helpers.
  Rationale: The repository diagnostics policy forbids parallel logging systems and requires user-facing diagnostics surfaces to consume the canonical collector.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: When production diagnostics are session-enabled from the drawer, default the temporary override level to `info`.
  Rationale: Production baseline capture must remain `off`, but the viewer still needs a practical low-noise session override that does not reopen the full development `trace` stream by default.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Export copied viewer events as sanitized NDJSON.
  Rationale: NDJSON is easier to diff, paste, and post-process than a UI-formatted transcript while still preserving the canonical event structure.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

The shipped implementation adds a floating diagnostics launcher and glassy bottom drawer to the options page without disturbing the existing settings map. Polling stays bounded to the latest 250 canonical events and only runs while the drawer is open and the tab is visible. Search and exact level filtering stay client-side, and auto-scroll pauses as soon as the user scrolls away from the newest events.

The most important tradeoff is session enablement in production. The repository still starts production diagnostics at `off`, but the viewer can temporarily override to `info` for the current session. This keeps the baseline conservative while making the UI actually useful in production support scenarios.

Copy behavior intentionally exports only the currently visible filtered events as sanitized NDJSON. That avoids a second export format, keeps pasted artifacts machine-friendly, and stays aligned with the canonical diagnostics event contract.