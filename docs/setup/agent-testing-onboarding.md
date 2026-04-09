# Agent Testing Onboarding Playbook

## Purpose

This document standardizes how agents choose and execute tests in any thread, so test behavior is consistent and reproducible across contributors.

It is intentionally implementation-oriented and does not prescribe product/business decisions.

Test authoring rules (naming, structure, determinism, anti-flake):

- [../quality/test-writing-standards.md](../quality/test-writing-standards.md)
- [../contributing/coding-conventions/development-logging-and-diagnostics.md](../contributing/coding-conventions/development-logging-and-diagnostics.md)

## Canonical Convention Name

Use this exact term in all threads:

- `Deterministic Live Smoke (DLS)`

Canonical command shape:

- `pnpm chrome:smoke:live <provider> <scenario>`
- module-specific DLS aliases may exist for higher-signal acceptance on a touched feature, for example:
  - `pnpm chrome:smoke:live:i18n <provider> <scenario>`

Examples:

- `pnpm chrome:smoke:live google-meet lobby`
- `pnpm chrome:smoke:live google-meet meeting`
- `pnpm chrome:smoke:live microsoft-teams meeting`

## Core Principles

1. Match test scope to change scope.
2. Prefer targeted runs before full matrix runs.
3. For module-specific requests, run module-scoped plan/run first.
4. Validate runtime prerequisites before smoke runs.
5. Treat unresolved blocking prompts as test failures (unless explicitly running a diagnostic bypass).
6. Always report exact commands and outcomes.
7. Use deterministic runtime mode as default (single-path execution, no fallback hopping).
8. Keep live diagnostics visible in the same smoke terminal for faster triage.
9. Record Firefox verification evidence for runtime-sensitive changes until Firefox runtime automation exists.

## Decision Model

### Step 1: Classify the Change

Choose all that apply:

- `logic/data only`: no runtime/UI path changed
- `UI/state`: rendering, overlay behavior, settings reactions, prompt flows
- `runtime/integration`: provider routing, content-script injection, extension runtime messaging
- `platform/tooling`: build, launch, CDP wiring, script orchestration

### Step 2: Select the Minimum Valid Test Set

1. For `logic/data only`:
- run contract tests first:
  - `pnpm test:module:run <module-path>` (module request)
  - `pnpm test` (fallback only when module mapping is unavailable)

2. For `UI/state`:
- run contract tests:
  - `pnpm test:module:run <module-path>`
- run focused settings smoke:
  - `pnpm chrome:smoke:live:google:settings meeting`

3. For `runtime/integration`:
- run contract tests:
  - `pnpm test:module:run <module-path>` (preferred for module-scoped requests)
  - `pnpm test` (only if no module-scoped mapping exists)
- run DLS smoke for impacted scenarios:
  - `pnpm chrome:smoke:live <provider> <scenario>`
- if the touched module has its own implemented DLS flow, run that specialized alias too

4. For `platform/tooling` or release-level confidence:
- run contract tests + focused smoke + full matrix:
  - `pnpm chrome:smoke:live:matrix`

For runtime-sensitive or browser-sensitive work that affects governed browser behavior, also:

- run `pnpm build:firefox:production`
- execute [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md)
- record the Firefox evidence alongside Chrome DLS evidence

5. For changes in a module that already has implemented smoke scenarios:
- run all implemented scenarios for that module in the same thread.
- do not mark work done with partial scenario coverage.

### Step 3: Select Entry Scenario Correctly

Use scenario by runtime entry path, not by convenience:

1. `lobby`:
- use for pre-join behavior validation
- path shape: generate shareable meeting URL, land in pre-join state, then join manually

2. `meeting`:
- use for direct in-session behavior validation
- path shape: instant meeting entry without a pre-join hold step

3. `continuation`:
- use for resume-vs-new-session prompt behavior

If a change affects both pre-join and in-session behaviors, run both `lobby` and `meeting`.

## Preflight Checklist (Mandatory Before Smoke)

1. Ensure CDP availability:
- `pnpm chrome:debug:ensure`

2. If extension runtime is missing (`sendMessage unavailable`, no extension worker):
- `pnpm chrome:debug`
- then re-check:
  - `pnpm chrome:debug:doctor`

