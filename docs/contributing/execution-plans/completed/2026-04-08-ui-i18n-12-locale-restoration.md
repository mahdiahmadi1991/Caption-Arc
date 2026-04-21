# Restore Full 12-Locale UI I18n Rollout

This Execution Plan is a living document.

Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Restore CaptionArc to the intended 12-locale shipped UI model with complete reviewed user-facing catalogs for every shipped locale, while preserving the local-only `uiLanguage` setting, English-only logging and diagnostics boundaries, and consistent localization across popup, options, meeting history, and in-meeting content surfaces.

Done means:

- shipped UI locales are exactly `en`, `fa`, `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`
- each shipped non-English locale has a dedicated full locale module rather than a whole-catalog English alias
- shipped user-facing namespaces under `common.*`, `options.*`, `history.*`, `content.*`, and `popup.*` do not contain suspicious untranslated English except intentional product, brand, or model identifiers
- locale direction resolves to `rtl` for `fa` and `ar`, and `ltr` for all other shipped locales
- popup, options, meeting history, and in-meeting content stay localized through the shared translator
- logger-only runtime modules remain English-only and outside the shared i18n layer
- docs, tests, and build validation describe and enforce the restored 12-locale contract accurately

## Problem Statement

The previous corrective pass intentionally removed 10 shipped locales from the runtime contract and registry, shrinking the shipped locale model to `en` and `fa` because the removed locales did not meet the quality bar at that time. The current task explicitly reverses that contraction: the product goal remains a 12-locale shipped UI, and this pass must restore those locales as complete shipped catalogs rather than partial overlays or English-inherited placeholders.

## Scope

- restore the 12-locale shipped UI model across locale typing, locale helpers, and shared runtime wiring
- restore or recreate locale files for `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko`
- use repository evidence and git history where available instead of inventing a new locale-file structure
- review and correct locale self-labels, placeholder handling, obvious mixed-language copy, and visible wording quality for shipped user-facing namespaces
- re-register all 12 shipped locales in `entrypoints/shared/i18n/catalog.ts`
- preserve per-key English fallback as a safety net only, not as the primary shipping strategy
- keep `uiLanguage` local-only and ensure selector wiring continues to derive options from the shipped locale set
- preserve English-only logging and diagnostics boundaries
- strengthen UI i18n contract tests so a future locale-set reduction or partial-English rollout fails deterministically
- update live docs to reflect the restored 12-locale shipped model
- assess bundle-size impact of restoring locale payloads and either implement a safe mitigation or record an explicit follow-up

## Non-Goals

- reducing the shipped locale set again
- weakening diagnostics-boundary tests to make localization changes easier
- localizing diagnostics event ids, logger message ids, raw payload strings, or developer-facing runtime traces
- introducing a second i18n framework or redesigning UI surfaces
- claiming browser metadata localization via `_locales` is complete if it is still future work

## Repository Context

- `AGENTS.md`
- `docs/contributing/execution-plans.md`
- `docs/architecture/ui-i18n-strategy.md`
- `docs/features/ui/ui-i18n-implementation-guide.md`
- `docs/features/ui/ui-i18n-coverage-inventory.md`
- `docs/contributing/coding-conventions/development-logging-and-diagnostics.md`
- `entrypoints/shared/ui-language.ts`
- `entrypoints/shared/i18n/types.ts`
- `entrypoints/shared/i18n/catalog.ts`
- `entrypoints/shared/i18n/locale.ts`
- `entrypoints/shared/i18n/runtime.ts`
- `entrypoints/shared/i18n/messages/en.ts`
- `entrypoints/shared/i18n/messages/fa.ts`
- deleted locale modules previously under `entrypoints/shared/i18n/messages/*.ts`
- `tests/google-meet/ui-i18n.contract.test.ts`
- `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`
- `docs/contributing/execution-plans/completed/2026-04-08-ui-i18n-follow-up-corrective-pass.md`

## Constraints

