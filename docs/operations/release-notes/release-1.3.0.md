# Release 1.3.0 Draft

## Summary

CaptionArc now supports browser-based caption capture across:

- Google Meet
- Microsoft Teams Web
- Zoom Web App

This release also expands the product around that shared capture pipeline with a redesigned settings experience, richer meeting history, and AI-generated meeting summaries.

## Highlights

- Added Microsoft Teams Web caption capture support
- Added Zoom Web App caption capture support
- Added provider-aware meeting history metadata and filtering
- Added starred sessions, richer session detail pages, and export flows for history
- Added per-session summary generation with reusable summary profiles
- Added adaptive summary effort modes (`Economy`, `Balanced`, `Thorough`)
- Added per-profile summary effort selection for summary profiles
- Added staged summary orchestration for longer or riskier sessions
- Added durable summary queue persistence and restart recovery for queued or interrupted summary jobs
- Moved automatic end-of-meeting summary enqueueing onto a background-backed finalization path
- Added cancel/retry flows and clearer summary job states in session detail
- Added provider-specific capture guidance overlays
- Added overlay controls for default state, opacity, and click-through behavior
- Refined settings UX with model guidance, profile management, and provider verification
- Improved browser-only product messaging and documentation
- Stopped overriding `chrome://history/`; meeting history now opens as an internal extension page

## Notes

- Native desktop Zoom and native desktop Teams apps are not supported
- Caption availability still depends on each meeting platform exposing visible native captions or live transcription
- Speaker attribution in Zoom Web App may still require refinement depending on layout and subtitle surface behavior
- Meeting history and summaries remain local-first; optional personal cloud sync can mirror the archive into the user's own cloud account

## Recommended QA Before Release

- Google Meet smoke pass
- Microsoft Teams Web smoke pass
- Zoom Web App smoke pass
- Translation smoke pass
- Meeting history smoke pass
- Summary generation smoke pass
- Overlay behavior smoke pass (`expanded`, `minimized`, opacity, click-through)
