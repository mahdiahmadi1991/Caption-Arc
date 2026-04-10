import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../background/constants";
import type { Settings } from "../background/types";

const SETTINGS_STORAGE_KEYS = new Set(["settings", "settingsState"]);

export function useExtensionPageSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          action: "getSettings",
        });

        if (mounted && response?.success && response.settings) {
          setSettings(response.settings);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

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

      void loadSettings();
    };

    void loadSettings();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const saveSettings = async (partial: Partial<Settings>) => {
    const response = await chrome.runtime.sendMessage({
      action: "saveSettings",
      settings: partial,
    });

    if (response?.success && response.settings) {
      setSettings(response.settings);
    } else if (response?.success) {
      const refreshed = await chrome.runtime.sendMessage({
        action: "getSettings",
      });

      if (refreshed?.success && refreshed.settings) {
        setSettings(refreshed.settings);
      }
    }

    return response;
  };

  return {
    settings,
    loading,
    saveSettings,
  };
}
