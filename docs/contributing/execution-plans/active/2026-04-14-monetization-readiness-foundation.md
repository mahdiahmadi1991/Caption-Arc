# Monetization Readiness Foundation

This Execution Plan is a living document.
Keep `Progress`, `Surprises and Discoveries`, `Decision Log`, and `Outcomes and Retrospective` current during implementation.

Planning standard:

- `docs/contributing/execution-plans.md`

## Purpose / Big Picture

Create a durable decision-and-execution framework for monetizing CaptionArc without discovering licensing, compliance, or architecture blockers after implementation has started.

Done for this phase means:

- the repository has one canonical ordered monetization checklist
- the user can evaluate public-repo, license, legal, billing, and security decisions in the right order
- future implementation work can proceed milestone by milestone instead of improvising
- the next planning phase includes a recommended future-license direction and a billing-decision interview
- the repository license itself is aligned to the chosen direction

## Problem Statement

CaptionArc currently has no canonical monetization readiness checklist or execution plan.
The user is onboarding into paid-product concerns for the first time and needs a sequence that prevents hidden prerequisites from surfacing too late.

The repository is also currently public-facing and `package.json` declares `MIT`, which has direct consequences for any paid-product strategy that depends on code exclusivity.

The user has now selected an initial `freemium + pro monthly/yearly` direction with an initial `B2C` audience and wants the plan updated to reflect a better-fit future license model for similar public projects.
The user also clarified that no production release has shipped yet and wants the repository license decision executed now rather than deferred.

## Scope

- create one canonical product document for monetization readiness
- create one active execution plan covering future monetization guidance work in this thread
- record current repository evidence relevant to monetization starting assumptions
- structure upcoming work across business, legal, technical, and security milestones
- record provisional monetization decisions already made in the thread
- recommend a future-license direction that better fits a public monetized project than `MIT`
- execute the repository license migration to the chosen direction
- record the initial billing recommendation from the user interview

## Non-Goals

- implement billing, auth, or entitlement code
- choose the final business model in this phase
- rewrite repository legal documents in this phase
- decide tax or jurisdiction specifics without user business details
- provide jurisdiction-specific legal advice
- choose the final MoR provider in this phase

## Repository Context

- `AGENTS.md`
- `package.json`
- `docs/contributing/execution-plans.md`
- `docs/contributing/documentation-standards.md`
- `docs/contributing/business-documentation-governance.md`
- `docs/product/README.md`
- `docs/security/privacy-policy.md`
- `docs/security/terms-of-service.md`
- `LICENSE`
- `README.md`
- `.github` repository metadata as applicable after push

## Constraints

- keep docs public-safe
- keep documentation under `docs/`
- keep one canonical doc per topic
- align with existing repository documentation style
- avoid legal claims not grounded in current repository evidence
- treat this plan as guidance and sequencing, not legal or tax advice

## Risks and Unknowns

- the eventual business model may require a license change or repository structure change
- prior `MIT` distributions cannot practically be made retroactively non-MIT
- legal and tax requirements depend on the selling entity and target countries
- store-policy details may influence the exact UX of upgrade and payment flows
- public repo strategy depends on where premium value is enforced
- future backend architecture choice may change technical sequencing
- GitHub license detection will not reflect the new license until the change is pushed

## Documentation Impact

- create `docs/product/monetization-readiness-checklist.md`
- update `docs/product/README.md`
- update `docs/contributing/execution-plans/active/README.md`
- update this plan with the recommended future-license direction and next decision steps
- update `LICENSE`
- update `package.json`
- update `README.md`

No behavior-contract docs are impacted in this planning and repository-governance phase.

## Testing and Coverage Impact

- no code tests are required for this docs-only phase
- run `pnpm docs:check`
- `pnpm docs:check:business` is not required for this phase because product docs are added without business-sensitive code changes

## Milestones

### Milestone 1 - Establish The Canonical Checklist

Create a single ordered checklist under `docs/product/` that captures the required preconditions for monetization work across product strategy, licensing, legal/compliance, billing, security, implementation, and launch readiness.

Verification:

- the checklist exists in the canonical docs location
- it explicitly addresses public repo and licensing concerns
- it is written as an ordered action list rather than an unordered memo

### Milestone 2 - Create The Ongoing Monetization Guidance Plan

Create an active execution plan that sequences how future monetization work in this thread should proceed and what decisions must be resolved before implementation begins.

Verification:

- the plan exists under `docs/contributing/execution-plans/active/`
- it is self-contained
- it separates this planning phase from later implementation phases

### Milestone 3 - Keep Documentation Discoverable

Update the relevant section indexes so the monetization checklist and active plan can be found through the normal documentation entry points.

Verification:

- `docs/product/README.md` links to the checklist
- `docs/contributing/execution-plans/active/README.md` links to the active plan
- `pnpm docs:check` passes

### Milestone 4 - Record Provisional Business And Licensing Decisions

Update the checklist and plan with the working decisions already made:

- `freemium + pro monthly/yearly`
- initial `B2C` motion
- local-first trust model preference
- brand-under-`AlynGo` evaluation
- recommended future-license direction of `AGPL-3.0-or-later` for the public core

