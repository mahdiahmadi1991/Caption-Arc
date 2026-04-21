# Assistant DLS Join Automation Hardening

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Stabilize Google Meet assistant DLS so the live smoke flow can reliably join the created meeting, reach an active session, and validate assistant behavior end to end in the owner debug browser.

## Problem Statement

Current assistant DLS runs can stall in the Meet pre-join screen even though provider smoke passes. Local evidence shows the assistant harness uses synthetic DOM click events for `Join now`, while the more stable Meet URL/runtime helpers use trusted CDP mouse clicks. The result is that assistant DLS can remain in `prejoin`, produce no session, and never exercise the real assistant pipeline.

## Scope

- harden `scripts/manual-smoke/lib/google-meet-assistant-harness.mjs` join automation to use the stable trusted/CDP click model
- add focused regression coverage so assistant harness click behavior does not fall back to synthetic-only clicks again
- rerun assistant-focused targeted tests and live assistant DLS against the active Chrome debug runtime
- classify any remaining failures after the join hardening based on live evidence

## Non-Goals

- redesigning the assistant UI or changing assistant product heuristics
- migrating smoke automation to Playwright
- broad refactors across unrelated smoke helpers unless required by the join fix

## Repository Context

- `scripts/manual-smoke/lib/google-meet-assistant-harness.mjs`
- `scripts/manual-smoke/lib/meet-url.mjs`
- `scripts/manual-smoke/smoke-google-meet-assistant.mjs`
- `tests/google-meet/manual-smoke-launch.contract.test.ts`
- `tests/google-meet/assistant-dls-*.contract.test.ts`

## Risks and Unknowns

- Google Meet pre-join UI may continue to change and expose additional text or button-state drift
- the assistant DLS flow may reveal a second failure after join succeeds
- command/runtime hangs may still need separate timeout hardening even after join reliability improves

## Chromium And Firefox Impact

- Chromium-family impact: direct on Chrome DLS harness behavior for assistant acceptance
- Firefox impact: none for runtime automation; Firefox remains outside this Chrome-only smoke harness

## Testing And Verification Impact

- `pnpm test:module:plan scripts/manual-smoke/lib/google-meet-assistant-harness.mjs scripts/manual-smoke/smoke-google-meet-assistant.mjs`
- focused Vitest coverage for smoke harness / assistant DLS helpers
- `pnpm chrome:debug:reload`
- `pnpm chrome:debug:doctor`
- `pnpm chrome:smoke:live:assistant`
- `pnpm chrome:smoke:live google-meet meeting`
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`

## Progress

- [x] Plan created before implementation
- [x] Patch assistant join automation to use trusted/CDP click flow
- [x] Add regression coverage for the harness click strategy
- [x] Verify assistant DLS live run succeeds or classify the next blocker
- [x] Run repository-required quality gates for the touched code

## Surprises and Discoveries

- Observation: direct probing on 2026-04-20 showed `Join now` remained visible after the assistant harness synthetic click path ran, but disappeared after a manual CDP mouse click to the same coordinates.
  Evidence: ad hoc runtime probe against the active owner debug session during assistant DLS triage.

- Observation: provider-level Google Meet DLS still passes in the same browser/runtime, which isolates the regression to assistant-specific join automation rather than baseline extension injection.
  Evidence: `pnpm chrome:smoke:live google-meet meeting` passed during the same investigation thread.

- Observation: after the trusted-click patch, assistant DLS still failed until the harness stopped opening a duplicate meeting tab. `resolveGoogleMeetUrl()` already causes the landing flow to create a real meeting target; creating a second target from the returned URL could strand the run in a non-joinable `Getting ready... / Waiting to join` state with `bridgePresenceState: prejoin`.
  Evidence: direct probes on 2026-04-20 showed the auto-opened `...?ijlm=...&adhoc=1` meeting target appearing during the landing flow, while a fresh tab opened from the same URL later stalled without join controls.

## Decision Log

- Decision: align assistant harness join automation with the trusted/CDP click model already used by the stable Meet URL helper instead of trying to make synthetic DOM clicks more permissive.
  Rationale: local reproduction already proved trusted click succeeds where synthetic click does not.
  Date/Author: 2026-04-20 / Codex

- Decision: reuse the landing-created meeting target before opening a new tab from the resolved URL.
  Rationale: assistant DLS needs the real target created by the instant-meeting landing flow, not a duplicate tab that may not become joinable.
  Date/Author: 2026-04-20 / Codex

## Outcomes and Retrospective

- Root cause 1: assistant DLS join automation used synthetic DOM clicks, which no longer reliably triggered Google Meet `Join now`.
- Root cause 2: even after trusted clicking, the harness still recreated the meeting URL in a fresh tab instead of reusing the real meeting target already opened by the landing flow, which could leave the run stuck in a `prejoin` state with no join controls.
- Fix:
  - assistant harness click automation now uses trusted CDP mouse clicks
  - assistant harness now resolves Google Meet from the stable meeting flow and reuses the landing-created target before creating a duplicate tab
  - focused contract guards were added to keep both behaviors from regressing
- Verification:
  - `pnpm test:module:plan scripts/manual-smoke/lib/google-meet-assistant-harness.mjs scripts/manual-smoke/smoke-google-meet-assistant.mjs`
  - `pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts tests/google-meet/assistant-dls-matrix.contract.test.ts tests/google-meet/assistant-dls-observer.contract.test.ts`
  - `pnpm docs:check`
  - `pnpm chrome:debug:reload`
  - `pnpm chrome:debug:doctor`
  - `pnpm chrome:smoke:live google-meet meeting`
  - `timeout 240s pnpm chrome:smoke:live:assistant`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
