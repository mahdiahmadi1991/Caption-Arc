# Assistant And Summary Strategy

This document describes how assistant and summary behavior is shaped at the product level.

## Shared Strategy Foundation

- one shared AI service dependency (OpenAI)
- profile-driven behavior instead of one fixed style
- local-first persistence of generated artifacts
- queue/retry orchestration for summary reliability

## Profile Model

Summary and assistant behavior is profile-driven.

Profile controls include:

- summary prompt and generation mode (`economy`, `balanced`, `thorough`)
- automatic summary on meeting end
- assistant behavior settings:
  - response intent
  - response format
  - response depth
  - response tone
  - delivery bias
  - trigger policy
  - participant scope

Primary references:

- `entrypoints/shared/summary-profiles.ts`
- `entrypoints/options/App.tsx`

## Assistant Triggering Strategy

Assistant evaluation is event-driven and policy-aware:

- evaluates caption/chat events for question/request/salience signals
- coalesces nearby trigger candidates to reduce noisy repetition
- constrains response size by profile depth
- stores outputs in session artifacts for later review

Primary reference:

- `entrypoints/background/assistant.ts`

## Summary Execution Strategy

Summary generation plans execution per session characteristics:

- selects strategy (`single_shot`, `structured_single_shot`, `multi_stage`)
- supports evidence extraction and merge for larger/riskier sessions
- supports continuation and reconciliation fallback when needed
- persists summary job status and retries transient failures

Primary references:

- `entrypoints/shared/summary-generation.ts`
- `entrypoints/shared/meeting-summary.ts`
- `entrypoints/background/history.ts`

## Operational Reliability Contract

- summary jobs are persisted and recoverable across background restarts
- retry behavior is bounded and source-aware (`manual` vs `automatic`)
- OpenAI readiness state gates assistant and summary operational behavior

Primary references:

- `entrypoints/background/history.ts`
- `entrypoints/shared/openai-service.ts`
- `entrypoints/background/settings.ts`

## Change Rule

Any change to profile semantics, trigger policy options, summary mode semantics, or retry behavior must update this document in the same change.
