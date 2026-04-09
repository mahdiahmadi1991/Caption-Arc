#!/usr/bin/env node

import { execSync } from "node:child_process";
import {
  createTarget,
  dispatchMouseClickInTarget,
  evaluateInTarget,
} from "./cdp-runtime.mjs";

const MEETING_URL_PATTERN =
  /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/i;
const MEETING_URL_TEXT_PATTERN =
  /(?:https?:\/\/)?meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}\b/i;
const DEFAULT_PLACEHOLDER_CODES = new Set(["aaa-bbbb-ccc", "yyy-yyyy-zzz"]);

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isMeetHost(url) {
  return /(^|\.)meet\.google\.com$/i.test(url.hostname);
}

function normalizeMeetCandidate(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = parseUrl(value.trim());
  if (!parsed || !isMeetHost(parsed) || parsed.protocol !== "https:") {
    return null;
  }

  return parsed.toString();
}

function isMeetingUrl(value) {
  return typeof value === "string" && MEETING_URL_PATTERN.test(value);
}

function extractMeetingCode(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(
    /^https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:[/?#]|$)/i
  );
  return match?.[1]?.toLowerCase() || null;
}

function isPlaceholderMeetingCode(code) {
  if (!code) {
    return false;
  }

  const extra = String(process.env.MEET_PLACEHOLDER_CODES || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const placeholders = new Set([...DEFAULT_PLACEHOLDER_CODES, ...extra]);
  return placeholders.has(code.toLowerCase());
}

function isUsableMeetingUrl(value) {
  if (!isMeetingUrl(value)) {
    return false;
  }
  return !isPlaceholderMeetingCode(extractMeetingCode(value));
}

function readSystemClipboardRaw() {
  try {
    const raw = execSync(
      `powershell.exe -NoProfile -Command "try { (Get-Clipboard -Raw) } catch { '' }"`,
      {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      }
    );
    return String(raw || "").replace(/\r/g, "").trim();
  } catch {
    return "";
  }
}

function extractMeetingUrlFromText(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const match = value.match(MEETING_URL_TEXT_PATTERN);
  if (!match?.[0]) {
    return null;
  }

  const raw = String(match[0]).trim();
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return normalizeMeetCandidate(candidate);
}

function pickFromTargets(targets) {
  const meetTargets = targets
    .map((target) => (typeof target?.url === "string" ? target.url : ""))
    .map((value) => normalizeMeetCandidate(value))
    .filter((value) => Boolean(value));

  const meeting = meetTargets.find((value) => isMeetingUrl(value));
  const usableMeeting = meetTargets.find((value) => isUsableMeetingUrl(value));
  if (usableMeeting) {
    return {
      url: usableMeeting,
      source: "existing-target-meeting",
      note: "Using an existing Meet meeting tab from current CDP targets.",
    };
  }

  if (meeting) {
    return {
      url: meeting,
      source: "existing-target-meeting-placeholder",
      note:
        "Existing Meet tab uses a placeholder/example meeting code and is not preferred for smoke checks.",
    };
  }

  const genericMeet = meetTargets[0];
  if (genericMeet) {
    return {
      url: genericMeet,
      source: "existing-target-generic",
      note: "Using an existing Meet tab from current CDP targets.",
    };
  }

  return null;
}

async function resolveFromMeetNew(baseUrl, probeDelayMs) {
  const target = await createTarget(baseUrl, "https://meet.google.com/new");
  const data = await evaluateInTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    delayMs: probeDelayMs,
    expression: `(() => ({ href: window.location.href, title: document.title }))()`,
  });

  const candidate = normalizeMeetCandidate(data?.href);
  if (!candidate) {
    return null;
  }

  if (isMeetingUrl(candidate)) {
    if (!isUsableMeetingUrl(candidate)) {
      return null;
    }

    return {
      url: candidate,
      source: "meet-new-generated",
      note: "Generated a meeting URL via meet.google.com/new.",
      observedHref: data?.href || "",
      observedTitle: data?.title || "",
    };
  }

  return {
    url: candidate,
    source: "meet-new-fallback",
    note: "meet.google.com/new did not yield a concrete meeting code; using resulting Meet URL.",
    observedHref: data?.href || "",
    observedTitle: data?.title || "",
  };
}

