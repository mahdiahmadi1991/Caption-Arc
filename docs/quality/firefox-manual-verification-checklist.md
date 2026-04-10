# Firefox Manual Verification Checklist

Use this checklist for runtime-affecting or browser-sensitive changes until the repository ships a canonical automated Firefox runtime workflow.

## When It Is Required

Run and record this checklist when a change affects any of the following:

- content-script behavior, provider detection, overlay runtime, or caption capture
- background/runtime messaging, storage, permissions, or browser API usage
- options, popup, or meeting-history pages
- build, packaging, release, or manifest behavior that changes the Firefox artifact

Packaging-only changes may stop after the build and load validation steps if no runtime surface changed.

## Prerequisites

```bash
pnpm build:firefox:production
```

Use `.release/firefox/production` unless the thread explicitly needs the development artifact.

## Minimum Checklist

1. Load `.release/firefox/production` from `about:debugging#/runtime/this-firefox`.
2. Confirm the extension loads without manifest or permission errors.
3. Open Options and verify settings render, save, and survive a page refresh.
4. Open Popup and verify the page renders without runtime errors.
5. If the change touches an in-meeting flow, validate the impacted provider path on Firefox and record the exact provider and scenario.
6. If the change touches history or summaries, open Meeting History and verify the changed flow there.
7. If the change touches summary notifications, verify Firefox shows the success notification only when focus is away from the same session detail, then click the notification and confirm it opens Meeting History on the exact expanded summary.
8. Verify browser-gated cloud sync behavior remains explicit on Firefox: Google Drive and OneDrive must stay visibly unavailable until the browser limitation is intentionally removed.

## Evidence To Record

Every thread that uses this checklist must record:

- the Firefox build command that was run
- the artifact path that was loaded
- the Firefox version used for the check
- which surfaces or provider scenarios were exercised
- pass or fail outcome for each exercised step
- any intentionally skipped step with a reason

## Removing A Temporary Firefox Limitation

Do not remove a Firefox capability gate unless the same change also provides all of the following:

- browser-specific implementation evidence showing the API path works on Firefox
- updated automated tests or explicit manual verification evidence for the affected flow
- documentation updates to the compatibility matrix, release notes or store copy, and any setup guidance that previously described the limitation

The default assumption is that a Firefox limitation stays in place until the repository contains positive browser-specific proof that it is safe to remove.