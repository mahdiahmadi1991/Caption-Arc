# Diagnostics Code-Derived Behavior Contract

## Purpose

This document captures how diagnostics configuration, sanitization, client forwarding, collector deduplication, and storage selection behave.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/shared/diagnostics.ts](../../entrypoints/shared/diagnostics.ts)
- [../../entrypoints/shared/diagnostics-client.ts](../../entrypoints/shared/diagnostics-client.ts)
- [../../entrypoints/background/diagnostics.ts](../../entrypoints/background/diagnostics.ts)
- [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)

## Rule ID Convention

- Contract rule IDs: `C-DIAG-<NNN>`
- Traceability case IDs: `DIAG-<NNN>`

## Contract Rules

## C-DIAG-001: Diagnostics capture is controlled by normalized thresholds, environment defaults, and explicit overrides

Source: `normalizeDiagnosticsThreshold`, `normalizeDiagnosticsEnvironmentLevels`, `resolveDiagnosticsThreshold`, `compareDiagnosticsLevel`, `shouldCaptureDiagnosticsLevel`, `buildDiagnosticsConfigFromEnvironment` in [../../entrypoints/shared/diagnostics.ts](../../entrypoints/shared/diagnostics.ts)

Rules:

1. Diagnostics thresholds normalize only to the supported set `off|trace|debug|info|warn|error`.
2. Environment levels normalize independently for `development` and `production`.
3. Effective diagnostics threshold prefers `overrideMinLevel` over the active environment default.
4. Capture decisions compare level priority numerically and accept only events at or above the effective minimum level.

## C-DIAG-002: Diagnostics events and snapshots sanitize sensitive values and scope snapshots by runtime plus sender metadata

Source: `sanitizeDiagnosticsData`, `sanitizeDiagnosticsSenderMetadata`, `sanitizeDiagnosticsUrl`, `buildScopedDiagnosticsSnapshotKey`, `normalizeDiagnosticsSnapshot`, `resolveDiagnosticsSnapshotProvider` in [../../entrypoints/shared/diagnostics.ts](../../entrypoints/shared/diagnostics.ts)

Rules:

1. Sensitive keyed values such as API keys, tokens, prompts, URLs, text, transcript, HTML, and caption content are redacted.
2. URLs are reduced to protocol, host, and pathname before storage.
3. Snapshot keys always include base key and runtime and may also include tab, frame, document, and provider scope.
4. Snapshot normalization sanitizes sender metadata and snapshot data before persistence.
5. Snapshot provider values fall back from explicit provider fields to provider-like data fields inside snapshot data.

## C-DIAG-003: The background collector persists bounded diagnostics state and drops duplicate or repetitive events

Source: `initializeDiagnosticsCollector`, `appendDiagnosticsEvent`, `setDiagnosticsSnapshot`, `clearDiagnosticsSnapshot`, `clearDiagnosticsData`, `flushPendingDiagnosticsPersistence`, `shouldDropDiagnosticsEvent` in [../../entrypoints/background/diagnostics.ts](../../entrypoints/background/diagnostics.ts)

Rules:

1. Collector hydration restores normalized config, event arrays, and sanitized snapshots from the selected diagnostics storage area.
2. Events are rejected when diagnostics are disabled or when their level falls below the active minimum level.
3. Exact duplicate events inside `250` ms are dropped.
4. Repetitive messages such as `observer-tick` and `caption_state_transition` are additionally rate-limited by message-specific windows.
5. Accepted events are appended and trimmed to `config.maxEvents`.
6. Snapshot writes are ignored when the scoped snapshot payload is unchanged.
7. Persistence is debounced by default and can be flushed immediately for configuration and clear operations.

## C-DIAG-004: The diagnostics client reads config from extension storage and forwards messages only when capture is enabled

Source: `initializeDiagnosticsClient`, `readDiagnosticsConfigFromStorage`, `isDiagnosticsCaptureEnabled`, `createDiagnosticsLogger`, `postDiagnosticsMessage` in [../../entrypoints/shared/diagnostics-client.ts](../../entrypoints/shared/diagnostics-client.ts); `getDiagnosticsStorageSelection` in [../../entrypoints/shared/browser-capabilities.ts](../../entrypoints/shared/browser-capabilities.ts)

Rules:

1. When writable session storage is unavailable, diagnostics config falls back to local storage.
2. When no readable diagnostics storage exists, the client forces diagnostics off via `overrideMinLevel: "off"`.
3. The client subscribes to storage changes only for the selected diagnostics storage area.
4. Event and snapshot forwarding is skipped when diagnostics capture is disabled for the requested level.
5. Runtime send failures are swallowed so diagnostics never break primary behavior.

## Test Traceability

- [../quality/references/diagnostics-traceability-matrix.md](../quality/references/diagnostics-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If diagnostics thresholding, sanitization, storage selection, collector deduplication, or client forwarding changes in code, update this contract and its traceability matrix in the same change set.