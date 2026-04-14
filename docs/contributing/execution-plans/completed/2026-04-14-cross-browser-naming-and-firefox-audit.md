# Cross-Browser Naming And Firefox Audit

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Remove misleading Chrome-only naming that survived from the single-browser phase of the extension while preserving legitimate browser-API usage, then audit the current codebase for Firefox compatibility boundaries and report the findings with evidence.

## Problem Statement

The repository now produces both Chrome and Firefox releases, but some internal file names, symbol names, test names, and UI helper labels still use `chrome` in ways that imply Chromium-only behavior. Separately, the codebase may still contain intentionally or unintentionally browser-gated surfaces that should be called out clearly before future fixes.

## Scope

- identify internal naming that refers to Chrome but is actually cross-browser
- rename the in-scope code paths to browser-neutral terms
- update affected imports and targeted tests
- audit repo evidence for Chrome-only or Firefox-risk behavior and summarize concrete findings
- produce fresh Chrome and Firefox development builds for reload-ready validation

## Non-Goals

- rewriting all direct `chrome.*` extension API calls into a new abstraction layer
- changing intentional Chrome-only debug tooling names under `package.json` scripts unless they are part of shipped runtime behavior
- implementing Firefox parity fixes for any unsupported feature discovered during the audit

## Repository Context

- `entrypoints/shared/extension-page-frame.tsx`
- `entrypoints/shared/dropdown-select.tsx`
- `entrypoints/options/App.tsx`
- `entrypoints/popup/App.tsx`
- `entrypoints/meeting-history/App.tsx`
- `entrypoints/shared/legal-page-layout.tsx`
- `entrypoints/shared/terms-gate.tsx`
- `tests/google-meet/shared-ui-controls.contract.test.ts`
- `entrypoints/shared/browser-capabilities.ts`
- `entrypoints/background/cloud-sync/providers/google-drive.ts`
- `entrypoints/background/cloud-sync/providers/onedrive-auth.ts`
- `wxt.config.ts`
- `package.json`

## Constraints

- keep changes reviewable and avoid broad churn in a dirty worktree
- do not rename legitimate `chrome.*` WebExtension API usage unless the repository already abstracts it safely
- preserve Chrome and Firefox release outputs
- record browser-gated findings with file-level evidence instead of assumptions

## Risks and Unknowns

- some `chrome` occurrences are design-system terms such as UI chrome rather than browser-family references
- renaming a shared helper file can create import fallout if any path is missed
- Firefox compatibility findings may be partly intentional and already documented, so reporting must separate confirmed gating from inferred risk

## Documentation Impact

- add this execution plan under `docs/contributing/execution-plans/active/`
- update the active/completed execution plan indexes as the plan moves through the workflow
- no behavior-contract update is planned unless the audit uncovers undocumented shipped behavior

## Testing and Coverage Impact

- update any targeted tests affected by helper renames
- run `pnpm test:targeted:plan` and execute the relevant targeted command(s)
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm docs:check`
- build fresh Chrome and Firefox development bundles with `pnpm build:all:development`

## Milestones

### Milestone 1 - Scope The Refactor And Audit

Inspect repository evidence to separate genuine extension-API `chrome` usage from misleading internal naming, and identify browser-gated or Firefox-risk code paths that must be reported.

### Milestone 2 - Apply Neutral Naming

Rename the in-scope shared helper file/symbol names and any clearly misleading local identifiers, then update imports and targeted UI coverage so the code reads as browser-neutral where behavior is browser-neutral.

### Milestone 3 - Validate And Report

Run targeted validation, full Google test coverage, docs checks, and fresh Chrome/Firefox development builds. Report confirmed Firefox compatibility boundaries with file-level evidence and keep remediation recommendations scoped.

## Verification

- `pnpm test:targeted:plan`
- `pnpm exec vitest run tests/google-meet/shared-ui-controls.contract.test.ts tests/google-meet/settings-and-readiness.contract.test.ts tests/google-meet/diagnostics.collector.contract.test.ts tests/google-meet/diagnostics-client.contract.test.ts tests/google-meet/i18n-diagnostics.contract.test.ts tests/google-meet/options-ui-language-switch.contract.test.tsx tests/google-meet/terms-gate-background.contract.test.ts tests/google-meet/meeting-summary-pipeline.contract.test.ts tests/google-meet/browser-capabilities.contract.test.ts tests/google-meet/cloud-sync-browser-support.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm build:all:development`

## Progress

- [x] Inspect repository context and confirm this task requires a plan
- [x] Create the active execution plan and index entry
- [x] Apply neutral naming refactors for misleading internal Chrome references
- [x] Run validation and dual-browser development builds
- [x] Record Firefox compatibility findings and finalize the plan

## Surprises and Discoveries

- Observation: The repo already contains explicit browser-capability gating that marks Google Drive and OneDrive cloud sync unsupported outside the Chrome runtime family.
  Evidence: `entrypoints/shared/browser-capabilities.ts`, `entrypoints/background/cloud-sync/providers/google-drive.ts`, `entrypoints/background/cloud-sync/providers/onedrive-auth.ts`, `docs/api/browser-capabilities-behavior-contract.md`
- Observation: The recommended targeted-test planner over-reported scope because the worktree already contained many unrelated modified files before this task.
  Evidence: `pnpm test:targeted:plan` reported 91 changed files and many unrelated suites; focused validation was chosen based on the actual renamed files and browser-capability audit scope.
- Observation: Chrome-first naming still exists in development automation and release scripts, but those references are tooling-specific rather than shipped runtime behavior.
  Evidence: `package.json` `chrome:*` scripts, `.github/workflows/*`, `scripts/start-windows-chrome-debug.sh`

## Decision Log

- Decision: Keep direct `chrome.*` API usage out of scope for this refactor and only rename misleading internal names.
  Rationale: Those identifiers represent the underlying WebExtension namespace in the current implementation, while helper file names like `extension-page-frame` replace the misleading cross-browser debt the user wants removed.
  Date/Author: 2026-04-14 / Codex
- Decision: Treat Firefox compatibility findings as two classes: confirmed runtime gating versus Chrome-first developer tooling.
  Rationale: This separates user-facing/browser-release risk from internal QA ergonomics and avoids overstating debug-script limitations as extension-product defects.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Completed the browser-neutral naming cleanup for the shared extension page helper by renaming `extension-page-chrome.tsx` to `extension-page-frame.tsx`, renaming `ExtensionChromeLink` to `ExtensionPageLink`, changing the dropdown layout constant to `menuReservedHeight`, and neutralizing several test helper names that previously implied Chrome-only behavior despite generic extension mocking.

Confirmed Firefox compatibility findings from repository evidence:

- Confirmed browser-gated runtime surface: cloud sync for `google-drive` and `onedrive` is intentionally unsupported outside the Chrome runtime family. This is enforced in `entrypoints/shared/browser-capabilities.ts` and consumed by the cloud-sync provider adapters.
- No additional Firefox-only breakage was confirmed from this audit pass in shipped runtime code beyond that explicit cloud-sync gating.
- Chrome-first development tooling remains in place for CDP/debug/smoke workflows (`chrome:*` scripts and related shell helpers), but those are engineering workflows rather than release-runtime behavior.

Verification outcomes:

- `pnpm docs:check` passed
- focused Vitest suite for renamed helpers and browser-capability coverage passed (`9` files, `49` tests)
- `pnpm test:google` passed (`48` files, `256` tests)
- `pnpm test:google:coverage` passed
- `pnpm build:all:development` passed for both Chrome and Firefox; only the existing chunk-size warning remained
