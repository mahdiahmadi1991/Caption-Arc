type VerificationSnapshotLike = {
  status: "verified" | "error";
  message: string;
  signature: string;
  verifiedAt: number;
};

type OpenAiSettingsLike = {
  openaiApiKey?: string | null;
  model?: string | null;
  verificationSnapshot?: VerificationSnapshotLike | null;
};

export type OpenAiServiceAvailabilityState =
  | "setup"
  | "pending"
  | "ready"
  | "unavailable";

export type OpenAiServiceAvailability = {
  state: OpenAiServiceAvailabilityState;
  configured: boolean;
  operational: boolean;
  message: string;
  snapshot: VerificationSnapshotLike | null;
};

function normalizeErrorText(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message.trim();
  }

  return String(error || "").trim();
}

export function getOpenAiConnectionSignature(
  settings: OpenAiSettingsLike
): string {
  return JSON.stringify({
    service: "openai",
    apiKey: settings.openaiApiKey?.trim() || "",
    model: settings.model?.trim() || "",
  });
}

export function isOpenAiConfigured(settings: OpenAiSettingsLike): boolean {
  return Boolean(settings.openaiApiKey?.trim() && settings.model?.trim());
}

export function getResolvedOpenAiVerificationSnapshot(
  settings: OpenAiSettingsLike
): VerificationSnapshotLike | null {
  const snapshot = settings.verificationSnapshot;
  if (!snapshot) {
    return null;
  }

  return snapshot.signature === getOpenAiConnectionSignature(settings)
    ? snapshot
    : null;
}

export function getOpenAiServiceAvailability(
  settings: OpenAiSettingsLike
): OpenAiServiceAvailability {
  const configured = isOpenAiConfigured(settings);
  const snapshot = getResolvedOpenAiVerificationSnapshot(settings);

  if (!configured) {
    return {
      state: "setup",
      configured: false,
      operational: false,
      message: "Finish OpenAI setup in Settings to enable AI features.",
      snapshot: null,
    };
  }

  if (snapshot?.status === "error") {
    return {
      state: "unavailable",
      configured: true,
      operational: false,
      message: snapshot.message || "OpenAI is unavailable right now.",
      snapshot,
    };
  }

  if (snapshot?.status === "verified") {
    return {
      state: "ready",
      configured: true,
      operational: true,
      message: snapshot.message || "OpenAI is ready.",
      snapshot,
    };
  }

  return {
    state: "pending",
    configured: true,
    operational: false,
    message: "OpenAI needs to be checked again in Settings.",
    snapshot: null,
  };
}

export function getOpenAiVerificationSuccessMessage(): string {
  return "OpenAI is ready.";
}

export function getOpenAiVerificationFailureMessage(error: unknown): string {
  const message = normalizeErrorText(error).toLowerCase();

  if (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("incorrect_api_key") ||
    message.includes("invalid api key") ||
    message.includes("api key") ||
    message.includes("authentication")
  ) {
    return "OpenAI rejected the current API setup. Check the API key and selected model in Settings.";
  }

  if (
    message.includes("404") ||
    message.includes("model_not_found") ||
    message.includes("does not exist") ||
    message.includes("not available")
  ) {
    return "The selected OpenAI model is unavailable for the current setup.";
  }

  if (message.includes("429") || message.includes("rate limit")) {
    return "OpenAI is temporarily rate-limiting requests. Try again shortly.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("networkerror") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout")
  ) {
    return "CaptionArc could not reach OpenAI. Check your connection and try again.";
  }

  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("service unavailable")
  ) {
    return "OpenAI is temporarily unavailable. Try again shortly.";
  }

  return "OpenAI is unavailable right now. Review the current setup in Settings.";
}
