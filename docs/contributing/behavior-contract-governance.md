# Behavior Contract Governance

This document defines the mandatory standard for code-derived behavior contracts that act as test source of truth.

## Purpose

Behavior contracts exist to keep these three surfaces synchronized:

- implementation behavior in code
- expected behavior in documentation
- validation behavior in tests

## Canonical Behavior Contract Set

Canonical behavior contracts live in `docs/api/`:

- `provider-routing-behavior-contract.md`
- `google-meet-behavior-contract.md`
- `microsoft-teams-behavior-contract.md`
- `zoom-web-behavior-contract.md`
- `runtime-lifecycle-behavior-contract.md`
- `runtime-prompts-behavior-contract.md`
- `runtime-session-continuation-behavior-contract.md`
- `meeting-session-model-behavior-contract.md`
- `event-ingestion-behavior-contract.md`
- `overlay-behavior-contract.md`
- `assistant-runtime-behavior-contract.md`
- `meeting-summary-pipeline-behavior-contract.md`
- `translation-pipeline-behavior-contract.md`
- `cloud-sync-behavior-contract.md`
- `diagnostics-behavior-contract.md`
- `settings-and-readiness-behavior-contract.md`
- `data-transfer-behavior-contract.md`
- `browser-capabilities-behavior-contract.md`

Canonical test traceability artifacts live in `docs/quality/references/`:

- `provider-routing-traceability-matrix.md`
- `google-meet-automation-traceability-matrix.md`
- `microsoft-teams-traceability-matrix.md`
- `zoom-web-traceability-matrix.md`
- `runtime-lifecycle-traceability-matrix.md`
- `runtime-prompts-traceability-matrix.md`
- `runtime-session-continuation-traceability-matrix.md`
- `meeting-session-model-traceability-matrix.md`
- `event-ingestion-traceability-matrix.md`
- `overlay-traceability-matrix.md`
- `assistant-runtime-traceability-matrix.md`
- `meeting-summary-pipeline-traceability-matrix.md`
- `translation-pipeline-traceability-matrix.md`
- `cloud-sync-traceability-matrix.md`
- `diagnostics-traceability-matrix.md`
- `settings-and-readiness-traceability-matrix.md`
- `data-transfer-traceability-matrix.md`
- `browser-capabilities-traceability-matrix.md`

Use one canonical contract per behavior area. Avoid duplicate contract statements across multiple docs.

## Mandatory Writing Method

All behavior-contract updates must follow this method.

1. Derive behavior from repository code only.
2. List exact source files and exported functions used as evidence.
3. Write rule IDs in stable form: `C-<DOMAIN>-<NNN>`.
4. Express each rule as deterministic conditions and outcomes, not intent language.
5. Include guard/failure branches when they are behaviorally meaningful.
6. Link each rule to at least one traceability case in the matching matrix.
7. Mark case status as `implemented` or `planned` explicitly.

Use `docs/templates/behavior-contract-template.md` for all new contract documents.

## When Updates Are Mandatory

Update behavior contracts and traceability matrices in the same change when work affects:

- provider detection, page-context eligibility, or presence classification
- runtime lifecycle transitions, startup prompts, continuation/rejoin logic, or reset guards
- session-resolution semantics (`reusePolicy`, `resumeSessionId`, continuation window handling)
- quick-access runtime status semantics or prioritization
- message-level behavior that changes externally observable runtime outcomes

## Required Sync Protocol

1. Update the affected `docs/api/*-behavior-contract.md` document.
2. Update the matching `docs/quality/references/*traceability-matrix.md` entries.
3. Add or update tests for changed contract behavior where feasible.
4. Run:
   - `pnpm docs:check`
   - `pnpm docs:check:behavior`
   - `pnpm test:google` and `pnpm test:google:coverage` for code changes
5. Record contract/test impact in implementation summary and plan-required work artifacts.

For any traceability case validated with DLS (`chrome:smoke:live*`) as acceptance evidence:

6. Run the DLS scenario in a visible session for repository-owner review.
7. Record explicit repository-owner approval in-thread before marking the case complete.

## Enforcement

Behavior-contract sync is enforced by:

- `scripts/docs/validate-behavior-contract-sync.mjs`
- `pnpm docs:check:behavior`
- unified `CI` workflow `docs-check` job

## Deferral Rule

Deferring behavior-contract sync for plan-required code/behavior work requires repository-owner approval and explicit follow-up scope recorded in an active Execution Plan.
