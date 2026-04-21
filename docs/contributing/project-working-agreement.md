# Project Working Agreement

## Purpose

This document captures repository-level working rules that should survive context loss across long design and implementation sessions.

It is intentionally short and should be updated only when a rule is broad enough to apply beyond one isolated feature.

## Rules

### 1. Do Not Guess Through Product Ambiguity

If a product, business, UX, data-model, or rollout rule is ambiguous, do not silently assume the answer.

Required behavior:

- identify the ambiguity explicitly
- ask the repository owner direct questions
- wait for clarification before locking architecture or implementation decisions

This rule is mandatory for the whole project.

### 2. Keep The In-Repo Plan Synced

For large code/behavior features or long-running implementation discussions, confirmed product decisions must be written into an in-repo planning document as the conversation evolves.

The goal is to reduce context-loss risk and keep implementation aligned with the latest confirmed business direction.

Required behavior:

- do not leave the execution plan only in chat
- create or update a dedicated in-repo plan file in `docs/contributing/execution-plans/active/` before implementation proceeds on plan-required code/behavior work
- follow the plan standard in [execution-plans.md](./execution-plans.md)
- do not require a plan for every docs-only edit by default; follow the docs-only policy in [execution-plans.md](./execution-plans.md)
- write plans at full implementation quality, with enough detail to guide a later pass without relying on chat history
- when the repository owner asks for a plan, the source of truth must be the plan file, not a transient chat summary

### 3. Protect Existing Stable Modules

When introducing a new capability, do not weaken an existing stable module unless the repository owner explicitly approves that change.

New architecture should prefer extension and isolation over incidental regression.

### 4. Persist Cross-Cutting Design Culture Rules

If the repository owner states a UI, UX, or design-culture rule that is broad enough to affect more than one screen or module, record it in this document without waiting for a reminder.

Required behavior:

- treat these rules as repository-level design governance
- update this document during the same fixing or implementation flow
- apply the rule to future modules unless the repository owner explicitly narrows it

Current design governance rule added from assistant validation:

