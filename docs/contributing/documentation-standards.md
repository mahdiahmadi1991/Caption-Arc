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
- treat `docs:check` failures as blocking
- CI re-runs this check to prevent out-of-contract markdown and broken links
