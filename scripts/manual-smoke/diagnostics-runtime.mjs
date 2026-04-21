#!/usr/bin/env node

import { resolveCdpEndpoint } from "./lib/cdp-runtime.mjs";
import {
  clearDiagnosticsDataInRuntime,
  disableDiagnosticsForDebugSession,
  enableDiagnosticsForDebugSession,
  getDiagnosticsConfigFromRuntime,
  getDiagnosticsPayloadFromRuntime,
} from "./lib/diagnostics-runtime.mjs";

const command = String(process.argv[2] || "get").trim().toLowerCase();
const portArg = process.argv[3] || process.env.SMOKE_PORT || "9222";
const port = Number.parseInt(portArg, 10);
const level = String(process.argv[4] || process.env.DIAGNOSTICS_MIN_LEVEL || "debug")
  .trim()
  .toLowerCase();

if (!Number.isFinite(port) || port <= 0) {
  console.error(
    "Invalid port. Usage: node scripts/manual-smoke/diagnostics-runtime.mjs <get|get-config|enable|disable|clear> [port] [level]"
  );
  process.exit(1);
}

try {
  const resolved = await resolveCdpEndpoint({ port, waitMs: 8000 });

  if (command === "enable") {
    const response = await enableDiagnosticsForDebugSession({
      baseUrl: resolved.baseUrl,
      minLevel: level,
      clearExisting: true,
    });
    console.log(JSON.stringify({ command, baseUrl: resolved.baseUrl, response }, null, 2));
    process.exit(0);
  }

  if (command === "get-config") {
    const response = await getDiagnosticsConfigFromRuntime({
      baseUrl: resolved.baseUrl,
    });
    console.log(JSON.stringify({ command, baseUrl: resolved.baseUrl, response }, null, 2));
    process.exit(0);
  }

  if (command === "disable") {
    const response = await disableDiagnosticsForDebugSession({
      baseUrl: resolved.baseUrl,
    });
    console.log(JSON.stringify({ command, baseUrl: resolved.baseUrl, response }, null, 2));
    process.exit(0);
  }

  if (command === "clear") {
    const response = await clearDiagnosticsDataInRuntime({
      baseUrl: resolved.baseUrl,
      includeSnapshots: true,
    });
    console.log(JSON.stringify({ command, baseUrl: resolved.baseUrl, response }, null, 2));
    process.exit(0);
  }

  const response = await getDiagnosticsPayloadFromRuntime({
    baseUrl: resolved.baseUrl,
    query: {
      minLevel: level,
      limit: 200,
    },
  });
  console.log(JSON.stringify({ command: "get", baseUrl: resolved.baseUrl, response }, null, 2));
} catch (error) {
  console.error(
    `Diagnostics runtime command failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}