# Monetization Readiness Checklist

This document is the canonical ordered checklist for turning CaptionArc into a paid product without discovering critical prerequisites too late.

It covers both non-technical and technical workstreams.
Expand or reorder this checklist only when a decision changes scope or invalidates an assumption.

## How To Use This Checklist

- work from top to bottom
- do not start implementation milestones that depend on unresolved upstream decisions
- convert major open questions into explicit decisions
- update the linked execution plan as decisions become final

Related execution plan:

- [../contributing/execution-plans/active/2026-04-14-monetization-readiness-foundation.md](../contributing/execution-plans/active/2026-04-14-monetization-readiness-foundation.md)

## Working Decisions Snapshot

These are the currently selected working decisions and should be treated as provisional until the related plan milestones are closed.

- initial monetization model: `freemium + pro monthly/yearly`
- initial customer motion: `B2C`
- preferred product story: preserve the local-first trust model as much as possible
- brand direction under evaluation: `AlynGo` as umbrella brand, with seller/legal-entity details still unresolved
- selected repository license direction: `AGPL-3.0-or-later` for the public core, with monetized value enforced through service-side entitlements and brand/trademark control
- recommended initial billing direction: `Merchant of Record`
- website support surface: accepted as required, but planned for a separate thread

Important licensing note:

- the repository license is now intended to be `AGPL-3.0-or-later` going forward
- if prior public snapshots were already visible under `MIT`, recipients of those snapshots generally keep those granted rights for those snapshots
- `AGPL-3.0-or-later` does not make client-side code private and should not be treated as the monetization moat

## Phase 0 - Ground Rules Before Monetization

- [x] Confirm the business model goal for the first paid release.
  Current decision:
  - `freemium + subscription`
  Options to choose from:
  - `freemium + subscription`
  - `one-time paid license`
  - `team / B2B plan`
- [x] Decide whether CaptionArc will remain:
  Current direction:
  - public core under `AGPL-3.0-or-later`
  - monetized value enforced through hosted billing, entitlement, and service-side controls
  - fully open source
  - open core with paid hosted services
  - source-available with a non-open commercial license
  - mixed model with separate private premium components
- [ ] Decide what exactly customers will pay for.
  Examples:
  - premium AI workflows
  - cloud sync convenience
  - team controls
  - hosted API access
  - support and admin features
- [x] Define who the first paying customer is.
  Current decision:
  - `B2C / individual users`
  Options:
  - solo professionals
  - power users
  - small teams
  - organizations

## Phase 1 - Public Repository And IP Decision

- [x] Review the current repository licensing position.
  Current repo evidence:
  - `package.json` declares `AGPL-3.0-or-later`
  - `LICENSE` contains the GNU Affero General Public License, version 3 text
  Impact:
  - `AGPL-3.0-or-later` is stronger copyleft than `MIT` and is a better fit for a public monetized core than a permissive license.
- [x] Decide whether the current `MIT` license is still acceptable for a paid strategy.
  Current decision:
  - `MIT` is not acceptable for the chosen direction, and the repository should use `AGPL-3.0-or-later` going forward.
- [x] If `MIT` is not acceptable, define the target licensing model before monetization implementation starts.
  Selected direction:
  - `AGPL-3.0-or-later` for the public extension core
  Rationale:
  - stronger copyleft than `MIT`
  - better deterrence against closed-source commercial forks than permissive licensing
  - still compatible with selling hosted services, subscriptions, support, and brand trust
  Caveat:
  - this does not make client-side code secret
  - this does not protect the brand name or logo
- [ ] Decide what must be protected as the monetization moat.
  Usually protect:
  - server-side entitlement logic
  - paid-only APIs
  - anti-abuse controls
  - premium prompts/configuration only if they materially matter
  Usually do not rely on protecting:
  - client-side extension code alone
- [ ] Define trademark and brand-control posture separately from code license.
  Important distinction:
  - code license controls software reuse rights
  - trademark and brand policy control name, logo, and brand presentation
  Working recommendation:
  - if CaptionArc moves under `AlynGo`, keep brand usage under explicit control even if code remains public
- [ ] Decide whether to add an explicit trademark notice for `CaptionArc` and `AlynGo` before the first public production release.
- [ ] Decide whether the repo needs a contributor/IP policy before accepting outside contributions.
  Examples:
  - no external contributions
  - Developer Certificate of Origin
  - contributor license agreement

