# Product Overview

CaptionArc is a browser extension for capturing live meeting captions, translating content, generating live AI guidance, and preserving searchable meeting history with AI summaries.

## Supported Meeting Surfaces

- Google Meet (web)
- Microsoft Teams Web
- Zoom Web App

Desktop-native meeting apps are out of scope.

## Core Value

- one consistent in-meeting capture workflow across supported browser meeting providers
- local-first archive with optional personal-cloud continuity
- reusable meeting profiles that shape live guidance and summary behavior
- AI translation, live assistant guidance, and summary generation powered by OpenAI

## Current Product Notes

- 2026-04-10: Behavior-contract test coverage expanded for runtime/provider surfaces with no intended change to user-facing product scope or capability set.
- 2026-04-21: repository delivery moved to an automated preview/stable release train so `develop` can carry preview builds while `main` remains the stable release line for published extension artifacts.
- 2026-04-21: governed extension artifacts now resolve from a stable development path under `.release/development/<browser>` and a versioned production path under `.release/production/<version>/<browser>`, so local debug tooling and published release packaging no longer share the same directory contract.
