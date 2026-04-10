import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SummaryProfile } from "../background/types";
import type { CloudSyncProvider } from "../background/types";
import type {
  CloudSyncProviderCheckpoint,
  CloudSyncProviderHealthState,
} from "../background/cloud-sync/types";
import {
  ApiKeyInput,
  getLanguageOptions,
  getOpenAiModels,
  Select,
  TextArea,
  Toggle,
} from "./components";
import { useSettings } from "./use-settings";
import { ThemeToggle } from "../shared/theme-toggle";
import { useResolvedTheme } from "../shared/use-resolved-theme";
import { IconButton } from "../shared/icon-button";
import { Tooltip } from "../shared/tooltip";
import { BrandLockup } from "../shared/brand";
import { ConfirmDialog } from "../meeting-history/components/confirm-dialog";
import {
  ArchiveIcon,
  BeakerIcon,
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  ExportIcon,
  GearIcon,
  PlusIcon,
  RefreshIcon,
  SparklesIcon,
  TrashIcon,
} from "../shared/icons";
import {
  createDefaultAssistantConfig,
  isProtectedSummaryProfile,
} from "../shared/summary-profiles";
import { useCloudSync } from "./use-cloud-sync";
import {
  MAX_SESSION_CONTINUATION_WINDOW_MINUTES,
  MIN_SESSION_CONTINUATION_WINDOW_MINUTES,
  SESSION_CONTINUATION_WINDOW_MINUTE_STOPS,
} from "../shared/settings-defaults";
import { DiagnosticsConsole } from "./diagnostics-console";
import { AppLoadingScreen } from "../shared/loading-screen";
import {
  SUPPORTED_UI_LOCALES,
  useI18n,
  useT,
  type UiTranslator,
} from "../shared/i18n";
import {
  DYNAMIC_TEXT_STYLE,
  getDynamicTextDirection,
} from "../shared/text-direction";

const CAPTURE_STARTUP_OPTION_IDS = ["off", "ask", "always"] as const;
const CAPTION_ACTIVATION_OPTION_IDS = ["guided", "automatic"] as const;
const SETTINGS_SECTION_IDS = [
  "workspace",
  "openai-service",
  "translation",
  "profiles",
  "cloud-sync",
  "data-recovery",
] as const;
const UI_LANGUAGE_LOCALE_OPTIONS = SUPPORTED_UI_LOCALES;
const OPENAI_SERVICE_HIGHLIGHT_KEYS = [
  "translation",
  "summaries",
  "assistant",
] as const;

type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

function getSettingsSections(t: UiTranslator) {
  return [
    {
      id: "workspace",
      eyebrow: t("options.sections.workspace.eyebrow"),
      title: t("options.sections.workspace.title"),
      shortLabel: t("options.sections.workspace.shortLabel"),
      mapHint: t("options.sections.workspace.mapHint"),
      description: t("options.sections.workspace.description"),
    },
    {
      id: "openai-service",
      eyebrow: t("options.sections.openAiService.eyebrow"),
      title: t("options.sections.openAiService.title"),
      shortLabel: t("options.sections.openAiService.shortLabel"),
      mapHint: t("options.sections.openAiService.mapHint"),
      description: t("options.sections.openAiService.description"),
    },
    {
      id: "translation",
      eyebrow: t("options.sections.translation.eyebrow"),
      title: t("options.sections.translation.title"),
      shortLabel: t("options.sections.translation.shortLabel"),
      mapHint: t("options.sections.translation.mapHint"),
      description: t("options.sections.translation.description"),
    },
    {
      id: "profiles",
      eyebrow: t("options.sections.profiles.eyebrow"),
      title: t("options.sections.profiles.title"),
      shortLabel: t("options.sections.profiles.shortLabel"),
      mapHint: t("options.sections.profiles.mapHint"),
      description: t("options.sections.profiles.description"),
    },
    {
      id: "cloud-sync",
      eyebrow: t("options.sections.cloudSync.eyebrow"),
      title: t("options.sections.cloudSync.title"),
      shortLabel: t("options.sections.cloudSync.shortLabel"),
      mapHint: t("options.sections.cloudSync.mapHint"),
      description: t("options.sections.cloudSync.description"),
    },
    {
      id: "data-recovery",
      eyebrow: t("options.sections.dataRecovery.eyebrow"),
      title: t("options.sections.dataRecovery.title"),
      shortLabel: t("options.sections.dataRecovery.shortLabel"),
      mapHint: t("options.sections.dataRecovery.mapHint"),
      description: t("options.sections.dataRecovery.description"),
    },
  ] as const;
}

function getCaptureStartupOptions(t: UiTranslator) {
  return CAPTURE_STARTUP_OPTION_IDS.map((id) => ({
    id,
    name: t(`options.workspace.captureStartup.${id}.name`),
    description: t(`options.workspace.captureStartup.${id}.description`),
  }));
}

function getCaptionActivationOptions(t: UiTranslator) {
  return CAPTION_ACTIVATION_OPTION_IDS.map((id) => ({
    id,
    name: t(`options.workspace.captionActivation.${id}.name`),
    description: t(`options.workspace.captionActivation.${id}.description`),
  }));
}

function getUiLanguageOptions(t: UiTranslator) {
  return [
    {
      id: "system",
      name: t("common.uiLanguage.system"),
      description: t("common.uiLanguage.description"),
    },
    ...UI_LANGUAGE_LOCALE_OPTIONS.map((locale) => ({
      id: locale,
      name: t(`common.uiLanguage.locales.${locale}`),
    })),
  ];
}

function formatSessionContinuationWindowLabel(
  minutes: number,
  t: UiTranslator
): string {
  if (minutes <= 0) {
    return t("options.workspace.sessionContinuation.off");
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1
      ? t("options.workspace.sessionContinuation.oneHour")
      : t("options.workspace.sessionContinuation.hours", { count: hours });
  }

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return t("options.workspace.sessionContinuation.hoursMinutes", {
      hours,
      minutes: remainingMinutes,
    });
  }

  return t("options.workspace.sessionContinuation.minutes", { minutes });
}

