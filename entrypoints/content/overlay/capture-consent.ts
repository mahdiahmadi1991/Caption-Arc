import { createElement } from "../libs";
import { overlay, setCaptureConsentState, settings } from "../state";
import { renderCaptions } from "../render";
import { applyThemePreference, getSystemPrefersDark } from "../../shared/theme";
import { syncOverlayVisibilityPreference } from "./visibility";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";
import { getUiRuntimeTranslator } from "../../shared/i18n";

export type CaptureConsentDecision = "approved" | "dismissed";
export type SessionContinuationDecision = "resume" | "restart";
export type SessionEndedDecision = "stay" | "exit";
type PromptKind =
  | "capture-consent"
  | "session-continuation"
  | "session-ended";

const CAPTURE_CONSENT_TIMEOUT_MS = 30000;
const CAPTURE_CONSENT_TICK_MS = 100;
const CAPTURE_CONSENT_EXIT_MS = 0;
const OVERLAY_EXIT_MS = 0;

let activeTimerId: number | null = null;
let activeExitId: number | null = null;
let activeRevealId: number | null = null;
let activeHostSyncId: number | null = null;
let activePromptEl: HTMLElement | null = null;
let activePromptHostEl: HTMLElement | null = null;
let activeResolver: ((decision: string) => void) | null = null;
let activePromptKind: PromptKind | null = null;
let activeStartedAt = 0;
let settled = false;

const overlayPromptDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "overlay-prompts",
});

function clearActiveTimers(): void {
  if (activeTimerId !== null) {
    window.clearInterval(activeTimerId);
    activeTimerId = null;
  }

  if (activeExitId !== null) {
    window.clearTimeout(activeExitId);
    activeExitId = null;
  }

  if (activeRevealId !== null) {
    window.clearTimeout(activeRevealId);
    activeRevealId = null;
  }

  if (activeHostSyncId !== null) {
    window.cancelAnimationFrame(activeHostSyncId);
    activeHostSyncId = null;
  }
}

function removePromptState(): void {
  clearActiveTimers();
  activePromptEl?.remove();
  activePromptHostEl?.remove();
  activePromptEl = null;
  activePromptHostEl = null;
  activeResolver = null;
  activePromptKind = null;
  settled = false;
  setCaptureConsentState("idle");
  renderCaptions(true);

  if (overlay) {
    overlay.classList.remove(
      "mc-capture-consent-pending",
      "mc-capture-consent-approved",
      "mc-capture-consent-dismissed",
      "mc-overlay-exiting"
    );
    syncOverlayVisibilityPreference();
  }
}

function formatCountdown(secondsRemaining: number): string {
  return `${Math.max(0, Math.ceil(secondsRemaining))}s`;
}

export function resetCaptureConsentPrompt(): void {
  void overlayPromptDiagnostics.info("overlay_prompt_reset_requested", {
    activePromptKind,
  });
  removePromptState();
}

export function forceResolveActivePrompt(
  promptKind: PromptKind,
  decision: string
): boolean {
  if (!activeResolver || activePromptKind !== promptKind) {
    void overlayPromptDiagnostics.trace("overlay_prompt_force_resolve_skipped", {
      promptKind,
      activePromptKind,
    });
    return false;
  }

  void overlayPromptDiagnostics.info("overlay_prompt_force_resolved", {
    promptKind,
    decision,
  });

  const resolve = activeResolver;
  clearActiveTimers();
  activePromptEl?.remove();
  activePromptHostEl?.remove();
  activePromptEl = null;
  activePromptHostEl = null;
  activeResolver = null;
  activePromptKind = null;
  settled = false;

  if (overlay) {
    overlay.classList.remove(
      "mc-capture-consent-pending",
      "mc-capture-consent-approved",
      "mc-capture-consent-dismissed",
      "mc-overlay-exiting"
    );
    syncOverlayVisibilityPreference();
  }

  resolve(decision);
  return true;
}

export function syncActivePromptTheme(): void {
  if (!activePromptHostEl) {
    return;
  }

  applyThemePreference(activePromptHostEl, settings.appearance, getSystemPrefersDark());
  activePromptHostEl.style.setProperty(
    "--mc-overlay-opacity",
    `${settings.overlayOpacity}%`
  );
}

