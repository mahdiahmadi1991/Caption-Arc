# Provider End-To-End Scenario Matrix

This matrix describes end-to-end product scenarios by supported provider surface.

Status labels in this document describe implemented product paths, not guaranteed external provider DOM stability at all times.

## Scenario Matrix

| Scenario | Google Meet Web | Microsoft Teams Web | Zoom Web App | Primary Code Surfaces |
| --- | --- | --- | --- | --- |
| Provider detection and runtime bootstrap | Implemented | Implemented | Implemented | `entrypoints/content/platform-runtime.ts`, `entrypoints/content/providers/registry.ts` |
| Prejoin and joined presence detection | Implemented | Implemented | Implemented | `entrypoints/content/providers/google-meet.ts`, `entrypoints/content/providers/microsoft-teams.ts`, `entrypoints/content/providers/zoom-web.ts` |
| Startup behavior gate (`off` / `ask` / `always`) | Implemented | Implemented | Implemented | `entrypoints/content/platform-runtime.ts` |
| Live caption extraction and update/finalize flow | Implemented | Implemented | Implemented | `entrypoints/content/caption.ts`, provider files under `entrypoints/content/providers/*` |
| Overlay rendering and live translation UX | Implemented | Implemented | Implemented | `entrypoints/content/overlay/*`, `entrypoints/content/translation.ts` |
| Live assistant trigger and output flow | Implemented | Implemented | Implemented | `entrypoints/background/assistant.ts`, `entrypoints/content/overlay/assistant-surface.ts` |
| Meeting chat event ingestion and session event persistence | Implemented | Implemented | Implemented | `entrypoints/content/event-ingestion.ts`, provider chat extraction paths, `entrypoints/background/history.ts` |
| Session finalization and continuation/rejoin decisioning | Implemented | Implemented | Implemented | `entrypoints/content/platform-runtime.ts`, `entrypoints/background/history.ts`, `entrypoints/shared/meeting-session.ts` |
| Post-meeting history, summary, and export surfaces | Implemented | Implemented | Implemented | `entrypoints/meeting-history/*`, `entrypoints/background/history.ts`, `entrypoints/background/data-transfer.ts` |

## Browser-Sensitive Scenario Notes

- Scenario availability for cloud continuity differs by browser target.
- Google Drive and OneDrive sync flows remain intentionally gated on Firefox.
- Core meeting scenarios above are expected on both governed browsers.
- Teams `v2` and Zoom `wc/home` shell routes are treated as reset-shell contexts for lifecycle decisions, while keeping session-ended review behavior consistent.

Primary references:

- `docs/product/feature-availability-matrix.md`
- `docs/quality/compatibility-matrix.md`

## Validation Guidance

For runtime-sensitive acceptance evidence, prefer:

- `pnpm chrome:smoke:live <provider> <scenario>`
- `pnpm chrome:smoke:live:matrix`
- Firefox manual verification evidence using `docs/quality/firefox-manual-verification-checklist.md`

## Update Rule

If a provider flow changes for any end-to-end scenario above, update this matrix and the corresponding product capability docs in the same change.
