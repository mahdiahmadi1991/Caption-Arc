import type { MeetingPlatform } from "./meeting-session";

export const QUICK_ACCESS_RUNTIME_STATUS_STORAGE_KEY =
  "quickAccessRuntimeStatus";
export const REQUEST_QUICK_ACCESS_SOFT_REFRESH_ACTION =
  "requestQuickAccessSoftRefresh";
export const QUICK_ACCESS_SOFT_REFRESH_RUNTIME_ACTION =
  "softRefreshQuickAccessArtifacts";

export type QuickAccessMeetingPresence =
  | "unknown"
  | "prejoin"
  | "joined"
  | "ended";

export type QuickAccessRuntimeStatus = {
  platform: MeetingPlatform | null;
  meetingPresence: QuickAccessMeetingPresence;
  hasActiveMeetingSession: boolean;
  updatedAt: number;
};
