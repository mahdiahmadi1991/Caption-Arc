#!/usr/bin/env node

import { evaluateInTarget } from "./cdp-runtime.mjs";

const DRIVER_NAMESPACE = "__captionArcAssistantDlsDriver";

async function evaluateDriverExpression({
  webSocketDebuggerUrl,
  expression,
  awaitPromise = false,
  delayMs = 120,
} = {}) {
  return await evaluateInTarget({
    webSocketDebuggerUrl,
    expression,
    awaitPromise,
    delayMs,
  });
}

export async function installGoogleMeetCaptionFixtureDriver({
  webSocketDebuggerUrl,
} = {}) {
  return await evaluateDriverExpression({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const ns = ${JSON.stringify(DRIVER_NAMESPACE)};
        const existing = window[ns];
        if (existing?.ready) {
          return {
            ok: true,
            reused: true,
            ready: true,
            regionPresent: Boolean(existing.ensureRegion?.()),
          };
        }

        const DRIVER_REGION_ATTR = "data-captionarc-assistant-dls-region";

        const normalizeKey = (value) =>
          String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, "-") || "caption";

        const ensureRegion = () => {
          const existingRegion =
            document.querySelector('[role="region"].vNKgIf.UDinHf') ||
            document.querySelector('[' + DRIVER_REGION_ATTR + '="1"]');
          if (existingRegion) {
            return existingRegion;
          }

          const region = document.createElement("div");
          region.setAttribute("role", "region");
          region.className = "vNKgIf UDinHf";
          region.setAttribute(DRIVER_REGION_ATTR, "1");
          region.style.position = "fixed";
          region.style.left = "12px";
          region.style.bottom = "12px";
          region.style.width = "4px";
          region.style.height = "4px";
          region.style.opacity = "0.01";
          region.style.pointerEvents = "none";
          region.style.zIndex = "1";
          document.body.appendChild(region);
          return region;
        };

        const getEntries = () => window[ns].entries;

        const createEntry = ({ stableKey, speaker, text }) => {
          const entry = document.createElement("div");
          entry.className = "nMcdL";
          entry.setAttribute("data-captionarc-dls-key", stableKey);

          const speakerEl = document.createElement("span");
          speakerEl.className = "NWpY1d";
          speakerEl.textContent = speaker;

          const textEl = document.createElement("span");
          textEl.className = "ygicle";
          textEl.textContent = text;

          entry.append(speakerEl, textEl);
          return entry;
        };

        const upsertCaption = ({ stableKey, speaker, text, own = false }) => {
          const region = ensureRegion();
          const resolvedKey = normalizeKey(stableKey || speaker + "-" + text);
          const resolvedSpeaker = own ? "You" : String(speaker || "Participant").trim();
          const resolvedText = String(text || "").trim();

          if (!resolvedText) {
            throw new Error("Caption text is required.");
          }

          const entries = getEntries();
          const existingEntry = entries.get(resolvedKey) || null;
          if (existingEntry) {
            existingEntry.querySelector(".NWpY1d").textContent = resolvedSpeaker;
            existingEntry.querySelector(".ygicle").textContent = resolvedText;
          } else {
            const nextEntry = createEntry({
              stableKey: resolvedKey,
              speaker: resolvedSpeaker,
              text: resolvedText,
            });
            entries.set(resolvedKey, nextEntry);
            region.appendChild(nextEntry);
          }

          return {
            stableKey: resolvedKey,
            speaker: resolvedSpeaker,
            text: resolvedText,
            totalEntries: entries.size,
          };
        };

        const reset = () => {
          const entries = getEntries();
          for (const entry of entries.values()) {
            entry.remove();
          }
          entries.clear();
          return { ok: true };
        };

        window[ns] = {
          ready: true,
          entries: new Map(),
          ensureRegion,
          upsertCaption,
          reset,
          snapshot() {
            const entries = Array.from(getEntries().entries()).map(([key, entry]) => ({
              stableKey: key,
              speaker: entry.querySelector(".NWpY1d")?.textContent || "",
              text: entry.querySelector(".ygicle")?.textContent || "",
            }));
            return {
              ready: true,
              entryCount: entries.length,
              entries,
              regionPresent: Boolean(ensureRegion()),
            };
          },
        };

        ensureRegion();

        return {
          ok: true,
          ready: true,
          reused: false,
          regionPresent: true,
        };
      }
    )()`,
  });
}

export async function resetGoogleMeetCaptionFixtureDriver({
  webSocketDebuggerUrl,
} = {}) {
  return await evaluateDriverExpression({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const driver = window[${JSON.stringify(DRIVER_NAMESPACE)}];
        if (!driver?.ready) {
          return { ok: true, skipped: true };
        }
        return driver.reset();
      }
    )()`,
  });
}

export async function upsertGoogleMeetCaption({
  webSocketDebuggerUrl,
  stableKey,
  speaker,
  text,
  own = false,
} = {}) {
  return await evaluateDriverExpression({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const driver = window[${JSON.stringify(DRIVER_NAMESPACE)}];
        if (!driver?.ready) {
          throw new Error("Google Meet caption fixture driver is not installed.");
        }
        return driver.upsertCaption(${JSON.stringify({
          stableKey,
          speaker,
          text,
          own,
        })});
      }
    )()`,
  });
}

export async function getGoogleMeetCaptionFixtureSnapshot({
  webSocketDebuggerUrl,
} = {}) {
  return await evaluateDriverExpression({
    webSocketDebuggerUrl,
    awaitPromise: true,
    expression: `(
      async () => {
        const driver = window[${JSON.stringify(DRIVER_NAMESPACE)}];
        if (!driver?.ready) {
          return { ready: false };
        }
        return driver.snapshot();
      }
    )()`,
  });
}
