#!/usr/bin/env node

import { createTarget, evaluateInTarget } from "./cdp-runtime.mjs";
import { resolveGoogleMeetLobbyUrl } from "./meet-url.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function buildTextClickExpression(texts) {
  return `(() => {
    const wanted = ${JSON.stringify(texts)}.map((value) =>
      String(value || "").trim().toLowerCase()
    );

    const normalize = (value) =>
      String(value || "")
        .replace(/\\s+/g, " ")
        .trim()
        .toLowerCase();

    const isVisible = (node) => {
      if (!node) {
        return false;
      }
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 2 &&
        rect.height > 2
      );
    };

    const nodes = Array.from(
      document.querySelectorAll("button, [role='button'], a, [aria-label], [title], [data-tooltip]")
    ).filter(isVisible);

    for (const node of nodes) {
      const text = normalize(
        (node.textContent || "") +
          " " +
          (node.getAttribute("aria-label") || "") +
          " " +
          (node.getAttribute("title") || "") +
          " " +
          (node.getAttribute("data-tooltip") || "")
      );
      if (!text) {
        continue;
      }

      const matched = wanted.find((token) => text.includes(token));
      if (!matched) {
        continue;
      }

      node.click();
      return { clicked: true, text };
    }

    return { clicked: false };
  })()`;
}

async function clickByText({
  webSocketDebuggerUrl,
  texts,
  attempts = 6,
  delayMs = 350,
} = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await evaluateInTarget({
      webSocketDebuggerUrl,
      delayMs: 120,
      expression: buildTextClickExpression(texts),
    });
    if (result?.clicked) {
      return result;
    }
    await sleep(delayMs);
  }

  return { clicked: false };
}

function buildMeetJoinProbeExpression() {
  return `(() => {
    const href = window.location.href;
    const title = document.title;
    const bodyText = String(document.body?.innerText || "").toLowerCase();
    const injected = Boolean(document.querySelector('meta[name="captionarc-injected"]'));
    const overlay = Boolean(document.querySelector("#captionarc-overlay"));
    const assistantShell = Boolean(document.querySelector("#captionarc-assistant-top-shell"));
    const interactiveElements = Array.from(
      document.querySelectorAll('button, [role="button"]')
    ).filter((element) => element.closest("#captionarc-overlay") === null);
    const leaveControl = interactiveElements.some((button) => {
      const ariaLabel = button.getAttribute('aria-label')?.trim() || '';
      if (/^leave call$/i.test(ariaLabel)) {
        return true;
      }

      const iconText = button
        .querySelector('[data-google-symbols-override="true"]')
        ?.textContent?.trim();
      return iconText === 'call_end';
    });

    return {
      href,
      title,
      injected,
      overlay,
      assistantShell,
      leaveControl,
      readyState: document.readyState,
      onMeetingRoute: /https:\\/\\/meet\\.google\\.com\\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/i.test(href),
      joinNowVisible: bodyText.includes("join now"),
      askToJoinVisible: bodyText.includes("ask to join"),
      prejoinVisible:
        bodyText.includes("ready to join") ||
        bodyText.includes("join now") ||
        bodyText.includes("ask to join"),
      signedOutHint:
        bodyText.includes("sign in") &&
        bodyText.includes("google meet"),
    };
  })()`;
}

function buildAssistantBridgePingExpression() {
  return `(() => {
    return new Promise((resolve) => {
      const requestId = 'join-probe-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      let timeoutId = null;

      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      };

      const handleMessage = (event) => {
        const data = event?.data || null;
        if (!data || data.type !== 'captionarc:dls-capture-response' || data.requestId !== requestId) {
          return;
        }

        cleanup();
        resolve({
          responded: true,
          ok: Boolean(data.ok),
          result: data.result || null,
          resultJson: typeof data.resultJson === 'string' ? data.resultJson : null,
          error: data.error || null,
        });
      };

      timeoutId = window.setTimeout(() => {
        cleanup();
        resolve({ responded: false });
      }, 600);

      window.addEventListener('message', handleMessage);
      window.postMessage({
        type: 'captionarc:dls-capture-request',
        requestId,
        action: 'ping',
        payload: null,
      }, '*');
    });
  })()`;
}

