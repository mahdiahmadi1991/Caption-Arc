# Documentation Standards

## Canonical Location

- project docs live under `docs/`
- root markdown is limited to entry-point repository docs (`README.md`, `AGENTS.md`, and similar repo-level files)
- repository instruction markdown required by tooling may also live under `.github/` when it is clearly not canonical product/project documentation
- archival and historical high-volume docs belong under `docs/archive/`

## Naming And Structure

- use lowercase kebab-case file names
- each major section folder must include a `README.md`
- keep one canonical document per topic
- keep default-navigation docs concise; move heavy historical plans to archive
- keep `docs/features/plans/` pointer-only; long plans belong in `docs/archive/feature-plans/`
- use `docs/contributing/execution-plans/active/` and `docs/contributing/execution-plans/completed/` for task execution plans

## Writing Rules

- derive technical behavior from repository code/config
- derive test commands and validation expectations from repository scripts/config
- avoid speculative implementation claims
- prefer concise, skimmable sections
- use relative links

## Localization Synchronization Rules

- when changing user-facing copy in `entrypoints/shared/i18n/messages/*.ts`, sync the change across all shipped locale catalogs in the same change set
- do not update only one or two locale files for shared keys; avoid locale drift over time
- keep locale key shape parity with English and keep semantic meaning aligned across locales for changed text
- if an exception is unavoidable, record it explicitly in an active Execution Plan and resolve it in the next follow-up change

## Business Documentation Sync Rules

- for business-sensitive code changes, update the canonical business docs in `docs/product/` in the same change
- follow `docs/contributing/business-documentation-governance.md` for scope and ownership
- avoid splitting one business capability narrative across multiple competing docs

## Behavior Contract Sync Rules

- for behavior-sensitive code changes, update canonical behavior contracts in `docs/api/` in the same change
- update matching traceability matrices in `docs/quality/references/`
- follow `docs/contributing/behavior-contract-governance.md` for rule format and sync protocol
- write deterministic, code-derived rules with stable rule IDs (`C-<DOMAIN>-<NNN>`)

## Public-Safety Rules

Never include:

- secrets or tokens
- machine-local absolute paths
- private dashboard links
- copied logs with local host/user details

Use placeholders when needed:

- `<repo-root>`
- `<local-path>`
- `<browser-profile>`
- `<sample-token>`

## Migration And Refactor Rules

- prefer move/rename over delete/recreate when practical
- preserve useful legacy content by moving or merging
- record non-trivial restructures in a migration report

## Review Checklist

- links resolve
- docs are in the right section
- behavior matches current code
- no obvious duplication
- no unsafe data

## Automated Guardrails

- run `pnpm docs:check` before opening or updating a PR
- run `pnpm docs:check:business` when business-sensitive code surfaces changed
- run `pnpm docs:check:behavior` when behavior-sensitive code surfaces changed
- treat `docs:check` failures as blocking
- CI re-runs these checks to prevent out-of-contract markdown and unsynced governance docs
