#!/usr/bin/env node

import { execSync } from "node:child_process";

const portArg = process.argv[2];
const port = Number.parseInt(portArg || "9222", 10);
const waitMs = Number.parseInt(process.env.CDP_WAIT_MS || "6000", 10);
const retryIntervalMs = Number.parseInt(process.env.CDP_RETRY_INTERVAL_MS || "500", 10);
const bridgePortEnv = Number.parseInt(process.env.CDP_BRIDGE_PORT || "", 10);
const bridgePort = Number.isFinite(bridgePortEnv)
  ? bridgePortEnv
  : port === 9222
    ? 9223
    : Number.NaN;

if (!Number.isFinite(port) || port <= 0) {
  console.error("Invalid port. Usage: node scripts/manual-smoke/check-cdp.mjs [port]");
  process.exit(1);
}

function safeExec(command) {
  try {
    return execSync(command, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function buildCandidateHosts() {
  const hosts = new Set();
  hosts.add("127.0.0.1");
  hosts.add("localhost");

  const gateway = safeExec("ip route | awk '/default/ {print $3; exit}'");
  if (gateway) {
    hosts.add(gateway);
  }

  const nameserver = safeExec("awk '/nameserver/ {print $2; exit}' /etc/resolv.conf");
  if (nameserver) {
    hosts.add(nameserver);
  }

  return [...hosts];
}

function buildCandidateBaseUrls() {
  const explicit = process.env.CDP_BASE_URL?.trim();
  if (explicit) {
    return [explicit.replace(/\/+$/u, "")];
  }

  const ports = [port];
  if (Number.isFinite(bridgePort) && bridgePort > 0 && bridgePort !== port) {
    ports.push(bridgePort);
  }

  const urls = [];
  for (const host of buildCandidateHosts()) {
    for (const nextPort of ports) {
      urls.push(`http://${host}:${nextPort}`);
    }
  }

  return [...new Set(urls)];
}

async function fetchJson(baseUrl, path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`${baseUrl}${path}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function summarizeTargets(targets) {
  const byType = new Map();
  for (const target of targets) {
    const type = typeof target.type === "string" ? target.type : "unknown";
    byType.set(type, (byType.get(type) || 0) + 1);
  }
  return [...byType.entries()]
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");
}

try {
  const candidates = buildCandidateBaseUrls();
  let baseUrl = "";
  let version = null;
  let targets = null;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= Math.max(0, waitMs)) {
    for (const candidate of candidates) {
      try {
        const nextVersion = await fetchJson(candidate, "/json/version");
        const nextTargets = await fetchJson(candidate, "/json/list");
        baseUrl = candidate;
        version = nextVersion;
        targets = nextTargets;
        break;
      } catch {
        // Try next candidate.
      }
    }

    if (baseUrl && version && targets) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, Math.max(50, retryIntervalMs)));
  }

  if (!baseUrl || !version || !targets) {
    for (const candidate of candidates) {
      try {
        const nextVersion = await fetchJson(candidate, "/json/version");
        const nextTargets = await fetchJson(candidate, "/json/list");
        baseUrl = candidate;
        version = nextVersion;
        targets = nextTargets;
        break;
      } catch {
        // Keep final resolution behavior unchanged below.
      }
    }
  }

  if (!baseUrl || !version || !targets) {
    const windowsProbe = safeExec(
      `powershell.exe -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:${port}/json/version).StatusCode } catch { '' }"`
    );
    if (windowsProbe === "200") {
      throw new Error(
        `CDP is reachable from Windows but not yet from WSL. Relaunch Chrome with remote debugging address 0.0.0.0 and retry. Candidates tried: ${candidates.join(", ")}`
      );
    }

    throw new Error(
      `No reachable CDP endpoint found. Candidates tried: ${candidates.join(", ")}`
    );
  }

  const extensionWorkers = targets.filter(
    (target) =>
      target?.type === "service_worker" &&
      typeof target.url === "string" &&
      target.url.startsWith("chrome-extension://")
  );

  console.log("CDP is reachable.");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Browser: ${version.Browser || "unknown"}`);
  console.log(`Protocol: ${version["Protocol-Version"] || "unknown"}`);
  console.log(`WebSocket: ${version.webSocketDebuggerUrl || "n/a"}`);
  console.log(`Targets: ${targets.length} (${summarizeTargets(targets)})`);
  console.log(`Extension service workers: ${extensionWorkers.length}`);

  if (extensionWorkers.length > 0) {
    for (const worker of extensionWorkers) {
      console.log(`- ${worker.url}`);
    }
  } else {
    console.log("No extension service worker detected yet.");
    console.log("Open the extension options/popup once, then run this check again.");
  }
} catch (error) {
  console.error(
    `CDP check failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
