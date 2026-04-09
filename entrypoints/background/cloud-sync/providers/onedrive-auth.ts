import { getCloudSyncProviderSupport } from "../../../shared/browser-capabilities";

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
  readonly WXT_MICROSOFT_OAUTH_CLIENT_ID?: string;
  readonly WXT_MICROSOFT_OAUTH_TENANT?: string;
};

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
  return MICROSOFT_ENV.WXT_MICROSOFT_OAUTH_CLIENT_ID?.trim() || null;
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

  if (!stored || typeof stored !== "object") {
    return null;
  }

  return stored as MicrosoftStoredTokens;
}

async function saveStoredTokens(tokens: MicrosoftStoredTokens | null): Promise<void> {
  await chrome.storage.local.set({
    [MICROSOFT_TOKEN_STORAGE_KEY]: tokens,
  });
}

function launchWebAuthFlow(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url, interactive: true },
      (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          reject(
            new Error(
              chrome.runtime.lastError?.message ||
                "Microsoft authentication was cancelled or failed."
            )
          );
          return;
        }

        resolve(redirectedTo);
      }
    );
  });
}

async function exchangeToken(
  body: URLSearchParams
): Promise<MicrosoftStoredTokens> {
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
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in || 3600) * 1000,
  };

  await saveStoredTokens(tokens);
  return tokens;
}

async function refreshTokens(refreshToken: string): Promise<MicrosoftStoredTokens> {
  const clientId = getMicrosoftClientId();
  if (!clientId) {
    throw new Error(
      "Microsoft OAuth is not configured. Set WXT_MICROSOFT_OAUTH_CLIENT_ID before building the extension."
    );
  }

  return exchangeToken(
    new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: MICROSOFT_GRAPH_SCOPE,
    })
  );
}

export async function getMicrosoftAccessToken(): Promise<string> {
  assertOneDriveBrowserSupport();

  const existing = await loadStoredTokens();
  if (existing && existing.expiresAt > Date.now() + 60_000) {
    return existing.accessToken;
  }

  if (existing?.refreshToken) {
    const refreshed = await refreshTokens(existing.refreshToken);
    return refreshed.accessToken;
  }

  return requestMicrosoftAccessTokenInteractive();
}

export async function requestMicrosoftAccessTokenInteractive(): Promise<string> {
  assertOneDriveBrowserSupport();

  const clientId = getMicrosoftClientId();
  if (!clientId) {
    throw new Error(
      "Microsoft OAuth is not configured. Set WXT_MICROSOFT_OAUTH_CLIENT_ID before building the extension."
    );
  }

  const redirectUri = chrome.identity.getRedirectURL("microsoft");
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

  const redirectedTo = await launchWebAuthFlow(authUrl.toString());
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

  return tokens.accessToken;
}

export async function clearMicrosoftStoredTokens(): Promise<void> {
  await saveStoredTokens(null);
}