function getSessionContinuationWindowStopIndex(minutes: number): number {
  const exactIndex = SESSION_CONTINUATION_WINDOW_MINUTE_STOPS.indexOf(
    minutes as (typeof SESSION_CONTINUATION_WINDOW_MINUTE_STOPS)[number]
  );
  if (exactIndex >= 0) {
    return exactIndex;
  }

  let closestIndex = 0;
  let smallestDistance = Number.POSITIVE_INFINITY;
  SESSION_CONTINUATION_WINDOW_MINUTE_STOPS.forEach((stop, index) => {
    const distance = Math.abs(stop - minutes);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function getSummaryGenerationModeOptions(t: UiTranslator) {
  return [
    {
      id: "economy",
      name: t("options.profiles.summary.modes.economy.name"),
      description: t("options.profiles.summary.modes.economy.description"),
      badgeLabel: t("options.profiles.summary.modes.economy.badge"),
      badgeTone: "accent",
    },
    {
      id: "balanced",
      name: t("options.profiles.summary.modes.balanced.name"),
      description: t("options.profiles.summary.modes.balanced.description"),
    },
    {
      id: "thorough",
      name: t("options.profiles.summary.modes.thorough.name"),
      description: t("options.profiles.summary.modes.thorough.description"),
      badgeLabel: t("options.profiles.summary.modes.thorough.badge"),
      badgeTone: "warning",
    },
  ] as const;
}

const SUMMARY_PROFILE_NAME_MAX_LENGTH = 80;
const SUMMARY_PROFILE_DESCRIPTION_MAX_LENGTH = 160;
const SUMMARY_PROFILE_PROMPT_MAX_LENGTH = 5000;
const ASSISTANT_PROFILE_PROMPT_MAX_LENGTH = 3000;
const CUSTOM_TRANSLATION_INSTRUCTIONS_MAX_LENGTH = 1800;

function getAssistantResponseIntentOptions(t: UiTranslator) {
  return [
    {
      id: "answer_for_me",
      name: t("options.profiles.assistant.intents.answerForMe.name"),
      description: t(
        "options.profiles.assistant.intents.answerForMe.description"
      ),
    },
    {
      id: "improve_my_answer",
      name: t("options.profiles.assistant.intents.improveMyAnswer.name"),
      description: t(
        "options.profiles.assistant.intents.improveMyAnswer.description"
      ),
    },
    {
      id: "suggest_next_point",
      name: t("options.profiles.assistant.intents.suggestNextPoint.name"),
      description: t(
        "options.profiles.assistant.intents.suggestNextPoint.description"
      ),
    },
    {
      id: "summarize_what_was_just_said",
      name: t(
        "options.profiles.assistant.intents.summarizeRecentTurn.name"
      ),
      description: t(
        "options.profiles.assistant.intents.summarizeRecentTurn.description"
      ),
    },
    {
      id: "surface_risks",
      name: t("options.profiles.assistant.intents.surfaceRisks.name"),
      description: t(
        "options.profiles.assistant.intents.surfaceRisks.description"
      ),
    },
    {
      id: "coach_me",
      name: t("options.profiles.assistant.intents.coachMe.name"),
      description: t("options.profiles.assistant.intents.coachMe.description"),
    },
  ] as const;
}

function getAssistantResponseFormatOptions(t: UiTranslator) {
  return [
    {
      id: "bullets",
      name: t("options.profiles.assistant.formats.bullets.name"),
      description: t("options.profiles.assistant.formats.bullets.description"),
      badgeLabel: t("options.profiles.assistant.formats.bullets.badge"),
      badgeTone: "accent",
    },
    {
      id: "talking_points",
      name: t("options.profiles.assistant.formats.talkingPoints.name"),
      description: t(
        "options.profiles.assistant.formats.talkingPoints.description"
      ),
    },
    {
      id: "short_paragraph",
      name: t("options.profiles.assistant.formats.shortParagraph.name"),
      description: t(
        "options.profiles.assistant.formats.shortParagraph.description"
      ),
    },
    {
      id: "structured_sections",
      name: t("options.profiles.assistant.formats.structuredSections.name"),
      description: t(
        "options.profiles.assistant.formats.structuredSections.description"
      ),
      badgeLabel: t(
        "options.profiles.assistant.formats.structuredSections.badge"
      ),
      badgeTone: "warning",
    },
    {
      id: "script",
      name: t("options.profiles.assistant.formats.script.name"),
      description: t("options.profiles.assistant.formats.script.description"),
    },
  ] as const;
}

function getAssistantResponseDepthOptions(t: UiTranslator) {
  return [
    {
      id: "ultra_brief",
      name: t("options.profiles.assistant.depths.ultraBrief.name"),
      description: t(
        "options.profiles.assistant.depths.ultraBrief.description"
      ),
      badgeLabel: t("options.profiles.assistant.depths.ultraBrief.badge"),
      badgeTone: "accent",
    },
    {
      id: "brief",
      name: t("options.profiles.assistant.depths.brief.name"),
      description: t("options.profiles.assistant.depths.brief.description"),
    },
    {
      id: "standard",
      name: t("options.profiles.assistant.depths.standard.name"),
      description: t("options.profiles.assistant.depths.standard.description"),
    },
    {
      id: "expanded",
      name: t("options.profiles.assistant.depths.expanded.name"),
      description: t("options.profiles.assistant.depths.expanded.description"),
      badgeLabel: t("options.profiles.assistant.depths.expanded.badge"),
      badgeTone: "warning",
    },
  ] as const;
}

function getAssistantResponseToneOptions(t: UiTranslator) {
  return [
    {
      id: "neutral",
      name: t("options.profiles.assistant.tones.neutral.name"),
      description: t("options.profiles.assistant.tones.neutral.description"),
    },
    {
      id: "direct",
      name: t("options.profiles.assistant.tones.direct.name"),
      description: t("options.profiles.assistant.tones.direct.description"),
    },
    {
      id: "supportive",
      name: t("options.profiles.assistant.tones.supportive.name"),
      description: t(
        "options.profiles.assistant.tones.supportive.description"
      ),
    },
    {
      id: "confident",
      name: t("options.profiles.assistant.tones.confident.name"),
      description: t(
        "options.profiles.assistant.tones.confident.description"
      ),
    },
    {
      id: "analytical",
      name: t("options.profiles.assistant.tones.analytical.name"),
      description: t(
        "options.profiles.assistant.tones.analytical.description"
      ),
    },
  ] as const;
}

function getAssistantDeliveryBiasOptions(t: UiTranslator) {
  return [
    {
      id: "fastest",
      name: t("options.profiles.assistant.delivery.fastest.name"),
      description: t("options.profiles.assistant.delivery.fastest.description"),
      badgeLabel: t("options.profiles.assistant.delivery.fastest.badge"),
      badgeTone: "accent",
    },
    {
      id: "balanced",
      name: t("options.profiles.assistant.delivery.balanced.name"),
      description: t(
        "options.profiles.assistant.delivery.balanced.description"
      ),
    },
    {
      id: "careful",
      name: t("options.profiles.assistant.delivery.careful.name"),
      description: t("options.profiles.assistant.delivery.careful.description"),
      badgeLabel: t("options.profiles.assistant.delivery.careful.badge"),
      badgeTone: "warning",
    },
  ] as const;
}

function getAssistantTriggerPolicyOptions(t: UiTranslator) {
  return [
    {
      id: "questions_requests_only",
      name: t(
        "options.profiles.assistant.trigger.questionsAndRequests.name"
      ),
      description: t(
        "options.profiles.assistant.trigger.questionsAndRequests.description"
      ),
      badgeLabel: t(
        "options.profiles.assistant.trigger.questionsAndRequests.badge"
      ),
      badgeTone: "accent",
    },
    {
      id: "salience_first",
      name: t("options.profiles.assistant.trigger.salienceFirst.name"),
      description: t(
        "options.profiles.assistant.trigger.salienceFirst.description"
      ),
    },
    {
      id: "proactive",
      name: t("options.profiles.assistant.trigger.proactive.name"),
      description: t("options.profiles.assistant.trigger.proactive.description"),
      badgeLabel: t("options.profiles.assistant.trigger.proactive.badge"),
      badgeTone: "warning",
    },
  ] as const;
}

function getAssistantParticipantScopeOptions(t: UiTranslator) {
  return [
    {
      id: "all_participants",
      name: t("options.profiles.assistant.scope.everyone.name"),
      description: t("options.profiles.assistant.scope.everyone.description"),
      badgeLabel: t("options.profiles.assistant.scope.everyone.badge"),
      badgeTone: "warning",
    },
    {
      id: "others_only",
      name: t("options.profiles.assistant.scope.othersOnly.name"),
      description: t(
        "options.profiles.assistant.scope.othersOnly.description"
      ),
      badgeLabel: t("options.profiles.assistant.scope.othersOnly.badge"),
      badgeTone: "accent",
    },
  ] as const;
}

function getCloudSyncProviderDetails(t: UiTranslator) {
  return [
    {
      id: "google-drive" as const,
      title: t("options.cloudSync.providers.googleDrive.title"),
      subtitle: t("options.cloudSync.providers.googleDrive.subtitle"),
    },
    {
      id: "onedrive" as const,
      title: t("options.cloudSync.providers.oneDrive.title"),
      subtitle: t("options.cloudSync.providers.oneDrive.subtitle"),
    },
  ] as const;
}

const CLOUD_SYNC_PROVIDER_BADGE_CLASSNAMES: Record<
  CloudSyncProvider,
  string
> = {
  "google-drive":
    "border-[color:color-mix(in_srgb,var(--app-accent)_12%,white)] bg-[linear-gradient(180deg,#ffffff,#f9fbff)] text-[#2563eb] shadow-[0_16px_30px_rgba(15,23,42,0.08)]",
  onedrive:
    "border-[color:color-mix(in_srgb,var(--app-accent)_12%,white)] bg-[linear-gradient(180deg,#ffffff,#f8fbff)] text-[#2563eb] shadow-[0_16px_30px_rgba(15,23,42,0.08)]",
};

type CloudSyncProviderLogoProps = {
  provider: CloudSyncProvider;
  className?: string;
};

const CloudSyncProviderLogo = ({
  provider,
  className = "h-5 w-5",
}: CloudSyncProviderLogoProps) => {
  if (provider === "google-drive") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M9.15 3.6h5.25l6.2 10.65h-5.25L9.15 3.6Z"
          fill="#0F9D58"
        />
        <path
          d="M8.45 4.75 2.4 14.8l2.65 4.6 6.05-10.1-2.65-4.55Z"
          fill="#F4B400"
        />
        <path
          d="M8.65 15.45h12.2l-2.55 4.45H6.05l2.6-4.45Z"
          fill="#4285F4"
        />
        <path d="M11.2 9.3h4.05l-2.02 3.53H9.18L11.2 9.3Z" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M7.45 18.3h10.25c2.63 0 4.55-1.7 4.55-4.03 0-2.1-1.63-3.78-3.75-3.98-.6-3.12-3.34-5.39-6.62-5.39-2.95 0-5.56 1.87-6.44 4.56-2.14.19-3.69 1.83-3.69 3.9 0 2.34 1.98 4.94 5.7 4.94Z"
        fill="#0078D4"
      />
      <path
        d="M11.15 9.65c.56-1.2 1.86-2 3.35-2 1.94 0 3.59 1.3 3.98 3.11 1.22.15 2.17 1.03 2.17 2.1 0 1.22-1.15 2.2-2.58 2.2H8.7c-1.42 0-2.58-.98-2.58-2.2 0-1.11.95-1.99 2.23-2.11.47-.17.84-.52 1.09-1.1.04 0 .62 0 1.71 0Z"
        fill="#50E6FF"
      />
      <path
        d="M10.3 11.85c.28-.98 1.29-1.73 2.48-1.73 1.34 0 2.49.94 2.72 2.23.95.09 1.68.74 1.68 1.51 0 .86-.85 1.57-1.9 1.57h-5.7c-1.09 0-1.97-.71-1.97-1.57 0-.79.74-1.45 1.72-1.52.39-.1.7-.48.97-1.12Z"
        fill="#B9F3FF"
      />
    </svg>
  );
};

type CloudSyncProviderBadgeProps = {
  provider: CloudSyncProvider;
  size?: "sm" | "md";
};

const CloudSyncProviderBadge = ({
  provider,
  size = "md",
}: CloudSyncProviderBadgeProps) => {
  const sizeClassName =
    size === "sm" ? "h-10 w-10 rounded-[1.35rem]" : "h-12 w-12 rounded-[1.55rem]";
  const iconClassName = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <span
      className={`inline-flex ${sizeClassName} shrink-0 items-center justify-center border ${CLOUD_SYNC_PROVIDER_BADGE_CLASSNAMES[provider]}`}
    >
      <CloudSyncProviderLogo provider={provider} className={iconClassName} />
    </span>
  );
};

function getCloudSyncScopeShared(t: UiTranslator) {
  return [
    t("options.cloudSync.scope.shared.meetingSessions"),
    t("options.cloudSync.scope.shared.translations"),
    t("options.cloudSync.scope.shared.summaries"),
    t("options.cloudSync.scope.shared.summaryProfiles"),
    t("options.cloudSync.scope.shared.sharedSettings"),
  ];
}

function getCloudSyncScopeLocal(t: UiTranslator) {
  return [
    t("options.cloudSync.scope.local.apiKeys"),
    t("options.cloudSync.scope.local.verificationStatus"),
    t("options.cloudSync.scope.local.deviceIdentity"),
  ];
}

type SurfacePanelProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

function SurfacePanel({ id, children, className }: SurfacePanelProps) {
  return (
    <div
      id={id}
      className={[
        "rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

type SettingsSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  headerMeta?: ReactNode;
  children: ReactNode;
};

function SettingsSection({
  id,
  eyebrow,
  title,
  description,
  headerMeta,
  children,
}: SettingsSectionProps) {
  return (
    <section
      id={id}
      data-settings-section={id}
      className="scroll-mt-6 grid gap-4 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 shadow-[0_20px_40px_var(--app-shadow)] sm:p-5 lg:grid-cols-[152px_minmax(0,1fr)] xl:grid-cols-[164px_minmax(0,1fr)] xl:gap-5 xl:p-5"
    >
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--app-accent)]">
          {eyebrow}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[1.08rem] font-semibold text-[var(--app-text)]">
            {title}
          </h2>
          {headerMeta}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
          {description}
        </p>
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

type SectionNavigatorProps = {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
};

function SectionNavigator({
  activeSection,
  onNavigate,
}: SectionNavigatorProps) {
  const t = useT();
  const sections = getSettingsSections(t);

  return (
    <SurfacePanel className="rounded-[1.9rem] p-3">
      <div className="mb-3 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--app-accent)]">
          {t("options.navigation.title")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--app-text-faint)]">
          {t("options.navigation.description")}
        </p>
      </div>
      <div className="space-y-1.5">
        {sections.map((section, index) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onNavigate(section.id)}
              className={[
                "flex w-full items-start gap-3 rounded-[1.25rem] border px-3 py-2.5 text-start transition-colors",
                isActive
                  ? "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_72%,var(--app-surface))] shadow-[0_12px_24px_color-mix(in_srgb,var(--app-accent)_10%,transparent)]"
                  : "border-transparent bg-transparent hover:border-[var(--app-border)] hover:bg-[var(--app-surface-soft)]",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isActive
                    ? "bg-[var(--app-accent)] text-white"
                    : "bg-[var(--app-surface-soft)] text-[var(--app-text-faint)]",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.94rem] font-medium text-[var(--app-text)]">
                  {section.shortLabel}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--app-text-muted)]">
                  {section.mapHint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </SurfacePanel>
  );
}

type SettingsSnapshotChipProps = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning" | "danger";
};

function SettingsSnapshotChip({
  label,
  value,
  tone = "default",
}: SettingsSnapshotChipProps) {
  const toneClassName =
    tone === "accent"
      ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)]"
      : tone === "warning"
        ? "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)]"
        : tone === "danger"
          ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)]";

  return (
    <div
      className={[
        "min-w-[138px] rounded-[1.2rem] border px-3 py-2",
        toneClassName,
      ].join(" ")}
    >
      <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
        {label}
      </span>
      <span className="mt-1 block text-[13px] font-medium leading-snug text-[var(--app-text)]">
        {value}
      </span>
    </div>
  );
}

