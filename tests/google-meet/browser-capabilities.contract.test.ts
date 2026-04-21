import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  detectBrowserRuntimeFamily,
  getCloudSyncProviderSupport,
  isExtensionPageProtocol,
} from "../../entrypoints/shared/browser-capabilities";
import { createDefaultDeviceLabel } from "../../entrypoints/shared/device-identity";

const originalUserAgent = navigator.userAgent;

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
}

describe("Browser capability contracts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    setUserAgent(originalUserAgent);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setUserAgent(originalUserAgent);
  });

  test("BROW-CAP-001: browser family and extension protocols are detected for both Chrome and Firefox", () => {
    expect(isExtensionPageProtocol("chrome-extension:")).toBe(true);
    expect(isExtensionPageProtocol("moz-extension:")).toBe(true);
    expect(isExtensionPageProtocol("https:")).toBe(false);

    expect(
      detectBrowserRuntimeFamily({
        locationProtocol: "chrome-extension:",
      })
    ).toBe("chrome");
    expect(
      detectBrowserRuntimeFamily({
        locationProtocol: "moz-extension:",
      })
    ).toBe("firefox");
    expect(
      detectBrowserRuntimeFamily({
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
      })
    ).toBe("firefox");
  });

  test("BROW-CAP-002: default device labels use the active browser family instead of a Chrome-only label", () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    );
    expect(createDefaultDeviceLabel()).toBe("Chrome on Windows");

    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0"
    );
    expect(createDefaultDeviceLabel()).toBe("Firefox on Linux");
  });

  test("BROW-CAP-003: cloud sync provider support is gated by browser-specific OAuth configuration", () => {
    vi.stubEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME", "chromium-google-client");
    vi.stubEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX", "firefox-google-client");
    vi.stubEnv(
      "WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME",
      "chromium-google-secret"
    );
    vi.stubEnv(
      "WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX",
      "firefox-google-secret"
    );
    vi.stubEnv(
      "WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME",
      "chromium-microsoft-client"
    );
    vi.stubEnv("WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX", "firefox-microsoft-client");

    expect(getCloudSyncProviderSupport("google-drive", "chrome")).toEqual({
      provider: "google-drive",
      supported: true,
      browser: "chrome",
    });

    const googleFirefoxSupport = getCloudSyncProviderSupport(
      "google-drive",
      "firefox"
    );
    expect(googleFirefoxSupport).toEqual({
      provider: "google-drive",
      supported: true,
      browser: "firefox",
    });

    const oneDriveFirefoxSupport = getCloudSyncProviderSupport(
      "onedrive",
      "firefox"
    );
    expect(oneDriveFirefoxSupport).toEqual({
      provider: "onedrive",
      supported: true,
      browser: "firefox",
    });
  });

  test("BROW-CAP-004: Google Drive stays unsupported when the browser-targeted client secret is missing", () => {
    vi.stubEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME", "chromium-google-client");

    expect(getCloudSyncProviderSupport("google-drive", "chrome")).toEqual({
      provider: "google-drive",
      supported: false,
      browser: "chrome",
      reason:
        "Google Drive cloud sync is not configured for Chrome yet because the required OAuth client secret is missing for this browser target.",
    });
  });
});
