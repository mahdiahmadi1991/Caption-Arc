# Local Smoke Secrets

Use `.secrets/` for machine-local secrets and identity material that must never be committed, including manual smoke credentials and any retained browser-extension private keys.

## Files

1. `.secrets/.env.example` is the template.
2. Create `.secrets/smoke.env` (or `.secrets/.env`) for real local values.
3. You can override the file path with `SMOKE_SECRETS_FILE=<local-path-to-file>`.
4. Legacy `secrets/` path discovery is disabled by default to prevent ambiguity. Enable only for migration diagnostics with `ALLOW_LEGACY_SECRETS_PATH=1`.

For Chrome extension identity continuity, keep separate private keys for:

- development, for example `.secrets/chrome-extension-key-development.pem`
- production, for example `.secrets/chrome-extension-key-production.pem`

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
4. If you retain Chrome extension private keys for identity continuity, store them only under `.secrets/` or an external secret manager, never in tracked repo files.
5. Keep development and production keypairs separate so release artifacts do not reuse the local development identity.
