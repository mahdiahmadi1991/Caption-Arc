import { useState, useEffect, useMemo, useRef } from "react";
import { DEFAULT_SETTINGS, type Settings } from "./components";
import type { ThemePreference } from "../shared/theme";
import type { AppDataBundle, VerificationSnapshot } from "../background/types";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import { useI18n, useT } from "../shared/i18n";
import { emitUiLocaleSwitchAbort, emitUiLocaleSwitchStart } from "../shared/i18n";
import {
  createEncryptedBackupFilename,
  deserializeEncryptedBackup,
  serializeEncryptedBackup,
} from "../shared/app-data-backup";

const optionsSettingsDiagnostics = createDiagnosticsLogger({
  runtime: "options",
  domain: "runtime",
  feature: "options-settings",
});

type ConnectionState =
  | { status: "idle"; message: string }
  | { status: "verifying"; message: string }
  | { status: "verified"; message: string }
  | { status: "error"; message: string };

type DataTransferState =
  | { status: "idle"; message: string }
  | { status: "exporting"; message: string }
  | { status: "importing"; message: string }
  | { status: "clearing"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type VerificationResult = {
  valid: boolean;
  message: string;
};

const AUTOSAVE_DELAY_MS = 700;
const SETTINGS_STORAGE_KEYS = new Set(["settings", "settingsState"]);

function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getOpenAiApiKey(settings: Settings): string {
  return settings.openaiApiKey;
}

function getOpenAiConnectionSignature(settings: Settings): string {
  return JSON.stringify({
    service: "openai",
    apiKey: getOpenAiApiKey(settings),
    model: settings.model,
  });
}

function getOpenAiConnectionPrompt(
  settings: Settings,
  t: ReturnType<typeof useT>
): string {
  if (!settings.openaiApiKey.trim()) {
    return t("options.runtime.connection.addApiKey");
  }
  return t("options.runtime.connection.runTest");
}

function createVerificationSnapshot(
  status: "verified" | "error",
  message: string,
  signature: string
): VerificationSnapshot {
  return {
    status,
    message,
    signature,
    verifiedAt: Date.now(),
  };
}

async function verifyOpenAiSetup(
  settings: Settings,
  t: ReturnType<typeof useT>
): Promise<VerificationResult> {
  if (!settings.openaiApiKey.trim()) {
    return {
      valid: false,
      message: t("options.runtime.connection.apiKeyRequired"),
    };
  }

  if (!settings.model.trim()) {
    return {
      valid: false,
      message: t("options.runtime.connection.modelRequired"),
    };
  }

  try {
    const response = await fetch(
      `https://api.openai.com/v1/models/${encodeURIComponent(settings.model)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return {
          valid: false,
          message: t("options.runtime.connection.apiKeyRejected"),
        };
      }
      if (response.status === 404) {
        return {
          valid: false,
          message: t("options.runtime.connection.modelUnavailable", {
            model: settings.model,
          }),
        };
      }
      return {
        valid: false,
        message:
          data.error?.message ||
          t("options.runtime.connection.requestFailed", {
            status: response.status,
          }),
      };
    }

    return {
      valid: true,
      message: t("options.runtime.connection.reachable", {
        model: settings.model,
      }),
    };
  } catch {
    return {
      valid: false,
      message: t("options.runtime.connection.networkFailed"),
    };
  }
}

export function useSettings() {
  const { locale } = useI18n();
  const t = useT();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "idle",
    message: getOpenAiConnectionPrompt(DEFAULT_SETTINGS, t),
  });
  const [dataTransferState, setDataTransferState] = useState<DataTransferState>({
    status: "idle",
    message: t("options.runtime.dataTransfer.idle"),
  });
  const lastSavedSettingsRef = useRef(JSON.stringify(DEFAULT_SETTINGS));
  const lastVerifiedSignatureRef = useRef<string | null>(null);
  const saveRequestIdRef = useRef(0);
  const immediateSaveSerializedRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  const autoVerifyPendingRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const loadSettings = async () => {
    await optionsSettingsDiagnostics.info("options_settings_load_started");
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getSettings",
      });
      if (response?.success && response.settings) {
        const saved = response.settings;
        const merged = { ...DEFAULT_SETTINGS, ...saved };
        if (saved.customPrompt !== undefined) {
          merged.customPrompt = saved.customPrompt;
        }
        setSettings(merged);
        lastSavedSettingsRef.current = JSON.stringify(merged);
        if (!merged.openaiApiKey.trim()) {
          autoVerifyPendingRef.current = true;
        }
        await optionsSettingsDiagnostics.info("options_settings_load_completed", {
          hasApiKey: Boolean(merged.openaiApiKey.trim()),
          model: merged.model,
          summaryProfileCount: merged.summaryProfiles.length,
        });
        const savedSignature = getOpenAiConnectionSignature(merged);
        const savedSnapshot = merged.verificationSnapshot;

        if (savedSnapshot && savedSnapshot.signature === savedSignature) {
          lastVerifiedSignatureRef.current = savedSnapshot.signature;
          setConnectionState({
            status: savedSnapshot.status,
            message: savedSnapshot.message,
          });
        } else {
          setConnectionState({
            status: "idle",
            message: getOpenAiConnectionPrompt(merged, t),
          });
        }
      }
    } catch (error) {
      await optionsSettingsDiagnostics.error("options_settings_load_failed", {
        error,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, [t]);

  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local") {
        return;
      }

      if (!Object.keys(changes).some((key) => SETTINGS_STORAGE_KEYS.has(key))) {
        return;
      }

      const nextAppearance = changes.settings?.newValue?.appearance;
      if (
        nextAppearance !== "light" &&
        nextAppearance !== "dark" &&
        nextAppearance !== "system"
      ) {
        return;
      }

      setSettings((prev) =>
        prev.appearance === nextAppearance
          ? prev
          : {
              ...prev,
              appearance: nextAppearance,
            }
      );
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const serializedSettings = JSON.stringify(settings);
    if (serializedSettings === lastSavedSettingsRef.current) {
      return;
    }

    if (serializedSettings === immediateSaveSerializedRef.current) {
      return;
    }

    const requestId = ++saveRequestIdRef.current;
    const timeoutId = window.setTimeout(async () => {
      try {
        await optionsSettingsDiagnostics.debug("options_settings_autosave_started", {
          requestId,
        });
        const response = await chrome.runtime.sendMessage({
          action: "saveSettings",
          settings,
        });
        if (!response?.success) {
          throw new Error(response?.error || "Settings autosave failed.");
        }
        if (saveRequestIdRef.current !== requestId) {
          await optionsSettingsDiagnostics.trace("options_settings_autosave_superseded", {
            requestId,
          });
          return;
        }

        lastSavedSettingsRef.current = serializedSettings;
        await optionsSettingsDiagnostics.info("options_settings_autosave_completed", {
          requestId,
        });
      } catch (error) {
        if (saveRequestIdRef.current !== requestId) {
          await optionsSettingsDiagnostics.trace("options_settings_autosave_failure_ignored", {
            requestId,
          });
          return;
        }

        await optionsSettingsDiagnostics.warn("options_settings_autosave_failed", {
          requestId,
          error,
        });
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loading, settings]);

  const connectionSignature = useMemo(
    () => getOpenAiConnectionSignature(settings),
    [settings]
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const snapshot = settings.verificationSnapshot;
    if (
      snapshot &&
      snapshot.signature === connectionSignature &&
      (snapshot.status === "verified" || snapshot.status === "error")
    ) {
      lastVerifiedSignatureRef.current = snapshot.signature;
      setConnectionState({
        status: snapshot.status,
        message: snapshot.message,
      });
      return;
    }

    lastVerifiedSignatureRef.current = null;
    setConnectionState({
      status: "idle",
      message: getOpenAiConnectionPrompt(settings, t),
    });
  }, [connectionSignature, loading, settings, t]);

  const saveAppearance = async (appearance: ThemePreference) => {
    void optionsSettingsDiagnostics.debug("options_settings_appearance_changed", {
      appearance,
    });
    const nextSettings = {
      ...settingsRef.current,
      appearance,
    };
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
  };

  const saveSettingsImmediately = async (
    nextSettings: Settings,
    options?: {
      uiLanguageChange?: boolean;
    }
  ) => {
    const serializedSettings = JSON.stringify(nextSettings);
    const requestId = ++saveRequestIdRef.current;
    immediateSaveSerializedRef.current = serializedSettings;

    try {
      await optionsSettingsDiagnostics.info("options_settings_immediate_save_started", {
        requestId,
      });
      const response = await chrome.runtime.sendMessage({
        action: "saveSettings",
        settings: nextSettings,
      });
      if (!response?.success) {
        throw new Error(response?.error || "Settings save failed.");
      }

      if (saveRequestIdRef.current !== requestId) {
        await optionsSettingsDiagnostics.trace("options_settings_immediate_save_superseded", {
          requestId,
        });
        return;
      }

      lastSavedSettingsRef.current = serializedSettings;
      await optionsSettingsDiagnostics.info("options_settings_immediate_save_completed", {
        requestId,
      });
    } catch (error) {
      if (saveRequestIdRef.current !== requestId) {
        await optionsSettingsDiagnostics.trace("options_settings_immediate_save_failure_ignored", {
          requestId,
        });
        return;
      }

      await optionsSettingsDiagnostics.error("options_settings_immediate_save_failed", {
        requestId,
        error,
      });
      if (options?.uiLanguageChange) {
        emitUiLocaleSwitchAbort();
      }
    } finally {
      if (immediateSaveSerializedRef.current === serializedSettings) {
        immediateSaveSerializedRef.current = null;
      }
    }
  };

  const persistSettingsNow = async (
    updates: Partial<Settings>
  ): Promise<boolean> => {
    const nextSettings = {
      ...settingsRef.current,
      ...updates,
    } as Settings;
    const serializedSettings = JSON.stringify(nextSettings);
    const requestId = ++saveRequestIdRef.current;
    immediateSaveSerializedRef.current = serializedSettings;

    try {
      await optionsSettingsDiagnostics.info(
        "options_settings_transactional_save_started",
        {
          requestId,
          keys: Object.keys(updates),
        }
      );
      const response = await chrome.runtime.sendMessage({
        action: "saveSettings",
        settings: nextSettings,
      });
      if (!response?.success) {
        throw new Error(response?.error || "Settings save failed.");
      }

      if (saveRequestIdRef.current !== requestId) {
        await optionsSettingsDiagnostics.trace(
          "options_settings_transactional_save_superseded",
          {
            requestId,
          }
        );
        return false;
      }

      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      lastSavedSettingsRef.current = serializedSettings;
      await optionsSettingsDiagnostics.info(
        "options_settings_transactional_save_completed",
        {
          requestId,
          keys: Object.keys(updates),
        }
      );
      return true;
    } catch (error) {
      if (saveRequestIdRef.current !== requestId) {
        await optionsSettingsDiagnostics.trace(
          "options_settings_transactional_save_failure_ignored",
          {
            requestId,
          }
        );
        return false;
      }

      await optionsSettingsDiagnostics.error(
        "options_settings_transactional_save_failed",
        {
          requestId,
          keys: Object.keys(updates),
          error,
        }
      );
      return false;
    } finally {
      if (immediateSaveSerializedRef.current === serializedSettings) {
        immediateSaveSerializedRef.current = null;
      }
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    const previousSettings = settingsRef.current;
    const nextSettings = {
      ...previousSettings,
      [key]: value,
    } as Settings;

    settingsRef.current = nextSettings;
    setSettings(nextSettings);

    if (key === "uiLanguage" && previousSettings.uiLanguage !== value) {
      emitUiLocaleSwitchStart();
      void saveSettingsImmediately(nextSettings, {
        uiLanguageChange: true,
      });
    }
  };

  const updateSettings = (updates: Partial<Settings>) => {
    const nextSettings = {
      ...settingsRef.current,
      ...updates,
    } as Settings;

    settingsRef.current = nextSettings;
    setSettings(nextSettings);
  };

  const verifyOpenAiSetupNow = async () => {
    await optionsSettingsDiagnostics.info("options_settings_openai_verification_started", {
      model: settings.model,
      hasApiKey: Boolean(settings.openaiApiKey.trim()),
    });
    setConnectionState({
      status: "verifying",
      message: t("options.runtime.connection.testing"),
    });

    const signatureAtRequestTime = connectionSignature;
    const result = await verifyOpenAiSetup(settings, t);

    if (result.valid) {
      const snapshot = createVerificationSnapshot(
        "verified",
        result.message,
        signatureAtRequestTime
      );
      const nextSettings = {
        ...settingsRef.current,
        verificationSnapshot: snapshot,
      };
      lastVerifiedSignatureRef.current = signatureAtRequestTime;
      setConnectionState({
        status: "verified",
        message: result.message,
      });
      await optionsSettingsDiagnostics.info("options_settings_openai_verification_succeeded", {
        model: settings.model,
      });
      setSettings(nextSettings);
      void saveSettingsImmediately(nextSettings);
      return;
    }

    const snapshot = createVerificationSnapshot(
      "error",
      result.message,
      signatureAtRequestTime
    );
    const nextSettings = {
      ...settingsRef.current,
      verificationSnapshot: snapshot,
    };
    setConnectionState({
      status: "error",
      message: result.message,
    });
    await optionsSettingsDiagnostics.warn("options_settings_openai_verification_failed", {
      model: settings.model,
      message: result.message,
    });
    setSettings(nextSettings);
    void saveSettingsImmediately(nextSettings);
  };

  const verifyOpenAiSetupNowRef = useRef(verifyOpenAiSetupNow);
  verifyOpenAiSetupNowRef.current = verifyOpenAiSetupNow;

  useEffect(() => {
    if (loading || !autoVerifyPendingRef.current) {
      return;
    }
    if (connectionState.status !== "idle") {
      return;
    }
    if (!/^sk-[A-Za-z0-9\-_]{32,}/.test(settings.openaiApiKey)) {
      return;
    }
    autoVerifyPendingRef.current = false;
    void verifyOpenAiSetupNowRef.current();
  }, [settings.openaiApiKey, connectionState.status, loading]);

  const currentOpenAiApiKey = settings.openaiApiKey;

  const setCurrentOpenAiApiKey = (value: string) => {
    updateSetting("openaiApiKey", value);
  };

  const openHistory = () => {
    void optionsSettingsDiagnostics.debug("options_settings_open_history_requested");
    window.location.href = chrome.runtime.getURL("meeting-history.html");
  };

  const exportDataBundle = async (passphrase: string) => {
    await optionsSettingsDiagnostics.info("options_settings_export_started", {
      hasPassphrase: Boolean(passphrase),
    });
    setDataTransferState({
      status: "exporting",
      message: t("options.runtime.dataTransfer.exporting"),
    });

    try {
      const response = await chrome.runtime.sendMessage({
        action: "exportAppDataBundle",
      });

      if (!response?.success || !response.data) {
        throw new Error(response?.error || "Data export failed.");
      }

      const encryptedBackup = await serializeEncryptedBackup(
        response.data as AppDataBundle,
        passphrase
      );

      downloadFile(
        encryptedBackup,
        createEncryptedBackupFilename(response.data.manifest.exportedAt),
        "application/octet-stream"
      );

      setDataTransferState({
        status: "success",
        message: t("options.runtime.dataTransfer.exportSuccess", {
          count: response.data.manifest.sessionCount,
          suffix:
            locale === "en" && response.data.manifest.sessionCount !== 1
              ? "s"
              : "",
        }),
      });
      await optionsSettingsDiagnostics.info("options_settings_export_completed", {
        sessionCount: response.data.manifest.sessionCount,
      });
    } catch (error) {
      await optionsSettingsDiagnostics.error("options_settings_export_failed", {
        error,
      });
      setDataTransferState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : t("options.runtime.dataTransfer.exportFailed"),
      });
    }
  };

  const importDataBundle = async (file: File, passphrase: string) => {
    await optionsSettingsDiagnostics.info("options_settings_import_started", {
      fileName: file.name,
      hasPassphrase: Boolean(passphrase),
    });
    setDataTransferState({
      status: "importing",
      message: t("options.runtime.dataTransfer.importing"),
    });

    try {
      const bundle = await deserializeEncryptedBackup<AppDataBundle>(
        await file.text(),
        passphrase
      );
      const response = await chrome.runtime.sendMessage({
        action: "importAppDataBundle",
        bundle,
      });

      if (!response?.success) {
        throw new Error(response?.error || "Data import failed.");
      }

      await loadSettings();
      setDataTransferState({
        status: "success",
        message: t("options.runtime.dataTransfer.importSuccess", {
          count: Number(response.importedSessionCount || 0),
          suffix:
            locale === "en" && Number(response.importedSessionCount || 0) !== 1
              ? "s"
              : "",
        }),
      });
      await optionsSettingsDiagnostics.info("options_settings_import_completed", {
        importedSessionCount: Number(response.importedSessionCount || 0),
      });
    } catch (error) {
      await optionsSettingsDiagnostics.error("options_settings_import_failed", {
        fileName: file.name,
        error,
      });
      setDataTransferState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : t("options.runtime.dataTransfer.importFailed"),
      });
    }
  };

  const clearSessionData = async () => {
    const connectedProviderCount = settingsRef.current.connectedCloudProviders.length;
    await optionsSettingsDiagnostics.info("options_settings_clear_history_started", {
      connectedProviderCount,
    });
    setDataTransferState({
      status: "clearing",
      message:
        connectedProviderCount > 0
          ? t("options.runtime.dataTransfer.clearingSynced")
          : t("options.runtime.dataTransfer.clearingLocal"),
    });

    try {
      const response = await chrome.runtime.sendMessage({
        action: "clearMeetingHistory",
      });

      if (!response?.success) {
        throw new Error(response?.error || "Could not clear stored session data.");
      }

      setDataTransferState({
        status: "success",
        message:
          connectedProviderCount > 0
            ? t("options.runtime.dataTransfer.clearSuccessSynced")
            : t("options.runtime.dataTransfer.clearSuccessLocal"),
      });
      await optionsSettingsDiagnostics.info("options_settings_clear_history_completed", {
        connectedProviderCount,
      });
    } catch (error) {
      await optionsSettingsDiagnostics.error("options_settings_clear_history_failed", {
        connectedProviderCount,
        error,
      });
      setDataTransferState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : t("options.runtime.dataTransfer.clearFailed"),
      });
    }
  };

  return {
    settings,
    loading,
    connectionState,
    dataTransferState,
    currentOpenAiApiKey,
    setCurrentOpenAiApiKey,
    updateSetting,
    updateSettings,
    persistSettingsNow,
    saveAppearance,
    verifyOpenAiSetupNow,
    exportDataBundle,
    importDataBundle,
    clearSessionData,
    openHistory,
    reloadSettings: loadSettings,
  };
}
