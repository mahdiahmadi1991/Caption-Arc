#!/usr/bin/env node

import { resolveCdpEndpoint } from "./lib/cdp-runtime.mjs";
import {
  evaluateInExtensionTarget,
  resolveCaptionArcExtensionTarget,
} from "./lib/extension-target.mjs";

const urlArg = process.argv[2] || process.env.GOOGLE_MEET_URL || process.env.MEET_URL || "";
const portArg = process.argv[3] || process.env.SMOKE_PORT || "9222";
const port = Number.parseInt(portArg, 10);

function extractMeetingCode(urlValue) {
  try {
    const parsed = new URL(urlValue);
    const match = parsed.pathname.match(/^\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:\/|$)/i);
    return match?.[1]?.toLowerCase() || null;
  } catch {
    return null;
  }
}

if (!urlArg || !extractMeetingCode(urlArg)) {
  console.error(
    "Invalid Google Meet URL. Usage: node scripts/manual-smoke/seed-google-continuation.mjs <meet-url> [port]"
  );
  process.exit(1);
}

if (!Number.isFinite(port) || port <= 0) {
  console.error("Invalid port.");
  process.exit(1);
}

try {
  const meetUrl = String(urlArg).trim();
  const meetingCode = extractMeetingCode(meetUrl);
  const resolved = await resolveCdpEndpoint({ port, waitMs: 8000 });
  const extensionTarget = await resolveCaptionArcExtensionTarget({
    baseUrl: resolved.baseUrl,
  });
  if (!extensionTarget?.webSocketDebuggerUrl) {
    throw new Error(
      "Could not resolve CaptionArc extension target for continuation seeding."
    );
  }

  const seedResult = await evaluateInExtensionTarget({
    webSocketDebuggerUrl: extensionTarget.webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const sourceUrl = ${JSON.stringify(meetUrl)};
        const meetingCode = ${JSON.stringify(meetingCode)};
        const now = Date.now();
        const providerLabel = "Google Meet";
        const baseTitle = "Meet - " + meetingCode;

        const resolveResponse = await chrome.runtime.sendMessage({
          action: "resolveMeetingSession",
          platform: "google-meet",
          providerLabel,
          sourceUrl,
          title: baseTitle,
          identifiers: { meetingCode },
          reusePolicy: "force-new",
        });

        if (!resolveResponse?.success || !resolveResponse?.session) {
          return {
            ok: false,
            phase: "resolve",
            response: resolveResponse || null,
          };
        }

        const session = resolveResponse.session;
        const endedSession = {
          ...session,
          meetingUrl: sourceUrl,
          providerLabel,
          title: session.title || baseTitle,
          identifiers: {
            ...(session.identifiers || {}),
            meetingCode,
          },
          lifecycleState: "ended",
          endTime: now - 1500,
          lastSeenAt: now - 1500,
          updatedAt: now - 1200,
        };

        const finalizeResponse = await chrome.runtime.sendMessage({
          action: "finalizeMeetingSessionEnd",
          session: endedSession,
          enqueueAutomaticSummary: false,
        });

        if (!finalizeResponse?.success) {
          return {
            ok: false,
            phase: "finalize",
            response: finalizeResponse || null,
          };
        }

        const candidateResponse = await chrome.runtime.sendMessage({
          action: "findMeetingSessionContinuationCandidate",
          platform: "google-meet",
          providerLabel,
          sourceUrl,
          title: endedSession.title,
          identifiers: endedSession.identifiers,
        });

        return {
          ok: Boolean(candidateResponse?.success && candidateResponse?.candidate),
          phase: "candidate",
          sessionId: endedSession.id,
          candidate: candidateResponse?.candidate || null,
          resolveResponse: {
            success: resolveResponse?.success || false,
            reused: resolveResponse?.reused || false,
          },
          finalizeResponse: {
            success: finalizeResponse?.success || false,
          },
        };
      }
    )()`,
  });

  if (!seedResult?.ok) {
    throw new Error(`Continuation seed failed: ${JSON.stringify(seedResult || null)}`);
  }

  console.log("Google continuation seed: PASS");
  console.log(`CDP base URL: ${resolved.baseUrl}`);
  console.log(`Meet URL: ${meetUrl}`);
  console.log(`Session ID: ${seedResult.sessionId || "n/a"}`);
  console.log(`Candidate session: ${seedResult?.candidate?.sessionId || "n/a"}`);
} catch (error) {
  console.error(
    `Google continuation seed failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
}
