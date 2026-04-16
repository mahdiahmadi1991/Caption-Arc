#!/usr/bin/env node

import { execSync } from "node:child_process";
import {
  createTarget,
  evaluateInTarget,
  resolveCdpEndpoint,
} from "./lib/cdp-runtime.mjs";
import { resolveProviderScenarioUrl } from "./lib/provider-url.mjs";

const scenarioArg = process.argv[2] || process.env.SMOKE_SCENARIO || "meeting";
const portArg = process.argv[3] || process.env.SMOKE_PORT || "9222";
const scenario = String(scenarioArg).trim().toLowerCase();
const port = Number.parseInt(portArg, 10);
const waitMs = Number.parseInt(process.env.SMOKE_WAIT_MS || "9000", 10);
const applyDelayMs = Number.parseInt(
  process.env.SMOKE_SETTINGS_APPLY_DELAY_MS || "900",
  10
);
const singleTabMode = process.env.SMOKE_SINGLE_TAB !== "0";
const stepMode = process.env.SMOKE_STEP_MODE !== "0";
const stepPauseMs = Number.parseInt(process.env.SMOKE_STEP_PAUSE_MS || "700", 10);
const allowAuxTabs = process.env.SMOKE_ALLOW_AUX_TABS === "1";
const stepVerifyTimeoutMs = Number.parseInt(
  process.env.SMOKE_STEP_VERIFY_TIMEOUT_MS || "5500",
  10
);
const stepVerifyIntervalMs = Number.parseInt(
  process.env.SMOKE_STEP_VERIFY_INTERVAL_MS || "350",
  10
);
const capturePromptAction = String(
  process.env.SMOKE_CAPTURE_PROMPT_ACTION || "approve"
)
  .trim()
  .toLowerCase();
const continuationPromptAction = String(
  process.env.SMOKE_CONTINUATION_PROMPT_ACTION || "restart"
)
  .trim()
  .toLowerCase();
const sessionEndedPromptAction = String(
  process.env.SMOKE_SESSION_ENDED_PROMPT_ACTION || "stay"
)
  .trim()
  .toLowerCase();
const promptWaitMs = Number.parseInt(
  process.env.SMOKE_PROMPT_WAIT_MS || "12000",
  10
);
const promptPollMs = Number.parseInt(process.env.SMOKE_PROMPT_POLL_MS || "350", 10);
const requirePromptResolution = process.env.SMOKE_REQUIRE_PROMPT_RESOLUTION !== "0";
const allowPromptBypass = process.env.SMOKE_ALLOW_PROMPT_BYPASS === "1";
const smokeOpenAiApiKey = String(
  process.env.SMOKE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ""
).trim();

if (!Number.isFinite(port) || port <= 0) {
  console.error(
    "Invalid port. Usage: node scripts/manual-smoke/smoke-google-overlay-settings.mjs [scenario] [port]"
  );
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function canonicalUrl(value) {
  try {
    return new URL(String(value)).toString();
  } catch {
    return String(value || "");
  }
}

async function waitStep(label) {
  if (!stepMode) {
    return;
  }
  console.log(`STEP: ${label}`);
  await sleep(stepPauseMs);
}

function flattenSettingsFromSnapshot(snapshot) {
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

function resolveCaptureStartupBehavior(snapshot) {
  const flattened = flattenSettingsFromSnapshot(snapshot);
  const value = flattened?.captureStartupBehavior;
  if (value === "always" || value === "off" || value === "ask") {
    return value;
  }
  return "ask";
}

function parseRuntimeIdFromMarker(markerContent) {
  const match = String(markerContent || "").match(/^([a-z]{32}):\d+$/i);
  return match?.[1] || null;
}

async function listTargets(baseUrl) {
  const response = await fetch(`${baseUrl}/json/list`);
  if (!response.ok) {
    throw new Error(`Failed to list targets: HTTP ${response.status}`);
  }
  return await response.json();
}

function findPageTargetByUrl(targets, expectedUrl) {
  const wanted = canonicalUrl(expectedUrl);
  return (
    targets.find(
      (target) =>
        target?.type === "page" &&
        typeof target?.webSocketDebuggerUrl === "string" &&
        canonicalUrl(target?.url) === wanted
    ) || null
  );
}

async function evaluateInExtensionTarget({
  webSocketDebuggerUrl,
  expression,
  awaitPromise = false,
}) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    expression,
    delayMs: 120,
    enablePage: false,
    awaitPromise,
  });
}

