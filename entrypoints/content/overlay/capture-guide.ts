import { createElement } from "../libs";
import { createContentIcon } from "../icons";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";
import { getUiRuntimeTranslator } from "../../shared/i18n";
import {
  captions,
  captureGuide,
  captureGuideElement,
  isCCEnabled,
  isCaptureGuideOpen,
  overlay,
  setCaptureGuideElement,
  setCaptureGuideOpen,
} from "../state";

const captureGuideDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "overlay-capture-guide",
});

function syncCaptureGuideTrigger(): void {
  const t = getUiRuntimeTranslator();
  const trigger = document.getElementById("mc-capture-guide-toggle");

  if (!(trigger instanceof HTMLButtonElement)) {
    return;
  }

  trigger.classList.toggle("mc-active", isCaptureGuideOpen);
  trigger.setAttribute("aria-pressed", String(isCaptureGuideOpen));
  trigger.setAttribute(
    "data-tooltip",
    isCaptureGuideOpen
      ? t("content.captureGuide.tooltipClose")
      : t("content.captureGuide.tooltipOpen")
  );
  trigger.setAttribute(
    "aria-label",
    isCaptureGuideOpen
      ? t("content.captureGuide.tooltipClose")
      : t("content.captureGuide.tooltipOpen")
  );
}

function scrollCaptureGuideIntoView(): void {
  if (!overlay || !captureGuideElement) {
    return;
  }

  const contentEl = overlay.querySelector(".mc-content");

  if (!(contentEl instanceof HTMLElement)) {
    return;
  }

  const dockEl = overlay.querySelector(".mc-translation-dock");
  const contentRect = contentEl.getBoundingClientRect();
  const guideRect = captureGuideElement.getBoundingClientRect();
  const dockRect =
    dockEl instanceof HTMLElement ? dockEl.getBoundingClientRect() : null;
  const desiredTop =
    (dockRect ? dockRect.bottom - contentRect.top : 0) + 12;
  const delta = guideRect.top - contentRect.top - desiredTop;

  if (Math.abs(delta) < 2) {
    return;
  }

  contentEl.scrollTo({
    top: Math.max(0, contentEl.scrollTop + delta),
    behavior: "smooth",
  });
}

function renderCaptureGuideContent(): void {
  const t = getUiRuntimeTranslator();

  if (!captureGuideElement) {
    return;
  }

  const eyebrowEl = captureGuideElement.querySelector(
    ".mc-capture-guide-eyebrow"
  ) as HTMLElement | null;
  const titleEl = captureGuideElement.querySelector(
    ".mc-capture-guide-title"
  ) as HTMLElement | null;
  const bodyEl = captureGuideElement.querySelector(
    ".mc-capture-guide-body"
  ) as HTMLElement | null;
  const metaEl = captureGuideElement.querySelector(
    ".mc-capture-guide-meta"
  ) as HTMLElement | null;
  const statusEl = captureGuideElement.querySelector(
    ".mc-capture-guide-status"
  ) as HTMLElement | null;
  const stepsEl = captureGuideElement.querySelector(
    ".mc-capture-guide-steps"
  ) as HTMLElement | null;
  const troubleshootingEl = captureGuideElement.querySelector(
    ".mc-capture-guide-troubleshooting"
  ) as HTMLElement | null;
  const waitingEl = captureGuideElement.querySelector(
    ".mc-capture-guide-footer"
  ) as HTMLElement | null;
  const footerEl = captureGuideElement.querySelector(
    ".mc-capture-guide-footer-note"
  ) as HTMLElement | null;

  if (
    !eyebrowEl ||
    !titleEl ||
    !bodyEl ||
    !metaEl ||
    !statusEl ||
    !stepsEl ||
    !troubleshootingEl ||
    !waitingEl ||
    !footerEl
  ) {
    return;
  }

  eyebrowEl.textContent = t("content.captureGuide.eyebrow");
  titleEl.textContent = captureGuide?.modalTitle || t("content.captureGuide.title");
  bodyEl.textContent = captureGuide?.modalBody || "";
  metaEl.textContent = t("content.captureGuide.stepsCount", {
    count: captureGuide?.steps.length || 0,
  });
  statusEl.textContent =
    captureGuide?.statusLabel || t("content.captureGuide.statusReady");
  footerEl.textContent =
    captureGuide?.footerNote ||
    t("content.captureGuide.footer");

  while (stepsEl.firstChild) {
    stepsEl.removeChild(stepsEl.firstChild);
  }

  for (const [index, step] of (captureGuide?.steps || []).entries()) {
    const stepEl = createElement("li", { className: "mc-capture-guide-step" }, [
      createElement("div", {
        className: "mc-capture-guide-step-number",
        textContent: String(index + 1),
      }),
      createElement("div", { className: "mc-capture-guide-step-content" }, [
        createElement("div", {
          className: "mc-capture-guide-step-title",
          textContent: step.title,
        }),
        createElement("div", {
          className: "mc-capture-guide-step-detail",
          textContent: step.detail,
        }),
      ]),
    ]);

    stepsEl.appendChild(stepEl);
  }

  troubleshootingEl.textContent = captureGuide?.troubleshootingHint || "";
  troubleshootingEl.style.display = captureGuide?.troubleshootingHint
    ? "block"
    : "none";

  const shouldShowWaitingState = !isCCEnabled && captions.length === 0;
  waitingEl.style.display = shouldShowWaitingState ? "block" : "none";
}

