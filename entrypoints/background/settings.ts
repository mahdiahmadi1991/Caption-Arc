import type {
  CloudSyncProvider,
  LegalRiskAcknowledgements,
  LocalDeviceSecrets,
  LocalDeviceSettings,
  Settings,
  SettingsState,
  SharedSettings,
  VerificationSnapshot,
} from "./types";
import { DEFAULT_SETTINGS } from "./constants";
import {
  normalizeMeetingProfiles,
  PROTECTED_MEETING_PROFILE_ID,
  isProtectedMeetingProfile,
} from "../shared/meeting-profiles";
import { MODELS } from "./constants";
import { createDefaultDeviceLabel, createDeviceId } from "../shared/device-identity";
import { normalizeMeetingArchiveRetentionDays } from "../shared/meeting-archive-retention";
import { normalizeSessionContinuationWindowMinutes } from "../shared/settings-defaults";
import { normalizeLanguageCode } from "../shared/language-metadata";
import {
  getOpenAiConnectionSignature,
  isOpenAiConfigured,
} from "../shared/openai-service";
import { normalizeUiLanguageSetting } from "../shared/ui-language";
import type { TermsAcceptance, TermsDecline } from "../shared/legal";
import { noteCloudSyncSettingsSaved } from "./cloud-sync";

import { createBackgroundDiagnosticsLogger } from "./diagnostics";

const settingsDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "runtime",
  feature: "settings-store",
});

const SETTINGS_STORAGE_KEY = "settings";
const SETTINGS_STATE_STORAGE_KEY = "settingsState";

type LegacySettingsAliases = {
  summaryLanguage?: unknown;
  summaryProfiles?: unknown;
  defaultSummaryProfileId?: unknown;
};

type RawSettingsInput = Partial<Settings> & LegacySettingsAliases;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCloudSyncProvider(value: unknown): value is CloudSyncProvider {
  return value === "google-drive" || value === "onedrive";
}

function isMeetingPlatform(value: unknown): value is "google-meet" | "microsoft-teams" | "zoom-web" {
  return (
    value === "google-meet" ||
    value === "microsoft-teams" ||
    value === "zoom-web"
  );
}

function normalizeOverlayOpacity(value: number | undefined): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_SETTINGS.overlayOpacity;
  }

  return Math.min(100, Math.max(35, Math.round(numericValue)));
}

function normalizeCaptureStartupBehavior(
  value: unknown
): Settings["captureStartupBehavior"] {
  return value === "off" || value === "always" ? value : "ask";
}

function normalizeCaptionActivationBehavior(
  value: unknown
): Settings["captionActivationBehavior"] {
  return value === "automatic" ? "automatic" : "guided";
}

function normalizeLegalRiskAcknowledgements(
  value: unknown,
  fallback: LegalRiskAcknowledgements
): LegalRiskAcknowledgements {
  if (!isRecord(value)) {
    return { ...fallback };
  }

  const normalized: LegalRiskAcknowledgements = {};

  for (const key of [
    "storeMeetingChat",
    "captureStartupAlways",
    "captionActivationAutomatic",
  ] as const) {
    const acknowledgedAt = value[key];
    if (typeof acknowledgedAt === "number" && Number.isFinite(acknowledgedAt)) {
      normalized[key] = acknowledgedAt;
    }
  }

  return normalized;
}

function normalizeModel(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return MODELS.includes(value as (typeof MODELS)[number]) ? value : fallback;
}

function getSelectableDefaultMeetingProfileId(settings: Settings): string {
  const customProfiles = settings.meetingProfiles.filter(
    (profile) => !isProtectedMeetingProfile(profile.id)
  );

  if (customProfiles.length > 0) {
    const matchingCustomProfile = customProfiles.find(
      (profile) => profile.id === settings.defaultMeetingProfileId
    );

    return matchingCustomProfile?.id || customProfiles[0].id;
  }

  return settings.meetingProfiles.find((profile) =>
    isProtectedMeetingProfile(profile.id)
  )?.id || PROTECTED_MEETING_PROFILE_ID;
}

