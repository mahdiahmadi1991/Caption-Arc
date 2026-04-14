# Chrome Keypair Governance And Secrets Alignment

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Create and retain a real Chrome extension keypair for the project before first publication, store the private key only in local ignored paths, source the public key from the repository's local secrets workflow, and document the exact local/CI handling so future release automation can preserve Chrome extension identity without guesswork.

## Problem Statement

The repository currently pins a public manifest key in tracked config but does not retain the matching private key. That is acceptable for short-term local ID stability, but it creates governance debt before any production publication or CI/CD packaging flow exists. The project needs an explicit secrets-handling pattern for Chrome extension identity so the team can preserve the intended ID later without re-deriving process from chat history.

## Scope

- generate a new Chrome extension keypair
- store the private key in `.secrets/` only
- move the public key source of truth to `.secrets/.env.local`
- update `wxt.config.ts` to read `.secrets/.env.local` / `.secrets/.env`
- remove the tracked root `.env.local` introduced during the earlier local override step
- update setup and release docs for local configuration and future CI/CD handling
- validate with docs checks, tests, coverage, and fresh Chrome/Firefox development builds

## Non-Goals

- publishing to Chrome Web Store
- introducing a full CI workflow in this task
- rotating Firefox add-on identity
- implementing cloud-sync provider parity

## Repository Context

- `wxt.config.ts`
- `.secrets/.env.local`
- `.secrets/.env.example`
- `docs/setup/environment-and-config.md`
- `docs/setup/local-development.md`
- `docs/setup/local-smoke-secrets.md`
- `docs/operations/release-runbook.md`
- `docs/contributing/execution-plans/active/README.md`

## Constraints

- never commit the private key
- keep public docs free of actual secrets or secret-manager URLs
- preserve Chrome and Firefox development build success
- keep the local keypair path repo-relative and ignored by git

## Risks and Unknowns

- rotating the keypair changes the Chrome unpacked extension ID again
- any local OAuth configuration tied to the prior Chrome ID will need to be updated separately
- future CI may or may not need the private key directly depending on the release packaging path, but governance should preserve it regardless

## Documentation Impact

- update `docs/setup/environment-and-config.md`
- update `docs/setup/local-development.md`
- update `docs/setup/local-smoke-secrets.md`
- update `docs/operations/release-runbook.md`
- add this execution plan under `docs/contributing/execution-plans/active/`

## Testing and Coverage Impact

- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:all:development`

## Milestones

### Milestone 1 - Generate And Store The Keypair

Generate a new Chrome extension keypair, write the private key only under `.secrets/`, derive the public key, and store the public key in `.secrets/.env.local`.

### Milestone 2 - Align Config And Docs

Update config loading to read the `.secrets` env files, remove the tracked-root override, and document how local development and future CI/CD should source the public key and preserve the private key.

### Milestone 3 - Validate And Handoff

Run repository validation, produce fresh dual-browser development builds, and record the resulting stable Chrome ID for reload handoff.

## Verification

- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:all:development`

## Progress

- [x] Create the execution plan and update the active index
- [x] Generate and store the keypair under `.secrets/`
- [x] Update config loading and docs
- [x] Run validation and record the resulting Chrome ID

## Surprises and Discoveries

- Observation: `.secrets/.env.local` already exists as a machine-local ignored config file and is the natural home for the public manifest key once config loading supports it.
  Evidence: local repository `.secrets/` layout and `.secrets/.gitignore`
- Observation: The existing local `.secrets/.env.local` already contained machine-local credentials, so the safest cleanup path was to extend that file instead of introducing a second ignored secrets location.
  Evidence: local `.secrets/.env.local` usage and the updated `wxt.config.ts` search order

## Decision Log

- Decision: Source the Chrome manifest public key from `.secrets/.env.local` or CI env rather than keeping it hardcoded in tracked config.
  Rationale: This keeps identity governance explicit and aligned with future automation while preserving public-safety and avoiding hidden divergence between tracked fallback values and the retained private key.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Completed by generating a new Chrome extension keypair, storing the private key only under `.secrets/chrome-extension-key.pem`, sourcing the public key from `.secrets/.env.local`, and updating `wxt.config.ts` to read `.secrets/.env.local` / `.secrets/.env` before root env files. The temporary tracked-root `.env.local` override was removed.

Documentation was updated to make future CI/CD setup explicit:

- `docs/setup/environment-and-config.md`
- `docs/setup/local-development.md`
- `docs/setup/local-smoke-secrets.md`
- `docs/operations/release-runbook.md`

Recorded resulting Chrome development ID:

- `mpdhmhjljlenbjcmmibahdijejhnlbdj`

Validation outcomes:

- `pnpm test:targeted:plan` passed
- `pnpm docs:check` passed
- `pnpm test:google` passed
- `pnpm test:google:coverage` passed
- `pnpm build:all:development` passed for Chrome and Firefox; only the existing chunk-size warning remained
