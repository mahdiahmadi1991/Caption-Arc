# Add Configurable Meeting Archive Retention

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Turn the current hardcoded meeting-history retention policy into a productized settings surface so users can choose a simple archive retention window, while keeping the underlying cleanup behavior coherent across local history, cloud sync, import/export, and documentation.

## Problem Statement

Meeting archive cleanup currently uses hardcoded values in the history database layer (`180` days, `250` archived sessions, `0.70/0.55` storage-pressure thresholds). The user cannot control the age window from Settings. The current implementation also has behavioral gaps: auto-pruned sessions do not propagate delete operations to cloud-sync providers, and at least one session mutation path (`translateSessionCaptions`) skips retention enforcement entirely.

## Scope

- Add a shared settings field for meeting archive retention days.
- Move archive-retention constants and normalization into a shared configuration module instead of leaving them hardcoded in the IndexedDB layer.
- Update history retention enforcement to consume the configured age window.
- Fix delete propagation so auto-pruned sessions also enqueue cloud-sync delete work and clear assistant runtime state.
- Ensure all relevant session mutation paths use the same retention enforcement helper.
- Add a simple localized control in the Settings UI under Meeting archive.
- Update storage/settings/docs/contracts/traceability references.
- Add or update targeted automated tests for the new setting and the fixed retention behavior.

## Non-Goals

- Changing the maximum archived-session count or storage-pressure policy in the UI.
- Adding per-provider or per-profile retention rules.
- Adding background alarms or periodic retention jobs beyond the existing lazy enforcement model.
- Redesigning the broader meeting archive UX beyond the new simple control.

## Repository Context

- Retention enforcement: `entrypoints/background/history-db.ts`
- Session lifecycle hooks: `entrypoints/background/history.ts`
- Shared settings model: `entrypoints/background/types/index.ts`
- Settings defaults/normalization: `entrypoints/shared/settings-defaults.ts`, `entrypoints/background/settings.ts`
- Cloud sync orchestration + payloads: `entrypoints/background/cloud-sync/index.ts`, `entrypoints/background/cloud-sync/serialization.ts`, `entrypoints/background/cloud-sync/merge.ts`
- Import/export settings portability: `entrypoints/background/data-transfer.ts`
- Settings UI: `entrypoints/options/App.tsx`, `entrypoints/options/components/constants.ts`, `entrypoints/options/use-settings.ts`
- Localization catalogs: `entrypoints/shared/i18n/messages/*.ts`
- Behavior/docs surfaces: `docs/api/settings-and-readiness-behavior-contract.md`, `docs/api/storage-schema.md`, `docs/architecture/storage-and-state.md`, `docs/architecture/overview.md`, `docs/security/privacy-policy.md`, `docs/quality/references/settings-and-readiness-traceability-matrix.md`, `docs/quality/references/meeting-session-model-traceability-matrix.md`
- Relevant tests: `tests/google-meet/settings-and-readiness.contract.test.ts`, `tests/google-meet/data-transfer.contract.test.ts`, `tests/google-meet/cloud-sync-orchestration.contract.test.ts`, plus a new targeted retention contract if needed.

## Constraints

- Keep backward compatibility for stored settings, portable exports, and cloud-sync payloads.
- Do not hardcode option values inside the UI layer.
- Keep retention semantics clear: user-configurable age window, but count/pressure guardrails remain internal.
- UI copy must be localized for all shipped UI locales.
- Behavior-sensitive documentation and traceability must be updated in the same change.
- Chrome and Firefox settings UI must both remain buildable from fresh development builds.

## Risks and Unknowns

- A misleading setting label could imply that all cleanup is disabled even though count/pressure guardrails still exist.
- Cloud-sync delete propagation for auto-pruned sessions must not double-delete or break manual-delete behavior.
- Existing tests mock retention enforcement broadly; targeted coverage needs to prove the repaired orchestration path.

## Documentation Impact

- Update `docs/api/settings-and-readiness-behavior-contract.md`
- Update `docs/api/storage-schema.md`
- Update `docs/architecture/storage-and-state.md`
- Update `docs/architecture/overview.md`
- Update `docs/security/privacy-policy.md`
- Update `docs/quality/references/settings-and-readiness-traceability-matrix.md`
- Update `docs/quality/references/meeting-session-model-traceability-matrix.md`

## Testing and Coverage Impact

