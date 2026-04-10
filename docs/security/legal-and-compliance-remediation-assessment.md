# Legal And Compliance Remediation Assessment

## Purpose

This document records the current legal, privacy, consent, retention, disclosure, and distribution risks identified from the repository state as of 2026-04-10.

It is intended to support issue creation, remediation sequencing, and legal review.

This is not legal advice. It is a repository-grounded product and implementation risk assessment.

## Intended Use

- create engineering, product, documentation, and review tasks
- prioritize remediation before broader public release or enterprise use
- separate code-derived facts from unresolved legal or policy questions
- give external counsel a concise implementation-grounded starting point

## Scope And Working Assumptions

This assessment is based on the current repository and should be read with these assumptions:

- no developer-operated backend for meeting-content processing is evident in the repository today
- OpenAI requests appear to be made directly from the extension using the user-supplied API key
- optional cloud continuity appears to write to user-owned Google Drive App Data or OneDrive App Folder storage, not to a CaptionArc-controlled cloud archive
- cloud sync and encrypted backup are different continuity paths and should not be described as if they have the same data scope
- if the business later adds managed AI keys, server-side proxying, hosted accounts, organization admin features, analytics on meeting content, or support-side access to meeting data, this assessment will need a material rewrite

## Source Surfaces Reviewed

Primary implementation and documentation evidence:

- [../../README.md](../../README.md)
- [../product/data-boundary-and-trust-model.md](../product/data-boundary-and-trust-model.md)
- [../product/business-non-goals-and-scope-boundaries.md](../product/business-non-goals-and-scope-boundaries.md)
- [../product/feature-availability-matrix.md](../product/feature-availability-matrix.md)
- [../operations/store-listing.md](../operations/store-listing.md)
- [../operations/store-submission.md](../operations/store-submission.md)
- [../architecture/manifest-and-permissions.md](../architecture/manifest-and-permissions.md)
- [../architecture/security-and-privacy.md](../architecture/security-and-privacy.md)
- [../architecture/storage-and-state.md](../architecture/storage-and-state.md)
- [../security/privacy-disclosure-notes.md](../security/privacy-disclosure-notes.md)
- [../../entrypoints/shared/settings-defaults.ts](../../entrypoints/shared/settings-defaults.ts)
- [../../entrypoints/shared/i18n/messages/en.ts](../../entrypoints/shared/i18n/messages/en.ts)
- [../../entrypoints/shared/summary-profiles.ts](../../entrypoints/shared/summary-profiles.ts)
- [../../entrypoints/content/overlay/capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)
- [../../entrypoints/content/platform-runtime.ts](../../entrypoints/content/platform-runtime.ts)
- [../../entrypoints/content/translation.ts](../../entrypoints/content/translation.ts)
- [../../entrypoints/background/translation.ts](../../entrypoints/background/translation.ts)
- [../../entrypoints/background/assistant.ts](../../entrypoints/background/assistant.ts)
- [../../entrypoints/shared/meeting-summary.ts](../../entrypoints/shared/meeting-summary.ts)
- [../../entrypoints/background/history-db.ts](../../entrypoints/background/history-db.ts)
- [../../entrypoints/background/data-transfer.ts](../../entrypoints/background/data-transfer.ts)
- [../../entrypoints/shared/app-data-backup.ts](../../entrypoints/shared/app-data-backup.ts)
- [../../wxt.config.ts](../../wxt.config.ts)

## External Policy Checkpoints Reviewed

These official sources were used only to validate policy-facing claims and priority:

- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Firefox Add-on Policies FAQ](https://extensionworkshop.com/documentation/publish/add-on-policies-faq/)
- [GDPR Article 13 official text](https://eur-lex.europa.eu/legal-content/EN/TXT/?qid=1594897545294&uri=CELEX%3A32016R0679)

## Executive Summary

The current repository is not in a catastrophic legal state, but it is not yet hardened for broad public release or low-friction enterprise adoption.

Important positives already present:

- `captureStartupBehavior` defaults to `ask`
- the product does not falsely claim that all meeting data always stays local
- the current repository does not appear to proxy meeting content through a CaptionArc-controlled backend
- OpenAI API keys are described and stored as device-local credentials
- cloud sync scope intentionally keeps API keys device-local
- retention guardrails exist for archived meeting history
- encrypted backup export exists

Main gaps that should be treated as active remediation items:

1. public privacy-policy and terms drafts now exist, but final publication metadata and legal placeholders still need completion
2. in-product disclosure and consent are fragmented and may not satisfy browser-store expectations
3. meeting chat remains a privacy-sensitive capture surface and needs strong disclosure even with a safer default
4. auto-start and automatic caption-enablement modes increase consent and policy risk
5. retention and deletion behavior exists in code but is not yet promoted into a formal user-facing commitment
6. the backup secret boundary is now fixed in code, but docs and UX must continue to preserve that boundary accurately
7. provider terms-of-use and browser-store policy compatibility do not appear to be formally reviewed or recorded
8. a role-mapping memo now exists, but formal legal validation and future-trigger governance still need completion

Important nuance from this review:

- a public privacy policy is a higher-priority release item than public terms of service
- public terms are still strongly recommended, but mainly for risk allocation, acceptable use, and user-responsibility language
- privacy copy should not imply that CaptionArc receives or stores all meeting content on its own servers if the current architecture does not actually do that

## Status Update After Initial Remediation

Since the initial assessment pass, the repository now includes:

- a published-ready [privacy-policy.md](./privacy-policy.md)
- a published-ready [terms-of-service.md](./terms-of-service.md)
- an internal [data-flow-and-legal-role-mapping-memo.md](./data-flow-and-legal-role-mapping-memo.md)
- a default-off `storeMeetingChat` posture
- a backup flow that excludes the OpenAI API key
- shared footer-based Privacy Policy access across extension pages
- dedicated internal Privacy Policy and Terms pages backed by the same markdown source as the repository docs
- a first-run Terms acceptance flow with versioned local acceptance storage and a dedicated acceptance page

Those changes materially improve the posture, but they do not eliminate the remaining work around provider-policy review and formal legal sign-off.

## Pragmatic Calibration

This assessment is intentionally not recommending every enterprise-grade legal artifact as a wave-one release blocker.

Based on the current repository evidence, the more urgent items are:

- accurate user-facing privacy disclosure
- clearer in-product consent and warning surfaces
- safer defaults and acknowledgments for higher-risk settings
- documented provider and store-policy posture
- accurate explanation of backup and sync boundaries

Items that are important but do not appear to be immediate blockers for the current self-serve, local-first architecture include:

- a full enterprise DPA package before there is an enterprise sales or managed-processing motion
- extensive data-subject-right workflows beyond a basic privacy contact path, unless the business starts storing or managing more meeting data directly
- expansive CCPA or GDPR operational machinery that assumes CaptionArc is already acting like a hosted SaaS processor for all meeting content

That said, these lower-priority items can become urgent quickly if the business later introduces:

- hosted inference or proxy APIs
- managed organization accounts
- support-side access to customer archives
- analytics over meeting-content payloads
- enterprise procurement or security reviews

## Assessment Scale

- `High`: likely to block safe public rollout, store review confidence, or privacy-compliance readiness
- `Medium`: meaningful compliance or trust risk that should be addressed before scale
- `Low`: not a release blocker by itself, but should be cleaned up for defensibility
- `Open question`: requires legal review or provider-policy review before closure

## Risk Register

### LCR-001: Public privacy policy and terms posture is published but still needs final rollout discipline and legal review

- Severity: `High`
- Category: `privacy`, `consumer disclosure`, `store readiness`

#### Current State

The repository now contains clearly named end-user legal documents and dedicated in-product pages that render the same markdown source, but final rollout discipline still matters.

Evidence:

- [privacy-policy.md](./privacy-policy.md)
- [terms-of-service.md](./terms-of-service.md)
- [privacy-disclosure-notes.md](./privacy-disclosure-notes.md)
- [security-and-privacy.md](../architecture/security-and-privacy.md)
- [README.md](../../README.md#L20)

Observed gaps:

- extension and store surfaces still need final release verification on every rollout
- the public policy set still needs final legal review before broad public reliance

#### Why This Matters

The product captures meeting-derived content, stores session history, can send caption and chat content to OpenAI, and can mirror archive data to cloud providers. That combination requires a user-facing privacy statement that explains data categories, purposes, recipients, storage, retention, deletion, sync behavior, and user choices in plain language.

The current review also found an important priority distinction:

- a public privacy policy is close to mandatory for release readiness and store defensibility
- public terms of service are strongly recommended, but they are not the same kind of requirement as a privacy policy

Chrome Web Store policy also links remote communication and user-data practices back to the extension's privacy policy and disclosed practices.

#### Recommended Remediation

Keep the published documents and internal legal pages aligned and release-ready:

- `Privacy Policy`
- `Terms of Service` or concise end-user use terms
- short-form `AI and external processing disclosure`

The privacy policy should be written carefully so it does not overstate first-party server-side collection if current meeting-content flows are direct from the extension to third-party services chosen by the user.

#### Task Breakdown

1. Confirm the published text matches the latest code behavior for:
   - local-first storage
   - OpenAI-backed optional features
   - cloud sync
   - backup/export behavior
   - chat-storage defaults and warnings
2. Add links to these documents from:
   - [README.md](../../README.md)
   - [store-listing.md](../operations/store-listing.md)
   - extension settings or first-run disclosure surfaces
3. Add a short AI/data-processing summary that is easy to read before setup.
4. Route the documents through legal review before broad public release.

#### Definition Of Done

- a clearly named public privacy policy exists under `docs/`
- a clearly named public terms or use-terms document exists under `docs/`
- repository entry surfaces link to both
- store submission copy references them
- policy text matches actual product behavior in code and docs

### LCR-002: In-product disclosure and consent are fragmented

- Severity: `High`
- Category: `consent`, `notice`, `privacy UX`, `store policy`

#### Current State

The product has disclosure fragments, but they are spread across different surfaces:

- a short startup prompt for capture
- settings-page descriptions for OpenAI, chat storage, cloud sync, and backup
- README and store draft copy

Evidence:

- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L1661-L1666)
- [capture-consent.ts](../../entrypoints/content/overlay/capture-consent.ts)
- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L136-L195)
- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L214-L234)
- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L586-L676)
- [README.md](../../README.md#L107-L115)

The startup capture prompt is especially narrow:

- title: `Enable capture for this meeting?`
- body: `If you skip this, capture stays off for this meeting visit.`

That text does not explain:

- that supported meeting chat may also be stored
- that local history retention follows from capture
- that some optional features transmit caption or chat data to OpenAI
- that optional cloud sync writes archive data outside the device

#### Why This Matters

The main issue is not just wording quality. It is that disclosure and consent are not yet tied cleanly to each optional data flow.

That matters because current platform guidance is stricter than a simple repository note or privacy-policy link:

- Chrome Web Store policy requires user-data practices to be disclosed prominently and tied to the actual practices performed by the extension
- Firefox policy requires explicit consent before collecting personally identifying information and is skeptical of passive or surprising data transmission

For this product, that means a reviewer should be able to see:

- what capture does by itself
- what AI features additionally do
- what cloud sync additionally does
- which of those flows are off by default versus user-enabled

#### Recommended Remediation

Introduce a simple disclosure model that maps each data flow to one deliberate user action:

1. capture and local archive
2. OpenAI-powered translation and assistant
3. summary generation
4. cloud sync
5. encrypted backup export

Each flow should have:

- a prominent explanation before first use
- an in-product control that clearly enables it
- user-facing copy that matches the public privacy policy and store listing

#### Task Breakdown

1. Replace the current capture-only startup wording with more accurate copy, or keep it short and add a first-run disclosure that covers capture scope and storage.
2. Add explicit pre-use disclosure for OpenAI-backed features.
3. Add explicit pre-use disclosure for cloud sync.
4. Add concise copy near `storeMeetingChat` and backup export.
5. Add a disclosure matrix to docs so reviewers and developers can verify which UI surface covers which processing step.

#### Definition Of Done

- each optional external data flow has a clear in-product disclosure
- disclosure is not dependent on users reading the README or a future privacy policy
- users can understand what is captured, where it goes, and what is optional
- text aligns across UI, README, store listing, and privacy policy

### LCR-003: Meeting chat storage remains privacy-sensitive and needs explicit opt-in-quality disclosure

- Severity: `High`
- Category: `privacy by default`, `data minimization`

#### Current State

Meeting chat storage now defaults to `false`.

Evidence:

- [settings-defaults.ts](../../entrypoints/shared/settings-defaults.ts#L57)
- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L214-L234)

The product also uses chat as part of saved session review, exports, and summary generation.

Evidence:

- [meeting-summary.ts](../../entrypoints/shared/meeting-summary.ts#L19-L20)
- [meeting-summary.ts](../../entrypoints/shared/meeting-summary.ts#L98)
- [feature-availability-matrix.md](../product/feature-availability-matrix.md#L18-L22)

#### Why This Matters

Meeting chat often contains more sensitive material than visible captions. Switching the default off materially improves the privacy-by-default posture, but it does not remove the need for strong disclosure and intentional opt-in semantics once a user enables the setting.

This is especially important because chat content can flow into downstream AI summarization and review surfaces once those features are enabled.

The default-off stance is easier to defend under privacy-by-default and data-minimization expectations than the prior default-on behavior, but users still need clear notice that enabling it expands what can be retained, exported, summarized, and potentially sent to external AI services when those features are used.

#### Recommended Remediation

Keep the privacy-protective default and reinforce it with stronger disclosure:

- keep `storeMeetingChat` defaulting to `false`
- keep explicit user opt-in before chat is stored
- add or maintain concise copy explaining that enabled chat can appear in history, exports, and summaries
- align privacy and store docs with the default-off position

#### Task Breakdown

1. Preserve the `default off` stance in code and tests.
2. Add or refine UI copy explaining that enabled chat appears in history, exports, and summaries.
3. Update privacy policy and store listing to reflect the default-off choice.
4. Verify future onboarding or warning UX does not accidentally imply that chat is captured by default.

#### Definition Of Done

- chat storage default is intentionally chosen and documented
- disclosure is prominent and understandable
- tests and docs match the chosen behavior

### LCR-004: Auto-start and automatic caption enablement increase consent and policy risk

- Severity: `Medium`
- Category: `consent`, `platform policy`, `user responsibility`

#### Current State

The product offers:

- `Ask every meeting`
- `Always start capture`
- `Automatic when possible` for caption activation

Evidence:

- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L152-L195)

The current defaults are still favorable:

- [settings-defaults.ts](../../entrypoints/shared/settings-defaults.ts#L51-L52)

#### Why This Matters

These modes can be useful, but they reduce friction around capture and may create risk in meetings where the user does not have a clear right to record, archive, or process meeting-derived content.

They also increase reviewer scrutiny because the extension automates activity on third-party meeting pages after the user joins.

This is primarily a policy and consent-allocation issue, not proof that the feature is forbidden. The problem is that the current repository does not yet pair these modes with strong enough warnings, justification, or provider-specific review notes.

#### Recommended Remediation

Keep the user-controlled options, but add stronger safeguards:

- warning copy before enabling `Always start capture`
- user acknowledgment that they are responsible for obtaining any required consent
- explicit copy before enabling `Automatic when possible`
- provider-policy review for any automation that turns captions on

#### Task Breakdown

1. Add an interstitial warning before enabling `Always start capture`.
2. Add a setting-level disclaimer that the user is responsible for lawful use.
3. Review provider-specific automation paths and document any provider differences.
4. Consider a stricter mode for organizational deployments.

#### Definition Of Done

- enabling high-risk automation modes requires an informed user action
- policy-sensitive behavior is documented
- product can explain why these modes are safe enough to keep

### LCR-005: Retention exists in code, but is not yet a formal user-facing commitment

- Severity: `Medium`
- Category: `retention`, `deletion`, `privacy policy`

#### Current State

The archive has retention guardrails in code:

- max archived sessions: `250`
- max archived session age: `180 days`

Evidence:

- [history-db.ts](../../entrypoints/background/history-db.ts#L16-L17)
- [storage-and-state.md](../architecture/storage-and-state.md#L25-L28)

The UI also explains archive deletion behavior.

Evidence:

- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L700-L758)

#### Why This Matters

Having retention only in code and internal docs is weaker than publishing it as part of the user-facing privacy statement. Users and reviewers should not need to infer deletion behavior from implementation details.

It is also important to distinguish:

- local deletion
- synced archive deletion
- backup files that the user may already have exported

#### Recommended Remediation

Publish a formal retention and deletion section in the privacy policy and relevant product docs, including:

- what is retained locally
- when archived sessions are pruned automatically
- how starred sessions are treated
- what happens during manual archive deletion
- what happens to synced copies
- what backup files are outside the scope of automatic deletion once exported

#### Task Breakdown

1. Add a retention section to the public privacy policy.
2. Add a user-facing summary in settings or archive docs.
3. Verify the docs mention both local deletion and synced deletion behavior.
4. Confirm test coverage or manual verification for retention-critical flows.

#### Definition Of Done

- retention behavior is described in user-facing policy text
- deletion and sync deletion are understandable to users
- docs and implementation agree on retention boundaries

### LCR-006: Backup secret boundary is fixed in code and now needs to stay consistent in docs and UX

- Severity: `Medium`
- Category: `secret handling`, `data export`, `user expectation`

#### Current State

Portable backup settings now exclude `openaiApiKey`.

Evidence:

- [data-transfer.ts](../../entrypoints/background/data-transfer.ts#L24-L40)
- [data-boundary-and-trust-model.md](../product/data-boundary-and-trust-model.md)

The backup file is encrypted, which is a meaningful control.

Evidence:

- [app-data-backup.ts](../../entrypoints/shared/app-data-backup.ts#L2-L3)
- [app-data-backup.ts](../../entrypoints/shared/app-data-backup.ts#L76-L101)

The recovery and policy copy now needs to stay aligned with the narrower export scope so later changes do not accidentally reintroduce secret portability or inaccurate wording.

Evidence:

- [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L686-L694)

#### Why This Matters

The repository is now aligned around a device-local secret posture. That boundary is worth preserving because it keeps backup files less sensitive than they would be if reusable credentials were exportable.

The remaining risk is mostly regression and copy drift rather than the original architectural problem.

#### Recommended Remediation

Keep the current device-local-secret posture as the documented and tested baseline.

#### Task Breakdown

1. Keep tests that ensure secrets are excluded from backup export.
2. Keep restore copy explicit that device-local secret setup must be re-entered.
3. Keep privacy and backup docs aligned with the device-local-secret posture.
4. Treat any future proposal to export secrets as a new legal and security review item.

#### Definition Of Done

- backup secret-handling behavior is intentional and documented
- users are not surprised by what the backup contains
- docs, code, and UI match the chosen stance

### LCR-007: Provider terms-of-use and browser-store policy compatibility remain open questions

- Severity: `Open question`
- Category: `third-party terms`, `platform review`, `distribution risk`

#### Current State

The extension requests host permissions for supported meeting providers and implements capture on those surfaces.

Evidence:

- [wxt.config.ts](../../wxt.config.ts#L37-L59)
- [manifest-and-permissions.md](../architecture/manifest-and-permissions.md)
- [feature-availability-matrix.md](../product/feature-availability-matrix.md#L12-L22)

The repository does not currently show a dedicated provider-policy review artifact confirming that:

- visible caption capture is allowed
- visible meeting chat capture is allowed
- automated caption-enablement behavior is acceptable
- store reviewers can be given a clear policy rationale if asked

#### Why This Matters

This may or may not be a blocker, but it should not remain implicit.

Products that capture meeting-derived content from third-party platforms are often judged on:

- privacy law posture
- browser-store policy posture
- underlying third-party platform terms and automation restrictions

The current assessment is intentionally conservative here: do not assume a behavior is acceptable simply because it is technically possible or currently implemented.

#### Recommended Remediation

Perform a structured provider-policy review for:

- Google Meet web
- Microsoft Teams web
- Zoom web app
- Chrome Web Store policies
- Firefox Add-ons policies

Record the outcome in an internal matrix or public-safe summary.

#### Task Breakdown

1. Create a provider-policy review checklist.
2. Review each supported provider against current feature behavior.
3. Record whether any feature requires:
   - copy changes
   - gating
   - disabling on specific providers
4. Create a browser-store submission checklist for sensitive permissions and capture behavior.

#### Definition Of Done

- each provider has a documented policy review outcome
- any needed gating or copy changes are implemented
- store submission material is prepared to answer review questions

### LCR-008: User responsibility and participant-consent allocation are not yet explicit enough

- Severity: `Medium`
- Category: `terms`, `consent allocation`, `acceptable use`

#### Current State

The product offers capture and archiving controls, but the repository does not yet expose a strong end-user statement clarifying that the user is responsible for using the extension only where they have the right to do so.

#### Why This Matters

For meeting tools, one of the most important risk reducers is a clear allocation of responsibility:

- the product should not imply that use of the extension automatically satisfies all recording, notice, employment-policy, or workplace-policy obligations
- the user should be told that they remain responsible for obtaining any required notice or consent

#### Recommended Remediation

Add explicit user-responsibility language in:

- Terms of Service or end-user use terms
- setup or onboarding guidance
- high-risk settings such as `Always start capture`

#### Task Breakdown

1. Add user-responsibility clauses to public terms.
2. Add concise warnings in high-risk settings.
3. Add a short lawful-use reminder in first-run copy.

#### Definition Of Done

- the product clearly states that lawful use responsibility remains with the user
- high-risk controls are not presented as frictionless defaults

### LCR-009: Business-side legal posture and role mapping is now documented, but still needs validation and maintenance

- Severity: `Medium`
- Category: `governance`, `privacy posture`, `B2B readiness`

#### Current State

The repository now includes a role-mapping memo that states the current working legal posture behind the technical data flows.

Evidence:

- [data-flow-and-legal-role-mapping-memo.md](./data-flow-and-legal-role-mapping-memo.md)
- [data-boundary-and-trust-model.md](../product/data-boundary-and-trust-model.md)
- [security-and-privacy.md](../architecture/security-and-privacy.md)
- [privacy-disclosure-notes.md](./privacy-disclosure-notes.md)

Remaining questions still require legal validation:

- whether CaptionArc currently acts only as software provider for client-side processing
- whether the business expects to be a controller, joint controller, processor, or some mix depending on deployment model
- which jurisdictions are being actively targeted for release readiness
- whether consumer use, workplace use, and enterprise use are being treated the same or differently
- whether a DPA, privacy contact workflow, or data-subject-rights intake path is needed for the intended business model

#### Why This Matters

Without role mapping, public legal documents are easy to get wrong.

The current repository suggests a narrower first-party processing posture than many SaaS products because:

- OpenAI calls appear direct from the extension using the user's API key
- cloud continuity appears to use the user's own Google or Microsoft account
- no CaptionArc-hosted transcript-processing backend is evident

That reduces some risk, but it does not eliminate the need to document:

- recipients and transfer conditions
- what the business actually sees or does not see
- what happens when users contact the business with privacy requests
- how the posture changes if the product later moves to managed infrastructure or team deployments

#### Recommended Remediation

Use the current memo as the baseline, then validate and operationalize it.

#### Task Breakdown

1. Review the memo with counsel or the business owner acting as release authority.
2. Confirm targeted jurisdictions and privacy-contact workflow.
3. Keep trigger events current if architecture or business model changes.
4. Continue using the memo as the input for privacy, terms, and store-copy revisions.

#### Definition Of Done

- an internal legal posture memo exists
- public-facing policy drafts are based on that memo
- the repository can explain how legal posture would change if the business model changes
- a future architecture change would trigger memo review rather than silent drift

### LCR-010: Open-source, SDK, and third-party API terms inventory is not yet formalized

- Severity: `Low`
- Category: `licensing`, `third-party terms`, `distribution hygiene`

#### Current State

The repository clearly depends on third-party packages, SDKs, browser APIs, and external service APIs, but the legal/compliance assessment does not yet record a formal inventory for:

- open-source license obligations
- attribution or notice requirements
- third-party API terms that may matter for distribution or marketing claims
- restrictions around branding or naming when referencing external providers

Evidence:

- [../../package.json](../../package.json)
- [../../pnpm-lock.yaml](../../pnpm-lock.yaml)
- [../../wxt.config.ts](../../wxt.config.ts)

#### Why This Matters

This is not the highest-risk issue for the current product, but it is an avoidable release-hygiene gap.

For this extension, the practical concern is less about exotic copyleft analysis and more about having a defendable inventory that answers:

- what core dependencies are in the shipped extension
- which licenses apply
- whether any notice file should be included in release artifacts or docs
- whether use of OpenAI, Google, Microsoft, and meeting-provider names in copy stays inside acceptable descriptive use

#### Recommended Remediation

Create a lightweight dependency and external-terms review, not a heavyweight legal package.

#### Task Breakdown

1. Generate a current dependency inventory from `package.json` and lockfile.
2. Record the primary licenses of shipped dependencies.
3. Confirm whether a `THIRD_PARTY_NOTICES` document is needed for release artifacts or repository docs.
4. Record the external API and platform terms that should be reviewed alongside store submission.

#### Definition Of Done

- a lightweight dependency and third-party-terms inventory exists
- release docs can answer basic license and attribution questions
- no avoidable ambiguity remains around external provider naming and terms review

### LCR-011: B2B legal and security package should be staged, not guessed

- Severity: `Open question`
- Category: `B2B`, `DPA`, `security posture`, `commercial readiness`

#### Current State

The repository does not show evidence of an enterprise contract package or DPA workflow, and the current architecture suggests the product is still better described as local-first client software than as a fully managed meeting-data processor.

#### Why This Matters

This should not automatically be treated as a release blocker for a self-serve product. But it becomes a blocker if the business wants to:

- sell to organizations
- answer procurement questionnaires
- sign DPAs
- represent itself as an enterprise-ready processor of meeting content

The key risk is not the absence of a DPA today. The key risk is pretending one is or is not needed without first anchoring that answer to the actual business model.

#### Recommended Remediation

Stage this work pragmatically:

- do not block core self-serve hardening on a full enterprise package
- do create a short trigger-based checklist that states when a DPA, security addendum, or enterprise terms become necessary

#### Task Breakdown

1. Add B2B trigger conditions to the internal legal posture memo.
2. Define the threshold for when enterprise legal documents become required.
3. If enterprise distribution is near-term, prepare a minimal DPA/security-readiness issue list instead of drafting generic boilerplate now.

#### Definition Of Done

- the repository distinguishes self-serve release readiness from enterprise-readiness work
- DPA and enterprise-document needs are tied to explicit business triggers
- legal work is staged pragmatically instead of overbuilt early

## Lower-Risk Positives To Preserve

These are not remediation items, but they should be preserved:

1. `captureStartupBehavior` defaults to `ask`.
   - Evidence: [settings-defaults.ts](../../entrypoints/shared/settings-defaults.ts#L51)
2. The product already discloses that caption and chat content can go to OpenAI when the relevant features are used.
   - Evidence: [README.md](../../README.md#L111)
   - Evidence: [store-listing.md](../operations/store-listing.md#L30-L33)
3. The current repository does not appear to route meeting content through a CaptionArc-controlled backend.
   - Evidence: [background/translation.ts](../../entrypoints/background/translation.ts)
   - Evidence: [background/assistant.ts](../../entrypoints/background/assistant.ts)
4. Cloud sync scope intentionally keeps API keys device-local.
   - Evidence: [en.ts](../../entrypoints/shared/i18n/messages/en.ts#L652-L676)
5. Retention guardrails exist in code.
   - Evidence: [history-db.ts](../../entrypoints/background/history-db.ts#L16-L17)
6. Encrypted backup export exists.
   - Evidence: [app-data-backup.ts](../../entrypoints/shared/app-data-backup.ts#L2-L3)

## Suggested Remediation Order

Recommended order if the goal is public-release hardening:

1. keep the factual data-flow and legal-posture memo current
2. design and finish the in-product disclosure and consent model for each data flow
3. publish the privacy policy and short AI/external-processing disclosure with final legal metadata
4. complete Chrome, Firefox, and provider-policy review
5. publish end-user terms and any enterprise-facing legal addenda that the chosen business model requires
6. operationalize privacy-contact, store-linking, and release-checklist steps

This order is intentionally different from a docs-first workflow. Public legal text should follow the role mapping and disclosure model, not guess them.

## Task Creation Guidance

For issue tracking, split work into these streams:

- `Legal posture`: role mapping memo, target jurisdictions, DPA trigger conditions, privacy contact process
- `Product UX`: first-run disclosure, flow-specific consent, high-risk warnings, chat opt-in
- `Docs`: privacy policy, end-user terms, AI disclosure, store listing alignment, setup copy, third-party notices if needed
- `Engineering`: defaults, backup secret behavior, feature gating, tests
- `Policy review`: Chrome Web Store, Firefox Add-ons, Google Meet, Teams Web, Zoom Web policy review notes

## Practical Starting Point

If only one remediation wave can start now, start with this package:

1. finalize the disclosure matrix for capture, OpenAI, cloud sync, and backup
2. replace placeholders and publish the privacy policy and terms drafts
3. link those documents from release-facing surfaces and store materials
4. complete the remaining provider and browser-policy review notes

Those four steps will turn the current drafting work into a release-usable legal baseline.