## Phase 2 - Offer Design

- [ ] Define the free tier.
- [ ] Define the paid tier or tiers.
- [ ] Decide which features must remain free for adoption and store conversion.
- [ ] Decide which features are expensive enough to require server-side enforcement.
- [ ] Decide pricing shape.
  Examples:
  - monthly
  - yearly
  - lifetime
  - per-seat
  - usage-based add-on
- [ ] Decide trial strategy.
  Examples:
  - no trial
  - 7-day trial
  - limited free quota
  - feature-limited free plan
- [ ] Define refund expectations and upgrade/downgrade rules.

## Phase 3 - Legal And Business Setup

- [ ] Confirm the legal selling entity.
  Questions to resolve:
  - who is the seller
  - which country governs billing
  - which tax obligations apply
  Current guidance:
  - you can market the product under `AlynGo` before incorporation
  - but checkout, invoices, tax handling, and legal terms should identify the real seller clearly until a company exists
- [x] Decide whether to use a direct payment processor or a Merchant of Record.
  Current decision:
  - start with a `Merchant of Record`
  Rationale from current answers:
  - easiest and fastest legal/payment path is preferred
  - `B2C` audience is global
  - no registered company is in place yet
  - tax/compliance operations are not something you want to own in phase one
  - payment acceptance risk and jurisdiction complexity matter more than raw billing control
  Comparison direction:
  - direct processor like `Stripe`: more control, more tax/compliance responsibility
  - Merchant of Record like `Paddle` or `Lemon Squeezy`: easier operations, less control
- [ ] Choose the initial Merchant of Record provider.
  Current shortlist:
  - `Paddle`
  - `Lemon Squeezy`
- [ ] Determine whether a business registration, VAT registration, or local tax setup is required before accepting payments.
- [ ] Prepare or update customer-facing legal docs for a paid offer.
  Minimum set:
  - Privacy Policy
  - Terms of Service
  - refund/cancellation policy
  - pricing and plan disclosures
  - support contact path
- [ ] Review whether the existing terms need paid-product clauses.
  Current repo evidence:
  - `docs/security/terms-of-service.md` already exists
  - `docs/security/privacy-policy.md` already exists
  Likely future additions:
  - subscription billing terms
  - renewal and cancellation terms
  - refund language
  - team/admin responsibility terms if B2B is added
- [ ] Confirm export-control, sanctions, consumer-protection, and regional restrictions only if they apply to the selling entity and target markets.
- [ ] Decide whether the first paid launch should avoid specific countries or regions if payment, sanctions, or support risk is too high.

## Phase 4 - Store Policy And Product Boundary Check

- [ ] Verify that the paid model does not violate Chrome Web Store or Firefox Add-ons policies.
- [ ] Keep payment collection outside the extension UI unless store policy explicitly allows the intended flow.
- [ ] Ensure any paid gating is clearly disclosed in store listing and in-product messaging.
- [ ] Ensure no monetization plan depends on selling browsing data, ad injection, or affiliate-tag injection.
- [ ] Re-check permissions and data collection against least-privilege and disclosure requirements before launch.

## Phase 5 - Billing, Identity, And Entitlement Architecture

- [ ] Decide whether paid access is account-based, device-based, or workspace-based.
  Recommended default:
  - account-based entitlement
- [x] Accept that a minimal account system and website support surface are required for subscriptions.
  Current direction:
  - keep meeting data local-first
  - allow website/backend only for billing, account recovery, legal pages, and entitlement
- [ ] Define the canonical identity provider for paid users.
  Examples:
  - email magic link
  - Google sign-in
  - passwordless auth
- [ ] Define the entitlement states the product will support.
  Minimum examples:
  - free
  - trial
  - paid active
  - grace period
  - canceled / expired
  - admin-blocked
- [ ] Decide the source of truth for license state.
  Recommended default:
  - server-side entitlement database
- [ ] Define how the extension checks access.
  Typical flow:
  - sign in
  - fetch entitlement from backend
  - cache minimally
  - revalidate on meaningful events
- [ ] Define cancellation, failed payment, refund, chargeback, and reactivation behavior before implementation.

## Phase 6 - Security Requirements For A Paid Product

