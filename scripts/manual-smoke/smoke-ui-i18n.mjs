#!/usr/bin/env node

import { createTarget, evaluateInTarget, resolveCdpEndpoint } from "./lib/cdp-runtime.mjs";
import {
  ensureExtensionPageTarget,
  listTargets,
  resolveCaptionArcExtensionTarget,
} from "./lib/extension-target.mjs";
import {
  getDiagnosticsPayloadFromRuntime,
  runWithTemporaryDiagnosticsConfig,
} from "./lib/diagnostics-runtime.mjs";
import {
  flattenSettingsFromSnapshot,
  patchSettings,
  readSettingsSnapshot,
  restoreSettingsSnapshot,
} from "./lib/settings-storage.mjs";
import { isExpectedProviderHost } from "./lib/provider-url.mjs";

const providerArg = process.argv[2] || process.env.SMOKE_PROVIDER || "google-meet";
const scenarioArg = process.argv[3] || process.env.SMOKE_SCENARIO || "meeting";
const portArg = process.argv[4] || process.env.SMOKE_PORT || "9222";

const provider = String(providerArg).trim().toLowerCase();
const scenario = String(scenarioArg).trim().toLowerCase();
const port = Number.parseInt(portArg, 10);
const verifyTimeoutMs = Number.parseInt(
  process.env.SMOKE_I18N_VERIFY_TIMEOUT_MS || "14000",
  10
);
const verifyIntervalMs = Number.parseInt(
  process.env.SMOKE_I18N_VERIFY_INTERVAL_MS || "350",
  10
);
const waitAfterPatchMs = Number.parseInt(
  process.env.SMOKE_I18N_WAIT_AFTER_PATCH_MS || "650",
  10
);

const SUPPORTED_UI_LOCALES = [
  "en",
  "fa",
  "ar",
  "es",
  "fr",
  "de",
  "pt",
  "ru",
  "hi",
  "zh",
  "ja",
  "ko",
];

if (!Number.isFinite(port) || port <= 0) {
  console.error(
    "Invalid port. Usage: node scripts/manual-smoke/smoke-ui-i18n.mjs <provider> <scenario> [port]"
  );
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function waitStep(label) {
  console.log(`STEP: ${label}`);
  await sleep(Number.parseInt(process.env.SMOKE_STEP_PAUSE_MS || "700", 10));
}

function countNonAscii(value) {
  return (String(value || "").match(/[^\u0000-\u007f]/g) || []).length;
}

function resolveExpectedLocaleFromBrowserLanguage(browserLanguage) {
  const normalized = String(browserLanguage || "")
    .trim()
    .replace(/_/g, "-")
    .toLowerCase();
  const [baseLocale] = normalized.split("-");

  return SUPPORTED_UI_LOCALES.includes(baseLocale) ? baseLocale : "en";
}

function getExpectedDirection(locale) {
  return locale === "fa" || locale === "ar" ? "rtl" : "ltr";
}

function sanitizeTextSample(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function parseRuntimeIdFromMarker(markerContent) {
  const match = String(markerContent || "").match(/^([a-z]{32})(?::\d+)?$/i);
  return match?.[1] || null;
}

function findProviderTarget(targets, expectedProvider) {
  return (
    targets.find(
      (target) =>
        target?.type === "page" &&
        typeof target?.webSocketDebuggerUrl === "string" &&
        isExpectedProviderHost(expectedProvider, target?.url || "")
    ) || null
  );
}

async function probeExtensionPage(webSocketDebuggerUrl) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 250,
    expression: `(() => {
      const bodyText = (document.body?.innerText || "").replace(/\\s+/g, " ").trim();
      const countNonAscii = (value) => ((String(value || "").match(/[^\\u0000-\\u007f]/g)) || []).length;
      return {
        href: window.location.href,
        title: document.title,
        lang: document.documentElement.lang || null,
        dir: document.documentElement.dir || null,
        bodyTextSample: bodyText.slice(0, 180),
        bodyNonAsciiCount: countNonAscii(bodyText),
      };
    })()`,
  });
}