- Update settings normalization coverage for the new retention field.
- Update import/export/cloud-sync payload coverage for the new field.
- Add targeted coverage for auto-prune propagation and batch-translation retention enforcement.
- Run `pnpm test:targeted:plan` and execute the relevant recommended commands.
- Run `pnpm test:google`
- Run `pnpm test:google:coverage`
- Run `pnpm docs:check`
- Run `pnpm docs:check:behavior`
- Build fresh development bundles for Chrome and Firefox.

## Milestones

### Milestone 1 - Introduce canonical archive-retention settings model

Add the shared retention config module, wire the new settings field through defaults/normalization/serialization, and keep import-export plus cloud-sync payloads backward compatible.

### Milestone 2 - Repair retention enforcement behavior

Refactor history retention calls behind a shared helper that uses the configured retention days, propagates auto-pruned deletes to assistant/cloud-sync cleanup, and covers the missing mutation path.

### Milestone 3 - Expose and document the setting

Add the localized Meeting archive settings control, update behavior/storage/privacy documentation, and refresh traceability references.

### Milestone 4 - Validate and close

Add/update targeted tests, run verification commands, update this plan with outcomes, and move it to `completed/` once implementation is done.

## Verification

- `pnpm test:targeted:plan` -> completed
- `pnpm vitest run tests/google-meet/settings-and-readiness.contract.test.ts tests/google-meet/data-transfer.contract.test.ts tests/google-meet/cloud-sync-orchestration.contract.test.ts tests/google-meet/meeting-history-retention.contract.test.ts` -> passed
- `pnpm vitest run tests/google-meet/ui-i18n.contract.test.ts tests/google-meet/i18n-runtime.contract.test.ts tests/google-meet/diagnostics-i18n-boundary.contract.test.ts tests/google-meet/use-diagnostics-console.contract.test.ts tests/google-meet/google-meet-prompts.contract.test.ts` -> passed
- `pnpm docs:check` -> passed
- `pnpm docs:check:behavior` -> passed
- `pnpm test:google` -> passed (`47/47` files, `249/249` tests)
- `pnpm test:google:coverage` -> passed (`47/47` files, `249/249` tests)
- `pnpm build:chrome:development` -> passed
- `pnpm build:firefox:development` -> passed

## Progress

- [x] Inspect current retention logic, settings surfaces, and docs boundaries.
- [x] Add shared archive-retention config and settings plumbing.
- [x] Repair retention orchestration and auto-prune propagation.
- [x] Add localized settings UI and sync behavior/docs.
- [x] Run verification and record outcomes.

## Surprises and Discoveries

- Observation: auto-pruned sessions currently delete only from local IndexedDB because `enforceMeetingHistoryRetentionPolicy()` returns deleted ids but the history callers ignore them.
  Evidence: `entrypoints/background/history-db.ts`, `entrypoints/background/history.ts`
- Observation: `translateSessionCaptions()` updates stored sessions without running retention enforcement, unlike `translateSessionCaption()`.
  Evidence: `entrypoints/background/history.ts`
- Observation: a full `pnpm test:google` pass briefly surfaced a single diagnostics-collector failure, but the same test passed in isolation and the immediate full-suite rerun passed cleanly.
  Evidence: `tests/google-meet/diagnostics.collector.contract.test.ts`, `pnpm test:google`

## Decision Log

- Decision: keep only the age window user-configurable and leave count/storage-pressure guardrails internal.
  Rationale: this keeps the UI simple while still exposing the product-level behavior users actually care about.
  Date/Author: 2026-04-14 / Codex
- Decision: normalize the archive-retention setting to a bounded option set (`30`, `90`, `180`, `365`) instead of accepting arbitrary day counts.
  Rationale: the user asked for a simple settings control, and a fixed option set keeps UI copy, localization, docs, and persistence semantics aligned.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Shipped a shared `meetingArchiveRetentionDays` setting with default `180`, normalized option values, and a localized Settings control under Meeting archive. Moved retention constants into a shared configuration module, repaired retention orchestration so auto-pruned sessions clear assistant runtime state and enqueue cloud-sync deletions, and added the missing batch-translation retention enforcement path.

Docs/contracts/traceability were updated to describe the configurable archive-retention window and retention-driven cloud-delete behavior. Targeted tests, full Google Meet test coverage, docs validation, behavior-contract validation, and fresh Chrome/Firefox development builds all completed successfully.
