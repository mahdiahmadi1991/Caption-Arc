import type { CloudSyncProviderCheckpoint } from "../types";
import type { CloudSyncFileRecord } from "../types";
import {
  getCloudSyncOAuthClientId,
  getCloudSyncOAuthClientSecret,
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

const GOOGLE_DRIVE_PROVIDER = "google-drive";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_USERINFO_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
const GOOGLE_OAUTH_SCOPE = [GOOGLE_DRIVE_SCOPE, GOOGLE_USERINFO_SCOPE].join(" ");
const GOOGLE_DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_STORAGE_KEY = "cloudSyncGoogleTokens";
const CLOUD_SYNC_VAULT_ROOT = "vault/";
const cloudSyncGoogleDriveDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "cloud-sync",
  feature: "google-drive-auth",
});

type GoogleDriveUserInfo = {
  email?: string;
};

type GoogleStoredTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleDriveFile = {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  version?: string;
  trashed?: boolean;
};

type GoogleDriveChange = {
  file?: GoogleDriveFile;
  removed?: boolean;
};

type GoogleDriveChangeListResponse = {
  changes?: GoogleDriveChange[];
  nextPageToken?: string;
  newStartPageToken?: string;
};

type GoogleDriveChangeListing = {
  files: CloudSyncFileRecord[];
  cursor?: string;
};

function getGoogleClientId(): string | null {
  return getCloudSyncOAuthClientId("google-drive");
}

function getGoogleClientSecret(): string | null {
  return getCloudSyncOAuthClientSecret("google-drive");
}

function assertGoogleDriveBrowserSupport(): void {
  const support = getCloudSyncProviderSupport("google-drive");
  if (!support.supported) {
    throw new Error(
      support.reason || "Google Drive cloud sync is not available on this browser."
    );
  }
}

function normalizeDriveFileName(path: string): string {
  return `${CLOUD_SYNC_VAULT_ROOT}${path}`.replace(/\//g, "__");
}

function denormalizeDriveFileName(name: string): string {
  return name.replace(/^vault__/, "").replace(/__/g, "/");
}

function formatDriveTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDriveSize(value?: string): number {
  const size = Number.parseInt(value || "", 10);
  return Number.isFinite(size) ? size : 0;
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

async function loadStoredTokens(): Promise<GoogleStoredTokens | null> {
  const result = await chrome.storage.local.get(GOOGLE_TOKEN_STORAGE_KEY);
  const stored = result[GOOGLE_TOKEN_STORAGE_KEY];

  if (typeof stored === "string" && stored.trim()) {
    return decryptCloudSyncLocalSecret<GoogleStoredTokens>(stored);
  }

  return null;
}

async function saveStoredTokens(tokens: GoogleStoredTokens | null): Promise<void> {
  await chrome.storage.local.set({
    [GOOGLE_TOKEN_STORAGE_KEY]: tokens
      ? await encryptCloudSyncLocalSecret(tokens)
      : null,
  });
  await cloudSyncGoogleDriveDiagnostics.trace("cloud_sync_google_tokens_persisted", {
    stored: Boolean(tokens),
    hasRefreshToken: Boolean(tokens?.refreshToken),
  });
}

async function exchangeGoogleToken(
  body: URLSearchParams,
  previousRefreshToken?: string
): Promise<GoogleStoredTokens> {
  await cloudSyncGoogleDriveDiagnostics.debug("cloud_sync_google_token_exchange_started", {
    grantType: body.get("grant_type"),
    hasPreviousRefreshToken: Boolean(previousRefreshToken),
  });
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Google token exchange failed."
    );
  }

  const tokens: GoogleStoredTokens = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || previousRefreshToken,
    expiresAt: Date.now() + Math.max(60, payload.expires_in || 3600) * 1000,
  };
  await saveStoredTokens(tokens);
  await cloudSyncGoogleDriveDiagnostics.info("cloud_sync_google_token_exchange_completed", {
    grantType: body.get("grant_type"),
    hasRefreshToken: Boolean(tokens.refreshToken),
  });
  return tokens;
}

async function refreshGoogleTokens(
  refreshToken: string
): Promise<GoogleStoredTokens> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId) {
    throw new Error(
      "Google Drive OAuth is not configured. Set a Google OAuth client ID for this browser before building the extension."
    );
  }
  if (!clientSecret) {
    throw new Error(
      "Google Drive OAuth client secret is not configured. Set a Google OAuth client secret for this browser before building the extension."
    );
  }

  await cloudSyncGoogleDriveDiagnostics.info("cloud_sync_google_token_refresh_started");
  return exchangeGoogleToken(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    refreshToken
  );
}

