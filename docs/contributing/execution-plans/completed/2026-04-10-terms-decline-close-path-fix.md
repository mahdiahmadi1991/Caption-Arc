# Terms Decline Close Path Fix

This Execution Plan is a historical record of the completed work.

## Purpose / Big Picture

Fix the accept-mode Terms `Decline` action so it exits deterministically instead of staying on the same page when opened with `returnTo=close`.

## Scope

- inspect the current close-path regression introduced by return-flow work
- implement a deterministic fallback for `Decline` on close-mode Terms pages
- verify the fix directly against the Terms page flow

## Non-Goals

- redesigning the broader Terms gate
- changing legal copy

## Progress

- [x] Inspect current Terms decline path
- [x] Implement deterministic close/fallback behavior
- [x] Validate the decline click flow directly

## Outcomes and Retrospective

- Root cause: the install-scoped `Decline` path still depended on a close-style return flow, which could leave the user on the same Terms surface instead of exiting it clearly.
- Fix: the install-scoped `Decline` flow now routes directly to `options.html`, which immediately renders the blocked shell until the current Terms are accepted.
- Verification: rebuilt the production Chrome extension, reloaded the debug runtime, and validated the exact install-style Terms URL via CDP. After invoking `Decline`, the Terms target no longer remained open and `options.html` opened instead.
