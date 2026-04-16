#!/usr/bin/env node

import { execSync } from "node:child_process";
import { createTarget, evaluateInTarget } from "./cdp-runtime.mjs";

export async function listTargets(baseUrl) {
  const response = await fetch(`${baseUrl}/json/list`);
  if (!response.ok) {
    throw new Error(`Failed to list targets: HTTP ${response.status}`);
  }
  return await response.json();
}

export function parseTargetExtensionId(urlValue) {
  const match = String(urlValue || "").match(/^chrome-extension:\/\/([a-z]{32})\//i);
  return match?.[1] || null;
}

export function readExtensionIdFromCache() {
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

export async function evaluateInExtensionTarget({
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

export async function openExtensionUiTarget(baseUrl, extensionId) {
  const candidates = [
    `chrome-extension://${extensionId}/options.html`,
    `chrome-extension://${extensionId}/popup.html`,
    `chrome-extension://${extensionId}/index.html`,
  ];

  for (const candidate of candidates) {
    try {
      await createTarget(baseUrl, candidate);
      return true;
    } catch {
      // Try next extension URL.
    }
  }

  return false;
}

export function buildExtensionPageUrl(extensionId, pagePath) {
  const normalizedPagePath = String(pagePath || "")
    .replace(/^\/+/, "")
    .trim();

  if (!normalizedPagePath) {
    throw new Error("pagePath is required to build an extension page URL.");
  }

  return `chrome-extension://${extensionId}/${normalizedPagePath}`;
}

export function resolveExtensionPageTargetByPath(
  targets,
  extensionId,
  pagePath
) {
  const expectedUrl = buildExtensionPageUrl(extensionId, pagePath);

  return (
    targets.find(
      (target) =>
        target?.type === "page" &&
        typeof target?.webSocketDebuggerUrl === "string" &&
        String(target?.url || "") === expectedUrl
    ) || null
  );
}

export async function ensureExtensionPageTarget({
  baseUrl,
  extensionId,
  pagePath,
} = {}) {
  if (!baseUrl || !extensionId || !pagePath) {
    throw new Error("baseUrl, extensionId, and pagePath are required.");
  }

  const existingTargets = await listTargets(baseUrl);
  const existing = resolveExtensionPageTargetByPath(
    existingTargets,
    extensionId,
    pagePath
  );
  if (existing) {
    return existing;
  }

  await createTarget(baseUrl, buildExtensionPageUrl(extensionId, pagePath));

  const refreshedTargets = await listTargets(baseUrl);
  const resolved = resolveExtensionPageTargetByPath(
    refreshedTargets,
    extensionId,
    pagePath
  );

  if (!resolved) {
    throw new Error(
      `Could not resolve extension page target for ${buildExtensionPageUrl(extensionId, pagePath)}.`
    );
  }

  return resolved;
}

async function probeManifest(target) {
  try {
    return await evaluateInExtensionTarget({
      webSocketDebuggerUrl: target.webSocketDebuggerUrl,
      expression: `(() => {
        try {
          const manifest = chrome?.runtime?.getManifest?.();
          return {
            id: chrome?.runtime?.id || null,
            name: manifest?.name || null,
          };
        } catch (error) {
          return { id: null, name: null, error: String(error) };
        }
      })()`,
    });
  } catch {
    return null;
  }
}

export async function resolveCaptionArcExtensionTarget({
  baseUrl,
  expectedId = readExtensionIdFromCache(),
  namePattern = /caption.?arc/i,
  allowNameFallback = true,
} = {}) {
  let targets = await listTargets(baseUrl);
  let extensionTargets = targets.filter(
    (target) =>
      typeof target?.url === "string" &&
      target.url.startsWith("chrome-extension://") &&
      typeof target?.webSocketDebuggerUrl === "string"
  );

  if (expectedId) {
    const byExpectedId = extensionTargets.find((target) => {
      const targetId = parseTargetExtensionId(target.url);
      return targetId && targetId.toLowerCase() === expectedId.toLowerCase();
    });
    if (byExpectedId) {
      const probe = await probeManifest(byExpectedId);
      return {
        ...byExpectedId,
        runtimeId: probe?.id || parseTargetExtensionId(byExpectedId.url) || expectedId,
        manifestName: probe?.name || null,
      };
    }
  }

  if (allowNameFallback) {
    for (const target of extensionTargets) {
      const probe = await probeManifest(target);
      const runtimeId = String(probe?.id || "");
      const manifestName = String(probe?.name || "");
      if (namePattern.test(manifestName)) {
        return {
          ...target,
          runtimeId:
            runtimeId || parseTargetExtensionId(target.url) || expectedId || null,
          manifestName: probe?.name || null,
        };
      }
    }
  }

  if (expectedId) {
    const opened = await openExtensionUiTarget(baseUrl, expectedId);
    if (opened) {
      targets = await listTargets(baseUrl);
      extensionTargets = targets.filter(
        (target) =>
          typeof target?.url === "string" &&
          target.url.startsWith("chrome-extension://") &&
          typeof target?.webSocketDebuggerUrl === "string"
      );
      const byId = extensionTargets.find((target) => {
        const targetId = parseTargetExtensionId(target.url);
        return targetId && targetId.toLowerCase() === expectedId.toLowerCase();
      });
      if (byId) {
        const probe = await probeManifest(byId);
        return {
          ...byId,
          runtimeId: probe?.id || parseTargetExtensionId(byId.url) || expectedId,
          manifestName: probe?.name || null,
        };
      }
    }
  }

  if (allowNameFallback) {
    const extensionIds = Array.from(
      new Set(
        extensionTargets
          .map((target) => parseTargetExtensionId(target.url))
          .filter(Boolean)
      )
    );
    if (extensionIds.length === 1) {
      const runtimeId = extensionIds[0];
      const preferred =
        extensionTargets.find((target) => target?.type === "service_worker") ||
        extensionTargets[0];
      return {
        ...preferred,
        runtimeId,
        manifestName: null,
      };
    }
  }

  return null;
}
