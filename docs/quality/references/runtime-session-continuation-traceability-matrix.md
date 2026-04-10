# Runtime Session Continuation Traceability Matrix

## Purpose

This matrix maps runtime session-continuation behavior-contract rules to repository validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| RCONT-001 | C-RCONT-001 | Teams direct-call metadata is continuation-ineligible in background continuation lookup and session resolution | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-002 | C-RCONT-002 | startup continuation lookup retries Teams pages without stable identifiers for up to `2500` ms | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-003 | C-RCONT-003 | startup continuation `resume` sets pending force-reuse options and loads stored preview | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-004 | C-RCONT-004 | prejoin continuation prompt sets pending force-reuse or force-new options for recently ended sessions | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-005 | C-RCONT-005 | session-start option resolution consumes pending options before recent-session prompts | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-006 | C-RCONT-006 | candidate lookup tries fingerprint matching before fallback ranking | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-007 | C-RCONT-006 | live stored sessions are rejected as continuation candidates | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-008 | C-RCONT-007 | force-reuse appends `rejoinHistory` and reopens ended sessions | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-009 | C-RCONT-004 | continuation prompt appears during the canonical Google Meet continuation smoke scenario | `pnpm chrome:smoke:live google-meet continuation` | implemented |
| RCONT-010 | C-RCONT-001 | Teams direct-call transitions force continuation flows into `force-new` without leaving prompts active | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |
| RCONT-011 | C-RCONT-003 | startup continuation falls back to capture consent when no continuation candidate exists | `tests/google-meet/runtime-session-continuation.contract.test.ts` | implemented |

## Notes

1. Generic prompt behavior moved to [runtime-prompts-traceability-matrix.md](./runtime-prompts-traceability-matrix.md) to keep this matrix continuation-specific.
2. Deterministic runtime continuation tests now cover startup retries, option precedence, direct-call force-new paths, and startup fallback-to-consent behavior.
