import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../entrypoints/background/diagnostics", () => ({
  createBackgroundDiagnosticsLogger: vi.fn(() => ({
    trace: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
  })),
}));

import {
  generateStreamWithOpenAI,
  generateWithOpenAI,
  openAiProviderInternals,
} from "../../entrypoints/background/providers/openai";

function createSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
}

describe("Assistant OpenAI stream contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("aggregates ordered SSE deltas and forwards incremental updates", async () => {
    const onTextDelta = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        createSseResponse([
          'event: response.output_text.delta\ndata: {"delta":"Hel"}\n\n',
          'event: response.output_text.delta\ndata: {"delta":"lo"}\n\n',
          'event: response.completed\ndata: {"response":{"status":"completed"}}\n\n',
          "data: [DONE]\n\n",
        ])
      )
    );

    const result = await generateStreamWithOpenAI(
      "prompt",
      "sk-live",
      "gpt-5-mini",
      { onTextDelta }
    );

    expect(result).toBe("Hello");
    expect(onTextDelta).toHaveBeenCalledTimes(2);
    expect(onTextDelta.mock.calls[0]).toEqual(["Hel", "Hel"]);
    expect(onTextDelta.mock.calls[1]).toEqual(["lo", "Hello"]);
  });

  test("throws when the stream ends with response.incomplete after producing partial text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        createSseResponse([
          'event: response.output_text.delta\ndata: {"delta":"Partial answer"}\n\n',
          'event: response.incomplete\ndata: {"response":{"status":"incomplete","incomplete_details":{"reason":"max_output_tokens"}}}\n\n',
          "data: [DONE]\n\n",
        ])
      )
    );

    await expect(
      generateStreamWithOpenAI("prompt", "sk-live", "gpt-5-mini", {})
    ).rejects.toThrow(/truncated before completion/i);
  });

  test("non-stream generation throws when the final response is truncated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: "incomplete",
            output_text: "Partial text",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      )
    );

    await expect(
      generateWithOpenAI("prompt", "sk-live", "gpt-5-mini")
    ).rejects.toThrow(/truncated before completion/i);
  });

  test("parseSseEventBlock extracts event names and multi-line data payloads deterministically", () => {
    expect(
      openAiProviderInternals.parseSseEventBlock(
        'event: response.completed\ndata: {"status":"completed"}\ndata: {"done":true}'
      )
    ).toEqual({
      event: "response.completed",
      data: '{"status":"completed"}\n{"done":true}',
    });
  });
});
