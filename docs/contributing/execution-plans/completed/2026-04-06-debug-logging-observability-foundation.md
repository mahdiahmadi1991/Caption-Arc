# Debug-Only Logging Observability Foundation

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Establish a repository-standard logging and diagnostics foundation that makes complex extension failures observable during development and smoke testing without shipping verbose logging behavior in the primary release build.

Done looks like this:

- all major runtime surfaces emit structured logs through one shared API
- incompatible legacy logging and diagnostics structures are migrated or removed instead of being preserved in parallel
- debug logging is disabled by default for primary release behavior
- developers and agents can explicitly enable debug logging in development and smoke runs
- agents can retrieve filtered logs directly from the extension runtime in debug sessions without requiring user-mediated file handoff
- user-visible diagnostics UI remains deferred until the owner explicitly asks for it after the logging foundation is complete
- logging rules are documented strongly enough that future agent-driven changes do not regress into scattered `console.*` usage and ad hoc diagnostics state

## Problem Statement

The repository currently exposes diagnostics through multiple disconnected mechanisms:

- content-side JSON debug state published into the DOM
- targeted response-local `debug` payloads in some background flows
- sparse `console.error` calls for hard failures
- smoke and CDP scripts that validate runtime behavior but do not have a first-class way to retrieve structured extension logs

This fragmentation creates several concrete problems:

- cross-context failures are difficult to correlate
- noisy or missing diagnostics slow root-cause analysis for provider issues and lifecycle regressions
- existing diagnostics mechanisms can drift into multiple competing formats if they are not actively consolidated
- agents cannot directly inspect runtime logs in the debug environment unless the extension exposes a first-class retrieval path
- primary release behavior should remain lean and privacy-safe, but current ad hoc diagnostics do not define a clear debug-only operating mode

## Scope

- define the target logging architecture for content, background, popup, options, history, and smoke/CDP tooling
- define a shared structured log event schema with level, domain, feature, provider, correlation, and payload rules
- define a debug-only activation model so verbose logging remains off in primary release behavior
- define centralized collection in the background runtime with bounded retention
- define a direct runtime retrieval path so agents can inspect logs without waiting for user-exported files
- define migration and removal rules for existing debug-state and `console.*` usage that do not fit the canonical logger architecture
- define privacy, redaction, retention, and performance constraints for logging
- define rollout milestones, validation strategy, and documentation updates

## Non-Goals

- implementing the full logger in this planning task
- shipping a production telemetry backend or external log ingestion service
- retaining unlimited historical logs in extension storage
- storing raw transcripts, full prompts, API keys, or other sensitive payloads in logs
- replacing every existing diagnostic helper in one large rewrite without staged rollout
- implementing or styling a user-visible diagnostics UI before the owner explicitly requests that work

## Repository Context

- `entrypoints/content/debug-state.ts`: current content-side structured diagnostics published into DOM
- `entrypoints/content/platform-runtime.ts`: lifecycle debug updates and runtime state transitions
- `entrypoints/content/providers/microsoft-teams.ts`: provider-specific caption diagnostics pattern
- `entrypoints/content/providers/zoom-web.ts`: provider-specific debug snapshots and trace buffers
- `entrypoints/background/history.ts`: background decision responses with embedded `debug` payloads
- `entrypoints/background/translation.ts`: sanitized provider-facing error construction
- `entrypoints/background/assistant.ts`: direct `console.error` for generation failure
- `entrypoints/content/index.ts`: direct `console.error` for init retry failure
- `entrypoints/background/types/index.ts`: current response types already exposing some debug fields
- `scripts/manual-smoke/reload-extension-runtime.mjs`: established CDP path into extension runtime
- `scripts/manual-smoke/*`: smoke wrappers and CDP helpers that can become direct agent-access paths into runtime diagnostics
- `docs/setup/debugging.md`: current runtime debugging entry point
- `docs/operations/observability-and-support.md`: current high-level diagnostics workflow
- `docs/quality/references/agent-onboarding-cdp-runtime.md`: required runtime validation flow for agents
- `AGENTS.md`: durable repository rules for future coding-agent sessions

## Constraints

- primary release behavior must keep verbose logging disabled by default
- development and smoke logging must be easy to enable intentionally without patching code by hand
- logging must work across extension execution contexts that do not share memory directly
- service worker lifecycle churn must not silently drop all useful logs during active debugging sessions
- log storage must remain bounded to avoid extension performance regressions and storage bloat
- documentation must remain ASCII-only and public-safe
- runtime-sensitive implementation will require smoke validation across Google Meet, Microsoft Teams, and Zoom when shared flows are touched
- logs must be structured enough for automated post-run analysis by agents and scripts
- agents must be able to access debug-session logs directly through repository-supported runtime mechanisms without requiring the user to manually export and send artifacts

