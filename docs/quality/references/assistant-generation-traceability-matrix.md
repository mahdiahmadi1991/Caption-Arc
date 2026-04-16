# Assistant Generation Traceability Matrix

## Purpose

This matrix maps assistant-generation behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| AGEN-001 | C-AGEN-001 | trigger consideration follows trigger policy, participant scope, and final-caption gating | `tests/google-meet/assistant-trigger.contract.test.ts` | implemented |
| AGEN-002 | C-AGEN-002 | trigger resolution splits clauses, suppresses answered clauses, and coalesces nearby caption churn | `tests/google-meet/assistant-dedupe.contract.test.ts`, `tests/google-meet/assistant-replay.contract.test.ts` | implemented |
| AGEN-003 | C-AGEN-003 | prompt assembly includes unresolved-question focus plus explicit output-language enforcement | `tests/google-meet/assistant-output-language-transition.contract.test.ts`, `tests/google-meet/assistant-replay.contract.test.ts` | implemented |
| AGEN-004 | C-AGEN-004 | assistant passes suppress on readiness or assistant-disable gates and re-enable deterministically | `tests/google-meet/assistant-pass.contract.test.ts`, `tests/google-meet/assistant-settings-transition.contract.test.ts` | implemented |
| AGEN-005 | C-AGEN-005 | successful passes persist only unresolved outputs and refresh assistant memory from session state | `tests/google-meet/assistant-pass.contract.test.ts`, `tests/google-meet/assistant-replay.contract.test.ts` | implemented |
| AGEN-006 | C-AGEN-006 | session save and shell-save preserve stored assistant artifacts | `tests/google-meet/assistant-history-persistence.contract.test.ts` | implemented |
| AGEN-007 | C-AGEN-007 | switching a session to a profile disabled by default suppresses later assistant passes | `tests/google-meet/assistant-profile-switch.contract.test.ts` | implemented |
| AGEN-008 | C-AGEN-004 | switching the session profile changes future prompt semantics when assistant state remains enabled | `tests/google-meet/assistant-profile-switch.contract.test.ts` | implemented |
| AGEN-009 | C-AGEN-007 | OpenAI stream and non-stream generation fail on incomplete or truncated responses | `tests/google-meet/assistant-openai-stream.contract.test.ts` | implemented |
| AGEN-010 | C-AGEN-008 | cooperative cancellation exits before or during provider work without persisting a fake completed answer | `tests/google-meet/assistant-cancellation.contract.test.ts` | implemented |
| AGEN-011 | C-AGEN-001, C-AGEN-005 | baseline joined-session DLS proves a direct participant question produces one persisted assistant output attached to the joined Meet session | `pnpm chrome:smoke:live:assistant baseline` | implemented |
| AGEN-012 | C-AGEN-002 | joined-session DLS proves `q1 -> q1 + q2` only persists the unresolved new clause on the second pass | `pnpm chrome:smoke:live:assistant q1-then-q1-plus-q2` | implemented |
| AGEN-013 | C-AGEN-001, C-AGEN-004 | joined-session DLS proves `participantScope=others_only` suppresses self-authored speech while keeping assistant state watchable | `pnpm chrome:smoke:live:assistant others-only-self-speech` | implemented |
| AGEN-014 | C-AGEN-003, C-AGEN-004 | joined-session DLS proves a mid-session output-language switch affects later assistant outputs without restarting the session | `pnpm chrome:smoke:live:assistant language-switch-en-to-fa` | implemented |
| AGEN-015 | C-AGEN-004, C-AGEN-008 | joined-session DLS proves session-profile switching changes later assistant-output semantics in the same session | `pnpm chrome:smoke:live:assistant profile-switch-mid-session` | implemented |
| AGEN-016 | C-AGEN-001 | joined-session DLS proves `salience_first` reacts to a risk statement without a question mark | `pnpm chrome:smoke:live:assistant salience-first-client-call` | implemented |
| AGEN-017 | C-AGEN-001, C-AGEN-004 | joined-session DLS proves `proactive + coach_me + all_participants` can react to a longer self-authored statement | `pnpm chrome:smoke:live:assistant proactive-coach-mode` | implemented |
| AGEN-018 | C-AGEN-004 | joined-session DLS proves `enabledByDefault=false` keeps the assistant suppressed for a direct interviewer question | `pnpm chrome:smoke:live:assistant disabled-by-default-suppressed` | implemented |
| AGEN-019 | C-AGEN-003, C-AGEN-004 | joined-session DLS proves `suggest_next_point + bullets + ultra_brief + direct + fastest + salience_first + all_participants` stays coherent in a daily-sync style run | `pnpm chrome:smoke:live:assistant daily-sync-bullets-fastest` | implemented |
| AGEN-020 | C-AGEN-003 | joined-session DLS proves a custom assistant prompt and `short_paragraph` format affect the generated output shape | `pnpm chrome:smoke:live:assistant custom-prompt-short-paragraph` | implemented |
| AGEN-021 | C-AGEN-003 | joined-session DLS proves `improve_my_answer + script + supportive + careful + proactive` reacts to self-authored speech | `pnpm chrome:smoke:live:assistant improve-my-answer-script` | implemented |
| AGEN-022 | C-AGEN-003 | joined-session DLS proves `summarize_what_was_just_said + structured_sections + expanded + analytical` renders heading-and-list output in the overlay | `pnpm chrome:smoke:live:assistant summarize-structured-sections` | implemented |
| AGEN-023 | C-AGEN-001, C-AGEN-003, C-AGEN-004 | fixture inventory plus matrix contract prove every live assistant option value has at least one DLS owner scenario before the full matrix runs | `tests/google-meet/assistant-dls-matrix.contract.test.ts`, `pnpm chrome:smoke:live:assistant:matrix` | implemented |

## Notes

1. Assistant-generation coverage is split from assistant-runtime coverage on purpose: runtime covers content-side session polling and unread state, while this matrix covers background generation and durability behavior.
2. Replay fixtures intentionally validate real regression shapes against the same deterministic pass orchestration used by normal contract tests.
3. Browser DLS owns joined-session acceptance plus representative coverage for every live assistant option value; deterministic contract and replay suites still own most branching logic and edge-case exhaustiveness.
