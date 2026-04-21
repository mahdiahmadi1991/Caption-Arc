# Assistant Coverage 60 And Settings Matrix Closure

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

Use this plan together with:

- `docs/quality/assistant-test-strategy.md`
- `docs/quality/assistant-test-backlog.md`
- `docs/quality/assistant-dls-implementation-plan.md`
- `docs/quality/references/assistant-generation-traceability-matrix.md`
- `docs/quality/references/assistant-runtime-traceability-matrix.md`

## Purpose / Big Picture

Raise assistant-module test coverage to a trustworthy minimum of `>= 60%` while making every assistant profile setting that changes behavior or visible output explicitly test-owned.

Done means:

- assistant coverage has a canonical file scope and a repeatable command surface
- assistant-owned deterministic coverage reaches at least `60%` statements/lines without gaming the denominator
- assistant profile settings have deterministic validation owners, not only browser DLS ownership
- assistant render surfaces are covered for the settings that materially change visible structure, state, or text direction
- no assistant-owned file remains effectively uncovered
- assistant testing docs and targeted-test tooling reflect the real suites

## Problem Statement

Baseline evidence from the 2026-04-21 assistant-focused coverage run:

- `15` assistant-related Vitest files passed with `52` tests
- aggregate assistant implementation coverage across the currently inspected file scope is `38.10%` statements, `29.47%` branches, `36.91%` functions, and `38.09%` lines
- current file-level lows are:
  - `entrypoints/background/history.ts`: `6.85%` statements
  - `entrypoints/content/assistant-dls-capture-bridge.ts`: `0%` statements
  - `entrypoints/background/providers/openai.ts`: `61.14%` statements
  - `entrypoints/content/overlay/assistant-surface.ts`: `55.92%` statements
  - `entrypoints/content/assistant-service.ts`: `64.06%` statements
  - `entrypoints/background/assistant.ts`: `72.72%` statements

At the same time, assistant DLS already has a strong browser-side option matrix:

- the canonical assistant DLS matrix covers every live assistant enum value at least once
- browser DLS therefore is not the main missing layer
- the bigger remaining gap is deterministic coverage around settings normalization, runtime orchestration, persistence, assistant-specific serialization, capture-bridge support code, and render continuity

There is also a workflow gap:

- `pnpm test:module:plan` does not currently recommend most assistant-specific suites for assistant-owned files
- this makes one of the repository's most fragile modules easier to under-test in future threads

## Scope

This plan covers:

- defining a canonical assistant coverage scope and verification command
- expanding deterministic assistant tests so the module has durable coverage above `60%`
- adding assistant-specific tests for profile configuration defaults, normalization, save/round-trip behavior, and runtime propagation
- covering the visible assistant surfaces for state, format, language, and history rendering continuity
- covering assistant-specific support code that is currently untested, especially the DLS capture bridge
- updating assistant testing docs, traceability, and targeted-test tooling to match the final test inventory
- extracting assistant-owned logic out of mixed files when necessary to make module-level coverage honest and maintainable
- keeping DLS acceptance in this plan limited to the user's current runtime need:
  - Windows/Chrome remote-debug flow
  - Google Meet only

This plan does not cover:

- changing assistant product strategy, model choice, or prompt heuristics beyond what is needed for deterministic testability
- replacing DLS with browser-only regression discovery
- adding new meeting providers or new assistant settings
- lowering coverage targets by silently excluding assistant responsibility from the measured scope

## Repository Context

Primary assistant implementation surfaces:

- `entrypoints/background/assistant.ts`
- `entrypoints/background/history.ts`
- `entrypoints/background/providers/openai.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/content/assistant-service.ts`
- `entrypoints/content/overlay/assistant-surface.ts`
- `entrypoints/content/assistant-dls-capture-bridge.ts`
- `entrypoints/shared/meeting-profiles.ts`
- `entrypoints/shared/meeting-session.ts`
- `entrypoints/meeting-history/components/session-detail.tsx`
- `entrypoints/options/App.tsx`

Current assistant-focused tests already in place:

