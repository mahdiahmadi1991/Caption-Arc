# Background Features

Background-layer responsibilities include:

- settings persistence
- translation and summary orchestration
- history persistence and retrieval
- cloud sync and data transfer
- quick-access runtime state

Shared translation and summary target-language metadata lives in `entrypoints/shared/language-metadata.ts` and is consumed by background settings normalization, cloud-sync serialization, popup labels, options selectors, meeting-history actions, and in-meeting translation surfaces.

Primary implementation path: `entrypoints/background/*`.
