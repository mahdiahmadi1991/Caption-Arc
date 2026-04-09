# UI I18n DLS And Diagnostics

## Purpose

Close the remaining Definition of Done gap for the UI localization module by adding dedicated Deterministic Live Smoke (DLS) coverage for locale switching and by strengthening i18n diagnostics coverage where runtime behavior would otherwise be opaque.

## Scope

- add structured diagnostics for localization runtime transitions where the current module is under-instrumented
- add a dedicated DLS smoke flow for UI language switching
- verify locale switching across the key shipped surfaces that depend on shared i18n runtime behavior
- add focused contract coverage for the new localization smoke and diagnostics behavior
- run the required contract, coverage, targeted, and DLS validation commands

## Non-Goals

- redesign the broader diagnostics architecture
- rewrite locale catalogs
- expand smoke coverage for unrelated provider behavior outside what is needed for i18n acceptance

## Verification

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `DETERMINISTIC_TEST_MODE=1 pnpm chrome:smoke:live google-meet meeting`
- `DETERMINISTIC_TEST_MODE=1 pnpm chrome:smoke:live:i18n google-meet meeting`

## Notes

- The repository already has generic DLS commands, but the localization module does not yet have a dedicated DLS acceptance flow that proves a persisted `uiLanguage` change propagates correctly through shipped UI surfaces.
- Logging changes in this pass must keep diagnostics English-only and use structured event names.

## Outcomes

- added structured `ui-i18n` diagnostics in shared runtime so locale transitions emit `trace`, `debug`, `info`, `warn`, and `error` events through the canonical diagnostics pipeline
- added dedicated localization DLS scripts and package commands:
  - `pnpm chrome:smoke:i18n`
  - `pnpm chrome:smoke:i18n:fresh`
  - `pnpm chrome:smoke:live:i18n`
- added focused contract coverage for i18n diagnostics and runtime behavior:
  - `tests/google-meet/i18n-diagnostics.contract.test.ts`
  - `tests/google-meet/i18n-runtime.contract.test.ts`
  - `tests/google-meet/manual-smoke-launch.contract.test.ts`
- fixed a diagnostics boundary regression by removing direct shared i18n imports from `entrypoints/content/platform-runtime.ts`
- verified localization DLS end to end for `google-meet meeting`, including locale switching across options, popup, meeting history, and overlay surfaces

## Final Verification

- `pnpm test:google` -> pass
- `pnpm test:google:coverage` -> pass
- `pnpm test:targeted:plan` -> pass
- `pnpm docs:check` -> pass
- `pnpm build:development` -> pass
- `pnpm chrome:debug:reload` -> pass
- `pnpm chrome:smoke:provider google-meet lobby` -> pass
- `pnpm chrome:smoke:google:settings lobby` -> pass
- `pnpm chrome:smoke:provider google-meet meeting` -> pass
- `pnpm chrome:smoke:live:i18n google-meet meeting` -> pass
