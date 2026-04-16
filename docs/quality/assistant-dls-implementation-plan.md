# AI Assistant DLS Implementation Plan

This document defines the implementation-ready plan for browser-level DLS coverage of the live AI Assistant module.

Use it together with:

- [assistant-test-strategy.md](./assistant-test-strategy.md)
- [assistant-test-backlog.md](./assistant-test-backlog.md)
- [manual-test-checklist.md](./manual-test-checklist.md)
- [references/agent-onboarding-cdp-runtime.md](./references/agent-onboarding-cdp-runtime.md)

## Purpose

The assistant module already has deterministic coverage for background generation, persistence, provider streaming, and history rendering.

What is still missing is a browser-level DLS path that proves the full runtime chain works in a real Google Meet session:

1. launch Windows Chrome with remote debugging
2. start from Google Meet landing
3. create and join a meeting
4. synthesize fake participant capture directly at the extension capture boundary
5. observe assistant outputs, pending states, diagnostics, and meeting-history persistence
6. validate the full assistant settings matrix end to end
7. audit CaptionArc extension errors from `chrome://extensions`, clear them after inspection, and fail on newly introduced post-run errors

This plan exists so assistant DLS does not become an ad hoc browser script that drifts away from the assistant strategy and behavior contracts.

## DLS Scope

This plan covers:

- Google Meet assistant DLS only
- a real browser runtime in the user-owned Windows Chrome debug profile
- a real joined Meet session created from `meet.google.com/landing`
- fake participant capture injection through the extension content runtime
- assistant output validation through overlay, diagnostics, and persisted session state

This plan does not cover:

- replacing deterministic contract and replay tests
- Microsoft Teams or Zoom assistant DLS in the first implementation slice
- live human speech recognition as a test prerequisite
- asserting exact OpenAI prose

## DLS Principles

1. DLS proves browser wiring and runtime behavior; deterministic suites still own the bulk matrix.
2. The canonical runtime is Windows Google Chrome with remote debugging, not Chrome for Testing.
3. The canonical artifact is `.release/v<version>/development/chrome`.
4. DLS must create and join a real Meet session from landing before any assistant assertions.
5. Fake transcript data should enter at the extension capture boundary instead of coupling the DLS matrix to Google Meet DOM churn.
6. A minimal real Meet/provider smoke path should still exist to prove provider wiring has not drifted.
7. DLS assertions must focus on behavior and state, not exact model wording.
8. Every assistant DLS run must inspect CaptionArc extension errors before and after the scenario and clear them after reading.
9. Every assistant profile option must have a defined validation owner:
   - `browser DLS`
   - `contract/replay`
   - or both

## Success Criteria

This plan is complete when:

1. `pnpm chrome:smoke:live:assistant google-meet baseline` exists and passes in the owner debug browser
2. the DLS flow creates a Meet session from landing, joins it, and injects fake capture after join
3. assistant overlay assertions are deterministic enough to catch regressions without manual DOM inspection
4. persisted assistant outputs can be verified from extension runtime or meeting-history state
5. every assistant profile option has an explicit validation surface mapping
6. DLS results can be summarized with the same reporting discipline as existing runtime smoke flows
7. the assistant DLS matrix covers every live assistant setting value exposed in the options UI with at least one joined-session scenario

## Canonical Runtime Flow

The assistant DLS command family must follow this sequence:

1. `pnpm build:target:chrome:development`
2. verify build success
3. `pnpm chrome:debug:reload`
4. ensure CDP readiness against the Windows Chrome runtime
5. navigate to `https://meet.google.com/landing`
6. create a new meeting from landing
7. join the meeting
8. bootstrap the assistant DLS harness inside the joined tab
9. execute a scenario fixture
10. collect overlay, diagnostics, and persisted-state assertions

Build and reload must never run in parallel.

## Proposed Deliverables

### Command Surface

Add commands:

- `pnpm chrome:smoke:live:assistant google-meet <scenario>`
- `pnpm chrome:smoke:live:assistant:matrix`