async function getGoogleAccessToken(): Promise<string> {
  assertGoogleDriveBrowserSupport();

  const existing = await loadStoredTokens();
  if (existing && existing.expiresAt > Date.now() + 60_000) {
    await cloudSyncGoogleDriveDiagnostics.trace("cloud_sync_google_token_reused", {
      expiresInMs: existing.expiresAt - Date.now(),
    });
    return existing.accessToken;
  }

  if (existing?.refreshToken) {
    try {
      const refreshed = await refreshGoogleTokens(existing.refreshToken);
      return refreshed.accessToken;
    } catch (error) {
      await cloudSyncGoogleDriveDiagnostics.warn("cloud_sync_google_token_refresh_failed", {
        error,
      });
      await saveStoredTokens(null);
      throw new Error(
        "Google Drive authentication refresh failed. Reconnect Google Drive to continue syncing."
      );
    }
  }

  throw new Error("Google Drive is not connected yet.");
}

async function requestGoogleAccessTokenInteractive(): Promise<string> {
  assertGoogleDriveBrowserSupport();

  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId) {
    throw new Error(
      "Google Drive OAuth is not configured. Set a Google OAuth client ID for this browser before building the extension."
    );
  }
  if (!clientSecret) {
    throw new Error(
      "Google Drive OAuth client secret is not configured. Set a Google OAuth client secret for this browser before building the extension."
    );
  }

  const redirectUri = getExtensionRedirectUrl("google");
  const verifier = createVerifier();
  const challenge = await createChallenge(verifier);
  const authUrl = new URL(GOOGLE_AUTH_BASE);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  await cloudSyncGoogleDriveDiagnostics.info("cloud_sync_google_interactive_auth_started", {
    redirectUri,
  });
  const redirectedTo = await launchExtensionWebAuthFlow(authUrl.toString());
  const redirectedUrl = new URL(redirectedTo);
  const authCode = redirectedUrl.searchParams.get("code");
  const authError = redirectedUrl.searchParams.get("error");

  if (authError) {
    throw new Error(`Google authorization failed: ${authError}`);
  }

  if (!authCode) {
    throw new Error("Google authorization code was not returned.");
  }

  const tokens = await exchangeGoogleToken(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    })
  );

  await cloudSyncGoogleDriveDiagnostics.info("cloud_sync_google_interactive_auth_completed", {
    hasRefreshToken: Boolean(tokens.refreshToken),
  });
  return tokens.accessToken;
}

async function googleDriveRequest(
  token: string,
  input: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}

async function fetchGoogleUserInfo(token: string): Promise<GoogleDriveUserInfo> {
  const response = await googleDriveRequest(token, GOOGLE_USERINFO_ENDPOINT);
  if (!response.ok) {
    return {};
  }

  return (await response.json()) as GoogleDriveUserInfo;
}

async function findDriveFile(
  token: string,
  path: string
): Promise<GoogleDriveFile | null> {
  const normalizedName = normalizeDriveFileName(path);
  const query = new URLSearchParams({
    spaces: "appDataFolder",
    q: `'appDataFolder' in parents and trashed = false and name = '${normalizedName.replace(/'/g, "\\'")}'`,
    fields: "files(id,name,modifiedTime,size,version)",
    pageSize: "1",
  });
  const response = await googleDriveRequest(
    token,
    `${GOOGLE_DRIVE_FILES_ENDPOINT}?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Drive lookup failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { files?: GoogleDriveFile[] };
  return payload.files?.[0] || null;
}

function toCloudFileRecord(path: string, file: GoogleDriveFile): CloudSyncFileRecord {
  return {
    path,
    versionToken: file.version || file.modifiedTime || file.id,
    updatedAt: formatDriveTimestamp(file.modifiedTime),
    size: formatDriveSize(file.size),
  };
}

function buildMultipartBody(metadata: Record<string, unknown>, bytes: Uint8Array): Blob {
  const boundary = `captionarc-${Date.now().toString(36)}`;
  return new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`,
    bytes,
    `\r\n--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` });
}

export async function connectGoogleDrive(): Promise<CloudSyncProviderCheckpoint> {
  const token = await requestGoogleAccessTokenInteractive();
  const userInfo = await fetchGoogleUserInfo(token);
  return {
    provider: GOOGLE_DRIVE_PROVIDER,
    connected: true,
    accountId: userInfo.email || "google-drive",
    accountLabel: userInfo.email || "Google Drive",
    connectedAt: Date.now(),
    healthState: "syncing",
  };
}

export async function disconnectGoogleDrive(): Promise<CloudSyncProviderCheckpoint> {
  try {
    const token = await getGoogleAccessToken();
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).catch(() => undefined);
  } catch {
    // Ignore disconnect token cleanup failures.
  }

  await saveStoredTokens(null);

  return {
    provider: GOOGLE_DRIVE_PROVIDER,
    connected: false,
    healthState: "disconnected",
  };
}

export async function ensureGoogleDriveAppFolder(): Promise<void> {
  const token = await getGoogleAccessToken();
  const query = new URLSearchParams({
    spaces: "appDataFolder",
    pageSize: "1",
    fields: "files(id)",
  });
  const response = await googleDriveRequest(
    token,
    `${GOOGLE_DRIVE_FILES_ENDPOINT}?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Drive appData access failed with ${response.status}.`);
  }
}

