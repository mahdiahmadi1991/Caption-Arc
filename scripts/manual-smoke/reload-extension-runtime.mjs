#!/usr/bin/env node

import { execSync } from "node:child_process";
import {
  createTarget,
  evaluateInTarget,
  resolveCdpEndpoint,
} from "./lib/cdp-runtime.mjs";

const portArg = process.argv[2] || process.env.SMOKE_PORT || "9222";
const port = Number.parseInt(portArg, 10);
const waitMs = Number.parseInt(process.env.CDP_WAIT_MS || "6000", 10);
const providerReloadEnabled = process.env.RELOAD_PROVIDER_TABS === "1";
const extensionNamePattern = new RegExp(
  process.env.EXTENSION_NAME_PATTERN || "caption.?arc",
  "i"
);

if (!Number.isFinite(port) || port <= 0) {
  console.error(
    "Invalid port. Usage: node scripts/manual-smoke/reload-extension-runtime.mjs [port]"
  );
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function readExtensionIdFromCache() {
  const envCandidate = String(
    process.env.SMOKE_EXTENSION_ID ||
      process.env.CAPTIONARC_EXTENSION_ID ||
      ""
  ).trim();
  if (/^[a-z]{32}$/i.test(envCandidate)) {
    return envCandidate;
  }

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

async function listTargets(baseUrl) {
  const response = await fetch(`${baseUrl}/json/list`);
  if (!response.ok) {
    throw new Error(`Failed to list targets: HTTP ${response.status}`);
  }
  return await response.json();
}

async function evaluateInExtensionTarget({
  webSocketDebuggerUrl,
  expression,
  awaitPromise = false,
}) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    expression,
    delayMs: 80,
    enablePage: false,
    awaitPromise,
  });
}

async function probeTargetManifest(target) {
  try {
    const probe = await evaluateInExtensionTarget({
      webSocketDebuggerUrl: target.webSocketDebuggerUrl,
      expression: `(() => {
        try {
          const manifest = chrome?.runtime?.getManifest?.();
          return {
            id: chrome?.runtime?.id || null,
            name: manifest?.name || null,
          };
        } catch (error) {
          return {
            id: null,
            name: null,
            error: String(error),
          };
        }
      })()`,
    });
    return probe || null;
  } catch {
    return null;
  }
}

