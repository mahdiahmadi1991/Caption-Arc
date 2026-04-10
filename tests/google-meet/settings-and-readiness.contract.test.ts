import { beforeEach, describe, expect, test, vi } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import {
  getOpenAiConnectionSignature,
  getOpenAiServiceAvailability,
} from "../../entrypoints/shared/openai-service";

type Store = Record<string, unknown>;

const cloudSyncSettingsSavedMock = vi.fn();

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteCloudSyncSettingsSaved: cloudSyncSettingsSavedMock,
}));

function installChromeStorage(initialState: Store = {}) {
  const storageState: Store = { ...initialState };
  const local = {
    get: vi.fn(async (keys?: string | string[]) => {
      if (typeof keys === "string") {
        return { [keys]: storageState[keys] };
      }
      if (Array.isArray(keys)) {
        return keys.reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = storageState[key];
          return acc;
        }, {});
      }
      return { ...storageState };
    }),
    set: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(storageState, payload);
    }),
  };

  vi.stubGlobal("chrome", {
    storage: {
      local,
    },
  });

  return { local, storageState };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Settings and readiness contract", () => {
  test("SETRDY-001: settings load merges legacy and split-state payloads before normalization", async () => {
    const base = createDefaultSettings();
    const storage = installChromeStorage({
      settings: {
        ...base,
        model: "gpt-5.1",
        targetLanguage: "de",
        deviceLabel: "legacy-label",
      },
      settingsState: {
        schemaVersion: 1,
        shared: {
          model: "gpt-4.1",
          targetLanguage: "fa",
          legalRiskAcknowledgements: {
            storeMeetingChat: 55,
          },
        },
        secrets: {
          openaiApiKey: "key-from-state",
        },
        local: {
          deviceLabel: "state-label",
          connectedCloudProviders: ["google-drive", "invalid-provider"],
          termsAcceptance: {
            version: "2026-03-01",
            acceptedAt: 1234,
          },
        },
      },
    });

    const { getSettings } = await import("../../entrypoints/background/settings");
    const result = await getSettings();

    expect(result.success).toBe(true);
    expect(result.settings.model).toBe("gpt-4.1");
    expect(result.settings.targetLanguage).toBe("fa");
    expect(result.settings.openaiApiKey).toBe("key-from-state");
    expect(result.settings.deviceLabel).toBe("state-label");
    expect(result.settings.connectedCloudProviders).toEqual(["google-drive"]);
    expect(result.settings.termsAcceptance).toEqual({
      version: "2026-03-01",
      acceptedAt: 1234,
    });
    expect(result.settings.legalRiskAcknowledgements).toEqual({
      storeMeetingChat: 55,
    });
    expect(storage.local.set).not.toHaveBeenCalled();
  });

  test("SETRDY-002: settings save persists both shapes and notifies cloud-sync", async () => {
    const base = createDefaultSettings();
    const storage = installChromeStorage({
      settingsState: {
        schemaVersion: 1,
        shared: base,
        secrets: { openaiApiKey: "" },
        local: {
          deviceId: base.deviceId,
          deviceLabel: base.deviceLabel,
          uiLanguage: base.uiLanguage,
          connectedCloudProviders: [],
          overlayPositionsByPlatform: {},
          verificationSnapshot: null,
          termsAcceptance: null,
        },
      },
    });
    const { saveSettings } = await import("../../entrypoints/background/settings");

    const response = await saveSettings({
      model: "gpt-5.2",
      translationEnabled: true,
      connectedCloudProviders: ["onedrive"],
      legalRiskAcknowledgements: {
        captureStartupAlways: 101,
      },
      termsAcceptance: {
        version: "2026-04-10",
        acceptedAt: 4567,
      },
    });

    expect(response.success).toBe(true);
    expect(response.settings.model).toBe("gpt-5.2");
    expect(response.settings.termsAcceptance).toEqual({
      version: "2026-04-10",
      acceptedAt: 4567,
    });
    expect(storage.local.set).toHaveBeenCalled();
    const persistedSettings = storage.storageState.settings as Record<string, unknown>;
    const persistedState = storage.storageState.settingsState as Record<string, unknown>;
    expect(persistedSettings.model).toBe("gpt-5.2");
    expect(persistedSettings.translationEnabled).toBe(true);
    expect(persistedSettings.legalRiskAcknowledgements).toEqual({
      captureStartupAlways: 101,
    });
    expect(persistedSettings.termsAcceptance).toEqual({
      version: "2026-04-10",
      acceptedAt: 4567,
    });
    expect(persistedState).toHaveProperty("shared");
    expect(persistedState).toHaveProperty("secrets");
    expect(persistedState).toHaveProperty("local");
    expect((persistedState.local as Record<string, unknown>).termsAcceptance).toEqual({
      version: "2026-04-10",
      acceptedAt: 4567,
    });
    expect((persistedState.shared as Record<string, unknown>).legalRiskAcknowledgements).toEqual({
      captureStartupAlways: 101,
    });
    expect(cloudSyncSettingsSavedMock).toHaveBeenCalledTimes(1);
  });

  test("SETRDY-003: OpenAI readiness uses current connection signature and snapshot state", () => {
    const configured = {
      openaiApiKey: "sk-live",
      model: "gpt-5-mini",
    };

    const pending = getOpenAiServiceAvailability(configured);
    expect(pending.state).toBe("pending");
    expect(pending.operational).toBe(false);

    const verified = getOpenAiServiceAvailability({
      ...configured,
      verificationSnapshot: {
        status: "verified" as const,
        message: "OpenAI is ready.",
        signature: getOpenAiConnectionSignature(configured),
        verifiedAt: Date.now(),
      },
    });
    expect(verified.state).toBe("ready");
    expect(verified.operational).toBe(true);

    const staleSignature = getOpenAiServiceAvailability({
      ...configured,
      verificationSnapshot: {
        status: "verified" as const,
        message: "old",
        signature: "stale-signature",
        verifiedAt: Date.now(),
      },
    });
    expect(staleSignature.state).toBe("pending");
    expect(staleSignature.snapshot).toBeNull();
  });

  test("SETRDY-004: verification success/failure clears stale readiness when OpenAI is not configured", async () => {
    const base = createDefaultSettings();
    const storage = installChromeStorage({
      settings: {
        ...base,
        openaiApiKey: "",
        model: "",
        verificationSnapshot: {
          status: "error",
          message: "old",
          signature: "old",
          verifiedAt: Date.now(),
        },
      },
    });

    const {
      recordOpenAiVerificationFailure,
      recordOpenAiVerificationSuccess,
    } = await import("../../entrypoints/background/settings");

    await recordOpenAiVerificationSuccess();
    await recordOpenAiVerificationFailure("failed");

    const persisted = storage.storageState.settings as Record<string, unknown>;
    expect(persisted.verificationSnapshot).toBeNull();
  });

  test("SETRDY-006: invalid local terms acceptance records are discarded during normalization", async () => {
    const base = createDefaultSettings();
    installChromeStorage({
      settingsState: {
        schemaVersion: 1,
        shared: {
          model: "gpt-5-mini",
        },
        secrets: {
          openaiApiKey: "",
        },
        local: {
          deviceId: base.deviceId,
          deviceLabel: base.deviceLabel,
          uiLanguage: base.uiLanguage,
          connectedCloudProviders: [],
          overlayPositionsByPlatform: {},
          verificationSnapshot: null,
          termsAcceptance: {
            version: "",
            acceptedAt: "invalid",
          },
        },
      },
    });

    const { getSettings } = await import("../../entrypoints/background/settings");
    const result = await getSettings();

    expect(result.success).toBe(true);
    expect(result.settings.termsAcceptance).toBeNull();
  });

  test("SETRDY-008: current-version terms decisions reconcile to the latest local state and save returns the normalized settings", async () => {
    const base = createDefaultSettings();
    installChromeStorage({
      settings: base,
    });

    const { saveSettings } = await import("../../entrypoints/background/settings");

    const declined = await saveSettings({
      termsAcceptance: {
        version: "2026-04-10",
        acceptedAt: 100,
      },
      termsDecline: {
        version: "2026-04-10",
        declinedAt: 200,
      },
    });

    expect(declined.success).toBe(true);
    expect(declined.settings.termsAcceptance).toBeNull();
    expect(declined.settings.termsDecline).toEqual({
      version: "2026-04-10",
      declinedAt: 200,
    });

    const accepted = await saveSettings({
      termsAcceptance: {
        version: "2026-04-10",
        acceptedAt: 300,
      },
      termsDecline: {
        version: "2026-04-10",
        declinedAt: 200,
      },
    });

    expect(accepted.success).toBe(true);
    expect(accepted.settings.termsAcceptance).toEqual({
      version: "2026-04-10",
      acceptedAt: 300,
    });
    expect(accepted.settings.termsDecline).toBeNull();
  });
});
