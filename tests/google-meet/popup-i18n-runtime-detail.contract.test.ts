import { describe, expect, test } from "vitest";
import {
  getSetupStatus,
  resolvePopupSummaryDetail,
} from "../../entrypoints/popup/App";
import { createTranslator } from "../../entrypoints/shared/i18n";
import type { OpenAiServiceAvailability } from "../../entrypoints/shared/openai-service";
import type { SummaryJobStatus } from "../../entrypoints/shared/summary-generation";

function createOpenAiAvailability(
  overrides: Partial<OpenAiServiceAvailability> = {}
): OpenAiServiceAvailability {
  return {
    state: "unavailable",
    configured: true,
    operational: false,
    message: "",
    snapshot: null,
    ...overrides,
  };
}

function createSummaryJobStatus(
  overrides: Partial<SummaryJobStatus> = {}
): SummaryJobStatus {
  return {
    sessionId: "session-1",
    state: "synthesizing",
    message: "",
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("Popup i18n runtime detail contract", () => {
  test("POP-I18N-001: unavailable OpenAI setup keeps localized label and shows runtime detail when present", () => {
    const t = createTranslator("fa");
    const availability = createOpenAiAvailability({
      message: "OpenAI rejected the current API setup.",
    });

    const status = getSetupStatus(availability, t);

    expect(status.label).toBe(t("popup.setup.needsAttention.label"));
    expect(status.description).toBe("OpenAI rejected the current API setup.");
  });

  test("POP-I18N-002: unavailable OpenAI setup falls back to localized detail only when runtime detail is empty", () => {
    const t = createTranslator("fa");
    const availability = createOpenAiAvailability({ message: "   " });

    const status = getSetupStatus(availability, t);

    expect(status.description).toBe(t("popup.setup.needsAttention.description"));
  });

  test("POP-I18N-003: active summary states prefer SummaryJobStatus.message", () => {
    const fallback = createTranslator("fa")("popup.rows.summary.busy.detail");

    expect(
      resolvePopupSummaryDetail(
        createSummaryJobStatus({
          state: "synthesizing",
          message: "Assembling your recap from the latest meeting chunks.",
        }),
        fallback
      )
    ).toBe("Assembling your recap from the latest meeting chunks.");
  });

  test("POP-I18N-004: failed summary states prefer runtime detail and otherwise use localized fallback", () => {
    const fallback = createTranslator("fa")("popup.rows.summary.failed.detail");

    expect(
      resolvePopupSummaryDetail(
        createSummaryJobStatus({
          state: "failed",
          message: "OpenAI timed out while generating the summary.",
        }),
        fallback
      )
    ).toBe("OpenAI timed out while generating the summary.");

    expect(
      resolvePopupSummaryDetail(
        createSummaryJobStatus({
          state: "failed",
          message: "",
        }),
        fallback
      )
    ).toBe(fallback);
  });
});