function parseTargetExtensionId(urlValue) {
  const match = String(urlValue || "").match(/^chrome-extension:\/\/([a-z]{32})\//i);
  return match?.[1] || null;
}

async function openExtensionUiTarget(baseUrl, extensionId) {
  const candidates = [
    `chrome-extension://${extensionId}/options.html`,
    `chrome-extension://${extensionId}/popup.html`,
    `chrome-extension://${extensionId}/index.html`,
  ];

  for (const url of candidates) {
    try {
      await createTarget(baseUrl, url);
      return true;
    } catch {
      // Try next extension page.
    }
  }

  return false;
}

async function resolveRuntimeTarget(baseUrl, expectedId = null) {
  let targets = await listTargets(baseUrl);
  let extensionTargets = targets.filter(
    (target) =>
      typeof target?.url === "string" &&
      target.url.startsWith("chrome-extension://") &&
      typeof target?.webSocketDebuggerUrl === "string"
  );

  for (const target of extensionTargets) {
    const probe = await probeTargetManifest(target);
    const manifestName = String(probe?.name || "");
    const runtimeId = String(probe?.id || "");
    if (
      extensionNamePattern.test(manifestName) ||
      (expectedId && runtimeId.toLowerCase() === expectedId.toLowerCase())
    ) {
      return {
        target,
        runtimeId: runtimeId || parseTargetExtensionId(target.url) || expectedId,
        manifestName: probe?.name || null,
      };
    }
  }

  if (expectedId) {
    const matchedByUrlId = extensionTargets.find((target) => {
      const targetId = parseTargetExtensionId(target.url);
      return targetId && targetId.toLowerCase() === expectedId.toLowerCase();
    });
    if (matchedByUrlId) {
      return {
        target: matchedByUrlId,
        runtimeId: parseTargetExtensionId(matchedByUrlId.url) || expectedId,
        manifestName: null,
      };
    }
  }

  // Runtime manifest probe can fail transiently on service-worker targets.
  // If all extension targets belong to one runtime id, use that as fallback.
  const extensionIds = Array.from(
    new Set(
      extensionTargets.map((target) => parseTargetExtensionId(target.url)).filter(Boolean)
    )
  );
  if (extensionIds.length === 1) {
    const runtimeId = extensionIds[0];
    const preferredTarget =
      extensionTargets.find((target) => target?.type === "service_worker") ||
      extensionTargets[0];
    return {
      target: preferredTarget,
      runtimeId,
      manifestName: null,
    };
  }

  if (expectedId) {
    const opened = await openExtensionUiTarget(baseUrl, expectedId);
    if (opened) {
      await sleep(400);
      targets = await listTargets(baseUrl);
      extensionTargets = targets.filter(
        (target) =>
          typeof target?.url === "string" &&
          target.url.startsWith("chrome-extension://") &&
          typeof target?.webSocketDebuggerUrl === "string"
      );
      const matched = extensionTargets.find((target) => {
        const targetId = parseTargetExtensionId(target.url);
        return targetId && targetId.toLowerCase() === expectedId.toLowerCase();
      });

      if (matched) {
        const probe = await probeTargetManifest(matched);
        return {
          target: matched,
          runtimeId: probe?.id || parseTargetExtensionId(matched.url) || expectedId,
          manifestName: probe?.name || null,
        };
      }
    }
  }

  return null;
}

function isProviderHost(urlValue) {
  try {
    const hostname = new URL(urlValue).hostname.toLowerCase();
    return (
      hostname === "meet.google.com" ||
      hostname.endsWith(".meet.google.com") ||
      hostname === "teams.live.com" ||
      hostname.endsWith(".teams.live.com") ||
      hostname === "zoom.us" ||
      hostname.endsWith(".zoom.us") ||
      hostname === "app.zoom.us" ||
      hostname.endsWith(".app.zoom.us")
    );
  } catch {
    return false;
  }
}

async function reloadProviderPages(baseUrl) {
  if (!providerReloadEnabled) {
    return 0;
  }

  const targets = await listTargets(baseUrl);
  const providerPages = targets.filter(
    (target) =>
      target?.type === "page" &&
      typeof target?.url === "string" &&
      typeof target?.webSocketDebuggerUrl === "string" &&
      isProviderHost(target.url)
  );

  for (const page of providerPages) {
    try {
      await evaluateInTarget({
        webSocketDebuggerUrl: page.webSocketDebuggerUrl,
        expression: "window.location.reload(); 'reloaded';",
        delayMs: 80,
      });
    } catch {
      // The page may be mid-navigation; ignore and continue.
    }
  }

  return providerPages.length;
}

async function resolveChromeExtensionsTarget(baseUrl) {
  const targets = await listTargets(baseUrl);
  return (
    targets.find(
      (target) =>
        target?.type === "page" &&
        typeof target?.url === "string" &&
        target.url.startsWith("chrome://extensions")
    ) || null
  );
}

async function reloadFromChromeExtensionsPage({
  baseUrl,
  expectedId = null,
} = {}) {
  const extensionsPage = await resolveChromeExtensionsTarget(baseUrl);
  if (!extensionsPage?.webSocketDebuggerUrl) {
    return null;
  }

  const result = await evaluateInTarget({
    webSocketDebuggerUrl: extensionsPage.webSocketDebuggerUrl,
    awaitPromise: false,
    delayMs: 120,
    expression: `(() => {
      const manager = document.querySelector('extensions-manager');
      const managerRoot = manager?.shadowRoot || null;
      const itemList = managerRoot?.querySelector('extensions-item-list');
      const listRoot = itemList?.shadowRoot || null;
      const items = Array.from(listRoot?.querySelectorAll('extensions-item') || []);
      const expectedId = ${JSON.stringify(expectedId)};
      const pattern = ${extensionNamePattern};

      const normalizedItems = items.map((item) => {
        const root = item.shadowRoot;
        return {
          id: item.getAttribute('id') || null,
          name: root?.querySelector('#name')?.textContent?.trim() || '',
          reloadButton:
            root?.querySelector('#dev-reload-button, [id="dev-reload-button"]') || null,
        };
      });

      const matched =
        normalizedItems.find((item) => expectedId && item.id === expectedId) ||
        normalizedItems.find((item) => pattern.test(item.name)) ||
        null;

      if (!matched) {
        return { ok: false, reason: 'extension-item-not-found' };
      }

      if (!(matched.reloadButton instanceof HTMLElement)) {
        return {
          ok: false,
          reason: 'reload-button-not-found',
          id: matched.id,
          name: matched.name,
        };
      }

      matched.reloadButton.click();
      return {
        ok: true,
        id: matched.id,
        name: matched.name,
        via: 'chrome://extensions',
      };
    })()`,
  });

  return result?.ok ? result : null;
}

try {
  const resolved = await resolveCdpEndpoint({ port, waitMs });
  const expectedId = readExtensionIdFromCache();
  const runtime = await resolveRuntimeTarget(resolved.baseUrl, expectedId);

  const reloadResult = runtime
    ? await evaluateInExtensionTarget({
        webSocketDebuggerUrl: runtime.target.webSocketDebuggerUrl,
        expression: `(() => {
          const id = chrome?.runtime?.id || null;
          if (!chrome?.runtime?.reload) {
            return { ok: false, id, error: "chrome.runtime.reload unavailable" };
          }
          setTimeout(() => chrome.runtime.reload(), 0);
          return { ok: true, id, via: "extension-runtime" };
        })()`,
      })
    : await reloadFromChromeExtensionsPage({
        baseUrl: resolved.baseUrl,
        expectedId,
      });

  if (!reloadResult?.ok) {
    throw new Error(
      runtime
        ? `Extension reload evaluate failed: ${JSON.stringify(reloadResult)}`
        : "Could not resolve CaptionArc extension runtime target for reload."
    );
  }

  await sleep(1200);
  const pageReloadCount = await reloadProviderPages(resolved.baseUrl);

  console.log("Extension runtime reload: PASS");
  console.log(`CDP base URL: ${resolved.baseUrl}`);
  console.log(`Extension ID: ${reloadResult.id || runtime.runtimeId || "unknown"}`);
  console.log(`Manifest: ${runtime?.manifestName || reloadResult.name || "unknown"}`);
  console.log(`Reload path: ${reloadResult.via || "unknown"}`);
  console.log(`Provider tabs reloaded: ${pageReloadCount}`);
} catch (error) {
  console.error(
    `Extension runtime reload failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
}