async function resolveCaptionArcExtensionTarget(targets, expectedRuntimeId = null) {
  const extensionTargets = targets.filter(
    (target) =>
      typeof target?.url === "string" &&
      target.url.startsWith("chrome-extension://") &&
      typeof target?.webSocketDebuggerUrl === "string"
  );

  if (extensionTargets.length === 0) {
    return null;
  }

  const parseRuntimeIdFromTarget = (target) => {
    const parsed = String(target?.url || "").match(
      /^chrome-extension:\/\/([a-z]{32})\//i
    );
    return parsed?.[1] || null;
  };

  for (const target of extensionTargets) {
    try {
      const manifestProbe = await evaluateInExtensionTarget({
        webSocketDebuggerUrl: target.webSocketDebuggerUrl,
        expression: `(() => {
          try {
            const manifest = chrome?.runtime?.getManifest?.();
            return {
              name: manifest?.name || null,
              id: chrome?.runtime?.id || null,
            };
          } catch (error) {
            return {
              name: null,
              id: null,
              error: String(error),
            };
          }
        })()`,
      });

      const name = String(manifestProbe?.name || "").toLowerCase();
      if (/caption.?arc/.test(name)) {
        return {
          ...target,
          manifestName: manifestProbe?.name || null,
          runtimeId: manifestProbe?.id || null,
        };
      }
    } catch {
      // Try next extension target.
    }
  }

  if (expectedRuntimeId) {
    const matchedById = extensionTargets.find((target) => {
      const runtimeId = parseRuntimeIdFromTarget(target);
      return runtimeId?.toLowerCase() === expectedRuntimeId.toLowerCase();
    });
    if (matchedById) {
      return {
        ...matchedById,
        manifestName: null,
        runtimeId: expectedRuntimeId,
      };
    }
  }

  // Runtime.evaluate on extension service-worker targets may intermittently fail.
  // If all extension targets point to a single extension id, prefer that target.
  const extensionIds = Array.from(
    new Set(
      extensionTargets.map((target) => parseRuntimeIdFromTarget(target)).filter(Boolean)
    )
  );
  if (extensionIds.length === 1) {
    const runtimeId = extensionIds[0];
    const preferredTarget =
      extensionTargets.find((target) => target?.type === "service_worker") ||
      extensionTargets[0];
    return {
      ...preferredTarget,
      manifestName: null,
      runtimeId,
    };
  }

  return null;
}

function resolveExtensionPageTargetById(targets, extensionId) {
  if (!extensionId) {
    return null;
  }

  return (
    targets.find((target) => {
      if (target?.type !== "page") {
        return false;
      }
      if (
        typeof target?.url !== "string" ||
        !target.url.startsWith("chrome-extension://") ||
        typeof target?.webSocketDebuggerUrl !== "string"
      ) {
        return false;
      }
      const parsed = String(target.url).match(
        /^chrome-extension:\/\/([a-z]{32})\//i
      );
      return parsed?.[1]?.toLowerCase() === extensionId.toLowerCase();
    }) || null
  );
}

async function resolveCaptionArcIdFromExtensionsPage(baseUrl) {
  const target = await createTarget(baseUrl, "chrome://extensions/");
  const webSocketDebuggerUrl = target.webSocketDebuggerUrl;
  const result = await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 900,
    expression: `(() => {
      const visited = new Set();
      const nodes = [];

      const walk = (root) => {
        if (!root || visited.has(root)) {
          return;
        }
        visited.add(root);
        nodes.push(root);

        const children = root.children || [];
        for (const child of children) {
          walk(child);
          if (child.shadowRoot) {
            walk(child.shadowRoot);
          }
        }
      };

      walk(document);

      for (const node of nodes) {
        if (!(node instanceof Element)) {
          continue;
        }
        const text = (node.textContent || "").toLowerCase();
        if (!text.includes("captionarc")) {
          continue;
        }

        let cursor = node;
        while (cursor) {
          const maybeId = cursor.getAttribute?.("id") || "";
          if (/^[a-z]{32}$/i.test(maybeId)) {
            return maybeId;
          }
          cursor = cursor.parentElement;
        }
      }

      return null;
    })()`,
  });

  return typeof result === "string" && result ? result : null;
}

