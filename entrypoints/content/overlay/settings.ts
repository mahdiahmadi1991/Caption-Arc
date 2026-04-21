import { settings, updateSettings, overlay } from "../state";
import { syncAssistantAvailabilityFromSettingsOnly } from "../assistant-service";
import { applyOverlayAppearance } from ".";
import { syncAssistantSurface } from "./assistant-surface";
import { syncActivePromptTheme } from "./capture-consent";
import { syncCaptureGuide } from "./capture-guide";
import { syncOverlayFooter } from "./footer";
import { syncCompactStatus, syncHeaderCopy, syncTranslationDock } from "./header";
import { syncOverlayVisibilityPreference } from "./visibility";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";

const overlaySettingsDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "overlay-settings",
});

export async function saveOverlaySettings(
  newSettings: Partial<typeof settings>
): Promise<void> {
  await overlaySettingsDiagnostics.info("overlay_settings_save_started", {
    keys: Object.keys(newSettings),
  });
  updateSettings(newSettings);
  try {
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
    await overlaySettingsDiagnostics.info("overlay_settings_save_completed", {
      keys: Object.keys(newSettings),
    });
  } catch (error) {
    await overlaySettingsDiagnostics.error("overlay_settings_save_failed", {
      keys: Object.keys(newSettings),
      error,
    });
    // Settings save failed silently
  }
  updateUIFromSettings();
}

export function updateUIFromSettings(): void {
  void overlaySettingsDiagnostics.debug("overlay_settings_applied_to_ui", {
    overlayVisible: settings.overlayVisible,
    translationEnabled: settings.translationEnabled,
    appearance: settings.appearance,
  });
  if (overlay) {
    overlay.classList.toggle("translation-off", !settings.translationEnabled);
    applyOverlayAppearance();
    syncOverlayVisibilityPreference();
  }
  syncActivePromptTheme();
  syncCaptureGuide();
  syncHeaderCopy();
  syncCompactStatus();
  syncTranslationDock();
  syncOverlayFooter();
  syncAssistantAvailabilityFromSettingsOnly();
  syncAssistantSurface();
}
