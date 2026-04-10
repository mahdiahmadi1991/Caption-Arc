# DLS End-To-End Extension Demo Scenario

## Purpose

Provide one canonical **Deterministic Live Smoke (DLS)** flow that demonstrates the extension lifecycle from installation to meeting exit, with a mandatory repository-owner visual approval checkpoint.

## Scope

- extension build and load readiness
- provider entry and in-meeting runtime behavior
- session continuation/ended behavior
- meeting exit behavior
- owner visual approval checkpoint before closure

## Preconditions

- Chrome CDP runtime is available (`pnpm chrome:debug:check`)
- extension development build is loaded in Chrome
- test account can enter the target meeting provider flow
- deterministic mode is enabled through DLS commands (`DETERMINISTIC_TEST_MODE=1` already baked into `chrome:smoke:live*`)

## Canonical Scenario (Install -> Exit)

1. Build and prepare runtime artifacts:
   - `pnpm build:chrome:development`
   - `pnpm build:firefox:development`
2. Reload extension runtime in Chrome:
   - `pnpm chrome:debug:reload`
3. Run provider DLS scenario:
   - `pnpm chrome:smoke:live google-meet continuation`
4. Validate in-flow checkpoints during run:
   - provider detection and routing
   - overlay mount and readiness state
   - live caption/chat handling
   - session continuation prompt behavior
   - session end prompt behavior
   - clean teardown after exit
5. Record diagnostics evidence if needed:
   - `pnpm chrome:debug:diagnostics:get` (or stream during run)

## Mandatory Owner Approval Checkpoint

The run is **not complete** after command success alone.

Completion requires all of the following:

- repository owner watches the live DLS execution (or recording made from the same run)
- repository owner confirms observed behavior matches expected lifecycle checkpoints
- no blocking runtime errors appear in the DLS output
- owner gives explicit in-thread approval

Only after this checkpoint can the DLS validation be marked done in DoD.

## Optional Cross-Browser Follow-Up

Until canonical Firefox runtime automation exists, collect Firefox evidence using:

- `docs/quality/firefox-manual-verification-checklist.md`
