# Diagnostics Console UX Refinement Pass

This Execution Plan is a completed record.
It captures the focused UX and readability refinement pass for the diagnostics console on 2026-04-07.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Refine the existing diagnostics console drawer so it feels stable and readable in daily use without redesigning the surface or changing the canonical diagnostics contract. Done means the drawer traps its own scrolling, keeps a fixed and predictable vertical footprint, supports multi-select level filtering, renders richer human-readable event descriptions, and stays compact enough that the list remains the primary focus.

## Problem Statement

The diagnostics console already had stable polling and basic humanized message labels, but several UX issues remained: scroll chaining leaked into the underlying settings page, level filtering was too restrictive, event copy stayed terse and code-like, row hierarchy between levels was weak, drawer height felt unstable, and collapsed rows consumed too much space.

## Scope

- stop scroll chaining while the diagnostics drawer is open by combining CSS containment and page scroll lock
- convert level filtering from single-select to multi-select while preserving an `All` shortcut for select-all behavior
- add a presentation helper for richer diagnostics event titles and summaries using sanitized canonical event data only
- preserve raw canonical message keys for inline visibility, details, row copy, visible-log export, and search
- differentiate row styling by log level using subtle theme-consistent tinting
- give the drawer a fixed viewport-based height policy and compress the summary/list layout for denser scanning
- extend helper tests for multi-select filtering, richer descriptions, search coverage, and raw export stability
- update diagnostics docs to reflect the refined filter/search/readability behavior

## Non-Goals

- changing canonical diagnostics collector, background actions, storage shape, or redaction logic
- redesigning the floating action button or bottom-drawer concept
- changing polling cadence or fingerprint-based stability logic from the previous pass
- altering raw event serialization schema or copy/export format

## Constraints

- canonical diagnostics event schema, raw `message`, export serialization, and sanitized data rules had to remain unchanged
- presentation helpers could only derive text from existing sanitized event fields
- `All` had to stay a select-all shortcut, not a tri-state control
- the drawer had to remain keyboard-accessible and responsive
- the pass needed a fresh development build at completion for UI verification

## Verification

- `pnpm vitest run tests/google-meet/diagnostics-viewer.contract.test.ts tests/google-meet/use-diagnostics-console.contract.test.ts tests/google-meet/diagnostics-client.contract.test.ts tests/google-meet/diagnostics.collector.contract.test.ts`
- `pnpm build:development`
- `pnpm build:production`
- `pnpm docs:check`

Observed outcomes:

- the focused diagnostics suite passed with 35 tests across 4 files
- development and production builds completed successfully after the refinement pass
- docs validation passed after the debugging and observability docs were updated
- the remaining test warning was the pre-existing React `act(...)` environment warning in the hook suite, not a new regression

## Progress

- [x] Create active plan for the UX refinement pass
- [x] Implement scroll containment and background scroll lock
- [x] Add richer event description helper and wire it into search and row rendering
- [x] Convert level filtering to multi-select and tighten the layout density
- [x] Update docs and diagnostics repo memory to the final environment defaults
- [x] Run validation, archive the plan, and record outcomes

## Surprises and Discoveries

- Observation: Repository memory for diagnostics still said the development baseline was `trace`, but the implemented and tested baseline was already `debug`.
  Evidence: `/memories/repo/caption-arc-diagnostics.md` conflicted with the current diagnostics client and collector tests until it was updated.

- Observation: Search initially stopped matching the old humanized raw key once richer mapped titles were introduced.
  Evidence: `DIAG-VIEW-002B` failed until the search index explicitly included the raw key, the humanized raw key, the generated title, and the generated summary together.

## Decision Log

- Decision: Keep this pass strictly presentation-layer and interaction-layer, with no collector or background contract changes.
  Rationale: The request explicitly scoped the work to UX refinement without contract drift.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Use CSS overscroll containment plus document/body scroll locking and event propagation stops, rather than adding a more invasive custom wheel-boundary controller.
  Rationale: The simpler approach satisfied the scroll-chaining goal while preserving the existing drawer architecture.
  Date/Author: 2026-04-07 / GitHub Copilot

- Decision: Make search match four presentation surfaces at once: raw key, humanized raw key, mapped title, and generated summary.
  Rationale: Richer copy should improve readability without making the old raw-key search workflow less effective.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

The diagnostics drawer now behaves like a contained inspection surface instead of a translucent panel over a still-scrollable page. While the drawer is open, the document and body scroll are locked, the drawer shell uses overscroll containment, and wheel/touch interaction is stopped from bubbling beyond the diagnostics surface.

Viewer filtering is now multi-select. The default state keeps all diagnostics levels active, the `All` chip resets the full selection, and the existing visible-count plus copy-visible behavior continues to operate on the currently filtered event set.

Event presentation is richer but still contract-safe. `describeDiagnosticsEvent` now generates a human-readable title and summary from sanitized canonical event fields, using a small registry for common known events and a deterministic fallback for unknown ones. Raw canonical message keys still remain visible in the UI, still appear in details, and still remain unchanged in row copy and visible-log export.

The drawer footprint is now fixed to a viewport-based height policy, summary cards are more compact, row spacing is denser, and per-level row styling is more distinct without becoming visually aggressive. The list now keeps the main visual focus of the drawer.