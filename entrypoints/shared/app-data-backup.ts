const BACKUP_MAGIC = "captionarc-backup-v2";
const BACKUP_KDF = "PBKDF2-SHA256";
const BACKUP_CIPHER = "AES-256-GCM";
const BACKUP_PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function assertPassphrase(passphrase: string): void {
  if (passphrase.length < 8) {
    throw new Error("Use a backup passphrase with at least 8 characters.");
  }
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function deriveEncryptionKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: BACKUP_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export function createEncryptedBackupFilename(exportedAt = Date.now()): string {
  const iso = new Date(exportedAt).toISOString().replace(/[:.]/g, "-");
  return `captionarc_backup_${iso}.mcbak`;
}

export async function serializeEncryptedBackup(
  payload: unknown,
  passphrase: string
): Promise<string> {
  assertPassphrase(passphrase);

  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveEncryptionKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  );

  return [
    BACKUP_MAGIC,
    BACKUP_CIPHER,
    BACKUP_KDF,
    String(BACKUP_PBKDF2_ITERATIONS),
    encodeBase64Url(salt),
    encodeBase64Url(iv),
    encodeBase64Url(ciphertext),
  ].join("\n");
}

export async function deserializeEncryptedBackup<T>(
  serialized: string,
  passphrase: string
): Promise<T> {
  assertPassphrase(passphrase);

  const lines = serialized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length !== 7 || lines[0] !== BACKUP_MAGIC) {
    throw new Error("The selected file is not a supported encrypted CaptionArc backup.");
  }

  if (lines[1] !== BACKUP_CIPHER || lines[2] !== BACKUP_KDF) {
    throw new Error("The backup uses an unsupported encryption format.");
  }

  const iterations = Number.parseInt(lines[3] || "", 10);
  if (iterations !== BACKUP_PBKDF2_ITERATIONS) {
    throw new Error("The backup uses an unsupported key derivation policy.");
  }

  try {
    const salt = decodeBase64Url(lines[4] || "");
    const iv = decodeBase64Url(lines[5] || "");
    const ciphertext = decodeBase64Url(lines[6] || "");
    const key = await deriveEncryptionKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    throw new Error("Could not decrypt the backup. Check the passphrase and try again.");
  }
}
