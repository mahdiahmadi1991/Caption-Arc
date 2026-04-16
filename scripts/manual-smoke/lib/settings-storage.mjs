#!/usr/bin/env node

import { evaluateInExtensionTarget } from "./extension-target.mjs";

export function flattenSettingsFromSnapshot(snapshot) {
  const state = snapshot?.settingsState ?? null;
  const shared = state?.shared ?? {};
  const secrets = state?.secrets ?? {};
  const local = state?.local ?? {};

  return {
    ...shared,
    ...secrets,
    ...local,
  };
}

export async function readSettingsSnapshot(webSocketDebuggerUrl) {
  return await evaluateInExtensionTarget({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const current = await chrome.storage.local.get("settingsState");
        return {
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
        const current = await chrome.storage.local.get("settingsState");

        const sharedKeys = new Set([
          "model",
          "targetLanguage",
          "translationEnabled",
          "customPrompt",
          "meetingOutputLanguage",
          "meetingArchiveRetentionDays",
          "meetingProfiles",
          "defaultMeetingProfileId",
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

        const nextSettings = { ...flattened, ...patch };
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

        await chrome.storage.local.set({ settingsState: nextState });

        const verify = await chrome.storage.local.get("settingsState");
        return {
          ok: true,
          applied: patch,
          settings: nextSettings,
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
