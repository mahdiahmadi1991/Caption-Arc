# Cross-Browser Cloud Sync Parity

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Enable both browser-governed cloud-sync providers, `google-drive` and `onedrive`, to work correctly in both Chrome and Firefox release targets without browser-family hard-gating. "Done" means users can connect, disconnect, read, write, retry, and recover cloud-sync state for both providers in both browsers, with provider-specific OAuth flows verified end to end and repository contracts/docs updated to reflect the new cross-browser behavior.

## Problem Statement

Cloud sync currently enforces a coarse browser-family gate that only marks `google-drive` and `onedrive` as supported on the Chrome runtime family. This is a product limitation rather than a queue/orchestration limitation.

Current blockers are:

- `entrypoints/shared/browser-capabilities.ts` hard-codes support to `family === "chrome"`.
- Google Drive uses `chrome.identity.getAuthToken()` plus manifest `oauth2`, which is a Chrome-oriented shortcut rather than a portable OAuth implementation.
- OneDrive already uses `launchWebAuthFlow` + PKCE, but it is still disabled on Firefox by the same top-level gating and lacks verified Firefox redirect-registration support.
- Firefox currently lacks explicit `browser_specific_settings.gecko.id` configuration, so a stable Firefox identity redirect URL is not guaranteed across temporary installs.

## Scope

- add the manifest/browser configuration needed for stable Firefox identity redirects
- replace browser-family support gating with provider-capability/verified-flow gating
- implement and verify OneDrive cloud sync on Firefox
- implement and verify Google Drive cloud sync on Firefox
- preserve existing Chrome functionality for both providers
- update cloud-sync tests, behavior contracts, traceability matrices, and operator-facing docs
- produce fresh Chrome and Firefox development builds for UI verification readiness during the implementation turn

## Non-Goals

- adding new cloud providers
- redesigning cloud-sync queue semantics, retention behavior, or checkpoint merge strategy beyond what parity requires
- changing local archive formats or session payload schemas unless a provider flow forces a compatibility-safe adjustment
- introducing a mandatory external backend service unless direct browser-based OAuth proves infeasible for Google on Firefox

## Repository Context

Core runtime and provider code:

- `entrypoints/shared/browser-capabilities.ts`
- `entrypoints/background/cloud-sync/index.ts`
- `entrypoints/background/cloud-sync/engine.ts`
- `entrypoints/background/cloud-sync/providers/index.ts`
- `entrypoints/background/cloud-sync/providers/google-drive.ts`
- `entrypoints/background/cloud-sync/providers/onedrive-auth.ts`
- `entrypoints/background/cloud-sync/providers/onedrive.ts`
- `entrypoints/options/use-cloud-sync.ts`
- `wxt.config.ts`

Existing tests and contracts:

- `tests/google-meet/cloud-sync-browser-support.contract.test.ts`
- `tests/google-meet/cloud-sync-orchestration.contract.test.ts`
- `tests/google-meet/cloud-sync-engine-retries.contract.test.ts`
- `docs/api/cloud-sync-behavior-contract.md`
- `docs/api/browser-capabilities-behavior-contract.md`
- `docs/quality/references/cloud-sync-traceability-matrix.md`
- `docs/quality/references/browser-capabilities-traceability-matrix.md`

Validation and browser-governance references:

- `docs/quality/testing-quality-gate.md`
- `docs/quality/firefox-manual-verification-checklist.md`
- `docs/setup/agent-testing-onboarding.md`
- `AGENTS.md`

## Constraints

- keep Chrome and Firefox release targets both supported
- keep provider behavior deterministic under the existing cloud-sync checkpoint/orchestration model
- keep secrets and app registrations out of the repository; use env vars and public-safe placeholders in docs
- do not break current Chrome production OAuth flows while adding Firefox parity
- follow browser-specific verification rules: automated Chrome validation where supported, manual Firefox verification evidence until canonical Firefox runtime automation exists

## Risks and Unknowns

