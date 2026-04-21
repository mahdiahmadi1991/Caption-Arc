#!/usr/bin/env node

import {
  createTarget,
  evaluateInTarget,
  resolveCdpEndpoint,
} from "./lib/cdp-runtime.mjs";
import {
  isExpectedProviderHost,
  providerSmokeConstants,
  resolveProviderScenarioUrl,
} from "./lib/provider-url.mjs";
import {
  evaluateInExtensionTarget,
  listTargets as listExtensionTargets,
  openExtensionUiTarget,
  parseTargetExtensionId,
  resolveCaptionArcExtensionTarget,
} from "./lib/extension-target.mjs";
import {
  getDiagnosticsPayloadFromRuntime,
  runWithTemporaryDiagnosticsConfig,
} from "./lib/diagnostics-runtime.mjs";

const providerArg = process.argv[2] || process.env.SMOKE_PROVIDER || "google-meet";
const scenarioArg = process.argv[3] || process.env.SMOKE_SCENARIO || "meeting";
const portArg = process.argv[4] || process.env.SMOKE_PORT || "9222";

const provider = String(providerArg).trim().toLowerCase();
const scenario = String(scenarioArg).trim().toLowerCase();
const port = Number.parseInt(portArg, 10);
const waitMs = Number.parseInt(process.env.SMOKE_WAIT_MS || "9000", 10);
const evalDelayMs = Number.parseInt(process.env.SMOKE_EVAL_DELAY_MS || "2400", 10);
const singleTabMode = process.env.SMOKE_SINGLE_TAB !== "0";
const stepMode = process.env.SMOKE_STEP_MODE === "1";
const stepPauseMs = Number.parseInt(process.env.SMOKE_STEP_PAUSE_MS || "700", 10);
const promptWaitMs = Number.parseInt(
  process.env.SMOKE_PROMPT_WAIT_MS || "10000",
  10
);
const promptPollMs = Number.parseInt(
  process.env.SMOKE_PROMPT_POLL_MS || "350",
  10
);
const requirePromptResolution = process.env.SMOKE_REQUIRE_PROMPT_RESOLUTION !== "0";
const capturePromptAction = String(
  process.env.SMOKE_CAPTURE_PROMPT_ACTION || "approve"
)
  .trim()
  .toLowerCase();
const continuationPromptAction = String(
  process.env.SMOKE_CONTINUATION_PROMPT_ACTION || "restart"
)
  .trim()
  .toLowerCase();
const sessionEndedPromptAction = String(
  process.env.SMOKE_SESSION_ENDED_PROMPT_ACTION || "stay"
)
  .trim()
  .toLowerCase();
const teamsLoadTimeoutMs = Number.parseInt(
  process.env.SMOKE_TEAMS_LOAD_TIMEOUT_MS || "55000",
  10
);
const teamsProbeIntervalMs = Number.parseInt(
  process.env.SMOKE_TEAMS_PROBE_INTERVAL_MS || "2500",
  10
);
const teamsReloadAfterMs = Number.parseInt(
  process.env.SMOKE_TEAMS_RELOAD_AFTER_MS || "14000",
  10
);
const teamsMaxReloads = Number.parseInt(
  process.env.SMOKE_TEAMS_MAX_RELOADS || "3",
  10
);
const teamsMaxContinueClicks = Number.parseInt(
  process.env.SMOKE_TEAMS_MAX_CONTINUE_CLICKS || "6",
  10
);
const forceFreshGoogleMeetUrl = process.env.GOOGLE_MEET_REQUIRE_FRESH_URL === "1";

if (!Number.isFinite(port) || port <= 0) {
  console.error(
    "Invalid port. Usage: node scripts/manual-smoke/smoke-provider.mjs <provider> <scenario> [port]"
  );
  process.exit(1);
}

if (!providerSmokeConstants.SUPPORTED_PROVIDERS.includes(provider)) {
  console.error(
    `Unsupported provider '${provider}'. Supported: ${providerSmokeConstants.SUPPORTED_PROVIDERS.join(
      ", "
    )}`
  );
  process.exit(1);
}

if (!providerSmokeConstants.SUPPORTED_SCENARIOS.includes(scenario)) {
  console.error(
    `Unsupported scenario '${scenario}'. Supported: ${providerSmokeConstants.SUPPORTED_SCENARIOS.join(
      ", "
    )}`
  );
  process.exit(1);
}

function canonicalUrl(value) {
  try {
    return new URL(String(value)).toString();
  } catch {
    return String(value || "");
  }
}

async function listTargets(baseUrl) {
  const response = await fetch(`${baseUrl}/json/list`);
  if (!response.ok) {
    throw new Error(`Failed to list targets: HTTP ${response.status}`);
  }
  return await response.json();
}

async function closeCdpTarget(baseUrl, targetId) {
  if (!targetId) {
    return false;
  }

  const response = await fetch(
    `${baseUrl}/json/close/${encodeURIComponent(String(targetId))}`,
    { method: "PUT" }
  );
  return response.ok;
}

