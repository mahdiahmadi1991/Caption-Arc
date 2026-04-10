# Development Workflow

## Branch And Change Discipline

- implement behavior changes in small, reviewable commits
- keep code and docs aligned in the same change set
- avoid silent behavior changes without corresponding tests or plan updates
- run `pnpm docs:check` when markdown files are added, moved, or updated
- run `pnpm docs:check:business` when business-sensitive product behavior changes
- run `pnpm docs:check:behavior` when behavior-sensitive runtime/contract surfaces change
- keep `docs/api/*-behavior-contract.md` and `docs/quality/references/*traceability-matrix.md` synchronized with behavior changes
- for code changes, run `pnpm test:google` and `pnpm test:google:coverage`
- use `pnpm test:targeted:plan` to determine targeted runtime checks

## Planning Expectations

- non-trivial engineering work must start with an Execution Plan under `docs/contributing/execution-plans/active/`
- use `docs/contributing/execution-plans.md` as the planning standard
- move finished or superseded plans to `docs/contributing/execution-plans/completed/`
- keep historical product initiative material in `docs/archive/feature-plans/`
- avoid keeping implementation-critical decisions only in chat
- docs-only edits do not require an Execution Plan by default unless explicitly requested or covered by the plan standard as a non-trivial docs initiative

## Testing Expectations

- a task is not done until required tests and validation are complete
- follow [../quality/testing-quality-gate.md](../quality/testing-quality-gate.md)
- onboarding flow for new contributors and agent threads:
  - [../quality/testing-onboarding.md](../quality/testing-onboarding.md)

## Runtime-Sensitive Validation

For in-meeting runtime changes:

- use runtime reload and smoke workflows
- run provider-aware checks, not just one platform
- document validation mode and scope in PR summary

Detailed constraints live in [project-working-agreement.md](./project-working-agreement.md).
