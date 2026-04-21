# AI Assistant Test Backlog

This document turns the assistant test strategy into an execution-ready backlog.

Use it together with:

- [assistant-test-strategy.md](./assistant-test-strategy.md)
- [assistant-dls-implementation-plan.md](./assistant-dls-implementation-plan.md)
- [testing-strategy.md](./testing-strategy.md)
- [testing-onboarding.md](./testing-onboarding.md)
- [test-writing-standards.md](./test-writing-standards.md)

## Purpose

The assistant strategy defines the target model. This backlog defines the implementation order, deliverables, dependencies, and completion criteria needed to realize that model inside this repository.

It is intentionally scoped to assistant testing work, not general repository QA.

## Rules Of Use

1. Treat this backlog as the canonical rollout order for assistant test coverage unless a thread has a tighter, bug-driven priority.
2. When a real assistant bug is reproduced, insert the resulting regression item into the earliest compatible phase instead of leaving it as an ad hoc note.
3. Prefer finishing one vertical slice with strong assertions over opening many shallow suites.
4. When a backlog item introduces a new assistant behavior surface, also decide whether that surface now needs a behavior contract and traceability matrix.

## Success Criteria

This backlog is considered materially complete when:

1. assistant background logic has deterministic contract coverage
2. assistant persistence and settings transitions have deterministic regression coverage
3. OpenAI streaming and incomplete-response handling are reproducible without a live browser
4. the highest-value replay fixtures from real sessions exist and remain green
5. browser smoke is reduced to acceptance and wiring validation instead of primary regression discovery

## Phase Overview

| Phase | Theme | Goal |
| --- | --- | --- |
| 1 | trigger and replay foundation | close the highest-frequency assistant regressions first |
| 2 | persistence and settings transitions | stop stale-state and mid-session drift bugs |
| 3 | provider streaming reliability | make truncation, abort, and provider-edge cases deterministic |
| 4 | UX and rendering continuity | align overlay and meeting-history assistant surfaces with stored state |
| 5 | behavior-contract expansion | make background assistant logic first-class in contract governance |

## Phase 1: Trigger And Replay Foundation

### Item 1.1

Deliverable:

- `tests/google-meet/assistant-trigger.contract.test.ts`

Source focus:

- `looksQuestionLike`
- `looksRequestLike`
- `looksSalientStatement`
- `shouldConsiderEvent`

Cases to cover:

1. `questions_requests_only` accepts direct questions and requests
2. `questions_requests_only` suppresses salient-but-not-question events
3. `salience_first` accepts salient non-question events
4. `proactive` accepts long-enough non-question events
5. `participantScope = others_only` suppresses self events
6. non-final caption events are suppressed
7. short low-signal events are suppressed

Done criteria:

- positive and guard cases exist for each trigger policy
- tests are data-driven enough to extend safely
- no browser dependency exists in the suite

### Item 1.2

Deliverable:

- `tests/google-meet/assistant-dedupe.contract.test.ts`

Source focus:

- `extractAssistantTriggerClauses`
- `normalizeAssistantClauseText`
- `buildAssistantClauseKey`
- `getAnsweredAssistantClauseKeys`
- `resolveAssistantTrigger`
- `coalesceAssistantCandidates`

Cases to cover:

1. one event containing `q1 + q2` splits into two clauses
2. prior answer for `q1` suppresses only `q1`, not `q2`
3. repeated punctuation and spacing do not create duplicate keys
4. nearby caption updates from the same speaker coalesce to the latest event
5. chat and caption events do not coalesce incorrectly
6. fully answered repeated questions return `null`

Done criteria:

- the repeated-answer bug class is reproducible in pure tests
- clause-level suppression is asserted directly, not inferred from generated text

### Item 1.3

Deliverable:

- `tests/google-meet/assistant-replay.contract.test.ts`
- `tests/google-meet/fixtures/assistant/q1-then-q1-plus-q2.json`
- `tests/google-meet/fixtures/assistant/caption-churn-same-question.json`

