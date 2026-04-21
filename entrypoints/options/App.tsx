import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  LegalRiskAcknowledgementKey,
  MeetingProfile,
} from "../background/types";
import type { CloudSyncProvider } from "../background/types";
import {
  ApiKeyInput,
  getMeetingArchiveRetentionOptions,
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
import {
  GitHubHeaderLink,
  LegalFooter,
} from "../shared/extension-page-frame";
import { ConfirmDialog } from "../meeting-history/components/confirm-dialog";
import {
  ArchiveIcon,
  AlertTriangleIcon,
  BeakerIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  ExportIcon,
  GearIcon,
  PlusIcon,
  RefreshIcon,
  SpinnerIcon,
  SparklesIcon,
  TrashIcon,
} from "../shared/icons";
import {
  createDefaultAssistantConfig,
  isProtectedMeetingProfile,
} from "../shared/meeting-profiles";
import { useCloudSync } from "./use-cloud-sync";
import {
  MAX_SESSION_CONTINUATION_WINDOW_MINUTES,
  MIN_SESSION_CONTINUATION_WINDOW_MINUTES,
  SESSION_CONTINUATION_WINDOW_MINUTE_STOPS,
} from "../shared/settings-defaults";
import { DiagnosticsConsole } from "./diagnostics-console";
import { AppLoadingScreen } from "../shared/loading-screen";
import { HelpPopover } from "../shared/help-popover";
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
import {
  isLegalRiskSettingActive,
  shouldPromptForLegalRiskAcknowledgement,
} from "./legal-risk-settings";
import {
  buildCloudSyncProviderCardModels,
  type CloudSyncProviderCardModel,
  formatCloudSyncTimestampLabel,
  getCloudSyncOverviewMeta,
  getCloudSyncProviderDetails,
  getCloudSyncScopeLocal,
  getCloudSyncScopeShared,
} from "./cloud-sync-view-model";

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

function getSettingsSectionIcon(sectionId: SettingsSectionId) {
  switch (sectionId) {
    case "workspace":
      return GearIcon;
    case "openai-service":
      return SparklesIcon;
    case "translation":
      return BeakerIcon;
    case "profiles":
      return EditIcon;
    case "cloud-sync":
      return RefreshIcon;
    case "data-recovery":
      return ArchiveIcon;
    default:
      return GearIcon;
  }
}

function SettingsSectionIcon({
  sectionId,
  size = "md",
  active = false,
}: {
  sectionId: SettingsSectionId;
  size?: "sm" | "md";
  active?: boolean;
}) {
  const Icon = getSettingsSectionIcon(sectionId);
  const sizeClassName =
    size === "sm"
      ? "h-8 w-8 rounded-[0.95rem]"
      : "h-11 w-11 rounded-[1.25rem]";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center border shadow-[0_12px_24px_var(--app-shadow)] transition-colors",
        sizeClassName,
        active
          ? "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_84%,var(--app-surface))] text-[var(--app-accent)]"
          : "border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface)_78%,var(--app-accent-soft))] text-[var(--app-text-muted)]",
      ].join(" ")}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}

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
const ASSISTANT_PROFILE_PROMPT_MAX_LENGTH = 8000;
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
        "rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 shadow-[0_18px_40px_var(--app-shadow)] sm:p-6",
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
      className="scroll-mt-6 grid gap-4 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 shadow-[0_20px_40px_var(--app-shadow)] sm:p-5 xl:gap-5 xl:p-5"
    >
      <div className="flex items-start gap-3.5">
        <SettingsSectionIcon sectionId={id} />
        <div className="min-w-0">
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
        {sections.map((section) => {
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
              <SettingsSectionIcon sectionId={section.id} size="sm" active={isActive} />
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

type StatusPillTone = "neutral" | "accent" | "success" | "warning" | "danger";
type StatusPillMotion = "none" | "pulse" | "processing";

type StatusPillProps = {
  label: string;
  tone: StatusPillTone;
  motion?: StatusPillMotion;
  indicator?: boolean;
};

const STATUS_PILL_CLASSNAMES: Record<StatusPillTone, string> = {
  neutral:
    "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]",
  accent:
    "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]",
  success:
    "border-[var(--app-success-border)] bg-[color:color-mix(in_srgb,var(--app-success-soft)_84%,var(--app-surface))] text-[var(--app-success)] shadow-[0_10px_24px_color-mix(in_srgb,var(--app-success)_14%,transparent)]",
  warning:
    "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)]",
  danger:
    "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]",
};

function StatusPillIndicator({
  motion,
}: {
  motion: StatusPillMotion;
}) {
  if (motion === "processing") {
    return (
      <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-30" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
      </span>
    );
  }

  if (motion === "pulse") {
    return <span className="inline-flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-current" />;
  }

  return <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-current/75" />;
}

const StatusPill = ({
  label,
  tone,
  motion = "none",
  indicator = false,
}: StatusPillProps) => {
  const showIndicator = indicator || motion !== "none";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_PILL_CLASSNAMES[tone]}`}
    >
      {showIndicator ? <StatusPillIndicator motion={motion} /> : null}
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

type LegalRiskDialogCopy = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  confirmLabel: string;
  warningLabel: string;
  warningTitle: string;
  warningBody: string;
};

type PendingLegalRiskChange =
  | {
      riskId: LegalRiskAcknowledgementKey;
      key: "captureStartupBehavior";
      value: "off" | "ask" | "always";
    }
  | {
      riskId: LegalRiskAcknowledgementKey;
      key: "captionActivationBehavior";
      value: "guided" | "automatic";
    }
  | {
      riskId: LegalRiskAcknowledgementKey;
      key: "storeMeetingChat";
      value: boolean;
    };

function getLegalRiskDialogCopy(
  riskId: LegalRiskAcknowledgementKey,
  t: UiTranslator
): LegalRiskDialogCopy {
  return {
    eyebrow: t("options.legalRisk.shared.eyebrow"),
    title: t(`options.legalRisk.${riskId}.dialog.title`),
    body: t(`options.legalRisk.${riskId}.dialog.body`),
    points: [
      t(`options.legalRisk.${riskId}.dialog.pointOne`),
      t(`options.legalRisk.${riskId}.dialog.pointTwo`),
      t(`options.legalRisk.${riskId}.dialog.pointThree`),
    ],
    confirmLabel: t(`options.legalRisk.${riskId}.dialog.confirm`),
    warningLabel: t("options.legalRisk.shared.warningLabel"),
    warningTitle: t(`options.legalRisk.${riskId}.warning.title`),
    warningBody: t(`options.legalRisk.${riskId}.warning.body`),
  };
}

function LegalRiskDialogBody({
  body,
  points,
}: {
  body: string;
  points: string[];
}) {
  return (
    <div className="space-y-3">
      <p>{body}</p>
      <ul className="space-y-2 rounded-[1.4rem] border border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_68%,var(--app-surface))] px-4 py-3 text-[13px] leading-relaxed text-[var(--app-text)]">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-3.5 rounded-full bg-[var(--app-warning)]" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalRiskNotice({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_62%,var(--app-surface))] px-4 py-3.5 shadow-[0_14px_30px_var(--app-shadow)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full border border-[var(--app-warning-border)] bg-[var(--app-surface)] p-2 text-[var(--app-warning)]">
          <AlertTriangleIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={label} tone="warning" />
            <h3 className="text-sm font-medium text-[var(--app-text)]">{title}</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
            {body}
          </p>
        </div>
      </div>
    </div>
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
  loadingLabel?: string;
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
  loadingLabel,
  variant = "default",
  size = "default",
  disabled = false,
  isLoading = false,
  className,
}: ActionButtonProps) => {
  const t = useT();
  const resolvedIcon = isLoading ? (
    <SpinnerIcon className="h-4 w-4 animate-spin" />
  ) : (
    icon
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={[
        "inline-flex items-center justify-center rounded-full border font-medium transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out hover:-translate-y-[1px] disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0",
        ACTION_BUTTON_SIZE_CLASSNAMES[size],
        ACTION_BUTTON_CLASSNAMES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {resolvedIcon ? (
        <span className="inline-flex h-4 w-4 items-center justify-center">
          {resolvedIcon}
        </span>
      ) : null}
      <span>{isLoading ? loadingLabel || t("common.actions.working") : label}</span>
    </button>
  );
};

function CloudSyncMetaChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface)_82%,white)] px-2.5 py-1.5 text-[11px] text-[var(--app-text-muted)]">
      <span className="font-medium uppercase tracking-[0.12em] text-[var(--app-text-faint)]">
        {label}
      </span>
      <span
        className="max-w-[220px] truncate text-[12px] font-medium text-[var(--app-text)]"
        style={DYNAMIC_TEXT_STYLE}
        dir={getDynamicTextDirection(value)}
      >
        {value}
      </span>
    </div>
  );
}

function CloudSyncActivityBanner({
  status,
  message,
  detail,
}: {
  status: "loading" | "success" | "error";
  message: string;
  detail?: string;
}) {
  const toneClassName =
    status === "error"
      ? "border-[var(--app-danger-border)] bg-[color:color-mix(in_srgb,var(--app-danger-soft)_72%,var(--app-surface))]"
      : status === "success"
        ? "border-[var(--app-success-border)] bg-[color:color-mix(in_srgb,var(--app-success-soft)_74%,var(--app-surface))]"
        : "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_62%,var(--app-surface))]";
  const icon =
    status === "error" ? (
      <AlertTriangleIcon className="h-4 w-4" />
    ) : status === "success" ? (
      <CheckIcon className="h-4 w-4" />
    ) : (
      <SpinnerIcon className="h-4 w-4 animate-spin" />
    );
  const iconToneClassName =
    status === "error"
      ? "text-[var(--app-danger)]"
      : status === "success"
        ? "text-[var(--app-success)]"
        : "text-[var(--app-accent)]";

  return (
    <div className={`rounded-[1.35rem] border px-4 py-3 ${toneClassName}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/10 bg-[color:color-mix(in_srgb,var(--app-surface-strong)_84%,transparent)] ${iconToneClassName}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p
            className="text-sm font-medium text-[var(--app-text)]"
            style={DYNAMIC_TEXT_STYLE}
            dir={getDynamicTextDirection(message)}
          >
            {message}
          </p>
          {detail ? (
            <p
              className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]"
              style={DYNAMIC_TEXT_STYLE}
              dir={getDynamicTextDirection(detail)}
            >
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CloudSyncProcessingDots({
  tone,
}: {
  tone: StatusPillTone;
}) {
  const dotClassName =
    tone === "warning"
      ? "bg-[var(--app-warning)]"
      : tone === "danger"
        ? "bg-[var(--app-danger)]"
        : tone === "success"
          ? "bg-[var(--app-success)]"
          : "bg-[var(--app-accent)]";

  return (
    <span className="inline-flex items-center gap-1.5">
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className={`h-1.5 w-1.5 animate-pulse rounded-full ${dotClassName}`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function CloudSyncInlineMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
}) {
  const toneClassName =
    tone === "accent"
      ? "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_76%,var(--app-surface))]"
      : tone === "warning"
        ? "border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_80%,var(--app-surface))]"
        : "border-[var(--app-border)] bg-[var(--app-surface)]";

  return (
    <div
      className={`rounded-full border px-3 py-2 shadow-[0_10px_24px_var(--app-shadow)] ${toneClassName}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
        {label}
      </span>
      <span className="ml-2 text-sm font-medium text-[var(--app-text)]">
        {value}
      </span>
    </div>
  );
}

type CloudSyncSignalTileProps = {
  label: string;
  value: string;
  description: string;
  tone?: "default" | "accent" | "warning";
  valueClassName?: string;
  descriptionClassName?: string;
};

const CLOUD_SYNC_SIGNAL_TILE_CLASSNAMES: Record<
  NonNullable<CloudSyncSignalTileProps["tone"]>,
  string
> = {
  default:
    "border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface-strong)_76%,var(--app-surface))]",
  accent:
    "border-[var(--app-accent-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-accent-soft)_76%,var(--app-surface-strong)),color-mix(in_srgb,var(--app-surface)_94%,var(--app-surface-soft)))]",
  warning:
    "border-[var(--app-warning-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-warning-soft)_74%,var(--app-surface-strong)),color-mix(in_srgb,var(--app-surface)_94%,var(--app-surface-soft)))]",
};

const CloudSyncSignalTile = ({
  label,
  value,
  description,
  tone = "default",
  valueClassName,
  descriptionClassName,
}: CloudSyncSignalTileProps) => {
  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-3.5 shadow-[0_14px_30px_var(--app-shadow)] ${CLOUD_SYNC_SIGNAL_TILE_CLASSNAMES[tone]}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
        {label}
      </p>
      <p
        className={[
          "mt-2 text-[0.98rem] font-medium leading-snug text-[var(--app-text)]",
          valueClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        style={DYNAMIC_TEXT_STYLE}
        dir={getDynamicTextDirection(value)}
      >
        {value}
      </p>
      <p
        className={[
          "mt-1 text-[11px] leading-relaxed text-[var(--app-text-muted)]",
          descriptionClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        style={DYNAMIC_TEXT_STYLE}
        dir={getDynamicTextDirection(description)}
      >
        {description}
      </p>
    </div>
  );
};

function CloudSyncScopeList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "shared" | "local";
}) {
  const itemToneClassName =
    tone === "shared"
      ? "border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_72%,var(--app-surface-strong))] text-[var(--app-accent)]"
      : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]";

  return (
    <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface-strong)_74%,var(--app-surface-soft))] px-4 py-4">
      <p className="text-sm font-medium text-[var(--app-text)]">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${itemToneClassName}`}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/20 bg-[color:color-mix(in_srgb,var(--app-surface-strong)_82%,transparent)]">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CloudSyncProviderRow({
  providerCard,
  t,
  onConnect,
  onRetry,
  onReconnect,
  onDisconnect,
}: {
  providerCard: CloudSyncProviderCardModel;
  t: UiTranslator;
  onConnect: (provider: CloudSyncProvider) => void;
  onRetry: (provider: CloudSyncProvider) => void;
  onReconnect: (provider: CloudSyncProvider) => void;
  onDisconnect: (provider: CloudSyncProvider) => void;
}) {
  const providerMetaLine = providerCard.checkpoint?.connected
    ? providerCard.connection.title
    : providerCard.subtitle;
  const providerActionHint = providerCard.statusDetail || providerCard.connection.description;
  const showProcessingState =
    providerCard.isBusy ||
    providerCard.health.motion === "processing" ||
    providerCard.health.motion === "pulse";
  const rowSurfaceClassName =
    providerCard.health.tone === "danger"
      ? "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-danger-soft)_34%,var(--app-surface-strong)),color-mix(in_srgb,var(--app-surface)_88%,var(--app-danger-soft)))]"
      : providerCard.health.tone === "warning"
        ? "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-warning-soft)_36%,var(--app-surface-strong)),color-mix(in_srgb,var(--app-surface)_88%,var(--app-warning-soft)))]"
        : providerCard.health.tone === "success"
          ? "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-success-soft)_34%,var(--app-surface-strong)),color-mix(in_srgb,var(--app-surface)_88%,var(--app-success-soft)))]"
          : providerCard.health.tone === "accent"
            ? "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-accent-soft)_36%,var(--app-surface-strong)),color-mix(in_srgb,var(--app-surface)_88%,var(--app-accent-soft)))]"
            : "bg-[linear-gradient(135deg,var(--app-surface-strong),color-mix(in_srgb,var(--app-surface)_88%,var(--app-surface-soft)))]";
  const processingLabel = providerCard.busyLabel || providerCard.health.label;

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-4 transition-[background-color,box-shadow] duration-300 ease-out sm:px-5 lg:flex-row lg:items-start lg:justify-between ${rowSurfaceClassName}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-3">
          <CloudSyncProviderBadge provider={providerCard.provider} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="text-[0.98rem] font-semibold leading-snug text-[var(--app-text)]"
                style={DYNAMIC_TEXT_STYLE}
              >
                {providerCard.title}
              </h3>
              <StatusPill
                label={providerCard.health.label}
                tone={providerCard.health.tone}
                motion={providerCard.health.motion}
                indicator
              />
            </div>
            <p
              className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]"
              style={DYNAMIC_TEXT_STYLE}
              dir={getDynamicTextDirection(providerCard.statusMessage)}
            >
              {providerCard.statusMessage}
            </p>
            {showProcessingState ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-current/10 bg-[color:color-mix(in_srgb,var(--app-surface-strong)_86%,transparent)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-text-muted)] shadow-[0_10px_20px_var(--app-shadow)]">
                <CloudSyncProcessingDots tone={providerCard.health.tone} />
                <span
                  style={DYNAMIC_TEXT_STYLE}
                  dir={getDynamicTextDirection(processingLabel)}
                >
                  {processingLabel}
                </span>
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <CloudSyncMetaChip
                label={t("options.cloudSync.providerCard.account")}
                value={providerMetaLine}
              />
              <CloudSyncMetaChip
                label={t("options.cloudSync.providerCard.lastSuccessfulSync")}
                value={providerCard.sync.title}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-[240px] flex-col gap-2 lg:items-end">
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {!providerCard.checkpoint?.connected && providerCard.providerSupported ? (
            <ActionButton
              label={t("options.cloudSync.actions.connect")}
              loadingLabel={providerCard.busyLabel}
              variant="accent"
              size="compact"
              onClick={() => {
                onConnect(providerCard.provider);
              }}
              isLoading={
                providerCard.isBusy && providerCard.busyIntent === "connect"
              }
              disabled={
                providerCard.isBusy && providerCard.busyIntent !== "connect"
              }
            />
          ) : providerCard.canRetry ? (
            <ActionButton
              label={t("options.cloudSync.actions.retryNow")}
              loadingLabel={providerCard.busyLabel}
              icon={<RefreshIcon className="h-4 w-4" />}
              variant="accent"
              size="compact"
              onClick={() => {
                onRetry(providerCard.provider);
              }}
              isLoading={
                providerCard.isBusy && providerCard.busyIntent === "retry"
              }
              disabled={
                providerCard.isBusy && providerCard.busyIntent !== "retry"
              }
            />
          ) : providerCard.needsReconnect ? (
            <ActionButton
              label={t("options.cloudSync.actions.reconnect")}
              loadingLabel={providerCard.busyLabel}
              icon={<RefreshIcon className="h-4 w-4" />}
              variant="accent"
              size="compact"
              onClick={() => {
                onReconnect(providerCard.provider);
              }}
              isLoading={
                providerCard.isBusy && providerCard.busyIntent === "reconnect"
              }
              disabled={
                providerCard.isBusy && providerCard.busyIntent !== "reconnect"
              }
            />
          ) : null}

          {providerCard.checkpoint?.connected ||
          providerCard.canRemoveUnsupportedProvider ? (
            <ActionButton
              label={t("options.cloudSync.actions.disconnect")}
              loadingLabel={providerCard.busyLabel}
              variant="default"
              size="compact"
              onClick={() => {
                onDisconnect(providerCard.provider);
              }}
              isLoading={
                providerCard.isBusy && providerCard.busyIntent === "disconnect"
              }
              disabled={
                providerCard.isBusy && providerCard.busyIntent !== "disconnect"
              }
            />
          ) : null}
        </div>
        <p
          className="text-xs leading-relaxed text-[var(--app-text-faint)] lg:max-w-[280px] lg:text-right"
          style={DYNAMIC_TEXT_STYLE}
          dir={getDynamicTextDirection(providerActionHint)}
        >
          {providerActionHint}
        </p>
      </div>
    </div>
  );
}

function AssistantProfileControls({
  profile,
  onChange,
}: {
  profile: MeetingProfile;
  onChange: (updates: Partial<MeetingProfile>) => void;
}) {
  const t = useT();
  const assistantHelp = useMemo(
    () => ({
      enabled: t("options.help.assistantEnabled"),
      responseIntent: t("options.help.assistantResponseIntent"),
      responseFormat: t("options.help.assistantResponseFormat"),
      responseDepth: t("options.help.assistantResponseDepth"),
      responseTone: t("options.help.assistantResponseTone"),
      deliveryBias: t("options.help.assistantDeliveryBias"),
      triggerPolicy: t("options.help.assistantTriggerPolicy"),
      participantScope: t("options.help.assistantParticipantScope"),
      instructions: t("options.help.assistantInstructions"),
    }),
    [t]
  );
  const responseIntentOptions = getAssistantResponseIntentOptions(t);
  const responseFormatOptions = getAssistantResponseFormatOptions(t);
  const responseDepthOptions = getAssistantResponseDepthOptions(t);
  const responseToneOptions = getAssistantResponseToneOptions(t);
  const deliveryBiasOptions = getAssistantDeliveryBiasOptions(t);
  const triggerPolicyOptions = getAssistantTriggerPolicyOptions(t);
  const participantScopeOptions = getAssistantParticipantScopeOptions(t);
  const assistantEnabled = profile.assistant.enabledByDefault;

  const updateAssistant = (
    updates: Partial<MeetingProfile["assistant"]>
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
          helpMarkdown={assistantHelp.enabled}
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
                value as MeetingProfile["assistant"]["responseIntent"],
            })
          }
          options={responseIntentOptions}
          disabled={!assistantEnabled}
          helpMarkdown={assistantHelp.responseIntent}
        />

        <Select
          label={t("options.profiles.assistant.responseFormatLabel")}
          value={profile.assistant.responseFormat}
          onChange={(value) =>
            updateAssistant({
              responseFormat:
                value as MeetingProfile["assistant"]["responseFormat"],
            })
          }
          options={responseFormatOptions}
          disabled={!assistantEnabled}
          helpMarkdown={assistantHelp.responseFormat}
        />

        <Select
          label={t("options.profiles.assistant.responseDepthLabel")}
          value={profile.assistant.responseDepth}
          onChange={(value) =>
            updateAssistant({
              responseDepth:
                value as MeetingProfile["assistant"]["responseDepth"],
            })
          }
          options={responseDepthOptions}
          disabled={!assistantEnabled}
          helpMarkdown={assistantHelp.responseDepth}
        />

        <Select
          label={t("options.profiles.assistant.responseToneLabel")}
          value={profile.assistant.responseTone}
          onChange={(value) =>
            updateAssistant({
              responseTone:
                value as MeetingProfile["assistant"]["responseTone"],
            })
          }
          options={responseToneOptions}
          disabled={!assistantEnabled}
          helpMarkdown={assistantHelp.responseTone}
        />

        <Select
          label={t("options.profiles.assistant.deliveryBiasLabel")}
          value={profile.assistant.deliveryBias}
          onChange={(value) =>
            updateAssistant({
              deliveryBias:
                value as MeetingProfile["assistant"]["deliveryBias"],
            })
          }
          options={deliveryBiasOptions}
          disabled={!assistantEnabled}
          helpMarkdown={assistantHelp.deliveryBias}
        />

        <Select
          label={t("options.profiles.assistant.triggerPolicyLabel")}
          value={profile.assistant.triggerPolicy}
          onChange={(value) =>
            updateAssistant({
              triggerPolicy:
                value as MeetingProfile["assistant"]["triggerPolicy"],
            })
          }
          options={triggerPolicyOptions}
          disabled={!assistantEnabled}
          helpMarkdown={assistantHelp.triggerPolicy}
        />

        <Select
          label={t("options.profiles.assistant.participantScopeLabel")}
          value={profile.assistant.participantScope}
          onChange={(value) =>
            updateAssistant({
              participantScope:
                value as MeetingProfile["assistant"]["participantScope"],
            })
          }
          options={participantScopeOptions}
          disabled={!assistantEnabled}
          helpMarkdown={assistantHelp.participantScope}
        />

        <TextArea
          label={t("options.profiles.assistant.instructionsLabel")}
          value={profile.assistant.prompt}
          onChange={(value) => updateAssistant({ prompt: value })}
          disabled={!assistantEnabled}
          hint={t("options.profiles.assistant.instructionsHint")}
          maxLength={ASSISTANT_PROFILE_PROMPT_MAX_LENGTH}
          showCharacterCount
          helpMarkdown={assistantHelp.instructions}
        />
      </div>
    </div>
  );
}

