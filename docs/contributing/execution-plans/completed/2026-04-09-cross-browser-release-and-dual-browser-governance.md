# Cross-Browser Release And Dual-Browser Governance

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Establish Chrome and Firefox as first-class delivery targets for CaptionArc without forcing future contributors to infer browser behavior from Chrome-only defaults.

Done means all of the following are true:

- release artifacts are organized under `.release/<browser>/<mode>/...`
- build and zip commands can target either browser and either environment explicitly
- CI and release workflows can produce browser-specific assets intentionally instead of relying on one implicit default
- runtime and UI code stop assuming Chrome-only protocol strings, branding, or API availability where Firefox must also be considered
- unsupported browser-specific capabilities are gated explicitly instead of failing silently
- contributor-facing docs and quality rules tell implementers how Chrome and Firefox must be handled on every future change

This plan is intentionally written as an execution spec for a later implementation pass. It is not an instruction to complete the code changes in this thread.

## Problem Statement

The repository currently treats Chromium as the only governed browser target even though the codebase is close enough to Firefox compatibility that `WXT` can already emit a Firefox build.

Current gaps confirmed from repository evidence:

- output layout is mode-first, not browser-first, because `outDirTemplate` is `{{mode}}` in [wxt.config.ts](../../../../wxt.config.ts)
- local scripts are Chrome-centric, with no explicit Firefox build or zip commands in [package.json](../../../../package.json)
- CI release only builds one implicit artifact path in [release.yml](../../../../.github/workflows/release.yml)
- quality gates do not verify a Firefox build path in [quality-gates.yml](../../../../.github/workflows/quality-gates.yml)
- compatibility docs still declare Chromium as the primary browser scope in [compatibility-matrix.md](../../../quality/compatibility-matrix.md)
- README and setup docs describe the product and runtime flow as Chrome-only in [README.md](../../../../README.md)
- runtime code contains Chrome-specific assumptions such as `chrome-extension:` checks in [runtime.ts](../../../../entrypoints/shared/i18n/runtime.ts) and `"Chrome on ..."` device labels in [device-identity.ts](../../../../entrypoints/shared/device-identity.ts)
- cloud sync authentication depends on `chrome.identity` flows in [google-drive.ts](../../../../entrypoints/background/cloud-sync/providers/google-drive.ts) and [onedrive-auth.ts](../../../../entrypoints/background/cloud-sync/providers/onedrive-auth.ts), which creates browser-specific risk that is not documented or gated
- diagnostics persistence uses `chrome.storage.session` in [diagnostics.ts](../../../../entrypoints/background/diagnostics.ts), which must be treated as a browser capability concern instead of a universal assumption

Repository evidence gathered on 2026-04-09 also shows that `pnpm exec wxt build -b firefox --mode production` succeeds and emits a `firefox-mv2` build, so the right framing is not "whether Firefox is possible", but "how to make dual-browser delivery explicit, governed, and reviewable."

## Scope

In scope:

- define the canonical release artifact layout as `.release/<browser>/<mode>/...`
- define the canonical command naming scheme for browser-aware build and zip operations
- update WXT configuration, package scripts, and workflow contracts to support explicit browser targeting
- make Chrome and Firefox both explicit considerations in future implementation work
- identify and harden browser capability boundaries in runtime code
- define the browser support policy for optional features with browser-specific risk
- require contributor, QA, and release documentation to reflect dual-browser governance
- define validation expectations for local work, PR quality gates, and tagged releases

## Non-Goals

Out of scope for this work:

- Safari support
- Edge-specific branding or store pipeline work beyond what is inherited from Chromium
- adding new end-user features unrelated to browser compatibility or release governance
- changing provider detection logic for Google Meet, Teams, or Zoom except where browser capability hardening requires a small compatibility adjustment
- forcing full parity for every optional cloud provider capability if the underlying browser support is not verified; explicit temporary gating is acceptable, silent breakage is not
- replacing the current Chrome smoke workflow before a governed dual-browser quality policy exists

## Repository Context

Relevant build, workflow, and documentation files:

- [wxt.config.ts](../../../../wxt.config.ts)
- [package.json](../../../../package.json)
- [README.md](../../../../README.md)
- [release.yml](../../../../.github/workflows/release.yml)
- [quality-gates.yml](../../../../.github/workflows/quality-gates.yml)
- [build-packaging-and-release.md](../../../architecture/build-packaging-and-release.md)
- [release-runbook.md](../../../operations/release-runbook.md)
- [compatibility-matrix.md](../../../quality/compatibility-matrix.md)
- [local-development.md](../../../setup/local-development.md)
- [debugging.md](../../../setup/debugging.md)
- [agent-testing-onboarding.md](../../../setup/agent-testing-onboarding.md)
- [manifest-and-permissions.md](../../../architecture/manifest-and-permissions.md)
- [extension-runtime.md](../../../architecture/extension-runtime.md)
- [storage-and-state.md](../../../architecture/storage-and-state.md)
- [store-submission.md](../../../operations/store-submission.md)
- [store-listing.md](../../../operations/store-listing.md)

Relevant runtime and UI files with browser assumptions or capability risk:

- [runtime.ts](../../../../entrypoints/shared/i18n/runtime.ts)
- [device-identity.ts](../../../../entrypoints/shared/device-identity.ts)
- [index.ts](../../../../entrypoints/content/index.ts)
- [diagnostics.ts](../../../../entrypoints/background/diagnostics.ts)
- [google-drive.ts](../../../../entrypoints/background/cloud-sync/providers/google-drive.ts)
- [onedrive-auth.ts](../../../../entrypoints/background/cloud-sync/providers/onedrive-auth.ts)
- [index.ts](../../../../entrypoints/background/index.ts)
- [use-cloud-sync.ts](../../../../entrypoints/options/use-cloud-sync.ts)
- [App.tsx](../../../../entrypoints/options/App.tsx)

Relevant testing and smoke files:

- [recommend-targeted-tests.mjs](../../../../scripts/testing/recommend-targeted-tests.mjs)
- [smoke-provider.sh](../../../../scripts/manual-smoke/smoke-provider.sh)
- [smoke-google-meet.sh](../../../../scripts/manual-smoke/smoke-google-meet.sh)
- [smoke-matrix.sh](../../../../scripts/manual-smoke/smoke-matrix.sh)
- [wsl-windows-chrome-cdp-quickstart.md](../../../setup/wsl-windows-chrome-cdp-quickstart.md)
- [testing-quality-gate.md](../../../quality/testing-quality-gate.md)

## Constraints

- keep the repository public-safe; no machine-local paths, private URLs, or secret values in docs, examples, scripts, or workflow notes
- preserve current Chrome release capability while introducing Firefox as an explicit peer target
- the release artifact layout must become browser-first exactly as requested: browser directory at level one, environment directory at level two
- do not leave future contributors to infer browser support from chat context; repository docs must become the source of truth
- avoid silent browser divergence; unsupported or unverified capabilities must be surfaced through explicit guards, UI messaging, or documented temporary exclusions
- keep command names predictable and composable; avoid ambiguous defaults that hide the chosen browser
- maintain compatibility with the repository testing and documentation contract
- any implementation pass must update docs in the same workstream as code and workflow changes

## Risks and Unknowns

- `chrome.identity.getAuthToken` in the Google Drive adapter may not map cleanly to Firefox behavior; this is the highest-risk optional capability boundary
- `chrome.identity.launchWebAuthFlow` and redirect handling for OneDrive may require browser-specific setup or may need temporary gating
- `chrome.storage.session` may differ in availability or behavior across browsers, requiring a storage fallback policy
- the current WXT Firefox build emits `manifest_version: 2`; future Firefox packaging or policy expectations may shift, so the browser output format must be treated as generated evidence, not assumed forever
- smoke automation in this repository is currently Chrome CDP-centric; Firefox quality governance may need a staged rollout where build/package verification lands first and runtime automation follows later
- if implementation introduces a capability abstraction layer, broad refactors could sprawl unless kept tightly scoped to browser-sensitive touchpoints

## Documentation Impact

Implementation governed by this plan must update all impacted docs in the same workstream. At minimum, expect updates to:

- [README.md](../../../../README.md)
- [build-packaging-and-release.md](../../../architecture/build-packaging-and-release.md)
- [extension-runtime.md](../../../architecture/extension-runtime.md)
- [manifest-and-permissions.md](../../../architecture/manifest-and-permissions.md)
- [storage-and-state.md](../../../architecture/storage-and-state.md)
- [compatibility-matrix.md](../../../quality/compatibility-matrix.md)
- [local-development.md](../../../setup/local-development.md)
- [debugging.md](../../../setup/debugging.md)
- [agent-testing-onboarding.md](../../../setup/agent-testing-onboarding.md)
- [release-runbook.md](../../../operations/release-runbook.md)
- [store-submission.md](../../../operations/store-submission.md)
- [store-listing.md](../../../operations/store-listing.md)

