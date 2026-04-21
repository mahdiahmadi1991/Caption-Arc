# Settings Page Design And Development Governance

## Purpose

This document defines the mandatory design and implementation rules for the CaptionArc settings page.

It exists to prevent the settings experience from drifting into a fragmented collection of unrelated screens, card patterns, and interaction models as the product grows.

This document is not a loose style guide.

It is a binding implementation contract for future settings work.

Any AI model, human contributor, or follow-up implementation plan that changes the settings page must follow the rules in this document unless the repository owner explicitly overrides them.

## Relationship To Other Governance

This document extends, but does not replace:

- [project-working-agreement.md](../project-working-agreement.md)

When settings-specific rules and generic repository rules overlap, both must be satisfied.

## Product Goal

The settings page must feel like a compact, high-confidence product console.

It must not feel like:

- a marketing page
- an editorial dashboard
- a documentation page with controls appended afterward
- a collection of unrelated mini-products built at different times

The intended UX outcome is:

- fast scanning
- low cognitive load
- strong architectural clarity
- high density without feeling cramped
- consistent visual grammar across all sections
- zero ambiguity about what belongs to the current module, the current profile, or the whole product

## Locked Default Direction

Unless the repository owner explicitly changes the direction later, the settings page must move toward the following defaults:

1. The page uses a compact left navigation rail plus one main content column.
2. A persistent right-side inspector rail is not the default architecture.
3. Section-level summaries and status should be contextual, not permanently pinned in a separate always-visible rail.
4. The page should prefer grouped setting rows inside section surfaces over one large card per individual control.
5. Long paragraphs of explainer copy are not the default; short, local hints are.
6. Profiles should use an in-page master-detail editing model, not a long stacked list of expanded editors.
7. Cloud Sync should read like an operational console, not a narrative card deck.
8. Recovery should read like a clear danger and continuity zone, not a general-purpose informational section.

## Non-Negotiable Rules

### 1. One Settings Product, Not Several

All settings sections must feel like they belong to one product family.

Required behavior:

- reuse one container grammar for peer sections
- reuse one field-row grammar for peer controls
- reuse one hint, badge, and status language across sections
- avoid section-specific visual systems unless the section has a truly different job

Forbidden outcomes:

- summary settings looking like one product and assistant settings looking like another
- cloud-sync cards using a different chrome language from workspace or profiles without a functional reason
- recovery controls inheriting generic informational cards when danger semantics are needed

### 2. Optimize For Setting, Not For Reading

The settings page exists primarily for configuration.

Required behavior:

- every major section may have one short intro paragraph
- additional explanation should live near the control it explains
- supporting information should be collapsed into hints, notes, or contextual status blocks

Forbidden outcomes:

- repeating the same concept in long intros and again below the control
- making the user scroll through explanation-heavy cards before reaching an obvious setting
- treating every section like a mini landing page

### 3. Compactness Is A Product Requirement

Vertical sprawl is a product defect unless it is justified by content complexity.

Required behavior:

- use dense grouping for related settings
- stack related small controls in shared surfaces
- reserve large cards for truly complex objects such as editable prompts, sync diagnostics, or profile editors

Forbidden outcomes:

- one large surface for every dropdown
- one large surface for every toggle
- repeating oversized padding, oversized radius, and oversized empty space on basic controls

### 4. Architectural Boundaries Must Be Visible

The page must expose the real domain model of the product.

Required behavior:

- global product settings must look global
- fixed AI-service setup must look like a fixed product dependency, not a chooser
- profile identity fields must look shared
- summary controls must look summary-specific
- assistant controls must look assistant-specific
- sync and recovery must read like operational domains, not generic settings

Forbidden outcomes:

- blending shared profile definition with module-specific behavior into one ambiguous block
- scattering one domain's controls across several visually unrelated sections
- hiding important domain boundaries behind cosmetic grouping alone

### 5. Preserve Existing Functionality

The redesign must not change product behavior unless the owner explicitly asks for that change.

Required behavior:

- keep existing storage keys unless migration is explicitly scoped
- keep existing business rules unless changed in writing
- keep existing actions reachable
- keep current diagnostics, verification, import/export, and sync functionality intact

Forbidden outcomes:

- visual redesign that silently removes configuration power
- architecture changes that discard current status visibility
- layout changes that force data-model changes without approval

## Page Architecture Rules

### 1. Preferred Page Shell

The preferred shell is:

- top utility header
- compact left settings navigation rail
- one main content column

