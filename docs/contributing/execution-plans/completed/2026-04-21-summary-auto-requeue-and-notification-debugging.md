# Summary Auto-Requeue And Notification Debugging

This Execution Plan is a historical record.
It captures the work that diagnosed the summary-ready notification click path and aligned automatic end-of-meeting summaries with the confirmed segment-based business rule.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Diagnose the summary-ready notification click path without guessing, then align automatic end-of-meeting summaries with the confirmed business rule: one automatic summary per non-empty ended segment while summary content remains cumulative over the whole session.

## Problem Statement

Two summary-related regressions became visible in live use:

- In the dedicated Chrome debug profile used for diagnostics and DLS, a summary-ready notification could be shown but clicking it did not open session detail.
- Automatic summary generation could repeat for the same ended session, producing multiple back-to-back automatic summaries for the same meeting profile and output language even though the intended business behavior was one automatic summary per non-empty ended segment.

The owner explicitly requested evidence-driven diagnosis and asked that fixes avoid accidental business-regression changes.

## Scope

- add structured diagnostics for the summary-ready notification click flow
- inspect live diagnostics evidence from the debug profile before changing product behavior
- identify why automatic summary eligibility is re-opening for already summarized ended sessions
- implement a narrow per-segment automatic-summary dedupe fix and keep segment summaries independent in the queue
- update behavior-sensitive docs and tests with the new rule
- produce fresh Chrome and Firefox development builds for owner verification

## Non-Goals

- redesigning summary notifications for normal browser profiles where click routing already works
- changing manual summary generation behavior
- changing summary content, model selection, or summary prompt semantics
- introducing migration or backward-compatibility scaffolding

## Repository Context

Primary implementation surfaces:

- `entrypoints/background/history.ts`
- `entrypoints/background/index.ts`
- `entrypoints/shared/meeting-summary.ts`
- `entrypoints/shared/meeting-session.ts`

Primary docs surfaces:

- `docs/api/message-contracts.md`
- `docs/api/meeting-summary-pipeline-behavior-contract.md`
- `docs/quality/references/meeting-summary-pipeline-traceability-matrix.md`

Primary tests likely affected:

- `tests/google-meet/meeting-summary-pipeline.contract.test.ts`
- `tests/google-meet/terms-gate-background.contract.test.ts`

## Current Code Observations

- The summary-ready notification click handler is registered in background startup, and direct runtime invocation of the handler can create/open Meeting History successfully in the debug profile.
- Live diagnostics from the debug profile show notification creation events but do not show listener-invocation events after a real notification click, which means the failure occurs before handler execution inside the extension.
- Automatic summary eligibility currently compares the latest saved summary timestamp with a session boundary that includes mutable session timestamps such as `updatedAt`.
- A real affected session showed `updatedAt` advancing well after `endTime` and after the first automatic summary, which reopened automatic-summary eligibility during a later background restart and caused another automatic summary to queue.

## Proposed Design Direction

- Keep the new diagnostics in place for the summary-ready notification click path so the debug-profile-specific delivery issue remains observable.
- Bind automatic summary eligibility to the current ended segment rather than mutable session timestamps.
- Preserve cumulative summary content over the full session, but allow exactly one automatic summary per non-empty segment for the effective profile/language at that moment.
- Allow multiple persisted automatic summary jobs for one session when they belong to different segments, while still processing them sequentially per session.

## Chromium And Firefox Impact

- Chromium-family impact: yes, background summary orchestration changes.
- Firefox impact: yes, shared summary orchestration code changes, though the reported notification-click issue is currently isolated to the dedicated Chrome debug profile.
- No browser gating is intended.

## Testing And Verification Impact

Required validation included:

- focused Vitest coverage for summary pipeline and background message routing
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check:behavior`
- `pnpm docs:check`
- `pnpm build:target:chrome:development`
- `pnpm build:target:firefox:development`

## Progress

- [x] Create plan before implementation
- [x] Add diagnostics for summary-ready notification click flow
- [x] Inspect live runtime diagnostics from the debug profile
- [x] Implement automatic-summary dedupe fix based on segment identity
- [x] Update tests and behavior docs
- [x] Produce fresh Chrome and Firefox development builds

## Surprises and Discoveries

- Observation: the Chrome debug profile can show the notification and still never dispatch a real `notifications.onClicked` event into the extension, even though direct runtime invocation of the same handler succeeds.
  Evidence: live diagnostics collected on 2026-04-21

- Observation: the affected looping session had `updatedAt` equal to the timestamp of the second automatic summary while `endTime` and `lastSeenAt` remained much earlier, proving that mutable session metadata can reopen automatic-summary eligibility long after meeting end.
  Evidence: runtime `getMeetingSession` inspection on 2026-04-21

- Observation: the repeated auto-summary queue happened during a later background startup path, which means `reconcileAutomaticSummaryQueue()` is correctly surfacing an eligibility bug instead of causing duplication by itself.
  Evidence: background diagnostics around `background_runtime_started`, `protected_services_started`, and `summary_job_queued`

- Observation: the affected stored session had a later `updatedAt` than its `endTime` and first automatic summary timestamp, while its transcript/chat content remained unchanged.
  Evidence: runtime `getMeetingSession` inspection on 2026-04-21

- Observation: the owner clarified the intended rule is one automatic summary per non-empty ended segment, while each summary still sees the cumulative full-session content and uses point-in-time config.
  Evidence: in-thread clarification on 2026-04-21

## Decision Log

- Decision: do not change normal summary-ready notification product behavior yet based only on the debug-profile symptom.
  Rationale: diagnostics show the real click event is not arriving at the extension in that profile, while the in-extension navigation path itself still works when invoked directly.
  Date/Author: 2026-04-21 / Codex

- Decision: fix automatic summary dedupe with segment identity instead of timestamp heuristics alone.
  Rationale: business intent is one automatic summary per non-empty ended segment, and timestamp-only gating is vulnerable to unrelated metadata writes after meeting end.
  Date/Author: 2026-04-21 / Codex

- Decision: allow distinct automatic summary jobs for different segment identities within the same session queue.
  Rationale: segment summaries must stay independent, but sequential per-session execution remains sufficient and lower-risk than parallel summary generation for one session.
  Date/Author: 2026-04-21 / Codex

## Outcomes and Retrospective

- Added development diagnostics that prove the debug-profile-specific notification issue happens before `handleSummaryReadyNotificationClick(...)` executes on real notification clicks.

- Fixed automatic summary eligibility so ended sessions create at most one automatic summary per non-empty segment, regardless of later mutable session timestamp changes.

- Updated the persisted summary queue model so automatic jobs from different segments in the same session no longer replace each other.

- Validation completed:
  - `pnpm docs:check:behavior`
  - `pnpm docs:check`
  - `pnpm test:targeted:plan`
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm build:target:chrome:development`
  - `pnpm build:target:firefox:development`
