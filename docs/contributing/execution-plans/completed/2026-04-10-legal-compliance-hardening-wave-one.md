# Legal Compliance Hardening Wave One

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Harden CaptionArc's current public-release posture without overbuilding an enterprise legal program that the present architecture does not yet justify.

Done for this wave means:

- the legal/compliance assessment is more complete and pragmatically scoped
- higher-risk settings in the options page require one-time informed acknowledgment before activation and show persistent contextual warnings afterward
- `storeMeetingChat` defaults to `false`
- encrypted backup export no longer includes the OpenAI API key
- repository docs better reflect the staged legal/compliance plan
- code and docs remain validated against repository guardrails

## Problem Statement

CaptionArc currently has identifiable privacy and consent risks around legally sensitive settings and incomplete legal-hardening docs around release readiness.

The current repository also exports the OpenAI API key inside encrypted backups, which is inconsistent with the product's otherwise local-only secret posture.

Without a plan-first implementation, this work risks drifting across UX, storage, cloud-sync serialization, backup scope, tests, and docs.

## Scope

- extend `docs/security/legal-and-compliance-remediation-assessment.md` with missing business-relevant items and pragmatic staging guidance
- add a task plan for this wave and keep it current
- add one-time confirmation flow for higher-risk settings in the options page
- change the default value of `storeMeetingChat` to `false`
- persist legal-risk acknowledgments in settings state
- show persistent warning banners in the relevant settings section when a high-risk setting is active
- remove `openaiApiKey` from backup export/import scope
- update settings/recovery copy that currently describes backup contents inaccurately
- update and run relevant tests and documentation validation

## Non-Goals

- full enterprise DPA package
- final legal sign-off for provider terms, GDPR, CCPA, or browser-store compliance
- complete public legal document suite for every future business model
- redesign of unrelated settings sections
- changing cloud-sync provider scope beyond the minimum data-shape updates required by the acknowledgment/back-up changes

## Repository Context

- `docs/security/legal-and-compliance-remediation-assessment.md`
- `docs/security/README.md`
- `docs/contributing/execution-plans.md`
- `entrypoints/options/App.tsx`
- `entrypoints/options/use-settings.ts`
- `entrypoints/options/components/toggle.tsx`
- `entrypoints/meeting-history/components/confirm-dialog.tsx`
- `entrypoints/shared/i18n/messages/en.ts`
- `entrypoints/shared/settings-defaults.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/data-transfer.ts`
- `entrypoints/background/cloud-sync/serialization.ts`
- `tests/google-meet/settings-and-readiness.contract.test.ts`
- `tests/google-meet/data-transfer.contract.test.ts`

## Constraints

- follow plan-first governance before non-trivial implementation
- keep docs public-safe and aligned with code behavior
- preserve current settings-page design grammar and compact layout rules
- do not overstate legal conclusions that require counsel review
- avoid destructive migration behavior for existing settings
- keep acknowledgment storage backward-compatible for existing installs
- keep Chrome and Firefox builds supported unless intentionally browser-gated
- update both docs and tests in the same workstream

## Risks and Unknowns

- adding new settings fields affects storage normalization, sync serialization, and tests
- one-time acknowledgment flow can become noisy or awkward if the dialog content is too legalistic
- warning surfaces can bloat the settings UI if they do not fit current section grammar
- backup export shape changes may require careful import compatibility handling for older bundles
- localized message catalogs exist, but this wave will likely only update English copy unless broader i18n scope becomes necessary

## Documentation Impact

- update `docs/security/legal-and-compliance-remediation-assessment.md`
- update `docs/security/README.md` only if index alignment changes are needed
- record progress and decisions in this execution plan
- if public legal docs are added in this wave, link them from the relevant docs indexes and repository entry surfaces

Behavior-sensitive docs:

- no behavior-contract file is expected yet unless implementation touches an existing contract-governed surface that already has a canonical behavior doc

## Testing and Coverage Impact

- update backup/data-transfer contract coverage for API-key exclusion and compatibility expectations
- update settings/readiness coverage for new acknowledgment fields if needed
- update default-setting coverage for the new chat-storage baseline
- add or update options/UI contract coverage for one-time warning and persistent warning rendering if practical in current harness
- run `pnpm docs:check`
- run `pnpm test:targeted:plan`
- run relevant targeted tests from the planner output
- run `pnpm test:google`
- run `pnpm test:google:coverage`

Runtime smoke:

- this wave is settings-UI sensitive rather than in-meeting runtime sensitive, so no DLS provider smoke is expected unless implementation unexpectedly affects runtime behavior

Browser impact:

- Chrome and Firefox are both affected in settings UI and backup behavior
- no intentional browser gating is planned for this wave

## Milestones

### Milestone 1 - Harden The Legal Assessment Baseline

Extend the remediation assessment with pragmatic staging guidance, missing legal/business items, and a clearer distinction between immediate release work and later-stage enterprise work.

Verification:

- document remains code-derived and public-safe
- `pnpm docs:check` passes

Acceptance signals:

- assessment covers legal/privacy/store/provider/B2B/license dimensions without becoming boilerplate-heavy
- the document explicitly states what is not a wave-one blocker

### Milestone 2 - Add One-Time Legal-Risk Acknowledgments In Settings

Add a reusable one-time confirmation flow for legally sensitive settings and persistent warning blocks in the relevant settings sections.

Candidate settings for this wave:

- `captureStartupBehavior = always`
- `captionActivationBehavior = automatic`
- `storeMeetingChat = true`

Verification:

- options UI can gate activation behind a dialog
- acknowledgment persists and does not prompt on every subsequent change
- persistent warnings render only when the corresponding risky state is active

