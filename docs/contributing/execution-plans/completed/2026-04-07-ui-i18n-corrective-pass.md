# UI I18n Corrective Pass

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Correct the repository-wide UI i18n rollout so it matches the originally requested standard: authored localization for all 12 supported locales, no missed user-facing untranslated shipped UI strings, improved Persian quality, preserved English-only diagnostics and logging boundaries, and stronger automated guardrails.

Done means:

- all 12 supported UI locales have dedicated authored catalog modules
- no supported non-English locale is whole-catalog aliased directly to English
- remaining shipped user-facing untranslated strings found by repository audit are localized
- Persian base catalog copy is editorially cleaned up where wording is weak or inconsistent
- diagnostics and logging producers remain English-only and do not import the shared i18n layer
- tests fail if locale catalog coverage or diagnostics boundaries regress
- docs describe the actual implementation state accurately

## Problem Statement

The current UI i18n rollout is structurally in place, but it still falls short of the requested standard. Ten supported locales are currently catalog aliases to English, some user-facing strings are still hardcoded, Persian copy quality is uneven in parts of the base catalog, and the diagnostics or i18n boundary guard only covers a narrow subset of logger-producing modules.

## Scope

- add authored locale catalog modules for `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`
- update `entrypoints/shared/i18n/catalog.ts` so every supported locale has its own authored catalog registration
- fix confirmed remaining untranslated UI strings in shipped surfaces
- run a residual audit over shipped user-facing UI surfaces and localize any additional missed strings found in this pass
- improve weak Persian wording in `entrypoints/shared/i18n/messages/fa.ts`, including the required minimum keys and nearby consistency issues
- strengthen diagnostics or i18n boundary coverage so logger-producing modules are guarded broadly enough
- strengthen UI i18n contract tests for authored catalogs, parity, and coverage registration failures
- update docs and the coverage inventory to describe the corrected state accurately
- assess whether locale catalogs can be lazy-loaded or code-split cleanly; implement if feasible, otherwise record a concrete follow-up note

## Non-Goals

- adding a second i18n framework
- localizing diagnostics payloads, event ids, tracing strings, or developer-facing raw log messages
- localizing internal AI or system prompts unless already product-approved UI copy
- redesigning the existing UI or changing product behavior unrelated to localization quality or completeness
- speculative runtime or architecture changes unrelated to the corrective pass

## Repository Context

- `entrypoints/shared/i18n/catalog.ts`
- `entrypoints/shared/i18n/messages/en.ts`
- `entrypoints/shared/i18n/messages/fa.ts`
- `entrypoints/options/**`
- `entrypoints/meeting-history/**`
- `entrypoints/content/**`
- `entrypoints/shared/**` where UI text feeds shipped surfaces
- `tests/google-meet/ui-i18n.contract.test.ts`
- `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`
- `docs/architecture/ui-i18n-strategy.md`
- `docs/features/ui/ui-i18n-implementation-guide.md`
- `docs/features/ui/ui-i18n-coverage-inventory.md`
- `docs/contributing/coding-conventions/development-logging-and-diagnostics.md`

## Constraints

- keep docs ASCII-only and English-only
- respond to the repository owner in Persian in chat, but keep docs in English
- use repository evidence and residual audit findings rather than guesswork
- preserve the existing shared i18n architecture rather than introducing a parallel system
- keep logs and diagnostics English-only and outside the shared i18n layer
- keep typing strict and avoid `any`
- run the repository validation commands required by `AGENTS.md`

## Risks and Unknowns

- 10 supported locales are currently aliased to English
- some user-facing strings are still hardcoded
- Persian copy needs editorial cleanup
- diagnostics or i18n boundary guard is too narrow
- adding 10 authored catalogs may worsen the existing build-size warning unless code-splitting is feasible in the current architecture
- residual audit work must avoid false positives from diagnostics, prompts, or internal developer strings that intentionally remain English-only

## Documentation Impact

- update `docs/features/ui/ui-i18n-coverage-inventory.md`
- update `docs/features/ui/ui-i18n-implementation-guide.md`
- update `docs/architecture/ui-i18n-strategy.md`
- update this plan continuously and move it to `completed/` when finished

## Testing and Coverage Impact