function createPromptHost(): HTMLElement | null {
  if (!document.body) {
    return null;
  }

  const host = createElement("div", {
    className: "mc-critical-prompt-host",
    "aria-hidden": "true",
  });
  applyThemePreference(host, settings.appearance, getSystemPrefersDark());
  host.style.setProperty("--mc-overlay-opacity", `${settings.overlayOpacity}%`);
  document.body.appendChild(host);
  return host;
}

function syncPromptHostPosition(host: HTMLElement): void {
  if (!overlay || !settings.overlayVisible) {
    const width = Math.min(332, Math.max(220, window.innerWidth - 24));
    const left = Math.max(12, (window.innerWidth - width) / 2);

    host.classList.add("mc-critical-prompt-host-viewport");
    host.style.left = `${left}px`;
    host.style.top = "16px";
    host.style.width = `${width}px`;
    host.style.height = "auto";
    return;
  }

  host.classList.remove("mc-critical-prompt-host-viewport");
  const computed = window.getComputedStyle(overlay);
  const fallbackRect = overlay.getBoundingClientRect();
  const left = Number.parseFloat(computed.left);
  const top = Number.parseFloat(computed.top);
  const width = Number.parseFloat(computed.width);
  const height = Number.parseFloat(computed.height);

  host.style.left = `${Number.isFinite(left) ? left : fallbackRect.left}px`;
  host.style.top = `${Number.isFinite(top) ? top : fallbackRect.top}px`;
  host.style.width = `${Number.isFinite(width) ? width : fallbackRect.width}px`;
  host.style.height = `${Number.isFinite(height) ? height : fallbackRect.height}px`;
}

function startPromptHostSync(host: HTMLElement): void {
  const sync = () => {
    if (activePromptHostEl !== host) {
      activeHostSyncId = null;
      return;
    }

    syncPromptHostPosition(host);
    activeHostSyncId = window.requestAnimationFrame(sync);
  };

  sync();
}

