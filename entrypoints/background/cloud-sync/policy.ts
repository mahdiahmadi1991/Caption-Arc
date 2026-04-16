import type { MeetingSession } from "../../shared/meeting-session";

const ACTIVE_SESSION_SYNC_DELAY_MS = 15_000;
const ACTIVE_SESSION_LARGE_SYNC_DELAY_MS = 30_000;
const ACTIVE_SESSION_HUGE_SYNC_DELAY_MS = 60_000;
const SETTLED_SESSION_SYNC_DELAY_MS = 2_000;
const LARGE_SESSION_EVENT_COUNT = 100;
const HUGE_SESSION_EVENT_COUNT = 400;
const FOLLOW_UP_MIN_DELAY_MS = 1_500;
const FOLLOW_UP_MAX_DELAY_MS = 8_000;
const RECONCILIATION_DELAY_MS = 10 * 60_000;
const RECONCILIATION_DEFERRAL_MIN_DELAY_MS = 90_000;
const RECONCILIATION_DEFERRAL_MAX_DELAY_MS = 10 * 60_000;
const TASKS_PER_PROVIDER_PER_CYCLE = 4;
const TASKS_PER_CYCLE_MIN = 4;
const TASKS_PER_CYCLE_MAX = 12;

export function isSessionActivelyChanging(
  session: Pick<MeetingSession, "endTime" | "lifecycleState">
): boolean {
  return session.lifecycleState === "live" || !session.endTime;
}

export function getMeetingSessionSyncDelayMs(
  session: Pick<MeetingSession, "endTime" | "events" | "lifecycleState">
): number {
  if (!isSessionActivelyChanging(session)) {
    return SETTLED_SESSION_SYNC_DELAY_MS;
  }

  const eventCount = Array.isArray(session.events) ? session.events.length : 0;
  if (eventCount >= HUGE_SESSION_EVENT_COUNT) {
    return ACTIVE_SESSION_HUGE_SYNC_DELAY_MS;
  }

  if (eventCount >= LARGE_SESSION_EVENT_COUNT) {
    return ACTIVE_SESSION_LARGE_SYNC_DELAY_MS;
  }

  return ACTIVE_SESSION_SYNC_DELAY_MS;
}

export function getCloudSyncReconciliationDelayMs(): number {
  return RECONCILIATION_DELAY_MS;
}

export function getCloudSyncFollowUpDelayMs(
  dueTaskCount: number,
  connectedProviderCount: number
): number {
  const providerBudget = Math.max(1, connectedProviderCount);
  const queuePressure = Math.max(0, dueTaskCount - providerBudget);
  const pacedDelay =
    FOLLOW_UP_MIN_DELAY_MS +
    Math.min(
      FOLLOW_UP_MAX_DELAY_MS - FOLLOW_UP_MIN_DELAY_MS,
      queuePressure * 250
    );

  return Math.max(
    FOLLOW_UP_MIN_DELAY_MS,
    Math.min(FOLLOW_UP_MAX_DELAY_MS, pacedDelay)
  );
}

export function getCloudSyncCycleTaskLimit(
  connectedProviderCount: number
): number {
  return Math.max(
    TASKS_PER_CYCLE_MIN,
    Math.min(
      TASKS_PER_CYCLE_MAX,
      Math.max(1, connectedProviderCount) * TASKS_PER_PROVIDER_PER_CYCLE
    )
  );
}

export function shouldDeferCloudSyncReconciliation(
  dueNonReconcileTaskCount: number,
  connectedProviderCount: number
): boolean {
  const backlogThreshold = Math.max(3, Math.max(1, connectedProviderCount) * 3);
  return dueNonReconcileTaskCount >= backlogThreshold;
}

export function getCloudSyncReconciliationDeferralMs(
  dueNonReconcileTaskCount: number,
  connectedProviderCount: number
): number {
  const backlogThreshold = Math.max(3, Math.max(1, connectedProviderCount) * 3);
  const queuePressure = Math.max(0, dueNonReconcileTaskCount - backlogThreshold);
  const pacedDelay =
    RECONCILIATION_DEFERRAL_MIN_DELAY_MS +
    Math.min(
      RECONCILIATION_DEFERRAL_MAX_DELAY_MS - RECONCILIATION_DEFERRAL_MIN_DELAY_MS,
      queuePressure * 15_000
    );

  return Math.max(
    RECONCILIATION_DEFERRAL_MIN_DELAY_MS,
    Math.min(RECONCILIATION_DEFERRAL_MAX_DELAY_MS, pacedDelay)
  );
}
