# UI I18n Strategy

## Purpose

This document records the recommended UI localization architecture for CaptionArc.

It covers UI copy only.

It does not change or replace:

- caption translation target handling
- meeting output language selection
- provider-specific caption extraction behavior

## Current Repository Shape

CaptionArc has multiple UI surfaces with different rendering models:

- React pages:
  - `entrypoints/options/*`
  - `entrypoints/popup/*`
  - `entrypoints/meeting-history/*`
- imperative content overlay and prompts:
  - `entrypoints/content/overlay/*`
  - `entrypoints/content/render.ts`

The runtime is also split across extension surfaces:

- background settings and persistence
- content-script overlay rendering
- shared helpers and domain models

Relevant repository evidence:

- `docs/architecture/extension-runtime.md`
- `entrypoints/options/App.tsx`
- `entrypoints/popup/App.tsx`
- `entrypoints/meeting-history/App.tsx`
- `entrypoints/content/overlay/header.ts`
- `entrypoints/content/overlay/capture-consent.ts`
- `entrypoints/content/render.ts`

The repository already includes language metadata for translation behavior:

- `entrypoints/shared/language-metadata.ts`

That file is currently about translation target languages and text direction helpers. It is not a UI locale system.

## Problem

UI copy is currently hardcoded across the repository. There is no canonical UI locale setting, no shared message catalog, and no single translation API that works across both React pages and imperative overlay modules.

This creates four architectural problems:

1. React pages and imperative overlay code would drift if they adopted different localization mechanisms.
2. Browser-extension metadata and in-app copy have different needs.
3. Target-language settings for translated captions are not the same thing as the UI language.
4. RTL support needs to be driven by the UI locale, not by caption translation state.

## Decision Summary

CaptionArc should use a hybrid localization model:

1. Use `chrome.i18n` only for browser-extension metadata.
2. Use a shared internal i18n core for all in-app UI copy.

This is the canonical strategy for the repository.

## Why This Strategy Fits This Repository

### Use `chrome.i18n` For Extension Metadata Only

This includes browser-level fields such as:

- extension name
- extension description
- action title
- other manifest-level copy if added later

Rationale:

- this is the native Chrome extension mechanism
- it is the correct fit for manifest-facing strings
- it avoids coupling browser metadata to the internal app runtime

### Use A Shared Internal I18n Core For UI Copy

This includes UI strings rendered inside:

- options
- popup
- meeting history
- in-meeting overlay
- prompt and status surfaces

Rationale:

- the repository mixes React and imperative DOM code
- one shared internal translator can serve both rendering styles
- internal message catalogs are easier to type-check, test, and refactor than direct `chrome.i18n.getMessage(...)` calls spread across the codebase

## Rejected Alternatives

### `chrome.i18n` Everywhere

Rejected as the main UI solution.

Pros:

- native to Chrome extensions
- no additional dependency required

Cons for this repository:

- poor ergonomics in React components
- weak typing and interpolation discipline
- awkward testing and refactoring
- easy to create scattered string-key lookups across both React and imperative modules

### React-Only I18n Library As The Primary System

Rejected as the main repository-wide solution.

Pros:

- good developer experience for `options`, `popup`, and `meeting-history`

Cons for this repository:

- the content overlay is not primarily React-driven
- imperative modules would need a second localization path or a wrapper layer
- this would create two parallel localization patterns in one codebase

## Canonical UI Locale Model

UI locale must be separate from translation settings.

Do not overload these existing settings:

- `targetLanguage`
- `meetingOutputLanguage`

Instead, add a dedicated UI locale setting:

- `uiLanguage: "system" | SupportedUiLocale`

Supported UI locales:

- `en`
- `fa`
- `ar`
- `es`
- `fr`
- `de`
- `pt`
- `ru`
- `hi`
- `zh`
- `ja`
- `ko`

Recommended fallback locale:

- `en`

Current implementation note:

- the full 12-locale UI set is shipped through the shared translator
- English remains the fallback locale for per-key lookup failures
- any future locale must land as a reviewed catalog and pass the UI i18n contract tests before it is added to `SupportedUiLocale`

Recommended locale resolution order:

1. `settings.uiLanguage` when set to a concrete supported locale
2. browser locale when `settings.uiLanguage === "system"`
3. fallback to `en`

Locale matching should normalize regional variants:

- `fa-IR` -> `fa`
- `en-US` -> `en`

## Settings Placement

`uiLanguage` should live in local device settings, not shared settings.

Rationale:

- UI language is device-facing
- the current settings model already separates shared preferences from local device state
- users may reasonably want different UI languages on different devices

