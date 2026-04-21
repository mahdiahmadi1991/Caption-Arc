# Quick Access Soft Refresh For Meeting Artifacts

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Add a new quick-access capability that can soft-refresh CaptionArc artifacts injected into the active meeting tab, then let the runtime re-match itself to the current meeting/session state and continue normally.

The owner wants this as a recovery tool for in-meeting extension glitches without forcing a full browser reload, full runtime teardown, or loss of session continuity.

## Problem Statement

When the extension develops an unexpected runtime issue mid-meeting, the current quick-access surface does not provide a direct recovery action for injected artifacts. Existing runtime teardown paths are broader than needed and can affect lifecycle/session behavior, while the desired recovery flow is narrower:

- reset injected artifacts in the current meeting tab
- let the runtime re-evaluate the live page state
- restore overlay/runtime behavior as if the extension had re-entered the same ongoing session under normal product rules
- avoid losing the current session/history binding unless standard lifecycle code would already do so

## Confirmed Product Direction

Confirmed in-thread by the repository owner:

- this is explicitly a `soft refresh`, not a hard reset
- it should target extension-injected meeting-tab artifacts only
- it must not reset or disturb the browser tab itself or provider-owned artifacts/state
- after refresh, overlay/runtime should match the current meeting state and continue working on the same session under existing lifecycle rules
- the feature is intended as an in-meeting recovery tool when an unexpected extension bug appears
- the action must be guarded by current extension/runtime state in the tab rather than acting as a blind global reset
- the removal/reinjection flow must feel smooth in the UI, in the same quality family as the existing quick-access visibility toggle rather than a jarring flash or hard pop

## Scope

- add a new quick-access control in popup for runtime artifact refresh
- define and implement a dedicated runtime message/command path for soft refresh
- reset overlay-owned and runtime-local injected artifacts in the active meeting tab without treating the meeting as a new unrelated session by default
- keep provider-owned page state and provider DOM artifacts outside the extension's ownership untouched
- re-run runtime/provider sync so the meeting surface resumes according to the existing lifecycle rules
- add/update tests for quick-access command routing and runtime soft-refresh behavior
- update relevant runtime/message/product docs in the same change

## Non-Goals

- full runtime teardown as the primary behavior
- browser tab reload or extension reload as the default recovery path
- changing provider-owned meeting UI state as part of the refresh
- resetting meeting history, settings, summaries, or persistent session records
- introducing a second quick-access control that duplicates full settings behavior
- changing the product's session continuity rules beyond what soft refresh requires

## Repository Context

Primary implementation surfaces:

