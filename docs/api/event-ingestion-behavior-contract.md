# Event Ingestion Code-Derived Behavior Contract

## Purpose

This document captures how provider events are normalized into overlay items and how live chat ingestion updates runtime state.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/content/event-ingestion.ts](../../entrypoints/content/event-ingestion.ts)

## Rule ID Convention

- Contract rule IDs: `C-EINGEST-<NNN>`
- Traceability case IDs: `EINGEST-<NNN>`

## Contract Rules

## C-EINGEST-001: Overlay items normalize speaker, text, timestamps, and source-specific finalization defaults

Source: `normalizeSpeaker`, `normalizeText`, `resolveEventTimestamp`, `createOverlayItemFromEvent` in [../../entrypoints/content/event-ingestion.ts](../../entrypoints/content/event-ingestion.ts)

Rules:

1. Speakers are trimmed and fall back to `Unknown` when empty.
2. Event text is trimmed before it is stored in the overlay item.
3. Event timestamps default to `Date.now()` when `event.timestamp` is missing.
4. `historyTimestamp` defaults to the resolved overlay timestamp when `event.historyTimestamp` is missing.
5. Session offsets are always computed from `historyTimestamp` through `getCurrentSessionOffsetForTimestamp(...)`.
6. Overlay items always start with `translationStatus: Pending` and `lastTranslatedLength: 0`.
7. Chat-source items mirror `providerEventId` into `messageId` and default `isFinalized` to `true` unless explicitly overridden.
8. Caption-source items default `isFinalized` to `false` unless `event.isFinal` is explicitly supplied.

## C-EINGEST-002: Live chat ingestion updates overlay state, persistent history, and rendering in one path

Source: `ingestLiveChatEvent` in [../../entrypoints/content/event-ingestion.ts](../../entrypoints/content/event-ingestion.ts)

Rules:

1. `ingestLiveChatEvent(...)` always forces `source: "chat"`.
2. Live chat ingestion creates the overlay item before mutating state.
3. Accepted chat items are upserted into live overlay chat state.
4. Accepted chat items are added to meeting history through `addChatMessageToHistory(...)`.
5. Live chat ingestion re-renders captions after state and history updates.

## C-EINGEST-003: Live chat translation is requested only when runtime translation is enabled

Source: `ingestLiveChatEvent` in [../../entrypoints/content/event-ingestion.ts](../../entrypoints/content/event-ingestion.ts)

Rules:

1. Translation requests are skipped entirely when `settings.translationEnabled` is `false`.
2. When translation is enabled, live chat translation is requested after the overlay item has already been stored and rendered.
3. Live chat translation always uses the `semantic` mode.

## Test Traceability

- [../quality/references/event-ingestion-traceability-matrix.md](../quality/references/event-ingestion-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If provider event normalization, chat history ingestion, or translation-request timing changes in code, update this contract and its traceability matrix in the same change set.