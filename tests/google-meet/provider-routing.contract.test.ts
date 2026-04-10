import { beforeEach, describe, expect, test } from "vitest";
import {
  PLANNED_PROVIDERS,
  getProviderByPlatform,
  getProviderForPageContext,
  getProviderForUrl,
} from "../../entrypoints/content/providers/registry";

function addButton(text: string, ariaLabel?: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  if (ariaLabel) {
    button.setAttribute("aria-label", ariaLabel);
  }
  document.body.appendChild(button);
  return button;
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.title = "";
});

describe("Provider routing contract", () => {
  test("PROUTE-001: planned providers remain non-active and active registry resolves known platforms", () => {
    expect(PLANNED_PROVIDERS).toEqual([]);
    expect(getProviderByPlatform("google-meet")?.platform).toBe("google-meet");
    expect(getProviderByPlatform("microsoft-teams")?.platform).toBe("microsoft-teams");
    expect(getProviderByPlatform("zoom-web")?.platform).toBe("zoom-web");
  });

  test("PROUTE-002: URL routing resolves provider by host/path and returns null for unsupported pages", () => {
    expect(
      getProviderForUrl(new URL("https://meet.google.com/abc-defg-hij"))?.platform
    ).toBe("google-meet");
    expect(
      getProviderForUrl(new URL("https://teams.microsoft.com/l/meetup-join/123"))?.platform
    ).toBe("microsoft-teams");
    expect(getProviderForUrl(new URL("https://us05web.zoom.us/j/123456789"))?.platform).toBe(
      "zoom-web"
    );
    expect(getProviderForUrl(new URL("https://example.com/not-meeting"))).toBeNull();
  });

  test("PROUTE-003: platform lookup returns null for unregistered values", () => {
    expect(getProviderByPlatform("google-meet")?.platform).toBe("google-meet");
    expect(getProviderByPlatform("not-a-provider" as never)).toBeNull();
  });

  test("PROUTE-004: page-context routing resolves first matching provider context", () => {
    addButton("Join now");

    const provider = getProviderForPageContext(new URL("https://teams.live.com/v2/meeting"));
    expect(provider?.platform).toBe("microsoft-teams");
    expect(getProviderForPageContext(new URL("https://example.com/landing"))).toBeNull();
  });
});
