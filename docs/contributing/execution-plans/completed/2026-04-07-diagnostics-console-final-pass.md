# Diagnostics Console Final Pass

This Execution Plan is a completed record.
It captures the final limited pass that closed the diagnostics console work on 2026-04-07.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Close the diagnostics console work with a final limited pass that syncs the remaining legacy diagnostics expectations to the final environment defaults and makes diagnostics messages readable in the viewer without changing the canonical event contract.

## Problem Statement

Two older diagnostics tests still expected pre-final defaults, and the viewer still rendered raw canonical message keys directly as the main title. This pass fixed the remaining suite drift and improved human readability in the UI while preserving raw keys for debugging, search, and export.

## Scope

- sync remaining diagnostics client and collector test expectations to the final config defaults
- add a presentation-layer helper that humanizes canonical diagnostics message keys for display only
- keep raw canonical keys intact for serialization, copy, and contract behavior
- surface the raw key in the viewer as secondary metadata and details
- extend tests to cover humanization, raw serialization stability, and raw-plus-human search behavior
- run the requested focused validation commands

## Non-Goals

- redesigning the diagnostics drawer or its information architecture
- changing canonical diagnostics event schema, collector storage, or redaction rules
- changing polling stability guards from the previous pass
- migrating any stored diagnostics data

## Constraints

- humanization is a UI concern only
- raw keys must remain accessible for debugging and export
- change only the failing expectations and related assertions in legacy tests
- keep the churn fix intact

## Verification

- `pnpm vitest run tests/google-meet/diagnostics-viewer.contract.test.ts tests/google-meet/use-diagnostics-console.contract.test.ts tests/google-meet/diagnostics-client.contract.test.ts tests/google-meet/diagnostics.collector.contract.test.ts`
- `pnpm build:production`

Observed outcomes:

- remaining legacy diagnostics tests now match the final defaults
- viewer titles are human-readable without changing exported canonical message keys
- search still matches both the raw key and the humanized label
- production build completed successfully

## Progress

- [x] Create active plan for final limited pass
- [x] Sync old diagnostics baseline expectations
- [x] Add human-readable diagnostics presentation helper and wire it into the viewer
- [x] Extend tests for humanization and raw-key stability
- [x] Run final validation and archive plan

## Surprises and Discoveries

- Observation: The remaining suite drift was isolated to legacy diagnostics expectations, not to the new diagnostics console stability tests.
  Evidence: Only `diagnostics-client.contract.test.ts` and `diagnostics.collector.contract.test.ts` needed default expectation changes.

- Observation: The collector contract test also needed a small type-only cleanup for `chrome.tabs.Tab` assertions in the current TypeScript context.
  Evidence: The file failed compile-time checks until those assertions were replaced with a local minimal tab shape.

## Decision Log

- Decision: Keep message humanization entirely in the options viewer helper layer.
  Rationale: The canonical diagnostics message key must remain unchanged for storage, copy/export, and debugging.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Show the raw canonical message key as muted monospace metadata whenever the humanized display label differs, and always expose it again in details.
  Rationale: The UI becomes easier to scan without hiding the exact canonical key developers need.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

The remaining diagnostics defaults are now consistent end-to-end: development baseline is `debug`, production baseline remains `off`, and production viewer visibility remains enabled. The old tests now assert the final intended configuration rather than dragging behavior backward.

The viewer now presents diagnostics messages with a lightweight humanization rule set: separators such as `_`, `-`, and `.` become spaces, whitespace is collapsed, common acronyms remain uppercase when recognized, and already human-readable strings remain stable. This improved scanability without touching the canonical event schema.

Raw canonical message keys still remain available for debugging in the UI and remain unchanged in row copy and visible-log export.