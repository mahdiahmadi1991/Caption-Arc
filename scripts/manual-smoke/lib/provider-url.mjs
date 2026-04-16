#!/usr/bin/env node

import { createTarget, evaluateInTarget } from "./cdp-runtime.mjs";
import { resolveGoogleMeetLobbyUrl, resolveGoogleMeetUrl } from "./meet-url.mjs";

const SUPPORTED_PROVIDERS = ["google-meet", "microsoft-teams", "zoom-web"];
const SUPPORTED_SCENARIOS = [
  "lobby",
  "prejoin",
  "meeting",
  "in-meeting",
  "continuation",
  "meeting-direct",
  "meeting-scheduled",
  "meeting-shared",
  "journey",
  "lifecycle",
];
const ZOOM_RESOLVE_DEBUG = process.env.SMOKE_VERBOSE_ZOOM_RESOLVE === "1";

function logZoomResolve(stage, data = null) {
  if (!ZOOM_RESOLVE_DEBUG) {
    return;
  }
  const suffix = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[zoom-resolve] ${stage}${suffix}`);
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeZoomInviteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.replace(/&amp;/gi, "&");
  const parsed = parseUrl(normalized);
  if (!parsed || !isZoomHost(parsed) || parsed.protocol !== "https:") {
    return "";
  }

  if (
    /^\/(?:j\/\d+|wc\/join\/\d+|wc\/\d+\/(?:start|join)|w\/\d+)(?:\/|$)/i.test(
      parsed.pathname
    )
  ) {
    return parsed.toString();
  }

  return "";
}

function normalizeScenario(raw) {
  const value = String(raw || "meeting").trim().toLowerCase();
  if (value === "prejoin") {
    return "lobby";
  }
  if (value === "in-meeting") {
    return "meeting";
  }
  if (value === "resume") {
    return "continuation";
  }
  if (value === "direct") {
    return "meeting-direct";
  }
  if (value === "scheduled" || value === "schedule") {
    return "meeting-scheduled";
  }
  if (value === "shared" || value === "invite" || value === "guest") {
    return "meeting-shared";
  }
  if (value === "journey" || value === "e2e") {
    return "journey";
  }
  if (value === "lifecycle") {
    return "lifecycle";
  }
  return value;
}

function normalizeProvider(raw) {
  return String(raw || "google-meet").trim().toLowerCase();
}

function isTeamsHost(url) {
  return (
    /(^|\.)teams\.microsoft\.com$/i.test(url.hostname) ||
    /(^|\.)teams\.live\.com$/i.test(url.hostname)
  );
}

function isZoomHost(url) {
  return /(^|\.)zoom\.us$/i.test(url.hostname);
}

function isGoogleMeetHost(url) {
  return /(^|\.)meet\.google\.com$/i.test(url.hostname);
}

function isGoogleMeetCandidate(url) {
  return isGoogleMeetHost(url) && url.protocol === "https:";
}

function isTeamsCandidate(url) {
  if (!isTeamsHost(url) || url.protocol !== "https:") {
    return false;
  }

  return (
    url.pathname.includes("/l/meetup-join/") ||
    url.pathname.includes("/meet/") ||
    /^\/v2\/?$/i.test(url.pathname)
  );
}

function isZoomCandidate(url) {
  if (!isZoomHost(url) || url.protocol !== "https:") {
    return false;
  }

  return (
    /^\/wc\/\d+\/(?:start|join)(?:\/|$)/.test(url.pathname) ||
    /^\/wc\/join\/\d+(?:\/|$)/.test(url.pathname) ||
    /^\/j\/\d+(?:\/|$)/.test(url.pathname) ||
    /^\/w\/\d+(?:\/|$)/.test(url.pathname)
  );
}

function targetMatchesProvider(provider, targetUrl) {
  const parsed = parseUrl(targetUrl);
  if (!parsed) {
    return false;
  }

  if (provider === "google-meet") {
    return isGoogleMeetCandidate(parsed);
  }
  if (provider === "microsoft-teams") {
    return isTeamsCandidate(parsed);
  }
  if (provider === "zoom-web") {
    return isZoomCandidate(parsed);
  }

  return false;
}

function pickExistingTarget(provider, targets) {
  const urls = targets
    .map((target) => (typeof target?.url === "string" ? target.url : ""))
    .filter((value) => value.length > 0)
    .filter((value) => targetMatchesProvider(provider, value));

  if (urls.length === 0) {
    return null;
  }

  return {
    url: urls[0],
    source: "existing-target",
    note: `Using existing ${provider} target from CDP.`,
  };
}

function resolveTeamsFallbackUrl(scenario) {
  throw new Error(
    scenario === "meeting"
      ? "Teams smoke requires a real meeting URL from .secrets/smoke.env or the active debug session. Set TEAMS_URL or open an authenticated Teams meeting tab first."
      : "Teams smoke requires a real prejoin URL from .secrets/smoke.env or the active debug session. Set TEAMS_URL or open an authenticated Teams lobby tab first."
  );
}

function resolveZoomFallbackUrl(scenario) {
  if (scenario === "meeting-shared") {
    throw new Error(
      "Zoom shared scenario requires ZOOM_SHARED_URL in .secrets/smoke.env."
    );
  }

  return {
    url: "https://app.zoom.us/wc/home",
    source: "zoom-home-fallback",
    note: "Fallback to Zoom home route. Sign in and start/join a meeting manually.",
  };
}

function getZoomScenarioOptions() {
  return {
    homeUrl: process.env.ZOOM_HOME_URL || "https://app.zoom.us/wc/home",
    scheduleUrl:
      process.env.ZOOM_SCHEDULE_URL || "https://app.zoom.us/meeting/schedule",
    scheduleTopic: process.env.ZOOM_SCHEDULE_TOPIC || "Test - Caption Arc",
    sharedUrl:
      process.env.ZOOM_SHARED_URL ||
      process.env.ZOOM_GUEST_URL ||
      process.env.ZOOM_INVITE_URL ||
      "",
  };
}

async function readCurrentTargetLocation(webSocketDebuggerUrl, delayMs) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: Math.max(250, delayMs),
    expression: `(() => ({ href: window.location.href, title: document.title }))()`,
  });
}

async function waitForZoomCandidateUrl(
  webSocketDebuggerUrl,
  timeoutMs = 30000,
  pollMs = 1200
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const current = await readCurrentTargetLocation(webSocketDebuggerUrl, pollMs);
    const currentUrl = typeof current?.href === "string" ? current.href : "";
    if (currentUrl) {
      const parsed = parseUrl(currentUrl);
      if (parsed && isZoomCandidate(parsed)) {
        return {
          href: currentUrl,
          title: current?.title || "",
        };
      }
    }
  }

  return null;
}

async function waitForZoomCandidateAcrossTargets(
  baseUrl,
  {
    preferredWebSocketDebuggerUrl = "",
    baselineTargetIds = new Set(),
    timeoutMs = 45000,
    pollMs = 1200,
  } = {}
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    if (preferredWebSocketDebuggerUrl) {
      try {
        const current = await readCurrentTargetLocation(
          preferredWebSocketDebuggerUrl,
          pollMs
        );
        const currentUrl = typeof current?.href === "string" ? current.href : "";
        if (currentUrl) {
          const parsed = parseUrl(currentUrl);
          if (parsed && isZoomCandidate(parsed)) {
            return {
              href: currentUrl,
              title: current?.title || "",
            };
          }
        }
      } catch {
        // Preferred target may have been closed/replaced; scan all targets below.
      }
    }

    let pages = [];
    try {
      pages = await listPageTargets(baseUrl);
    } catch {
      pages = [];
    }

    const candidates = pages.filter((target) => {
      const parsed = parseUrl(target.url);
      return parsed && isZoomCandidate(parsed);
    });
    if (candidates.length > 0) {
      candidates.sort((left, right) => {
        const leftFresh = baselineTargetIds.has(left.id) ? 0 : 1;
        const rightFresh = baselineTargetIds.has(right.id) ? 0 : 1;
        return rightFresh - leftFresh;
      });
      return {
        href: candidates[0].url,
        title: candidates[0].title || "",
      };
    }

    const actionTargets = [];
    if (preferredWebSocketDebuggerUrl) {
      actionTargets.push(preferredWebSocketDebuggerUrl);
    }
    for (const target of pages) {
      const parsed = parseUrl(target.url);
      if (!parsed || !isZoomHost(parsed)) {
        continue;
      }
      if (!actionTargets.includes(target.webSocketDebuggerUrl)) {
        actionTargets.push(target.webSocketDebuggerUrl);
      }
    }

    for (const webSocketDebuggerUrl of actionTargets) {
      try {
        await clickZoomAction(webSocketDebuggerUrl, {
          selectors: [
            "#zoom-ui-frame > div.bhauZU7H > div > div.ifP196ZE.x2RD4pnS > div > button.zoom-button.zoom-button--lg.zoom-button--secondary.g7nkJFrV",
            "#zoom-ui-frame button.zoom-button.zoom-button--secondary",
          ],
          textIncludes: ["join from browser"],
          includeAnchors: false,
          delayMs: 250,
        });
        await clickZoomAction(webSocketDebuggerUrl, {
          selectors: ["#btn_end_meeting"],
          textIncludes: [
            "start this meeting",
            "end it and start",
            "leave and start",
            "switch to this meeting",
          ],
          includeAnchors: false,
          delayMs: 250,
        });
      } catch {
        // Ignore per-target interaction failures while polling for settled candidate.
      }
    }
  }

  return null;
}

async function listPageTargets(baseUrl) {
  const response = await fetch(`${baseUrl}/json/list`);
  if (!response.ok) {
    throw new Error(`Failed to list CDP targets: HTTP ${response.status}`);
  }

  const targets = await response.json();
  if (!Array.isArray(targets)) {
    return [];
  }

  return targets.filter(
    (target) =>
      target?.type === "page" &&
      typeof target?.id === "string" &&
      typeof target?.url === "string" &&
      typeof target?.webSocketDebuggerUrl === "string"
  );
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

function isZoomMeetingInfoTarget(target) {
  const parsed = parseUrl(target?.url || "");
  if (!parsed || !isZoomHost(parsed)) {
    return false;
  }

  if (/^\/meeting\/\d+(?:\/|$)/.test(parsed.pathname)) {
    return true;
  }

  const title = String(target?.title || "");
  return /meeting information/i.test(title);
}

function isZoomActiveMeetingTarget(target) {
  const parsed = parseUrl(target?.url || "");
  if (!parsed || !isZoomHost(parsed)) {
    return false;
  }

  return (
    /^\/wc\/\d+\/(?:start|join)(?:\/|$)/.test(parsed.pathname) ||
    /^\/wc\/join\/\d+(?:\/|$)/.test(parsed.pathname)
  );
}

async function enforceZoomSingleActiveMeeting(baseUrl) {
  const pages = await listPageTargets(baseUrl);
  const activeTabs = pages.filter((target) => isZoomActiveMeetingTarget(target));
  if (activeTabs.length === 0) {
    return;
  }

  // For deterministic smoke, always start with zero active Zoom meeting tabs.
  for (const target of activeTabs) {
    try {
      await closeCdpTarget(baseUrl, target.id);
    } catch {
      // Ignore close failures; downstream flow still has in-page fallbacks.
    }
  }
}

async function extractZoomInviteUrlFromTarget(
  webSocketDebuggerUrl,
  delayMs = 700
) {
  const extracted = await evaluateInTarget({
    webSocketDebuggerUrl,
    delayMs: Math.max(300, delayMs),
    expression: `(() => {
      try {
        const invitePattern =
          /https:\\/\\/[\\w.-]*zoom\\.us\\/(?:j\\/\\d+|wc\\/join\\/\\d+|wc\\/\\d+\\/(?:start|join)|w\\/\\d+)[^\\s"'<>]*/i;
        const directInviteAnchor =
          document.querySelector("#registration > a") ||
          document.querySelector("#registration a[href]");
        if (directInviteAnchor instanceof HTMLAnchorElement) {
          const href = String(directInviteAnchor.getAttribute("href") || "").trim();
          if (href) {
            try {
              return new URL(href, window.location.href).toString();
            } catch {
              return href;
            }
          }
        }

        const inviteCopyButton = document.querySelector("#registration > button");
        if (inviteCopyButton instanceof HTMLButtonElement) {
          const buttonAttrs = [
            inviteCopyButton.getAttribute("data-clipboard-text"),
            inviteCopyButton.getAttribute("data-copy"),
            inviteCopyButton.getAttribute("data-url"),
            inviteCopyButton.getAttribute("data-link"),
            inviteCopyButton.getAttribute("value"),
            inviteCopyButton.getAttribute("aria-label"),
            inviteCopyButton.getAttribute("title"),
            inviteCopyButton.getAttribute("onclick"),
          ];

          for (const rawValue of buttonAttrs) {
            const value = String(rawValue || "").trim();
            if (!value) {
              continue;
            }

            const matched = value.match(invitePattern);
            if (matched?.[0]) {
              return matched[0];
            }
          }
        }

        const registrationText = String(
          document.querySelector("#registration")?.textContent || ""
        );
        const registrationMatch = registrationText.match(invitePattern);
        if (registrationMatch?.[0]) {
          return registrationMatch[0];
        }

        const candidates = [];

        for (const input of document.querySelectorAll("input, textarea")) {
          if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
            continue;
          }

          const value = String(input.value || "").trim();
          if (invitePattern.test(value)) {
            candidates.push(value);
          }
        }

        for (const link of document.querySelectorAll("a[href]")) {
          const href = String(link.getAttribute("href") || "").trim();
          if (invitePattern.test(href)) {
            candidates.push(href);
          }
        }

        return candidates[0] || "";
      } catch {
        return "";
      }
    })()`,
  });

  return normalizeZoomInviteUrl(extracted);
}

async function clickZoomAction(
  webSocketDebuggerUrl,
  {
    selectors = [],
    textIncludes = [],
    includeAnchors = true,
    delayMs = 600,
  } = {}
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

        const roots = [document];
        for (const frame of document.querySelectorAll("iframe")) {
          try {
            if (frame.contentDocument) {
              roots.push(frame.contentDocument);
            }
          } catch {
            // Cross-origin frame; ignore.
          }
        }

        const selectorList = ${JSON.stringify(selectors)};
        const textList = ${JSON.stringify(textIncludes.map((value) => value.toLowerCase()))};

        for (const root of roots) {
          for (const selector of selectorList) {
            const node = root.querySelector(selector);
            if (!(node instanceof HTMLElement) || !isVisible(node)) {
              continue;
            }
            clickNode(node);
            return true;
          }
        }

        const candidateSelector = ${JSON.stringify(
          includeAnchors
            ? "button, [role='button'], a, [data-testid], [aria-label]"
            : "button, [role='button'], [data-testid], [aria-label]"
        )};

        for (const root of roots) {
          const candidates = Array.from(root.querySelectorAll(candidateSelector));

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

            if (textList.some((keyword) => text.includes(keyword))) {
              clickNode(node);
              return true;
            }
          }
        }

        return false;
      })()`,
    })
  );
}

