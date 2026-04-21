#!/usr/bin/env node

import { evaluateInTarget } from "./cdp-runtime.mjs";
import { ensureChromeExtensionsTab } from "./google-meet-assistant-harness.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function buildOpenErrorsViewExpression(extensionId) {
  return `(() => {
    const normalize = (value) =>
      String(value || "").replace(/\\s+/g, " ").trim().toLowerCase();

    const deepQuery = (selector, root = document) => {
      const results = [];
      const visit = (node) => {
        if (!node) {
          return;
        }
        if (node.querySelectorAll) {
          results.push(...node.querySelectorAll(selector));
        }
        const descendants = node.querySelectorAll ? node.querySelectorAll("*") : [];
        for (const descendant of descendants) {
          if (descendant.shadowRoot) {
            visit(descendant.shadowRoot);
          }
        }
      };
      visit(root);
      return results;
    };

    const item = deepQuery('extensions-item[id="${extensionId}"]')[0] || null;
    const button = item?.shadowRoot?.querySelector("#errors-button") || null;
    const buttonText = normalize(button?.textContent || "");
    if (!item || !button) {
      return {
        ok: false,
        reason: "errors-button-unavailable",
        itemFound: Boolean(item),
        buttonFound: Boolean(button),
      };
    }

    button.click();
    return {
      ok: true,
      itemFound: true,
      buttonFound: true,
      buttonText,
      href: window.location.href,
    };
  })()`;
}

function buildReadErrorsViewExpression() {
  return `(() => {
    const normalize = (value) =>
      String(value || "").replace(/\\s+/g, " ").trim();

    const deepQuery = (selector, root = document) => {
      const results = [];
      const visit = (node) => {
        if (!node) {
          return;
        }
        if (node.querySelectorAll) {
          results.push(...node.querySelectorAll(selector));
        }
        const descendants = node.querySelectorAll ? node.querySelectorAll("*") : [];
        for (const descendant of descendants) {
          if (descendant.shadowRoot) {
            visit(descendant.shadowRoot);
          }
        }
      };
      visit(root);
      return results;
    };

    const page = deepQuery("extensions-error-page")[0] || null;
    const root = page?.shadowRoot || null;
    const entries = root
      ? Array.from(root.querySelectorAll("li")).map((entry, index) => {
          const codeSections = Array.from(
            entry.querySelectorAll("extensions-code-section")
          ).map((section) => normalize(section.textContent));

          return {
            index,
            text: normalize(entry.textContent),
            codeSections,
            clearAria:
              entry.querySelector("cr-icon-button")?.getAttribute("aria-label") ||
              null,
          };
        })
      : [];

    const buttons = root
      ? Array.from(
          root.querySelectorAll("cr-button, cr-icon-button, button, [role='button']")
        ).map((button) => ({
          tag: button.tagName,
          id: button.id || null,
          text: normalize(button.textContent),
          aria: button.getAttribute("aria-label") || null,
        }))
      : [];

    return {
      href: window.location.href,
      pagePresent: Boolean(page),
      entryCount: entries.length,
      entries,
      buttons,
    };
  })()`;
}

function buildClearErrorsViewExpression() {
  return `(() => {
    const normalize = (value) =>
      String(value || "").replace(/\\s+/g, " ").trim().toLowerCase();

    const deepQuery = (selector, root = document) => {
      const results = [];
      const visit = (node) => {
        if (!node) {
          return;
        }
        if (node.querySelectorAll) {
          results.push(...node.querySelectorAll(selector));
        }
        const descendants = node.querySelectorAll ? node.querySelectorAll("*") : [];
        for (const descendant of descendants) {
          if (descendant.shadowRoot) {
            visit(descendant.shadowRoot);
          }
        }
      };
      visit(root);
      return results;
    };

    const page = deepQuery("extensions-error-page")[0] || null;
    const root = page?.shadowRoot || null;
    if (!root) {
      return {
        cleared: false,
        reason: "errors-page-unavailable",
      };
    }

    const clearAll = Array.from(
      root.querySelectorAll("cr-button, button, [role='button']")
    ).find((button) => normalize(button.textContent).includes("clear all"));

    if (clearAll) {
      clearAll.click();
      return {
        cleared: true,
        mode: "clear-all",
      };
    }

    const entryButtons = Array.from(root.querySelectorAll("cr-icon-button")).filter(
      (button) => normalize(button.getAttribute("aria-label")).includes("clear entry")
    );

    for (const button of entryButtons) {
      button.click();
    }

    return {
      cleared: entryButtons.length > 0,
      mode: "clear-entry",
      entryCount: entryButtons.length,
    };
  })()`;
}