Optional fast aliases:

- `pnpm chrome:smoke:assistant`
- `pnpm chrome:smoke:assistant:fresh`

### Runtime Scripts

Add:

- `scripts/manual-smoke/smoke-google-meet-assistant.sh`
- `scripts/manual-smoke/smoke-google-meet-assistant.mjs`
- `scripts/manual-smoke/lib/assistant-dls-scenarios.mjs`
- `scripts/manual-smoke/lib/google-meet-assistant-harness.mjs`
- `scripts/manual-smoke/lib/assistant-dls-capture-driver.mjs`
- `scripts/manual-smoke/lib/assistant-dls-observer.mjs`
- `scripts/manual-smoke/lib/assistant-dls-settings.mjs`

### Fixtures

Add:

- `scripts/manual-smoke/fixtures/assistant-dls/baseline-answer-for-me.json`
- `scripts/manual-smoke/fixtures/assistant-dls/q1-then-q1-plus-q2.json`
- `scripts/manual-smoke/fixtures/assistant-dls/others-only-self-speech.json`
- `scripts/manual-smoke/fixtures/assistant-dls/language-switch-en-to-fa.json`
- `scripts/manual-smoke/fixtures/assistant-dls/profile-switch-mid-session.json`
- `scripts/manual-smoke/fixtures/assistant-dls/salience-first-client-call.json`
- `scripts/manual-smoke/fixtures/assistant-dls/proactive-coach-mode.json`
- `scripts/manual-smoke/fixtures/assistant-dls/daily-sync-bullets-fastest.json`
- `scripts/manual-smoke/fixtures/assistant-dls/custom-prompt-short-paragraph.json`
- `scripts/manual-smoke/fixtures/assistant-dls/improve-my-answer-script.json`
- `scripts/manual-smoke/fixtures/assistant-dls/summarize-structured-sections.json`

### Docs And Traceability

Add or update:

- assistant DLS section in [manual-test-checklist.md](./manual-test-checklist.md)
- assistant DLS reference under [README.md](./README.md)
- assistant generation traceability matrix entries for browser DLS cases
- fixture-coverage contract for the canonical assistant DLS matrix

## Architecture

## A. Meet Session Acquisition

The DLS runner must:

1. open `https://meet.google.com/landing`
2. create a meeting through the real landing flow
3. join the meeting tab
4. wait until the CaptionArc content runtime and overlay can be observed

The DLS implementation must not skip directly to a stale reused meeting URL for assistant acceptance.

### Required Helper Behavior

- reuse existing Meet tabs only if they are already joined and match the intended scenario
- otherwise create a fresh meeting from landing
- expose the final joined meeting URL and session id in logs

## B. Capture Fixture Driver

The fixture driver is the core of assistant DLS.

It must run in the joined Meet page context and support:

1. creating fake participant capture events directly through the extension content runtime
2. updating an existing captured utterance to simulate caption churn
3. finalizing captions vs non-final live updates
4. generating multiple speakers
5. simulating self-authored vs other-authored speech
6. optional fake chat events if a scenario later requires them

### Required Driver API

The page-side injected API should support operations like:

- `reset()`
- `pushCaption({ speaker, text, isFinal, own, timestampOffsetMs })`
- `updateCaption({ stableKey, text, isFinal })`
- `finalizeCaption({ stableKey })`
- `pushSequence([...steps])`

### Capture Boundary Rule

The driver must inject data at the same boundary the extension uses after provider capture, rather than impersonating Meet's caption DOM.

This means:

- session materialization still happens inside the content runtime
- overlay updates come from real CaptionArc state transitions
- assistant sync observes the same persisted session artifacts as production
- most DLS scenarios are insulated from upstream Meet DOM churn

A smaller separate smoke path can still validate that the live Google Meet provider discovers real captions.

## C. Assistant DLS Observer

The DLS observer must collect assertions from three places:

1. overlay surface
2. diagnostics stream
3. persisted session artifacts