function normalizeCustomPrompt(value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    return DEFAULT_SETTINGS.customPrompt;
  }

  return value ?? DEFAULT_SETTINGS.customPrompt;
}

function normalizeVerificationSnapshot(
  snapshot: unknown
): VerificationSnapshot | null {
  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    (snapshot as VerificationSnapshot).status === undefined
  ) {
    return null;
  }

  const status =
    (snapshot as VerificationSnapshot).status === "verified" ? "verified" : "error";
  const message =
    typeof (snapshot as VerificationSnapshot).message === "string"
      ? (snapshot as VerificationSnapshot).message
      : "";
  const signature =
    typeof (snapshot as VerificationSnapshot).signature === "string"
      ? (snapshot as VerificationSnapshot).signature
      : "";
  const verifiedAt =
    typeof (snapshot as VerificationSnapshot).verifiedAt === "number"
      ? (snapshot as VerificationSnapshot).verifiedAt
      : Date.now();

  return { status, message, signature, verifiedAt };
}

function normalizeTermsAcceptance(value: unknown): TermsAcceptance | null {
  if (!isRecord(value)) {
    return null;
  }

  const version =
    typeof value.version === "string" ? value.version.trim() : "";
  const acceptedAt =
    typeof value.acceptedAt === "number" ? value.acceptedAt : Number.NaN;

  if (!version || !Number.isFinite(acceptedAt)) {
    return null;
  }

  return {
    version,
    acceptedAt,
  };
}

function normalizeTermsDecline(value: unknown): TermsDecline | null {
  if (!isRecord(value)) {
    return null;
  }

  const version =
    typeof value.version === "string" ? value.version.trim() : "";
  const declinedAt =
    typeof value.declinedAt === "number" ? value.declinedAt : Number.NaN;

  if (!version || !Number.isFinite(declinedAt)) {
    return null;
  }

  return {
    version,
    declinedAt,
  };
}

function normalizeConnectedCloudProviders(
  value: unknown,
  fallback: CloudSyncProvider[]
): CloudSyncProvider[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.filter(isCloudSyncProvider);
}

function normalizeDeviceId(value: unknown, fallback: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback || createDeviceId();
}

function normalizeDeviceLabel(value: unknown, fallback: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback || createDefaultDeviceLabel();
}

function normalizeOverlayPositionsByPlatform(
  value: unknown,
  fallback: Settings["overlayPositionsByPlatform"]
): Settings["overlayPositionsByPlatform"] {
  if (!isRecord(value)) {
    return { ...fallback };
  }

  const normalized: Settings["overlayPositionsByPlatform"] = {};

  for (const [platform, position] of Object.entries(value)) {
    if (!isMeetingPlatform(platform) || !isRecord(position)) {
      continue;
    }

    const left = Number(position.left);
    const top = Number(position.top);
    const width = Number(position.width);
    const height = Number(position.height);

    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      continue;
    }

    normalized[platform] = {
      left: Math.round(left),
      top: Math.round(top),
      width: Number.isFinite(width) ? Math.round(width) : undefined,
      height: Number.isFinite(height) ? Math.round(height) : undefined,
      view: position.view === "minimized" ? "minimized" : "expanded",
    };
  }

  return normalized;
}

function flattenSettingsState(state: unknown): Partial<Settings> {
  if (!isRecord(state)) {
    return {};
  }

  const shared = isRecord(state.shared) ? state.shared : {};
  const secrets = isRecord(state.secrets) ? state.secrets : {};
  const local = isRecord(state.local) ? state.local : {};

  return {
    ...shared,
    ...secrets,
    ...local,
  } as Partial<Settings>;
}