type InlineStatusProps = {
  status:
    | "idle"
    | "saving"
    | "saved"
    | "error"
    | "verifying"
    | "verified"
    | "exporting"
    | "importing"
    | "clearing"
    | "success";
  message: string;
};

function InlineStatus({ status, message }: InlineStatusProps) {
  const tone =
    status === "error"
      ? {
          container:
            "border-[var(--app-danger-border)] bg-[color:color-mix(in_srgb,var(--app-danger-soft)_72%,white)]",
          text: "text-[var(--app-danger)]",
        }
      : status === "verified" || status === "success"
        ? {
            container:
              "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_98%,white)]",
            text: "text-[var(--app-text-muted)]",
          }
      : {
          container:
            "border-[var(--app-border)] bg-[var(--app-surface)]",
          text: "text-[var(--app-text-muted)]",
        };

  return (
    <div className={`flex flex-col gap-2 rounded-3xl border p-4 ${tone.container}`}>
      <p className={`text-sm leading-relaxed ${tone.text}`}>{message}</p>
    </div>
  );
}

type StatusPillTone = "neutral" | "accent" | "warning" | "danger";

type StatusPillProps = {
  label: string;
  tone: StatusPillTone;
};

const STATUS_PILL_CLASSNAMES: Record<StatusPillTone, string> = {
  neutral:
    "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]",
  accent:
    "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]",
  warning:
    "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)]",
  danger:
    "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]",
};

const StatusPill = ({ label, tone }: StatusPillProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_PILL_CLASSNAMES[tone]}`}
    >
      {label}
    </span>
  );
};

type OpenAiServiceState = {
  label: string;
  tone: StatusPillTone;
  description: string;
  impact: string;
  blocksAiFeatures: boolean;
};

function getOpenAiServiceState({
  hasApiKey,
  hasModel,
  connectionStatus,
  connectionMessage,
  t,
}: {
  hasApiKey: boolean;
  hasModel: boolean;
  connectionStatus: InlineStatusProps["status"];
  connectionMessage: string;
  t: UiTranslator;
}): OpenAiServiceState {
  if (!hasApiKey || !hasModel) {
    return {
      label: t("options.openAiService.state.setupRequired.label"),
      tone: "warning",
      description: t("options.openAiService.state.setupRequired.description"),
      impact: t("options.openAiService.state.setupRequired.impact"),
      blocksAiFeatures: true,
    };
  }

  if (connectionStatus === "error") {
    return {
      label: t("options.openAiService.state.actionRequired.label"),
      tone: "danger",
      description: connectionMessage,
      impact: t("options.openAiService.state.actionRequired.impact"),
      blocksAiFeatures: true,
    };
  }

  if (connectionStatus === "verified") {
    return {
      label: t("options.openAiService.state.ready.label"),
      tone: "accent",
      description: connectionMessage,
      impact: t("options.openAiService.state.ready.impact"),
      blocksAiFeatures: false,
    };
  }

  if (connectionStatus === "verifying") {
    return {
      label: t("options.openAiService.state.checking.label"),
      tone: "accent",
      description: connectionMessage,
      impact: t("options.openAiService.state.checking.impact"),
      blocksAiFeatures: false,
    };
  }

  return {
    label: t("options.openAiService.state.needsVerification.label"),
    tone: "warning",
    description: t("options.openAiService.state.needsVerification.description"),
    impact: t("options.openAiService.state.needsVerification.impact"),
    blocksAiFeatures: false,
  };
}

function GlobalDependencyBanner({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: StatusPillTone;
}) {
  const t = useT();
  const className =
    tone === "danger"
      ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)]"
      : "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)]";

  return (
    <SurfacePanel className={`rounded-[1.7rem] px-4 py-3.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-[var(--app-text)]">{title}</p>
        <StatusPill
          label={
            tone === "danger"
              ? t("options.openAiService.state.actionRequired.label")
              : t("options.cloudSync.syncHealth.attention")
          }
          tone={tone}
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
        {description}
      </p>
    </SurfacePanel>
  );
}

function SectionDependencyIndicator({
  label,
  tone,
  tooltip,
}: {
  label: string;
  tone: StatusPillTone;
  tooltip: string;
}) {
  return (
    <Tooltip content={tooltip}>
      <span className="inline-flex cursor-help items-center">
        <StatusPill label={label} tone={tone} />
      </span>
    </Tooltip>
  );
}

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "accent" | "danger";
  size?: "default" | "compact";
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

const ACTION_BUTTON_CLASSNAMES: Record<
  NonNullable<ActionButtonProps["variant"]>,
  string
> = {
  default:
    "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]",
  accent:
    "border-[var(--app-accent-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-accent-soft)_100%,white),color-mix(in_srgb,var(--app-accent-soft)_100%,var(--app-surface)))] text-[var(--app-accent)] hover:bg-[color:color-mix(in_srgb,var(--app-accent-soft)_78%,var(--app-surface))]",
  danger:
    "border-[var(--app-danger-border)] bg-[color:color-mix(in_srgb,var(--app-danger-soft-strong)_72%,var(--app-surface))] text-[var(--app-danger)] shadow-[0_10px_20px_color-mix(in_srgb,var(--app-danger)_10%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--app-danger-soft-strong)_88%,var(--app-surface))]",
};

const ACTION_BUTTON_SIZE_CLASSNAMES: Record<
  NonNullable<ActionButtonProps["size"]>,
  string
> = {
  default: "h-10 gap-2 px-4 text-sm",
  compact:
    "h-9 gap-1.5 px-3.5 text-[13px] whitespace-nowrap shadow-[0_10px_20px_var(--app-shadow)]",
};

const ActionButton = ({
  label,
  onClick,
  icon,
  variant = "default",
  size = "default",
  disabled = false,
  isLoading = false,
  className,
}: ActionButtonProps) => {
  const t = useT();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={[
        "inline-flex items-center justify-center rounded-full border font-medium transition-colors disabled:cursor-default disabled:opacity-60",
        ACTION_BUTTON_SIZE_CLASSNAMES[size],
        ACTION_BUTTON_CLASSNAMES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? <span className="inline-flex h-4 w-4 items-center justify-center">{icon}</span> : null}
      <span>{isLoading ? t("common.actions.working") : label}</span>
    </button>
  );
};

