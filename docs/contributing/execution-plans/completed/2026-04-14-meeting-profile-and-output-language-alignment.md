# Meeting Profile And Output Language Alignment

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Align the seeded OpenAI model catalog, translation seed prompt, seeded built-in profile prompts, and core settings/domain names with the current product behavior so the codebase, storage contracts, tests, and docs use business-accurate language.

Done looks like this:

- the selectable OpenAI model list reflects current official OpenAI API model IDs
- the seeded translation prompt is more robust for imperfect browser captions
- built-in meeting-type profiles have stronger prompts and assistant defaults
- `meetingOutputLanguage` and `meetingProfiles` are replaced by names that match current behavior
- existing stored data, cloud-sync payloads, and backup imports continue to load correctly
- tests and docs are updated in the same change

## Problem Statement

The current naming and seed data reflect earlier product assumptions:

- the model catalog includes stale or non-aligned model IDs for public OpenAI API usage
- the default translation prompt is too basic for noisy provider captions
- built-in profile prompts are useful but under-specified for the current product direction
- `meetingOutputLanguage` now drives both summary output and assistant output, so the name is too narrow
- `meetingProfiles` now represent reusable meeting-type behavior across identity, summary, and assistant surfaces, so the name is too narrow

This drift increases maintenance cost and makes code, storage, and docs harder to reason about.

## Scope

- update the OpenAI model list from official OpenAI sources
- improve the seeded translation prompt for noisy browser-captured caption input
- improve built-in meeting profile prompts and seeded assistant configs
- rename settings/domain fields from summary-centric names to business-aligned names
- provide backward-compatible normalization for existing local settings, import/export payloads, and cloud-sync payloads
- update affected docs, behavior contracts, and tests

## Non-Goals

- changing provider runtime behavior unrelated to naming or seeded prompts
- redesigning the options page beyond the minimum updates required by the rename
- changing meeting-summary pipeline architecture
- changing existing saved session artifact schemas beyond field-name compatibility work required by the rename

## Repository Context

- settings defaults: `entrypoints/shared/settings-defaults.ts`
- meeting profile seed definitions: `entrypoints/shared/meeting-profiles.ts`
- settings types: `entrypoints/background/types/index.ts`
- settings normalization/persistence: `entrypoints/background/settings.ts`
- cloud sync serialization/merge: `entrypoints/background/cloud-sync/serialization.ts`, `entrypoints/background/cloud-sync/merge.ts`
- import/export serialization: `entrypoints/background/data-transfer.ts`
- summary generation pipeline: `entrypoints/shared/meeting-summary.ts`, `entrypoints/background/history.ts`
- assistant pipeline: `entrypoints/background/assistant.ts`, `entrypoints/content/assistant-service.ts`
- options UI and model list: `entrypoints/options/App.tsx`, `entrypoints/options/components/constants.ts`
- overlay and meeting history UI consumers: `entrypoints/content/overlay/*`, `entrypoints/meeting-history/*`, `entrypoints/popup/App.tsx`
- tests: `tests/google-meet/*`
- docs: `docs/api/storage-schema.md`, relevant behavior contracts, UI docs, and quality references

## Constraints

- OpenAI model updates must be based on official OpenAI documentation
- storage and sync compatibility must preserve existing user data
- localization changes must stay synchronized across all locale files
- Chrome and Firefox builds must still succeed after the rename
- use repository terminology that matches product behavior, not historical implementation names

## Risks and Unknowns

- broad rename scope can miss storage, sync, or test surfaces
- changing serialized field names can break existing archives or cloud payloads if compatibility is incomplete
- prompt updates can unintentionally increase latency or verbosity if not kept concise
- docs may encode old terms in behavior contracts and traceability references outside obvious UI docs

## Documentation Impact

- update `docs/api/storage-schema.md`
- update affected `docs/api/*behavior-contract.md` files that reference renamed fields
- update affected UI/setup docs that reference renamed settings or seeded profiles
- update active/completed execution plans only where they serve as current canonical guidance references

For behavior-sensitive changes include:

