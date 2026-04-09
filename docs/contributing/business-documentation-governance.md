# Business Documentation Governance

This document defines how business-facing documentation stays aligned with code-backed product behavior.

This governance is for business-facing docs in `docs/product/`.
Behavior-contract governance for test-oriented system behavior documentation lives in `docs/contributing/behavior-contract-governance.md`.

## Purpose

Keep product/business documentation:

- code-derived
- current
- canonical
- reviewable

## Canonical Business Documentation Set

Primary product business docs live in `docs/product/`:

- `business-capability-map.md`
- `user-journeys-and-jtbd.md`
- `feature-availability-matrix.md`
- `provider-end-to-end-scenario-matrix.md`
- `data-boundary-and-trust-model.md`
- `assistant-and-summary-strategy.md`
- `quick-access-and-runtime-control.md`
- `session-continuation-and-rejoin.md`
- `business-kpi-framework.md`
- `business-non-goals-and-scope-boundaries.md`

## When Business Docs Must Be Updated

Update business docs in the same change when work affects:

- supported providers, capture scope, or page eligibility logic
- browser capability gating (especially Chrome vs Firefox differences)
- OpenAI dependency behavior or availability handling
- assistant trigger/behavior policy or summary strategy semantics
- cloud sync scope, continuity model, or recovery model
- user-facing product boundary or non-goal statements

## Required Update Protocol

1. Identify business-facing behavior impact from code diff.
2. Update one or more canonical docs under `docs/product/`.
3. If policy expectations changed, update this file and/or contributor standards.
4. Run:
   - `pnpm docs:check`
   - `pnpm docs:check:business`
5. Record business-doc impact in the execution plan for non-trivial code/behavior work that is plan-required.

## CI Enforcement

Business-sensitive code surfaces are validated by:

- `scripts/docs/validate-business-docs-sync.mjs`

The check fails when business-sensitive implementation files change without corresponding business-doc updates.

## Exception Handling

If business-doc updates must be deferred for a plan-required code/behavior task, repository owner approval is required and deferral must be explicitly recorded in an active Execution Plan with follow-up scope and owner.

## Ownership Rule

When two docs overlap, keep one canonical source and convert the other to a pointer/reference.
Do not maintain competing business descriptions for the same capability boundary.
