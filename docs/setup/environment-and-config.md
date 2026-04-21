# Environment And Configuration

## Runtime Config Sources

`wxt.config.ts` reads config in this order:

- `.secrets/.env.<mode>.local`
- `.secrets/.env.local`
- `.secrets/.env.<mode>`
- `.secrets/.env`

`<mode>` is the active WXT build mode:

- `development` for `pnpm dev` and `pnpm build:target:*:development`
- `production` for `pnpm build:target:*:production`, packaging, and governed release validation

Recommended layout:

- `.secrets/.env.local` for shared machine-local values reused across both build modes
- `.secrets/.env.development.local` for development-only identity and OAuth values
- `.secrets/.env.production.local` for production-only identity and OAuth values

Folder-level onboarding for contributors and agents lives in:

- [.secrets/README.md](../../.secrets/README.md)

Smoke-test credentials continue to live in `.secrets/smoke.env`.

Local smoke-secret handling details:

- [local-smoke-secrets.md](./local-smoke-secrets.md)

`wxt.config.ts` reads select config values from environment or local env files.

## Extension Identity Config

Chrome extension identity should be separated by build mode.

Recommended variables:

- `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT=<base64-public-key>`
- `WXT_CHROME_EXTENSION_KEY_PRODUCTION=<base64-public-key>`
- `WXT_FIREFOX_EXTENSION_ID_DEVELOPMENT=<addon-id@example.com>`
- `WXT_FIREFOX_EXTENSION_ID_PRODUCTION=<addon-id@example.com>`

Compatibility fallback:

- `WXT_CHROME_EXTENSION_KEY=<base64-public-key>`
- `WXT_FIREFOX_EXTENSION_ID=<addon-id@example.com>`

Resolution behavior:

- development builds prefer `WXT_CHROME_EXTENSION_KEY_DEVELOPMENT`
- production builds prefer `WXT_CHROME_EXTENSION_KEY_PRODUCTION`
- if the mode-specific variable is absent, `WXT_CHROME_EXTENSION_KEY` is used as a fallback
- Firefox builds prefer `WXT_FIREFOX_EXTENSION_ID_DEVELOPMENT` or `WXT_FIREFOX_EXTENSION_ID_PRODUCTION` by mode, then fall back to `WXT_FIREFOX_EXTENSION_ID`

Recommended local setup:

- keep the matching private keys only under `.secrets/`
- store shared values in `.secrets/.env.local`
- store development identity values in `.secrets/.env.development.local`
- store production identity values in `.secrets/.env.production.local`
- use separate CI/CD secrets for development and production Chromium identity

Changing either value changes that environment's Chrome extension ID.

Example:

```bash
# .secrets/.env.development.local
WXT_CHROME_EXTENSION_KEY_DEVELOPMENT=<base64-public-key>
WXT_FIREFOX_EXTENSION_ID_DEVELOPMENT=<addon-id@example.com>

# .secrets/.env.production.local
WXT_CHROME_EXTENSION_KEY_PRODUCTION=<base64-public-key>
WXT_FIREFOX_EXTENSION_ID_PRODUCTION=<addon-id@example.com>

# .secrets/.env.local
WXT_MICROSOFT_OAUTH_TENANT=common
```

CI/CD release note:

- the tagged release workflow expects `WXT_CHROME_EXTENSION_KEY_PRODUCTION` and `WXT_FIREFOX_EXTENSION_ID_PRODUCTION` in the release environment
- if either value is missing, `pnpm release:validate` fails before production packaging

## Cloud Sync OAuth Config

Cloud sync now resolves OAuth clients per browser target, with shared fallbacks when you intentionally reuse the same provider registration.

Recommended variables:

- `WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME=<oauth-client-id>`
- `WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX=<oauth-client-id>`
- `WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME=<oauth-client-secret>`
- `WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX=<oauth-client-secret>`
- `WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME=<oauth-client-id>`
- `WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX=<oauth-client-id>`

Compatibility fallback:

- `WXT_GOOGLE_OAUTH_CLIENT_ID=<oauth-client-id>`
- `WXT_GOOGLE_OAUTH_CLIENT_SECRET=<oauth-client-secret>`
- `WXT_MICROSOFT_OAUTH_CLIENT_ID=<oauth-client-id>`

Optional tenant override:

- `WXT_MICROSOFT_OAUTH_TENANT=common`

Resolution behavior:

- Chrome builds prefer the `_CHROME` variant, then fall back to the shared variable
- Firefox builds prefer the `_FIREFOX` variant, then fall back to the shared variable
- Google Drive currently requires both a browser-targeted OAuth client ID and client secret for the current browser target
- when the required browser-targeted Google Drive or OneDrive OAuth configuration is missing, the corresponding cloud-sync provider stays unavailable in that browser until configured

Provider-registration notes:

- Google Drive uses the redirect-based OAuth flow in `entrypoints/background/cloud-sync/providers/google-drive.ts`, so the recommended Google OAuth client type is `Web application`, not `Chrome Extension`
- for Chrome, register an authorized redirect URI in the form `https://<extension-id>.chromiumapp.org/google`
- for Firefox, register the exact URI returned by `browser.identity.getRedirectURL("google")` for the current add-on id; current Firefox builds typically return `https://<hash>.extensions.allizom.org/google`
- OneDrive uses the redirect-based OAuth flow in `entrypoints/background/cloud-sync/providers/onedrive-auth.ts`; register the exact redirect URI for the active browser target:
  - Chrome: `https://<extension-id>.chromiumapp.org/microsoft`
  - Firefox: the exact value returned by `browser.identity.getRedirectURL("microsoft")`, typically `https://<hash>.extensions.allizom.org/microsoft`
- browser-targeted OAuth client registration and the extension identity must stay aligned; if the extension id changes, update provider redirect URIs before reconnect testing
- the tagged release workflow should expose the same browser-targeted OAuth env vars through CI secrets; otherwise production artifacts may silently ship with governed providers unavailable

Local token storage notes:

- Google Drive and OneDrive refresh/access tokens are now wrapped with the cloud-sync local vault encryption before they are persisted in `chrome.storage.local`
- if you intentionally want a clean reconnect after OAuth client or redirect-uri changes, disconnect the provider from the Cloud Sync UI instead of editing the storage entry manually

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
# .secrets/.env.local
OPENAI_API_KEY=<sample-token>

# .secrets/smoke.env
# GOOGLE_MEET_URL=https://meet.google.com/<meeting-code>
# TEAMS_URL=https://teams.live.com/meet/<meeting-id>
# ZOOM_URL=https://<subdomain>.zoom.us/j/<meeting-id>
```

## Path Safety Rule

Use placeholders like `<repo-root>` and `<local-path>` in docs.
Do not publish machine-local absolute paths.