async function waitForZoomScheduleFormReady(
  webSocketDebuggerUrl,
  { timeoutMs = 30000, pollMs = 900 } = {}
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const ready = Boolean(
      await evaluateInTarget({
        webSocketDebuggerUrl,
        delayMs: Math.max(250, pollMs),
        expression: `(() => {
          const topic = document.querySelector("#topic");
          const save = document.querySelector("button.save-btn");
          const visible = (node) => {
            if (!(node instanceof HTMLElement)) {
              return false;
            }
            const style = window.getComputedStyle(node);
            return style.display !== "none" && style.visibility !== "hidden";
          };

          return Boolean(topic && save && visible(topic) && visible(save));
        })()`,
      })
    );

    if (ready) {
      return true;
    }
  }

  return false;
}

async function clickZoomScheduleSave(webSocketDebuggerUrl, delayMs = 800) {
  return Boolean(
    await evaluateInTarget({
      webSocketDebuggerUrl,
      delayMs: Math.max(300, delayMs),
      expression: `(() => {
        const selectors = [
          "#app > div > div > div > div:nth-child(2) > div > div > div.zoom-sticky--fixed > div > button.zoom-button.zoom-button--md.zoom-button--primary.save-btn",
          "button.save-btn",
          "button.zoom-button--primary.save-btn",
        ];

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

        for (const selector of selectors) {
          const node = document.querySelector(selector);
          if (!(node instanceof HTMLButtonElement) || !isVisible(node)) {
            continue;
          }
          const text = normalize(node.textContent || node.getAttribute("aria-label") || "");
          if (text && !text.includes("save")) {
            continue;
          }
          clickNode(node);
          return true;
        }

        return false;
      })()`,
    })
  );
}

