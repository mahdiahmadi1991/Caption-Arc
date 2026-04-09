# UI I18n Runtime Polish And Smoke

## Goal

Close the remaining follow-up work after the 12-locale restoration:

- make local Chrome smoke startup work from git-ignored secrets
- mitigate locale bundle growth with lazy-loaded non-default catalogs
- add a professional loading state while UI language switches
- keep locale source files readable in UTF-8
- preserve the diagnostics/i18n boundary for logger-only runtime modules

## Tasks

1. Move locale-change rerender wiring out of `entrypoints/content/platform-runtime.ts` and into overlay UI code.
2. Keep locale loading asynchronous for non-default catalogs and ensure page roots show a loading overlay while switching.
3. Update smoke-launch docs to reflect local-only `CHROME_EXECUTABLE` overrides through `.secrets/smoke.env`.
4. Update UI i18n docs to reflect lazy-loaded locale catalogs and loading-state behavior.
5. Run docs, tests, build, and runtime smoke validation.

## Validation

- `pnpm docs:check`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm test:targeted:plan`
- `pnpm build:development`
- `pnpm chrome:debug:reload`
- `pnpm chrome:smoke:meet`
- `pnpm chrome:smoke:provider google-meet lobby`

## Result

- Moved async locale rerender wiring out of `entrypoints/content/platform-runtime.ts` and into `entrypoints/content/overlay/index.ts` so diagnostics/i18n boundaries remain intact.
- Kept `en` eager and non-default locale catalogs lazy-loaded through the shared loader.
- Added loading overlays while localized React roots finish switching locale catalogs.
- Normalized generated locale files to readable UTF-8 text.
- Updated smoke-launch docs so git-ignored `.secrets/smoke.env` can hold `CHROME_EXECUTABLE` and `CHROME_RUNTIME_MODE`.

## Validation Outcome

- `pnpm docs:check`: passed
- `pnpm test:google`: passed
- `pnpm test:google:coverage`: passed
- `pnpm test:targeted:plan`: passed
- `pnpm build:development`: passed
- `pnpm build`: passed
- `pnpm chrome:debug:reload`: launcher succeeded after fixing local secret quoting and relaxing runtime mode to `auto`
- `pnpm chrome:smoke:meet`: blocked by Chrome exposing no active CaptionArc runtime target with `chrome.runtime.*` available
- `pnpm chrome:smoke:provider google-meet lobby`: blocked by the same runtime-target issue
- Direct CDP inspection confirmed the apparent extension page target resolves to `chrome-error://chromewebdata/`, so the current browser session is not mounting the unpacked extension runtime even though the extension card is visible in `chrome://extensions/`

## Follow-Up

- The local Chrome/CDP setup is now reachable and local-only path configuration works, but the current browser session still fails to expose a usable extension runtime target for scripted smoke. The next runtime-focused pass should inspect the Chrome launch profile or extension auto-load behavior rather than the i18n implementation.