- overlay behavior and assistant-surface behavior are independent; compacting, hiding, or otherwise changing the overlay must not implicitly change the assistant surface
- global meeting-surface settings such as opacity must be enforced consistently across every in-meeting UI surface, including overlay, assistant, and related prompts; shared settings should not diverge per surface unless explicitly designed that way
- when a new in-meeting surface needs an empty state or footer, reuse the established product grammar from existing meeting surfaces before inventing a parallel pattern; shared structural motifs should stay recognizably in-family
- host surfaces must remain the clipping and motion context for their children; inner layouts should not appear to float independently or outrun the host silhouette during collapse, resize, or reveal transitions
- when independent floating surfaces overlap, focus order should follow direct user interaction; the surface the user clicks should come to the front unless a tighter product rule explicitly overrides that behavior
- when the overlay is in compact or minimized form, it should remain topmost over the assistant surface
- protruding controls such as the assistant top-dock should read as structural parts of their host surface, not as detached widgets layered on top
- when a surface includes a protrusion, dock, lip, or extension, the silhouette, material, border, and shadow must be continuous across the whole shape; avoid fake appendages that look pasted onto the host surface
- large floating surfaces must reserve most of their visual weight for real content, not for decorative plates, empty slabs, or oversized chrome; controls should occupy the minimum area needed to stay legible and usable
- new compact floating controls should inherit the visual grammar of the product's existing compact surfaces before introducing a new control language; prefer shared spacing, silhouette rhythm, and control proportions over one-off styling
- when designing compact floating pills or compact control clusters, prefer a nested `outer shell / inner capsule` structure with restrained chrome and clear left-to-right hierarchy instead of a single flat strip
- when the host silhouette already provides the outer shell, internal pockets or docks must not introduce a second visible shell layer; the visible result should resolve to the host form plus one contained capsule, not stacked chrome
- in compact branded status surfaces, let the central copy carry the primary weight; branding, state, and unread signals should support orientation without becoming separate competing focal points
- when showing background processing or live generation in an in-meeting surface, prefer local motion and micro-state signals over recoloring the whole surface; processing feedback should stay in-family with the current theme instead of tinting the main material away from the product palette
- when a floating surface uses a non-rectangular or visibly clipped silhouette, transparent regions outside the visible shape must stay click-through; do not leave rectangular wrapper hit-areas blocking underlying UI
- when a floating surface uses one stateful affordance for open, close, or resize transitions, avoid leaving overlapping click targets around it; the control should own the interaction contract clearly and exclusively
- when the product already has an established affordance language for resize or compact controls, reuse that same visual language in new surfaces instead of inventing a parallel control treatment
- when one control shifts between related states such as expand, resize, and collapse, all states should stay in the same affordance family; vary only the glyph, not the underlying control language
- for collapsible floating surfaces, minimum-size resize interactions should prefer an elastic snap zone over a hard stop; allow the user to drag past the settled minimum and decide on release whether the surface snaps back or collapses
- when a floating surface exposes a bounded resize range between canonical resting sizes such as minimum and maximum, release behavior should snap to those anchors instead of persisting arbitrary in-between heights unless the product explicitly needs freeform sizing
- when a floating surface auto-snaps to a canonical size after release, the snap should animate smoothly; automatic size resolution should not visually jump unless reduced motion is in effect
- when a floating surface is being shrunk toward collapse, inner content should slide or clip out of the host surface cleanly rather than visibly compressing or breaking its layout inside the remaining silhouette
- for collapse zones below a surface's settled minimum size, prefer anchoring the canonical inner layout to the host and letting the host clip it, rather than translating an effectively separate "page" layer that appears to float independently inside the surface
- when a surface snaps back from an elastic sub-minimum zone to its settled minimum size, keep the soft range alive until the snap animation completes; do not re-clamp to the settled minimum before the transition has visibly finished
- when a visual experiment does not produce a clear improvement or is not actually visible in the shipped UI, revert it instead of leaving speculative styling behind; avoid slow design drift from stacked no-op tweaks
- when adding a new in-meeting header or header-like bar, reuse the product's existing header grammar for brand treatment, title hierarchy, and control styling before introducing a parallel header language
- when an in-meeting surface appears for the first time on page load, avoid intermediate accidental states or partial flashes; either paint it directly in its settled state or give it a deliberate entry transition from off-screen
- deliberate entry transitions must be one-shot; intermediate sync or layout passes should not reset and replay the same mount animation while the first run is still in flight
- before a floating surface runs its first deliberate entry transition, keep it visually hidden until its layout variables and silhouette geometry are fully primed; never let an unprimed version flash on screen first
- when a floating surface relies on inline hiding during mount, do not clear that inline visibility before the entry state itself is ready to paint; release the hidden state only from the controlled entry sequence, not from an earlier layout sync
- when a deliberate entry motion has a distinct off-screen start state, drive that start transform from the controlled mount sequence itself rather than relying on a default resting transform plus a later selector flip; the first visible paint must already be the intended entry start state
- global in-meeting visibility settings such as `Live visibility` must apply consistently across all live meeting surfaces, not only the main overlay; auxiliary live surfaces should respect the same global hide/show preference while remaining behaviorally independent from overlay-specific interactions
- global in-meeting interaction settings such as `Click-through mode` must also apply consistently across all live meeting surfaces; if a surface stays visible in click-through mode, every interactive affordance on that surface should become pass-through instead of inventing a separate assistant-only contract
- when a settings choice directly changes response speed, AI workload, or runtime frequency, label the best and worst tradeoff options explicitly in the UI so the user can predict performance impact before choosing
- within one settings workflow, sibling sections with equivalent weight such as summary and assistant configuration should reuse the same container grammar and field hierarchy; do not let them look like two unrelated sub-products
- when a profile model mixes shared identity fields with module-specific configuration, expose that architecture explicitly in the UI; separate profile-defining fields from per-module controls instead of blending them into one ambiguous settings block
- when a module inside a profile can be turned off entirely, prefer leaving its settings visible but read-only over hiding them completely; preserve discoverability and saved intent without making the layout jump or implying the settings were lost
- when the settings page is redesigned or expanded, treat it as one compact product console rather than a set of editorial mini-pages; prefer grouped setting rows, contextual status, and a single dominant content column over repeated oversized control cards and permanently pinned summary rails
- settings-page work must follow the dedicated governance document in [settings-page-design-development.md](./coding-conventions/settings-page-design-development.md) unless the repository owner explicitly overrides it
- settings wording must match the real business semantics and scope of each control; avoid labels or descriptions that imply hidden modes, separate flows, or narrower scope than the underlying behavior actually has
- product wording must stay natural, professional, and user-facing; do not mirror the repository owner's raw phrasing when it would sound literal, over-explained, or unnatural to a non-technical user
- the AI service architecture is now OpenAI-only; future code and settings work must not reintroduce AI-provider choice, provider-branching UI, or dormant Anthropic/Ollama paths unless the repository owner explicitly reopens multi-provider support
- when one shared dependency powers several product capabilities, expose that dependency as its own settings domain instead of hiding it inside one consumer module; translation, summaries, and assistant settings should read as consumers of the shared AI service, not as the service owner
- when a shared dependency such as OpenAI is unhealthy, prefer one clear global alert area for the primary message and lighter local indicators in affected sections; avoid repeating full warning blocks with near-duplicate copy across the same screen
- when a shared dependency such as OpenAI becomes unavailable during a meeting, all affected live surfaces must follow one consistent degraded-state contract: disable dependent controls, show one clear local explanation at the point of failure, and use subtle footer or compact-surface indicators instead of inventing separate warning languages per surface
- OpenAI readiness must be driven by the real operational contract, not only by manual verification in Settings; missing credentials, changed credentials that are no longer trusted, and runtime request failures must all degrade the same shared availability state
- for in-meeting UI, treat every non-ready shared-AI state as unavailable from the user's point of view; missing setup, stale verification after autosaved changes, and confirmed service errors should all degrade to one clear "AI needs attention" contract instead of exposing backend nuance in each live surface
- in settings design, keep UI presentation controls separate from meeting-flow rules and archive or data-retention policy; do not mix visual behavior, runtime workflow, and business data choices into one ambiguous settings block
- when the product uses toggle switches across multiple surfaces such as the full settings page and quick access, keep them in one shared visual family; do not let separate switch treatments drift into parallel designs
- if a control is primarily a quick-access runtime affordance rather than a durable product preference, do not duplicate it in the full settings page unless the page is the only clear place to configure its initial behavior
- when the product needs a tooltip anywhere in the UI, use the project's own tooltip system instead of native browser tooltips or ad-hoc one-off implementations; tooltip treatment must stay in one shared family across settings, history, popup, overlay, and assistant surfaces
- tooltip reveal must not trigger instantly on incidental pointer pass-through; use an intentional short delay before showing it so casual cursor movement does not create noisy visual flicker
- when the product binds a business choice to a durable record at creation time, later downstream actions must not rewrite that binding silently; derive later artifacts from the bound record, and if alternative outputs are needed later, represent them as separate provenance-bearing artifacts or versions instead of mutating the original record identity

