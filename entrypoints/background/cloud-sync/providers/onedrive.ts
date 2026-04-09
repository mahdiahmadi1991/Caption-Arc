import type { CloudSyncFileRecord, CloudSyncProviderCheckpoint } from "../types";
import {
  clearMicrosoftStoredTokens,
  getMicrosoftAccessToken,
  requestMicrosoftAccessTokenInteractive,
} from "./onedrive-auth";

const ONEDRIVE_PROVIDER = "onedrive";
const MICROSOFT_GRAPH_BASE = "https://graph.microsoft.com/v1.0";

type OneDriveItem = {
  id: string;
  name: string;
  eTag?: string;
  lastModifiedDateTime?: string;
  size?: number;
  folder?: {
    childCount?: number;
  };
};

type OneDriveUser = {
  id?: string;
  userPrincipalName?: string;
  mail?: string;
  displayName?: string;
};

function formatOneDriveTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function toCloudFileRecord(path: string, item: OneDriveItem): CloudSyncFileRecord {
  return {
    path,
    versionToken: item.eTag || item.lastModifiedDateTime || item.id,
    updatedAt: formatOneDriveTimestamp(item.lastModifiedDateTime),
    size: item.size || 0,
  };
}

function encodeGraphPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function oneDriveRequest(
  token: string,
  input: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(input.startsWith("http") ? input : `${MICROSOFT_GRAPH_BASE}${input}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}

async function getApproot(token: string): Promise<OneDriveItem> {
  const response = await oneDriveRequest(
    token,
    "/me/drive/special/approot?$select=id,name,eTag,lastModifiedDateTime,size,folder"
  );

  if (!response.ok) {
    throw new Error(`OneDrive App Folder access failed with ${response.status}.`);
  }

  return (await response.json()) as OneDriveItem;
}

async function findOneDriveItem(
  token: string,
  path: string
): Promise<OneDriveItem | null> {
  const normalizedPath = encodeGraphPath(path);
  const response = await oneDriveRequest(
    token,
    `/me/drive/special/approot:/${normalizedPath}?$select=id,name,eTag,lastModifiedDateTime,size,folder`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`OneDrive lookup failed with ${response.status}.`);
  }

  return (await response.json()) as OneDriveItem;
}

async function createFolderChild(
  token: string,
  parentId: string,
  name: string
): Promise<OneDriveItem> {
  const response = await oneDriveRequest(token, `/me/drive/items/${parentId}/children`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail",
    }),
  });

  if (response.status === 409) {
    throw new Error(`OneDrive folder already exists: ${name}`);
  }

  if (!response.ok) {
    throw new Error(`OneDrive folder creation failed with ${response.status}.`);
  }

  return (await response.json()) as OneDriveItem;
}

async function ensureFolderPath(token: string, folderPath: string): Promise<void> {
  const segments = folderPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return;
  }

  let current = await getApproot(token);
  let currentPath = "";

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    const existing = await findOneDriveItem(token, currentPath);

    if (existing?.folder) {
      current = existing;
      continue;
    }

    try {
      current = await createFolderChild(token, current.id, segment);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("already exists")) {
        throw error;
      }

      const conflictItem = await findOneDriveItem(token, currentPath);
      if (!conflictItem?.folder) {
        throw new Error(`OneDrive folder path is blocked by a file: ${currentPath}`);
      }

      current = conflictItem;
    }
  }
}

async function listChildrenRecursively(
  token: string,
  itemId: string,
  pathPrefix = ""
): Promise<CloudSyncFileRecord[]> {
  const files: CloudSyncFileRecord[] = [];
  let nextUrl = `${MICROSOFT_GRAPH_BASE}/me/drive/items/${itemId}/children?$select=id,name,eTag,lastModifiedDateTime,size,folder`;

  while (nextUrl) {
    const response = await oneDriveRequest(token, nextUrl);
    if (!response.ok) {
      throw new Error(`OneDrive list failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      value?: OneDriveItem[];
      "@odata.nextLink"?: string;
    };

    for (const item of payload.value || []) {
      const itemPath = pathPrefix ? `${pathPrefix}/${item.name}` : item.name;
      if (item.folder) {
        files.push(...(await listChildrenRecursively(token, item.id, itemPath)));
        continue;
      }

      files.push(toCloudFileRecord(itemPath, item));
    }

    nextUrl = payload["@odata.nextLink"] || "";
  }

  return files;
}

