import type { MeetingPlatform } from "./meeting-session";

export const QUICK_ACCESS_RUNTIME_STATUS_STORAGE_KEY =
  "quickAccessRuntimeStatus";

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