function splitSettings(settings: Settings): SettingsState {
  const shared: SharedSettings = {
    model: settings.model,
    targetLanguage: settings.targetLanguage,
    translationEnabled: settings.translationEnabled,
    customPrompt: settings.customPrompt,
    meetingOutputLanguage: settings.meetingOutputLanguage,
    meetingArchiveRetentionDays: settings.meetingArchiveRetentionDays,
    meetingProfiles: settings.meetingProfiles.map((profile) => ({
      ...profile,
      assistant: { ...profile.assistant },
    })),
    defaultMeetingProfileId: settings.defaultMeetingProfileId,
    appearance: settings.appearance,
    overlayVisible: settings.overlayVisible,
    captureStartupBehavior: settings.captureStartupBehavior,
    captionActivationBehavior: settings.captionActivationBehavior,
    sessionContinuationWindowMinutes: settings.sessionContinuationWindowMinutes,
    overlayOpacity: settings.overlayOpacity,
    overlayClickThrough: settings.overlayClickThrough,
    storeMeetingChat: settings.storeMeetingChat,
    legalRiskAcknowledgements: { ...settings.legalRiskAcknowledgements },
  };

  const secrets: LocalDeviceSecrets = {
    openaiApiKey: settings.openaiApiKey,
  };

  const local: LocalDeviceSettings = {
    deviceId: settings.deviceId,
    deviceLabel: settings.deviceLabel,
    uiLanguage: settings.uiLanguage,
    connectedCloudProviders: [...settings.connectedCloudProviders],
    overlayPositionsByPlatform: { ...settings.overlayPositionsByPlatform },
    verificationSnapshot: settings.verificationSnapshot,
    termsAcceptance: settings.termsAcceptance
      ? { ...settings.termsAcceptance }
      : null,
    termsDecline: settings.termsDecline ? { ...settings.termsDecline } : null,
  };

  return {
    schemaVersion: 1,
    shared,
    secrets,
    local,
  };
}