The utility header may contain:

- page title
- concise page subtitle
- high-value global actions such as history access
- save state or readiness chips if truly helpful

The utility header must not become a second dashboard.

### 2. Left Navigation Rail

The left rail is allowed and useful, but must stay compact.

Required behavior:

- use short section names
- use lightweight subtitles only if they add real orientation value
- keep active-state contrast strong
- avoid oversized cards for every nav item

The rail is for orientation, not storytelling.

### 3. Main Content Column

The center column carries the actual settings workflow.

Required behavior:

- sections must be grouped by domain
- sections should be readable in scan order without a second inspector rail
- each section must carry its own essential status when needed

### 4. Right Rail

A persistent right rail is not the default and must be treated as an exception.

A right rail is only allowed if all of the following are true:

- it provides unique value not already visible in context
- it materially accelerates a task
- it does not consume more attention than the main form
- it does not repeat information that can be summarized more locally

If these conditions are not met, the rail must be removed or demoted into contextual blocks inside the main content.

## Section Design Rules

### 1. Section Anatomy

Every major section should follow this hierarchy:

1. small eyebrow or domain label
2. section title
3. one concise description
4. grouped controls
5. optional contextual status or advanced detail block

Sections must not repeat this hierarchy inside every child control card.

### 2. Setting Group Grammar

Inside a section, the default pattern is not `control per large card`.

The default pattern is:

- one group surface
- multiple field rows or compact sub-groups inside it

Use a dedicated surface per control only when at least one is true:

- the control has complex helper content
- the control contains diagnostics, status, or multi-line interaction
- the control is dangerous
- the control owns secondary actions

### 3. Field Row Grammar

The preferred field-row structure is:

- label
- short hint
- optional performance/status badge
- control
- optional local footnote

On desktop, fields may use a two-column layout when it improves density.

On narrower widths, fields must stack cleanly.

### 4. Typography Rules

Settings typography must prioritize quick scan and value recognition.

Required behavior:

- labels must be short and direct
- helper copy must stay one to two sentences at most
- uppercase eyebrows should stay reserved for section/domain markers, not routine labels
- key values and current choices must be easy to compare

Forbidden outcomes:

- using long prose where a hint would do
- repeating domain context inside every label
- overusing uppercase treatment until everything competes visually

## Control Rules

### Tooltip Rule

When settings UI needs a tooltip, it must use the project's shared tooltip implementation.

Required behavior:

- do not fall back to native browser `title` tooltips for product UI
- keep tooltip styling and motion in the same family as the rest of the product
- add a short intentional reveal delay so a tooltip does not flash when the pointer merely passes across a control

Forbidden outcomes:

- instant hover-triggered tooltip noise on dense settings screens
- settings-specific tooltip styling that drifts away from the shared project tooltip language
- mixing native browser tooltips and custom product tooltips in the same workflow

### 1. Toggle Rows

Toggles should live in compact, clearly scoped rows.

Required behavior:

- the toggle label must state what the switch controls now
- helper text must state the consequence of turning it off or on
- related dependent fields should stay visible but disabled when discoverability matters

### 2. Select Rows

Dropdowns must show the selected value clearly and should surface meaningful tradeoffs.

Required behavior:

- label direct performance or workload extremes
- keep selected badges concise
- avoid decorating low-value options

### 3. Text Areas

Large text inputs are allowed only where the job is genuinely long-form.

Required behavior:

- prompts and instruction editors should get the space they need
- their surrounding chrome should still match the same product family
- hints and character counts must stay secondary

### 4. Status Blocks

Status blocks must be contextual and local.

Required behavior:

- place AI service readiness near OpenAI setup
- place sync health near sync operations
- place danger and recovery explanations near recovery actions

Forbidden outcomes:

- global status panels that repeat half the page
- a permanent inspector repeating values the user can already see in context

## Domain-Specific Rules

### 1. Workspace

Workspace must become a compact experience preferences section.

Required behavior:

- group appearance and in-meeting UI behavior into a coherent console
- present overlay startup, caption activation, visibility, opacity, and click-through as related controls
- show essential consequences locally

Workspace must not read like a long explanation of the overlay.

### 2. AI Service And Setup

OpenAI setup must feel like one coherent fixed-service workflow.

Required behavior:

- OpenAI service framing and OpenAI validation should feel sequential
- model selection, API key, verification, and service-specific notes should appear in one coherent area
- translation tuning should stay nearby because it depends on the OpenAI path

