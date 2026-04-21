# Testing Runtime Docs

Testing completion gate:

- [../testing-quality-gate.md](../testing-quality-gate.md)
- DLS acceptance requires repository-owner visual review and explicit approval in-thread before completion is recognized

## Documents

- [agent-onboarding-cdp-runtime.md](./agent-onboarding-cdp-runtime.md)
  mandatory onboarding for runtime-sensitive agent threads

- [wsl-windows-chrome-cdp-quickstart.md](../../setup/wsl-windows-chrome-cdp-quickstart.md)
  fast command-oriented quickstart for WSL + the user-owned Windows Chrome CDP setup

- [dls-end-to-end-extension-demo-scenario.md](./dls-end-to-end-extension-demo-scenario.md)
  canonical install-to-exit DLS demo flow with mandatory owner approval checkpoint

- [google-meet-automation-traceability-matrix.md](./google-meet-automation-traceability-matrix.md)
  Google Meet contract-to-test mapping

- [provider-routing-traceability-matrix.md](./provider-routing-traceability-matrix.md)
  provider routing contract-to-test mapping

- [microsoft-teams-traceability-matrix.md](./microsoft-teams-traceability-matrix.md)
  Microsoft Teams provider contract-to-test mapping

- [zoom-web-traceability-matrix.md](./zoom-web-traceability-matrix.md)
  Zoom Web provider contract-to-test mapping

- [runtime-lifecycle-traceability-matrix.md](./runtime-lifecycle-traceability-matrix.md)
  runtime lifecycle contract-to-test mapping

- [runtime-prompts-traceability-matrix.md](./runtime-prompts-traceability-matrix.md)
  runtime prompts contract-to-test mapping

- [runtime-session-continuation-traceability-matrix.md](./runtime-session-continuation-traceability-matrix.md)
  runtime/session-continuation contract-to-test mapping

- [meeting-session-model-traceability-matrix.md](./meeting-session-model-traceability-matrix.md)
  meeting-session model contract-to-test mapping

- [event-ingestion-traceability-matrix.md](./event-ingestion-traceability-matrix.md)
  event-ingestion contract-to-test mapping

- [overlay-traceability-matrix.md](./overlay-traceability-matrix.md)
  overlay contract-to-test mapping

- [assistant-runtime-traceability-matrix.md](./assistant-runtime-traceability-matrix.md)
  assistant-runtime contract-to-test mapping

- [meeting-summary-pipeline-traceability-matrix.md](./meeting-summary-pipeline-traceability-matrix.md)
  meeting-summary pipeline contract-to-test mapping

- [translation-pipeline-traceability-matrix.md](./translation-pipeline-traceability-matrix.md)
  translation pipeline contract-to-test mapping

- [cloud-sync-traceability-matrix.md](./cloud-sync-traceability-matrix.md)
  cloud-sync contract-to-test mapping

- [diagnostics-traceability-matrix.md](./diagnostics-traceability-matrix.md)
  diagnostics contract-to-test mapping

- [settings-and-readiness-traceability-matrix.md](./settings-and-readiness-traceability-matrix.md)
  settings and readiness contract-to-test mapping

- [data-transfer-traceability-matrix.md](./data-transfer-traceability-matrix.md)
  data-transfer contract-to-test mapping

- [browser-capabilities-traceability-matrix.md](./browser-capabilities-traceability-matrix.md)
  browser-capabilities contract-to-test mapping

## Command Summary

```bash
# Reload runtime (recommended before each smoke run)
pnpm chrome:debug:reload
pnpm chrome:debug
pnpm chrome:debug:stop
pnpm chrome:debug:doctor
pnpm chrome:debug:check
pnpm chrome:debug:check:windows
pnpm chrome:meet:url
pnpm chrome:meet:url:lobby
pnpm chrome:smoke:meet
pnpm chrome:smoke:meet:raw
pnpm chrome:smoke:assistant <scenario>
pnpm chrome:smoke:assistant:fresh <scenario>
pnpm chrome:smoke:live <provider> <scenario>
pnpm chrome:smoke:live:assistant <scenario>
pnpm chrome:smoke:live:assistant:matrix
pnpm chrome:smoke:live:fresh <provider> <scenario>
pnpm chrome:smoke:live:google:settings <scenario>
pnpm chrome:smoke:live:matrix [cases]
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
pnpm chrome:debug:bridge:setup
pnpm chrome:debug:bridge:show
pnpm chrome:debug:bridge:remove
```

## Windows Debug Launch Note

When runtime docs need to show the manual Windows Chrome remote-debug launch command, keep the user profile path sanitized. Use:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\<windows-user>\.google\ChromeDebugProfile"
```

Do not commit a real Windows username or machine-specific profile path.

Runtime launch policy:

- if the expected Windows Chrome debug instance is already running and CDP is healthy, reuse it
- do not spawn a second debug browser instance on top of the existing one
- only relaunch when the existing instance for the expected profile is stale or CDP is unavailable

Extension error audit policy:

- every DLS run must inspect CaptionArc errors from `chrome://extensions`
- pre-existing errors must be captured and then cleared before the scenario continues
- post-run errors must also be captured and cleared
- newly introduced post-run errors are blocking until classified and fixed or explicitly owner-approved as an environment artifact