- affected `docs/api/*-behavior-contract.md` files
- affected `docs/quality/references/*traceability-matrix.md` files if current references use old names

## Testing and Coverage Impact

- update targeted tests that reference renamed settings/profile fields or old model IDs
- run targeted test planning before execution
- run at least the relevant Google Meet contract tests that exercise settings normalization, assistant runtime, summary generation, and cloud sync serialization
- run `pnpm docs:check`
- run `pnpm docs:check:behavior`
- run Chrome and Firefox development builds for UI verification readiness

## Milestones

### Milestone 1 - Lock the naming and seed-data target

Confirm the official OpenAI model catalog to expose, choose final business-aligned replacement names for the settings/domain model, and define compatibility expectations for stored settings, sync payloads, and bundle import/export.

Verification:

- official OpenAI source links captured in the implementation notes
- rename targets chosen before bulk edits begin

### Milestone 2 - Implement code and storage compatibility

Update the seed data, prompts, type names, storage/settings normalization, sync/import serialization, and all code consumers. Accept legacy stored field names while persisting the new ones.

Verification:

- TypeScript builds pass for Chrome and Firefox development builds
- targeted tests for settings, summary pipeline, and assistant runtime pass

### Milestone 3 - Align docs, locales, and tests

Update locale files, docs, behavior contracts, and tests so the new names and seed behavior are reflected consistently.

Verification:

- docs checks pass
- renamed tests pass without references to deprecated field names in active codepaths

## Verification

- `pnpm test:targeted:plan`
- relevant targeted test commands from the planner
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`
- `pnpm docs:check`
- `pnpm docs:check:behavior`

## Progress

- [x] Inspect current seed data, model list, and naming drift
- [x] Create active Execution Plan
- [x] Confirm official OpenAI model list and final replacement names
- [x] Implement code and compatibility updates
- [x] Update locales, tests, and docs
- [x] Run verification and record results

## Surprises and Discoveries

- Observation: `meetingOutputLanguage` already drives both summary generation and assistant output, not just summaries.
  Evidence: `entrypoints/background/history.ts`, `entrypoints/background/assistant.ts`
- Observation: UI copy already partially moved toward the broader concept by labeling the field as a default output language.
  Evidence: `entrypoints/options/App.tsx`

## Decision Log

- Decision: Treat this as a storage-compatible domain-alignment change instead of a UI-only rename.
  Rationale: The old names exist in settings persistence, cloud sync, import/export payloads, session metadata, tests, and docs.
  Date/Author: 2026-04-14 / Codex
- Decision: Keep backward-compatible aliases for legacy settings, cloud-sync payloads, import/export bundles, and session-level profile ids.
  Rationale: Existing local data and shared archives must continue to load even while the canonical model moves to the new business-aligned names.
  Date/Author: 2026-04-14 / Codex
- Decision: Treat UI locales and AI language catalogs as separate documentation surfaces.
  Rationale: The shipped UI locale set is smaller than the AI translation and meeting-output language catalog, and conflating them causes contributor and model drift.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Shipped outcome:

- OpenAI model selection was updated to the current official API-facing model set used by this repository.
- The default live-translation prompt was strengthened for noisy or imperfect browser captions while staying concise enough for low-latency use.
- Business-aligned naming replaced the older summary-centric settings and profile terms across code, docs, and tests.
- Backward-compatible normalization was preserved for legacy stored settings, cloud-sync payloads, and portable import/export data.
- Built-in meeting-profile prompts and seeded assistant defaults were tightened to better match current product behavior.
- Locale catalogs, behavior contracts, traceability references, and tests were synchronized with the new names.
- Fresh Chrome and Firefox development and production builds were produced during verification.

Verification completed:

- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm build:chrome:development`
- `pnpm build:firefox:development`
- `pnpm build:chrome:production`
- `pnpm build:firefox:production`
- `pnpm docs:check`
- `pnpm docs:check:behavior`

Follow-up note:

- current contributor-facing UI i18n docs must continue to distinguish the 12 shipped UI locales from the larger AI translation and meeting-output language catalog so future edits do not regress into `en`/`fa`-only assumptions.
