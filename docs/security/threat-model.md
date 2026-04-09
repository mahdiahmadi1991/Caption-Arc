# Threat Model

## Assets

- device-local API keys and verification state
- meeting transcript and chat content
- session history and generated summaries
- cloud-sync metadata and tokens

## Trust Boundaries

- browser page DOM (untrusted meeting surface)
- extension runtime surfaces (content/background/UI)
- external APIs (OpenAI, Google, Microsoft)

## Key Abuse Cases

- accidental leakage of secrets via logs/docs
- overbroad host permissions beyond product need
- unintended data sync or incorrect merge behavior
- stale runtime actions causing unsafe assumptions

## Mitigations

- strict documentation sanitization policy
- explicit permission rationale and review
- local-first architecture with optional sync
- typed action contracts and bounded message dispatch
