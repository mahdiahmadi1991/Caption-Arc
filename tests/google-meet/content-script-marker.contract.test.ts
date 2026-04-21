import { describe, expect, test, vi } from "vitest";

type ContentScriptDefinition = {
  main: (ctx: {
    signal?: AbortSignal;
    onInvalidated?: (callback: () => void) => void;
  }) => void;
};

async function loadContentScriptDefinition(): Promise<ContentScriptDefinition> {
  vi.resetModules();
  (globalThis as { defineContentScript?: unknown }).defineContentScript = (
    definition: ContentScriptDefinition
  ) => definition;
  (globalThis as { chrome?: unknown }).chrome = undefined;
  const contentScriptModule = await import("../../entrypoints/content/index");
  return contentScriptModule.default as ContentScriptDefinition;
}

describe("Google Meet runtime boot marker contract", () => {
  test("GM-BOOT-001: content script injects marker on active page", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1001);
    const definition = await loadContentScriptDefinition();

    definition.main({});

    const marker = document.querySelector('meta[name="captionarc-injected"]');
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute("content")).toBe("unknown:1001");
    nowSpy.mockRestore();
  });

  test("GM-BOOT-002: marker is replaced on restart and single-marker invariant is kept", async () => {
    const nowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValueOnce(2001)
      .mockReturnValueOnce(2002);
    const definition = await loadContentScriptDefinition();

    definition.main({});
    const firstMarker = document.querySelector('meta[name="captionarc-injected"]');
    expect(firstMarker).not.toBeNull();
    expect(firstMarker?.getAttribute("content")).toBe("unknown:2001");

    definition.main({});

    const markers = document.querySelectorAll('meta[name="captionarc-injected"]');
    expect(markers).toHaveLength(1);
    expect(markers[0]?.getAttribute("content")).toBe("unknown:2002");
    nowSpy.mockRestore();
  });
});