3. Confirm local secrets are loaded (when needed):
- `pnpm chrome:secrets:check`
4. Keep deterministic mode enabled (default):
- `DETERMINISTIC_TEST_MODE=1` (do not disable unless diagnosing harness issues)
5. Keep live diagnostics stream enabled (default):
- `SMOKE_LIVE_DIAGNOSTICS=1`

## Standard Execution Profiles

### A) Fast Regression (default for most threads)

```bash
pnpm test
pnpm chrome:debug:ensure
pnpm chrome:smoke:live google-meet lobby
pnpm chrome:smoke:live google-meet meeting
```

### A1) Module-Scoped Regression (default for module requests)

```bash
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
```

### B) Prompt/Session Flow Regression

```bash
pnpm test
pnpm chrome:debug:ensure
pnpm chrome:smoke:google:continuation
pnpm chrome:smoke:live:google:settings meeting
```

### C) Full Verification

```bash
pnpm test
pnpm chrome:debug:ensure
pnpm chrome:smoke:live:matrix
```

## Firefox Verification Policy

- Chrome DLS remains the canonical automated runtime path in this repository.
- Firefox is still a governed browser target, so runtime-sensitive changes must include Firefox verification evidence even when the runtime flow is manual.
- Until a canonical Firefox smoke workflow is documented, use [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md) after producing the Firefox artifact.
- For packaging or release work, also run `pnpm zip:firefox:production` when the change affects distributable assets.

## Runtime Stability Rules

1. Do not force rebuild on every smoke run.
- default smoke flow already stages/reloads extension.

2. Force rebuild only when needed:
- build artifacts, manifest wiring, or packaging paths changed.
- command:
  - `pnpm chrome:smoke:live:fresh <provider> <scenario>`

3. Keep matrix runs for:
- cross-provider changes
- release readiness
- uncertainty after targeted runs
 - do not run matrix for module-scoped requests unless explicitly required
4. Default smoke/runtime path is intentionally single-path:
- Chrome runtime: `cft-only`
- extension load mode: `auto`
- manual-mode fallback: disabled
- extension reload fallback hopping: disabled in deterministic mode

## Blocking Prompt Policy

1. Default behavior:
- blocking startup prompts must be resolved in test flow.

2. If prompt remains unresolved:
- treat as `FAIL`
- capture prompt kind/title/button set from output

3. Diagnostic-only bypass (not acceptance):
- `SMOKE_ALLOW_PROMPT_BYPASS=1`

Bypass output can support debugging, but does not replace a real pass with prompt resolution enabled.

## Failure Handling Protocol

When a test fails:

1. Re-run the single failing case once.
2. If it fails again, classify:
- `environment` (CDP/runtime/extension not loaded)
- `test-harness` (selector/order/timing/prompt handling)
- `product regression` (real behavior mismatch)
3. Report classification explicitly with evidence.

## Reporting Template (Use In Every Thread)

```text
Test scope:
- Commands run:
  1) ...
  2) ...

Results:
- PASS: ...
- FAIL: ...

Firefox verification:
- Build: ...
- Checklist path: `docs/quality/firefox-manual-verification-checklist.md`
- Evidence: ...

Failure details (if any):
- Case: <provider/scenario or test file>
- Error: <key error line>
- Classification: <environment | test-harness | product regression>
- Reproduction: <single command>

Next action:
- <what should be fixed or re-run next>
```

## Cross-Thread Handoff Checklist

Before closing a thread:

1. Ensure docs are updated if behavior/test flow changed.
2. Ensure commands used are reproducible from repo root.
3. Include scenario rationale (`why lobby` / `why meeting` / `why continuation`) in summary.
4. If matrix was skipped, state why.
5. If any known failing case remains, document exact command and failure signature.

## Definition Of Done (Testing)

A thread is not done until all of the following are true:

1. Contract tests pass for changed logic.
2. Required smoke scenarios for touched modules are fully executed in the same thread.
3. All executed tests pass (or explicit owner-approved deferral is recorded).
4. The summary includes command-by-command evidence.
5. Documentation is updated when test flow, runtime path, or validation policy changed.
6. Runtime-sensitive changes include Firefox verification evidence per [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md) until Firefox automation is added.