async function resolveZoomMeetingFromHome(baseUrl, probeDelayMs, homeUrl) {
  const target = await createTarget(baseUrl, homeUrl);
  const ws = target.webSocketDebuggerUrl;

  const initial = await readCurrentTargetLocation(ws, probeDelayMs);
  const initialUrl = typeof initial?.href === "string" ? initial.href : "";
  if (targetMatchesProvider("zoom-web", initialUrl)) {
    return {
      url: initialUrl,
      source: "zoom-existing-home-route",
      note: "Zoom home already redirected to a matching meeting route.",
      observedHref: initialUrl,
      observedTitle: initial?.title || "",
    };
  }

  await clickZoomAction(ws, {
    selectors: [
      "#home-tabpanel-main > div.main__actions.home__actions > div > div.main__action-start > button",
    ],
    textIncludes: ["new meeting"],
    delayMs: 1200,
  });

  await clickZoomAction(ws, {
    textIncludes: ["start this meeting", "start meeting", "end it and start"],
    delayMs: 1000,
  });

  const settled = await waitForZoomCandidateUrl(ws, 35000, 1400);
  if (settled?.href && targetMatchesProvider("zoom-web", settled.href)) {
    return {
      url: settled.href,
      source: "zoom-home-new-meeting",
      note: "Generated Zoom meeting route from app.zoom.us/wc/home via New Meeting.",
      observedHref: settled.href,
      observedTitle: settled.title || "",
    };
  }

  return null;
}

