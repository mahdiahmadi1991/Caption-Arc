# Project-Wide Diagnostics Expansion

This Execution Plan is a living document.
Keep `Progress`, `Decisions`, and `Verification` current while work is active.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose

Expand the structured diagnostics system across the project so the extension can emit rich multi-level logs across core runtime paths, while making the effective log threshold configurable separately for development and production environments.

## Scope

- add environment-aware diagnostics settings to the shared settings model
- make development and production log thresholds independently configurable
- preserve release safety by keeping production logging disabled unless explicitly raised
- broaden instrumentation across major content/background/runtime subsystems
- add high-volume trace coverage in meaningful hot paths so real debug sessions can generate deep diagnostic timelines
- update diagnostics docs and tests for the new environment-aware behavior

## Non-Goals

- speculative UI for diagnostics settings or log viewing
- external telemetry backends
- blanket insertion of meaningless logs into every line of code

## Implementation Notes

- prioritize high-value decision points, retries, network boundaries, persistence boundaries, and state transitions
- use trace/debug generously in hot paths, but keep payloads structured and sanitized
- prefer helpers and module loggers so the change scales without drifting into ad hoc formatting
- make runtime debug commands continue to work as temporary overrides on top of environment-based settings

## Verification

- `pnpm test:google` -> passed (`57/57` tests)
- `pnpm build` -> passed
- `pnpm docs:check` -> passed (`92 markdown files scanned`)

## Progress

- [x] active plan created
- [x] environment-specific diagnostics settings added
- [x] project-wide instrumentation expanded
- [x] docs and tests updated
- [x] validation commands passing

## Decisions

- 2026-04-06: Treat broad structured instrumentation plus dev/prod threshold control as the next milestone because the core collector already exists and the user now wants project-wide operational depth.
- 2026-04-06: Persist diagnostics thresholds in shared settings as `diagnosticsDevelopmentLevel` and `diagnosticsProductionLevel`, while preserving runtime commands as temporary overrides.
- 2026-04-06: Favor high-volume instrumentation in real hot paths such as caption history upserts, translation requests, OpenAI streaming deltas, and cloud sync reconciliation so debug sessions can generate dense timelines without inventing synthetic log spam.