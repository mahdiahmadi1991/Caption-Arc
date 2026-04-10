# Runtime Prompts Traceability Matrix

## Purpose

This matrix maps runtime-prompt behavior-contract rules to repository validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| RPROMPT-001 | C-RPROMPT-004 | capture-consent primary action resolves `approved` | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |
| RPROMPT-002 | C-RPROMPT-005 | session-continuation secondary action resolves `restart` | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |
| RPROMPT-003 | C-RPROMPT-005 | session-continuation timeout resolves `restart` | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |
| RPROMPT-004 | C-RPROMPT-001 | hidden overlay with `showWhenOverlayHidden=false` resolves `timeoutDecision` immediately | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |
| RPROMPT-005 | C-RPROMPT-002 | opening a new prompt removes the previous active prompt lifecycle | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |
| RPROMPT-006 | C-RPROMPT-003 | `Escape` resolves the configured `escapeDecision` | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |
| RPROMPT-007 | C-RPROMPT-006 | session-ended timeout or `Escape` resolves `exit` | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |
| RPROMPT-008 | C-RPROMPT-007 | `forceResolveActivePrompt` resolves only the matching active prompt kind | `tests/google-meet/google-meet-prompts.contract.test.ts` | implemented |

## Notes

1. Prompt lifecycle and force-resolution behavior are covered in deterministic contract tests.
