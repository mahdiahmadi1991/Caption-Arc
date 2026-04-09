# Local Smoke Secrets

Use `.secrets/` only for machine-local secrets used by manual smoke and CDP runtime tests.

## Files

1. `.secrets/.env.example` is the template.
2. Create `.secrets/smoke.env` (or `.secrets/.env`) for real local values.
3. You can override the file path with `SMOKE_SECRETS_FILE=<local-path-to-file>`.
4. Legacy `secrets/` path discovery is disabled by default to prevent ambiguity. Enable only for migration diagnostics with `ALLOW_LEGACY_SECRETS_PATH=1`.

## Auto-Loading Behavior

Smoke wrappers load secrets from the local file through:

- `scripts/manual-smoke/load-secrets-env.sh`
- `scripts/start-windows-chrome-debug.sh`
- `pnpm chrome:smoke:live ...`
- `pnpm chrome:smoke:live:google:settings ...`
- `pnpm chrome:smoke:live:matrix ...`

When `OPENAI_API_KEY` exists, wrappers export `SMOKE_OPENAI_API_KEY` automatically.
Deterministic runtime mode (`DETERMINISTIC_TEST_MODE=1`) enforces stable defaults (`cft-only + auto`) for smoke flows.
Live diagnostics tuning vars may also live in `.secrets/smoke.env`:

- `SMOKE_LIVE_DIAGNOSTICS`
- `SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL`
- `SMOKE_LIVE_DIAGNOSTICS_POLL_MS`
- `SMOKE_LIVE_DIAGNOSTICS_CLEAR`
- `SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA`

## Security Rules

1. Do not commit real secret files.
2. Keep `.secrets/` values local and machine-specific.
3. Never print tokens or keys in logs, screenshots, or docs.