- Google OAuth has stricter redirect and client-type constraints than OneDrive; the Chrome shortcut flow cannot simply be toggled on for Firefox.
- Firefox redirect handling depends on a stable extension ID; development and production IDs may need separate provider registrations.
- Provider consoles may require separate OAuth clients per browser target and possibly per environment (`development` vs `production`).
- A direct Google browser-extension OAuth flow for Firefox may require a move to `launchWebAuthFlow` + authorization code + PKCE, or a brokered/server-assisted fallback if provider registration constraints block a direct solution.
- Regression risk exists in settings UI messaging if unsupported/supported status semantics change from browser-family-based to capability-based.

## Documentation Impact

Implementation governed by this plan must update at least:

- `docs/api/cloud-sync-behavior-contract.md`
- `docs/api/browser-capabilities-behavior-contract.md`
- `docs/quality/references/cloud-sync-traceability-matrix.md`
- `docs/quality/references/browser-capabilities-traceability-matrix.md`
- `docs/architecture/overview.md` if auth architecture changes materially
- `docs/architecture/storage-and-state.md` if token persistence semantics change
- `docs/setup/README.md` or the nearest setup/auth document if contributor configuration steps change
- `README.md` if public browser-support statements change materially

## Testing and Coverage Impact

Implementation must add or update:

- provider-support tests so Firefox no longer resolves both governed providers as automatically unsupported once parity is complete
- provider-auth tests for OneDrive Firefox success/failure flows
- provider-auth tests for Google Drive Firefox success/failure flows
- orchestration tests ensuring supported Firefox providers still follow checkpoint/retry/queue invariants
- UI/settings tests covering support-state copy and action availability in both browsers

Required validation during implementation:

- `pnpm test:targeted:plan`
- targeted Vitest suites for cloud sync, browser capabilities, and settings UI
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`
- Chrome runtime smoke for the affected cloud-sync flows if the implementation touches runtime-sensitive settings or background messaging
- Firefox manual verification evidence using `docs/quality/firefox-manual-verification-checklist.md`

## Milestones

### Milestone 1 - Cross-Browser OAuth Foundation

Objective:

- prepare the extension and provider configuration so Firefox can participate in identity-based auth flows with stable redirect handling

Implementation approach:

- add explicit Firefox extension ID support in `wxt.config.ts` via `browser_specific_settings.gecko.id`
- define a public-safe credential strategy for browser/environment-specific OAuth registrations, for example:
  - `WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME`
  - `WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX`
  - `WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME`
  - `WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX`
- centralize provider/browser capability evaluation so support is driven by available config + verified auth flow, not only by browser family
- keep current unsupported behavior for any provider/browser pair until its flow is genuinely implemented and verified

Acceptance signals:

- Firefox builds include a stable add-on ID configuration
- capability evaluation can express partial parity, e.g. OneDrive supported on Firefox before Google Drive is enabled there
- current Chrome behavior remains intact

Verification:

- focused tests for browser capability evaluation
- Chrome and Firefox development builds succeed

### Milestone 2 - OneDrive Firefox Parity

Objective:

- enable OneDrive connect/disconnect/sync flows on Firefox with the existing PKCE-based architecture

Implementation approach:

- remove Firefox gating for OneDrive once capability checks, redirect URI registration, and token exchange are validated
- verify `identity.getRedirectURL("microsoft")` usage under Firefox with the configured add-on ID
- confirm Microsoft app registration includes the required Firefox redirect URI(s) and public-client settings
- update checkpoint creation, connect/disconnect surfaces, and settings copy so Firefox users see the provider as supported

Acceptance signals:

- Firefox can connect OneDrive successfully
- token refresh, disconnect, retry, and background sync flows behave the same as Chrome at the checkpoint/orchestration layer
- support-state tests pass for Chrome and Firefox

Verification:

- targeted OneDrive auth tests
- cloud-sync browser-support and orchestration suites
- manual Firefox verification of connect, sync write, sync read, disconnect, and reconnect

### Milestone 3 - Google Drive Firefox Parity

Objective:

- replace the Chrome-specific Google auth shortcut with a cross-browser OAuth implementation that works in Firefox and preserves Chrome support

Implementation approach:

- refactor Google Drive auth away from `chrome.identity.getAuthToken()` toward a portable authorization code + PKCE flow built on `identity.launchWebAuthFlow()`
- determine and document the correct Google OAuth client registration model for Chrome and Firefox targets
- choose one of two implementation paths:
  - preferred path: direct browser-based OAuth with provider-registered redirect URI(s) and local token exchange
  - fallback path: a minimal brokered auth surface outside the extension only if direct provider constraints make Firefox support infeasible
- keep token storage, revocation, and appData access semantics compatible with the existing cloud-sync engine

Acceptance signals:

- Firefox can connect Google Drive successfully
- Google Drive `appDataFolder` read/write/list flows work in Firefox
- Chrome continues to work after the Google auth refactor

Verification:

- targeted Google auth/provider tests
- cloud-sync orchestration suites
- manual Chrome and Firefox provider verification

### Milestone 4 - Full Cross-Browser Support Semantics And Documentation

Objective:

- complete the parity rollout by updating contracts, traceability, UX copy, and release-facing docs

Implementation approach:

- change behavior contracts and traceability matrices from "Firefox unsupported" assertions to per-provider parity assertions
- review settings/help/copy surfaces so unsupported messaging is only shown for truly unsupported states
- document credential setup, provider registration requirements, and browser differences for contributors

Acceptance signals:

- no stale docs or tests still claim Firefox is unsupported once parity is implemented
- both providers are presented consistently across settings and background state in both browsers

Verification:

- `pnpm docs:check`
- `pnpm docs:check:behavior`
- targeted UI and behavior-contract suites

## Verification

When this plan is executed, record at minimum:

- exact targeted Vitest commands used per milestone
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`
- Firefox manual verification evidence for:
  - connect OneDrive
  - sync write to OneDrive
  - disconnect/reconnect OneDrive
  - connect Google Drive
  - sync write to Google Drive
  - disconnect/reconnect Google Drive