Acceptance signals:

- warnings are prominent but not alarmist
- UI copy is professional and user-encouraging while clearly communicating risk

### Milestone 3 - Remove API Keys From Backup Export Scope

Exclude `openaiApiKey` from exported backup bundles, keep restore behavior compatible, and align user-facing recovery copy with the new scope.

Verification:

- exported bundles omit `openaiApiKey`
- restore falls back cleanly to empty API-key state
- backup copy no longer claims the export contains everything when it does not

Acceptance signals:

- backup path aligns with the product's local-only secret posture
- tests reflect the new backup payload shape

### Milestone 4 - Validate And Close The Wave

Run repository validation and update this plan with actual outcomes, decisions, and any deferred follow-ups.

Verification:

- targeted tests pass
- full required test commands pass
- docs validation passes

Acceptance signals:

- plan reflects final implementation reality
- remaining legal follow-ups are explicit rather than implicit

## Verification

- `pnpm docs:check`
- `pnpm test:targeted:plan`
- targeted Vitest commands produced by the planner
- `pnpm test:google`
- `pnpm test:google:coverage`

Expected observations:

- docs validation stays green
- backup export tests confirm API-key exclusion
- settings/state tests confirm backward-compatible normalization
- options UI-related tests cover acknowledgment and warning behavior where harness support exists

## Progress

- [x] Review execution-plan standard, settings-page governance, and current options/settings implementation
- [x] Extend the legal/compliance assessment with pragmatic scoping and missing business-relevant items
- [x] Add acknowledgment state to settings models and storage normalization
- [x] Implement one-time warning dialogs and persistent risk warnings in the options UI
- [x] Change the `storeMeetingChat` default to `false`
- [x] Remove API key from backup export/import scope
- [x] Update tests and run validation

## Surprises and Discoveries

- Observation: Cloud sync already keeps API keys device-local, but backup export currently reintroduces secret portability.
  Evidence: `entrypoints/shared/i18n/messages/en.ts`, `entrypoints/background/data-transfer.ts`
- Observation: The options page already has a reusable confirmation dialog component that can be adapted for one-time legal-risk acknowledgments.
  Evidence: `entrypoints/meeting-history/components/confirm-dialog.tsx`, `entrypoints/options/App.tsx`
- Observation: Legally sensitive setting values are part of shared settings today, so acknowledgment persistence needs an explicit storage decision rather than an incidental one.
  Evidence: `entrypoints/background/types/index.ts`, `entrypoints/background/settings.ts`
- Observation: The repository's UI i18n contract blocks exact English carryover in shipped non-English locales, so wave-one legal warnings needed authored locale coverage instead of English placeholders.
  Evidence: `tests/google-meet/ui-i18n.contract.test.ts`, `entrypoints/shared/i18n/messages/*.ts`

## Decision Log

- Decision: Keep this wave scoped to pragmatic hardening rather than drafting a full enterprise legal package.
  Rationale: The current repository architecture is local-first and does not yet justify overbuilding enterprise legal machinery.
  Date/Author: 2026-04-10 / Codex
- Decision: Remove `openaiApiKey` from backup export scope in this wave.
  Rationale: The repository owner explicitly approved removing it, and it better aligns backup behavior with the product's local-only secret posture.
  Date/Author: 2026-04-10 / Codex
- Decision: Use one-time confirmations plus persistent contextual warnings for high-risk settings, while allowing an owner-requested exception for the `storeMeetingChat` default in this wave.
  Rationale: This preserves the existing approach for `captureStartupBehavior` and `captionActivationBehavior` while still applying the repository owner's privacy-by-default decision for meeting chat storage.
  Date/Author: 2026-04-10 / Codex
- Decision: Ship authored legal-risk warning copy across all supported UI locales in this wave.
  Rationale: The repository's i18n contract treats exact-English carryover in shipped locales as a release issue, and legal warnings should not degrade localization quality.
  Date/Author: 2026-04-10 / Codex
- Decision: Change `storeMeetingChat` to default `false` in this wave.
  Rationale: The repository owner explicitly requested the privacy-protective default, and it aligns with the remediation assessment's preferred stance.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

Completed.

Implemented outcomes:

- extended the legal/compliance remediation assessment with pragmatic scoping, staged obligations, OSS/API/provider review framing, and B2B/DPA calibration
- added an internal legal posture memo for current data flows and role mapping
- added persistent `legalRiskAcknowledgements` state to settings defaults, normalization, and cloud-sync serialization
- added one-time confirmation dialogs and persistent warning banners for `captureStartupBehavior = "always"`, `captionActivationBehavior = "automatic"`, and `storeMeetingChat = true`
- changed `storeMeetingChat` to default `false` so meeting chat is not retained unless the user explicitly enables it
- removed `openaiApiKey` from portable backup export scope and aligned recovery copy with the device-local secret posture
- drafted public-facing `Privacy Policy` and `Terms of Service` documents aligned to the current local-first architecture
- updated behavior-sensitive docs, storage schema docs, product capability docs, and contract/traceability references
- authored matching legal-risk UI copy for all shipped locales so the warning UX stays release-safe under the repository i18n contract

Validation completed:

- `pnpm docs:check`
- `pnpm docs:check:business`
- `pnpm docs:check:behavior`
- `pnpm test:targeted:plan`
- targeted Vitest coverage for prompts, diagnostics, i18n, settings, data transfer, and legal-risk helpers
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm chrome:smoke:live google-meet continuation`
- `pnpm build:all:development`

Follow-ups intentionally left out of this wave:

- enterprise-facing DPA package or broader contractual templates