- `entrypoints/popup/App.tsx`
- `entrypoints/background/index.ts`
- `entrypoints/background/quick-access-runtime.ts`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/shared/quick-access-status.ts`

Primary behavior/docs surfaces:

- `docs/product/quick-access-and-runtime-control.md`
- `docs/product/business-capability-map.md`
- `docs/api/message-contracts.md`
- `docs/api/runtime-lifecycle-behavior-contract.md`
- `docs/quality/references/runtime-lifecycle-traceability-matrix.md`

Primary tests likely affected:

- `tests/google-meet/runtime-lifecycle.contract.test.ts`
- `tests/google-meet/google-meet-runtime-reset.contract.test.ts`
- popup/quick-access contract coverage or a new focused quick-access test file
- DLS runtime validation for Google Meet

## Current Code Observations

- Quick access currently exposes runtime status plus a small set of fast controls, but no recovery/reset action.
  Evidence: `entrypoints/popup/App.tsx`, `docs/product/quick-access-and-runtime-control.md`

- The content runtime already has broad teardown and provider-specific reset behavior, but those paths are tied to lifecycle/reset-page semantics rather than an explicit user-triggered soft-refresh command.
  Evidence: `entrypoints/content/platform-runtime.ts`

- `teardownPlatformRuntime()` is too destructive to use blindly for this feature because it stops capture with teardown semantics, clears runtime-local state broadly, and exits the active runtime.
  Evidence: `docs/api/runtime-lifecycle-behavior-contract.md`, `entrypoints/content/platform-runtime.ts`

- The desired feature likely needs a narrower command that:
  1. clears injected artifact surfaces/observers/runtime-local drift
  2. preserves the current meeting/session intent as much as possible
  3. re-runs lifecycle synchronization against the current provider/page state
  4. explicitly avoids touching provider-owned tab/page artifacts outside the extension's ownership

## Proposed Design Direction

Design target:

- popup button triggers a background-mediated command aimed at the active meeting runtime
- content runtime performs a dedicated soft-refresh routine instead of reusing full teardown
- the routine should rebuild or reattach extension-owned surfaces and observers, then request normal lifecycle reconciliation
- the user-visible transition should be intentionally smooth, similar in quality to the quick-access visibility toggle rather than a harsh remove/repaint jump

Preferred command path:

1. popup sends a new background action such as `requestQuickAccessSoftRefresh`
2. background resolves the best active quick-access runtime entry and forwards a targeted tab/frame message
3. content runtime receives a dedicated soft-refresh command and executes an in-place refresh routine
4. content runtime republishes quick-access status and re-runs lifecycle sync

Preferred runtime semantics:

- clear/destroy extension-owned artifact surfaces in the meeting tab
- stop/restart provider observation if needed
- reset stale runtime-local UI/control state that can drift during bugs
- do not mutate provider-owned tab state or provider UI artifacts as part of the refresh
- preserve session continuity intent unless the current page/provider state legitimately requires ended/new-session handling under the existing lifecycle contract
- treat the final state as "same session, re-synced runtime", not "brand new meeting"
- reintroduce overlay/artifact surfaces with a smooth transition so the user does not see an abrupt teardown/reinject flash

## Risks and Unknowns

- if the soft-refresh routine is too shallow, buggy observers or stale DOM handles may survive and the feature will appear ineffective
- if it is too deep, it may accidentally behave like a hard reset and disrupt session continuity
- the routing path from popup to the correct active meeting tab/frame needs careful definition because quick access currently reads status snapshots rather than directly targeting refreshable runtime endpoints
- provider-specific observer state may need slightly different reset treatment across Google Meet, Teams, and Zoom
- user feedback in the popup may need a transient loading/success/failure state to avoid repeated clicks during refresh
- smoothing the visual transition without masking real failure states may require an explicit intermediate UI contract for the popup and/or overlay

## Product / UX Questions To Resolve During Implementation

- button label and helper copy should reflect recovery semantics, not browser reload semantics
- the control should probably appear only when an active supported runtime entry is present, or otherwise become disabled with clear copy
- decide whether the action should be one-click or require a lightweight confirmation; current preference is likely one-click because this is an operational recovery tool
- loading/transition treatment should match the quick-access quality bar set by the existing visibility control: protected, responsive, and visually smooth

## Chromium And Firefox Impact

- Chromium-family impact: yes, popup quick access, background routing, and content runtime behavior all change
- Firefox impact: yes, the same shared popup/background/runtime architecture should support the same feature
- No intentional browser gating unless provider/runtime constraints force it and the owner explicitly approves

## Testing And Verification Impact

Required validation should include:

- targeted Vitest coverage for popup/background/runtime command flow
- runtime lifecycle regression coverage around soft refresh and session continuity
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:target:chrome:development`
- `pnpm build:target:firefox:development`

Runtime-sensitive validation:

- `pnpm chrome:debug:reload`
- DLS verification on Google Meet with the new quick-access control
- at least one shared-runtime sanity pass for other affected providers if the implementation touches generic runtime codepaths

## Progress

- [x] Plan created before implementation
- [x] Define the soft-refresh command contract and routing path
- [x] Implement popup control and background/content command handling
- [x] Add/update tests for quick-access and runtime lifecycle behavior
- [x] Update docs/contracts
- [x] Run required validation and fresh browser development builds
- [x] Address post-implementation review findings around active-tab targeting, Google Meet observer reset, and popup helper-copy readability

## Surprises and Discoveries