const formatTimestampLabel = (value: number | undefined, t: UiTranslator) => {
  if (!value) {
    return t("options.cloudSync.sync.notYet");
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

const getProviderCheckpoint = (
  checkpoints: CloudSyncProviderCheckpoint[],
  provider: CloudSyncProvider
) => {
  return checkpoints.find((checkpoint) => checkpoint.provider === provider);
};

const getCloudSyncHealthMeta = (
  healthState: CloudSyncProviderHealthState | undefined,
  t: UiTranslator
): { label: string; tone: StatusPillTone } => {
  switch (healthState) {
    case "syncing":
      return { label: t("options.cloudSync.health.syncing"), tone: "accent" };
    case "up-to-date":
      return { label: t("options.cloudSync.health.upToDate"), tone: "accent" };
    case "retrying-automatically":
      return {
        label: t("options.cloudSync.health.retryingAutomatically"),
        tone: "warning",
      };
    case "needs-attention":
      return {
        label: t("options.cloudSync.health.needsAttention"),
        tone: "warning",
      };
    case "action-required":
      return {
        label: t("options.cloudSync.health.actionRequired"),
        tone: "danger",
      };
    default:
      return { label: t("options.cloudSync.health.off"), tone: "neutral" };
  }
};

const getCloudSyncOverviewMeta = (
  checkpoints: CloudSyncProviderCheckpoint[],
  isLoading: boolean,
  t: UiTranslator
): { label: string; tone: StatusPillTone; description: string } => {
  if (isLoading) {
    return {
      label: t("common.actions.loading"),
      tone: "neutral",
      description: t("options.cloudSync.overview.loadingDescription"),
    };
  }

  const connectedCheckpoints = checkpoints.filter(
    (checkpoint) => checkpoint.connected
  );
  if (connectedCheckpoints.length === 0) {
    return {
      label: t("options.cloudSync.health.off"),
      tone: "neutral",
      description: t("options.cloudSync.overview.offDescription"),
    };
  }

  if (
    connectedCheckpoints.some(
      (checkpoint) =>
        checkpoint.healthState === "needs-attention" ||
        checkpoint.healthState === "action-required"
    )
  ) {
    return {
      label: t("options.cloudSync.health.needsAttention"),
      tone: "warning",
      description: t("options.cloudSync.overview.needsAttentionDescription"),
    };
  }

  if
    (
      connectedCheckpoints.some(
        (checkpoint) =>
          checkpoint.healthState === "syncing" ||
          checkpoint.healthState === "retrying-automatically"
      )
    ) {
    return {
      label: t("options.cloudSync.health.syncing"),
      tone: "accent",
      description: t("options.cloudSync.overview.syncingDescription"),
    };
  }

  return {
    label: t("options.cloudSync.health.upToDate"),
    tone: "accent",
    description: t("options.cloudSync.overview.upToDateDescription"),
  };
};

const getCloudSyncConnectionMeta = (
  checkpoint: CloudSyncProviderCheckpoint | undefined,
  t: UiTranslator
) => {
  if (!checkpoint?.connected) {
    return {
      title: t("options.cloudSync.connection.notConnectedTitle"),
      description: t("options.cloudSync.connection.notConnectedDescription"),
    };
  }

  return {
    title:
      checkpoint.accountLabel || t("options.cloudSync.connection.connectedTitle"),
    description: checkpoint.connectedAt
      ? t("options.cloudSync.connection.connectedAt", {
          time: formatTimestampLabel(checkpoint.connectedAt, t),
        })
      : t("options.cloudSync.connection.connectedTitle"),
  };
};

const getCloudSyncSyncMeta = (
  checkpoint: CloudSyncProviderCheckpoint | undefined,
  t: UiTranslator
) => {
  return {
    title: formatTimestampLabel(checkpoint?.lastSuccessfulSyncAt, t),
    description: checkpoint?.lastScanAt
      ? t("options.cloudSync.sync.scannedAt", {
          time: formatTimestampLabel(checkpoint.lastScanAt, t),
        })
      : t("options.cloudSync.sync.noScanRecorded"),
  };
};

const getCloudSyncStatusMessage = (
  checkpoint: CloudSyncProviderCheckpoint | undefined,
  t: UiTranslator
) => {
  if (checkpoint?.lastError) {
    return checkpoint.lastError;
  }

  if (!checkpoint?.connected) {
    return t("options.cloudSync.statusMessage.disconnected");
  }

  if (checkpoint.manualRetryAvailable) {
    return t("options.cloudSync.statusMessage.manualRetryAvailable");
  }

  switch (checkpoint.healthState) {
    case "syncing":
      return t("options.cloudSync.statusMessage.syncing");
    case "retrying-automatically":
      return t("options.cloudSync.statusMessage.retryingAutomatically");
    case "needs-attention":
      return t("options.cloudSync.statusMessage.needsAttention");
    case "action-required":
      return t("options.cloudSync.statusMessage.actionRequired");
    case "up-to-date":
      return t("options.cloudSync.statusMessage.upToDate");
    default:
      return checkpoint.connected
        ? t("options.cloudSync.statusMessage.connectedWaiting")
        : t("options.cloudSync.health.off");
  }
};

type CloudSyncStatCardProps = {
  label: string;
  value: string;
  description: string;
};

const CloudSyncStatCard = ({
  label,
  value,
  description,
}: CloudSyncStatCardProps) => {
  return (
    <div className="rounded-[1.45rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
        {label}
      </p>
      <p
        className="mt-2 text-[0.95rem] font-medium leading-snug text-[var(--app-text)]"
        style={DYNAMIC_TEXT_STYLE}
        dir={getDynamicTextDirection(value)}
      >
        {value}
      </p>
      <p
        className="mt-1 text-[11px] leading-relaxed text-[var(--app-text-muted)]"
        style={DYNAMIC_TEXT_STYLE}
        dir={getDynamicTextDirection(description)}
      >
        {description}
      </p>
    </div>
  );
};

function AssistantProfileControls({
  profile,
  onChange,
}: {
  profile: SummaryProfile;
  onChange: (updates: Partial<SummaryProfile>) => void;
}) {
  const t = useT();
  const responseIntentOptions = getAssistantResponseIntentOptions(t);
  const responseFormatOptions = getAssistantResponseFormatOptions(t);
  const responseDepthOptions = getAssistantResponseDepthOptions(t);
  const responseToneOptions = getAssistantResponseToneOptions(t);
  const deliveryBiasOptions = getAssistantDeliveryBiasOptions(t);
  const triggerPolicyOptions = getAssistantTriggerPolicyOptions(t);
  const participantScopeOptions = getAssistantParticipantScopeOptions(t);
  const assistantEnabled = profile.assistant.enabledByDefault;

  const updateAssistant = (
    updates: Partial<SummaryProfile["assistant"]>
  ) => {
    onChange({
      assistant: {
        ...profile.assistant,
        ...updates,
      },
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
          {t("options.profiles.assistant.eyebrow")}
        </p>
        <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">
          {t("options.profiles.assistant.description")}
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <Toggle
          enabled={assistantEnabled}
          onChange={(enabled) =>
            updateAssistant({ enabledByDefault: enabled })
          }
          label={t("options.profiles.assistant.enabledLabel")}
          description={t("options.profiles.assistant.enabledDescription")}
        />

        {!assistantEnabled && (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--app-text-muted)]">
            {t("options.profiles.assistant.disabledHint")}
          </div>
        )}

        <Select
          label={t("options.profiles.assistant.responseIntentLabel")}
          value={profile.assistant.responseIntent}
          onChange={(value) =>
            updateAssistant({
              responseIntent:
                value as SummaryProfile["assistant"]["responseIntent"],
            })
          }
          options={responseIntentOptions}
          disabled={!assistantEnabled}
        />

          <Select
            label={t("options.profiles.assistant.responseFormatLabel")}
            value={profile.assistant.responseFormat}
            onChange={(value) =>
              updateAssistant({
                responseFormat:
                  value as SummaryProfile["assistant"]["responseFormat"],
              })
            }
            options={responseFormatOptions}
            disabled={!assistantEnabled}
          />

          <Select
            label={t("options.profiles.assistant.responseDepthLabel")}
            value={profile.assistant.responseDepth}
            onChange={(value) =>
              updateAssistant({
                responseDepth:
                  value as SummaryProfile["assistant"]["responseDepth"],
              })
            }
            options={responseDepthOptions}
            disabled={!assistantEnabled}
          />

          <Select
            label={t("options.profiles.assistant.responseToneLabel")}
            value={profile.assistant.responseTone}
            onChange={(value) =>
              updateAssistant({
                responseTone:
                  value as SummaryProfile["assistant"]["responseTone"],
              })
            }
            options={responseToneOptions}
            disabled={!assistantEnabled}
          />

          <Select
            label={t("options.profiles.assistant.deliveryBiasLabel")}
            value={profile.assistant.deliveryBias}
            onChange={(value) =>
              updateAssistant({
                deliveryBias:
                  value as SummaryProfile["assistant"]["deliveryBias"],
              })
            }
            options={deliveryBiasOptions}
            disabled={!assistantEnabled}
          />

          <Select
            label={t("options.profiles.assistant.triggerPolicyLabel")}
            value={profile.assistant.triggerPolicy}
            onChange={(value) =>
              updateAssistant({
                triggerPolicy:
                  value as SummaryProfile["assistant"]["triggerPolicy"],
              })
            }
            options={triggerPolicyOptions}
            disabled={!assistantEnabled}
          />

          <Select
            label={t("options.profiles.assistant.participantScopeLabel")}
            value={profile.assistant.participantScope}
            onChange={(value) =>
              updateAssistant({
                participantScope:
                  value as SummaryProfile["assistant"]["participantScope"],
              })
            }
            options={participantScopeOptions}
            disabled={!assistantEnabled}
          />
        </div>

        <TextArea
          label={t("options.profiles.assistant.instructionsLabel")}
          value={profile.assistant.prompt}
          onChange={(value) => updateAssistant({ prompt: value })}
          disabled={!assistantEnabled}
          hint={t("options.profiles.assistant.instructionsHint")}
          maxLength={ASSISTANT_PROFILE_PROMPT_MAX_LENGTH}
          showCharacterCount
        />
      </div>
  );
}

function ProfileFieldCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] backdrop-blur-xl sm:p-4">
      <label className="mb-2.5 block text-sm font-medium text-[var(--app-text)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function ProfileIdentityControls({
  profile,
  readOnly = false,
  onChange,
}: {
  profile: SummaryProfile;
  readOnly?: boolean;
  onChange?: (updates: Partial<SummaryProfile>) => void;
}) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
          {t("options.profiles.identity.eyebrow")}
        </p>
        <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">
          {t("options.profiles.identity.description")}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ProfileFieldCard label={t("options.profiles.identity.nameLabel")}>
          {readOnly ? (
            <p
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 text-[var(--app-text)]"
              style={DYNAMIC_TEXT_STYLE}
              dir={getDynamicTextDirection(profile.name)}
            >
              {profile.name}
            </p>
          ) : (
            <input
              type="text"
              value={profile.name}
              maxLength={SUMMARY_PROFILE_NAME_MAX_LENGTH}
              onChange={(event) =>
                onChange?.({
                  name: event.target.value.slice(
                    0,
                    SUMMARY_PROFILE_NAME_MAX_LENGTH
                  ),
                })
              }
              placeholder={t("options.profiles.identity.namePlaceholder")}
              dir="auto"
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-faint)] focus:border-[var(--app-accent)]"
            />
          )}
        </ProfileFieldCard>

        <ProfileFieldCard
          label={t("options.profiles.identity.descriptionLabel")}
        >
          {readOnly ? (
            <p
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 text-[var(--app-text)]"
              style={DYNAMIC_TEXT_STYLE}
              dir={getDynamicTextDirection(profile.description)}
            >
              {profile.description}
            </p>
          ) : (
            <input
              type="text"
              value={profile.description}
              maxLength={SUMMARY_PROFILE_DESCRIPTION_MAX_LENGTH}
              onChange={(event) =>
                onChange?.({
                  description: event.target.value.slice(
                    0,
                    SUMMARY_PROFILE_DESCRIPTION_MAX_LENGTH
                  ),
                })
              }
              placeholder={t(
                "options.profiles.identity.descriptionPlaceholder"
              )}
              dir="auto"
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-faint)] focus:border-[var(--app-accent)]"
            />
          )}
        </ProfileFieldCard>
      </div>
    </div>
  );
}

function SummaryProfileControls({
  profile,
  onChange,
}: {
  profile: SummaryProfile;
  onChange: (updates: Partial<SummaryProfile>) => void;
}) {
  const t = useT();
  const summaryGenerationModeOptions = getSummaryGenerationModeOptions(t);

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
          {t("options.profiles.summary.eyebrow")}
        </p>
        <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">
          {t("options.profiles.summary.description")}
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <Toggle
          enabled={profile.autoSummarizeOnMeetingEnd}
          onChange={(enabled) =>
            onChange({
              autoSummarizeOnMeetingEnd: enabled,
            })
          }
          label={t("options.profiles.summary.autoSummaryLabel")}
          description={t("options.profiles.summary.autoSummaryDescription")}
        />

        <Select
          label={t("options.profiles.summary.effortLabel")}
          value={profile.summaryGenerationMode}
          onChange={(value) =>
            onChange({
              summaryGenerationMode:
                value as SummaryProfile["summaryGenerationMode"],
            })
          }
          options={summaryGenerationModeOptions}
        />

        <TextArea
          label={t("options.profiles.summary.instructionsLabel")}
          value={profile.prompt}
          onChange={(value) => onChange({ prompt: value })}
          hint={t("options.profiles.summary.instructionsHint")}
          maxLength={SUMMARY_PROFILE_PROMPT_MAX_LENGTH}
          showCharacterCount
        />
      </div>
    </div>
  );
}

