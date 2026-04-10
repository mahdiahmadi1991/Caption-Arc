# Meeting Session Model Code-Derived Behavior Contract

## Purpose

This document captures how meeting-session identities, timelines, event keys, and normalized stored-session shapes are derived from implementation code.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/shared/meeting-session.ts](../../entrypoints/shared/meeting-session.ts)

## Rule ID Convention

- Contract rule IDs: `C-MSESS-<NNN>`
- Traceability case IDs: `MSESS-<NNN>`

## Contract Rules

## C-MSESS-001: Platform identity and provider labels normalize around platform-specific meeting identifiers

Source: `sanitizeMeetingSessionIdentifiers`, `getMeetingIdentityTokens`, `inferMeetingPlatform`, `getProviderLabel`, `buildMeetingSessionFingerprint` in [../../entrypoints/shared/meeting-session.ts](../../entrypoints/shared/meeting-session.ts)

Rules:

1. Microsoft Teams identifiers are normalized differently from other platforms.
2. For Teams direct calls, sanitized identifiers collapse to `{ callType: "direct-call" }` and omit stable meeting identifiers.
3. For non-direct-call Teams sessions, numeric values from `meetingCode`, `meetingId`, or `meetingNumber` are normalized into a single numeric `meetingCode` and mirrored into `meetingId`.
4. `getMeetingIdentityTokens(platform, identifiers)` returns only the normalized Teams `meetingCode` for Teams sessions.
5. Non-Teams identity tokens preserve any non-empty `meetingCode`, `meetingId`, `conferenceId`, `meetingNumber`, and `threadId` values.
6. `inferMeetingPlatform(meetingUrl)` prefers Google Meet, Microsoft Teams, and Zoom host detection before falling back to the supplied default.
7. `buildMeetingSessionFingerprint(...)` uses normalized identifiers when present; otherwise it falls back to normalized origin-plus-path and then normalized title.

## C-MSESS-002: Display titles and primary identifiers distinguish direct calls from scheduled meetings

Source: `getPrimaryMeetingIdentifier`, `getMeetingDisplayTitle`, `isDirectCallIdentifiers` in [../../entrypoints/shared/meeting-session.ts](../../entrypoints/shared/meeting-session.ts)

Rules:

1. `getPrimaryMeetingIdentifier(...)` prefers `meetingCode`, then `meetingId`, then `meetingNumber`, then `conferenceId`, then `threadId`.
2. Direct-call identifiers produce display titles prefixed with `Direct call`.
3. When a direct-call session also has a title, the display title becomes `Direct call with <title>`.
4. Non-direct-call sessions prefer a non-empty stored title.
5. When no title exists, the display title falls back to `Meeting <primaryIdentifier>` or `Meeting session`.

## C-MSESS-003: Rejoin history creates segmented session timelines and offset calculations

Source: `buildMeetingSessionTimelineSegments`, `getMeetingSessionTimelineSegmentForTimestamp`, `getSegmentedSessionOffsetMs`, `formatSessionOffset` in [../../entrypoints/shared/meeting-session.ts](../../entrypoints/shared/meeting-session.ts)

Rules:

1. Timeline segments always start with segment `0` at the original session start time.
2. Rejoin history is sorted by `resumedAt` before timeline segments are built.
3. Each continuation segment records `resumedAt`, `previousEndTime`, and a non-negative `gapMs`.
4. Each segment end time is clamped so it cannot end before its own start time.
5. `getMeetingSessionTimelineSegmentForTimestamp(...)` returns the most recent segment whose `startTime` is less than or equal to the item timestamp.
6. `getSegmentedSessionOffsetMs(...)` computes offsets from the selected segment start, not always from the original meeting start.
7. `formatSessionOffset(offsetMs)` emits `HH:MM:SS` only when the offset crosses one hour; otherwise it emits `MM:SS`.

## C-MSESS-004: Stable event keys prefer provider IDs and otherwise fall back to a derived timestamp bucket fingerprint

Source: `buildStableMeetingEventKey`, `normalizeSavedMeetingEvent`, `materializeMeetingSessionCollections` in [../../entrypoints/shared/meeting-session.ts](../../entrypoints/shared/meeting-session.ts)

Rules:

1. Stable event keys prefer a trimmed, lowercased `providerEventId` whenever it exists.
2. When no provider event ID exists, stable event keys are derived from normalized speaker text, normalized event text, and a `2000` ms timestamp bucket.
3. `normalizeSavedMeetingEvent(...)` supplies fallback speaker, text, time, timestamp, stable event key, and segmented session offset values.
4. `materializeMeetingSessionCollections(...)` sorts events by timestamp before projecting captions and chat messages.
5. Caption and chat projections preserve `stableEventKey`, `providerEventId`, translations, and per-event session offsets when available.

## C-MSESS-005: Session normalization rebuilds derived collections, searchable text, and sync hashes from the stored session payload

Source: `buildMeetingSessionSearchableText`, `buildMeetingSessionDerivedData`, `normalizeMeetingSession` in [../../entrypoints/shared/meeting-session.ts](../../entrypoints/shared/meeting-session.ts)

Rules:

1. `normalizeMeetingSession(storedSession)` infers platform from the meeting URL when the stored platform is missing or invalid.
2. Session normalization rebuilds provider label, session fingerprint, normalized rejoin history, and default schema version values.
3. Searchable text includes provider metadata, identifiers, captions, chat messages, summaries, and assistant outputs.
4. Derived data records caption count, chat count, translated caption count, two-item preview collections, and the latest event timestamp.
5. Session sync content hashes are derived from title, starred state, lifecycle state, timeline bounds, event content, summaries, and assistant artifacts.

## Test Traceability

- [../quality/references/meeting-session-model-traceability-matrix.md](../quality/references/meeting-session-model-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If identifier normalization, event-key derivation, rejoin timeline handling, or session normalization changes in code, update this contract and its traceability matrix in the same change set.