- [ ] Keep raw card handling out of CaptionArc systems.
- [ ] Use hosted checkout and provider webhooks instead of building custom payment forms.
- [ ] Verify webhook signatures server-side.
- [ ] Enforce premium access on the server for any premium feature with real cost or abuse risk.
- [ ] Do not trust extension-local flags as the only premium check.
- [ ] Keep secrets out of the client bundle and out of repository history.
- [ ] Define key rotation and incident response steps for billing/auth secrets.
- [ ] Add abuse controls.
  Examples:
  - rate limits
  - retry limits
  - suspicious activation review
  - device/session anomaly review
- [ ] Decide what billing/security events must be logged.
  Minimum examples:
  - checkout completed
  - subscription changed
  - entitlement granted/revoked
  - webhook verification failed
- [ ] Ensure logs do not capture secrets, payment details, or other unnecessary sensitive data.

## Phase 7 - Technical Delivery Plan

- [ ] Decide whether monetization requires a new backend service.
  For most secure paid models, the answer is `yes`.
  Current guidance:
  - a pure local-only paid model without any website or backend is possible but weak for subscription enforcement, cancellation handling, recovery, and anti-abuse
  - if you want `monthly/yearly` plans, a minimal backend is the safer default
- [ ] Plan the supporting website in a separate execution thread.
  Minimum future scope:
  - pricing page
  - legal pages
  - checkout handoff
  - account recovery / manage subscription entry point
  - support contact path
- [ ] Define the minimum backend surface.
  Usually:
  - authentication
  - billing webhook handler
  - entitlement API
  - customer portal redirect
- [ ] Define data model needs.
  Usually:
  - customer
  - subscription
  - entitlement
  - audit events
  - plan catalog
- [ ] Decide where premium logic lives.
  Recommended split:
  - extension: UX, sign-in state, feature gating UI
  - backend: truth and enforcement
- [ ] Define migration path from current local-first architecture to any account-linked paid features.
- [ ] Define failure behavior when the backend is unavailable.
  Examples:
  - temporary grace period
  - read-only mode
  - disable premium actions only

## Phase 8 - Customer Operations

- [ ] Define support workflow for billing issues.
- [ ] Define refund handling workflow.
- [ ] Define account recovery flow.
- [ ] Define entitlement dispute workflow.
- [ ] Define incident response workflow for billing/auth outages.
- [ ] Define what metrics matter after launch.
  Examples:
  - install to signup conversion
  - signup to paid conversion
  - churn
  - refund rate
  - support burden

## Phase 9 - Launch Readiness

- [ ] Finalize public pricing page and plan descriptions.
- [ ] Finalize legal pages and support contact paths.
- [ ] Finalize store listing copy for paid gating disclosures.
- [ ] Test upgrade, downgrade, cancel, refund, and expired-access scenarios end to end.
- [ ] Test abusive and invalid states.
  Examples:
  - replayed webhook
  - forged entitlement token
  - expired session
  - revoked subscription
- [ ] Prepare release communications and customer FAQ.
- [ ] Define the first post-launch review date and success criteria.

## Current High-Priority Unknowns

These decisions should be resolved before any billing implementation starts:

- [x] whether CaptionArc stays `MIT`
- [x] when to switch future releases away from `MIT`
- [ ] whether paid value comes from extension features, hosted services, or both
- [x] whether the first offer is `B2C`, `B2B`, or hybrid
- [x] whether billing uses `Stripe` or a `Merchant of Record`
- [x] whether paid users need a full account system
- [ ] whether `AlynGo` is only a brand layer or the future formal seller entity

## Practical Guidance For This Repository Right Now

- A public repository is not automatically a problem for monetization.
- A public repository plus an `MIT` license is a poor fit if the business depends on keeping client-side code exclusive.
- `AGPL-3.0-or-later` is a better fit than `MIT` if you want a public repo, community-visible source, and stronger resistance to proprietary forks.
- For the current answers and constraints, `Merchant of Record` is a better starting point than direct `Stripe`.
- For this repo, the safest default monetization path is usually:
  - keep the extension installable
  - keep some value free
  - move paid enforcement to a backend service
  - treat billing, entitlement, and abuse protection as server responsibilities
- If the monetization moat is only in the extension bundle, expect copying and bypass attempts.
- If the monetization moat is in a service the extension talks to, a public repo is much less dangerous.
