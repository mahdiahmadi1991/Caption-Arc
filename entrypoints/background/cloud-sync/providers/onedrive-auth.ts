import {
  getCloudSyncOAuthClientId,
  getCloudSyncProviderSupport,
} from "../../../shared/browser-capabilities";
import {
  getExtensionRedirectUrl,
  launchExtensionWebAuthFlow,
} from "./identity-api";
import { createBackgroundDiagnosticsLogger } from "../../diagnostics";
import {
  decryptCloudSyncLocalSecret,
  encryptCloudSyncLocalSecret,
} from "../crypto";

const MICROSOFT_TOKEN_STORAGE_KEY = "cloudSyncMicrosoftTokens";
const MICROSOFT_AUTH_BASE = "https://login.microsoftonline.com";
const MICROSOFT_GRAPH_SCOPE = [
  "Files.ReadWrite.AppFolder",
  "offline_access",
  "User.Read",
  "openid",
  "profile",
].join(" ");

const MICROSOFT_ENV = import.meta.env as ImportMetaEnv & {
  readonly WXT_MICROSOFT_OAUTH_TENANT?: string;
};
const cloudSyncOneDriveAuthDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "cloud-sync",
  feature: "onedrive-auth",
});

type MicrosoftStoredTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

type MicrosoftTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

function assertOneDriveBrowserSupport(): void {
  const support = getCloudSyncProviderSupport("onedrive");
  if (!support.supported) {
    throw new Error(
      support.reason || "OneDrive cloud sync is not available on this browser."
    );
  }
}

function getMicrosoftClientId(): string | null {
  return getCloudSyncOAuthClientId("onedrive");
}

function getMicrosoftTenant(): string {
  return MICROSOFT_ENV.WXT_MICROSOFT_OAUTH_TENANT?.trim() || "common";
}

function createVerifier(length = 64): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => (value % 36).toString(36)).join("");
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return encodeBase64Url(new Uint8Array(digest));
}

async function loadStoredTokens(): Promise<MicrosoftStoredTokens | null> {
  const result = await chrome.storage.local.get(MICROSOFT_TOKEN_STORAGE_KEY);
  const stored = result[MICROSOFT_TOKEN_STORAGE_KEY];

  if (typeof stored === "string" && stored.trim()) {
    return decryptCloudSyncLocalSecret<MicrosoftStoredTokens>(stored);
  }

  return null;
}

async function saveStoredTokens(tokens: MicrosoftStoredTokens | null): Promise<void> {
  await chrome.storage.local.set({
    [MICROSOFT_TOKEN_STORAGE_KEY]: tokens
      ? await encryptCloudSyncLocalSecret(tokens)
      : null,
  });
  await cloudSyncOneDriveAuthDiagnostics.trace("cloud_sync_onedrive_tokens_persisted", {
    stored: Boolean(tokens),
    hasRefreshToken: Boolean(tokens?.refreshToken),
  });
}

async function exchangeToken(
  body: URLSearchParams,
  previousRefreshToken?: string
): Promise<MicrosoftStoredTokens> {
  await cloudSyncOneDriveAuthDiagnostics.debug("cloud_sync_onedrive_token_exchange_started", {
    grantType: body.get("grant_type"),
  });
  const response = await fetch(
    `${MICROSOFT_AUTH_BASE}/${getMicrosoftTenant()}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  const payload = (await response.json()) as MicrosoftTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Microsoft token exchange failed."
    );
  }

  const tokens: MicrosoftStoredTokens = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || previousRefreshToken,
    expiresAt: Date.now() + Math.max(60, payload.expires_in || 3600) * 1000,
  };

  await saveStoredTokens(tokens);
  await cloudSyncOneDriveAuthDiagnostics.info("cloud_sync_onedrive_token_exchange_completed", {
    grantType: body.get("grant_type"),
    hasRefreshToken: Boolean(tokens.refreshToken),
  });
  return tokens;
}

async function refreshTokens(refreshToken: string): Promise<MicrosoftStoredTokens> {
  const clientId = getMicrosoftClientId();
  if (!clientId) {
    throw new Error(
      "Microsoft OAuth is not configured. Set WXT_MICROSOFT_OAUTH_CLIENT_ID before building the extension."
    );
  }

  await cloudSyncOneDriveAuthDiagnostics.info("cloud_sync_onedrive_token_refresh_started");
  return exchangeToken(
    new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: MICROSOFT_GRAPH_SCOPE,
    }),
    refreshToken
  );
}

export async function getMicrosoftAccessToken(): Promise<string> {
  assertOneDriveBrowserSupport();

  const existing = await loadStoredTokens();
  if (existing && existing.expiresAt > Date.now() + 60_000) {
    await cloudSyncOneDriveAuthDiagnostics.trace("cloud_sync_onedrive_token_reused", {
      expiresInMs: existing.expiresAt - Date.now(),
    });
    return existing.accessToken;
  }

  if (existing?.refreshToken) {
    try {
      const refreshed = await refreshTokens(existing.refreshToken);
      return refreshed.accessToken;
    } catch (error) {
      await cloudSyncOneDriveAuthDiagnostics.warn("cloud_sync_onedrive_token_refresh_failed", {
        error,
      });
      await saveStoredTokens(null);
      throw new Error(
        "OneDrive authentication refresh failed. Reconnect OneDrive to continue syncing."
      );
    }
  }

  throw new Error("OneDrive is not connected yet.");
}

export async function requestMicrosoftAccessTokenInteractive(): Promise<string> {
  assertOneDriveBrowserSupport();

  const clientId = getMicrosoftClientId();
  if (!clientId) {
    throw new Error(
      "Microsoft OAuth is not configured. Set WXT_MICROSOFT_OAUTH_CLIENT_ID before building the extension."
    );
  }

  const redirectUri = getExtensionRedirectUrl("microsoft");
  const verifier = createVerifier();
  const challenge = await createChallenge(verifier);
  const authUrl = new URL(`${MICROSOFT_AUTH_BASE}/${getMicrosoftTenant()}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("scope", MICROSOFT_GRAPH_SCOPE);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("prompt", "select_account");

  await cloudSyncOneDriveAuthDiagnostics.info("cloud_sync_onedrive_interactive_auth_started", {
    redirectUri,
    tenant: getMicrosoftTenant(),
  });
  const redirectedTo = await launchExtensionWebAuthFlow(authUrl.toString());
  const redirectedUrl = new URL(redirectedTo);
  const authCode = redirectedUrl.searchParams.get("code");

  if (!authCode) {
    throw new Error("Microsoft authorization code was not returned.");
  }

  const tokens = await exchangeToken(
    new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      scope: MICROSOFT_GRAPH_SCOPE,
    })
  );

  await cloudSyncOneDriveAuthDiagnostics.info("cloud_sync_onedrive_interactive_auth_completed", {
    hasRefreshToken: Boolean(tokens.refreshToken),
  });
  return tokens.accessToken;
}

export async function clearMicrosoftStoredTokens(): Promise<void> {
  await saveStoredTokens(null);
}