- strengthen `tests/google-meet/ui-i18n.contract.test.ts`
- strengthen `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`
- run `pnpm docs:check`
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan` and directly relevant recommended targeted commands
- run `pnpm build:development`
- if content or overlay files change, run `pnpm chrome:debug:reload`, `pnpm chrome:smoke:meet`, and `pnpm chrome:smoke:provider google-meet lobby`

## Milestones

### Milestone 1 - Residual Audit And Confirmed UI Gaps

Confirm the remaining shipped user-facing untranslated strings and identify any additional missed surfaces in the current rollout, while excluding diagnostics and logging paths that must remain English-only. Verification: the corrective pass has a concrete file-level edit list grounded in repository search results.

### Milestone 2 - Full Authored Locale Catalog Coverage

Add dedicated authored catalog modules for the remaining 10 supported locales and update catalog registration so no supported locale except English is a whole-catalog alias to English. Verification: catalog tests prove every supported locale has a dedicated authored module and key parity with English.

### Milestone 3 - UI String Corrections And Persian Editorial Cleanup

Fix the confirmed untranslated shipped UI strings, localize page titles according to active `uiLanguage`, and improve weak Persian wording for the required keys and nearby terminology. Verification: residual audit rerun finds no credible missed shipped UI strings in the corrected surfaces.

### Milestone 4 - Stronger Guardrails And Final Validation

Expand diagnostics boundary coverage to logger-producing modules, finish doc updates, assess bundle-size mitigation feasibility, and run the required validation commands. Verification: docs, tests, coverage, targeted commands, build, and any required smoke commands are recorded in the plan with pass or environment-blocked outcomes.

## Verification

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- directly relevant recommended targeted commands
- `pnpm build:development`
- `pnpm chrome:debug:reload` if content or overlay files change
- `pnpm chrome:smoke:meet` if content or overlay files change
- `pnpm chrome:smoke:provider google-meet lobby` if content or overlay files change

Expected observations:

- every supported locale is backed by a dedicated authored catalog module
- no shipped UI surface in scope still contains hardcoded user-facing English by mistake
- Persian wording is product-quality and terminology is consistent across surfaces
- diagnostics or logging producers remain outside the shared i18n layer
- docs accurately reflect the corrected rollout state

## Progress

- [x] Read required repository instructions and current i18n docs or tests
- [x] Create the active corrective-pass Execution Plan
- [x] Run the residual shipped-UI audit and confirm exact fixes
- [x] Add authored locale catalogs for the remaining 10 supported locales
- [x] Fix untranslated shipped UI strings and localized page titles
- [x] Improve Persian wording consistency
- [x] Strengthen diagnostics and i18n guardrails
- [x] Update docs to reflect the corrected state
- [x] Run validation and archive the plan

## Surprises and Discoveries

- The original `UiMessageCatalog` type was coupled to English string literals, which prevented dedicated translated locale modules from type-checking once the alias-based registration was removed.
- A broad diagnostics or i18n boundary test incorrectly classified localized diagnostics chrome in options code as a runtime logging violation; the real boundary is narrower and applies to runtime logger producers.
- Merging locale-specific overrides over the canonical English catalog is the least brittle way to keep dedicated locale modules reviewable while preserving per-key fallback behavior.

## Decision Log

- Replaced whole-catalog English aliases with dedicated locale modules for every supported locale.
- Kept English fallback at lookup time and used locale-specific overrides for newly added locale modules instead of duplicating a second full catalog tree for each language.
- Scoped the diagnostics or i18n boundary contract to the explicit logger-only runtime module set so localized overlay and provider UI surfaces are not treated as boundary violations.

## Outcomes and Retrospective

- Confirmed and localized the remaining shipped hardcoded UI strings touched in this corrective pass, including page titles and content translation error-path copy.
- Added dedicated locale modules for all supported locales and strengthened tests to cover both dedicated-catalog registration and high-signal localized chrome.
- Validation passed for `pnpm build:development`, `pnpm test:google`, `pnpm test:google:coverage`, `pnpm test:targeted:plan`, and `pnpm docs:check` after the boundary guardrail was corrected.
- Recommended CDP smoke commands were attempted after `pnpm chrome:debug:reload`, but the environment was blocked because the configured Chrome binary path `/mnt/c/path/to/chrome.exe` does not exist on this machine.