import type {
  MeetingPlatform,
  MeetingSessionIdentifiers,
} from "../../shared/meeting-session";

export type PlatformEmptyState = {
  waitingTitle: string;
  waitingBody: string;
};

export type MeetingPresenceState = "unknown" | "prejoin" | "joined" | "ended";

export type CaptureGuideStep = {
  title: string;
  detail: string;
};

export type ProviderCaptureGuide = {
  modalTitle: string;
  modalBody: string;
  steps: CaptureGuideStep[];
  troubleshootingHint?: string;
  statusLabel?: string;
  footerNote?: string;
};

export type MeetingSessionMetadata = {
  platform: MeetingPlatform;
  providerLabel: string;
  title?: string;
  sourceUrl: string;
  identifiers: MeetingSessionIdentifiers;
};

export type MeetingProvider = {
  platform: MeetingPlatform;
  matchesUrl(url: URL): boolean;
  matchesPageContext?(url: URL): boolean;
  bootstrap(): Promise<void> | void;
  getMeetingPresence(): MeetingPresenceState;
  startCaptionObserver(): () => void;
  getSessionMetadata(): MeetingSessionMetadata;
  getEmptyState(): PlatformEmptyState;
  getCaptureGuide(): ProviderCaptureGuide;
  isCaptioningCurrentlyAvailable(): boolean;
  tryEnableLiveCaptions?(timeoutMs: number): Promise<boolean>;
};