async function fetchMicrosoftUser(token: string): Promise<OneDriveUser> {
  const response = await oneDriveRequest(
    token,
    "/me?$select=id,displayName,mail,userPrincipalName"
  );

  if (!response.ok) {
    return {};
  }

  return (await response.json()) as OneDriveUser;
}

export async function connectOneDrive(): Promise<CloudSyncProviderCheckpoint> {
  const token = await requestMicrosoftAccessTokenInteractive();
  await getApproot(token);
  const user = await fetchMicrosoftUser(token);
  const accountLabel = user.mail || user.userPrincipalName || user.displayName || "OneDrive";

  return {
    provider: ONEDRIVE_PROVIDER,
    connected: true,
    accountId: user.id || accountLabel,
    accountLabel,
    connectedAt: Date.now(),
    healthState: "syncing",
  };
}

export async function disconnectOneDrive(): Promise<CloudSyncProviderCheckpoint> {
  await clearMicrosoftStoredTokens();

  return {
    provider: ONEDRIVE_PROVIDER,
    connected: false,
    healthState: "disconnected",
  };
}

export async function ensureOneDriveAppFolder(): Promise<void> {
  const token = await getMicrosoftAccessToken();
  await getApproot(token);
}

export async function listOneDriveFiles(pathPrefix: string): Promise<CloudSyncFileRecord[]> {
  const token = await getMicrosoftAccessToken();
  const appRoot = await getApproot(token);
  const files = await listChildrenRecursively(token, appRoot.id);
  return files.filter((file) => file.path.startsWith(pathPrefix));
}

export async function readOneDriveFile(path: string): Promise<Uint8Array> {
  const token = await getMicrosoftAccessToken();
  const normalizedPath = encodeGraphPath(path);
  const response = await oneDriveRequest(
    token,
    `/me/drive/special/approot:/${normalizedPath}:/content`
  );

  if (response.status === 404) {
    throw new Error(`OneDrive file not found: ${path}`);
  }

  if (!response.ok) {
    throw new Error(`OneDrive read failed with ${response.status}.`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function writeOneDriveFile(
  path: string,
  bytes: Uint8Array,
  expectedVersionToken?: string
): Promise<CloudSyncFileRecord> {
  const token = await getMicrosoftAccessToken();
  const existing = await findOneDriveItem(token, path);

  if (
    existing &&
    expectedVersionToken &&
    expectedVersionToken !== (existing.eTag || existing.lastModifiedDateTime || existing.id)
  ) {
    throw new Error("OneDrive version conflict detected.");
  }

  const folderPath = path.split("/").slice(0, -1).join("/");
  await ensureFolderPath(token, folderPath);

  const normalizedPath = encodeGraphPath(path);
  const response = await oneDriveRequest(
    token,
    `/me/drive/special/approot:/${normalizedPath}:/content`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: bytes,
    }
  );

  if (!response.ok) {
    throw new Error(`OneDrive write failed with ${response.status}.`);
  }

  const savedItem = (await response.json()) as OneDriveItem;
  return toCloudFileRecord(path, savedItem);
}

export async function deleteOneDriveFile(
  path: string,
  expectedVersionToken?: string
): Promise<void> {
  const token = await getMicrosoftAccessToken();
  const existing = await findOneDriveItem(token, path);
  if (!existing) {
    return;
  }

  if (
    expectedVersionToken &&
    expectedVersionToken !== (existing.eTag || existing.lastModifiedDateTime || existing.id)
  ) {
    throw new Error("OneDrive version conflict detected.");
  }

  const response = await oneDriveRequest(token, `/me/drive/items/${existing.id}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`OneDrive delete failed with ${response.status}.`);
  }
}