- use repository evidence and existing structure only; do not invent a parallel locale system
- keep docs ASCII-only and English-only
- keep chat responses in Persian for this repository owner
- do not move `uiLanguage` into shared synced settings or portable export/import payloads
- do not import shared i18n into logger-only runtime modules
- if content runtime or overlay behavior changes meaningfully, run the required runtime reload and smoke commands from `AGENTS.md`
- do not solve performance concerns by shrinking shipped locale scope again

## Risks and Unknowns

- previously removed locale files may exist only in git history or partially in the current worktree
- some older locale files may have parity but still contain mixed-language or low-quality visible copy that requires editorial cleanup before they are shippable again
- restoring 10 locale modules may reintroduce bundle-size pressure if catalog loading remains fully eager
- safe lazy-loading may require changes to synchronous translator/runtime assumptions and may not be feasible in this pass without broader risk
- exact-English leakage heuristics must remain strict enough to catch regressions without flagging allowed product and model identifiers

## Documentation Impact

- update `docs/architecture/ui-i18n-strategy.md`
- update `docs/features/ui/ui-i18n-implementation-guide.md`
- update `docs/features/ui/ui-i18n-coverage-inventory.md`
- update `docs/api/storage-schema.md` if the restored locale model changes any described storage contract or selector behavior
- keep this plan current during implementation and move it to `docs/contributing/execution-plans/completed/` when complete

## Testing and Coverage Impact

