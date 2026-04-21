# Manual Test Checklist

Use this checklist together with:

- [testing-quality-gate.md](./testing-quality-gate.md)
- [testing-onboarding.md](./testing-onboarding.md)

## Pre-Run

- extension built and loaded from `.release/development/<browser>` or `.release/production/<version>/<browser>`, matching the browser and environment under test
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

## AI Assistant Checks

- baseline answer-for-me path from a real joined Meet session produces one attached assistant output
- repeated question handling: `q1` followed by `q1 + q2` only answers the unresolved question
- `others_only` suppresses self-authored speech in the same live session
- output language changes mid-session affect new assistant outputs without requiring a new session
- switching profiles mid-session changes or suppresses assistant behavior as expected
- `salience_first` reacts to risk/blocker statements without a question mark
- `proactive` + `coach_me` can react to a longer self-authored statement when participant scope allows it
- assistant outputs in meeting history render readable markdown structure and stay attached to the triggering timeline item
- generation failures or provider truncation surface diagnostics without persisting a fake completed answer

## Commands

```bash
pnpm chrome:debug:reload
pnpm chrome:smoke:live:assistant baseline
pnpm chrome:smoke:live:assistant q1-then-q1-plus-q2
pnpm chrome:smoke:live:assistant language-switch-en-to-fa
pnpm chrome:smoke:live:assistant:matrix
pnpm chrome:smoke:live google-meet lobby
pnpm chrome:smoke:live microsoft-teams meeting
pnpm chrome:smoke:live zoom-web meeting
pnpm chrome:smoke:live:matrix
```

## Owner Approval Checkpoint

- run DLS in a visible session
- repository owner watches and confirms expected behavior
- do not mark manual runtime validation complete until explicit owner approval is recorded
