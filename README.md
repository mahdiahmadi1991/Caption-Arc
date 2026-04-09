# CaptionArc

CaptionArc is a browser extension for browser-based meeting caption capture, live translation, and post-meeting review.

It supports Google Meet, Microsoft Teams Web, and Zoom Web App.

## What It Does

- Captures visible live captions from supported browser meeting pages
- Translates captions in real time using OpenAI
- Saves meeting sessions to local history for search and follow-up
- Generates AI summaries with reusable summary profiles
- Supports optional personal cloud archive sync (Google Drive App Data and OneDrive App Folder)

## Product Scope

In scope:

- browser-based meeting clients
- local-first archive and settings
- OpenAI-backed translation and summary generation

Out of scope:

- native desktop meeting clients
- self-hosted AI provider switching in current architecture

## Installation

### From source

```bash
git clone https://github.com/mahdiahmadi1991/caption-arc.git
cd caption-arc
pnpm install
pnpm build:chrome:production
pnpm build:firefox:production
```

Load the Chrome artifact from `.release/chrome/production` in `chrome://extensions`.
Load the Firefox artifact from `.release/firefox/production` in `about:debugging#/runtime/this-firefox`.
If you want development artifacts side by side, build `pnpm build:chrome:development` and/or `pnpm build:firefox:development` and load the matching `.release/<browser>/development` directory.

### From release

Download latest package from:

- [GitHub Releases](https://github.com/mahdiahmadi1991/CaptionArc/releases)

## Development

```bash
pnpm dev
pnpm build:chrome:development
pnpm build:firefox:development
pnpm build
pnpm zip
```

`pnpm build` and `pnpm zip` are the all-browser production aliases.

## Test And Runtime Validation

Code-level tests:

```bash
pnpm test
pnpm test:google
pnpm test:google:coverage
pnpm test:targeted:plan
```

Runtime smoke flow:

```bash
pnpm chrome:debug:reload
pnpm chrome:smoke:meet
pnpm chrome:smoke:provider <provider> <scenario>
pnpm chrome:smoke:matrix
```

Chrome DLS is the canonical automated runtime path today. Runtime-affecting changes must also record Firefox verification evidence with [docs/quality/firefox-manual-verification-checklist.md](./docs/quality/firefox-manual-verification-checklist.md) until a canonical Firefox automation flow is added.

For WSL + Windows Chrome runtime setup, see:

- [docs/setup/wsl-windows-chrome-cdp-quickstart.md](./docs/setup/wsl-windows-chrome-cdp-quickstart.md)

## Configuration

Open extension Settings and configure:

- OpenAI API key
- default model and target language
- summary profiles and summary language
- overlay behavior and appearance
- optional cloud sync providers

Local smoke secrets template:

- [.secrets/.env.example](./.secrets/.env.example)
- [docs/setup/local-smoke-secrets.md](./docs/setup/local-smoke-secrets.md)

## Architecture Summary

- Background service worker owns persistence, orchestration, and message routing
- Content runtime owns provider detection, capture, and in-meeting surfaces
- Session archive uses IndexedDB with event-chunk persistence
- Settings and local runtime metadata use `chrome.storage.local`

Detailed architecture docs:

- [docs/architecture/overview.md](./docs/architecture/overview.md)

## Documentation

Primary docs index:

- [docs/README.md](./docs/README.md)

Contributor guidance:

- [AGENTS.md](./AGENTS.md)
- [docs/contributing/README.md](./docs/contributing/README.md)

## License

MIT. See [LICENSE](./LICENSE).
