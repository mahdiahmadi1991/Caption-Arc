# Data Boundary And Trust Model

This document states where data lives, when it moves, and under which product actions it crosses trust boundaries.

## Data Classes

- settings and preferences
- device-local secrets (OpenAI API key)
- meeting events (captions and optional chat)
- generated outputs (translations, assistant outputs, summaries)
- sync checkpoints and retry metadata

## Trust Boundaries

- browser meeting page DOM (untrusted external surface)
- extension runtime (content, background, extension pages)
- external AI API (OpenAI)
- optional cloud app-data providers (Google Drive, OneDrive)

## Local-First Baseline

Default persistence is local-first:

- settings and runtime metadata in extension storage
- session archive index and event chunks in IndexedDB
- diagnostics data in extension session storage when available, with local fallback

Primary references:

- `entrypoints/background/settings.ts`
- `entrypoints/background/history-db.ts`
- `entrypoints/shared/browser-capabilities.ts`

## Data Leaving Device Conditions

Data leaves the device only under explicit feature usage:

- OpenAI requests when user uses translation, assistant, or summary features
- cloud app-data writes when user enables cloud sync providers

Primary references:

- `entrypoints/background/translation.ts`
- `entrypoints/background/assistant.ts`
- `entrypoints/background/history.ts`
- `entrypoints/background/cloud-sync/*`

## Continuity Modes

1. Personal cloud vault sync (optional, browser-gated by capability checks).
2. Encrypted backup export/import (`.mcbak`) with passphrase encryption.

Primary references:

- `entrypoints/background/cloud-sync/*`
- `entrypoints/background/data-transfer.ts`
- `entrypoints/shared/app-data-backup.ts`

## Product Communication Rule

Public-facing product copy must not claim "all meeting data always stays local."
It must clearly state that OpenAI-backed features and optional cloud sync send data outside the device.
