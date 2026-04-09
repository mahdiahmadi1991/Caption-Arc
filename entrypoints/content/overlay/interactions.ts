import {
  activeMeetingPlatform,
  savedPosition,
  settings,
  updateSettings,
} from "../state";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";

const overlayInteractionDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "overlay-interactions",
});

export function persistOverlayPosition(
  element: HTMLElement,
  options?: { view?: "expanded" | "minimized" }
): void {
  if (!activeMeetingPlatform) {
    void overlayInteractionDiagnostics.trace("overlay_position_persist_skipped_no_platform");
    return;
  }

  const rect = element.getBoundingClientRect();
  const persistedWidth =
    element.classList.contains("minimized") && savedPosition
      ? Number.parseFloat(savedPosition.width) || rect.width
      : rect.width;
  const persistedHeight =
    element.classList.contains("minimized") && savedPosition
      ? Number.parseFloat(savedPosition.height) || rect.height
      : rect.height;
  const nextOverlayPositionsByPlatform = {
    ...settings.overlayPositionsByPlatform,
    [activeMeetingPlatform]: {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(persistedWidth),
      height: Math.round(persistedHeight),
      view:
        options?.view ??
        settings.overlayPositionsByPlatform?.[activeMeetingPlatform]?.view ??
        "expanded",
    },
  };

  updateSettings({
    overlayPositionsByPlatform: nextOverlayPositionsByPlatform,
  });

  void overlayInteractionDiagnostics.info("overlay_position_persisted_locally", {
    platform: activeMeetingPlatform,
    left: nextOverlayPositionsByPlatform[activeMeetingPlatform]?.left,
    top: nextOverlayPositionsByPlatform[activeMeetingPlatform]?.top,
    width: nextOverlayPositionsByPlatform[activeMeetingPlatform]?.width,
    height: nextOverlayPositionsByPlatform[activeMeetingPlatform]?.height,
    view: nextOverlayPositionsByPlatform[activeMeetingPlatform]?.view,
  }, {
    provider: activeMeetingPlatform,
  });

  void chrome.runtime
    .sendMessage({
      action: "saveSettings",
      settings,
    })
    .catch((error) => {
      void overlayInteractionDiagnostics.warn("overlay_position_persist_failed", {
        platform: activeMeetingPlatform,
        error,
      }, {
        provider: activeMeetingPlatform,
      });
      // Ignore persistence failures during runtime invalidation or reloads.
    });
}

export function makeResizable(
  element: HTMLElement,
  handle: HTMLElement,
  corner: "br" | "bl" | "b"
): void {
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let startLeft = 0;
  let isResizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    void overlayInteractionDiagnostics.debug("overlay_resize_started", {
      corner,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });
    element.classList.add("mc-interacting");
    startX = e.clientX;
    startY = e.clientY;
    startWidth = element.offsetWidth;
    startHeight = element.offsetHeight;
    startLeft = element.getBoundingClientRect().left;

    const cursors = { br: "nwse-resize", bl: "nesw-resize", b: "ns-resize" };
    document.body.style.cursor = cursors[corner];
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  });

  function resize(e: MouseEvent): void {
    if (!isResizing) return;
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newHeight = Math.max(380, startHeight + deltaY);
    element.style.height = newHeight + "px";

    if (corner === "br") {
      const newWidth = Math.max(520, startWidth + deltaX);
      element.style.width = newWidth + "px";
    } else if (corner === "bl") {
      const newWidth = Math.max(520, startWidth - deltaX);
      element.style.width = newWidth + "px";
      element.style.left = startLeft + deltaX + "px";
      element.style.right = "auto";
    }
  }

  function stopResize(): void {
    if (isResizing) {
      void overlayInteractionDiagnostics.info("overlay_resize_completed", {
        corner,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
      persistOverlayPosition(element);
    }
    isResizing = false;
    element.classList.remove("mc-interacting");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }
}

export function makeDraggable(element: HTMLElement, handle: HTMLElement): void {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let isDragging = false;

  handle.addEventListener("mousedown", dragStart);

  function dragStart(e: MouseEvent): void {
    if (
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "SELECT"
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    void overlayInteractionDiagnostics.debug("overlay_drag_started", {
      left: element.getBoundingClientRect().left,
      top: element.getBoundingClientRect().top,
    });
    element.classList.add("mc-interacting");
    startX = e.clientX;
    startY = e.clientY;

    const rect = element.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);
  }

  function drag(e: MouseEvent): void {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;

    const minVisible = 100;
    const maxLeft = window.innerWidth - minVisible;
    const maxTop = window.innerHeight - 50;
    const minLeft = minVisible - element.offsetWidth;
    const minTop = 0;

    newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    newTop = Math.max(minTop, Math.min(maxTop, newTop));

    element.style.left = newLeft + "px";
    element.style.top = newTop + "px";
    element.style.right = "auto";
    element.style.bottom = "auto";
  }

  function dragEnd(): void {
    if (isDragging) {
      void overlayInteractionDiagnostics.info("overlay_drag_completed", {
        left: element.getBoundingClientRect().left,
        top: element.getBoundingClientRect().top,
      });
      persistOverlayPosition(element);
    }
    isDragging = false;
    element.classList.remove("mc-interacting");
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", dragEnd);
  }
}
