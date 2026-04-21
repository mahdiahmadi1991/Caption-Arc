# CDP Extension Materialization And Runtime Detection

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Stabilize Chrome debug runtime detection so DLS can reliably find CaptionArc when the extension is already installed in the active debug profile.

## Problem Statement

Recent smoke runs have failed with `Could not resolve CaptionArc extension target` even when the repository owner can see CaptionArc in the live Chrome debug browser. The runtime tooling needs to distinguish between "not installed", "installed but lazy", and "installed and ready" without relying on brittle assumptions.

## Scope

- inspect active Chrome debug session behavior for installed CaptionArc runtime targets
- patch runtime detection/materialization helpers if local evidence shows they miss valid installed states
- rerun `doctor` and a DLS smoke scenario against the active Chrome session
- stabilize the Windows-local `chrome:debug:doctor` path so it does not misreport extension workers as zero when the endpoint itself is healthy

## Non-Goals

- changing extension product behavior unrelated to runtime detection
- reintroducing automatic unpacked-install fallback

## Repository Context

- `scripts/manual-smoke/lib/extension-target.mjs`
- `scripts/manual-smoke/check-cdp.mjs`
- `scripts/manual-smoke/ensure-cdp-ready.sh`
- `scripts/manual-smoke/smoke-provider.mjs`

## Risks and Unknowns

- service-worker materialization may be timing-sensitive during fresh Chrome startup
- stale cached extension IDs may mislead detection
- provider tabs may influence which targets are present in `json/list`

## Chromium And Firefox Impact

- Chromium-family impact: direct on Chrome debug/DLS tooling
- Firefox impact: none

## Testing And Verification Impact

- `pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts`
- `pnpm test:google`
- `pnpm chrome:debug:doctor`
- `pnpm chrome:smoke:live google-meet meeting`
- direct Windows-local checker run via `powershell.exe -File scripts/windows/check-cdp.ps1`

## Progress

- [x] Plan created before implementation
- [x] Confirm live-session root cause
- [x] Implement runtime detection/materialization fix if needed
- [x] Verify with doctor + DLS
- [x] Fix Windows-local doctor parsing/materialization discrepancy

## Surprises and Discoveries

- Observation: in the current live session, `chrome://extensions` reports CaptionArc as installed/enabled via `chrome.developerPrivate.getExtensionsInfo()`, and CDP exposes a `chrome-extension://.../background.js` service worker.
  Evidence: live probing on 2026-04-20 after relaunching Chrome debug on the owner profile.

- Observation: when the extension is installed but no `chrome-extension://...` target is present yet, opening `options.html` using the installed extension id from `chrome://extensions` reliably materializes a usable extension page target.
  Evidence: after patching `resolveCaptionArcExtensionTarget`, direct probing returned a working `options.html` target with `chrome.runtime.sendMessage` available, and DLS passed.

- Observation: the intermittent Windows-local doctor failure was not a bad Chrome endpoint; it was a PowerShell parsing bug in `check-cdp.ps1`. The helper function returned the entire `/json/list` array as a single object when called via `-File`, which collapsed target reporting to `Targets: 1 (:1)` and hid extension workers.
  Evidence: direct `Invoke-RestMethod` against the local CDP endpoint (`http://<local-cdp-host>:<remote-debugging-port>/json/list`) returned five real targets including CaptionArc, while the original script printed a single target with an empty type bucket.

## Decision Log

- Decision: re-verify the live session before changing tooling, because prior failures may have been caused by a stale or non-debug Chrome instance rather than a persistent resolver bug.
  Rationale: avoid unnecessary churn in DLS tooling.
  Date/Author: 2026-04-20 / Codex

## Outcomes and Retrospective

- Root cause: the resolver only trusted already-materialized `chrome-extension://...` CDP targets and could miss an installed CaptionArc when the active session had not yet opened an extension page target.
- Fix: `resolveCaptionArcExtensionTarget()` now falls back to `chrome://extensions` -> `chrome.developerPrivate.getExtensionsInfo()` to discover the installed extension id, then opens an extension UI target to materialize runtime before continuing.
- Additional root cause: the Windows-local checker treated `/json/list` as a single object because the PowerShell helper did not enumerate JSON arrays correctly when invoked from the script file.
- Additional fix: `scripts/windows/check-cdp.ps1` now enumerates `/json/list` via `Invoke-JsonArray`, keeps worker collections wrapped as arrays, and can re-materialize the extension runtime through `options.html` when a cached extension id is available.
- Verification:
  - `pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts`
  - `pnpm test:google`
  - `pnpm chrome:debug:doctor`
  - `pnpm chrome:smoke:live google-meet meeting`
  - `powershell.exe -File scripts/windows/check-cdp.ps1 -RemoteDebuggingPort <remote-debugging-port>`
  - `pnpm chrome:debug:doctor` after forcibly closing CaptionArc page + worker targets
