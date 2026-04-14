#!/usr/bin/env node

import { evaluateInExtensionTarget } from "./extension-target.mjs";

export function flattenSettingsFromSnapshot(snapshot) {
  const settings = snapshot?.settings ?? null;
  const state = snapshot?.settingsState ?? null;
  const shared = state?.shared ?? {};
  const secrets = state?.secrets ?? {};
  const local = state?.local ?? {};

  return {
    ...shared,
    ...secrets,
    ...local,
    ...(settings && typeof settings === "object" ? settings : {}),
  };
}

export async function readSettingsSnapshot(webSocketDebuggerUrl) {
  return await evaluateInExtensionTarget({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const current = await chrome.storage.local.get(["settings", "settingsState"]);
        return {
          settings: current.settings ?? null,
          settingsState: current.settingsState ?? null,
        };
      }
    )()`,
  });
}

export async function patchSettings(webSocketDebuggerUrl, patch) {
  return await evaluateInExtensionTarget({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const patch = ${JSON.stringify(patch)};
        const current = await chrome.storage.local.get(["settings", "settingsState"]);

        const sharedKeys = new Set([
          "model",
          "targetLanguage",
          "translationEnabled",
          "customPrompt",
          "meetingOutputLanguage",
          "meetingArchiveRetentionDays",
          "meetingProfiles",
          "defaultMeetingProfileId",
          "summaryLanguage",
          "summaryProfiles",
          "defaultSummaryProfileId",
          "appearance",
          "overlayVisible",
          "captureStartupBehavior",
          "captionActivationBehavior",
          "sessionContinuationWindowMinutes",
          "overlayOpacity",
          "overlayClickThrough",
          "storeMeetingChat",
        ]);
        const secretKeys = new Set(["openaiApiKey"]);
        const localKeys = new Set([
          "deviceId",
          "deviceLabel",
          "connectedCloudProviders",
          "overlayPositionsByPlatform",
          "verificationSnapshot",
          "uiLanguage",
        ]);

        const state = current.settingsState && typeof current.settingsState === "object"
          ? current.settingsState
          : {};
        const currentShared = state.shared && typeof state.shared === "object" ? state.shared : {};
        const currentSecrets = state.secrets && typeof state.secrets === "object" ? state.secrets : {};
        const currentLocal = state.local && typeof state.local === "object" ? state.local : {};

        const flattened = {
          ...currentShared,
          ...currentSecrets,
          ...currentLocal,
        };

        const baseSettings = {
          ...flattened,
          ...(current.settings && typeof current.settings === "object" ? current.settings : {}),
        };

        const nextSettings = { ...baseSettings, ...patch };
        const nextShared = { ...currentShared };
        const nextSecrets = { ...currentSecrets };
        const nextLocal = { ...currentLocal };

        for (const [key, value] of Object.entries(patch)) {
          if (sharedKeys.has(key)) {
            nextShared[key] = value;
            continue;
          }
          if (secretKeys.has(key)) {
            nextSecrets[key] = value;
            continue;
          }
          if (localKeys.has(key)) {
            nextLocal[key] = value;
            continue;
          }

          nextShared[key] = value;
        }

        const nextState = {
          schemaVersion:
            typeof state.schemaVersion === "number" && Number.isFinite(state.schemaVersion)
              ? state.schemaVersion
              : 1,
          shared: nextShared,
          secrets: nextSecrets,
          local: nextLocal,
        };

        await chrome.storage.local.set({
          settings: nextSettings,
          settingsState: nextState,
        });

        const verify = await chrome.storage.local.get(["settings", "settingsState"]);
        return {
          ok: true,
          applied: patch,
          settings: verify?.settings ?? null,
          settingsState: verify?.settingsState ?? null,
        };
      }
    )()`,
  });
}

export async function restoreSettingsSnapshot(webSocketDebuggerUrl, snapshot) {
  await evaluateInExtensionTarget({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const snapshot = ${JSON.stringify(snapshot)};
        if (snapshot.settings === null) {
          await chrome.storage.local.remove("settings");
        } else {
          await chrome.storage.local.set({ settings: snapshot.settings });
        }

        if (snapshot.settingsState === null) {
          await chrome.storage.local.remove("settingsState");
        } else {
          await chrome.storage.local.set({ settingsState: snapshot.settingsState });
        }

        return { restored: true };
      }
    )()`,
  });
}
