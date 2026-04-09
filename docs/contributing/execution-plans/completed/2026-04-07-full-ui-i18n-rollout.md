# Full UI I18n Rollout

This Execution Plan is a living document.

Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Roll the shared UI i18n foundation from popup-only coverage to all user-facing extension surfaces, expand locale support from 2 locales to 12 locales, and add enforcement so new UI copy does not silently bypass localization or leak i18n into diagnostics or logging modules.

Done means:

- `uiLanguage` still stays local-only with `system | SupportedUiLocale`
- supported UI locales are exactly `en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, `ko`
- popup, options, meeting history, and in-meeting overlay or assistant user-facing UI copy uses the shared translator
- diagnostics or logging event ids, payloads, and logger strings remain English-only and do not import the shared i18n layer
- docs, tests, build validation, and runtime smoke checks are updated and recorded

## Problem Statement

The repository started this workstream with a typed UI i18n foundation and popup coverage only. Options, meeting history, and in-meeting overlay surfaces still contained hardcoded English user-facing copy, while some shared status helpers also emitted English strings directly into UI surfaces. Without a broader rollout, the new `uiLanguage` setting would remain incomplete, 12-locale support would be absent, and future work could regress by adding untranslated UI or by accidentally localizing diagnostics or logging text.

## Scope

- expand the supported UI locale model and locale catalogs to 12 locales
- create a canonical UI i18n coverage inventory under `docs/features/ui/`
- wire options and meeting-history roots to the shared i18n provider and locale `lang` / `dir` attributes
- localize remaining user-facing options or settings UI, including the UI language selector
- localize meeting-history screens, dialogs, action labels, filter labels, accessibility text, and toast copy
- localize in-meeting overlay, capture-guide, assistant surface, caption translation affordances, and other user-facing content-script copy
- preserve runtime-detail behavior where real service or status detail should still surface instead of being replaced by generic fallback copy
- add automated guardrails for locale key coverage and diagnostics or logger import boundaries
- update docs affected by behavior, settings, storage, and validation expectations

## Non-Goals

- localizing diagnostics event ids, diagnostics payloads, or logger messages
- localizing repository documentation away from English
- changing product behavior unrelated to localization
- redesigning UI layouts or adding new visible surfaces beyond the requested language selector and localized copy
- changing cloud sync, summary generation, or assistant runtime semantics outside the minimum needed to localize user-facing copy
- browser metadata localization through `_locales`

## Repository Context

- `entrypoints/shared/i18n/*`: typed translator foundation, locale resolution, React provider, and runtime translator access
- `entrypoints/background/types/index.ts`: local-only `uiLanguage` contract and persisted settings boundaries
- `entrypoints/background/settings.ts`: settings normalization and storage behavior
- `entrypoints/popup/*`: localized popup reference implementation and runtime-detail regression coverage
- `entrypoints/options/*`: localized settings UI, diagnostics chrome, and UI-facing hook state
- `entrypoints/meeting-history/*`: localized archive UI, detail surfaces, export content, and toasts
- `entrypoints/content/overlay/*` plus `entrypoints/content/providers/*`: localized in-meeting runtime surfaces
- `docs/architecture/ui-i18n-strategy.md`: canonical architecture guidance for the shared translator and English-only diagnostics boundary
- `docs/features/ui/ui-i18n-implementation-guide.md`: implementation guidance and current rollout state
- `docs/features/ui/ui-i18n-coverage-inventory.md`: canonical coverage inventory for the implemented surfaces
- `tests/google-meet/ui-i18n.contract.test.ts`, `popup-i18n-runtime-detail.contract.test.ts`, and `diagnostics-i18n-boundary.contract.test.ts`: i18n regression and boundary guardrails

## Constraints

- keep docs ASCII-only and English-only
- respond to the repository owner in Persian in chat, but do not localize docs away from English
- preserve `uiLanguage` as local-only and exclude it from portable or shared settings payloads
- preserve runtime detail where user-facing service state should still show the real message
- do not import the shared i18n layer into diagnostics or logger modules
- use repository evidence rather than speculative UI inventories
- for runtime-sensitive changes, complete build and smoke validation per `AGENTS.md`

## Risks and Unknowns

- options and meeting-history originally emitted many UI strings from hooks and helper functions rather than only from React components; these boundaries required translator-aware helpers
- content-script overlay surfaces are imperative DOM code, so React hooks are unavailable and runtime translator access was required
- shared runtime helper messages such as OpenAI availability and verification detail needed to preserve real user-visible detail while still localizing surrounding UI labels
- meeting-history previously used fixed `en-US` date or time formatting and required locale-aware formatting without losing scanability
- runtime smoke validation depends on a working Chrome CDP setup in the local environment

## Documentation Impact

- updated `docs/architecture/ui-i18n-strategy.md` to reflect the implemented architecture and current 12-locale model
- updated `docs/features/ui/ui-i18n-implementation-guide.md` to reflect rollout status and current supported locales
- updated `docs/features/ui/ui-i18n-coverage-inventory.md` to describe the implemented coverage state instead of the pre-rollout gap inventory
- kept `docs/api/storage-schema.md` aligned with the local-only `uiLanguage` boundary
- finalized this plan and moved it to `completed/`

## Testing and Coverage Impact

- locale contract tests now cover the 12-locale inventory, English fallback behavior, and catalog-shape parity
- diagnostics boundary tests assert that core diagnostics modules do not import the shared i18n layer
- popup runtime-detail tests preserve real unavailable or summary-status detail where present
- full validation commands were rerun after the final code and docs patch

## Milestones

### Milestone 1 - Planning And Locale Infrastructure

Create the canonical coverage inventory, restore an active Execution Plan for this rollout, expand supported locale types or catalog plumbing to 12 locales, and wire options or meeting-history roots to the shared i18n provider and locale attributes. Verification: docs index or update checks, targeted i18n tests, and a development build.

Completed.

### Milestone 2 - Options And Shared Status Localization

Localize the full options or settings UI, add the UI language selector, and refactor shared user-facing status helpers and options hooks so UI-facing state is localizable without moving diagnostics or logging away from English. Verification: options-focused targeted tests plus broader Google test suite and build.

Completed.

### Milestone 3 - Meeting History Localization

Localize meeting-history screens, filters, dialogs, badges, accessibility text, date or time formatting, and toast or status messages, preserving runtime detail where service status needs to remain visible. Verification: meeting-history targeted tests plus Google test suite and build.

Completed.

### Milestone 4 - In-Meeting Overlay And Assistant Localization

Add imperative translator access for content-script surfaces, localize overlay, capture-guide, caption translation affordances, assistant UI, and prompt or empty-state text, and keep diagnostics or logging imports isolated from i18n. Verification: runtime-sensitive smoke flow, provider-level spot checks if needed, and build or test suite.

Completed in code. Runtime smoke validation remained environment-blocked, as recorded below.

### Milestone 5 - Guardrails, Docs, And Final Validation

Add translation coverage and logging-boundary guardrails, finish doc updates, record final outcomes in the plan, and run the full repository validation required for this workstream. Verification: docs check, tests, coverage, targeted plan output, build, and smoke commands recorded in plan progress.

Completed.

## Verification

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- targeted commands recommended by `test:targeted:plan`
- `pnpm build:development`
- `pnpm chrome:debug:reload`
- `pnpm chrome:smoke:meet`
- provider-level smoke commands if shared overlay or provider behavior is materially affected

Expected observations:

- docs links stay valid and ASCII-only
- locale catalogs stay shape-compatible with English
- options and meeting-history load with correct `lang` / `dir`
- translated UI renders in supported locales without silently falling back because of missing keys
- diagnostics or logging guardrails stay green

Recorded outcomes:

- `pnpm docs:check` -> passed (`Documentation validation passed`, 109 markdown files scanned)
- `pnpm build:development` -> passed (`Built extension in 12.6 s`, total size `2.07 MB`)
- `pnpm test:google` -> passed (14 files, 97 tests)
- `pnpm test:google:coverage` -> passed (`All files`: 12.31 statements, 7.04 branches, 10.89 functions, 12.46 lines)
- `pnpm test:targeted:plan` -> passed and recommended `pnpm test:google` plus provider smoke commands for Google Meet, Microsoft Teams, and Zoom Web
- `pnpm chrome:smoke:provider google-meet lobby` -> failed because no reachable CDP endpoint was available and the configured Windows Chrome executable path `<configured-windows-chrome-path>` was not found; treated as an environment prerequisite failure rather than a code regression
- recommended provider smoke commands after the first Google Meet lobby failure were not run because they depended on the same blocked Chrome or CDP prerequisite
- `pnpm chrome:debug:reload` and `pnpm chrome:smoke:meet` were not run because the same Chrome or CDP prerequisite failure already blocked runtime smoke startup

## Progress

- [x] Inspect existing popup i18n foundation, logging rules, and non-popup UI surfaces
- [x] Create a new active Execution Plan for the rollout
- [x] Create the canonical UI i18n coverage inventory document
- [x] Expand locale support to 12 locales and wire root locale providers
- [x] Localize options or settings UI and add the UI language selector
- [x] Localize meeting-history surfaces and toast or status copy
- [x] Localize in-meeting overlay and assistant surfaces
- [x] Add translation coverage and diagnostics or i18n boundary guardrails
- [x] Update affected docs and record final validation

## Surprises and Discoveries

- Observation: `docs/contributing/plans-standard.md` referenced by `.github/instructions/docs.instructions.md` does not exist in the repository.
  Evidence: repository reads showed `docs/contributing/execution-plans.md` as the actual planning standard.
- Observation: localizing hooks that were previously provider-agnostic required test harnesses to wrap them in `I18nProvider`.
  Evidence: `tests/google-meet/use-diagnostics-console.contract.test.ts` needed a provider wrapper once `useDiagnosticsConsole` began consuming `useT()`.
- Observation: a stray extra closing tag in `entrypoints/options/App.tsx` caused a parser failure during validation late in the rollout.
  Evidence: `pnpm build:development` initially failed with an unterminated regular expression parse error until the extra `</div>` was removed.
- Observation: translator-backed option factories caused one stale popup import regression when `OPENAI_MODELS` was replaced by `getOpenAiModels(t)`.
  Evidence: final validation exposed a popup build failure that was fixed by updating `entrypoints/popup/App.tsx` to the translator-backed factory.
- Observation: the final residual scan found one remaining user-facing hardcoded English suffix in the options API key label.
  Evidence: `entrypoints/options/components/api-key-input.tsx` still rendered `(OpenAI)` outside the translator until the last cleanup patch moved it into the catalog.
- Observation: runtime smoke validation remains dependent on a working local Chrome CDP bridge and a valid configured Windows Chrome executable path.
  Evidence: the smoke rerun failed before scenario checks because no reachable CDP endpoint was available and the configured Chrome path could not be found.

## Decision Log

- Decision: treat `docs/contributing/execution-plans.md` as the canonical planning standard for this rollout.
  Rationale: the repo references `docs/contributing/plans-standard.md`, but that file does not exist; `execution-plans.md` is the actual in-repo standard and must govern the plan.
  Date/Author: 2026-04-07 / GitHub Copilot
- Decision: create the coverage inventory before broad code migration.
  Rationale: the user explicitly requested an evidence-based inventory first, and the breadth of untranslated surfaces was too large to safely migrate ad hoc.
  Date/Author: 2026-04-07 / GitHub Copilot
- Decision: treat diagnostics console chrome as localizable UI, but keep the i18n import boundary limited to core diagnostics runtime or logger modules.
  Rationale: this preserves English-only event ids, payloads, and logger strings while still allowing the options diagnostics surface to honor the selected UI language.
  Date/Author: 2026-04-07 / GitHub Copilot
- Decision: preserve real runtime detail messages where present and localize the surrounding UI instead of replacing those details with generic fallback copy.
  Rationale: user-facing status detail from OpenAI availability, summary jobs, and similar runtime surfaces remains operationally important even inside a localized UI shell.
  Date/Author: 2026-04-07 / GitHub Copilot
- Decision: keep the 12-locale product contract while authoring `en` and `fa` catalogs first and relying on deterministic English fallback for the remaining supported locales.
  Rationale: this satisfies the required locale inventory and locale-selection behavior without blocking rollout on simultaneous authored translations for every locale.
  Date/Author: 2026-04-07 / GitHub Copilot

## Outcomes and Retrospective

Completed outcome:

- the shared UI i18n system now covers popup, options, meeting history, and in-meeting content surfaces
- `uiLanguage` is persisted as local-only device state and remains excluded from shared or portable settings payloads
- the repository now supports the 12-locale UI contract with deterministic English fallback and authored Persian UI copy
- popup, options, and meeting-history roots apply locale-aware `lang` / `dir`, while content-script surfaces use runtime translator access for imperative DOM updates
- diagnostics and logger runtime modules remain English-only and guarded against i18n imports
- canonical docs now reflect the implemented architecture, current coverage, and remaining browser-metadata future work

What changed from the original plan:

- the workstream expanded beyond the initially planned options and meeting-history coverage to include the remaining in-meeting runtime surfaces discovered during residual scans, including overlay footer, prompts, and assistant chrome
- final validation uncovered two late regressions, one parser issue in options and one stale popup import, both of which were fixed before completion
- the final cleanup pass surfaced one last hardcoded options label suffix, which was moved into the message catalogs before close-out

What remains:

- browser metadata localization through `_locales` remains outside this workstream
- locale-specific authored catalogs beyond `fa` remain future translation work, but the supported-locale runtime contract is already in place
