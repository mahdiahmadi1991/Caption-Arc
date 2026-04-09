# AGENTS.md

## Repository expectations

- Treat this repository as public. Never add secrets, tokens, private URLs, local machine details, personal usernames, or absolute system paths to code comments, docs, examples, screenshots, logs, or generated files.
- Use repository evidence as the source of truth. Derive commands, architecture notes, feature descriptions, and workflows from the actual codebase, config, and CI scripts.
- Keep documentation changes scoped, reviewable, and consistent with the existing repository style.
- High-priority UI validation rule: after any code change that needs user visual/UI verification, always produce fresh development builds for both governed browsers without waiting for the user to ask. The expected handoff is that the user only needs to reload the Chrome and Firefox extension builds in the browser and test the updated UI.

## Repository governance

Follow `docs/contributing/repository-governance.md` for repository operations, branch discipline, merge policy, versioning, tagging, and release rules.

Key rules:
- `main` is the protected release branch.
- `develope` is the long-lived integration branch for normal work.
- Use short-lived topic branches and PRs for normal work.
- Prefer graph-preserving merge commits over squash merges for normal integration and release flow.
- Every merge to `main` must correspond to exactly one release version and one matching annotated tag in the form `vX.Y.Z`.
- The Git tag, release version, and canonical project version must always stay aligned.
- For non-trivial code/behavior work, follow `docs/contributing/execution-plans.md` before implementation.
- For documentation updates, follow `docs/contributing/documentation-standards.md`.

If repository automation, local state, and documentation disagree, stop and surface the inconsistency instead of guessing.
```

Keep the `AGENTS.md` section short.
The detailed policy should remain in `docs/contributing/repository-governance.md`.

## Project stack snapshot

- Package manager: `pnpm`
- Extension framework: `WXT`
- UI/runtime: `React` + `TypeScript`
- Styling: `Tailwind CSS`

When adding or changing dependencies, check `package.json` first and prefer existing stack patterns.

## Documentation contract

- The canonical location for project documentation is `docs/`.
- Do not create ad hoc markdown files in random directories unless the document must live next to code for a strong repo-specific reason.
- Keep root-level markdown limited to repository entry-point files such as `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, and this `AGENTS.md`.
- Every documentation section under `docs/` must have a `README.md` index file.
- Use lowercase kebab-case file names for docs.
- Use relative links and fix broken links when moving or editing docs.
- Prefer one canonical document per topic. Merge duplicates instead of preserving competing sources of truth.
- Keep `docs/features/plans/` lightweight (pointer/index only). Move long plans to `docs/archive/feature-plans/`.
- When behavior, architecture, setup, permissions, storage, messaging, release flow, or testing changes, update the relevant docs in the same change.
- Follow detailed standards in `docs/contributing/documentation-standards.md`.
- Follow business-doc update governance in `docs/contributing/business-documentation-governance.md`.
- Follow behavior-contract governance in `docs/contributing/behavior-contract-governance.md`.
- Run `pnpm docs:check` after documentation changes. Treat a failing docs check as a blocking issue.
- Run `pnpm docs:check:business` when business-sensitive code surfaces change.
- Run `pnpm docs:check:behavior` when behavior-sensitive code surfaces change.
- The `Docs Guardrails` GitHub Actions workflow is required for markdown-governance enforcement on push/PR.
- The `Quality Gates` GitHub Actions workflow is required for test and coverage enforcement on push/PR.
- Treat `docs/archive/` as historical context. Do not load archived files unless the task explicitly requires decision history.

## Execution Plans

- For non-trivial code/behavior work, create or update an Execution Plan before implementation.
- Planning standard: `docs/contributing/execution-plans.md`.
- Active plans live in `docs/contributing/execution-plans/active/`.
- Completed or superseded plans move to `docs/contributing/execution-plans/completed/`.
- Docs-only updates do not require an Execution Plan by default unless explicitly requested by the repository owner or required by the planning standard.
- Do not start meaningful implementation on plan-required code/behavior work before the relevant plan exists.
- Plans that touch browser APIs, runtime behavior, permissions, packaging, or release flow must explicitly state Chrome and Firefox impact, any intentional browser gating, and the verification evidence required for both browsers.

## Required `docs/` layout

Keep documentation organized under this structure and place new documents in the nearest appropriate section.

```text
/docs/
  README.md
  architecture/
  product/
  setup/
  features/
  api/
  quality/
  security/
  operations/
  contributing/
  adr/
  templates/
  archive/
```

Routing rules:
- `docs/architecture/` -> system design, manifest, permissions, runtime model, messaging, storage, security boundaries, packaging.
- `docs/product/` -> product overview, scope, use cases, roadmap.
- `docs/setup/` -> local setup, environment/config, debugging, troubleshooting.
- `docs/features/` -> feature-specific behavior grouped by area such as background, content scripts, UI, integrations.
- `docs/api/` -> message contracts, storage schema, commands, public technical surfaces.
- `docs/quality/` -> test strategy, compatibility, manual validation.
- `docs/security/` -> threat model, privacy, secure development requirements.
- `docs/operations/` -> release runbooks, store submission, support/diagnostics.
- `docs/contributing/` -> workflow, documentation standards, definition of done, migration notes.
- `docs/adr/` -> architecture decision records.
- `docs/templates/` -> reusable documentation templates.
- `docs/archive/` -> historical high-volume docs, not part of default reading flow.

