import type { TranslationStatus } from "./constants";
import type { Settings as BackgroundSettings } from "../background/types";
export type {
  MeetingAssistantOutput,
  MeetingAssistantPendingOutput,
  MeetingAssistantState,
  MeetingEventDraft,
  MeetingEventMetaValue,
  MeetingEventSource,
  MeetingSessionArtifacts,
  MeetingSessionDerivedData,
  MeetingPlatform,
  MeetingSession,
  MeetingSessionIdentifiers,
  SessionLifecycleState,
  SavedCaption,
  SavedChatMessage,
  SavedMeetingEvent,
} from "../shared/meeting-session";
export type { MeetingProfile } from "../background/types";

export type Caption = {
  id: number;
  eventId?: string;
  providerEventId?: string;
  speaker: string;
  text: string;
  formattedHtml?: string;
  time: string;
  timestamp: number;
  translation: string;
  translationStatus: TranslationStatus;
  translationError?: string;
  lastTranslatedLength: number;
  userEdited?: boolean;
  isFinalized?: boolean;
  source?: "caption" | "chat";
  own?: boolean;
  messageId?: string;
  metadata?: Record<string, MeetingEventMetaValue>;
  historyTimestamp?: number;
  sessionOffsetMs?: number;
};

export type Settings = BackgroundSettings;

export type TranslateResponse = {
  success: boolean;
  translation?: string;
  error?: string;
};