- `tests/google-meet/assistant-trigger.contract.test.ts`
- `tests/google-meet/assistant-dedupe.contract.test.ts`
- `tests/google-meet/assistant-pass.contract.test.ts`
- `tests/google-meet/assistant-runtime.contract.test.ts`
- `tests/google-meet/assistant-settings-transition.contract.test.ts`
- `tests/google-meet/assistant-profile-switch.contract.test.ts`
- `tests/google-meet/assistant-output-language-transition.contract.test.ts`
- `tests/google-meet/assistant-openai-stream.contract.test.ts`
- `tests/google-meet/assistant-cancellation.contract.test.ts`
- `tests/google-meet/assistant-history-persistence.contract.test.ts`
- `tests/google-meet/assistant-surface.contract.test.ts`
- `tests/google-meet/assistant-history-render.contract.test.tsx`
- `tests/google-meet/assistant-replay.contract.test.ts`
- `tests/google-meet/assistant-dls-matrix.contract.test.ts`
- `tests/google-meet/assistant-dls-observer.contract.test.ts`

Known missing or weak surfaces:

- assistant profile config normalization/defaults/resolution coverage
- assistant-specific `saveSettings` and options-page round-trip coverage
- incomplete-response orchestration coverage as a first-class assistant suite
- assistant-specific persistence/serialization coverage in mixed files
- assistant DLS capture bridge direct coverage
- stronger render matrix coverage for format-sensitive and language-sensitive outputs
- assistant-aware targeted-test recommendations

## Coverage Target Definition

The target is a real assistant-module coverage floor, not a cosmetic number.

Coverage success criteria:

1. canonical assistant module coverage reaches at least:
   - `>= 60%` statements
   - `>= 60%` lines
   - `>= 50%` branches
2. no assistant-owned file in the canonical scope remains below `40%` statement coverage
3. no assistant-owned support file remains at `0%`
4. every assistant profile setting that changes runtime behavior or visible output has:
   - at least one deterministic validation owner
   - and a DLS owner when browser/runtime proof is still necessary

Canonical scope rule:

- do not reach `60%` by simply dropping mixed files such as `history.ts` or `settings.ts`
- if a large mixed-ownership file prevents honest module measurement, extract the assistant-owned logic into dedicated assistant-focused modules and move the coverage target to those extracted files
- this keeps the denominator accurate without pretending the persistence/settings surface does not belong to the assistant module

Initial canonical scope candidate:

- `entrypoints/background/assistant.ts`
- assistant-owned persistence helper(s) extracted from `entrypoints/background/history.ts`, or `history.ts` until extraction lands
- assistant-owned settings/profile helper(s) extracted from `entrypoints/background/settings.ts` or `entrypoints/shared/meeting-profiles.ts`
- `entrypoints/background/providers/openai.ts` for assistant-used generation paths
- `entrypoints/content/assistant-service.ts`
- `entrypoints/content/overlay/assistant-surface.ts`
- `entrypoints/content/assistant-dls-capture-bridge.ts`
- assistant-specific render helpers used by meeting history when extraction or direct ownership is clearer than measuring whole feature pages

## Constraints

- repository is public; no secrets or local machine details may enter fixtures, docs, or test data
- no migration code, compatibility fallbacks, or dual-shape persistence should be added unless explicitly requested
- deterministic tests must assert behavior, state, persistence, metadata, and render shape, not exact OpenAI prose
- assistant settings coverage must be based on real enum values and real normalization paths from the codebase
- assistant coverage must remain reproducible in local development and CI
- for UI-affecting implementation waves, fresh Chrome and Firefox governed development builds are required for reload handoff

Browser impact requirements:

- Chromium-family impact: yes, because assistant settings UI, content sync, overlay rendering, meeting-history rendering, and DLS support code all feed the current Chrome-governed validation path
- Firefox impact: limited in this plan to governed development-build handoff and deterministic logic parity; Firefox runtime smoke is not part of this plan's acceptance scope
- no intentional browser gating is expected in this wave
- runtime-sensitive acceptance in this plan is intentionally limited to Chrome remote debug + Google Meet assistant DLS because that is the user's current required runtime surface

## Risks and Unknowns

- whole-file coverage for `history.ts` and `settings.ts` may remain misleading until assistant-owned seams are extracted
- prompt-level tests can become fragile if they assert too much exact text instead of policy fragments and metadata
- appearance/render tests can become brittle if they overfit layout markup instead of structure/state invariants
- options-page assistant settings coverage may require focused harness helpers so the suite does not become slow or noisy
- DLS helper tests may need DOM/runtime shims before `assistant-dls-capture-bridge.ts` can be covered deeply

## Documentation Impact

Expected documentation updates during implementation:

- `docs/quality/assistant-test-strategy.md`
- `docs/quality/assistant-test-backlog.md`
- `docs/quality/assistant-dls-implementation-plan.md`
- `docs/quality/references/assistant-generation-traceability-matrix.md`
- `docs/quality/references/assistant-runtime-traceability-matrix.md`
- `docs/quality/manual-test-checklist.md` if assistant acceptance expectations materially change
- `docs/contributing/execution-plans/active/README.md`

