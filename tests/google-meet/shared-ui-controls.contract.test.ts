import React, { act } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { DropdownSelect } from "../../entrypoints/shared/dropdown-select";
import {
  GitHubHeaderLink,
  LegalFooter,
} from "../../entrypoints/shared/extension-page-chrome";
import { ConfirmDialog } from "../../entrypoints/meeting-history/components/confirm-dialog";
import { I18nProvider } from "../../entrypoints/shared/i18n";
import { AppLoadingScreen } from "../../entrypoints/shared/loading-screen";

function createDomRect(
  overrides: Partial<DOMRect> = {}
): DOMRect {
  return {
    x: 40,
    y: 80,
    top: 80,
    right: 320,
    bottom: 128,
    left: 40,
    width: 280,
    height: 48,
    toJSON() {
      return this;
    },
    ...overrides,
  } as DOMRect;
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

async function mount(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let root: Root | null = createRoot(container);

  await act(async () => {
    root.render(element);
    await flushMicrotasks();
  });

  return {
    container,
    async cleanup() {
      await act(async () => {
        root?.unmount();
        await flushMicrotasks();
      });
      root = null;
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Shared UI controls", () => {
  test("UI-CTRL-001: dropdown menus render in a fixed portal layer above local stacking contexts", async () => {
    const onChange = vi.fn();
    const harness = await mount(
      React.createElement(DropdownSelect, {
        value: "system",
        onChange,
        options: [
          {
            id: "system",
            name: "Use browser language",
            description: "Follow the browser locale.",
          },
          {
            id: "ja",
            name: "Japanese",
            description: "Use Japanese across the UI.",
          },
        ],
      })
    );

    const trigger = harness.container.querySelector(
      'button[aria-haspopup="listbox"]'
    ) as HTMLButtonElement | null;
    expect(trigger).toBeTruthy();

    vi.spyOn(trigger!, "getBoundingClientRect").mockReturnValue(createDomRect());

    await act(async () => {
      trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushMicrotasks();
    });

    const listbox = document.body.querySelector('[role="listbox"]') as
      | HTMLDivElement
      | null;

    expect(listbox).toBeTruthy();
    expect(harness.container.contains(listbox)).toBe(false);
    expect(listbox?.className).toContain("fixed");
    expect(listbox?.style.left).toBe("40px");
    expect(listbox?.style.top).toBe("136px");
    expect(listbox?.style.width).toBe("280px");

    await harness.cleanup();
  });

  test("UI-CTRL-002: theme toggle sizing stays content-fit in shared CSS", () => {
    const source = readFileSync(
      resolve(process.cwd(), "entrypoints/shared/app-theme.css"),
      "utf8"
    );

    expect(source).toMatch(
      /\.mc-theme-toggle\s*\{[\s\S]*align-self:\s*flex-start;/
    );
    expect(source).toMatch(
      /\.mc-theme-toggle\s*\{[\s\S]*width:\s*fit-content;/
    );
    expect(source).toMatch(
      /\.mc-theme-toggle\s*\{[\s\S]*max-width:\s*100%;/
    );
  });

  test("UI-CTRL-003: shared loading surface supports overlay mode with the project-native visual shell", async () => {
    const harness = await mount(
      React.createElement(AppLoadingScreen, {
        variant: "overlay",
        title: "Loading settings",
        description: "Applying the selected UI language.",
      })
    );

    const status = harness.container.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status?.className).toContain("fixed");
    expect(status?.className).toContain("z-[220]");
    expect(status?.textContent).toContain("Loading settings");
    expect(status?.textContent).toContain("Applying the selected UI language.");

    await harness.cleanup();
  });

  test("UI-CTRL-004: shared legal chrome exposes GitHub, Privacy Policy, and version metadata", async () => {
    const harness = await mount(
      React.createElement(
        I18nProvider,
        { locale: "en" },
        React.createElement(
          "div",
          null,
          React.createElement(GitHubHeaderLink, null),
          React.createElement(LegalFooter, { version: "1.3.0" })
        )
      )
    );

    const githubLink = harness.container.querySelector(
      'a[aria-label="GitHub"]'
    ) as HTMLAnchorElement | null;
    const privacyLink = harness.container.querySelector(
      'a[href*="privacy-policy.html"]'
    ) as HTMLAnchorElement | null;

    expect(githubLink).toBeTruthy();
    expect(githubLink?.href).toContain("github.com/mahdiahmadi1991/caption-arc");
    expect(privacyLink).toBeTruthy();
    expect(harness.container.textContent).toContain("Version 1.3.0");

    await harness.cleanup();
  });

  test("UI-CTRL-005: confirm dialogs lock scrolling without mutating root overflow styles", async () => {
    const harness = await mount(
      React.createElement(
        I18nProvider,
        { locale: "en" },
        React.createElement(ConfirmDialog, {
          open: true,
          title: "Legal warning",
          description: "Review this change before continuing.",
          confirmLabel: "Continue",
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        })
      )
    );

    const lockedScrollKey = new KeyboardEvent("keydown", {
      key: "PageDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(lockedScrollKey);

    expect(lockedScrollKey.defaultPrevented).toBe(true);
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");

    await harness.cleanup();

    const unlockedScrollKey = new KeyboardEvent("keydown", {
      key: "PageDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(unlockedScrollKey);

    expect(unlockedScrollKey.defaultPrevented).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
  });
});
