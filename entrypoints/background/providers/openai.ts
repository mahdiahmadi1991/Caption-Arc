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
    model,
    promptLength: prompt.length,
    maxCompletionTokens,
    hasSignal: Boolean(signal),
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
      model,
      status: response.status,
      error,
    });
    if (response.status === 429) {
      throw new RateLimitError(`OpenAI rate limit: ${error}`);
    }
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  await openAiDiagnostics.info("generate_chunk_completed", {
    model,
    truncated: isOpenAIResponseTruncated(data),
    responseSummary: summarizeOpenAIResponse(data),
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
    model,
    promptLength: prompt.length,
    maxCompletionTokens,
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
      model,
      textLength: chunk.text.length,
    });
    throw new Error("OpenAI response was truncated before completion.");
  }

  await openAiDiagnostics.info("generate_text_completed", {
    model,
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
    model,
    promptLength: prompt.length,
    maxCompletionTokens,
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
      model,
      status: response.status,
      error,
    });
    if (response.status === 429) {
      throw new RateLimitError(`OpenAI rate limit: ${error}`);
    }
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  if (!response.body) {
    await openAiDiagnostics.error("generate_stream_missing_body", {
      model,
    });
    throw new Error("OpenAI streaming response body is missing.");
  }

  await openAiDiagnostics.debug("generate_stream_connected", {
    model,
    status: response.status,
  });

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  let aggregatedText = "";

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
        model,
        event,
        dataLength: data.length,
      });
      return;
    }

    if (event === "response.output_text.delta") {
      const delta = (payload as { delta?: unknown })?.delta;
      if (typeof delta === "string" && delta.length > 0) {
        aggregatedText += delta;
        await openAiDiagnostics.trace("generate_stream_delta_received", {
          model,
          deltaLength: delta.length,
          aggregatedLength: aggregatedText.length,
        });
        await handlers.onTextDelta?.(delta, aggregatedText);
      }
      return;
    }

    if (event === "response.error") {
      const message =
        (payload as { error?: { message?: unknown } })?.error?.message;
      await openAiDiagnostics.error("generate_stream_response_error", {
        model,
        message,
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
      model,
      aggregatedLength: aggregatedText.length,
    });
    throw new Error("OpenAI streaming response completed without text.");
  }

  await openAiDiagnostics.info("generate_stream_completed", {
    model,
    textLength: text.length,
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
