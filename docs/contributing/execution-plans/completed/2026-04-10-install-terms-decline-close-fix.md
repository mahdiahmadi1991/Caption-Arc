# Install Terms Decline Close Fix

This Execution Plan is a historical record of the completed work.

## Purpose / Big Picture

Fix the first-run install Terms `Decline` path so clicking the button closes the Terms page instead of leaving the user stuck on it.

## Scope

- inspect the current install-sourced decline flow
- move the install decline save-and-close path into background-controlled tab closing
- verify the exact install Terms URL flow in the Chrome debug runtime

## Non-Goals

- redesigning the broader Terms acceptance experience
- changing non-install return flows

## Progress

- [x] Inspect current install Terms decline path
- [x] Implement background-controlled install decline close behavior
- [x] Validate the install decline flow directly

## Outcomes and Retrospective

- Root cause: the install flow needed a dedicated save-and-close path. Reusing generic page-side completion logic left the first-run Terms surface vulnerable to staying open instead of closing deterministically.
- Fix: the install-scoped `Decline` action now delegates persistence and tab closing to a dedicated background action, with tab resolution based on `tabId`, sender tab, and current page URL.
- Verification: rebuilt the production Chrome extension, reloaded the Chrome debug runtime, and validated the exact install-style Terms URL through CDP. Both script-triggered and mouse-triggered `Decline` actions closed the unique Terms target successfully.
