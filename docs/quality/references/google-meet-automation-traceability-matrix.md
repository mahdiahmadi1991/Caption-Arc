# Google Meet Automation Traceability Matrix

## Purpose

This matrix maps code-derived Google Meet behavior contracts to permanent automated tests.

## Status Legend

- `planned`: test case identified, not implemented yet
- `implemented`: test case implemented in repository

## Matrix

| Case ID | Contract ID | Behavior Summary | Source Function(s) | Test Layer | Status |
|---|---|---|---|---|---|
| GM-URL-001 | C-URL-001 | classify `/new` as `new` | `getGoogleMeetPageKind` | unit | implemented |
| GM-URL-002 | C-URL-001 | classify `<aaa-bbbb-ccc>` as `meeting` | `getGoogleMeetPageKind` | unit | implemented |
| GM-URL-003 | C-URL-001 | classify unrelated route as `null` | `getGoogleMeetPageKind` | unit | implemented |
| GM-URL-004 | C-URL-002 | provider URL matcher true for `/new` and meeting path | `googleMeetProvider.matchesUrl` | unit | implemented |
| GM-URL-005 | C-URL-002 | provider URL matcher false for `/landing` | `googleMeetProvider.matchesUrl` | unit | implemented |
| GM-CTX-001 | C-CTX-002 | detect leave-call by aria label | `hasGoogleMeetLeaveCallControl` | unit | implemented |
| GM-CTX-002 | C-CTX-002 | detect leave-call by `call_end` icon | `hasGoogleMeetLeaveCallControl` | unit | implemented |
| GM-CTX-003 | C-CTX-003 | detect prejoin by `join now` button/label | `hasGoogleMeetPrejoinSurface` | unit | implemented |
| GM-CTX-004 | C-CTX-003 | detect prejoin by companion mode text | `hasGoogleMeetPrejoinSurface` | unit | implemented |
| GM-CTX-005 | C-CTX-003 | detect prejoin by `[data-meeting-title]` | `hasGoogleMeetPrejoinSurface` | unit | implemented |
| GM-CTX-006 | C-CTX-004 | detect meeting shell by title hint | `hasGoogleMeetMeetingShellHint` via context | unit | implemented |
| GM-CTX-007 | C-CTX-001 | `/new` always context=true | `hasGoogleMeetPageContext` | unit | implemented |
| GM-CTX-008 | C-CTX-001 | meeting context false with no signals | `hasGoogleMeetPageContext` | unit | implemented |
| GM-PRES-001 | C-PRES-001 | presence unknown when page kind null | `getGoogleMeetPresence` | unit | implemented |
| GM-PRES-002 | C-PRES-001 | presence prejoin on `/new` | `getGoogleMeetPresence` | unit | implemented |
| GM-PRES-003 | C-PRES-001 | presence joined when leave-call visible | `getGoogleMeetPresence` | unit | implemented |
| GM-PRES-004 | C-PRES-001 | presence prejoin when context exists but no leave-call | `getGoogleMeetPresence` | unit | implemented |
| GM-CAP-001 | C-CAP-001 | detect enable toggle via aria-label | `getGoogleMeetCaptionToggleButton` | unit | implemented |
| GM-CAP-002 | C-CAP-001 | detect disable toggle via aria-label | `getGoogleMeetCaptionToggleButton` | unit | implemented |
| GM-CAP-003 | C-CAP-001 | ignore disabled toggle buttons | `getGoogleMeetCaptionToggleButton` | unit | implemented |
| GM-CAP-004 | C-CAP-001 | detect toggle via tooltip text | `getGoogleMeetCaptionToggleButton` | unit | implemented |
| GM-CAP-005 | C-CAP-001 | detect toggle via icon text | `getGoogleMeetCaptionToggleButton` | unit | implemented |
| GM-CAP-006 | C-CAP-002 | captions enabled by region | `isGoogleMeetCaptionsEnabled` | unit | implemented |
| GM-CAP-007 | C-CAP-002 | captions enabled by disable-toggle | `isGoogleMeetCaptionsEnabled` | unit | implemented |
| GM-CAP-008 | C-CAP-003 | auto-enable returns true if already enabled | `tryEnableLiveCaptions` | integration | implemented |
| GM-CAP-009 | C-CAP-003 | auto-enable false when no enable-toggle by timeout | `tryEnableLiveCaptions` | integration | implemented |
| GM-CAP-010 | C-CAP-003 | auto-enable clicks toggle then succeeds when region appears | `tryEnableLiveCaptions` | integration | implemented |
| GM-CAP-011 | C-CAP-003 | auto-enable false when verify window expires | `tryEnableLiveCaptions` | integration | implemented |
| GM-META-001 | C-META-001 | metadata extracts meetingCode/title/sourceUrl/platform/label | `getSessionMetadata` | unit | implemented |
| GM-BOOT-001 | C-RUNTIME-001 | marker exists on active Meet page | content-script `main` | integration | implemented |
| GM-BOOT-002 | C-RUNTIME-001 | marker replaced on restart (single-marker invariant) | content-script `main` | integration | implemented |
| GM-RT-001 | C-RUNTIME-002 | reset-page guard candidate for URL-match + context=false | `shouldResetRuntimeOnCurrentPage` behavior | integration | implemented |
| GM-SET-001 | C-SET-001 | translationEnabled toggles overlay `translation-off` class | `updateUIFromSettings` | integration | implemented |
| GM-SET-002 | C-SET-002 | appearance updates overlay theme dataset | `applyOverlayAppearance` via `updateUIFromSettings` | integration | implemented |
| GM-SET-003 | C-SET-002 | overlayOpacity updates `--mc-overlay-opacity` | `applyOverlayAppearance` via `updateUIFromSettings` | integration | implemented |
| GM-SET-004 | C-SET-002 | overlayClickThrough toggles `mc-click-through` | `applyOverlayAppearance` via `updateUIFromSettings` | integration | implemented |
| GM-SET-005 | C-SET-003 | overlayVisible toggles `mc-hidden` and `aria-hidden` | `syncOverlayVisibilityPreference` via `updateUIFromSettings` | integration | implemented |
| GM-SET-006 | C-SET-004 | translation dock enabled state and toggle pressed reflect settings | `syncTranslationDock` via `updateUIFromSettings` | integration | implemented |
| GM-SET-007 | C-SET-004 | footer chat indicators reflect `storeMeetingChat` | `syncOverlayFooter` via `updateUIFromSettings` | integration | implemented |

## Notes

1. P0 implementation order follows cases:
- `GM-URL-*`, `GM-CTX-*`, `GM-PRES-*`, `GM-CAP-*`.
2. Runtime smoke for provider host + marker presence remains available via `pnpm chrome:smoke:live google-meet <scenario>`.
3. Deterministic marker and reset-guard contracts are covered in Vitest for CI safety.
4. Runtime/session-continuation prompt and reuse-policy contracts are tracked in:
- [runtime-session-continuation-traceability-matrix.md](./runtime-session-continuation-traceability-matrix.md)