Fixture shape requirements:

1. meeting profile assistant settings
2. output language
3. ordered event list
4. prior assistant artifacts if applicable
5. expected unresolved trigger text
6. expected persisted output keys

Done criteria:

- each fixture mirrors a real regression pattern
- replay harness can run multiple fixtures through one helper
- fixture assertions focus on trigger selection and persistence side effects

Exit criteria for Phase 1:

- repeated question regressions no longer require a browser to validate
- clause-splitting and coalescing are both covered by deterministic tests

## Phase 2: Persistence And Settings Transitions

### Item 2.1

Deliverable:

- `tests/google-meet/assistant-history-persistence.contract.test.ts`

Source focus:

- `mergeMeetingSessionArtifacts`
- `saveMeetingSession`
- `storeMeetingSessionShell`

Cases to cover:

1. background-generated `assistantOutputs` survive later content-side session saves
2. fresher `assistantMemory` wins over older memory
3. fresher `assistantState` wins over older state
4. incoming summaries and existing summaries merge without dropping assistant artifacts
5. empty incoming artifacts do not erase stored assistant artifacts

Done criteria:

- the prior stale-artifact overwrite bug class is reproducible in tests
- save and shell-save paths are both covered

### Item 2.2

Deliverable:

- `tests/google-meet/assistant-settings-transition.contract.test.ts`

Source focus:

- `runAssistantPass`
- `getSettings` integration assumptions inside assistant execution
- meeting-profile resolution path

Cases to cover:

1. assistant disabled mid-session suppresses later passes
2. assistant re-enabled mid-session resumes normal candidate processing
3. default profile changes affect new resolution when no session override exists
4. session override still wins over changed defaults

Done criteria:

- settings transition assertions are based on state changes and prompt inputs, not exact prose

### Item 2.3

Deliverable:

- `tests/google-meet/assistant-output-language-transition.contract.test.ts`
- `tests/google-meet/fixtures/assistant/language-switch-en-to-fa-mid-session.json`

Source focus:

- `buildAssistantPrompt`
- `runAssistantPass`

Cases to cover:

1. an existing session started in English but later switched to Persian uses Persian for future outputs
2. language name and code both appear in the generated prompt
3. non-English language rule suppresses English fallback instructions in the final prompt

Done criteria:

- the language-switch regression is reproducible without browser storage
- assertions inspect prompt assembly and pass inputs, not live provider wording

Exit criteria for Phase 2:

- session-save churn and output-language transitions are deterministic and covered

## Phase 3: Provider Streaming Reliability

### Item 3.1

Deliverable:

- `tests/google-meet/assistant-openai-stream.contract.test.ts`

Source focus:

- `parseSseEventBlock`
- `generateStreamWithOpenAI`

Cases to cover:

1. deltas aggregate in order
2. `onTextDelta` receives incremental and aggregated text correctly
3. empty final text throws
4. malformed noncritical payloads do not silently corrupt the stream state

Done criteria:

- streaming success path is deterministic with mocked fetch and mocked SSE frames

### Item 3.2

Deliverable:

- `tests/google-meet/assistant-incomplete-response.contract.test.ts`
- `tests/google-meet/fixtures/assistant/incomplete-stream-no-final-output.json`

Source focus:

- `isOpenAIResponseTruncated`
- `generateWithOpenAI`
- `generateStreamWithOpenAI`

Cases to cover:

1. non-stream incomplete response throws
2. stream ending with `response.incomplete` throws
3. incomplete output does not get treated as a completed assistant output by the assistant orchestration path

Done criteria:

- truncation and incomplete responses are covered separately from generic provider failures

### Item 3.3

Deliverable:

- `tests/google-meet/assistant-cancellation.contract.test.ts`

Source focus:

- `generateStreamWithOpenAI`
- `runAssistantPass`
- abort handling around `generateAssistantOutput`

Cases to cover:

1. abort before provider call exits cleanly
2. abort during stream exits without persisting a completed output
3. aborted passes do not set live state to a fake success state

