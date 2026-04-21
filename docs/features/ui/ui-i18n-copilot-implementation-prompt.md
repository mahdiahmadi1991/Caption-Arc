# UI I18n Copilot Implementation Prompt

Use this prompt for the first implementation phase only.

This prompt is intentionally narrow so the work stays reviewable.

Historical note:

- this prompt captures the original phase-1 popup-only bootstrap from 2026-04-07
- it is not the canonical current inventory for shipped locales
- the current repository ships 12 UI locales (`en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`)
- translation and meeting-output languages are defined separately in `entrypoints/shared/language-metadata.ts` and are broader than the UI locale set
- for current-state work, prefer `docs/architecture/ui-i18n-strategy.md`, `docs/features/ui/ui-i18n-implementation-guide.md`, and `docs/features/ui/ui-i18n-coverage-inventory.md`

## Prompt

Implement Phase 1 of UI i18n for CaptionArc.

Read these repository documents first and follow them exactly:

- `AGENTS.md`
- `docs/contributing/execution-plans.md`
- `docs/architecture/ui-i18n-strategy.md`
- `docs/features/ui/ui-i18n-implementation-guide.md`

Do not guess. If repository evidence conflicts with this prompt, prefer repository evidence and update the execution plan notes accordingly.

### Objective

Add the shared UI i18n foundation, add a local device `uiLanguage` setting, and migrate the popup UI to the new translator.

Do not migrate options, meeting history, or the in-meeting overlay in this change.

Do not add `_locales` or manifest metadata localization in this change.

### Required planning step

Before meaningful code edits:

1. inspect the current popup, settings, and shared runtime files
2. create a new execution plan under `docs/contributing/execution-plans/active/`
3. keep the plan updated during implementation
4. move the plan to `docs/contributing/execution-plans/completed/` when done

### Required files to create

Create these files for the historical phase-1 bootstrap:

- `entrypoints/shared/i18n/types.ts`
- initial bootstrap catalogs:
  - `entrypoints/shared/i18n/messages/en.ts`
  - `entrypoints/shared/i18n/messages/fa.ts`
- `entrypoints/shared/i18n/catalog.ts`
- `entrypoints/shared/i18n/locale.ts`
- `entrypoints/shared/i18n/index.ts`
- `entrypoints/shared/i18n/react.tsx`

Historical bootstrap note:

- phase 1 only required `en.ts` and `fa.ts`
- current repository state includes dedicated locale modules for the remaining shipped UI locales under `entrypoints/shared/i18n/messages/`

### Required files to update

Update these files:

- `entrypoints/background/types/index.ts`
- `entrypoints/shared/settings-defaults.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/popup/App.tsx`
- `entrypoints/popup/main.tsx`

Update any directly related popup file only if required by compilation or clean integration.

### Required settings model change

Add a dedicated UI language setting with this historical phase-1 type intent:

- `uiLanguage: "system" | "en" | "fa"`

This type shape was correct for the historical phase-1 scope only. Current code accepts `"system"` plus the full shipped `SupportedUiLocale` set.

Place `uiLanguage` in local device settings, not shared settings.

Requirements:

- default value must be `"system"`
- settings normalization must accept only `"system"`, `"en"`, or `"fa"`
- invalid persisted values must normalize back to `"system"`

### Required locale resolution behavior

Implement locale resolution with these rules:

1. if `uiLanguage` is `"en"` or `"fa"`, use it directly
2. if `uiLanguage` is `"system"`, resolve from browser locale
3. normalize regional forms:
   - `en-US` -> `en`
   - `en-GB` -> `en`
   - `fa-IR` -> `fa`
4. fallback locale must be `"en"`

The locale helper must expose direction:

- `en` -> `ltr`
- `fa` -> `rtl`

### Required i18n API

Implement a small shared i18n core with these capabilities:

- a typed supported-locale model
- a typed message-catalog model using the English catalog as the canonical shape
- `resolveUiLocale(...)`
- `getLocaleDirection(...)`
- `createTranslator(locale)`
- translator lookup by dot-path key
- named interpolation with plain object params
- English fallback when a key is missing from a non-English catalog

Keep the API simple. Do not add external i18n dependencies in this phase.

### Required React integration

Implement a thin React integration in `entrypoints/shared/i18n/react.tsx`.

It must provide:

- `I18nProvider`
- `useI18n()`
- `useT()`

The provider value must include:

- resolved locale
- direction
- translator function

### Popup migration scope

Migrate popup UI copy in `entrypoints/popup/App.tsx` to the shared translator.

Requirements:

- replace popup-facing hardcoded UI strings with catalog-backed keys
- use namespaces under `popup.*` and `common.*`
- preserve existing popup behavior and visual structure
- keep existing helper logic unless translation requires small refactors
- set popup root `lang` and `dir` from the resolved locale

If the popup already has small shared labels that are better under `common.*`, place them there.

### Message catalog scope

For this phase, include only the message keys required by the popup plus any minimal shared keys needed by the popup.

Do not pre-translate the entire repository.

Historical phase-1 scope only: add English and Persian catalogs for the popup scope only.

Historical scope only. Do not treat this as the current shipped locale inventory.

### Explicit non-goals

Do not:

- add a new package dependency for i18n
- migrate options UI strings
- migrate meeting-history UI strings
- migrate content overlay or prompt strings
- localize `wxt.config.ts` manifest metadata
- refactor unrelated popup logic
- move translation target language handling into the new UI i18n layer

### Required implementation quality

Keep the implementation typed and reviewable.

Requirements:

- no `any`
- no duplicate i18n logic between files
- no direct catalog imports inside popup components other than through the shared i18n API
- no new hardcoded popup UI copy after migration

### Required validation

Run these commands after implementation:

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`

Run any targeted command that the planner recommends if it is directly relevant to the popup or settings changes.

Because this is a UI-affecting change, also run:

- `pnpm build:development`

If you add or update tests, keep them scoped to the changed behavior.

### Required final output

At the end, provide:

1. a concise summary of what changed
2. the exact files created and updated
3. validation commands run and whether they passed
4. any follow-up items that should be handled in Phase 2

Do not claim later phases are implemented if they are not.
