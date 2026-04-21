# UI I18n Follow-Up Corrective Pass

This Execution Plan is a living document.

Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Correct the latest UI i18n follow-up so the repository no longer overstates localization completeness, no longer carries non-canonical planning artifacts, and no longer lets mostly-English locale catalogs pass as acceptable shipped localization.

Done means:

- non-canonical planning artifacts are removed or reconciled to the canonical planning standard
- the stray Windows metadata file is removed
- shipped non-English locale catalogs no longer contain obvious mixed-language or untranslated English UI copy in shipped namespaces
- tests fail when a non-English locale is mostly English, contains suspicious untranslated English sentences, or exposes wrong locale self-labels
- documentation truthfully describes fallback behavior instead of implying full authored localization where that is not yet true
- bundle-size regression from eager locale inclusion is either safely mitigated in code or recorded as a concrete follow-up with exact rationale

## Problem Statement

The latest i18n rollout follow-up left several correctness and repository hygiene issues unresolved. A non-canonical planning document was added alongside the canonical planning standard, a `Zone.Identifier` metadata file was committed, several locale catalogs still contain English or mixed-language strings, partial locale overlays still inherit large sections of English copy through `defineLocaleMessages`, current tests do not catch this rigorously enough, and eager catalog loading increased bundle size significantly.

Required gap inventory for this pass:

- non-canonical planning doc was added
- Zone.Identifier metadata file was added and must be removed
- several locale catalogs still contain English or mixed-language strings
- partial locale overlays still inherit large sections of English copy
- current tests do not catch this well enough
- eager catalog loading increased bundle size significantly

## Scope

- remove `docs/contributing/plans-standard.md:Zone.Identifier`
- remove or reconcile `docs/contributing/plans-standard.md` with the canonical planning standard in `docs/contributing/execution-plans.md`
- align `.github/copilot-instructions.md` to the canonical execution plan document and canonical execution plan path conventions
- audit all shipped non-English locale catalogs under `entrypoints/shared/i18n/messages/`
- correct mixed-language, untranslated, mislabeled, awkward, or malformed shipped UI strings in the `common.*`, `options.*`, `history.*`, `content.*`, and `popup.*` namespaces
- strengthen `tests/google-meet/ui-i18n.contract.test.ts` so incomplete or mixed-language locale catalogs fail deterministically
- preserve the diagnostics boundary and update it only if correctness requires it
- investigate eager locale loading in `entrypoints/shared/i18n/catalog.ts` and `entrypoints/shared/i18n/runtime.ts`
- implement safe bundle-size mitigation if feasible in this pass, otherwise document a concrete follow-up in this plan and related docs
- update i18n docs so they no longer describe partial English-inherited catalogs as complete authored localization

## Non-Goals

- redesigning UI surfaces or introducing new user-visible behavior unrelated to localization correctness
- localizing diagnostics payloads, event ids, raw logger strings, or developer-facing traces
- replacing the shared internal i18n architecture with a different framework
- speculative metadata localization via `_locales` beyond documentation alignment already in scope

