# CaptionArc Privacy Policy

## Overview

This Privacy Policy explains how CaptionArc handles information when you use the CaptionArc browser extension.

CaptionArc is designed as local-first software. Based on the current repository architecture, CaptionArc does not present itself as a service that stores all meeting content on CaptionArc-operated servers. Some optional features can send data directly from the extension to third-party services you configure or choose.

Publisher: `Mohammad Mahdi Ahmadi`

Effective date: `2026-04-10`

Contact: `me@mahdiahmadi.dev`

## Scope

This policy applies to the CaptionArc browser extension and to direct privacy questions sent to the publisher.

This policy does not replace the terms, privacy notices, or processing terms of third-party services that you choose to connect or use with CaptionArc, including:

- OpenAI
- Google Drive
- OneDrive
- supported meeting providers such as Google Meet, Microsoft Teams Web, and Zoom Web App

## Data Categories

Depending on the features you use, CaptionArc may process these categories of data:

- settings and preferences
- device information needed for local extension behavior, such as a local device identifier and device label
- device-local secrets, including your OpenAI API key
- visible meeting captions captured from supported meeting pages
- optional meeting chat content, if you enable meeting chat storage
- generated outputs such as translations, assistant outputs, and summaries
- continuity data such as archive records, sync checkpoints, and encrypted backup bundles
- correspondence you send directly to the publisher, such as support or privacy requests

## How CaptionArc Collects Data

CaptionArc collects or generates data in these ways:

- from settings you enter in the extension
- from visible meeting-page content on supported meeting providers when capture is enabled
- from optional feature use, such as translation, assistant, summaries, cloud sync, or backup export
- from archive and continuity operations performed on your device
- from emails or messages you send directly to the publisher

## Local-First Operation

By default, CaptionArc stores core settings and meeting history locally in extension storage and local browser databases on your device.

Current repository behavior indicates that:

- your OpenAI API key is stored locally on your device
- your OpenAI API key is excluded from cloud-sync shared payloads
- your OpenAI API key is excluded from encrypted backup export
- meeting history is local-first unless you enable an optional external feature that sends or mirrors relevant data outside the device

## When Data Leaves Your Device

Data can leave your device in these cases:

### OpenAI Features

If you use live translation, live assistant guidance, or summary generation, the extension may send relevant caption, chat, prompt, and summary context directly to OpenAI using the API configuration you provide.

These features are optional. If you do not configure and use them, this OpenAI transmission does not occur.

### Cloud Sync

If you enable Google Drive App Data or OneDrive App Folder sync, CaptionArc may write archive and related continuity data to storage associated with the third-party account you connect.

Cloud sync is optional.

### Backup Export

If you export an encrypted backup file, CaptionArc writes the backup bundle to a location you choose. After export, control over that file depends on how you store, copy, or delete it.

Backup export is optional.

## How We Use Data

CaptionArc uses data to:

- run the extension's local capture, archive, and settings behavior
- provide optional translation, assistant, and summary features
- support optional continuity features such as cloud sync and encrypted backup
- improve reliability, security, and troubleshooting of the extension
- respond to support or privacy inquiries you send directly to the publisher

## Data Sharing And Recipients

Based on the current architecture, data may be disclosed to these categories of recipients when the relevant feature is used:

- OpenAI, for optional AI-powered translation, assistant, and summary workflows
- Google Drive, when optional Google Drive App Data sync is enabled
- OneDrive, when optional OneDrive App Folder sync is enabled
- service providers or advisors only where reasonably necessary to respond to your direct support or legal request

We do not describe CaptionArc here as routinely storing all meeting content on CaptionArc-operated servers, because the current repository does not show a CaptionArc-hosted meeting-content backend for those flows.

## Retention And Deletion

Retention depends on the feature you use and the storage location involved:

- local archive data for ended, non-starred sessions is subject to the archive-retention window you choose in Settings; if you choose `Off`, CaptionArc does not automatically delete local archive sessions
- starred sessions are excluded from the current automatic archive-pruning guardrails
- optional synced copies may remain in connected third-party storage until deleted there or through the relevant sync/delete workflow; retention-driven local deletions are queued into the same cloud-delete workflow and may remain remotely until that sync completes
- encrypted backup files remain wherever you save them until you delete them
- device-local secrets such as the OpenAI API key stay on your device unless you remove or replace them there
- support or privacy correspondence may be retained for a reasonable period needed to respond, document, and resolve the request

If you delete local archive data, that does not automatically guarantee deletion of:

- copies already written to connected cloud storage
- copies already exported to encrypted backup files
- content already sent to third-party services when you used optional AI or cloud features

## Your Choices And Controls

You can control important privacy-sensitive behaviors from the extension:

- choose whether capture starts `off`, `ask`, or `always`
- choose whether caption activation stays guided or automatic
- keep meeting chat storage disabled or enable it intentionally
- decide whether to configure and use OpenAI-backed features
- decide whether to enable cloud sync
- decide whether to export or import encrypted backup files

Meeting chat storage is particularly sensitive because chat content can later appear in meeting history, exports, translations, and summaries if those features are used.

## Rights And Requests

Depending on the laws that apply to you, you may have rights related to personal data, such as access, correction, deletion, objection, restriction, portability, or withdrawal of consent.

Because CaptionArc is currently local-first and some optional flows send data directly from the extension to third-party services you configure, the scope of any request may depend on where the data actually resides:

- on your device
- in your connected Google Drive or OneDrive storage
- with OpenAI or another third-party service you used directly
- in communications you sent to the publisher

To ask a privacy question or submit a rights request, contact: `me@mahdiahmadi.dev`

## EEA / UK Basis Note

Where EEA or UK data-protection law applies, the intended basis for direct publisher-side processing depends on the context and may include:

- your request to use or configure optional features
- your consent, where consent is the appropriate basis
- legitimate interests in operating, securing, and supporting the extension
- legal obligations, where applicable

For meeting-content flows sent directly from the extension to third-party services you configure, your own use context and the third-party provider relationship may also be relevant.

## International Transfers

Third-party services used with CaptionArc may process data in countries other than your own. CaptionArc cannot describe those third-party processing locations or safeguards better than the providers themselves. Review their own privacy and transfer terms before enabling those features.

## Google API Services Statement

If CaptionArc uses Google APIs, the following statement applies:

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Children's Privacy

CaptionArc is not intended for children, and the publisher does not knowingly market CaptionArc as a product for children.

## Changes To This Policy

This Privacy Policy may be updated as the product, business model, or legal requirements change. When the policy changes materially, update the effective date and the linked public copy used for release and store surfaces.

## Contact

Privacy questions, rights requests, and policy notices should be sent to:

- `Mohammad Mahdi Ahmadi`
- `me@mahdiahmadi.dev`
- `https://github.com/mahdiahmadi1991/caption-arc`
