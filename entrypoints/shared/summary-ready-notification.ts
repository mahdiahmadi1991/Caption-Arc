import {
  DEFAULT_UI_LOCALE,
  isSupportedUiLocale,
  SUPPORTED_UI_LOCALES,
} from "./ui-language";

type SummaryReadyNotificationLocale = (typeof SUPPORTED_UI_LOCALES)[number];

const SUMMARY_READY_NOTIFICATION_COPY: Record<
  SummaryReadyNotificationLocale,
  {
    title: string;
    message: string;
  }
> = {
  en: {
    title: "Summary ready for {title}",
    message: "Click to open the full summary in Meeting History.",
  },
  fa: {
    title: "{title}: خلاصه آماده است",
    message: "برای باز کردن خلاصه کامل در تاریخچه جلسات کلیک کنید.",
  },
  ar: {
    title: "الملخص جاهز: {title}",
    message: "انقر لفتح الملخص الكامل في سجل الاجتماعات.",
  },
  es: {
    title: "Resumen listo para {title}",
    message: "Haz clic para abrir el resumen completo en el historial de reuniones.",
  },
  fr: {
    title: "Résumé prêt pour {title}",
    message: "Cliquez pour ouvrir le résumé complet dans l'historique des réunions.",
  },
  de: {
    title: "Zusammenfassung für {title} ist fertig",
    message: "Klicken Sie, um die vollständige Zusammenfassung im Besprechungsverlauf zu öffnen.",
  },
  pt: {
    title: "Resumo pronto para {title}",
    message: "Clique para abrir o resumo completo no histórico de reuniões.",
  },
  ru: {
    title: "Сводка для {title} готова",
    message: "Нажмите, чтобы открыть полную сводку в истории встреч.",
  },
  hi: {
    title: "{title} के लिए सारांश तैयार है",
    message: "मीटिंग इतिहास में पूरा सारांश खोलने के लिए क्लिक करें।",
  },
  zh: {
    title: "{title} 的摘要已准备就绪",
    message: "点击可在会议历史中打开完整摘要。",
  },
  ja: {
    title: "{title} の要約が準備できました",
    message: "クリックすると会議履歴で完全な要約を開きます。",
  },
  ko: {
    title: "{title} 요약이 준비되었습니다",
    message: "클릭하여 회의 기록에서 전체 요약을 여세요.",
  },
};

function normalizeNotificationLocale(
  browserLocale: string | null | undefined
): SummaryReadyNotificationLocale {
  if (typeof browserLocale !== "string") {
    return DEFAULT_UI_LOCALE;
  }

  const normalizedLocale = browserLocale.trim().replace(/_/g, "-").toLowerCase();
  const [baseLocale] = normalizedLocale.split("-");

  return isSupportedUiLocale(baseLocale) ? baseLocale : DEFAULT_UI_LOCALE;
}

export function getSummaryReadyNotificationCopy(params: {
  browserLocale?: string | null;
  title: string;
}): {
  locale: SummaryReadyNotificationLocale;
  title: string;
  message: string;
} {
  const locale = normalizeNotificationLocale(params.browserLocale);
  const copy = SUMMARY_READY_NOTIFICATION_COPY[locale];

  return {
    locale,
    title: copy.title.replace("{title}", params.title),
    message: copy.message,
  };
}