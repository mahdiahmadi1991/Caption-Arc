# Environment And Configuration

## Runtime Config Sources

`wxt.config.ts` reads config in this order:

- `.secrets/.env.local`
- `.secrets/.env`
- `.env.local`
- `.env`

Smoke-test credentials continue to live in `.secrets/smoke.env`.

Local smoke-secret handling details:

- [local-smoke-secrets.md](./local-smoke-secrets.md)

`wxt.config.ts` reads select config values from environment or local env files.

## Extension Identity Config

Chrome extension identity should be separated by build mode.

Recommended variables:

- `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT=<base64-public-key>`
- `WXT_CHROME_EXTENSION_KEY_PRODUCTION=<base64-public-key>`

Compatibility fallback:

- `WXT_CHROME_EXTENSION_KEY=<base64-public-key>`

Resolution behavior:

- development builds prefer `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT`
- production builds prefer `WXT_CHROME_EXTENSION_KEY_PRODUCTION`
- if the mode-specific variable is absent, `WXT_CHROME_EXTENSION_KEY` is used as a fallback

Recommended local setup:

- keep the matching private keys only under `.secrets/`
- store the public keys in `.secrets/.env.local`
- use separate CI/CD secrets for development and production Chrome identity

Changing either value changes that environment's Chrome extension ID.

Example:

```bash
# .secrets/.env.local
WXT_CHROME_EXTENSION_KEY_DEVELOPMENT=<base64-public-key>
WXT_CHROME_EXTENSION_KEY_PRODUCTION=<base64-public-key>
```

## Smoke Runtime Diagnostics Env

These local-only env vars control live diagnostics streaming during smoke runs:

- `SMOKE_LIVE_DIAGNOSTICS=1|0` (default `1`)
- `SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL=trace|debug|info|warn|error` (default `debug`)
- `SMOKE_LIVE_DIAGNOSTICS_POLL_MS=<milliseconds>` (default `450`)
- `SMOKE_LIVE_DIAGNOSTICS_CLEAR=1|0` (default `1`)
- `SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA=1|0` (default `1`)

Deterministic runtime mode is enabled by default for smoke:

- `DETERMINISTIC_TEST_MODE=1`

## Sensitive Values

Never commit real values for:

- `OPENAI_API_KEY`
- OAuth .secrets/tokens
- any session or cookie values
- private signing keys

## Safe Example

```bash
# .secrets/smoke.env
OPENAI_API_KEY=<sample-token>
# GOOGLE_MEET_URL=https://meet.google.com/<meeting-code>
# TEAMS_URL=https://teams.live.com/meet/<meeting-id>
# ZOOM_URL=https://<subdomain>.zoom.us/j/<meeting-id>
```

## Path Safety Rule

Use placeholders like `<repo-root>` and `<local-path>` in docs.
Do not publish machine-local absolute paths.