async function resolveExtensionRuntimeTarget(baseUrl, pageWebSocketDebuggerUrl) {
  const pageDerivedId = await resolveExtensionIdFromPage(pageWebSocketDebuggerUrl);
  let discoveredId = pageDerivedId || resolveExtensionIdFromCache();
  let runtimeTargets = await listTargets(baseUrl);
  let extensionTarget = await resolveCaptionArcExtensionTarget(
    runtimeTargets,
    discoveredId
  );
  if (extensionTarget) {
    const runtimeId = extensionTarget.runtimeId || discoveredId;
    if (runtimeId && extensionTarget?.type !== "page") {
      const opened = await openExtensionUiTarget(baseUrl, runtimeId);
      if (opened) {
        await sleep(450);
        runtimeTargets = await listTargets(baseUrl);
        const pageTarget = resolveExtensionPageTargetById(runtimeTargets, runtimeId);
        if (pageTarget) {
          return {
            ...pageTarget,
            manifestName: extensionTarget.manifestName || null,
            runtimeId,
          };
        }
      }
    }

    return extensionTarget;
  }

  if (!discoveredId) {
    discoveredId = resolveExtensionIdFromCache();
  }
  if (!discoveredId && allowAuxTabs) {
    discoveredId = await resolveCaptionArcIdFromExtensionsPage(baseUrl);
  }

  if (discoveredId) {
    const opened = await openExtensionUiTarget(baseUrl, discoveredId);
    if (opened) {
      await sleep(500);
      runtimeTargets = await listTargets(baseUrl);
      const pageTarget = resolveExtensionPageTargetById(runtimeTargets, discoveredId);
      if (pageTarget) {
        return {
          ...pageTarget,
          manifestName: null,
          runtimeId: discoveredId,
        };
      }
      extensionTarget = await resolveCaptionArcExtensionTarget(
        runtimeTargets,
        discoveredId
      );
      if (extensionTarget) {
        return extensionTarget;
      }
    }
  }

  return null;
}

function resolveExtensionIdFromCache() {
  try {
    const result = execSync(
      `powershell.exe -NoProfile -Command "$p='$env:LOCALAPPDATA\\CaptionArc\\chrome-cdp-extension-id.txt'; if (Test-Path $p) { (Get-Content -Path $p -Raw).Trim() }"`,
      {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      }
    ).trim();

    return /^[a-z]{32}$/i.test(result) ? result : null;
  } catch {
    return null;
  }
}

async function readSettingsSnapshot(webSocketDebuggerUrl) {
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

async function patchSettings(webSocketDebuggerUrl, patch) {
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

function valueEquals(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function applyPatchWithRetry(webSocketDebuggerUrl, patch, maxAttempts = 4) {
  let lastResult = null;
  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
    const result = await patchSettings(webSocketDebuggerUrl, patch);
    lastResult = result;
    const persisted = Object.entries(patch).every(([key, value]) =>
      valueEquals(result?.settings?.[key], value)
    );
    if (Boolean(result?.ok) && persisted) {
      return {
        ok: true,
        attempt,
        result,
      };
    }

    await sleep(240);
  }

  return {
    ok: false,
    attempt: Math.max(1, maxAttempts),
    result: lastResult,
  };
}

async function restoreSettingsSnapshot(webSocketDebuggerUrl, snapshot) {
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

async function probeOverlay(webSocketDebuggerUrl) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 300,
    expression: `(() => {
      const lowerText = (document.body?.innerText || "").toLowerCase();
      const codeMatch = window.location.pathname.match(/\\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:[/?#]|$)/i);
      const meetCode = codeMatch?.[1]?.toLowerCase() || null;
      const placeholderCodes = new Set(["aaa-bbbb-ccc", "yyy-yyyy-zzz"]);
      const invalidMeetingCodeDetected =
        lowerText.includes("check your meeting code") ||
        lowerText.includes("enter a valid meeting code") ||
        (meetCode ? placeholderCodes.has(meetCode) : false);
      const invalidMeetingCodeReason = invalidMeetingCodeDetected
        ? (meetCode && placeholderCodes.has(meetCode)
            ? "placeholder-meeting-code"
            : "meet-invalid-code-surface")
        : null;

      const marker = document.querySelector('meta[name="captionarc-injected"]');
      const overlay = document.getElementById("captionarc-overlay");
      const dock = document.getElementById("mc-translation-dock");
      const toggle = document.getElementById("mc-translate-toggle");
      const chat = document.getElementById("mc-footer-chat");
      const chatCapture = document.getElementById("mc-footer-chat-capture");

      return {
        href: window.location.href,
        title: document.title,
        injected: Boolean(marker),
        markerContent: marker?.getAttribute?.("content") || null,
        hasOverlay: Boolean(overlay),
        overlayTheme: overlay?.dataset?.theme || null,
        overlayThemePreference: overlay?.dataset?.themePreference || null,
        overlayOpacity: overlay?.style?.getPropertyValue("--mc-overlay-opacity") || null,
        overlayHiddenClass: Boolean(overlay?.classList?.contains("mc-hidden")),
        overlayAriaHidden: overlay?.getAttribute("aria-hidden") || null,
        overlayClickThrough: Boolean(overlay?.classList?.contains("mc-click-through")),
        overlayTranslationOff: Boolean(overlay?.classList?.contains("translation-off")),
        dockEnabled: dock?.dataset?.enabled || null,
        translateTogglePressed: toggle?.getAttribute("aria-pressed") || null,
        translateToggleActive: Boolean(toggle?.classList?.contains("mc-active")),
        footerChatHidden: chat ? Boolean(chat.hidden) : null,
        footerChatCaptureHidden: chatCapture ? Boolean(chatCapture.hidden) : null,
        invalidMeetingCodeDetected,
        invalidMeetingCodeReason,
      };
    })()`,
  });
}