function sanitizeSettingsShape(
  input: RawSettingsInput,
  fallback: Settings = DEFAULT_SETTINGS
): Settings {
  const legacyAutoSummarizeOnMeetingEnd =
    typeof (input as Partial<Settings> & { autoSummarizeOnMeetingEnd?: unknown })
      .autoSummarizeOnMeetingEnd === "boolean"
      ? Boolean(
          (input as Partial<Settings> & { autoSummarizeOnMeetingEnd?: unknown })
            .autoSummarizeOnMeetingEnd
        )
      : false;

  let meetingProfiles = normalizeMeetingProfiles(
    Array.isArray(input.meetingProfiles)
      ? input.meetingProfiles
      : Array.isArray(input.summaryProfiles)
        ? input.summaryProfiles
      : fallback.meetingProfiles
  );

  const requestedDefaultMeetingProfileId =
    typeof input.defaultMeetingProfileId === "string"
      ? input.defaultMeetingProfileId
      : typeof input.defaultSummaryProfileId === "string"
        ? input.defaultSummaryProfileId
      : fallback.defaultMeetingProfileId;

  const resolvedDefaultMeetingProfileId =
    meetingProfiles.find((profile) => profile.id === requestedDefaultMeetingProfileId)
      ?.id ||
    meetingProfiles.find((profile) => !isProtectedMeetingProfile(profile.id))?.id ||
    meetingProfiles[0]?.id ||
    PROTECTED_MEETING_PROFILE_ID;

  if (
    legacyAutoSummarizeOnMeetingEnd &&
    !meetingProfiles.some((profile) => profile.autoSummarizeOnMeetingEnd)
  ) {
    meetingProfiles = meetingProfiles.map((profile) =>
      profile.id === resolvedDefaultMeetingProfileId
        ? { ...profile, autoSummarizeOnMeetingEnd: true }
        : profile
    );
  }

  const normalized: Settings = {
    openaiApiKey:
      typeof input.openaiApiKey === "string"
        ? input.openaiApiKey
        : fallback.openaiApiKey,
    model: normalizeModel(input.model, fallback.model),
    targetLanguage: normalizeLanguageCode(
      input.targetLanguage,
      fallback.targetLanguage
    ),
    translationEnabled:
      typeof input.translationEnabled === "boolean"
        ? input.translationEnabled
        : fallback.translationEnabled,
    customPrompt: normalizeCustomPrompt(
      typeof input.customPrompt === "string"
        ? input.customPrompt
        : fallback.customPrompt
    ),
    meetingOutputLanguage: normalizeLanguageCode(
      input.meetingOutputLanguage ?? input.summaryLanguage,
      fallback.meetingOutputLanguage
    ),
    meetingArchiveRetentionDays: normalizeMeetingArchiveRetentionDays(
      typeof input.meetingArchiveRetentionDays === "number"
        ? input.meetingArchiveRetentionDays
        : fallback.meetingArchiveRetentionDays
    ),
    meetingProfiles,
    defaultMeetingProfileId: requestedDefaultMeetingProfileId,
    appearance:
      input.appearance === "light" ||
      input.appearance === "dark" ||
      input.appearance === "system"
        ? input.appearance
        : fallback.appearance,
    overlayVisible:
      typeof input.overlayVisible === "boolean"
        ? input.overlayVisible
        : fallback.overlayVisible,
    captureStartupBehavior: normalizeCaptureStartupBehavior(
      input.captureStartupBehavior ?? fallback.captureStartupBehavior
    ),
    captionActivationBehavior: normalizeCaptionActivationBehavior(
      input.captionActivationBehavior ?? fallback.captionActivationBehavior
    ),
    sessionContinuationWindowMinutes: normalizeSessionContinuationWindowMinutes(
      typeof input.sessionContinuationWindowMinutes === "number"
        ? input.sessionContinuationWindowMinutes
        : fallback.sessionContinuationWindowMinutes
    ),
    overlayOpacity: normalizeOverlayOpacity(
      typeof input.overlayOpacity === "number"
        ? input.overlayOpacity
        : fallback.overlayOpacity
    ),
    overlayClickThrough:
      typeof input.overlayClickThrough === "boolean"
        ? input.overlayClickThrough
        : fallback.overlayClickThrough,
    storeMeetingChat:
      typeof input.storeMeetingChat === "boolean"
        ? input.storeMeetingChat
        : fallback.storeMeetingChat,
    legalRiskAcknowledgements: normalizeLegalRiskAcknowledgements(
      input.legalRiskAcknowledgements,
      fallback.legalRiskAcknowledgements
    ),
    deviceId: normalizeDeviceId(input.deviceId, fallback.deviceId),
    deviceLabel: normalizeDeviceLabel(input.deviceLabel, fallback.deviceLabel),
    uiLanguage: normalizeUiLanguageSetting(input.uiLanguage ?? fallback.uiLanguage),
    connectedCloudProviders: normalizeConnectedCloudProviders(
      input.connectedCloudProviders,
      fallback.connectedCloudProviders
    ),
    overlayPositionsByPlatform: normalizeOverlayPositionsByPlatform(
      input.overlayPositionsByPlatform,
      fallback.overlayPositionsByPlatform
    ),
    verificationSnapshot: normalizeVerificationSnapshot(
      input.verificationSnapshot
    ),
    termsAcceptance: normalizeTermsAcceptance(input.termsAcceptance),
    termsDecline: normalizeTermsDecline(input.termsDecline),
  };

  if (
    normalized.termsAcceptance &&
    normalized.termsDecline &&
    normalized.termsAcceptance.version === normalized.termsDecline.version
  ) {
    if (
      normalized.termsAcceptance.acceptedAt >= normalized.termsDecline.declinedAt
    ) {
      normalized.termsDecline = null;
    } else {
      normalized.termsAcceptance = null;
    }
  }

  normalized.defaultMeetingProfileId =
    getSelectableDefaultMeetingProfileId(normalized);

  return normalized;
}

async function loadSettingsState(): Promise<{
  settings: Settings;
  state: SettingsState;
  needsPersistence: boolean;
}> {
  await settingsDiagnostics.trace("settings_load_started");
  const result = await chrome.storage.local.get([
    SETTINGS_STORAGE_KEY,
    SETTINGS_STATE_STORAGE_KEY,
  ]);

  const storedState = result[SETTINGS_STATE_STORAGE_KEY];
  const storedLegacy = result[SETTINGS_STORAGE_KEY] as RawSettingsInput | undefined;

  const mergedInput = {
    ...storedLegacy,
    ...flattenSettingsState(storedState),
  };
  const settings = sanitizeSettingsShape(mergedInput, DEFAULT_SETTINGS);
  const state = splitSettings(settings);
  const needsPersistence = !storedState;

  await settingsDiagnostics.debug("settings_load_completed", {
    needsPersistence,
    hasLegacySettings: Boolean(storedLegacy),
    hasStateSettings: Boolean(storedState),
    connectedCloudProviders: settings.connectedCloudProviders.length,
  });

  return { settings, state, needsPersistence };
}

