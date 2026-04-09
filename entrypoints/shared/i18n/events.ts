export const UI_LOCALE_SWITCH_START_EVENT =
  "captionarc:ui-locale-switch-start";
export const UI_LOCALE_SWITCH_ABORT_EVENT =
  "captionarc:ui-locale-switch-abort";

export function emitUiLocaleSwitchStart(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(UI_LOCALE_SWITCH_START_EVENT));
}

export function emitUiLocaleSwitchAbort(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(UI_LOCALE_SWITCH_ABORT_EVENT));
}