- Observation: existing runtime reset behavior is already nuanced for provider reset pages, especially Teams, so the new feature should not simply alias to existing teardown logic.
  Evidence: `entrypoints/content/platform-runtime.ts`, `docs/api/runtime-lifecycle-behavior-contract.md`

- Observation: quick access currently acts as a status/control surface and does not yet own any direct recovery operation.
  Evidence: `entrypoints/popup/App.tsx`, `docs/product/quick-access-and-runtime-control.md`

- Observation: preserving the current session is not enough on its own; the refresh path also needs to preserve or recompute extension-side visibility semantics so a dismissed/hidden overlay does not accidentally reappear as a side effect of reinjection.
  Evidence: `entrypoints/content/platform-runtime.ts`, `entrypoints/content/overlay/visibility.ts`

- Observation: the initial refresh implementation restarted provider observation without clearing Google Meet's module-level DOM caches, so a soft refresh in the same meeting DOM could rebuild the overlay while leaving captions/chat observers detached.
  Evidence: `entrypoints/content/platform-runtime.ts`, `entrypoints/content/providers/google-meet.ts`

- Observation: background routing originally chose the freshest runtime snapshot globally, which made the refresh button capable of resetting a different meeting tab than the one the popup was acting on.
  Evidence: `entrypoints/background/quick-access-runtime.ts`, review findings from 2026-04-20

- Observation: `test:google:coverage` surfaced one unrelated `diagnostics.collector` flake on the first pass (`session.set` call count doubled), but the file passed in isolation and the full coverage rerun passed without code changes.
  Evidence: `tests/google-meet/diagnostics.collector.contract.test.ts`, validation logs from 2026-04-20

## Decision Log

- Decision: treat this as a new explicit quick-access recovery capability instead of exposing full runtime teardown directly.
  Rationale: the owner explicitly requested a soft refresh that preserves session continuity behavior and only re-initializes injected artifacts.
  Date/Author: 2026-04-20 / Codex

- Decision: prefer a popup -> background -> content-runtime command path over a popup-only local hack.
  Rationale: active meeting runtime ownership currently lives in content/background coordination, and the recovery action should target the correct active tab/frame using the same architecture family as other runtime controls.
  Date/Author: 2026-04-20 / Codex

- Decision: implement soft refresh as a dedicated artifact rebuild plus observer restart flow, guarded against concurrent lifecycle sync, instead of reusing `teardownPlatformRuntime()`.
  Rationale: the owner explicitly wants same-session continuity and provider-state preservation, while full teardown is too destructive for a recovery control.
  Date/Author: 2026-04-20 / Codex

- Decision: recovery refresh routing must resolve the active browser tab first and only target a runtime registered inside that active tab; it must never silently refresh a different meeting tab just because another runtime snapshot is newer or higher-priority.
  Rationale: the product contract is explicitly scoped to the active meeting tab, and cross-tab resets are a correctness bug rather than a graceful fallback.
  Date/Author: 2026-04-20 / Codex

## Outcomes and Retrospective

- Implementation completed with passing focused tests, passing full Google suite, passing docs/business/behavior sync checks, fresh Chrome/Firefox development builds, and a passing Google Meet DLS smoke run.

- Post-implementation review fixes completed:
  - recovery refresh now targets only a refreshable runtime in the active browser tab
  - Google Meet soft refresh explicitly clears provider-local DOM caches before observer restart
  - overlay helper copy now wraps after tooltip removal instead of clipping longer locales

- Validation after the review fixes:
  - focused contracts passed for quick-access runtime, popup quick-access refresh, runtime lifecycle, Google provider/runtime reset, content-script marker, prompts, diagnostics viewer/console, shared UI controls, terms gate, manual smoke launch, and i18n boundaries
  - `pnpm chrome:smoke:live google-meet meeting` passed
  - `pnpm chrome:smoke:live google-meet continuation` passed
  - `pnpm test:google` passed (`70` files / `351` tests)
  - `pnpm test:google:coverage` passed on rerun after the known flaky `diagnostics.collector` case reproduced once during the first coverage run; the diagnostics collector file also passed in isolation
