# Google Meet Automation Traceability Matrix

## Purpose

This matrix maps Google Meet provider behavior-contract rules to repository validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| GM-001 | C-GMEET-001 | Google Meet routes classify `/new`, meeting-code paths, and unrelated paths deterministically | `tests/google-meet/google-meet-provider.contract.test.ts` | implemented |
| GM-002 | C-GMEET-002 | page-context detection uses leave-call, prejoin, and meeting-shell signals while ignoring extension overlay controls | `tests/google-meet/google-meet-provider.contract.test.ts` | implemented |
| GM-003 | C-GMEET-003 | provider presence resolves `unknown`, `prejoin`, and `joined` from route plus leave-call state | `tests/google-meet/google-meet-provider.contract.test.ts` | implemented |
| GM-004 | C-GMEET-004 | caption toggles and caption-region presence distinguish enabled state from current availability | `tests/google-meet/google-meet-provider.contract.test.ts` | implemented |
| GM-005 | C-GMEET-004 | automatic caption enable returns immediately when already enabled and otherwise polls for the enable control | `tests/google-meet/google-meet-provider.contract.test.ts` | implemented |
| GM-006 | C-GMEET-004 | automatic caption enable clicks the discovered toggle and verifies the enabled state in a bounded window | `tests/google-meet/google-meet-provider.contract.test.ts` | implemented |
| GM-007 | C-GMEET-005 | duplicate caption updates are skipped and same-speaker updates reschedule finalization | `tests/google-meet/google-meet-automation.contract.test.ts` | implemented |
| GM-008 | C-GMEET-005 | speaker switches finalize the previous caption and create a new caption | `tests/google-meet/google-meet-automation.contract.test.ts` | implemented |
| GM-009 | C-GMEET-006 | chat extraction is skipped when `storeMeetingChat` is disabled and de-duplicates by message ID plus recent fingerprint | `tests/google-meet/google-meet-automation.contract.test.ts` | implemented |
| GM-010 | C-GMEET-007 | caption and chat observers reattach on region changes and obey chat-storage settings | `tests/google-meet/google-meet-automation.contract.test.ts` | implemented |
| GM-011 | C-GMEET-008 | observer teardown clears local chat/caption state and finalizes pending captions | `tests/google-meet/google-meet-automation.contract.test.ts` | implemented |
| GM-012 | C-GMEET-009 | metadata includes platform, provider label, meeting code, title, and source URL | `tests/google-meet/google-meet-provider.contract.test.ts` | implemented |

## Notes

1. Runtime boot-marker, reset-page, and generic prompt cases remain in runtime-focused matrices so this file stays provider-specific.
2. Google Meet observer lifecycle plus caption/chat pipeline internals now include deterministic contract coverage.
