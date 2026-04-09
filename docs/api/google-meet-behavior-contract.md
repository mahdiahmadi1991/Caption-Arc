# Google Meet Code-Derived Behavior Contract

## Purpose

This document captures the current Google Meet behavior contract derived from implementation code.

It is a characterization artifact, not a product requirement spec.

## Source Files

- [google-meet.ts](../../entrypoints/content/providers/google-meet.ts)
- [platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)
- [index.ts](../../entrypoints/content/index.ts)

## Contract Rules

## C-URL-001: Google Meet page-kind classification

Source: `getGoogleMeetPageKind`

Rules:

1. pathname exactly `/new` -> page kind `new`.
2. pathname matching `/<aaa-bbbb-ccc>` (optionally trailing slash) -> page kind `meeting`.
3. otherwise -> `null`.

## C-URL-002: Provider URL matching

Source: `googleMeetProvider.matchesUrl`

Rules:

1. returns `true` only if `getGoogleMeetPageKind(url) !== null`.
2. non-meeting routes (for example `/landing`) are not matched by this provider URL matcher.

## C-CTX-001: Google Meet page-context detection

Source: `hasGoogleMeetPageContext`, `googleMeetProvider.matchesPageContext`

Rules:

1. page kind must be non-null; otherwise context is false.
2. page kind `new` always returns true.
3. for page kind `meeting`, context is true if any of these are true:
- leave-call control is present
- prejoin surface is detected
- meeting shell hint is detected

## C-CTX-002: Leave-call control detection

Source: `hasGoogleMeetLeaveCallControl`

Rules:

1. checks interactive elements excluding inside `#captionarc-overlay`.
2. true when a button has aria-label `leave call` (case-insensitive).
3. true when a button contains icon text `call_end` in selector `[data-google-symbols-override="true"]`.

## C-CTX-003: Prejoin surface detection

Source: `hasGoogleMeetPrejoinSurface`

Rules:

1. true when an interactive element has text or aria-label matching one of:
- `join now`
- `ask to join`
- `present`
2. true when body text contains `use companion mode`.
3. true when `[data-meeting-title]` exists and has a value.

## C-CTX-004: Meeting shell hint detection

Source: `hasGoogleMeetMeetingShellHint`

Rules:

1. applied only when page kind is `meeting`.
2. true when document title matches `Meet` or `Meet - ...`.
3. true when body text includes one of:
- `getting ready`
- `preparing your meeting`
- `setting things up for your meeting`

## C-PRES-001: Meeting presence classification

Source: `getGoogleMeetPresence`, `googleMeetProvider.getMeetingPresence`

Rules:

1. if page kind is null OR page-context is false -> `unknown`.
2. if page kind is `new` -> `prejoin`.
3. if leave-call control exists -> `joined`.
4. else -> `prejoin`.

Note:

- current Google branch does not emit `ended` directly from provider presence; end-state handling is runtime/lifecycle-level.

## C-CAP-001: Caption toggle button detection

Source: `getGoogleMeetCaptionToggleButton`

Rules:

1. only enabled `HTMLButtonElement` candidates are considered.
2. disabled buttons are ignored (`disabled` or `aria-disabled="true"`).
3. mode `enable` matches when one of:
- aria-label exactly `turn on captions`
- tooltip text includes `turn on captions`
- icon text is `closed_caption_off`
4. mode `disable` matches when one of:
- aria-label exactly `turn off captions`
- tooltip text includes `turn off captions`
- icon text is `closed_caption`

## C-CAP-002: Captioning availability check

Source: `isGoogleMeetCaptionsEnabled`, `googleMeetProvider.isCaptioningCurrentlyAvailable`

Rules:

1. caption region selector `[role="region"].vNKgIf.UDinHf` means captions enabled.
2. disable-caption button detection also means captions enabled.
3. provider-level `isCaptioningCurrentlyAvailable` checks only region presence.

## C-CAP-003: Auto-enable live captions behavior

Source: `googleMeetProvider.tryEnableLiveCaptions`

Rules:

1. returns true immediately when captions already enabled.
2. polls for `enable` toggle until timeout.
3. if no enable-toggle found before timeout -> false.
4. when toggle found -> click once and start verify window.
5. during verify window, returns true when captions become enabled.
6. after verify window, returns final `isGoogleMeetCaptionsEnabled()`.

## C-META-001: Session metadata extraction

Source: `googleMeetProvider.getSessionMetadata`

Rules:

1. platform is always `google-meet`.
2. provider label is `Google Meet` through shared label map.
3. sourceUrl is current `window.location.href`.
4. title comes from `[data-meeting-title]` attribute.
5. meetingCode extracted from pathname `<aaa-bbbb-ccc>` pattern.

## C-RUNTIME-001: Content-script marker contract

Source: `entrypoints/content/index.ts`

Rules:

1. content script injects meta marker: `meta[name="captionarc-injected"]`.
2. marker is replaced on each script start.
3. marker is removed when context invalidates/aborts.

## C-RUNTIME-002: Reset-page detection guard for Google

Source: `shouldResetRuntimeOnCurrentPage` in `platform-runtime.ts`

Rules:

1. when provider platform is `google-meet` and URL still matches provider URL
2. but provider page-context is false
3. runtime marks page as reset-candidate (`true` path)

## C-SET-001: Translation visibility class

Source: `updateUIFromSettings` in `overlay/settings.ts`

Rules:

1. when `settings.translationEnabled` is `false`, overlay has class `translation-off`.
2. when `settings.translationEnabled` is `true`, `translation-off` is removed.

## C-SET-002: Appearance, opacity, and click-through

Source: `applyOverlayAppearance` in `overlay/index.ts`

Rules:

1. `settings.appearance` updates overlay dataset theme (`data-theme`, `data-theme-preference`).
2. `settings.overlayOpacity` updates CSS var `--mc-overlay-opacity` with `%`.
3. `settings.overlayClickThrough` toggles class `mc-click-through`.

## C-SET-003: Overlay visibility preference

Source: `syncOverlayVisibilityPreference` in `overlay/visibility.ts`

Rules:

1. `settings.overlayVisible=false` adds class `mc-hidden` and sets `aria-hidden="true"`.
2. `settings.overlayVisible=true` removes `mc-hidden` and sets `aria-hidden="false"`.

## C-SET-004: Translation dock and footer chat indicators

Source: `syncTranslationDock` (`overlay/header.ts`), `syncOverlayFooter` (`overlay/footer.ts`)

Rules:

1. translation dock `data-enabled` and toggle pressed state reflect `settings.translationEnabled`.
2. footer chat indicators visibility reflects `settings.storeMeetingChat`.

## Change Control

If behavior is intentionally changed in code, this contract must be updated in the same change set together with matching tests.
