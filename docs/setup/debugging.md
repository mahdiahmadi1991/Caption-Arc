# Debugging

## Runtime Debug Commands

```bash
pnpm chrome:debug
pnpm chrome:debug:reload
pnpm chrome:debug:stop
pnpm chrome:debug:doctor
pnpm chrome:debug:check
pnpm chrome:debug:check:windows
pnpm chrome:debug:diagnostics
pnpm chrome:debug:diagnostics:enable
pnpm chrome:debug:diagnostics:disable
pnpm chrome:debug:diagnostics:clear
```

Diagnostics notes:

- development sessions default to the diagnostics threshold defined in `entrypoints/shared/environment/development.ts`
- production sessions default to the diagnostics threshold defined in `entrypoints/shared/environment/production.ts`, which remains `off` unless intentionally raised
- the options diagnostics console is also controlled per environment through `diagnostics.viewerEnabled` in those environment config files
- `chrome:debug:diagnostics:enable` and `chrome:debug:diagnostics:disable` act as temporary runtime overrides for the current debug session
- agents can query logs directly through the extension runtime during CDP sessions; user-managed file export is not the primary workflow
- the options diagnostics console exposes the same canonical stream with client-side multi-select level filters, summary-aware search, copy-visible export, and session-scoped enable or disable controls
- the drawer auto-polls silently only while open and visible, and only meaningful payload changes trigger viewer state updates
- while the drawer is open it traps its own scrolling, keeps a fixed viewport-based height, and continues to show the raw canonical event key alongside richer human-readable titles and summaries
- production still starts with diagnostics capture disabled even though the viewer remains available

## Environment Build Commands

```bash
pnpm build:chrome:development
pnpm build:chrome:production
pnpm build:firefox:development
pnpm build:firefox:production
pnpm zip:chrome:production
pnpm zip:firefox:production
```

Build notes:

- `pnpm build` and `pnpm zip` now resolve to the all-browser production flow
- `pnpm build:extension` remains the Chrome production alias used by Chrome runtime tooling
- build artifacts now coexist under `.release/chrome/<mode>` and `.release/firefox/<mode>` so browser and environment builds do not overwrite each other
- Chrome debug and smoke scripts default to `.release/chrome/production` unless `EXTENSION_DIR` is overridden explicitly
- production builds use the production environment diagnostics policy, so captured diagnostics stay off unless the production environment config is intentionally changed

## Smoke Commands

```bash
pnpm chrome:meet:url
pnpm chrome:smoke:meet
pnpm chrome:smoke:live <provider> <scenario>
pnpm chrome:smoke:live:matrix
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
```

DLS acceptance note:

- each DLS run must be visually reviewed and explicitly approved by the repository owner before the task can be marked done

## Detailed Runtime Guides

- [../quality/references/agent-onboarding-cdp-runtime.md](../quality/references/agent-onboarding-cdp-runtime.md)
- [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md)
- [wsl-windows-chrome-cdp-quickstart.md](./wsl-windows-chrome-cdp-quickstart.md)

Chrome debug and smoke automation remain the canonical automated runtime workflow. Until Firefox runtime automation is added, runtime-sensitive changes must load the Firefox artifact manually and record evidence with [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md).
