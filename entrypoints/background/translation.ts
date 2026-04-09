import type {
  Settings,
  TranslateRequest,
  TranslateResponse,
} from "./types";
import { MODELS } from "./constants";
import { RateLimitError } from "./errors";
import { sanitizeError, buildPrompt, extractErrorDetails } from "./utils";
import {
  getSettings,
  recordOpenAiVerificationFailure,
  recordOpenAiVerificationSuccess,
} from "./settings";
import {
  getOpenAiServiceAvailability,
  getOpenAiVerificationFailureMessage,
  getOpenAiVerificationSuccessMessage,
} from "../shared/openai-service";
import {
  generateChunkWithOpenAI,
  generateWithOpenAI,
  type GeneratedTextChunk,
  translateWithOpenAI,
} from "./providers/openai";
import { createBackgroundDiagnosticsLogger } from "./diagnostics";

const translationDiagnosticsLogger = createBackgroundDiagnosticsLogger({
  domain: "translation",
  feature: "openai-translation-service",
});

function getProviderConfigurationError(settings: Settings): string | null {
  const availability = getOpenAiServiceAvailability(settings);
  return availability.operational ? null : availability.message;
}

async function runPromptWithConfiguredProvider(
  settings: Settings,
  prompt: string,
  maxTokens = 1024,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = settings.openaiApiKey;
  const modelList = [...MODELS];
  const startIndex = modelList.indexOf(settings.model);
  const modelsToTry =
    startIndex >= 0
      ? [...modelList.slice(startIndex), ...modelList.slice(0, startIndex)]
      : modelList;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      await translationDiagnosticsLogger.debug("generation_attempt_started", {
        model,
        promptLength: prompt.length,
        maxTokens,
      });
      return await generateWithOpenAI(prompt, apiKey, model, maxTokens, signal);
    } catch (error) {
      lastError = error as Error;
      await translationDiagnosticsLogger.warn("generation_attempt_failed", {
        model,
        error,
        retrying: error instanceof RateLimitError,
      });
      if (error instanceof RateLimitError) {
        continue;
      }
      break;
    }
  }

  throw lastError ?? new Error("Provider request failed");
}

async function runPromptChunkWithConfiguredProvider(
  settings: Settings,
  prompt: string,
  maxTokens = 1024,
  signal?: AbortSignal
): Promise<GeneratedTextChunk> {
  const apiKey = settings.openaiApiKey;
  const modelList = [...MODELS];
  const startIndex = modelList.indexOf(settings.model);
  const modelsToTry =
    startIndex >= 0
      ? [...modelList.slice(startIndex), ...modelList.slice(0, startIndex)]
      : modelList;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      await translationDiagnosticsLogger.debug("generation_chunk_attempt_started", {
        model,
        promptLength: prompt.length,
        maxTokens,
      });
      return await generateChunkWithOpenAI(
        prompt,
        apiKey,
        model,
        maxTokens,
        signal
      );
    } catch (error) {
      lastError = error as Error;
      await translationDiagnosticsLogger.warn("generation_chunk_attempt_failed", {
        model,
        error,
        retrying: error instanceof RateLimitError,
      });
      if (error instanceof RateLimitError) {
        continue;
      }
      break;
    }
  }

  throw lastError ?? new Error("Provider request failed");
}

function buildDebugErrorMessage(
  action: "translation" | "generation",
  settings: Settings,
  error: unknown
): string {
  const sanitized = sanitizeError(error);
  const details = extractErrorDetails(error);
  const context = `provider=openai; model=${settings.model}`;

  if (sanitized !== "Translation failed") {
    if (details && details !== sanitized) {
      return `${sanitized} [${context}; raw=${details}]`;
    }

    return `${sanitized} [${context}]`;
  }

  if (details) {
    return `Failed ${action}. [${context}; raw=${details}]`;
  }

  return `Failed ${action}. [${context}; raw=No additional provider details returned]`;
}

export async function generateText(
  prompt: string,
  maxTokens = 1024,
  signal?: AbortSignal
): Promise<{ success: boolean; text?: string; error?: string }> {
  const { settings } = await getSettings();
  const configurationError = getProviderConfigurationError(settings);

  await translationDiagnosticsLogger.info("generation_started", {
    model: settings.model,
    promptLength: prompt.length,
    maxTokens,
  });

  if (configurationError) {
    await translationDiagnosticsLogger.warn("generation_blocked_configuration", {
      model: settings.model,
      configurationError,
    });
    return {
      success: false,
      error: configurationError,
    };
  }

  try {
    const text = await runPromptWithConfiguredProvider(
      settings,
      prompt,
      maxTokens,
      signal
    );
    await recordOpenAiVerificationSuccess(
      settings,
      getOpenAiVerificationSuccessMessage()
    );
    await translationDiagnosticsLogger.info("generation_completed", {
      model: settings.model,
      textLength: text.length,
    });
    return { success: true, text };
  } catch (error) {
    void translationDiagnosticsLogger.error("generation_failed", {
      model: settings.model,
      error,
    });
    await recordOpenAiVerificationFailure(
      getOpenAiVerificationFailureMessage(error),
      settings
    );
    return {
      success: false,
      error: buildDebugErrorMessage("generation", settings, error),
    };
  }
}

