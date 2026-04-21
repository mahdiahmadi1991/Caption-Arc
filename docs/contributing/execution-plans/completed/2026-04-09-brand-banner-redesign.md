# Brand Banner Redesign

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Bring the generated GitHub and store banners up to a more professional visual quality bar by fixing hierarchy, density, clipping, composition, and brand presentation issues in the current assets and their generator.

## Problem Statement

The current generated banners communicate product scope, but they do not yet meet a strong public-repo brand quality bar. The main issues are cramped right-side support panels, weak visual hierarchy, excessive card-like treatment, overcrowded copy, and support text/badges competing with the hero instead of reinforcing it.

## Scope

- review current generated GitHub and store banners
- redesign banner composition in `scripts/generate_brand_assets.py`
- regenerate the checked-in banner and lockup assets
- update branding notes if the revised direction changes the documented visual system

## Non-Goals

- no icon redesign unless required by the new banner composition
- no README copy rewrite beyond what is necessary for asset references
- no product UI changes
- no store metadata changes outside branding-aligned documentation

## Repository Context

- `scripts/generate_brand_assets.py`
- `docs/assets/images/branding/github-banner.png`
- `docs/assets/images/branding/store-banner.png`
- `docs/assets/images/branding/logo-lockup-light.png`
- `docs/assets/images/branding/logo-lockup-dark.png`
- `docs/operations/branding.md`

## Constraints

- assets must remain generated from the repository script
- the visual direction must stay aligned with the existing mint-based product identity
- copy must remain traceable to implemented product capabilities
- compositions must stay legible in repository and store contexts

## Risks and Unknowns

- a denser information layout can make the banners feel document-like instead of brand-led
- overusing boxed panels can weaken the premium feel
- changing composition without updating the script structure can make future iterations fragile

## Documentation Impact

- update `docs/operations/branding.md` if the redesigned composition changes the documented design direction
- update execution-plan indexes when the plan is moved

## Testing and Coverage Impact

- no product tests expected because behavior is unchanged
- required verification:
  - `python3 scripts/generate_brand_assets.py`
  - `pnpm docs:check`
- visual verification:
  - inspect regenerated `github-banner.png`
  - inspect regenerated `store-banner.png`

## Milestones

### Milestone 1 - Visual Review And Composition Direction

Document the current banner problems and settle on a simpler, more premium composition with clearer hierarchy, more whitespace, and less crowded support content.

### Milestone 2 - Generator Redesign And Regeneration

Refactor the banner generator to produce the revised layouts, regenerate the assets, and visually inspect the results for clipping, alignment, balance, and readability.

## Verification

- `python3 scripts/generate_brand_assets.py`
- `pnpm docs:check`
- manual image inspection of the regenerated banner PNG assets

## Progress

- [x] Reviewed the current generated banners and identified layout issues.
- [x] Redesigned the generator and regenerated assets.
- [x] Validated visually and archived the plan.

## Surprises and Discoveries

- Observation: The current support panels are the weakest part of both banners. They compress too much copy into a narrow region and create a card-heavy composition that conflicts with the intended calm, premium brand direction.
  Evidence: current `docs/assets/images/branding/github-banner.png` and `docs/assets/images/branding/store-banner.png`

## Decision Log

- Decision: Favor a poster-like hero with fewer support boxes and stronger type hierarchy over UI-card mimicry.
  Rationale: These assets need to feel like brand surfaces first, not mini dashboards.
  Date/Author: 2026-04-09 / Codex

- Decision: Keep a structured right-side stage, but reduce it to concise proof points instead of explanatory paragraphs stacked into narrow cards.
  Rationale: The icon remains the dominant visual anchor while the support content stays scannable and avoids clipping.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

The banner generator was redesigned to produce calmer, more premium poster-style assets. The GitHub banner now uses a stronger hero, a cleaner support strip, and a more legible proof panel. The store banner now uses a more restrained right-side stage with concise support points and improved spacing.

Branding notes were updated to document the poster-like composition and reduced boxed chrome.

Verification completed:

- `python3 scripts/generate_brand_assets.py`
- `pnpm docs:check`
- manual inspection of regenerated `github-banner.png`
- manual inspection of regenerated `store-banner.png`