function findPageTargetByUrl(targets, expectedUrl) {
  const wanted = canonicalUrl(expectedUrl);
  return (
    targets.find(
      (target) =>
        target?.type === "page" &&
        typeof target?.webSocketDebuggerUrl === "string" &&
        canonicalUrl(target?.url) === wanted
    ) || null
  );
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function waitStep(label) {
  if (!stepMode) {
    return;
  }
  console.log(`STEP: ${label}`);
  await sleep(stepPauseMs);
}

function createProbeExpression(clickContinue) {
  return `(() => {
    const marker = document.querySelector('meta[name="captionarc-injected"]');

    let continueButtonVisible = false;
    let continueClicked = false;
    const clickMode = ${clickContinue ? "true" : "false"};
    const lowerText = (document.body?.innerText || "").toLowerCase();
    const codeMatch = window.location.pathname.match(/\\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:[/?#]|$)/i);
    const meetCode = codeMatch?.[1]?.toLowerCase() || null;
    const placeholderCodes = new Set(["aaa-bbbb-ccc", "yyy-yyyy-zzz"]);
    const invalidMeetingCodeDetected =
      lowerText.includes("check your meeting code") ||
      lowerText.includes("enter a valid meeting code") ||
      (meetCode ? placeholderCodes.has(meetCode) : false);
    const invalidMeetingCodeReason = invalidMeetingCodeDetected
      ? (meetCode && placeholderCodes.has(meetCode)
          ? "placeholder-meeting-code"
          : "meet-invalid-code-surface")
      : null;

    const candidates = Array.from(
      document.querySelectorAll("button, [role='button'], a, [aria-label], [data-tid]")
    );

    for (const node of candidates) {
      const rawText =
        ((node.textContent || "") + " " + (node.getAttribute("aria-label") || ""))
          .replace(/\\s+/g, " ")
          .trim()
          .toLowerCase();
      if (!rawText) {
        continue;
      }

      if (
        rawText.includes("continue on this browser") ||
        rawText.includes("continue in this browser")
      ) {
        continueButtonVisible = true;
        if (clickMode) {
          node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          node.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          continueClicked = true;
        }
        break;
      }
    }

    return {
      href: window.location.href,
      title: document.title,
      readyState: document.readyState,
      injected: Boolean(marker),
      markerContent: marker?.content || null,
      hasOverlay: Boolean(document.querySelector('#captionarc-overlay')),
      continueButtonVisible,
      continueClicked,
      invalidMeetingCodeDetected,
      invalidMeetingCodeReason,
    };
  })()`;
}

async function probeTarget(webSocketDebuggerUrl, delayMs, clickContinue = false) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: Math.max(200, delayMs),
    expression: createProbeExpression(clickContinue),
  });
}

async function reloadTarget(webSocketDebuggerUrl) {
  await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 150,
    expression: "window.location.reload(); 'reloaded';",
  });
}

async function maybeResolveOverlayPrompt(webSocketDebuggerUrl) {
  const actionMap = {
    capture: capturePromptAction,
    continuation: continuationPromptAction,
    sessionEnded: sessionEndedPromptAction,
  };

  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: 120,
    expression: `(() => {
      const normalize = (value) =>
        String(value || "")
          .replace(/\\s+/g, " ")
          .trim()
          .toLowerCase();

      const prompt = document.querySelector(".mc-capture-consent");
      if (!prompt) {
        return { hasPrompt: false };
      }

      const title = normalize(
        prompt.querySelector(".mc-capture-consent-title")?.textContent || ""
      );
      const body = normalize(
        prompt.querySelector(".mc-capture-consent-body")?.textContent || ""
      );

      const buttons = Array.from(prompt.querySelectorAll("button"));
      const buttonTexts = buttons.map((button) =>
        normalize(button.textContent || button.getAttribute("aria-label") || "")
      );
      const primary = buttons.find((button) =>
        button.classList.contains("mc-capture-consent-action-primary")
      );
      const secondary = buttons.find((button) =>
        button.classList.contains("mc-capture-consent-action-secondary")
      );

      let kind = "capture-consent";
      if (
        title.includes("continue the previous session") ||
        body.includes("rejoined the same meeting")
      ) {
        kind = "session-continuation";
      } else if (title.includes("session ended")) {
        kind = "session-ended";
      }

      const actions = ${JSON.stringify(actionMap)};
      const selectedAction =
        kind === "session-continuation"
          ? actions.continuation
          : kind === "session-ended"
            ? actions.sessionEnded
            : actions.capture;

      const byToken = (tokens) =>
        buttons.find((button) => {
          const text = normalize(button.textContent || button.getAttribute("aria-label") || "");
          return tokens.some((token) => text.includes(token));
        });

      let target = null;
      if (kind === "session-continuation") {
        if (selectedAction === "resume") {
          target = byToken(["continue", "resume"]) || primary || buttons[0] || null;
        } else {
          target = byToken(["new session", "restart", "not now"]) || secondary || buttons[0] || null;
        }
      } else if (kind === "session-ended") {
        if (selectedAction === "exit") {
          target = byToken(["close", "exit"]) || secondary || buttons[0] || null;
        } else {
          target = byToken(["stay", "stay here"]) || primary || buttons[0] || null;
        }
      } else if (selectedAction === "dismiss") {
        target = byToken(["not now", "dismiss", "close"]) || secondary || buttons[0] || null;
      } else {
        target = byToken(["enable", "approve"]) || primary || buttons[0] || null;
      }

      if (!target) {
        return {
          hasPrompt: true,
          kind,
          title,
          body,
          clicked: false,
          buttonTexts,
        };
      }

      target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      target.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      return {
        hasPrompt: true,
        kind,
        title,
        body,
        clicked: true,
        button: normalize(target.textContent || target.getAttribute("aria-label") || ""),
        buttonTexts,
      };
    })()`,
  });
}

async function settleBlockingOverlayPrompts(webSocketDebuggerUrl) {
  const startedAt = Date.now();
  let seenPrompt = false;
  let handledPrompt = false;
  let lastResult = null;
  let lastPromptResult = null;
  const kindsSeen = [];

  while (Date.now() - startedAt <= Math.max(1200, promptWaitMs)) {
    const result = await maybeResolveOverlayPrompt(webSocketDebuggerUrl);
    lastResult = result;
    if (!result?.hasPrompt) {
      return {
        ok: true,
        seenPrompt,
        handledPrompt,
        lastResult,
        lastPromptResult,
        kindsSeen,
      };
    }

    seenPrompt = true;
    lastPromptResult = result;
    if (result?.kind) {
      kindsSeen.push(result.kind);
    }
    if (result?.clicked) {
      handledPrompt = true;
    }

    await sleep(Math.max(120, promptPollMs));
  }

  return {
    ok: false,
    seenPrompt,
    handledPrompt,
    lastResult,
    lastPromptResult,
    kindsSeen,
  };
}

async function waitForOverlayPromptsWithGrace(
  webSocketDebuggerUrl,
  {
    timeoutMs = 30000,
    pollMs = Math.max(120, promptPollMs),
    settleQuietMs = 1200,
  } = {}
) {
  const startedAt = Date.now();
  let seenPrompt = false;
  let handledPrompt = false;
  let lastResult = null;
  let lastPromptResult = null;
  let lastPromptAt = 0;
  const kindsSeen = [];

  while (Date.now() - startedAt <= Math.max(2000, timeoutMs)) {
    const result = await maybeResolveOverlayPrompt(webSocketDebuggerUrl);
    lastResult = result;

    if (result?.hasPrompt) {
      seenPrompt = true;
      lastPromptResult = result;
      lastPromptAt = Date.now();
      if (result?.kind) {
        kindsSeen.push(result.kind);
      }
      if (result?.clicked) {
        handledPrompt = true;
      }
    } else if (seenPrompt && Date.now() - lastPromptAt >= Math.max(200, settleQuietMs)) {
      break;
    }

    await sleep(Math.max(80, pollMs));
  }

  return {
    ok: true,
    seenPrompt,
    handledPrompt,
    lastResult,
    lastPromptResult,
    kindsSeen: Array.from(new Set(kindsSeen)),
  };
}

