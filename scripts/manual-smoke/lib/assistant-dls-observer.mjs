#!/usr/bin/env node

import { evaluateInTarget } from "./cdp-runtime.mjs";
import {
  getDiagnosticsPayloadFromRuntime,
  sendCaptionArcRuntimeMessage,
} from "./diagnostics-runtime.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function normalizeString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export async function getAssistantOverlaySnapshot({
  webSocketDebuggerUrl,
} = {}) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    awaitPromise: false,
    delayMs: 140,
    expression: `(() => {
      const shell = document.querySelector("#captionarc-assistant-top-shell");
      const cards = Array.from(
        document.querySelectorAll("#captionarc-assistant-top-shell .mc-assistant-card:not(.mc-assistant-card-pending)")
      );
      const pendingCards = Array.from(
        document.querySelectorAll("#captionarc-assistant-top-shell .mc-assistant-card-pending")
      );

      const serializeCard = (card) => ({
        sourceBadge:
          card.querySelector(".mc-assistant-card-source-badge")?.textContent?.trim() ||
          "",
        sourceText:
          card.querySelector(".mc-assistant-card-source-text")?.textContent?.trim() ||
          "",
        body: card.querySelector(".mc-assistant-card-body")?.textContent?.replace(/\\s+/g, " ").trim() || "",
        listItemCount: card.querySelectorAll(".mc-assistant-card-body li").length,
        paragraphCount: card.querySelectorAll(".mc-assistant-card-body p").length,
        headingCount: card.querySelectorAll(".mc-assistant-card-body h1, .mc-assistant-card-body h2, .mc-assistant-card-body h3, .mc-assistant-card-body h4, .mc-assistant-card-body h5, .mc-assistant-card-body h6").length,
      });

      return {
        shellPresent: Boolean(shell),
        open: shell?.getAttribute("data-open") === "true",
        state: shell?.getAttribute("data-state") || null,
        unread: shell?.getAttribute("data-unread") === "true",
        cardCount: cards.length,
        pendingCount: pendingCards.length,
        cards: cards.map(serializeCard),
        pendingCards: pendingCards.map(serializeCard),
      };
    })()`,
  });
}

export async function openAssistantSurface({
  webSocketDebuggerUrl,
  timeoutMs = 12000,
  pollMs = 250,
} = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeoutMs) {
    const snapshot = await getAssistantOverlaySnapshot({ webSocketDebuggerUrl });
    if (snapshot?.open) {
      return snapshot;
    }

    const result = await evaluateInTarget({
      webSocketDebuggerUrl,
      awaitPromise: false,
      delayMs: 80,
      expression: `(() => {
        const shell = document.querySelector("#captionarc-assistant-top-shell");
        const handle = shell?.querySelector(".mc-assistant-top-bottom-handle");
        const shellPresent = Boolean(shell);
        const handlePresent = Boolean(handle);
        const handleMode = handle?.getAttribute("data-mode") || null;
        if (!shell || !handle) {
          return {
            clicked: false,
            reason: "assistant-handle-unavailable",
            shellPresent,
            handlePresent,
            handleMode,
          };
        }

        if (shell.getAttribute("data-open") === "true") {
          return {
            clicked: true,
            alreadyOpen: true,
            shellPresent,
            handlePresent,
            handleMode,
          };
        }

        if (handleMode !== "expand") {
          return {
            clicked: false,
            reason: "assistant-handle-not-expandable",
            shellPresent,
            handlePresent,
            handleMode,
          };
        }

        handle.click();
        return {
          clicked: true,
          shellPresent,
          handlePresent,
          handleMode,
        };
      })()`,
    });

    if (result?.clicked) {
      await sleep(220);
    } else {
      await sleep(pollMs);
    }
  }

  const finalSnapshot = await getAssistantOverlaySnapshot({ webSocketDebuggerUrl }).catch(
    () => null
  );
  throw new Error(
    `Assistant surface did not become open in time. Final snapshot: ${JSON.stringify(finalSnapshot || null)}`
  );
}