async function resolveZoomInviteLinkFromSchedule(
  baseUrl,
  probeDelayMs,
  scheduleUrl,
  scheduleTopic
) {
  logZoomResolve("schedule:start", { scheduleUrl, scheduleTopic });
  const target = await createTarget(baseUrl, scheduleUrl);
  const ws = target.webSocketDebuggerUrl;

  const scheduleReady = await waitForZoomScheduleFormReady(ws, {
    timeoutMs: 32000,
    pollMs: Math.max(700, probeDelayMs),
  });
  logZoomResolve("schedule:ready", { scheduleReady, targetId: target.id });
  if (!scheduleReady) {
    return null;
  }

  let topicSet = false;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    topicSet = Boolean(
      await evaluateInTarget({
        webSocketDebuggerUrl: ws,
        delayMs: Math.max(500, probeDelayMs),
        expression: `(() => {
          const topic = ${JSON.stringify(scheduleTopic)};
          const selectors = [
            '#topic',
            'input[name*="topic" i]',
            'input[id*="topic" i]',
            'textarea[name*="topic" i]',
            'textarea[id*="topic" i]',
            'input[placeholder*="topic" i]',
            'textarea[placeholder*="topic" i]',
          ];

          for (const selector of selectors) {
            const field = document.querySelector(selector);
            if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
              continue;
            }

            field.focus();
            field.value = topic;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }

          return false;
        })()`,
      })
    );
    if (topicSet) {
      break;
    }
  }
  logZoomResolve("schedule:topic-set", { topicSet });

  if (!topicSet) {
    return null;
  }

  let baselineTargetIds = new Set();
  try {
    const baselinePages = await listPageTargets(baseUrl);
    baselineTargetIds = new Set(baselinePages.map((target) => target.id));
  } catch {
    // Fallback to current schedule target only.
  }

  let saveClicked = false;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    saveClicked = await clickZoomScheduleSave(ws, 900);
    if (saveClicked) {
      break;
    }
  }
  logZoomResolve("schedule:save-clicked", { saveClicked });

  if (!saveClicked) {
    return null;
  }

  let inviteUrl = "";
  for (let index = 0; index < 32; index += 1) {
    let candidateTargets = [];
    try {
      const pages = await listPageTargets(baseUrl);
      candidateTargets = pages.filter((target) => isZoomMeetingInfoTarget(target));
      candidateTargets.sort((left, right) => {
        const leftFresh = baselineTargetIds.has(left.id) ? 0 : 1;
        const rightFresh = baselineTargetIds.has(right.id) ? 0 : 1;
        return rightFresh - leftFresh;
      });
    } catch {
      candidateTargets = [];
    }
    logZoomResolve("schedule:poll-targets", {
      poll: index,
      candidateCount: candidateTargets.length,
      freshCount: candidateTargets.filter(
        (target) => !baselineTargetIds.has(target.id)
      ).length,
    });

    for (const candidate of candidateTargets) {
      inviteUrl = await extractZoomInviteUrlFromTarget(
        candidate.webSocketDebuggerUrl,
        700
      );
      if (inviteUrl) {
        logZoomResolve("schedule:invite-found", {
          via: "meeting-info-target",
          targetId: candidate.id,
          inviteUrl,
        });
        break;
      }
    }

    if (!inviteUrl) {
      inviteUrl = await extractZoomInviteUrlFromTarget(ws, 500);
      if (inviteUrl) {
        logZoomResolve("schedule:invite-found", {
          via: "schedule-target",
          targetId: target.id,
          inviteUrl,
        });
      }
    }

    if (inviteUrl) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  if (!inviteUrl) {
    logZoomResolve("schedule:invite-missing");
    return null;
  }

  const inviteTarget = await createTarget(baseUrl, inviteUrl);
  const inviteWs = inviteTarget.webSocketDebuggerUrl;
  let inviteBaselineIds = new Set();
  try {
    const inviteBaselinePages = await listPageTargets(baseUrl);
    inviteBaselineIds = new Set(inviteBaselinePages.map((target) => target.id));
  } catch {
    inviteBaselineIds = new Set();
  }

  await clickZoomAction(inviteWs, {
    selectors: [
      "#zoom-ui-frame > div.bhauZU7H > div > div.ifP196ZE.x2RD4pnS > div > button.zoom-button.zoom-button--lg.zoom-button--secondary.g7nkJFrV",
      "#zoom-ui-frame button.zoom-button.zoom-button--secondary",
    ],
    textIncludes: ["join from browser"],
    includeAnchors: false,
    delayMs: 800,
  });
  await clickZoomAction(inviteWs, {
    textIncludes: [
      "start this meeting",
      "end it and start",
      "leave and start",
      "switch to this meeting",
    ],
    includeAnchors: false,
    delayMs: 900,
  });
  logZoomResolve("schedule:join-clicked", { inviteUrl, inviteTargetId: inviteTarget.id });

  const settled = await waitForZoomCandidateAcrossTargets(baseUrl, {
    preferredWebSocketDebuggerUrl: inviteWs,
    baselineTargetIds: inviteBaselineIds,
    timeoutMs: 45000,
    pollMs: 1500,
  });
  logZoomResolve("schedule:settled", {
    settledHref: settled?.href || null,
    settledTitle: settled?.title || null,
  });
  if (!settled?.href || !targetMatchesProvider("zoom-web", settled.href)) {
    return null;
  }

  return {
    url: settled.href,
    source: "zoom-scheduled-meeting",
    note: "Generated Zoom scheduled meeting route from schedule form and invite link.",
    observedHref: settled.href,
    observedTitle: settled.title || "",
  };
}