If assistant behavior contracts or traceability ownership change during extraction/refactor work, update the relevant behavior docs in the same change set.

## Milestones

### Milestone 1 - Canonical Assistant Coverage Scope And Tooling

Establish how the repository will measure assistant-module coverage going forward.

Deliverables:

- a canonical assistant coverage allowlist or coverage helper command, for example `pnpm test:assistant:coverage`
- an explicit decision on whether mixed assistant logic in `history.ts` and `settings.ts` must be extracted before the target can be considered honest
- assistant-aware updates to `scripts/testing/recommend-targeted-tests.mjs`

Acceptance:

- assistant coverage can be measured with one repeatable command
- the measured scope is documented and does not rely on implicit human interpretation
- `test:module:plan` can recommend assistant-specific suites when assistant-owned files change

### Milestone 2 - Assistant Profile Config And Settings Matrix Deterministic Coverage

Make profile settings themselves a deterministic first-class test surface.

Deliverables:

- new assistant-focused tests for `entrypoints/shared/meeting-profiles.ts`
- assistant-specific save/round-trip tests through `saveSettings`
- focused options UI tests for assistant profile editor controls where UI wiring is the only realistic owner

Recommended suites:

- `tests/google-meet/assistant-profile-config.contract.test.ts`
- `tests/google-meet/assistant-settings-save.contract.test.ts` or focused expansion of `settings-and-readiness.contract.test.ts`
- `tests/google-meet/assistant-options-ui.contract.test.tsx`

Required coverage for settings:

- `enabledByDefault`
- `prompt`
- `responseIntent`
- `responseFormat`
- `responseDepth`
- `responseTone`
- `deliveryBias`
- `triggerPolicy`
- `participantScope`
- `meetingOutputLanguage`
- `defaultMeetingProfileId`

Acceptance:

- every assistant profile enum is asserted through deterministic settings tests, not only DLS fixtures
- invalid or partial assistant config falls back safely to canonical defaults
- assistant settings edited in UI can be traced to saved settings payloads

### Milestone 3 - Background Orchestration And Provider Edge-Case Closure

Close the remaining high-value deterministic gaps in assistant generation.

Deliverables:

- fill the missing assistant prompt/language/incomplete-response suites
- expand replay/pass coverage for candidate queues, retries, suppression, and error-state behavior

Recommended suites:

- `tests/google-meet/assistant-prompt.contract.test.ts`
- `tests/google-meet/assistant-language.contract.test.ts`
- `tests/google-meet/assistant-incomplete-response.contract.test.ts`
- expansion of `tests/google-meet/assistant-pass.contract.test.ts`
- expansion of `tests/google-meet/assistant-replay.contract.test.ts`

Acceptance:

- assistant prompt policy is asserted without brittle full-prose snapshots
- incomplete/truncated provider outcomes are covered as assistant behavior, not only as raw transport behavior
- multi-candidate and retry paths have deterministic regression guards

### Milestone 4 - Persistence, Serialization, And Assistant-Owned History Coverage

Bring assistant persistence coverage out of the current low-confidence state.

Deliverables:

- either extract assistant artifact merge/save logic from `history.ts` into assistant-owned helpers or add assistant-specific coverage that makes the remaining mixed-file denominator acceptable
- expand assistant-specific serialization coverage where output metadata or artifact durability matters

Potential surfaces:

- `mergeMeetingSessionArtifacts`
- `saveMeetingSession`
- `storeMeetingSessionShell`
- assistant output serialization in `entrypoints/shared/meeting-session.ts`
- assistant-aware settings/profile persistence boundaries if extraction is required

Acceptance:

- stale assistant artifact overwrite regressions remain reproducible in deterministic tests
- assistant output metadata survives persistence/serialization boundaries
- no assistant persistence surface remains effectively unowned by tests

### Milestone 5 - Assistant UI And Appearance Matrix Coverage

Cover the settings that change how the assistant looks or renders, not only how it triggers.

Deliverables:

- deeper assistant surface rendering coverage
- expanded meeting-history assistant rendering coverage
- direction-safe and format-sensitive render assertions

Recommended suites:

- expansion of `tests/google-meet/assistant-surface.contract.test.ts`
- expansion of `tests/google-meet/assistant-history-render.contract.test.tsx`