export async function resolveLatestGoogleMeetSession({
  baseUrl,
  meetingCode = null,
  expectedRuntimeId = null,
} = {}) {
  const indexResponse = await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "getMeetingHistoryIndex",
    },
  });

  const sessions = Array.isArray(indexResponse?.sessions)
    ? indexResponse.sessions
    : [];

  const normalizedMeetingCode = normalizeString(meetingCode).toLowerCase() || null;
  const googleSessions = sessions
    .filter((session) => session?.platform === "google-meet")
    .filter((session) => {
      if (!normalizedMeetingCode) {
        return true;
      }
      return (
        String(session?.identifiers?.meetingCode || "").toLowerCase() ===
        normalizedMeetingCode
      );
    })
    .sort((left, right) => {
      const leftTime = Number(left?.lastSeenAt || left?.startTime || 0);
      const rightTime = Number(right?.lastSeenAt || right?.startTime || 0);
      return rightTime - leftTime;
    });

  if (googleSessions.length === 0) {
    return null;
  }

  const sessionId = googleSessions[0]?.id;
  if (!sessionId) {
    return null;
  }

  const sessionResponse = await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "getMeetingSession",
      sessionId,
    },
  });

  if (!sessionResponse?.success || !sessionResponse?.session) {
    return null;
  }

  return sessionResponse.session;
}

export async function getAssistantLiveStateForSession({
  baseUrl,
  sessionId,
  expectedRuntimeId = null,
} = {}) {
  return await sendCaptionArcRuntimeMessage({
    baseUrl,
    expectedRuntimeId,
    message: {
      action: "getMeetingAssistantLiveState",
      sessionId,
    },
  });
}

export async function waitForSessionByMeetingCode({
  baseUrl,
  meetingCode,
  timeoutMs = 15000,
  pollMs = 500,
  expectedRuntimeId = null,
} = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeoutMs) {
    const session = await resolveLatestGoogleMeetSession({
      baseUrl,
      meetingCode,
      expectedRuntimeId,
    });
    if (session?.id) {
      return session;
    }
    await sleep(pollMs);
  }

  throw new Error(
    `Could not resolve a Google Meet session for meeting code '${meetingCode || "latest"}'.`
  );
}

export async function waitForAssistantState({
  baseUrl,
  meetingCode = null,
  expectedOutputCount = null,
  expectedLiveState = null,
  timeoutMs = 35000,
  pollMs = 700,
  expectedRuntimeId = null,
} = {}) {
  const startedAt = Date.now();
  let lastSnapshot = null;

  while (Date.now() - startedAt <= timeoutMs) {
    const session = await resolveLatestGoogleMeetSession({
      baseUrl,
      meetingCode,
      expectedRuntimeId,
    });

    if (session?.id) {
      const outputs = Object.values(session?.artifacts?.assistantOutputs || {});
      const liveStateResponse = await getAssistantLiveStateForSession({
        baseUrl,
        sessionId: session.id,
        expectedRuntimeId,
      }).catch(() => null);
      const liveState = liveStateResponse?.liveState?.status || null;

      lastSnapshot = {
        session,
        outputs,
        liveState,
      };

      const outputCountSatisfied =
        expectedOutputCount === null || outputs.length >= expectedOutputCount;
      const liveStateSatisfied =
        expectedLiveState === null || liveState === expectedLiveState;

      if (outputCountSatisfied && liveStateSatisfied) {
        return lastSnapshot;
      }
    }

    await sleep(pollMs);
  }

  throw new Error(
    `Assistant state did not settle. Last snapshot: ${JSON.stringify(lastSnapshot || null)}`
  );
}