If the implementation adds any new browser-specific guide under `docs/setup/` or `docs/quality/`, that section index README must also be updated in the same change.

## Testing and Coverage Impact

Implementation governed by this plan must include:

- updated or added contract tests for any new browser capability abstraction
- updated or added contract tests for browser-specific feature gating in cloud sync and browser labeling
- updated or added tests for any release-output path helper or script changes
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan` and execution of the relevant recommended targeted commands
- explicit browser-aware build checks for Chrome and Firefox in both supported environments
- explicit browser-aware zip checks for all release-browser targets intended for tagged releases

Runtime-sensitive validation policy for this plan:

- Chrome DLS remains required for runtime-sensitive changes until a Firefox runtime workflow is implemented and documented
- Firefox must not be treated as "best effort" once this plan is implemented; if automated Firefox runtime smoke is not delivered in the same pass, the docs must define a required manual verification checklist for Firefox and require it for runtime-affecting changes

## Milestones

### Milestone 1 - Browser-First Release Topology And Command Contract

Objective:

- make browser selection explicit in local development, CI, and release packaging
- change the canonical artifact layout to `.release/<browser>/<mode>/...`

Implementation clarification for this milestone:

- browser-targeted zip artifacts and any paired source zips must also resolve under the same browser-first tree so packaged outputs remain reviewable at `.release/<browser>/<mode>/...`

Implementation approach:

- update [wxt.config.ts](../../../../wxt.config.ts) so generated output folders resolve to browser-first paths
- define a stable command matrix in [package.json](../../../../package.json) using explicit browser and mode names
- adopt the following command family and keep names exact unless repository constraints force a documented deviation:
  - `build:chrome:development`
  - `build:chrome:production`
  - `build:firefox:development`
  - `build:firefox:production`
  - `build:all:development`
  - `build:all:production`
  - `zip:chrome:production`
  - `zip:firefox:production`
  - `zip:all:production`
- update existing generic commands so they no longer hide browser selection:
  - either make `build` and `zip` call the `all:*` variants
  - or keep them as aliases only if the alias target is documented and intentionally chosen
- update [release.yml](../../../../.github/workflows/release.yml) to produce browser-tagged assets instead of one implicit zip set
- update [quality-gates.yml](../../../../.github/workflows/quality-gates.yml) to run browser-aware build verification, at minimum for Chrome and Firefox production outputs
- ensure generated artifact names and workflow logs make the browser unambiguous

Acceptance signals:

- both browser production builds exist under `.release/chrome/production/` and `.release/firefox/production/`
- both browser development builds exist under `.release/chrome/development/` and `.release/firefox/development/`
- release workflow can publish browser-specific zip assets without relying on path ambiguity
- docs no longer describe `.release/<mode>` as canonical

Verification for this milestone:

- run each new build command locally and verify the generated path
- run each new production zip command and verify browser-specific zip names and locations
- inspect generated manifests for Chrome and Firefox outputs to confirm the workflow is emitting the intended browser targets

Verification results recorded on 2026-04-09:

- `pnpm build:chrome:development` -> passed; emitted `.release/chrome/development/manifest.json` and the expected asset directories.
- `pnpm build:chrome:production` -> passed; emitted `.release/chrome/production/manifest.json` and the expected asset directories.
- `pnpm build:firefox:development` -> passed; emitted `.release/firefox/development/manifest.json` and the expected asset directories.
- `pnpm build:firefox:production` -> passed; emitted `.release/firefox/production/manifest.json` and the expected asset directories.
- `pnpm zip:chrome:production` -> passed; emitted `.release/chrome/production/caption-arc-1.3.0-chrome.zip`.
- `pnpm zip:firefox:production` -> passed; emitted `.release/firefox/production/caption-arc-1.3.0-firefox.zip` and `.release/firefox/production/caption-arc-1.3.0-firefox-sources.zip`.
- Manifest inspection confirmed Chrome outputs remain Manifest V3 with `background.service_worker`, while Firefox outputs remain Manifest V2 with `background.scripts`, all at version `1.3.0`.

### Milestone 2 - Runtime Capability Hardening And Explicit Browser Support Policy

Objective:

- make Chrome and Firefox explicit runtime considerations
- replace Chrome-only assumptions with browser-aware capability handling
- prevent optional features from failing silently on Firefox

Implementation approach:

- introduce a shared browser capability module under `entrypoints/shared/` that exposes:
  - current browser target or runtime family
  - extension protocol recognition for both `chrome-extension:` and `moz-extension:`
  - browser-aware product labeling for user-facing defaults and diagnostics
  - capability checks for APIs that are not safe to assume universally
- replace direct Chrome-only assumptions in existing files with that abstraction, starting with:
  - [runtime.ts](../../../../entrypoints/shared/i18n/runtime.ts)
  - [device-identity.ts](../../../../entrypoints/shared/device-identity.ts)
  - any UI or diagnostics surface that emits Chrome-only branding
- introduce a governed storage fallback for diagnostics persistence so `chrome.storage.session` is not the only assumed path
- introduce a governed identity capability policy for optional cloud sync:
  - do not leave Google Drive or OneDrive controls enabled on a browser where the required auth path is unsupported or unverified
  - if a provider is not ready on Firefox, disable it explicitly in runtime and UI with a user-facing explanation
  - document the support matrix in repository docs instead of burying it in code comments
- add or update targeted tests around:
  - browser protocol detection
  - browser-aware device labels
  - storage-session fallback behavior
  - cloud sync provider gating by browser capability

Acceptance signals:

- no remaining critical user-facing Chrome-only strings are used where the browser should be generic or browser-aware
- runtime code no longer depends on `chrome-extension:` as the only extension-page protocol
- Firefox users do not encounter a broken optional cloud sync connect flow without an explicit support message
- Chrome behavior remains unchanged for already-supported flows

Verification for this milestone:

- run the focused contract tests added for browser capability handling
- run `pnpm test:targeted:plan` and execute the recommended commands for touched runtime modules
- rebuild both browsers after each major compatibility change to confirm no packaging regressions

Verification results recorded on 2026-04-09:

- `pnpm test:targeted:plan` -> passed; recommended diagnostics, i18n runtime, and runtime-sensitive smoke-oriented coverage for the touched modules.
- Focused contract verification passed for `tests/google-meet/browser-capabilities.contract.test.ts`, `tests/google-meet/cloud-sync-browser-support.contract.test.ts`, `tests/google-meet/diagnostics.collector.contract.test.ts`, `tests/google-meet/diagnostics-client.contract.test.ts`, and `tests/google-meet/i18n-runtime.contract.test.ts`.
- Targeted recommended suites also passed for `tests/google-meet/use-diagnostics-console.contract.test.ts`, `tests/google-meet/diagnostics-viewer.contract.test.ts`, `tests/google-meet/ui-i18n.contract.test.ts`, and `tests/google-meet/diagnostics-i18n-boundary.contract.test.ts`.
- `pnpm build:chrome:production` -> passed after the capability changes and continued to emit `.release/chrome/production`.
- `pnpm build:firefox:production` -> passed after the capability changes and continued to emit `.release/firefox/production`.
- Post-change manifest inspection confirmed Chrome remains Manifest V3 with a background service worker and Firefox remains Manifest V2 with background scripts.

### Milestone 3 - Dual-Browser Quality, CI, And Release Governance

Objective:

- make dual-browser consideration a standing repository rule, not a one-off effort
- ensure every future implementation path knows what must be validated for Chrome and Firefox

Implementation approach:

- update contributor and architecture docs so Chrome and Firefox are both first-class targets
- replace Chromium-only phrasing in product, setup, architecture, quality, and release docs where the repository should now describe dual-browser support
- define the canonical support matrix:
  - browser-neutral core features expected on both browsers
  - optional or gated capabilities that may differ temporarily by browser
  - the evidence required before removing a temporary Firefox limitation
- define release workflow expectations:
  - PR quality gates must run browser-aware build verification
  - tagged releases must attach browser-specific packages
  - release notes and store submission docs must call out browser support accurately
- define contributor workflow expectations:
  - all non-trivial implementation plans must consider browser compatibility explicitly
  - any new browser-sensitive API usage must be wrapped in capability checks or documented as intentionally browser-scoped
  - runtime-sensitive changes must record Chrome smoke evidence and Firefox verification evidence per the updated quality docs
- if Firefox runtime automation is not implemented in the same change, ship a required Firefox manual verification checklist and reference it from setup and quality docs

Acceptance signals:

- repository docs no longer describe Chromium as the only primary browser target
- CI verifies both browser build paths
- release runbook explains how to build, package, and validate Chrome and Firefox artifacts intentionally
- future contributors have a written rule set for handling browser-sensitive changes

Verification for this milestone:

- run `pnpm docs:check`
- inspect updated docs indexes to confirm new or moved docs are linked
- verify workflows and runbooks reference browser-specific commands and paths consistently

Verification results recorded on 2026-04-09:

- `pnpm docs:check` -> passed; `node ./scripts/docs/validate-docs.mjs` reported `Documentation validation passed (123 markdown files scanned).`
- After moving the plan to `completed/`, `pnpm docs:check` was re-run and passed again once the completed-plan relative link to [docs/contributing/execution-plans.md](../../execution-plans.md) was corrected.
- Updated docs indexes now link the shipped Firefox checklist from [docs/quality/README.md](../../../quality/README.md) and [docs/setup/README.md](../../../setup/README.md).
- Contributor workflow docs now require explicit browser compatibility handling and Firefox verification evidence in [docs/contributing/execution-plans.md](../../execution-plans.md), [docs/setup/agent-testing-onboarding.md](../../../setup/agent-testing-onboarding.md), and [AGENTS.md](../../../../AGENTS.md).
- Release and store guidance now describe browser-specific packaging and Firefox-gated optional capabilities in [docs/operations/release-runbook.md](../../../operations/release-runbook.md), [docs/operations/store-submission.md](../../../operations/store-submission.md), and [docs/operations/store-listing.md](../../../operations/store-listing.md).

## Verification

The implementation pass should record actual results for the following commands and checks, adjusting only if the final command names differ and the plan is updated accordingly:

```bash
pnpm docs:check
pnpm test:google
pnpm test:google:coverage
pnpm test:targeted:plan
pnpm build:chrome:development
pnpm build:chrome:production
pnpm build:firefox:development
pnpm build:firefox:production
pnpm zip:chrome:production
pnpm zip:firefox:production
pnpm chrome:debug:reload
pnpm chrome:smoke:meet
pnpm chrome:smoke:provider <provider> <scenario>
```

Required verification observations:

- artifact directories are browser-first
- build and zip logs make browser targets explicit
- docs and workflows use the same command names and output paths
- Chrome runtime-sensitive changes still satisfy current smoke policy
- Firefox verification evidence is recorded according to the updated policy, automated or manual

## Progress

- [x] Phase 1 execution started
- [x] Phase 1 verification recorded
- [x] Phase 2 execution started
- [x] Phase 2 verification recorded
- [x] Phase 3 execution started
- [x] Phase 3 verification recorded
- [x] Plan moved to `completed/` after implementation

## Surprises and Discoveries

- Observation: The current repository can already emit a Firefox build through WXT.
  Evidence: `pnpm exec wxt build -b firefox --mode production` succeeded on 2026-04-09 and generated a Firefox manifest, and the governed artifact contract is now recorded under `.release/firefox/production/manifest.json`.
- Observation: The present artifact layout is mode-first.
  Evidence: `outDirTemplate: "{{mode}}"` in [wxt.config.ts](../../../../wxt.config.ts).
- Observation: The current QA and runtime workflow is explicitly Chrome-centric.
  Evidence: the browser-specific script family in [package.json](../../../../package.json) is entirely prefixed with `chrome:`.
- Observation: WXT accepts nested browser-aware build and zip templates, so the repository can enforce `.release/<browser>/<mode>/...` without a custom packager.
  Evidence: `outDirTemplate` and `zip.artifactTemplate` both accepted `{{browser}}/{{mode}}`-style paths during the 2026-04-09 phase 1 implementation and verification pass.
- Observation: Firefox packaging still emits a paired sources archive by default.
  Evidence: `pnpm zip:firefox:production` produced `.release/firefox/production/caption-arc-1.3.0-firefox-sources.zip` during milestone 1 verification.
- Observation: diagnostics fallback needs read-aware and write-aware storage selection instead of one shared storage preference rule.
  Evidence: phase 2 verification initially exposed a client/background mismatch until diagnostics client reads were allowed to prefer session/local storage with read access while background persistence still required a write-capable area.
- Observation: Firefox cloud-sync gating must surface as checkpoint state, not only as connect-time exceptions, or the options UI remains ambiguous when no provider was previously connected.
  Evidence: the phase 2 options flow only became explicit after baseline checkpoints started carrying unsupported-browser metadata for Google Drive and OneDrive.
- Observation: dual-browser governance needed a repository-owned Firefox verification checklist because the current automated runtime tooling remains Chrome-only.
  Evidence: phase 3 completed with `pnpm docs:check` passing after [docs/quality/firefox-manual-verification-checklist.md](../../../quality/firefox-manual-verification-checklist.md) and its setup and quality references were added.

## Decision Log

- Decision: The canonical release directory layout must become `.release/<browser>/<mode>/...`.
  Rationale: This is the requested operational requirement and prevents browser ambiguity in local builds, CI artifacts, and release packaging.
  Date/Author: 2026-04-09 / Codex
- Decision: Chrome and Firefox must be treated as first-class repository targets after this work, even if some optional capabilities remain temporarily gated on Firefox.
  Rationale: The repository should govern explicit support and temporary limitations, not hide browser differences behind Chrome-first defaults.
  Date/Author: 2026-04-09 / Codex
- Decision: Unsupported browser-specific capabilities must be gated explicitly rather than allowed to fail at runtime.
  Rationale: This keeps the product reviewable, avoids broken UX, and removes guesswork for future contributors.
  Date/Author: 2026-04-09 / Codex
- Decision: Browser-specific packaged artifacts, including Firefox source zips when generated by WXT, must live under the same `.release/<browser>/<mode>/...` layout as unpacked builds.
  Rationale: The requested browser-first artifact contract should apply uniformly to build and packaging outputs so local verification, CI artifacts, and release assets use one path convention.
  Date/Author: 2026-04-09 / Codex
- Decision: Generic `build` and `zip` aliases will target the all-browser production flow, while `build:extension` remains the Chrome-production convenience alias for Chrome runtime tooling.
  Rationale: This keeps browser selection explicit in the primary command matrix while preserving the existing Chrome debug/smoke workflow without forcing it to rebuild Firefox artifacts on every auto-heal path.
  Date/Author: 2026-04-09 / Codex
- Decision: Browser capability detection will be centralized in a shared helper that resolves browser family, extension protocols, diagnostics storage preference, and cloud-sync browser support.
  Rationale: The touched runtime, diagnostics, and cloud-sync paths all need the same browser facts; centralizing them avoids drift and keeps tests focused on one contract surface.
  Date/Author: 2026-04-09 / Codex
- Decision: Unsupported cloud-sync providers will be represented as explicit checkpoints with `supported: false`, a user-visible support message, and queue-target filtering.
  Rationale: This prevents Firefox from surfacing broken connect flows, prevents unsupported providers from entering sync execution, and gives the options UI a stable source of truth for the support state.
  Date/Author: 2026-04-09 / Codex
- Decision: Chrome DLS remains the canonical automated runtime workflow, while Firefox requires a mandatory manual verification checklist until a canonical Firefox automation path is documented.
  Rationale: This keeps Firefox as a governed browser target immediately without pretending the current Chrome CDP tooling already covers Firefox runtime validation.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

- Milestone 1 completed: build outputs now resolve to `.release/chrome/<mode>/...` and `.release/firefox/<mode>/...`, package scripts and workflows produce browser-tagged assets under the same tree, and Chrome runtime tooling defaults were retargeted to `.release/chrome/production`.
- Milestone 2 completed: shared runtime logic now recognizes both Chrome and Firefox extension protocols, default device labels are browser-aware, diagnostics persistence falls back safely when session storage is unavailable, and Firefox receives explicit cloud-sync unsupported-state messaging instead of silent identity-flow failure.
- Milestone 3 completed: contributor, setup, quality, architecture, release, and store docs now define Chrome and Firefox as governed targets, require Chrome DLS plus Firefox verification evidence for runtime-sensitive work, and ship a canonical Firefox manual verification checklist while Firefox automation remains unimplemented.

Expected retrospective requirements for the implementation thread:

- final command set shipped: `pnpm docs:check`, `pnpm test:targeted:plan`, focused phase 2 vitest suites, `pnpm build:chrome:development`, `pnpm build:chrome:production`, `pnpm build:firefox:development`, `pnpm build:firefox:production`, `pnpm zip:chrome:production`, and `pnpm zip:firefox:production`.
- Firefox cloud sync remains intentionally gated pending browser-specific identity verification.
- Firefox runtime validation shipped as a mandatory manual checklist, not automation, in this change.
- No scope deviation was introduced beyond the explicit phase 1 plan clarification for browser-first zip artifacts.
