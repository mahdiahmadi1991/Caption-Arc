# Runtime Prompts Code-Derived Behavior Contract

## Purpose

This document captures the generic prompt-host and decision behavior used by capture-consent, session-continuation, and session-ended prompts.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

## Rule ID Convention

- Contract rule IDs: `C-RPROMPT-<NNN>`
- Traceability case IDs: `RPROMPT-<NNN>`

## Contract Rules

## C-RPROMPT-001: Prompt creation is gated by overlay visibility rules and prompt-host availability

Source: `requestOverlayPrompt`, `createPromptHost`, `syncPromptHostPosition`, `startPromptHostSync` in [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

Rules:

1. When `settings.overlayVisible` is `false` and `showWhenOverlayHidden` is not enabled, `requestOverlayPrompt(options)` resolves immediately with `timeoutDecision`.
2. When a prompt host cannot be created because `document.body` is unavailable, `requestOverlayPrompt(options)` resolves immediately with `timeoutDecision`.
3. Each prompt host is appended to `document.body`.
4. When the overlay is visible, the prompt host mirrors the overlay's position and size.
5. When the overlay is hidden, the prompt host uses a viewport-centered top position with width clamped between `220` and `332` pixels.
6. Prompt host theme and overlay opacity are derived from current settings.

## C-RPROMPT-002: Only one active prompt lifecycle exists at a time

Source: `removePromptState`, `requestOverlayPrompt` in [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

Rules:

1. Showing a new prompt first removes any existing active prompt state.
2. Active prompt state is stored in module-level `activePromptEl`, `activePromptHostEl`, `activeResolver`, and `activePromptKind` references.
3. Prompt teardown clears timers, removes prompt DOM, resets `setCaptureConsentState("idle")`, re-renders captions, and removes overlay prompt classes.
4. The overlay receives `mc-capture-consent-pending` while a prompt is active.

## C-RPROMPT-003: Prompt countdown and user actions settle a prompt deterministically

Source: `requestOverlayPrompt` in [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

Rules:

1. Prompt countdown duration is `30000` ms.
2. Countdown and progress updates run every `100` ms.
3. When the remaining time reaches zero, the prompt settles with `timeoutDecision`.
4. Pressing `Escape` settles the prompt with `escapeDecision`.
5. Clicking the secondary button settles the prompt with `secondaryDecision`.
6. Clicking the primary button settles the prompt with `primaryDecision`.

## C-RPROMPT-004: Capture-consent prompts map prompt outcomes to `approved` or `dismissed`

Source: `requestCaptureConsent` in [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

Rules:

1. `requestCaptureConsent(providerLabel)` configures primary action `approved`.
2. Secondary action, `Escape`, and timeout all resolve to `dismissed`.
3. Capture-consent prompts are allowed while the overlay is hidden because `showWhenOverlayHidden` is `true`.
4. Before show, the prompt sets capture-consent state to `pending` and re-renders captions.
5. Before settle, the prompt sets capture-consent state to `approved` or `dismissed` and applies the matching overlay class.

## C-RPROMPT-005: Session-continuation prompts map outcomes to `resume` or `restart`

Source: `requestSessionContinuationDecision` in [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

Rules:

1. `requestSessionContinuationDecision(providerLabel)` configures primary action `resume`.
2. Secondary action, `Escape`, and timeout all resolve to `restart`.
3. Session-continuation prompts are allowed while the overlay is hidden because `showWhenOverlayHidden` is `true`.
4. Primary focus is assigned to the primary button when the prompt is shown.

## C-RPROMPT-006: Session-ended prompts map outcomes to `stay` or `exit`

Source: `requestSessionEndedDecision` in [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

Rules:

1. `requestSessionEndedDecision(providerLabel)` configures primary action `stay`.
2. Secondary action, `Escape`, and timeout all resolve to `exit`.
3. Session-ended prompts do not enable `showWhenOverlayHidden`, so a hidden overlay causes the generic hidden-overlay timeout path to resolve `exit` immediately.
4. Primary focus is assigned to the primary button when the prompt is shown.

## C-RPROMPT-007: Programmatic reset and force-resolution operate only on the current active prompt kind

Source: `resetCaptureConsentPrompt`, `forceResolveActivePrompt` in [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)

Rules:

1. `resetCaptureConsentPrompt()` always removes the current prompt state without supplying a decision to the caller.
2. `forceResolveActivePrompt(promptKind, decision)` returns `false` when there is no active resolver or the active prompt kind does not match `promptKind`.
3. When the active prompt kind matches, `forceResolveActivePrompt(promptKind, decision)` clears timers, removes prompt DOM and pending classes, resolves the active promise with `decision`, and returns `true`.

## Test Traceability

- [../quality/references/runtime-prompts-traceability-matrix.md](../quality/references/runtime-prompts-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If prompt-host behavior, countdown semantics, decision mapping, or programmatic prompt resolution changes in code, update this contract and its traceability matrix in the same change set.
