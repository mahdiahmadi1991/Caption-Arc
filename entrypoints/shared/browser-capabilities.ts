type RuntimeLike = {
  id?: string;
};

export type StorageAreaLike = {
  get?: (keys?: string | string[] | Record<string, unknown>) => Promise<Record<string, unknown>>;
  set?: (items: Record<string, unknown>) => Promise<void>;
  remove?: (keys: string | string[]) => Promise<void>;
};

type StorageApiLike = {
  local?: StorageAreaLike;
  session?: StorageAreaLike;
  onChanged?: {
    addListener?: (
      listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void
    ) => void;
  };
};

type BrowserLikeGlobal = typeof globalThis & {
  browser?: {
    runtime?: RuntimeLike;
    storage?: StorageApiLike;
  };
  chrome?: {
    runtime?: RuntimeLike;
    storage?: StorageApiLike;
  };
};

export type BrowserRuntimeFamily = "chrome" | "firefox" | "unknown";
export type BrowserSensitiveCloudSyncProvider = "google-drive" | "onedrive";

export type CloudSyncProviderSupport = {
  provider: BrowserSensitiveCloudSyncProvider;
  supported: boolean;
  browser: BrowserRuntimeFamily;
  reason?: string;
};

const CHROME_EXTENSION_PROTOCOL = "chrome-extension:";
const FIREFOX_EXTENSION_PROTOCOL = "moz-extension:";
const EXTENSION_PAGE_PROTOCOLS = new Set([
  CHROME_EXTENSION_PROTOCOL,
  FIREFOX_EXTENSION_PROTOCOL,
]);
const FIREFOX_USER_AGENT_PATTERN = /firefox/i;
const CHROME_FAMILY_USER_AGENT_PATTERN = /(chrome|chromium|edg|opr)\//i;
const CLOUD_SYNC_ENV = import.meta.env as ImportMetaEnv & {
  readonly WXT_GOOGLE_OAUTH_CLIENT_ID?: string;
  readonly WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME?: string;
  readonly WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX?: string;
  readonly WXT_GOOGLE_OAUTH_CLIENT_SECRET?: string;
  readonly WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME?: string;
  readonly WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX?: string;
  readonly WXT_MICROSOFT_OAUTH_CLIENT_ID?: string;
  readonly WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME?: string;
  readonly WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX?: string;
};

export const BROWSER_GOVERNED_CLOUD_SYNC_PROVIDERS = [
  "google-drive",
  "onedrive",
] as const satisfies readonly BrowserSensitiveCloudSyncProvider[];

function normalizeEnvValue(value?: string): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function resolveBrowserScopedConfig(
  family: BrowserRuntimeFamily,
  chromeValue?: string,
  firefoxValue?: string,
  fallbackValue?: string
): string | null {
  if (family === "chrome") {
    return normalizeEnvValue(chromeValue) || normalizeEnvValue(fallbackValue);
  }

  if (family === "firefox") {
    return normalizeEnvValue(firefoxValue) || normalizeEnvValue(fallbackValue);
  }

  return null;
}

function getBrowserLikeGlobal(): BrowserLikeGlobal {
  return globalThis as BrowserLikeGlobal;
}

function getCloudSyncProviderLabel(
  provider: BrowserSensitiveCloudSyncProvider
): string {
  return provider === "google-drive" ? "Google Drive" : "OneDrive";
}

export function detectBrowserRuntimeFamily(options?: {
  locationProtocol?: string | null;
  userAgent?: string | null;
  hasBrowserNamespace?: boolean;
  hasChromeRuntimeNamespace?: boolean;
}): BrowserRuntimeFamily {
  const protocol = options?.locationProtocol?.trim().toLowerCase();
  if (protocol === FIREFOX_EXTENSION_PROTOCOL) {
    return "firefox";
  }

  if (protocol === CHROME_EXTENSION_PROTOCOL) {
    return "chrome";
  }

  const userAgent = options?.userAgent?.trim() || "";
  if (FIREFOX_USER_AGENT_PATTERN.test(userAgent)) {
    return "firefox";
  }

  if (CHROME_FAMILY_USER_AGENT_PATTERN.test(userAgent)) {
    return "chrome";
  }

  if (options?.hasChromeRuntimeNamespace) {
    return "chrome";
  }

  if (options?.hasBrowserNamespace) {
    return "firefox";
  }

  return "unknown";
}

export function getBrowserRuntimeFamily(): BrowserRuntimeFamily {
  const browserGlobal = getBrowserLikeGlobal();
  return detectBrowserRuntimeFamily({
    locationProtocol:
      typeof location === "undefined" ? null : location.protocol,
    userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
    hasBrowserNamespace: Boolean(browserGlobal.browser),
    hasChromeRuntimeNamespace: Boolean(browserGlobal.chrome?.runtime),
  });
}

