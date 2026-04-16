# Troubleshooting

## Extension Does Not Inject On Meeting Page

- run `pnpm chrome:debug:reload`
- verify host permissions and supported meeting URL shape
- rerun provider smoke scenario

## Runtime Messaging Fails With Unknown Action

- ensure extension runtime is reloaded
- confirm sender surface is using current action names from `entrypoints/background/index.ts`

## Cloud Sync Connection Issues

- rebuild and reload the active browser target after changing OAuth env vars or provider registrations
- verify the active browser target has the correct provider redirect URI registered:
  - Chrome Google Drive: `https://<extension-id>.chromiumapp.org/google`
  - Chrome OneDrive: `https://<extension-id>.chromiumapp.org/microsoft`
  - Firefox Google Drive: the exact value from `browser.identity.getRedirectURL("google")`
  - Firefox OneDrive: the exact value from `browser.identity.getRedirectURL("microsoft")`
- if Google Drive shows `redirect_uri_mismatch`, verify you created a `Web application` OAuth client and not only a `Chrome Extension` client
- if a provider was previously unsupported, refresh the Cloud Sync section after reload so stale configuration errors are replaced with the new checkpoint state
- inspect Diagnostics Console events filtered to `domain=cloud-sync`
- high-signal Cloud Sync diagnostics features now include:
  - `orchestration`
  - `engine`
  - `provider-sync`
  - `google-drive-auth`
  - `onedrive-auth`
  - `identity-api`
  - `options-cloud-sync`
- if a heavy local backlog exists, look for `cloud_sync_reconcile_deferred_for_backlog` under the `engine` feature before assuming remote polling is broken; the engine now intentionally postpones expensive reconcile scans while upload work is queued
- missing or expired stored provider tokens should now surface reconnect-required errors instead of silently opening interactive auth during background sync
- if delta-based reconcile logs `cloud_sync_reconcile_delta_failed`, the engine will automatically fall back to a scoped full rescan and refresh the provider cursor on the next successful reconcile
- provider tokens are now stored in encrypted local form, so ad-hoc manual debugging should use the UI disconnect flow or runtime diagnostics rather than expecting readable token JSON in extension storage

## Summary Generation Reliability Issues

- retry summary from history detail
- test a smaller or simpler profile instruction set for diagnosis
- verify OpenAI configuration and model readiness
