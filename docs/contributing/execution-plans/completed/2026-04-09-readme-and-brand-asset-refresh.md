# Refresh README And Brand Assets For Public Positioning

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Upgrade the root `README.md` into a stronger public landing page and refresh the generated branding banners so the repository's first impression reflects the current product scope, browser support, and positioning.

## Problem Statement

The current README is accurate but still reads partly like an internal product summary rather than a polished public-repository landing page. The generated banner assets also lag the current feature set and messaging, which weakens the repository's marketing presentation and visual alignment.

## Scope

- review the current README against product docs and current implementation
- strengthen README positioning, CTA structure, and public-repo professionalism
- remove or reduce obvious internal placeholder language in the README
- update `scripts/generate_brand_assets.py` so generated banner copy matches the current product scope
- regenerate the GitHub and store branding banners

## Non-Goals

- changing runtime behavior or feature scope
- inventing unsupported claims or roadmap promises
- redesigning the product UI itself
- adding new screenshot capture pipelines

## Repository Context

- `README.md`
- `scripts/generate_brand_assets.py`
- `docs/product/overview.md`
- `docs/product/use-cases.md`
- `docs/operations/store-listing.md`
- `docs/operations/branding.md`
- `docs/assets/images/branding/github-banner.png`
- `docs/assets/images/branding/store-banner.png`

## Constraints

- all README and banner claims must remain repository-backed
- marketing copy must not overpromise browser parity or install availability
- branding output should stay calm, precise, and operational per the branding notes
- generated assets must remain reproducible via the checked-in script

## Risks and Unknowns

- stronger marketing language can accidentally become less precise if it drifts from the implementation
- banner copy space is limited, so message hierarchy matters more than feature completeness
- existing user edits in the worktree must not be overwritten outside this task's scope

## Documentation Impact

- update `README.md`
- update `docs/operations/branding.md` if the generated asset direction changes materially
- update the active/completed execution-plan indexes when this plan is archived

## Testing and Coverage Impact

- run `pnpm docs:check`
- run the banner generation script and confirm the expected files are regenerated
- visually inspect the generated GitHub banner

## Milestones

### Milestone 1 - Refresh public messaging

Review the current README and rewrite the upper and mid sections so the page is clearer, more conversion-friendly, and more polished for public visitors while staying implementation-aligned.

### Milestone 2 - Refresh generated banner assets

Update the brand asset generator copy and any supporting layout constants needed to reflect the current product story, then regenerate the checked-in banners and validate the results.

## Verification

- `python3 scripts/generate_brand_assets.py`
- `pnpm docs:check`
- visual inspection of `docs/assets/images/branding/github-banner.png`

## Progress

- [x] Inspect the current README, product docs, and banner generator
- [x] Create the active execution plan
- [x] Refresh the README messaging and structure
- [x] Refresh and regenerate the brand banners
- [x] Validate docs and generated assets

## Surprises and Discoveries

- Observation: the current banner generator still uses older copy such as `OpenAI / 19+ languages`, which no longer matches the current language support wording in the README.
  Evidence: `scripts/generate_brand_assets.py`

- Observation: the current README is factually aligned overall, but it still exposes internal placeholder sections such as explicit roadmap TODOs and assumptions.
  Evidence: `README.md`

## Decision Log

- Decision: update the README and generated banners together instead of treating them as unrelated tasks.
  Rationale: the copy hierarchy and the visual brand story need to reinforce each other at the top of the public repository.
  Date/Author: 2026-04-09 / Codex

- Decision: keep the refreshed README marketing-forward, but still explicit about Firefox cloud-sync limitations and the absence of browser-store install links.
  Rationale: public positioning helps discovery, but trust is higher-value than aggressive copy for a repository that is still distributed primarily through GitHub artifacts.
  Date/Author: 2026-04-09 / Codex

## Outcomes and Retrospective

The root README now reads more like a public landing page and less like an internal product summary. The top of the page has clearer value positioning, stronger quick links, a more conversion-friendly structure, and less placeholder language, while staying aligned with the current browser support, privacy boundaries, and product scope.

The generated brand assets were also refreshed so the GitHub and store banners now reflect the current product story: browser meeting caption capture, live translation, searchable follow-up, dual-browser support, a 27-language catalog, local-first archive behavior, and summaries. The lockup subtitle was updated so the static brand exports also align with the broader "translation and follow-up" positioning.

Validation completed during this task:

- `python3 scripts/generate_brand_assets.py`
- `pnpm docs:check`
- visual inspection of `docs/assets/images/branding/github-banner.png`
- visual inspection of `docs/assets/images/branding/store-banner.png`
