# Shared Legal Chrome And First-Run Terms

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Add a single, consistent legal-navigation layer across CaptionArc's extension pages and introduce a first-run Terms of Service acceptance flow that is explicit, versioned, and durable.

Done for this wave means:

- popup, settings, and meeting-history share a common GitHub header action and a common legal footer
- the shared footer exposes copyright, Privacy Policy access, and the current version
- Privacy Policy access is directly visible from the extension UI surfaces the repository owner requested
- a fresh install opens first-run setup and requires one-time acceptance of the current Terms version
- Terms acceptance is stored with both `acceptedAt` and `version`
- docs, tests, and governed browser builds are updated together

## Problem Statement

CaptionArc already has draft public legal docs, but extension-page access to those docs is still inconsistent and page-specific UI chrome is duplicated.

The product also lacks a universal, first-run Terms acceptance model. Without a versioned acceptance record, the current legal posture is weaker than it needs to be for a public-facing extension with evolving legal documents.

Because this work touches extension UI, install-time behavior, storage shape, i18n catalogs, and public docs, it needs a plan-first implementation to stay coherent.

## Scope

- create or update a plan for this wave and keep it current
- add shared legal/product metadata helpers for GitHub, Privacy Policy, Terms, version, and copyright
- implement a shared extension-page chrome layer that can be reused by popup, options, and meeting-history
- add a GitHub link to the header of all requested extension pages
- add a shared footer with copyright, Privacy Policy link, and version
- add first-run Terms acceptance state with `version` and `acceptedAt`
- persist Terms acceptance in settings storage with backward-compatible normalization
- open the options page on install for first-run setup
- show a first-run Terms confirmation modal in options until the current version is accepted
- expose Privacy Policy and Terms links inside the first-run acceptance surface
- update docs and tests for the new storage and onboarding behavior

## Non-Goals

- final publication-host migration away from repository-hosted legal docs
- account-backed acceptance tracking across multiple user identities or devices
- runtime capture gating outside the first-run settings flow
- a full onboarding wizard beyond the Terms acceptance requirement
- monetization or subscription-specific ToS clauses

## Repository Context

- `docs/contributing/execution-plans.md`
- `docs/contributing/execution-plans/active/README.md`
- `docs/security/privacy-policy.md`
- `docs/security/terms-of-service.md`
- `docs/security/legal-and-compliance-remediation-assessment.md`
- `docs/operations/store-listing.md`
- `docs/operations/store-submission.md`
- `entrypoints/background/index.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/shared/settings-defaults.ts`
- `entrypoints/shared/icons.tsx`
- `entrypoints/shared/i18n/messages/*.ts`
- `entrypoints/popup/App.tsx`
- `entrypoints/options/App.tsx`
- `entrypoints/options/use-settings.ts`
- `entrypoints/meeting-history/App.tsx`
- `entrypoints/meeting-history/components/confirm-dialog.tsx`
- `tests/google-meet/settings-and-readiness.contract.test.ts`
- `tests/google-meet/shared-ui-controls.contract.test.ts`

## Constraints

- follow plan-first governance before implementation
- keep docs public-safe and avoid non-public URLs or internal legal placeholders in shipped UI
- preserve the existing visual language of the extension pages instead of introducing a disconnected design system
- keep Terms acceptance storage backward-compatible for existing installs
- keep Chrome and Firefox behavior aligned unless browser-specific behavior is explicitly required
- ship authored i18n coverage for any new user-facing strings
- produce fresh Chrome and Firefox development builds before handoff

## Risks and Unknowns

- first-run flow depends on install-time browser behavior and options-page opening support
- storing Terms acceptance in shared settings versus local-only settings has product implications for sync/import behavior
- draft legal docs still include unresolved legal placeholders, so public URLs can be wired now while final legal metadata may still need owner input
- shared page chrome can accidentally regress page-specific spacing if it is not designed to fit three different layouts

## Documentation Impact

- update `docs/security/legal-and-compliance-remediation-assessment.md`
- update `docs/operations/store-listing.md`
- update `docs/operations/store-submission.md`
- update `docs/api/storage-schema.md`
- record implementation progress and decisions in this plan

Behavior-sensitive docs:

- update `docs/api/settings-and-readiness-behavior-contract.md` if storage/onboarding behavior changes require contract coverage
- update `docs/quality/references/settings-and-readiness-traceability-matrix.md` if new contract rules are added

## Testing and Coverage Impact

