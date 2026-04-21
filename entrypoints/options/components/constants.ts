import { LANGUAGE_OPTIONS } from "../../shared/language-metadata";
import { MEETING_ARCHIVE_RETENTION_DAY_OPTIONS } from "../../shared/meeting-archive-retention";
import type { UiTranslator } from "../../shared/i18n";

const UI_LANGUAGE_LABEL_KEYS = {
  en: "common.uiLanguage.locales.en",
  fa: "common.uiLanguage.locales.fa",
  ar: "common.uiLanguage.locales.ar",
  es: "common.uiLanguage.locales.es",
  fr: "common.uiLanguage.locales.fr",
  de: "common.uiLanguage.locales.de",
  pt: "common.uiLanguage.locales.pt",
  ru: "common.uiLanguage.locales.ru",
  hi: "common.uiLanguage.locales.hi",
  zh: "common.uiLanguage.locales.zh",
  ja: "common.uiLanguage.locales.ja",
  ko: "common.uiLanguage.locales.ko",
} as const;

export function getOpenAiModels(t: UiTranslator) {
  return [
    {
      id: "gpt-5-mini",
      name: "GPT-5 Mini",
      description: t("options.models.gpt5Mini.description"),
      badgeLabel: t("options.models.gpt5Mini.badge"),
      badgeTone: "accent",
    },
    {
      id: "gpt-5.2",
      name: "GPT-5.2",
      description: t("options.models.gpt52.description"),
      badgeLabel: t("options.models.gpt52.badge"),
      badgeTone: "warning",
    },
    {
      id: "gpt-5.1",
      name: "GPT-5.1",
      description: t("options.models.gpt51.description"),
    },
    {
      id: "gpt-5",
      name: "GPT-5",
      description: t("options.models.gpt5.description"),
      badgeLabel: t("options.models.gpt5.badge"),
      badgeTone: "warning",
    },
    {
      id: "gpt-5-nano",
      name: "GPT-5 Nano",
      description: t("options.models.gpt5Nano.description"),
      badgeLabel: t("options.models.gpt5Nano.badge"),
      badgeTone: "accent",
    },
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      description: t("options.models.gpt41.description"),
      badgeLabel: t("options.models.gpt41.badge"),
      badgeTone: "neutral",
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      description: t("options.models.gpt41Mini.description"),
      badgeLabel: t("options.models.gpt41Mini.badge"),
      badgeTone: "neutral",
    },
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      description: t("options.models.gpt41Nano.description"),
    },
  ] as const;
}

export function getLanguageOptions(t: UiTranslator) {
  return LANGUAGE_OPTIONS.map((language) => ({
    id: language.code,
    name:
      language.code in UI_LANGUAGE_LABEL_KEYS
        ? t(
            UI_LANGUAGE_LABEL_KEYS[
              language.code as keyof typeof UI_LANGUAGE_LABEL_KEYS
            ]
          )
        : language.name,
  }));
}

export function getMeetingArchiveRetentionOptions(t: UiTranslator) {
  return MEETING_ARCHIVE_RETENTION_DAY_OPTIONS.map((days) => ({
    id: String(days),
    name:
      days === 0
        ? t("options.workspace.meetingArchiveRetention.off")
        : days === 365
        ? t("options.workspace.meetingArchiveRetention.oneYear")
        : t("options.workspace.meetingArchiveRetention.days", { count: days }),
  }));
}
