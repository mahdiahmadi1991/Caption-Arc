# Session Continuation And Rejoin

This document defines the business contract for continuation of recently ended sessions.

## Capability Purpose

Session continuation reduces fragmentation when users temporarily leave and rejoin the same meeting context.

Primary user outcomes:

- avoid splitting one logical meeting into multiple disconnected records
- preserve continuity for history, summaries, and assistant artifacts
- keep follow-up analysis tied to a consistent session timeline

## Continuation Window Contract

Continuation eligibility is bounded by `sessionContinuationWindowMinutes` from settings.
The continuation time anchor is the candidate session's most recent activity/end timestamp,
not the original creation timestamp. Each successful resume updates that anchor.

Range and defaults are defined in shared settings defaults:

- minimum: `0` (disabled)
- maximum: `720`
- default: `120`

Primary references:

- `entrypoints/shared/settings-defaults.ts`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/background/history.ts`

## Runtime Decision Flow

Continuation flow includes:

1. detect recent ended session candidate
2. evaluate continuation eligibility against identity and time window anchored to latest session activity
3. resolve user decision where required (`resume` or `restart`)
4. route session resolution with explicit reuse policy (`force-reuse` or `force-new`)

When a user leaves an active meeting session, runtime first enters session-ended review
(`stay` in overlay or `exit`) before final teardown when provider reset-shell conditions apply.

Primary references:

- `entrypoints/content/platform-runtime.ts`
- `entrypoints/background/history.ts`

## Persisted Rejoin Model

When a session is resumed, rejoin metadata is tracked in session model fields:

- `resumedFromSessionId`
- `rejoinHistory`
- lifecycle transitions (`live`, `ended`, `reopened`)

Primary reference:

- `entrypoints/shared/meeting-session.ts`

## Business Boundaries

- continuation can be intentionally disabled by user setting
- continuation is identity and window constrained, not unlimited merge behavior
- direct-call style contexts may not be continuation-eligible in the same way as stable meeting identities
- when continuation is not valid, runtime falls back to a new session record
- provider shell routes can stay active without meeting context; ended-session review must still execute on session exit paths

## User Impact

Correct continuation behavior directly affects:

- search quality in meeting history
- summary completeness
- continuity of assistant outputs
- trust in post-meeting records

## Update Rule

If continuation eligibility rules, reuse policy semantics, or rejoin metadata handling changes, update this document and `docs/product/user-journeys-and-jtbd.md` in the same change.
