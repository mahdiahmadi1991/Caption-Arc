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
      };
    }

    seenPrompt = true;
    lastPromptResult = result;
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

let smokeFailureMessage = null;

try {
  const resolved = await resolveCdpEndpoint({ port, waitMs });
  await runWithTemporaryDiagnosticsConfig({
    baseUrl: resolved.baseUrl,
    minLevel: process.env.SMOKE_DIAGNOSTICS_MIN_LEVEL || "debug",
    clearExisting: true,
    operation: async () => {
      const normalizedScenario = scenario === "continuation" ? "lobby" : scenario;
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
        const expectedRuntimeId = parseRuntimeIdFromMarker(preSeedProbe?.markerContent);
        const seed = await seedGoogleContinuationCandidate(
          resolved.baseUrl,
          targetInput.url,
          expectedRuntimeId
        );
        console.log(
          `Continuation candidate seeded: session=${seed.sessionId || "n/a"} candidate=${seed.candidate?.sessionId || "n/a"}`
        );
        await reloadTarget(target.webSocketDebuggerUrl);
        await sleep(Math.max(350, evalDelayMs));
      }

      let probe = null;
      let teamsMeta = null;

      await waitStep("Preparing provider page probe");
      const promptSettleResult = await settleBlockingOverlayPrompts(
        target.webSocketDebuggerUrl
      );
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
        probe = await probeTarget(target.webSocketDebuggerUrl, Math.max(300, evalDelayMs), false);
      }

      if (expectContinuationPrompt) {
        const promptKind = promptSettleResult?.lastPromptResult?.kind || null;
        if (!promptSettleResult.seenPrompt) {
          throw new Error(
            "Expected session continuation prompt, but no startup prompt was observed."
          );
        }
        if (promptKind !== "session-continuation") {
          throw new Error(
            `Expected 'session-continuation' prompt, but saw '${promptKind || "unknown"}'.`
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
