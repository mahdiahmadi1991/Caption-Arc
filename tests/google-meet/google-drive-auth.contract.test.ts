import { beforeEach, describe, expect, test, vi } from "vitest";

const launchExtensionWebAuthFlowMock = vi.hoisted(() =>
  vi.fn(async () => "https://example.com/callback?code=auth-code")
);
const getExtensionRedirectUrlMock = vi.hoisted(() =>
  vi.fn(() => "https://extension.chromiumapp.org/google")
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

async function loadGoogleDriveModule() {
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
    getCloudSyncOAuthClientId: vi.fn(() => "google-client-id"),
    getCloudSyncOAuthClientSecret: vi.fn(() => "google-client-secret"),
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
    "../../entrypoints/background/cloud-sync/providers/google-drive"
  );
}

describe("Google Drive auth contracts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  test("GDR-AUTH-001: background access does not launch interactive auth when no stored token exists", async () => {
    installChromeStorage();
    const module = await loadGoogleDriveModule();

    await expect(module.readGoogleDriveFile("settings/shared.json.enc")).rejects.toThrow(
      "Google Drive is not connected yet."
    );
    expect(launchExtensionWebAuthFlowMock).not.toHaveBeenCalled();
  });

  test("GDR-AUTH-002: refresh failures clear the stored token and require reconnect", async () => {
    const storageState = installChromeStorage({
      cloudSyncGoogleTokens: `enc:${JSON.stringify({
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

    const module = await loadGoogleDriveModule();

    await expect(module.listGoogleDriveFiles("settings/")).rejects.toThrow(
      "Google Drive authentication refresh failed. Reconnect Google Drive to continue syncing."
    );
    expect(storageState.cloudSyncGoogleTokens).toBeNull();
    expect(launchExtensionWebAuthFlowMock).not.toHaveBeenCalled();
  });

  test("GDR-AUTH-003: refreshed Google tokens stay in the encrypted local-secret format", async () => {
    const storageState = installChromeStorage({
      cloudSyncGoogleTokens: `enc:${JSON.stringify({
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

    const module = await loadGoogleDriveModule();

    await expect(module.listGoogleDriveFiles("settings/")).resolves.toEqual([]);
    expect(storageState.cloudSyncGoogleTokens).toEqual(expect.any(String));
  });
});
