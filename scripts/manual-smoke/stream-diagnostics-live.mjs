#!/usr/bin/env node

import { resolveCdpEndpoint } from "./lib/cdp-runtime.mjs";
import {
  getDiagnosticsPayloadFromRuntime,
  runWithTemporaryDiagnosticsConfig,
} from "./lib/diagnostics-runtime.mjs";

const portArg = process.argv[2] || process.env.SMOKE_PORT || "9222";
const level = String(
  process.argv[3] ||
    process.env.SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL ||
    process.env.DIAGNOSTICS_MIN_LEVEL ||
    "debug"
)
  .trim()
  .toLowerCase();
const port = Number.parseInt(portArg, 10);
const pollMs = Number.parseInt(
  process.env.SMOKE_LIVE_DIAGNOSTICS_POLL_MS || "450",
  10
);
const limit = Number.parseInt(
  process.env.SMOKE_LIVE_DIAGNOSTICS_LIMIT || "350",
  10
);
const clearExisting = process.env.SMOKE_LIVE_DIAGNOSTICS_CLEAR !== "0";
const showData = process.env.SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA !== "0";

if (!Number.isFinite(port) || port <= 0) {
  console.error(
    "Invalid port. Usage: node scripts/manual-smoke/stream-diagnostics-live.mjs [port] [min-level]"
  );
  process.exit(1);
}

let stopped = false;
const stop = () => {
  stopped = true;
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

const seenIds = new Set();

function formatEvent(event) {
  const ts = event?.timestamp
    ? String(event.timestamp).replace("T", " ").replace("Z", "")
    : "n/a";
  const levelText = String(event?.level || "info").toUpperCase().padEnd(5, " ");
  const runtime = String(event?.runtime || "unknown");
  const domain = String(event?.domain || "unknown");
  const feature = String(event?.feature || "unknown");
  const message = String(event?.message || "unknown_event");
  const provider = event?.provider ? ` provider=${event.provider}` : "";
  const session = event?.sessionId ? ` session=${event.sessionId}` : "";
  const request = event?.requestId ? ` request=${event.requestId}` : "";

  let data = "";
  if (showData && event?.data && typeof event.data === "object") {
    try {
      const raw = JSON.stringify(event.data);
      data = raw.length > 280 ? ` data=${raw.slice(0, 280)}...` : ` data=${raw}`;
    } catch {
      data = " data=[unserializable]";
    }
  }

  return `[diag][${levelText}] ${ts} ${runtime}/${domain}/${feature} ${message}${provider}${session}${request}${data}`;
}

try {
  const resolved = await resolveCdpEndpoint({ port, waitMs: 8000 });

  await runWithTemporaryDiagnosticsConfig({
    baseUrl: resolved.baseUrl,
    minLevel: level,
    clearExisting,
    operation: async () => {
      console.log(
        `[diag] live stream attached base=${resolved.baseUrl} level=${level} pollMs=${pollMs} clear=${clearExisting ? "yes" : "no"}`
      );

      while (!stopped) {
        let payload;
        try {
          payload = await getDiagnosticsPayloadFromRuntime({
            baseUrl: resolved.baseUrl,
            query: {
              minLevel: level,
              limit: Number.isFinite(limit) ? limit : 350,
            },
          });
        } catch (error) {
          console.log(
            `[diag][WARN ] runtime diagnostics fetch failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(200, pollMs))
          );
          continue;
        }

        const events = Array.isArray(payload?.events) ? payload.events : [];
        events
          .filter((event) => typeof event?.id === "string" && !seenIds.has(event.id))
          .sort((a, b) =>
            String(a?.timestamp || "").localeCompare(String(b?.timestamp || ""))
          )
          .forEach((event) => {
            seenIds.add(event.id);
            console.log(formatEvent(event));
          });

        await new Promise((resolve) => setTimeout(resolve, Math.max(120, pollMs)));
      }
    },
  });
} catch (error) {
  console.error(
    `[diag] live stream failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
}
