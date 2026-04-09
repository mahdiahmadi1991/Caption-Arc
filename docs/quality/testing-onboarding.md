# Testing Onboarding

This guide is for new contributors and agent threads that need a repeatable test workflow.

Canonical runtime smoke convention:

- `Deterministic Live Smoke (DLS)`
- `pnpm chrome:smoke:live <provider> <scenario>`
- use module-specific DLS aliases when they exist for the touched feature, for example:
  - `pnpm chrome:smoke:live:i18n <provider> <scenario>`

## Step 1: Understand The Runtime Surfaces

Primary implementation surfaces:

- content runtime and providers: `entrypoints/content/*`
- background orchestration: `entrypoints/background/*`
- shared models/helpers: `entrypoints/shared/*`

Primary test surfaces:

- contract tests: `tests/google-meet/*.contract.test.ts`
- runtime smoke scripts: `scripts/manual-smoke/*`

## Step 2: Run Baseline Test Commands

For code changes:

```bash
pnpm test:google
pnpm test:google:coverage
pnpm test:targeted:plan
pnpm docs:check:behavior
```

Then run the recommended targeted commands from `pnpm test:targeted:plan`.

For module-specific requests, prefer:

```bash
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
```

For thread-wide execution protocol (scenario selection, deterministic runtime mode, failure classification, reporting template), follow:

- [../setup/agent-testing-onboarding.md](../setup/agent-testing-onboarding.md)
- [./test-writing-standards.md](./test-writing-standards.md)

## Step 3: Add Or Update Tests Before Marking Done

When behavior changes:

- add or update contract tests under `tests/google-meet/`
- cover both positive and guard/error paths
- add regression tests for bug fixes
- follow naming/structure/determinism rules from `test-writing-standards.md`

Do not leave behavior changes untested.

## Step 4: Run Runtime Validation When Needed

If change touches runtime/provider/overlay lifecycle:

```bash
pnpm chrome:debug:reload
pnpm chrome:debug:ensure
pnpm chrome:smoke:live <provider> <scenario>
```

If the change specifically touches shared UI localization runtime behavior:

```bash
pnpm chrome:smoke:live:i18n <provider> <scenario>
```

Use cross-provider validation when shared logic is affected:

```bash
pnpm chrome:smoke:live:matrix
```

Do not run full matrix for module-scoped requests unless cross-provider impact is confirmed.

Detailed runtime onboarding:

- [references/agent-onboarding-cdp-runtime.md](./references/agent-onboarding-cdp-runtime.md)
- [../setup/wsl-windows-chrome-cdp-quickstart.md](../setup/wsl-windows-chrome-cdp-quickstart.md)

## Step 5: Record Evidence In The Implementation Summary

Required summary content:

1. commands executed
2. pass/fail status
3. coverage command execution result for code changes
4. unresolved test gaps (if any) with explicit owner approval

## CI Enforcement

`Quality Gates` and `Docs Guardrails` workflows re-run:

- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm test:google`
- `pnpm test:google:coverage`

## Quick Completion Checklist

- tests added or updated for changed behavior
- `pnpm test:google` passes
- `pnpm test:google:coverage` executed for code changes
- runtime smoke completed for runtime-sensitive changes
- all implemented smoke scenarios for touched modules executed in the same thread
- all executed tests pass (or explicit owner-approved deferral recorded)
- docs updated when behavior/contracts changed