async function probeProviderOverlay(webSocketDebuggerUrl) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 250,
    expression: `(() => {
      const countNonAscii = (value) => ((String(value || "").match(/[^\\u0000-\\u007f]/g)) || []).length;
      const marker = document.querySelector('meta[name="captionarc-injected"]');
      const overlay = document.getElementById("captionarc-overlay");
      const headerTitle = document.getElementById("mc-header-title")?.textContent || "";
      const subtitle = document.getElementById("mc-header-subtitle-label")?.textContent || "";
      const combined = [headerTitle, subtitle].filter(Boolean).join(" ");
      return {
        href: window.location.href,
        injected: Boolean(marker),
        markerContent: marker?.content || null,
        overlayPresent: Boolean(overlay),
        overlayLang: overlay?.lang || null,
        overlayDir: overlay?.dir || null,
        headerTitle: headerTitle.trim(),
        subtitle: subtitle.trim(),
        textSample: combined.replace(/\\s+/g, " ").trim().slice(0, 180),
        nonAsciiCount: countNonAscii(combined),
      };
    })()`,
  });
}

async function waitForProbe(label, probeFn, verifyFn) {
  const startedAt = Date.now();
  let lastProbe = null;

  while (Date.now() - startedAt <= verifyTimeoutMs) {
    lastProbe = await probeFn();
    if (verifyFn(lastProbe)) {
      return lastProbe;
    }
    await sleep(verifyIntervalMs);
  }

  throw new Error(`Timed out while waiting for ${label}. Last probe=${JSON.stringify(lastProbe)}`);
}

async function openProviderTarget(baseUrl, expectedProvider) {
  const targets = await listTargets(baseUrl);
  const existing = findProviderTarget(targets, expectedProvider);
  if (existing) {
    return existing;
  }

  throw new Error(
    `No active provider target found for ${expectedProvider}. Run provider smoke setup before the i18n smoke.`
  );
}

async function applyUiLanguageAndVerify({
  label,
  value,
  expectedLocale,
  optionsTarget,
  popupTarget,
  historyTarget,
  providerTarget,
  requireNonAscii = false,
}) {
  await waitStep(`Applying ${label}`);

  const patchResult = await patchSettings(optionsTarget.webSocketDebuggerUrl, {
    uiLanguage: value,
  });
  const flattened = flattenSettingsFromSnapshot(patchResult);
  if (flattened.uiLanguage !== value) {
    throw new Error(
      `Failed to persist uiLanguage=${value}. Flattened=${JSON.stringify(flattened)}`
    );
  }

  await sleep(waitAfterPatchMs);

  const expectedDirection = getExpectedDirection(expectedLocale);
  const extensionVerifier = (probe) =>
    probe?.lang === expectedLocale &&
    probe?.dir === expectedDirection &&
    probe?.title &&
    (!requireNonAscii || probe.bodyNonAsciiCount > 8);
  const popupVerifier = (probe) =>
    probe?.lang === expectedLocale &&
    probe?.dir === expectedDirection &&
    (!requireNonAscii || probe.bodyNonAsciiCount > 8);
  const overlayVerifier = (probe) =>
    probe?.overlayPresent === true &&
    probe?.overlayLang === expectedLocale &&
    probe?.overlayDir === expectedDirection &&
    probe?.headerTitle &&
    (!requireNonAscii || probe.nonAsciiCount > 2);

  const [optionsProbe, popupProbe, historyProbe, overlayProbe] = await Promise.all([
    waitForProbe(`${label} on options page`, () => probeExtensionPage(optionsTarget.webSocketDebuggerUrl), extensionVerifier),
    waitForProbe(`${label} on popup page`, () => probeExtensionPage(popupTarget.webSocketDebuggerUrl), popupVerifier),
    waitForProbe(`${label} on meeting history page`, () => probeExtensionPage(historyTarget.webSocketDebuggerUrl), extensionVerifier),
    waitForProbe(`${label} on provider overlay`, () => probeProviderOverlay(providerTarget.webSocketDebuggerUrl), overlayVerifier),
  ]);

  console.log(
    `PASS: ${label} -> options=${optionsProbe.lang}/${optionsProbe.dir}, popup=${popupProbe.lang}/${popupProbe.dir}, history=${historyProbe.lang}/${historyProbe.dir}, overlay=${overlayProbe.overlayLang}/${overlayProbe.overlayDir}`
  );
  console.log(
    `Samples: options="${sanitizeTextSample(optionsProbe.bodyTextSample)}" popup="${sanitizeTextSample(popupProbe.bodyTextSample)}" overlay="${sanitizeTextSample(overlayProbe.textSample)}"`
  );
}

