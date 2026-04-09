import type { SharedSettings } from "../types";
import type { MeetingSession, SavedMeetingEvent } from "../../shared/meeting-session";
import { normalizeMeetingSession } from "../../shared/meeting-session";

function sortEvents(events: SavedMeetingEvent[]): SavedMeetingEvent[] {
  return [...events].sort((left, right) => left.timestamp - right.timestamp);
}

export function mergeSharedSettings(
  base: SharedSettings,
  incoming: SharedSettings
): SharedSettings {
  const mergedProfiles = new Map(
    base.summaryProfiles.map((profile) => [
      profile.id,
      { ...profile, assistant: { ...profile.assistant } },
    ] as const)
  );

  incoming.summaryProfiles.forEach((profile) => {
    mergedProfiles.set(profile.id, {
      ...profile,
      assistant: { ...profile.assistant },
    });
  });

  const next: SharedSettings = {
    ...base,
    ...incoming,
    summaryProfiles: [...mergedProfiles.values()],
  };

  if (
    !next.summaryProfiles.some(
      (profile) => profile.id === next.defaultSummaryProfileId
    )
  ) {
    next.defaultSummaryProfileId = next.summaryProfiles[0]?.id || "";
  }

  return next;
}

export function mergeMeetingSessionEvents(
  leftEvents: SavedMeetingEvent[],
  rightEvents: SavedMeetingEvent[]
): SavedMeetingEvent[] {
  const eventMap = new Map<string, SavedMeetingEvent>();

  [...leftEvents, ...rightEvents].forEach((event) => {
    const eventKey = event.stableEventKey || event.eventId;
    const existing = eventMap.get(eventKey);

    if (!existing) {
      eventMap.set(eventKey, { ...event });
      return;
    }

    const existingUpdatedAt = existing.updatedAt || 0;
    const incomingUpdatedAt = event.updatedAt || 0;
    eventMap.set(
      eventKey,
      incomingUpdatedAt >= existingUpdatedAt ? { ...event } : existing
    );
  });

  return sortEvents([...eventMap.values()]);
}

export function mergeMeetingSessions(
  base: MeetingSession,
  incoming: MeetingSession
): MeetingSession {
  const left = normalizeMeetingSession(base);
  const right = normalizeMeetingSession(incoming);
  const mergedEvents = mergeMeetingSessionEvents(left.events || [], right.events || []);

  return normalizeMeetingSession({
    ...left,
    ...right,
    id: left.id,
    sessionSyncId: left.sessionSyncId || right.sessionSyncId || left.id,
    title:
      (right.updatedAt || 0) >= (left.updatedAt || 0)
        ? right.title || left.title
        : left.title || right.title,
    starred:
      (right.updatedAt || 0) >= (left.updatedAt || 0)
        ? Boolean(right.starred)
        : Boolean(left.starred),
    endTime: Math.max(left.endTime || 0, right.endTime || 0) || undefined,
    lastSeenAt: Math.max(left.lastSeenAt || 0, right.lastSeenAt || 0) || undefined,
    updatedAt: Math.max(left.updatedAt || 0, right.updatedAt || 0) || undefined,
    rejoinHistory: Array.from(
      new Map(
        [...(left.rejoinHistory || []), ...(right.rejoinHistory || [])].map(
          (entry) => [
            `${entry.previousEndTime}:${entry.resumedAt}`,
            { ...entry },
          ]
        )
      ).values()
    ).sort((a, b) => a.resumedAt - b.resumedAt),
    lifecycleState:
      left.lifecycleState === "ended" || right.lifecycleState === "ended"
        ? "ended"
        : right.lifecycleState || left.lifecycleState,
    summaries: {
      ...(left.summaries || {}),
      ...(right.summaries || {}),
    },
    artifacts: {
      ...(left.artifacts || {}),
      ...(right.artifacts || {}),
      summaries: {
        ...(left.artifacts?.summaries || {}),
        ...(right.artifacts?.summaries || {}),
      },
      assistantOutputs: {
        ...(left.artifacts?.assistantOutputs || {}),
        ...(right.artifacts?.assistantOutputs || {}),
      },
      assistantMemory:
        (right.artifacts?.assistantMemory?.updatedAt || 0) >=
        (left.artifacts?.assistantMemory?.updatedAt || 0)
          ? right.artifacts?.assistantMemory || left.artifacts?.assistantMemory
          : left.artifacts?.assistantMemory || right.artifacts?.assistantMemory,
      assistantState:
        (right.artifacts?.assistantState?.updatedAt || 0) >=
        (left.artifacts?.assistantState?.updatedAt || 0)
          ? right.artifacts?.assistantState || left.artifacts?.assistantState
          : left.artifacts?.assistantState || right.artifacts?.assistantState,
    },
    events: mergedEvents,
  });
}
