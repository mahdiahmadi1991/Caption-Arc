import { overlay } from "../state";

const TOOLTIP_HOVER_DELAY_MS = 260;
const TOOLTIP_FOCUS_DELAY_MS = 180;

let tooltipEl: HTMLDivElement | null = null;
let activeAnchor: HTMLElement | null = null;
let showTooltipTimeout: number | null = null;

function ensureTooltipElement(): HTMLDivElement {
  if (tooltipEl) {
    return tooltipEl;
  }

  tooltipEl = document.createElement("div");
  tooltipEl.className = "mc-floating-tooltip";
  tooltipEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(tooltipEl);

  return tooltipEl;
}

function hideTooltip(): void {
  if (showTooltipTimeout !== null) {
    window.clearTimeout(showTooltipTimeout);
    showTooltipTimeout = null;
  }

  if (!tooltipEl) {
    return;
  }

  tooltipEl.classList.remove("is-visible");
  activeAnchor = null;
}

function positionTooltip(anchor: HTMLElement): void {
  const el = ensureTooltipElement();
  const rect = anchor.getBoundingClientRect();
  const tooltipRect = el.getBoundingClientRect();
  const gap = 10;

  let top = rect.bottom + gap;
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
  let placement: "top" | "bottom" = "bottom";

  if (top + tooltipRect.height > window.innerHeight - 8) {
    top = rect.top - tooltipRect.height - gap;
    placement = "top";
  }

  if (top < 8) {
    top = Math.max(8, rect.bottom + gap);
    placement = "bottom";
  }

  left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

  el.dataset.placement = placement;
  el.style.top = `${Math.round(top)}px`;
  el.style.left = `${Math.round(left)}px`;
}

function showTooltip(anchor: HTMLElement): void {
  const text = anchor.getAttribute("data-tooltip");
  if (!text) {
    return;
  }

  activeAnchor = anchor;

  const el = ensureTooltipElement();
  el.textContent = text;
  el.dataset.theme = overlay?.getAttribute("data-theme") || "dark";
  el.classList.add("is-visible");
  positionTooltip(anchor);
}

function queueTooltip(anchor: HTMLElement, delayMs: number): void {
  if (showTooltipTimeout !== null) {
    window.clearTimeout(showTooltipTimeout);
  }

  showTooltipTimeout = window.setTimeout(() => {
    showTooltipTimeout = null;
    showTooltip(anchor);
  }, delayMs);
}

function handlePointerOver(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const anchor = target.closest("[data-tooltip]");
  if (!(anchor instanceof HTMLElement)) {
    hideTooltip();
    return;
  }

  if (activeAnchor === anchor) {
    return;
  }

  queueTooltip(anchor, TOOLTIP_HOVER_DELAY_MS);
}

function handlePointerOut(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const anchor = target.closest("[data-tooltip]");
  if (!(anchor instanceof HTMLElement)) {
    return;
  }

  const related = event instanceof MouseEvent ? event.relatedTarget : null;
  if (related instanceof Node && anchor.contains(related)) {
    return;
  }

  if (activeAnchor === anchor) {
    hideTooltip();
  }
}

function handleFocusIn(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const anchor = target.closest("[data-tooltip]");
  if (anchor instanceof HTMLElement) {
    queueTooltip(anchor, TOOLTIP_FOCUS_DELAY_MS);
  }
}

function handleFocusOut(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const anchor = target.closest("[data-tooltip]");
  if (!(anchor instanceof HTMLElement)) {
    return;
  }

  const related = event instanceof FocusEvent ? event.relatedTarget : null;
  if (related instanceof Node && anchor.contains(related)) {
    return;
  }

  if (activeAnchor === anchor) {
    hideTooltip();
  }
}

function handleViewportChange(): void {
  if (activeAnchor) {
    positionTooltip(activeAnchor);
  }
}

export function initTooltipSystem(root: HTMLElement): () => void {
  root.addEventListener("mouseover", handlePointerOver);
  root.addEventListener("mouseout", handlePointerOut);
  root.addEventListener("focusin", handleFocusIn);
  root.addEventListener("focusout", handleFocusOut);

  window.addEventListener("scroll", handleViewportChange, true);
  window.addEventListener("resize", handleViewportChange);

  return () => {
    root.removeEventListener("mouseover", handlePointerOver);
    root.removeEventListener("mouseout", handlePointerOut);
    root.removeEventListener("focusin", handleFocusIn);
    root.removeEventListener("focusout", handleFocusOut);
    window.removeEventListener("scroll", handleViewportChange, true);
    window.removeEventListener("resize", handleViewportChange);
  };
}

export function syncTooltipTheme(): void {
  if (!tooltipEl) {
    return;
  }

  tooltipEl.dataset.theme = overlay?.getAttribute("data-theme") || "dark";
}

export function destroyTooltipSystem(): void {
  if (showTooltipTimeout !== null) {
    window.clearTimeout(showTooltipTimeout);
    showTooltipTimeout = null;
  }

  activeAnchor = null;

  if (tooltipEl?.parentNode) {
    tooltipEl.parentNode.removeChild(tooltipEl);
  }

  tooltipEl = null;
}