export async function generateTextChunk(
  prompt: string,
  maxTokens = 1024,
  signal?: AbortSignal
): Promise<{
  success: boolean;
  text?: string;
  truncated?: boolean;
  error?: string;
}> {
  const { settings } = await getSettings();
  const configurationError = getProviderConfigurationError(settings);

  await translationDiagnosticsLogger.info("generation_chunk_started", {
    model: settings.model,
    promptLength: prompt.length,
    maxTokens,
  });

  if (configurationError) {
    await translationDiagnosticsLogger.warn("generation_chunk_blocked_configuration", {
      model: settings.model,
      configurationError,
    });
    return {
      success: false,
      error: configurationError,
    };
  }

  try {
    const chunk = await runPromptChunkWithConfiguredProvider(
      settings,
      prompt,
      maxTokens,
      signal
    );
    await recordOpenAiVerificationSuccess(
      settings,
      getOpenAiVerificationSuccessMessage()
    );
    return {
      success: true,
      text: chunk.text,
      truncated: chunk.truncated,
    };
  } catch (error) {
    await translationDiagnosticsLogger.error("generation_chunk_failed", {
      model: settings.model,
      error,
    });
    await recordOpenAiVerificationFailure(
      getOpenAiVerificationFailureMessage(error),
      settings
    );
    return {
      success: false,
      error: buildDebugErrorMessage("generation", settings, error),
    };
  }
}

export async function translate(
  request: TranslateRequest
): Promise<TranslateResponse> {
  const { settings } = await getSettings();
  const configurationError = getProviderConfigurationError(settings);

  await translationDiagnosticsLogger.info("translation_started", {
    requestId: request.id,
    model: settings.model,
    mode: request.mode,
    force: Boolean(request.force),
    textLength: request.text.length,
  }, {
    requestId: String(request.id),
  });

  if (configurationError) {
    await translationDiagnosticsLogger.warn("translation_blocked_configuration", {
      requestId: request.id,
      model: settings.model,
      configurationError,
    }, {
      requestId: String(request.id),
    });
    return {
      success: false,
      error: configurationError,
    };
  }

  if (!request.force && !settings.translationEnabled) {
    await translationDiagnosticsLogger.warn("translation_blocked_disabled", {
      requestId: request.id,
      model: settings.model,
    }, {
      requestId: String(request.id),
    });
    return { success: false, error: "Translation disabled" };
  }

  const apiKey = settings.openaiApiKey;
  const modelList = [...MODELS];
  const startIndex = modelList.indexOf(settings.model);
  const modelsToTry =
    startIndex >= 0
      ? [...modelList.slice(startIndex), ...modelList.slice(0, startIndex)]
      : modelList;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      await translationDiagnosticsLogger.debug("translation_attempt_started", {
        requestId: request.id,
        model,
        mode: request.mode,
      }, {
        requestId: String(request.id),
      });
      const translation = await translateWithOpenAI(request, apiKey, model);
      await recordOpenAiVerificationSuccess(
        settings,
        getOpenAiVerificationSuccessMessage()
      );

      await translationDiagnosticsLogger.info("translation_completed", {
        requestId: request.id,
        model,
        mode: request.mode,
        translationLength: translation.length,
      }, {
        requestId: String(request.id),
      });

      return {
        success: true,
        id: request.id,
        translation,
        mode: request.mode,
      };
    } catch (error) {
      lastError = error as Error;
      await translationDiagnosticsLogger.warn("translation_attempt_failed", {
        requestId: request.id,
        model,
        mode: request.mode,
        error,
        retrying: error instanceof RateLimitError,
      }, {
        requestId: String(request.id),
      });
      if (error instanceof RateLimitError) {
        continue;
      }
      break;
    }
  }

  await recordOpenAiVerificationFailure(
    getOpenAiVerificationFailureMessage(lastError),
    settings
  );

  void translationDiagnosticsLogger.error("translation_failed", {
    model: settings.model,
    mode: request.mode,
    error: lastError,
  });

  return {
    success: false,
    id: request.id,
    error: buildDebugErrorMessage("translation", settings, lastError),
  };
}

export function buildTranslationPrompt(request: TranslateRequest): string {
  return buildPrompt(request);
}
