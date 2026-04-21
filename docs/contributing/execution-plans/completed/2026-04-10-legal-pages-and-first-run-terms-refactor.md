# Legal Pages And First-Run Terms Refactor

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Replace the temporary legal-link and Terms modal implementation with dedicated in-extension legal pages, align page widths across governed extension pages, and fix the popup/footer/modal UX regressions discovered in review.

Done for this wave means:

- settings width matches meeting-history width
- popup header no longer shows the GitHub action
- popup footer layout is stable with the shared legal links
- modal-open state prevents background-page scrolling
- first-run Terms uses a dedicated extension page with a scroll-gated acceptance form
- Privacy Policy uses a dedicated extension page instead of linking users directly to GitHub
- the rendered legal pages and the repository docs share the same markdown source of truth

## Problem Statement

The previous pass solved release-surface legal access quickly, but it introduced three review problems:

- settings width diverged from the rest of the extension pages
- popup footer composition became cramped
- first-run Terms acceptance was implemented as a settings-page modal instead of a dedicated page

The current implementation also links in-product privacy access to GitHub directly, which the repository owner does not want as the primary in-extension UX.

## Scope

- create or update a task plan before implementation
- align settings-page width with meeting-history and other governed extension pages
- remove GitHub header access from quick access / popup
- refine popup footer layout for the legal footer plus theme toggle
- lock page scrolling while dialogs are open
- create dedicated extension pages for Terms of Service and Privacy Policy
- render those pages from the markdown files under `docs/security/` so docs and UI stay in sync
- move first-run Terms acceptance to the dedicated Terms page
- gate acceptance behind scrolling to the bottom of the Terms content box
- decide and implement decline behavior pragmatically
- fill the provided legal placeholders in the public markdown drafts
- update docs/tests/builds for the new onboarding and legal-page flow

## Non-Goals

- final counsel-reviewed governing-law language
- replacing the current public GitHub URLs in store/public references
- full global gating of every runtime surface beyond the page flows touched here
- redesigning unrelated options or meeting-history sections

## Repository Context

- `docs/security/privacy-policy.md`
- `docs/security/terms-of-service.md`
- `entrypoints/options/App.tsx`
- `entrypoints/options/main.tsx`
- `entrypoints/meeting-history/App.tsx`
- `entrypoints/meeting-history/main.tsx`
- `entrypoints/popup/App.tsx`
- `entrypoints/popup/main.tsx`
- `entrypoints/background/index.ts`
- `entrypoints/background/settings.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/meeting-history/components/confirm-dialog.tsx`
- `entrypoints/shared/extension-page-chrome.tsx`
- `entrypoints/shared/legal.ts`
- `entrypoints/shared/i18n/messages/*.ts`
- `tests/google-meet/shared-ui-controls.contract.test.ts`
- `tests/google-meet/settings-and-readiness.contract.test.ts`

## Constraints

- keep the repo public-safe
- preserve the project visual language
- use the docs markdown files as the source of truth for the rendered legal pages
- keep Chrome and Firefox support aligned
- keep storage changes backward-compatible
- produce fresh development builds for Chrome and Firefox before handoff

## Risks and Unknowns

- Vite raw-markdown imports must work cleanly inside WXT entrypoints
- first-run decline behavior needs to be strict enough to be coherent without creating a broken uninstall trap
- page-level terms gating can easily create navigation loops if not scoped carefully
- the chosen temporary governing-law value may still need legal review

## Documentation Impact

- update `docs/security/privacy-policy.md`
- update `docs/security/terms-of-service.md`
- update `docs/security/legal-and-compliance-remediation-assessment.md` if posture wording changes again
- update storage / settings behavior docs if acceptance handling changes materially
- record implementation reality in this plan

Behavior-sensitive docs:

- update `docs/api/settings-and-readiness-behavior-contract.md` and `docs/quality/references/settings-and-readiness-traceability-matrix.md` if acceptance behavior/storage changes again

## Testing and Coverage Impact