function requestOverlayPrompt<TDecision extends string>(options: {
  promptKind: PromptKind;
  providerLabel: string;
  title: string;
  body: string;
  ariaLabel: string;
  secondaryActionLabel: string;
  primaryActionLabel: string;
  secondaryDecision: TDecision;
  primaryDecision: TDecision;
  escapeDecision: TDecision;
  timeoutDecision: TDecision;
  primaryFocus: "primary" | "secondary";
  showWhenOverlayHidden?: boolean;
  onBeforeShow?: () => void;
  onBeforeSettle?: (decision: TDecision) => void;
  onAfterResolve?: (decision: TDecision) => void;
}): Promise<TDecision> {
  const t = getUiRuntimeTranslator();

  if (!settings.overlayVisible && !options.showWhenOverlayHidden) {
    void overlayPromptDiagnostics.warn("overlay_prompt_skipped_hidden_overlay", {
      promptKind: options.promptKind,
      providerLabel: options.providerLabel,
    });
    return Promise.resolve(options.timeoutDecision);
  }

  const promptHost = createPromptHost();
  if (!promptHost) {
    void overlayPromptDiagnostics.error("overlay_prompt_skipped_no_host", {
      promptKind: options.promptKind,
      providerLabel: options.providerLabel,
    });
    return Promise.resolve(options.timeoutDecision);
  }

  removePromptState();
  activePromptHostEl = promptHost;
  activePromptKind = options.promptKind;
  activeStartedAt = Date.now();
  void overlayPromptDiagnostics.info("overlay_prompt_shown", {
    promptKind: options.promptKind,
    providerLabel: options.providerLabel,
  });
  options.onBeforeShow?.();
  syncPromptHostPosition(promptHost);
  startPromptHostSync(promptHost);

  if (overlay) {
    overlay.classList.remove("mc-overlay-exiting");
  }

  const providerBadge = createElement("span", {
    className: "mc-capture-consent-badge",
    textContent: options.providerLabel,
  });

  const title = createElement("div", {
    className: "mc-capture-consent-title",
    textContent: options.title,
  });

  const body = createElement("div", {
    className: "mc-capture-consent-body",
    textContent: options.body,
  });

  const countdown = createElement("span", {
    className: "mc-capture-consent-countdown",
    textContent: formatCountdown(CAPTURE_CONSENT_TIMEOUT_MS / 1000),
  });

  const progressFill = createElement("span", {
    className: "mc-capture-consent-progress-fill",
  });

  const progressTrack = createElement(
    "div",
    { className: "mc-capture-consent-progress", "aria-hidden": "true" },
    [progressFill]
  );

  const timeoutActionLabel =
    options.timeoutDecision === options.primaryDecision
      ? options.primaryActionLabel
      : options.timeoutDecision === options.secondaryDecision
        ? options.secondaryActionLabel
        : null;

  const timeoutHint = createElement("div", {
    className: "mc-capture-consent-timeout-hint",
    textContent: timeoutActionLabel
      ? t("content.prompts.timeoutHint", { action: timeoutActionLabel })
      : t("content.prompts.defaultTimeoutHint"),
  });

  const secondaryButton = createElement(
    "button",
    {
      type: "button",
      className: "mc-capture-consent-action mc-capture-consent-action-secondary",
    },
    [options.secondaryActionLabel]
  ) as HTMLButtonElement;

  const primaryButton = createElement(
    "button",
    {
      type: "button",
      className: "mc-capture-consent-action mc-capture-consent-action-primary",
    },
    [options.primaryActionLabel]
  ) as HTMLButtonElement;

  const card = createElement("div", { className: "mc-capture-consent-card" }, [
    createElement("div", { className: "mc-capture-consent-copy" }, [
      providerBadge,
      title,
      body,
    ]),
    createElement("div", { className: "mc-capture-consent-footer" }, [
      createElement("div", { className: "mc-capture-consent-progress-row" }, [
        countdown,
        progressTrack,
      ]),
      timeoutHint,
      createElement("div", { className: "mc-capture-consent-actions" }, [
        secondaryButton,
        primaryButton,
      ]),
    ]),
  ]);

  const prompt = createElement(
    "div",
    {
      className: "mc-capture-consent",
      role: "dialog",
      "aria-modal": "false",
      "aria-label": options.ariaLabel,
      tabindex: "-1",
    },
    [card]
  );

  const settle = (decision: TDecision) => {
    if (settled || !activeResolver) {
      void overlayPromptDiagnostics.trace("overlay_prompt_settle_skipped", {
        promptKind: options.promptKind,
        decision,
        settled,
      });
      return;
    }

    void overlayPromptDiagnostics.info("overlay_prompt_settled", {
      promptKind: options.promptKind,
      providerLabel: options.providerLabel,
      decision,
      durationMs: Date.now() - activeStartedAt,
    });

    settled = true;
    clearActiveTimers();
    prompt.classList.add("is-exiting");
    activePromptHostEl?.setAttribute("aria-hidden", "true");
    overlay?.classList.remove("mc-capture-consent-pending");
    options.onBeforeSettle?.(decision);

    const finalize = () => {
      activePromptEl?.remove();
      activePromptHostEl?.remove();
      activePromptEl = null;
      activePromptHostEl = null;

      const resolve = activeResolver as ((decision: TDecision) => void) | null;
      activeResolver = null;
      settled = false;
      options.onAfterResolve?.(decision);
      resolve?.(decision);
    };

    const exitDelayMs = CAPTURE_CONSENT_EXIT_MS || OVERLAY_EXIT_MS;
    if (exitDelayMs <= 0) {
      finalize();
      return;
    }

    activeExitId = window.setTimeout(finalize, exitDelayMs);
  };

  secondaryButton.addEventListener("click", () =>
    settle(options.secondaryDecision)
  );
  primaryButton.addEventListener("click", () => settle(options.primaryDecision));
  prompt.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      settle(options.escapeDecision);
    }
  });

  overlay?.classList.add("mc-capture-consent-pending");
  promptHost.appendChild(prompt);
  promptHost.setAttribute("aria-hidden", "false");
  activePromptEl = prompt;

  const revealPrompt = () => {
    prompt.classList.add("is-visible");
    if (options.primaryFocus === "primary") {
      primaryButton.focus();
    } else {
      secondaryButton.focus();
    }
    activeRevealId = null;
  };

  revealPrompt();

  activeTimerId = window.setInterval(() => {
    const elapsedMs = Date.now() - activeStartedAt;
    const remainingMs = Math.max(0, CAPTURE_CONSENT_TIMEOUT_MS - elapsedMs);
    const progress = remainingMs / CAPTURE_CONSENT_TIMEOUT_MS;

    countdown.textContent = formatCountdown(remainingMs / 1000);
    progressFill.style.transform = `scaleX(${progress.toFixed(3)})`;

    if (remainingMs <= 0) {
      settle(options.timeoutDecision);
    }
  }, CAPTURE_CONSENT_TICK_MS);

  return new Promise<TDecision>((resolve) => {
    activeResolver = resolve as (decision: string) => void;
  });
}

