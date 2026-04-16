import { beforeEach, describe, expect, test, vi } from "vitest";
import { RateLimitError } from "../../entrypoints/background/errors";
import { MODELS } from "../../entrypoints/background/constants";

const {
  getSettingsMock,
  recordSuccessMock,
  recordFailureMock,
  generateWithOpenAIMock,
  generateChunkWithOpenAIMock,
  translateWithOpenAIMock,
} = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  recordSuccessMock: vi.fn(),
  recordFailureMock: vi.fn(),
  generateWithOpenAIMock: vi.fn(),
  generateChunkWithOpenAIMock: vi.fn(),
  translateWithOpenAIMock: vi.fn(),
}));

vi.mock("../../entrypoints/background/settings", () => ({
  getSettings: getSettingsMock,
  recordOpenAiVerificationSuccess: recordSuccessMock,
  recordOpenAiVerificationFailure: recordFailureMock,
}));

vi.mock("../../entrypoints/background/providers/openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../entrypoints/background/providers/openai")>();
  return {
    ...actual,
    generateWithOpenAI: generateWithOpenAIMock,
    generateChunkWithOpenAI: generateChunkWithOpenAIMock,
    translateWithOpenAI: translateWithOpenAIMock,
  };
});

import {
  buildTranslationPrompt,
  generateText,
  generateTextChunk,
  translate,
} from "../../entrypoints/background/translation";

beforeEach(() => {
  vi.clearAllMocks();
  getSettingsMock.mockResolvedValue({
    settings: {
      openaiApiKey: "sk-live",
      model: "gpt-5.2",
      translationEnabled: true,
      verificationSnapshot: {
        status: "verified",
        message: "OpenAI is ready.",
        signature: JSON.stringify({
          service: "openai",
          apiKey: "sk-live",
          model: "gpt-5.2",
        }),
        verifiedAt: Date.now(),
      },
    },
  });
});

describe("Translation pipeline contract", () => {
  test("TRANS-001: generation/translation are blocked by readiness and translation-enabled gating", async () => {
    getSettingsMock.mockResolvedValueOnce({
      settings: {
        openaiApiKey: "",
        model: "gpt-5.2",
        translationEnabled: false,
        verificationSnapshot: null,
      },
    });
    const generationBlocked = await generateText("hello");
    expect(generationBlocked.success).toBe(false);
    expect(generationBlocked.error).toContain("Finish OpenAI setup");

    getSettingsMock.mockResolvedValueOnce({
      settings: {
        openaiApiKey: "sk-live",
        model: "gpt-5.2",
        translationEnabled: false,
        verificationSnapshot: {
          status: "verified",
          message: "OpenAI is ready.",
          signature: JSON.stringify({
            service: "openai",
            apiKey: "sk-live",
            model: "gpt-5.2",
          }),
          verifiedAt: Date.now(),
        },
      },
    });
    const translationBlocked = await translate({
      id: "tr-1",
      mode: "semantic",
      text: "hello",
      sourceLanguage: "en",
      targetLanguage: "fa",
      force: false,
    });
    expect(translationBlocked).toEqual({
      success: false,
      error: "Translation disabled",
    });
  });

  test("TRANS-002: provider retries model-ring only on rate-limit errors", async () => {
    generateWithOpenAIMock
      .mockRejectedValueOnce(new RateLimitError("rate limited"))
      .mockResolvedValueOnce("final text");

    const result = await generateText("retry test", 120);
    expect(result).toEqual({ success: true, text: "final text" });
    expect(generateWithOpenAIMock).toHaveBeenCalledTimes(2);
    expect(generateWithOpenAIMock.mock.calls[0]?.[2]).toBe("gpt-5.2");
    expect(generateWithOpenAIMock.mock.calls[1]?.[2]).toBe(
      MODELS[(MODELS.indexOf("gpt-5.2") + 1) % MODELS.length]
    );

    translateWithOpenAIMock
      .mockRejectedValueOnce(new RateLimitError("again"))
      .mockResolvedValueOnce("ترجمه");

    const translation = await translate({
      id: "tr-2",
      mode: "literal",
      text: "retry translate",
      sourceLanguage: "en",
      targetLanguage: "fa",
      force: true,
    });
    expect(translation.success).toBe(true);
    expect(translateWithOpenAIMock).toHaveBeenCalledTimes(2);
  });

  test("TRANS-003: success/failure update verification snapshots and expose provider-context debug errors", async () => {
    generateChunkWithOpenAIMock.mockResolvedValue({
      text: "chunk ok",
      truncated: false,
    });
    const chunkResult = await generateTextChunk("chunk prompt");
    expect(chunkResult).toEqual({
      success: true,
      text: "chunk ok",
      truncated: false,
    });
    expect(recordSuccessMock).toHaveBeenCalled();

    generateWithOpenAIMock.mockRejectedValueOnce(new Error("upstream failed"));
    const failedGeneration = await generateText("failure prompt");
    expect(failedGeneration.success).toBe(false);
    expect(failedGeneration.error).toContain("provider=openai; model=gpt-5.2");
    expect(recordFailureMock).toHaveBeenCalled();

    const prompt = buildTranslationPrompt({
      id: "tr-3",
      mode: "semantic",
      text: "Hello everyone",
      sourceLanguage: "en",
      targetLanguage: "fa",
      force: false,
    });
    expect(prompt).toContain("Hello everyone");
    expect(prompt.length).toBeGreaterThan(30);
  });
});
