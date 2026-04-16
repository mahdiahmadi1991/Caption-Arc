#!/usr/bin/env node

import {
  flattenSettingsFromSnapshot,
  readSettingsSnapshot,
  restoreSettingsSnapshot,
} from "./settings-storage.mjs";
import { sendCaptionArcRuntimeMessage } from "./diagnostics-runtime.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeAssistantPatch(profile, patch) {
  const nextProfile = {
    ...profile,
    ...patch,
  };

  if (patch?.assistant && typeof patch.assistant === "object") {
    nextProfile.assistant = {
      ...(profile?.assistant || {}),
      ...patch.assistant,
    };
  }

  return nextProfile;
}

export async function readResolvedSettings({
  webSocketDebuggerUrl,
} = {}) {
  const snapshot = await readSettingsSnapshot(webSocketDebuggerUrl);
  return {
    snapshot,
    settings: flattenSettingsFromSnapshot(snapshot),
  };
}

export async function saveSettingsPatch({
  baseUrl,
  webSocketDebuggerUrl,
  patch,
  expectedRuntimeId = null,
} = {}) {
  if (!patch || typeof patch !== "object") {
    throw new Error("saveSettingsPatch requires a patch object.");
  }

  const { settings } = await readResolvedSettings({ webSocketDebuggerUrl });
  const nextSettings = {
    ...settings,
    ...clone(patch),
  };

  const response = await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "saveSettings",
      settings: nextSettings,
    },
  });

  if (!response?.success || !response?.settings) {
    throw new Error(
      `saveSettings failed: ${JSON.stringify(response || null)}`
    );
  }

  return response.settings;
}

export async function patchMeetingProfileSettings({
  baseUrl,
  webSocketDebuggerUrl,
  profileId,
  patch,
  expectedRuntimeId = null,
} = {}) {
  if (!profileId) {
    throw new Error("patchMeetingProfileSettings requires profileId.");
  }

  const { settings } = await readResolvedSettings({ webSocketDebuggerUrl });
  const currentProfiles = Array.isArray(settings?.meetingProfiles)
    ? settings.meetingProfiles
    : [];

  let matched = false;
  const nextProfiles = currentProfiles.map((profile) => {
    if (profile?.id !== profileId) {
      return profile;
    }

    matched = true;
    return mergeAssistantPatch(profile, patch);
  });

  if (!matched) {
    throw new Error(`Meeting profile '${profileId}' was not found in settings.`);
  }

  return await saveSettingsPatch({
    baseUrl,
    webSocketDebuggerUrl,
    expectedRuntimeId,
    patch: {
      meetingProfiles: nextProfiles,
    },
  });
}

export async function switchDefaultMeetingProfile({
  baseUrl,
  webSocketDebuggerUrl,
  profileId,
  expectedRuntimeId = null,
} = {}) {
  if (!profileId) {
    throw new Error("switchDefaultMeetingProfile requires profileId.");
  }

  return await saveSettingsPatch({
    baseUrl,
    webSocketDebuggerUrl,
    expectedRuntimeId,
    patch: {
      defaultMeetingProfileId: profileId,
    },
  });
}

export async function updateMeetingSessionState({
  baseUrl,
  sessionId,
  updates,
  expectedRuntimeId = null,
} = {}) {
  if (!sessionId) {
    throw new Error("updateMeetingSessionState requires sessionId.");
  }

  if (!updates || typeof updates !== "object") {
    throw new Error("updateMeetingSessionState requires updates.");
  }

  const response = await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "updateMeetingSession",
      sessionId,
      updates,
    },
  });

  if (!response?.success) {
    throw new Error(
      `updateMeetingSession failed: ${JSON.stringify(response || null)}`
    );
  }

  return response;
}

export async function restoreSettingsSnapshotForAssistantDls({
  webSocketDebuggerUrl,
  snapshot,
} = {}) {
  if (!snapshot) {
    return;
  }

  await restoreSettingsSnapshot(webSocketDebuggerUrl, snapshot);
}
