# Security And Privacy Boundaries

## Trust Boundaries

- In-meeting capture runs on supported meeting web pages only.
- AI generation requests are sent to OpenAI.
- Optional sync requests are sent to Google/Microsoft APIs for user-owned app-data storage.

## Data Classes

Device-local only:

- API keys
- verification snapshot
- device identity
- local UI/runtime state

May leave device:

- captions/chat used for translation or summary generation
- mirrored archive payloads when cloud sync is enabled

## Security Principles

- local-first by default
- explicit provider host permission declaration
- least persistence in content runtime, durable persistence in background/storage layers
- no secrets in committed docs/config examples

## Related Docs

- [../security/threat-model.md](../security/threat-model.md)
- [../security/privacy-disclosure-notes.md](../security/privacy-disclosure-notes.md)
- [../setup/environment-and-config.md](../setup/environment-and-config.md)
