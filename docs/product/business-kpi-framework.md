# Business KPI Framework

This document defines a business KPI framework for the current product scope.

This is a product measurement framework, not a guarantee that every metric already has production telemetry automation.

## Measurement Principles

- use code-backed product boundaries as the source of truth
- prefer stable, comparable definitions over ad hoc counts
- separate leading indicators (usage) from lagging indicators (retention/outcomes)

## KPI Groups

## 1) Activation And Setup

- OpenAI readiness rate:
  - Definition: percentage of active users with operational OpenAI setup.
  - Code boundary: `entrypoints/shared/openai-service.ts`.
- First successful live translation rate:
  - Definition: percentage of new users who complete at least one successful translation in first active period.
  - Code boundary: `entrypoints/background/translation.ts`.

## 2) In-Meeting Engagement

- Live capture engagement:
  - Definition: share of sessions where caption capture starts and persists past initial startup.
  - Code boundary: `entrypoints/content/platform-runtime.ts`, `entrypoints/content/caption.ts`.
- Assistant engagement:
  - Definition: share of eligible sessions where assistant outputs are generated.
  - Code boundary: `entrypoints/background/assistant.ts`.

## 3) Post-Meeting Value

- Summary usage rate:
  - Definition: share of saved sessions with at least one summary artifact.
  - Code boundary: `entrypoints/background/history.ts`, `entrypoints/shared/meeting-summary.ts`.
- History return rate:
  - Definition: share of users revisiting session detail after meeting end.
  - Code boundary: `entrypoints/meeting-history/*`.

## 4) Continuity And Reliability

- Continuation success rate:
  - Definition: share of continuation-eligible cases that resume existing session instead of restarting.
  - Code boundary: `entrypoints/background/history.ts`, `entrypoints/content/platform-runtime.ts`.
- Cloud sync success rate (where enabled):
  - Definition: successful sync task ratio for connected providers.
  - Code boundary: `entrypoints/background/cloud-sync/*`.
- Summary completion reliability:
  - Definition: ratio of completed summary jobs to requested summary jobs.
  - Code boundary: `entrypoints/background/history.ts`.

## 5) Quality And Risk

- Browser capability parity:
  - Definition: capability parity progress between Chrome and Firefox for intentionally gated features.
  - Code boundary: `entrypoints/shared/browser-capabilities.ts`.
- Data-boundary alignment:
  - Definition: percentage of releases where product copy remains aligned with data flow behavior.
  - Docs boundary: `docs/product/data-boundary-and-trust-model.md`, `docs/security/privacy-disclosure-notes.md`.

## Practical Data Sources

- local session/history records
- summary job status records
- cloud sync task/checkpoint state
- runtime diagnostics snapshots
- explicit QA and release verification reports

## Reporting Cadence Suggestion

- weekly operational dashboard for reliability KPIs
- monthly product review for activation, engagement, and retention-oriented KPIs

## Update Rule

If major product capability boundaries change, update KPI definitions and mapping in this file to prevent stale measurement assumptions.
