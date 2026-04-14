# Add Archive Retention Off Mode

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Extend the configurable meeting-archive retention setting with an explicit `Off` mode that disables every automatic archive-deletion path, then sync the behavior across runtime enforcement, settings UI, localization, tests, and user-facing legal/privacy documentation.

## Problem Statement

The current archive-retention setting only exposes bounded age windows (`30`, `90`, `180`, `365`). Internal count and storage-pressure pruning remain active by design. The requested product behavior is stricter: when the user selects `Off`, the extension must not automatically delete archive sessions for age, count, or storage-pressure reasons. Existing docs and policy copy currently describe retention guardrails without this exception.

## Scope

- Add `Off` as a canonical `meetingArchiveRetentionDays` option.
- Treat `Off` as a full automatic-pruning disable switch across all retention enforcement paths.
- Update the Settings UI and localization for the new option.
- Update settings/data-transfer/cloud-sync normalization so `Off` persists and round-trips cleanly.
- Update privacy/legal/behavior/storage docs to describe the new behavior accurately.
- Add targeted automated coverage for the disabled-retention behavior and updated normalization.

## Non-Goals

- Adding more retention controls beyond the simple `Off` plus bounded day options.
- Changing manual deletion behavior.
- Reworking broader archive UX outside the existing setting.

## Repository Context

- Shared retention config: `entrypoints/shared/meeting-archive-retention.ts`
- Settings model/defaults/normalization: `entrypoints/background/types/index.ts`, `entrypoints/shared/settings-defaults.ts`, `entrypoints/background/settings.ts`
- History retention enforcement: `entrypoints/background/history-db.ts`, `entrypoints/background/history.ts`
- Import/export and cloud sync: `entrypoints/background/data-transfer.ts`, `entrypoints/background/cloud-sync/serialization.ts`, `entrypoints/background/cloud-sync/index.ts`
- Settings UI/localization: `entrypoints/options/App.tsx`, `entrypoints/options/components/constants.ts`, `entrypoints/shared/i18n/messages/*.ts`
- Docs/policy/contracts: `docs/api/*.md`, `docs/architecture/storage-and-state.md`, `docs/security/privacy-policy.md`, `docs/security/legal-and-compliance-remediation-assessment.md`
- Tests: `tests/google-meet/meeting-history-retention.contract.test.ts`, `tests/google-meet/settings-and-readiness.contract.test.ts`, `tests/google-meet/data-transfer.contract.test.ts`

## Constraints

- `Off` must disable all automatic deletion, not just age-based pruning.
- The setting value must remain centralized in shared config, not hardcoded in the UI.
- Backward compatibility for stored settings, data bundles, and cloud-sync payloads must remain intact.
- Localization must be updated for every shipped UI locale.
- Behavior-sensitive docs and privacy/legal text must be synced in the same change.
- Fresh Chrome and Firefox development builds are required before handoff.

## Risks and Unknowns

- If `Off` only skips age-pruning while count/pressure pruning still run, the user-visible contract becomes false.
- Policy text that still mentions unconditional storage-pressure trimming would conflict with implementation.
- Tests added for the previous retention feature may silently encode the old semantics and need adjustment.

## Documentation Impact

- Update `docs/api/settings-and-readiness-behavior-contract.md`
- Update `docs/api/storage-schema.md`
- Update `docs/api/data-transfer-behavior-contract.md`
- Update `docs/api/cloud-sync-behavior-contract.md`
- Update `docs/architecture/storage-and-state.md`
- Update `docs/security/privacy-policy.md`
- Update `docs/security/legal-and-compliance-remediation-assessment.md`
- Update traceability references as needed

## Testing and Coverage Impact

- Add/update settings normalization coverage for `meetingArchiveRetentionDays = 0`
- Add/update data-transfer coverage for portable `Off`
- Add/update retention orchestration coverage proving `Off` causes no automatic delete propagation
- Run `pnpm test:targeted:plan` and the relevant targeted commands
- Run `pnpm docs:check`
- Run `pnpm docs:check:behavior`
- Run `pnpm test:google`
- Run `pnpm test:google:coverage`
- Build fresh Chrome and Firefox development bundles

## Milestones

### Milestone 1 - Canonicalize Off in shared settings

Allow `0` as the canonical stored value for archive retention and expose it through settings/defaults/serialization/UI constants.

### Milestone 2 - Disable all automatic pruning in Off mode

Short-circuit retention enforcement before age/count/storage-pressure deletion logic can run, while keeping manual deletion flows unchanged.

### Milestone 3 - Sync docs and contracts

Update behavior, storage, privacy, and legal docs so they describe the `Off` semantics accurately and do not overstate automatic pruning.

### Milestone 4 - Verify and close

Run tests/docs checks/builds, record results, and move the plan to `completed/` when done.

## Progress

- [x] Register the plan and inspect impacted code/docs.
- [x] Implement `Off` semantics in shared config, settings plumbing, runtime enforcement, and UI/localization.
- [x] Sync docs/contracts/privacy/legal text.
- [x] Add/update tests and run verification.

## Surprises and Discoveries

- Observation: proving the `Off` behavior only at the history orchestration layer was not sufficient, because a mockable `history.ts` contract would not prove that `history-db.ts` really short-circuits before touching IndexedDB or storage-pressure logic.
  Evidence: `tests/google-meet/history-db-retention-off.contract.test.ts`

## Decision Log

- Decision: represent `Off` as the canonical numeric value `0` in the shared retention setting.
  Rationale: this keeps the existing setting model stable while making the disabled state easy to normalize, serialize, and compare.
  Date/Author: 2026-04-14 / Codex
- Decision: short-circuit `enforceMeetingHistoryRetentionPolicy(...)` immediately when the normalized value is `0`.
  Rationale: the user requirement is stricter than disabling age-based pruning; count-based and storage-pressure pruning must also stop in `Off` mode.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Added `Off` as the canonical archive-retention option and stored value `0`, updated the settings UI/localization to expose it, and changed retention enforcement so `Off` disables all automatic archive deletion rather than only age-based pruning. This keeps manual deletion unchanged while preventing age, count, and storage-pressure pruning from running when the user explicitly disables retention cleanup.

Docs/contracts/privacy/legal text now describe the `Off` behavior consistently, including the fact that no automatic archive deletion occurs in that mode. Targeted tests, full Google Meet tests with coverage, documentation validation, business-doc validation, behavior-contract validation, and fresh Chrome/Firefox development builds all completed successfully.

## Verification

- `pnpm test:targeted:plan` -> completed
- `pnpm vitest run tests/google-meet/settings-and-readiness.contract.test.ts tests/google-meet/data-transfer.contract.test.ts tests/google-meet/meeting-history-retention.contract.test.ts tests/google-meet/history-db-retention-off.contract.test.ts tests/google-meet/ui-i18n.contract.test.ts tests/google-meet/i18n-runtime.contract.test.ts tests/google-meet/diagnostics-i18n-boundary.contract.test.ts` -> passed
- `pnpm docs:check` -> passed
- `pnpm docs:check:behavior` -> passed
- `pnpm docs:check:business` -> passed
- `pnpm test:google` -> passed (`48/48` files, `253/253` tests)
- `pnpm test:google:coverage` -> passed (`48/48` files, `253/253` tests)
- `pnpm build:chrome:development` -> passed
- `pnpm build:firefox:development` -> passed
