# Provider Routing Code-Derived Behavior Contract

## Purpose

This document captures how the content runtime resolves meeting providers from URL, page context, and explicit platform lookup.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/content/providers/registry.ts](../../entrypoints/content/providers/registry.ts)
- [../../entrypoints/content/providers/types.ts](../../entrypoints/content/providers/types.ts)
- [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

## Rule ID Convention

- Contract rule IDs: `C-PROUTE-<NNN>`
- Traceability case IDs: `PROUTE-<NNN>`

## Contract Rules

## C-PROUTE-001: Active provider registry is fixed and ordered

Source: `PROVIDERS`, `PLANNED_PROVIDERS` in [../../entrypoints/content/providers/registry.ts](../../entrypoints/content/providers/registry.ts)

Rules:

1. Active provider resolution uses only the `PROVIDERS` array.
2. `PROVIDERS` is ordered as `googleMeetProvider`, `microsoftTeamsProvider`, then `zoomWebProvider`.
3. `PLANNED_PROVIDERS` is exported as an empty array and is not consulted by any resolver in this module.

## C-PROUTE-002: URL-based provider resolution returns the first matching provider or `null`

Source: `getProviderForUrl` in [../../entrypoints/content/providers/registry.ts](../../entrypoints/content/providers/registry.ts)

Rules:

1. `getProviderForUrl(url)` evaluates `candidate.matchesUrl(url)` in registry order.
2. The function returns the first matching `MeetingProvider`.
3. If no provider matches, the function returns `null`.
4. Each resolution attempt emits a `provider_resolved_for_url` diagnostics trace with `hostname`, `pathname`, and resolved `provider` or `null`.

## C-PROUTE-003: Platform lookup resolves only from registered providers

Source: `getProviderByPlatform` in [../../entrypoints/content/providers/registry.ts](../../entrypoints/content/providers/registry.ts)

Rules:

1. `getProviderByPlatform(platform)` searches only the active `PROVIDERS` array.
2. The function returns the first provider whose `platform` equals the requested platform.
3. If no registered provider has that platform, the function returns `null`.
4. Each lookup emits a `provider_resolved_for_platform` diagnostics trace with the requested `platform` and a boolean `found` flag.

## C-PROUTE-004: Page-context provider resolution is independent from URL matching

Source: `getProviderForPageContext` in [../../entrypoints/content/providers/registry.ts](../../entrypoints/content/providers/registry.ts)

Rules:

1. `getProviderForPageContext(url)` evaluates `candidate.matchesPageContext?.(url) ?? false` in registry order.
2. The function returns the first provider whose `matchesPageContext` returns `true`.
3. Providers without `matchesPageContext` are treated as non-matches.
4. If no provider matches page context, the function returns `null`.
5. Each resolution attempt emits a `provider_resolved_for_page_context` diagnostics trace with `hostname`, `pathname`, and resolved `provider` or `null`.

## C-PROUTE-005: Runtime support checks and initialization use URL resolution before page-context fallback

Source: `isSupportedMeetingPage`, `initializePlatformRuntime` in [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)

Rules:

1. `isSupportedMeetingPage()` returns `true` when either `getProviderForUrl(currentUrl)` or `getProviderForPageContext(currentUrl)` returns a provider.
2. `initializePlatformRuntime(initialProviderPlatform)` resolves the provider in this order:
   - explicit `initialProviderPlatform` via `getProviderByPlatform`
   - current URL via `getProviderForUrl`
   - current page context via `getProviderForPageContext`
3. If all resolution steps fail, `initializePlatformRuntime()` returns `null`.

## Test Traceability

- [../quality/references/provider-routing-traceability-matrix.md](../quality/references/provider-routing-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If provider registration, lookup order, or runtime provider selection changes in code, update this contract and its traceability matrix in the same change set.
