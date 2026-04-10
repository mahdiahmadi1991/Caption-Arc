# Zoom Web Code-Derived Behavior Contract

## Purpose

This document captures the current Zoom Web provider behavior derived from implementation code.

It is a characterization artifact, not a requirement specification.

## Source Files

- [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

## Rule ID Convention

- Contract rule IDs: `C-ZOOM-<NNN>`
- Traceability case IDs: `ZOOM-<NNN>`

## Contract Rules

## C-ZOOM-001: URL matching and page-context detection both delegate to provider activation rules

Source: `isZoomSupportedRoute`, `isZoomWebClientShellRoute`, `isZoomIframeContext`, `hasZoomWebClientFrame`, `shouldActivateZoomProvider`, `zoomWebProvider.matchesUrl`, `zoomWebProvider.matchesPageContext` in [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

Rules:

1. Supported Zoom routes require a `.zoom.us` host and one of these path shapes: `/wc/<id>/(start|join)`, `/wc/join/<id>`, `/j/<id>`, or `/w/<id>`.
2. If the current URL is not a supported Zoom route, `shouldActivateZoomProvider(url)` returns `false`.
3. On Zoom web-client shell routes (`/wc/...`), the provider activates only in the top-level document, not inside an iframe.
4. In iframe context, the provider activates only when `isZoomMeetingContext(url)` returns `true`.
5. In top-level non-iframe context, if `iframe#webclient` exists, the provider returns `false` to avoid activating in the shell document.
6. Otherwise the provider activates for supported routes.
7. `zoomWebProvider.matchesUrl(url)` delegates directly to `shouldActivateZoomProvider(url)`.
8. `zoomWebProvider.matchesPageContext(url)` also delegates directly to `shouldActivateZoomProvider(url)`.

## C-ZOOM-002: Meeting context and presence are related but distinct checks over joined-surface signals

Source: `isTopLevelZoomShellContext`, `getZoomWebClientFrameDocument`, `isZoomMeetingContext`, `hasZoomJoinedMeetingSurface`, `getZoomMeetingPresence` in [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

Rules:

1. `isZoomMeetingContext(url)` returns `false` for a top-level shell route when the web-client frame document is not available yet.
2. `isZoomMeetingContext(url)` returns `true` immediately for `/wc/...`, `/wc/join/...`, and `/j/...` routes.
3. On other eligible routes, `isZoomMeetingContext(url)` returns `true` when any of these signals exists: explicit subtitles, caption/transcript controls, joined meeting surface, or a normalized non-empty title.
4. `getZoomMeetingPresence(url)` returns `unknown` when `shouldActivateZoomProvider(url)` is `false`.
5. `getZoomMeetingPresence(url)` also returns `unknown` for a top-level shell route while the frame document is unavailable.
6. If `hasZoomJoinedMeetingSurface(url)` is `true`, presence is `joined`.
7. Otherwise presence is `prejoin` when `isZoomMeetingContext(url)` is `true`; otherwise it is `unknown`.

## C-ZOOM-003: Caption availability and disable-state handling depend on menu state, visible subtitle text, and recency windows

Source: `hasZoomLiveTranscriptionEnabledBanner`, `hasZoomOpenCaptionsMenuEnabledState`, `hasZoomOpenCaptionsMenuDisabledState`, `isZoomCaptioningSurfaceAvailable`, `startCaptionObserver` in [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

Rules:

1. The live-transcription enabled banner is recognized only when a visible subtitle banner matches `You have turned on live transcription`.
2. The menu-enabled state is recognized when a visible menu contains `Hide captions`.
3. The menu-disabled state is recognized when a visible menu contains `Show captions` and does not also contain `Hide captions`.
4. `isZoomCaptioningSurfaceAvailable()` returns `true` when visible subtitle text exists and is not classified as system text, or when the enabled banner or menu-enabled state exists.
5. During observer updates, caption disable is treated as immediate when an explicit disabled menu state is visible.
6. Otherwise caption disable requires a stable absence of caption signals while captions are currently enabled.
7. The required absence window is `4000` ms by default, or `1200` ms when a recent captions-menu interaction was detected within `2500` ms.

## C-ZOOM-004: Rolling transcript updates merge visible text deltas before finalization

Source: `extractZoomDeltaText`, `mergeZoomRollingTranscript`, `resolveZoomTextTransition`, `shouldMergeIntoExistingCaption`, `processCaptionEntry` in [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

Rules:

1. `extractZoomDeltaText(previousVisibleText, nextVisibleText)` returns only the visible-text delta when the new text extends, contains, or overlaps the previous text; otherwise it returns the new text.
2. `mergeZoomRollingTranscript(accumulatedText, previousVisibleText, nextVisibleText)` appends only the inferred suffix when the next visible text grows from or overlaps the previous visible text; otherwise it appends the full next visible text.
3. When a caption entry keeps the same speaker and the transition is classified as an update, the existing caption is updated in place and its finalization timer is rescheduled.
4. When the same speaker's transition requires replacement, or another speaker intervened after the current caption, the existing caption is finalized and a new caption is created.
5. When the extracted speaker is `Unknown` but the current caption already has a known speaker, the current speaker label is preserved for the update.
6. Caption finalization is scheduled `1500` ms after the latest accepted update.

## C-ZOOM-005: Session metadata uses Zoom meeting identifiers with title and participant fallback

Source: `normalizeZoomTitle`, `extractZoomMeetingNumber`, `extractZoomMeetingId`, `extractZoomFallbackIdentifier`, `zoomWebProvider.getSessionMetadata` in [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

Rules:

1. `getSessionMetadata()` always reports `platform: "zoom-web"` and `providerLabel` from `getProviderLabel("zoom-web")`.
2. `meetingNumber` is extracted from supported URL path segments first and falls back to the `confno` query parameter.
3. `meetingId` is extracted from query parameters `mn`, `mid`, or `meetingId`; if none exists, it falls back to `meetingNumber`; if that is also absent, it falls back to a normalized title or participant label.
4. `title` is normalized by removing trailing `- Zoom` or `| Zoom`, and titles equal to `Zoom` or `Zoom Meeting` are discarded.
5. `sourceUrl` is always the current `window.location.href`.

## C-ZOOM-006: Zoom chat capture gates on settings and de-duplicates by message ID only

Source: `extractChatMessages`, `syncZoomChatCapture`, `extractZoomChatMessageId` in [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

Rules:

1. Zoom chat capture is skipped when `settings.storeMeetingChat` is `false`.
2. Zoom chat capture is skipped when no visible chat region or no visible chat entries are present.
3. Chat items are ignored when they do not expose a stable message ID.
4. Chat items are also ignored when their message ID was already captured.
5. Accepted Zoom chat events use `Date.now() + entryIndex` as the ingestion timestamp.

## C-ZOOM-007: Zoom observer lifecycle combines body observers, chat observers, and interaction-aware caption disable windows

Source: `zoomWebProvider.startCaptionObserver`, `observeMeetingBody`, `observeChatRegion`, `updateCaptioningState`, `getZoomCaptionToggleIntent` in [../../entrypoints/content/providers/zoom-web.ts](../../entrypoints/content/providers/zoom-web.ts)

Rules:

1. Zoom observer lifecycle uses a `900` ms state poll plus `120` ms debounced caption and chat extraction timers.
2. Top-level body observation coexists with a separately rebound meeting-body observer and chat-region observer.
3. Caption disable is immediate when an explicit disabled captions menu state is visible.
4. Otherwise caption disable requires a stable absence of caption signals while captions were previously enabled.
5. Stable absence uses a `4000` ms window by default.
6. When a recent captions-menu interaction occurred within `2500` ms, the absence window drops to `1200` ms.
7. Observer teardown clears timers, disconnects observers, removes interaction listeners, clears captured chat IDs, disables caption state, and finalizes pending captions.

## Test Traceability

- [../quality/references/zoom-web-traceability-matrix.md](../quality/references/zoom-web-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If Zoom route activation, presence classification, caption-state handling, transcript merging, or metadata extraction changes in code, update this contract and its traceability matrix in the same change set.