export async function listGoogleDriveFiles(pathPrefix: string): Promise<CloudSyncFileRecord[]> {
  const token = await getGoogleAccessToken();
  const normalizedPrefix = pathPrefix
    ? normalizeDriveFileName(pathPrefix)
    : CLOUD_SYNC_VAULT_ROOT;
  const query = new URLSearchParams({
    spaces: "appDataFolder",
    q: `'appDataFolder' in parents and trashed = false and name contains '${normalizedPrefix}'`,
    fields: "files(id,name,modifiedTime,size,version)",
    pageSize: "1000",
  });
  const response = await googleDriveRequest(
    token,
    `${GOOGLE_DRIVE_FILES_ENDPOINT}?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Drive list failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { files?: GoogleDriveFile[] };
  return (payload.files || [])
    .map((file) => ({ file, path: denormalizeDriveFileName(file.name) }))
    .filter((record) => record.path.startsWith(pathPrefix))
    .map((record) => toCloudFileRecord(record.path, record.file));
}

export async function getGoogleDriveChangesCursor(): Promise<string | undefined> {
  const token = await getGoogleAccessToken();
  const response = await googleDriveRequest(
    token,
    "https://www.googleapis.com/drive/v3/changes/startPageToken"
  );

  if (!response.ok) {
    throw new Error(`Google Drive change cursor failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    startPageToken?: string;
  };
  return payload.startPageToken;
}

export async function listGoogleDriveChangedFiles(
  cursor: string
): Promise<GoogleDriveChangeListing> {
  const token = await getGoogleAccessToken();
  const files = new Map<string, CloudSyncFileRecord>();
  let pageToken = cursor;
  let nextCursor: string | undefined = cursor;

  while (pageToken) {
    const query = new URLSearchParams({
      pageToken,
      spaces: "appDataFolder",
      fields:
        "changes(file(id,name,modifiedTime,size,version,trashed),removed),nextPageToken,newStartPageToken",
      pageSize: "1000",
    });
    const response = await googleDriveRequest(
      token,
      `https://www.googleapis.com/drive/v3/changes?${query.toString()}`
    );

    if (response.status === 410) {
      throw new Error("Google Drive change cursor is no longer valid and requires rescan.");
    }

    if (!response.ok) {
      throw new Error(`Google Drive change listing failed with ${response.status}.`);
    }

    const payload = (await response.json()) as GoogleDriveChangeListResponse;
    for (const change of payload.changes || []) {
      if (change.removed || !change.file || change.file.trashed) {
        continue;
      }

      const path = denormalizeDriveFileName(change.file.name);
      files.set(path, toCloudFileRecord(path, change.file));
    }

    pageToken = payload.nextPageToken || "";
    if (payload.newStartPageToken) {
      nextCursor = payload.newStartPageToken;
    } else if (pageToken) {
      nextCursor = pageToken;
    }
  }

  return {
    files: [...files.values()],
    cursor: nextCursor,
  };
}

export async function readGoogleDriveFile(path: string): Promise<Uint8Array> {
  const token = await getGoogleAccessToken();
  const file = await findDriveFile(token, path);
  if (!file) {
    throw new Error(`Google Drive file not found: ${path}`);
  }

  const response = await googleDriveRequest(
    token,
    `${GOOGLE_DRIVE_FILES_ENDPOINT}/${file.id}?alt=media`
  );

  if (!response.ok) {
    throw new Error(`Google Drive read failed with ${response.status}.`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function writeGoogleDriveFile(
  path: string,
  bytes: Uint8Array,
  expectedVersionToken?: string
): Promise<CloudSyncFileRecord> {
  const token = await getGoogleAccessToken();
  const existing = await findDriveFile(token, path);

  if (
    existing &&
    expectedVersionToken &&
    expectedVersionToken !== (existing.version || existing.modifiedTime || existing.id)
  ) {
    throw new Error("Google Drive version conflict detected.");
  }

  const metadata = existing
    ? { name: normalizeDriveFileName(path) }
    : { name: normalizeDriveFileName(path), parents: ["appDataFolder"] };
  const body = buildMultipartBody(metadata, bytes);
  const endpoint = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&fields=id,name,modifiedTime,size,version`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size,version`;
  const response = await googleDriveRequest(token, endpoint, {
    method: existing ? "PATCH" : "POST",
    headers: {
      "Content-Type": body.type,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Google Drive write failed with ${response.status}.`);
  }

  const savedFile = (await response.json()) as GoogleDriveFile;
  return toCloudFileRecord(path, savedFile);
}

export async function deleteGoogleDriveFile(
  path: string,
  expectedVersionToken?: string
): Promise<void> {
  const token = await getGoogleAccessToken();
  const existing = await findDriveFile(token, path);
  if (!existing) {
    return;
  }

  if (
    expectedVersionToken &&
    expectedVersionToken !== (existing.version || existing.modifiedTime || existing.id)
  ) {
    throw new Error("Google Drive version conflict detected.");
  }

  const response = await googleDriveRequest(
    token,
    `${GOOGLE_DRIVE_FILES_ENDPOINT}/${existing.id}`,
    { method: "DELETE" }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Google Drive delete failed with ${response.status}.`);
  }
}
