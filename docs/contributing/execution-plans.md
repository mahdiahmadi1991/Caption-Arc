# Execution Plans Standard

This document defines the repository standard for planning non-trivial engineering work.

Goal:

- force plan-first execution for meaningful changes
- keep implementation reviewable and verifiable
- reduce hidden scope drift and undocumented decisions

## Canonical Location

- planning policy: `docs/contributing/execution-plans.md` (this file)
- active task plans: `docs/contributing/execution-plans/active/`
- completed or superseded plans: `docs/contributing/execution-plans/completed/`

File naming rule for task plans:

- `YYYY-MM-DD-short-kebab-case-title.md`
- example: `2026-04-06-overlay-runtime-hardening.md`

## When A Plan Is Required

Create or update an Execution Plan before implementation for any non-trivial work, including:

- new feature work
- behavior changes
- non-local bug fixes
- refactors
- architecture changes
- dependency upgrades with behavioral risk
- manifest, permission, or browser API changes
- message-contract or storage-schema changes
- release/build/CI workflow changes
- security or privacy-sensitive changes
- multi-file changes
- tasks with uncertainty or trade-offs

If there is doubt, create a plan.

## When A Plan May Be Skipped

A plan may be skipped only for small, low-risk, local edits such as:

- typo-only text fixes
- formatting-only edits
- comment-only cleanup
- single-file mechanical rename without behavioral impact
- tiny local change with obvious outcome

## Non-Negotiable Requirements

Each Execution Plan must be:

1. Self-contained: understandable without chat history.
2. Living: updated during implementation.
3. Evidence-based: grounded in repository files/config/scripts/tests.
4. Verifiable: includes concrete validation steps.
5. Scoped: scope changes are explicitly recorded before implementation shifts.
6. Public-safe: no secrets, private URLs, or machine-local sensitive details.

Use placeholders like `<repo-root>`, `<local-path>`, `<browser-profile>`, `<extension-id>`, and `<api-base-url>` when needed.

## Mandatory Workflow

### Before Implementation

1. Inspect relevant repository context.
2. Identify affected code/docs/tests/config boundaries.
3. Create or update a plan under `docs/contributing/execution-plans/active/`.
4. Define scope, non-goals, risks, milestones, validation, and docs impact.
5. Start implementation only after the plan exists.

### During Implementation

1. Execute one milestone at a time.
2. Keep changes scoped and reviewable.
3. Run validation per milestone.
4. Update plan progress, decisions, discoveries, and scope changes continuously.
5. Update impacted docs in the same workstream.

### After Implementation

1. Ensure plan reflects final implementation reality.
2. Record validation outcomes and major decisions.
3. Record remaining follow-ups clearly.
4. Move finished plan from `active/` to `completed/`.

## Required Plan Structure

Use the canonical template:

- `docs/templates/execution-plan-template.md`

Required sections in each task plan:

- Purpose / Big Picture
- Problem Statement
- Scope
- Non-Goals
- Repository Context
- Constraints
- Risks and Unknowns
- Documentation Impact
- Testing and Coverage Impact
- Milestones
- Verification
- Progress
- Surprises and Discoveries
- Decision Log
- Outcomes and Retrospective

## Milestone Rules

Each milestone must:

- describe the resulting capability or state
- include clear verification
- remain incrementally useful
- avoid unrelated mixed scope
- mention required documentation updates where applicable

## Verification Expectations

Verification depth must match change risk. Use relevant checks such as:

- tests
- coverage run for code changes
- build/package checks
- runtime smoke checks
- docs consistency and link checks

Do not mark work complete without recorded verification notes.

For this repository, use at minimum:

- `pnpm test:google`
- `pnpm test:google:coverage` (code changes)
- `pnpm test:targeted:plan` and relevant targeted commands

Quality gate reference:

- `docs/quality/testing-quality-gate.md`

## Browser Extension Prompts

Plans for this repository should explicitly consider impacts on:

- manifest fields and permissions
- service worker/background lifecycle
- content script injection
- messaging and event flow
- storage and migration strategy
- browser compatibility
- store submission and privacy notes
- extension UI surfaces (overlay, popup, options, onboarding)
- telemetry/logging/data handling

For governed browser behavior, plans must also state:

- whether Chrome and Firefox are both affected or one browser is intentionally scoped
- any browser-sensitive API usage that requires capability checks or explicit browser gating
- the verification evidence expected for each browser, including Firefox manual verification when no canonical Firefox automation exists yet

## Anti-Patterns

Do not:

- start non-trivial work without a plan
- keep plans vague and non-verifiable
- skip validation notes
- leave plans stale while implementation evolves
- hide scope changes
- store plan files in ad hoc locations

## Completion Criteria

A task governed by a plan is complete only when:

- the plan exists in the canonical location
- the plan matches final implementation
- verification outcomes are recorded
- major decisions are logged
- related docs are updated
- unresolved follow-ups are explicit
