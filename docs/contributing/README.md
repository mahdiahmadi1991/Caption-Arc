# Contributing Docs

- [repository-governance.md](./repository-governance.md)
- [development-workflow.md](./development-workflow.md)
- [execution-plans.md](./execution-plans.md)
- [execution-plans/README.md](./execution-plans/README.md)
- [documentation-standards.md](./documentation-standards.md)
- [business-documentation-governance.md](./business-documentation-governance.md)
- [behavior-contract-governance.md](./behavior-contract-governance.md)
- [definition-of-done.md](./definition-of-done.md)
- [project-working-agreement.md](./project-working-agreement.md)
- [coding-conventions/README.md](./coding-conventions/README.md)
- [coding-conventions/development-logging-and-diagnostics.md](./coding-conventions/development-logging-and-diagnostics.md)
- [documentation-migration-report.md](./documentation-migration-report.md)
- [../quality/testing-quality-gate.md](../quality/testing-quality-gate.md)
- [../quality/testing-onboarding.md](../quality/testing-onboarding.md)

Shared workspace-owned governance standards now live canonically in `CaptionArc-Workspace/docs/contributing/`.
The local files `execution-plans.md`, `documentation-standards.md`, and `business-documentation-governance.md` remain here as discovery and tooling pointers.

Before PR updates that touch docs, run: `pnpm docs:check` and any required sync checks (`pnpm docs:check:business`, `pnpm docs:check:behavior`).