- update settings normalization/persistence tests for Terms acceptance storage
- add or update shared UI contract coverage for the shared legal chrome helper if practical
- run `pnpm test:targeted:plan`
- run the relevant targeted tests from the planner output
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm docs:check`
- run `pnpm docs:check:business`
- run `pnpm docs:check:behavior`
- run `pnpm build:all:development`

Runtime smoke:

- this wave changes install-time onboarding and extension-page UI, not in-meeting runtime capture, so DLS smoke is not expected unless implementation expands into runtime-sensitive behavior

Browser impact:

- Chrome and Firefox are both affected in popup/options/history UI and install-time setup behavior
- no intentional browser gating is planned
- fresh development builds for both governed browsers are required for handoff

## Milestones

### Milestone 1 - Establish Shared Legal Chrome

Create reusable metadata and UI helpers that let popup, settings, and meeting-history render a consistent GitHub header action plus a shared legal footer.

Verification:

- all three entrypoints consume the shared helpers
- the shared footer shows copyright, Privacy Policy access, and current version
- the popup quick-access surface also exposes the shared legal footer

Acceptance signals:

- page chrome is visually consistent without forcing identical layout structure
- privacy access is directly visible in the extension UI

### Milestone 2 - Add First-Run Terms Acceptance

Introduce versioned Terms acceptance storage, install-time options-page opening, and a first-run confirmation modal on the options page.

Verification:

- a fresh install path opens options
- the current Terms version is required once per install until accepted
- acceptance persists with `acceptedAt` and `version`

Acceptance signals:

- the modal is explicit and professional without feeling punitive
- Terms and Privacy links are available at the point of acceptance

### Milestone 3 - Update Docs, Tests, And Builds

Document the new legal-navigation/onboarding posture, update validation coverage, and produce fresh governed-browser builds.

Verification:

- docs checks pass
- targeted and full test commands pass
- development builds for Chrome and Firefox complete successfully

Acceptance signals:

- repository docs reflect the new release surface
- handoff is ready for browser reload verification without extra setup

## Verification

- `pnpm test:targeted:plan`
- targeted test commands produced by the planner
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:business`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`

Expected observations:

- settings tests confirm backward-compatible Terms normalization and persistence
- shared UI coverage confirms the legal chrome helper renders the requested links and version text where exercised
- docs validation stays green after new plan/doc links are added
- both governed browser development builds emit fresh artifacts under `.release/`

## Progress

- [x] Inspect current extension-page layouts, settings persistence shape, and install-time hooks
- [x] Create this execution plan before implementation
- [x] Implement shared legal chrome and metadata helpers
- [x] Implement first-run Terms acceptance state and onboarding flow
- [x] Update docs, tests, validation, and fresh development builds

## Surprises and Discoveries

- Observation: popup already has a footer, but options and meeting-history do not, so shared chrome can reduce duplication and legal-link drift immediately.
  Evidence: `entrypoints/popup/App.tsx`, `entrypoints/options/App.tsx`, `entrypoints/meeting-history/App.tsx`
- Observation: there is no existing `chrome.runtime.onInstalled` flow in the background entrypoint, so first-run setup currently has no canonical entry point.
  Evidence: `entrypoints/background/index.ts`
- Observation: current legal-risk acknowledgements live in shared settings, but a first-run Terms record is better treated as install-local state because the extension has no user-account identity layer.
  Evidence: `entrypoints/background/types/index.ts`, `entrypoints/background/settings.ts`
- Observation: the public Privacy Policy and Terms drafts exist, but their legal placeholders are not fully resolved, so the UI can link to repository-hosted docs now while final publication metadata still needs owner input.
  Evidence: `docs/security/privacy-policy.md`, `docs/security/terms-of-service.md`
- Observation: `lucide-react` does not export a GitHub logo component in this repository version, so the shared header link needed a local SVG icon instead of a library import.
  Evidence: `entrypoints/shared/icons.tsx`, local module inspection during implementation
- Observation: `pnpm test:google:coverage` timed out in prompt tests when it was run in parallel with the dual-browser development build, but passed when rerun alone.
  Evidence: coverage command output on 2026-04-10 before and after the sequential rerun

## Decision Log

- Decision: store Terms acceptance in local-device settings rather than shared sync/export state.
  Rationale: Terms acceptance is an install-level compliance event, and the current product has no account identity layer that would justify treating acceptance as shared user data.
  Date/Author: 2026-04-10 / Codex
- Decision: use repository-hosted public docs as the current fixed Privacy Policy and Terms URLs.
  Rationale: those documents already exist in the public repository, and this allows immediate product integration without inventing unpublished URLs.
  Date/Author: 2026-04-10 / Codex
- Decision: keep the first-run Terms gate on the options page and open that page on install, instead of adding a separate onboarding page.
  Rationale: this meets the owner-requested first-run acceptance model while minimizing surface-area drift and keeping future legal/settings changes in one governed UI.
  Date/Author: 2026-04-10 / Codex
- Decision: make the Terms acceptance modal non-dismissible until acceptance succeeds.
  Rationale: the repository owner asked for universal first-run acceptance, and a dismissible modal would weaken the posture while adding ambiguous partially-onboarded states.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

Implemented a shared legal chrome layer across popup, options, and meeting-history, added fixed Privacy Policy access in the shared footer plus a GitHub header link, and introduced a first-run Terms acceptance flow with local versioned acceptance storage.

Code changes also added install-time options-page opening, non-dismissible Terms confirmation on options until the current version is accepted, local-only settings normalization for `termsAcceptance`, and shared legal-link helpers reused by the first-run modal and the page chrome.

Validation completed:

- `pnpm test:targeted:plan`
- `pnpm vitest run tests/google-meet/settings-and-readiness.contract.test.ts`
- `pnpm vitest run tests/google-meet/data-transfer.contract.test.ts`
- `pnpm vitest run tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm vitest run tests/google-meet/ui-i18n.contract.test.ts`
- `pnpm vitest run tests/google-meet/google-meet-prompts.contract.test.ts tests/google-meet/use-diagnostics-console.contract.test.ts tests/google-meet/diagnostics-viewer.contract.test.ts tests/google-meet/i18n-runtime.contract.test.ts tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:business`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`
- `pnpm chrome:smoke:live google-meet continuation`

Remaining follow-up:

- replace repository-hosted legal document URLs with final canonical public URLs once the repository owner provides the final publication surface and placeholder values
