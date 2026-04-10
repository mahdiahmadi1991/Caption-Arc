# Translation Pipeline Traceability Matrix

## Purpose

This matrix maps translation-pipeline behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| TRANS-001 | C-TRANS-001 | generation and translation requests are blocked by configuration and translation-enabled gating | `tests/google-meet/translation-pipeline.contract.test.ts` | implemented |
| TRANS-002 | C-TRANS-002 | provider execution retries across the model ring only for rate-limit failures | `tests/google-meet/translation-pipeline.contract.test.ts` | implemented |
| TRANS-003 | C-TRANS-003 | success and failure paths update OpenAI verification snapshots and return provider-context debug errors | `tests/google-meet/translation-pipeline.contract.test.ts` | implemented |

## Notes

1. Translation pipeline planned coverage is now closed with deterministic contract tests.