async function reloadPage(webSocketDebuggerUrl) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 200,
    expression: "window.location.reload(); 'reloaded';",
  });
}

async function maybeResolveOverlayPrompt(webSocketDebuggerUrl) {
  const actions = {
    capture: capturePromptAction,
    continuation: continuationPromptAction,
    sessionEnded: sessionEndedPromptAction,
  };

  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 200,
    expression: `(() => {
      const modes = ${JSON.stringify(actions)};
      const prompt = document.querySelector(".mc-capture-consent");
      if (!prompt) {
        return { hasPrompt: false };
      }

      const normalize = (value) =>
        String(value || "")
          .replace(/\\s+/g, " ")
          .trim()
          .toLowerCase();

      const title = normalize(
        prompt.querySelector(".mc-capture-consent-title")?.textContent || ""
      );
      const body = normalize(
        prompt.querySelector(".mc-capture-consent-body")?.textContent || ""
      );

      const buttons = Array.from(prompt.querySelectorAll("button"));
      const getText = (button) =>
        normalize(button?.textContent || button?.getAttribute?.("aria-label") || "");

      const primary = buttons.find((button) =>
        button.classList.contains("mc-capture-consent-action-primary")
      );
      const secondary = buttons.find((button) =>
        button.classList.contains("mc-capture-consent-action-secondary")
      );

      const byText = (tokens) =>
        buttons.find((button) => {
          const text = getText(button);
          return tokens.some((token) => text.includes(token));
        });

      let kind = "capture-consent";
      if (
        title.includes("continue the previous session") ||
        body.includes("rejoined the same meeting")
      ) {
        kind = "session-continuation";
      } else if (title.includes("session ended")) {
        kind = "session-ended";
      }

      const selectedMode =
        kind === "session-continuation"
          ? modes.continuation
          : kind === "session-ended"
            ? modes.sessionEnded
            : modes.capture;

      let target = null;
      if (kind === "session-continuation") {
        if (selectedMode === "resume") {
          target =
            byText(["continue", "resume"]) ||
            primary ||
            buttons[0] ||
            null;
        } else {
          target =
            byText(["new session", "restart", "not now"]) ||
            secondary ||
            buttons[0] ||
            null;
        }
      } else if (kind === "session-ended") {
        if (selectedMode === "exit") {
          target =
            byText(["close", "exit"]) ||
            secondary ||
            buttons[0] ||
            null;
        } else {
          target =
            byText(["stay here", "stay"]) ||
            primary ||
            buttons[0] ||
            null;
        }
      } else if (selectedMode === "dismiss") {
        target =
          byText(["not now", "dismiss", "close"]) ||
          secondary ||
          buttons[0] ||
          null;
      } else if (selectedMode === "approve") {
        target =
          byText(["enable", "approve"]) ||
          primary ||
          buttons[0] ||
          null;
      } else {
        target = primary || buttons[0] || null;
      }

      if (!target) {
        return {
          hasPrompt: true,
          kind,
          clicked: false,
          title,
          body,
          buttonTexts: buttons.map((button) => getText(button)),
          button: null,
        };
      }

      target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      target.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      return {
        hasPrompt: true,
        kind,
        clicked: true,
        title,
        body,
        buttonTexts: buttons.map((button) => getText(button)),
        button: getText(target),
      };
    })()`,
  });
}

