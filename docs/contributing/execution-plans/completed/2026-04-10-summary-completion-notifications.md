# Summary Completion Notifications

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Add a high-confidence browser notification flow for successful meeting-summary completion so users are alerted when a summary becomes ready while their attention is elsewhere, and can jump directly into the exact session detail summary view with the summary surface already expanded.

Done means:

- successful summary completion can emit a system-level browser notification
- notifications are suppressed when the user is already focused on the same session detail view
- notification copy follows the browser or system-facing locale instead of the extension UI setting
- clicking the notification lands on the matching session detail and opens the generated summary in expanded form
- Chrome and Firefox behavior is explicitly handled and validated

## Problem Statement

The current summary pipeline persists status and emits runtime status messages from background orchestration, but only extension pages that are already open and listening consume those events. Manual summary generation in meeting history can show in-page toast feedback, but there is no browser-level notification for a user who has switched focus to another tab, window, or application. There is also no deep-link contract that can reopen the session detail at the exact generated summary artifact in expanded form.

## Scope

- add background-owned notification orchestration for successful summary completion regardless of whether the request source was manual or automatic
- add focused-session suppression logic so the notification is skipped only when the same session detail is actively visible and focused
- derive notification copy locale from browser or system-facing language facilities rather than the extension UI-language preference
- add notification click handling that reuses an existing meeting-history tab when practical and otherwise opens one
- add deep-link state for session detail summary targeting, including session selection, summary expansion, and exact generated summary selection
- add manifest and runtime support required for extension notifications without introducing an optional user-facing toggle
- define browser-specific behavior and fallback handling for Chrome and Firefox notification APIs
- document behavior-contract, architecture, and testing impacts required for implementation

## Non-Goals

- notifying on summary failures, cancellation, retries, or in-progress milestones
- adding a user-visible settings toggle for summary notifications
- adding notification action buttons in the initial implementation
- changing summary generation semantics, retry policy, or profile behavior
- introducing website-style notification prompts or runtime permission request UI

## Repository Context

- `entrypoints/background/history.ts`
- `entrypoints/background/index.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/meeting-history/use-history.ts`
- `entrypoints/meeting-history/App.tsx`
- `entrypoints/meeting-history/components/session-detail.tsx`
- `entrypoints/shared/meeting-summary.ts`
- `entrypoints/shared/ui-language.ts`
- `entrypoints/shared/i18n/`
- `wxt.config.ts`
- `tests/google-meet/meeting-summary-pipeline.contract.test.ts`
- `docs/api/meeting-summary-pipeline-behavior-contract.md`
- `docs/quality/references/meeting-summary-pipeline-traceability-matrix.md`
- `docs/architecture/messaging-and-events.md`
- `docs/product/assistant-and-summary-strategy.md`
- `docs/quality/manual-test-checklist.md`
- `docs/quality/firefox-manual-verification-checklist.md`

## Constraints

- the implementation must not require a user-facing settings switch for enablement
- the implementation may add manifest permission `notifications`, but must avoid any additional runtime permission prompt flow
- notification emission must remain background-owned so it works when popup or meeting-history pages are closed
- suppression must be precise enough to avoid duplicate UX when the same session detail is already in front of the user
- locale selection for notification copy must not depend on extension-page React hooks because notifications originate in background
- click navigation must remain public-safe and avoid absolute machine-local paths
- deep-link handling must preserve existing meeting-history navigation behavior for users opening the page normally
- browser support differences between Chrome and Firefox must be explicitly gated, especially for notification option fields and click behavior

## Risks and Unknowns

- browser extensions do require manifest permission `notifications`; although this does not behave like a website permission prompt, it is still a permission-surface change that can affect store review and packaging expectations
- WebExtensions do not expose a direct raw operating-system locale API in the existing codebase, so the implementation will likely rely on browser UI locale as the closest system-facing source of truth
- focused-session suppression requires background awareness of meeting-history visibility and selected session; this likely introduces a new lightweight runtime-presence contract between the page and background
- multiple open meeting-history tabs can create conflicting visibility reports unless the active-focused instance is modeled clearly
- Firefox notification capabilities are narrower than Chrome for some fields, so option selection must stay within cross-browser safe subsets

## Documentation Impact

