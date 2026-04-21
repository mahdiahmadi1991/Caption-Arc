# Terms Gate Review Fixes

This Execution Plan is a living document.

## Purpose / Big Picture

Address the review findings introduced by the Terms gate rollout so upgrades are prompted correctly, revoking Terms acceptance halts protected background work, and legal-risk acknowledgements persist immediately when the user confirms them.

## Scope

- prompt users on upgrade when the current Terms version is not yet accepted
- tear down protected background services when a current acceptance is replaced by a current decline
- persist legal-risk acknowledgements transactionally when the user confirms the modal
- update behavior docs if the fixed behavior changes the documented contract

## Non-Goals

- redesigning the legal UX beyond the review findings
- changing unrelated Terms gating surfaces

## Progress

- [x] Inspect the current Terms-gate and legal-risk persistence flows
- [x] Implement the review fixes in background and options flows
- [x] Validate the touched behavior-sensitive surfaces and docs sync

## Outcomes and Retrospective

Implemented three review-driven fixes:

- extension updates now open the current Terms page when the current Terms version
  is not yet accepted on that device
- replacing a current Terms acceptance with a current decline now shuts down
  protected background services instead of leaving cloud-sync and summary work
  active in the same session
- legal-risk modal confirmations now persist immediately through the transactional
  save path instead of relying on delayed autosave

Validation completed successfully:

- `pnpm test:targeted:plan`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`
