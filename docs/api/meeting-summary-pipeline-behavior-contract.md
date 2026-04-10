# Meeting Summary Pipeline Code-Derived Behavior Contract

## Purpose

This document captures how meeting summaries are queued, planned, retried, chunked, continued, reconciled, and persisted.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/shared/summary-generation.ts](../../entrypoints/shared/summary-generation.ts)
- [../../entrypoints/shared/meeting-summary.ts](../../entrypoints/shared/meeting-summary.ts)
- [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)

## Rule ID Convention

- Contract rule IDs: `C-MSUM-<NNN>`
- Traceability case IDs: `MSUM-<NNN>`

## Contract Rules

## C-MSUM-001: Summary jobs persist per session with bounded automatic retry and earliest-deadline alarm scheduling

Source: `loadPersistedMeetingSummaryJobs`, `upsertPersistedMeetingSummaryJob`, `getSummaryJobBackoffMs`, `scheduleMeetingSummaryRetryAlarm` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)

Rules:

1. Persisted summary jobs are stored under `meetingSummaryQueue`.
2. Persisted jobs are validated against request, source, status, attempt-count, and max-attempt shape before reuse.
3. Job upserts replace any existing job for the same session and re-sort the queue by ascending `enqueuedAt`.
4. Automatic jobs default to `3` maximum attempts; manual jobs default to `1`.
5. Automatic retry backoff progresses through `15000`, `60000`, and `300000` ms.
6. Retry alarm scheduling clears the summary retry alarm when no future `retryAfter` timestamps remain.
7. When future retries exist, the summary retry alarm is scheduled for the earliest retry timestamp.

## C-MSUM-002: Automatic summary eligibility requires an ended session, available source content, and an auto-summary-enabled profile

Source: `getAutomaticSummaryRequest`, `maybeQueueAutomaticSummaryForEndedSession`, `reconcileAutomaticSummaryQueue` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts)

Rules:

1. Automatic summary requests are not created unless summary language and at least one summary profile are configured.
2. Automatic summary requests are not created for still-live sessions.
3. Automatic summary requests are not created when both captions and chat messages are empty.
4. Automatic summary requests use the session summary profile or the resolved default profile.
5. Automatic summary requests are skipped when the resolved profile does not enable `autoSummarizeOnMeetingEnd`.
6. Automatic summary requests are skipped when an existing summary for the same profile and language is already newer than the latest session boundary.
7. Automatic reconcile scans only ended sessions from the last `60` minutes and limits the candidate set to `5` sessions.

## C-MSUM-003: Summary execution planning selects one of three generation strategies from weighted source size

Source: `buildSummarySourceTimeline`, `planMeetingSummaryExecution`, `splitSummarySourceIntoChunks` in [../../entrypoints/shared/summary-generation.ts](../../entrypoints/shared/summary-generation.ts)

Rules:

1. Summary planning merges captions and chat messages into one timestamp-sorted timeline.
2. Weighted size adds transcript characters, chat characters, a prompt-instruction multiplier, and a fixed per-turn cost.
3. `single_shot` is selected below the mode-specific low-risk threshold.
4. `structured_single_shot` is selected between low-risk and medium-risk thresholds.
5. `multi_stage` is selected at or above the mode-specific medium-risk threshold.
6. All execution plans enable continuation fallback and reconciliation passes.
7. Multi-stage execution chunks source evidence by the mode-specific target character budget.

## C-MSUM-004: Long summaries continue segment-by-segment and optionally run a final reconciliation pass

Source: `generateMeetingSummaryText`, `buildMeetingSummaryContinuationPrompt`, `buildMeetingSummaryReconciliationPrompt` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts); `buildMeetingSummaryContinuationPrompt`, `buildMeetingSummaryReconciliationPrompt` in [../../entrypoints/shared/meeting-summary.ts](../../entrypoints/shared/meeting-summary.ts)

Rules:

1. Summary text generation uses `generateTextChunk(...)` with a maximum of `12` continuation segments.
2. Truncated segments append into one combined draft before the continuation prompt is built.
3. Each continuation reuses the original base prompt plus the partial summary collected so far.
4. Empty or failed summary segments abort generation as an error.
5. When the last segment is not truncated and at least one continuation occurred, reconciliation may run through `generateText(...)`.
6. Reconciliation is skipped when the execution plan disables it or when no continuation occurred.

## C-MSUM-005: Strategy-specific summary execution chooses direct prompts or evidence extraction before persistence

Source: `buildMeetingSummaryPrompt`, `buildStructuredMeetingSummaryPrompt`, `buildSummaryEvidenceExtractionPrompt`, `buildEvidenceBackedMeetingSummaryPrompt` in [../../entrypoints/shared/meeting-summary.ts](../../entrypoints/shared/meeting-summary.ts); `generateMeetingSummary`, `extractSummaryEvidenceFromChunk`, `mergeSummaryEvidence` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts); `mergeSummaryEvidence` in [../../entrypoints/shared/summary-generation.ts](../../entrypoints/shared/summary-generation.ts)

Rules:

1. `single_shot` execution uses the plain meeting-summary prompt.
2. `structured_single_shot` execution uses the structured meeting-summary prompt.
3. `multi_stage` execution extracts evidence chunk-by-chunk, merges evidence, and then synthesizes a final evidence-backed prompt.
4. Successful summaries are persisted back into the meeting session, including execution mode, strategy, continuation count, evidence chunk count, and reconciliation flag.
5. Successful persisted summaries trigger session save and cloud-sync notification.

## Test Traceability

- [../quality/references/meeting-summary-pipeline-traceability-matrix.md](../quality/references/meeting-summary-pipeline-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If summary planning thresholds, retry behavior, continuation handling, evidence extraction, or persistence semantics change in code, update this contract and its traceability matrix in the same change set.