## Risks and Unknowns

- WXT build-time environment handling needs to be verified so debug-only logging gates are reliable in both local dev and packaged builds
- background service worker restarts may truncate in-memory logs if retention and export timing are not designed carefully
- content-heavy trace logging can degrade provider pages if high-volume events are not sampled or gated
- correlation identifiers may require changes to existing message flows to preserve causality across contexts
- legacy debug-state consumers may depend on current DOM-published JSON shape during local troubleshooting
- retiring incompatible legacy diagnostics may temporarily remove familiar debugging patterns before the replacement workflow is fully internalized
- the exact UI surface, placement, and interaction model for any future diagnostics viewer remains intentionally unresolved until the owner explicitly requests that discussion

## Documentation Impact

- create this active execution plan under `docs/contributing/execution-plans/active/`
- create a repository governance document for development-time logging under `docs/contributing/coding-conventions/`
- update `docs/contributing/README.md` to reference the new governance document
- update `docs/contributing/coding-conventions/README.md` to reference the new governance document
- update `AGENTS.md` to require the new logging governance during logging-related and runtime-sensitive implementation work
- update `docs/setup/debugging.md` and `docs/operations/observability-and-support.md` during implementation once the direct agent-access path and operator workflow become concrete

## Testing and Coverage Impact

Implementation governed by this plan should include:

- unit coverage for shared logger schema validation, gating behavior, redaction helpers, and buffer retention
- targeted tests for message forwarding into the background collector
- targeted tests for log retrieval and clearing APIs
- runtime smoke verification that confirms direct log retrieval works for at least one scenario per provider family affected by the implementation stage
- `pnpm test:targeted:plan` to determine targeted test scope as milestones land
- `pnpm test:google` and `pnpm test:google:coverage` for code changes touching existing tested surfaces
- `pnpm docs:check` for the documentation changes in this planning task and future implementation updates

## Milestones

### Milestone 1 - Canonical Contract, Collector, And Retrieval Foundation

Define the shared logging contract, establish the central collector, and introduce the direct retrieval foundation before broader migration work begins.

Implementation approach:

- add a shared log event type and logger API contract in the shared runtime layer
- define required fields, optional context fields, and allowed log levels
- define naming rules for `domain`, `feature`, and `message`
- define redaction and truncation helpers so developers do not invent payload rules per call site
- define activation gates so verbose debug logging is off by default and only enabled intentionally in development workflows
- define migration criteria that explicitly identify which legacy diagnostics structures must be removed instead of adapted
- add a background-owned ring buffer with configurable capacity
- define message actions for appending logs, retrieving logs, clearing logs, and optionally changing the active debug level for local debugging sessions
- preserve minimal metadata required to reconstruct event order and context across service worker restarts where feasible
- restrict persistent retention to a bounded, explicit debug path rather than default release behavior
- expose a stable retrieval interface that CDP tooling and in-repo agents can invoke directly during debug sessions

Verification:

- unit tests cover append, filter, clear, retention, and direct retrieval behavior
- message contract tests confirm content and UI surfaces can reach the collector
- smoke script proof-of-concept and agent workflow can query logs without a manual export step

- type definitions compile cleanly
- examples in docs match real repository modules
- no milestone code path relies on raw `console.log` as the primary logging interface

Acceptance signals:

- one extension entry point can retrieve a structured log bundle without scraping DOM debug state
- agent workflows have a stable API surface to inspect after failures
- the repository has one canonical retrieval mechanism instead of multiple incompatible debug outputs
- future work can migrate existing diagnostics without redefining event shape each time
- reviewers can evaluate whether a new log call follows repository policy using one canonical document

### Milestone 2 - Runtime Migration And Direct Agent Access

Migrate the highest-value diagnostics surfaces first, remove incompatible legacy diagnostics, and make the canonical log stream directly usable in active debug workflows.

Implementation approach:

- replace direct `console.error` calls in critical flows with structured logger calls while keeping browser-console fallback behavior minimal and intentional
- route lifecycle, provider-detection, session-resolution, translation, and messaging diagnostics through the shared logger
- remove or fully align existing DOM debug state, response-local debug payloads, and other legacy diagnostics structures that conflict with the canonical logger model
- add correlation identifiers to the most failure-prone multi-step flows
- add a retrieval path under the existing CDP and smoke tooling that can query the current log buffer from the extension runtime on demand
- make the retrieval flow directly usable by in-repo agents during debug sessions without requiring user-managed file export or copy/paste handoff
- support filtering by minimum level, provider, and domain so debug sessions stay readable
- allow optional artifact capture later as a convenience, but do not make file export the primary access model

Verification:

- smoke command or CDP helper can query logs directly after an exercised scenario
- the retrieval response is stable enough for scripted parsing and agent review
- the workflow functions in the repository's supported CDP modes

- targeted tests confirm migrated paths still behave correctly
- smoke runs on relevant provider scenarios produce expected level-separated events
- no sensitive raw caption or secret material is emitted in debug bundles

Acceptance signals:

- agents can query runtime logs directly from the debug environment after smoke execution
- developers no longer need to rely only on transient browser console inspection to debug complex flows
- failures in provider parsing, lifecycle recovery, or AI request handling can be traced through one log stream
- duplicated or incompatible ad hoc diagnostics logic is actively reduced rather than preserved alongside the new system

### Milestone 3 - Governance And Release Guardrails

Finish the repository-facing controls around the new logging model by locking the behavior into long-term governance and deferring any user-visible diagnostics UI until explicitly requested.

Implementation approach:

- finalize coding-convention guidance for development-time logging
- add AGENTS rules that force logging-aware implementation behavior for runtime-sensitive work
- record that user-visible diagnostics UI must not be implemented speculatively or ahead of an explicit owner request
- document release expectations: verbose debug logs disabled by default, explicit opt-in for local development, privacy-safe payload policy, and mandatory log review during complex bug work
- define when new runtime features must add or update structured logs as part of definition of done

Verification:

- docs references are complete and pass `pnpm docs:check`
- repository guidance clearly distinguishes development-time diagnostics from primary release behavior
- future agent sessions can discover the logging governance through canonical docs and AGENTS rules

Acceptance signals:

- logging quality becomes an enforceable repository standard instead of optional author preference
- developers and agents can inspect logs directly through the runtime without requiring speculative UI work
- the unresolved visual design can be discussed later only when the owner explicitly asks for it

## Verification

Documentation task verification for this planning change:

- `pnpm docs:check`

Implementation-phase verification recorded during completion:

- `pnpm build`
- `pnpm test:targeted:plan`
- relevant targeted tests returned by the planner
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm chrome:debug:ensure`
- `pnpm chrome:smoke:provider <provider> <scenario>` for affected runtime surfaces
- `pnpm chrome:smoke:matrix` when shared runtime or collector behavior impacts multiple providers

Observed results:

- `pnpm build`: passed
- `pnpm test:targeted:plan`: passed; recommended Google, Teams, and Zoom smoke scope because shared runtime, provider, and smoke tooling changed
- `pnpm test:google`: passed
- `pnpm test:google:coverage`: passed
- `pnpm docs:check`: passed after documentation updates
- `CHROME_EXECUTABLE='' pnpm chrome:debug:ensure`: passed after overriding a broken local placeholder Chrome path
- `CHROME_EXECUTABLE='' pnpm chrome:debug:diagnostics:enable`: passed after rebuild + extension reload
- `CHROME_EXECUTABLE='' pnpm chrome:debug:diagnostics`: passed and returned canonical runtime diagnostics payload
- `CHROME_EXECUTABLE='' pnpm chrome:smoke:provider:raw google-meet lobby`: passed
- `CHROME_EXECUTABLE='' TEAMS_URL='<teams-live-url>' pnpm chrome:smoke:provider:raw microsoft-teams lobby`: failed due provider auth/redirect gate ending at `chrome-error://chromewebdata/`, not due logger implementation failure
- Zoom runtime validation remains unverified in this completion pass because no Zoom meeting URL/environment prerequisite was provided

## Progress

- [x] Repository logging and diagnostics surfaces inspected
- [x] Execution plan created before implementation
- [x] Need for debug-only activation explicitly captured
- [x] Need for direct agent access without user-managed export captured
- [x] Need to remove incompatible legacy diagnostics instead of preserving parallel systems captured
- [x] Need to defer any user-visible diagnostics UI until explicit owner request captured
- [x] Shared log schema and gating implementation completed
- [x] Background collector and retrieval APIs implemented
- [x] Direct debug-session agent retrieval implemented
- [x] Diagnostics UI implementation removed after requirement clarification
- [x] Legacy diagnostics migration completed