Done criteria:

- abort semantics are asserted through state and persistence, not only exception type

Exit criteria for Phase 3:

- streaming reliability bugs no longer require manual reproduction first

## Phase 4: UX And Rendering Continuity

### Item 4.1

Deliverable:

- expand [../../tests/google-meet/assistant-surface.contract.test.ts](../../tests/google-meet/assistant-surface.contract.test.ts) or add `tests/google-meet/assistant-history-render.contract.test.ts`

Source focus:

- `entrypoints/content/overlay/assistant-surface.ts`
- `entrypoints/meeting-history/App.tsx`
- meeting-history assistant rendering components

Cases to cover:

1. stored assistant outputs render consistently in meeting history
2. markdown-capable assistant responses render readable structure
3. pending state and completed state remain visually distinct
4. language-switched outputs remain render-safe in the surface

Done criteria:

- UI contracts validate assistant-specific rendering regressions without a live browser

### Item 4.2

Deliverable:

- assistant-specific browser smoke checklist section added to an existing checklist or a new assistant-focused checklist under `docs/quality/`

Checklist must cover:

1. output language change during a live session
2. profile switch during a live session
3. live overlay output rendering
4. meeting-history output rendering
5. diagnostics visibility on generation failure

Done criteria:

- browser smoke becomes a short acceptance checklist, not a discovery workflow

Exit criteria for Phase 4:

- overlay and meeting-history surfaces both have assistant-specific regression coverage

## Phase 5: Behavior-Contract Expansion

### Item 5.1

Deliverable:

- `docs/api/assistant-generation-behavior-contract.md`

Scope to characterize:

1. trigger selection
2. clause de-duplication
3. prompt assembly invariants
4. pass suppression rules
5. persistence side effects
6. provider failure handling at the orchestration boundary

Done criteria:

- rules are code-derived and deterministic
- source files and functions are listed explicitly

### Item 5.2

Deliverable:

- `docs/quality/references/assistant-generation-traceability-matrix.md`

Traceability requirements:

1. every new contract rule has at least one planned or implemented case
2. contract tests and replay tests are mapped separately when that distinction matters
3. browser-smoke-only cases are explicitly marked as such instead of being implied

Done criteria:

- assistant background logic becomes part of the same governance model as other runtime behavior surfaces

Exit criteria for Phase 5:

- assistant generation no longer depends on code-only tribal knowledge for its main behavior contract

## Cross-Cutting Backlog Rules

### Regression Intake Rule

For every newly found assistant bug, record:

1. bug shape
2. likely test layer
3. candidate fixture or suite
4. whether behavior-contract follow-up is required

Then place it into the earliest unfinished phase that can absorb it.

### Naming Rule

Use file names that reflect the behavior layer:

- `assistant-*-contract.test.ts` for deterministic logic and integration contracts
- `assistant-replay.contract.test.ts` for fixture-driven regressions
- `assistant-*-traceability-matrix.md` for contract mapping docs

### Scope Rule

Do not collapse all assistant work into one oversized suite. Keep suites separated by responsibility:

1. trigger logic
2. dedupe and clause resolution
3. pass orchestration
4. persistence and settings transitions
5. provider streaming
6. replay regressions

## First Recommended Implementation Slice

If work starts immediately, the strongest first slice is:

1. `assistant-dedupe.contract.test.ts`
2. `assistant-history-persistence.contract.test.ts`
3. `assistant-output-language-transition.contract.test.ts`
4. `assistant-replay.contract.test.ts` with two fixtures:
   - `q1-then-q1-plus-q2.json`
   - `language-switch-en-to-fa-mid-session.json`

Reason:

- these directly close the highest-signal regressions already observed in live usage
- they reduce the most browser-only debugging pressure fastest

## Change Control

Update this backlog when:

- a new assistant regression class is discovered
- rollout order changes materially
- a phase completes and the remaining highest-risk item shifts
- assistant behavior-contract ownership expands
