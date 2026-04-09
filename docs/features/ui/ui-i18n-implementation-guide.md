# UI I18n Implementation Guide

## Purpose

This document converts the canonical UI i18n strategy into an implementation sequence for CaptionArc.

Use this guide when adding UI localization to the repository.

Canonical architecture reference:

- `../../architecture/ui-i18n-strategy.md`

## Outcome

The target end state is:

- one internal UI i18n core shared by all in-app surfaces
- one dedicated `uiLanguage` setting
- a shipped UI locale set limited to fully reviewed catalogs with deterministic English fallback
- consistent locale resolution and direction handling
- staged migration across popup, options, meeting history, and overlay
- browser metadata localization kept separate through `chrome.i18n`

## Phase Plan

### Phase 1 - Foundation Plus Popup

Goal:

- create the shared i18n core
- add the `uiLanguage` setting plumbing
- migrate the popup to the new translator

Files expected in this phase:

- create `entrypoints/shared/i18n/types.ts`
- create `entrypoints/shared/i18n/messages/en.ts`
- create `entrypoints/shared/i18n/messages/fa.ts`
- create `entrypoints/shared/i18n/catalog.ts`
- create `entrypoints/shared/i18n/locale.ts`
- create `entrypoints/shared/i18n/index.ts`
- create `entrypoints/shared/i18n/react.tsx`
- create `entrypoints/shared/i18n/loading-screen.tsx`
- update `entrypoints/background/types/index.ts`
- update `entrypoints/shared/settings-defaults.ts`
- update `entrypoints/background/settings.ts`
- update `entrypoints/popup/App.tsx`
- update `entrypoints/popup/main.tsx`

Acceptance signals:

- popup renders through the shared translator
- popup root sets `lang` and `dir`
- locale resolution works for `system`, `en`, and `fa`
- no popup UI copy remains hardcoded except values explicitly left out of scope
- non-default locale catalogs may load asynchronously if popup initialization remains deterministic

### Phase 2 - Options Migration

Goal:

- migrate the options/settings UI to the shared i18n layer

Expected files:

- `entrypoints/options/App.tsx`
- selected files under `entrypoints/options/components/*`
- any options-level React provider setup

Acceptance signals:

- options page uses namespaced keys under `options.*` and `common.*`
- settings labels, helper text, and status copy resolve from the catalogs
- no options-specific localization helper forks are introduced

### Phase 3 - Meeting History Migration

Goal:

- migrate meeting history UI to the same shared i18n layer

Expected files:

- `entrypoints/meeting-history/App.tsx`
- selected files under `entrypoints/meeting-history/components/*`
- `entrypoints/meeting-history/use-history.ts` for user-facing status and toast copy

Acceptance signals:

- list filters, status copy, empty states, dialogs, and toasts use the shared translator
- summary and translation action labels are localized
- `lang` and `dir` are applied at the page root

### Phase 4 - Overlay Migration

Goal:

- migrate the imperative in-meeting overlay and prompt flows

Expected files:

- `entrypoints/content/overlay/header.ts`
- `entrypoints/content/overlay/capture-consent.ts`
- `entrypoints/content/render.ts`
- other overlay modules that emit user-facing copy

Acceptance signals:

- overlay empty states, compact status, prompts, buttons, and badges use the shared translator
- locale changes flow through sync points correctly
- no React-only assumptions leak into imperative overlay code
- overlay rerender wiring stays in overlay-owned UI modules rather than in logger-only runtime modules

### Phase 5 - Browser Metadata Localization

Goal:

- localize extension metadata through Chrome locale files

Expected files:

- `_locales/en/messages.json`
- `_locales/fa/messages.json`
- `wxt.config.ts` or manifest configuration if needed for `default_locale`

Acceptance signals:

- extension metadata uses `chrome.i18n` conventions
- browser metadata localization remains separate from the internal UI translator

## Current Repository Status

- Phases 1 through 4 are implemented in code for popup, options, meeting history, and in-meeting content surfaces.
- Supported UI locales are `en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`.
- `entrypoints/shared/i18n/catalog.ts` registers the full shipped locale set and keeps English as the fallback locale.
- non-English locale catalogs are lazy-loaded through the shared catalog loader to reduce default bundle pressure.
- `en` remains the canonical authored catalog and shipped non-English locales provide dedicated locale modules for user-facing UI namespaces.
- Phase 5 browser metadata localization via `_locales` remains future work.

## Required Design Rules

### Keep UI Locale Separate From Translation Locale

Never reuse:

- `targetLanguage`
- `summaryLanguage`

for UI copy selection.

### Keep `uiLanguage` Local To The Device

Add `uiLanguage` to local device settings only.

Do not place it in shared synced settings.

### Keep English As The Fallback Locale

If locale resolution or a specific message lookup fails, fallback to English.

### Keep Message Keys Namespaced

Use a small set of namespaces:

- `common.*`
- `popup.*`
- `options.*`
- `history.*`
- `content.*`

### Keep Locale Shape Typed

The English catalog defines the canonical key shape.

Other locale catalogs must satisfy that shape exactly.

Shipped locale policy:

- do not add a locale to `SupportedUiLocale` until every shipped user-facing namespace has reviewed authored copy
- parity alone is not sufficient; exact-English leakage in shipped `common.*`, `options.*`, `history.*`, `content.*`, and `popup.*` copy must fail contract tests

## Suggested API Contract

The shared i18n core should provide:

- `type SupportedUiLocale = "en" | "fa"`
- `type UiLanguageSetting = "system" | SupportedUiLocale`
- `resolveUiLocale(setting, browserLocale)`
- `getLocaleDirection(locale)`
- `createTranslator(locale)`
- `I18nProvider`
- `useI18n()`
- `useT()`

The translator should support named interpolation:

- example pattern: `t("popup.status.updatedMinutesAgo", { minutes: 5 })`

Non-default locale catalogs may load asynchronously before a surface swaps locale. The surface should keep its previous locale active until the new catalog is ready, then apply `lang`, `dir`, and translated chrome in one transition.

## Migration Rules

For each migrated surface:

1. move visible UI copy into the proper catalog namespace
2. replace hardcoded strings with `t(...)`
3. apply `lang` and `dir` to the surface root
4. keep any dynamic numeric or state formatting inside helper functions, not inside JSX literals
5. do not introduce a second localization library or per-surface custom translation store
6. when locale loading is asynchronous, use a lightweight loading overlay instead of exposing partially translated chrome

## Testing Expectations For Implementation Work

When code implementation begins, the work is not done until the implementation agent:

- creates or updates an execution plan first
- adds or updates relevant tests
- runs:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan`
- runs a fresh development build for UI verification:
  - `pnpm build:development`

If runtime-sensitive overlay code is changed, also follow the repository runtime validation rules from `AGENTS.md`.

## Review Checklist

Before accepting an implementation:

- `uiLanguage` is separate from translation settings
- locale resolution is deterministic
- `lang` and `dir` are set correctly
- popup, options, history, and overlay all use the same shared i18n core when migrated
- no new hardcoded strings appear in migrated surfaces
- message catalogs remain typed and namespaced
- English fallback works
- docs and execution plans stay current with the implementation phase