async function listZoomMeetingPageTargets(baseUrl) {
  const targets = await listTargets(baseUrl);
  return targets.filter((target) => {
    if (
      target?.type !== "page" ||
      typeof target?.url !== "string" ||
      typeof target?.webSocketDebuggerUrl !== "string"
    ) {
      return false;
    }
    return isZoomMeetingUrl(target.url);
  });
}

async function waitForOverlayPromptsAcrossZoomMeetingTargets(
  baseUrl,
  {
    preferredWebSocketDebuggerUrl = "",
    timeoutMs = 30000,
    pollMs = Math.max(120, promptPollMs),
    settleQuietMs = 1200,
  } = {}
) {
  const startedAt = Date.now();
  let seenPrompt = false;
  let handledPrompt = false;
  let lastResult = null;
  let lastPromptResult = null;
  let lastPromptAt = 0;
  let lastPromptWs = preferredWebSocketDebuggerUrl || "";
  const kindsSeen = [];

  while (Date.now() - startedAt <= Math.max(2000, timeoutMs)) {
    const wsList = [];
    if (preferredWebSocketDebuggerUrl) {
      wsList.push(preferredWebSocketDebuggerUrl);
    }

    try {
      const zoomTargets = await listZoomMeetingPageTargets(baseUrl);
      for (const target of zoomTargets) {
        if (!wsList.includes(target.webSocketDebuggerUrl)) {
          wsList.push(target.webSocketDebuggerUrl);
        }
      }
    } catch {
      // Ignore transient list failures and keep using preferred target.
    }

    let promptSeenInThisPoll = false;
    for (const ws of wsList) {
      try {
        const result = await maybeResolveOverlayPrompt(ws);
        if (!result?.hasPrompt) {
          continue;
        }
        promptSeenInThisPoll = true;
        seenPrompt = true;
        lastResult = result;
        lastPromptResult = result;
        lastPromptAt = Date.now();
        lastPromptWs = ws;
        if (result?.kind) {
          kindsSeen.push(result.kind);
        }
        if (result?.clicked) {
          handledPrompt = true;
        }
      } catch {
        // Ignore per-target failures.
      }
    }

    if (!promptSeenInThisPoll && seenPrompt) {
      if (Date.now() - lastPromptAt >= Math.max(200, settleQuietMs)) {
        break;
      }
    }

    await sleep(Math.max(80, pollMs));
  }

  return {
    ok: true,
    seenPrompt,
    handledPrompt,
    lastResult,
    lastPromptResult,
    lastPromptWs,
    kindsSeen: Array.from(new Set(kindsSeen)),
  };
}

async function listGoogleMeetingPageTargets(
  baseUrl,
  { meetingCode = "" } = {}
) {
  const targets = await listTargets(baseUrl);
  return targets.filter((target) => {
    if (
      target?.type !== "page" ||
      typeof target?.url !== "string" ||
      typeof target?.webSocketDebuggerUrl !== "string"
    ) {
      return false;
    }

    if (!isExpectedProviderHost("google-meet", target.url)) {
      return false;
    }

    if (!meetingCode) {
      return true;
    }

    return extractGoogleMeetingCode(target.url) === meetingCode;
  });
}

async function waitForOverlayPromptsAcrossGoogleMeetingTargets(
  baseUrl,
  {
    preferredWebSocketDebuggerUrl = "",
    meetingCode = "",
    timeoutMs = 30000,
    pollMs = Math.max(120, promptPollMs),
    settleQuietMs = 1200,
  } = {}
) {
  const startedAt = Date.now();
  let seenPrompt = false;
  let handledPrompt = false;
  let lastResult = null;
  let lastPromptResult = null;
  let lastPromptAt = 0;
  let lastPromptWs = preferredWebSocketDebuggerUrl || "";
  const kindsSeen = [];

  while (Date.now() - startedAt <= Math.max(2000, timeoutMs)) {
    const wsList = [];
    if (preferredWebSocketDebuggerUrl) {
      wsList.push(preferredWebSocketDebuggerUrl);
    }

    try {
      const meetTargets = await listGoogleMeetingPageTargets(baseUrl, { meetingCode });
      for (const target of meetTargets) {
        if (!wsList.includes(target.webSocketDebuggerUrl)) {
          wsList.push(target.webSocketDebuggerUrl);
        }
      }
    } catch {
      // Ignore transient list failures and keep using preferred target.
    }

    let promptSeenInThisPoll = false;
    for (const ws of wsList) {
      try {
        const result = await maybeResolveOverlayPrompt(ws);
        if (!result?.hasPrompt) {
          continue;
        }

        promptSeenInThisPoll = true;
        seenPrompt = true;
        lastResult = result;
        lastPromptResult = result;
        lastPromptAt = Date.now();
        lastPromptWs = ws;
        if (result?.kind) {
          kindsSeen.push(result.kind);
        }
        if (result?.clicked) {
          handledPrompt = true;
        }
      } catch {
        // Ignore per-target failures.
      }
    }

    if (!promptSeenInThisPoll && seenPrompt) {
      if (Date.now() - lastPromptAt >= Math.max(200, settleQuietMs)) {
        break;
      }
    }

    await sleep(Math.max(80, pollMs));
  }

  return {
    ok: true,
    seenPrompt,
    handledPrompt,
    lastResult,
    lastPromptResult,
    lastPromptWs,
    kindsSeen: Array.from(new Set(kindsSeen)),
  };
}

function extractGoogleMeetingCode(urlValue) {
  try {
    const parsed = new URL(urlValue);
    const match = parsed.pathname.match(/^\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:\/|$)/i);
    return match?.[1]?.toLowerCase() || null;
  } catch {
    return null;
  }
}

function parseRuntimeIdFromMarker(markerContent) {
  const match = String(markerContent || "").match(/^([a-z]{32})(?::\d+)?$/i);
  return match?.[1] || null;
}

