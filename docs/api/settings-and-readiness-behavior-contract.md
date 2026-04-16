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

## C-SETRDY-001: Settings loads read the canonical structured state and normalize it before use

Source: `flattenSettingsState`, `sanitizeSettingsShape`, `loadSettingsState`, `getSettings` in [../../entrypoints/background/settings.ts](../../entrypoints/background/settings.ts)

Rules:

1. Settings loads read the structured `settingsState` payload as the only persisted source of truth before normalization.
2. Settings normalization clamps overlay opacity, capture startup behavior, caption activation behavior, the meeting archive retention window to the canonical option set (`0`, `30`, `90`, `180`, `365`), model names, cloud providers, device identity, and overlay positions.
3. Legal-risk acknowledgments are normalized into a bounded shared-settings record and invalid or non-numeric values are discarded.
4. Local Terms-of-Service acceptance and decline records are normalized from local-device state and invalid records are discarded.
5. When current-version acceptance and current-version decline records are both present, normalization keeps only the newer local decision for that version.
6. Meeting profiles are normalized before default-profile selection is resolved.
7. Default meeting profile selection always resolves to a selectable profile, preferring custom profiles before protected built-ins.
8. `getSettings()` persists the normalized state back to storage when structured state was missing.

## C-SETRDY-002: Settings saves always persist the canonical structured shape and notify cloud sync afterwards

Source: `persistSettingsState`, `saveSettings` in [../../entrypoints/background/settings.ts](../../entrypoints/background/settings.ts)

Rules:

1. `saveSettings(partialSettings)` merges incoming keys over the currently loaded normalized settings.
2. Merged settings are normalized again before persistence.
3. Settings persistence writes only the canonical `settingsState` key.
4. Shared-settings persistence includes the configured meeting archive retention window plus legal-risk acknowledgment timestamps alongside the associated shared setting values.
5. Local-device persistence includes the Terms-of-Service acceptance and decline records outside shared settings.
6. Successful settings saves return the normalized persisted settings shape to the caller.
7. Successful settings saves notify cloud sync through `noteCloudSyncSettingsSaved(updated)`.

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

## C-SETRDY-005: Current Terms acceptance gates protected extension actions and governed UI surfaces

Source: `handleMessage` in [../../entrypoints/background/index.ts](../../entrypoints/background/index.ts), `initializePlatformRuntime` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts), `TermsGate` in [../../entrypoints/shared/terms-gate.tsx](../../entrypoints/shared/terms-gate.tsx), and [../../entrypoints/terms-of-service/App.tsx](../../entrypoints/terms-of-service/App.tsx)

Rules:

1. A current `termsAcceptance` record is required before protected runtime actions can proceed through the background message router.
2. `getSettings`, `openOptions`, diagnostics actions, quick-access runtime status actions, and limited safe `saveSettings` writes needed by legal pages remain available while blocked.
3. When Terms are not accepted, governed extension pages render a blocked state instead of the normal product UI.
4. When Terms are not accepted, the in-meeting content runtime does not initialize the provider bootstrap and overlay flow.
5. Fresh installs and extension updates open the current Terms acceptance page when the current Terms version is not yet accepted on that device.
6. Direct open-settings requests route to the Terms acceptance page until the current Terms version is accepted.
7. When an accept-mode Terms page is opened with an explicit safe return target, successful acceptance routes back to that governed extension surface instead of always closing the page.
8. When an accept-mode Terms page is opened with `returnTo=close`, declining the current Terms closes that Terms tab instead of leaving the user on the same close-mode Terms URL.
9. Replacing a current Terms acceptance with a current decline stops protected background services so cloud-sync and summary-queue work do not continue after revocation.

## Test Traceability

- [../quality/references/settings-and-readiness-traceability-matrix.md](../quality/references/settings-and-readiness-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If settings normalization, persistence, Terms acceptance storage or gating, OpenAI readiness derivation, or verification snapshot handling changes in code, update this contract and its traceability matrix in the same change set.