async function settleBlockingOverlayPrompts({
  webSocketDebuggerUrl,
}) {
  const startedAt = Date.now();
  let lastResult = null;
  let seenPrompt = false;
  let handledPrompt = false;

  while (Date.now() - startedAt <= Math.max(1200, promptWaitMs)) {
    const result = await maybeResolveOverlayPrompt(webSocketDebuggerUrl);
    lastResult = result;
    if (!result?.hasPrompt) {
      return {
        ok: true,
        seenPrompt,
        handledPrompt,
        lastResult,
      };
    }

    seenPrompt = true;
    if (result?.clicked) {
      handledPrompt = true;
    }

    await sleep(Math.max(120, promptPollMs));
  }

  return {
    ok: false,
    seenPrompt,
    handledPrompt,
    lastResult,
  };
}

async function verifyStepWithRetry({
  webSocketDebuggerUrl,
  verify,
}) {
  const startedAt = Date.now();
  let lastProbe = null;
  while (Date.now() - startedAt <= Math.max(500, stepVerifyTimeoutMs)) {
    const probe = await probeOverlay(webSocketDebuggerUrl);
    lastProbe = probe;
    if (verify(probe)) {
      return { ok: true, probe };
    }
    await sleep(Math.max(120, stepVerifyIntervalMs));
  }

  return { ok: false, probe: lastProbe };
}

async function resolveExtensionIdFromPage(webSocketDebuggerUrl) {
  const probe = await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 250,
    expression: `(() => {
      const marker = document.querySelector('meta[name="captionarc-injected"]');
      const markerContent = String(marker?.getAttribute("content") || "");
      const markerMatch = markerContent.match(/^([a-z]{32}):\\d+$/i);
      if (markerMatch?.[1]) {
        return markerMatch[1];
      }

      const values = [];
      const nodes = document.querySelectorAll("[src], [href]");
      for (const node of nodes) {
        const src = node.getAttribute?.("src");
        const href = node.getAttribute?.("href");
        if (src) values.push(src);
        if (href) values.push(href);
      }

      const patterns = values
        .map((value) => {
          const match = String(value).match(/^chrome-extension:\\/\\/([a-z]{32})\\//i);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      const unique = Array.from(new Set(patterns));
      return unique.length > 0 ? unique[0] : null;
    })()`,
  });

  return typeof probe === "string" && probe ? probe : null;
}

async function openExtensionUiTarget(baseUrl, extensionId) {
  const candidates = [
    `chrome-extension://${extensionId}/options.html`,
    `chrome-extension://${extensionId}/popup.html`,
    `chrome-extension://${extensionId}/index.html`,
  ];

  for (const candidate of candidates) {
    try {
      await createTarget(baseUrl, candidate);
      return candidate;
    } catch {
      // Try next extension UI candidate.
    }
  }

  return null;
}

