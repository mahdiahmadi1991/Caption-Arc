# Assistant Runtime Code-Derived Behavior Contract

## Purpose

This document captures how the content assistant surface resolves session state, polls background state, and exposes enablement and unread transitions.

It is a characterization artifact derived from implementation code, not a requirement specification.

Background assistant generation behavior is documented separately in [assistant-generation-behavior-contract.md](./assistant-generation-behavior-contract.md).

## Source Files

- [../../entrypoints/content/assistant-service.ts](../../entrypoints/content/assistant-service.ts)

## Rule ID Convention

- Contract rule IDs: `C-ASRT-<NNN>`
- Traceability case IDs: `ASRT-<NNN>`

## Contract Rules

## C-ASRT-001: Assistant profile and enablement resolve from the active session first and settings second

Source: `getResolvedMeetingProfile`, `getResolvedAssistantEnabled` in [../../entrypoints/content/assistant-service.ts](../../entrypoints/content/assistant-service.ts)

Rules:

1. Session-specific `meetingProfileId` overrides the global default meeting profile when it exists.
2. When no matching session or default profile exists, the first configured meeting profile becomes the fallback.
3. Session artifact state overrides profile default assistant enablement when `artifacts.assistantState.enabled` is explicitly boolean.
4. When no session override exists, assistant enablement falls back to the resolved profile's `assistant.enabledByDefault` setting.

## C-ASRT-002: Applying assistant session state sorts outputs and derives live state deterministically

Source: `getAssistantOutputs`, `getAssistantPendingOutputs`, `applyAssistantSession` in [../../entrypoints/content/assistant-service.ts](../../entrypoints/content/assistant-service.ts)

Rules:

1. Assistant outputs are sorted by ascending `createdAt`.
2. Pending outputs are sorted by ascending `queuedAt`.
3. Assistant surface visibility is driven by the resolved profile's `assistant.enabledByDefault`, not by live output presence.
4. Live state resolves to `suppressed` when assistant enablement is off.
5. Live state resolves to `error` when OpenAI availability is not operational or the live-state response reports `error`.
6. Live state resolves to `triggered` or `streaming` only when the live-state response reports those statuses.
7. When no active streaming state exists, completed outputs promote the state to `done`; otherwise the fallback state is `watching`.

## C-ASRT-003: Unread state changes only when the surface is closed and content or state actually advances

Source: `applyAssistantSession`, `clearAssistantUnreadState` in [../../entrypoints/content/assistant-service.ts](../../entrypoints/content/assistant-service.ts)

Rules:

1. Unread state is evaluated only when the assistant surface is currently closed.
2. New unread state is raised when output count increases, pending count increases, or live state changes.
3. Unread count increments only by the number of newly added outputs.
4. Clearing unread state resets both the unread flag and unread count.
5. Session updates always emit `captionarc:assistant-live-updated` after state application.

## C-ASRT-004: Assistant sync polls background session and live-state endpoints on a fixed interval

Source: `pollAssistantState`, `startAssistantSync`, `stopAssistantSync` in [../../entrypoints/content/assistant-service.ts](../../entrypoints/content/assistant-service.ts)

Rules:

1. Polling is skipped when no current session ID exists and clears live assistant session state.
2. Each poll concurrently requests `getMeetingSession` and `getMeetingAssistantLiveState` from background messaging.
3. Missing or failed session responses clear live assistant session state instead of throwing.
4. `startAssistantSync()` performs an immediate poll and then repeats every `1200` ms.
5. `stopAssistantSync()` clears the active interval without otherwise mutating assistant session state.

## C-ASRT-005: Toggling and settings-only sync block on OpenAI availability before enabling assistant behavior

Source: `toggleAssistantSessionEnabled`, `syncAssistantAvailabilityFromSettingsOnly` in [../../entrypoints/content/assistant-service.ts](../../entrypoints/content/assistant-service.ts)

Rules:

1. Enabling the assistant is blocked when OpenAI availability is not operational.
2. A blocked enable attempt clears pending outputs, sets live state to `error`, emits an update event, and returns `false`.
3. Successful toggles persist through `setCurrentSessionAssistantEnabled(enabled)` before local state settles.
4. Disabling the assistant clears pending outputs, unread state, and unread count.
5. Settings-only sync defers to session polling when a current session exists.
6. Without a current session, settings-only sync derives visibility and default live state solely from the default meeting profile and current OpenAI availability.

## Test Traceability

- [../quality/references/assistant-runtime-traceability-matrix.md](../quality/references/assistant-runtime-traceability-matrix.md)

Each rule maps to one or more traceability cases with explicit `implemented` or `planned` status.

## Change Control

If assistant polling, enablement resolution, unread behavior, or event emission changes in code, update this contract and its traceability matrix in the same change set.
