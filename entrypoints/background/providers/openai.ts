import type { TranslateRequest } from "../types";
import { RateLimitError } from "../errors";
import { buildPrompt } from "../utils";
import { createBackgroundDiagnosticsLogger } from "../diagnostics";

export type GeneratedTextChunk = {
  text: string;
  truncated: boolean;
};

type StreamTextHandlers = {
  onTextDelta?: (delta: string, aggregatedText: string) => void | Promise<void>;
};

const openAiDiagnostics = createBackgroundDiagnosticsLogger({
  domain: "ai",
  feature: "openai-provider",
  provider: "openai",
});

export function truncateForDiagnostics(value: string, maxLength = 400): string {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
}

function getOpenAiResponseMetadata(response: Response): Record<string, unknown> {
  return {
    status: response.status,
    statusText: response.statusText || "",
    contentType: response.headers.get("content-type") || "",
    requestId:
      response.headers.get("x-request-id") ||
      response.headers.get("openai-request-id") ||
      "",
    processingMs:
      response.headers.get("openai-processing-ms") ||
      response.headers.get("x-openai-processing-ms") ||
      "",
    retryAfter: response.headers.get("retry-after") || "",
  };
}

function getOpenAiRequestMetadata(params: {
  model: string;
  promptLength: number;
  maxCompletionTokens: number;
  stream: boolean;
  hasSignal?: boolean;
}): Record<string, unknown> {
  return {
    model: params.model,
    promptLength: params.promptLength,
    maxCompletionTokens: params.maxCompletionTokens,
    stream: params.stream,
    hasSignal: Boolean(params.hasSignal),
    gpt5Family: isGpt5FamilyModel(params.model),
  };
}

export function classifyOpenAiFailure(error: unknown): string {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message.trim().toLowerCase()
      : String(error || "").trim().toLowerCase();

  if (!message) {
    return "unknown";
  }

  if (message.includes("max_output_tokens") || message.includes("truncated before completion")) {
    return "truncation";
  }
  if (message.includes("rate limit") || message.includes("429")) {
    return "rate_limit";
  }
  if (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("api key") ||
    message.includes("authentication")
  ) {
    return "auth";
  }
  if (
    message.includes("404") ||
    message.includes("model_not_found") ||
    message.includes("does not exist") ||
    message.includes("not available")
  ) {
    return "model";
  }
  if (
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("networkerror") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout")
  ) {
    return "network";
  }
  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("service unavailable")
  ) {
    return "service";
  }

  return "unknown";
}

function isGpt5FamilyModel(model: string): boolean {
  return /^gpt-5(\b|[.-])/.test(model);
}

function summarizeOpenAIResponse(data: unknown): string {
  const response = data as {
    status?: unknown;
    incomplete_details?: unknown;
    output?: Array<{
      type?: unknown;
      role?: unknown;
      content?: Array<{ type?: unknown; text?: unknown }>;
    }>;
  };

  const parts: string[] = [];

  if (typeof response.status === "string") {
    parts.push(`status=${response.status}`);
  }

  if (response.incomplete_details) {
    try {
      parts.push(`incomplete=${JSON.stringify(response.incomplete_details)}`);
    } catch {
      parts.push("incomplete=[unserializable]");
    }
  }

  if (Array.isArray(response.output)) {
    const outputSummary = response.output
      .map((item, index) => {
        const itemType =
          typeof item?.type === "string" ? item.type : "unknown-item";
        const contentTypes = Array.isArray(item?.content)
          ? item.content
              .map((part) =>
                typeof part?.type === "string" ? part.type : "unknown-content"
              )
              .join("|")
          : "no-content";
        return `${index}:${itemType}:${contentTypes}`;
      })
      .join(", ");

    parts.push(`output=${outputSummary || "empty"}`);
  } else {
    parts.push("output=missing");
  }

  return parts.join("; ");
}

