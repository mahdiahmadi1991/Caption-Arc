# Development Logging And Diagnostics

This document defines the repository standard for development-time logging and diagnostics work.

It exists to prevent the extension from drifting back into fragmented, inconsistent, or privacy-unsafe debugging behavior.

## Purpose

Use logging as a development and smoke-testing tool, not as an always-on primary release behavior.

The repository standard is:

- verbose structured logging is for debug and development workflows
- primary release behavior keeps production logging disabled by default unless the production threshold is intentionally raised
- runtime-sensitive changes must add or update diagnostics where failure analysis would otherwise be blind
- agents and developers must prefer the repository logger and collector over scattered `console.*` calls
- incompatible legacy diagnostics must be migrated or removed rather than preserved as parallel long-term systems

## Non-Negotiable Rules

1. New runtime diagnostics must use the repository logging contract once it exists.
2. Do not introduce new ad hoc logging systems when the shared logger can express the same signal.
3. When an existing logging or diagnostics structure conflicts with the canonical logger architecture, migrate or remove it instead of keeping both systems alive.
4. Keep production logging disabled by default unless the repository owner explicitly raises the production threshold.
5. Enable verbose logging only through explicit debug gates intended for development, smoke, and diagnostics sessions.
6. Treat logs as structured events, not free-form text streams.
7. Do not log secrets, API keys, full prompts, raw transcript dumps, or full meeting URLs.
8. Do not rely on browser-console inspection as the only debugging path for complex runtime work.
9. When a runtime-sensitive change increases debugging difficulty, update logs in the same workstream instead of deferring observability.
10. Agent access to logs in debug sessions must not depend on the user manually exporting files or copying console output back into chat.
11. For runtime-sensitive modules, logging design must intentionally cover all levels (`trace`, `debug`, `info`, `warn`, `error`) across module lifecycle paths.

## Required Log Shape

Each log event should be representable with these fields or their repository-approved equivalent:

- `timestamp`
- `level`: `trace`, `debug`, `info`, `warn`, `error`
- `domain`: broad subsystem such as `runtime`, `provider`, `translation`, `history`, `messaging`, `storage`, `assistant`, or `cloud-sync`
- `feature`: narrower functional slice such as `teams-caption-parser` or `session-continuation`
- `message`: stable action-oriented event name such as `observer_attached` or `provider_request_failed`
- `provider`: when applicable, such as `google-meet`, `microsoft-teams`, or `zoom-web`
- `sessionId` or equivalent correlation key when applicable
- `requestId` or `correlationId` when a multi-step operation crosses contexts
- `data`: sanitized structured payload

Free-form strings may still exist, but they must not be the only source of meaning.

## Level Semantics

- `trace`: high-volume, step-by-step diagnostics for temporary or deeply detailed debugging only
- `debug`: developer-facing decision signals and intermediate state transitions
- `info`: important business or lifecycle milestones that explain what the extension did
- `warn`: unusual but recoverable conditions, fallbacks, or degraded behavior
- `error`: failures that break a capability, abort an operation, or need immediate investigation

Do not inflate routine state changes to `warn` or `error`.

## Release And Debug Mode Policy

- development defaults may be more permissive than production when explicitly documented and persisted through repository settings
- primary release behavior must keep production logging disabled by default
- debug logging must be enabled explicitly by a repository-defined gate
- environment configuration files may define different minimum thresholds for development and production environments
- temporary runtime commands may override the persisted threshold for the current debug session without rewriting the canonical settings baseline
- the gate must work in local development and smoke workflows without requiring code edits for each session
- release packaging must not accidentally force debug logging on
- if a limited release-safe log remains necessary, keep it minimal, privacy-safe, and intentionally documented

## Privacy And Redaction Rules

Never log these values directly unless a future repository rule explicitly allows a tightly scoped local-only debug path:

- API keys or tokens
- full raw captions or transcript history
- full prompt bodies
- full meeting URLs containing user- or session-specific identifiers
- personally identifying speaker details beyond the minimal sanitized debugging need

Preferred alternatives:

- hashes or signatures
- counts and lengths
- boolean flags
- sanitized short snippets with strict truncation
- explicit redaction markers

## Performance Rules

- use bounded retention such as a ring buffer
- sample or gate high-volume trace events
- avoid repeated serialization of large payloads
- avoid storing logs indefinitely in extension storage
- keep content-side logging lightweight enough that provider pages remain responsive

## Cross-Context Rules

Because this browser extension spans content scripts, service worker logic, and extension UI surfaces:

- preserve correlation identifiers for operations that cross message boundaries
- forward runtime logs to the background collector instead of assuming local memory is enough
- prefer one canonical retrieval path for smoke tooling, UI inspection, and agents
- do not create per-context log formats that require custom decoding for each subsystem

## Rules For Agents And AI-Assisted Development

When implementing or modifying runtime-sensitive code, agents must:

1. inspect existing structured logging for the touched area before adding new diagnostics
2. add or update logs when the change affects lifecycle, provider detection, extraction, messaging, AI requests, persistence, or recovery behavior
3. prefer stable event names and structured payloads over conversational text
4. avoid introducing new direct `console.log` or `console.error` usage unless no repository logger path exists yet and the fallback is temporary and justified
5. remove or align incompatible legacy diagnostics in the touched area instead of extending both old and new patterns
6. ensure smoke, debug workflows, and in-repo agents can access the resulting logs through the repository retrieval path without user mediation
7. keep primary release behavior free from always-on verbose diagnostics

When reviewing runtime-sensitive changes, agents should actively check:

- is there enough structured logging to explain failure states?
- are the event names stable and understandable?
- are sensitive values sanitized?
- is the log volume appropriate for the enabled level?
- does the change preserve the debug-only activation model?

## Required Coverage Areas

As the canonical logger is rolled out, these areas should have high-quality structured diagnostics:

- runtime lifecycle start, sync, stop, retry, and recovery
- provider detection and DOM extraction
- caption parsing and de-duplication decisions
- background session resolution and continuation logic
- translation and assistant provider requests
- cross-context messaging
- persistence and migration paths for important runtime state
- cloud sync orchestration, reconciliation, and remote merge or delete application
- options/settings flows that verify providers, export or import backups, or mutate sync connectivity
- meeting history actions such as load, detail hydration, translation, summary generation, cancellation, and destructive updates
- overlay interaction surfaces such as header actions, capture guidance, visibility changes, drag/resize, and prompt lifecycles

## Per-Module Level Coverage Rule

For each runtime-sensitive module touched in a thread:

1. ensure at least one meaningful event path exists for each level:
- `trace`: fine-grained step transitions
- `debug`: decision state and branch context
- `info`: normal lifecycle milestones
- `warn`: recoverable degradation or fallback
- `error`: terminal or user-impacting failure
2. if a level is intentionally not emitted in that module, document rationale in code comments or module-level docs
3. do not close the thread with missing level-coverage rationale

## User-Visible Diagnostics Surfaces

- do not implement a diagnostics UI, viewer, panel, or other user-visible surface unless the repository owner explicitly asks for it
- if UI discussion is deferred, keep the work limited to logger contracts, collection, retrieval, validation, and documentation
- do not spend implementation time on speculative visuals or interaction patterns
- if a diagnostics UI is explicitly requested later, it must consume the canonical collector output rather than introducing a second logging pipeline
- any future diagnostics UI must remain outside primary release behavior unless the owner explicitly approves a broader rollout

## Definition Of Done Addendum

For runtime-sensitive work, the change is not done until all applicable items are true:

- logging impact was evaluated explicitly
- new blind spots introduced by the change were addressed
- production logging remains off by default unless intentionally raised
- incompatible legacy logging in the touched area was removed or explicitly aligned with the canonical model
- smoke or targeted validation was run when required by repository policy
- documentation was updated when logging behavior or operator workflow changed

## Related Documents

- `docs/contributing/execution-plans.md`
- `docs/quality/references/agent-onboarding-cdp-runtime.md`
- `docs/setup/debugging.md`
- `docs/operations/observability-and-support.md`
- `.github/copilot-instructions.md`
- `AGENTS.md`
