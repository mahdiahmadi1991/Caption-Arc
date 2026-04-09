# Runtime Session Continuation Traceability Matrix

## Purpose

This matrix maps runtime/session-continuation behavior-contract rules to automated or scripted validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
|---|---|---|---|---|
| RSC-PRM-001 | C-PRM-002 | capture-consent primary action resolves `approved` | `tests/google-meet/google-meet-prompts.contract.test.ts` (`GM-PRM-001`) | implemented |
| RSC-PRM-002 | C-PRM-003 | session-continuation secondary action resolves `restart` | `tests/google-meet/google-meet-prompts.contract.test.ts` (`GM-PRM-002`) | implemented |
| RSC-PRM-003 | C-PRM-003 | session-continuation timeout resolves `restart` | `tests/google-meet/google-meet-prompts.contract.test.ts` (`GM-PRM-003`) | implemented |
| RSC-PRM-004 | C-PRM-004 | session-ended timeout/escape behavior resolves `exit` | contract test (to be added) | planned |
| RSC-CONT-001 | C-CONT-001 | startup continuation candidate produces force-reuse on `resume` | contract test around `prepareMeetingStartupDecision` (to be added) | planned |
| RSC-CONT-002 | C-CONT-002 | prejoin continuation prompt sets pending force-reuse/force-new options | contract test around `handleSessionContinuationDecision` (to be added) | planned |
| RSC-CONT-003 | C-CONT-005 | force-reuse appends `rejoinHistory` and reopens lifecycle | contract test around `resolveMeetingSession` (to be added) | planned |
| RSC-CONT-004 | C-CONT-004 | Teams direct-call is continuation-ineligible | contract test around `findMeetingSessionContinuationCandidate` (to be added) | planned |
| RSC-CONT-005 | C-CONT-002 | continuation scenario prompt appears during Google Meet continuation smoke flow | `pnpm chrome:smoke:live google-meet continuation` | implemented |
| RSC-QA-001 | C-QA-001 | stale quick-access status entries are pruned and best entry is selected by priority+recency | contract test around `quick-access-runtime.ts` (to be added) | planned |
| RSC-QA-002 | C-QA-002 | teardown clears quick-access runtime status | contract test around `teardownPlatformRuntime` + message routing (to be added) | planned |
| RSC-SCW-001 | C-SCW-001 | continuation window value is rounded and clamped to `0..720` | contract test around `normalizeSessionContinuationWindowMinutes` (to be added) | planned |

## Notes

1. `RSC-CONT-*` planned cases should be prioritized when continuation logic is changed.
2. Smoke validation does not replace deterministic contract tests for pure logic branches.
