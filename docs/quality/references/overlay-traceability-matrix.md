# Overlay Traceability Matrix

## Purpose

This matrix maps overlay behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| OVLAY-001 | C-OVLAY-004 | `translationEnabled` toggles the live `translation-off` class immediately | `tests/google-meet/google-meet-overlay-settings.contract.test.ts` | implemented |
| OVLAY-002 | C-OVLAY-003 | appearance changes update overlay theme dataset immediately | `tests/google-meet/google-meet-overlay-settings.contract.test.ts` | implemented |
| OVLAY-003 | C-OVLAY-003 | overlay opacity changes update the CSS variable immediately | `tests/google-meet/google-meet-overlay-settings.contract.test.ts` | implemented |
| OVLAY-004 | C-OVLAY-003 | click-through changes toggle the live overlay class immediately | `tests/google-meet/google-meet-overlay-settings.contract.test.ts` | implemented |
| OVLAY-005 | C-OVLAY-003 | visibility changes toggle hidden state and `aria-hidden` immediately | `tests/google-meet/google-meet-overlay-settings.contract.test.ts` | implemented |
| OVLAY-006 | C-OVLAY-004 | translation dock state follows `translationEnabled` immediately | `tests/google-meet/google-meet-overlay-settings.contract.test.ts` | implemented |
| OVLAY-007 | C-OVLAY-004 | footer chat indicators follow `storeMeetingChat` immediately | `tests/google-meet/google-meet-overlay-settings.contract.test.ts` | implemented |
| OVLAY-008 | C-OVLAY-001 | stored overlay frames are clamped before restore and compact-start mount | `tests/google-meet/overlay-lifecycle.contract.test.ts` | implemented |
| OVLAY-009 | C-OVLAY-002 | overlay creation remains single-instance while wiring drag, resize, tooltip, and assistant subsystems | `tests/google-meet/overlay-lifecycle.contract.test.ts` | implemented |
| OVLAY-010 | C-OVLAY-005 | overlay teardown clears observers and removes overlay-owned DOM | `tests/google-meet/overlay-lifecycle.contract.test.ts` | implemented |

## Notes

1. Overlay lifecycle coverage now includes stored-frame clamping, singleton creation, and teardown contracts.