## Progress

- [ ] Confirm provider registration strategy for Chrome/Firefox development and production
- [ ] Implement Firefox ID and capability-gating foundation
- [ ] Ship OneDrive Firefox parity
- [ ] Ship Google Drive Firefox parity
- [ ] Update docs, contracts, traceability, and verification evidence

## Surprises and Discoveries

- Observation: The current blocker is not the generic `chrome` namespace alone; the real limitation is the provider-auth strategy and coarse browser-family gating.
  Evidence: `entrypoints/shared/browser-capabilities.ts`, `entrypoints/background/cloud-sync/providers/google-drive.ts`, `entrypoints/background/cloud-sync/providers/onedrive-auth.ts`
- Observation: OneDrive is structurally closer to Firefox support than Google Drive because it already uses `launchWebAuthFlow` + PKCE instead of Chrome-only `getAuthToken`.
  Evidence: `entrypoints/background/cloud-sync/providers/onedrive-auth.ts`, `entrypoints/background/cloud-sync/providers/google-drive.ts`

## Decision Log

- Decision: Deliver parity incrementally, with OneDrive before Google Drive.
  Rationale: OneDrive already uses the more portable auth shape, so it is the lower-risk path to remove the first Firefox gap and validate the new capability model.
  Date/Author: 2026-04-14 / Codex
- Decision: Replace browser-family gating with provider capability gating rather than flipping Firefox on globally.
  Rationale: This allows partial rollout and avoids claiming support before the provider flow is actually verified.
  Date/Author: 2026-04-14 / Codex
- Decision: Treat a brokered/server-assisted Google solution as a fallback, not the default.
  Rationale: Cross-browser parity should remain extension-local if provider constraints allow it, but the plan should still acknowledge a realistic escape hatch.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

Plan created for future implementation. No runtime behavior changed in this planning-only change set.
