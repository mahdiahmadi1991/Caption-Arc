# Local Development

## Prerequisites

- Node.js 20+
- pnpm
- Chrome or Firefox for unpacked extension loading

## Install And Run

```bash
pnpm install
pnpm dev
```

## Production Build

```bash
pnpm build:chrome:production
pnpm build:firefox:production
pnpm zip:chrome:production
pnpm zip:firefox:production
```

Alias commands:

- `pnpm build` -> `pnpm build:all:production`
- `pnpm zip` -> `pnpm zip:all:production`

## Environment Builds

```bash
pnpm build:chrome:development
pnpm build:chrome:production
pnpm build:firefox:development
pnpm build:firefox:production
```

Build outputs now live under a shared `.release/` parent directory:

- `.release/chrome/development`
- `.release/chrome/production`
- `.release/firefox/development`
- `.release/firefox/production`

## Load Unpacked Extension

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Load `.release/chrome/production` for the Chrome production artifact, or `.release/chrome/development` for the Chrome development artifact.
4. For Firefox, open `about:debugging#/runtime/this-firefox` and load `.release/firefox/production` or `.release/firefox/development`.

Chrome unpacked development builds keep a stable development ID when `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT` is configured, preferably through `.secrets/.env.local`.

Production builds should use a separate `WXT_CHROME_EXTENSION_KEY_PRODUCTION` value so development and production Chrome artifacts do not share the same extension ID.

## Daily Workflow

- use `pnpm dev` for local iteration
- use `pnpm build:chrome:development` or `pnpm build:firefox:development` when you want a persistent browser-specific development artifact beside production
- use `pnpm build` / `pnpm build:all:production` before packaging or release validation across both governed browsers
- run targeted tests before merging behavior changes
- for runtime-affecting changes, keep Chrome smoke evidence plus Firefox verification evidence using [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md)
