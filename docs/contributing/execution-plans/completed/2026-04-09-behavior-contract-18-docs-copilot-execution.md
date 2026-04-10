# Behavior Contract 18-Docs Copilot Execution

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Create a complete, code-derived Behavior Contract corpus for the extension so test authoring can rely on docs as source of truth.

Delivery model:

- Copilot generates documents in controlled waves.
- Codex (this thread) produces tasks/prompts and performs quality review.

## Problem Statement

Behavior contracts are currently partial and uneven. Core runtime, provider, session, AI, sync, diagnostics, and settings behaviors are not yet documented as one consistent contract system.

## Scope

In-scope deliverables:

1. Produce/update exactly 18 behavior-contract docs under `docs/api/`.
2. Keep each document code-derived with deterministic rules and stable rule IDs.
3. Produce/update matching traceability matrices under `docs/quality/references/`.
4. Keep governance and index docs synchronized.

Target contract documents (`docs/api/`):

1. `provider-routing-behavior-contract.md` (new)
2. `google-meet-behavior-contract.md` (update)
3. `microsoft-teams-behavior-contract.md` (new)
4. `zoom-web-behavior-contract.md` (new)
5. `runtime-lifecycle-behavior-contract.md` (new)
6. `runtime-prompts-behavior-contract.md` (new)
7. `runtime-session-continuation-behavior-contract.md` (update)
8. `meeting-session-model-behavior-contract.md` (new)
9. `event-ingestion-behavior-contract.md` (new)
10. `overlay-behavior-contract.md` (new)
11. `assistant-runtime-behavior-contract.md` (new)
12. `meeting-summary-pipeline-behavior-contract.md` (new)
13. `translation-pipeline-behavior-contract.md` (new)
14. `cloud-sync-behavior-contract.md` (new)
15. `diagnostics-behavior-contract.md` (new)
16. `settings-and-readiness-behavior-contract.md` (new)
17. `data-transfer-behavior-contract.md` (new)
18. `browser-capabilities-behavior-contract.md` (new)

## Non-Goals

- Changing product behavior or implementation logic
- Expanding feature scope beyond current code
- Rewriting existing test infrastructure outside needed traceability updates

## Repository Context

Governance and standards:

- [behavior-contract-governance.md](../../behavior-contract-governance.md)
- [documentation-standards.md](../../documentation-standards.md)
- [definition-of-done.md](../../definition-of-done.md)
- [execution-plans.md](../../execution-plans.md)
- [behavior-contract-template.md](../../../templates/behavior-contract-template.md)

Existing contract anchors:

- [google-meet-behavior-contract.md](../../../api/google-meet-behavior-contract.md)
- [runtime-session-continuation-behavior-contract.md](../../../api/runtime-session-continuation-behavior-contract.md)
- [google-meet-automation-traceability-matrix.md](../../../quality/references/google-meet-automation-traceability-matrix.md)
- [runtime-session-continuation-traceability-matrix.md](../../../quality/references/runtime-session-continuation-traceability-matrix.md)

Core code surfaces:

- `entrypoints/content/providers/*`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/content/overlay/*`
- `entrypoints/content/history-service.ts`
- `entrypoints/background/index.ts`
- `entrypoints/background/history.ts`
- `entrypoints/background/assistant.ts`
- `entrypoints/background/translation.ts`
- `entrypoints/background/cloud-sync/*`
- `entrypoints/background/diagnostics.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/data-transfer.ts`
- `entrypoints/shared/*` (meeting-session, settings-defaults, quick-access-status, browser-capabilities)

## Constraints

- Must be code-derived only (no speculative behavior claims).
- Must follow rule format `C-<DOMAIN>-<NNN>`.
- Must include source function/module evidence per rule.
- Must remain public-safe per repository documentation policy.
- Must update relevant indexes (`docs/api/README.md`, `docs/quality/README.md`, references indexes) when adding files.

## Risks and Unknowns

- Some behaviors are cross-cutting and can create overlap between contracts.
- Limited existing tests for non-Google paths may leave matrix entries as `planned`.
- Copilot may produce requirement-style text instead of characterization-style rules unless prompt is strict.

Mitigation:

- enforce one canonical behavior area per document
- require strict template usage
- review each wave before proceeding

## Documentation Impact

Must update:

- `docs/api/` contract docs (18-item target set)
- `docs/quality/references/` traceability matrices for each touched contract area
- index files in `docs/api/`, `docs/quality/`, and `docs/quality/references/` as needed

## Testing and Coverage Impact

No code-behavior change expected for this initiative.

Validation commands for each wave:

- `pnpm docs:check`
- `pnpm docs:check:behavior`
- `pnpm docs:check:business`

## Milestones

### Milestone 1 - Provider And Runtime Entry Contracts

Deliver docs 1-7 with matching traceability updates.

Acceptance:

- each rule references concrete source function(s)
- no duplicate contract semantics across docs
- documentation checks pass

### Milestone 2 - Session, Ingestion, And Overlay Contracts

Deliver docs 8-10 with matching traceability updates.

Acceptance:

- session/rejoin/event/overlay behavior contracts are deterministic and test-mappable
- documentation checks pass

### Milestone 3 - AI Runtime Contracts

Deliver docs 11-13 with matching traceability updates.

Acceptance:

- assistant/summary/translation behavior boundaries are explicit and code-derived
- documentation checks pass

### Milestone 4 - Sync, Diagnostics, Settings, Transfer, Capability Contracts

Deliver docs 14-18 with matching traceability updates and index cleanup.

Acceptance:

- cloud-sync/diagnostics/settings/data-transfer/capability behavior contracts complete
- documentation checks pass

### Milestone 5 - Final Review Pass

Codex performs final consistency review across all 18 docs and matrices.

Acceptance:

- naming, IDs, source citations, and cross-links are consistent
- no conflicting rules across documents

## Verification

Run:

```bash
pnpm docs:check
pnpm docs:check:behavior
pnpm docs:check:business
```

Manual review checklist:

- every contract has Purpose, Source Files, Rules, Traceability, Change Control
- every rule has stable ID and deterministic behavior wording
- every touched area has matrix coverage (`implemented` or `planned`)

## Progress

- [x] Execution plan created
- [x] Copilot kickoff prompt drafted
- [x] Milestone 1 completed
- [x] Milestone 2 completed
- [x] Milestone 3 completed
- [x] Milestone 4 completed
- [x] Milestone 5 completed

## Surprises and Discoveries

- Observation: Existing behavior contracts are strongest in Google/runtime continuation areas.
  Evidence: current `docs/api/google-meet-behavior-contract.md` and `docs/api/runtime-session-continuation-behavior-contract.md`.
- Observation: The remaining 11 target areas had enough implementation evidence for characterization docs, but most lack deterministic contract-test coverage.
  Evidence: direct code mapping across `entrypoints/shared/meeting-session.ts`, `entrypoints/content/event-ingestion.ts`, `entrypoints/content/overlay/*.ts`, `entrypoints/content/assistant-service.ts`, `entrypoints/background/history.ts`, `entrypoints/background/translation.ts`, `entrypoints/background/cloud-sync/*`, `entrypoints/shared/diagnostics*.ts`, `entrypoints/background/settings.ts`, `entrypoints/background/data-transfer.ts`, and `entrypoints/shared/browser-capabilities.ts` with only limited matching `tests/google-meet/*` coverage.
- Observation: Google Meet traceability needed a case-ID convention cleanup after wave 1 because case prefixes had drifted by behavior area (`GM-URL-*`, `GM-CTX-*`, etc.) instead of one canonical scheme.
  Evidence: previous `docs/quality/references/google-meet-automation-traceability-matrix.md` contents before final sync.
- Observation: Teams and Zoom provider modules contain richer chat/observer behavior than wave 1 captured, especially around rebinding observers, de-duplication windows, and caption-off heuristics.
  Evidence: `extractTeamsChatMessages`, `processCaptionEntry`, `microsoftTeamsProvider.startCaptionObserver`, `extractChatMessages`, and `zoomWebProvider.startCaptionObserver` in provider source files.

## Decision Log

- Decision: Run Copilot in waves instead of one-shot 18-doc generation.
  Rationale: Reduces drift and makes Codex review checkpoints practical.
  Date/Author: 2026-04-09 / Codex
- Decision: Keep provider docs focused on provider-owned behavior and move runtime boot/reset/prompt rules into runtime-specific contracts and matrices.
  Rationale: Prevents overlapping duplicate rules and keeps traceability matrices canonical by behavior area.
  Date/Author: 2026-04-09 / Codex
- Decision: Use `planned` as the default matrix status unless a concrete repository test or canonical smoke command already exists.
  Rationale: The repository has broad code evidence but uneven deterministic test coverage outside Google Meet, diagnostics, browser capabilities, overlay settings, and cloud-sync browser support.
  Date/Author: 2026-04-09 / Codex
- Decision: Normalize Google Meet traceability case IDs to sequential `GM-<NNN>` identifiers.
  Rationale: Stabilizes the matrix naming convention and removes wave-1 inconsistency between contract IDs and case-ID families.
  Date/Author: 2026-04-09 / Codex

## Copilot Kickoff Prompt (Ready To Copy)

```text
You are working in the caption-arc repository. Produce behavior-contract documentation strictly from code evidence.

Goal:
- Generate/update the 18 behavior-contract docs listed below under docs/api/.
- Keep them characterization-oriented (what code does), not requirement-oriented (what code should do).
- Update matching traceability matrices under docs/quality/references/.

Mandatory standards:
1) Follow docs/contributing/behavior-contract-governance.md.
2) Follow docs/templates/behavior-contract-template.md.
3) Follow docs/contributing/documentation-standards.md.
4) Use deterministic rule IDs: C-<DOMAIN>-<NNN>.
5) For each rule, cite exact source function/module names and file paths.
6) Do not invent behavior not observable in code.
7) If evidence is insufficient, mark matrix case as planned and explain the gap.
8) Keep one canonical behavior area per doc; avoid overlapping duplicate rules.

Target docs (docs/api):
1. provider-routing-behavior-contract.md
2. google-meet-behavior-contract.md (update)
3. microsoft-teams-behavior-contract.md
4. zoom-web-behavior-contract.md
5. runtime-lifecycle-behavior-contract.md
6. runtime-prompts-behavior-contract.md
7. runtime-session-continuation-behavior-contract.md (update)
8. meeting-session-model-behavior-contract.md
9. event-ingestion-behavior-contract.md
10. overlay-behavior-contract.md
11. assistant-runtime-behavior-contract.md
12. meeting-summary-pipeline-behavior-contract.md
13. translation-pipeline-behavior-contract.md
14. cloud-sync-behavior-contract.md
15. diagnostics-behavior-contract.md
16. settings-and-readiness-behavior-contract.md
17. data-transfer-behavior-contract.md
18. browser-capabilities-behavior-contract.md

Execution mode:
- Work in waves (7 + 3 + 3 + 5 docs).
- After each wave: update indexes and related matrices, then stop and report.

Per-wave output requirements:
- list files created/updated
- summarize rule IDs introduced
- summarize matrix cases added/updated
- list open ambiguities (if any)

Final required commands before reporting:
- pnpm docs:check
- pnpm docs:check:behavior
- pnpm docs:check:business

Do not change runtime behavior code in this task; documentation-only unless explicitly asked otherwise.
```

## Outcomes and Retrospective

Completed corpus:

- 18 behavior-contract docs are now present under `docs/api/`.
- Matching traceability matrices are now present under `docs/quality/references/` for all 18 behavior-contract areas.
- Wave-1 gaps were corrected for Google Meet, Microsoft Teams, Zoom Web, runtime lifecycle, and runtime session continuation.
- `docs/api/README.md`, `docs/quality/README.md`, `docs/quality/references/README.md`, and `docs/quality/references/runtime-testing-readme.md` were synchronized with the full contract corpus.
- Final validation passed with `pnpm docs:check`, `pnpm docs:check:behavior`, and `pnpm docs:check:business`.

Residual follow-up:

- Most newly documented areas still need deterministic contract tests before their matrix rows can move from `planned` to `implemented`.
