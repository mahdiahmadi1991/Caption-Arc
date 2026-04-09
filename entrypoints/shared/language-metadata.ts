export type LanguageDirection = "ltr" | "rtl";

export type LanguageOption = {
  code: string;
  name: string;
  direction: LanguageDirection;
};

export const LANGUAGE_OPTIONS = [
  { code: "en", name: "English", direction: "ltr" },
  { code: "vi", name: "Vietnamese", direction: "ltr" },
  { code: "fa", name: "Persian", direction: "rtl" },
  { code: "zh", name: "Chinese", direction: "ltr" },
  { code: "ja", name: "Japanese", direction: "ltr" },
  { code: "ko", name: "Korean", direction: "ltr" },
  { code: "es", name: "Spanish", direction: "ltr" },
  { code: "fr", name: "French", direction: "ltr" },
  { code: "de", name: "German", direction: "ltr" },
  { code: "pt", name: "Portuguese", direction: "ltr" },
  { code: "ru", name: "Russian", direction: "ltr" },
  { code: "ar", name: "Arabic", direction: "rtl" },
  { code: "hi", name: "Hindi", direction: "ltr" },
  { code: "bn", name: "Bengali", direction: "ltr" },
  { code: "ur", name: "Urdu", direction: "rtl" },
  { code: "tl", name: "Filipino", direction: "ltr" },
  { code: "ta", name: "Tamil", direction: "ltr" },
  { code: "uk", name: "Ukrainian", direction: "ltr" },
  { code: "ms", name: "Malay", direction: "ltr" },
  { code: "sw", name: "Swahili", direction: "ltr" },
  { code: "te", name: "Telugu", direction: "ltr" },
  { code: "it", name: "Italian", direction: "ltr" },
  { code: "th", name: "Thai", direction: "ltr" },
  { code: "id", name: "Indonesian", direction: "ltr" },
  { code: "nl", name: "Dutch", direction: "ltr" },
  { code: "pl", name: "Polish", direction: "ltr" },
  { code: "tr", name: "Turkish", direction: "ltr" },
] as const satisfies readonly LanguageOption[];

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

const LANGUAGE_OPTIONS_BY_CODE = new Map(
  LANGUAGE_OPTIONS.map((language) => [language.code, language] as const)
);

export const getLanguageByCode = (code: string): LanguageOption | undefined => {
  return LANGUAGE_OPTIONS_BY_CODE.get(code);
};

export const isSupportedLanguageCode = (code: string): code is LanguageCode => {
  return LANGUAGE_OPTIONS_BY_CODE.has(code);
};

export const normalizeLanguageCode = (
  code: unknown,
  fallback: string = "en"
): LanguageCode => {
  if (typeof code === "string" && isSupportedLanguageCode(code)) {
    return code;
  }

  return isSupportedLanguageCode(fallback) ? fallback : "en";
};

export const getLanguageName = (code: string): string => {
  return getLanguageByCode(code)?.name ?? code;
};

export const getLanguageDirection = (code: string): LanguageDirection => {
  return getLanguageByCode(code)?.direction ?? "ltr";
};

export const detectTextDirection = (text: string): LanguageDirection => {
  const strongRtlPattern =
    /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

  return strongRtlPattern.test(text) ? "rtl" : "ltr";
};
