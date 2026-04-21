# Data Transfer Code-Derived Behavior Contract

## Purpose

This document captures how application data bundles are exported, normalized, validated, and imported with rollback behavior.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/background/data-transfer.ts](../../entrypoints/background/data-transfer.ts)
- [../../entrypoints/shared/meeting-session.ts](../../entrypoints/shared/meeting-session.ts)

## Rule ID Convention

- Contract rule IDs: `C-DXFER-<NNN>`
- Traceability case IDs: `DXFER-<NNN>`

## Contract Rules

## C-DXFER-001: Export bundles use a fixed manifest kind and version plus portable settings and normalized sessions

Source: `createPortableSettings`, `createPortableSession`, `createAppDataBundle`, `exportAppDataBundle` in [../../entrypoints/background/data-transfer.ts](../../entrypoints/background/data-transfer.ts)

Rules:

1. Export bundles always use kind `captionarc-data-bundle` and bundle version `1`.
2. Portable settings export captures shared AI, archive-retention, and overlay preferences plus persisted legal-risk acknowledgments.
3. Portable settings export omits device-local fields such as connected cloud providers, overlay positions, device identity, verification snapshots, and the device-local OpenAI API key.
4. Portable sessions are normalized before export.
5. Portable sessions keep normalized event streams and assistant artifacts while omitting redundant top-level derived collections such as `captions`, `chatMessages`, `derived`, `searchableText`, and duplicated top-level `summaries`.
6. Export responses succeed only after both settings and stored meeting sessions are loaded.

## C-DXFER-002: Import normalization rejects malformed bundles before any settings or session mutation occurs

Source: `normalizeAppDataBundle` in [../../entrypoints/background/data-transfer.ts](../../entrypoints/background/data-transfer.ts)

Rules:

1. Imports reject non-object payloads.
2. Imports reject bundle versions other than `1`.
3. Imports reject payloads whose manifest kind is not `captionarc-data-bundle`.
4. Imports reject payloads missing object-shaped settings or array-shaped sessions.
5. Accepted bundle settings are reserialized through `createPortableSettings(...)` before application, which drops any unexpected device-local secret fields from imported settings payloads and re-normalizes the meeting archive retention window through the portable shared-settings shape, including the canonical `Off` value (`0`).
6. Accepted bundle sessions are normalized through `normalizeMeetingSession(...)` before application.

## C-DXFER-003: Import apply failures attempt settings rollback before surfacing an error

Source: `importAppDataBundle` in [../../entrypoints/background/data-transfer.ts](../../entrypoints/background/data-transfer.ts)

Rules:

1. Imports save portable settings before they replace stored meeting session records.
2. When session replacement or settings apply fails, the importer attempts to restore the previous settings snapshot.
3. When rollback also fails, the surfaced error includes both the original import failure and the rollback failure.
4. Successful imports report the imported session count.

## Test Traceability

- [../quality/references/data-transfer-traceability-matrix.md](../quality/references/data-transfer-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If export manifest shape, portable-session normalization, import validation, or rollback behavior changes in code, update this contract and its traceability matrix in the same change set.