export function extractGoogleMeetCodeFromUrl(url) {
  const match = String(url || "").match(
    /^https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:[/?#]|$)/i
  );
  return match?.[1]?.toLowerCase() || null;
}

async function listTargets(baseUrl) {
  const response = await fetch(`${baseUrl}/json/list`);
  if (!response.ok) {
    throw new Error(`Failed to list CDP targets: HTTP ${response.status}`);
  }
  return await response.json();
}

async function closeTarget(baseUrl, targetId) {
  if (!targetId) {
    return false;
  }

  const response = await fetch(
    `${baseUrl}/json/close/${encodeURIComponent(String(targetId))}`,
    { method: "PUT" }
  );
  return response.ok;
}

export async function closeAllGoogleMeetTabs({
  baseUrl,
  exceptTargetId = null,
} = {}) {
  const targets = await listTargets(baseUrl);
  const meetTargets = targets.filter((target) => {
    if (target?.type !== "page" || !target?.id || target.id === exceptTargetId) {
      return false;
    }

    try {
      const url = new URL(String(target.url || ""));
      return /(^|\.)meet\.google\.com$/i.test(url.hostname);
    } catch {
      return false;
    }
  });

  let closedCount = 0;
  for (const target of meetTargets) {
    if (await closeTarget(baseUrl, target.id)) {
      closedCount += 1;
    }
  }

  return {
    closedCount,
  };
}

export async function ensureChromeExtensionsTab({
  baseUrl,
} = {}) {
  const targets = await listTargets(baseUrl);
  const existing = targets.find(
    (target) =>
      target?.type === "page" && String(target?.url || "") === "chrome://extensions/"
  );
  if (existing) {
    return existing;
  }

  try {
    return await createTarget(baseUrl, "chrome://extensions/");
  } catch {
    return null;
  }
}

export async function createAndJoinGoogleMeetSession({
  baseUrl,
  targets = [],
  joinTimeoutMs = 30000,
} = {}) {
  const resolved = await resolveGoogleMeetLobbyUrl({
    baseUrl,
    targets,
  });

  const target = await createTarget(baseUrl, resolved.url);
  const meetingCode = extractGoogleMeetCodeFromUrl(resolved.url);

  if (!meetingCode) {
    throw new Error(`Resolved Google Meet URL does not contain a meeting code: ${resolved.url}`);
  }

  const joinControls = [
    ["join now"],
    ["ask to join"],
    ["continue without microphone", "continue without mic"],
  ];

  const startedAt = Date.now();
  let lastProbe = null;

  while (Date.now() - startedAt <= joinTimeoutMs) {
    lastProbe = await evaluateInTarget({
      webSocketDebuggerUrl: target.webSocketDebuggerUrl,
      delayMs: 280,
      expression: buildMeetJoinProbeExpression(),
    });

    let bridgeProbe = null;
    if (lastProbe?.injected) {
      bridgeProbe = await evaluateInTarget({
        webSocketDebuggerUrl: target.webSocketDebuggerUrl,
        awaitPromise: true,
        delayMs: 80,
        expression: buildAssistantBridgePingExpression(),
      }).catch(() => null);
    }

    const bridgeSnapshot =
      bridgeProbe?.ok && typeof bridgeProbe?.resultJson === 'string'
        ? JSON.parse(bridgeProbe.resultJson)
        : bridgeProbe?.ok
          ? bridgeProbe?.result || null
          : null;
    const bridgeJoined = bridgeSnapshot?.meetingPresenceState === 'joined';
    lastProbe = {
      ...lastProbe,
      bridgeResponded: Boolean(bridgeProbe?.responded),
      bridgeJoined,
      bridgePresenceState: bridgeSnapshot?.meetingPresenceState || null,
    };

    if (
      lastProbe?.injected &&
      lastProbe?.overlay &&
      lastProbe?.assistantShell &&
      lastProbe?.leaveControl &&
      bridgeJoined
    ) {
      return {
        target,
        meetingCode,
        meetingUrl: resolved.url,
        joinProbe: lastProbe,
      };
    }

    for (const texts of joinControls) {
      await clickByText({
        webSocketDebuggerUrl: target.webSocketDebuggerUrl,
        texts,
        attempts: 1,
        delayMs: 120,
      });
    }

    if (lastProbe?.signedOutHint) {
      throw new Error("Google Meet session did not join because the debug profile appears signed out.");
    }

    await sleep(850);
  }

  throw new Error(
    `Could not join the Google Meet session within timeout. Last probe: ${JSON.stringify(lastProbe || null)}`
  );
}

export async function resolveCaptionArcCapturePrompt({
  webSocketDebuggerUrl,
  timeoutMs = 10000,
  action = "approve",
} = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeoutMs) {
    const result = await evaluateInTarget({
      webSocketDebuggerUrl,
      delayMs: 120,
      expression: `(() => {
        const prompt = document.querySelector(".mc-capture-consent");
        if (!prompt) {
          return { hasPrompt: false };
        }

        const buttons = Array.from(prompt.querySelectorAll("button"));
        const normalize = (value) =>
          String(value || "")
            .replace(/\\s+/g, " ")
            .trim()
            .toLowerCase();
        const buttonTexts = buttons.map((button) =>
          normalize(button.textContent || button.getAttribute("aria-label") || "")
        );
        const targetAction = ${JSON.stringify(action)};
        const preferred = buttons.find((button) => {
          const text = normalize(button.textContent || button.getAttribute("aria-label") || "");
          if (targetAction === "approve") {
            return text.includes("allow") || text.includes("continue") || text.includes("start");
          }
          return text.includes("dismiss") || text.includes("close") || text.includes("not now");
        }) || buttons[0] || null;

        if (!preferred) {
          return { hasPrompt: true, clicked: false, buttonTexts };
        }

        preferred.click();
        return {
          hasPrompt: true,
          clicked: true,
          buttonTexts,
        };
      })()`,
    });

    if (!result?.hasPrompt) {
      return { resolved: true, skipped: true };
    }

    if (result?.clicked) {
      await sleep(240);
      return { resolved: true, clicked: true };
    }

    await sleep(300);
  }

  return { resolved: false };
}

export async function waitForCaptionArcRuntimeReady({
  webSocketDebuggerUrl,
  timeoutMs = 20000,
  pollMs = 500,
} = {}) {
  const startedAt = Date.now();
  let lastProbe = null;

  while (Date.now() - startedAt <= timeoutMs) {
    lastProbe = await evaluateInTarget({
      webSocketDebuggerUrl,
      delayMs: 180,
      expression: buildMeetJoinProbeExpression(),
    });

    if (lastProbe?.injected && lastProbe?.overlay && lastProbe?.assistantShell) {
      return lastProbe;
    }

    await sleep(pollMs);
  }

  throw new Error(
    `CaptionArc runtime did not become ready on the Meet tab. Last probe: ${JSON.stringify(lastProbe || null)}`
  );
}