### 3. Translation

Translation tuning must stay lean and practical.

Required behavior:

- guidance cards should be concise
- avoid large decorative advice blocks when short principles and direct input afford the same value

### 4. Profiles

Profiles are the most complex settings domain and must use a dedicated editor model.

Required behavior:

- use a master-detail structure
- the list of profiles should stay separate from the active editor
- the active editor must expose:
  - profile identity
  - summary
  - live assistant

Profile cards in the list should summarize:

- name
- protected or custom state
- primary/default state
- assistant enabled state when relevant

The editor should not require the user to scroll through several expanded profiles to reach one field.

### 5. Cloud Sync

Cloud Sync must read like an operational surface.

Required behavior:

- overview metrics should be concise
- provider connection blocks must maintain layout integrity on narrow widths
- actions such as connect, reconnect, retry, and disconnect must stay close to the relevant provider
- error details should not destroy the grid or card proportions

Forbidden outcomes:

- narrow provider cards that collapse into unreadable text columns
- status copy that wraps vertically because the layout refuses to reflow

### 6. Recovery

Recovery must be explicit, serious, and compact.

Required behavior:

- continuity options and destructive actions must be visually separated
- fallback archive behavior should be easy to understand without long narrative sections
- danger actions must not be styled like neutral informational cards

## Responsiveness Rules

### 1. No Broken Narrow Cards

A responsive layout is not acceptable if content technically fits but becomes unreadable.

Required behavior:

- provider and sync cards must reflow into fewer columns before text breaks unnaturally
- long account names, error codes, and timestamps must stay legible
- list/detail layouts must degrade intentionally on smaller widths

### 2. Rail Behavior

If the viewport becomes too narrow:

- the left rail may collapse or become lighter
- the main content must remain the priority
- no secondary rail should force the content column into awkward narrowness

## Copy Rules

### 1. Write For Current Meaning

Labels must describe the real current behavior.

Example principle:

- do not say `Enable by default` if the real behavior is `Use with this profile`

### 2. Explain Consequences, Not Implementation Trivia

Helper text should tell the user what changes if they use the setting.

Avoid:

- vague implementation language
- redundant restatements of the label
- product-internal jargon where a direct user-facing explanation is enough

### 3. Keep Section Copy In Sync With Live UI

If in-product surfaces evolve, settings copy must evolve with them.

The settings page must not describe old UI models after the live product has moved on.

## Visual Quality Rules

### 1. Density Without Crampedness

The settings page should become more compact, but not crowded.

Required behavior:

- reduce redundant empty space first
- keep one strong spacing rhythm
- avoid stacking multiple heavy containers where one would do

### 2. Restraint Over Ornament

This page should feel premium through proportion and clarity, not through decorative chrome.

Required behavior:

- use soft surfaces and strong hierarchy
- avoid multiplying accent backgrounds
- keep status pills meaningful

### 3. Consistent Shape Language

Radius, border, and shadow must feel like one family across settings.

Peer surfaces must not oscillate between:

- flat panels
- oversized blobs
- unrelated micro-card patterns

## Anti-Patterns

The following are explicitly disallowed unless the repository owner approves them:

- a persistent right rail that repeats `Current Setup`, readiness, or product scope information already visible in context
- one oversized card per trivial setting
- long explanatory paragraphs above routine controls
- stacked expanded profile editors in one long scroll column
- narrow operational cards that break text or actions
- inconsistent section grammar between summary and assistant settings
- hiding disabled-but-important module settings when read-only visibility would better preserve understanding
- redesigns that require schema migrations without a separate approved scope

## Required Review Checklist

Any meaningful settings-page change should be reviewed against these questions:

1. Did this change make the page denser and clearer, or just different?
2. Did this change reduce or increase cognitive branching?
3. Does the new section still look like the same product family?
4. Did any control gain a full card without actually needing one?
5. Did any explanation become longer than the setting deserves?
6. Is the architectural boundary visible between global settings, OpenAI setup, profiles, sync, and recovery?
7. Does the layout still hold on narrower widths?
8. Did any behavior or setting disappear even though the redesign was supposed to preserve functionality?

## Implementation Mandate

Future settings-page implementation work must treat this document as the primary design and development contract for:

- layout architecture
- control grouping
- information hierarchy
- responsive behavior
- domain separation
- density and scan efficiency

When a contributor needs to depart from this document, they must first record that departure in a plan or approved governance update instead of silently improvising a parallel pattern.