async function resolveFromMeetHome(baseUrl, probeDelayMs) {
  const target = await createTarget(baseUrl, "https://meet.google.com/");
  const data = await evaluateInTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    delayMs: probeDelayMs,
    expression: `(() => {
      const links = Array.from(document.querySelectorAll('a[href]')).map((anchor) => anchor.href);
      const meetingLink = links.find((href) => /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/i.test(href));
      const newLink = links.find((href) => /https:\/\/meet\.google\.com\/new(?:[/?#]|$)/i.test(href));
      return {
        href: window.location.href,
        title: document.title,
        meetingLink: meetingLink || null,
        newLink: newLink || null,
      };
    })()`,
  });

  const meetingLink = normalizeMeetCandidate(data?.meetingLink);
  if (meetingLink && isUsableMeetingUrl(meetingLink)) {
    return {
      url: meetingLink,
      source: "meet-home-link",
      note: "Picked a meeting URL from Meet homepage links.",
      observedHref: data?.href || "",
      observedTitle: data?.title || "",
    };
  }

  const newLink = normalizeMeetCandidate(data?.newLink);
  if (newLink) {
    return {
      url: newLink,
      source: "meet-home-new-link",
      note: "Picked the Meet 'new meeting' link from homepage.",
      observedHref: data?.href || "",
      observedTitle: data?.title || "",
    };
  }

  const current = normalizeMeetCandidate(data?.href);
  if (current) {
    return {
      url: current,
      source: "meet-home-current",
      note: "Using current Meet homepage URL because no explicit meeting links were found.",
      observedHref: data?.href || "",
      observedTitle: data?.title || "",
    };
  }

  return null;
}

