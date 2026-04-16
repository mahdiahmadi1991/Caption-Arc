# Assistant Generation Code-Derived Behavior Contract

## Purpose

This document captures how the background assistant generation pipeline selects triggers, suppresses repeated clauses, assembles prompts, reacts to profile and settings changes, handles provider truncation, and persists assistant artifacts.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)
- [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)
- [../../entrypoints/background/providers/openai.ts](../../entrypoints/background/providers/openai.ts)

## Rule ID Convention

- Contract rule IDs: `C-AGEN-<NNN>`
- Traceability case IDs: `AGEN-<NNN>`

## Contract Rules

## C-AGEN-001: Trigger consideration is policy-aware, participant-aware, and final-caption-aware

Source: `looksQuestionLike`, `looksRequestLike`, `looksSalientStatement`, `shouldConsiderEvent` in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)

Rules:

1. Events shorter than `8` normalized characters are ignored.
2. Caption events with `isFinal === false` are ignored.
3. When `participantScope === "others_only"`, self-authored or self-aliased events are ignored.
4. Question-like detection accepts explicit question punctuation or a leading interrogative opener, not arbitrary auxiliary verbs found later in a declarative sentence.
5. `salience_first` accepts question-like, request-like, or salient events.
6. `proactive` accepts question-like, request-like, salient, or sufficiently long events.

## C-AGEN-002: Trigger resolution splits events into clauses and suppresses clauses already answered

Source: `extractAssistantTriggerClauses`, `normalizeAssistantClauseText`, `buildAssistantClauseKey`, `getAnsweredAssistantClauseKeys`, `resolveAssistantTrigger`, `coalesceAssistantCandidates` in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)

Rules:

1. Trigger text is split into clause-like segments using punctuation-aware extraction.
2. Clause normalization removes leading bullet markers, normalizes whitespace, and trims trailing punctuation from the clause key.
3. Previously answered clauses are derived from stored assistant outputs, not from raw session events.
4. If all candidate clauses in an event have already been answered, trigger resolution returns `null`.
5. If only some clauses were already answered, only unresolved clauses remain in `triggerText`.
6. Nearby caption candidates from the same speaker within the coalesce window collapse to the latest caption candidate.

## C-AGEN-003: Prompt assembly is profile-driven and enforces the configured output language

Source: `buildAssistantPrompt` in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)

Rules:

1. Prompt assembly includes meeting profile name plus assistant response intent, format, depth, tone, delivery bias, and participant scope.
2. Prompt assembly includes both output language code and human-readable language name.
3. Prompt assembly includes the full trigger event text and a separate unresolved `Question(s) to answer now` section.
4. Prompt rules require the final answer to be fully written in the configured output language.
5. Prompt rules explicitly suppress English output when the configured output language is not English.
6. Prompt rules instruct the model to answer only unresolved questions and avoid repeating previously answered prompts unless directly required.

## C-AGEN-004: Assistant passes are suppressed when readiness or session assistant enablement blocks execution

Source: `isAssistantEnabledForSession`, `runAssistantPass`, `setAssistantLiveState` in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)

Rules:

1. Assistant passes stop with live state `error` when OpenAI availability is not operational.
2. Assistant passes stop with live state `suppressed` when session or profile assistant enablement resolves to disabled.
3. Session-level `artifacts.assistantState.enabled` overrides profile default assistant enablement.
4. Sessions without a pinned profile resolve assistant behavior from the current default meeting profile.
5. Switching the session profile changes the prompt semantics used by future passes.

## C-AGEN-005: Successful passes persist only unresolved outputs and refresh assistant memory from the latest session state

Source: `generateAssistantOutput`, `persistAssistantSessionState`, `runAssistantPass`, `buildAssistantMemorySnapshot` in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)

Rules:

1. Generated outputs are persisted under the trigger key derived from the selected event.
2. When a later event repeats an already answered clause plus a new clause, only the unresolved clause is persisted as the new output trigger text.
3. Assistant memory snapshots summarize participants, current threads, and previously answered prompts rather than prior output prose.
4. When more candidates exist than the per-pass cap, assistant processing marks the session for a follow-up queued pass.
5. Completed passes settle live state to `done` after persistence succeeds.

## C-AGEN-006: Session save and shell-save merges preserve stored assistant artifacts instead of dropping them

Source: `mergeMeetingSessionArtifacts`, `saveMeetingSession`, `storeMeetingSessionShell` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)

Rules:

1. Incoming session saves merge `assistantOutputs` with stored outputs instead of replacing the stored map wholesale.
2. Incoming and stored summaries merge by key.
3. Assistant memory keeps the newer snapshot by comparing `updatedAt`.
4. Assistant state keeps the newer state by comparing `updatedAt`.
5. Empty or stale incoming artifacts do not erase stored assistant artifacts during normal save or shell-save flows.

## C-AGEN-007: OpenAI generation fails fast on incomplete or truncated responses

Source: `isOpenAIResponseTruncated`, `generateWithOpenAI`, `parseSseEventBlock`, `generateStreamWithOpenAI` in [../../entrypoints/background/providers/openai.ts](../../entrypoints/background/providers/openai.ts)

Rules:

1. Non-stream responses with `status === "incomplete"` are treated as truncated and cause generation failure.
2. Streaming responses aggregate `response.output_text.delta` events in order.
3. Streaming responses ending with `response.incomplete` cause generation failure even when partial text exists.
4. Streaming responses without any final text cause generation failure.
5. Response-error stream events throw provider failures instead of being ignored.

## C-AGEN-008: Cooperative cancellation exits without persisting a fake completed answer

Source: `throwIfAborted`, `runAssistantPass`, `generateAssistantOutput` in [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)

Rules:

1. Already-aborted signals stop an assistant pass before provider generation or persistence begins.
2. Aborts raised during provider generation exit the pass without persisting a completed assistant output.
3. Cooperative abort does not settle the assistant live state to `done`.

## Test Traceability

- [../quality/references/assistant-generation-traceability-matrix.md](../quality/references/assistant-generation-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If trigger selection, clause suppression, prompt assembly, assistant-pass suppression, persistence durability, or OpenAI truncation handling changes in code, update this contract and its traceability matrix in the same change set.
