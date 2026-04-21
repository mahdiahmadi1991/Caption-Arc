# Diagnostics Collector Test Hardening

This Execution Plan is a living document.
Keep `Progress`, `Decisions`, and `Verification` current while work is active.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose

Close the most important remaining gap in the diagnostics rollout by adding direct tests for collector behavior and debug-off guardrails.

## Scope

- add unit coverage for the background diagnostics collector lifecycle
- verify append, clear, snapshot, and retrieval behavior through the collector surface
- verify the default release-safe state keeps diagnostics disabled until explicitly enabled
- verify client-side gating stays safe when runtime or storage support is unavailable

## Non-Goals

- new diagnostics UI work
- provider smoke expansion beyond the existing validation baseline
- changing the diagnostics schema unless a test exposes a real defect

## Implementation Notes

- prefer tests around the real exported collector APIs over mock-only contract duplication
- keep debug logging disabled by default in all newly tested paths
- if gaps are found during testing, fix the underlying collector or client behavior instead of weakening the tests

## Verification

- `pnpm test:google`: passed
- `pnpm build`: passed

## Progress

- [x] active plan created
- [x] collector tests added
- [x] debug-off guardrail tests added
- [x] validation commands passing

## Decisions

- 2026-04-06: Treat collector/retrieval coverage as the next practical milestone because the runtime plumbing exists but its direct automated coverage is still thinner than the plan intended.
- 2026-04-06: Add separate client-side guardrail coverage instead of relying only on collector tests so debug-off behavior is protected on both sides of the message boundary.

## Outcomes

- added collector contract coverage for disabled-by-default behavior, persisted hydration, event retention, filtering, snapshot handling, and clear operations
- added client contract coverage for missing-browser-API safety, enabled runtime forwarding, dynamic disablement via storage changes, and swallowed runtime send failures
- kept the milestone scoped to backend observability and guardrails, with no user-visible UI work