### Overlay Assertions

The observer must read:

- pending assistant cards
- completed assistant cards
- trigger text labels
- unread/live-state markers when relevant

### Diagnostics Assertions

The observer must read:

- assistant pass started/completed events
- suppression reasons
- provider failure or truncation diagnostics
- prompt-relevant metadata when available

### Persistence Assertions

The observer must verify:

- `assistantOutputs`
- `assistantMemory`
- `assistantState`
- meeting-history rendering compatibility for stored output

Persistence can be read through extension runtime helpers instead of raw storage files.

## D. Settings And Profile Mutator

Assistant DLS needs a controlled way to update settings during a live session.

The mutator must support:

- changing `meetingOutputLanguage`
- changing `defaultMeetingProfileId`
- editing the active profile assistant config before a run
- optionally toggling session assistant state if the scenario needs it

Preferred path:

1. write through extension runtime or `saveSettings`
2. wait for runtime propagation
3. assert the new settings snapshot before continuing

## Scenario Design

## Golden Browser Scenarios

These scenarios must exist as first-class DLS cases.

### ADLS-001 Baseline Answer-For-Me

Goal:

- prove the assistant responds to a direct interviewer question after fake participant capture is injected

Assertions:

- overlay enters pending/triggered state
- completed assistant output appears
- output attaches to the correct trigger
- persisted session contains one assistant output for the trigger key

### ADLS-002 Repeated Question Then New Clause

Stimulus:

1. inject `q1`
2. wait for assistant output
3. inject `q1 + q2`

Assertions:

- second pass does not repeat the already answered clause
- stored output for the second trigger resolves to the unresolved clause only

### ADLS-003 Others-Only Suppresses Self Speech

Stimulus:

- active profile with `participantScope = others_only`
- inject fake self-authored caption

Assertions:

- no assistant output is created
- diagnostics classify the pass as suppressed or no-candidate

### ADLS-004 Output Language Switch Mid-Session

Stimulus:

1. start with `meetingOutputLanguage = en`
2. produce one valid assistant output
3. switch to `fa`
4. inject a new participant question

Assertions:

- second output is generated after the switch
- visible output is Persian-direction-safe
- persisted output records the new response under the later trigger

### ADLS-005 Profile Switch Mid-Session

Stimulus:

1. start in one profile, for example `interview`
2. produce one output
3. switch to another profile, for example `client_call`
4. inject a new trigger event

Assertions:

- later generation follows the semantics of the new profile
- if the target profile disables assistant by default and no session override exists, pass is suppressed

### ADLS-006 Salience-First Client-Call

Stimulus:

- profile with `triggerPolicy = salience_first`
- inject a salient non-question such as a risk, blocker, or objection

Assertions:

- assistant generates next-point or risk-aware guidance without requiring a literal question

### ADLS-007 Proactive Coach Mode

Stimulus:

- profile with `triggerPolicy = proactive`
- inject a long non-question status or framing statement

Assertions:

- assistant still triggers
- output respects the configured response intent and format

## Option Coverage Matrix

Every assistant option must have behavioral validation ownership.

| Option | DLS Required | Contract/Replay Required | Notes |
| --- | --- | --- | --- |
| `enabledByDefault` | yes | yes | browser proof plus deterministic suppression |
| `prompt` | yes | yes | browser uses sentinel prompt cases; contracts still own exact prompt semantics |
| `responseIntent` | yes | yes | DLS should cover every enum value at least once |
| `responseFormat` | yes | yes | DLS should cover every enum value, with render-shape assertions for markdown-sensitive formats |
| `responseDepth` | yes | yes | DLS validates metadata selection and representative live behavior |
| `responseTone` | yes | yes | DLS validates metadata selection and representative live behavior |
| `deliveryBias` | yes | yes | DLS validates metadata selection and representative live behavior |
| `triggerPolicy` | yes | yes | browser and deterministic coverage both required |
| `participantScope` | yes | yes | browser proof for self-vs-other behavior is required |
| `meetingOutputLanguage` | yes | yes | mid-session browser switch is required |
| `defaultMeetingProfileId` | yes | yes | live profile switching and fallback both matter |

