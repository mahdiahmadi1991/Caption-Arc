# Chrome Extension ID Rotation

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Rotate the current Chrome unpacked extension identity to a new stable ID before first publication, so ongoing development and future browser-specific configuration can stop depending on the current local ID.

## Problem Statement

The repository currently does not pin an explicit Chrome manifest key in `wxt.config.ts`. The user has an existing Chrome extension ID in local use and wants it changed before the extension is ever published. Without an explicit manifest key, the project does not own a stable repo-defined Chrome development identity.

## Scope

- add an explicit Chrome manifest key source in `wxt.config.ts`
- rotate the effective Chrome development extension ID away from the current local value
- document the new config behavior in setup/config docs
- validate with tests and fresh Chrome/Firefox development builds

## Non-Goals

- changing any published Chrome Web Store item identity
- rotating Firefox add-on identity in the same task
- implementing cloud-sync provider parity as part of this task

## Repository Context

- `wxt.config.ts`
- `docs/setup/environment-and-config.md`
- `docs/setup/local-development.md`
- `docs/contributing/execution-plans/active/README.md`

## Constraints

- keep repo contents public-safe; no private key material may be committed
- use only a public manifest key value in config
- preserve Chrome and Firefox buildability
- note that Chrome will treat the rotated ID as a different local extension install

## Risks and Unknowns

- any local OAuth registrations or browser bookmarks tied to the old Chrome ID will stop matching once the new key is used
- if the user later publishes through Chrome Web Store, store-assigned identity may still need explicit follow-up handling depending on the release workflow

## Documentation Impact

- update `docs/setup/environment-and-config.md`
- update `docs/setup/local-development.md`
- add this execution plan under `docs/contributing/execution-plans/active/`

## Testing and Coverage Impact

- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:all:development`

## Milestones

### Milestone 1 - Pin A New Chrome Manifest Key

Add a public manifest key value to `wxt.config.ts`, with optional env override support, so Chrome development builds resolve to a new stable extension ID.

### Milestone 2 - Document And Validate

Document the new configuration behavior and run the required repository validation plus fresh Chrome/Firefox development builds.

## Verification

- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:all:development`

## Progress

- [x] Create the execution plan and update the active index
- [x] Pin the new Chrome manifest key in config
- [x] Update setup/config docs
- [x] Run validation and dual-browser development builds

## Surprises and Discoveries

- Observation: `wxt.config.ts` currently defines no `manifest.key`, so the repo is not explicitly pinning a Chrome development extension identity.
  Evidence: `wxt.config.ts`
- Observation: Rotating the manifest key changes only the Chrome identity path; Firefox builds remain unaffected by this change.
  Evidence: `wxt.config.ts`, successful `pnpm build:all:development`

## Decision Log

- Decision: Use a repo-committed public manifest key with optional env override support.
  Rationale: The public key is safe to commit, provides a stable default ID for development, and still allows intentional future rotation through local env config.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Completed by pinning a new default Chrome manifest public key in `wxt.config.ts` with optional `WXT_CHROME_EXTENSION_KEY` override support. This rotates the repo-defined Chrome development extension identity away from the user's previous local ID and keeps it stable across future unpacked Chrome builds unless intentionally overridden.

Documentation was updated in:

- `docs/setup/environment-and-config.md`
- `docs/setup/local-development.md`

Validation outcomes:

- `pnpm test:targeted:plan` passed
- `pnpm docs:check` passed
- `pnpm test:google` passed
- `pnpm test:google:coverage` passed
- `pnpm build:all:development` passed for Chrome and Firefox; only the existing chunk-size warning remained