Relevant repository evidence:

- `entrypoints/background/types/index.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/shared/settings-defaults.ts`

## Canonical Message Catalog Structure

Store UI message catalogs under `entrypoints/shared/i18n/`.

Recommended structure:

- `entrypoints/shared/i18n/types.ts`
- `entrypoints/shared/i18n/messages/*.ts`
- `entrypoints/shared/i18n/catalog.ts`
- `entrypoints/shared/i18n/locale.ts`
- `entrypoints/shared/i18n/index.ts`
- `entrypoints/shared/i18n/react.tsx`
- `entrypoints/shared/i18n/runtime.ts`

Catalog-loading rule:

- keep `en` eagerly available as the canonical fallback catalog
- lazy-load non-default locale catalogs so locale payload growth does not bloat the default UI path unnecessarily
- surfaces that swap locale asynchronously must show a deterministic loading state while the requested catalog loads

Recommended message-key namespaces:

- `common.*`
- `popup.*`
- `options.*`
- `history.*`
- `content.*`

Message catalogs should use one canonical English key set. Other locales must match the same key shape exactly.

Current implementation note:

- `en` is the canonical authored catalog
- the shipped UI locale set is `en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`
- English fallback remains available at lookup time, but incomplete locale overlays are not shipped

Settings-help authoring rule:

- shared click-triggered settings help surfaces should keep chrome under `common.helpPopover.*`
- field-specific markdown help content should live under `options.help.*`
- markdown help copy must stay compact, plain-language, and localized for every shipped UI locale
- prefer short bullets and concrete examples over long policy text so the popover remains visually compact

## Canonical Translator API

The shared i18n core should expose:

- `type SupportedUiLocale = typeof SUPPORTED_UI_LOCALES[number]`
- `type UiLanguageSetting = "system" | SupportedUiLocale`
- `resolveUiLocale(setting, browserLocale): SupportedUiLocale`
- `getLocaleDirection(locale): "ltr" | "rtl"`
- `createTranslator(locale)`
- `t(key, params?)`

Translator requirements:

- pure lookup with English fallback
- simple named interpolation
- no silent key-shape drift across locales
- safe use in both React and non-React code

Current implementation note:

- the concrete shipped UI locale union currently resolves to `en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`
- the separate AI language catalog in `entrypoints/shared/language-metadata.ts` is broader and must not be treated as the UI locale inventory

## React Integration

React surfaces should use a thin provider and hook over the shared i18n core.

Recommended API:

- `I18nProvider`
- `useI18n()`
- `useT()`

The provider should accept the resolved locale and expose:

- `locale`
- `direction`
- `t`

React pages should not import raw catalog objects directly.

## Imperative Overlay Integration

Imperative content modules should use the same shared translator without requiring React.

Recommended pattern:

- resolve locale once from current settings
- build one translator instance for the current overlay state
- use `t(...)` at DOM creation and sync points

This applies to modules such as:

- `entrypoints/content/overlay/header.ts`
- `entrypoints/content/overlay/capture-consent.ts`
- `entrypoints/content/render.ts`

## Directionality Rules

UI direction must depend on the resolved UI locale.

Rules:

- `fa` uses `rtl`
- `ar` uses `rtl`
- all other currently supported locales use `ltr`
- set `lang` and `dir` on each surface root
- do not infer UI direction from translated caption content
- keep caption text-direction logic independent where per-line content requires it

This keeps UI chrome stable while still allowing caption content to use existing direction helpers.

## Rollout Strategy

Adopt UI localization in phases.

Recommended order:

1. foundation plus popup
2. options
3. meeting history
4. in-meeting overlay and prompt surfaces
5. manifest metadata via `_locales`

Reasons:

- popup is the smallest high-visibility UI surface
- options and meeting history are larger React migrations
- overlay migration is more sensitive because it is imperative and runtime-heavy
- manifest localization can remain independent of the internal UI rollout

## Guardrails

When implementing this strategy:

- do not mix multiple unrelated i18n mechanisms for UI copy
- do not treat caption translation settings as UI locale settings
- do not add new hardcoded UI strings in migrated surfaces
- keep fallback behavior deterministic and English-first
- keep locale catalogs type-safe and namespaced

## Implementation Status

As of 2026-04-07, the internal UI i18n architecture is implemented in code for popup, options, meeting history, and in-meeting content surfaces.

Current status:

- `uiLanguage` is stored as local-only device state
- popup, options, meeting history, and overlay surfaces resolve locale and apply `lang` / `dir`
- diagnostics and logger modules remain outside the shared i18n layer
- browser metadata localization through `_locales` remains future work
