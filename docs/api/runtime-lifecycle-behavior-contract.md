# Runtime Lifecycle Code-Derived Behavior Contract

## Purpose

This document captures how the content runtime boots, monitors meeting lifecycle state, starts and stops capture, and tears itself down.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/content/index.ts](../../entrypoints/content/index.ts)
- [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

## Rule ID Convention

- Contract rule IDs: `C-RLIFE-<NNN>`
- Traceability case IDs: `RLIFE-<NNN>`

## Contract Rules

## C-RLIFE-001: Runtime initialization resolves a provider before creating the overlay runtime

Source: `isSupportedMeetingPage`, `initializePlatformRuntime` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. `isSupportedMeetingPage()` returns `true` when the current URL resolves through `getProviderForUrl` or `getProviderForPageContext`.
2. `initializePlatformRuntime(initialProviderPlatform)` returns an existing no-op disposer when `runtimeInitialized` is already `true`.
3. `initializePlatformRuntime(initialProviderPlatform)` returns `null` when `document.body` is missing.
4. Provider resolution inside `initializePlatformRuntime(initialProviderPlatform)` uses explicit platform lookup first, then URL routing, then page-context routing.
5. If no provider resolves, initialization returns `null`.
6. On Microsoft Teams `/v2/` pages without current page context, initialization returns `null` even if the provider was URL-matched.
7. The runtime loads settings and starts settings sync before it checks `captureStartupBehavior`.
8. When `captureStartupBehavior` is `off`, initialization returns a no-op disposer before provider bootstrap, overlay creation, and runtime activation.
9. Successful initialization creates the overlay runtime after provider bootstrap and initial session metadata capture, before assistant sync start and initial presence sampling.

## C-RLIFE-002: Content-script boot injects a single marker and retries initialization on a bounded timer

Source: `main`, `bootWithRetry`, `shouldRetryBootIndefinitely` in [../../entrypoints/content/index.ts](../../entrypoints/content/index.ts)

Rules:

1. Each content-script start removes any existing `meta[name="captionarc-injected"]` marker before appending a new one.
2. The marker `content` value is `${runtimeId}:${Date.now()}`, where `runtimeId` falls back to `unknown` when extension runtime metadata is unavailable.
3. The marker is removed when the content-script context invalidates or its abort signal fires.
4. `bootWithRetry()` runs only once per content-script lifetime because `bootStarted` suppresses duplicate entry.
5. Initialization retry attempts are spaced by `250` ms.
6. Retry stops after `30` attempts unless `shouldRetryBootIndefinitely()` returns `true` for Teams Live `/v2/` pages.

## C-RLIFE-003: Reset-page handling requires confirmation before lifecycle actions change

Source: `shouldResetRuntimeOnCurrentPage`, `observeResetPageState` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. Google Meet pages are reset candidates when the provider still matches the URL but `matchesPageContext(url)` is `false`.
2. Microsoft Teams pages are reset candidates when the active provider is Teams, the pathname matches `/v2/`, and `matchesPageContext(url)` is `false`.
3. A first reset-page observation records the timestamp and returns `pending`.
4. Reset-page state changes to `confirmed` only after `2000` ms (`2` presence-confirmation ticks at `1000` ms each) have elapsed since first observation.
5. When the current page is not a reset candidate, the stored reset timestamp is cleared and reset-page state returns `none`.
6. While a reset page remains `pending`, lifecycle synchronization and lifecycle monitoring defer destructive transitions.

## C-RLIFE-004: Presence monitoring debounces lifecycle state transitions

Source: `getEffectivePresenceState`, `syncPresenceState`, `startPresenceMonitor` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. Presence monitoring runs every `1000` ms.
2. Each presence-monitor tick publishes quick-access status and requests a lifecycle sync.
3. When a recently ended session exists inside the continuation window and there is no active session, an observed provider presence of `unknown` is converted to effective presence `ended`.
4. A new effective presence must be observed for `2` consecutive ticks before it replaces `meetingPresenceState`.
5. When `meetingPresenceState` changes, the runtime updates state, republishes quick-access status, and re-renders captions.

## C-RLIFE-005: Meeting capture starts only after joined-state confirmation and stops with optional ended-state preservation

Source: `startMeetingCapture`, `attemptAutomaticCaptionActivation`, `stopMeetingCapture` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. `startMeetingCapture(provider)` is skipped when an active meeting session already exists, capture is lifecycle-blocked, or a session-ended or session-continuation decision is pending.
2. `startMeetingCapture(provider)` requires provider presence `joined` before session resolution and again after session-resolution options are computed.
3. Starting capture shows the overlay, clears pending session metadata, resets translation state, and resets live-capture state unless force-reuse preview data must be preserved.
4. Starting capture initializes the meeting session, resets Teams provider state when applicable, starts the provider caption observer, marks `hasActiveMeetingSession = true`, and republishes quick-access status.
5. When captions are not currently available after capture starts, the runtime tries automatic caption activation only when `settings.captionActivationBehavior === "automatic"` and the provider exposes `tryEnableLiveCaptions`.
6. If automatic caption activation does not enable captions and the provider still reports `joined`, the runtime opens the capture guide.
7. `stopMeetingCapture(options)` always stops the provider observer, clears caption-activation state, closes the capture guide, and updates the session end time when a session is active.
8. When `markEnded !== false` and a current session snapshot exists, `stopMeetingCapture(options)` records `recentlyEndedSession` and sets `meetingPresenceState` to `ended`.
9. If provider presence stops being `joined` while session-start options are being resolved, capture start aborts and any computed resolve options are restored back into `pendingSessionResolveOptions`.

## C-RLIFE-006: Lifecycle sync and teardown serialize runtime work and clear runtime state

Source: `requestLifecycleSync`, `syncMeetingLifecycle`, `startLifecycleMonitor`, `teardownPlatformRuntime`, `publishQuickAccessRuntimeStatus`, `clearQuickAccessRuntimeStatus` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. `requestLifecycleSync()` runs at most one `syncMeetingLifecycle(provider)` loop at a time and coalesces concurrent requests through `lifecycleSyncRequested`.
2. The lifecycle monitor runs every `1500` ms.
3. The lifecycle monitor tears the runtime down when the active provider no longer exists or when neither `matchesUrl(currentUrl)` nor `matchesPageContext(currentUrl)` remains true.
4. On confirmed Teams reset pages, the lifecycle monitor prefers reset or sync flows over immediate teardown.
5. `teardownPlatformRuntime()` stops presence monitoring, assistant sync, settings sync, and lifecycle monitoring.
6. `teardownPlatformRuntime()` clears quick-access runtime status, removes `beforeunload` and `SESSION_ENDED_CLOSE_REQUEST_EVENT` listeners, stops meeting capture with `markEnded: false`, destroys the overlay, resets content state, and clears runtime-local flags.
7. When presence falls back to `unknown`, lifecycle sync force-resolves any active capture-consent, session-continuation, and session-ended prompts before it hides the overlay.
8. When presence returns to `joined` while a session-ended prompt is pending, lifecycle sync force-resolves that prompt to `stay`.
9. On confirmed Teams reset pages without remaining ended-session state, the runtime resets in place for the next meeting instead of tearing the entire content runtime down.

## Test Traceability

- [../quality/references/runtime-lifecycle-traceability-matrix.md](../quality/references/runtime-lifecycle-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If content-script boot, lifecycle monitoring, capture startup/stop, reset-page handling, or teardown semantics change in code, update this contract and its traceability matrix in the same change set.
