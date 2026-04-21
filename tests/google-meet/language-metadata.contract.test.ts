import { describe, expect, test } from "vitest";
import { parseSharedSettingsPayload } from "../../entrypoints/background/cloud-sync/serialization";
import { getLanguageOptions } from "../../entrypoints/options/components/constants";
import {
  LANGUAGE_OPTIONS,
  getLanguageByCode,
  getLanguageDirection,
  getLanguageName,
  getLanguageNativeName,
  getLanguagePickerDescription,
  normalizeLanguageCode,
} from "../../entrypoints/shared/language-metadata";

describe("Live translation language metadata contracts", () => {
  test("LANG-001: the shared language catalog includes the expanded target-language set", () => {
    expect(LANGUAGE_OPTIONS.map((language) => language.code)).toEqual([
      "en",
      "vi",
      "fa",
      "zh",
      "ja",
      "ko",
      "es",
      "fr",
      "de",
      "pt",
      "ru",
      "ar",
      "hi",
      "bn",
      "ur",
      "tl",
      "ta",
      "uk",
      "ms",
      "sw",
      "te",
      "it",
      "th",
      "id",
      "nl",
      "pl",
      "tr",
    ]);
  });

  test("LANG-002: newly added languages resolve names and direction correctly", () => {
    expect(getLanguageByCode("bn")).toEqual({
      code: "bn",
      name: "Bengali",
      nativeName: "বাংলা",
      direction: "ltr",
    });
    expect(getLanguageName("ur")).toBe("Urdu");
    expect(getLanguageName("tl")).toBe("Filipino");
    expect(getLanguageName("ta")).toBe("Tamil");
    expect(getLanguageName("uk")).toBe("Ukrainian");
    expect(getLanguageName("ms")).toBe("Malay");
    expect(getLanguageName("sw")).toBe("Swahili");
    expect(getLanguageName("te")).toBe("Telugu");
    expect(getLanguageNativeName("fa")).toBe("فارسی");
    expect(getLanguagePickerDescription("fa")).toBe("Persian");
    expect(getLanguagePickerDescription("en")).toBeUndefined();
    expect(getLanguageDirection("ur")).toBe("rtl");
    expect(getLanguageDirection("bn")).toBe("ltr");
  });

  test("LANG-003: language normalization rejects unsupported codes and preserves supported ones", () => {
    expect(normalizeLanguageCode("sw", "en")).toBe("sw");
    expect(normalizeLanguageCode("fil", "tl")).toBe("tl");
    expect(normalizeLanguageCode("xx", "ur")).toBe("ur");
    expect(normalizeLanguageCode(undefined, "en")).toBe("en");
    expect(normalizeLanguageCode("xx", "xx")).toBe("en");
  });

  test("LANG-004: options selectors inherit the expanded catalog from the shared source of truth", () => {
    const t = ((key: string) => `__${key}__`) as Parameters<
      typeof getLanguageOptions
    >[0];

    const options = getLanguageOptions(t);

    expect(options).toHaveLength(LANGUAGE_OPTIONS.length);
    expect(options.find((option) => option.id === "bn")).toEqual({
      id: "bn",
      name: "Bengali",
    });
    expect(options.find((option) => option.id === "ur")).toEqual({
      id: "ur",
      name: "Urdu",
    });
    expect(options.find((option) => option.id === "tl")).toEqual({
      id: "tl",
      name: "Filipino",
    });
  });

  test("LANG-005: cloud-sync payload parsing normalizes invalid language codes safely", () => {
    const parsed = parseSharedSettingsPayload({
      model: "gpt-5-mini",
      targetLanguage: "xx",
      translationEnabled: true,
      customPrompt: "",
      meetingOutputLanguage: "bn",
      meetingProfiles: [],
      defaultMeetingProfileId: "default",
      appearance: "system",
      overlayVisible: true,
      captureStartupBehavior: "ask",
      captionActivationBehavior: "guided",
      sessionContinuationWindowMinutes: 120,
      overlayOpacity: 96,
      overlayClickThrough: false,
      storeMeetingChat: true,
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.targetLanguage).toBe("en");
    expect(parsed?.meetingOutputLanguage).toBe("bn");
  });
});
