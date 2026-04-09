# UI I18n Coverage Inventory

This document is the canonical inventory for the current repository-wide UI i18n rollout state.

Scope rule:

- include user-facing extension UI copy, accessibility text, user prompts, and user-visible status or toast copy
- exclude diagnostics event ids, diagnostics payloads, logger strings, repository docs, and internal-only implementation comments

## Current Coverage Summary

- supported UI locales are `en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`
- `en` is the canonical authored catalog and all shipped non-English locales now register dedicated locale modules in the shared catalog
- English fallback remains a per-key safety net inside shipped catalogs, not a mechanism for shipping partial locale rollouts
- popup, options, meeting history, and in-meeting content surfaces now use the shared translator
- logger-only runtime modules remain intentionally English-only and outside the shared i18n layer

## Shared Infrastructure Coverage

- `entrypoints/shared/i18n/types.ts`: shipped-locale union, translator key typing, interpolation types
- `entrypoints/shared/i18n/locale.ts`: locale resolution, browser-locale normalization, and direction helpers
- `entrypoints/shared/i18n/catalog.ts`: canonical English fallback and catalog registration for the full 12-locale shipped set
- `entrypoints/shared/i18n/react.tsx`: React provider and hooks for popup, options, and meeting history
- `entrypoints/shared/i18n/runtime.ts`: imperative runtime translator access and locale propagation for content-script surfaces
- `entrypoints/shared/settings-defaults.ts`, `entrypoints/background/types/index.ts`, and `entrypoints/background/settings.ts`: local-only `uiLanguage` plumbing and settings normalization
- `docs/api/storage-schema.md`: canonical storage boundary note that `uiLanguage` stays local-only and out of portable/shared settings payloads

## Root Locale Wiring Coverage

- `entrypoints/popup/main.tsx`: resolves locale, applies `lang` / `dir`, and reacts to local settings changes
- `entrypoints/options/main.tsx`: resolves locale, applies `lang` / `dir`, and reacts to local settings changes
- `entrypoints/meeting-history/main.tsx`: resolves locale, applies `lang` / `dir`, and reacts to local settings changes
- content-script surfaces consume `entrypoints/shared/i18n/runtime.ts` so imperative DOM modules can read the active translator without React hooks

## Popup Coverage

- `entrypoints/popup/App.tsx`: localized setup states, archive and summary rows, overlay controls, meta chips, footer copy, and theme labels
- popup runtime-detail behavior remains preserved: unavailable OpenAI detail prefers the runtime message when present, and active or failed summary rows prefer `SummaryJobStatus.message` when present
- `entrypoints/shared/theme-toggle.tsx`: supports externally supplied localized labels without importing i18n directly

## Options Coverage

- `entrypoints/options/App.tsx`: localized page chrome, section navigation, workspace defaults, OpenAI service, translation, meeting profiles, cloud sync, and recovery flows
- `entrypoints/options/components/api-key-input.tsx`, `text-area.tsx`, and translator-backed option factories in `entrypoints/options/components/constants.ts`: localized labels, tooltips, helper text, and option metadata
- `entrypoints/options/use-settings.ts` and `entrypoints/options/use-cloud-sync.ts`: localized UI-facing save, verification, backup, and cloud-sync state messages
- `entrypoints/options/diagnostics-console.tsx` and `entrypoints/options/diagnostics-viewer.ts`: localized diagnostics console chrome while preserving English-only diagnostics event ids, payloads, and logger strings

## Meeting History Coverage

- `entrypoints/meeting-history/App.tsx`: localized page chrome, filters, storage messaging, dependency banners, loading states, and delete confirmation flow
- `entrypoints/meeting-history/use-history.ts`: localized toasts, fallback action messages, and runtime-detail preserving error wrappers
- `entrypoints/meeting-history/components/session-list.tsx`: localized date grouping, counters, badges, actions, and preview fallback copy
- `entrypoints/meeting-history/components/session-detail.tsx` and `use-session-detail.ts`: localized metadata, summary controls, transcript actions, export content, assistant review labels, and locale-aware date or duration formatting
- shared history UI such as `storage-indicator.tsx` and `confirm-dialog.tsx` now uses the shared translator

## In-Meeting Content Coverage

- `entrypoints/content/overlay/header.ts`: localized compact-state copy, dock status, tooltips, badges, and accessibility labels
- `entrypoints/content/overlay/capture-guide.ts` plus provider guide content in `entrypoints/content/providers/google-meet.ts`, `microsoft-teams.ts`, and `zoom-web.ts`: localized capture guidance, fallback states, step labels, and troubleshooting copy
- `entrypoints/content/overlay/footer.ts`: localized live-state labels, chat and turn counters, and OpenAI or auto-summary tooltips
- `entrypoints/content/overlay/capture-consent.ts`: localized startup, session continuation, and session ended prompts including timeout hints and button labels
- `entrypoints/content/overlay/assistant-surface.ts`: localized assistant statuses, empty states, source labels, panel controls, and accessibility copy
- final rollout scans did not surface additional credible hardcoded user-facing English in shipped `entrypoints/content/**` UI paths beyond the fixes already included in this workstream

## Accessibility Coverage

- popup, options, meeting history, and in-meeting content surfaces now route user-facing `aria-label`, tooltip, dialog, and empty-state copy through the shared translator where those strings are part of the UI chrome
- locale direction is applied from the resolved UI locale rather than inferred from translated caption content

## Explicit Exclusions

Do not localize:

- `entrypoints/shared/diagnostics.ts`
- `entrypoints/shared/diagnostics-client.ts`
- diagnostics event ids emitted by background, content, or options code
- logger message ids and English-only runtime diagnostics strings
- repository documentation under `docs/`
- copied external provider error payloads that are surfaced verbatim as runtime detail

## Guardrails Required By This Inventory

- `tests/google-meet/ui-i18n.contract.test.ts`: shipped locale inventory, fallback, catalog-shape parity, representative deep-key localization, and suspicious-English leakage detection
- `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`: explicit logger-only runtime module boundary for background and content diagnostics producers
- `tests/google-meet/popup-i18n-runtime-detail.contract.test.ts`: runtime-detail preservation in popup UI
