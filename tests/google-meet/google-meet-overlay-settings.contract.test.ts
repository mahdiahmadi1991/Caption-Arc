import { describe, expect, test } from "vitest";
import { updateSettings, setOverlay } from "../../entrypoints/content/state";
import { updateUIFromSettings } from "../../entrypoints/content/overlay/settings";

function mountOverlayRoot(): HTMLDivElement {
  const overlayEl = document.createElement("div");
  overlayEl.id = "captionarc-overlay";
  document.body.appendChild(overlayEl);
  setOverlay(overlayEl);
  return overlayEl;
}

function appendElement(
  tagName: string,
  id: string,
  parent: HTMLElement = document.body
): HTMLElement {
  const element = document.createElement(tagName);
  element.id = id;
  parent.appendChild(element);
  return element;
}

function mountTranslationDockScaffold(): {
  dock: HTMLElement;
  toggle: HTMLButtonElement;
} {
  const dock = appendElement("div", "mc-translation-dock");
  appendElement("div", "mc-translation-dock-eyebrow", dock);
  appendElement("div", "mc-translation-dock-title", dock);
  appendElement("div", "mc-translation-dock-body", dock);
  appendElement("div", "mc-translation-dock-badge", dock);

  const langSelect = appendElement("div", "mc-lang-select", dock);
  appendElement("div", "", langSelect).className = "mc-dropdown-trigger";
  appendElement("div", "", langSelect).className = "mc-dropdown-label";
  const option = appendElement("div", "", langSelect);
  option.className = "mc-dropdown-option";
  option.setAttribute("data-value", "en");

  const toggle = document.createElement("button");
  toggle.id = "mc-translate-toggle";
  dock.appendChild(toggle);

  return { dock, toggle };
}

function mountFooterChatScaffold(): {
  chat: HTMLElement;
  chatCapture: HTMLElement;
} {
  const chat = appendElement("span", "mc-footer-chat");
  const chatCapture = appendElement("span", "mc-footer-chat-capture");
  return { chat, chatCapture };
}

describe("Google Meet overlay settings contract", () => {
  test("GM-SET-001: translationEnabled toggles translation-off class instantly", () => {
    const overlayEl = mountOverlayRoot();

    updateSettings({ translationEnabled: false });
    updateUIFromSettings();
    expect(overlayEl.classList.contains("translation-off")).toBe(true);

    updateSettings({ translationEnabled: true });
    updateUIFromSettings();
    expect(overlayEl.classList.contains("translation-off")).toBe(false);
  });

  test("GM-SET-002: appearance updates overlay theme dataset instantly", () => {
    const overlayEl = mountOverlayRoot();

    updateSettings({ appearance: "dark" });
    updateUIFromSettings();
    expect(overlayEl.dataset.theme).toBe("dark");
    expect(overlayEl.dataset.themePreference).toBe("dark");

    updateSettings({ appearance: "light" });
    updateUIFromSettings();
    expect(overlayEl.dataset.theme).toBe("light");
    expect(overlayEl.dataset.themePreference).toBe("light");
  });

  test("GM-SET-003: overlayOpacity updates CSS variable instantly", () => {
    const overlayEl = mountOverlayRoot();

    updateSettings({ overlayOpacity: 72 });
    updateUIFromSettings();
    expect(overlayEl.style.getPropertyValue("--mc-overlay-opacity")).toBe("72%");
  });

  test("GM-SET-004: overlayClickThrough toggles click-through class instantly", () => {
    const overlayEl = mountOverlayRoot();

    updateSettings({ overlayClickThrough: true });
    updateUIFromSettings();
    expect(overlayEl.classList.contains("mc-click-through")).toBe(true);

    updateSettings({ overlayClickThrough: false });
    updateUIFromSettings();
    expect(overlayEl.classList.contains("mc-click-through")).toBe(false);
  });

  test("GM-SET-005: overlayVisible toggles visibility class and aria instantly", () => {
    const overlayEl = mountOverlayRoot();

    updateSettings({ overlayVisible: false });
    updateUIFromSettings();
    expect(overlayEl.classList.contains("mc-hidden")).toBe(true);
    expect(overlayEl.getAttribute("aria-hidden")).toBe("true");

    updateSettings({ overlayVisible: true });
    updateUIFromSettings();
    expect(overlayEl.classList.contains("mc-hidden")).toBe(false);
    expect(overlayEl.getAttribute("aria-hidden")).toBe("false");
  });

  test("GM-SET-006: translation dock state reflects translationEnabled instantly", () => {
    mountOverlayRoot();
    const { dock, toggle } = mountTranslationDockScaffold();

    updateSettings({ translationEnabled: true });
    updateUIFromSettings();
    expect(dock.dataset.enabled).toBe("true");
    expect(toggle.classList.contains("mc-active")).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    updateSettings({ translationEnabled: false });
    updateUIFromSettings();
    expect(dock.dataset.enabled).toBe("false");
    expect(toggle.classList.contains("mc-active")).toBe(false);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  test("GM-SET-007: footer chat indicators reflect storeMeetingChat instantly", () => {
    mountOverlayRoot();
    const { chat, chatCapture } = mountFooterChatScaffold();

    updateSettings({ storeMeetingChat: false });
    updateUIFromSettings();
    expect(chat.hidden).toBe(true);
    expect(chatCapture.hidden).toBe(true);
    expect(chat.getAttribute("aria-hidden")).toBe("true");
    expect(chatCapture.getAttribute("aria-hidden")).toBe("true");

    updateSettings({ storeMeetingChat: true });
    updateUIFromSettings();
    expect(chat.hidden).toBe(false);
    expect(chatCapture.hidden).toBe(false);
    expect(chat.getAttribute("aria-hidden")).toBe("false");
    expect(chatCapture.getAttribute("aria-hidden")).toBe("false");
  });
});
