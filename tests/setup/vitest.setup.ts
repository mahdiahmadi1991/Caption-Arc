import { afterEach, beforeEach, vi } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import { resetContentState, updateSettings } from "../../entrypoints/content/state";

if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => {
  resetContentState();
  updateSettings(createDefaultSettings());
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  document.title = "";
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.useRealTimers();
});
