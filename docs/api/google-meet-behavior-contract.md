# Google Meet Code-Derived Behavior Contract

## Purpose

This document captures the current Google Meet provider behavior derived from implementation code.

It is a characterization artifact, not a requirement specification.

## Source Files

- [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

## Rule ID Convention

- Contract rule IDs: `C-GMEET-<NNN>`
- Traceability case IDs: `GM-<NNN>`

## Contract Rules

## C-GMEET-001: Page-kind classification and URL matching are based on Google Meet route shape

Source: `getGoogleMeetPageKind`, `googleMeetProvider.matchesUrl` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. `getGoogleMeetPageKind(url)` returns `new` only when `url.pathname === "/new"`.
2. `getGoogleMeetPageKind(url)` returns `meeting` only when the path matches `/<meeting-code>` with an optional trailing slash.
3. All other pathnames return `null`.
4. `googleMeetProvider.matchesUrl(url)` returns `true` only when `getGoogleMeetPageKind(url) !== null`.

## C-GMEET-002: Page-context detection uses leave-call, prejoin, and meeting-shell signals

Source: `hasGoogleMeetLeaveCallControl`, `hasGoogleMeetPrejoinSurface`, `hasGoogleMeetMeetingShellHint`, `hasGoogleMeetPageContext` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. Leave-call detection scans interactive controls outside `#captionarc-overlay`.
2. A leave-call control is detected when a control has `aria-label="Leave call"` (case-insensitive) or contains a Google symbol override with text `call_end`.
3. A prejoin surface is detected when a control text or `aria-label` equals `Join now`, `Ask to join`, or `Present`.
4. A prejoin surface is also detected when body text contains `use companion mode` or a `[data-meeting-title]` attribute exists.
5. Meeting-shell hints are considered only for `meeting` pages.
6. A meeting-shell hint is detected when the document title matches `Meet` or `Meet - ...`, or when body text includes `getting ready`, `preparing your meeting`, or `setting things up for your meeting`.
7. `hasGoogleMeetPageContext(url)` returns `false` when page kind is `null`.
8. `hasGoogleMeetPageContext(url)` returns `true` unconditionally for page kind `new`.
9. For page kind `meeting`, page context is `true` when any leave-call, prejoin, or meeting-shell signal is present.

## C-GMEET-003: Provider presence distinguishes only `unknown`, `prejoin`, and `joined`

Source: `getGoogleMeetPresence`, `googleMeetProvider.getMeetingPresence` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. If page kind is `null` or page context is `false`, provider presence is `unknown`.
2. If page kind is `new`, provider presence is `prejoin`.
3. If a leave-call control is present on a meeting page, provider presence is `joined`.
4. Otherwise provider presence is `prejoin`.
5. The Google Meet provider does not emit `ended`; ended-state handling is outside this provider module.

## C-GMEET-004: Caption state separates current caption availability from broader enabled detection and bounded auto-enable polling

Source: `getGoogleMeetCaptionToggleButton`, `isGoogleMeetCaptionsEnabled`, `googleMeetProvider.tryEnableLiveCaptions` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. Caption toggle detection considers only enabled `HTMLButtonElement` instances outside `#captionarc-overlay`.
2. Enable mode matches `aria-label`, tooltip text, or icon text for `turn on captions` or `closed_caption_off`.
3. Disable mode matches `aria-label`, tooltip text, or icon text for `turn off captions` or `closed_caption`.
4. `isCaptioningCurrentlyAvailable()` returns `true` only when the Google Meet caption region selector `[role="region"].vNKgIf.UDinHf` exists.
5. `isGoogleMeetCaptionsEnabled()` returns `true` when the caption region exists or when a disable-mode caption toggle exists.
6. `tryEnableLiveCaptions(timeoutMs)` returns `true` immediately when captions are already enabled.
7. Otherwise it polls for an enable-mode caption toggle every `180` ms until `timeoutMs` expires.
8. If no enable-mode toggle appears before `timeoutMs`, the function returns `false`.
9. When an enable-mode toggle is found, the function clicks it once and verifies caption enablement for up to `1800` ms using the same `180` ms poll interval.
10. If verification does not succeed before the verify timeout, the function returns the final value of `isGoogleMeetCaptionsEnabled()`.

## C-GMEET-005: Caption extraction suppresses duplicate updates and finalizes stale captions after `1500` ms

Source: `processCaption`, `scheduleFinalization`, `finalizePendingCaptions`, `extractCaptions` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. Caption extraction runs only when the Google Meet caption region exists and contains `.nMcdL` entries.
2. A caption entry is skipped when its text node is missing, its trimmed text is shorter than `2` characters, or the same entry repeats the same speaker and text as the previous accepted update.
3. When an entry already maps to a caption and the speaker is unchanged, the caption is updated in place and its finalization timer is rescheduled only if the text changed.
4. When an entry already maps to a caption but the speaker changes, the previous caption is finalized immediately and a new caption is created for the new speaker.
5. When an entry has no prior caption mapping, all currently pending caption finalizations are executed before a new caption is created.
6. Accepted captions are scheduled for finalization after `1500` ms.

## C-GMEET-006: Chat extraction de-duplicates by provider message ID and by recent speaker-text fingerprint

Source: `extractChatMessages`, `buildChatFingerprint`, `createChatTimestamp` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. Chat extraction is skipped when `settings.storeMeetingChat` is `false`.
2. Chat extraction is also skipped when the chat region is missing.
3. Only chat entries with a non-empty `data-message-id` and non-empty normalized text are eligible for ingestion.
4. A message is skipped when its provider message ID was already captured.
5. A message is also skipped when its `speaker|text` fingerprint was seen within the last `15000` ms.
6. When a fingerprint-duplicate message is skipped, its provider message ID is still marked as captured.
7. Accepted chat events use `createChatTimestamp()`, which returns `Date.now()` plus a monotonically incrementing counter.
8. Accepted chat events are ingested with `own: true` only when the speaker label equals `You`.

## C-GMEET-007: Caption and chat observers reattach on region changes and obey chat-storage settings

Source: `googleMeetProvider.startCaptionObserver`, `observeCaptionRegion`, `observeChatRegion` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. Google Meet observer lifecycle uses a `2000` ms region poll plus separate `100` ms debounced caption and chat extraction timers.
2. When a new caption region is attached, any existing caption observer is disconnected before a new observer is bound.
3. Caption-region attach sets captioning enabled, closes the capture guide, and renders immediately only when no captions are already present.
4. Caption-region detach clears the current region reference, sets captioning disabled, finalizes pending captions, and opens the capture guide only when provider presence is still `joined`.
5. Chat-region observation is skipped entirely when `settings.storeMeetingChat` is `false`.
6. When chat capture is disabled while a chat observer exists, the observer is disconnected and the current chat-region reference is cleared.
7. A newly discovered chat region disconnects any previous chat observer before rebinding.

## C-GMEET-008: Observer teardown resets provider-local caption and chat state

Source: `googleMeetProvider.startCaptionObserver` disposer in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. Observer teardown clears the region poll interval and any pending debounced extract timers.
2. Observer teardown disconnects both caption and chat observers when they exist.
3. Observer teardown clears current caption and chat region references.
4. Observer teardown clears captured chat message IDs, recent chat fingerprints, and the chat timestamp counter.
5. Observer teardown sets captioning disabled and finalizes any pending captions.

## C-GMEET-009: Session metadata uses the current meeting URL and Google Meet title attribute

Source: `getMeetingCodeFromUrl`, `getMeetingTitle`, `googleMeetProvider.getSessionMetadata` in [../../entrypoints/content/providers/google-meet.ts](../../entrypoints/content/providers/google-meet.ts)

Rules:

1. `getSessionMetadata()` always reports `platform: "google-meet"`.
2. `providerLabel` is resolved through `getProviderLabel("google-meet")`.
3. `sourceUrl` is always `window.location.href`.
4. `title` is read from `[data-meeting-title]` when present.
5. `identifiers.meetingCode` is extracted only from the `<meeting-code>` path pattern.

## Test Traceability

- [../quality/references/google-meet-automation-traceability-matrix.md](../quality/references/google-meet-automation-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If Google Meet provider routing, context detection, caption handling, observer lifecycle, chat extraction, or metadata extraction changes in code, update this contract and its traceability matrix in the same change set.
