import { beforeEach, describe, expect, test, vi } from "vitest";

const launchExtensionWebAuthFlowMock = vi.hoisted(() =>
  vi.fn(async () => "https://example.com/callback?code=auth-code")
);
const getExtensionRedirectUrlMock = vi.hoisted(() =>
  vi.fn(() => "https://extension.chromiumapp.org/microsoft")
);

function installChromeStorage(
  initialState: Record<string, unknown> = {}
): Record<string, unknown> {
  const storageState = { ...initialState };

  (
    globalThis as typeof globalThis & {
      chrome?: {
        storage?: {
          local?: {
            get: (key: string) => Promise<Record<string, unknown>>;
            set: (value: Record<string, unknown>) => Promise<void>;
          };
        };
      };
    }
  ).chrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({
          [key]: storageState[key],
        })),
        set: vi.fn(async (value: Record<string, unknown>) => {
          Object.assign(storageState, value);
        }),
      },
    },
  };

  return storageState;
}

async function loadOneDriveAuthModule() {
  vi.resetModules();
  vi.doMock("../../entrypoints/background/diagnostics", () => ({
    createBackgroundDiagnosticsLogger: () => ({
      trace: vi.fn(async () => undefined),
      debug: vi.fn(async () => undefined),
      info: vi.fn(async () => undefined),
      warn: vi.fn(async () => undefined),
      error: vi.fn(async () => undefined),
    }),
  }));
  vi.doMock("../../entrypoints/shared/browser-capabilities", () => ({
    getCloudSyncOAuthClientId: vi.fn(() => "microsoft-client-id"),
    getCloudSyncProviderSupport: vi.fn(() => ({
      supported: true,
    })),
  }));
  vi.doMock(
    "../../entrypoints/background/cloud-sync/providers/identity-api",
    () => ({
      getExtensionRedirectUrl: getExtensionRedirectUrlMock,
      launchExtensionWebAuthFlow: launchExtensionWebAuthFlowMock,
    })
  );
  vi.doMock("../../entrypoints/background/cloud-sync/crypto", () => ({
    encryptCloudSyncLocalSecret: vi.fn(async (payload: unknown) => `enc:${JSON.stringify(payload)}`),
    decryptCloudSyncLocalSecret: vi.fn(async (value: string) =>
      JSON.parse(value.replace(/^enc:/, ""))
    ),
  }));

  return await import(
    "../../entrypoints/background/cloud-sync/providers/onedrive-auth"
  );
}

describe("OneDrive auth contracts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  test("ODR-AUTH-001: background access does not launch interactive auth when no stored token exists", async () => {
    installChromeStorage();
    const module = await loadOneDriveAuthModule();

    await expect(module.getMicrosoftAccessToken()).rejects.toThrow(
      "OneDrive is not connected yet."
    );
    expect(launchExtensionWebAuthFlowMock).not.toHaveBeenCalled();
  });

  test("ODR-AUTH-002: refresh failures clear the stored token and require reconnect", async () => {
    const storageState = installChromeStorage({
      cloudSyncMicrosoftTokens: `enc:${JSON.stringify({
        accessToken: "stale-access-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() - 5_000,
      })}`,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        new Response(
          JSON.stringify({
            error: "invalid_grant",
            error_description: "Refresh token expired.",
          }),
          { status: 400 }
        )
      )
    );

    const module = await loadOneDriveAuthModule();

    await expect(module.getMicrosoftAccessToken()).rejects.toThrow(
      "OneDrive authentication refresh failed. Reconnect OneDrive to continue syncing."
    );
    expect(storageState.cloudSyncMicrosoftTokens).toBeNull();
    expect(launchExtensionWebAuthFlowMock).not.toHaveBeenCalled();
  });

  test("ODR-AUTH-003: refresh keeps the previous refresh token when Microsoft does not rotate it", async () => {
    const storageState = installChromeStorage({
      cloudSyncMicrosoftTokens: `enc:${JSON.stringify({
        accessToken: "stale-access-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() - 5_000,
      })}`,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        new Response(
          JSON.stringify({
            access_token: "new-access-token",
            expires_in: 3600,
          }),
          { status: 200 }
        )
      )
    );

    const module = await loadOneDriveAuthModule();

    await expect(module.getMicrosoftAccessToken()).resolves.toBe(
      "new-access-token"
    );
    expect(storageState.cloudSyncMicrosoftTokens).toEqual(expect.any(String));
  });
});
