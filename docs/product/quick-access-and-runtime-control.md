# Quick Access And Runtime Control

This document describes the business role of popup quick access and runtime control surfaces.

## Capability Purpose

Quick access gives users a fast control surface for in-meeting state checks and critical toggles without opening the full settings page.

Primary user outcomes:

- confirm whether meeting runtime is active
- quickly show or hide live overlay behavior
- trigger a guarded recovery refresh for extension-owned meeting artifacts
- understand startup behavior and setup readiness
- jump to full settings when deeper changes are needed

## Core Behavior Contract

Quick access runtime behavior is based on live status snapshots sent from content runtime to background and read by popup.

Primary references:

- `entrypoints/content/platform-runtime.ts`
- `entrypoints/background/quick-access-runtime.ts`
- `entrypoints/shared/quick-access-status.ts`
- `entrypoints/popup/App.tsx`

## Runtime Status Semantics

Runtime status includes:

- provider platform (`google-meet`, `microsoft-teams`, `zoom-web`, or `null`)
- meeting presence (`unknown`, `prejoin`, `joined`, `ended`)
- active session state (`hasActiveMeetingSession`)
- update timestamp

The background quick-access registry prunes stale entries and prioritizes the most relevant active status.

## User-Controlled Quick Actions

Quick access currently supports:

- opening full options/settings
- toggling overlay visibility
- soft-refreshing extension-owned artifacts in the active meeting tab while preserving same-session continuity rules
- reading capture startup behavior state (`off`, `ask`, `always`)
- reading setup readiness and dependency state

The recovery refresh action is intentionally narrower than a browser reload or full runtime teardown:

- it targets CaptionArc-owned injected artifacts only
- it does not reset provider-owned tab state
- it rebuilds runtime surfaces and then lets lifecycle synchronization reconcile against the current live meeting/session state
- it should feel smooth in the popup and in-meeting UI, in the same quality family as the quick-access visibility toggle

## Business Boundaries

- quick access is a fast operational surface, not a full configuration workspace
- durable advanced settings remain in options pages
- quick access relies on current runtime messages and can appear inactive outside supported meeting contexts
- recovery refresh is a protected operational tool, not a hard reset or provider-page reload

## Availability

Quick access runtime control is available on both governed browser targets where popup and runtime messaging are available.

## Update Rule

If quick-access status semantics, controls, or runtime prioritization change, update this document and `docs/product/business-capability-map.md` in the same change.