async function resolveZoomSharedMeetingFromEnv(baseUrl, sharedUrl) {
  if (!sharedUrl.trim()) {
    return null;
  }

  const parsed = parseUrl(sharedUrl.trim());
  if (!parsed || !targetMatchesProvider("zoom-web", parsed.toString())) {
    throw new Error(
      "ZOOM_SHARED_URL is invalid or does not match Zoom meeting URL patterns."
    );
  }

  const target = await createTarget(baseUrl, parsed.toString());
  const ws = target.webSocketDebuggerUrl;
  let sharedBaselineIds = new Set();
  try {
    const sharedBaselinePages = await listPageTargets(baseUrl);
    sharedBaselineIds = new Set(sharedBaselinePages.map((target) => target.id));
  } catch {
    sharedBaselineIds = new Set();
  }

  await clickZoomAction(ws, {
    selectors: [
      "#zoom-ui-frame > div.bhauZU7H > div > div.ifP196ZE.x2RD4pnS > div > button.zoom-button.zoom-button--lg.zoom-button--secondary.g7nkJFrV",
      "#zoom-ui-frame button.zoom-button.zoom-button--secondary",
    ],
    textIncludes: ["join from browser"],
    includeAnchors: false,
    delayMs: 900,
  });
  await clickZoomAction(ws, {
    textIncludes: [
      "start this meeting",
      "end it and start",
      "leave and start",
      "switch to this meeting",
    ],
    includeAnchors: false,
    delayMs: 900,
  });
  logZoomResolve("shared:join-clicked", { sharedUrl: parsed.toString() });

  const settled = await waitForZoomCandidateAcrossTargets(baseUrl, {
    preferredWebSocketDebuggerUrl: ws,
    baselineTargetIds: sharedBaselineIds,
    timeoutMs: 45000,
    pollMs: 1500,
  });
  const finalUrl = settled?.href || parsed.toString();
  const finalTitle = settled?.title || "";

  return {
    url: finalUrl,
    source: "zoom-shared-link",
    note: "Resolved Zoom meeting route from shared invite URL in environment.",
    observedHref: finalUrl,
    observedTitle: finalTitle,
  };
}