## Public-repo documentation safety rules

- Never commit absolute paths like `/Users/...`, `C:\Users\...`, machine-specific profile paths, or copied terminal output that reveals local environment details.
- Replace unsafe values with neutral placeholders such as `<repo-root>`, `<local-path>`, `<browser-profile>`, `<extension-id>`, and `<api-base-url>`.
- Sanitize screenshots, logs, stack traces, copied configs, and examples before committing.
- Do not mention private dashboards, internal tickets, unpublished endpoints, or non-public contacts unless the repository explicitly intends them to be public.

## Documentation quality bar

Every new or updated doc should be:
- public-safe,
- accurate to the current repo state,
- concise and skimmable,
- linked from the correct section index,
- free of obvious duplication,
- written so a new contributor and Codex can both find the right source of truth quickly.

## Definition of done for documentation-affecting work

Before finishing work:
- update the relevant docs when behavior changes,
- add new docs to the correct `docs/` section,
- update section indexes when adding a new document,
- verify links after moves/renames,
- preserve or migrate useful content from legacy docs before removing them,
- keep placeholder docs for expected future areas rather than creating undocumented gaps.

## Runtime-sensitive validation rules

For changes affecting overlay behavior, provider detection, runtime lifecycle, or in-meeting flows:

- review coding conventions in `docs/contributing/coding-conventions/`
- follow `docs/contributing/coding-conventions/development-logging-and-diagnostics.md` for debug-only logging, structured diagnostics, direct agent log access expectations, and development-only log viewer rules
- follow runtime onboarding in `docs/quality/references/agent-onboarding-cdp-runtime.md`
- reload runtime before smoke passes: `pnpm chrome:debug:reload`
- use the canonical smoke convention: **Deterministic Live Smoke (DLS)**
- DLS command shape: `pnpm chrome:smoke:live <provider> <scenario>`
- launch/runtime path is single-path only: `cft-only + auto` (no runtime/load fallback hopping)
- prefer runtime-resolved smoke flow: `pnpm chrome:smoke:meet`
- run provider-level validation when shared behavior may be impacted: `pnpm chrome:smoke:live <provider> <scenario>` or `pnpm chrome:smoke:live:matrix`
- follow deterministic test protocol: `DETERMINISTIC_TEST_MODE=1` (single runtime path, no fallback hopping)
- follow thread protocol from `docs/setup/agent-testing-onboarding.md`

For implementation work that adds or changes logging or diagnostics:

- keep verbose logging disabled by default for primary release behavior
- add or update structured debug logging when runtime-sensitive changes would otherwise create observability blind spots
- design runtime-sensitive module logging so all levels (`trace`, `debug`, `info`, `warn`, `error`) are meaningfully covered (or explicitly justified if a level is intentionally absent)
- prefer canonical logger/collector flows over new ad hoc `console.*` usage or one-off debug state systems
- remove or align incompatible legacy diagnostics instead of preserving parallel logging structures
- ensure agents can retrieve relevant logs directly in debug workflows when development debug gates are enabled
- keep any log viewer surface development-only until explicitly designed for broader use

## Testing completion gate

- A feature, fix, or improvement is not complete until required tests are added or updated and validation commands pass.
- For UI-affecting changes that require user visual verification, always run both governed browser development builds as part of completion so the extension is ready to reload locally in Chrome and Firefox without an extra user prompt.
- For code changes, run:
  - `pnpm test:google`
  - `pnpm test:google:coverage`
  - `pnpm test:targeted:plan` and execute recommended targeted commands
- For runtime-sensitive changes, run CDP smoke validation using the runtime-sensitive rules above.
- For runtime-sensitive acceptance evidence, prefer DLS commands (`chrome:smoke:live*`) so step-by-step UI and live diagnostics are visible in the same terminal.
- For runtime-sensitive module changes, execute all implemented smoke scenarios for the touched module in the same thread.
- Until a canonical Firefox runtime automation flow exists, runtime-sensitive changes must also record Firefox verification evidence using `docs/quality/firefox-manual-verification-checklist.md`.
- When user asks to test a specific module, use module-scoped plan/run commands first: `pnpm test:module:plan <path>` then `pnpm test:module:run <path>`.
- Do not run full matrix for module-scoped requests unless shared cross-provider impact is proven or explicitly requested.
- Definition of done requires high-confidence scenario coverage plus green results for all executed test commands.
- Do not defer tests unless the repository owner explicitly approves the deferral and a follow-up is recorded in an Execution Plan.
- Follow quality policy docs:
  - `docs/quality/testing-quality-gate.md`
  - `docs/quality/testing-onboarding.md`
  - `docs/quality/test-writing-standards.md`

## When rules are missing

If you encounter repeated ambiguity or the same review feedback more than once, update this `AGENTS.md` or the relevant docs policy file so the rule becomes durable for future Codex sessions.
