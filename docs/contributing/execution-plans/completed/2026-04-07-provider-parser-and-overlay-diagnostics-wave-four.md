# Deepen Provider Parser And Overlay Diagnostics

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Raise diagnostics granularity in the last thin observability areas so debug sessions can reconstruct provider parsing and overlay interaction flow end-to-end without adding any new visible UI.

## Problem Statement

The canonical diagnostics stack already covers background orchestration, content lifecycle, and major runtime flows, but Google Meet provider parsing and overlay interaction modules still emit too little structured evidence. That leaves gaps around caption extraction, chat de-duplication, observer attach/detach, prompt lifecycle, drag/resize persistence, settings application, and visibility transitions.

## Scope

- add provider-specific diagnostics to the Google Meet parser flow
- add structured diagnostics to overlay interaction modules
- validate that the new logs compile cleanly and do not regress the existing test/build gates
- keep all changes debug-only and non-visual

## Non-Goals

- adding any diagnostics UI or visible log surface
- changing diagnostics environment policy or build routing
- changing provider behavior beyond log instrumentation

## Repository Context

- `entrypoints/content/providers/google-meet.ts`
- `entrypoints/content/overlay/interactions.ts`
- `entrypoints/content/overlay/capture-consent.ts`
- `entrypoints/content/overlay/settings.ts`
- `entrypoints/content/overlay/visibility.ts`
- `entrypoints/shared/diagnostics-client.ts`
- `docs/contributing/execution-plans.md`

## Constraints

- no user-visible UI changes
- preserve existing runtime behavior
- use canonical structured diagnostics only
- keep logs aligned with environment-controlled thresholds
- keep chat responses and plan content public-safe

## Risks and Unknowns

- trace-heavy logging in hot parsing paths could create noisy sessions if event selection is poor
- overlay interaction logs must avoid adding fragile runtime dependencies to optional DOM state

## Documentation Impact

- create and archive this execution plan

## Testing and Coverage Impact

- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan`
- run `pnpm build:production`
- run `pnpm docs:check`

## Milestones

### Milestone 1 - Instrument Google Meet Parser Flow

Add a provider-specific diagnostics logger and emit structured trace/debug/info/warn events for caption extraction, duplicate suppression, observer lifecycle, cleanup, and live-caption enable attempts. Verify with type checking and production build/test coverage gates.

### Milestone 2 - Instrument Overlay Interaction Flow

Add structured diagnostics for drag/resize lifecycle, persisted overlay position, prompt lifecycle, settings save/apply flow, and visibility transitions. Verify with repository test/build/docs checks.

## Verification

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm build:production`
- `pnpm docs:check`

## Progress

- [x] Instrument Google Meet parser flow with provider-scoped diagnostics
- [x] Instrument overlay interaction modules with runtime-scoped diagnostics
- [x] Run repository validation commands and record outcomes
- [x] Archive this plan under `completed/` when validation is done

## Surprises and Discoveries

- Observation: Google Meet had become the clearest remaining provider-specific gap because Teams and Zoom already carried more dedicated diagnostics helpers.
  Evidence: repository inspection of `entrypoints/content/providers/google-meet.ts`, `entrypoints/content/providers/microsoft-teams.ts`, and `entrypoints/content/providers/zoom-web.ts` before patching.

- Observation: overlay interaction modules contained several important state transitions with no structured evidence even though they influence runtime debugging heavily.
  Evidence: repository inspection of `entrypoints/content/overlay/interactions.ts`, `entrypoints/content/overlay/capture-consent.ts`, `entrypoints/content/overlay/settings.ts`, and `entrypoints/content/overlay/visibility.ts` before patching.

## Decision Log

- Decision: Focus the fourth-wave pass on Google Meet and overlay interaction modules instead of reworking Teams or Zoom.
  Rationale: Teams and Zoom already had richer provider-specific diagnostics, while Google Meet and overlay interactions still had the most important observability gaps.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Keep this wave documentation-scoped to the execution plan only.
  Rationale: the change affects internal debug coverage rather than external behavior, setup, or user-facing operations.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

Implementation added structured diagnostics to Google Meet parser and observer paths plus overlay drag/resize, prompt, settings, and visibility flows. No UI was added.

Verification outcomes:

- `pnpm test:google` passed with 57 tests
- `pnpm test:google:coverage` passed with 57 tests and coverage report generation
- `pnpm test:targeted:plan` passed and recommended the expected provider/runtime smoke scopes
- `pnpm build:production` passed and produced a production extension bundle
- `pnpm docs:check` passed and scanned 95 markdown files

Remaining work, if requested later, would be to deepen instrumentation in other provider edge-case parsers or add more runtime smoke scenarios that assert these logs directly.