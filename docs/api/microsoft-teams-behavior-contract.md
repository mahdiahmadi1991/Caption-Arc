# Microsoft Teams Code-Derived Behavior Contract

## Purpose

This document captures the current Microsoft Teams provider behavior derived from implementation code.

It is a characterization artifact, not a requirement specification.

## Source Files

- [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

## Rule ID Convention

- Contract rule IDs: `C-MTEAMS-<NNN>`
- Traceability case IDs: `MTEAM-<NNN>`

## Contract Rules

## C-MTEAMS-001: URL routing distinguishes Teams Live `/v2/` pages from scheduled meeting URLs

Source: `isTeamsLiveHost`, `isTeamsMicrosoftHost`, `isTeamsScheduledMeetingUrl`, `microsoftTeamsProvider.matchesUrl` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. Teams Live host matching is limited to `teams.live.com` and its subdomains.
2. Microsoft Teams host matching is limited to `teams.microsoft.com` and its subdomains.
3. On Teams Live hosts, `matchesUrl(url)` returns `true` only when `url.pathname` starts with `/v2/`.
4. On Microsoft Teams hosts, `matchesUrl(url)` returns `true` only when the path contains `/l/meetup-join/` or `/meet/`.
5. On other hosts, `matchesUrl(url)` returns `false`.

## C-MTEAMS-002: Page-context detection uses join, leave, caption, meeting-shell, and title signals

Source: `hasTeamsJoinNowControl`, `hasTeamsLeaveControl`, `isTeamsMeetingContext`, `microsoftTeamsProvider.matchesPageContext` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. `hasTeamsLeaveControl()` considers only visible leave controls outside `#captionarc-overlay` that match one of `TEAMS_LEAVE_BUTTON_SELECTOR` and have visible text or `aria-label` equal to `Leave`.
2. `hasTeamsJoinNowControl()` considers only visible `button` elements outside `#captionarc-overlay` whose visible text or `aria-label` equals `Join now`.
3. `isTeamsMeetingContext(url)` returns `true` immediately for paths starting with `/meet/`.
4. For `/v2/` paths, `isTeamsMeetingContext(url)` returns `true` only when at least one of these signals exists: join-now control, leave control, caption controls, or caption regions.
5. For other eligible Teams pages, `isTeamsMeetingContext(url)` returns `true` when any of these signals exists: join-now control, leave control, caption controls, meeting chrome, or a normalized title matching `meeting with`, `meet now`, `call with`, `incoming call`, or `meeting`.
6. `matchesPageContext(url)` returns `false` for non-Teams hosts.
7. `matchesPageContext(url)` returns `true` when the page is a scheduled meeting URL, a leave control is present, or `isTeamsMeetingContext(url)` returns `true`.

## C-MTEAMS-003: Presence classification remembers an ended state after a joined state disappears

Source: `getTeamsMeetingPresence` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. If a leave control is present, the provider records `hasSeenTeamsLeaveControl = true` and returns `joined`.
2. If a join-now control is present, the provider records `hasSeenTeamsLeaveControl = false` and returns `prejoin`.
3. If neither `matchesUrl(url)` nor `matchesPageContext(url)` matches, the provider returns `unknown`.
4. If no current leave control exists but `hasSeenTeamsLeaveControl` is still `true`, the provider returns `ended`.
5. If the current URL is a scheduled meeting URL and no stronger state matched, the provider returns `prejoin`.
6. Otherwise the provider returns `prejoin` when `isTeamsMeetingContext(url)` is `true`; otherwise it returns `unknown`.

## C-MTEAMS-004: Caption availability can come from visible caption UI or stored caption preference

Source: `isTeamsLiveCaptionsEnabled`, `getTeamsStoredClosedCaptionsPreference`, `dispatchTeamsLiveCaptionsShortcut`, `microsoftTeamsProvider.tryEnableLiveCaptions` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. `isTeamsLiveCaptionsEnabled()` returns `true` when a Teams caption surface is visible.
2. If no caption surface is visible, `isTeamsLiveCaptionsEnabled()` falls back to the captions menu item state and returns `true` when that toggle is enabled.
3. `getTeamsStoredClosedCaptionsPreference()` scans local storage keys containing `.react-web-client.closed-captions-settings` and returns `stickyClosedCaptions` when present; otherwise it returns `null`.
4. `tryEnableLiveCaptions(timeoutMs)` returns `true` immediately when live captions are already enabled or the stored closed-caption preference is already `true`.
5. Otherwise `tryEnableLiveCaptions(timeoutMs)` dispatches an `Alt+Shift+C` keydown/keyup shortcut to the active element, `document.body`, `document.documentElement`, `document`, and `window`.
6. After dispatch, verification polls every `100` ms until the earlier of `timeoutMs` or `2200` ms.
7. Verification succeeds when either visible live captions become enabled or the stored closed-caption preference becomes `true`.

## C-MTEAMS-005: Session metadata distinguishes direct calls from scheduled meetings

Source: `getTeamsCanonicalUrl`, `isTeamsDirectCallContext`, `resolveTeamsMeetingCode`, `extractTeamsMeetingId`, `extractTeamsLiveMeetingCode`, `microsoftTeamsProvider.getSessionMetadata` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. `getSessionMetadata()` always reports `platform: "microsoft-teams"` and `providerLabel` from `getProviderLabel("microsoft-teams")`.
2. `isTeamsDirectCallContext(url)` returns `true` only for Teams Live `/v2/` pages that have a leave control, do not have a join-now control, and do not look like a scheduled meeting URL or scheduled-meeting referrer.
3. When `isTeamsDirectCallContext(url)` is `true`, `identifiers.callType` is `direct-call` and both `meetingId` and `meetingCode` are omitted.
4. Otherwise `identifiers.callType` is `scheduled-meeting`.
5. For non-direct-call sessions, `meetingId` is resolved from `resolveTeamsMeetingCode(url)` or `extractTeamsMeetingId(canonicalUrl)`.
6. For non-direct-call sessions, `meetingCode` is resolved from `resolveTeamsMeetingCode(url)` or `extractTeamsLiveMeetingCode(canonicalUrl)`.
7. `sourceUrl` is the canonical URL's `href`.
8. `title` is taken from the visible meeting title when available; otherwise it falls back to the normalized document title.

## C-MTEAMS-006: Teams chat ingestion de-duplicates by message ID and ignores control or pre-session history for direct calls

Source: `extractTeamsChatMessages`, `getDirectCallChatCaptureFloorTimestamp`, `hasCapturedTeamsChatMessageId`, `hasExistingTeamsChatFingerprint`, `hasRecentTeamsChatFingerprint` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. Teams chat ingestion is skipped when `settings.storeMeetingChat` is `false`.
2. Control-message entries and entries without message bodies are ignored.
3. Messages are skipped when their `data-mid` identifier is already captured.
4. Messages are also skipped when an equivalent live-chat fingerprint already exists or was recently captured.
5. Direct-call sessions discard chat messages whose extracted timestamp predates the current session start time.
6. Accepted Teams chat events preserve rich-text HTML when structured message content is available.

## C-MTEAMS-007: Caption extraction suppresses duplicate signatures, merges some unknown-speaker updates, and finalizes on speaker changes

Source: `processCaptionEntry`, `hasRecentCaptionSignature`, `getLatestPendingCaption`, `scheduleFinalization`, `finalizePendingCaptions` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. Caption entries are ignored when extracted text is missing, invalid, or classified as a likely system message.
2. Repeated speaker-plus-text updates for the same entry are ignored.
3. Existing same-speaker captions are updated in place and rescheduled only when text changed.
4. Existing captions finalize immediately when the same DOM entry switches speakers.
5. Unknown-speaker fragments may merge into the latest pending known-speaker caption when the new text is not already present there.
6. Recent caption signatures are suppressed for `4000` ms before new captions are created.
7. New independent caption entries finalize all currently pending captions before they create a fresh caption.

## C-MTEAMS-008: Observer lifecycle rebinds caption regions and chat regions on a fixed poll cadence

Source: `microsoftTeamsProvider.startCaptionObserver`, `bindObservers`, `observeChatRegion`, `updateCaptioningState`, `resetMicrosoftTeamsProviderState` in [../../entrypoints/content/providers/microsoft-teams.ts](../../entrypoints/content/providers/microsoft-teams.ts)

Rules:

1. Teams observer lifecycle uses an `1800` ms state poll plus `120` ms debounced caption and chat extraction timers.
2. Each caption-state update disconnects all previous caption observers before rebinding current caption regions.
3. Chat-region observation rebinds only when a visible current region changes or disappears.
4. Visible caption surfaces set captioning enabled, close the capture guide, and may trigger an empty-state render.
5. Losing all caption surfaces clears captioning enabled state, finalizes pending captions, and opens the capture guide only while Teams still reports `joined`.
6. Observer teardown clears timers, disconnects caption and chat observers, sets captioning disabled, and finalizes pending captions.

## Test Traceability

- [../quality/references/microsoft-teams-traceability-matrix.md](../quality/references/microsoft-teams-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If Teams URL/context matching, presence classification, caption or chat ingestion pipelines, observer lifecycle, caption activation, or metadata extraction changes in code, update this contract and its traceability matrix in the same change set.