async function seedGoogleContinuationCandidate(baseUrl, meetUrl, expectedRuntimeId = null) {
  const meetingCode = extractGoogleMeetingCode(meetUrl);
  if (!meetingCode) {
    throw new Error(`Could not extract Google meeting code from URL: ${meetUrl}`);
  }

  let resolvedTarget = await resolveCaptionArcExtensionTarget({
    baseUrl,
    expectedId: expectedRuntimeId || undefined,
    allowNameFallback: !expectedRuntimeId,
  });
  if (!resolvedTarget && expectedRuntimeId) {
    resolvedTarget = await resolveCaptionArcExtensionTarget({
      baseUrl,
      expectedId: expectedRuntimeId,
      allowNameFallback: true,
    });
  }
  if (!resolvedTarget?.webSocketDebuggerUrl) {
    throw new Error(
      "Could not resolve CaptionArc extension target for continuation seed."
    );
  }

  if (resolvedTarget?.type !== "page" && resolvedTarget?.runtimeId) {
    await openExtensionUiTarget(baseUrl, resolvedTarget.runtimeId);
    const refreshedTargets = await listExtensionTargets(baseUrl);
    const pageTarget = refreshedTargets.find((target) => {
      if (target?.type !== "page" || typeof target?.url !== "string") {
        return false;
      }
      const targetId = parseTargetExtensionId(target.url);
      return targetId && targetId.toLowerCase() === resolvedTarget.runtimeId.toLowerCase();
    });
    if (pageTarget?.webSocketDebuggerUrl) {
      resolvedTarget = {
        ...pageTarget,
        runtimeId: resolvedTarget.runtimeId,
        manifestName: resolvedTarget.manifestName || null,
      };
    }
  }

  const result = await evaluateInExtensionTarget({
    webSocketDebuggerUrl: resolvedTarget.webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        try {
        const sourceUrl = ${JSON.stringify(meetUrl)};
        const meetingCode = ${JSON.stringify(meetingCode)};
        const providerLabel = "Google Meet";
        const now = Date.now();
        const baseTitle = "Meet - " + meetingCode;

        if (!chrome?.runtime?.sendMessage) {
          return { ok: false, phase: "runtime", reason: "chrome.runtime.sendMessage unavailable" };
        }

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
          return { ok: false, phase: "resolve", response: resolveResponse || null };
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
          return { ok: false, phase: "finalize", response: finalizeResponse || null };
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
          candidate: candidateResponse?.candidate || null,
          sessionId: endedSession.id,
        };
        } catch (error) {
          return {
            ok: false,
            phase: "exception",
            error: String(error),
          };
        }
      }
    )()`,
  });

  if (!result?.ok) {
    throw new Error(`Continuation seed failed: ${JSON.stringify(result || null)}`);
  }

  return result;
}

async function stabilizeTeamsTarget(webSocketDebuggerUrl) {
  const startedAt = Date.now();
  let lastProbe = null;
  let reloadCount = 0;
  let continueClickCount = 0;

  while (Date.now() - startedAt <= Math.max(5000, teamsLoadTimeoutMs)) {
    const clickContinue = continueClickCount < Math.max(0, teamsMaxContinueClicks);
    const probe = await probeTarget(
      webSocketDebuggerUrl,
      Math.max(250, teamsProbeIntervalMs),
      clickContinue
    );
    lastProbe = probe;

    if (probe?.continueClicked) {
      continueClickCount += 1;
    }

    const href = typeof probe?.href === "string" ? probe.href : "";
    const onExpectedHost = isExpectedProviderHost("microsoft-teams", href);
    if (onExpectedHost && probe?.injected) {
      return {
        probe,
        reloadCount,
        continueClickCount,
        timedOut: false,
      };
    }

    const elapsed = Date.now() - startedAt;
    const launcherLike =
      href === "about:blank" ||
      /launcher\.html/i.test(href) ||
      /\/dl\/launcher\//i.test(href);
    const shouldReload =
      reloadCount < Math.max(0, teamsMaxReloads) &&
      launcherLike &&
      elapsed >= Math.max(1000, teamsReloadAfterMs) * (reloadCount + 1);

    if (shouldReload) {
      await reloadTarget(webSocketDebuggerUrl);
      reloadCount += 1;
    }
  }

  return {
    probe: lastProbe,
    reloadCount,
    continueClickCount,
    timedOut: true,
  };
}

function extractZoomMeetingId(urlValue) {
  try {
    const parsed = new URL(String(urlValue || ""));
    const match = parsed.pathname.match(
      /^\/(?:wc\/)?(?:join\/)?(\d+)(?:\/(?:start|join))?(?:\/|$)/i
    );
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function isZoomMeetingUrl(urlValue) {
  try {
    const parsed = new URL(String(urlValue || ""));
    return (
      /(^|\.)zoom\.us$/i.test(parsed.hostname) &&
      /^\/wc\/\d+\/(?:start|join)(?:\/|$)/i.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

async function clickInTarget(
  webSocketDebuggerUrl,
  { selectors = [], textIncludes = [], includeAnchors = true, delayMs = 700 } = {}
) {
  return Boolean(
    await evaluateInTarget({
      webSocketDebuggerUrl,
      delayMs: Math.max(200, delayMs),
      expression: `(() => {
        const normalize = (value) =>
          String(value || "")
            .replace(/\\s+/g, " ")
            .trim()
            .toLowerCase();
        const isVisible = (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          const style = window.getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden";
        };
        const clickNode = (node) => {
          node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          node.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        };

        const selectorList = ${JSON.stringify(selectors)};
        const textTokens = ${JSON.stringify(
          textIncludes.map((value) =>
            String(value || "")
              .trim()
              .toLowerCase()
          )
        )};
        const candidateSelector = ${
          includeAnchors
            ? JSON.stringify("button, [role='button'], a, [aria-label], [data-testid], [id]")
            : JSON.stringify("button, [role='button'], [aria-label], [data-testid], [id]")
        };

        for (const selector of selectorList) {
          const node = document.querySelector(selector);
          if (!(node instanceof HTMLElement) || !isVisible(node)) {
            continue;
          }
          clickNode(node);
          return true;
        }

        const candidates = Array.from(document.querySelectorAll(candidateSelector));
        for (const node of candidates) {
          if (!(node instanceof HTMLElement) || !isVisible(node)) {
            continue;
          }
          const text = normalize(
            (node.textContent || "") + " " + (node.getAttribute("aria-label") || "")
          );
          if (!text) {
            continue;
          }
          if (textTokens.some((token) => text.includes(token))) {
            clickNode(node);
            return true;
          }
        }

        return false;
      })()`,
    })
  );
}

async function waitForZoomUrlState(
  webSocketDebuggerUrl,
  {
    timeoutMs = 45000,
    pollMs = 1200,
    expectMeeting = true,
  } = {}
) {
  const startedAt = Date.now();
  let lastState = null;

  while (Date.now() - startedAt <= timeoutMs) {
    const state = await evaluateInTarget({
      webSocketDebuggerUrl,
      delayMs: Math.max(200, pollMs),
      expression: `(() => ({
        href: window.location.href,
        title: document.title,
        bodyText: (document.body?.innerText || "").toLowerCase(),
      }))()`,
    });

    lastState = state;
    const href = typeof state?.href === "string" ? state.href : "";
    const meeting = isZoomMeetingUrl(href);
    if (expectMeeting ? meeting : !meeting) {
      return { ok: true, state };
    }
  }

  return { ok: false, state: lastState };
}

async function seedZoomContinuationCandidate(
  baseUrl,
  { sourceUrl, title, meetingId, meetingNumber, expectedRuntimeId = null } = {}
) {
  let resolvedTarget = await resolveCaptionArcExtensionTarget({
    baseUrl,
    expectedId: expectedRuntimeId || undefined,
    allowNameFallback: !expectedRuntimeId,
  });
  if (!resolvedTarget && expectedRuntimeId) {
    resolvedTarget = await resolveCaptionArcExtensionTarget({
      baseUrl,
      expectedId: expectedRuntimeId,
      allowNameFallback: true,
    });
  }
  if (!resolvedTarget?.webSocketDebuggerUrl) {
    throw new Error("Could not resolve CaptionArc extension target for Zoom continuation seed.");
  }

  if (resolvedTarget?.type !== "page" && resolvedTarget?.runtimeId) {
    await openExtensionUiTarget(baseUrl, resolvedTarget.runtimeId);
    const refreshedTargets = await listExtensionTargets(baseUrl);
    const pageTarget = refreshedTargets.find((target) => {
      if (target?.type !== "page" || typeof target?.url !== "string") {
        return false;
      }
      const targetId = parseTargetExtensionId(target.url);
      return targetId && targetId.toLowerCase() === resolvedTarget.runtimeId.toLowerCase();
    });
    if (pageTarget?.webSocketDebuggerUrl) {
      resolvedTarget = {
        ...pageTarget,
        runtimeId: resolvedTarget.runtimeId,
        manifestName: resolvedTarget.manifestName || null,
      };
    }
  }

  const result = await evaluateInExtensionTarget({
    webSocketDebuggerUrl: resolvedTarget.webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        try {
          const sourceUrl = ${JSON.stringify(sourceUrl)};
          const providerLabel = "Zoom Web App";
          const now = Date.now();
          const identifiers = {
            meetingId: ${JSON.stringify(meetingId || null)},
            meetingNumber: ${JSON.stringify(meetingNumber || meetingId || null)},
          };
          const title = ${JSON.stringify(title || "Zoom")};

          if (!chrome?.runtime?.sendMessage) {
            return { ok: false, phase: "runtime", reason: "chrome.runtime.sendMessage unavailable" };
          }

          const settingsResponse = await chrome.runtime.sendMessage({
            action: "getSettings",
          });
          const currentSettings =
            settingsResponse && typeof settingsResponse === "object"
              ? settingsResponse.settings || null
              : null;
          if (currentSettings && typeof currentSettings === "object") {
            const currentWindowMinutes = Number(
              currentSettings.sessionContinuationWindowMinutes || 0
            );
            const targetWindowMinutes = Number.isFinite(currentWindowMinutes)
              ? Math.max(60, currentWindowMinutes)
              : 120;
            const desiredSettings = {
              ...currentSettings,
              captureStartupBehavior: "ask",
              sessionContinuationWindowMinutes: targetWindowMinutes,
            };
            await chrome.runtime.sendMessage({
              action: "saveSettings",
              settings: desiredSettings,
            });
          }

          const resolveResponse = await chrome.runtime.sendMessage({
            action: "resolveMeetingSession",
            platform: "zoom-web",
            providerLabel,
            sourceUrl,
            title,
            identifiers,
            reusePolicy: "force-new",
          });

          if (!resolveResponse?.success || !resolveResponse?.session) {
            return { ok: false, phase: "resolve", response: resolveResponse || null };
          }

          const session = resolveResponse.session;
          const endedSession = {
            ...session,
            meetingUrl: sourceUrl,
            providerLabel,
            title: session.title || title,
            identifiers: {
              ...(session.identifiers || {}),
              ...identifiers,
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
            return { ok: false, phase: "finalize", response: finalizeResponse || null };
          }

          const candidateResponse = await chrome.runtime.sendMessage({
            action: "findMeetingSessionContinuationCandidate",
            platform: "zoom-web",
            providerLabel,
            sourceUrl,
            title: endedSession.title,
            identifiers: endedSession.identifiers,
          });

          return {
            ok: Boolean(candidateResponse?.success && candidateResponse?.candidate),
            phase: "candidate",
            candidate: candidateResponse?.candidate || null,
            sessionId: endedSession.id,
          };
        } catch (error) {
          return {
            ok: false,
            phase: "exception",
            error: String(error),
          };
        }
      }
    )()`,
  });

  if (!result?.ok) {
    throw new Error(`Zoom continuation seed failed: ${JSON.stringify(result || null)}`);
  }

  return result;
}

