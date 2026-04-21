# Provider QA Baseline

This document replaces the legacy long-form provider QA matrix.

## Supported Browser Providers

- Google Meet
- Microsoft Teams Web
- Zoom Web App

## Baseline Validation Areas

- provider detection accuracy on real meeting pages
- no false activation on non-meeting surfaces
- caption capture and speaker extraction behavior
- translation toggle and language-switch behavior
- session persistence to history
- provider metadata visibility in history UI
- overlay lifecycle behavior on meeting exit

## Smoke Command Baseline

```bash
pnpm chrome:debug:reload
pnpm chrome:smoke:provider google-meet lobby
pnpm chrome:smoke:provider microsoft-teams meeting
pnpm chrome:smoke:provider zoom-web meeting
pnpm chrome:smoke:matrix
```

## Operational Rule

When a provider-specific fix ships, run at least one cross-provider regression smoke pass before release.
