# WSL To Windows Chrome CDP Quickstart

## Purpose

This guide provides a fast, repeatable way to run Windows Chrome with remote debugging from WSL so manual testing and smoke validation can run against a real extension runtime.

Canonical runtime smoke convention:

- `Deterministic Live Smoke (DLS)`
- command shape: `pnpm chrome:smoke:live <provider> <scenario>`

Owner approval gate:

- DLS completion requires repository-owner visual review and explicit in-thread approval
- without explicit owner approval, smoke evidence remains `pending-owner-review`

## Preconditions

1. Project dependencies installed.
2. Chromium extension build exists. For Codex-led debugging, prefer `.release/v<version>/development/chrome` by default.
3. You are running commands from WSL.
4. Optional but recommended: create `.secrets/smoke.env` from `.secrets/.env.example`.

## Important Shell Rule

Run `pnpm ...` commands from a WSL shell, not from Windows PowerShell on a UNC path like `\\wsl.localhost\...`.

If you are currently in Windows PowerShell, run commands through WSL explicitly:

```powershell
wsl -d Ubuntu-24.04 bash -lc "cd <repo-root> && pnpm chrome:debug:doctor"
```

## Local Secrets (Recommended)

Store runtime test secrets in:

- `.secrets/smoke.env` (local only, git-ignored)

Template:

- `.secrets/.env.example`

Smoke wrappers auto-load this file. If it contains `OPENAI_API_KEY`, it is mapped to `SMOKE_OPENAI_API_KEY` automatically.
`pnpm chrome:debug` and `scripts/start-windows-chrome-debug.sh` also load this file.
In deterministic mode (`DETERMINISTIC_TEST_MODE=1`, default), runtime path is forced to a stable single path (`system-only` + `auto` extension load), so runtime fallback env overrides are ignored.

For policy and security rules, see [local-smoke-secrets.md](./local-smoke-secrets.md).

Quick check:

```bash
pnpm chrome:secrets:check
```

## Build And Reload Model (Current Default)

Codex debug rule:

1. for normal agent-led UI debugging, build `development`
2. only use `production` when the task explicitly needs production packaging behavior
3. never run build and extension reload in parallel
4. required order is: build -> confirm success -> reload runtime

Preferred debug build command:

```bash
pnpm build:target:chrome:development
```

Smoke wrappers now run in stability mode by default:

1. run `pnpm build:target:chrome:development`
2. sync build output to `%LOCALAPPDATA%\CaptionArc\extension\development`
3. if debug Chrome is already running, reload CaptionArc runtime in-place
4. if in-place reload is inconclusive, restart runtime in the same deterministic path (`RELOAD_EXTENSION_STRICT=1` in deterministic mode)

Manual command for in-place runtime reload after a successful build:

```bash
pnpm chrome:debug:reload-extension
```

## Fast Launch (Recommended)

Start Windows Chrome from WSL with a dedicated debug profile and extension loaded:

```bash
pnpm chrome:debug
```

If Chrome is not already running in remote-debug mode and you need the equivalent manual Windows launch command, use a placeholder user profile path in docs and examples:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\<windows-user>\.google\ChromeDebugProfile"
```

Keep the `<windows-user>` segment as a placeholder in committed documentation.

For explicit `reload` semantics (same behavior, clearer intent):

```bash
pnpm chrome:debug:reload
```

Default behavior:

- remote debugging port: `9222`
- isolated profile: `%LOCALAPPDATA%\CaptionArc\chrome-cdp-profile`
- extension source path: `.release/v<version>/development/chrome`
- extension staged path (Windows local): `%LOCALAPPDATA%\CaptionArc\extension\development`
- extension load mode: `auto` (command-line load)
- chrome runtime mode: `system-only` (use Windows Google Chrome directly)
- deterministic mode: enabled (`DETERMINISTIC_TEST_MODE=1`)
- launch policy: reuse the existing healthy debug instance first when the expected CDP port is already live; do not open a second Chrome debug browser on top of an already-running debug session

For Codex validation work, treat this development artifact as the default choice unless the user explicitly asks for production packaging behavior.

Launch behavior is intentionally single-path and deterministic in this repository.
Do not use alternative runtime/load fallback modes for acceptance flows.
The canonical runtime is the user-owned Windows Google Chrome installation launched with remote debugging enabled.

If extension card is not visible in `chrome://extensions`, relaunch with deterministic defaults:

```bash
pnpm chrome:debug
pnpm chrome:debug:doctor
```

## Optional Custom Launch

Use custom port, start URL, and remote debugging address:

```bash
bash ./scripts/start-windows-chrome-debug.sh 9333 "https://meet.google.com/" "0.0.0.0"
```

## Verify CDP Readiness

```bash
pnpm chrome:debug:doctor
```

Auto-heal and ensure CDP is ready (recommended before scripted smoke):

