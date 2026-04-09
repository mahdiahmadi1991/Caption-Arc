# Environment Diagnostics And Lifecycle Coverage

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Move diagnostics threshold configuration out of business settings and into explicit environment configuration, then deepen structured logging coverage so a debug session can explain the extension lifecycle from startup through provider activity, persistence, translation, assistant work, and shutdown or reset paths.

## Problem Statement

The current diagnostics thresholds are persisted beside user-facing business settings, which mixes operational environment policy with product configuration. The current logging wave also improved hot-path coverage but still does not provide a sufficiently complete end-to-end execution narrative, and error-path coverage remains below the desired level.

## Scope

- move diagnostics environment thresholds out of shared business settings
- define explicit environment configuration files for diagnostics defaults
- preserve runtime override commands for temporary debug sessions
- expand lifecycle logging coverage across startup, messaging, state transitions, storage, history, translation, provider, assistant, and failure paths
- add more warn and error logs for recoverable and terminal failures
- update tests and docs for the new configuration model and logging expectations
- record governance for Persian chat responses

## Non-Goals

- new user-visible diagnostics UI
- external telemetry backends
- synthetic log spam with no operational meaning

## Repository Context

- `wxt.config.ts`
- `entrypoints/shared/diagnostics.ts`
- `entrypoints/shared/diagnostics-client.ts`
- `entrypoints/shared/settings-defaults.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/index.ts`
- `entrypoints/background/diagnostics.ts`
- `entrypoints/background/assistant.ts`
- `entrypoints/background/history.ts`
- `entrypoints/background/translation.ts`
- `entrypoints/background/providers/openai.ts`
- `entrypoints/content/index.ts`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/content/state.ts`
- `entrypoints/content/history-service.ts`
- `entrypoints/content/translation.ts`
- `tests/google-meet/diagnostics*.test.ts`
- `.github/copilot-instructions.md`
- `docs/contributing/coding-conventions/development-logging-and-diagnostics.md`
- `docs/setup/debugging.md`
- `docs/operations/observability-and-support.md`

## Constraints

- keep production diagnostics off by default unless explicitly enabled in environment config
- do not place environment diagnostics policy beside business settings
- preserve privacy-safe sanitization and bounded retention
- avoid speculative UI work
- keep docs public-safe and aligned with repository governance
- responses to the user in chat must be in Persian and that rule should be durable

## Risks and Unknowns

- changing diagnostics config sources can break current tests and runtime override flows if precedence is not handled carefully
- deeper lifecycle logging can create performance noise if high-volume paths are not kept structured and cheap
- startup and shutdown behavior is spread across multiple contexts, so gaps can remain unless touched intentionally

## Documentation Impact

- update diagnostics governance to describe environment config ownership and Persian chat response rule
- update debugging and observability docs for the new diagnostics source of truth
- archive this plan when complete

## Testing and Coverage Impact

- update diagnostics contract tests for environment-file-backed defaults
- add or adjust tests for config precedence and lifecycle logging helper behavior where practical
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan`
- run `pnpm build`
- run `pnpm docs:check`

## Milestones

### Milestone 1 - Environment Diagnostics Config

Create explicit environment configuration for diagnostics defaults, remove diagnostics thresholds from business settings, preserve runtime override precedence, and verify diagnostics tests still model the intended default behavior.

### Milestone 2 - Lifecycle Logging Expansion

Expand structured logs across the extension lifecycle so startup, message routing, state mutation, provider execution, translation, persistence, and reset paths emit enough information to reconstruct what happened from extension start through the end of a session.

### Milestone 3 - Docs, Governance, And Validation

Update governance and operator docs, record the Persian chat rule durably, run the required validation suite, and archive the completed plan with final outcomes and follow-up items.

## Verification

- `pnpm test:google` -> passed (`57/57` tests)
- `pnpm test:google:coverage` -> passed
- `pnpm test:targeted:plan` -> passed
- `pnpm build` -> passed
- `pnpm docs:check` -> passed (`93 markdown files scanned`)

## Progress

- [x] active plan created
- [x] environment diagnostics config moved out of business settings
- [x] lifecycle logging coverage expanded substantially
- [x] governance and docs updated
- [x] validation commands passing

## Surprises and Discoveries

- Observation: WXT config already reads `.env.local` and `.env` for configuration values, so the repository already has a natural environment configuration entry point.
  Evidence: `wxt.config.ts`
- Observation: The most valuable missing observability was not in provider parsers anymore; it was in orchestration layers such as content state mutation, background message routing, settings persistence, assistant passes, and summary queue processing.
  Evidence: `entrypoints/content/state.ts`, `entrypoints/background/index.ts`, `entrypoints/background/settings.ts`, `entrypoints/background/assistant.ts`, `entrypoints/background/history.ts`

## Decision Log

- Decision: Use explicit environment configuration as the diagnostics policy source rather than persisted user-facing settings.
  Rationale: Environment-level logging policy is operational configuration, not business behavior.
  Date/Author: 2026-04-07 / Copilot
- Decision: Increase coverage in orchestration-heavy modules even if log volume rises materially.
  Rationale: The owner explicitly wants the execution story to be reconstructable from startup to finish, and low-volume logging was not meeting that bar.
  Date/Author: 2026-04-07 / Copilot

## Outcomes and Retrospective

Implementation moved diagnostics defaults into explicit environment config files and added a second, denser logging wave across startup, state mutation, routing, assistant, summary, translation, and provider resolution flows. The repository now has 21 logger modules and 224 structured logger callsites across `entrypoints/`, while production remains off by default through environment policy and debug sessions can still apply temporary runtime overrides.