let smokeFailureMessage = "";

try {
  const resolved = await resolveCdpEndpoint({ port });

  await waitStep("Resolving active provider and extension targets");
  const providerTarget = await openProviderTarget(resolved.baseUrl, provider);
  const extensionTarget = await resolveCaptionArcExtensionTarget({
    baseUrl: resolved.baseUrl,
  });

  if (!extensionTarget?.runtimeId) {
    throw new Error("Could not resolve CaptionArc runtime id for i18n smoke.");
  }

  const initialProviderProbe = await waitForProbe(
    "provider marker injection",
    () => probeProviderOverlay(providerTarget.webSocketDebuggerUrl),
    (probe) => Boolean(probe?.injected && probe?.markerContent)
  );
  const markerRuntimeId = parseRuntimeIdFromMarker(
    initialProviderProbe?.markerContent
  );
  const boundRuntimeId = markerRuntimeId || extensionTarget.runtimeId;

  if (markerRuntimeId && markerRuntimeId !== extensionTarget.runtimeId) {
    console.log(
      `Rebinding i18n smoke runtime from ${extensionTarget.runtimeId} to provider marker runtime ${markerRuntimeId}.`
    );
  }

  const optionsTarget = await ensureExtensionPageTarget({
    baseUrl: resolved.baseUrl,
    extensionId: boundRuntimeId,
    pagePath: "options.html",
  });
  const popupTarget = await ensureExtensionPageTarget({
    baseUrl: resolved.baseUrl,
    extensionId: boundRuntimeId,
    pagePath: "popup.html",
  });
  const historyTarget = await ensureExtensionPageTarget({
    baseUrl: resolved.baseUrl,
    extensionId: boundRuntimeId,
    pagePath: "meeting-history.html",
  });

  await runWithTemporaryDiagnosticsConfig({
    baseUrl: resolved.baseUrl,
    expectedRuntimeId: boundRuntimeId,
    minLevel: process.env.SMOKE_DIAGNOSTICS_MIN_LEVEL || "trace",
    clearExisting: true,
    operation: async () => {
      console.log(
        `I18n smoke bound runtime: ${boundRuntimeId} (provider marker: ${markerRuntimeId || "none"})`
      );

      const browserLanguage = await evaluateInTarget({
        webSocketDebuggerUrl: optionsTarget.webSocketDebuggerUrl,
        delayMs: 150,
        expression: "navigator.language",
      });
      const expectedFallbackLocale =
        resolveExpectedLocaleFromBrowserLanguage(browserLanguage);

      const originalSnapshot = await readSettingsSnapshot(
        optionsTarget.webSocketDebuggerUrl
      );

      try {
        await applyUiLanguageAndVerify({
          label: "uiLanguage -> fa",
          value: "fa",
          expectedLocale: "fa",
          optionsTarget,
          popupTarget,
          historyTarget,
          providerTarget,
          requireNonAscii: true,
        });

        await applyUiLanguageAndVerify({
          label: "uiLanguage -> ja",
          value: "ja",
          expectedLocale: "ja",
          optionsTarget,
          popupTarget,
          historyTarget,
          providerTarget,
          requireNonAscii: true,
        });

        await applyUiLanguageAndVerify({
          label: "uiLanguage -> invalid fallback",
          value: "invalid-locale",
          expectedLocale: expectedFallbackLocale,
          optionsTarget,
          popupTarget,
          historyTarget,
          providerTarget,
          requireNonAscii: expectedFallbackLocale !== "en",
        });

        await applyUiLanguageAndVerify({
          label: "uiLanguage -> en",
          value: "en",
          expectedLocale: "en",
          optionsTarget,
          popupTarget,
          historyTarget,
          providerTarget,
          requireNonAscii: false,
        });
      } finally {
        await restoreSettingsSnapshot(
          optionsTarget.webSocketDebuggerUrl,
          originalSnapshot
        ).catch(() => null);
      }

      const diagnosticsPayload = await getDiagnosticsPayloadFromRuntime({
        baseUrl: resolved.baseUrl,
        expectedRuntimeId: boundRuntimeId,
        query: {
          feature: "ui-i18n",
          minLevel: "trace",
          limit: 400,
        },
      });

      const events = Array.isArray(diagnosticsPayload?.events)
        ? diagnosticsPayload.events
        : [];
      const levelsSeen = [...new Set(events.map((event) => event?.level).filter(Boolean))];
      const runtimesSeen = [...new Set(events.map((event) => event?.runtime).filter(Boolean))];
      const messagesSeen = [...new Set(events.map((event) => event?.message).filter(Boolean))];

      console.log(`I18n diagnostics levels seen: ${levelsSeen.join(", ") || "none"}`);
      console.log(`I18n diagnostics runtimes seen: ${runtimesSeen.join(", ") || "none"}`);
      console.log(`I18n diagnostics event count: ${events.length}`);

      for (const level of ["trace", "debug", "info"]) {
        if (!levelsSeen.includes(level)) {
          throw new Error(`Expected i18n diagnostics to include level '${level}'.`);
        }
      }

      for (const runtime of ["options", "popup", "meeting-history"]) {
        if (!runtimesSeen.includes(runtime)) {
          throw new Error(
            `Expected i18n diagnostics to include runtime '${runtime}'. Runtimes=${JSON.stringify(runtimesSeen)}`
          );
        }
      }

      if (runtimesSeen.includes("content")) {
        console.log("I18n diagnostics content runtime observed in payload.");
      } else {
        console.log(
          "I18n diagnostics content runtime was not present in the final payload. Content-side behavior was still verified through overlay locale transitions, and content diagnostics contracts cover the runtime logger path."
        );
      }

      for (const message of [
        "ui_locale_set_requested",
        "ui_locale_set_completed",
        "ui_locale_attributes_applied",
      ]) {
        if (!messagesSeen.includes(message)) {
          throw new Error(
            `Expected i18n diagnostics to include message '${message}'. Messages=${JSON.stringify(messagesSeen)}`
          );
        }
      }

      if (
        messagesSeen.includes("ui_locale_invalid_setting_fallback") ||
        messagesSeen.includes("ui_locale_settings_lookup_failed")
      ) {
        console.log("I18n diagnostics fallback warning observed.");
      } else {
        console.log(
          "I18n diagnostics fallback warning was not emitted during DLS. Locale fallback was still verified through end-to-end UI switching, and warn/error paths remain covered by contract tests."
        );
      }

      console.log("Localization DLS result: PASS");
      console.log(`Provider: ${provider}`);
      console.log(`Scenario: ${scenario}`);
      console.log(`Fallback locale from browser language: ${expectedFallbackLocale}`);
    },
  });
} catch (error) {
  smokeFailureMessage = error instanceof Error ? error.message : String(error);
}

if (smokeFailureMessage) {
  console.error(`Localization DLS failed: ${smokeFailureMessage}`);
  process.exit(1);
}
