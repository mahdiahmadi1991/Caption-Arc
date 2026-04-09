# Manifest And Permissions

Manifest configuration is declared in [`wxt.config.ts`](../../wxt.config.ts).

## Declared Extension Permissions

- `storage`: settings, device-local state, and runtime metadata.
- `identity`: OAuth and web auth flows for Google Drive / OneDrive integrations.
- `alarms`: scheduled retry for background summary jobs.

## Host Permissions

Meeting providers:
- `meet.google.com`
- `teams.microsoft.com` and `teams.live.com` (including wildcard subdomains and supported paths)
- `*.zoom.us` supported web meeting paths

External APIs:
- `api.openai.com`
- Google APIs used for Drive app-data integration and OAuth
- Microsoft Graph and login endpoints for OneDrive integration

## Why Permissions Exist

- meeting host permissions are required for content-script capture and overlay runtime.
- API host permissions are required for translation/summaries and cloud sync.
- identity permission is required for auth-token and web-auth flows.

## Browser-Sensitive Notes

- the manifest declares the shared permission surface for governed browser builds, but optional identity-backed cloud sync remains intentionally gated on Firefox until the required browser-specific flows are verified.
- store submission and release notes must describe browser-gated capability differences accurately whenever this limitation remains in place.

## Change Rule

Any permission change must update:

- this file,
- [security-and-privacy.md](./security-and-privacy.md),
- [operations/store-submission.md](../operations/store-submission.md).