export function syncCaptureGuide(): void {
  renderCaptureGuideContent();
  syncCaptureGuideTrigger();

  if (!captureGuideElement) {
    void captureGuideDiagnostics.trace("capture_guide_sync_skipped_missing_element");
    return;
  }

  void captureGuideDiagnostics.trace("capture_guide_synced", {
    open: isCaptureGuideOpen,
    hasGuide: Boolean(captureGuide),
    captionCount: captions.length,
    captionsEnabled: isCCEnabled,
  });

  captureGuideElement.classList.toggle("mc-open", isCaptureGuideOpen);
  overlay?.classList.toggle("mc-guide-open", isCaptureGuideOpen);
}

export function openCaptureGuide(): void {
  if (!captureGuide) {
    void captureGuideDiagnostics.trace("capture_guide_open_skipped_missing_guide");
    return;
  }

  void captureGuideDiagnostics.info("capture_guide_opened", {
    stepCount: captureGuide.steps.length,
    captionsEnabled: isCCEnabled,
  });
  setCaptureGuideOpen(true);
  syncCaptureGuide();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollCaptureGuideIntoView();
    });
  });
}

export function closeCaptureGuide(): void {
  void captureGuideDiagnostics.info("capture_guide_closed", {
    captionsEnabled: isCCEnabled,
    captionCount: captions.length,
  });
  setCaptureGuideOpen(false);
  syncCaptureGuide();
}

export function createCaptureGuide(): HTMLElement {
  const t = getUiRuntimeTranslator();
  void captureGuideDiagnostics.debug("capture_guide_created");
  const closeBtn = createElement("button", {
    className: "mc-capture-guide-close",
    "aria-label": t("content.captureGuide.closeAriaLabel"),
    onClick: () => closeCaptureGuide(),
  }, [createContentIcon("close", { className: "mc-icon", size: 16 }) as unknown as HTMLElement]);

  const guide = createElement(
    "div",
    {
      className: "mc-capture-guide",
    },
    [
      createElement("div", { className: "mc-capture-guide-shell" }, [
        createElement("div", { className: "mc-capture-guide-header" }, [
          createElement("div", { className: "mc-capture-guide-header-copy" }, [
            createElement("div", { className: "mc-capture-guide-eyebrow" }),
            createElement("div", { className: "mc-capture-guide-title" }),
            createElement("div", { className: "mc-capture-guide-body" }),
            createElement("div", { className: "mc-capture-guide-header-row" }, [
              createElement("div", { className: "mc-capture-guide-meta" }),
              createElement(
                "div",
                {
                  className:
                    "mc-capture-guide-status mc-capture-guide-status-ready",
                },
                [t("content.captureGuide.startsAutomatically")]
              ),
            ]),
          ]),
          createElement("div", { className: "mc-capture-guide-actions" }, [
            closeBtn,
          ]),
        ]),
        createElement("ol", { className: "mc-capture-guide-steps" }),
        createElement("div", {
          className: "mc-capture-guide-troubleshooting",
        }),
        createElement("div", { className: "mc-capture-guide-footer" }, [
          createElement("div", { className: "mc-capture-guide-waiting" }, [
            createElement("div", { className: "mc-capture-guide-waiting-icon" }, [
              createElement("span", { className: "mc-capture-guide-dot" }),
              createElement("span", { className: "mc-capture-guide-dot" }),
              createElement("span", { className: "mc-capture-guide-dot" }),
            ]),
            createElement("div", { className: "mc-capture-guide-waiting-copy" }, [
              createElement("div", {
                className: "mc-capture-guide-waiting-title",
                textContent: t("content.captureGuide.waitingTitle"),
              }),
              createElement("div", {
                className: "mc-capture-guide-footer-note",
              }),
            ]),
          ]),
        ]),
      ]),
    ]
  );

  setCaptureGuideElement(guide);
  syncCaptureGuide();

  return guide;
}
