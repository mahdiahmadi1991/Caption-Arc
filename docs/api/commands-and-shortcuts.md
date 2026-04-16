# Commands And Shortcuts

## Development Commands

```bash
pnpm dev
pnpm build
pnpm build:development
pnpm build:production
pnpm build:target:chrome:development
pnpm build:target:chrome:production
pnpm build:target:firefox:development
pnpm build:target:firefox:production
pnpm build:chrome:development
pnpm build:chrome:production
pnpm build:firefox:development
pnpm build:firefox:production
pnpm build:all:development
pnpm build:all:production
pnpm build:extension
pnpm package
pnpm package:production
pnpm package:target:chrome
pnpm package:target:firefox
pnpm zip
pnpm zip:production
pnpm zip:chrome:production
pnpm zip:firefox:production
pnpm zip:all:production
pnpm release:validate
pnpm release:prepare
pnpm release:publish
```

Alias notes:

- canonical target commands are `build:target:chrome:*`, `build:target:firefox:*`, `package:target:chrome`, and `package:target:firefox`
- `pnpm build` -> `pnpm build:targets:production`
- `pnpm build:development` -> `pnpm build:targets:development`
- `pnpm build:production` -> `pnpm build:targets:production`
- `pnpm build:extension` -> `pnpm build:target:chrome:production`
- `pnpm build:chrome:*` remains as the short-form family of Chrome-target aliases
- `pnpm package` and `pnpm zip` -> `pnpm package:targets:production`
- `pnpm release:validate` checks production identity/OAuth config and tag-version alignment before a governed release build

## Test Commands

```bash
pnpm test
pnpm test:google
pnpm test:google:coverage
pnpm test:google:watch
pnpm test:targeted:plan
pnpm test:targeted:run
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
```

## Documentation Guardrail Commands

```bash
pnpm docs:check
pnpm docs:check:business
pnpm docs:check:behavior
```

## Runtime Debug And Smoke Commands

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
pnpm chrome:meet:url
pnpm chrome:smoke:meet
pnpm chrome:smoke:live <provider> <scenario>
pnpm chrome:smoke:live:fresh <provider> <scenario>
pnpm chrome:smoke:live:google:settings <scenario>
pnpm chrome:smoke:live:matrix [cases]
pnpm chrome:debug:bridge:setup
pnpm chrome:debug:bridge:remove
pnpm chrome:debug:bridge:show
```

DLS acceptance gate:

- runtime DLS commands are considered complete only after repository-owner visual review and explicit in-thread approval

All command definitions are sourced from [`package.json`](../../package.json).

Diagnostics threshold note:

- environment thresholds live in `entrypoints/shared/environment/development.ts` and `entrypoints/shared/environment/production.ts`
- the future log-viewer UI gate also lives there as `diagnostics.viewerEnabled`
- `pnpm chrome:debug:diagnostics:enable` and `pnpm chrome:debug:diagnostics:disable` temporarily override the active runtime threshold without replacing the persisted defaults