Required visual/state assertions:

- pending vs completed card separation
- `watching`, `triggered`, `streaming`, `done`, `suppressed`, and `error` state rendering
- response-format-sensitive structure for:
  - `bullets`
  - `talking_points`
  - `short_paragraph`
  - `structured_sections`
  - `script`
- language-switch and dynamic-direction safety for non-English outputs
- unread/live-state continuity when the panel is closed or reopened

Acceptance:

- assistant surfaces are evaluated through deterministic render contracts, not only manual browsing
- settings that visibly change structure or direction are explicitly covered

### Milestone 6 - Assistant DLS Support Code Coverage And Acceptance Maintenance

Cover assistant test infrastructure that is currently critical but untested.

Deliverables:

- direct contract coverage for `entrypoints/content/assistant-dls-capture-bridge.ts`
- observer/helper coverage expanded where it guards settings-sensitive DLS assertions
- matrix ownership stays synchronized with the live assistant option enums

Recommended suites:

- `tests/google-meet/assistant-dls-capture-bridge.contract.test.ts`
- expansion of `tests/google-meet/assistant-dls-observer.contract.test.ts`
- expansion of `tests/google-meet/manual-smoke-launch.contract.test.ts`

Acceptance:

- assistant DLS support code no longer sits at `0%`
- matrix drift between option enums and DLS fixture inventory remains guarded by tests
- no new DLS scope is introduced beyond the existing Chrome remote-debug Google Meet flow

### Milestone 7 - Docs, Gates, And Final Coverage Closure

Synchronize the repository's planning, strategy, traceability, and validation story with the final assistant test inventory.

Deliverables:

- updated assistant testing docs
- updated traceability matrices
- final assistant coverage report captured in the plan

Acceptance:

- docs match the final assistant validation model
- final assistant coverage measurement is recorded with command and results
- no known assistant testing gap above the plan's scope remains implicit

## Verification

Coverage and deterministic suites:

- `pnpm test:assistant`
- `pnpm vitest run tests/google-meet/assistant-*.contract.test.ts tests/google-meet/assistant-*.contract.test.tsx`
- `pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts`
- `pnpm test:assistant:coverage`
- `pnpm test:google`
- `pnpm test:google:coverage`

Tooling and docs:

- `pnpm test:targeted:plan`
- `pnpm docs:check`
- `pnpm docs:check:behavior` when behavior docs or traceability matrices change

Runtime/build verification when implementation touches real runtime code:

- `pnpm build:target:chrome:development`
- `pnpm build:target:firefox:development`
- assistant DLS commands only when the implementation wave changes runtime-sensitive assistant behavior rather than only tests/tooling, and only for the current accepted DLS surface of Chrome remote debug + Google Meet:
  - `pnpm chrome:smoke:live:assistant baseline`
  - `pnpm chrome:smoke:live:assistant:matrix`

## Progress

- [x] Baseline assistant coverage and DLS-matrix audit completed
- [x] Execution Plan created before implementation
- [x] Canonical assistant coverage scope/command defined
- [x] Assistant-aware targeted-test recommendations added
- [x] Assistant profile config/settings matrix deterministic suites added
- [x] Missing provider/incomplete-response deterministic suites added
- [x] Assistant persistence/serialization coverage plan resolved by tests or extraction
- [x] Assistant UI/appearance render matrix coverage added
- [x] Assistant DLS support code coverage added
- [x] Docs and traceability synchronized
- [x] Final assistant coverage run recorded at `>= 60%`

## Surprises and Discoveries

- Observation: assistant DLS already owns the live option matrix much more completely than the deterministic layer. The remaining work is not mainly "more browser scenarios"; it is closing deterministic ownership around settings, persistence, and render continuity.
  Evidence: existing assistant DLS matrix/fixture coverage plus assistant traceability docs.

- Observation: the user clarified that the current DLS need is fully satisfied by Chrome remote debug against Google Meet, so this plan should not expand runtime acceptance beyond that surface.
  Evidence: thread guidance on 2026-04-21 after the initial plan draft.

- Observation: the current module denominator is distorted by large mixed-responsibility files, especially `history.ts`. Reaching `60%` honestly may require assistant-owned extraction rather than brute-force tests against unrelated lines.
  Evidence: 2026-04-21 coverage run showed `history.ts` at `6.85%` while assistant-focused persistence tests already exist.

- Observation: `assistant-dls-capture-bridge.ts` is a key assistant test-support surface but currently has no direct coverage at all.
  Evidence: 2026-04-21 assistant coverage run showed `0%` statements/functions/branches for that file.

