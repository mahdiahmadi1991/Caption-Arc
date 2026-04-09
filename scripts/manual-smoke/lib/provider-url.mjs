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
];
const DEFAULT_TEAMS_URL =
  "https://teams.live.com/meet/9365261740667?p=wW30AeA8vzUtAkZRmM";

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
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
  return {
    url: DEFAULT_TEAMS_URL,
    source: "teams-default-live-url",
    note:
      scenario === "meeting"
        ? "Using default Teams live meeting URL. Override with TEAMS_URL for your own meeting context."
        : "Using default Teams live URL for lobby/prejoin checks. Override with TEAMS_URL for your own lobby URL.",
  };
}

function resolveZoomFallbackUrl(scenario) {
  if (scenario === "meeting") {
    return {
      url: "https://us05web.zoom.us/wc/join/12345678901",
      source: "zoom-fallback-meeting-shape",
      note: "Fallback to Zoom web client meeting URL shape.",
    };
  }

  return {
    url: "https://us05web.zoom.us/j/12345678901",
    source: "zoom-fallback-lobby-shape",
    note: "Fallback to Zoom lobby/prejoin URL shape.",
  };
}

async function resolveZoomMeetingFromHome(baseUrl, probeDelayMs) {
  const target = await createTarget(baseUrl, "https://app.zoom.us/wc/home");
  const ws = target.webSocketDebuggerUrl;

  const clickNewMeeting = async (delayMs) =>
    Boolean(
      await evaluateInTarget({
        webSocketDebuggerUrl: ws,
        delayMs: Math.max(200, delayMs),
        expression: `(() => {
          const nodes = Array.from(
            document.querySelectorAll("button, [role='button'], a, [data-testid], [aria-label]")
          );

          for (const node of nodes) {
            const text = ((node.textContent || "") + " " + (node.getAttribute?.("aria-label") || ""))
              .replace(/\\s+/g, " ")
              .trim()
              .toLowerCase();
            if (!text) {
              continue;
            }

            if (text.includes("new meeting")) {
              node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
              node.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
              node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
              return true;
            }
          }

          return false;
        })()`,
      })
    );

  const readCurrent = async (delayMs) =>
    await evaluateInTarget({
      webSocketDebuggerUrl: ws,
      delayMs: Math.max(300, delayMs),
      expression: `(() => ({ href: window.location.href, title: document.title }))()`,
    });

  const initial = await readCurrent(probeDelayMs);
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

  await clickNewMeeting(1000);
  const afterClick = await readCurrent(2500);
  const afterClickUrl = typeof afterClick?.href === "string" ? afterClick.href : "";
  if (targetMatchesProvider("zoom-web", afterClickUrl)) {
    return {
      url: afterClickUrl,
      source: "zoom-home-new-meeting",
      note: "Generated Zoom meeting route from app.zoom.us/wc/home via New Meeting.",
      observedHref: afterClickUrl,
      observedTitle: afterClick?.title || "",
    };
  }

  return null;
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

function resolveGoogleFallbackUrl(scenario) {
  if (scenario === "lobby") {
    return {
      url: "https://meet.google.com/new",
      source: "google-lobby-route",
      note: "Using Google Meet prejoin route.",
    };
  }

  return {
    url: "https://meet.google.com/aaa-bbbb-ccc",
    source: "google-fallback-meeting-shape",
    note: "Fallback to Google Meet meeting URL shape.",
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

    return {
      provider: normalizedProvider,
      scenario: normalizedScenario,
      ...resolveGoogleFallbackUrl(normalizedScenario),
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

  if (normalizedScenario === "meeting") {
    try {
      const fromHome = await resolveZoomMeetingFromHome(baseUrl, 1800);
      if (fromHome?.url) {
        return {
          provider: normalizedProvider,
          scenario: normalizedScenario,
          ...fromHome,
        };
      }
    } catch {
      // Continue to fallback.
    }
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
