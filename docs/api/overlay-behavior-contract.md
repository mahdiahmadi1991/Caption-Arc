# Overlay Code-Derived Behavior Contract

## Purpose

This document captures how the content overlay restores layout, applies settings, controls visibility, and tears itself down.

It is a characterization artifact derived from implementation code, not a requirement specification.

## Source Files

- [../../entrypoints/content/overlay/index.ts](../../entrypoints/content/overlay/index.ts)
- [../../entrypoints/content/overlay/settings.ts](../../entrypoints/content/overlay/settings.ts)
- [../../entrypoints/content/overlay/visibility.ts](../../entrypoints/content/overlay/visibility.ts)
- [../../entrypoints/content/overlay/interactions.ts](../../entrypoints/content/overlay/interactions.ts)

## Rule ID Convention

- Contract rule IDs: `C-OVLAY-<NNN>`
- Traceability case IDs: `OVLAY-<NNN>`

## Contract Rules

## C-OVLAY-001: Stored overlay frames are clamped to viewport bounds before they are restored

Source: `getStoredOverlayPosition`, `clampOverlayMountPosition`, `clampOverlayMountSize`, `applyStoredOverlayFrame`, `primeCompactOverlayFrame` in [../../entrypoints/content/overlay/index.ts](../../entrypoints/content/overlay/index.ts)

Rules:

1. Stored overlay positions are scoped per active meeting platform.
2. Restored expanded frames clamp width to at least `520` px and height to at least `380` px.
3. Restored positions clamp to a viewport margin of `16` px.
4. Compact-start overlays restore their saved expanded size into `savedPosition` while mounting the live shell at compact dimensions.
5. Compact-start overlays use `296x68` as the compact mount size.

## C-OVLAY-002: Overlay creation is single-instance and wires runtime subsystems before first render

Source: `createOverlay`, `applyOverlayAppearance`, `makeDraggable`, `makeResizable` in [../../entrypoints/content/overlay/index.ts](../../entrypoints/content/overlay/index.ts); `persistOverlayPosition` in [../../entrypoints/content/overlay/interactions.ts](../../entrypoints/content/overlay/interactions.ts)

Rules:

1. `createOverlay()` returns immediately when an overlay instance already exists.
2. New overlays append a single root element with header, translation dock, content area, footer, resize handles, and assistant surface integration.
3. Stored-frame and compact-start overlays mount with temporary hidden visibility and no transition until the first animation frame completes.
4. Overlay creation applies locale attributes, theme preference, visibility preference, footer synchronization, and dock layout sizing before the first steady-state render.
5. Overlay creation starts drag, resize, tooltip, footer ticker, locale observer, and assistant-surface synchronization.
6. Persisted drag and resize updates are written back to `settings.overlayPositionsByPlatform` and then sent to background settings persistence.

## C-OVLAY-003: Overlay appearance and visibility are driven directly by current settings state

Source: `applyOverlayAppearance` in [../../entrypoints/content/overlay/index.ts](../../entrypoints/content/overlay/index.ts); `syncOverlayVisibilityPreference`, `showOverlay`, `hideOverlay` in [../../entrypoints/content/overlay/visibility.ts](../../entrypoints/content/overlay/visibility.ts)

Rules:

1. Overlay appearance applies the current theme preference, opacity percentage, and click-through class directly to the live overlay root.
2. `syncOverlayVisibilityPreference()` toggles `mc-hidden` and `aria-hidden` from `settings.overlayVisible`.
3. `showOverlay()` refuses to show the overlay when `settings.overlayVisible` is `false` and instead routes through `hideOverlay()`.
4. `showOverlay()` removes hidden, exit, and dismissed classes only when the overlay is not already visible.
5. `hideOverlay()` is idempotent and only mutates classes and `aria-hidden` when the overlay is not already hidden.

## C-OVLAY-004: Applying saved UI settings updates the live overlay and dependent surfaces immediately

Source: `updateUIFromSettings`, `saveOverlaySettings` in [../../entrypoints/content/overlay/settings.ts](../../entrypoints/content/overlay/settings.ts)

Rules:

1. `updateUIFromSettings()` toggles the `translation-off` class immediately from `settings.translationEnabled`.
2. `updateUIFromSettings()` reapplies overlay appearance and visibility whenever an overlay exists.
3. `updateUIFromSettings()` also resynchronizes active prompt theme, capture guide, header copy, compact status, translation dock, overlay footer, assistant availability, and assistant surface state.
4. `saveOverlaySettings(newSettings)` mutates local settings state before it attempts background persistence.
5. Background settings-save failures are swallowed after diagnostics logging and do not prevent local UI refresh.

## C-OVLAY-005: Overlay teardown clears prompt/theme/footer observers and removes all overlay-owned DOM state

Source: `destroyOverlay` in [../../entrypoints/content/overlay/index.ts](../../entrypoints/content/overlay/index.ts)

Rules:

1. Overlay teardown resets the active capture-consent prompt before removing overlay DOM.
2. Overlay teardown stops theme, locale, tooltip, and dock-layout observers before it removes the root element.
3. Overlay teardown stops the footer ticker and destroys the tooltip system.
4. Overlay teardown removes the overlay root from the document when it is still attached.
5. Overlay teardown destroys the assistant surface and clears overlay-owned state references.

## Test Traceability

- [../quality/references/overlay-traceability-matrix.md](../quality/references/overlay-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If overlay frame restoration, live settings sync, visibility rules, or teardown semantics change in code, update this contract and its traceability matrix in the same change set.