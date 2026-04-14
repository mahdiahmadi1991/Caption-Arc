# Assistant Runtime Traceability Matrix

## Purpose

This matrix maps assistant-runtime behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| ASRT-001 | C-ASRT-001 | session and default profiles resolve assistant enablement deterministically | `tests/google-meet/assistant-runtime.contract.test.ts` | implemented |
| ASRT-002 | C-ASRT-002 | assistant session application sorts outputs and derives live state deterministically | `tests/google-meet/assistant-runtime.contract.test.ts` | implemented |
| ASRT-003 | C-ASRT-003 | unread state advances only while the assistant surface is closed | `tests/google-meet/assistant-runtime.contract.test.ts` | implemented |
| ASRT-004 | C-ASRT-004 | assistant sync polls session and live-state background endpoints every `1200` ms | `tests/google-meet/assistant-runtime.contract.test.ts` | implemented |
| ASRT-005 | C-ASRT-005 | enabling assistant is blocked while OpenAI availability is not operational | `tests/google-meet/assistant-runtime.contract.test.ts` | implemented |

## Notes

1. Assistant runtime planned coverage is now closed with deterministic contract tests.
2. Assistant resolution coverage follows the canonical meeting-profile naming and default-profile fallback path used by active session state and shared settings.