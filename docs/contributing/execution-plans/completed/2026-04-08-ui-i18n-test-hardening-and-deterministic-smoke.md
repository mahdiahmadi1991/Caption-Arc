# UI I18n Test Hardening And Deterministic Smoke

## Purpose

Bring the UI i18n follow-up work to the updated testing Definition of Done by adding missing regression coverage and aligning smoke launcher behavior with the new deterministic testing rules.

## Scope

- add contract coverage for `entrypoints/shared/i18n/runtime.ts`
- add regression coverage for `scripts/manual-smoke/load-secrets-env.sh`
- add regression coverage for deterministic launch behavior in `scripts/start-windows-chrome-debug.sh`
- align launcher behavior with the new deterministic smoke documentation
- rerun required tests and smoke commands

## Non-Goals

- redesign the broader smoke harness
- change provider smoke scenarios beyond what is required to honor deterministic launch rules

## Verification

- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm chrome:debug:reload`
- `DETERMINISTIC_TEST_MODE=1 pnpm chrome:debug:reload`
- `DETERMINISTIC_TEST_MODE=1 pnpm chrome:smoke:meet`
- `pnpm chrome:smoke:provider google-meet lobby`
- `pnpm chrome:smoke:provider google-meet meeting`
- `pnpm chrome:smoke:google:settings meeting`

## Outcome

- Added direct runtime contract coverage for `entrypoints/shared/i18n/runtime.ts`:
  - locale attribute application
  - persisted locale resolution
  - browser-locale fallback on settings lookup failure
  - listener notification and unsubscribe guards
- Added smoke-launch regression coverage for:
  - quoted secret values with spaces in `load-secrets-env.sh`
  - preserving an explicit `SMOKE_OPENAI_API_KEY`
  - forwarding local launch overrides outside deterministic mode
  - ignoring those overrides in deterministic mode
- Updated `scripts/start-windows-chrome-debug.sh` so deterministic runs force the documented stable path:
  - `EXTENSION_LOAD_MODE=auto`
  - `CHROME_RUNTIME_MODE=cft-only`
  - `CHROME_EXECUTABLE` cleared
  - `AUTO_PROVISION_CFT=1`

## Verification Results

- `pnpm test:google`: passed
- `pnpm test:google:coverage`: passed
- `pnpm test:targeted:plan`: passed
- `pnpm docs:check`: passed
- `pnpm chrome:debug:reload`: passed after Windows-side staging was hardened
- `DETERMINISTIC_TEST_MODE=1 pnpm chrome:debug:reload`: passed
- `pnpm chrome:smoke:provider google-meet lobby`: passed
- `pnpm chrome:smoke:provider google-meet meeting`: passed
- `pnpm chrome:smoke:google:settings meeting`: passed
- `DETERMINISTIC_TEST_MODE=1 pnpm chrome:smoke:meet`: passed

## Earlier Failure Classification

- Smoke/runtime failures in this pass classify as `environment`
- Key evidence:
  - `Remove-Item : Cannot remove item ... extension\\production: The directory is not empty.`
  - `No reachable CDP endpoint found ...`

## Resolution

- Updated Windows-side extension staging to use mirror-copy semantics instead of delete-then-copy against the active extension directory
- Updated WSL-side CDP readiness sync to prefer Windows-native staging when the staged extension lives under `/mnt/*`
- Added regression coverage so deterministic runs ignore local runtime override secrets and keep the documented `cft-only + auto` path
- Re-ran the smoke flow sequentially and deterministically, which closed the environment-only failures seen earlier

## Follow-Up

- The current module-level DoD is satisfied for UI i18n runtime and its smoke harness.
- Any future runtime smoke failures should first be classified against the hardened staging/CDP path before treating them as product regressions.