export function isExtensionPageProtocol(
  protocol: string | null | undefined
): boolean {
  return typeof protocol === "string"
    ? EXTENSION_PAGE_PROTOCOLS.has(protocol.trim().toLowerCase())
    : false;
}

export function getBrowserProductLabel(
  family: BrowserRuntimeFamily = getBrowserRuntimeFamily()
): string {
  switch (family) {
    case "firefox":
      return "Firefox";
    case "chrome":
      return "Chrome";
    default:
      return "Browser";
  }
}

export function getExtensionStorageApi(): StorageApiLike | undefined {
  const browserGlobal = getBrowserLikeGlobal();
  return browserGlobal.chrome?.storage ?? browserGlobal.browser?.storage;
}

export function getCloudSyncOAuthClientId(
  provider: BrowserSensitiveCloudSyncProvider,
  family: BrowserRuntimeFamily = getBrowserRuntimeFamily()
): string | null {
  if (provider === "google-drive") {
    return resolveBrowserScopedConfig(
      family,
      CLOUD_SYNC_ENV.WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME,
      CLOUD_SYNC_ENV.WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX,
      CLOUD_SYNC_ENV.WXT_GOOGLE_OAUTH_CLIENT_ID,
    );
  }

  return resolveBrowserScopedConfig(
    family,
    CLOUD_SYNC_ENV.WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME,
    CLOUD_SYNC_ENV.WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX,
    CLOUD_SYNC_ENV.WXT_MICROSOFT_OAUTH_CLIENT_ID
  );
}

export function getCloudSyncOAuthClientSecret(
  provider: BrowserSensitiveCloudSyncProvider,
  family: BrowserRuntimeFamily = getBrowserRuntimeFamily()
): string | null {
  if (provider !== "google-drive") {
    return null;
  }

  return resolveBrowserScopedConfig(
    family,
    CLOUD_SYNC_ENV.WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME,
    CLOUD_SYNC_ENV.WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX,
    CLOUD_SYNC_ENV.WXT_GOOGLE_OAUTH_CLIENT_SECRET
  );
}

export function getDiagnosticsStorageSelection(): {
  areaName: "session" | "local";
  area?: StorageAreaLike;
  usesFallback: boolean;
} {
  const storageApi = getExtensionStorageApi();
  const sessionArea = storageApi?.session;
  if (sessionArea?.get && sessionArea?.set) {
    return {
      areaName: "session",
      area: sessionArea,
      usesFallback: false,
    };
  }

  const localArea = storageApi?.local;
  return {
    areaName: "local",
    area: localArea?.get && localArea?.set ? localArea : undefined,
    usesFallback: true,
  };
}

export function getCloudSyncProviderSupport(
  provider: BrowserSensitiveCloudSyncProvider,
  family: BrowserRuntimeFamily = getBrowserRuntimeFamily()
): CloudSyncProviderSupport {
  if (family === "chrome" || family === "firefox") {
    const configuredClientId = getCloudSyncOAuthClientId(provider, family);
    if (provider === "google-drive") {
      const configuredClientSecret = getCloudSyncOAuthClientSecret(
        provider,
        family
      );

      if (configuredClientId && configuredClientSecret) {
        return {
          provider,
          supported: true,
          browser: family,
        };
      }

      const browserLabel = getBrowserProductLabel(family);
      return {
        provider,
        supported: false,
        browser: family,
        reason: configuredClientId
          ? `${getCloudSyncProviderLabel(provider)} cloud sync is not configured for ${browserLabel} yet because the required OAuth client secret is missing for this browser target.`
          : `${getCloudSyncProviderLabel(provider)} cloud sync is not configured for ${browserLabel} yet because the required OAuth client is missing for this browser target.`,
      };
    }

    if (configuredClientId) {
      return {
        provider,
        supported: true,
        browser: family,
      };
    }

    const browserLabel = getBrowserProductLabel(family);
    return {
      provider,
      supported: false,
      browser: family,
      reason: `${getCloudSyncProviderLabel(provider)} cloud sync is not configured for ${browserLabel} yet because the required OAuth client is missing for this browser target.`,
    };
  }

  const browserLabel =
    family === "unknown" ? "this browser" : getBrowserProductLabel(family);

  return {
    provider,
    supported: false,
    browser: family,
    reason: `${getCloudSyncProviderLabel(provider)} cloud sync is not available on ${browserLabel} yet because the required extension identity flow is not verified for this browser target.`,
  };
}

export function filterSupportedCloudSyncProviders<T extends string>(
  providers: readonly T[],
  family: BrowserRuntimeFamily = getBrowserRuntimeFamily()
): T[] {
  return providers.filter((provider) => {
    if (provider !== "google-drive" && provider !== "onedrive") {
      return true;
    }

    return getCloudSyncProviderSupport(
      provider as BrowserSensitiveCloudSyncProvider,
      family
    ).supported;
  });
}