- update `docs/api/meeting-summary-pipeline-behavior-contract.md` with notification trigger, suppression, locale, and click-navigation rules
- update `docs/quality/references/meeting-summary-pipeline-traceability-matrix.md` with notification coverage rows and validation mapping
- update `docs/architecture/messaging-and-events.md` to include any new background or page-presence messaging used for suppression and deep-link handling
- update `docs/product/assistant-and-summary-strategy.md` to reflect summary-completion user feedback behavior
- update `docs/quality/manual-test-checklist.md` with success-notification and focused-session suppression checks
- update `docs/quality/firefox-manual-verification-checklist.md` if Firefox-specific manual evidence is required for notification behavior

## Testing and Coverage Impact

- add or extend contract tests around background summary completion to verify notification emission only on success
- add or extend tests for suppression when the same session detail is actively focused and visible
- add or extend tests for notification click routing to exact session and summary target state
- add or extend meeting-history tests for deep-link consumption and expanded summary selection
- run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan` and execute the recommended targeted commands
  - `pnpm docs:check`
  - `pnpm docs:check:behavior`
- if runtime-sensitive behavior is touched beyond extension pages, run governed browser verification and record Firefox manual evidence

## Milestones

### Milestone 1 - Notification Contract And Runtime Presence Design

Define the implementation contract before code changes: manifest permission usage, notification payload shape, locale strategy, deep-link query shape, and the page-to-background presence signal required to determine whether the same session detail is currently focused.

Planned design decisions for implementation unless new repository evidence invalidates them:

- send notifications for successful summary completion from both manual and automatic requests
- suppress only when a meeting-history page is visible, browser-focused, and showing the same selected session in detail view
- do not suppress merely because the same session is open in a background tab
- use browser UI locale as the effective system-facing notification language source
- reuse an existing meeting-history tab on click when one is already open; otherwise create a new one
- deep-link to the exact generated summary key and force the summary section expanded

Verification:

- contract and query-state design documented in code comments, behavior contract updates, and plan decision log before implementation starts

### Milestone 2 - Background Notification Triggering

Implement a background helper that runs only after a summary artifact is durably saved, builds localized notification copy, checks suppression state, and shows a cross-browser-safe notification on successful completion.

Acceptance signals:

- failed, cancelled, and retrying jobs never emit notifications
- both manual and automatic successful jobs are eligible
- the emitted notification payload identifies the target session and exact summary artifact for follow-up click handling

Verification:

- automated tests assert success-only emission and payload contents

### Milestone 3 - Focus-Aware Suppression And Click Navigation

Add lightweight meeting-history runtime presence reporting to background so it can tell when the same session detail is actively visible, then implement notification click handling that routes users to the target session detail and expanded summary artifact.

Acceptance signals:

- same-session focused detail view suppresses notifications
- other sessions, other extension pages, other tabs, hidden pages, or unfocused windows do not suppress notifications
- clicking a notification lands on meeting-history with the target session selected, summary section expanded, and generated summary version chosen

Verification:

- automated tests cover suppression matrix and click routing
- manual validation confirms expected behavior when an existing meeting-history tab is already open

### Milestone 4 - Meeting History Deep-Link Consumption

Teach meeting-history routing and session detail state to consume the deep-link payload safely, select the matching summary artifact, and preserve normal navigation behavior when no deep-link is present.

Acceptance signals:

- opening meeting-history normally behaves as today
- notification deep-links expand the summary section without requiring extra user clicks
- if the target summary no longer exists, the page falls back gracefully to the latest matching summary while keeping the session selected

Verification:

- component or integration tests cover deep-link parsing and fallback behavior

### Milestone 5 - Documentation And Verification Closure

Synchronize contracts, traceability, architecture, and product docs with the implemented behavior, then run the required automated and manual validation set for governed browsers.

Verification:

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- Chrome verification of notification success, suppression, and click routing
- Firefox manual verification evidence for notification success, suppression, and click routing

## Verification

- `pnpm test:targeted:plan`
- execute targeted commands recommended for summary-pipeline and meeting-history surfaces
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- manual Chrome validation:
  - same-session detail visible and focused suppresses notification
  - switching focus away allows the notification
  - clicking the notification opens or reuses meeting-history and lands on the generated summary
- manual Firefox validation with the same scenarios recorded in the canonical checklist

## Progress

- [x] Inspect current summary pipeline, meeting-history detail state, and notification API constraints
- [x] Record implementation assumptions needed to avoid blocking on unanswered ambiguities
- [x] Create the execution plan in the canonical active-plans location
- [x] Implement background notification trigger and manifest permission update
- [x] Implement meeting-history presence reporting and suppression logic
- [x] Implement deep-link routing to expanded summary detail
- [x] Update behavior docs and traceability matrices
- [x] Run automated verification and record evidence
- [x] Address post-review regressions in summary-group fallback and Meeting History presence identity/reporting
- [x] Move plan to completed

## Surprises and Discoveries

- Observation: The current meeting-history route state only carries session selection in the URL and does not yet carry summary-targeting state.
  Evidence: `entrypoints/meeting-history/use-history.ts` persists `q`, `provider`, `starred`, `sort`, and `session`, while `entrypoints/meeting-history/components/session-detail.tsx` keeps summary expansion and selected summary key as local component state.

- Observation: Extension notifications do not need a website-style runtime prompt, but they do require manifest permission `notifications`.
  Evidence: Chrome and MDN notification API references both document `notifications` as a required extension permission.

- Observation: The current summary completion feedback is page-local only.
  Evidence: `entrypoints/background/history.ts` emits runtime status changes and `entrypoints/meeting-history/use-history.ts` reacts with local refresh or toast behavior only when the page is open.

- Observation: Meeting History deep-linking had to override both summary language and selected profile, not just the selected summary key.
  Evidence: `entrypoints/meeting-history/components/session-detail.tsx` derives matching summaries from `selectedProfileId` and `summaryLanguage`, so routing directly to a summary artifact required synchronizing all three pieces of state.

- Observation: The repository's i18n diagnostics boundary forbids background modules from importing the UI i18n runtime directly.
  Evidence: `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts` failed until notification copy moved into `entrypoints/shared/summary-ready-notification.ts` with its own locale-safe lookup.

## Decision Log

- Decision: treat browser UI locale as the notification language source for implementation planning.
  Rationale: this is the closest reliable system-facing locale available to the extension runtime without introducing unsupported OS-level locale assumptions.
  Date/Author: 2026-04-10 / GitHub Copilot

- Decision: suppress notifications only when the same session detail is actively visible and focused, not merely open in a background tab.
  Rationale: the user requirement is focus-sensitive and should still notify when attention is elsewhere.
  Date/Author: 2026-04-10 / GitHub Copilot

- Decision: route notification clicks to the exact generated summary artifact and force the summary section expanded.
  Rationale: this avoids ambiguity when multiple summary versions exist for the same session.
  Date/Author: 2026-04-10 / GitHub Copilot

- Decision: reuse an existing meeting-history tab on notification click when feasible.
  Rationale: reduces duplicate extension tabs and keeps navigation consistent with a detail-oriented workflow.
  Date/Author: 2026-04-10 / GitHub Copilot

## Outcomes and Retrospective

Implementation is now in place across background orchestration, Meeting History URL state, Session Detail summary selection, manifest permissions, and localized message catalogs.

Recorded verification in this thread:

- targeted notification and deep-link tests via `pnpm exec vitest run tests/google-meet/meeting-summary-pipeline.contract.test.ts tests/google-meet/meeting-history-url-state.contract.test.ts`
- session-detail deep-link scroll regression via `pnpm exec vitest run tests/google-meet/session-detail-summary-deeplink.contract.test.ts`
- sender-tab fallback and best-match notification routing regression coverage via `pnpm exec vitest run tests/google-meet/meeting-summary-pipeline.contract.test.ts`
- targeted regression fixes via `pnpm exec vitest run tests/google-meet/diagnostics-i18n-boundary.contract.test.ts tests/google-meet/terms-gate-background.contract.test.ts`
- full suite via `pnpm test:google`
- coverage via `pnpm test:google:coverage`
- targeted test recommendation review via `pnpm test:targeted:plan`
- behavior and docs guardrails via `pnpm docs:check` and `pnpm docs:check:behavior`
- Chrome live smoke via `pnpm chrome:smoke:live google-meet continuation`
- fresh development artifacts via `pnpm build:all:development`
- browser-owner manual Firefox verification confirmed in-thread after local testing

No remaining completion work is tracked for this feature plan.
