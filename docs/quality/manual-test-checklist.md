# Manual Test Checklist

Use this checklist together with:

- [testing-quality-gate.md](./testing-quality-gate.md)
- [testing-onboarding.md](./testing-onboarding.md)

## Pre-Run

- extension built and loaded from `.release/<browser>/<mode>`, matching the browser and environment under test
- settings configured with valid AI credentials (if AI paths are under test)
- clean or known browser profile state

## Core Checks

- provider detection accuracy
- no false activation on non-meeting pages
- caption capture and speaker extraction behavior
- translation toggle and target-language behavior
- meeting history save/load/search flows
- summary generation and retry/cancel behavior
- summary-ready notification behavior, same-session suppression, and notification click routing to expanded summary detail
- overlay visibility/click-through/opacity behavior

## Commands

```bash
pnpm chrome:debug:reload
pnpm chrome:smoke:live google-meet lobby
pnpm chrome:smoke:live microsoft-teams meeting
pnpm chrome:smoke:live zoom-web meeting
pnpm chrome:smoke:live:matrix
```

## Owner Approval Checkpoint

- run DLS in a visible session
- repository owner watches and confirms expected behavior
- do not mark manual runtime validation complete until explicit owner approval is recorded