async function resolveFromMeetLandingInstantMeeting(baseUrl, probeDelayMs) {
  const target = await createTarget(baseUrl, "https://meet.google.com/landing");
  const ws = target.webSocketDebuggerUrl;

  const listMeetingTargets = async () => {
    try {
      const response = await fetch(`${baseUrl}/json/list`);
      if (!response.ok) {
        return [];
      }
      const targets = await response.json();
      return targets
        .map((entry) => normalizeMeetCandidate(entry?.url))
        .filter((value) => Boolean(value) && isUsableMeetingUrl(value));
    } catch {
      return [];
    }
  };

  const meetingTargetsBefore = new Set(await listMeetingTargets());

  const readMeetingFromPage = async (delayMs) => {
    const data = await evaluateInTarget({
      webSocketDebuggerUrl: ws,
      delayMs: Math.max(220, delayMs),
      expression: `(() => {
        const href = window.location.href;
        const title = document.title;
        const bodyText = document.body?.innerText || "";
        const textMatch = bodyText.match(/(?:https?:\\/\\/)?meet\\.google\\.com\\/[a-z]{3}-[a-z]{4}-[a-z]{3}\\b/i)?.[0] || null;
        const links = Array.from(document.querySelectorAll("a[href]")).map((anchor) => anchor.href);
        const linkMatch =
          links.find((next) => /^https:\\/\\/meet\\.google\\.com\\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/i.test(next)) ||
          null;
        return { href, title, textMatch, linkMatch };
      })()`,
    });

    const fromPage =
      normalizeMeetCandidate(data?.linkMatch) ||
      extractMeetingUrlFromText(data?.textMatch) ||
      normalizeMeetCandidate(data?.href);

    return {
      url: fromPage,
      observedHref: data?.href || "",
      observedTitle: data?.title || "",
    };
  };

  const clickByText = async (texts, delayMs) => {
    const candidate = await evaluateInTarget({
      webSocketDebuggerUrl: ws,
      delayMs: Math.max(120, delayMs),
      expression: `(() => {
        const wanted = ${JSON.stringify(texts)}.map((value) => value.toLowerCase());
        const selectors = [
          "button",
          "[role='button']",
          "[aria-haspopup='menu']",
          "[aria-label]",
          "[title]",
          "[data-tooltip]",
          "[data-is-touch-wrapper='true']",
          "li",
          "[role='menuitem']",
        ];

        const normalize = (value) =>
          String(value || "")
            .replace(/\\s+/g, " ")
            .trim()
            .toLowerCase();

        const buildNodeText = (node) =>
          normalize(
            (node.textContent || "") +
              " " +
              (node.getAttribute?.("aria-label") || "") +
              " " +
              (node.getAttribute?.("title") || "") +
              " " +
              (node.getAttribute?.("data-tooltip") || "")
          );

        const isVisible = (node) => {
          const style = window.getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 2 &&
            rect.height > 2
          );
        };

        const hasMatchingVisibleDescendant = (node, token) => {
          const descendants = Array.from(
            node.querySelectorAll("button, [role='button'], li, [role='menuitem'], a")
          );
          return descendants.some((child) => {
            if (child === node || !isVisible(child)) {
              return false;
            }
            return buildNodeText(child).includes(token);
          });
        };

        const nodes = selectors
          .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
          .filter(isVisible);

        for (const node of nodes) {
          const text = buildNodeText(node);
          if (!text) {
            continue;
          }

          const role = (node.getAttribute?.("role") || "").toLowerCase();
          const tag = (node.tagName || "").toLowerCase();
          if (role === "menu" || tag === "ul") {
            continue;
          }

          const matchedToken = wanted.find((token) => text.includes(token));
          if (!matchedToken) {
            continue;
          }

          if (hasMatchingVisibleDescendant(node, matchedToken)) {
            continue;
          }

          const rect = node.getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            text,
          };
        }

        return null;
      })()`,
    });

    if (!candidate || !Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) {
      return false;
    }

    await dispatchMouseClickInTarget({
      webSocketDebuggerUrl: ws,
      x: candidate.x,
      y: candidate.y,
      clickCount: 1,
    });
    return true;
  };

  const clickByTextWithRetry = async (
    texts,
    { attempts = 5, delayMs = 450 } = {}
  ) => {
    for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
      const clicked = await clickByText(texts, delayMs);
      if (clicked) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.max(120, delayMs)));
    }
    return false;
  };

  const initial = await readMeetingFromPage(probeDelayMs);
  if (initial.url && isUsableMeetingUrl(initial.url)) {
    return {
      url: initial.url,
      source: "meet-landing-instant-existing",
      note: "Using meeting URL already visible on Meet landing page before instant flow.",
      observedHref: initial.observedHref,
      observedTitle: initial.observedTitle,
    };
  }

  const openedMenu = await clickByTextWithRetry(["new meeting"], {
    attempts: 6,
    delayMs: 500,
  });
  if (openedMenu) {
    await clickByTextWithRetry(["start an instant meeting", "instant meeting"], {
      attempts: 7,
      delayMs: 420,
    });
  } else {
    await clickByTextWithRetry(["start an instant meeting", "instant meeting"], {
      attempts: 4,
      delayMs: 420,
    });
  }

  const instantDeadline = Date.now() + 20000;
  while (Date.now() < instantDeadline) {
    const current = await readMeetingFromPage(450);
    if (current.url && isUsableMeetingUrl(current.url)) {
      return {
        url: current.url,
        source: "meet-landing-start-instant-meeting",
        note: "Generated meeting URL from landing flow using New meeting -> Start an instant meeting.",
        observedHref: current.observedHref,
        observedTitle: current.observedTitle,
      };
    }

    const currentTargets = await listMeetingTargets();
    const freshTarget = currentTargets.find(
      (candidate) => !meetingTargetsBefore.has(candidate)
    );
    if (freshTarget && isUsableMeetingUrl(freshTarget)) {
      return {
        url: freshTarget,
        source: "meet-landing-start-instant-meeting-target",
        note:
          "Generated meeting URL from landing flow using Start an instant meeting and detected fresh target.",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 260));
  }

  return null;
}

