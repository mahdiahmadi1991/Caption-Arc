# Secure Development

## Non-Negotiable Rules

- never commit secrets, tokens, or real API keys
- never publish machine-local absolute paths in docs
- sanitize logs and examples before committing
- keep host permissions minimal and documented

## Coding And Review Expectations

- use existing typed models for settings/session/action contracts
- avoid undocumented storage-schema changes
- verify public-facing docs after changing runtime behavior

## Related Policy

Repository-level durable rules are maintained in [`AGENTS.md`](../../AGENTS.md).