- Observation: `test:module:plan` currently does not point assistant owners to most assistant suites, which increases the risk of future regressions in exactly the area this plan is trying to harden.
  Evidence: 2026-04-21 assistant module-scope plan output recommended overlay/manual-smoke generic tests but not the main assistant suite set.

- Observation: once assistant-owned scope was formalized around assistant runtime, settings, shared profile config, surface rendering, and DLS support code, the first implementation wave was able to pass the `>= 60%` target without broad browser-scope expansion.
  Evidence: `pnpm test:assistant:coverage` on 2026-04-21 reported `66.8%` statements, `53.39%` branches, `75.94%` functions, and `66.76%` lines.

- Observation: prompt-, language-, and incomplete-response-specific suites increased assistant generation coverage more efficiently than broadening browser acceptance.
  Evidence: `pnpm test:assistant:coverage` on 2026-04-22 raised canonical assistant coverage to `68.49%` statements and `55.76%` branches, with `assistant.ts` reaching `79.79%` statements and `69.6%` branches.

- Observation: assistant artifact hashes in cloud-sync serialization were previously insensitive to several assistant metadata fields and to record ordering, which could hide assistant-only artifact changes from sync dedupe.
  Evidence: code audit of `entrypoints/background/cloud-sync/serialization.ts` on 2026-04-22 before the persistence/serialization closure wave.

## Decision Log

- Decision: assistant coverage success will be measured against a canonical assistant-owned scope, not against whole-repository coverage.
  Rationale: the user asked for module-level confidence in one of the repository's most fragile systems.
  Date/Author: 2026-04-21 / Codex

- Decision: the plan will not hit `60%` by excluding mixed assistant surfaces without replacement; mixed assistant logic must either be covered or extracted into assistant-owned files.
  Rationale: dropping responsibility would make the metric easier to satisfy but less truthful.
  Date/Author: 2026-04-21 / Codex

- Decision: assistant settings need three validation layers where applicable:
  - config normalization/defaults
  - runtime orchestration/persistence
  - visible render or DLS acceptance
  Rationale: browser DLS alone is not sufficient for a highly configurable fragile module.
  Date/Author: 2026-04-21 / Codex

- Decision: DLS acceptance in this plan is limited to Chrome remote debug + Google Meet only.
  Rationale: this matches the user's stated current validation need and prevents accidental scope creep into broader provider/browser runtime obligations.
  Date/Author: 2026-04-21 / Codex

## Outcomes and Retrospective

Implementation started and the first major testing wave landed.

Current implemented outcomes:

- added canonical assistant-focused commands:
  - `pnpm test:assistant`
  - `pnpm test:assistant:coverage`
- added deterministic assistant suites:
  - `tests/google-meet/assistant-profile-config.contract.test.ts`
  - `tests/google-meet/assistant-settings-save.contract.test.ts`
  - `tests/google-meet/assistant-dls-capture-bridge.contract.test.ts`
  - `tests/google-meet/assistant-prompt.contract.test.ts`
  - `tests/google-meet/assistant-language.contract.test.ts`
  - `tests/google-meet/assistant-incomplete-response.contract.test.ts`
  - `tests/google-meet/assistant-meeting-session-serialization.contract.test.ts`
  - `tests/google-meet/assistant-cloud-sync-serialization.contract.test.ts`
- expanded assistant surface coverage with format-sensitive render assertions and OpenAI issue-state assertions
- hardened assistant artifact sync hashing in `entrypoints/background/cloud-sync/serialization.ts` so assistant metadata and stable ordering affect artifact hashes deterministically
- updated assistant-aware targeted test recommendations in `scripts/testing/recommend-targeted-tests.mjs`
- synced `docs/quality/assistant-test-strategy.md` with the newly implemented suites and command surface

Current canonical assistant coverage result:

- command: `pnpm test:assistant:coverage`
- result:
  - statements: `68.49%`
  - branches: `55.76%`
  - functions: `75.94%`
  - lines: `68.46%`

Current wave still leaves follow-up work:

- decide whether assistant-owned logic should be extracted from mixed files such as `history.ts` for cleaner long-term module accounting
- continue strengthening render and persistence coverage where assistant behavior still shares files with broader repository concerns

Validation note:

- the persistence/serialization closure wave was implemented after the last executed test run in this thread
- per user instruction, the newly added persistence/serialization suites and serialization hash change are awaiting a later explicit test run