function isGoogleMeetHost(href) {
  try {
    const parsed = new URL(href);
    return /(^|\.)meet\.google\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function isGoogleLandingPage(href) {
  try {
    const parsed = new URL(href);
    return /(^|\.)meet\.google\.com$/i.test(parsed.hostname) && /\/landing\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function assertCheck(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const resolved = await resolveCdpEndpoint({ port, waitMs });
  const targetInput = await resolveProviderScenarioUrl({
    provider: "google-meet",
    scenario,
    baseUrl: resolved.baseUrl,
    targets: resolved.targets,
  });

  let pageTarget = null;
  let tabStrategy = "created-new-target";
  if (singleTabMode) {
    pageTarget =
      findPageTargetByUrl(resolved.targets, targetInput.url) ||
      findPageTargetByUrl(await listTargets(resolved.baseUrl), targetInput.url);
    if (pageTarget) {
      tabStrategy = "reused-existing-target";
    }
  }
  if (!pageTarget) {
    pageTarget = await createTarget(resolved.baseUrl, targetInput.url);
  }

  await waitStep("Opening target page for overlay settings smoke");
  await sleep(Math.max(800, applyDelayMs));
  if (tabStrategy === "reused-existing-target") {
    await reloadPage(pageTarget.webSocketDebuggerUrl);
    await sleep(Math.max(900, applyDelayMs));
  }

  let extensionTarget = await resolveExtensionRuntimeTarget(
    resolved.baseUrl,
    pageTarget.webSocketDebuggerUrl
  );
  if (!extensionTarget) {
    throw new Error(
      "Could not find an extension runtime target. Open CaptionArc popup/options once, then retry."
    );
  }

  let snapshot = await readSettingsSnapshot(extensionTarget.webSocketDebuggerUrl);
  const captureStartupBehavior = resolveCaptureStartupBehavior(snapshot);
  let restored = false;

  console.log("Google overlay settings smoke");
  console.log(`Scenario: ${scenario}`);
  console.log(`CDP base URL: ${resolved.baseUrl}`);
  console.log(`Requested URL: ${targetInput.url}`);
  console.log(`URL source: ${targetInput.source}`);
  console.log(`Tab strategy: ${tabStrategy}`);
  console.log(`Aux tabs allowed: ${allowAuxTabs ? "yes" : "no"}`);
  console.log(`captureStartupBehavior: ${captureStartupBehavior}`);
  console.log(`OpenAI key from env: ${smokeOpenAiApiKey ? "yes" : "no"}`);
  if (targetInput.note) {
    console.log(`URL note: ${targetInput.note}`);
  }
  console.log(
    `Extension target: ${extensionTarget.manifestName || "unknown-manifest"} (${extensionTarget.runtimeId || "unknown-id"})`
  );
  console.log("Watch the Google Meet tab now: overlay theme/visibility/chat indicators will toggle.");

  try {
    if (smokeOpenAiApiKey) {
      await waitStep("Applying OpenAI API key from secrets env");
      const openAiKeyPatch = await applyPatchWithRetry(
        extensionTarget.webSocketDebuggerUrl,
        {
          openaiApiKey: smokeOpenAiApiKey,
        },
        3
      );
      assertCheck(
        Boolean(openAiKeyPatch?.ok),
        `OpenAI API key patch failed. Result=${JSON.stringify(openAiKeyPatch?.result)}`
      );
      console.log(
        `OpenAI API key patched for smoke run (length=${smokeOpenAiApiKey.length}).`
      );
    }

    const flattenedSnapshot = flattenSettingsFromSnapshot(snapshot);
    const writableCheck = await applyPatchWithRetry(
      extensionTarget.webSocketDebuggerUrl,
      {
        overlayVisible:
          typeof flattenedSnapshot.overlayVisible === "boolean"
            ? flattenedSnapshot.overlayVisible
            : true,
      },
      1
    );

    if (!writableCheck.ok) {
      const captionArcId = await resolveCaptionArcIdFromExtensionsPage(
        resolved.baseUrl
      );
      if (captionArcId) {
        await openExtensionUiTarget(resolved.baseUrl, captionArcId);
        await sleep(420);
        const refetchedTargets = await listTargets(resolved.baseUrl);
        const extensionPageTarget = resolveExtensionPageTargetById(
          refetchedTargets,
          captionArcId
        );
        if (extensionPageTarget) {
          extensionTarget = {
            ...extensionPageTarget,
            manifestName: extensionTarget.manifestName,
            runtimeId: captionArcId,
          };
          snapshot = await readSettingsSnapshot(
            extensionTarget.webSocketDebuggerUrl
          );
          console.log(
            `Extension target rebound via chrome://extensions: ${captionArcId}`
          );
        }
      }
    }

    await waitStep("Checking and handling overlay startup prompts");
    const promptHandle = await settleBlockingOverlayPrompts({
      webSocketDebuggerUrl: pageTarget.webSocketDebuggerUrl,
    });
    if (promptHandle?.seenPrompt) {
      console.log(
        `Overlay prompt handling: seen=yes handled=${
          promptHandle?.handledPrompt ? "yes" : "no"
        }`
      );
    } else {
      console.log("Overlay prompt handling: no prompt detected.");
    }

    let initialProbe = await probeOverlay(pageTarget.webSocketDebuggerUrl);
    const unresolvedAskPrompt =
      captureStartupBehavior === "ask" &&
      promptHandle?.seenPrompt &&
      !promptHandle?.ok;

    if (unresolvedAskPrompt) {
      if (!allowPromptBypass) {
        throw new Error(
          `Ask-mode startup prompt remained unresolved. Result=${JSON.stringify(
            promptHandle?.lastResult || null
          )}`
        );
      }

      console.log(
        "Ask mode unresolved. Bypass is enabled; temporarily forcing capture startup to 'always' for this smoke run."
      );
      await patchSettings(extensionTarget.webSocketDebuggerUrl, {
        captureStartupBehavior: "always",
        overlayVisible: true,
      });
      await reloadPage(pageTarget.webSocketDebuggerUrl);
      await sleep(Math.max(850, applyDelayMs + 250));
      initialProbe = await probeOverlay(pageTarget.webSocketDebuggerUrl);
    }

    if (!promptHandle?.ok && requirePromptResolution) {
      throw new Error(
        `Blocking overlay prompt remained unresolved. Result=${JSON.stringify(
          promptHandle?.lastResult || null
        )}`
      );
    }

    console.log(`Initial page href: ${initialProbe?.href || "n/a"}`);
    console.log(`Initial marker present: ${initialProbe?.injected ? "yes" : "no"}`);
    console.log(`Initial marker content: ${initialProbe?.markerContent || "n/a"}`);
    console.log(`Initial overlay present: ${initialProbe?.hasOverlay ? "yes" : "no"}`);
    console.log(
      `Initial invalid meeting code surface: ${
        initialProbe?.invalidMeetingCodeDetected ? "yes" : "no"
      }`
    );

    const markerRuntimeId = parseRuntimeIdFromMarker(initialProbe?.markerContent);
    if (
      markerRuntimeId &&
      markerRuntimeId !== extensionTarget.runtimeId
    ) {
      await openExtensionUiTarget(resolved.baseUrl, markerRuntimeId);
      await sleep(350);
      const markerTargets = await listTargets(resolved.baseUrl);
      const markerTargetPage = resolveExtensionPageTargetById(
        markerTargets,
        markerRuntimeId
      );
      const markerFallbackTarget =
        markerTargetPage ||
        (await resolveCaptionArcExtensionTarget(markerTargets, markerRuntimeId));

      if (markerFallbackTarget) {
        extensionTarget = {
          ...markerFallbackTarget,
          manifestName: extensionTarget.manifestName,
          runtimeId: markerRuntimeId,
        };
        snapshot = await readSettingsSnapshot(extensionTarget.webSocketDebuggerUrl);
        console.log(
          `Extension target rebound from page marker id: ${markerRuntimeId}`
        );
      }
    }

    if (initialProbe?.overlayHiddenClass) {
      await applyPatchWithRetry(extensionTarget.webSocketDebuggerUrl, {
        overlayVisible: true,
      });
      await sleep(Math.max(450, applyDelayMs));
      initialProbe = await probeOverlay(pageTarget.webSocketDebuggerUrl);
      console.log("Initial overlay was hidden by settings; forced overlayVisible=true for smoke run.");
    }

    const shouldRetryWithMeetNew =
      !initialProbe?.injected ||
      !isGoogleMeetHost(initialProbe?.href || "") ||
      !initialProbe?.hasOverlay ||
      isGoogleLandingPage(initialProbe?.href || "");

    if (shouldRetryWithMeetNew) {
      console.log(
        "Initial page is not a usable Meet runtime surface. Retrying once with https://meet.google.com/new ..."
      );
      const retryTarget = await createTarget(resolved.baseUrl, "https://meet.google.com/new");
      await sleep(Math.max(900, applyDelayMs));
      pageTarget = retryTarget;
      initialProbe = await probeOverlay(retryTarget.webSocketDebuggerUrl);
      const retryPromptResult = await settleBlockingOverlayPrompts({
        webSocketDebuggerUrl: retryTarget.webSocketDebuggerUrl,
      });
      if (!retryPromptResult.ok && requirePromptResolution) {
        throw new Error(
          `Blocking prompt on retry target remained unresolved. Result=${JSON.stringify(
            retryPromptResult.lastResult || null
          )}`
        );
      }
      console.log(`Retry page href: ${initialProbe?.href || "n/a"}`);
      console.log(`Retry marker present: ${initialProbe?.injected ? "yes" : "no"}`);
      console.log(`Retry overlay present: ${initialProbe?.hasOverlay ? "yes" : "no"}`);
    }

    assertCheck(
      initialProbe?.injected,
      `Initial probe failed: content-script marker not found. Probe=${JSON.stringify(initialProbe)}`
    );
    assertCheck(
      initialProbe?.hasOverlay,
      `Initial probe failed: overlay not found. Probe=${JSON.stringify(initialProbe)}`
    );
    assertCheck(
      !initialProbe?.invalidMeetingCodeDetected,
      `Initial probe failed: invalid Google Meet code surface detected (${initialProbe?.invalidMeetingCodeReason || "unknown"}). Probe=${JSON.stringify(initialProbe)}`
    );
    const sequence = [
      {
        label: "overlayVisible -> true (baseline)",
        patch: { overlayVisible: true },
        verify: (probe) =>
          probe.overlayHiddenClass === false &&
          probe.overlayAriaHidden === "false",
      },
      {
        label: "appearance -> dark",
        patch: { appearance: "dark" },
        verify: (probe) => probe.overlayTheme === "dark",
      },
      {
        label: "overlayOpacity -> 72",
        patch: { overlayOpacity: 72 },
        verify: (probe) => probe.overlayOpacity === "72%",
      },
      {
        label: "overlayClickThrough -> true",
        patch: { overlayClickThrough: true },
        verify: (probe) => probe.overlayClickThrough === true,
      },
      {
        label: "overlayVisible -> false",
        patch: { overlayVisible: false },
        verify: (probe) =>
          probe.overlayHiddenClass === true && probe.overlayAriaHidden === "true",
      },
      {
        label: "overlayVisible -> true / overlayClickThrough -> false",
        patch: { overlayVisible: true, overlayClickThrough: false },
        verify: (probe) =>
          probe.overlayHiddenClass === false &&
          probe.overlayAriaHidden === "false" &&
          probe.overlayClickThrough === false,
      },
      {
        label: "translationEnabled -> true",
        patch: { translationEnabled: true },
        verify: (probe) =>
          probe.overlayTranslationOff === false &&
          probe.dockEnabled === "true" &&
          probe.translateTogglePressed === "true" &&
          probe.translateToggleActive === true,
      },
      {
        label: "translationEnabled -> false",
        patch: { translationEnabled: false },
        verify: (probe) =>
          probe.overlayTranslationOff === true &&
          probe.dockEnabled === "false" &&
          probe.translateTogglePressed === "false" &&
          probe.translateToggleActive === false,
      },
      {
        label: "storeMeetingChat -> false",
        patch: { storeMeetingChat: false },
        verify: (probe) =>
          probe.footerChatHidden === true && probe.footerChatCaptureHidden === true,
      },
      {
        label: "storeMeetingChat -> true",
        patch: { storeMeetingChat: true },
        verify: (probe) =>
          probe.footerChatHidden === false && probe.footerChatCaptureHidden === false,
      },
    ];

    for (const step of sequence) {
      await waitStep(`Applying step: ${step.label}`);
      const promptBeforeStep = await settleBlockingOverlayPrompts({
        webSocketDebuggerUrl: pageTarget.webSocketDebuggerUrl,
      });
      if (!promptBeforeStep.ok && requirePromptResolution) {
        throw new Error(
          `Blocking prompt before step '${step.label}' was unresolved. Result=${JSON.stringify(
            promptBeforeStep.lastResult || null
          )}`
        );
      }
      const patchApply = await applyPatchWithRetry(
        extensionTarget.webSocketDebuggerUrl,
        step.patch
      );
      assertCheck(
        Boolean(patchApply?.ok),
        `Settings patch failed: ${step.label}. Result=${JSON.stringify(patchApply?.result)}`
      );
      await sleep(applyDelayMs);
      const verifyResult = await verifyStepWithRetry({
        webSocketDebuggerUrl: pageTarget.webSocketDebuggerUrl,
        verify: step.verify,
      });
      assertCheck(
        verifyResult.ok,
        `Step failed: ${step.label}. Probe=${JSON.stringify(verifyResult.probe)}`
      );
      console.log(`PASS: ${step.label}`);
    }
  } finally {
    await restoreSettingsSnapshot(extensionTarget.webSocketDebuggerUrl, snapshot);
    await sleep(applyDelayMs);
    restored = true;
    console.log(`Settings restored: ${restored ? "yes" : "no"}`);
  }

  console.log("Overlay settings smoke result: PASS");
} catch (error) {
  console.error(
    `Overlay settings smoke failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
}
