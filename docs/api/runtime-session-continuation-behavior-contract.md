# Runtime Session Continuation Code-Derived Behavior Contract

## Purpose

This document captures how the runtime discovers continuation candidates, prompts for reuse decisions, resolves session-start options, and reuses stored meeting sessions.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)
- [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)
- [../../entrypoints/background/types/index.ts](../../entrypoints/background/types/index.ts)

## Rule ID Convention

- Contract rule IDs: `C-RCONT-<NNN>`
- Traceability case IDs: `RCONT-<NNN>`

## Contract Rules

## C-RCONT-001: Direct-call Teams sessions are continuation-ineligible in both runtime and background resolution

Source: `isDirectCallSessionMetadata`, `handleSessionContinuationDecision`, `resolveSessionStartOptions` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts); `resolveMeetingSession`, `findMeetingSessionContinuationCandidate` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)

Rules:

1. Runtime direct-call detection is limited to Microsoft Teams metadata where `identifiers.callType === "direct-call"`.
2. When `handleSessionContinuationDecision(provider)` sees direct-call metadata, it clears `recentlyEndedSession`, clears `pendingSessionResolveOptions`, force-resolves any active session-continuation prompt to `restart`, and returns without prompting.
3. When `resolveSessionStartOptions(provider)` sees direct-call metadata, it clears recent and pending continuation state and returns `{ reusePolicy: "force-new" }`.
4. Startup preparation treats direct-call metadata as continuation-ineligible and falls back to the normal capture-consent path.
5. `resolveMeetingSession(request)` always creates a fresh session for Teams direct-call requests.
6. `findMeetingSessionContinuationCandidate(request)` always returns `candidate: null` for Teams direct-call requests.

## C-RCONT-002: Startup continuation lookup can retry briefly for Teams pages without stable identifiers

Source: `prepareMeetingStartupDecision`, `getPersistedContinuationCandidateWithRetry`, `shouldRetryContinuationLookup` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. Startup continuation lookup is skipped when `settings.captureStartupBehavior === "off"`.
2. Startup continuation lookup is skipped when the current meeting fingerprint was already prepared, a session-ended decision is pending, or a continuation decision is pending.
3. Direct-call Teams metadata disables startup continuation lookup.
4. `getPersistedContinuationCandidateWithRetry(provider)` returns `null` immediately when the continuation window is disabled.
5. Retry behavior exists only for Microsoft Teams providers whose metadata still lacks any stable identifier among meeting code, meeting ID, conference ID, thread ID, or meeting number.
6. Retry attempts run every `500` ms and stop after `2500` ms if no candidate is found.

## C-RCONT-003: Startup continuation decisions set pending resolve options before capture starts

Source: `prepareMeetingStartupDecision` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. When a persisted continuation candidate is found, the runtime requests `requestSessionContinuationDecision(providerLabel)` before capture starts.
2. On `resume`, the runtime loads the stored session preview, keeps profile selection locked, and sets `pendingSessionResolveOptions` to `{ reusePolicy: "force-reuse", resumeSessionId }`.
3. On any non-`resume` decision, the runtime unlocks the initial pending profile selection and sets `pendingSessionResolveOptions` to `{ reusePolicy: "force-new" }`.
4. After either startup continuation decision path, the runtime marks capture as approved, clears capture-blocked state, and stores the prepared meeting fingerprint.
5. When no continuation candidate exists and startup mode is `ask`, the runtime falls back to capture-consent prompting instead of continuation prompting.

## C-RCONT-004: Recently ended sessions can trigger a prejoin continuation decision

Source: `handleSessionContinuationDecision` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. A prejoin continuation decision is considered only when all of these are true:
   - no continuation decision is already pending
   - no pending session resolve options already exist
   - `recentlyEndedSession` exists
   - the continuation window is greater than `0`
   - `meetingPresenceState === "prejoin"`
