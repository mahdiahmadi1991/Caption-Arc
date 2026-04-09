# Environment And Configuration

## Runtime Config Sources

- `.env.local`
- `.env`
- `.secrets/smoke.env` for smoke-test credentials

Local smoke-secret handling details:

- [local-smoke-secrets.md](./local-smoke-secrets.md)

`wxt.config.ts` reads select config values from environment or local env files.

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