async function persistSettingsState(settings: Settings): Promise<void> {
  await settingsDiagnostics.debug("settings_persist_started", {
    connectedCloudProviders: settings.connectedCloudProviders.length,
    model: settings.model,
    translationEnabled: settings.translationEnabled,
  });
  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: settings,
    [SETTINGS_STATE_STORAGE_KEY]: splitSettings(settings),
  });
  await settingsDiagnostics.info("settings_persist_completed", {
    connectedCloudProviders: settings.connectedCloudProviders.length,
    model: settings.model,
  });
}

async function persistOpenAiVerificationSnapshot(
  settings: Settings,
  snapshot: VerificationSnapshot | null
): Promise<void> {
  const updated = sanitizeSettingsShape(
    {
      ...settings,
      verificationSnapshot: snapshot,
    },
    settings
  );

  const currentSnapshot = settings.verificationSnapshot;
  const nextSnapshot = updated.verificationSnapshot;

  if (
    currentSnapshot?.status === nextSnapshot?.status &&
    currentSnapshot?.message === nextSnapshot?.message &&
    currentSnapshot?.signature === nextSnapshot?.signature
  ) {
    return;
  }

  if (!currentSnapshot && !nextSnapshot) {
    return;
  }

  await persistSettingsState(updated);
}

export async function getSettings(): Promise<{
  success: boolean;
  settings: Settings;
}> {
  const { settings, needsPersistence } = await loadSettingsState();

  if (needsPersistence) {
    await persistSettingsState(settings);
  }

  await settingsDiagnostics.trace("settings_get_completed", {
    needsPersistence,
  });

  return { success: true, settings };
}

export async function saveSettings(
  settings: Partial<Settings>
): Promise<{ success: boolean; settings: Settings }> {
  await settingsDiagnostics.info("settings_save_started", {
    keys: Object.keys(settings),
  });
  const current = await loadSettingsState();
  const updated = sanitizeSettingsShape(
    { ...current.settings, ...settings },
    current.settings
  );

  await persistSettingsState(updated);
  await noteCloudSyncSettingsSaved(updated);
  await settingsDiagnostics.info("settings_save_completed", {
    keys: Object.keys(settings),
    connectedCloudProviders: updated.connectedCloudProviders.length,
  });
  return { success: true, settings: updated };
}

export async function recordOpenAiVerificationSuccess(
  settingsOverride?: Settings,
  message = "OpenAI is ready."
): Promise<void> {
  const settings = settingsOverride ?? (await loadSettingsState()).settings;

  if (!isOpenAiConfigured(settings)) {
    await persistOpenAiVerificationSnapshot(settings, null);
    return;
  }

  await settingsDiagnostics.info("openai_verification_succeeded", {
    model: settings.model,
  });

  await persistOpenAiVerificationSnapshot(settings, {
    status: "verified",
    message,
    signature: getOpenAiConnectionSignature(settings),
    verifiedAt: Date.now(),
  });
}

export async function recordOpenAiVerificationFailure(
  message: string,
  settingsOverride?: Settings
): Promise<void> {
  const settings = settingsOverride ?? (await loadSettingsState()).settings;

  if (!isOpenAiConfigured(settings)) {
    await persistOpenAiVerificationSnapshot(settings, null);
    return;
  }

  await settingsDiagnostics.warn("openai_verification_failed", {
    model: settings.model,
    message,
  });

  await persistOpenAiVerificationSnapshot(settings, {
    status: "error",
    message,
    signature: getOpenAiConnectionSignature(settings),
    verifiedAt: Date.now(),
  });
}
