# Store Listing Draft

This document provides a formal draft for browser-extension store submission text.

## Short Description

Capture, translate, and follow up on browser-meeting captions with live AI help.

## Detailed Description

CaptionArc captures visible live captions from supported browser meeting platforms, translates them with OpenAI, can surface live in-meeting AI guidance, and saves session history for later review.

The extension is designed for multilingual meeting follow-up, accessibility support, and structured post-meeting analysis without forcing users into a separate meeting-notes platform.

### Core Capabilities

- Real-time caption capture on supported browser meeting pages
- Real-time translation using user-configured OpenAI credentials
- Live AI assistant guidance tuned by reusable meeting profiles
- In-meeting overlay with resize, compact mode, and appearance controls
- Capture startup control with `off`, `ask`, and `always` behavior
- Supported meeting chat capture for richer session context
- Meeting history with search, filtering, starring, and session detail
- Session export as Markdown transcript
- AI summary generation using reusable meeting profiles
- Durable summary job queue with retry and recovery behavior
- Encrypted `.mcbak` backup export and import with a passphrase
- Optional personal cloud archive sync (Google Drive App Data and OneDrive App Folder)

### Supported Meeting Platforms

- Google Meet (web)
- Microsoft Teams Web
- Zoom Web App

Desktop-native meeting clients are not supported.

### Browser Support Notes

- Chrome and Firefox are the governed browser builds for CaptionArc.
- Core caption capture, translation, summaries, history, and settings surfaces are supported on both browser builds.
- Optional Google Drive App Data and OneDrive App Folder sync are currently available on Chrome builds and intentionally unavailable on Firefox builds until the required browser identity flows are verified.

### Data And Privacy Summary

- API keys are stored locally on device.
- Session archive is local-first.
- Caption and chat content is sent to OpenAI only when translation, assistant, or summary features are used.
- Optional cloud sync writes archive data to user-owned cloud app-data storage.

## Single Purpose Statement

CaptionArc captures and displays real-time captions from supported browser meeting pages, translates them with OpenAI, assists during the meeting when configured, and saves session history for later review.

## Permission Justifications

### `storage`

Used to store settings, local API credential references, meeting history metadata, summary state, and local runtime preferences.

### `identity`

Used for account authentication flows required by optional Google Drive and OneDrive sync.

### `alarms`

Used for background scheduling and retry of durable summary jobs.

### Host permissions

- meeting platform domains are required to run content scripts for capture and overlay rendering
- OpenAI and cloud-provider API domains are required for translation/summaries and optional cloud sync

## Review Checklist

- Verify platform support wording matches current implementation.
- Verify permission list matches current manifest.
- Verify privacy language matches `docs/security/privacy-disclosure-notes.md`.
