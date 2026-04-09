# Documentation Migration Report

## Scope

This report reflects the final documentation state after two migration phases:

1. migration from legacy `documents/` to canonical `docs/`
2. consolidation of high-volume/low-value planning docs into concise archival summaries

## Action Legend

- `move`: file moved with content preserved
- `rewrite`: content replaced with standards-aligned canonical version
- `merge`: multiple legacy sources consolidated into one doc
- `remove`: removed as obsolete, duplicated, or low-value
- `keep`: retained in place after sanitization

## Final Mapping Highlights

### Architecture, Setup, Quality, Security, Operations

- legacy architecture/testing/deployment notes were moved to corresponding `docs/` sections
- canonical section indexes were added across all top-level `docs/` domains
- root docs were aligned to reference `docs/README.md`

### Feature Plans Consolidation

Legacy long-form feature plans were initially moved to archive and then consolidated.

Final outcome:

- kept:
  - `docs/archive/feature-plans/historical-initiatives-summary.md`
  - `docs/archive/feature-plans/provider-qa-baseline.md`
- removed:
  - verbose per-feature historical planning files previously under `docs/archive/feature-plans/*`

Rationale:

- reduce default context load
- remove repetitive/stale planning artifacts
- keep essential historical value in concise summaries

### Product Notes Consolidation

- merged ad hoc request/demo notes into:
  - `docs/product/backlog-summary.md`
- removed:
  - `docs/product/requested-features.md`
  - `docs/product/positive-demo-script.md`

### Store Documentation

- replaced marketing-heavy copy with formal operational draft:
  - `docs/operations/store-listing.md`
- removed:
  - `docs/operations/store-listing-copy.md`

### Root Guidance

- removed `CLAUDE.md`
- merged relevant operational guidance into `AGENTS.md`

### Strict Markdown Boundary Hardening

- removed `.secrets/README.md` to eliminate non-`docs/` markdown exceptions
- moved local smoke-secret guidance to:
  - `docs/setup/local-smoke-secrets.md`
- updated policy and guardrails so markdown is limited to:
  - `docs/`
  - approved root entry docs

### Execution Planning Governance

- standardized non-trivial work planning under:
  - `docs/contributing/execution-plans.md`
  - `docs/contributing/execution-plans/active/`
  - `docs/contributing/execution-plans/completed/`
- added canonical template:
  - `docs/templates/execution-plan-template.md`
- updated contributing and agent guidance to enforce plan-first execution for non-trivial work

### Testing Governance Hardening

- added testing completion gate policy:
  - `docs/quality/testing-quality-gate.md`
- added testing onboarding guide:
  - `docs/quality/testing-onboarding.md`
- updated AGENTS, development workflow, and definition of done to require:
  - test updates for changed behavior
  - coverage command execution for code changes
- added CI enforcement workflow:
  - `.github/workflows/quality-gates.yml`

## Sanitization Summary

- Removed machine-local absolute paths from docs.
- Removed real-looking API token examples.
- Enforced English-only documentation content.
- Normalized non-ASCII punctuation and symbols.

## Validation Summary

- Markdown links: pass
- Secret/path leak scan: pass
- English-only scan: pass
