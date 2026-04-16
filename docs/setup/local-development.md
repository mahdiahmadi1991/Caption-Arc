# Local Development

## Prerequisites

- Node.js 20+
- pnpm
- a Chromium-based browser or Firefox for unpacked extension loading

## Install And Run

```bash
pnpm install
pnpm dev
```

## Production Build

```bash
pnpm build:target:chrome:production
pnpm build:target:firefox:production
pnpm package:target:chrome
pnpm package:target:firefox
```

Alias commands:

- `pnpm build` -> `pnpm build:targets:production`
- `pnpm package` / `pnpm zip` -> `pnpm package:targets:production`

## Environment Builds

```bash
pnpm build:target:chrome:development
pnpm build:target:chrome:production
pnpm build:target:firefox:development
pnpm build:target:firefox:production
```

Build outputs now live under a versioned `.release/` parent directory:

- `.release/v<version>/development/chrome`
- `.release/v<version>/production/chrome`
- `.release/v<version>/development/firefox`
- `.release/v<version>/production/firefox`

## Load Unpacked Extension

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Load `.release/v<version>/production/chrome` for the Chrome production artifact, or `.release/v<version>/development/chrome` for the Chrome development artifact.
4. The Chrome artifact is suitable for Chrome and compatible browsers such as Edge or Brave when their unpacked-extension policies allow it.
5. For Firefox, open `about:debugging#/runtime/this-firefox` and load `.release/v<version>/production/firefox` or `.release/v<version>/development/firefox`.

Chromium-family unpacked development builds keep a stable development ID when `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT` is configured, preferably through `.secrets/.env.development.local`.

Production builds should use a separate `WXT_CHROME_EXTENSION_KEY_PRODUCTION` value through `.secrets/.env.production.local` so development and production Chrome artifacts do not share the same extension ID.

Firefox builds can keep a stable add-on identity for redirect-based auth flows when `WXT_FIREFOX_EXTENSION_ID_DEVELOPMENT` and `WXT_FIREFOX_EXTENSION_ID_PRODUCTION` are configured through `.secrets/.env.development.local` and `.secrets/.env.production.local`.

Cloud sync OAuth client IDs can now be configured per browser target with:

- `WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME`
- `WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX`
- `WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME`
- `WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX`
- `WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME`
- `WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX`

Recommended local env layout:

- `.secrets/.env.local` for shared machine-local values like `WXT_MICROSOFT_OAUTH_TENANT` and `OPENAI_API_KEY`
- `.secrets/.env.development.local` for development-only identity and OAuth values
- `.secrets/.env.production.local` for production-only identity and OAuth values
- `.secrets/README.md` for folder-level onboarding and handling rules

## Daily Workflow

- use `pnpm dev` for local iteration
- use `pnpm build:target:chrome:development` or `pnpm build:target:firefox:development` when you want a persistent browser-targeted development artifact beside production
- use `pnpm build` / `pnpm build:targets:production` before packaging or release validation across both governed release targets
- run targeted tests before merging behavior changes
- for runtime-affecting changes, keep Chrome smoke evidence plus Firefox verification evidence using [../quality/firefox-manual-verification-checklist.md](../quality/firefox-manual-verification-checklist.md)
