import { beforeEach, describe, expect, test, vi } from "vitest";
import { createDefaultAssistantConfig } from "../../entrypoints/shared/meeting-profiles";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";

type Store = Record<string, unknown>;

const cloudSyncSettingsSavedMock = vi.fn();

vi.mock("../../entrypoints/background/cloud-sync", () => ({
  noteCloudSyncSettingsSaved: cloudSyncSettingsSavedMock,
}));

function installExtensionStorage(initialState: Store = {}) {
  const storageState: Store = { ...initialState };
  const local = {
    get: vi.fn(async (keys?: string | string[]) => {
      if (typeof keys === "string") {
        return { [keys]: storageState[keys] };
      }

      if (Array.isArray(keys)) {
        return keys.reduce<Record<string, unknown>>((accumulator, key) => {
          accumulator[key] = storageState[key];
          return accumulator;
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

describe("Assistant settings save contract", () => {
  test("ASAVE-001: saveSettings persists the assistant profile matrix in the canonical shared state", async () => {
    const base = createDefaultSettings();
    const storage = installExtensionStorage({
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
          termsDecline: null,
        },
      },
    });
    const { saveSettings, getSettings } = await import("../../entrypoints/background/settings");

    const updatedProfiles = base.meetingProfiles.map((profile) =>
      profile.id === "interview"
        ? {
            ...profile,
            assistant: {
              ...profile.assistant,
              enabledByDefault: true,
              prompt: "Coach me with one concise story and one fallback line.",
              responseIntent: "coach_me" as const,
              responseFormat: "script" as const,
              responseDepth: "expanded" as const,
              responseTone: "analytical" as const,
              deliveryBias: "careful" as const,
              triggerPolicy: "proactive" as const,
              participantScope: "all_participants" as const,
            },
          }
        : profile
    );

    const response = await saveSettings({
      meetingProfiles: updatedProfiles,
      defaultMeetingProfileId: "interview",
    });

    expect(response.success).toBe(true);
    expect(response.settings.defaultMeetingProfileId).toBe("interview");
    expect(
      response.settings.meetingProfiles.find((profile) => profile.id === "interview")?.assistant
    ).toMatchObject({
      enabledByDefault: true,
      prompt: "Coach me with one concise story and one fallback line.",
      responseIntent: "coach_me",
      responseFormat: "script",
      responseDepth: "expanded",
      responseTone: "analytical",
      deliveryBias: "careful",
      triggerPolicy: "proactive",
      participantScope: "all_participants",
    });

    const persistedState = storage.storageState.settingsState as {
      shared: {
        meetingProfiles: Array<{ id: string; assistant: Record<string, unknown> }>;
      };
    };
    expect(
      persistedState.shared.meetingProfiles.find((profile) => profile.id === "interview")
        ?.assistant
    ).toMatchObject({
      enabledByDefault: true,
      prompt: "Coach me with one concise story and one fallback line.",
      responseIntent: "coach_me",
      responseFormat: "script",
      responseDepth: "expanded",
      responseTone: "analytical",
      deliveryBias: "careful",
      triggerPolicy: "proactive",
      participantScope: "all_participants",
    });

    const loaded = await getSettings();
    expect(loaded.success).toBe(true);
    expect(
      loaded.settings.meetingProfiles.find((profile) => profile.id === "interview")?.assistant
    ).toMatchObject({
      responseIntent: "coach_me",
      responseFormat: "script",
      responseDepth: "expanded",
      responseTone: "analytical",
      deliveryBias: "careful",
      triggerPolicy: "proactive",
      participantScope: "all_participants",
    });
  });

  test("ASAVE-002: invalid assistant settings normalize back to canonical defaults during save", async () => {
    const base = createDefaultSettings();
    installExtensionStorage({
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
          termsDecline: null,
        },
      },
    });
    const { saveSettings } = await import("../../entrypoints/background/settings");

    const malformedInterviewProfile = {
      ...base.meetingProfiles.find((profile) => profile.id === "interview")!,
      assistant: {
        enabledByDefault: "yes",
        prompt: "   ",
        responseIntent: "bad-intent",
        responseFormat: "bad-format",
        responseDepth: "bad-depth",
        responseTone: "bad-tone",
        deliveryBias: "bad-bias",
        triggerPolicy: "bad-trigger",
        participantScope: "bad-scope",
      },
    };

    const response = await saveSettings({
      meetingProfiles: [
        malformedInterviewProfile as never,
        {
          ...base.meetingProfiles.find((profile) => profile.id === "client_call")!,
        },
      ],
      defaultMeetingProfileId: "interview",
    });

    expect(response.success).toBe(true);
    expect(
      response.settings.meetingProfiles.find((profile) => profile.id === "interview")?.assistant
    ).toEqual(createDefaultAssistantConfig("interview"));
  });

  test("ASAVE-003: protected default profile requests normalize to the first selectable custom profile", async () => {
    const base = createDefaultSettings();
    installExtensionStorage({
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
          termsDecline: null,
        },
      },
    });
    const { saveSettings } = await import("../../entrypoints/background/settings");

    const response = await saveSettings({
      defaultMeetingProfileId: "general_summary",
    });

    expect(response.success).toBe(true);
    expect(response.settings.defaultMeetingProfileId).toBe("daily_sync");
    expect(cloudSyncSettingsSavedMock).toHaveBeenCalledTimes(1);
  });
});
