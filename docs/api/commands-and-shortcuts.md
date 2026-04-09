# Commands And Shortcuts

## Development Commands

```bash
pnpm dev
pnpm build
pnpm build:development
pnpm build:production
pnpm build:chrome:development
pnpm build:chrome:production
pnpm build:firefox:development
pnpm build:firefox:production
pnpm build:all:development
pnpm build:all:production
pnpm build:extension
pnpm zip
pnpm zip:production
pnpm zip:chrome:production
pnpm zip:firefox:production
pnpm zip:all:production
```

Alias notes:

- `pnpm build` -> `pnpm build:all:production`
- `pnpm build:development` -> `pnpm build:all:development`
- `pnpm build:production` -> `pnpm build:all:production`
- `pnpm build:extension` -> `pnpm build:chrome:production`
- `pnpm zip` -> `pnpm zip:all:production`
- `pnpm zip:production` -> `pnpm zip:all:production`

## Test Commands

```bash
pnpm test
pnpm test:google
pnpm test:google:watch
pnpm test:targeted:plan
pnpm test:targeted:run
pnpm test:module:plan <module-path>
pnpm test:module:run <module-path>
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

All command definitions are sourced from [`package.json`](../../package.json).

Diagnostics threshold note:

- environment thresholds live in `entrypoints/shared/environment/development.ts` and `entrypoints/shared/environment/production.ts`
- the future log-viewer UI gate also lives there as `diagnostics.viewerEnabled`
- `pnpm chrome:debug:diagnostics:enable` and `pnpm chrome:debug:diagnostics:disable` temporarily override the active runtime threshold without replacing the persisted defaults
