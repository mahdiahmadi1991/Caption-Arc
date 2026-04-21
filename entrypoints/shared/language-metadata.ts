export type LanguageDirection = "ltr" | "rtl";

export type LanguageOption = {
  code: string;
  name: string;
  nativeName?: string;
  direction: LanguageDirection;
};

export const LANGUAGE_OPTIONS = [
  { code: "en", name: "English", nativeName: "English", direction: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", direction: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", direction: "rtl" },
  { code: "zh", name: "Chinese", nativeName: "中文", direction: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", direction: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", direction: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", direction: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl" },
  { code: "tl", name: "Filipino", nativeName: "Filipino", direction: "ltr" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", direction: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", direction: "ltr" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", direction: "ltr" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", direction: "ltr" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", direction: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", direction: "ltr" },
  { code: "th", name: "Thai", nativeName: "ไทย", direction: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", direction: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", direction: "ltr" },
  { code: "pl", name: "Polish", nativeName: "Polski", direction: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", direction: "ltr" },
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

export const getLanguageNativeName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.nativeName ?? language?.name ?? code;
};

export const getLanguagePickerDescription = (code: string): string | undefined => {
  const language = getLanguageByCode(code);
  if (!language) {
    return undefined;
  }

  if (!language.nativeName || language.nativeName === language.name) {
    return undefined;
  }

  return language.name;
};

export const getLanguageDirection = (code: string): LanguageDirection => {
  return getLanguageByCode(code)?.direction ?? "ltr";
};

export const detectTextDirection = (text: string): LanguageDirection => {
  const strongRtlPattern =
    /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

  return strongRtlPattern.test(text) ? "rtl" : "ltr";
};