async function resolveFromMeetLanding(baseUrl, probeDelayMs) {
  const target = await createTarget(baseUrl, "https://meet.google.com/landing");
  const ws = target.webSocketDebuggerUrl;
  const listMeetingTargets = async () => {
    try {
      const response = await fetch(`${baseUrl}/json/list`);
      if (!response.ok) {
        return [];
      }
      const targets = await response.json();
      return targets
        .map((entry) => normalizeMeetCandidate(entry?.url))
        .filter((value) => Boolean(value) && isUsableMeetingUrl(value));
    } catch {
      return [];
    }
  };
  const meetingTargetsBefore = new Set(await listMeetingTargets());

  const readMeetingFromPage = async (delayMs) => {
    const data = await evaluateInTarget({
      webSocketDebuggerUrl: ws,
      delayMs: Math.max(200, delayMs),
      expression: `(() => {
        const href = window.location.href;
        const title = document.title;
        const text = document.body?.innerText || "";
        const fromText = text.match(/https:\\/\\/meet\\.google\\.com\\/[a-z]{3}-[a-z]{4}-[a-z]{3}\\b/i)?.[0] || null;
        const links = Array.from(document.querySelectorAll('a[href]')).map((anchor) => anchor.href);
        const fromLink =
          links.find((next) => /^https:\\/\\/meet\\.google\\.com\\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/i.test(next)) ||
          null;

        return {
          href,
          title,
          fromText,
          fromLink,
        };
      })()`,
    });

    const meetingCandidate =
      normalizeMeetCandidate(data?.fromLink) ||
      extractMeetingUrlFromText(data?.fromText) ||
      normalizeMeetCandidate(data?.href);

    return {
      url: meetingCandidate,
      observedHref: data?.href || "",
      observedTitle: data?.title || "",
    };
  };

  const clickByText = async (texts, delayMs) => {
    const candidate = await evaluateInTarget({
      webSocketDebuggerUrl: ws,
      delayMs: Math.max(100, delayMs),
      expression: `(() => {
        const wanted = ${JSON.stringify(texts)}.map((value) => value.toLowerCase());
        const selectors = [
          "button",
          "[role='button']",
          "[aria-haspopup='menu']",
          "[aria-label]",
          "[title]",
          "[data-tooltip]",
          "[data-is-touch-wrapper='true']",
          "li",
          "[role='menuitem']",
        ];

        const normalize = (value) =>
          String(value || "")
            .replace(/\\s+/g, " ")
            .trim()
            .toLowerCase();

        const buildNodeText = (node) =>
          normalize(
            (node.textContent || "") +
              " " +
              (node.getAttribute?.("aria-label") || "") +
              " " +
              (node.getAttribute?.("title") || "") +
              " " +
              (node.getAttribute?.("data-tooltip") || "")
          );

        const isVisible = (node) => {
          const style = window.getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 2 &&
            rect.height > 2
          );
        };

        const hasMatchingVisibleDescendant = (node, token) => {
          const descendants = Array.from(
            node.querySelectorAll("button, [role='button'], li, [role='menuitem'], a")
          );
          return descendants.some((child) => {
            if (child === node || !isVisible(child)) {
              return false;
            }
            return buildNodeText(child).includes(token);
          });
        };

        const nodes = selectors
          .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
          .filter(isVisible);

        for (const node of nodes) {
          const text = buildNodeText(node);
          if (!text) {
            continue;
          }

          const role = (node.getAttribute?.("role") || "").toLowerCase();
          const tag = (node.tagName || "").toLowerCase();
          if (role === "menu" || tag === "ul") {
            continue;
          }

          const matchedToken = wanted.find((token) => text.includes(token));
          if (!matchedToken) {
            continue;
          }

          if (hasMatchingVisibleDescendant(node, matchedToken)) {
            continue;
          }

          const rect = node.getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            text,
          };
        }

        return null;
      })()`,
    });

    if (!candidate || !Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) {
      return false;
    }

    await dispatchMouseClickInTarget({
      webSocketDebuggerUrl: ws,
      x: candidate.x,
      y: candidate.y,
      clickCount: 1,
    });

    return true;
  };

  const clickByTextWithRetry = async (
    texts,
    { attempts = 5, delayMs = 500 } = {}
  ) => {
    for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
      const clicked = await clickByText(texts, delayMs);
      if (clicked) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.max(120, delayMs)));
    }
    return false;
  };

  const tryCopyMeetingFromDialog = async (delayMs) => {
    const data = await evaluateInTarget({
      webSocketDebuggerUrl: ws,
      delayMs: Math.max(200, delayMs),
      expression: `(() => {
        const normalize = (value) =>
          String(value || "")
            .replace(/\\s+/g, " ")
            .trim()
            .toLowerCase();

        const extractUrl = (value) => {
          const text = String(value || "");
          const match = text.match(/(?:https?:\\/\\/)?meet\\.google\\.com\\/[a-z]{3}-[a-z]{4}-[a-z]{3}\\b/i);
          return match?.[0] || null;
        };

        const isVisible = (node) => {
          if (!node) {
            return false;
          }
          const style = window.getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            rect.width > 2 &&
            rect.height > 2
          );
        };

        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], div, section'))
          .filter((node) => {
            const text = normalize(node.textContent || "");
            return (
              isVisible(node) &&
              (
                text.includes("joining info") ||
                text.includes("create a meeting for later") ||
                text.includes("be sure to save it so you can use it later")
              )
            );
          });

        const explicitJoinInfoCandidates = Array.from(
          document.querySelectorAll(
            '.acuQXc .Hayy8b[jsname="DkF5Cf"], .Hayy8b[jsname="DkF5Cf"], [jsname="DkF5Cf"].Hayy8b, [jsname="DkF5Cf"]'
          )
        );
        const explicitJoinInfoNode =
          explicitJoinInfoCandidates.find(isVisible) ||
          explicitJoinInfoCandidates.at(-1) ||
          null;
        const urlFromExplicitNode = extractUrl(
          explicitJoinInfoNode?.textContent || explicitJoinInfoNode?.innerText || ""
        );

        const dialog = dialogs[0] || null;
        const dialogText = dialog?.textContent || "";
        const urlFromDialog = extractUrl(dialogText);
        const joinInfoValueNode =
          (dialog || document).querySelector('input[readonly], [aria-readonly="true"], [data-meeting-link]') ||
          null;
        const urlFromField =
          extractUrl(joinInfoValueNode?.value) ||
          extractUrl(joinInfoValueNode?.textContent) ||
          null;

        const explicitContainer =
          explicitJoinInfoNode?.closest?.(".acuQXc") ||
          explicitJoinInfoNode?.parentElement ||
          null;
        const explicitCopyButton =
          explicitContainer?.querySelector?.('button[aria-label*="Copy link"]') ||
          explicitContainer?.querySelector?.('button[jsname="Y7ZAE"]') ||
          explicitContainer?.querySelector?.('button[aria-label*="Copy"]') ||
          null;
        const copyButton =
          (explicitCopyButton && isVisible(explicitCopyButton) && explicitCopyButton) ||
          null;
        const copyButtonRect = copyButton?.getBoundingClientRect?.();
        const copyClickPoint =
          copyButtonRect &&
          Number.isFinite(copyButtonRect.left) &&
          Number.isFinite(copyButtonRect.top) &&
          Number.isFinite(copyButtonRect.width) &&
          Number.isFinite(copyButtonRect.height)
            ? {
                x: Math.round(copyButtonRect.left + copyButtonRect.width / 2),
                y: Math.round(copyButtonRect.top + copyButtonRect.height / 2),
              }
            : null;

        return {
          urlFromExplicitNode,
          urlFromDialog,
          urlFromField,
          hasCopyButton: Boolean(copyButton),
          copyClickPoint,
        };
      })()`,
    });

    const fromExplicitNode = extractMeetingUrlFromText(data?.urlFromExplicitNode);
    const fromField = extractMeetingUrlFromText(data?.urlFromField);
    const fromDialog = extractMeetingUrlFromText(data?.urlFromDialog);
    const fromDialogSurface = fromExplicitNode || fromField || fromDialog || null;

    let clipboardChanged = false;
    let fromClipboard = null;
    let clicked = false;
    if (
      data?.copyClickPoint &&
      Number.isFinite(data.copyClickPoint.x) &&
      Number.isFinite(data.copyClickPoint.y)
    ) {
      const clipboardBefore = readSystemClipboardRaw();
      await dispatchMouseClickInTarget({
        webSocketDebuggerUrl: ws,
        x: data.copyClickPoint.x,
        y: data.copyClickPoint.y,
        clickCount: 1,
      });
      clicked = true;

      const clipboardDeadline = Date.now() + 2200;
      while (Date.now() < clipboardDeadline) {
        const clipboardNow = readSystemClipboardRaw();
        if (clipboardNow && clipboardNow !== clipboardBefore) {
          fromClipboard = extractMeetingUrlFromText(clipboardNow);
          clipboardChanged = Boolean(fromClipboard);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 160));
      }
    }

    return {
      clicked,
      clipboardChanged,
      source: clipboardChanged && fromClipboard ? "clipboard-after-trusted-copy" : "dialog-surface",
      url:
        (clipboardChanged && fromClipboard && isUsableMeetingUrl(fromClipboard)
          ? fromClipboard
          : fromDialogSurface) || null,
    };
  };

  const initial = await readMeetingFromPage(probeDelayMs);
  if (initial.url && isMeetingUrl(initial.url)) {
    if (!isUsableMeetingUrl(initial.url)) {
      return null;
    }

    return {
      url: initial.url,
      source: "meet-landing-existing",
      note: "Using meeting URL already visible on Meet landing page.",
      observedHref: initial.observedHref,
      observedTitle: initial.observedTitle,
    };
  }

  const openedMenu = await clickByTextWithRetry(["new meeting"], {
    attempts: 6,
    delayMs: 500,
  });
  const clipboardBefore = readSystemClipboardRaw();
  if (openedMenu) {
    await clickByTextWithRetry(["create a meeting for later"], {
      attempts: 7,
      delayMs: 450,
    });
  } else {
    // Sometimes the menu is already expanded or rendered with delayed DOM updates.
    await clickByTextWithRetry(["create a meeting for later"], {
      attempts: 4,
      delayMs: 450,
    });
  }

  const copyDeadline = Date.now() + 15000;
  while (Date.now() < copyDeadline) {
    const copied = await tryCopyMeetingFromDialog(650);
    if (copied.url && isUsableMeetingUrl(copied.url)) {
      return {
        url: copied.url,
        source: "meet-landing-copy-join-info",
        note: `Generated meeting URL from landing flow using joining-info ${copied.source}.`,
      };
    }
  }

  const clipboardDeadline = Date.now() + 6000;
  while (Date.now() < clipboardDeadline) {
    const clipboardNow = readSystemClipboardRaw();
    if (clipboardNow && clipboardNow !== clipboardBefore) {
      const clipboardCandidate = extractMeetingUrlFromText(clipboardNow);
      if (clipboardCandidate && isUsableMeetingUrl(clipboardCandidate)) {
        return {
          url: clipboardCandidate,
          source: "meet-landing-system-clipboard",
          note:
            "Generated meeting URL from landing flow using system clipboard after Create a meeting for later.",
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  const targetPollDeadline = Date.now() + 9000;
  while (Date.now() < targetPollDeadline) {
    const currentTargets = await listMeetingTargets();
    const freshTarget = currentTargets.find(
      (candidate) => !meetingTargetsBefore.has(candidate)
    );
    if (freshTarget && isUsableMeetingUrl(freshTarget)) {
      return {
        url: freshTarget,
        source: "meet-landing-new-target",
        note:
          "Generated meeting URL from landing flow by detecting a newly created Meet target.",
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const afterAction = await readMeetingFromPage(1600);
  if (afterAction.url && isUsableMeetingUrl(afterAction.url)) {
    return {
      url: afterAction.url,
      source: "meet-landing-create-for-later",
      note: "Generated meeting URL from landing -> New meeting -> Create a meeting for later.",
      observedHref: afterAction.observedHref,
      observedTitle: afterAction.observedTitle,
    };
  }

  const deadline = Date.now() + 18000;
  while (Date.now() < deadline) {
    const polled = await readMeetingFromPage(700);
    if (polled.url && isUsableMeetingUrl(polled.url)) {
      return {
        url: polled.url,
        source: "meet-landing-create-for-later-polled",
        note:
          "Generated meeting URL from landing flow after waiting for delayed dialog/render.",
        observedHref: polled.observedHref,
        observedTitle: polled.observedTitle,
      };
    }
  }

  return null;
}

function fallbackSyntheticMeetingUrl() {
  return {
    url: "https://meet.google.com/aaa-bbbb-ccc",
    source: "synthetic-meeting-shape",
    note: "Fallback to a valid Meet meeting URL shape for content-script smoke checks.",
  };
}

export async function resolveGoogleMeetUrl({
  baseUrl,
  targets = [],
  explicitUrl = process.env.MEET_URL,
  probeDelayMs = Number.parseInt(process.env.MEET_URL_PROBE_DELAY_MS || "5500", 10),
} = {}) {
  const requireFreshUrl =
    process.env.GOOGLE_MEET_REQUIRE_FRESH_URL === "1" ||
    process.env.MEET_REQUIRE_FRESH_URL === "1";

  const envCandidate = normalizeMeetCandidate(explicitUrl);
  if (envCandidate) {
    return {
      url: envCandidate,
      source: "env-meet-url",
      note: "Using MEET_URL from environment.",
    };
  }

  const fromTargets = requireFreshUrl ? null : pickFromTargets(targets);
  if (fromTargets && fromTargets.source !== "existing-target-meeting-placeholder") {
    return fromTargets;
  }

  try {
    const fromLandingInstant = await resolveFromMeetLandingInstantMeeting(
      baseUrl,
      Math.max(320, probeDelayMs)
    );
    if (fromLandingInstant) {
      return fromLandingInstant;
    }
  } catch {
    // Continue to next strategy.
  }

  try {
    const fromNew = await resolveFromMeetNew(baseUrl, Math.max(300, probeDelayMs));
    if (fromNew) {
      return fromNew;
    }
  } catch {
    // Continue to next strategy.
  }

  try {
    const fromHome = await resolveFromMeetHome(baseUrl, Math.max(300, probeDelayMs));
    if (fromHome) {
      return fromHome;
    }
  } catch {
    // Continue to fallback strategy.
  }

  if (process.env.MEET_ALLOW_SYNTHETIC_FALLBACK === "1") {
    return fallbackSyntheticMeetingUrl();
  }

  throw new Error(
    "Could not resolve a real Google Meet URL. Open a real Meet tab first or set GOOGLE_MEET_URL/MEET_URL."
  );
}

export async function resolveGoogleMeetLobbyUrl({
  baseUrl,
  targets = [],
  explicitUrl = process.env.GOOGLE_MEET_URL || process.env.MEET_URL,
  probeDelayMs = Number.parseInt(process.env.MEET_URL_PROBE_DELAY_MS || "5500", 10),
} = {}) {
  const requireFreshUrl =
    process.env.GOOGLE_MEET_REQUIRE_FRESH_URL === "1" ||
    process.env.MEET_REQUIRE_FRESH_URL === "1";

  const envCandidate = normalizeMeetCandidate(explicitUrl);
  if (envCandidate) {
    return {
      url: envCandidate,
      source: "env-meet-url",
      note: "Using GOOGLE_MEET_URL/MEET_URL from environment.",
    };
  }

  const fromTargets = requireFreshUrl ? null : pickFromTargets(targets);
  if (fromTargets?.url && isUsableMeetingUrl(fromTargets.url)) {
    return {
      ...fromTargets,
      source: "existing-target-meeting",
      note: "Using existing Meet meeting tab from current CDP targets.",
    };
  }

  const landingAttempts = Number.parseInt(
    process.env.MEET_LANDING_MAX_ATTEMPTS || "3",
    10
  );
  for (let attempt = 1; attempt <= Math.max(1, landingAttempts); attempt += 1) {
    try {
      const fromLanding = await resolveFromMeetLanding(
        baseUrl,
        Math.max(300, probeDelayMs)
      );
      if (fromLanding) {
        return attempt === 1
          ? fromLanding
          : {
              ...fromLanding,
              source: `${fromLanding.source}-attempt-${attempt}`,
              note: `${fromLanding.note} (landing attempt ${attempt})`,
            };
      }
    } catch {
      // Continue to next attempt.
    }
  }

  if (process.env.MEET_ALLOW_SYNTHETIC_FALLBACK === "1") {
    return {
      url: "https://meet.google.com/aaa-bbbb-ccc",
      source: "meet-landing-fallback-shape",
      note: "Landing flow did not return a concrete URL. Falling back to meeting URL shape.",
    };
  }

  const clipboardCandidate = extractMeetingUrlFromText(readSystemClipboardRaw());
  if (clipboardCandidate && isUsableMeetingUrl(clipboardCandidate)) {
    return {
      url: clipboardCandidate,
      source: "meet-system-clipboard-fallback",
      note:
        "Landing flow did not produce a URL; using valid Google Meet URL currently present in system clipboard.",
    };
  }

  throw new Error(
    "Landing flow could not produce a real Meet URL. Ensure Google account is signed in, then use New meeting -> Create a meeting for later, or set GOOGLE_MEET_URL."
  );
}

export function isGoogleMeetMeetingUrl(url) {
  return isMeetingUrl(url);
}
