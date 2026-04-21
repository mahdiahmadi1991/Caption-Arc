# Agent Onboarding: WSL/Windows Chrome CDP Runtime

## Purpose

This document is the mandatory onboarding reference for any agent thread that needs manual smoke testing, UI validation, provider validation, or extension runtime verification.

The goal is to make runtime testing consistent across threads without requiring repeated owner reminders.

Canonical runtime test convention name:

- `Deterministic Live Smoke (DLS)`
- command shape: `pnpm chrome:smoke:live <provider> <scenario>`

## Mandatory Rule

Before running smoke checks for extension behavior, every agent must:

1. ensure CDP readiness with auto-heal (`pnpm chrome:debug:ensure` or smoke wrappers)
2. run CDP health checks
3. select the correct test mode (`WSL direct` or `Windows-only`)
4. run the relevant validation set

Skipping this flow is not allowed for runtime-sensitive work.

Owner approval gate for DLS:

1. execute DLS scenario in a visible session
2. repository owner must visually review behavior
3. repository owner must explicitly approve in the same thread
4. before explicit approval, DLS status is `pending-owner-review` and cannot be counted as done

Provider scope is mandatory:

- do not restrict smoke validation to Google Meet only
- include Microsoft Teams and Zoom when the task can affect shared runtime or provider routing behavior

## When This Is Required

Use this runtime flow whenever a change touches one or more of:

- `entrypoints/content/overlay/*`
- `entrypoints/content/render.ts`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/content/providers/*`
- `entrypoints/background/history.ts`
- extension boot, messaging, or lifecycle behavior

Also use this flow before release candidate validation.

## Runtime Commands

Run these commands from WSL shell. Do not run `pnpm` from Windows PowerShell UNC path.

Before smoke runs that validate AI-dependent behavior, ensure local secrets exist:

- `.secrets/smoke.env` (git-ignored)
- template: `.secrets/.env.example`
- wrappers auto-load and map `OPENAI_API_KEY` -> `SMOKE_OPENAI_API_KEY`

1. Build extension:

```bash
pnpm build:target:chrome:development
```

2. Launch Windows Chrome debug profile from WSL:

```bash
pnpm chrome:debug
```

If the repository owner has a known-good Windows Chrome debug profile with CaptionArc already installed, agents may launch that profile directly instead of the repository-managed profile. Keep committed docs generic and use this placeholder path:

```text
C:\Users\<windows-user>\.google\ChromeDebugProfile
```

Example launch shape:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\<windows-user>\.google\ChromeDebugProfile"
```

Keep this runtime on `system-only`. Do not switch to a non-system Chrome path when CaptionArc is missing.

Explicit reload command (recommended before each smoke run):

```bash
pnpm chrome:debug:reload
```

Stop debug runtime when done:

```bash
pnpm chrome:debug:stop
```

3. Diagnose connectivity mode:

```bash
pnpm chrome:debug:doctor
pnpm chrome:debug:ensure
pnpm chrome:secrets:check
pnpm chrome:debug:diagnostics:stream
```

4. Optional explicit checks:

```bash
pnpm chrome:debug:check           # WSL direct path
pnpm chrome:debug:check:windows   # Windows local path
```

5. Meet URL and smoke helpers:

```bash
pnpm chrome:meet:url
pnpm chrome:meet:url:lobby
pnpm chrome:smoke:meet
pnpm chrome:smoke:live <provider> <scenario>
pnpm chrome:smoke:live:fresh <provider> <scenario>
pnpm chrome:smoke:live:google:settings <scenario>
pnpm chrome:smoke:live:matrix
pnpm chrome:smoke:google:continuation
pnpm chrome:seed:google:continuation <meet-url>
pnpm test:targeted:plan
pnpm test:targeted:run
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
```

Smoke wrappers auto-heal and auto-reload extension runtime by default:

1. use current local build output by default (fast path)
2. sync output to `%LOCALAPPDATA%\CaptionArc\extension\development`
3. if debug Chrome is active, execute in-place extension runtime reload
4. if reload is inconclusive, continue without forced restart by default (`RELOAD_EXTENSION_STRICT=0`)
5. if strict mode is enabled (`RELOAD_EXTENSION_STRICT=1`), fallback to runtime restart
6. continue smoke flow

Release output layout:

- `.release/v<version>/development/chrome` is the default artifact used by debug and smoke scripts
- `.release/v<version>/production/chrome` remains available for packaging-specific validation only
- Firefox artifacts live under `.release/v<version>/<mode>/firefox` for packaging and browser-specific verification work

Forced rebuild path:

1. `pnpm build:extension`
2. or run smoke with `AUTO_BUILD_EXTENSION_ALWAYS=1` / `*:fresh` commands

Default smoke UX mode (mandatory unless task needs speed):

1. single-tab reuse (`SMOKE_SINGLE_TAB=1`)
2. step-by-step pacing (`SMOKE_STEP_MODE=1`)
2.1 fast default pacing is `SMOKE_STEP_PAUSE_MS=700` (can raise for demos)
3. avoid cross-tab reload noise (`RELOAD_PROVIDER_TABS=0`)
4. launch/runtime path is single-path (`system-only + auto`) with no fallback reruns
5. enforce deterministic runtime path (`DETERMINISTIC_TEST_MODE=1`)
6. if in-place extension reload is inconclusive, restart in same deterministic path (`RELOAD_EXTENSION_STRICT=1` under deterministic mode)
7. stream live diagnostics in same smoke terminal (`SMOKE_LIVE_DIAGNOSTICS=1`)
8. enforce prompt resolution by default (`SMOKE_REQUIRE_PROMPT_RESOLUTION=1`)
9. for Google prompt flows, configure actions explicitly when needed:
 - `SMOKE_CAPTURE_PROMPT_ACTION=approve|dismiss`
 - `SMOKE_CONTINUATION_PROMPT_ACTION=resume|restart`
10. prefer DLS aliases (`chrome:smoke:live*`) for acceptance evidence so runtime mode and live logs stay standardized

Runtime selection baseline for this environment:

1. use `CHROME_RUNTIME_MODE=system-only` launcher mode
2. keep `DETERMINISTIC_TEST_MODE=1` for acceptance runs
3. do not use Chrome-for-Testing fallback or manual extension-load modes in acceptance flow

## Mode Selection

### Mode A: WSL Direct CDP Available

Condition:

- `pnpm chrome:debug:check` passes

Use this mode when the agent needs direct automation from WSL tooling.

### Mode B: Windows-Only CDP Available

Condition:

- `pnpm chrome:debug:check` fails
- `pnpm chrome:debug:check:windows` passes

Use this mode for:

- reliable Chrome runtime verification
- manual QA matrix execution
- Windows-side smoke checks

This mode still provides operational verification even when WSL cannot directly reach CDP.

## Required Validation Flow Per Runtime-Sensitive Task

For any runtime-sensitive implementation thread:

1. Pre-change check:
- run `pnpm chrome:debug:ensure` (or `pnpm chrome:debug:doctor`)
- record active mode

2. Post-change check:
- rerun `pnpm chrome:debug:ensure`
- run `pnpm test:module:plan <module-path>` and `pnpm test:module:run <module-path>` for module-scoped requests
- use `pnpm test:targeted:plan` only when scope is broader than a single module
- use full matrix only when changes are cross-provider or risk is unclear
- run provider/UI scenarios relevant to modified modules
- prefer DLS command family for smoke evidence in thread summaries
- targeted matrix examples:
  - `pnpm chrome:smoke:live:matrix google-meet:lobby,google-meet:meeting`
  - `pnpm chrome:smoke:live:matrix google-meet:lobby,google-meet:continuation`
  - `SMOKE_CASES="google-meet:lobby,zoom-web:meeting" pnpm chrome:smoke:live:matrix`

3. Report:
- include mode used
- include check outputs summary
- include any limitation discovered during validation

## Manual Matrix Link

Primary matrix:

- [provider-qa-baseline.md](../../archive/feature-plans/provider-qa-baseline.md)

## Troubleshooting

1. CDP not reachable in both modes:
- relaunch with `pnpm chrome:debug`
- ensure no conflicting Chrome debug process owns the same port
- rerun doctor

1.1 Auto-load blocked by Chrome build:
- symptom: CDP reachable but CaptionArc extension runtime is not discoverable
- action: stay on the same `system-only` Chrome session
- run:
  - `pnpm chrome:debug:check`
  - `pnpm chrome:debug:doctor`
- expected outcome: confirm whether the active debug profile already has a usable CaptionArc install
- rerun:
  - smoke command again

2. Extension worker not detected:
- open extension popup or options once
- rerun checks

2.1 Extension still not detected after popup/options:
- open `chrome://extensions` in the debug profile
- verify CaptionArc is present and enabled
- rerun `pnpm chrome:debug:doctor`
- if extension card is still not shown, stop and report the missing prerequisite before smoke acceptance

3. WSL direct unavailable but Windows check available:
- continue using Windows-only mode for runtime validation
- do not block manual validation on WSL direct limitations

4. Enabling WSL direct mode (advanced, optional):
- keep Chrome launched with `0.0.0.0` remote debugging address (already default in scripts)
- set up the managed bridge (Admin required): `pnpm chrome:debug:bridge:setup`
- rerun `pnpm chrome:debug:doctor` and confirm Mode A is available

5. Invalid Meet URL in smoke runs:
- do not hardcode random Meet URLs in smoke scripts
- use `pnpm chrome:meet:url` or `pnpm chrome:smoke:meet` to resolve URL through runtime:
  - existing Meet tab
  - landing flow for `lobby`/`continuation` (`meet.google.com/landing` -> `New meeting` -> `Create a meeting for later`)
  - landing flow for `meeting` (`meet.google.com/landing` -> `New meeting` -> `Start an instant meeting`)
  - no synthetic fallback by default; fail fast if real URL cannot be resolved
- to force brand-new Meet URL generation instead of reusing existing Meet tabs:
  - `GOOGLE_MEET_REQUIRE_FRESH_URL=1`
 - if landing generation is blocked by UI/runtime constraints, valid Meet URL in system clipboard is used as fallback

5.2 Google Meet scenario choice (must follow test intent):
- `lobby`:
  - use when validating pre-join behaviors before entering call
  - flow: `meet.google.com/landing` -> `New meeting` -> `Create a meeting for later`
  - command: `pnpm chrome:smoke:live google-meet lobby`
- `meeting`:
  - use when validating in-call behaviors and fast direct session entry
  - flow: `meet.google.com/landing` -> `New meeting` -> `Start an instant meeting`
  - command: `pnpm chrome:smoke:live google-meet meeting`
- `continuation`:
  - use when validating resume-vs-new-session decision prompt
  - flow: same lobby URL with seeded ended session candidate
  - command: `pnpm chrome:smoke:google:continuation`
- do not substitute `meeting` for `lobby` tests; these are different business paths.

5.1 capture startup prompt (`captureStartupBehavior=ask`) during smoke:
- the settings smoke runner auto-handles the consent prompt
- if prompt is not actionable in current DOM state, runner temporarily sets startup behavior to `always` for this run, then restores snapshot

6. Teams/Zoom prejoin and meeting URLs:
- true prejoin/meeting behavior can require account/session context
- when provider URL discovery cannot infer the right page, pass an explicit provider URL from `.secrets/smoke.env`:
  - `TEAMS_URL=\"$TEAMS_URL\" pnpm chrome:smoke:live microsoft-teams lobby`
  - `ZOOM_URL=\"$ZOOM_URL\" pnpm chrome:smoke:live zoom-web lobby`
- if Teams resolves to launcher-only or `about:blank`, treat it as environment/auth gate and rerun with an authenticated `TEAMS_URL`
- if Teams resolves to `chrome-error://chromewebdata/`, treat it as network/auth gate and rerun with authenticated `TEAMS_URL`
- for Zoom meeting creation checks, use provider smoke `zoom-web meeting` which starts from `https://app.zoom.us/wc/home` and triggers `New Meeting`
- Teams smoke auto-handling already includes:
  - long wait window
  - controlled refresh retries
  - auto-click on `Continue on this browser`

6.1 Google continuation prompt runtime smoke:
- run `pnpm chrome:smoke:google:continuation`
- runner seeds an ended session candidate for the same Meet URL, reloads the page, and asserts `session-continuation` prompt appears

## Source Scripts

- [start-windows-chrome-debug.sh](../../../scripts/start-windows-chrome-debug.sh)
- [stop-windows-chrome-debug.sh](../../../scripts/stop-windows-chrome-debug.sh)
- [start-chrome-remote-debug.ps1](../../../scripts/windows/start-chrome-remote-debug.ps1)
- [stop-chrome-remote-debug.ps1](../../../scripts/windows/stop-chrome-remote-debug.ps1)
- [check-cdp.mjs](../../../scripts/manual-smoke/check-cdp.mjs)
- [ensure-cdp-ready.sh](../../../scripts/manual-smoke/ensure-cdp-ready.sh)
- [load-secrets-env.sh](../../../scripts/manual-smoke/load-secrets-env.sh)
- [reload-extension-runtime.mjs](../../../scripts/manual-smoke/reload-extension-runtime.mjs)
- [get-google-meet-url.mjs](../../../scripts/manual-smoke/get-google-meet-url.mjs)
- [smoke-google-meet.sh](../../../scripts/manual-smoke/smoke-google-meet.sh)
- [smoke-google-meet.mjs](../../../scripts/manual-smoke/smoke-google-meet.mjs)
- [smoke-provider.sh](../../../scripts/manual-smoke/smoke-provider.sh)
- [smoke-provider.mjs](../../../scripts/manual-smoke/smoke-provider.mjs)
- [stream-diagnostics-live.mjs](../../../scripts/manual-smoke/stream-diagnostics-live.mjs)
- [smoke-matrix.sh](../../../scripts/manual-smoke/smoke-matrix.sh)
- [check-cdp-windows.sh](../../../scripts/manual-smoke/check-cdp-windows.sh)
- [check-cdp.ps1](../../../scripts/windows/check-cdp.ps1)
- [cdp-doctor.sh](../../../scripts/manual-smoke/cdp-doctor.sh)
- [setup-wsl-cdp-bridge.sh](../../../scripts/manual-smoke/setup-wsl-cdp-bridge.sh)
- [remove-wsl-cdp-bridge.sh](../../../scripts/manual-smoke/remove-wsl-cdp-bridge.sh)
- [setup-wsl-cdp-bridge.ps1](../../../scripts/windows/setup-wsl-cdp-bridge.ps1)
- [remove-wsl-cdp-bridge.ps1](../../../scripts/windows/remove-wsl-cdp-bridge.ps1)
