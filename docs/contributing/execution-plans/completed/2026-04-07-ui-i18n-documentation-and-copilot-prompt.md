# Document UI I18n Strategy And Copilot Handoff

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Document a repository-specific UI i18n strategy for CaptionArc and prepare an implementation prompt that a coding agent can execute without guessing. Done means the repository has a canonical architecture decision for UI localization, a UI feature implementation guide, and a precise Copilot handoff prompt aligned with the current WXT, React, and content-overlay architecture.

## Problem Statement

The repository already models translation target languages, but it does not have a canonical UI localization strategy. UI copy is currently hardcoded across React surfaces and imperative overlay modules, and there is no documented plan for introducing a shared i18n layer, locale settings, or rollout sequencing.

## Scope

- document the recommended UI i18n architecture for this repository
- document the implementation approach and rollout guidance for UI surfaces
- create a precise Copilot prompt for the first implementation phase
- update relevant section indexes
- run repository documentation validation

## Non-Goals

- implement UI i18n code
- change runtime behavior, storage schema, or tests
- localize existing UI copy in code
- add browser extension locale metadata files

## Repository Context

- `docs/architecture/overview.md`
- `docs/architecture/extension-runtime.md`
- `docs/architecture/storage-and-state.md`
- `docs/features/ui/README.md`
- `entrypoints/options/App.tsx`
- `entrypoints/popup/App.tsx`
- `entrypoints/meeting-history/App.tsx`
- `entrypoints/content/overlay/header.ts`
- `entrypoints/content/overlay/capture-consent.ts`
- `entrypoints/content/render.ts`
- `entrypoints/shared/language-metadata.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/background/settings.ts`
- `wxt.config.ts`
- `package.json`

## Constraints

- keep documentation under `docs/`
- keep docs ASCII-only and public-safe
- use repository evidence, not generic browser-extension advice
- respect the current split between React UI pages and imperative content-overlay modules
- keep implementation guidance specific enough for a coding agent to execute directly

## Risks and Unknowns

- a generic React i18n recommendation would not fit the imperative overlay runtime
- a Chrome-native-only recommendation would weaken maintainability for the React pages
- over-scoping the Copilot prompt to all surfaces at once would create review and regression risk

## Documentation Impact

- create `docs/architecture/ui-i18n-strategy.md`
- create `docs/features/ui/ui-i18n-implementation-guide.md`
- create `docs/features/ui/ui-i18n-copilot-implementation-prompt.md`
- update `docs/architecture/README.md`
- update `docs/features/ui/README.md`
- move this plan to `docs/contributing/execution-plans/completed/` when finished
- update `docs/contributing/execution-plans/completed/README.md`

## Testing and Coverage Impact

- no code tests are expected because this task is documentation-only
- run `pnpm docs:check`
- no runtime smoke validation is required because no runtime code changes are planned

## Milestones

### Milestone 1 - Record The Architecture Decision

Create a canonical architecture document that explains why this repository should use a hybrid strategy: `chrome.i18n` for extension metadata and a shared internal i18n core for UI copy across both React and imperative surfaces. Verification: the document cites concrete repository files and states the recommended locale model, message-catalog structure, settings placement, directionality rules, and rejected alternatives.

### Milestone 2 - Publish The Implementation Handoff

Create a UI implementation guide and a precise Copilot prompt for the first implementation phase. Verification: the guide defines file layout, rollout order, migration rules, and validation expectations, and the prompt names exact files to create or update, expected APIs, acceptance criteria, and explicit non-goals.

### Milestone 3 - Validate And Close

Update affected indexes, run docs validation, and finalize the plan with outcomes and verification notes. Verification: `pnpm docs:check` passes and the plan is moved to the completed directory with final notes.

## Verification

- `pnpm docs:check`

Expected observations:

- markdown placement and section indexing remain valid
- links resolve
- docs remain ASCII-only and within repository policy

## Progress

- [x] Inspect repository architecture, UI surfaces, and settings boundaries
- [x] Create the architecture strategy document
- [x] Create the UI implementation guide
- [x] Create the Copilot handoff prompt
- [x] Update documentation indexes
- [x] Run docs validation
- [x] Finalize and move the plan to completed

## Surprises and Discoveries

- Observation: UI copy is distributed across both React entrypoints and imperative content-overlay modules, so a React-only i18n library would not be a full architectural fit.
  Evidence: `entrypoints/options/App.tsx`, `entrypoints/popup/App.tsx`, `entrypoints/meeting-history/App.tsx`, `entrypoints/content/overlay/header.ts`, `entrypoints/content/overlay/capture-consent.ts`, and `entrypoints/content/render.ts`
- Observation: the repository already has language metadata utilities, but they currently serve translation target handling rather than UI locale management.
  Evidence: `entrypoints/shared/language-metadata.ts`
- Observation: there is no current Chrome locale metadata integration in the codebase.
  Evidence: repository search found no `_locales`, `default_locale`, or `chrome.i18n` usage

## Decision Log

- Decision: document a hybrid approach instead of choosing either `chrome.i18n` or a React-only library as the single mechanism.
  Rationale: the repository needs one strategy that works for extension metadata, React pages, and imperative overlay code.
  Date/Author: 2026-04-07 / Codex
- Decision: scope the Copilot handoff to the first implementation phase rather than all UI surfaces at once.
  Rationale: the repository has several distinct surfaces, and a smaller first phase reduces implementation ambiguity and review risk.
  Date/Author: 2026-04-07 / Codex

## Outcomes and Retrospective

Completed outcome:

- added `docs/architecture/ui-i18n-strategy.md` as the canonical repository-specific UI localization architecture document
- added `docs/features/ui/ui-i18n-implementation-guide.md` as the phased implementation guide
- added `docs/features/ui/ui-i18n-copilot-implementation-prompt.md` as the precise handoff prompt for the first implementation phase
- updated the architecture and UI section indexes so the new docs are discoverable from canonical section entry points
- ran `pnpm docs:check` successfully

What changed from the original plan:

- no scope expansion was needed
- documentation-only validation was sufficient because no code or tests changed

What remains:

- Copilot or another implementation agent still needs to execute Phase 1 in code under a separate implementation execution plan
