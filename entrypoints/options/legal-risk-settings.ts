import type {
  LegalRiskAcknowledgementKey,
  Settings,
} from "../background/types";

export type LegalRiskSettingId = LegalRiskAcknowledgementKey;

export function getLegalRiskSettingIdForChange<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): LegalRiskSettingId | null {
  if (key === "storeMeetingChat" && value === true) {
    return "storeMeetingChat";
  }

  if (key === "captureStartupBehavior" && value === "always") {
    return "captureStartupAlways";
  }

  if (key === "captionActivationBehavior" && value === "automatic") {
    return "captionActivationAutomatic";
  }

  return null;
}

export function isLegalRiskSettingActive(
  settings: Pick<
    Settings,
    "storeMeetingChat" | "captureStartupBehavior" | "captionActivationBehavior"
  >,
  riskId: LegalRiskSettingId
): boolean {
  switch (riskId) {
    case "storeMeetingChat":
      return settings.storeMeetingChat;
    case "captureStartupAlways":
      return settings.captureStartupBehavior === "always";
    case "captionActivationAutomatic":
      return settings.captionActivationBehavior === "automatic";
    default:
      return false;
  }
}

export function hasLegalRiskAcknowledgement(
  settings: Pick<Settings, "legalRiskAcknowledgements">,
  riskId: LegalRiskSettingId
): boolean {
  return typeof settings.legalRiskAcknowledgements[riskId] === "number";
}

export function shouldPromptForLegalRiskAcknowledgement<K extends keyof Settings>(
  settings: Pick<
    Settings,
    | "storeMeetingChat"
    | "captureStartupBehavior"
    | "captionActivationBehavior"
    | "legalRiskAcknowledgements"
  >,
  key: K,
  value: Settings[K]
): LegalRiskSettingId | null {
  const riskId = getLegalRiskSettingIdForChange(key, value);

  if (!riskId) {
    return null;
  }

  if (hasLegalRiskAcknowledgement(settings, riskId)) {
    return null;
  }

  if (isLegalRiskSettingActive(settings, riskId)) {
    return null;
  }

  return riskId;
}
