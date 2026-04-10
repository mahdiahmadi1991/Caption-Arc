# Provider Routing Traceability Matrix

## Purpose

This matrix maps provider-routing behavior-contract rules to available validation surfaces.

## Status Legend

- `planned`: case identified, not yet implemented in repository tests
- `implemented`: case implemented in repository tests or canonical smoke tooling

## Matrix

| Case ID | Contract ID | Behavior Summary | Validation Surface | Status |
| --- | --- | --- | --- | --- |
| PROUTE-001 | C-PROUTE-001 | registry uses only `googleMeetProvider`, `microsoftTeamsProvider`, `zoomWebProvider` in fixed order | `tests/google-meet/provider-routing.contract.test.ts` | implemented |
| PROUTE-002 | C-PROUTE-002 | URL-based resolution returns the first matching provider | `tests/google-meet/provider-routing.contract.test.ts` | implemented |
| PROUTE-003 | C-PROUTE-003 | platform lookup returns the registered provider or `null` | `tests/google-meet/provider-routing.contract.test.ts` | implemented |
| PROUTE-004 | C-PROUTE-004 | page-context resolution returns the first `matchesPageContext` provider | `tests/google-meet/provider-routing.contract.test.ts` | implemented |
| PROUTE-005 | C-PROUTE-005 | supported-page checks use URL routing before page-context fallback during initialization | `tests/google-meet/provider-routing-initialization-order.contract.test.ts` | implemented |

## Notes

1. Deterministic provider-registry contract coverage exists for active-registry membership, URL routing, platform lookup, page-context routing, and initialization-order fallback rules.
