---
applyTo: "docs/**/*.md,README.md,AGENTS.md,.github/copilot-instructions.md"
---

For documentation files, follow:
- `docs/contributing/documentation-standards.md`
- `docs/contributing/execution-plans.md`
- `docs/contributing/behavior-contract-governance.md`
- `docs/setup/agent-testing-onboarding.md` (thread-level testing protocol)
- `docs/quality/testing-quality-gate.md` (completion gate)
- `docs/quality/test-writing-standards.md` (test authoring standards)

Do not invent a new docs structure.
Prefer updating existing canonical docs over creating new top-level markdown files.
Keep links relative and keep section indexes updated.
For behavior-sensitive changes, sync `docs/api/*-behavior-contract.md` and corresponding `docs/quality/references/*traceability-matrix.md` updates in the same change.
Run `pnpm docs:check:behavior` when behavior-sensitive code surfaces changed.
For docs-only edits, do not create an Execution Plan by default unless the repository owner explicitly requests one or the planning standard marks the docs task as a non-trivial initiative.
