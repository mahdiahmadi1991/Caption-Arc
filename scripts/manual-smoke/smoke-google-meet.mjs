#!/usr/bin/env node

import { createTarget, evaluateInTarget, resolveCdpEndpoint } from "./lib/cdp-runtime.mjs";
import { isGoogleMeetMeetingUrl, resolveGoogleMeetUrl } from "./lib/meet-url.mjs";

const portArg = process.argv[2];
const port = Number.parseInt(portArg || "9222", 10);
const waitMs = Number.parseInt(process.env.SMOKE_WAIT_MS || "9000", 10);
const evalDelayMs = Number.parseInt(process.env.SMOKE_EVAL_DELAY_MS || "4500", 10);

if (!Number.isFinite(port) || port <= 0) {
  console.error("Invalid port. Usage: node scripts/manual-smoke/smoke-google-meet.mjs [port]");
  process.exit(1);
}

try {
  const resolved = await resolveCdpEndpoint({ port, waitMs });
  const meet = await resolveGoogleMeetUrl({
    baseUrl: resolved.baseUrl,
    targets: resolved.targets,
  });

  const target = await createTarget(resolved.baseUrl, meet.url);
  const probe = await evaluateInTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    delayMs: Math.max(300, evalDelayMs),
    expression: `(() => ({
      href: window.location.href,
      title: document.title,
      injected: Boolean(document.querySelector('meta[name="captionarc-injected"]')),
      markerContent: document.querySelector('meta[name="captionarc-injected"]')?.content || null
    }))()`,
  });

  const currentHref = typeof probe?.href === "string" ? probe.href : "";
  const onMeetDomain = /(^|\.)meet\.google\.com$/i.test(
    (() => {
      try {
        return new URL(currentHref).hostname;
      } catch {
        return "";
      }
    })()
  );

  console.log("Google Meet smoke check");
  console.log(`CDP base URL: ${resolved.baseUrl}`);
  console.log(`Requested URL: ${meet.url}`);
  console.log(`URL source: ${meet.source}`);
  if (meet.note) {
    console.log(`URL note: ${meet.note}`);
  }
  console.log(`Final href: ${probe?.href || "n/a"}`);
  console.log(`Final title: ${probe?.title || "n/a"}`);
  console.log(`Requested URL has meeting code: ${isGoogleMeetMeetingUrl(meet.url) ? "yes" : "no"}`);
  console.log(`Current page on meet.google.com: ${onMeetDomain ? "yes" : "no"}`);
  console.log(`Content script injected marker: ${probe?.injected ? "yes" : "no"}`);

  if (!probe?.injected) {
    if (!onMeetDomain) {
      console.error(
        "Smoke failed: browser was redirected away from meet.google.com (likely auth gate). Open Google Meet in debug profile once, then rerun."
      );
    } else {
      console.error(
        "Smoke failed: content-script marker was not found on Meet page. Reload extension/runtime and verify extension is enabled in chrome://extensions."
      );
    }
    process.exit(1);
  }

  console.log("Smoke result: PASS");
} catch (error) {
  console.error(
    `Smoke failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
