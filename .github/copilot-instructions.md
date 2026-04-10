# Copilot repository instructions

Use `AGENTS.md` as the repository-wide behavioral contract.

For documentation work, treat these files as the source of truth:
- `docs/contributing/documentation-standards.md`
- `docs/contributing/execution-plans.md`
- `docs/contributing/behavior-contract-governance.md`
- `docs/setup/agent-testing-onboarding.md` (test selection, sequencing, and reporting protocol)
- `docs/quality/test-writing-standards.md` (test authoring rules)

Rules:
- For non-trivial code/behavior changes, create or update an Execution Plan in `docs/contributing/execution-plans/active/` before implementation.
- Do not create an Execution Plan by default for docs-only edits (for example small README or copy/link updates) unless the repository owner explicitly asks for one.
- Keep all canonical project documentation under `docs/`.
- Do not create ad hoc Markdown files outside the approved structure unless explicitly required.
- Never include secrets, local machine paths, usernames, private URLs, or sensitive identifiers in docs.
- When behavior, architecture, setup, permissions, contracts, storage, release flow, or testing changes, update the corresponding docs in the same change.
- When behavior-sensitive code changes runtime/system behavior, update canonical behavior contracts in `docs/api/` and matching traceability matrices in `docs/quality/references/`.
- Run `pnpm docs:check:behavior` when behavior-sensitive runtime/system code changes.
- For any thread that includes test execution, follow `docs/setup/agent-testing-onboarding.md` for scenario selection, command ordering, failure classification, and reporting format.
- For runtime-sensitive test execution, keep `DETERMINISTIC_TEST_MODE=1` unless explicitly running diagnosis.
- Use the canonical runtime smoke convention name `Deterministic Live Smoke (DLS)` and prefer `pnpm chrome:smoke:live <provider> <scenario>` (or `chrome:smoke:live:matrix`) for acceptance evidence.
- Use single-path launch/runtime behavior (`cft-only + auto`) and do not add fallback hopping to launch scripts.
- Do not close a runtime-sensitive thread with partial scenario coverage for touched modules; completion requires passing all required scenarios in-thread or explicit owner-approved deferral.
- For module-scoped requests, start with `pnpm test:module:plan <path>` and `pnpm test:module:run <path>`; avoid full-matrix execution unless cross-provider impact is demonstrated or requested.
- For runtime-sensitive module work, ensure structured logging coverage across all levels (`trace/debug/info/warn/error`) or document explicit rationale for any intentionally missing level.
- Do not implement UI, styling, or other user-visible surfaces unless the user explicitly asked for that implementation.
- If the user says UI discussion should happen later, stop at backend or non-visual work and wait for explicit approval before building visible surfaces.
- In chat responses for this repository owner, respond in Persian unless the owner explicitly asks for another language.

Execution efficiency rules:
- Prefer direct file edits in the requested scope over prolonged exploratory scripting.
- Start with the smallest useful repository inspection, then begin editing the target files directly.
- If the user names specific files or a narrowly scoped task, do not expand into a broad repository audit unless the current files prove insufficient.
- Do not generate temporary scripts for scanning, translation, or transformation when existing repository files and normal edits are sufficient.
- Only create an ad hoc script when it is clearly necessary for correctness or scale; if used, it must materially advance the workspace changes rather than only produce analysis.
- Do not spend more than a few minutes on script-based exploration without producing a meaningful workspace edit.
- If no repository file has been changed after focused investigation, stop and report the concrete blocker or missing assumption instead of continuing to loop.
- Prefer incremental, reviewable edits plus validation over large analysis passes that do not change code.
- Do not repeatedly re-scan or re-read the same repository areas unless new evidence is required for the next decision.
- Prefer existing repository commands, tests, and utilities over creating one-off wrapper scripts.
- When a script is necessary, keep it minimal, run it once or a small bounded number of times, and then return to direct repository edits.
- Prefer changing the real target files over writing temporary generated outputs outside the workspace and postponing integration.
- Batch closely related edits before validation, but avoid giant speculative rewrites.
- When the task is blocked by ambiguity, missing prerequisites, or failing assumptions, surface the blocker early instead of continuing low-yield investigation.
- Optimize for forward progress with clear checkpoints: inspect, edit, validate, then continue.
- Do not trade away test quality, contract coverage, or documentation accuracy for speed; optimize by reducing wasted exploration, not by weakening validation.
