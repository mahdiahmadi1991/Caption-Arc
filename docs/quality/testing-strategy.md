# Testing Strategy

This repository uses a layered testing model:

1. deterministic contract tests in Vitest for code-level behavior
2. targeted runtime smoke validation for extension lifecycle and provider behavior
3. provider matrix validation for cross-provider risk

## Canonical Testing Policies

- quality gate (required for completion): [testing-quality-gate.md](./testing-quality-gate.md)
- assistant module playbook: [assistant-test-strategy.md](./assistant-test-strategy.md)
- onboarding flow: [testing-onboarding.md](./testing-onboarding.md)
- test authoring rules: [test-writing-standards.md](./test-writing-standards.md)
- runtime onboarding reference: [references/agent-onboarding-cdp-runtime.md](./references/agent-onboarding-cdp-runtime.md)
- behavior-contract governance: [../contributing/behavior-contract-governance.md](../contributing/behavior-contract-governance.md)

## Test Layers And Ownership

### Layer 1: Contract Tests (Vitest)

- location: `tests/google-meet/*.contract.test.ts`
- command: `pnpm test:google`
- command with coverage: `pnpm test:google:coverage`
- purpose:
  - validate provider contracts and runtime invariants
  - catch regressions in content/runtime logic before manual smoke

### Layer 2: Targeted Runtime Smoke

- command planner: `pnpm test:targeted:plan`
- command runner: `pnpm test:targeted:run`
- module planner: `pnpm test:module:plan <module-path>`
- module runner: `pnpm test:module:run <module-path>`
- smoke tooling location: `scripts/manual-smoke/*`
- canonical runtime smoke convention: `Deterministic Live Smoke (DLS)` via `pnpm chrome:smoke:live <provider> <scenario>`
- acceptance checkpoint: each DLS run must be visually reviewed and explicitly approved by the repository owner before it is counted as complete
- purpose:
  - validate browser extension behavior in live runtime context
  - validate startup prompts, provider detection, and overlay behavior

### Layer 3: Provider Matrix Validation

- commands:
  - `pnpm chrome:smoke:live google-meet <scenario>`
  - `pnpm chrome:smoke:live microsoft-teams <scenario>`
  - `pnpm chrome:smoke:live zoom-web <scenario>`
  - `pnpm chrome:smoke:live:matrix`
- purpose:
  - prevent shared runtime changes from silently breaking other providers
  - run only for cross-provider/shared-risk changes, not for routine module-scoped validation

## Change-Type Guidance

- if change touches contract logic in `entrypoints/content/providers/google-meet.ts` or overlay/state/runtime modules:
  - run `pnpm test:google`
  - run `pnpm test:google:coverage`
  - run targeted smoke from `pnpm test:targeted:plan`
  - run `pnpm docs:check:behavior`
- if change touches shared runtime/provider routing:
  - include provider matrix smoke
- if change touches only docs:
  - run `pnpm docs:check`

## Evidence Requirement

A change is not considered complete unless test evidence is recorded in the implementation summary:

- commands executed
- pass/fail outcomes
- coverage command execution result for code changes

CI enforcement:

- `.github/workflows/quality-gates.yml`
