# Local Smoke Secrets

Use `.secrets/` for machine-local secrets and identity material that must never be committed, including manual smoke credentials and any retained browser-extension private keys.

Folder-level onboarding for `.secrets/` is documented in:

- [.secrets/README.md](../../.secrets/README.md)

## Files

1. `.secrets/.env.example` is the template.
2. Put shared machine-local values in `.secrets/.env.local`.
3. Put development-only values in `.secrets/.env.development.local`.
4. Put production-only values in `.secrets/.env.production.local`.
5. Create `.secrets/smoke.env` for smoke-only overrides like meeting URLs or temporary API keys.
6. You can override the file path with `SMOKE_SECRETS_FILE=<local-path-to-file>`.
7. Smoke tooling only reads the canonical `.secrets/` paths. The old unhidden `secrets/` directory is not part of the supported local contract.

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

By default, smoke wrappers layer local env files in this order before applying `smoke.env` overrides:

- `.secrets/.env`
- `.secrets/.env.local`
- `.secrets/.env.development`
- `.secrets/.env.development.local`
- `.secrets/smoke.env`

Set `SMOKE_ENV_MODE=production` if you intentionally want the smoke wrappers to layer `.env.production*` instead of `.env.development*`.

When `OPENAI_API_KEY` exists, wrappers export `SMOKE_OPENAI_API_KEY` automatically.
Deterministic runtime mode (`DETERMINISTIC_TEST_MODE=1`) enforces stable defaults (`system-only + auto`) for smoke flows.
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
