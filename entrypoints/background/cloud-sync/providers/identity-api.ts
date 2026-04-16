import { createBackgroundDiagnosticsLogger } from "../../diagnostics";

type IdentityApiLike = {
  getRedirectURL?: (path?: string) => string;
  launchWebAuthFlow?: (
    details: { url: string; interactive: boolean },
    callback?: (redirectedTo?: string) => void
  ) => Promise<string | undefined> | void;
};

const cloudSyncIdentityDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "cloud-sync",
  feature: "identity-api",
});

type RuntimeApiLike = {
  getManifest?: () => unknown;
  lastError?: {
    message?: string;
  };
};

type BrowserLikeGlobal = typeof globalThis & {
  browser?: {
    identity?: IdentityApiLike;
    runtime?: RuntimeApiLike;
  };
  chrome?: {
    identity?: IdentityApiLike;
    runtime?: RuntimeApiLike;
  };
};

function getBrowserLikeGlobal(): BrowserLikeGlobal {
  return globalThis as BrowserLikeGlobal;
}

function getIdentityApi(): IdentityApiLike | undefined {
  const browserGlobal = getBrowserLikeGlobal();
  return browserGlobal.chrome?.identity ?? browserGlobal.browser?.identity;
}

function getRuntimeApi(): RuntimeApiLike | undefined {
  const browserGlobal = getBrowserLikeGlobal();
  return browserGlobal.chrome?.runtime ?? browserGlobal.browser?.runtime;
}

export function getExtensionManifest(): Record<string, unknown> {
  const manifest = getRuntimeApi()?.getManifest?.();
  return manifest && typeof manifest === "object"
    ? (manifest as Record<string, unknown>)
    : {};
}

export function getExtensionRedirectUrl(path?: string): string {
  const redirectUrl = getIdentityApi()?.getRedirectURL?.(path);
  if (!redirectUrl) {
    throw new Error("Extension identity redirect URL is unavailable.");
  }

  return redirectUrl;
}

export async function launchExtensionWebAuthFlow(url: string): Promise<string> {
  const identityApi = getIdentityApi();
  if (!identityApi?.launchWebAuthFlow) {
    throw new Error("Extension web auth flow is unavailable.");
  }

  const launch = identityApi.launchWebAuthFlow.bind(identityApi);
  void cloudSyncIdentityDiagnostics.info("cloud_sync_web_auth_flow_started", {
    usesCallbackFlow: launch.length > 1,
    urlOrigin: (() => {
      try {
        return new URL(url).origin;
      } catch {
        return null;
      }
    })(),
  });
  if (launch.length <= 1) {
    try {
      const redirectedTo = await launch({
        url,
        interactive: true,
      });

      if (!redirectedTo) {
        throw new Error("Authentication was cancelled or failed.");
      }

      void cloudSyncIdentityDiagnostics.info("cloud_sync_web_auth_flow_completed", {
        redirectedOrigin: (() => {
          try {
            return new URL(redirectedTo).origin;
          } catch {
            return null;
          }
        })(),
      });

      return redirectedTo;
    } catch (error) {
      void cloudSyncIdentityDiagnostics.warn("cloud_sync_web_auth_flow_failed", {
        error,
      });
      throw error;
    }
  }

  return new Promise((resolve, reject) => {
    launch(
      {
        url,
        interactive: true,
      },
      (redirectedTo) => {
        const lastError = getRuntimeApi()?.lastError?.message?.trim();
        if (lastError || !redirectedTo) {
          void cloudSyncIdentityDiagnostics.warn("cloud_sync_web_auth_flow_failed", {
            lastError: lastError || null,
            redirected: Boolean(redirectedTo),
          });
          reject(
            new Error(lastError || "Authentication was cancelled or failed.")
          );
          return;
        }

        void cloudSyncIdentityDiagnostics.info("cloud_sync_web_auth_flow_completed", {
          redirectedOrigin: (() => {
            try {
              return new URL(redirectedTo).origin;
            } catch {
              return null;
            }
          })(),
        });
        resolve(redirectedTo);
      }
    );
  });
}
