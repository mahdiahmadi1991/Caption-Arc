# Translation Pipeline Code-Derived Behavior Contract

## Purpose

This document captures how background translation and generic text generation select models, gate on configuration, and record OpenAI verification state.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/background/translation.ts](../../entrypoints/background/translation.ts)

## Rule ID Convention

- Contract rule IDs: `C-TRANS-<NNN>`
- Traceability case IDs: `TRANS-<NNN>`

## Contract Rules

## C-TRANS-001: Translation and generation requests are blocked by OpenAI configuration and feature gating before provider calls start

Source: `getProviderConfigurationError`, `generateText`, `generateTextChunk`, `translate` in [../../entrypoints/background/translation.ts](../../entrypoints/background/translation.ts)

Rules:

1. Provider configuration errors are derived from `getOpenAiServiceAvailability(settings)`.
2. `generateText(...)` and `generateTextChunk(...)` return configuration errors before any provider request starts when OpenAI availability is not operational.
3. `translate(request)` returns configuration errors before any provider request starts when OpenAI availability is not operational.
4. `translate(request)` also rejects non-forced requests when `settings.translationEnabled` is `false`.

## C-TRANS-002: Provider execution retries across the configured model ring only for rate-limit failures

Source: `runPromptWithConfiguredProvider`, `runPromptChunkWithConfiguredProvider`, `translate` in [../../entrypoints/background/translation.ts](../../entrypoints/background/translation.ts)

Rules:

1. Model execution always starts from `settings.model` when that model exists in the configured model list.
2. Model fallback wraps around the full `MODELS` list after the configured starting point.
3. Prompt-generation retries continue only when the failure is a `RateLimitError`.
4. Translation retries continue only when the failure is a `RateLimitError`.
5. Non-rate-limit provider failures stop the model loop immediately.

## C-TRANS-003: Success and failure paths update OpenAI verification snapshots alongside response payloads

Source: `buildDebugErrorMessage`, `generateText`, `generateTextChunk`, `translate`, `buildTranslationPrompt` in [../../entrypoints/background/translation.ts](../../entrypoints/background/translation.ts)

Rules:

1. Successful prompt generation and translation record OpenAI verification success.
2. Failed prompt generation and translation record OpenAI verification failure.
3. Returned debug error text includes provider and model context whenever a request fails.
4. When raw provider details are available, failure messages include them in the debug context.
5. `buildTranslationPrompt(request)` delegates directly to `buildPrompt(request)`.

## Test Traceability

- [../quality/references/translation-pipeline-traceability-matrix.md](../quality/references/translation-pipeline-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If OpenAI gating, model fallback, retry semantics, or verification-snapshot updates change in code, update this contract and its traceability matrix in the same change set.