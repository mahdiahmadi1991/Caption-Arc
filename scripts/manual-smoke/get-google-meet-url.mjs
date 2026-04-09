#!/usr/bin/env node

import { resolveCdpEndpoint } from "./lib/cdp-runtime.mjs";
import {
  resolveGoogleMeetLobbyUrl,
  resolveGoogleMeetUrl,
  isGoogleMeetMeetingUrl,
} from "./lib/meet-url.mjs";

const portArg = process.argv[2];
const scenarioArg = process.argv[3] || process.env.MEET_SCENARIO || "meeting";
const port = Number.parseInt(portArg || "9222", 10);
const scenario = String(scenarioArg).trim().toLowerCase();

if (!Number.isFinite(port) || port <= 0) {
  console.error(
    "Invalid port. Usage: node scripts/manual-smoke/get-google-meet-url.mjs [port] [scenario]"
  );
  process.exit(1);
}

if (!["meeting", "lobby", "prejoin"].includes(scenario)) {
  console.error("Invalid scenario. Supported scenarios: meeting, lobby, prejoin");
  process.exit(1);
}

try {
  const resolved = await resolveCdpEndpoint({ port });
  const meet =
    scenario === "meeting"
      ? await resolveGoogleMeetUrl({
          baseUrl: resolved.baseUrl,
          targets: resolved.targets,
        })
      : await resolveGoogleMeetLobbyUrl({
          baseUrl: resolved.baseUrl,
          targets: resolved.targets,
        });

  console.log(`CDP base URL: ${resolved.baseUrl}`);
  console.log(`Scenario: ${scenario}`);
  console.log(`Google Meet URL: ${meet.url}`);
  console.log(`Source: ${meet.source}`);
  if (meet.note) {
    console.log(`Note: ${meet.note}`);
  }
  if (meet.observedHref) {
    console.log(`Observed href: ${meet.observedHref}`);
  }
  if (meet.observedTitle) {
    console.log(`Observed title: ${meet.observedTitle}`);
  }
  console.log(`Meeting-code URL: ${isGoogleMeetMeetingUrl(meet.url) ? "yes" : "no"}`);
} catch (error) {
  console.error(
    `Get Google Meet URL failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
