# Testing Runtime Docs

Testing completion gate:

- [../testing-quality-gate.md](../testing-quality-gate.md)

## Documents

1. [agent-onboarding-cdp-runtime.md](./agent-onboarding-cdp-runtime.md)
- mandatory onboarding for runtime-sensitive agent threads

2. [wsl-windows-chrome-cdp-quickstart.md](../../setup/wsl-windows-chrome-cdp-quickstart.md)
- fast command-oriented quickstart for WSL + Windows Chrome CDP setup

3. [google-meet-automation-traceability-matrix.md](./google-meet-automation-traceability-matrix.md)
- Google Meet contract-to-test mapping

4. [runtime-session-continuation-traceability-matrix.md](./runtime-session-continuation-traceability-matrix.md)
- runtime/session-continuation contract-to-test mapping

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
pnpm chrome:smoke:live <provider> <scenario>
pnpm chrome:smoke:live:fresh <provider> <scenario>
pnpm chrome:smoke:live:google:settings <scenario>
pnpm chrome:smoke:live:matrix [cases]
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
pnpm chrome:debug:bridge:setup
pnpm chrome:debug:bridge:show
pnpm chrome:debug:bridge:remove
```