function extractOpenAIText(data: unknown): string {
  const outputText = (data as { output_text?: unknown })?.output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim();
  }

  const outputItems = (data as {
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string | { value?: string };
      }>;
    }>;
  })?.output;

  if (Array.isArray(outputItems)) {
    const joined = outputItems
      .flatMap((item) => item.content || [])
      .map((part) => {
        if (typeof part?.text === "string") {
          return part.text;
        }

        if (
          part?.text &&
          typeof part.text === "object" &&
          typeof part.text.value === "string"
        ) {
          return part.text.value;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();

    if (joined) {
      return joined;
    }
  }

  throw new Error(
    `OpenAI returned a response without text content. ${summarizeOpenAIResponse(data)}`
  );
}

function isOpenAIResponseTruncated(data: unknown): boolean {
  return (data as { status?: unknown })?.status === "incomplete";
}

export async function generateChunkWithOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  maxCompletionTokens = 1024,
  signal?: AbortSignal
): Promise<GeneratedTextChunk> {
  await openAiDiagnostics.debug("generate_chunk_started", {
    request: getOpenAiRequestMetadata({
      model,
      promptLength: prompt.length,
      maxCompletionTokens,
      stream: false,
      hasSignal: Boolean(signal),
    }),
  });

  const requestBody: Record<string, unknown> = {
    model,
    max_output_tokens: maxCompletionTokens,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ],
    text: {
      verbosity: "low",
    },
  };

  if (isGpt5FamilyModel(model)) {
    requestBody.reasoning = {
      effort: "minimal",
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    await openAiDiagnostics.warn("generate_chunk_http_error", {
      failureKind: classifyOpenAiFailure(
        `HTTP ${response.status}: ${truncateForDiagnostics(error)}`
      ),
      request: getOpenAiRequestMetadata({
        model,
        promptLength: prompt.length,
        maxCompletionTokens,
        stream: false,
        hasSignal: Boolean(signal),
      }),
      response: getOpenAiResponseMetadata(response),
      error: truncateForDiagnostics(error),
    });
    if (response.status === 429) {
      throw new RateLimitError(`OpenAI rate limit: ${error}`);
    }
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  await openAiDiagnostics.info("generate_chunk_completed", {
    request: getOpenAiRequestMetadata({
      model,
      promptLength: prompt.length,
      maxCompletionTokens,
      stream: false,
      hasSignal: Boolean(signal),
    }),
    truncated: isOpenAIResponseTruncated(data),
    responseSummary: summarizeOpenAIResponse(data),
    response: getOpenAiResponseMetadata(response),
  });
  return {
    text: extractOpenAIText(data),
    truncated: isOpenAIResponseTruncated(data),
  };
}

export async function generateWithOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  maxCompletionTokens = 1024,
  signal?: AbortSignal
): Promise<string> {
  await openAiDiagnostics.debug("generate_text_started", {
    request: getOpenAiRequestMetadata({
      model,
      promptLength: prompt.length,
      maxCompletionTokens,
      stream: false,
      hasSignal: Boolean(signal),
    }),
  });
  const chunk = await generateChunkWithOpenAI(
    prompt,
    apiKey,
    model,
    maxCompletionTokens,
    signal
  );

  if (chunk.truncated) {
    await openAiDiagnostics.warn("generate_text_truncated", {
      failureKind: "truncation",
      request: getOpenAiRequestMetadata({
        model,
        promptLength: prompt.length,
        maxCompletionTokens,
        stream: false,
        hasSignal: Boolean(signal),
      }),
      textLength: chunk.text.length,
    });
    throw new Error("OpenAI response was truncated before completion.");
  }

  await openAiDiagnostics.info("generate_text_completed", {
    request: getOpenAiRequestMetadata({
      model,
      promptLength: prompt.length,
      maxCompletionTokens,
      stream: false,
      hasSignal: Boolean(signal),
    }),
    textLength: chunk.text.length,
  });
  return chunk.text;
}

function parseSseEventBlock(block: string): { event?: string; data?: string } {
  const lines = block.split(/\r?\n/);
  let eventName: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  return {
    event: eventName,
    data: dataLines.length > 0 ? dataLines.join("\n") : undefined,
  };
}

export async function generateStreamWithOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  handlers: StreamTextHandlers,
  maxCompletionTokens = 1024,
  signal?: AbortSignal
): Promise<string> {
  await openAiDiagnostics.info("generate_stream_started", {
    request: getOpenAiRequestMetadata({
      model,
      promptLength: prompt.length,
      maxCompletionTokens,
      stream: true,
      hasSignal: Boolean(signal),
    }),
  });

  const requestBody: Record<string, unknown> = {
    model,
    stream: true,
    max_output_tokens: maxCompletionTokens,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ],
    text: {
      verbosity: "low",
    },
  };

  if (isGpt5FamilyModel(model)) {
    requestBody.reasoning = {
      effort: "minimal",
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    await openAiDiagnostics.warn("generate_stream_http_error", {
      failureKind: classifyOpenAiFailure(
        `HTTP ${response.status}: ${truncateForDiagnostics(error)}`
      ),
      request: getOpenAiRequestMetadata({
        model,
        promptLength: prompt.length,
        maxCompletionTokens,
        stream: true,
        hasSignal: Boolean(signal),
      }),
      response: getOpenAiResponseMetadata(response),
      error: truncateForDiagnostics(error),
    });
    if (response.status === 429) {
      throw new RateLimitError(`OpenAI rate limit: ${error}`);
    }
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  if (!response.body) {
    await openAiDiagnostics.error("generate_stream_missing_body", {
      failureKind: "protocol",
      request: getOpenAiRequestMetadata({
        model,
        promptLength: prompt.length,
        maxCompletionTokens,
        stream: true,
        hasSignal: Boolean(signal),
      }),
    });
    throw new Error("OpenAI streaming response body is missing.");
  }

  await openAiDiagnostics.debug("generate_stream_connected", {
    request: getOpenAiRequestMetadata({
      model,
      promptLength: prompt.length,
      maxCompletionTokens,
      stream: true,
      hasSignal: Boolean(signal),
    }),
    response: getOpenAiResponseMetadata(response),
  });

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  let aggregatedText = "";
  let finalResponseStatus: "completed" | "incomplete" | null = null;
  let finalResponseSummary = "";

  const processBlock = async (block: string) => {
    const { event, data } = parseSseEventBlock(block);
    if (!data || data === "[DONE]") {
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(data);
    } catch {
      await openAiDiagnostics.warn("generate_stream_payload_parse_failed", {
        request: getOpenAiRequestMetadata({
          model,
          promptLength: prompt.length,
          maxCompletionTokens,
          stream: true,
          hasSignal: Boolean(signal),
        }),
        event,
        dataLength: data.length,
        dataPreview: truncateForDiagnostics(data, 220),
      });
      return;
    }

    if (event === "response.output_text.delta") {
      const delta = (payload as { delta?: unknown })?.delta;
      if (typeof delta === "string" && delta.length > 0) {
        aggregatedText += delta;
      await openAiDiagnostics.trace("generate_stream_delta_received", {
          request: getOpenAiRequestMetadata({
            model,
            promptLength: prompt.length,
            maxCompletionTokens,
            stream: true,
            hasSignal: Boolean(signal),
          }),
          deltaLength: delta.length,
          aggregatedLength: aggregatedText.length,
        });
        await handlers.onTextDelta?.(delta, aggregatedText);
      }
      return;
    }

    if (event === "response.completed" || event === "response.incomplete") {
      const responseStatus =
        (payload as { response?: { status?: unknown }; status?: unknown })?.response
          ?.status ||
        (payload as { status?: unknown })?.status;
      finalResponseStatus =
        event === "response.incomplete" || responseStatus === "incomplete"
          ? "incomplete"
          : "completed";
      finalResponseSummary = summarizeOpenAIResponse(
        (payload as { response?: unknown })?.response || payload
      );
      return;
    }

    if (event === "response.error") {
      const message =
        (payload as { error?: { message?: unknown } })?.error?.message;
      await openAiDiagnostics.error("generate_stream_response_error", {
        failureKind: classifyOpenAiFailure(message),
        request: getOpenAiRequestMetadata({
          model,
          promptLength: prompt.length,
          maxCompletionTokens,
          stream: true,
          hasSignal: Boolean(signal),
        }),
        message,
        responseSummary: summarizeOpenAIResponse(
          (payload as { response?: unknown })?.response || payload
        ),
      });
      throw new Error(
        typeof message === "string" && message.trim()
          ? message
          : "OpenAI streaming response failed."
      );
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      if (block.trim()) {
        await processBlock(block);
      }
    }

    if (done) {
      break;
    }
  }

  if (buffer.trim()) {
    await processBlock(buffer);
  }

  const text = aggregatedText.trim();
  if (!text) {
    await openAiDiagnostics.error("generate_stream_empty_result", {
      failureKind: "empty_result",
      request: getOpenAiRequestMetadata({
        model,
        promptLength: prompt.length,
        maxCompletionTokens,
        stream: true,
        hasSignal: Boolean(signal),
      }),
      aggregatedLength: aggregatedText.length,
      finalResponseStatus,
      finalResponseSummary: finalResponseSummary || "missing",
    });
    throw new Error("OpenAI streaming response completed without text.");
  }

  if (finalResponseStatus === "incomplete") {
    await openAiDiagnostics.warn("generate_stream_truncated", {
      request: getOpenAiRequestMetadata({
        model,
        promptLength: prompt.length,
        maxCompletionTokens,
        stream: true,
        hasSignal: Boolean(signal),
      }),
      textLength: text.length,
      failureKind: "truncation",
      responseSummary: finalResponseSummary || "missing",
    });
    throw new Error(
      finalResponseSummary
        ? `OpenAI streaming response was truncated before completion. ${finalResponseSummary}`
        : "OpenAI streaming response was truncated before completion."
    );
  }

  await openAiDiagnostics.info("generate_stream_completed", {
    request: getOpenAiRequestMetadata({
      model,
      promptLength: prompt.length,
      maxCompletionTokens,
      stream: true,
      hasSignal: Boolean(signal),
    }),
    textLength: text.length,
    finalResponseStatus: finalResponseStatus || "completed",
  });
  return text;
}

export async function translateWithOpenAI(
  request: TranslateRequest,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = buildPrompt(request);
  await openAiDiagnostics.debug("translate_prompt_built", {
    model,
    requestId: request.id,
    textLength: request.text.length,
    targetLang: request.targetLang,
    hasContext: Boolean(request.context?.trim()),
    hasSpeaker: Boolean(request.speaker?.trim()),
  }, {
    requestId: String(request.id),
  });
  return generateWithOpenAI(prompt, apiKey, model);
}

export const openAiProviderInternals = {
  getOpenAiRequestMetadata,
  isGpt5FamilyModel,
  truncateForDiagnostics,
  getOpenAiResponseMetadata,
  classifyOpenAiFailure,
  summarizeOpenAIResponse,
  extractOpenAIText,
  isOpenAIResponseTruncated,
  parseSseEventBlock,
};