function ProfileListItem({
  profile,
  selected,
  isDefault,
  isProtected,
  onSelect,
}: {
  profile: SummaryProfile;
  selected: boolean;
  isDefault: boolean;
  isProtected: boolean;
  onSelect: () => void;
}) {
  const t = useT();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-[1.45rem] border px-3.5 py-3 text-start transition-colors",
        selected
          ? "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_72%,var(--app-surface))] shadow-[0_12px_28px_color-mix(in_srgb,var(--app-accent)_10%,transparent)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-soft)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-sm font-medium text-[var(--app-text)]"
            dir={getDynamicTextDirection(
              profile.name || t("options.profiles.editor.untitled")
            )}
          >
            {profile.name || t("options.profiles.editor.untitled")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-accent)]">
                <CheckIcon className="h-3.5 w-3.5" />
                <span>{t("options.profiles.badges.primary")}</span>
              </span>
            )}
            {isProtected ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-text-muted)]">
                <GearIcon className="h-3.5 w-3.5" />
                <span>{t("options.profiles.badges.alwaysAvailable")}</span>
              </span>
            ) : (
              <span
                aria-label={t("options.profiles.badges.customProfile")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_68%,var(--app-surface))] text-[var(--app-accent)]"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
              </span>
            )}
            {profile.assistant.enabledByDefault && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_70%,var(--app-surface))] px-2.5 py-1 text-[11px] font-medium text-[var(--app-accent)]">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>{t("options.profiles.badges.assistantOn")}</span>
              </span>
            )}
            {profile.autoSummarizeOnMeetingEnd && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_70%,var(--app-surface))] px-2.5 py-1 text-[11px] font-medium text-[var(--app-accent)]">
                <CheckIcon className="h-3.5 w-3.5" />
                <span>{t("options.profiles.badges.autoSummary")}</span>
              </span>
            )}
          </div>
          <p
            className="mt-2 text-[13px] leading-relaxed text-[var(--app-text-muted)]"
            style={DYNAMIC_TEXT_STYLE}
            dir={getDynamicTextDirection(
              profile.description || t("options.profiles.editor.noDescription")
            )}
          >
            {profile.description || t("options.profiles.editor.noDescription")}
          </p>
        </div>
        <ChevronDownIcon
          className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${
            selected ? "rotate-[-90deg] text-[var(--app-accent)]" : "text-[var(--app-text-faint)]"
          }`}
        />
      </div>
    </button>
  );
}

function SummaryProfileEditor({
  profile,
  isDefault,
  isProtected,
  canSetDefault,
  canDelete,
  onSetDefault,
  onChange,
  onDelete,
}: {
  profile: SummaryProfile;
  isDefault: boolean;
  isProtected: boolean;
  canSetDefault: boolean;
  canDelete: boolean;
  onSetDefault: () => void;
  onChange: (updates: Partial<SummaryProfile>) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!canDelete) {
      setConfirmingDelete(false);
    }
  }, [canDelete]);

  return (
    <div className="space-y-3.5">
      <SurfacePanel
        className={
          isProtected
            ? "border-[var(--app-accent-border)] bg-[linear-gradient(135deg,var(--app-accent-soft),var(--app-surface)_52%,var(--app-surface-soft))] shadow-[0_18px_40px_color-mix(in_srgb,var(--app-accent)_10%,transparent)]"
            : "bg-[var(--app-surface-soft)]"
        }
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p
              className="text-lg font-semibold text-[var(--app-text)]"
              dir={getDynamicTextDirection(
                profile.name || t("options.profiles.editor.untitled")
              )}
            >
              {profile.name || t("options.profiles.editor.untitled")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-accent)]">
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>{t("options.profiles.badges.primary")}</span>
                </span>
              )}
              {isProtected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-text-muted)]">
                  <GearIcon className="h-3.5 w-3.5" />
                  <span>{t("options.profiles.badges.alwaysAvailable")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-text-muted)]">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>{t("options.profiles.badges.customProfile")}</span>
                </span>
              )}
              {profile.assistant.enabledByDefault && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_70%,var(--app-surface))] px-2.5 py-1 text-[11px] font-medium text-[var(--app-accent)]">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>{t("options.profiles.badges.assistantOn")}</span>
                </span>
              )}
              {profile.autoSummarizeOnMeetingEnd && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_70%,var(--app-surface))] px-2.5 py-1 text-[11px] font-medium text-[var(--app-accent)]">
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>{t("options.profiles.badges.autoSummary")}</span>
                </span>
              )}
            </div>
            <p
              className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--app-text-muted)]"
              style={DYNAMIC_TEXT_STYLE}
              dir={getDynamicTextDirection(
                profile.description ||
                  t("options.profiles.editor.noShortDescription")
              )}
            >
              {profile.description || t("options.profiles.editor.noShortDescription")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isProtected && !isDefault && (
              <ActionButton
                label={t("options.profiles.editor.setAsPrimary")}
                icon={<CheckIcon className="h-4 w-4" />}
                onClick={onSetDefault}
                disabled={!canSetDefault}
                variant="accent"
                size="compact"
              />
            )}
            {canDelete && (
              <ActionButton
                label={
                  confirmingDelete
                    ? t("common.actions.confirmDelete")
                    : t("common.actions.delete")
                }
                icon={<TrashIcon className="h-4 w-4" />}
                onClick={() =>
                  confirmingDelete ? onDelete() : setConfirmingDelete(true)
                }
                variant="danger"
                size="compact"
              />
            )}
            {confirmingDelete && canDelete && (
              <ActionButton
                label={t("common.actions.cancel")}
                onClick={() => setConfirmingDelete(false)}
                size="compact"
              />
            )}
          </div>
        </div>
      </SurfacePanel>

      {isProtected && (
        <div className="rounded-[1.6rem] border border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_72%,var(--app-surface))] px-4 py-3.5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-accent-border)] bg-[var(--app-surface)] text-[var(--app-accent)]">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--app-text)]">
                {t("options.profiles.editor.builtInTitle")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                {t("options.profiles.editor.builtInDescription")}
              </p>
            </div>
          </div>
        </div>
      )}

      <ProfileIdentityControls profile={profile} readOnly={isProtected} onChange={onChange} />
      <SummaryProfileControls profile={profile} onChange={onChange} />
      <AssistantProfileControls profile={profile} onChange={onChange} />
    </div>
  );
}

export default function App() {
  const { locale } = useI18n();
  const t = useT();
  const settingsSections = getSettingsSections(t);
  const captureStartupOptions = getCaptureStartupOptions(t);
  const captionActivationOptions = getCaptionActivationOptions(t);
  const uiLanguageOptions = getUiLanguageOptions(t);
  const openAiModels = useMemo(() => getOpenAiModels(t), [t]);
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const {
    settings,
    loading,
    saveState,
    connectionState,
    dataTransferState,
    currentOpenAiApiKey,
    setCurrentOpenAiApiKey,
    updateSetting,
    saveAppearance,
    verifyOpenAiSetupNow,
    exportDataBundle,
    importDataBundle,
    clearSessionData,
    openHistory,
    reloadSettings,
  } = useSettings();
  const {
    cloudSyncState,
    cloudSyncLoading,
    cloudSyncMutationState,
    refreshCloudSyncState,
    connectProvider,
    disconnectProvider,
    retryProvider,
    reconnectProvider,
    resolveSettingsChoice,
  } = useCloudSync({ onSettingsChanged: reloadSettings });
  const resolvedTheme = useResolvedTheme(settings.appearance);
  const customSummaryProfiles = settings.summaryProfiles.filter(
    (profile) => !isProtectedSummaryProfile(profile.id)
  );
  const canUseProtectedAsDefault = customSummaryProfiles.length === 0;
  const defaultSummaryProfile = settings.summaryProfiles.find(
    (profile) => profile.id === settings.defaultSummaryProfileId
  );
  const currentModelLabel =
    openAiModels.find((model) => model.id === settings.model)?.name ||
    settings.model;
  const cloudSyncProviderDetails = useMemo(
    () => getCloudSyncProviderDetails(t),
    [t]
  );
  const cloudSyncScopeShared = useMemo(() => getCloudSyncScopeShared(t), [t]);
  const cloudSyncScopeLocal = useMemo(() => getCloudSyncScopeLocal(t), [t]);
  const overallCloudSync = getCloudSyncOverviewMeta(
    cloudSyncState.checkpoints,
    cloudSyncLoading,
    t
  );
  const connectedCloudProviderCount = cloudSyncState.checkpoints.filter(
    (checkpoint) => checkpoint.connected
  ).length;
  const latestSuccessfulCloudSyncAt = cloudSyncState.checkpoints.reduce(
    (latest, checkpoint) =>
      Math.max(latest, checkpoint.lastSuccessfulSyncAt || 0),
    0
  );
  const pendingSettingsDecision = cloudSyncState.pendingSettingsDecision;
  const pendingSettingsProviderDetail = pendingSettingsDecision
    ? cloudSyncProviderDetails.find(
        (provider) => provider.id === pendingSettingsDecision.provider
      )
    : null;
  const hasConnectedCloudProviders = connectedCloudProviderCount > 0;
  const [activeSection, setActiveSection] = useState<string>(
    SETTINGS_SECTION_IDS[0]
  );
  const [selectedSummaryProfileId, setSelectedSummaryProfileId] = useState<string>(
    settings.defaultSummaryProfileId || settings.summaryProfiles[0]?.id || ""
  );
  const initialSummaryProfileSelectionAppliedRef = useRef(false);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [showBackupPassphrase, setShowBackupPassphrase] = useState(false);
  const [confirmClearSessionData, setConfirmClearSessionData] = useState(false);
  const dataImportInputRef = useRef<HTMLInputElement | null>(null);
  const pendingNavigationSectionRef = useRef<string | null>(null);
  const pendingNavigationTimeoutRef = useRef<number | null>(null);
  const scrollSettleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let frameId: number | null = null;

    const updateActiveSectionFromScroll = () => {
      const sectionElements = settingsSections.map((section) =>
        document.getElementById(section.id)
      ).filter((section): section is HTMLElement => Boolean(section));

      if (sectionElements.length === 0) {
        return;
      }

      const activationLine = Math.max(160, window.innerHeight * 0.28);
      const pendingSectionId = pendingNavigationSectionRef.current;

      if (pendingSectionId) {
        const pendingSection = sectionElements.find(
          (section) => section.id === pendingSectionId
        );

        if (!pendingSection) {
          pendingNavigationSectionRef.current = null;
        } else {
          setActiveSection(pendingSectionId);
          return;
        }
      }

      const sectionsAboveLine = sectionElements.filter(
        (section) => section.getBoundingClientRect().top <= activationLine
      );

      if (sectionsAboveLine.length > 0) {
        setActiveSection(sectionsAboveLine[sectionsAboveLine.length - 1]!.id);
        return;
      }

      const nearestSection = [...sectionElements].sort((left, right) => {
        const leftDistance = Math.abs(
          left.getBoundingClientRect().top - activationLine
        );
        const rightDistance = Math.abs(
          right.getBoundingClientRect().top - activationLine
        );
        return leftDistance - rightDistance;
      })[0];

      if (nearestSection) {
        setActiveSection(nearestSection.id);
      }
    };

    const scheduleSectionUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateActiveSectionFromScroll();
      });
    };

    const scheduleNavigationRelease = () => {
      if (!pendingNavigationSectionRef.current) {
        return;
      }

      if (scrollSettleTimeoutRef.current !== null) {
        window.clearTimeout(scrollSettleTimeoutRef.current);
      }

      scrollSettleTimeoutRef.current = window.setTimeout(() => {
        pendingNavigationSectionRef.current = null;
        scrollSettleTimeoutRef.current = null;
        scheduleSectionUpdate();
      }, 140);
    };

    const handleScroll = () => {
      scheduleSectionUpdate();
      scheduleNavigationRelease();
    };

    updateActiveSectionFromScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleSectionUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (pendingNavigationTimeoutRef.current !== null) {
        window.clearTimeout(pendingNavigationTimeoutRef.current);
      }
      if (scrollSettleTimeoutRef.current !== null) {
        window.clearTimeout(scrollSettleTimeoutRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleSectionUpdate);
    };
  }, [settingsSections]);

  useEffect(() => {
    if (!loading && !initialSummaryProfileSelectionAppliedRef.current) {
      setSelectedSummaryProfileId(
        settings.defaultSummaryProfileId || settings.summaryProfiles[0]?.id || ""
      );
      initialSummaryProfileSelectionAppliedRef.current = true;
      return;
    }

    if (
      selectedSummaryProfileId &&
      settings.summaryProfiles.some(
        (profile) => profile.id === selectedSummaryProfileId
      )
    ) {
      return;
    }

    setSelectedSummaryProfileId(
      settings.defaultSummaryProfileId || settings.summaryProfiles[0]?.id || ""
    );
  }, [
    loading,
    selectedSummaryProfileId,
    settings.defaultSummaryProfileId,
    settings.summaryProfiles,
  ]);

  const navigateToSection = (sectionId: string) => {
    pendingNavigationSectionRef.current = sectionId;
    if (pendingNavigationTimeoutRef.current !== null) {
      window.clearTimeout(pendingNavigationTimeoutRef.current);
    }
    pendingNavigationTimeoutRef.current = window.setTimeout(() => {
      pendingNavigationSectionRef.current = null;
      pendingNavigationTimeoutRef.current = null;
    }, 1200);

    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${sectionId}`
    );
  };

  if (loading) {
    return (
      <AppLoadingScreen
        title={t("options.loading")}
        description={t("options.sections.workspace.description")}
      />
    );
  }

  const updateSummaryProfile = (
    profileId: string,
    updates: Partial<SummaryProfile>
  ) => {
    updateSetting(
      "summaryProfiles",
      settings.summaryProfiles.map((profile) =>
        profile.id === profileId ? { ...profile, ...updates } : profile
      )
    );
  };

  const addSummaryProfile = () => {
    const newProfile: SummaryProfile = {
      id: `custom_${Date.now()}`,
      name: t("options.profiles.editor.newName"),
      description: t("options.profiles.editor.newDescription"),
      prompt: t("options.profiles.editor.newPrompt"),
      summaryGenerationMode: "balanced",
      autoSummarizeOnMeetingEnd: false,
      assistant: createDefaultAssistantConfig(),
    };

    const nextProfiles = [
      settings.summaryProfiles[0],
      newProfile,
      ...settings.summaryProfiles.slice(1),
    ];

    updateSetting("summaryProfiles", nextProfiles);
    if (customSummaryProfiles.length === 0) {
      updateSetting("defaultSummaryProfileId", newProfile.id);
    }
    setSelectedSummaryProfileId(newProfile.id);
  };

  const deleteSummaryProfile = (profileId: string) => {
    if (isProtectedSummaryProfile(profileId)) {
      return;
    }

    const remainingProfiles = settings.summaryProfiles.filter(
      (profile) => profile.id !== profileId
    );
    updateSetting("summaryProfiles", remainingProfiles);

    if (settings.defaultSummaryProfileId === profileId) {
      const remainingCustomProfiles = remainingProfiles.filter(
        (profile) => !isProtectedSummaryProfile(profile.id)
      );
      updateSetting(
        "defaultSummaryProfileId",
        remainingCustomProfiles[0]?.id || remainingProfiles[0]?.id || ""
      );
    }

    if (selectedSummaryProfileId === profileId) {
      setSelectedSummaryProfileId(
        remainingProfiles[0]?.id || settings.defaultSummaryProfileId || ""
      );
    }
  };

  const triggerDataImport = () => {
    dataImportInputRef.current?.click();
  };

  const handleExportBackup = () => {
    void exportDataBundle(backupPassphrase);
  };

  const handleImportBackup = (file: File) => {
    void importDataBundle(file, backupPassphrase);
  };

  const handleConfirmClearSessionData = () => {
    void clearSessionData();
    setConfirmClearSessionData(false);
  };

  const confirmClearSessionDescription = hasConnectedCloudProviders
    ? t("options.dataRecovery.confirmDelete.syncedDescription")
    : t("options.dataRecovery.confirmDelete.localDescription");

  const confirmClearSessionLabel = hasConnectedCloudProviders
    ? t("options.dataRecovery.confirmDelete.syncedLabel")
    : t("options.dataRecovery.confirmDelete.localLabel");
  const selectedSummaryProfile =
    settings.summaryProfiles.find(
      (profile) => profile.id === selectedSummaryProfileId
    ) || settings.summaryProfiles[0];
  const openAiServiceState = getOpenAiServiceState({
    hasApiKey: Boolean(settings.openaiApiKey.trim()),
    hasModel: Boolean(settings.model.trim()),
    connectionStatus: connectionState.status,
    connectionMessage: connectionState.message,
    t,
  });
  const shouldShowGlobalOpenAiBanner = openAiServiceState.tone !== "accent";
  const openAiDependencyIndicator =
    openAiServiceState.tone !== "accent" ? (
      <SectionDependencyIndicator
        label={openAiServiceState.label}
        tone={openAiServiceState.tone}
        tooltip={openAiServiceState.impact}
      />
    ) : null;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <ConfirmDialog
        open={confirmClearSessionData}
        tone="danger"
        title={
          hasConnectedCloudProviders
            ? t("options.dataRecovery.confirmDelete.syncedTitle")
            : t("options.dataRecovery.confirmDelete.localTitle")
        }
        description={confirmClearSessionDescription}
        confirmLabel={confirmClearSessionLabel}
        onConfirm={handleConfirmClearSessionData}
        onCancel={() => setConfirmClearSessionData(false)}
        busy={dataTransferState.status === "clearing"}
      />
      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8 xl:py-8">
        <header className="mb-5 space-y-4 xl:mb-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--app-accent)]">
                {t("options.header.eyebrow")}
              </p>
              <BrandLockup
                title={t("options.header.title")}
                subtitle={t("options.header.subtitle")}
                theme={resolvedTheme}
                className="max-w-2xl"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:self-start xl:self-auto">
              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium",
                  saveState.status === "error"
                    ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]"
                    : saveState.status === "saving"
                      ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-2 w-2 rounded-full",
                    saveState.status === "error"
                      ? "bg-[var(--app-danger)]"
                      : saveState.status === "saving"
                        ? "bg-[var(--app-accent)]"
                        : "bg-[var(--app-text-faint)]",
                  ].join(" ")}
                />
                <span>
                  {saveState.status === "saving"
                    ? t("options.saveBadge.saving")
                    : saveState.status === "error"
                      ? t("options.saveBadge.attention")
                      : t("options.saveBadge.saved")}
                </span>
              </span>
              <button
                type="button"
                onClick={openHistory}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-sm text-[var(--app-text-muted)] shadow-[0_10px_24px_var(--app-shadow)] backdrop-blur-xl transition-colors hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-accent)]">
                  <ArchiveIcon className="h-4 w-4" />
                </span>
                <span className="font-medium">
                  {t("options.header.openMeetingHistory")}
                </span>
              </button>
            </div>
          </div>

          <SurfacePanel className="rounded-[1.9rem] p-3 sm:p-3.5">
            <div className="flex flex-wrap gap-2.5">
              <SettingsSnapshotChip
                label={t("options.snapshot.aiEngine")}
                value={t("options.openAiService.serviceName")}
              />
              <SettingsSnapshotChip
                label={t("options.snapshot.serviceStatus")}
                value={openAiServiceState.label}
                tone={
                  openAiServiceState.tone === "accent"
                    ? "accent"
                    : openAiServiceState.tone === "danger"
                      ? "danger"
                      : "warning"
                }
              />
              <SettingsSnapshotChip
                label={t("options.snapshot.model")}
                value={currentModelLabel}
              />
              <SettingsSnapshotChip
                label={t("options.snapshot.primaryProfile")}
                value={defaultSummaryProfile?.name || t("options.snapshot.none")}
              />
              <SettingsSnapshotChip
                label={t("options.snapshot.theme")}
                value={
                  settings.appearance === "system"
                    ? t("options.snapshot.system")
                    : settings.appearance === "light"
                      ? t("options.snapshot.light")
                      : t("options.snapshot.dark")
                }
              />
              <SettingsSnapshotChip
                label={t("options.snapshot.cloudVault")}
                value={
                  connectedCloudProviderCount === 0
                    ? t("options.cloudSync.health.off")
                    : `${overallCloudSync.label} · ${t(
                        connectedCloudProviderCount === 1
                          ? "options.snapshot.providerOne"
                          : "options.snapshot.providerOther",
                        { count: connectedCloudProviderCount }
                      )}`
                }
                tone={connectedCloudProviderCount > 0 ? "accent" : "default"}
              />
              <SettingsSnapshotChip
                label={t("options.snapshot.meetingUi")}
                value={
                  settings.overlayVisible
                    ? settings.overlayClickThrough
                      ? t("options.snapshot.visibleClickThrough")
                      : t("options.snapshot.visibleInteractive")
                    : t("options.snapshot.hidden")
                }
                tone={settings.overlayVisible ? "accent" : "default"}
              />
            </div>
          </SurfacePanel>
        </header>

        {shouldShowGlobalOpenAiBanner && (
          <div className="mb-5 xl:mb-6">
            <GlobalDependencyBanner
              title={
                openAiServiceState.tone === "danger"
                  ? t("options.openAiService.banners.needsAttention")
                  : openAiServiceState.blocksAiFeatures
                    ? t("options.openAiService.banners.finishSetup")
                    : t("options.openAiService.banners.verifySetup")
              }
              description={openAiServiceState.impact}
              tone={openAiServiceState.tone}
            />
          </div>
        )}

        <div className="mb-5 xl:hidden">
          <SurfacePanel className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-accent)]">
              {t("options.navigation.quickJump")}
            </p>
            <div className="flex flex-wrap gap-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => navigateToSection(section.id)}
                  className={[
                    "rounded-full border px-3 py-2 text-sm transition-colors",
                    activeSection === section.id
                      ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
                  ].join(" ")}
                >
                  {section.shortLabel}
                </button>
              ))}
            </div>
          </SurfacePanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[216px_minmax(0,1fr)] xl:gap-6">
          <aside className="hidden xl:block xl:sticky xl:top-8 xl:self-start">
            <SectionNavigator
              activeSection={activeSection}
              onNavigate={navigateToSection}
            />
          </aside>

          <div className="space-y-6">
            <SettingsSection
              id="workspace"
              eyebrow={t("options.sections.workspace.eyebrow")}
              title={t("options.sections.workspace.title")}
              description={t("options.sections.workspace.description")}
            >
              <SurfacePanel className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-4 rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_14px_30px_var(--app-shadow)]">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--app-text)]">
                        {t("options.workspace.appearance.title")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                        {t("options.workspace.appearance.description")}
                      </p>
                    </div>
                    <ThemeToggle value={settings.appearance} onChange={saveAppearance} />
                  </div>

                  <Select
                    label={t("options.workspace.uiLanguage.title")}
                    value={settings.uiLanguage}
                    onChange={(value) =>
                      updateSetting(
                        "uiLanguage",
                        value as typeof settings.uiLanguage
                      )
                    }
                    options={uiLanguageOptions}
                  />
                </div>
              </SurfacePanel>

              <SurfacePanel className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--app-text)]">
                    {t("options.workspace.meetingFlow.title")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                    {t("options.workspace.meetingFlow.description")}
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Select
                    label={t("options.workspace.captureStartup.label")}
                    value={settings.captureStartupBehavior}
                    onChange={(value) =>
                      updateSetting(
                        "captureStartupBehavior",
                        value as "off" | "ask" | "always"
                      )
                    }
                    options={captureStartupOptions}
                  />

                  <Select
                    label={t("options.workspace.captionActivation.label")}
                    value={settings.captionActivationBehavior}
                    onChange={(value) =>
                      updateSetting(
                        "captionActivationBehavior",
                        value as "guided" | "automatic"
                      )
                    }
                    options={captionActivationOptions}
                  />
                </div>

                <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_14px_30px_var(--app-shadow)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--app-text)]">
                        {t("options.workspace.sessionContinuation.title")}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                        {t("options.workspace.sessionContinuation.description")}
                      </p>
                    </div>
                    <div className="inline-flex min-w-[92px] flex-col items-end rounded-[1.1rem] border border-[color:color-mix(in_srgb,var(--app-accent)_12%,var(--app-border))] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] px-3 py-2 shadow-[0_10px_22px_var(--app-shadow)]">
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
                        {t("options.workspace.sessionContinuation.windowLabel")}
                      </span>
                      <span className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                        {formatSessionContinuationWindowLabel(
                          settings.sessionContinuationWindowMinutes,
                          t
                        )}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={String(
                      SESSION_CONTINUATION_WINDOW_MINUTE_STOPS.length - 1
                    )}
                    step="1"
                    value={getSessionContinuationWindowStopIndex(
                      settings.sessionContinuationWindowMinutes
                    )}
                    onChange={(event) =>
                      updateSetting(
                        "sessionContinuationWindowMinutes",
                        SESSION_CONTINUATION_WINDOW_MINUTE_STOPS[
                          Number(event.target.value)
                        ]
                      )
                    }
                    className="mt-4 w-full accent-[var(--app-accent)] mc-slider"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--app-text-faint)]">
                    <span>
                      {formatSessionContinuationWindowLabel(
                        MIN_SESSION_CONTINUATION_WINDOW_MINUTES,
                        t
                      )}
                    </span>
                    <span>
                      {formatSessionContinuationWindowLabel(
                        MAX_SESSION_CONTINUATION_WINDOW_MINUTES,
                        t
                      )}
                    </span>
                  </div>
                </div>
              </SurfacePanel>

              <SurfacePanel className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--app-text)]">
                    {t("options.workspace.inMeetingSurfaces.title")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                    {t("options.workspace.inMeetingSurfaces.description")}
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_14px_30px_var(--app-shadow)] lg:col-span-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium text-[var(--app-text)]">
                          {t("options.workspace.overlayOpacity.title")}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                          {t("options.workspace.overlayOpacity.description")}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text)]">
                        {settings.overlayOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="100"
                      step="1"
                      value={settings.overlayOpacity}
                      onChange={(event) =>
                        updateSetting(
                          "overlayOpacity",
                          Number(event.target.value)
                        )
                      }
                      className="mt-4 w-full accent-[var(--app-accent)] mc-slider"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--app-text-faint)]">
                      <span>{t("options.workspace.overlayOpacity.subtle")}</span>
                      <span>{t("options.workspace.overlayOpacity.solid")}</span>
                    </div>
                  </div>

                  <Toggle
                    enabled={settings.overlayClickThrough}
                    onChange={(enabled) =>
                      updateSetting("overlayClickThrough", enabled)
                    }
                    label={t("options.workspace.overlayClickThrough.label")}
                    description={t("options.workspace.overlayClickThrough.description")}
                    className="lg:col-span-2"
                  />
                </div>
              </SurfacePanel>

              <SurfacePanel className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--app-text)]">
                    {t("options.workspace.meetingArchive.title")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                    {t("options.workspace.meetingArchive.description")}
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Toggle
                    enabled={settings.storeMeetingChat}
                    onChange={(enabled) =>
                      updateSetting("storeMeetingChat", enabled)
                    }
                    label={t("options.workspace.storeMeetingChat.label")}
                    description={t("options.workspace.storeMeetingChat.description")}
                    className="lg:col-span-2"
                  />
                </div>
              </SurfacePanel>

              
            </SettingsSection>

            <SettingsSection
              id="openai-service"
              eyebrow={t("options.sections.openAiService.eyebrow")}
              title={t("options.openAiService.title")}
              description={t("options.openAiService.sectionDescription")}
              headerMeta={
                <StatusPill
                  label={openAiServiceState.label}
                  tone={openAiServiceState.tone}
                />
              }
            >
              <SurfacePanel className="space-y-3.5">
                <div className="rounded-[1.7rem] border border-[var(--app-accent-border)] bg-[linear-gradient(135deg,var(--app-accent-soft),var(--app-surface)_58%,var(--app-surface-soft))] px-4 py-4 shadow-[0_14px_30px_var(--app-shadow)] sm:px-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-accent)]">
                        {t("options.openAiService.sharedService")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--app-text)]">
                          {t("options.openAiService.serviceName")}
                        </h3>
                        <StatusPill
                          label={openAiServiceState.label}
                          tone={openAiServiceState.tone}
                        />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                        {t("options.openAiService.serviceDescription")}
                      </p>
                    </div>
                    <IconButton
                      onClick={verifyOpenAiSetupNow}
                      loading={connectionState.status === "verifying"}
                      icon={<BeakerIcon />}
                      label={
                        connectionState.status === "verifying"
                          ? t("options.openAiService.verifyingLabel")
                          : t("options.openAiService.verificationLabel")
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <InlineStatus
                      status={connectionState.status}
                      message={connectionState.message}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {OPENAI_SERVICE_HIGHLIGHT_KEYS.map((highlightKey) => (
                      <span
                        key={highlightKey}
                        className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]"
                      >
                        {t(`options.openAiService.highlights.${highlightKey}`)}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--app-text-faint)]">
                        {t("options.openAiService.cards.translationTitle")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--app-text)]">
                        {t("options.openAiService.cards.translationBody")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--app-text-faint)]">
                        {t("options.openAiService.cards.summariesTitle")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--app-text)]">
                        {t("options.openAiService.cards.summariesBody")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--app-text-faint)]">
                        {t("options.openAiService.cards.assistantTitle")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--app-text)]">
                        {t("options.openAiService.cards.assistantBody")}
                      </p>
                    </div>
                  </div>
                </div>
              </SurfacePanel>

              <ApiKeyInput
                value={currentOpenAiApiKey}
                onChange={setCurrentOpenAiApiKey}
              />

              <Select
                label={t("options.openAiService.modelLabel")}
                value={settings.model}
                onChange={(v) => updateSetting("model", v)}
                options={openAiModels}
              />
            </SettingsSection>

            <SettingsSection
              id="translation"
              eyebrow={t("options.sections.translation.eyebrow")}
              title={t("options.sections.translation.title")}
              description={t("options.sections.translation.description")}
              headerMeta={openAiDependencyIndicator}
            >
              <SurfacePanel className="space-y-3.5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.translation.bestFor.title")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.translation.bestFor.description")}
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.translation.keepLean.title")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.translation.keepLean.description")}
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.translation.avoid.title")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.translation.avoid.description")}
                    </p>
                  </div>
                </div>
                <TextArea
                  label={t("options.translation.instructionsLabel")}
                  value={settings.customPrompt}
                  onChange={(v) => updateSetting("customPrompt", v)}
                  hint={t("options.translation.instructionsHint")}
                  optional
                  maxLength={CUSTOM_TRANSLATION_INSTRUCTIONS_MAX_LENGTH}
                  showCharacterCount
                />
              </SurfacePanel>
            </SettingsSection>

            <SettingsSection
              id="profiles"
              eyebrow={t("options.sections.profiles.eyebrow")}
              title={t("options.sections.profiles.title")}
              description={t("options.sections.profiles.description")}
              headerMeta={openAiDependencyIndicator}
            >
              <div className="grid gap-3">
                <Select
                  label={t("options.profiles.editor.defaultOutputLanguage")}
                  value={settings.summaryLanguage}
                  onChange={(value) => updateSetting("summaryLanguage", value)}
                  options={languageOptions}
                />
              </div>

              <SurfacePanel className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <h3 className="text-sm font-medium text-[var(--app-text)]">
                      {t("options.profiles.editor.title")}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.profiles.editor.description")}
                    </p>
                  </div>
                  <ActionButton
                    label={t("options.profiles.editor.addProfile")}
                    icon={<PlusIcon className="h-4 w-4" />}
                    onClick={addSummaryProfile}
                    variant="accent"
                    size="compact"
                    className="border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_72%,var(--app-surface))] text-[var(--app-accent)] shadow-[0_12px_24px_color-mix(in_srgb,var(--app-accent)_10%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--app-accent-soft)_88%,var(--app-surface))]"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[288px_minmax(0,1fr)]">
                  <div className="rounded-[1.8rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                        {t("options.profiles.editor.listTitle")}
                      </p>
                      <span className="text-xs text-[var(--app-text-faint)]">
                        {t("options.profiles.editor.totalCount", {
                          count: settings.summaryProfiles.length,
                        })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {settings.summaryProfiles.map((profile) => (
                        <ProfileListItem
                          key={profile.id}
                          profile={profile}
                          selected={profile.id === selectedSummaryProfile?.id}
                          isDefault={profile.id === settings.defaultSummaryProfileId}
                          isProtected={isProtectedSummaryProfile(profile.id)}
                          onSelect={() => setSelectedSummaryProfileId(profile.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedSummaryProfile ? (
                    <SummaryProfileEditor
                      profile={selectedSummaryProfile}
                      isDefault={
                        selectedSummaryProfile.id ===
                        settings.defaultSummaryProfileId
                      }
                      isProtected={isProtectedSummaryProfile(
                        selectedSummaryProfile.id
                      )}
                      canSetDefault={
                        !isProtectedSummaryProfile(selectedSummaryProfile.id) ||
                        canUseProtectedAsDefault
                      }
                      canDelete={
                        settings.summaryProfiles.length > 1 &&
                        !isProtectedSummaryProfile(selectedSummaryProfile.id)
                      }
                      onSetDefault={() =>
                        updateSetting(
                          "defaultSummaryProfileId",
                          selectedSummaryProfile.id
                        )
                      }
                      onChange={(updates) =>
                        updateSummaryProfile(selectedSummaryProfile.id, updates)
                      }
                      onDelete={() =>
                        deleteSummaryProfile(selectedSummaryProfile.id)
                      }
                    />
                  ) : null}
                </div>
              </SurfacePanel>
            </SettingsSection>

            <SettingsSection
              id="cloud-sync"
              eyebrow={t("options.sections.cloudSync.eyebrow")}
              title={t("options.sections.cloudSync.title")}
              description={t("options.sections.cloudSync.description")}
            >
              <SurfacePanel className="bg-[var(--app-surface-soft)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-[var(--app-text)]">
                        {t("options.cloudSync.overview.title")}
                      </h3>
                      <StatusPill
                        label={overallCloudSync.label}
                        tone={overallCloudSync.tone}
                      />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {overallCloudSync.description}
                    </p>
                  </div>
                  <ActionButton
                    label={t("options.cloudSync.actions.refreshStatus")}
                    icon={<RefreshIcon className="h-4 w-4" />}
                    onClick={() => {
                      void refreshCloudSyncState();
                    }}
                    disabled={cloudSyncMutationState.status === "loading"}
                  />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.cloudSync.stats.currentDevice")}
                    </p>
                    <p
                      className="mt-2 text-sm font-medium text-[var(--app-text)]"
                      dir={getDynamicTextDirection(settings.deviceLabel)}
                    >
                      {settings.deviceLabel}
                    </p>
                    <p
                      className="mt-1 text-xs text-[var(--app-text-muted)]"
                      style={DYNAMIC_TEXT_STYLE}
                      dir={getDynamicTextDirection(settings.deviceId)}
                    >
                      {settings.deviceId}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.cloudSync.stats.connectedProviders")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--app-text)]">
                      {connectedCloudProviderCount}
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                      {connectedCloudProviderCount === 0
                        ? t("options.cloudSync.stats.connectedProvidersNone")
                        : connectedCloudProviderCount === 1
                          ? t("options.cloudSync.stats.connectedProvidersOne")
                          : t("options.cloudSync.stats.connectedProvidersTwo")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.cloudSync.stats.lastSuccessfulSync")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--app-text)]">
                      {formatTimestampLabel(
                        latestSuccessfulCloudSyncAt || undefined,
                        t
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                      {t("options.cloudSync.stats.lastSuccessfulSyncHint")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.cloudSync.stats.queueStatus")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--app-text)]">
                      {cloudSyncState.queueSize === 0
                        ? t("options.cloudSync.queue.noQueuedChanges")
                        : t("options.cloudSync.queue.queuedChanges", {
                            count: cloudSyncState.queueSize,
                          })}
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                      {cloudSyncState.engine.running
                        ? t("options.cloudSync.queue.engineProcessing")
                        : cloudSyncState.dueTaskCount > 0
                          ? t("options.cloudSync.queue.tasksReady", {
                              count: cloudSyncState.dueTaskCount,
                            })
                          : t("options.cloudSync.queue.engineIdle")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[var(--app-text)]">
                      {t("options.cloudSync.syncHealth.title")}
                    </p>
                    <StatusPill
                      label={
                        cloudSyncMutationState.status === "error"
                          ? t("options.cloudSync.syncHealth.attention")
                          : t("options.cloudSync.syncHealth.status")
                      }
                      tone={cloudSyncMutationState.status === "error" ? "danger" : "neutral"}
                    />
                  </div>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]"
                    style={DYNAMIC_TEXT_STYLE}
                    dir={getDynamicTextDirection(cloudSyncMutationState.message)}
                  >
                    {cloudSyncMutationState.message}
                  </p>
                </div>
              </SurfacePanel>

              {pendingSettingsDecision ? (
                <SurfacePanel className="border-[var(--app-accent-border)] bg-[linear-gradient(135deg,var(--app-accent-soft),var(--app-surface)_52%,var(--app-surface-soft))]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-[var(--app-text)]">
                          {t("options.cloudSync.pendingChoice.title")}
                        </h3>
                        <StatusPill
                          label={t("options.cloudSync.pendingChoice.badge")}
                          tone="accent"
                        />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                        {t("options.cloudSync.pendingChoice.description")}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--app-text-faint)]">
                        <CloudSyncProviderBadge
                          provider={pendingSettingsDecision.provider}
                          size="sm"
                        />
                        <span>
                          {t("options.cloudSync.pendingChoice.source", {
                            provider:
                              pendingSettingsProviderDetail?.title ||
                              pendingSettingsDecision.provider,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        label={t("options.cloudSync.pendingChoice.keepLocal")}
                        variant="default"
                        onClick={() => {
                          void resolveSettingsChoice("keep-local");
                        }}
                        isLoading={cloudSyncMutationState.status === "loading"}
                      />
                      <ActionButton
                        label={t("options.cloudSync.pendingChoice.useCloud")}
                        variant="accent"
                        onClick={() => {
                          void resolveSettingsChoice("use-cloud");
                        }}
                        isLoading={cloudSyncMutationState.status === "loading"}
                      />
                    </div>
                  </div>
                </SurfacePanel>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                {cloudSyncProviderDetails.map((providerDetail) => {
                  const checkpoint = getProviderCheckpoint(
                    cloudSyncState.checkpoints,
                    providerDetail.id
                  );
                  const healthMeta = getCloudSyncHealthMeta(
                    checkpoint?.healthState,
                    t
                  );
                  const connectionMeta = getCloudSyncConnectionMeta(checkpoint, t);
                  const syncMeta = getCloudSyncSyncMeta(checkpoint, t);
                  const statusMessage = getCloudSyncStatusMessage(checkpoint, t);
                  const isBusy =
                    cloudSyncMutationState.status === "loading" &&
                    cloudSyncMutationState.provider === providerDetail.id;
                  const canRetry = Boolean(
                    checkpoint?.connected && checkpoint.manualRetryAvailable
                  );
                  const providerConfigured =
                    settings.connectedCloudProviders.includes(providerDetail.id);
                  const providerSupported = checkpoint?.supported !== false;
                  const needsReconnect = Boolean(
                    checkpoint?.connected &&
                      providerSupported &&
                      !checkpoint.manualRetryAvailable &&
                      (checkpoint.healthState === "action-required" ||
                        checkpoint.healthState === "needs-attention")
                  );
                  const canRemoveUnsupportedProvider = Boolean(
                    !providerSupported && providerConfigured
                  );

                  return (
                    <SurfacePanel
                      key={providerDetail.id}
                      className="bg-[var(--app-surface-soft)] p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-3.5">
                        <div className="flex flex-col gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <CloudSyncProviderBadge provider={providerDetail.id} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className="text-base font-medium leading-snug text-[var(--app-text)]"
                                  style={DYNAMIC_TEXT_STYLE}
                                >
                                  {providerDetail.title}
                                </h3>
                                <StatusPill
                                  label={healthMeta.label}
                                  tone={healthMeta.tone}
                                />
                              </div>
                              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                                {providerDetail.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!checkpoint?.connected && providerSupported ? (
                              <ActionButton
                                label={t("options.cloudSync.actions.connect")}
                                variant="accent"
                                onClick={() => {
                                  void connectProvider(providerDetail.id);
                                }}
                                isLoading={isBusy}
                              />
                            ) : canRetry ? (
                              <ActionButton
                                label={t("options.cloudSync.actions.retryNow")}
                                icon={<RefreshIcon className="h-4 w-4" />}
                                variant="accent"
                                onClick={() => {
                                  void retryProvider(providerDetail.id);
                                }}
                                isLoading={isBusy}
                              />
                            ) : needsReconnect ? (
                              <ActionButton
                                label={t("options.cloudSync.actions.reconnect")}
                                icon={<RefreshIcon className="h-4 w-4" />}
                                variant="accent"
                                onClick={() => {
                                  void reconnectProvider(providerDetail.id);
                                }}
                                isLoading={isBusy}
                              />
                            ) : null}

                            {checkpoint?.connected || canRemoveUnsupportedProvider ? (
                              <ActionButton
                                label={t("options.cloudSync.actions.disconnect")}
                                variant="default"
                                onClick={() => {
                                  void disconnectProvider(providerDetail.id);
                                }}
                                isLoading={isBusy}
                              />
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <CloudSyncStatCard
                            label={t("options.cloudSync.providerCard.account")}
                            value={connectionMeta.title}
                            description={connectionMeta.description}
                          />
                          <CloudSyncStatCard
                            label={t("options.cloudSync.providerCard.lastSuccessfulSync")}
                            value={syncMeta.title}
                            description={syncMeta.description}
                          />
                          <CloudSyncStatCard
                            label={t("options.cloudSync.providerCard.providerStatus")}
                            value={healthMeta.label}
                            description={statusMessage}
                          />
                        </div>
                      </div>
                    </SurfacePanel>
                  );
                })}
              </div>

              <SurfacePanel className="bg-[var(--app-surface-soft)]">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--app-text)]">
                      {t("options.cloudSync.scope.sharedTitle")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cloudSyncScopeShared.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--app-text)]">
                      {t("options.cloudSync.scope.localTitle")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cloudSyncScopeLocal.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </SurfacePanel>
            </SettingsSection>

            <SettingsSection
              id="data-recovery"
              eyebrow={t("options.sections.dataRecovery.eyebrow")}
              title={t("options.sections.dataRecovery.title")}
              description={t("options.sections.dataRecovery.description")}
            >
                <input
                  ref={dataImportInputRef}
                  type="file"
                  accept=".mcbak"
                  className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (!file) {
                    return;
                  }

                  handleImportBackup(file);
                }}
              />

              <SurfacePanel className="bg-[var(--app-surface-soft)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <h3 className="text-sm font-medium text-[var(--app-text)]">
                      {t("options.dataRecovery.backupFile.title")}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.dataRecovery.backupFile.description")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <IconButton
                      onClick={handleExportBackup}
                      disabled={backupPassphrase.length < 8}
                      loading={dataTransferState.status === "exporting"}
                      icon={<ExportIcon />}
                      label={t("options.dataRecovery.backupFile.export")}
                      variant="accent"
                    />
                    <IconButton
                      onClick={triggerDataImport}
                      disabled={backupPassphrase.length < 8}
                      loading={dataTransferState.status === "importing"}
                      icon={<PlusIcon />}
                      label={t("options.dataRecovery.backupFile.import")}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] backdrop-blur-xl sm:p-4">
                    <label className="mb-2.5 block text-sm font-medium text-[var(--app-text)]">
                      {t("options.dataRecovery.passphrase.label")}
                    </label>
                    <div className="relative">
                      <input
                        type={showBackupPassphrase ? "text" : "password"}
                        value={backupPassphrase}
                        onChange={(event) => setBackupPassphrase(event.target.value)}
                        placeholder={t("options.dataRecovery.passphrase.placeholder")}
                        dir="auto"
                        className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 pr-12 text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-faint)] focus:border-[var(--app-accent)]"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <IconButton
                          onClick={() =>
                            setShowBackupPassphrase((current) => !current)
                          }
                          icon={
                            showBackupPassphrase ? <EyeOffIcon /> : <EyeIcon />
                          }
                          label={
                            showBackupPassphrase
                              ? t("options.dataRecovery.passphrase.hide")
                              : t("options.dataRecovery.passphrase.show")
                          }
                          size="sm"
                          className="border-transparent bg-transparent shadow-none"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.dataRecovery.passphrase.hint")}
                    </p>
                  </div>
                  <div className="mt-4">
                    <InlineStatus
                      status={dataTransferState.status}
                      message={dataTransferState.message}
                    />
                  </div>
                </div>
              </SurfacePanel>

              <SurfacePanel className="bg-[var(--app-surface-soft)]">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.dataRecovery.cards.scope.title")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.dataRecovery.cards.scope.description")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.dataRecovery.cards.restoreBehavior.title")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.dataRecovery.cards.restoreBehavior.description")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
                      {t("options.dataRecovery.cards.useCase.title")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {t("options.dataRecovery.cards.useCase.description")}
                    </p>
                  </div>
                </div>
              </SurfacePanel>

              <SurfacePanel className="bg-[var(--app-surface-soft)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <h3 className="text-sm font-medium text-[var(--app-text)]">
                      {t("options.dataRecovery.deleteArchive.title")}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                      {hasConnectedCloudProviders
                        ? t("options.dataRecovery.deleteArchive.syncedDescription")
                        : t("options.dataRecovery.deleteArchive.localDescription")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <IconButton
                      onClick={() => setConfirmClearSessionData(true)}
                      loading={dataTransferState.status === "clearing"}
                      icon={<TrashIcon />}
                      label={confirmClearSessionLabel}
                      variant="danger"
                    />
                  </div>
                </div>
              </SurfacePanel>
            </SettingsSection>
          </div>

        </div>
      </div>
      <DiagnosticsConsole />
    </div>
  );
}