## Response Intent Coverage

The DLS suite must cover every intent enum at least once:

- `answer_for_me`
- `improve_my_answer`
- `suggest_next_point`
- `summarize_what_was_just_said`
- `surface_risks`
- `coach_me`

## Response Format Coverage

Browser DLS must explicitly cover every format enum:

- `talking_points`
- `bullets`
- `short_paragraph`
- `structured_sections`
- `script`

## Phased Implementation

## Phase 0: Harness Contract

Deliverables:

- document the page-driver API
- define scenario fixture schema
- define DLS result schema

Exit criteria:

- fixture schema is stable enough to build multiple scenarios without rewriting the runner

## Phase 1: Meet Create And Join Automation

Deliverables:

- DLS runner can create a new meeting from landing and join it
- runner emits final meeting URL and verifies overlay presence

Exit criteria:

- the joined session can be reproduced reliably from DLS command line

## Phase 2: Fake Caption Injection

Deliverables:

- page-side caption fixture driver
- support for append, update, finalize, speaker identity, and own-vs-other simulation

Exit criteria:

- provider runtime reacts to injected captions the same way it reacts to live Meet captions for the targeted scenarios

## Phase 3: Observer And Assertions

Deliverables:

- overlay observer
- diagnostics collector integration
- persistence observer

Exit criteria:

- one baseline scenario can assert pending, completed, and persisted output without manual inspection

## Phase 4: Golden Scenario Set

Deliverables:

- `ADLS-001` through `ADLS-005`

Exit criteria:

- assistant DLS is valuable for daily acceptance, not just a demo

## Phase 5: Full Option Coverage Mapping

Deliverables:

- complete coverage matrix checked against real option enums
- representative DLS scenarios for browser-owned behaviors
- remaining gaps assigned to contract/replay suites

Exit criteria:

- no assistant profile option is left without a named validation owner

## Phase 6: Governance And Reporting

Deliverables:

- package commands
- docs updates
- traceability entries
- reporting template for assistant DLS runs
- extension error audit and clear discipline in the DLS flow

Exit criteria:

- assistant DLS fits into the same thread reporting model as other DLS work

## Risks And Controls

### Risk 1: Meet DOM Drift

Control:

- isolate caption-driver selectors in one helper
- fail fast with explicit diagnostics when caption root resolution breaks
- keep one lightweight DOM-shape probe command for quick repair work

### Risk 2: Browser DLS Becomes Too Slow

Control:

- keep DLS to golden browser cases
- keep the full option matrix primarily in contract/replay
- reuse a joined session for scenario batches when safe

### Risk 3: Output Assertions Become Model-Text Fragile

Control:

- assert trigger identity, language, render shape, state transitions, and persistence
- avoid exact prose assertions except for tiny sentinel fragments when necessary

### Risk 4: Fake Captions Bypass The Real Provider Too Much

Control:

- inject at the DOM layer consumed by the provider, not at a synthetic background shortcut
- keep one baseline probe that confirms content provider ingestion sees the injected sequence

## Implementation Order Recommendation

The first implementation slice should be:

1. command surface and runner skeleton
2. landing -> create -> join flow
3. baseline fake capture injection
4. baseline overlay + persistence assertions
5. `ADLS-001`
6. `ADLS-002`
7. `ADLS-003`
8. `ADLS-004`
9. remaining option-driven scenarios

This order gives usable assistant DLS value early while keeping the highest-risk wiring visible.

## Completion Gate

The assistant DLS implementation can be considered ready for normal use when:

1. baseline and repeated-question scenarios pass in the owner Windows Chrome runtime
2. language switch and profile switch pass end to end
3. option coverage matrix is published and linked
4. command help and docs are discoverable from quality docs
5. owner-reviewed DLS evidence is captured for at least one real joined-session run