## Surprises and Discoveries

- Observation: The repository already contains structured diagnostics patterns, but they are fragmented across DOM-published content debug state, response-local debug payloads, and isolated `console.error` calls.
  Evidence: `entrypoints/content/debug-state.ts`, `entrypoints/content/platform-runtime.ts`, `entrypoints/background/history.ts`, `entrypoints/background/assistant.ts`, and `entrypoints/content/index.ts`.
- Observation: The existing smoke and CDP tooling already has a stable path into the extension runtime, so log export does not need a brand-new automation foundation.
  Evidence: `scripts/manual-smoke/reload-extension-runtime.mjs` and the runtime onboarding docs.
- Observation: The desired agent experience is direct access to debug-session logs, not a workflow that depends on the user exporting files and handing them back into the thread.
  Evidence: user requirement captured during planning refinement on 2026-04-06.
- Observation: User-visible diagnostics UI should not be implemented speculatively; the owner wanted to discuss appearance only after backend implementation was complete.
  Evidence: follow-up clarification from the owner on 2026-04-06 requesting removal of the implemented UI.
- Observation: The repository rules already require plan-first work and runtime-sensitive smoke validation, which makes logging governance a natural extension of existing policy.
  Evidence: `AGENTS.md` and `docs/contributing/execution-plans.md`.
- Observation: Existing debug runtime failures during validation were initially caused by a broken local `CHROME_EXECUTABLE` placeholder rather than by the diagnostics implementation.
  Evidence: `pnpm chrome:debug:ensure` failed until the runtime was invoked with `CHROME_EXECUTABLE=''`, after which CDP and diagnostics commands succeeded.

## Decision Log

- Decision: Keep verbose logging disabled by default for primary release behavior and enable it only through explicit development/debug gates.
  Rationale: This satisfies the product requirement to avoid shipping noisy runtime logging while preserving strong diagnostics during development and smoke testing.
  Date/Author: 2026-04-06 / GitHub Copilot
- Decision: Use the background runtime as the canonical log collector.
  Rationale: The background layer is already the repository's main integration point for persistence and cross-context coordination, making it the least fragmented collection point.
  Date/Author: 2026-04-06 / GitHub Copilot
- Decision: Prefer structured log export over browser-console scraping for agent workflows.
  Rationale: Structured runtime retrieval is deterministic, filterable, privacy-auditable, and directly usable by automation during debug sessions; optional file artifacts can remain secondary conveniences later.
  Date/Author: 2026-04-06 / GitHub Copilot
- Decision: Remove or fully align incompatible legacy diagnostics structures instead of preserving parallel systems.
  Rationale: The project requirement is long-term logging consistency across the entire codebase, which is not achievable if old and new diagnostics models coexist indefinitely.
  Date/Author: 2026-04-06 / GitHub Copilot
- Decision: Do not implement a diagnostics UI or other visible surface until the owner explicitly asks for that work.
  Rationale: Backend observability can ship independently, and speculative UI implementation wastes time and diverges from owner intent.
  Date/Author: 2026-04-06 / GitHub Copilot
- Decision: Align legacy content debug-state behavior to the canonical collector by converting it into a snapshot bridge instead of keeping DOM-published JSON as the source of truth.
  Rationale: This preserved useful state-style diagnostics for existing call sites while removing the incompatible parallel DOM transport.
  Date/Author: 2026-04-06 / GitHub Copilot

## Outcomes and Retrospective

Implementation completed for the debug-only logging observability foundation described in this plan.

What shipped:

- shared diagnostics schema with level gating, sanitization, and bounded collector state
- background-owned diagnostics collector with direct runtime retrieval, clear, and config actions
- direct agent-access command path through `chrome:debug:diagnostics*`
- canonical diagnostics integration across content boot, platform runtime, Teams provider, Zoom provider, translation failures, assistant failures, background message router errors, and session-continuation decisions
- migration of legacy DOM debug-state publication into canonical runtime snapshots
- documentation and AGENTS updates for the new diagnostics model
- governance updates that defer any future diagnostics UI until an explicit owner request

Residual follow-up items:

- discuss diagnostics UI direction only if and when the owner explicitly asks to start that work
- validate Microsoft Teams after the debug profile has cleared the provider auth/redirect gate
- validate Zoom smoke coverage when a real Zoom meeting URL or equivalent environment prerequisite is available