Verification:

- the checklist contains the current working decisions
- the plan explains why `MIT` is a weak fit for the current monetization direction
- the plan separates code licensing from trademark and seller identity

### Milestone 5 - Execute Repository License Migration

Replace the repository's current `MIT` declarations with `AGPL-3.0-or-later` in all canonical license surfaces so the public repo matches the selected direction immediately.

Verification:

- `LICENSE` contains the GNU Affero General Public License v3 text
- `package.json` declares `AGPL-3.0-or-later`
- `README.md` no longer claims `MIT`

### Milestone 6 - Run The Billing Decision Interview

Ask the minimum set of questions needed to choose between `Stripe` and a `Merchant of Record`, then update the checklist and plan with the resulting recommendation.

Verification:

- the user answers the decision-driving questions
- the recommendation is explicitly tied to those answers
- the docs are updated with the chosen billing direction and rationale

### Milestone 7 - Capture Deferred Release-Blocking Decisions

Record open decisions that should not be forgotten before the first public production release, including:

- `AlynGo` brand versus legal seller identity
- trademark and brand-use posture
- website delivery as a separate implementation thread
- initial Merchant of Record provider selection

Verification:

- the checklist contains the deferred release-blocking items
- the plan names the separate website workstream as follow-on scope

## Verification

- `pnpm docs:check`
  - 2026-04-14: passed

## Progress

- [x] Inspect repository governance and documentation standards
- [x] Inspect current licensing and legal-document baseline
- [x] Create a canonical monetization readiness checklist
- [x] Create an active execution plan for follow-on monetization work
- [x] Update progress, decisions, and outcomes after docs validation
- [x] Update the checklist with current working business decisions
- [x] Update the plan with the recommended future-license direction
- [x] Execute repository license migration to `AGPL-3.0-or-later`
- [x] Run the billing decision interview and record the recommendation
- [x] Record release-blocking brand and website open items

## Surprises and Discoveries

- Observation: The repository already includes baseline privacy-policy and terms-of-service documents.
  Evidence: `docs/security/privacy-policy.md`, `docs/security/terms-of-service.md`
- Observation: Before the license migration in this turn, the package metadata and repository license file both used `MIT`.
  Evidence: `package.json`, `LICENSE`
- Observation: GitHub repository metadata currently still reports MIT until the new license file is pushed and re-indexed by GitHub.
  Evidence: `gh repo view --json licenseInfo`
- Observation: The repository homepage is currently unset in GitHub metadata.
  Evidence: `gh repo view --json homepageUrl`
- Observation: Only one author identity appears in the local git history snapshot inspected for this turn.
  Evidence: `git log --format='%aN <%aE>' | sort -u`

## Decision Log

- Decision: Place the monetization checklist in `docs/product/`.
  Rationale: The checklist is primarily a business/product readiness artifact with technical and compliance dependencies, not a code-behavior contract.
  Date/Author: 2026-04-14 / Codex
- Decision: Keep the execution plan active after this turn.
  Rationale: The user asked for a plan covering the actions Codex should perform next, so the plan should remain open as a living artifact for subsequent monetization decisions.
  Date/Author: 2026-04-14 / Codex
- Decision: Recommend `AGPL-3.0-or-later` as the future-license direction for the public extension core instead of `MIT`.
  Rationale: For a public, monetized, source-visible project, `AGPL-3.0-or-later` is a stronger default than `MIT` when the goal is to deter proprietary forks while still monetizing hosted services, subscriptions, support, and brand trust.
  Date/Author: 2026-04-14 / Codex
- Decision: Execute the license migration now instead of deferring it.
  Rationale: The user explicitly confirmed that no production release has shipped and wants the repository aligned immediately.
  Date/Author: 2026-04-14 / Codex
- Decision: Recommend starting with a `Merchant of Record` instead of direct `Stripe`.
  Rationale: The current answers favor the fastest compliant path for a global B2C launch without a registered company and without taking on first-phase tax/compliance operations directly.
  Date/Author: 2026-04-14 / Codex
- Decision: Defer GitHub metadata changes like homepage alignment until brand and website positioning are finalized.
  Rationale: The repository can safely change license locally now, while brand-facing metadata should wait for the separate website and seller-identity decisions.
  Date/Author: 2026-04-14 / Codex
- Decision: Treat `AlynGo` as a viable umbrella brand candidate.
  Rationale: The brand and public site already present a broader SaaS identity, but the legal seller identity must still be explicit until a formal entity exists.
  Date/Author: 2026-04-14 / Codex

## Outcomes and Retrospective

This phase creates the documentation foundation only.
The repository license and billing direction have now been set at the planning level, but monetization architecture and seller-identity details are still open.
The next phase should resolve the highest-priority remaining unknowns in the checklist before any billing or entitlement implementation work begins.

2026-04-14 update:

- canonical checklist added at `docs/product/monetization-readiness-checklist.md`
- active plan added and indexed
- `pnpm docs:check` passed
- working monetization decisions recorded: `freemium + pro monthly/yearly`, initial `B2C`
- repository license changed to `AGPL-3.0-or-later`
- billing direction recommendation recorded: `Merchant of Record` first
