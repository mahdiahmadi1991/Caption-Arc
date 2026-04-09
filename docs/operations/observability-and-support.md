# Observability And Support

## Runtime Diagnostics Surfaces

- CDP connectivity and runtime checks via `chrome:debug:*` scripts
- structured debug-only diagnostics collected through the background runtime collector
- direct agent/runtime retrieval through `chrome:debug:diagnostics*` commands during debug sessions
- environment-aware diagnostics thresholds defined in `entrypoints/shared/environment/development.ts` and `entrypoints/shared/environment/production.ts`
- options-page diagnostics console gated by `diagnostics.viewerEnabled` in the same environment config files
- release artifacts isolated under `.release/chrome/<mode>` and `.release/firefox/<mode>`, with Chrome debug/smoke defaults pointed at `.release/chrome/production`
- smoke scripts for provider-level regressions
- UI-level status in popup/options/history surfaces

## Options Diagnostics Console

- the options page exposes a floating diagnostics launcher in the bottom-right corner when `diagnostics.viewerEnabled` is true for the current environment
- the drawer reads only from the canonical background collector via `getDiagnosticsPayload`, `getDiagnosticsConfig`, `setDiagnosticsConfig`, and `clearDiagnosticsData`
- silent auto-polling runs only while the drawer is open and the options tab is visible
- auto-poll updates the UI only when the diagnostics payload meaningfully changes
- the drawer keeps a fixed viewport-height shell, traps scroll within the diagnostics surface while open, and lets operators filter multiple levels at once
- production keeps its baseline diagnostics threshold at `off`; the drawer can still enable capture temporarily for the current session without rewriting the environment baseline
- copy actions export only the currently visible filtered events, using the sanitized canonical event payload; raw canonical message keys stay intact even when the UI shows richer titles and summaries

## Support Workflow

1. capture failing provider/scenario and runtime mode
2. run doctor + targeted smoke command
3. confirm the effective diagnostics threshold for the current environment and raise it temporarily when deeper traces are needed
4. inspect the canonical diagnostics stream directly through the runtime or through the options diagnostics console when a UI workflow is more useful
5. patch and re-run matrix smoke
