import { describe, expect, test } from "vitest";
import { createDefaultSettings } from "../../entrypoints/shared/settings-defaults";
import {
  getLegalRiskSettingIdForChange,
  hasLegalRiskAcknowledgement,
  isLegalRiskSettingActive,
  shouldPromptForLegalRiskAcknowledgement,
} from "../../entrypoints/options/legal-risk-settings";

describe("Legal risk settings contract", () => {
  test("LRISK-001: risky setting changes map to the expected acknowledgement ids", () => {
    expect(
      getLegalRiskSettingIdForChange("storeMeetingChat", true)
    ).toBe("storeMeetingChat");
    expect(
      getLegalRiskSettingIdForChange("captureStartupBehavior", "always")
    ).toBe("captureStartupAlways");
    expect(
      getLegalRiskSettingIdForChange("captionActivationBehavior", "automatic")
    ).toBe("captionActivationAutomatic");
    expect(
      getLegalRiskSettingIdForChange("storeMeetingChat", false)
    ).toBeNull();
  });

  test("LRISK-002: prompt decisions only fire for first-time activations of risky states", () => {
    const settings = createDefaultSettings();

    expect(settings.storeMeetingChat).toBe(false);

    expect(
      shouldPromptForLegalRiskAcknowledgement(
        settings,
        "storeMeetingChat",
        true
      )
    ).toBe("storeMeetingChat");

    expect(
      shouldPromptForLegalRiskAcknowledgement(
        { ...settings, storeMeetingChat: false },
        "storeMeetingChat",
        true
      )
    ).toBe("storeMeetingChat");

    expect(
      shouldPromptForLegalRiskAcknowledgement(
        {
          ...settings,
          storeMeetingChat: false,
          legalRiskAcknowledgements: { storeMeetingChat: Date.now() },
        },
        "storeMeetingChat",
        true
      )
    ).toBeNull();
  });

  test("LRISK-003: helper status functions reflect active risky states and acknowledgements", () => {
    const settings = {
      ...createDefaultSettings(),
      captureStartupBehavior: "always" as const,
      captionActivationBehavior: "automatic" as const,
      legalRiskAcknowledgements: {
        captureStartupAlways: 123,
      },
    };

    expect(
      isLegalRiskSettingActive(settings, "captureStartupAlways")
    ).toBe(true);
    expect(
      isLegalRiskSettingActive(settings, "captionActivationAutomatic")
    ).toBe(true);
    expect(
      hasLegalRiskAcknowledgement(settings, "captureStartupAlways")
    ).toBe(true);
    expect(
      hasLegalRiskAcknowledgement(settings, "storeMeetingChat")
    ).toBe(false);
  });
});
