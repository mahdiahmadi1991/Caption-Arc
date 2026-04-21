# Business Non-Goals And Scope Boundaries

This document records current intentional product boundaries to reduce roadmap ambiguity and prevent accidental scope creep.

## Current Scope Boundaries

- browser extension product only
- supported web meeting surfaces:
  - Google Meet
  - Microsoft Teams Web
  - Zoom Web App
- local-first archive model with optional continuity paths
- OpenAI-only AI service architecture for translation, assistant, and summaries

## Explicit Non-Goals (Current)

- support for desktop-native meeting clients
- "offline-only" claim for AI-powered features
- multi-provider AI routing in current architecture
- ungated Firefox cloud sync before identity flow verification evidence
- capture of content not exposed on supported provider page surfaces

## Feature Boundaries Worth Keeping Explicit

- capture startup behavior remains user-controlled (`off`, `ask`, `always`)
- cloud sync is optional and user-initiated
- assistant is profile-shaped, not a universal always-on copilot mode
- summary behavior is profile and session dependent, not a single static template

## Compatibility Boundary

Cloud sync provider support is browser-sensitive:

- Chrome: Google Drive and OneDrive sync supported
- Firefox: Google Drive and OneDrive sync intentionally gated

Primary reference:

- `entrypoints/shared/browser-capabilities.ts`

## Change Control Rule

If any non-goal is intentionally removed, update:

- this document
- `docs/product/feature-availability-matrix.md`
- `docs/operations/store-listing.md`
- `docs/security/privacy-disclosure-notes.md`