async function runZoomJourneyFlow({
  baseUrl,
  targetInput,
  target,
}) {
  const ws = target.webSocketDebuggerUrl;
  const initialProbe = await probeTarget(ws, Math.max(260, evalDelayMs), false);
  const initialHref = String(initialProbe?.href || targetInput.url || "");
  const meetingId = extractZoomMeetingId(initialHref);
  if (!meetingId) {
    throw new Error(`Zoom journey could not extract meeting id from URL: ${initialHref}`);
  }
  const expectedRuntimeId = parseRuntimeIdFromMarker(initialProbe?.markerContent);

  await clickInTarget(ws, {
    selectors: ["#btn_end_meeting"],
    textIncludes: ["start this meeting", "end it and start", "leave and start"],
    includeAnchors: false,
    delayMs: 700,
  });

  let leaveClicked = false;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    leaveClicked = await clickInTarget(ws, {
      selectors: [
        "button[aria-label='Leave']",
        "button[aria-label*='Leave']",
        "#btn-leave-meeting",
      ],
      textIncludes: ["leave"],
      includeAnchors: false,
      delayMs: 850,
    });
    if (leaveClicked) {
      break;
    }
  }
  if (!leaveClicked) {
    throw new Error("Zoom journey could not click Leave control.");
  }

  // Handle confirmation/busy dialog variants after pressing Leave.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await clickInTarget(ws, {
      selectors: ["#btn_end_meeting"],
      textIncludes: [
        "start this meeting",
        "end it and start",
        "leave meeting",
        "leave now",
        "confirm",
      ],
      includeAnchors: false,
      delayMs: 700,
    });
  }

  const leftState = await waitForZoomUrlState(ws, {
    timeoutMs: 25000,
    pollMs: 1000,
    expectMeeting: false,
  });
  let usedSyntheticEnd = false;
  if (!leftState.ok) {
    usedSyntheticEnd = true;
    if (target?.id) {
      try {
        await closeCdpTarget(baseUrl, target.id);
      } catch {
        // Best-effort; a fresh rejoin tab is still created below.
      }
    }
  }

  const seeded = await seedZoomContinuationCandidate(baseUrl, {
    sourceUrl: initialHref,
    title: initialProbe?.title || "Zoom",
    meetingId,
    meetingNumber: meetingId,
    expectedRuntimeId,
  });

  const rejoinTarget = await createTarget(baseUrl, initialHref);
  const rejoinWs = rejoinTarget.webSocketDebuggerUrl;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    await clickInTarget(rejoinWs, {
      selectors: [
        "#zoom-ui-frame > div.bhauZU7H > div > div.ifP196ZE.x2RD4pnS > div > button.zoom-button.zoom-button--lg.zoom-button--secondary.g7nkJFrV",
      ],
      textIncludes: ["join from browser"],
      includeAnchors: false,
      delayMs: 650,
    });
    await clickInTarget(rejoinWs, {
      selectors: ["#btn_end_meeting"],
      textIncludes: [
        "start this meeting",
        "end it and start",
        "leave and start",
      ],
      includeAnchors: false,
      delayMs: 650,
    });
  }

  const rejoined = await waitForZoomUrlState(rejoinWs, {
    timeoutMs: 45000,
    pollMs: 1200,
    expectMeeting: true,
  });
  if (!rejoined.ok) {
    throw new Error(
      `Zoom journey failed to rejoin meeting route. Last href=${rejoined.state?.href || "n/a"}`
    );
  }

  let promptSettle = await waitForOverlayPromptsAcrossZoomMeetingTargets(baseUrl, {
    preferredWebSocketDebuggerUrl: rejoinWs,
    timeoutMs: Math.max(45000, promptWaitMs * 4),
    pollMs: Math.max(140, promptPollMs),
    settleQuietMs: 1200,
  });
  if (!promptSettle.ok && requirePromptResolution) {
    throw new Error(
      `Zoom journey rejoin prompt remained unresolved. Result=${JSON.stringify(
        promptSettle.lastResult
      )}`
    );
  }

  let kindsSeen = Array.from(new Set(promptSettle.kindsSeen || []));
  let finalProbeSocket = promptSettle.lastPromptWs || rejoinWs;
  let finalSeededSessionId = seeded.sessionId || null;

  if (!kindsSeen.includes("session-continuation")) {
    // Hard-reset fallback: clear meeting tabs, seed again, and retry rejoin on a fresh tab.
    const liveTargets = await listZoomMeetingPageTargets(baseUrl).catch(() => []);
    for (const liveTarget of liveTargets) {
      try {
        await closeCdpTarget(baseUrl, liveTarget.id);
      } catch {
        // Best-effort close.
      }
    }

    const reseeded = await seedZoomContinuationCandidate(baseUrl, {
      sourceUrl: initialHref,
      title: initialProbe?.title || "Zoom",
      meetingId,
      meetingNumber: meetingId,
      expectedRuntimeId,
    });
    finalSeededSessionId = reseeded.sessionId || finalSeededSessionId;

    const retryTarget = await createTarget(baseUrl, initialHref);
    const retryWs = retryTarget.webSocketDebuggerUrl;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await clickInTarget(retryWs, {
        selectors: [
          "#zoom-ui-frame > div.bhauZU7H > div > div.ifP196ZE.x2RD4pnS > div > button.zoom-button.zoom-button--lg.zoom-button--secondary.g7nkJFrV",
        ],
        textIncludes: ["join from browser"],
        includeAnchors: false,
        delayMs: 650,
      });
      await clickInTarget(retryWs, {
        selectors: ["#btn_end_meeting"],
        textIncludes: [
          "start this meeting",
          "end it and start",
          "leave and start",
        ],
        includeAnchors: false,
        delayMs: 650,
      });
    }

    const retryRejoined = await waitForZoomUrlState(retryWs, {
      timeoutMs: 50000,
      pollMs: 1200,
      expectMeeting: true,
    });
    if (!retryRejoined.ok) {
      throw new Error(
        `Zoom journey retry failed to rejoin meeting route. Last href=${
          retryRejoined.state?.href || "n/a"
        }`
      );
    }

    promptSettle = await waitForOverlayPromptsAcrossZoomMeetingTargets(baseUrl, {
      preferredWebSocketDebuggerUrl: retryWs,
      timeoutMs: Math.max(60000, promptWaitMs * 5),
      pollMs: Math.max(140, promptPollMs),
      settleQuietMs: 1200,
    });
    kindsSeen = Array.from(new Set(promptSettle.kindsSeen || []));
    finalProbeSocket = promptSettle.lastPromptWs || retryWs;
  }

  if (!kindsSeen.includes("session-continuation")) {
    throw new Error(
      `Zoom journey expected 'session-continuation' prompt on rejoin, saw: ${
        kindsSeen.length > 0 ? kindsSeen.join(", ") : "none"
      }`
    );
  }

  const finalProbe = await probeTarget(
    finalProbeSocket,
    Math.max(260, evalDelayMs),
    false
  );
  const finalMeetingId = extractZoomMeetingId(finalProbe?.href || "");
  if (!finalMeetingId || finalMeetingId !== meetingId) {
    throw new Error(
      `Zoom journey rejoined unexpected meeting. expected=${meetingId} actual=${finalMeetingId || "n/a"}`
    );
  }

  return {
    meetingId,
    leaveClicked,
    usedSyntheticEnd,
    seededSessionId: finalSeededSessionId,
    promptKindsSeen: kindsSeen,
    finalProbe,
  };
}

