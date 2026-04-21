# Business Capability Map

This document maps user-facing business capabilities to implementation surfaces in the current codebase.

## Capability Inventory

| Capability | User Outcome | Primary Implementation Surfaces |
| --- | --- | --- |
| Provider-aware live capture | Capture visible meeting captions from supported web meeting surfaces | `entrypoints/content/platform-runtime.ts`, `entrypoints/content/providers/*`, `entrypoints/content/caption.ts` |
| Live translation | Translate captured text in near real time with user-configured OpenAI settings | `entrypoints/background/translation.ts`, `entrypoints/background/providers/openai.ts`, `entrypoints/content/translation.ts` |
| Live in-meeting assistant | Generate short, contextual response guidance during meetings | `entrypoints/background/assistant.ts`, `entrypoints/shared/meeting-profiles.ts`, `entrypoints/content/overlay/assistant-surface.ts` |
| Quick access runtime control | Check meeting runtime state, apply fast controls, and trigger guarded in-meeting recovery from the popup surface | `entrypoints/popup/App.tsx`, `entrypoints/background/quick-access-runtime.ts`, `entrypoints/shared/quick-access-status.ts` |
| Local-first meeting history | Persist sessions, search history, and review saved meeting detail | `entrypoints/background/history.ts`, `entrypoints/background/history-db.ts`, `entrypoints/meeting-history/*` |
| Profile-driven summaries | Generate profile-shaped summaries in selected target language | `entrypoints/background/history.ts`, `entrypoints/shared/meeting-summary.ts`, `entrypoints/shared/summary-generation.ts` |
| Session continuation and rejoin continuity | Resume eligible recently-ended sessions to reduce fragmented records | `entrypoints/content/platform-runtime.ts`, `entrypoints/background/history.ts`, `entrypoints/shared/meeting-session.ts` |
| Optional cloud continuity | Mirror archive metadata/events to user-owned cloud app-data folders | `entrypoints/background/cloud-sync/*`, `entrypoints/background/cloud-sync/providers/*`, `entrypoints/shared/browser-capabilities.ts` |
| Encrypted backup and restore | Export and import encrypted `.mcbak` backup bundles for shared settings and archive recovery without exporting device-local secrets | `entrypoints/background/data-transfer.ts`, `entrypoints/shared/app-data-backup.ts`, `entrypoints/options/App.tsx` |
| Runtime diagnostics and support tooling | Capture runtime diagnostics for support, validation, and troubleshooting | `entrypoints/background/diagnostics.ts`, `entrypoints/shared/diagnostics-client.ts`, `entrypoints/options/diagnostics-console.tsx` |

## Business Dependencies

- Shared AI dependency: OpenAI-backed translation, assistant, and summary paths rely on operational OpenAI setup.
- Browser capability dependency: cloud sync providers are filtered by browser capability checks.
- Provider DOM dependency: capture pipelines rely on provider page structures being present and detectable.
- Risk-acceptance dependency: higher-risk settings now rely on one-time user acknowledgments plus persistent contextual warnings in the settings UI.

## Canonical Rule

When a capability boundary changes, update this map in the same change and update the corresponding detailed product document under `docs/product/`.