function buildReturnToExtensionsListExpression() {
  return `(() => {
    const normalize = (value) =>
      String(value || "").replace(/\\s+/g, " ").trim().toLowerCase();

    const deepQuery = (selector, root = document) => {
      const results = [];
      const visit = (node) => {
        if (!node) {
          return;
        }
        if (node.querySelectorAll) {
          results.push(...node.querySelectorAll(selector));
        }
        const descendants = node.querySelectorAll ? node.querySelectorAll("*") : [];
        for (const descendant of descendants) {
          if (descendant.shadowRoot) {
            visit(descendant.shadowRoot);
          }
        }
      };
      visit(root);
      return results;
    };

    const page = deepQuery("extensions-error-page")[0] || null;
    const root = page?.shadowRoot || null;
    const backButton = root
      ? Array.from(root.querySelectorAll("cr-icon-button, button, [role='button']")).find(
          (button) => normalize(button.getAttribute("aria-label")).includes("back")
        )
      : null;

    if (backButton) {
      backButton.click();
      return {
        ok: true,
        method: "back-button",
      };
    }

    if (window.location.search.includes("errors=")) {
      window.location.href = "chrome://extensions/";
      return {
        ok: true,
        method: "location-reset",
      };
    }

    return {
      ok: false,
      method: "no-op",
    };
  })()`;
}

export async function inspectCaptionArcExtensionErrors({
  baseUrl,
  extensionId,
} = {}) {
  if (!baseUrl || !extensionId) {
    throw new Error("inspectCaptionArcExtensionErrors requires baseUrl and extensionId.");
  }

  const target = await ensureChromeExtensionsTab({ baseUrl });
  if (!target?.webSocketDebuggerUrl) {
    throw new Error("Could not resolve chrome://extensions target for error inspection.");
  }

  const opened = await evaluateInTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    delayMs: 200,
    expression: buildOpenErrorsViewExpression(extensionId),
  });

  if (!opened?.ok) {
    return {
      href: "chrome://extensions/",
      entryCount: 0,
      entries: [],
      buttons: [],
      errorsButtonPresent: false,
    };
  }

  await sleep(450);

  const view = await evaluateInTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    delayMs: 250,
    expression: buildReadErrorsViewExpression(),
  });

  return {
    ...view,
    errorsButtonPresent: true,
  };
}

export async function clearCaptionArcExtensionErrors({
  baseUrl,
} = {}) {
  if (!baseUrl) {
    throw new Error("clearCaptionArcExtensionErrors requires baseUrl.");
  }

  const target = await ensureChromeExtensionsTab({ baseUrl });
  if (!target?.webSocketDebuggerUrl) {
    throw new Error("Could not resolve chrome://extensions target for error clearing.");
  }

  const cleared = await evaluateInTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    delayMs: 150,
    expression: buildClearErrorsViewExpression(),
  }).catch(() => ({
    cleared: false,
    reason: "clear-evaluate-failed",
  }));

  await sleep(250);

  const navigated = await evaluateInTarget({
    webSocketDebuggerUrl: target.webSocketDebuggerUrl,
    delayMs: 120,
    expression: buildReturnToExtensionsListExpression(),
  }).catch(() => ({
    ok: false,
    method: "return-evaluate-failed",
  }));

  await sleep(250);

  return {
    cleared,
    navigated,
  };
}

function formatEntries(entries) {
  return entries
    .slice(0, 5)
    .map((entry) => {
      const codeSections = Array.isArray(entry?.codeSections)
        ? entry.codeSections.filter(Boolean).slice(0, 2)
        : [];
      return [
        `- ${String(entry?.text || "").slice(0, 240)}`,
        ...codeSections.map((section) => `  context: ${String(section).slice(0, 240)}`),
      ].join("\n");
    })
    .join("\n");
}

export async function auditAndClearCaptionArcExtensionErrors({
  baseUrl,
  extensionId,
  stageLabel = "runtime",
  failOnErrors = false,
} = {}) {
  const inspection = await inspectCaptionArcExtensionErrors({
    baseUrl,
    extensionId,
  });

  if (!inspection.errorsButtonPresent || !inspection.entryCount) {
    return {
      stageLabel,
      inspection,
      cleared: null,
      summary: `${stageLabel}: no extension errors found`,
    };
  }

  const cleared = await clearCaptionArcExtensionErrors({
    baseUrl,
  }).catch((error) => ({
    cleared: false,
    reason: error instanceof Error ? error.message : String(error),
  }));

  const summary = [
    `${stageLabel}: detected ${inspection.entryCount} extension error(s)`,
    formatEntries(inspection.entries || []),
  ]
    .filter(Boolean)
    .join("\n");

  if (failOnErrors) {
    throw new Error(summary);
  }

  return {
    stageLabel,
    inspection,
    cleared,
    summary,
  };
}