function resolveExplicitUrlForProvider(provider) {
  const providerSpecific =
    provider === "google-meet"
      ? process.env.GOOGLE_MEET_URL
      : provider === "microsoft-teams"
        ? process.env.TEAMS_URL
        : process.env.ZOOM_URL;

  const explicit =
    process.env.SMOKE_URL ||
    providerSpecific ||
    "";

  if (!explicit.trim()) {
    return null;
  }

  const parsed = parseUrl(explicit.trim());
  if (!parsed) {
    throw new Error(`Explicit smoke URL is invalid: ${explicit}`);
  }

  if (!targetMatchesProvider(provider, parsed.toString())) {
    throw new Error(
      `Explicit smoke URL does not match provider '${provider}': ${parsed.toString()}`
    );
  }

  return {
    url: parsed.toString(),
    source: "explicit-url",
    note: "Using explicit provider URL from environment variable.",
  };
}

export async function resolveProviderScenarioUrl({
  provider,
  scenario,
  baseUrl,
  targets = [],
} = {}) {
  const normalizedProvider = normalizeProvider(provider);
  const normalizedScenario = normalizeScenario(scenario);

  if (!SUPPORTED_PROVIDERS.includes(normalizedProvider)) {
    throw new Error(
      `Unsupported provider '${provider}'. Supported providers: ${SUPPORTED_PROVIDERS.join(", ")}`
    );
  }

  if (!SUPPORTED_SCENARIOS.includes(normalizedScenario)) {
    throw new Error(
      `Unsupported scenario '${scenario}'. Supported scenarios: ${SUPPORTED_SCENARIOS.join(", ")}`
    );
  }

  const explicit = resolveExplicitUrlForProvider(normalizedProvider);
  if (explicit) {
    return {
      provider: normalizedProvider,
      scenario: normalizedScenario,
      ...explicit,
    };
  }

  if (normalizedProvider === "zoom-web") {
    const zoomOptions = getZoomScenarioOptions();
    const zoomScenario =
      normalizedScenario === "meeting" ? "meeting-direct" : normalizedScenario;
    const resolveAsDirect =
      zoomScenario === "meeting-direct" ||
      zoomScenario === "meeting" ||
      zoomScenario === "journey" ||
      zoomScenario === "lifecycle";

    if (
      resolveAsDirect ||
      zoomScenario === "meeting-scheduled" ||
      zoomScenario === "meeting-shared"
    ) {
      try {
        await enforceZoomSingleActiveMeeting(baseUrl);
      } catch {
        // Best-effort guard for Zoom one-active-meeting limitation.
      }
    }

    if (zoomScenario === "meeting-shared") {
      const fromShared = await resolveZoomSharedMeetingFromEnv(
        baseUrl,
        zoomOptions.sharedUrl
      );
      if (fromShared?.url) {
        return {
          provider: normalizedProvider,
          scenario: zoomScenario,
          ...fromShared,
        };
      }

      throw new Error(
        "Zoom shared scenario requires ZOOM_SHARED_URL in .secrets/smoke.env."
      );
    }

    if (zoomScenario === "meeting-scheduled") {
      try {
        const fromSchedule = await resolveZoomInviteLinkFromSchedule(
          baseUrl,
          2000,
          zoomOptions.scheduleUrl,
          zoomOptions.scheduleTopic
        );
        if (fromSchedule?.url) {
          return {
            provider: normalizedProvider,
            scenario: zoomScenario,
            ...fromSchedule,
          };
        }
      } catch {
        // Handled below as strict scenario failure.
      }

      throw new Error(
        "Zoom scheduled scenario failed to resolve invite link from schedule flow. Ensure you are signed in and schedule form is accessible."
      );
    }

    if (resolveAsDirect) {
      try {
        const fromHome = await resolveZoomMeetingFromHome(
          baseUrl,
          1800,
          zoomOptions.homeUrl
        );
        if (fromHome?.url) {
          return {
            provider: normalizedProvider,
            scenario: zoomScenario,
            ...fromHome,
          };
        }
      } catch {
        // Handled below as strict scenario failure.
      }

      throw new Error(
        "Zoom direct scenario failed to resolve meeting route from /wc/home -> New meeting."
      );
    }

    const existingZoom = pickExistingTarget(normalizedProvider, targets);
    if (existingZoom) {
      return {
        provider: normalizedProvider,
        scenario: zoomScenario,
        ...existingZoom,
      };
    }

    return {
      provider: normalizedProvider,
      scenario: zoomScenario,
      ...resolveZoomFallbackUrl(zoomScenario),
    };
  }

  if (normalizedProvider === "google-meet") {
    if (normalizedScenario === "meeting") {
      const meet = await resolveGoogleMeetUrl({
        baseUrl,
        targets,
      });
      return {
        provider: normalizedProvider,
        scenario: normalizedScenario,
        ...meet,
      };
    }

    if (
      normalizedScenario === "lobby" ||
      normalizedScenario === "continuation"
    ) {
      const lobby = await resolveGoogleMeetLobbyUrl({
        baseUrl,
        targets,
      });
      return {
        provider: normalizedProvider,
        scenario: normalizedScenario,
        ...lobby,
      };
    }

    const meet = await resolveGoogleMeetUrl({
      baseUrl,
      targets,
    });
    return {
      provider: normalizedProvider,
      scenario: normalizedScenario,
      ...meet,
    };
  }

  const existing = pickExistingTarget(normalizedProvider, targets);
  if (existing) {
    return {
      provider: normalizedProvider,
      scenario: normalizedScenario,
      ...existing,
    };
  }

  if (normalizedProvider === "microsoft-teams") {
    return {
      provider: normalizedProvider,
      scenario: normalizedScenario,
      ...(existing || resolveTeamsFallbackUrl(normalizedScenario)),
    };
  }

  return {
    provider: normalizedProvider,
    scenario: normalizedScenario,
    ...(existing || resolveZoomFallbackUrl(normalizedScenario)),
  };
}

export function isExpectedProviderHost(provider, urlValue) {
  const parsed = parseUrl(urlValue);
  if (!parsed) {
    return false;
  }

  if (provider === "google-meet") {
    return isGoogleMeetHost(parsed);
  }
  if (provider === "microsoft-teams") {
    return isTeamsHost(parsed);
  }
  if (provider === "zoom-web") {
    return isZoomHost(parsed);
  }

  return false;
}

export const providerSmokeConstants = {
  SUPPORTED_PROVIDERS,
  SUPPORTED_SCENARIOS,
};
