import type { CloudSyncProviderCheckpoint } from "../types";
import type { CloudSyncFileRecord } from "../types";
import { getCloudSyncProviderSupport } from "../../../shared/browser-capabilities";

const GOOGLE_DRIVE_PROVIDER = "google-drive";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_USERINFO_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
const GOOGLE_DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const CLOUD_SYNC_VAULT_ROOT = "vault/";

type GoogleDriveUserInfo = {
  email?: string;
};

type GoogleDriveFile = {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  version?: string;
};

function getGoogleManifestOauthClientId(): string | null {
  const oauth2 = chrome.runtime.getManifest().oauth2;
  const clientId = typeof oauth2?.client_id === "string" ? oauth2.client_id.trim() : "";
  return clientId || null;
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

function getIdentityErrorMessage(): string {
  return chrome.runtime.lastError?.message || "Google authentication failed.";
}

function getAuthToken(interactive: boolean): Promise<string> {
  assertGoogleDriveBrowserSupport();

  if (!getGoogleManifestOauthClientId()) {
    return Promise.reject(
      new Error(
        "Google Drive OAuth is not configured. Set WXT_GOOGLE_OAUTH_CLIENT_ID before building the extension."
      )
    );
  }

  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
      {
        interactive,
        scopes: [GOOGLE_DRIVE_SCOPE, GOOGLE_USERINFO_SCOPE],
      },
      (token) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error(getIdentityErrorMessage()));
          return;
        }

        resolve(token);
      }
    );
  });
}

function removeCachedAuthToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
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
  const token = await getAuthToken(true);
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
    const token = await getAuthToken(false);
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).catch(() => undefined);
    await removeCachedAuthToken(token);
  } catch {
    // Ignore disconnect token cleanup failures.
  }

  return {
    provider: GOOGLE_DRIVE_PROVIDER,
    connected: false,
    healthState: "disconnected",
  };
}

export async function ensureGoogleDriveAppFolder(): Promise<void> {
  const token = await getAuthToken(false);
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
  const token = await getAuthToken(false);
  const query = new URLSearchParams({
    spaces: "appDataFolder",
    q: `'appDataFolder' in parents and trashed = false and name contains '${CLOUD_SYNC_VAULT_ROOT}'`,
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

export async function readGoogleDriveFile(path: string): Promise<Uint8Array> {
  const token = await getAuthToken(false);
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
  const token = await getAuthToken(false);
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
  const token = await getAuthToken(false);
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