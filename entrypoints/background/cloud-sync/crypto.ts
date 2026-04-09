const CLOUD_SYNC_VAULT_KEY_STORAGE_KEY = "cloudSyncVaultKey";

type SerializedEncryptedPayload = {
  version: 1;
  iv: string;
  ciphertext: string;
};

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function loadStoredVaultKey(): Promise<Uint8Array | null> {
  const result = await chrome.storage.local.get(CLOUD_SYNC_VAULT_KEY_STORAGE_KEY);
  const stored = result[CLOUD_SYNC_VAULT_KEY_STORAGE_KEY];

  if (typeof stored !== "string" || !stored.trim()) {
    return null;
  }

  return decodeBase64(stored);
}

async function persistVaultKey(bytes: Uint8Array): Promise<void> {
  await chrome.storage.local.set({
    [CLOUD_SYNC_VAULT_KEY_STORAGE_KEY]: encodeBase64(bytes),
  });
}

async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function getOrCreateCloudSyncVaultKey(): Promise<Uint8Array> {
  const stored = await loadStoredVaultKey();
  if (stored) {
    return stored;
  }

  const generated = crypto.getRandomValues(new Uint8Array(32));
  await persistVaultKey(generated);
  return generated;
}

export async function setCloudSyncVaultKey(rawKey: Uint8Array): Promise<void> {
  await persistVaultKey(rawKey);
}

export async function encryptCloudSyncPayload(payload: unknown): Promise<Uint8Array> {
  const rawKey = await getOrCreateCloudSyncVaultKey();
  const key = await importAesKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  );

  const serialized: SerializedEncryptedPayload = {
    version: 1,
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(ciphertext),
  };

  return new TextEncoder().encode(JSON.stringify(serialized));
}

export async function decryptCloudSyncPayload<T>(bytes: Uint8Array): Promise<T> {
  const payload = JSON.parse(new TextDecoder().decode(bytes)) as SerializedEncryptedPayload;
  if (payload.version !== 1) {
    throw new Error("Unsupported cloud sync payload version.");
  }

  const rawKey = await getOrCreateCloudSyncVaultKey();
  const key = await importAesKey(rawKey);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(payload.iv) },
    key,
    decodeBase64(payload.ciphertext)
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

export async function exportCloudSyncVaultKeyPayload(): Promise<Uint8Array> {
  const rawKey = await getOrCreateCloudSyncVaultKey();
  return new TextEncoder().encode(
    JSON.stringify({ version: 1, rawKey: encodeBase64(rawKey) })
  );
}

export async function importCloudSyncVaultKeyPayload(
  bytes: Uint8Array
): Promise<void> {
  const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
    version: number;
    rawKey: string;
  };

  if (payload.version !== 1 || typeof payload.rawKey !== "string") {
    throw new Error("Unsupported cloud sync vault key payload.");
  }

  await setCloudSyncVaultKey(decodeBase64(payload.rawKey));
}