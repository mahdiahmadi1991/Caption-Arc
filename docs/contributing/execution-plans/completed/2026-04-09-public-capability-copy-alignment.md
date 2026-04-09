# Public Capability Copy Alignment

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Bring the public-facing product story back into line with the implemented product surface so the repository front door, store-facing copy, and generated branding assets highlight the strongest real value points without inventing features.

## Problem Statement

Recent README and branding refresh work improved tone and presentation, but some high-value implemented capabilities remain underrepresented in public-facing copy. The largest gap is the live AI assistant, which has substantial code and UI support but is not clearly surfaced in README, store listing, or generated banners.

## Scope

- audit implemented user-visible capabilities from the codebase
- refresh public-facing copy in `README.md`
- refresh store-facing copy in `docs/operations/store-listing.md`
- refresh brand messaging guidance in `docs/operations/branding.md`
- update `scripts/generate_brand_assets.py` so generated banner copy reflects the current product story
- regenerate branding assets after copy changes

## Non-Goals

- no product behavior changes
- no manifest, packaging, runtime, or browser-support changes
- no new screenshots, GIFs, or store submission automation
- no speculative roadmap or marketing claims beyond implemented behavior

## Repository Context

- `README.md`
- `docs/operations/store-listing.md`
- `docs/product/overview.md`
- `docs/operations/branding.md`
- `scripts/generate_brand_assets.py`
- `entrypoints/background/assistant.ts`
- `entrypoints/options/App.tsx`
- `entrypoints/meeting-history/components/session-detail.tsx`
- `entrypoints/shared/i18n/messages/en.ts`

## Constraints

- all public-facing claims must be traceable to the repository
- copy must stay public-safe and avoid internal-only language
- browser support statements must remain accurate for Chrome and Firefox
- Firefox cloud-sync gating must remain explicit
- changes must stay documentation/asset scoped and reviewable

## Risks and Unknowns

- over-marketing the AI assistant could imply autonomous behavior the product does not provide
- banner space is limited, so capability density can reduce clarity if copy is not prioritized
- multiple public surfaces must stay aligned to avoid conflicting product narratives

## Documentation Impact

- update `README.md`
- update `docs/operations/store-listing.md`
- update `docs/product/overview.md`
- update `docs/operations/branding.md`
- update execution plan indexes if a new plan file is added or moved

## Testing and Coverage Impact

- no product tests expected because behavior is unchanged
- required validation:
  - `python3 scripts/generate_brand_assets.py`
  - `pnpm docs:check`

## Milestones

### Milestone 1 - Capability Audit And Narrative Update

Audit implemented capabilities from code and rewrite public-facing copy so README, product overview, and store-listing surfaces reflect the strongest real product value, including the live AI assistant, meeting profiles, startup control, chat context, and encrypted backup continuity where appropriate.

### Milestone 2 - Brand Asset Copy Refresh

Update generated banner copy and branding guidance so public image assets reinforce the same narrative as the updated docs, then regenerate the checked-in assets and verify docs consistency.

## Verification

- `python3 scripts/generate_brand_assets.py`
- `pnpm docs:check`

## Progress

- [x] Audited current public-facing copy against implemented capabilities.
- [x] Updated docs and generated copy.
- [x] Regenerated assets and recorded verification.
- [x] Move plan to `completed/` after implementation.

## Surprises and Discoveries

- Observation: The live AI assistant is materially implemented across background generation, per-profile controls, and meeting-history rendering, but it is not surfaced strongly in the root README or brand banners.
  Evidence: `entrypoints/background/assistant.ts`, `entrypoints/options/App.tsx`, `entrypoints/meeting-history/components/session-detail.tsx`

## Decision Log

- Decision: Keep the copy refresh grounded in implemented features only and avoid introducing broader "meeting copilot" claims.
  Rationale: The product has real assistant capabilities, but the repository should not imply unsupported autonomy or actions.
  Date/Author: 2026-04-09 / Codex

- Decision: Use `meeting profiles` as the primary public term while keeping implementation-linked docs honest about summaries, assistant tuning, and startup behavior.
  Rationale: The UI already frames these profiles as reusable meeting-type presets, which is clearer for public-facing copy than the narrower internal label `summary profiles`.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

Public-facing copy now reflects the product surface more accurately. The README, store-listing draft, product overview, and branding notes now call out the live AI assistant, reusable meeting profiles, startup control, supported chat context, and encrypted local-first continuity without changing browser support claims or over-stating autonomy.

Generated brand assets were refreshed from the updated script so checked-in banners and lockups align with the revised product story.

Verification completed:

- `python3 scripts/generate_brand_assets.py`
- `pnpm docs:check`