```bash
pnpm chrome:debug:ensure
```

or run explicit checks:

```bash
pnpm chrome:debug:check
pnpm chrome:debug:check:windows
```

Expected output includes:

- direct WSL mode status
- Windows local mode status
- browser/protocol info
- target counts
- extension service worker detection

## Practical Daily Loop

1. Run `pnpm chrome:debug:doctor`.
2. Run smoke (stage + runtime reload are automatic; rebuild is opt-in):
- `pnpm chrome:smoke:meet`
 - `pnpm chrome:smoke:live <provider> <scenario>`
 - `pnpm chrome:smoke:live:google:settings <scenario>`
 - `pnpm chrome:smoke:live:matrix`
3. Execute manual scenario matrix from:
- [provider-qa-baseline.md](../archive/feature-plans/provider-qa-baseline.md)
4. Capture notes/screenshots for failures.

`chrome:smoke:meet` behavior:

1. reloads Chrome debug runtime (unless `RELOAD_RUNTIME=0`)
2. verifies CDP health
3. resolves a valid Meet URL strategy (strict by default):
- existing Meet tab if available
- for lobby-oriented checks: generated from `https://meet.google.com/landing` via:
  - `New meeting`
  - `Create a meeting for later`
- for meeting-oriented checks (no-lobby): generated from `https://meet.google.com/landing` via:
  - `New meeting`
  - `Start an instant meeting`
- if no real URL is produced, smoke fails with guidance (no synthetic placeholder URL)
4. verifies content-script injection marker on final page
5. uses deterministic runtime path (`system-only` + `auto` extension load) without manual-mode fallback hopping

`chrome:smoke:live` behavior:

1. supports all providers: `google-meet`, `microsoft-teams`, `zoom-web`
2. supports scenarios: `lobby` (`prejoin`), `meeting` (`in-meeting`), and `continuation`
3. uses existing build by default for speed; stages extension to `%LOCALAPPDATA%\CaptionArc\extension\development`, reloads extension runtime, then runs CDP check
4. forced rebuild is opt-in with `AUTO_BUILD_EXTENSION_ALWAYS=1` (or `pnpm chrome:smoke:live:fresh`)
4. deterministic mode keeps a single runtime path (no manual extension-mode rerun)
5. allows explicit real URLs:
- `SMOKE_URL` (global override)
- `GOOGLE_MEET_URL`
- `TEAMS_URL`
- `ZOOM_URL`
6. default execution is now human-observable:
- single-tab reuse (`SMOKE_SINGLE_TAB=1`)
- step-by-step pacing (`SMOKE_STEP_MODE=1`, `SMOKE_STEP_PAUSE_MS=700`)
 - live diagnostics stream in same terminal (`SMOKE_LIVE_DIAGNOSTICS=1`)
7. Google continuation scenario auto-seeds an ended session for the same meeting URL and asserts `session-continuation` prompt appears
8. Google Meet URL orchestration:
- `lobby` / `continuation`: `meet.google.com/landing` -> `New meeting` -> `Create a meeting for later`
- `meeting` (no-lobby): `meet.google.com/landing` -> `New meeting` -> `Start an instant meeting`

DLS alias behavior:

- `chrome:smoke:live*` enforces deterministic mode + live diagnostics by default for acceptance evidence
- `chrome:smoke:live*` is the canonical acceptance path; avoid raw provider wrappers unless debugging harness internals

Google Meet scenario selection (important):

1. Use `lobby` when you need pre-join behaviors before entering the call:
- expected runtime state: pre-join/lobby first, then join manually
- command: `pnpm chrome:smoke:live google-meet lobby`

2. Use `meeting` when you need in-call behaviors and want fast entry:
- expected runtime state: direct session creation via instant meeting flow
- command: `pnpm chrome:smoke:live google-meet meeting`

3. Use `continuation` when you need resume-vs-new-session prompt validation:
- expected runtime state: continuation prompt (`session-continuation`) on the same meeting URL
- command: `pnpm chrome:smoke:google:continuation`

Google helper commands:

```bash
pnpm chrome:meet:url          # meeting URL helper
pnpm chrome:meet:url:lobby    # lobby URL helper via landing flow
pnpm chrome:seed:google:continuation "$GOOGLE_MEET_URL"
```

Google overlay settings smoke (visual + asserted):

```bash
pnpm chrome:smoke:google:settings meeting
```

Behavior:

1. opens/targets a Google Meet page in debug Chrome
2. finds CaptionArc extension runtime target via CDP (and auto-opens extension UI target if only worker target is available)
3. applies settings patches (`appearance`, `overlayOpacity`, `overlayVisible`, `overlayClickThrough`, `translationEnabled`, `storeMeetingChat`)
4. validates overlay DOM state after each patch
5. restores original settings snapshot at the end
6. if startup prompt is visible (`capture-consent`, `session-continuation`, or `session-ended`), the runner resolves it before continuing
7. unresolved blocking prompts fail the run by default (`SMOKE_REQUIRE_PROMPT_RESOLUTION=1`); bypass is opt-in (`SMOKE_ALLOW_PROMPT_BYPASS=1`)
8. if `SMOKE_OPENAI_API_KEY` (or `OPENAI_API_KEY`) is available from secrets env, the runner patches `openaiApiKey` before assertions and restores snapshot at the end

This run is visible in the active Chrome debug profile while also producing pass/fail checks in terminal.

Single-tab and step mode tuning:

```bash
SMOKE_SINGLE_TAB=1 SMOKE_STEP_MODE=1 SMOKE_STEP_PAUSE_MS=1500 pnpm chrome:smoke:google:settings meeting
```

Prompt action tuning:

```bash
SMOKE_CAPTURE_PROMPT_ACTION=approve SMOKE_CONTINUATION_PROMPT_ACTION=restart pnpm chrome:smoke:google:settings lobby
```

Live diagnostics stream tuning (same console as smoke run):

```bash
SMOKE_LIVE_DIAGNOSTICS=1 \
SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL=debug \
SMOKE_LIVE_DIAGNOSTICS_POLL_MS=450 \
SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA=1 \
pnpm chrome:smoke:live google-meet meeting
```

Standalone live stream (without running smoke):

```bash
pnpm chrome:debug:diagnostics:stream
```

Build vs smoke separation:

```bash
pnpm build:extension                         # build the Chromium production target only
pnpm chrome:smoke:live google-meet lobby # smoke using current build (fast path)
pnpm chrome:smoke:live:fresh google-meet lobby # force rebuild + smoke
pnpm chrome:smoke:google:continuation              # continuation prompt smoke
```

Targeted execution (avoid full matrix by default):

```bash
pnpm test:targeted:plan
pnpm test:targeted:run
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
pnpm chrome:smoke:live:matrix google-meet:lobby,google-meet:meeting
SMOKE_CASES=\"google-meet:lobby,zoom-web:meeting\" pnpm chrome:smoke:live:matrix
```

Disable paced mode for faster runs:

```bash
SMOKE_STEP_MODE=0 pnpm chrome:smoke:live google-meet meeting
```

Force fresh Google Meet URL generation (ignore existing Meet tabs):

```bash
GOOGLE_MEET_REQUIRE_FRESH_URL=1 pnpm chrome:smoke:live google-meet lobby
```

Provider-specific defaults:

1. Google Meet:
- `lobby` flow uses landing page orchestration (`/landing` -> `New meeting` -> `Create a meeting for later`)
- `meeting` flow prefers landing instant flow (`/landing` -> `New meeting` -> `Start an instant meeting`)
- choose flow by test intent, not only by speed:
  - lifecycle/prompt/lobby checks -> `lobby` or `continuation`
  - in-session/active overlay checks -> `meeting`
- fresh URL mode (`GOOGLE_MEET_REQUIRE_FRESH_URL=1`) tries, in order:
  - landing generated link from dialog/copy
  - newly created Meet target detection
  - system clipboard fallback (`meet-system-clipboard-fallback`) if it contains a valid Meet URL

2. Microsoft Teams:
- the smoke runner now applies Teams reliability handling automatically:
  - longer wait window
  - controlled auto-refresh retries
  - auto-click for `Continue on this browser` when visible
- Teams lobby/meeting runs should use `TEAMS_URL` from `.secrets/smoke.env` unless an authenticated Teams target is already open in the debug session

3. Zoom Web:
- `meeting` flow tries `https://app.zoom.us/wc/home` then clicks `New Meeting`
- `lobby` flow prefers explicit `ZOOM_URL` from a created meeting

Examples:

```bash
pnpm chrome:smoke:live google-meet lobby
pnpm chrome:smoke:live zoom-web meeting
TEAMS_URL="$TEAMS_URL" pnpm chrome:smoke:live microsoft-teams lobby
ZOOM_URL="$ZOOM_URL" pnpm chrome:smoke:live zoom-web lobby
```

## Stop Debug Chrome

```bash
pnpm chrome:debug:stop
```

## Agent Onboarding Reference

For cross-thread agent onboarding rules and mandatory runtime usage, see:

- [agent-onboarding-cdp-runtime.md](../quality/references/agent-onboarding-cdp-runtime.md)

## Notes