### 5. Hold New UI Work To The Existing Product Quality Bar

New UI work must not regress below the visual and interaction quality already established elsewhere in the product.

Required behavior:

- match or exceed the strongest existing UI quality already present in the repository
- do not stop at functional correctness when a surface is visibly under-designed
- refine hierarchy, spacing, motion, and material treatment until the result looks intentional and product-grade
- treat "same design family" as a quality bar, not only a token reuse exercise

### 6. Use The Standard CDP Runtime Workflow For Runtime-Sensitive Validation

When a task affects in-meeting runtime behavior, provider activation, overlay state transitions, or extension lifecycle logic, validation must use the standardized WSL/Windows Chrome CDP workflow.

Required behavior:

- follow the onboarding guide in [agent-onboarding-cdp-runtime.md](../quality/references/agent-onboarding-cdp-runtime.md)
- reload the debug runtime before each smoke validation pass (`pnpm chrome:debug:reload`)
- run runtime checks before and after implementation for runtime-sensitive tasks
- avoid hardcoded Meet smoke URLs; use runtime-resolved URL flow (`pnpm chrome:meet:url` or `pnpm chrome:smoke:meet`)
- do not constrain runtime smoke to Google only; include Teams and Zoom where shared runtime/provider behavior can be affected
- report validation mode (`WSL direct` or `Windows-only`) in implementation summaries
- do not skip this workflow unless the repository owner explicitly waives it

## Current Applicability

These rules are currently especially relevant to:

- `docs/archive/feature-plans/historical-initiatives-summary.md`
- `docs/contributing/coding-conventions/settings-page-design-development.md`
- `docs/archive/feature-plans/historical-initiatives-summary.md`
