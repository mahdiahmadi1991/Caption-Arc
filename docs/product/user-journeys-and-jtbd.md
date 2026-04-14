# User Journeys And JTBD

This document defines outcome-oriented user journeys grounded in current product behavior.

## JTBD 1: Follow multilingual live conversations

When I am in a supported browser meeting with live captions, I want to read translated captions in context so I can keep up without switching tools.

Current journey:

1. User joins a supported meeting page.
2. Provider runtime resolves meeting context and startup policy (`off`, `ask`, `always`).
3. Overlay shows captured caption flow and translation state.
4. User keeps translation on with selected target language and OpenAI model.

Primary surfaces:

- `entrypoints/content/platform-runtime.ts`
- `entrypoints/content/providers/*`
- `entrypoints/content/overlay/*`
- `entrypoints/background/translation.ts`

## JTBD 2: Respond faster during live meetings

When the conversation moves quickly, I want live AI suggestions shaped to my meeting type so I can answer clearly and quickly.

Current journey:

1. User selects a summary profile with assistant configuration.
2. Assistant trigger policy evaluates captured events (`questions_requests_only`, `salience_first`, `proactive`).
3. Assistant streams short outputs to the in-meeting assistant surface.
4. Outputs are attached to session artifacts for later review.

Primary surfaces:

- `entrypoints/shared/summary-profiles.ts`
- `entrypoints/background/assistant.ts`
- `entrypoints/content/overlay/assistant-surface.ts`

## JTBD 3: Keep a searchable record after meetings

When meetings end, I want searchable session history and reusable summary output so follow-up work is faster and more reliable.

Current journey:

1. Session is finalized and persisted to local history stores.
2. User filters/searches sessions in meeting history UI.
3. User translates missed lines, generates profile-based summaries, or exports transcript.
4. User can star important sessions and revisit assistant outputs.

Primary surfaces:

- `entrypoints/background/history.ts`
- `entrypoints/background/history-db.ts`
- `entrypoints/meeting-history/*`

## JTBD 4: Recover and continue across devices

When I change devices or need backup recovery, I want continuity without giving up local-first ownership.

Current journey:

1. User keeps local-first archive as default.
2. User optionally connects cloud sync provider(s) when supported by browser capability.
3. User can export encrypted backup (`.mcbak`) and restore from backup bundle.
4. Shared settings and archive state reconcile through cloud sync tasks/checkpoints.

Primary surfaces:

- `entrypoints/background/cloud-sync/*`
- `entrypoints/background/data-transfer.ts`
- `entrypoints/shared/app-data-backup.ts`
- `entrypoints/shared/browser-capabilities.ts`

## JTBD 5: Keep continuity when rejoining the same meeting

When I temporarily leave and rejoin a meeting, I want the session to continue in one record so summaries and follow-up remain coherent.

Current journey:

1. Runtime detects a recently ended candidate session.
2. Continuation eligibility is evaluated against configured continuation window and identity signals, anchored to the latest ended activity timestamp of the candidate session.
3. User resumes existing session or starts a new session depending on policy and decision flow.
4. Session-ended review prompts (`stay` or `exit`) are resolved before teardown on provider reset-shell routes.
5. Rejoin metadata is preserved for timeline and history continuity.

Primary surfaces:

- `entrypoints/content/platform-runtime.ts`
- `entrypoints/background/history.ts`
- `entrypoints/shared/meeting-session.ts`

## JTBD 6: Use fast controls during live context changes

When meeting state changes quickly, I want a quick popup control surface so I can verify runtime state and apply core toggles without opening full settings.

Current journey:

1. Content runtime publishes quick-access status to background.
2. Popup reads prioritized runtime snapshot.
3. User checks meeting state and applies quick actions such as overlay visibility and settings jump.
4. User uses full options only for deeper, durable configuration.

Primary surfaces:

- `entrypoints/popup/App.tsx`
- `entrypoints/background/quick-access-runtime.ts`
- `entrypoints/shared/quick-access-status.ts`

## Journey Update Rule

If any journey step changes in behavior, entry criteria, or supported browser/provider scope, update this document and `docs/product/feature-availability-matrix.md` in the same change.
