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

1. Automatic summary requests are not created unless meeting output language and at least one meeting profile are configured.
2. Automatic summary requests are not created for still-live sessions.
3. Automatic summary requests are not created when both captions and chat messages are empty.
4. Automatic summary requests use the session meeting profile or the resolved default meeting profile.
5. Automatic summary requests are skipped when the resolved profile does not enable `autoSummarizeOnMeetingEnd`.
6. Automatic summary requests target the current session segment index, where the first segment is `0` and each resumed continuation increments the index by `1`.
7. Automatic summary requests are skipped when the current segment has no captured caption or chat content.
8. Automatic summary requests are skipped when an automatic summary already exists for the same profile, language, and current segment index.
9. Automatic reconcile scans only ended sessions from the last `60` minutes and limits the candidate set to `5` sessions.

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

## C-MSUM-006: Successful summary completion may emit one browser notification with browser-locale copy

Source: `maybeShowSummaryReadyNotification`, `getSummaryReadyNotificationCopy`, `buildSummaryReadyNotificationId` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts); localized copy in [../../entrypoints/shared/i18n/messages/en.ts](../../entrypoints/shared/i18n/messages/en.ts) and peer locale catalogs

Rules:

1. Summary-ready notifications are considered only after the summary artifact is persisted into the meeting session record.
2. Failed, cancelled, and retrying summary jobs do not emit summary-ready notifications.
3. Eligible notifications use browser-locale resolution based on browser UI language rather than the extension UI-language preference.
4. Notification payloads use a deterministic notification identifier that encodes the target session and exact summary artifact key.
5. Notification rendering uses a cross-browser-safe basic notification template with extension-owned icon, title, and message fields only.

## C-MSUM-007: Summary-ready notifications are suppressed for the same focused session detail and deep-link back into meeting history on click

Source: `updateMeetingHistoryViewState`, `setMeetingHistoryViewState`, `shouldSuppressSummaryReadyNotification`, `handleSummaryReadyNotificationClick`, `openMeetingHistoryForSummaryTarget` in [../../entrypoints/background/history.ts](../../entrypoints/background/history.ts); summary-target URL helpers in [../../entrypoints/meeting-history/url-state.ts](../../entrypoints/meeting-history/url-state.ts); URL-state consumption in [../../entrypoints/meeting-history/use-history.ts](../../entrypoints/meeting-history/use-history.ts) and [../../entrypoints/meeting-history/components/session-detail.tsx](../../entrypoints/meeting-history/components/session-detail.tsx)

Rules:

1. Meeting History reports its selected session, page visibility, and browser-focus state back to background.
2. A summary-ready notification is suppressed when any active Meeting History tab is both visible and focused while showing the same session detail.
3. Opening the same session in a background tab without focus does not suppress the notification.
4. Clicking a summary-ready notification reuses an existing Meeting History tab when possible; otherwise it opens a new tab.
5. Notification click routing selects the target session, requests the exact generated summary artifact by key, and forces the summary section expanded.
6. If the requested summary key is unavailable at render time, Meeting History falls back to the latest matching summary after selecting the target session.

## Test Traceability

- [../quality/references/meeting-summary-pipeline-traceability-matrix.md](../quality/references/meeting-summary-pipeline-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If summary planning thresholds, retry behavior, continuation handling, evidence extraction, persistence semantics, or summary notification behavior change in code, update this contract and its traceability matrix in the same change set.
