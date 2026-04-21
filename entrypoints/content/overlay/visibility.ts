import { overlay, settings } from "../state";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";

const overlayVisibilityDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "overlay-visibility",
});

export function syncOverlayVisibilityPreference(): void {
  if (!overlay) {
    void overlayVisibilityDiagnostics.trace("overlay_visibility_sync_skipped_missing_overlay");
    return;
  }

  void overlayVisibilityDiagnostics.trace("overlay_visibility_synced", {
    visible: settings.overlayVisible,
  });
  overlay.classList.toggle("mc-hidden", !settings.overlayVisible);
  overlay.setAttribute("aria-hidden", settings.overlayVisible ? "false" : "true");
}

export function showOverlay(): void {
  if (!overlay) {
    void overlayVisibilityDiagnostics.trace("overlay_show_skipped_missing_overlay");
    return;
  }

  if (!settings.overlayVisible) {
    void overlayVisibilityDiagnostics.debug("overlay_show_blocked_by_settings");
    hideOverlay();
    return;
  }

  const isVisible =
    !overlay.classList.contains("mc-hidden") &&
    !overlay.classList.contains("mc-overlay-exiting") &&
    !overlay.classList.contains("mc-capture-consent-dismissed") &&
    overlay.getAttribute("aria-hidden") === "false";
  if (isVisible) {
    void overlayVisibilityDiagnostics.trace("overlay_show_skipped_already_visible");
    return;
  }

  void overlayVisibilityDiagnostics.info("overlay_shown");

  overlay.classList.remove(
    "mc-hidden",
    "mc-overlay-exiting",
    "mc-capture-consent-dismissed"
  );
  overlay.setAttribute("aria-hidden", "false");
}

export function hideOverlay(): void {
  if (!overlay) {
    void overlayVisibilityDiagnostics.trace("overlay_hide_skipped_missing_overlay");
    return;
  }

  const isHidden =
    overlay.classList.contains("mc-hidden") &&
    overlay.getAttribute("aria-hidden") === "true";
  if (isHidden) {
    void overlayVisibilityDiagnostics.trace("overlay_hide_skipped_already_hidden");
    return;
  }

  void overlayVisibilityDiagnostics.info("overlay_hidden");

  overlay.classList.add("mc-hidden");
  overlay.setAttribute("aria-hidden", "true");
}
