# Test Writing Standards

This document defines the required rules for writing tests in this repository so all threads produce consistent, maintainable, and high-signal tests.

These standards are implementation-focused and intentionally avoid product/business prioritization.

## Scope

Applies to:

1. contract tests (`vitest`, `tests/google-meet/*.contract.test.ts`)
2. runtime smoke test scripts (`scripts/manual-smoke/*`)
3. any new test modules added in future threads

## Core Rules

1. Write tests for behavior, not implementation trivia.
2. Keep tests deterministic (same input => same result).
3. Prefer explicit setup over hidden global state.
4. Keep failure messages actionable.
5. Avoid flakiness before adding coverage breadth.

## Contract Test Design Rules

### 1) Naming

Use descriptive names that encode intent and expected result:

- `should <expected behavior> when <condition>`
- or `returns <result> for <input case>`

Avoid vague names like `works`, `test1`, `handles case`.

For behavior-contract-covered surfaces:

- prefix test names with stable case IDs from the traceability matrix (for example `GM-URL-001`, `RSC-PRM-001`)

### 2) Structure (Arrange / Act / Assert)

Each test should clearly separate:

1. arrange: inputs, mocks, preconditions
2. act: single operation under test
3. assert: exact expected output/state

### 3) One Logical Behavior Per Test

- a test can have multiple assertions, but they must validate the same behavior contract
- if assertions validate independent behaviors, split into separate tests

### 4) Positive + Guard Coverage

For changed behavior, include both:

1. at least one successful path
2. at least one guard/failure path

When relevant, include edge contracts (empty input, nullish input, invalid enum, timeout branch, etc.).

### 5) Stable Inputs

- avoid random values unless seed is fixed
- avoid wall-clock dependence; mock timers/time when time affects behavior
- avoid network and real external dependencies in contract tests

### 6) Isolation

- reset spies/mocks/state between tests
- do not let test order affect outcomes
- do not depend on side effects from previous tests

### 7) Assertions

- assert exact invariant/contract
- do not rely on weak assertions that can pass with wrong behavior
- when asserting objects, check critical fields explicitly

### 8) Contract Traceability

- when a behavior contract exists, map each changed/added test to a case in the relevant traceability matrix
- update matrix status (`planned`/`implemented`) in the same change as test updates
- do not leave behavior contract rules without explicit matrix status

## Runtime Smoke Test Rules

### 1) Deterministic Execution Mode (Default)

Use the repository default:

- `DETERMINISTIC_TEST_MODE=1`
- single runtime path
- no fallback hopping for acceptance runs

### 2) Scenario Completeness Per Touched Module

If a module has implemented smoke scenarios, run all relevant implemented scenarios for that module in the same thread before marking done.

### 3) Prompt Handling

- unresolved blocking prompts are failures
- diagnostic bypass can be used for investigation only, not acceptance evidence

### 4) Failure Classification

On repeated failure, classify as:

1. `environment`
2. `test-harness`
3. `product regression`

Always report classification with command + key error evidence.

### 5) Logging-Assisted Validation

- keep live diagnostics enabled during smoke by default
- use logs to validate runtime decisions, not just final UI state
- when runtime-sensitive code is changed, ensure logger coverage includes all levels (`trace/debug/info/warn/error`) or document rationale for intentionally missing levels

## Anti-Flake Guidelines

Do:

1. wait for explicit readiness signals
2. use deterministic selectors and stable contracts
3. keep retries bounded and intentional

Do not:

1. add arbitrary long sleeps as primary sync
2. rely on incidental UI timing
3. mask real failures with broad fallbacks in acceptance flow

## Review Checklist For New/Updated Tests

Before finalizing a thread:

1. test names clearly express behavior contract
2. tests are deterministic and order-independent
3. changed logic includes positive + guard coverage
4. assertions are strong enough to fail on wrong behavior
5. smoke scenarios for touched modules are complete
6. all executed test commands are green (or owner-approved deferral is documented)

## Minimal Template (Contract Test)

```ts
it("should <expected behavior> when <condition>", () => {
  // Arrange
  const input = ...

  // Act
  const result = target(input)

  // Assert
  expect(result).toEqual(...)
})
```

## Cross-References

- onboarding and execution protocol: [../setup/agent-testing-onboarding.md](../setup/agent-testing-onboarding.md)
- quality gate / completion policy: [./testing-quality-gate.md](./testing-quality-gate.md)
- layered strategy: [./testing-strategy.md](./testing-strategy.md)
