#!/usr/bin/env node

import { execSync } from "node:child_process";

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
  const hosts = new Set(["127.0.0.1", "localhost"]);

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

export async function resolveCdpEndpoint({
  port = 9222,
  bridgePort = Number.parseInt(process.env.CDP_BRIDGE_PORT || "", 10),
  waitMs = Number.parseInt(process.env.CDP_WAIT_MS || "6000", 10),
  retryIntervalMs = Number.parseInt(process.env.CDP_RETRY_INTERVAL_MS || "500", 10),
} = {}) {
  const effectiveBridgePort = Number.isFinite(bridgePort)
    ? bridgePort
    : port === 9222
      ? 9223
      : Number.NaN;

  const ports = [port];
  if (
    Number.isFinite(effectiveBridgePort) &&
    effectiveBridgePort > 0 &&
    effectiveBridgePort !== port
  ) {
    ports.push(effectiveBridgePort);
  }

  const candidateBaseUrls = [];
  for (const host of buildCandidateHosts()) {
    for (const nextPort of ports) {
      candidateBaseUrls.push(`http://${host}:${nextPort}`);
    }
  }

  const uniqueCandidates = [...new Set(candidateBaseUrls)];

  const fetchJson = async (baseUrl, path) => {
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
  };

  let resolved = null;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= Math.max(0, waitMs)) {
    for (const baseUrl of uniqueCandidates) {
      try {
        const version = await fetchJson(baseUrl, "/json/version");
        const targets = await fetchJson(baseUrl, "/json/list");
        resolved = { baseUrl, version, targets };
        break;
      } catch {
        // Try next candidate.
      }
    }

    if (resolved) {
      break;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(50, retryIntervalMs))
    );
  }

  if (!resolved) {
    throw new Error(
      `No reachable CDP endpoint found. Candidates tried: ${uniqueCandidates.join(", ")}`
    );
  }

  return resolved;
}

export async function createTarget(baseUrl, url) {
  const response = await fetch(
    `${baseUrl}/json/new?${encodeURIComponent(url)}`,
    { method: "PUT" }
  );

  if (!response.ok) {
    throw new Error(`Failed to create target: HTTP ${response.status}`);
  }

  const target = await response.json();
  if (!target.webSocketDebuggerUrl) {
    throw new Error("Created target has no webSocketDebuggerUrl.");
  }

  return target;
}

export async function evaluateInTarget({
  webSocketDebuggerUrl,
  expression,
  delayMs = 0,
  enablePage = true,
  awaitPromise = false,
}) {
  const ws = new WebSocket(webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const entry = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) {
        entry.reject(new Error(JSON.stringify(msg.error)));
      } else {
        entry.resolve(msg.result);
      }
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = (event) =>
      reject(event.error || new Error("WebSocket connection error"));
  });

  const send = (method, params = {}) => {
    const id = ++msgId;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
  };

  if (enablePage) {
    await send("Page.enable");
  }
  await send("Runtime.enable");

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });

  ws.close();
  return result?.result?.value;
}

export async function dispatchMouseClickInTarget({
  webSocketDebuggerUrl,
  x,
  y,
  clickCount = 1,
}) {
  const ws = new WebSocket(webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const entry = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) {
        entry.reject(new Error(JSON.stringify(msg.error)));
      } else {
        entry.resolve(msg.result);
      }
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = (event) =>
      reject(event.error || new Error("WebSocket connection error"));
  });

  const send = (method, params = {}) => {
    const id = ++msgId;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.bringToFront");

  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
    button: "none",
  });
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount,
  });

  ws.close();
}
