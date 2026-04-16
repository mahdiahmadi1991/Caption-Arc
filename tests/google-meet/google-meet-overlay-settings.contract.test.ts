import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import {
  createHeader,
  syncCompactStatus,
  syncTranslationDock,
} from "../../entrypoints/content/overlay/header";
import { setOverlay, updateSettings } from "../../entrypoints/content/state";
import { updateUIFromSettings } from "../../entrypoints/content/overlay/settings";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import {
  getOpenAiConnectionSignature,
  getOpenAiVerificationSuccessMessage,
} from "../../entrypoints/shared/openai-service";

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

beforeEach(() => {
  document.body.innerHTML = "";
  setOverlay(null);
  updateSettings(createDefaultSettings());
});

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

  test("GM-SET-008: compact OpenAI warning keeps a reserved slot when hidden", () => {
    const overlayEl = mountOverlayRoot();
    const { header } = createHeader();
    overlayEl.appendChild(header);

    const issue = header.querySelector("#mc-minimized-ai-warning") as HTMLElement | null;
    expect(issue).toBeTruthy();

    syncCompactStatus();
    expect(issue?.hidden).toBe(false);
    expect(issue?.getAttribute("aria-hidden")).toBe("false");
    expect(issue?.tabIndex).toBe(0);
    expect(issue?.style.display).toBe("");

    const openAiSettings = {
      openaiApiKey: "test-key",
      model: "gpt-5.2",
    };
    updateSettings({
      ...openAiSettings,
      verificationSnapshot: {
        status: "verified",
        message: getOpenAiVerificationSuccessMessage(),
        signature: getOpenAiConnectionSignature(openAiSettings),
        verifiedAt: Date.now(),
      },
    });

    syncCompactStatus();
    expect(issue?.hidden).toBe(true);
    expect(issue?.getAttribute("aria-hidden")).toBe("true");
    expect(issue?.tabIndex).toBe(-1);
    expect(issue?.style.display).toBe("");

    const source = readFileSync(
      resolve(process.cwd(), "entrypoints/content/styles/header.css"),
      "utf8"
    );
    expect(source).toMatch(
      /\.mc-minimized-ai-warning\[hidden\]\s*\{[\s\S]*display:\s*inline-flex;/
    );
    expect(source).toMatch(
      /\.mc-minimized-ai-warning\[hidden\]\s*\{[\s\S]*visibility:\s*hidden;/
    );
  });

  test("GM-SET-009: live translation sync does not collapse the language picker while it is open", () => {
    const overlayEl = mountOverlayRoot();
    const { translationDock } = createHeader();
    overlayEl.appendChild(translationDock);

    const trigger = translationDock.querySelector<HTMLButtonElement>(
      "#mc-lang-select .mc-dropdown-trigger"
    );
    const root = translationDock.querySelector<HTMLElement>("#mc-lang-select");

    expect(trigger).toBeTruthy();
    expect(root).toBeTruthy();

    trigger?.click();
    expect(root?.classList.contains("is-open")).toBe(true);

    updateSettings({ targetLanguage: "fa" });
    syncTranslationDock();

    expect(root?.dataset.value).toBe("fa");
    expect(root?.classList.contains("is-open")).toBe(true);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
  });

  test("GM-SET-010: language picker options render native names with a readable English hint", () => {
    const overlayEl = mountOverlayRoot();
    const { translationDock } = createHeader();
    overlayEl.appendChild(translationDock);

    const persianOption = Array.from(
      translationDock.querySelectorAll<HTMLElement>("#mc-lang-select .mc-dropdown-option")
    ).find((option) => option.getAttribute("data-value") === "fa");

    expect(
      persianOption?.querySelector(".mc-dropdown-option-label")?.textContent
    ).toBe("فارسی");
    expect(
      persianOption?.querySelector(".mc-dropdown-option-description")?.textContent
    ).toBe("Persian");
    expect(
      persianOption?.querySelector(".mc-dropdown-option-badge")?.textContent
    ).toBe("FA");
  });
});
