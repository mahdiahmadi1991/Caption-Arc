# AI Assistant Test Strategy

This document defines the executable test strategy for the live AI Assistant module.

It complements, and does not replace:

- [assistant-test-backlog.md](./assistant-test-backlog.md)
- [assistant-dls-implementation-plan.md](./assistant-dls-implementation-plan.md)
- [testing-strategy.md](./testing-strategy.md)
- [testing-onboarding.md](./testing-onboarding.md)
- [test-writing-standards.md](./test-writing-standards.md)
- [../product/assistant-and-summary-strategy.md](../product/assistant-and-summary-strategy.md)
- [../api/assistant-runtime-behavior-contract.md](../api/assistant-runtime-behavior-contract.md)

## Purpose

The AI Assistant module has two properties that make generic test coverage insufficient:

1. core behavior is split across content runtime, background orchestration, persistence, provider streaming, and history rendering
2. final assistant prose is model-shaped, so assertions must focus on deterministic behavior instead of exact wording

This strategy exists to keep future work focused on the right validation layers, file locations, and regression workflow.

## Scope

Primary implementation surfaces:

- [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)
- [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)
- [../../entrypoints/background/providers/openai.ts](../../entrypoints/background/providers/openai.ts)
- [../../entrypoints/content/assistant-service.ts](../../entrypoints/content/assistant-service.ts)
- [../../entrypoints/content/overlay/assistant-surface.ts](../../entrypoints/content/overlay/assistant-surface.ts)
- [../../entrypoints/meeting-history/App.tsx](../../entrypoints/meeting-history/App.tsx)
- [../../entrypoints/options/App.tsx](../../entrypoints/options/App.tsx)

Current assistant-focused validation surfaces already present in the repo:

- [../../tests/google-meet/assistant-runtime.contract.test.ts](../../tests/google-meet/assistant-runtime.contract.test.ts)
- [../../tests/google-meet/assistant-surface.contract.test.ts](../../tests/google-meet/assistant-surface.contract.test.ts)
- [../api/assistant-runtime-behavior-contract.md](../api/assistant-runtime-behavior-contract.md)
- [./references/assistant-runtime-traceability-matrix.md](./references/assistant-runtime-traceability-matrix.md)

Current coverage is strongest on the content-side assistant runtime. The biggest remaining risk area is the background generation path in `entrypoints/background/assistant.ts`, plus its interaction with session persistence in `history.ts` and streaming semantics in `providers/openai.ts`.

## Strategy Principles

1. Test assistant decisions and state transitions, not exact model prose.
2. Prefer deterministic fixtures over live-model assertions wherever possible.
3. Turn every reproduced production bug into a regression test or replay fixture before considering the area closed.
4. Use browser smoke to validate runtime wiring, storage sync, and UI acceptance, not to replace deterministic coverage.
5. Keep assistant test work aligned with behavior contracts and traceability matrices instead of growing an untracked side system.

## What To Assert

Assert:

- whether an event should trigger assistant evaluation
- which unresolved question or clause is selected
- whether an output should be generated, suppressed, or skipped
- whether output language and response-shape rules are enforced
- whether assistant artifacts survive persistence merges and later session saves
- whether live state, unread state, and pending state transition correctly
- whether incomplete or errored provider responses are classified correctly

Do not assert:

- exact full assistant wording from OpenAI
- incidental prompt whitespace
- incidental list formatting details that are not part of a documented contract
- browser timing trivia that is unrelated to a behavior contract

## Current Coverage Map