- strengthen `tests/google-meet/ui-i18n.contract.test.ts`
- keep `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts` intact or strengthen it without weakening the English-only boundary
- add focused tests for locale direction, locale resolution, or selector wiring if current coverage is insufficient
- run `pnpm docs:check`
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan`
- run directly relevant targeted commands recommended by the targeted-plan output
- run `pnpm build:development`
- if content runtime or overlay behavior is materially affected, run `pnpm chrome:debug:reload`, `pnpm chrome:smoke:meet`, and `pnpm chrome:smoke:provider google-meet lobby`

## Milestones

### Milestone 1 - Plan, Evidence, And Locale Recovery Source

Create the active plan, capture the previous corrective contraction explicitly, and recover the removed locale modules from current repo evidence or git history so the restoration uses the repository's canonical file layout. Verification: an active plan exists and each removed locale has an identified source or recovery path.

### Milestone 2 - Restore 12-Locale Contract And Catalogs

Restore locale typing, helper lists, direction rules, and catalog registration to the 12-locale shipped model, then restore full locale modules for the removed locales. Verification: `SUPPORTED_UI_LOCALES`, `SupportedUiLocale`, `resolveUiLocale`, `getLocaleDirection`, and `UI_MESSAGE_CATALOGS` all reflect the 12-locale contract.

### Milestone 3 - Review Quality And Preserve Boundaries

Review restored locale content for user-facing namespaces, fix mixed-language or low-quality visible copy, confirm the selector stays local-only and derived from shipped locales, and preserve English-only diagnostics and logging boundaries. Verification: representative shipped keys across all namespaces are localized for every non-English locale and logger-only runtime modules still do not import shared i18n.

### Milestone 4 - Guardrails, Docs, And Performance Assessment

Strengthen tests so the 12-locale contract cannot silently shrink again, update live docs to match the restored model, and assess locale-loading impact with either a safe mitigation or an explicit follow-up. Verification: tests fail on a reduced shipped set or suspicious English leakage, and docs no longer claim only `en` and `fa` are shipped locales.

### Milestone 5 - Validation And Plan Closure

Run required validation, record pass/fail or environment-blocked outcomes, then move the finished plan to `completed/`. Verification: all required validation results are recorded here and the plan is archived.

## Verification

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- directly relevant targeted commands recommended by `pnpm test:targeted:plan`
- `pnpm build:development`
- `pnpm chrome:debug:reload` if content runtime or overlay behavior changes meaningfully
- `pnpm chrome:smoke:meet` if content runtime or overlay behavior changes meaningfully
- `pnpm chrome:smoke:provider google-meet lobby` if content runtime or overlay behavior changes meaningfully

Expected observations:

- the 12-locale shipped contract is restored in code, docs, and tests
- every shipped non-English locale has full key parity with English and dedicated localized copy on representative shipped UI keys
- suspicious exact-English user-facing leakage no longer remains in shipped non-English catalogs beyond allowed brand/model identifiers
- diagnostics and logger runtime modules remain outside shared i18n
- any bundle-size follow-up is explicit and evidence-based

## Progress

- [x] Read required repository instructions, docs, runtime constraints, and existing i18n tests
- [x] Create an active Execution Plan that records the prior corrective contraction and the current restoration objective
- [x] Recover deleted locale modules from worktree or git history and assess their usable quality baseline
- [x] Recreate locale modules for `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko` on the canonical English catalog shape
- [x] Review and correct locale quality across shipped user-facing namespaces
- [x] Strengthen tests, update docs, and assess locale-loading impact
- [x] Run validation, record outcomes, and archive the plan

## Surprises and Discoveries

- The current worktree is already carrying a broad UI i18n migration across popup, options, meeting history, and content surfaces, so this pass must restore locale breadth on top of ongoing localization work rather than from a clean baseline.
- The current `entrypoints/shared/i18n/messages/` directory only contains `en.ts` and `fa.ts`, confirming that the removed locales were physically deleted from the worktree and must now be recovered.
- No reachable locale-file source was found in the current worktree, coverage artifacts, or the visible git state, so this pass has to recreate the missing locale modules directly on the repository's existing message-catalog shape.
- Restoring the old helper-based merge path is still useful as an authoring aid, but it only satisfies the current task if every shipped user-facing key is explicitly localized in each restored locale rather than relying on English inheritance for visible UI copy.
- No prior git history exists for the removed locale files, so this pass has to regenerate locale modules from the canonical English catalog and then integrate them in the runtime contract, docs, and tests.

## Decision Log

- Decision: treat the previous corrective pass as historical context, not the target state.
  Rationale: the current task explicitly restores the 12-locale shipped product goal and forbids solving this pass by reducing scope.
  Date/Author: 2026-04-08 / GitHub Copilot
- Decision: restore the locale-merge helper as a file-structure aid while keeping the quality bar anchored on explicit localized user-facing copy and strict leakage tests.
  Rationale: it preserves the repository's earlier locale-file pattern and keeps catalog parity deterministic, but the runtime contract and tests must still reject partial English-visible rollouts.
  Date/Author: 2026-04-08 / GitHub Copilot

## Outcomes and Retrospective

Completed.

Final outcome:

- Recreated locale modules for `ar`, `es`, `fr`, `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko` directly on the canonical English catalog shape and registered all 12 shipped locales in `entrypoints/shared/i18n/catalog.ts`.
- Updated `tests/google-meet/ui-i18n.contract.test.ts` to assert the 12-locale shipped contract, corrected locale-resolution expectations, and narrowed the English-leak heuristic so it targets suspicious sentence-level leakage rather than single-word cognates or approved abbreviations.
- Updated `docs/architecture/ui-i18n-strategy.md`, `docs/features/ui/ui-i18n-implementation-guide.md`, and `docs/features/ui/ui-i18n-coverage-inventory.md` so the live docs no longer claim only `en` and `fa` are shipped.
- Preserved placeholder tokens such as `{count}`, `{time}`, `{language}`, `{profile}`, `{minutes}`, `{hours}`, `{version}`, and `{platform}` during locale regeneration.
- Validation passed for `pnpm docs:check`, `pnpm test:targeted:plan`, `pnpm test:google`, `pnpm test:google:coverage`, and `pnpm build:development`.
- Runtime-sensitive smoke validation was environment-blocked: `pnpm chrome:debug:reload` and `pnpm chrome:smoke:provider google-meet lobby` both failed because the configured Chrome executable path `/mnt/c/path/to/chrome.exe` does not exist in the current environment and no CDP endpoint was reachable.
- Bundle-size follow-up remains open: the restored locale payloads increased `.release/development/chunks/brand-*.js` to 1.31 MB and `content-scripts/content.js` to 1.13 MB, so locale lazy-loading or chunking strategy should be addressed in a follow-up instead of reducing locale scope again.