function ProfileFieldCard({
  label,
  helpMarkdown,
  children,
}: {
  label: string;
  helpMarkdown?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] sm:p-4">
      <div className="pointer-events-none mb-2.5 flex items-center gap-2 text-sm font-medium text-[var(--app-text)]">
        <span className="pointer-events-auto">{label}</span>
        {helpMarkdown ? (
          <HelpPopover label={label} markdown={helpMarkdown} />
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ProfileIdentityControls({
  profile,
  readOnly = false,
  onChange,
}: {
  profile: MeetingProfile;
  readOnly?: boolean;
  onChange?: (updates: Partial<MeetingProfile>) => void;
}) {
  const t = useT();
  const profileHelp = useMemo(
    () => ({
      name: t("options.help.profileName"),
      description: t("options.help.profileDescription"),
    }),
    [t]
  );

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

      <div className="mt-4 grid gap-4">
        <ProfileFieldCard
          label={t("options.profiles.identity.nameLabel")}
          helpMarkdown={profileHelp.name}
        >
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
          helpMarkdown={profileHelp.description}
        >
          {readOnly ? (
            <p
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 text-[var(--app-text)] whitespace-pre-wrap"
              style={DYNAMIC_TEXT_STYLE}
              dir={getDynamicTextDirection(profile.description)}
            >
              {profile.description}
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] transition-colors focus-within:border-[var(--app-accent)]">
              <textarea
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
                rows={3}
                className="mc-app-textarea block min-h-[104px] w-full resize-y overflow-x-hidden overflow-y-auto border-0 bg-transparent px-4 py-3 text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-faint)]"
              />
            </div>
          )}
        </ProfileFieldCard>
      </div>
    </div>
  );
}

function MeetingProfileSummaryControls({
  profile,
  onChange,
}: {
  profile: MeetingProfile;
  onChange: (updates: Partial<MeetingProfile>) => void;
}) {
  const t = useT();
  const summaryHelp = useMemo(
    () => ({
      autoSummary: t("options.help.autoSummary"),
      effort: t("options.help.summaryEffort"),
      instructions: t("options.help.summaryInstructions"),
    }),
    [t]
  );
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
          helpMarkdown={summaryHelp.autoSummary}
        />

        <Select
          label={t("options.profiles.summary.effortLabel")}
          value={profile.summaryGenerationMode}
          onChange={(value) =>
            onChange({
              summaryGenerationMode:
                value as MeetingProfile["summaryGenerationMode"],
            })
          }
          options={summaryGenerationModeOptions}
          helpMarkdown={summaryHelp.effort}
        />

        <TextArea
          label={t("options.profiles.summary.instructionsLabel")}
          value={profile.prompt}
          onChange={(value) => onChange({ prompt: value })}
          hint={t("options.profiles.summary.instructionsHint")}
          maxLength={SUMMARY_PROFILE_PROMPT_MAX_LENGTH}
          showCharacterCount
          helpMarkdown={summaryHelp.instructions}
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
  profile: MeetingProfile;
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

function MeetingProfileEditor({
  profile,
  isDefault,
  isProtected,
  canSetDefault,
  canDelete,
  onSetDefault,
  onChange,
  onDelete,
}: {
  profile: MeetingProfile;
  isDefault: boolean;
  isProtected: boolean;
  canSetDefault: boolean;
  canDelete: boolean;
  onSetDefault: () => void;
  onChange: (updates: Partial<MeetingProfile>) => void;
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
      <MeetingProfileSummaryControls profile={profile} onChange={onChange} />
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
  const meetingArchiveRetentionOptions = getMeetingArchiveRetentionOptions(t);
  const uiLanguageOptions = getUiLanguageOptions(t);
  const openAiModels = useMemo(() => getOpenAiModels(t), [t]);
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const {
    settings,
    loading,
    connectionState,
    dataTransferState,
    currentOpenAiApiKey,
    setCurrentOpenAiApiKey,
    updateSetting,
    persistSettingsNow,
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
  const resolvedTheme = useResolvedTheme(settings.appearance, {
    deferDocumentApply: loading,
  });
  const customMeetingProfiles = settings.meetingProfiles.filter(
    (profile) => !isProtectedMeetingProfile(profile.id)
  );
  const canUseProtectedAsDefault = customMeetingProfiles.length === 0;
  const defaultMeetingProfile = settings.meetingProfiles.find(
    (profile) => profile.id === settings.defaultMeetingProfileId
  );
  const currentModelLabel =
    openAiModels.find((model) => model.id === settings.model)?.name ||
    settings.model;
  const settingsHelp = useMemo(
    () => ({
      apiKey: t("options.help.apiKey"),
      model: t("options.help.model"),
      uiLanguage: t("options.help.uiLanguage"),
      translationInstructions: t("options.help.translationInstructions"),
      captureStartupBehavior: t("options.help.captureStartupBehavior"),
      captionActivationBehavior: t("options.help.captionActivationBehavior"),
      sessionContinuationWindow: t("options.help.sessionContinuationWindow"),
      overlayClickThrough: t("options.help.overlayClickThrough"),
      meetingArchiveRetention: t("options.help.meetingArchiveRetention"),
      storeMeetingChat: t("options.help.storeMeetingChat"),
      meetingOutputLanguage: t("options.help.meetingOutputLanguage"),
    }),
    [t]
  );
  const cloudSyncProviderDetails = useMemo(
    () => getCloudSyncProviderDetails(t),
    [t]
  );
  const cloudSyncScopeShared = useMemo(() => getCloudSyncScopeShared(t), [t]);
  const cloudSyncScopeLocal = useMemo(() => getCloudSyncScopeLocal(t), [t]);
  const overallCloudSync = getCloudSyncOverviewMeta(
    cloudSyncState.checkpoints,
    cloudSyncLoading,
    t,
    {
      queueSize: cloudSyncState.queueSize,
      dueTaskCount: cloudSyncState.dueTaskCount,
    }
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
  const queueSummaryLabel =
    cloudSyncState.queueSize === 0
      ? t("options.cloudSync.queue.noQueuedChanges")
      : t("options.cloudSync.queue.queuedChanges", {
          count: cloudSyncState.queueSize,
        });
  const queueDetailLabel = cloudSyncState.engine.running
    ? t("options.cloudSync.queue.engineProcessing")
    : cloudSyncState.dueTaskCount > 0
      ? t("options.cloudSync.queue.tasksReady", {
          count: cloudSyncState.dueTaskCount,
        })
      : t("options.cloudSync.queue.engineIdle");
  const queueNeedsConnection = Boolean(
    connectedCloudProviderCount === 0 && cloudSyncState.queueSize > 0
  );
  const showQueueStatusMetric = connectedCloudProviderCount > 0;
  const protectionSummaryTitle =
    connectedCloudProviderCount === 0
      ? t("options.cloudSync.connection.notConnectedTitle")
      : queueNeedsConnection || overallCloudSync.tone === "warning"
      ? queueSummaryLabel
      : overallCloudSync.label;
  const protectionSummaryDescription =
    connectedCloudProviderCount === 0
      ? t("options.runtime.cloudSync.idleDisconnected")
      : overallCloudSync.description;
  const isCloudSyncRefreshing =
    cloudSyncLoading ||
    (cloudSyncMutationState.status === "loading" &&
      cloudSyncMutationState.intent === "refresh");
  const showCloudSyncActivityBanner =
    cloudSyncMutationState.status === "loading" ||
    cloudSyncMutationState.status === "success" ||
    cloudSyncMutationState.status === "error";
  const cloudSyncActivityStatus: "loading" | "success" | "error" | null =
    cloudSyncMutationState.status === "idle"
      ? null
      : cloudSyncMutationState.status;
  const cloudSyncProviderCards = useMemo(
    () =>
      buildCloudSyncProviderCardModels({
        checkpoints: cloudSyncState.checkpoints,
        providerDetails: cloudSyncProviderDetails,
        mutationState: cloudSyncMutationState,
        settingsConnectedCloudProviders: settings.connectedCloudProviders,
        t,
      }),
    [
      cloudSyncMutationState,
      cloudSyncProviderDetails,
      cloudSyncState.checkpoints,
      settings.connectedCloudProviders,
      t,
    ]
  );
  const hasConnectedCloudProviders = connectedCloudProviderCount > 0;
  const [activeSection, setActiveSection] = useState<string>(
    SETTINGS_SECTION_IDS[0]
  );
  const [cloudSyncDetailsExpanded, setCloudSyncDetailsExpanded] = useState(false);
  const [selectedMeetingProfileId, setSelectedMeetingProfileId] = useState<string>(
    settings.defaultMeetingProfileId || settings.meetingProfiles[0]?.id || ""
  );
  const initialMeetingProfileSelectionAppliedRef = useRef(false);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [showBackupPassphrase, setShowBackupPassphrase] = useState(false);
  const [confirmClearSessionData, setConfirmClearSessionData] = useState(false);
  const [pendingLegalRiskChange, setPendingLegalRiskChange] =
    useState<PendingLegalRiskChange | null>(null);
  const [legalRiskDialogBusy, setLegalRiskDialogBusy] = useState(false);
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
    if (!loading && !initialMeetingProfileSelectionAppliedRef.current) {
      setSelectedMeetingProfileId(
        settings.defaultMeetingProfileId || settings.meetingProfiles[0]?.id || ""
      );
      initialMeetingProfileSelectionAppliedRef.current = true;
      return;
    }

    if (
      selectedMeetingProfileId &&
      settings.meetingProfiles.some(
        (profile) => profile.id === selectedMeetingProfileId
      )
    ) {
      return;
    }

    setSelectedMeetingProfileId(
      settings.defaultMeetingProfileId || settings.meetingProfiles[0]?.id || ""
    );
  }, [
    loading,
    selectedMeetingProfileId,
    settings.defaultMeetingProfileId,
    settings.meetingProfiles,
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

  const updateMeetingProfile = (
    profileId: string,
    updates: Partial<MeetingProfile>
  ) => {
    updateSetting(
      "meetingProfiles",
      settings.meetingProfiles.map((profile) =>
        profile.id === profileId ? { ...profile, ...updates } : profile
      )
    );
  };

  const addMeetingProfile = () => {
    const newProfile: MeetingProfile = {
      id: `custom_${Date.now()}`,
      name: t("options.profiles.editor.newName"),
      description: t("options.profiles.editor.newDescription"),
      prompt: t("options.profiles.editor.newPrompt"),
      summaryGenerationMode: "balanced",
      autoSummarizeOnMeetingEnd: false,
      assistant: createDefaultAssistantConfig(),
    };

    const nextProfiles = [
      settings.meetingProfiles[0],
      newProfile,
      ...settings.meetingProfiles.slice(1),
    ];

    updateSetting("meetingProfiles", nextProfiles);
    if (customMeetingProfiles.length === 0) {
      updateSetting("defaultMeetingProfileId", newProfile.id);
    }
    setSelectedMeetingProfileId(newProfile.id);
  };

  const deleteMeetingProfile = (profileId: string) => {
    if (isProtectedMeetingProfile(profileId)) {
      return;
    }

    const remainingProfiles = settings.meetingProfiles.filter(
      (profile) => profile.id !== profileId
    );
    updateSetting("meetingProfiles", remainingProfiles);

    if (settings.defaultMeetingProfileId === profileId) {
      const remainingCustomProfiles = remainingProfiles.filter(
        (profile) => !isProtectedMeetingProfile(profile.id)
      );
      updateSetting(
        "defaultMeetingProfileId",
        remainingCustomProfiles[0]?.id || remainingProfiles[0]?.id || ""
      );
    }

    if (selectedMeetingProfileId === profileId) {
      setSelectedMeetingProfileId(
        remainingProfiles[0]?.id || settings.defaultMeetingProfileId || ""
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
  const activeMeetingFlowRiskIds = (
    ["captureStartupAlways", "captionActivationAutomatic"] as const
  ).filter((riskId) => isLegalRiskSettingActive(settings, riskId));
  const activeMeetingArchiveRiskIds = (["storeMeetingChat"] as const).filter(
    (riskId) => isLegalRiskSettingActive(settings, riskId)
  );
  const selectedMeetingProfile =
    settings.meetingProfiles.find(
      (profile) => profile.id === selectedMeetingProfileId
    ) || settings.meetingProfiles[0];
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
  const pendingLegalRiskCopy = pendingLegalRiskChange
    ? getLegalRiskDialogCopy(pendingLegalRiskChange.riskId, t)
    : null;

  const acknowledgePendingLegalRiskChange = async () => {
    if (!pendingLegalRiskChange) {
      return;
    }

    setLegalRiskDialogBusy(true);
    const applied = await persistSettingsNow({
      [pendingLegalRiskChange.key]: pendingLegalRiskChange.value,
      legalRiskAcknowledgements: {
        ...settings.legalRiskAcknowledgements,
        [pendingLegalRiskChange.riskId]: Date.now(),
      },
    } as Partial<typeof settings>);
    setLegalRiskDialogBusy(false);

    if (applied) {
      setPendingLegalRiskChange(null);
    }
  };

  const requestRiskAwareSettingChange = (change: PendingLegalRiskChange) => {
    const riskId = shouldPromptForLegalRiskAcknowledgement(
      settings,
      change.key,
      change.value
    );

    if (!riskId) {
      switch (change.key) {
        case "captureStartupBehavior":
          updateSetting("captureStartupBehavior", change.value);
          break;
        case "captionActivationBehavior":
          updateSetting("captionActivationBehavior", change.value);
          break;
        case "storeMeetingChat":
          updateSetting("storeMeetingChat", change.value);
          break;
        default:
          break;
      }
      return;
    }

    setPendingLegalRiskChange(change);
  };

  const handleCaptureStartupChange = (value: "off" | "ask" | "always") => {
    requestRiskAwareSettingChange({
      riskId: "captureStartupAlways",
      key: "captureStartupBehavior",
      value,
    });
  };

  const handleCaptionActivationChange = (value: "guided" | "automatic") => {
    requestRiskAwareSettingChange({
      riskId: "captionActivationAutomatic",
      key: "captionActivationBehavior",
      value,
    });
  };

  const handleStoreMeetingChatChange = (enabled: boolean) => {
    requestRiskAwareSettingChange({
      riskId: "storeMeetingChat",
      key: "storeMeetingChat",
      value: enabled,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="mc-options-page-shell">
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
        <ConfirmDialog
          open={Boolean(pendingLegalRiskChange && pendingLegalRiskCopy)}
          tone="warning"
          eyebrow={pendingLegalRiskCopy?.eyebrow}
          title={pendingLegalRiskCopy?.title || ""}
          description={
            pendingLegalRiskCopy ? (
              <LegalRiskDialogBody
                body={pendingLegalRiskCopy.body}
                points={pendingLegalRiskCopy.points}
              />
            ) : (
              ""
            )
          }
          confirmLabel={
            pendingLegalRiskCopy?.confirmLabel ||
            t("history.confirmDialog.confirmAction")
          }
          onConfirm={() => {
            void acknowledgePendingLegalRiskChange();
          }}
          onCancel={() => {
            if (!legalRiskDialogBusy) {
              setPendingLegalRiskChange(null);
            }
          }}
          busy={legalRiskDialogBusy}
        />
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 xl:px-8 xl:py-8">
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
              <GitHubHeaderLink />
              <button
                type="button"
                onClick={openHistory}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3.5 py-2 text-sm text-[var(--app-text-muted)] shadow-[0_10px_24px_var(--app-shadow)] transition-colors hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
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
                value={defaultMeetingProfile?.name || t("options.snapshot.none")}
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
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                    activeSection === section.id
                      ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
                  ].join(" ")}
                >
                  <SettingsSectionIcon
                    sectionId={section.id}
                    size="sm"
                    active={activeSection === section.id}
                  />
                  <span>{section.shortLabel}</span>
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
                    helpMarkdown={settingsHelp.uiLanguage}
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
                {activeMeetingFlowRiskIds.map((riskId) => {
                  const copy = getLegalRiskDialogCopy(riskId, t);
                  return (
                    <LegalRiskNotice
                      key={riskId}
                      label={copy.warningLabel}
                      title={copy.warningTitle}
                      body={copy.warningBody}
                    />
                  );
                })}
                <div className="grid gap-3 lg:grid-cols-2">
                  <Select
                    label={t("options.workspace.captureStartup.label")}
                    value={settings.captureStartupBehavior}
                    onChange={(value) =>
                      handleCaptureStartupChange(
                        value as "off" | "ask" | "always"
                      )
                    }
                    options={captureStartupOptions}
                    helpMarkdown={settingsHelp.captureStartupBehavior}
                  />

                  <Select
                    label={t("options.workspace.captionActivation.label")}
                    value={settings.captionActivationBehavior}
                    onChange={(value) =>
                      handleCaptionActivationChange(
                        value as "guided" | "automatic"
                      )
                    }
                    options={captionActivationOptions}
                    helpMarkdown={settingsHelp.captionActivationBehavior}
                  />
                </div>

                <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_14px_30px_var(--app-shadow)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="pointer-events-none flex items-center gap-2">
                        <h3 className="pointer-events-auto text-sm font-medium text-[var(--app-text)]">
                          {t("options.workspace.sessionContinuation.title")}
                        </h3>
                        <HelpPopover
                          label={t("options.workspace.sessionContinuation.title")}
                          markdown={settingsHelp.sessionContinuationWindow}
                        />
                      </div>
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
                    helpMarkdown={settingsHelp.overlayClickThrough}
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
                {activeMeetingArchiveRiskIds.map((riskId) => {
                  const copy = getLegalRiskDialogCopy(riskId, t);
                  return (
                    <LegalRiskNotice
                      key={riskId}
                      label={copy.warningLabel}
                      title={copy.warningTitle}
                      body={copy.warningBody}
                    />
                  );
                })}

                <div className="grid gap-3 lg:grid-cols-2">
                  <Select
                    label={t("options.workspace.meetingArchiveRetention.label")}
                    value={String(settings.meetingArchiveRetentionDays)}
                    onChange={(value) =>
                      updateSetting("meetingArchiveRetentionDays", Number(value))
                    }
                    options={meetingArchiveRetentionOptions}
                    helpMarkdown={settingsHelp.meetingArchiveRetention}
                  />

                  <Toggle
                    enabled={settings.storeMeetingChat}
                    onChange={handleStoreMeetingChatChange}
                    label={t("options.workspace.storeMeetingChat.label")}
                    description={t("options.workspace.storeMeetingChat.description")}
                    helpMarkdown={settingsHelp.storeMeetingChat}
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
                helpMarkdown={settingsHelp.apiKey}
              />

              <Select
                label={t("options.openAiService.modelLabel")}
                value={settings.model}
                onChange={(v) => updateSetting("model", v)}
                options={openAiModels}
                helpMarkdown={settingsHelp.model}
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
                  helpMarkdown={settingsHelp.translationInstructions}
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
                  value={settings.meetingOutputLanguage}
                  onChange={(value) => updateSetting("meetingOutputLanguage", value)}
                  options={languageOptions}
                  helpMarkdown={settingsHelp.meetingOutputLanguage}
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
                    onClick={addMeetingProfile}
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
                          count: settings.meetingProfiles.length,
                        })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {settings.meetingProfiles.map((profile) => (
                        <ProfileListItem
                          key={profile.id}
                          profile={profile}
                          selected={profile.id === selectedMeetingProfile?.id}
                          isDefault={profile.id === settings.defaultMeetingProfileId}
                          isProtected={isProtectedMeetingProfile(profile.id)}
                          onSelect={() => setSelectedMeetingProfileId(profile.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedMeetingProfile ? (
                    <MeetingProfileEditor
                      profile={selectedMeetingProfile}
                      isDefault={
                        selectedMeetingProfile.id ===
                        settings.defaultMeetingProfileId
                      }
                      isProtected={isProtectedMeetingProfile(
                        selectedMeetingProfile.id
                      )}
                      canSetDefault={
                        !isProtectedMeetingProfile(selectedMeetingProfile.id) ||
                        canUseProtectedAsDefault
                      }
                      canDelete={
                        settings.meetingProfiles.length > 1 &&
                        !isProtectedMeetingProfile(selectedMeetingProfile.id)
                      }
                      onSetDefault={() =>
                        updateSetting(
                          "defaultMeetingProfileId",
                          selectedMeetingProfile.id
                        )
                      }
                      onChange={(updates) =>
                        updateMeetingProfile(selectedMeetingProfile.id, updates)
                      }
                      onDelete={() =>
                        deleteMeetingProfile(selectedMeetingProfile.id)
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
              <SurfacePanel className="border-[var(--app-border-strong)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface-strong)_94%,var(--app-surface-soft)),color-mix(in_srgb,var(--app-surface)_92%,var(--app-surface-soft)))]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--app-accent)]">
                          {t("options.cloudSync.overview.title")}
                        </p>
                        <StatusPill
                          label={overallCloudSync.label}
                          tone={overallCloudSync.tone}
                          motion={
                            overallCloudSync.tone === "accent"
                              ? "processing"
                              : "none"
                          }
                          indicator
                        />
                      </div>
                      <h3
                        className="mt-2 text-[1.25rem] font-semibold leading-tight text-[var(--app-text)] sm:text-[1.4rem]"
                        style={DYNAMIC_TEXT_STYLE}
                        dir={getDynamicTextDirection(protectionSummaryTitle)}
                      >
                        {protectionSummaryTitle}
                      </h3>
                      <p
                        className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--app-text-muted)]"
                        style={DYNAMIC_TEXT_STYLE}
                        dir={getDynamicTextDirection(protectionSummaryDescription)}
                      >
                        {protectionSummaryDescription}
                      </p>
                    </div>
                    <ActionButton
                      label={t("options.cloudSync.actions.refreshStatus")}
                      loadingLabel={t("options.cloudSync.actions.refreshStatus")}
                      icon={<RefreshIcon className="h-4 w-4" />}
                      onClick={() => {
                        void refreshCloudSyncState();
                      }}
                      isLoading={isCloudSyncRefreshing}
                      size="compact"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {showQueueStatusMetric ? (
                      <CloudSyncInlineMetric
                        label={t("options.cloudSync.stats.queueStatus")}
                        value={queueSummaryLabel}
                        tone={queueNeedsConnection ? "warning" : "accent"}
                      />
                    ) : null}
                    <CloudSyncInlineMetric
                      label={t("options.cloudSync.stats.connectedProviders")}
                      value={
                        connectedCloudProviderCount === 0
                          ? t("options.cloudSync.stats.connectedProvidersNone")
                          : connectedCloudProviderCount === 1
                            ? t("options.cloudSync.stats.connectedProvidersOne")
                            : t("options.cloudSync.stats.connectedProvidersTwo")
                      }
                      tone={
                        connectedCloudProviderCount > 0 ? "accent" : "default"
                      }
                    />
                  </div>

                  {cloudSyncActivityStatus ? (
                    <CloudSyncActivityBanner
                      status={cloudSyncActivityStatus}
                      message={cloudSyncMutationState.message}
                      detail={cloudSyncMutationState.detail}
                    />
                  ) : null}

                  {queueNeedsConnection ? (
                    <div className="rounded-[1.35rem] border border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-warning-soft)_76%,var(--app-surface))] px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-warning-border)] bg-[color:color-mix(in_srgb,var(--app-surface-strong)_86%,transparent)] text-[var(--app-warning)]">
                          <AlertTriangleIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--app-text)]">
                            {t("options.cloudSync.connection.notConnectedTitle")}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
                            {t("options.runtime.cloudSync.idleAvailable")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
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

              <SurfacePanel className="overflow-hidden border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] p-0">
                <div className="divide-y divide-[color:color-mix(in_srgb,var(--app-border)_88%,transparent)]">
                  {cloudSyncProviderCards.map((providerCard) => (
                    <CloudSyncProviderRow
                      key={providerCard.provider}
                      providerCard={providerCard}
                      t={t}
                      onConnect={(provider) => {
                        void connectProvider(provider);
                      }}
                      onRetry={(provider) => {
                        void retryProvider(provider);
                      }}
                      onReconnect={(provider) => {
                        void reconnectProvider(provider);
                      }}
                      onDisconnect={(provider) => {
                        void disconnectProvider(provider);
                      }}
                    />
                  ))}
                </div>

                <div className="border-t border-[color:color-mix(in_srgb,var(--app-border)_88%,transparent)] px-4 py-3 sm:px-5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-text-muted)] transition-[background-color,border-color,color,transform] duration-200 ease-out hover:-translate-y-[1px] hover:border-[var(--app-accent-border)] hover:text-[var(--app-text)]"
                    onClick={() => {
                      setCloudSyncDetailsExpanded((current) => !current);
                    }}
                  >
                    {cloudSyncDetailsExpanded ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                    <span>
                      {cloudSyncDetailsExpanded
                        ? t("common.actions.collapse")
                        : t("common.actions.expand")}
                    </span>
                  </button>

                  <div
                    className={[
                      "grid transition-all duration-200 ease-out",
                      cloudSyncDetailsExpanded
                        ? "mt-4 grid-rows-[1fr] opacity-100"
                        : "mt-0 grid-rows-[0fr] opacity-0",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <CloudSyncSignalTile
                            label={t("options.cloudSync.stats.currentDevice")}
                            value={settings.deviceLabel}
                            description={settings.deviceId}
                            tone="default"
                            valueClassName="text-base"
                            descriptionClassName="font-mono text-[10px] tracking-[0.04em]"
                          />
                          <CloudSyncSignalTile
                            label={t("options.cloudSync.stats.lastSuccessfulSync")}
                            value={formatCloudSyncTimestampLabel(
                              latestSuccessfulCloudSyncAt || undefined,
                              t
                            )}
                            description={t(
                              "options.cloudSync.stats.lastSuccessfulSyncHint"
                            )}
                            tone={
                              latestSuccessfulCloudSyncAt ? "accent" : "default"
                            }
                          />
                          <CloudSyncSignalTile
                            label={t("options.cloudSync.stats.queueStatus")}
                            value={queueSummaryLabel}
                            description={queueDetailLabel}
                            tone={
                              cloudSyncState.queueSize > 0 ||
                              cloudSyncState.dueTaskCount > 0
                                ? "warning"
                                : "default"
                            }
                          />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <CloudSyncScopeList
                            title={t("options.cloudSync.scope.sharedTitle")}
                            items={cloudSyncScopeShared}
                            tone="shared"
                          />
                          <CloudSyncScopeList
                            title={t("options.cloudSync.scope.localTitle")}
                            items={cloudSyncScopeLocal}
                            tone="local"
                          />
                        </div>
                      </div>
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
                  <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] sm:p-4">
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

          <LegalFooter className="mt-8" version={chrome.runtime.getManifest().version} />
        </div>
      </div>
      <DiagnosticsConsole />
    </div>
  );
}