| Surface | Current Source Of Truth | Current Validation | Main Gap |
| --- | --- | --- | --- |
| content assistant session resolution | [../api/assistant-runtime-behavior-contract.md](../api/assistant-runtime-behavior-contract.md) | [../../tests/google-meet/assistant-runtime.contract.test.ts](../../tests/google-meet/assistant-runtime.contract.test.ts) | background orchestration not covered here |
| overlay assistant rendering | [../api/overlay-behavior-contract.md](../api/overlay-behavior-contract.md) | [../../tests/google-meet/assistant-surface.contract.test.ts](../../tests/google-meet/assistant-surface.contract.test.ts) | meeting-history rendering coverage is thin |
| background trigger and pass orchestration | code only in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts) | no dedicated contract suite yet | highest regression risk |
| assistant persistence merge and session save interactions | code only in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts) | no assistant-specific persistence suite yet | stale artifact overwrite risk |
| OpenAI streaming and incomplete-response handling | code only in [../../entrypoints/background/providers/openai.ts](../../entrypoints/background/providers/openai.ts) | no assistant-specific provider suite yet | truncation and stream-state regressions |
| settings transitions and profile changes mid-session | product strategy plus code in `assistant.ts`, `App.tsx`, and `assistant-service.ts` | no assistant-specific transition suite yet | language and profile drift bugs |

## Layered Test Model

### Layer 1: Background Contract Tests

Goal:

- make `entrypoints/background/assistant.ts` deterministic enough to catch logic regressions without a browser

Recommended test files:

- `tests/google-meet/assistant-trigger.contract.test.ts`
- `tests/google-meet/assistant-dedupe.contract.test.ts`
- `tests/google-meet/assistant-prompt.contract.test.ts`
- `tests/google-meet/assistant-language.contract.test.ts`
- `tests/google-meet/assistant-pass.contract.test.ts`

Primary source functions:

- `looksQuestionLike`
- `looksRequestLike`
- `looksSalientStatement`
- `extractAssistantTriggerClauses`
- `resolveAssistantTrigger`
- `shouldConsiderEvent`
- `coalesceAssistantCandidates`
- `buildAssistantMemorySnapshot`
- `buildAssistantPrompt`
- `runAssistantPass`

Required behaviors for this layer:

1. trigger classification respects `triggerPolicy`
2. `participantScope` suppresses self-triggered events when configured
3. repeated question clauses are filtered after a prior assistant output exists
4. mixed events like `q1` then `q1 + q2` resolve to only the unresolved clause
5. prompt generation reflects profile response intent, format, depth, tone, delivery bias, and output language
6. prompt generation explicitly enforces translated final output when `meetingOutputLanguage !== "en"`
7. no candidate path updates memory and live state without manufacturing a fake output
8. multi-candidate passes stop at `MAX_CANDIDATES_PER_PASS` and queue a follow-up pass when needed

### Layer 2: Persistence And Settings Integration Tests

Goal:

- verify that assistant artifacts survive normal session-save churn and mid-session settings changes

Recommended test files:

- `tests/google-meet/assistant-history-persistence.contract.test.ts`
- `tests/google-meet/assistant-settings-transition.contract.test.ts`
- `tests/google-meet/assistant-output-language-transition.contract.test.ts`
- `tests/google-meet/assistant-profile-switch.contract.test.ts`

Primary source functions:

- `mergeMeetingSessionArtifacts` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)
- `saveMeetingSession` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)
- `storeMeetingSessionShell` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)
- `runAssistantPass` in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)

Required behaviors for this layer:

1. a later session save must not erase `assistantOutputs`, `assistantMemory`, or fresher `assistantState`
2. changing output language mid-session affects future assistant generations, not only newly created sessions
3. changing default meeting profile affects future resolution paths without corrupting existing session artifacts
4. disabling assistant during a live session suppresses future passes and clears pending state as designed

### Layer 3: Provider Simulation Tests

Goal:

- isolate OpenAI transport semantics from assistant orchestration and make streaming failures reproducible

Recommended test files:

- `tests/google-meet/assistant-openai-stream.contract.test.ts`
- `tests/google-meet/assistant-cancellation.contract.test.ts`
- `tests/google-meet/assistant-incomplete-response.contract.test.ts`

Primary source functions:

- `generateChunkWithOpenAI`
- `generateWithOpenAI`
- `generateStreamWithOpenAI`
- `isOpenAIResponseTruncated`

Required behaviors for this layer:

1. non-stream response truncation throws instead of silently returning partial output
2. stream aggregation forwards deltas in order and returns the final normalized text
3. `response.incomplete` causes generation failure instead of persisting partial text as a completed answer
4. `AbortError` exits cleanly and does not produce a completed assistant output
5. provider HTTP errors and rate limits map to deterministic failures

### Layer 4: Replay Fixture Tests

Goal:

- capture real assistant bugs using session-derived fixtures so regressions are reproduced without a live meeting

Recommended fixture location:

- `tests/google-meet/fixtures/assistant/`

Recommended replay test file:

- `tests/google-meet/assistant-replay.contract.test.ts`

Each replay fixture should include:

1. normalized session settings relevant to the run
2. the ordered event stream
3. preexisting assistant artifacts, if any
4. expected trigger decision
5. expected unresolved question text or suppression result
6. expected persistence side effects

Required initial replay catalog:

- `q1-then-q1-plus-q2.json`
- `caption-churn-same-question.json`
- `language-switch-en-to-fa-mid-session.json`
- `assistant-output-persisted-then-session-save.json`
- `incomplete-stream-no-final-output.json`
- `participant-scope-others-only-self-speech.json`

### Layer 5: Browser Smoke And Acceptance

Goal:

- validate end-to-end behavior that cannot be trusted without runtime wiring, browser storage, and UI state

Use browser smoke for:

- output language changes from the settings UI
- profile switching inside a real session
- live overlay assistant rendering
- meeting-history rendering of stored assistant outputs
- diagnostics visibility when generation fails
- runtime sync between `chrome.storage`, background state, and visible UI

Canonical commands:

```bash
pnpm build:target:chrome:development
pnpm chrome:debug:reload-extension
pnpm chrome:debug:ensure
pnpm chrome:debug:diagnostics:enable
pnpm chrome:debug:diagnostics
```

For runtime-sensitive acceptance, prefer:

```bash
pnpm chrome:smoke:live google-meet <scenario>
pnpm chrome:smoke:live:matrix
```

This layer remains owner-reviewed DLS acceptance, not the primary place to discover deterministic logic regressions.

## Recommended Test Inventory

The following inventory is the recommended baseline for the assistant module.

| File | Primary Concern | Priority |
| --- | --- | --- |
| `tests/google-meet/assistant-trigger.contract.test.ts` | question/request/salience detection and trigger policy | highest |
| `tests/google-meet/assistant-dedupe.contract.test.ts` | clause extraction, unresolved-question selection, caption coalescing | highest |
| `tests/google-meet/assistant-prompt.contract.test.ts` | prompt assembly from profile, memory, and recent context | highest |
| `tests/google-meet/assistant-language.contract.test.ts` | output-language enforcement and translation wording rules | highest |
| `tests/google-meet/assistant-pass.contract.test.ts` | end-to-end pass orchestration with mocked provider output | highest |
| `tests/google-meet/assistant-history-persistence.contract.test.ts` | artifact merge and session-save durability | highest |
| `tests/google-meet/assistant-settings-transition.contract.test.ts` | live settings changes during an active session | high |
| `tests/google-meet/assistant-output-language-transition.contract.test.ts` | language changes from `en` to non-English during a live session | high |
| `tests/google-meet/assistant-profile-switch.contract.test.ts` | profile-driven behavior changes mid-session | high |
| `tests/google-meet/assistant-openai-stream.contract.test.ts` | SSE delta aggregation and completion handling | high |
| `tests/google-meet/assistant-incomplete-response.contract.test.ts` | incomplete-response classification | high |
| `tests/google-meet/assistant-cancellation.contract.test.ts` | abort and cancellation semantics | medium |
| `tests/google-meet/assistant-replay.contract.test.ts` | regression fixtures from real sessions | highest |

## Scenario Axes

Every meaningful assistant change should be mapped across these axes before deciding coverage is complete:

1. trigger policy: `questions_requests_only`, `salience_first`, `proactive`
2. participant scope: `others_only`, `everyone`
3. response intent: `answer_for_me`, `coach_me`, `surface_risks`, and other configured intents
4. response format: `talking_points`, `bullets`, `short_paragraph`, `structured_sections`, `script`
5. response depth: `ultra_brief`, `brief`, `standard`, `expanded`
6. response tone and delivery bias
7. output language transition during an active session
8. duplicate and partially repeated question flows
9. streaming success, empty output, incomplete output, abort, and provider errors
10. persistence across normal session saves, shell saves, continuation, and history rendering

Not every change needs every axis. The test planner for a change should explicitly state which axes are in scope and why.

## Bug-To-Regression Workflow

When a real assistant bug is found:

1. reproduce it in a live browser session or from stored meeting history
2. collect the minimum useful evidence:
   - relevant settings
   - ordered events
   - existing assistant artifacts
   - observed result
   - expected result
3. reduce the case into a deterministic fixture or contract test input
4. add the regression test first when feasible
5. patch the implementation
6. run the module-scoped and targeted commands appropriate for the touched layer
7. only then use browser smoke to prove end-to-end wiring

The default expectation is that each newly discovered assistant bug closes with a durable regression artifact, not only an ad hoc manual retest.

## Rollout Order

### Phase 1: Highest-Risk Background Logic

Deliver first:

- `assistant-trigger.contract.test.ts`
- `assistant-dedupe.contract.test.ts`
- `assistant-language.contract.test.ts`
- `assistant-history-persistence.contract.test.ts`
- `assistant-replay.contract.test.ts`

Exit criteria:

- repeated-answer bugs, language-transition bugs, and artifact-merge bugs are reproducible without a browser

### Phase 2: Provider And Pass Reliability

Deliver next:

- `assistant-pass.contract.test.ts`
- `assistant-openai-stream.contract.test.ts`
- `assistant-incomplete-response.contract.test.ts`
- `assistant-cancellation.contract.test.ts`

Exit criteria:

- streaming, truncation, and cancellation failures are deterministically covered

### Phase 3: Broader Profile And UX Consistency

Deliver next:

- `assistant-settings-transition.contract.test.ts`
- `assistant-output-language-transition.contract.test.ts`
- `assistant-profile-switch.contract.test.ts`
- targeted browser smoke checklist updates for assistant settings and meeting history

Exit criteria:

- profile and settings changes behave consistently in both deterministic tests and live runtime review

## Behavior-Contract Follow-Up

Current canonical assistant behavior documentation covers the content-side assistant runtime in [../api/assistant-runtime-behavior-contract.md](../api/assistant-runtime-behavior-contract.md).

Before the background assistant test inventory grows substantially, add a dedicated behavior-contract surface for background assistant generation and its matching traceability matrix, for example:

- `docs/api/assistant-generation-behavior-contract.md`
- `docs/quality/references/assistant-generation-traceability-matrix.md`

That follow-up should characterize:

- trigger selection
- clause de-duplication
- prompt assembly invariants
- pass suppression rules
- persistence side effects
- provider failure handling

## Execution Guidance

For implementation threads that add or expand assistant tests:

1. use `pnpm test:module:plan entrypoints/background/assistant.ts` when scope is local to assistant orchestration
2. use `pnpm test:module:plan entrypoints/background/history.ts` when persistence behavior is touched
3. use `pnpm test:module:plan entrypoints/background/providers/openai.ts` when provider semantics are touched
4. run `pnpm test:google`
5. run `pnpm test:google:coverage`
6. run `pnpm docs:check:behavior` when behavior contracts or traceability matrices are updated
7. run DLS acceptance when runtime-sensitive behavior changed

For manual or agent-led browser validation:

1. build development output first
2. verify build success
3. reload the extension runtime only after the build succeeds
4. use diagnostics during acceptance runs
5. record owner approval for DLS acceptance in-thread

## Change Control

Update this strategy when any of the following changes materially:

- assistant ownership surfaces
- canonical test layers
- required assistant replay scenarios
- behavior-contract ownership for assistant background logic
- module-scoped command expectations for assistant work