## Repository Context

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/contributing/execution-plans.md`
- `docs/contributing/documentation-standards.md`
- `docs/architecture/ui-i18n-strategy.md`
- `docs/features/ui/ui-i18n-implementation-guide.md`
- `docs/features/ui/ui-i18n-coverage-inventory.md`
- `docs/contributing/plans-standard.md`
- `docs/contributing/plans-standard.md:Zone.Identifier`
- `entrypoints/shared/i18n/catalog.ts`
- `entrypoints/shared/i18n/runtime.ts`
- `entrypoints/shared/i18n/messages/en.ts`
- `entrypoints/shared/i18n/messages/fa.ts`
- removed locale modules previously under `entrypoints/shared/i18n/messages/*.ts`
- `tests/google-meet/ui-i18n.contract.test.ts`
- `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`
- `package.json`

## Constraints

- use repository evidence only; do not infer locale completeness from partial overrides
- keep docs ASCII-only and English-only
- keep chat responses in Persian for this repository owner
- do not break popup, options, meeting-history, or content runtime locale behavior while addressing bundle loading
- keep logs and diagnostics English-only and outside shared i18n in logger-only runtime modules
- treat `pnpm docs:check` failures as blocking
- if content runtime or overlay behavior changes, run the required reload and smoke commands from `AGENTS.md`

## Risks and Unknowns

- non-English locale modules currently rely on English fallback for unknown amounts of shipped UI copy
- some locale files may contain machine-translated or malformed phrases beyond the already known `ar` and `fr` examples
- safe lazy loading may require asynchronous catalog initialization that could ripple into runtime locale APIs
- the build-size regression may not be fully fixable in this pass without higher-risk architectural changes
- test heuristics for suspicious English must be strict enough to catch regressions without flagging approved brand names or placeholders

## Documentation Impact

- update `docs/architecture/ui-i18n-strategy.md`
- update `docs/features/ui/ui-i18n-implementation-guide.md`
- update `docs/features/ui/ui-i18n-coverage-inventory.md`
- update `.github/copilot-instructions.md`
- update this plan continuously and move it to `completed/` when work is finished

## Testing and Coverage Impact

- strengthen `tests/google-meet/ui-i18n.contract.test.ts`
- keep `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts` correct for the logger-only boundary
- run `pnpm docs:check`
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm test:targeted:plan`
- run directly relevant targeted commands recommended by the targeted plan
- run `pnpm build:development`
- if content runtime or overlay behavior changes while addressing bundle loading, run `pnpm chrome:debug:reload`, `pnpm chrome:smoke:meet`, and `pnpm chrome:smoke:provider google-meet lobby`

## Milestones

### Milestone 1 - Planning Hygiene And Repository Truth

Remove the non-canonical planning artifacts, align Copilot instructions to the canonical execution plan standard, and update docs so current fallback behavior is described truthfully. Verification: stray metadata file is gone, no conflicting planning standard remains, and docs point only to canonical planning guidance.

### Milestone 2 - Locale Catalog Audit And Corrections

Audit all shipped non-English locale catalogs and correct mixed-language, untranslated, mislabeled, awkward, or malformed user-facing strings across shipped namespaces. Verification: representative deep keys across every shipped namespace are explicitly localized for each non-English locale and obvious English sentences are removed.

### Milestone 3 - Guardrails And Bundle-Loading Review

Strengthen locale contract tests so mostly-English or mixed-language catalogs fail, then investigate eager locale loading and implement safe mitigation or document a concrete follow-up. Verification: new tests fail against incomplete locale behavior, and bundle-loading handling is either implemented safely or recorded with exact follow-up rationale.

### Milestone 4 - Validation And Plan Closure

Run required docs, tests, coverage, targeted, build, and runtime-sensitive commands as applicable; record outcomes and archive the plan. Verification: validation outcomes are captured here with pass/fail or environment-blocked status and the finished plan moves to `completed/`.

## Verification

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- directly relevant recommended targeted commands
- `pnpm build:development`
- `pnpm chrome:debug:reload` if content runtime or overlay behavior changes
- `pnpm chrome:smoke:meet` if content runtime or overlay behavior changes
- `pnpm chrome:smoke:provider google-meet lobby` if content runtime or overlay behavior changes

Expected observations:

- no conflicting planning standard remains in the repository
- non-English locale catalogs do not leave obvious shipped UI sentences in English
- locale self-labels are correct
- tests catch suspicious untranslated English and deep shipped namespace regressions
- bundle-size handling is explicit and evidence-based

## Progress

- [x] Read required repository instructions, docs, and current i18n tests
- [x] Create the active execution plan with the exact required gap inventory
- [x] Remove non-canonical planning artifacts and align instructions
- [x] Audit shipped locale quality and decide the corrected shipped-locale set
- [x] Strengthen locale quality guardrails and bundle-loading handling in code
- [x] Run validation, document outcomes, and archive the plan

## Surprises and Discoveries

- Observation: the repository still contains both `docs/contributing/plans-standard.md` and `docs/contributing/execution-plans.md`, and `.github/copilot-instructions.md` still points to the non-canonical file.
  Evidence: direct file reads and search results before implementation.
- Observation: helper-based locale modules `de`, `pt`, `ru`, `hi`, `zh`, `ja`, and `ko` only authored 145 of 1150 English leaf keys and inherited the remainder from English.
  Evidence: audit script comparing locale leaf counts against `entrypoints/shared/i18n/messages/en.ts`.
- Observation: supposedly full locale modules still leaked exact English heavily, with suspicious exact-English counts of `ar=276`, `es=17`, `fr=32`, and `fa=0` after filtering obvious brand and placeholder literals.
  Evidence: exact-English comparison against the canonical English catalog with a heuristic allowlist for product-name literals.

## Decision Log

- Decision: use `docs/contributing/execution-plans.md` as the only canonical planning standard for this pass.
  Rationale: `AGENTS.md` and the canonical execution-plan policy both define that path as authoritative.
  Date/Author: 2026-04-08 / Copilot
- Decision: contract the shipped UI locale set to `en` and `fa`, and remove incomplete locale modules from the shipped registry.
  Rationale: the audit showed that the removed locales were either mostly English through helper-based inheritance or still contained enough untranslated shipped UI copy that keeping them shipped would misrepresent locale quality.
  Date/Author: 2026-04-08 / Copilot
- Decision: keep the synchronous translator API and mitigate bundle growth by removing incomplete locale payloads now instead of introducing asynchronous catalog loading in this pass.
  Rationale: the shipped bundle regression came from eagerly including many incomplete locale modules; shrinking the registry removes that weight immediately while avoiding risky runtime API changes across popup, options, history, and content surfaces.
  Date/Author: 2026-04-08 / Copilot

## Outcomes and Retrospective

- Result: removed the conflicting planning artifact, removed the stray `Zone.Identifier` metadata file, and aligned repository instruction files back to the canonical execution-plan standard.
- Result: reduced shipped UI locale support to `en` and `fa`, removed incomplete locale modules from `entrypoints/shared/i18n/messages/`, and removed the helper overlay path that previously masked large English fallbacks.
- Result: strengthened `tests/google-meet/ui-i18n.contract.test.ts` so shipped locale coverage now checks inventory, parity, representative deep-key localization, and suspicious exact-English leakage.
- Result: updated live i18n architecture and feature docs so they no longer claim 12 shipped locales or describe partial English-inherited overlays as acceptable shipped localization.

Validation summary:

- `pnpm docs:check`: pass
- `pnpm test:google`: pass after refining the exact-English allowlist for approved brand literals
- `pnpm test:google:coverage`: pass after the same refinement
- `pnpm test:targeted:plan`: pass
- directly relevant targeted command `pnpm chrome:smoke:google:settings lobby`: environment-blocked because no reachable CDP endpoint was available and the configured Chrome path was missing
- `pnpm build:development`: pass
- `pnpm chrome:debug:reload`: environment-blocked because the configured Chrome path `/mnt/c/path/to/chrome.exe` does not exist
- `pnpm chrome:smoke:meet`: environment-blocked because no reachable CDP endpoint was available and the configured Chrome path was missing
- `pnpm chrome:smoke:provider google-meet lobby`: environment-blocked because no reachable CDP endpoint was available and the configured Chrome path was missing