2. If the stored session referenced by `recentlyEndedSession.sessionId` no longer exists, the runtime clears `recentlyEndedSession`, clears `pendingSessionResolveOptions`, and returns without prompting.
3. On `resume`, the runtime loads the stored session preview and sets `pendingSessionResolveOptions` to `{ reusePolicy: "force-reuse", resumeSessionId }`.
4. On any non-`resume` decision, the runtime sets `pendingSessionResolveOptions` to `{ reusePolicy: "force-new" }`.
5. After either decision path, the runtime clears `recentlyEndedSession`, marks capture approved, clears capture-blocked state, and stores the prepared meeting fingerprint.
6. A direct-call Teams metadata transition force-resolves any currently active continuation prompt to `restart` instead of leaving the prompt open.

## C-RCONT-005: Session-start option resolution consumes pending decisions before checking recent-session reuse

Source: `resolveSessionStartOptions` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. Pending resolve options are consumed first and removed from `pendingSessionResolveOptions`.
2. If a consumed `resumeSessionId` no longer exists in storage, the runtime clears `recentlyEndedSession` and falls back to `{ reusePolicy: "force-new" }`.
3. If no recent continuation state exists, `resolveSessionStartOptions(provider)` returns `undefined`.
4. If the continuation window is disabled or expired, the runtime clears `recentlyEndedSession` and returns `{ reusePolicy: "force-new" }`.
5. If the recent session record no longer exists in storage, the runtime clears `recentlyEndedSession` and returns `{ reusePolicy: "force-new" }`.
6. Otherwise the runtime prompts for a session-continuation decision and returns either `{ reusePolicy: "force-reuse", resumeSessionId }` on `resume` or `{ reusePolicy: "force-new" }` on any other decision.
7. When the continuation decision resolves to `resume`, the runtime also loads a stored preview before capture resumes.

## C-RCONT-006: Background continuation candidates are ranked by stable identity first and fallback heuristics second

Source: `scoreContinuationCandidate`, `findFallbackContinuationCandidate`, `evaluateContinuationResume`, `findMeetingSessionContinuationCandidate` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)

Rules:

1. Candidate scoring rejects sessions when the continuation window is disabled, the platform differs, the reference time is outside the continuation window, or the stored session is still live with no `endTime`.
2. Shared stable identifiers score `100 + sharedIdentifierCount` and take precedence over URL or title fallback matching.
3. Microsoft Teams requests without shared stable identifiers do not fall back to URL or title matching.
4. Non-Teams fallback scoring uses normalized reusable URL equality first, then provider label plus normalized title equality.
5. Fallback candidate ranking sorts by descending score and then by descending reference timestamp.
6. `findMeetingSessionContinuationCandidate(request)` tries stored fingerprint lookup first and fallback ranking second.
7. A candidate is returned only when the stored session is not still live and `evaluateContinuationResume(...)` returns `ok: true`.

## C-RCONT-007: Session reuse appends rejoin history only for successful force-reuse resumes

Source: `resolveMeetingSession` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)

Rules:

1. `resolveMeetingSession(request)` creates a fresh session immediately when `reusePolicy === "force-new"`.
2. Teams requests without stable identity create a fresh session unless they explicitly request `force-reuse` with a `resumeSessionId`.
3. Stored-session lookup prefers an explicitly requested `resumeSessionId`; otherwise it uses the latest stored session with the same meeting fingerprint.
4. If no stored session exists or the stored session is not eligible for reuse, `resolveMeetingSession(request)` creates a fresh session.
5. When reuse succeeds with `reusePolicy === "force-reuse"`, the merged session appends a `rejoinHistory` item containing `previousEndTime`, `resumedAt`, and `gapMs`.
6. A reused ended session transitions to `lifecycleState: "reopened"`, clears `endTime`, and updates `lastSeenAt` and `updatedAt` to the reopen timestamp.

## Test Traceability

- [../quality/references/runtime-session-continuation-traceability-matrix.md](../quality/references/runtime-session-continuation-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If continuation lookup, reuse-policy resolution, recent-session prompting, or rejoin-history semantics change in code, update this contract and its traceability matrix in the same change set.
