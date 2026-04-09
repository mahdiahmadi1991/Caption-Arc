import type { TranslateRequest } from "./types";
import { getLanguageName } from "../shared/language-metadata";
export { buildMeetingSummaryPrompt, createTextFingerprint } from "../shared/meeting-summary";

export function buildPrompt(request: TranslateRequest): string {
  const langName = getLanguageName(request.targetLang);

  let prompt = `You are translating live meeting captions from speech recognition.

CRITICAL RULES:
1. Translate the COMPLETE text accurately - DO NOT skip any words
2. KEEP THE SPEAKER'S PERSPECTIVE: The text is spoken BY the speaker. When they refer to themselves, use "I/me". When they refer to the listener, use "you".
3. DO NOT flip or swap pronouns. If the speaker says something equivalent to "Do you love me?", translate it as "Do you love me?" - NOT "Do I love you?"
4. Fix obvious speech recognition errors based on context
5. Output ONLY the translation, nothing else

Target language: ${langName}`;

  if (request.context) {
    prompt += `\n\nRecent conversation (format: [Speaker]: text):\n${request.context}\n\nUse this context to understand who is speaking to whom and maintain correct pronoun references.`;
  }

  if (request.customPrompt) {
    prompt += `\n\nAdditional instructions: ${request.customPrompt}`;
  }

  prompt += `\n\nCurrent speaker: ${
    request.speaker || "Unknown"
  }\nText to translate:\n${request.text}`;

  return prompt;
}

export function sanitizeError(error: unknown): string {
  const rawMessage = extractErrorDetails(error);
  const msg = rawMessage || String(error);

  if (msg.includes("Failed to fetch")) {
    return "Network request failed. Check your connection or OpenAI endpoint.";
  }
  if (
    msg.includes("401") ||
    msg.includes("api-key") ||
    msg.includes("API key")
  ) {
    return "Invalid API key";
  }
  if (msg.includes("429")) {
    return "Rate limit exceeded, please try again later";
  }
  if (msg.includes("500") || msg.includes("503")) {
    return "Service temporarily unavailable";
  }
  if (msg.includes("OpenAI API error:")) {
    return msg.replace(/^Error:\s*/, "");
  }
  if (msg.includes("OpenAI request failed")) {
    return "OpenAI request failed";
  }

  if (
    rawMessage &&
    rawMessage !== "[object Object]" &&
    rawMessage !== "Error"
  ) {
    return rawMessage;
  }

  return "Translation failed";
}

export function extractErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.replace(/^Error:\s*/, "").trim();
    if (message) {
      return message;
    }
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = String((error as { message: string }).message)
      .replace(/^Error:\s*/, "")
      .trim();
    if (message) {
      return message;
    }
  }

  const fallback = String(error || "").replace(/^Error:\s*/, "").trim();
  if (fallback && fallback !== "[object Object]") {
    return fallback;
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "[unserializable error object]";
    }
  }

  return "";
}
