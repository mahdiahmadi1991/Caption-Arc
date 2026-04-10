# Close-Mode Terms Decline Parity

This Execution Plan is a historical record of the completed work.

## Purpose / Big Picture

Align all close-mode Terms surfaces so `Decline` closes the page instead of leaving the user on the Terms screen.

## Scope

- inspect the current popup-gate close-mode decline path
- reuse the verified background save-and-close behavior for all close-mode decline flows
- verify the exact popup-gate Terms URL in the Chrome debug runtime

## Non-Goals

- changing non-close return targets
- redesigning Terms acceptance UX

## Progress

- [x] Inspect the current popup-gate close-mode decline path
- [x] Implement close-mode decline parity
- [x] Validate the popup-gate decline flow directly

## Outcomes and Retrospective

- Root cause: the dedicated background save-and-close path existed only for the install surface, so popup-gate close-mode Terms pages still stayed open on decline.
- Fix: the decline action now uses the same background-controlled close path for every close-mode Terms page, not only install.
- Verification: rebuilt production Chrome, reloaded the extension runtime, and validated a unique `source=popup-gate&returnTo=close` Terms URL via CDP. The `Decline` button closed the unique Terms target successfully.