let smokeFailureMessage = null;

try {
  const resolved = await resolveCdpEndpoint({ port, waitMs });
  await runWithTemporaryDiagnosticsConfig({
    baseUrl: resolved.baseUrl,
    minLevel: process.env.SMOKE_DIAGNOSTICS_MIN_LEVEL || "debug",
    clearExisting: true,
    operation: async () => {
      const runZoomJourney =
        provider === "zoom-web" &&
        (scenario === "journey" || scenario === "lifecycle");
      const normalizedScenario = runZoomJourney
        ? "journey"
        : scenario === "continuation"
          ? "lobby"
          : scenario;
      const expectContinuationPrompt =
        provider === "google-meet" && scenario === "continuation";
      const targetInput = await resolveProviderScenarioUrl({
        provider,
        scenario: normalizedScenario,
        baseUrl: resolved.baseUrl,
        targets: resolved.targets,
      });

      let target = null;
      let tabStrategy = "created-new-target";
      if (singleTabMode) {
        target =
          findPageTargetByUrl(resolved.targets, targetInput.url) ||
          findPageTargetByUrl(await listTargets(resolved.baseUrl), targetInput.url);

        if (target) {
          tabStrategy = "reused-existing-target";
        }
      }

      if (!target) {
        target = await createTarget(resolved.baseUrl, targetInput.url);
      }

      let probe = null;
      let teamsMeta = null;
      let zoomJourneyMeta = null;
      let expectedContinuationRuntimeId = null;
      const googleMeetingCode = expectContinuationPrompt
        ? extractGoogleMeetingCode(targetInput.url)
        : null;

      if (provider === "google-meet" && forceFreshGoogleMeetUrl) {
        console.log("Google Meet URL mode: force-fresh");
      }

      if (expectContinuationPrompt) {
        console.log("Preparing continuation candidate for this meeting URL...");
        const preSeedProbe = await probeTarget(
          target.webSocketDebuggerUrl,
          Math.max(220, evalDelayMs),
          false
        );
        expectedContinuationRuntimeId = parseRuntimeIdFromMarker(
          preSeedProbe?.markerContent
        );
        const seed = await seedGoogleContinuationCandidate(
          resolved.baseUrl,
          targetInput.url,
          expectedContinuationRuntimeId
        );
        console.log(
          `Continuation candidate seeded: session=${seed.sessionId || "n/a"} candidate=${seed.candidate?.sessionId || "n/a"}`
        );
        await reloadTarget(target.webSocketDebuggerUrl);
        await sleep(Math.max(350, evalDelayMs));
      }

      await waitStep("Preparing provider page probe");
      let promptSettleResult = null;

      if (expectContinuationPrompt) {
        promptSettleResult = await waitForOverlayPromptsAcrossGoogleMeetingTargets(
          resolved.baseUrl,
          {
            preferredWebSocketDebuggerUrl: target.webSocketDebuggerUrl,
            meetingCode: googleMeetingCode || "",
            timeoutMs: Math.max(30000, promptWaitMs * 3),
            pollMs: Math.max(140, promptPollMs),
            settleQuietMs: 1200,
          }
        );
      } else {
        promptSettleResult = await settleBlockingOverlayPrompts(
          target.webSocketDebuggerUrl
        );
      }

      if (promptSettleResult.seenPrompt) {
        console.log(
          `Overlay prompt handling: seen=${promptSettleResult.seenPrompt ? "yes" : "no"} handled=${promptSettleResult.handledPrompt ? "yes" : "no"}`
        );
        if (promptSettleResult.lastPromptResult?.kind) {
          console.log(`Overlay prompt kind: ${promptSettleResult.lastPromptResult.kind}`);
        }
      }
      if (!promptSettleResult.ok && requirePromptResolution) {
        throw new Error(
          `Blocking overlay prompt remained unresolved. Result=${JSON.stringify(
            promptSettleResult.lastResult
          )}`
        );
      }

      if (provider === "microsoft-teams") {
        teamsMeta = await stabilizeTeamsTarget(target.webSocketDebuggerUrl);
        probe = teamsMeta.probe;
      } else {
        const promptProbeSocket =
          expectContinuationPrompt && promptSettleResult?.lastPromptWs
            ? promptSettleResult.lastPromptWs
            : target.webSocketDebuggerUrl;
        probe = await probeTarget(promptProbeSocket, Math.max(300, evalDelayMs), false);
      }

      if (runZoomJourney) {
        await waitStep("Running Zoom journey flow (leave and rejoin)");
        zoomJourneyMeta = await runZoomJourneyFlow({
          baseUrl: resolved.baseUrl,
          targetInput,
          target,
        });
        probe = zoomJourneyMeta.finalProbe;
      }

      if (expectContinuationPrompt) {
        let promptKindsSeen = Array.from(
          new Set(
            [
              ...(Array.isArray(promptSettleResult?.kindsSeen)
                ? promptSettleResult.kindsSeen
                : []),
              promptSettleResult?.lastPromptResult?.kind || null,
            ].filter(Boolean)
          )
        );

        if (!promptKindsSeen.includes("session-continuation")) {
          console.log("Retrying Google Meet continuation prompt on a fresh target...");
          const preRetryProbe = await probeTarget(
            target.webSocketDebuggerUrl,
            Math.max(220, evalDelayMs),
            false
          ).catch(() => null);
          expectedContinuationRuntimeId =
            expectedContinuationRuntimeId ||
            parseRuntimeIdFromMarker(preRetryProbe?.markerContent);
          const reseed = await seedGoogleContinuationCandidate(
            resolved.baseUrl,
            targetInput.url,
            expectedContinuationRuntimeId
          );
          console.log(
            `Continuation candidate reseeded: session=${reseed.sessionId || "n/a"} candidate=${reseed.candidate?.sessionId || "n/a"}`
          );
          target = await createTarget(resolved.baseUrl, targetInput.url);
          tabStrategy = "created-fresh-continuation-target";
          promptSettleResult = await waitForOverlayPromptsAcrossGoogleMeetingTargets(
            resolved.baseUrl,
            {
              preferredWebSocketDebuggerUrl: target.webSocketDebuggerUrl,
              meetingCode: googleMeetingCode || "",
              timeoutMs: Math.max(45000, promptWaitMs * 4),
              pollMs: Math.max(140, promptPollMs),
              settleQuietMs: 1200,
            }
          );
          if (promptSettleResult.seenPrompt) {
            console.log(
              `Overlay prompt retry handling: seen=${promptSettleResult.seenPrompt ? "yes" : "no"} handled=${promptSettleResult.handledPrompt ? "yes" : "no"}`
            );
            if (promptSettleResult.lastPromptResult?.kind) {
              console.log(
                `Overlay prompt retry kind: ${promptSettleResult.lastPromptResult.kind}`
              );
            }
          }

          probe = await probeTarget(
            promptSettleResult?.lastPromptWs || target.webSocketDebuggerUrl,
            Math.max(300, evalDelayMs),
            false
          );
        }

        if (!promptSettleResult.seenPrompt) {
          throw new Error(
            "Expected session continuation prompt, but no startup prompt was observed."
          );
        }
        promptKindsSeen = Array.from(
          new Set(
            [
              ...(Array.isArray(promptSettleResult?.kindsSeen)
                ? promptSettleResult.kindsSeen
                : []),
              promptSettleResult?.lastPromptResult?.kind || null,
            ].filter(Boolean)
          )
        );
        if (!promptKindsSeen.includes("session-continuation")) {
          throw new Error(
            `Expected 'session-continuation' prompt, but saw '${
              promptKindsSeen.length > 0 ? promptKindsSeen.join(", ") : "unknown"
            }'.`
          );
        }
      }

      if (!probe) {
        throw new Error("No probe data was collected from target page.");
      }

      const finalHref = typeof probe?.href === "string" ? probe.href : "";
      const onExpectedHost = isExpectedProviderHost(provider, finalHref);
      const injected = Boolean(probe?.injected);
      const diagnosticsPayload = await getDiagnosticsPayloadFromRuntime({
        baseUrl: resolved.baseUrl,
        query: {
          minLevel: "debug",
          limit: 200,
          provider,
          runtime: "content",
          pageUrl: finalHref,
          snapshotBaseKey: "content-runtime",
        },
      }).catch(() => null);
      const contentRuntimeSnapshot = diagnosticsPayload?.resolvedSnapshot?.data || null;

      console.log("Provider smoke check");
      console.log(`Provider: ${provider}`);
      console.log(`Scenario: ${scenario}`);
      console.log(`CDP base URL: ${resolved.baseUrl}`);
      console.log(`Requested URL: ${targetInput.url}`);
      console.log(`URL source: ${targetInput.source}`);
      console.log(`Tab strategy: ${tabStrategy}`);
      if (targetInput.note) {
        console.log(`URL note: ${targetInput.note}`);
      }
      console.log(`Final href: ${probe?.href || "n/a"}`);
      console.log(`Final title: ${probe?.title || "n/a"}`);
      console.log(`Final URL matches provider host: ${onExpectedHost ? "yes" : "no"}`);
      console.log(`Content script injected marker: ${injected ? "yes" : "no"}`);
      console.log(
        `Diagnostics enabled: ${diagnosticsPayload?.config?.enabled ? "yes" : "no"}`
      );
      console.log(
        `Diagnostics providerPlatform: ${contentRuntimeSnapshot?.providerPlatform || "n/a"}`
      );
      console.log(
        `Diagnostics initialPresence: ${contentRuntimeSnapshot?.initialPresence || "n/a"}`
      );
      if (diagnosticsPayload?.counts) {
        console.log(`Diagnostics counts: ${JSON.stringify(diagnosticsPayload.counts)}`);
      }
      console.log(`Overlay element detected: ${probe?.hasOverlay ? "yes" : "no"}`);
      if (provider === "google-meet") {
        console.log(
          `Invalid meeting code surface: ${
            probe?.invalidMeetingCodeDetected ? "yes" : "no"
          }`
        );
        if (probe?.invalidMeetingCodeDetected) {
          console.log(`Invalid meeting code reason: ${probe?.invalidMeetingCodeReason || "n/a"}`);
        }
      }
      if (provider === "microsoft-teams" && teamsMeta) {
        console.log(`Teams auto-continue clicks: ${teamsMeta.continueClickCount}`);
        console.log(`Teams auto-refresh count: ${teamsMeta.reloadCount}`);
        console.log(`Teams warmup timed out: ${teamsMeta.timedOut ? "yes" : "no"}`);
      }
      if (provider === "zoom-web" && runZoomJourney && zoomJourneyMeta) {
        console.log(`Zoom journey meeting id: ${zoomJourneyMeta.meetingId}`);
        console.log(
          `Zoom journey synthetic-end fallback: ${zoomJourneyMeta.usedSyntheticEnd ? "yes" : "no"}`
        );
        if (zoomJourneyMeta.seededSessionId) {
          console.log(`Zoom journey seeded session: ${zoomJourneyMeta.seededSessionId}`);
        }
        console.log(
          `Zoom journey continuation prompts: ${
            zoomJourneyMeta.promptKindsSeen.join(", ") || "none"
          }`
        );
      }

      if (!onExpectedHost) {
        throw new Error(
          "final URL is not on expected provider host (likely auth/redirect gate). Open provider once in debug profile and rerun."
        );
      }

      if (!injected) {
        throw new Error(
          "content-script marker was not found. Reload extension/runtime and verify extension is enabled in chrome://extensions."
        );
      }

      if (provider === "google-meet" && probe?.invalidMeetingCodeDetected) {
        throw new Error(
          "Google Meet page is invalid (meeting code not accepted or placeholder code detected)."
        );
      }

      console.log("Smoke result: PASS");
    },
  });
} catch (error) {
  smokeFailureMessage = error instanceof Error ? error.message : String(error);
}

if (smokeFailureMessage) {
  console.error(`Smoke failed: ${smokeFailureMessage}`);
  process.exit(1);
}
