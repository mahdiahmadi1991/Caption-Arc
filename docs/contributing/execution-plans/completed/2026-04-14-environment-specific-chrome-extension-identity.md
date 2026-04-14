# Environment-Specific Chrome Extension Identity

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Separate Chrome extension identity between `development` and `production` build modes so local development artifacts and future release artifacts do not share the same manifest key, extension ID, or private-key retention path.

## Problem Statement

The current key-management implementation supports stable Chrome identity, but it uses one manifest public key source for all build modes. Since this repository explicitly has both `development` and `production` environments, sharing one Chrome identity across both modes creates avoidable coupling:

- development and production Chrome artifacts resolve to the same extension ID
- OAuth and extension-ID-bound config cannot be managed independently by environment
- future CI/CD would have to infer whether the same key should be reused in both lanes

## Scope

- make Chrome manifest key loading mode-aware in `wxt.config.ts`
- support separate public key env vars for development and production
- generate and retain distinct local private keys for development and production under `.secrets/`
- document local and CI/CD expectations for both envs
- validate both development and production browser builds

## Non-Goals

- publishing to Chrome Web Store
- changing Firefox identity in this task
- implementing per-branch or preview-environment identity beyond the existing two-mode model

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

- do not commit private keys
- preserve current local secrets workflow under `.secrets/`
- keep Chrome and Firefox builds green in both development and production modes
- keep env naming explicit enough for CI/CD to mirror locally

## Risks and Unknowns

- rotating the development key again changes the unpacked Chrome dev ID once more
- production builds will now have a different Chrome ID than development, which is desired but must be documented clearly
- any local OAuth config tied to the current development ID may need reconfiguration

## Documentation Impact

- update `docs/setup/environment-and-config.md`
- update `docs/setup/local-development.md`
- update `docs/setup/local-smoke-secrets.md`
- update `docs/operations/release-runbook.md`
- update `.secrets/.env.example`

## Testing and Coverage Impact

- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:all:development`
- `pnpm build:all:production`

## Milestones

### Milestone 1 - Add Mode-Aware Key Resolution

Teach `wxt.config.ts` to resolve `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT` for development builds and `WXT_CHROME_EXTENSION_KEY_PRODUCTION` for production builds, with a generic fallback only for explicit migration compatibility if still needed.

### Milestone 2 - Separate Local Key Material

Store distinct private keys under `.secrets/` for development and production and set the corresponding public keys in `.secrets/.env.local`.

### Milestone 3 - Update Docs And Validate

Document the environment-specific model for contributors and future CI/CD, then validate development and production builds plus the standard repository test gates.

## Verification

- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:all:development`
- `pnpm build:all:production`

## Progress

- [x] Create the execution plan and update the active index
- [x] Implement mode-aware Chrome key loading
- [x] Generate separate dev/prod key material and wire local env
- [x] Update docs and validate both modes

## Surprises and Discoveries

- Observation: The repository already models output by `{{mode}}`, so environment-specific Chrome identity is aligned with the existing build layout rather than being a new concept.
  Evidence: `wxt.config.ts` output templates and package scripts
- Observation: Chrome development and production manifests now resolve to different unpacked IDs with the same config path and build tooling.
  Evidence: `.release/chrome/development/manifest.json` -> `mpdhmhjljlenbjcmmibahdijejhnlbdj`; `.release/chrome/production/manifest.json` -> `cfoeocmhbfljdgnemcbjiblfmhjkmgbe`

## Decision Log

- Decision: Development and production Chrome builds should use separate extension identities by default.
  Rationale: This prevents accidental environment coupling and gives future CI/CD a clear, deterministic contract for identity and OAuth registration management.
  Date/Author: 2026-04-14 / Codex
- Decision: Keep `WXT_CHROME_EXTENSION_KEY` only as a migration fallback, not as the primary contract.
  Rationale: This preserves short-term compatibility while making the two-environment model explicit in both local development and CI/CD.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Implemented:

- `wxt.config.ts` now resolves Chrome manifest keys by build mode, preferring `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT` for development and `WXT_CHROME_EXTENSION_KEY_PRODUCTION` for production, with `WXT_CHROME_EXTENSION_KEY` retained only as a fallback.
- Local key retention is separated under `.secrets/` with distinct development and production private-key files.
- Contributor and release docs now describe the two-environment identity model and the expected CI/CD secret layout.

Validation evidence:

- `pnpm docs:check`
- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:all:development`
- `pnpm build:all:production`
