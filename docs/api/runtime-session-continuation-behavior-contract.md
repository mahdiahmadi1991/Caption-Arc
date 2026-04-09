# Runtime And Session Continuation Code-Derived Behavior Contract

## Purpose

This document captures runtime lifecycle, prompt, continuation, and quick-access behavior derived from implementation code.

It is a characterization contract for testing and change control, not a product roadmap document.

## Source Files

- [platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)
- [capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)
- [history-service.ts](../../entrypoints/content/history-service.ts)
- [history.ts](../../entrypoints/background/history.ts)
- [quick-access-runtime.ts](../../entrypoints/background/quick-access-runtime.ts)
- [settings-defaults.ts](../../entrypoints/shared/settings-defaults.ts)
- [settings.ts](../../entrypoints/background/settings.ts)
- [quick-access-status.ts](../../entrypoints/shared/quick-access-status.ts)

## Contract Rules

## C-SCW-001: Session continuation window normalization

Source: `normalizeSessionContinuationWindowMinutes`, `sanitizeSettingsShape`

Rules:

1. default continuation window is `120` minutes.
2. minimum allowed value is `0` and maximum is `720`.
3. non-finite input falls back to the default.
4. numeric input is rounded and clamped to the allowed range.

## C-PRM-001: Overlay prompt lifecycle and timeout behavior

Source: `requestOverlayPrompt`

Rules:

1. only one active prompt can exist at a time; opening a new prompt clears the previous prompt state.
2. prompt timeout is `30000` ms and countdown/progress are updated every `100` ms.
3. when timeout reaches zero, prompt resolves with `timeoutDecision`.
4. secondary click resolves `secondaryDecision`, primary click resolves `primaryDecision`, and `Escape` resolves `escapeDecision`.
5. if overlay is hidden and prompt is not allowed to show while hidden (`showWhenOverlayHidden=false`), prompt resolves immediately with `timeoutDecision`.

## C-PRM-002: Capture-consent decision mapping

Source: `requestCaptureConsent`

Rules:

1. primary action resolves to `approved`.
2. secondary action resolves to `dismissed`.
3. `Escape` and timeout both resolve to `dismissed`.
4. capture-consent prompt is allowed even when overlay visibility is off.

## C-PRM-003: Session-continuation decision mapping

Source: `requestSessionContinuationDecision`

Rules:

1. primary action resolves to `resume`.
2. secondary action resolves to `restart`.
3. `Escape` and timeout both resolve to `restart`.
4. session-continuation prompt is allowed even when overlay visibility is off.

## C-PRM-004: Session-ended decision mapping

Source: `requestSessionEndedDecision`

Rules:

1. primary action resolves to `stay`.
2. secondary action resolves to `exit`.
3. `Escape` and timeout both resolve to `exit`.
4. session-ended prompt does not force show when overlay is hidden.

## C-CONT-001: Startup continuation decision flow

Source: `prepareMeetingStartupDecision`

Rules:

1. when `captureStartupBehavior` is `off`, startup prompt logic is skipped.
2. direct-call Teams metadata is continuation-ineligible and skips persisted continuation lookup.
3. when a persisted continuation candidate exists, runtime requests a session-continuation decision before capture starts.
4. `resume` loads stored session preview and sets pending resolve options to `{ reusePolicy: "force-reuse", resumeSessionId }`.
5. non-resume decision sets pending resolve options to `{ reusePolicy: "force-new" }`.

## C-CONT-002: Prejoin continuation decision flow for recently ended sessions

Source: `handleSessionContinuationDecision`

Rules:

1. continuation prompt is considered only when all are true:
   - there is a recently ended session
   - meeting presence is `prejoin`
   - continuation window is enabled (`> 0`)
   - no pending continuation decision is already in progress
2. if referenced stored session no longer exists, continuation state is cleared and no reuse options are set.
3. `resume` sets pending resolve options to `{ reusePolicy: "force-reuse", resumeSessionId }` and loads preview.
4. non-resume decision sets pending resolve options to `{ reusePolicy: "force-new" }`.

## C-CONT-003: Session start resolve-option precedence

Source: `resolveSessionStartOptions`

Rules:

1. direct-call metadata always resolves to `{ reusePolicy: "force-new" }`.
2. pending resolve options are consumed first and cleared from pending state.
3. if pending `resumeSessionId` does not exist in storage, flow falls back to `{ reusePolicy: "force-new" }`.
4. if there is no pending option and no eligible recently ended session, start options are `undefined`.

## C-CONT-004: Background continuation-candidate eligibility

Source: `findMeetingSessionContinuationCandidate`, `evaluateContinuationResume`

Rules:

1. Teams direct-call requests are never continuation candidates.
2. Teams requests without stable identity tokens are never continuation candidates.
3. candidate lookup tries fingerprint match first, then fallback ranking.
4. active live sessions (no end time and lifecycle `live`) are rejected as continuation candidates.
5. candidate is returned only when continuation-window and resume checks pass.

## C-CONT-005: Session resolution and rejoin history behavior

Source: `resolveMeetingSession`

Rules:

1. `reusePolicy="force-new"` always creates a fresh session.
2. default policy reuses only still-live sessions (`lifecycleState === "live"` or missing `endTime`).
3. `reusePolicy="force-reuse"` requires continuation eligibility checks to pass.
4. when force-reuse succeeds for an ended session, rejoin metadata is appended to `rejoinHistory` with `previousEndTime`, `resumedAt`, and `gapMs`.
5. reused ended sessions transition to lifecycle `reopened` and clear `endTime`.

## C-QA-001: Quick-access runtime registry semantics

Source: `initializeQuickAccessRuntimeRegistry`, `updateQuickAccessRuntimeStatus`, `getQuickAccessRuntimeStatus`

Rules:

1. runtime status entries are keyed by `documentId` when available; fallback key is `<tabId>:<frameId>`.
2. stale entries older than `4500` ms are pruned.
3. tab removal clears all registry entries for that tab.
4. status priority order is:
   - active session + `joined`
   - `prejoin`
   - `joined`
   - `ended`
   - `unknown`/other
5. status query returns highest-priority current entry; ties resolve by latest `receivedAt`.

## C-QA-002: Runtime status publish and teardown behavior

Source: `publishQuickAccessRuntimeStatus`, `startPresenceMonitor`, `teardownPlatformRuntime`

Rules:

1. content runtime publishes status snapshots through `updateQuickAccessRuntimeStatus`.
2. presence monitor publishes status on each interval tick and at monitor start.
3. runtime teardown clears background quick-access state through `clearQuickAccessRuntimeStatus`.

## Test Traceability

- [runtime-session-continuation-traceability-matrix.md](../quality/references/runtime-session-continuation-traceability-matrix.md)

## Change Control

If runtime lifecycle, session continuation, prompt semantics, or quick-access status behavior changes in code, update this contract and its traceability matrix in the same change set.