export async function collectAssistantScenarioEvidence({
  baseUrl,
  webSocketDebuggerUrl,
  meetingCode = null,
  diagnosticsQuery = {},
  expectedRuntimeId = null,
} = {}) {
  const session = await resolveLatestGoogleMeetSession({
    baseUrl,
    meetingCode,
    expectedRuntimeId,
  });
  const outputs = Object.values(session?.artifacts?.assistantOutputs || {}).sort(
    (left, right) => Number(left?.createdAt || 0) - Number(right?.createdAt || 0)
  );
  const liveStateResponse = session?.id
    ? await getAssistantLiveStateForSession({
        baseUrl,
        sessionId: session.id,
        expectedRuntimeId,
      }).catch(() => null)
    : null;
  const diagnostics = await getDiagnosticsPayloadFromRuntime({
    baseUrl,
    expectedRuntimeId,
    query: {
      minLevel: "debug",
      limit: 250,
      ...diagnosticsQuery,
    },
  }).catch(() => null);
  const overlay = await getAssistantOverlaySnapshot({ webSocketDebuggerUrl });

  return {
    session,
    outputs,
    liveState: liveStateResponse?.liveState || null,
    diagnostics,
    overlay,
  };
}

export function assertAssistantScenarioExpectations(evidence, expectations = {}) {
  const outputs = evidence?.outputs || [];
  const latestOutput = outputs[outputs.length - 1] || null;
  const liveState = evidence?.liveState?.status || null;
  const overlayCardCount = Number(evidence?.overlay?.cardCount || 0);
  const diagnosticsEvents = Array.isArray(evidence?.diagnostics?.events)
    ? evidence.diagnostics.events
    : [];

  if (Number.isFinite(expectations.outputCount) && outputs.length !== expectations.outputCount) {
    throw new Error(
      `Expected ${expectations.outputCount} assistant outputs, received ${outputs.length}.`
    );
  }

  if (
    Number.isFinite(expectations.minOutputCount) &&
    outputs.length < expectations.minOutputCount
  ) {
    throw new Error(
      `Expected at least ${expectations.minOutputCount} assistant outputs, received ${outputs.length}.`
    );
  }

  if (expectations.liveState && liveState !== expectations.liveState) {
    throw new Error(
      `Expected assistant live state '${expectations.liveState}', received '${liveState}'.`
    );
  }

  if (expectations.overlayCardCount !== undefined) {
    if (overlayCardCount !== expectations.overlayCardCount) {
      throw new Error(
        `Expected ${expectations.overlayCardCount} overlay cards, received ${overlayCardCount}.`
      );
    }
  }

  if (expectations.latestOutputTriggerText) {
    const actual = normalizeString(latestOutput?.triggerText);
    if (actual !== normalizeString(expectations.latestOutputTriggerText)) {
      throw new Error(
        `Expected latest trigger text '${expectations.latestOutputTriggerText}', received '${actual}'.`
      );
    }
  }

  if (expectations.latestOutputTriggerIncludes) {
    const actual = normalizeString(latestOutput?.triggerText);
    if (!actual.toLowerCase().includes(String(expectations.latestOutputTriggerIncludes).toLowerCase())) {
      throw new Error(
        `Latest trigger text does not include '${expectations.latestOutputTriggerIncludes}'. Actual: '${actual}'.`
      );
    }
  }

  if (expectations.latestOutputTriggerExcludes) {
    const actual = normalizeString(latestOutput?.triggerText).toLowerCase();
    if (actual.includes(String(expectations.latestOutputTriggerExcludes).toLowerCase())) {
      throw new Error(
        `Latest trigger text unexpectedly includes '${expectations.latestOutputTriggerExcludes}'. Actual: '${actual}'.`
      );
    }
  }

  if (expectations.latestOutputProfileId && latestOutput?.profileId !== expectations.latestOutputProfileId) {
    throw new Error(
      `Expected latest output profile '${expectations.latestOutputProfileId}', received '${latestOutput?.profileId || "n/a"}'.`
    );
  }

  if (
    expectations.latestOutputResponseIntent &&
    latestOutput?.responseIntent !== expectations.latestOutputResponseIntent
  ) {
    throw new Error(
      `Expected latest output responseIntent '${expectations.latestOutputResponseIntent}', received '${latestOutput?.responseIntent || "n/a"}'.`
    );
  }

  if (
    expectations.latestOutputResponseFormat &&
    latestOutput?.responseFormat !== expectations.latestOutputResponseFormat
  ) {
    throw new Error(
      `Expected latest output responseFormat '${expectations.latestOutputResponseFormat}', received '${latestOutput?.responseFormat || "n/a"}'.`
    );
  }

  if (
    expectations.latestOutputResponseDepth &&
    latestOutput?.responseDepth !== expectations.latestOutputResponseDepth
  ) {
    throw new Error(
      `Expected latest output responseDepth '${expectations.latestOutputResponseDepth}', received '${latestOutput?.responseDepth || "n/a"}'.`
    );
  }

  if (
    expectations.latestOutputResponseTone &&
    latestOutput?.responseTone !== expectations.latestOutputResponseTone
  ) {
    throw new Error(
      `Expected latest output responseTone '${expectations.latestOutputResponseTone}', received '${latestOutput?.responseTone || "n/a"}'.`
    );
  }

  if (
    expectations.latestOutputDeliveryBias &&
    latestOutput?.deliveryBias !== expectations.latestOutputDeliveryBias
  ) {
    throw new Error(
      `Expected latest output deliveryBias '${expectations.latestOutputDeliveryBias}', received '${latestOutput?.deliveryBias || "n/a"}'.`
    );
  }

  if (expectations.latestOutputContentIncludes) {
    const actual = normalizeString(latestOutput?.content);
    if (
      !actual.toLowerCase().includes(String(expectations.latestOutputContentIncludes).toLowerCase())
    ) {
      throw new Error(
        `Latest output content does not include '${expectations.latestOutputContentIncludes}'. Actual: '${actual}'.`
      );
    }
  }

  if (expectations.latestOutputLanguage === "fa") {
    if (!/[\u0600-\u06ff]/u.test(String(latestOutput?.content || ""))) {
      throw new Error("Expected latest assistant output to contain Persian script.");
    }
  }

  if (expectations.latestOutputLanguage === "en") {
    if (!/[A-Za-z]/.test(String(latestOutput?.content || ""))) {
      throw new Error("Expected latest assistant output to contain English text.");
    }
  }

  if (expectations.requireNoOutputs && outputs.length > 0) {
    throw new Error(`Expected no assistant outputs, received ${outputs.length}.`);
  }

  const latestOverlayCard =
    overlayCardCount > 0 && Array.isArray(evidence?.overlay?.cards)
      ? evidence.overlay.cards[overlayCardCount - 1] || null
      : null;

  if (
    Number.isFinite(expectations.latestOverlayMinListItemCount) &&
    Number(latestOverlayCard?.listItemCount || 0) <
      expectations.latestOverlayMinListItemCount
  ) {
    throw new Error(
      `Expected latest overlay card to render at least ${expectations.latestOverlayMinListItemCount} list items, received ${Number(latestOverlayCard?.listItemCount || 0)}.`
    );
  }

  if (
    Number.isFinite(expectations.latestOverlayMinParagraphCount) &&
    Number(latestOverlayCard?.paragraphCount || 0) <
      expectations.latestOverlayMinParagraphCount
  ) {
    throw new Error(
      `Expected latest overlay card to render at least ${expectations.latestOverlayMinParagraphCount} paragraphs, received ${Number(latestOverlayCard?.paragraphCount || 0)}.`
    );
  }

  if (
    Number.isFinite(expectations.latestOverlayMinHeadingCount) &&
    Number(latestOverlayCard?.headingCount || 0) <
      expectations.latestOverlayMinHeadingCount
  ) {
    throw new Error(
      `Expected latest overlay card to render at least ${expectations.latestOverlayMinHeadingCount} headings, received ${Number(latestOverlayCard?.headingCount || 0)}.`
    );
  }

  if (Array.isArray(expectations.diagnosticsMessages)) {
    const messages = diagnosticsEvents.map((event) => String(event?.message || ""));
    for (const expectedMessage of expectations.diagnosticsMessages) {
      if (!messages.includes(expectedMessage)) {
        throw new Error(
          `Expected diagnostics message '${expectedMessage}' was not found.`
        );
      }
    }
  }

  return {
    latestOutput,
    latestOverlayCard,
    outputCount: outputs.length,
    liveState,
    overlayCardCount,
  };
}
