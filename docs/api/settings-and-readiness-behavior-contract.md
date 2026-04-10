# Settings And Readiness Code-Derived Behavior Contract

## Purpose

This document captures how background settings are normalized, persisted, and translated into OpenAI readiness state.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/background/settings.ts](../../entrypoints/background/settings.ts)
- [../../entrypoints/shared/openai-service.ts](../../entrypoints/shared/openai-service.ts)

## Rule ID Convention

- Contract rule IDs: `C-SETRDY-<NNN>`
- Traceability case IDs: `SETRDY-<NNN>`

## Contract Rules

## C-SETRDY-001: Settings loads merge legacy and split-state payloads before shape normalization

Source: `flattenSettingsState`, `sanitizeSettingsShape`, `loadSettingsState`, `getSettings` in [../../entrypoints/background/settings.ts](../../entrypoints/background/settings.ts)

Rules:

1. Settings loads merge the legacy `settings` payload with the structured `settingsState` payload before normalization.
2. Settings normalization clamps overlay opacity, capture startup behavior, caption activation behavior, model names, cloud providers, device identity, and overlay positions.
3. Summary profiles are normalized before default-profile selection is resolved.
4. Default summary profile selection always resolves to a selectable profile, preferring custom profiles before protected built-ins.
5. `getSettings()` persists the normalized state back to storage when structured state was missing.

## C-SETRDY-002: Settings saves always persist the normalized merged shape and notify cloud sync afterwards

Source: `persistSettingsState`, `saveSettings` in [../../entrypoints/background/settings.ts](../../entrypoints/background/settings.ts)

Rules:

1. `saveSettings(partialSettings)` merges incoming keys over the currently loaded normalized settings.
2. Merged settings are normalized again before persistence.
3. Settings persistence writes both the legacy `settings` key and the structured `settingsState` key.
4. Successful settings saves notify cloud sync through `noteCloudSyncSettingsSaved(updated)`.

## C-SETRDY-003: OpenAI readiness is derived from configuration plus verification snapshots bound to the current connection signature

Source: `getOpenAiConnectionSignature`, `isOpenAiConfigured`, `getResolvedOpenAiVerificationSnapshot`, `getOpenAiServiceAvailability`, `getOpenAiVerificationSuccessMessage`, `getOpenAiVerificationFailureMessage` in [../../entrypoints/shared/openai-service.ts](../../entrypoints/shared/openai-service.ts)

Rules:

1. OpenAI configuration requires both a non-empty API key and a non-empty model.
2. Verification snapshots are considered valid only when their stored signature matches the current API key plus model signature.
3. Unconfigured settings resolve to readiness state `setup`.
4. Matching verified snapshots resolve to readiness state `ready`.
5. Matching error snapshots resolve to readiness state `unavailable`.
6. Configured settings without a matching snapshot resolve to readiness state `pending`.

## C-SETRDY-004: Verification result recording clears stale readiness state when OpenAI is no longer configured

Source: `persistOpenAiVerificationSnapshot`, `recordOpenAiVerificationSuccess`, `recordOpenAiVerificationFailure` in [../../entrypoints/background/settings.ts](../../entrypoints/background/settings.ts)

Rules:

1. Verification success and failure writes are skipped when the resulting snapshot would be identical to the current snapshot.
2. Verification success clears readiness state instead of persisting a snapshot when OpenAI is no longer configured.
3. Verification failure also clears readiness state instead of persisting a snapshot when OpenAI is no longer configured.
4. Persisted verification snapshots always store status, message, connection signature, and `verifiedAt` timestamp.

## Test Traceability

- [../quality/references/settings-and-readiness-traceability-matrix.md](../quality/references/settings-and-readiness-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If settings normalization, persistence, OpenAI readiness derivation, or verification snapshot handling changes in code, update this contract and its traceability matrix in the same change set.