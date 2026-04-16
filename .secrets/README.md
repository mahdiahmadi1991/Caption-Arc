# Secrets Folder Onboarding

This folder is the machine-local home for CaptionArc secret material, local identity continuity files, and non-committed runtime overrides.

## Purpose

Use `.secrets/` for:

- machine-local env files used by build, packaging, and smoke tooling
- retained Chromium private keys used to keep stable extension IDs
- smoke-only local overrides such as meeting URLs or temporary runtime API keys

Do not use `.secrets/` for:

- tracked product code
- tracked runtime data
- design docs or planning notes
- generated artifacts under `.release/`

## Tracked Files

Only these files are expected to be tracked here:

- `.secrets/.gitignore`
- `.secrets/.env.example`
- `.secrets/README.md`

Everything else in this folder is local-only and must stay uncommitted.

## Local File Layout

Canonical local env layout:

- `.secrets/.env.local`
  Shared machine-local values reused across modes.
  Typical examples: `WXT_MICROSOFT_OAUTH_TENANT`, `OPENAI_API_KEY`
- `.secrets/.env.development.local`
  Development-only identity and OAuth values
- `.secrets/.env.production.local`
  Production-only identity and OAuth values
- `.secrets/smoke.env`
  Smoke-only overrides layered after the env files above
- `.secrets/chrome-extension-key-development.pem`
  Local development Chromium private key
- `.secrets/chrome-extension-key-production.pem`
  Local production Chromium private key

## Loader Contract

`wxt.config.ts` resolves build config with mode-aware precedence:

1. `.secrets/.env.<mode>.local`
2. `.secrets/.env.local`
3. `.secrets/.env.<mode>`
4. `.secrets/.env`

`scripts/manual-smoke/load-secrets-env.sh` layers:

1. `.secrets/.env`
2. `.secrets/.env.local`
3. `.secrets/.env.<mode>`
4. `.secrets/.env.<mode>.local`
5. `.secrets/smoke.env`

Default smoke mode is `development`. Override with `SMOKE_ENV_MODE=production` only when you intentionally want production layering for local smoke work.

## Responsibilities For Agents And Threads

If you are changing config behavior, env variable names, or release/build policy:

1. Update the loader implementation.
2. Update `.secrets/.env.example`.
3. Update `docs/setup/environment-and-config.md`.
4. Update `docs/setup/local-development.md`.
5. Update `docs/setup/local-smoke-secrets.md` if smoke behavior changed.
6. Update `docs/operations/release-runbook.md` if release expectations changed.
7. Re-run build/release validation after the change.

If you are only consuming local values:

- read the minimum necessary
- do not echo secrets into logs or assistant responses
- do not paste real values into docs, tests, or tracked files
- do not rotate, rename, or delete local secret files unless the user explicitly asks

## Safety Rules

- Never commit real secret files.
- Never copy raw secret values into markdown, screenshots, or diagnostics.
- Never replace user-local values with placeholders during cleanup.
- Prefer browser-targeted env names like `*_CHROME` and `*_FIREFOX`.
- Prefer channel separation by file (`development` vs `production`) instead of by release version.
- CI/CD should mirror these values through secret stores, not through tracked files.

## Canonical References

For deeper policy and operational guidance, use:

- `docs/setup/environment-and-config.md`
- `docs/setup/local-development.md`
- `docs/setup/local-smoke-secrets.md`
- `docs/operations/release-runbook.md`
