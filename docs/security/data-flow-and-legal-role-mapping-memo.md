# Data Flow And Legal Role Mapping Memo

This memo records the current working legal posture for CaptionArc based on the repository state.

It is an internal drafting input for privacy, terms, store-copy, and counsel review work.

This is not legal advice.

## Current Working Position

CaptionArc should currently be described as local-first client software, not as a fully managed hosted processor of all meeting content.

Current repository evidence supports these working assumptions:

- no CaptionArc-controlled backend for meeting-content ingestion, storage, or inference is evident in the repository
- caption, chat, translation, assistant, and summary flows are initiated from the extension runtime
- OpenAI requests appear to use the user's own API key from the extension
- optional cloud continuity appears to write to user-owned Google Drive App Data or OneDrive App Folder storage
- encrypted backup export produces a local encrypted file chosen by the user
- the OpenAI API key remains device-local and is excluded from backup export and cloud-sync shared payloads

## Actors

- `End user`: the individual using the extension in a browser meeting
- `Customer organization`: the employer, client, or team that may set workplace or meeting-policy rules
- `CaptionArc publisher`: the software publisher and extension operator
- `Meeting provider`: Google Meet, Microsoft Teams Web, or Zoom Web App
- `OpenAI`: optional third-party AI provider used for translation, assistant, and summary features
- `Cloud storage provider`: Google Drive App Data or OneDrive App Folder when optional sync is enabled

## Data Classes

- settings and preferences
- device-local secrets such as the OpenAI API key
- captured meeting-derived content:
  - visible captions
  - optional meeting chat
- generated outputs:
  - translations
  - assistant guidance
  - summaries
- continuity data:
  - archive records
  - cloud-sync checkpoints
  - encrypted backup files

## Flow Matrix

| Flow | Trigger | Data involved | Remote recipient | CaptionArc-controlled remote copy | Working posture |
| --- | --- | --- | --- | --- | --- |
| Local capture and archive | User joins a supported meeting and capture runs under current settings | Captions, optional chat, session metadata, generated artifacts | None by default | No | CaptionArc acts as local software on the user's device. This should not be described as CaptionArc receiving or hosting all meeting content. |
| OpenAI live translation | User enables translation and has configured OpenAI | Caption text and related translation request context | OpenAI | No repo evidence of CaptionArc-hosted relay | CaptionArc currently facilitates a direct user-configured third-party call. Avoid describing CaptionArc as the hosted processor for this flow unless architecture changes. |
| OpenAI live assistant | User enables assistant behavior through profiles and uses the feature | Recent caption/chat context, prompt instructions, assistant request context | OpenAI | No repo evidence of CaptionArc-hosted relay | Same posture as translation: user-initiated third-party processing through configured credentials. |
| OpenAI summary generation | User runs or enables summary generation | Saved session content, optional chat, summary instructions, profile data | OpenAI | No repo evidence of CaptionArc-hosted relay | Same posture as translation and assistant. The extension prepares and sends content to OpenAI directly from the client-side architecture visible in the repo. |
| Optional cloud sync | User connects Google Drive or OneDrive and enables sync | Shared settings, archive data, sync checkpoints, non-secret continuity data | User-owned Google Drive or OneDrive storage | No CaptionArc-controlled archive is evident | This is best described as optional continuity to storage controlled by the user or customer, not as vendor-hosted sync. |
| Encrypted backup export/import | User explicitly exports or imports a `.mcbak` file | Shared settings, archive data, non-secret continuity data | None unless the user separately moves the file | No | This is a local user-initiated portability feature. The user controls storage location, passphrase handling, and later deletion of exported files. |

## Working Role Statements

Use these statements as the default posture in public docs unless architecture changes:

- CaptionArc is local-first software that stores meeting history and settings on the user's device by default.
- CaptionArc does not currently present itself as a service that stores all meeting content on CaptionArc-operated servers.
- When a user enables AI features, the extension may send relevant content directly to OpenAI using the user's configured API setup.
- When a user enables cloud sync, the extension may write archive data to storage accounts the user controls.
- Backup export is a user-initiated encrypted file export, not a vendor-side escrow or recovery vault.

Avoid these statements in current public materials:

- "We store your meeting content on our servers."
- "CaptionArc is always your processor for meeting content."
- "All meeting data always stays on your device."
- "Cloud sync and backup have the same scope."

## Controller / Processor Framing

This repository alone does not justify a blanket controller or processor claim for every flow.

The safer working framing is:

- for local-only operation, the user or customer organization remains primarily responsible for whether capture and retention are lawful in their context
- for OpenAI-backed flows, the user or customer organization decides whether to send content to OpenAI and under what credentials
- for optional personal cloud sync, the user or customer organization decides whether archive data is written to their own cloud account
- the CaptionArc publisher should currently describe itself primarily as the software publisher and workflow facilitator for these flows, not as a universal hosted meeting-data recipient

Any definitive GDPR controller / processor allocation should still be reviewed by counsel against the actual commercial model, target jurisdictions, and published support process.

## Jurisdiction And Sales Posture

The current repo suggests a self-serve, local-first product posture with possible future B2B expansion.

Near-term document posture should assume:

- public consumer or prosumer users may read the docs directly
- workplace use can occur even without a formal enterprise contract
- GDPR, UK GDPR, and California-style privacy expectations matter for disclosure design
- current architecture does not yet justify enterprise-style promises that assume a managed CaptionArc data-processing environment

## DPA And Enterprise Trigger Conditions

Treat these as triggers for a new legal posture review and likely DPA work:

- CaptionArc introduces a hosted backend that receives meeting content
- CaptionArc manages shared AI keys or proxies AI requests through its own infrastructure
- CaptionArc adds organization accounts, admin consoles, or centralized customer workspaces
- CaptionArc support staff gain routine access to customer meeting archives
- CaptionArc introduces vendor-controlled sync, hosted backup recovery, or analytics over meeting content
- enterprise customers begin requesting vendor security reviews, DPAs, or procurement terms

## Drafting Implications

### Privacy Policy

The privacy policy should say:

- what stays local by default
- which optional features send data to OpenAI
- which optional features write data to user-owned cloud storage
- that exported backups are controlled by the user after export
- that deletion capabilities differ across local storage, synced copies, and exported files

The privacy policy should not imply:

- that CaptionArc routinely stores meeting content on CaptionArc-operated servers
- that every meeting-content flow makes CaptionArc the direct recipient of that content

### Terms Of Service

The terms should emphasize:

- lawful use and user responsibility for consent, notice, and workplace-policy compliance
- third-party provider terms still apply
- AI output may be inaccurate and requires user judgment
- the user remains responsible for exported files, passphrases, and connected third-party accounts

### Store And Setup Copy

Store and setup copy should align with the same flow-specific distinctions:

- local-first default
- optional OpenAI processing
- optional cloud sync to user-controlled storage
- optional chat retention with stronger warning language

## Change Control

Revisit this memo immediately if any of these change:

- a new CaptionArc-hosted backend is added
- AI requests stop being direct user-configured calls
- vendor-managed accounts or org workspaces are introduced
- support or analytics flows begin accessing meeting-content payloads
- deletion, retention, sync, or export boundaries change materially
