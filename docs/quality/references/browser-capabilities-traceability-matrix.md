# Browser Capabilities Traceability Matrix

## Purpose

This matrix maps browser-capabilities behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| BCAP-001 | C-BCAP-001 | browser family and extension protocols are detected for Chrome and Firefox runtimes | `tests/google-meet/browser-capabilities.contract.test.ts` | implemented |
| BCAP-002 | C-BCAP-003 | cloud sync provider support is gated by browser-targeted OAuth configuration instead of browser family alone | `tests/google-meet/browser-capabilities.contract.test.ts` | implemented |
| BCAP-003 | C-BCAP-004 | default device labels combine resolved browser and platform labels | `tests/google-meet/browser-capabilities.contract.test.ts` | implemented |
| BCAP-004 | C-BCAP-002 | diagnostics storage selection falls back to local storage when session storage is unavailable or read-only | `tests/google-meet/diagnostics-storage-selection.contract.test.ts` | implemented |

## Notes

1. Existing deterministic browser-capability coverage is limited to runtime-family detection, cloud-sync support gating, default device labels, and diagnostics storage fallback.
