import type { ThemePreference } from "../../shared/theme";
import type { UiLanguageSetting } from "../../shared/i18n";
import type { TermsAcceptance, TermsDecline } from "../../shared/legal";
import type {
  SummaryGenerationMode,
  SummaryJobStatus,
} from "../../shared/summary-generation";
import type { MeetingPlatform } from "../../shared/meeting-session";
import type {
  AssistantDeliveryBias,
  AssistantParticipantScope,
  AssistantProfileConfig,
  AssistantResponseDepth,
  AssistantResponseFormat,
  AssistantResponseIntent,
  AssistantResponseTone,
  AssistantTriggerPolicy,
  MeetingProfileShape,
} from "../../shared/meeting-profiles";

export type {
  MeetingAssistantMemorySnapshot,
  MeetingAssistantPendingOutput,
  MeetingAssistantOutput,
  MeetingAssistantState,
  MeetingSessionExtractionCoverage,
  MeetingSessionExtractionIntegrity,
  MeetingSessionExtractionReport,
  MeetingSessionRejoin,
  MeetingEventSource,
  MeetingSessionArtifacts,
  MeetingSessionDerivedData,
  MeetingPlatform,
  MeetingSummary,
  MeetingSession,
  MeetingSessionIdentifiers,
  SessionLifecycleState,
  SavedCaption,
  SavedChatMessage,
  SavedMeetingEvent,
  StoredMeetingSession,
} from "../../shared/meeting-session";
export type { ThemePreference } from "../../shared/theme";
export type {
  AssistantDeliveryBias,
  AssistantParticipantScope,
  AssistantProfileConfig,
  AssistantResponseDepth,
  AssistantResponseFormat,
  AssistantResponseIntent,
  AssistantResponseTone,
  AssistantTriggerPolicy,
} from "../../shared/meeting-profiles";

export const CLOUD_SYNC_PROVIDERS = {
  googleDrive: "google-drive",
  oneDrive: "onedrive",
} as const;

export type CloudSyncProvider =
  (typeof CLOUD_SYNC_PROVIDERS)[keyof typeof CLOUD_SYNC_PROVIDERS];

export type VerificationSnapshot = {
  status: "verified" | "error";
  message: string;
  signature: string;
  verifiedAt: number;
};

export type OverlayPositionPreference = {
  left: number;
  top: number;
  width?: number;
  height?: number;
  view?: "expanded" | "minimized";
};

export type OverlayPositionsByPlatform = Partial<
  Record<MeetingPlatform, OverlayPositionPreference>
>;

export type CaptureStartupBehavior = "off" | "ask" | "always";
export type CaptionActivationBehavior = "guided" | "automatic";
export type LegalRiskAcknowledgementKey =
  | "storeMeetingChat"
  | "captureStartupAlways"
  | "captionActivationAutomatic";
export type LegalRiskAcknowledgements = Partial<
  Record<LegalRiskAcknowledgementKey, number>
>;
export type { SummaryGenerationMode } from "../../shared/summary-generation";
export type { SummaryJobStatus } from "../../shared/summary-generation";
export type MeetingProfile = MeetingProfileShape;

export type SharedSettings = {
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  customPrompt: string;
  meetingOutputLanguage: string;
  meetingArchiveRetentionDays: number;
  meetingProfiles: MeetingProfile[];
  defaultMeetingProfileId: string;
  appearance: ThemePreference;
  overlayVisible: boolean;
  captureStartupBehavior: CaptureStartupBehavior;
  captionActivationBehavior: CaptionActivationBehavior;
  sessionContinuationWindowMinutes: number;
  overlayOpacity: number;
  overlayClickThrough: boolean;
  storeMeetingChat: boolean;
  legalRiskAcknowledgements: LegalRiskAcknowledgements;
};

export type LocalDeviceSecrets = {
  openaiApiKey: string;
};

export type LocalDeviceSettings = {
  deviceId: string;
  deviceLabel: string;
  uiLanguage: UiLanguageSetting;
  connectedCloudProviders: CloudSyncProvider[];
  overlayPositionsByPlatform: OverlayPositionsByPlatform;
  verificationSnapshot: VerificationSnapshot | null;
  termsAcceptance: TermsAcceptance | null;
  termsDecline: TermsDecline | null;
};

export type Settings = SharedSettings & LocalDeviceSecrets & LocalDeviceSettings;

