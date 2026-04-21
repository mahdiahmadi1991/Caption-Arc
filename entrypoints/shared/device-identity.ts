import { getBrowserProductLabel } from "./browser-capabilities";

function detectPlatformLabel(userAgent: string): string {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("cros")) {
    return "ChromeOS";
  }

  if (normalized.includes("windows")) {
    return "Windows";
  }

  if (normalized.includes("mac os") || normalized.includes("macintosh")) {
    return "macOS";
  }

  if (normalized.includes("linux")) {
    return "Linux";
  }

  return "This Device";
}

export function createDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function createDefaultDeviceLabel(): string {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent || "";
  const platformLabel = detectPlatformLabel(userAgent);
  const browserLabel = getBrowserProductLabel();
  return platformLabel === "This Device"
    ? `${browserLabel} on this device`
    : `${browserLabel} on ${platformLabel}`;
}