1. Use this dedicated Chrome profile for testing only.
2. Keep personal browsing in your normal Chrome profile.
3. Prefer `pnpm chrome:debug:reload` before each smoke iteration to avoid stale extension state.
4. If the extension service worker is not listed, open extension popup/options once and run the CDP check again.
5. If service worker stays `0`, open `chrome://extensions` in the debug profile and verify CaptionArc is actually loaded.
6. Teams smoke can be inconclusive without an authenticated prejoin URL. If final URL becomes `about:blank` or launcher-only page, rerun with `TEAMS_URL` from a real Teams prejoin/join tab in the same debug profile.
7. If Teams ends on `chrome-error://chromewebdata/`, treat it as network/auth/environment gate and rerun with an authenticated `TEAMS_URL`.

Disable auto build/reload for a single run (advanced):

```bash
AUTO_BUILD_EXTENSION_ALWAYS=0 RELOAD_EXTENSION_IF_RUNNING=0 pnpm chrome:smoke:live google-meet meeting
```

Teams tuning env vars (optional):

```bash
SMOKE_TEAMS_LOAD_TIMEOUT_MS=70000 \
SMOKE_TEAMS_MAX_RELOADS=5 \
SMOKE_TEAMS_RELOAD_AFTER_MS=12000 \
pnpm chrome:smoke:live microsoft-teams lobby
```

## Enable WSL Direct Mode (Optional, Admin Required)

If doctor reports `Windows-only CDP mode`, set up a Windows port bridge once:

```bash
pnpm chrome:debug:bridge:setup
```

Equivalent command from Windows PowerShell:

```powershell
wsl -d Ubuntu-24.04 bash -lc "cd <repo-root> && pnpm chrome:debug:bridge:setup"
```

After setup:

```bash
pnpm chrome:debug:bridge:show
pnpm chrome:debug:doctor
```

`chrome:debug:bridge:show` should include a portproxy entry for bridge port `9223`.

To remove bridge configuration:

```bash
pnpm chrome:debug:bridge:remove
```

## Related Scripts

- [start-windows-chrome-debug.sh](../../scripts/start-windows-chrome-debug.sh)
- [stop-windows-chrome-debug.sh](../../scripts/stop-windows-chrome-debug.sh)
- [start-chrome-remote-debug.ps1](../../scripts/windows/start-chrome-remote-debug.ps1)
- [stop-chrome-remote-debug.ps1](../../scripts/windows/stop-chrome-remote-debug.ps1)
- [check-cdp.mjs](../../scripts/manual-smoke/check-cdp.mjs)
- [ensure-cdp-ready.sh](../../scripts/manual-smoke/ensure-cdp-ready.sh)
- [get-google-meet-url.mjs](../../scripts/manual-smoke/get-google-meet-url.mjs)
- [smoke-google-meet.sh](../../scripts/manual-smoke/smoke-google-meet.sh)
- [smoke-google-meet.mjs](../../scripts/manual-smoke/smoke-google-meet.mjs)
- [smoke-provider.sh](../../scripts/manual-smoke/smoke-provider.sh)
- [smoke-provider.mjs](../../scripts/manual-smoke/smoke-provider.mjs)
- [smoke-google-overlay-settings.sh](../../scripts/manual-smoke/smoke-google-overlay-settings.sh)
- [smoke-google-overlay-settings.mjs](../../scripts/manual-smoke/smoke-google-overlay-settings.mjs)
- [stream-diagnostics-live.mjs](../../scripts/manual-smoke/stream-diagnostics-live.mjs)
- [smoke-matrix.sh](../../scripts/manual-smoke/smoke-matrix.sh)
- [check-cdp-windows.sh](../../scripts/manual-smoke/check-cdp-windows.sh)
- [check-cdp.ps1](../../scripts/windows/check-cdp.ps1)
- [cdp-doctor.sh](../../scripts/manual-smoke/cdp-doctor.sh)
- [setup-wsl-cdp-bridge.sh](../../scripts/manual-smoke/setup-wsl-cdp-bridge.sh)
- [remove-wsl-cdp-bridge.sh](../../scripts/manual-smoke/remove-wsl-cdp-bridge.sh)
- [setup-wsl-cdp-bridge.ps1](../../scripts/windows/setup-wsl-cdp-bridge.ps1)
- [remove-wsl-cdp-bridge.ps1](../../scripts/windows/remove-wsl-cdp-bridge.ps1)
Smoke commands now auto-heal CDP by default:

1. check CDP from WSL
2. if unavailable, auto-start Windows Chrome debug runtime
3. enforce deterministic runtime path (`system-only` + `auto` extension load)
4. rerun CDP checks and continue smoke

This means manual `pnpm chrome:debug` is usually not required.

Extension runtime targeting is also automated:

1. launch script caches resolved extension ID at:
 - `%LOCALAPPDATA%\\CaptionArc\\chrome-cdp-extension-id.txt`
2. overlay-settings smoke uses cached ID (and deterministic discovery) to open extension UI target automatically.

For direct Windows Chrome data access and read-only storage inspection from WSL, use:

- [windows-chrome-extension-data-access.md](./windows-chrome-extension-data-access.md)