export function requestCaptureConsent(
  providerLabel: string
): Promise<CaptureConsentDecision> {
  const t = getUiRuntimeTranslator();

  return requestOverlayPrompt<CaptureConsentDecision>({
    promptKind: "capture-consent",
    providerLabel,
    title: t("content.prompts.captureConsent.title"),
    body: t("content.prompts.captureConsent.body"),
    ariaLabel: t("content.prompts.captureConsent.ariaLabel"),
    secondaryActionLabel: t("content.prompts.captureConsent.secondaryAction"),
    primaryActionLabel: t("content.prompts.captureConsent.primaryAction"),
    secondaryDecision: "dismissed",
    primaryDecision: "approved",
    escapeDecision: "dismissed",
    timeoutDecision: "dismissed",
    primaryFocus: "primary",
    showWhenOverlayHidden: true,
    onBeforeShow: () => {
      setCaptureConsentState("pending");
      renderCaptions(true);
    },
    onBeforeSettle: (decision) => {
      setCaptureConsentState(
        decision === "approved" ? "approved" : "dismissed"
      );
      renderCaptions(true);
      if (overlay) {
        overlay.classList.add(
          decision === "approved"
            ? "mc-capture-consent-approved"
            : "mc-capture-consent-dismissed"
        );
      }
    },
    onAfterResolve: (decision) => {
      if (decision === "approved" && overlay) {
        overlay.classList.remove("mc-capture-consent-approved");
      }
    },
  });
}

export function requestSessionContinuationDecision(
  providerLabel: string
): Promise<SessionContinuationDecision> {
  const t = getUiRuntimeTranslator();

  return requestOverlayPrompt<SessionContinuationDecision>({
    promptKind: "session-continuation",
    providerLabel,
    title: t("content.prompts.sessionContinuation.title"),
    body: t("content.prompts.sessionContinuation.body"),
    ariaLabel: t("content.prompts.sessionContinuation.ariaLabel"),
    secondaryActionLabel: t(
      "content.prompts.sessionContinuation.secondaryAction"
    ),
    primaryActionLabel: t("content.prompts.sessionContinuation.primaryAction"),
    secondaryDecision: "restart",
    primaryDecision: "resume",
    escapeDecision: "restart",
    timeoutDecision: "restart",
    primaryFocus: "primary",
    showWhenOverlayHidden: true,
  });
}

export function requestSessionEndedDecision(
  providerLabel: string
): Promise<SessionEndedDecision> {
  const t = getUiRuntimeTranslator();

  return requestOverlayPrompt<SessionEndedDecision>({
    promptKind: "session-ended",
    providerLabel,
    title: t("content.prompts.sessionEnded.title"),
    body: t("content.prompts.sessionEnded.body"),
    ariaLabel: t("content.prompts.sessionEnded.ariaLabel"),
    secondaryActionLabel: t("content.prompts.sessionEnded.secondaryAction"),
    primaryActionLabel: t("content.prompts.sessionEnded.primaryAction"),
    secondaryDecision: "exit",
    primaryDecision: "stay",
    escapeDecision: "exit",
    timeoutDecision: "exit",
    primaryFocus: "primary",
  });
}

export const overlayPromptInternals = {
  requestOverlayPrompt: requestOverlayPrompt as <TDecision extends string>(options: {
    promptKind: PromptKind;
    providerLabel: string;
    title: string;
    body: string;
    ariaLabel: string;
    secondaryActionLabel: string;
    primaryActionLabel: string;
    secondaryDecision: TDecision;
    primaryDecision: TDecision;
    escapeDecision: TDecision;
    timeoutDecision: TDecision;
    primaryFocus: "primary" | "secondary";
    showWhenOverlayHidden?: boolean;
    onBeforeShow?: () => void;
    onBeforeSettle?: (decision: TDecision) => void;
    onAfterResolve?: (decision: TDecision) => void;
  }) => Promise<TDecision>,
  removePromptState: resetCaptureConsentPrompt,
};