- update shared UI coverage for the shared legal chrome changes if needed
- update settings/readiness coverage for acceptance-flow changes if needed
- run `pnpm test:targeted:plan`
- run the relevant targeted test commands
- run `pnpm test:google`
- run `pnpm test:google:coverage`
- run `pnpm docs:check`
- run `pnpm docs:check:business`
- run `pnpm docs:check:behavior`
- run `pnpm build:all:development`

Runtime smoke:

- no in-meeting runtime change is intended, but validation depth should still match any background flow touched during the refactor

## Milestones

### Milestone 1 - Repair Shared Page Layout

Align settings width with meeting-history, remove popup GitHub header access, fix popup footer composition, and lock background scrolling while dialogs are open.

### Milestone 2 - Replace Modal Terms With Dedicated Legal Pages

Add dedicated in-extension Terms and Privacy pages that render from the docs markdown source files, move first-run acceptance to the Terms page, and make acceptance scroll-gated.

### Milestone 3 - Revalidate Docs, Tests, And Builds

Update public markdown placeholders, sync docs/contracts if needed, and rerun governed validation and builds.

## Verification

- `pnpm test:targeted:plan`
- targeted Vitest commands from planner output
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:business`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`

## Progress

- [x] Inspect current layout/legal-page bootstrap constraints
- [x] Create this execution plan before implementation
- [x] Implement layout/popup/modal fixes
- [x] Implement dedicated Terms and Privacy pages with shared markdown source of truth
- [x] Update placeholders, docs, tests, and validation

## Surprises and Discoveries

- Observation: the repository already ships `react-markdown` and `remark-gfm`, so the legal pages can render repository markdown without adding new dependencies.
  Evidence: `package.json`, `entrypoints/meeting-history/components/session-detail.tsx`
- Observation: the UI i18n parity contract requires every shipped locale catalog to define new user-facing keys explicitly, even when runtime fallback to English would work.
  Evidence: `tests/google-meet/ui-i18n.contract.test.ts`
- Observation: WXT accepted the new legal pages as `unlisted-page` entrypoints and bundled the raw markdown documents without extra tooling beyond a `*.md?raw` declaration.
  Evidence: `pnpm build:all:development`

## Decision Log

- Decision: use the existing markdown documents under `docs/security/` as the rendered legal-page source of truth.
  Rationale: this keeps repository docs and in-extension legal pages aligned and avoids duplicate editing surfaces.
  Date/Author: 2026-04-10 / Codex
- Decision: for first-run Terms rejection, close the dedicated Terms page without recording acceptance.
  Rationale: this avoids reintroducing a modal trap while keeping acceptance storage explicit and versioned; stricter global enforcement can still be layered later if needed.
  Date/Author: 2026-04-10 / Codex

## Outcomes and Retrospective

Completed.

Implemented outcomes:

- aligned settings width with the rest of the governed full-page surfaces
- removed the GitHub action from quick access / popup header
- stabilized popup footer layout by separating the legal footer from the theme toggle and adding a compact legal-footer mode
- locked document scrolling while confirmation dialogs are open
- replaced the settings-page Terms modal with a dedicated `terms-of-service.html` page using a scroll-gated acceptance flow
- added a dedicated `privacy-policy.html` page
- rendered both internal legal pages from the canonical markdown under `docs/security/`
- filled the current legal placeholders with the provided publisher/contact metadata and a temporary governing-law choice
- updated business/privacy/store docs to reflect the dedicated legal-page rollout

Verification evidence:

- `pnpm test:targeted:plan`
- `pnpm vitest run tests/google-meet/google-meet-prompts.contract.test.ts tests/google-meet/use-diagnostics-console.contract.test.ts tests/google-meet/diagnostics-viewer.contract.test.ts tests/google-meet/ui-i18n.contract.test.ts tests/google-meet/i18n-runtime.contract.test.ts tests/google-meet/diagnostics-i18n-boundary.contract.test.ts tests/google-meet/data-transfer.contract.test.ts tests/google-meet/settings-and-readiness.contract.test.ts tests/google-meet/shared-ui-controls.contract.test.ts`
- `pnpm test:google`
- `pnpm test:google:coverage`
- `pnpm docs:check`
- `pnpm docs:check:business`
- `pnpm docs:check:behavior`
- `pnpm build:all:development`
- `pnpm chrome:smoke:live google-meet continuation`