export type SettingsState = {
  schemaVersion: 1;
  shared: SharedSettings;
  secrets: LocalDeviceSecrets;
  local: LocalDeviceSettings;
};

export type PortableSettings = Omit<
  Settings,
  | "deviceId"
  | "deviceLabel"
  | "uiLanguage"
  | "connectedCloudProviders"
  | "overlayPositionsByPlatform"
  | "verificationSnapshot"
  | "termsAcceptance"
  | "termsDecline"
  | "openaiApiKey"
>;

export type PortableMeetingSession = Omit<
  StoredMeetingSession,
  "captions" | "chatMessages" | "searchableText" | "derived" | "summaries"
>;

export type TranslateRequest = {
  id: number | string;
  text: string;
  targetLang: string;
  mode: "optimistic" | "semantic";
  force?: boolean;
  context?: string;
  speaker?: string;
  customPrompt?: string;
};

export type TranslateResponse = {
  success: boolean;
  id?: number | string;
  translation?: string;
  mode?: string;
  error?: string;
};

export type TranslateSessionCaptionRequest = {
  sessionId: string;
  captionTimestamp: number;
  targetLanguage?: string;
  source?: "caption" | "chat";
};

export type TranslateSessionCaptionResponse = {
  success: boolean;
  session?: MeetingSession;
  translation?: string;
  error?: string;
};

export type TranslateSessionCaptionsRequest = {
  sessionId: string;
  targetLanguage: string;
};

export type TranslateSessionCaptionsResponse = {
  success: boolean;
  session?: MeetingSession;
  translatedCount?: number;
  skippedCount?: number;
  error?: string;
};

export type ResolveMeetingSessionRequest = {
  platform: MeetingPlatform;
  providerLabel: string;
  sourceUrl: string;
  title?: string;
  identifiers: MeetingSessionIdentifiers;
  meetingProfileId?: string;
  reusePolicy?: "default" | "force-new" | "force-reuse";
  resumeSessionId?: string;
};

export type FindMeetingSessionContinuationCandidateRequest = Pick<
  ResolveMeetingSessionRequest,
  "platform" | "providerLabel" | "sourceUrl" | "title" | "identifiers"
>;

export type FindMeetingSessionContinuationCandidateResponse = {
  success: boolean;
  candidate?: {
    sessionId: string;
    title?: string;
    endedAt: number;
    providerLabel: string;
  } | null;
  error?: string;
};

export type ResolveMeetingSessionResponse = {
  success: boolean;
  session?: MeetingSession;
  reused?: boolean;
  error?: string;
};

export type GenerateMeetingSummaryRequest = {
  sessionId: string;
  targetLanguage: string;
  profileId: string;
};

export type UpdateMeetingHistoryViewStateRequest = {
  selectedSessionId?: string | null;
  currentUrl?: string | null;
  viewInstanceId?: string | null;
  visible: boolean;
  focused: boolean;
};

export type FinalizeMeetingSessionEndRequest = {
  session: MeetingSession;
  enqueueAutomaticSummary?: boolean;
};

export type GenerateMeetingSummaryResponse = {
  success: boolean;
  session?: MeetingSession;
  summary?: MeetingSummary;
  error?: string;
};

export type FinalizeMeetingSessionEndResponse = {
  success: boolean;
  autoSummaryQueued?: boolean;
  error?: string;
};

export type GetMeetingSummaryJobStatusResponse = {
  success: boolean;
  status?: SummaryJobStatus | null;
  error?: string;
};

export type GetMeetingSummaryJobStatusesResponse = {
  success: boolean;
  statuses?: Record<string, SummaryJobStatus>;
  error?: string;
};

export type CancelMeetingSummaryJobResponse = {
  success: boolean;
  cancelled?: boolean;
  error?: string;
};

export type UpdateMeetingHistoryViewStateResponse = {
  success: boolean;
  error?: string;
};

export type AppDataBundleManifest = {
  kind: "captionarc-data-bundle";
  bundleVersion: 1;
  exportedAt: number;
  sessionCount: number;
};

export type AppDataBundle = {
  bundleVersion: 1;
  manifest: AppDataBundleManifest;
  settings: PortableSettings;
  sessions: PortableMeetingSession[];
};

export type ExportAppDataResponse = {
  success: boolean;
  data?: AppDataBundle;
  error?: string;
};

export type ImportAppDataResponse = {
  success: boolean;
  importedSessionCount?: number;
  error?: string;
};
