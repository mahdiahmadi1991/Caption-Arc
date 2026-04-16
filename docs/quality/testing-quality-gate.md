# Testing Quality Gate

This document defines the mandatory completion gate for feature work, bug fixes, and behavior changes.

## Non-Negotiable Rule

Work is not complete unless the required tests are added or updated and validation evidence is recorded.

Canonical runtime smoke convention for this repository:

- `Deterministic Live Smoke (DLS)`
- command shape: `pnpm chrome:smoke:live <provider> <scenario>`

Mandatory owner checkpoint for DLS completion:

1. run the DLS command in a visible session
2. repository owner watches the run result and behavior
3. repository owner gives explicit approval in the same thread
4. without explicit owner approval, DLS status is `pending-owner-review` and the task is not done

Test authoring must follow:

- [test-writing-standards.md](./test-writing-standards.md)

For code changes, this includes both:

- passing automated tests
- a coverage run with results captured in the implementation summary

Repository enforcement:

- local: run required commands before completion
- CI: `Quality Gates` workflow re-runs test and coverage checks on push/PR

## Required Commands By Change Type

### Code Changes In Runtime, Background, Provider, Overlay, Or Shared Logic

Run:

```bash
pnpm test:google
pnpm test:google:coverage
pnpm test:targeted:plan
pnpm docs:check:behavior
```

Then execute the targeted commands recommended by `pnpm test:targeted:plan`.

For module-scoped requests, use module-scoped planner/runner instead of broad regression:

```bash
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
```

### Runtime-Sensitive Browser Behavior Changes

Run runtime validation using the CDP flow:

```bash
pnpm chrome:debug:reload
pnpm chrome:debug:ensure
pnpm chrome:smoke:live <provider> <scenario>
```

If shared behavior is affected, run:

```bash
pnpm chrome:smoke:live:matrix
```

Do not run matrix for module-scoped requests unless cross-provider risk is proven or explicitly requested.

Deterministic execution policy:

- keep `DETERMINISTIC_TEST_MODE=1` for default smoke execution
- avoid multi-fallback runtime chains for acceptance runs
- if deterministic mode is disabled for diagnosis, restore it before final acceptance evidence
- every DLS run must audit CaptionArc errors in `chrome://extensions` before and after the scenario
- clear observed extension errors after reading them so stale entries do not contaminate the next run
- treat newly introduced post-run extension errors as blocking until classified and fixed or explicitly owner-approved as environment noise

### Documentation-Only Changes

Run:

```bash
pnpm docs:check
```

If docs-only change updates behavior contracts or business docs, also run:

```bash
pnpm docs:check:behavior
pnpm docs:check:business
```

## Coverage Policy

Current repository coverage is legacy and still expanding. Until broader suite expansion is complete:

- do not treat low global historical coverage as permission to skip tests
- every changed behavior path must have direct or updated test coverage
- every bug fix must include a regression test when technically feasible
- do not reduce confidence in directly touched modules

Minimum expectation for changed logic:

- validate at least one successful path
- validate at least one failure or guard path
- validate contract edge cases where behavior changed

## Completion Evidence Format

Each implementation summary must include:

1. commands executed
2. pass/fail result for each command
3. explicit note that `pnpm test:google:coverage` was run for code changes
4. explanation of any deferred test work and approval status
5. scenario coverage statement for touched modules (which implemented scenarios were run)
6. explicit owner approval note for each DLS acceptance run

## Deferral Rules

Test deferral is exceptional and requires explicit repository-owner approval.

If a deferral is approved, record all of the following:

- exact test gap
- risk created by the gap
- follow-up plan location (Execution Plan path)
- owner-approved status

Without explicit approval, missing tests mean the task is not done.

## Definition Of Done (Testing)

For runtime-sensitive module work, done means:

1. required contract tests pass
2. required smoke scenarios for the touched module pass in the same thread
3. aggregate pass state is green for all executed commands
4. evidence is recorded with exact commands and outcomes
5. runtime-sensitive acceptance evidence uses DLS (`chrome:smoke:live*`) unless an explicit diagnostic exception is recorded
6. each DLS acceptance run includes explicit repository-owner visual approval in the same thread
7. each DLS acceptance run records the pre-run and post-run `chrome://extensions` error audit result and whether entries were cleared
