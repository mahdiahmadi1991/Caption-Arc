import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS } from "../background/constants";
import type { Settings, SummaryJobStatus } from "../background/types";
import { getOpenAiModels } from "../options/components/constants";
import { BrandMark } from "../shared/brand";
import { LegalFooter } from "../shared/extension-page-chrome";
import { IconButton } from "../shared/icon-button";
import {
  getOpenAiServiceAvailability,
  type OpenAiServiceAvailability,
  isOpenAiConfigured,
} from "../shared/openai-service";
import { isAutomaticSummaryEnabledForProfile } from "../shared/summary-profiles";
import { getLanguageName } from "../shared/language-metadata";
import type { QuickAccessRuntimeStatus } from "../shared/quick-access-status";
import { SwitchControl } from "../shared/switch-control";
import {
  ArchiveIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  GearIcon,
  SparklesIcon,
} from "../shared/icons";
import { ThemeToggle } from "../shared/theme-toggle";
import { Tooltip } from "../shared/tooltip";
import { useResolvedTheme } from "../shared/use-resolved-theme";
import { detectAppEnvironment } from "../shared/runtime-environment";
import {
  useI18n,
  useT,
  type SupportedUiLocale,
  type UiTranslator,
} from "../shared/i18n";
import type { ThemeToggleLabels } from "../shared/theme-toggle";

const SETTINGS_STORAGE_KEYS = new Set(["settings", "settingsState"]);
const DASHBOARD_REFRESH_INTERVAL_MS = 1500;
const ACTIVE_SUMMARY_STATES = new Set([
  "preflighting",
  "extracting",
  "merging",
  "synthesizing",
  "continuing",
  "reconciling",
]);

const DYNAMIC_TEXT_STYLE = {
  overflowWrap: "anywhere" as const,
  wordBreak: "break-word" as const,
};

type SetupStatusTone = "ready" | "attention" | "pending";
type PulseTone = "live" | "busy" | "ready" | "waiting" | "muted" | "attention";

type DashboardState = {
  runtimeStatus: QuickAccessRuntimeStatus | null;
  summaryStatus: SummaryJobStatus | null;
  sessionCount: number;
  lastSessionAt: number | null;
  bytesUsed: number;
  quota: number;
};

const DEFAULT_DASHBOARD_STATE: DashboardState = {
  runtimeStatus: null,
  summaryStatus: null,
  sessionCount: 0,
  lastSessionAt: null,
  bytesUsed: 0,
  quota: 0,
};

function getModelLabel(settings: Settings, t: UiTranslator): string {
  return (
    getOpenAiModels(t).find((model) => model.id === settings.model)?.name ||
    settings.model
  );
}

function resolvePopupRuntimeDetailMessage(
  message: string | null | undefined,
  fallback: string
): string {
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  return normalizedMessage || fallback;
}

export function getSetupStatus(
  availability: OpenAiServiceAvailability,
  t: UiTranslator
): {
  tone: SetupStatusTone;
  label: string;
  description: string;
} {
  if (availability.state === "setup") {
    return {
      tone: "pending",
      label: t("popup.setup.setupRequired.label"),
      description: t("popup.setup.setupRequired.description"),
    };
  }

  if (availability.state === "unavailable") {
    return {
      tone: "attention",
      label: t("popup.setup.needsAttention.label"),
      description: resolvePopupRuntimeDetailMessage(
        availability.message,
        t("popup.setup.needsAttention.description")
      ),
    };
  }

  if (availability.state === "ready") {
    return {
      tone: "ready",
      label: t("popup.setup.ready.label"),
      description: t("popup.setup.ready.description"),
    };
  }

  return {
    tone: "pending",
    label: t("popup.setup.verifySetup.label"),
    description: t("popup.setup.verifySetup.description"),
  };
}

export function resolvePopupSummaryDetail(
  status: SummaryJobStatus | null,
  fallback: string
): string {
  return resolvePopupRuntimeDetailMessage(status?.message, fallback);
}

function getStatusClasses(tone: SetupStatusTone): string {
  if (tone === "ready") {
    return "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]";
  }

  if (tone === "attention") {
    return "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]";
  }

  return "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-text-muted)]";
}

function getPlatformLabel(
  platform: QuickAccessRuntimeStatus["platform"],
  t: UiTranslator
): string {
  if (platform === "google-meet") {
    return t("common.meetingPlatforms.googleMeet");
  }

  if (platform === "microsoft-teams") {
    return t("common.meetingPlatforms.microsoftTeams");
  }

  if (platform === "zoom-web") {
    return t("common.meetingPlatforms.zoomWeb");
  }

  return t("common.meetingPlatforms.generic");
}

function formatLocalizedNumber(
  value: number,
  locale: SupportedUiLocale,
  fractionDigits = 0
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatBytes(
  bytes: number,
  locale: SupportedUiLocale,
  t: UiTranslator
): string {
  if (bytes < 1024) {
    return `${formatLocalizedNumber(bytes, locale)} ${t("common.units.byte")}`;
  }

  if (bytes < 1024 * 1024) {
    const fractionDigits = bytes < 10 * 1024 ? 1 : 0;
    return `${formatLocalizedNumber(bytes / 1024, locale, fractionDigits)} ${t("common.units.kilobyte")}`;
  }

  const fractionDigits = bytes < 10 * 1024 * 1024 ? 1 : 0;
  return `${formatLocalizedNumber(bytes / (1024 * 1024), locale, fractionDigits)} ${t("common.units.megabyte")}`;
}

function formatRelativeTime(
  timestamp: number | null,
  locale: SupportedUiLocale,
  t: UiTranslator
): string {
  if (!timestamp) {
    return t("popup.relativeTime.noMeetingsSaved");
  }

  const deltaMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.round(deltaMs / 60000);
  const numberFormatter = new Intl.NumberFormat(locale);

  if (minutes < 1) {
    return t("popup.relativeTime.updatedJustNow");
  }

  if (minutes < 60) {
    return t("popup.relativeTime.updatedMinutesAgo", {
      minutes: numberFormatter.format(minutes),
    });
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return t("popup.relativeTime.updatedHoursAgo", {
      hours: numberFormatter.format(hours),
    });
  }

  const days = Math.round(hours / 24);
  return t("popup.relativeTime.updatedDaysAgo", {
    days: numberFormatter.format(days),
  });
}

function formatTargetLanguageName(
  code: string,
  locale: SupportedUiLocale
): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], {
      type: "language",
    });

    return displayNames.of(code) || getLanguageName(code);
  } catch {
    return getLanguageName(code);
  }
}

function getCaptureStartupBehaviorLabel(
  behavior: Settings["captureStartupBehavior"],
  t: UiTranslator
): string {
  if (behavior === "off") {
    return t("popup.meta.startupValues.off");
  }

  if (behavior === "always") {
    return t("popup.meta.startupValues.always");
  }

  return t("popup.meta.startupValues.ask");
}

function getMostRelevantSummaryStatus(
  statuses: Record<string, SummaryJobStatus>
): SummaryJobStatus | null {
  const values = Object.values(statuses);
  if (values.length === 0) {
    return null;
  }

  const active = values
    .filter((status) => ACTIVE_SUMMARY_STATES.has(status.state))
    .sort((left, right) => right.updatedAt - left.updatedAt)[0];
  if (active) {
    return active;
  }

  const attention = values
    .filter((status) => status.state === "failed")
    .sort((left, right) => right.updatedAt - left.updatedAt)[0];
  if (attention) {
    return attention;
  }

  return values.sort((left, right) => right.updatedAt - left.updatedAt)[0] || null;
}

function PulseIndicator({
  tone,
  animated = false,
}: {
  tone: PulseTone;
  animated?: boolean;
}) {
  const toneClass =
    tone === "live"
      ? "bg-[var(--app-accent)]"
      : tone === "busy"
        ? "bg-[var(--app-warning)]"
        : tone === "ready"
          ? "bg-[var(--app-accent)]"
          : tone === "attention"
            ? "bg-[var(--app-danger)]"
            : "bg-[var(--app-text-faint)]";

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--app-surface)_86%,transparent)]">
      <div className="flex items-end gap-[2px]">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`w-[3px] rounded-full ${toneClass} ${
              animated ? "animate-pulse" : "opacity-80"
            }`}
            style={{
              height: `${index === 1 ? 12 : 8}px`,
              animationDelay: `${index * 140}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PulseRow({
  tone,
  animated,
  label,
  detail,
  badge,
}: {
  tone: PulseTone;
  animated?: boolean;
  label: string;
  detail: string;
  badge: string;
}) {
  const badgeClass =
    tone === "live"
      ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
      : tone === "busy"
        ? "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)]"
        : tone === "attention"
          ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]";

  return (
    <div className="flex items-center gap-3 rounded-[1.1rem] bg-[var(--app-surface-soft)] px-2.5 py-2.5">
      <PulseIndicator tone={tone} animated={animated} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-none text-[var(--app-text)]">
          {label}
        </p>
        <p
          className="mt-1 text-[10px] leading-snug text-[var(--app-text-muted)]"
          style={DYNAMIC_TEXT_STYLE}
        >
          {detail}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${badgeClass}`}
      >
        {badge}
      </span>
    </div>
  );
}

function PulsePanel({
  liveRow,
  summaryRow,
  archiveRow,
}: {
  liveRow: {
    tone: PulseTone;
    animated?: boolean;
    label: string;
    detail: string;
    badge: string;
  };
  summaryRow: {
    tone: PulseTone;
    animated?: boolean;
    label: string;
    detail: string;
    badge: string;
  };
  archiveRow: {
    tone: PulseTone;
    animated?: boolean;
    label: string;
    detail: string;
    badge: string;
  };
}) {
  const t = useT();

  return (
    <section className="rounded-[1.45rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3 shadow-[0_12px_28px_var(--app-shadow)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--app-text-faint)]">
          {t("popup.pulse.title")}
        </p>
        <div className="h-[3px] w-14 overflow-hidden rounded-full bg-[var(--app-surface-soft)]">
          <div className="h-full w-1/2 rounded-full bg-[var(--app-accent)]/70 animate-pulse" />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <PulseRow {...liveRow} />
        <PulseRow {...summaryRow} />
        <PulseRow {...archiveRow} />
      </div>
    </section>
  );
}

function MetaChip({
  label,
  value,
  indicatorTone,
  indicatorLabel,
}: {
  label: string;
  value: string;
  indicatorTone?: "ready" | "attention" | "pending";
  indicatorLabel?: string;
}) {
  const indicatorClass =
    indicatorTone === "attention"
      ? "bg-[var(--app-danger)]"
      : indicatorTone === "ready"
        ? "bg-[var(--app-accent)]"
        : "bg-[var(--app-text-faint)]";

  return (
    <div className="rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--app-text-faint)]">
          {label}
        </p>
        {indicatorTone ? (
          <Tooltip content={indicatorLabel || ""} disabled={!indicatorLabel}>
            <span
              className={`inline-flex h-2 w-2 shrink-0 rounded-full ${indicatorClass}`}
              aria-label={indicatorLabel}
            />
          </Tooltip>
        ) : null}
      </div>
      <p
        className="mt-1 text-[12px] font-medium leading-snug text-[var(--app-text)]"
        style={DYNAMIC_TEXT_STYLE}
      >
        {value}
      </p>
    </div>
  );
}

function OverlayVisibilityControl({
  enabled,
  loading,
  disabled,
  modeLabel,
  helperText,
  onToggle,
}: {
  enabled: boolean;
  loading: boolean;
  disabled: boolean;
  modeLabel: string;
  helperText: string;
  onToggle: () => void;
}) {
  const t = useT();
  const Icon = enabled ? EyeIcon : EyeOffIcon;
  const isInteractive = !loading && !disabled;
  const stateLabel = disabled
    ? t("popup.overlay.state.inactive")
    : enabled
      ? t("popup.overlay.state.visible")
      : t("popup.overlay.state.hidden");
  const secondaryText = disabled ? helperText : modeLabel;

  return (
    <section className="rounded-[1.45rem] border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface-strong)_84%,transparent)] px-3 py-2.5 shadow-[0_12px_28px_var(--app-shadow)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2 py-[5px] text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
              <Icon className="h-3.5 w-3.5" />
              {t("popup.overlay.badge")}
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-[5px] text-[9px] font-medium uppercase tracking-[0.14em] ${
                enabled && !disabled
                  ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                  : disabled
                    ? "border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface)_88%,transparent)] text-[var(--app-text-faint)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]"
              }`}
            >
              {stateLabel}
            </span>
          </div>

          <div className="mt-2 min-w-0">
            <p className="text-[13px] font-semibold leading-none text-[var(--app-text)]">
              {t("popup.overlay.title")}
            </p>
            <Tooltip content={secondaryText}>
              <p
                className="mt-1 truncate text-[11px] leading-none text-[var(--app-text-muted)]"
                style={DYNAMIC_TEXT_STYLE}
              >
                {secondaryText}
              </p>
            </Tooltip>
          </div>
        </div>

        <SwitchControl
          enabled={enabled && !disabled}
          disabled={disabled}
          onToggle={onToggle}
          ariaLabel={t("popup.overlay.switchAriaLabel")}
          title={disabled ? t("popup.overlay.switchDisabledTitle") : undefined}
        />
      </div>
    </section>
  );
}

export default function App() {
  const { locale } = useI18n();
  const t = useT();
  const isDevelopmentBuild = detectAppEnvironment() === "development";
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [dashboard, setDashboard] = useState<DashboardState>(DEFAULT_DASHBOARD_STATE);
  const [overlayVisibilityLoading, setOverlayVisibilityLoading] = useState(false);
  const [appearanceLoading, setAppearanceLoading] = useState(false);

  const resolvedTheme = useResolvedTheme(settings.appearance);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          action: "getSettings",
        });

        if (mounted && response?.success && response.settings) {
          setSettings(response.settings);
        }
      } catch {
        // Keep defaults if settings load fails.
      }
    };

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local") {
        return;
      }

      if (!Object.keys(changes).some((key) => SETTINGS_STORAGE_KEYS.has(key))) {
        return;
      }

      void loadSettings();
    };

    void loadSettings();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [historyResponse, summaryResponse, storageResponse, runtimeResponse] =
          await Promise.all([
            chrome.runtime.sendMessage({ action: "getMeetingHistoryIndex" }),
            chrome.runtime.sendMessage({ action: "getMeetingSummaryJobStatuses" }),
            chrome.runtime.sendMessage({ action: "getStorageUsage" }),
            chrome.runtime.sendMessage({ action: "getQuickAccessRuntimeStatus" }),
          ]);

        if (!mounted) {
          return;
        }

        const sessions = Array.isArray(historyResponse?.sessions)
          ? historyResponse.sessions
          : [];
        const lastSessionAt = sessions.reduce<number | null>((latest, session) => {
          const candidate =
            session.updatedAt || session.lastSeenAt || session.endTime || session.startTime;
          if (typeof candidate !== "number") {
            return latest;
          }

          return latest === null || candidate > latest ? candidate : latest;
        }, null);

        setDashboard({
          runtimeStatus: (runtimeResponse?.status as QuickAccessRuntimeStatus) || null,
          summaryStatus: getMostRelevantSummaryStatus(summaryResponse?.statuses || {}),
          sessionCount: sessions.length,
          lastSessionAt,
          bytesUsed: storageResponse?.bytesUsed || 0,
          quota: storageResponse?.quota || 0,
        });
      } catch {
        if (mounted) {
          setDashboard((current) => current);
        }
      }
    };

    void loadDashboard();
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const openAiAvailability = useMemo(
    () => getOpenAiServiceAvailability(settings),
    [settings]
  );
  const status = useMemo(
    () => getSetupStatus(openAiAvailability, t),
    [openAiAvailability, t]
  );
  const openAiUnavailableDetail = useMemo(
    () =>
      resolvePopupRuntimeDetailMessage(
        openAiAvailability.message,
        t("popup.setup.needsAttention.description")
      ),
    [openAiAvailability.message, t]
  );
  const verificationDetail = openAiAvailability.snapshot
    ? new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }).format(openAiAvailability.snapshot.verifiedAt)
    : t("popup.setup.verificationNotTested");
  const aiServiceConfigured = isOpenAiConfigured(settings);
  const manifestVersion = useMemo(() => chrome.runtime.getManifest().version, []);
  const overlayVisibilityDisabled = settings.captureStartupBehavior === "off";
  const themeToggleLabels = useMemo<ThemeToggleLabels>(
    () => ({
      group: t("common.theme.group"),
      options: {
        system: t("common.theme.system"),
        light: t("common.theme.light"),
        dark: t("common.theme.dark"),
      },
    }),
    [t]
  );

  const overlayModeLabel = overlayVisibilityDisabled
    ? t("popup.overlay.mode.captureStartupOff")
    : settings.overlayVisible
      ? t("popup.overlay.mode.available")
      : t("popup.overlay.mode.hidden");

  const overlayHelperText = overlayVisibilityDisabled
    ? t("popup.overlay.helper.captureStartupOff")
    : t("popup.overlay.helper.instantToggle");

  const liveRow = useMemo(() => {
    const runtimeStatus = dashboard.runtimeStatus;
    if (runtimeStatus?.hasActiveMeetingSession && runtimeStatus.meetingPresence === "joined") {
      return {
        tone: "live" as const,
        animated: true,
        label: t("popup.rows.live.capturing.label"),
        detail: t("popup.rows.live.capturing.detail", {
          platform: getPlatformLabel(runtimeStatus.platform, t),
        }),
        badge: t("popup.rows.live.capturing.badge"),
      };
    }

    if (runtimeStatus?.meetingPresence === "prejoin") {
      return {
        tone: "waiting" as const,
        animated: true,
        label: t("popup.rows.live.lobby.label"),
        detail: t("popup.rows.live.lobby.detail", {
          platform: getPlatformLabel(runtimeStatus.platform, t),
        }),
        badge: t("popup.rows.live.lobby.badge"),
      };
    }

    if (settings.captureStartupBehavior === "off") {
      return {
        tone: "muted" as const,
        label: t("popup.rows.live.startupOff.label"),
        detail: t("popup.rows.live.startupOff.detail"),
        badge: t("popup.rows.live.startupOff.badge"),
      };
    }

    return {
      tone: "muted" as const,
      label: t("popup.rows.live.idle.label"),
      detail: t("popup.rows.live.idle.detail"),
      badge: t("popup.rows.live.idle.badge"),
    };
  }, [dashboard.runtimeStatus, settings.captureStartupBehavior, t]);

  const summaryRow = useMemo(() => {
    const status = dashboard.summaryStatus;
    const defaultSummaryProfile = settings.summaryProfiles.find(
      (profile) => profile.id === settings.defaultSummaryProfileId
    );
    const autoSummaryEnabled = isAutomaticSummaryEnabledForProfile(
      defaultSummaryProfile
    );

    if (status && ACTIVE_SUMMARY_STATES.has(status.state)) {
      return {
        tone: "busy" as const,
        animated: true,
        label: t("popup.rows.summary.busy.label"),
        detail: resolvePopupSummaryDetail(
          status,
          t("popup.rows.summary.busy.detail")
        ),
        badge: t("popup.rows.summary.busy.badge"),
      };
    }

    if (status?.state === "failed") {
      return {
        tone: "attention" as const,
        label: t("popup.rows.summary.failed.label"),
        detail: resolvePopupSummaryDetail(
          status,
          t("popup.rows.summary.failed.detail")
        ),
        badge: t("popup.rows.summary.failed.badge"),
      };
    }

    if (autoSummaryEnabled) {
      return {
        tone: "ready" as const,
        label: t("popup.rows.summary.automatic.label"),
        detail: t("popup.rows.summary.automatic.detail", {
          profileName:
            defaultSummaryProfile?.name || t("popup.rows.summary.defaultProfileName"),
        }),
        badge: t("popup.rows.summary.automatic.badge"),
      };
    }

    return {
      tone: "muted" as const,
      label: t("popup.rows.summary.manual.label"),
      detail: t("popup.rows.summary.manual.detail"),
      badge: t("popup.rows.summary.manual.badge"),
    };
  }, [
    dashboard.summaryStatus,
    settings.defaultSummaryProfileId,
    settings.summaryProfiles,
    t,
  ]);

  const archiveRow = useMemo(() => {
    const quotaShare =
      dashboard.quota > 0 ? Math.min(100, Math.round((dashboard.bytesUsed / dashboard.quota) * 100)) : 0;
    const localizedCount = new Intl.NumberFormat(locale).format(dashboard.sessionCount);
    const localizedQuotaShare = `${new Intl.NumberFormat(locale).format(quotaShare)}%`;

    if (dashboard.sessionCount === 0) {
      return {
        tone: "muted" as const,
        label: t("popup.rows.archive.empty.label"),
        detail: t("popup.rows.archive.empty.detail"),
        badge: t("popup.rows.archive.empty.badge"),
      };
    }

    return {
      tone: "ready" as const,
      label: t("popup.rows.archive.ready.label", {
        count: localizedCount,
      }),
      detail: t("popup.rows.archive.ready.detail", {
        used: formatBytes(dashboard.bytesUsed, locale, t),
        updated: formatRelativeTime(dashboard.lastSessionAt, locale, t),
      }),
      badge: localizedQuotaShare,
    };
  }, [
    dashboard.bytesUsed,
    dashboard.lastSessionAt,
    dashboard.quota,
    dashboard.sessionCount,
    locale,
    t,
  ]);

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const openMeetingHistory = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("meeting-history.html"),
    });
  };

  const toggleOverlayVisibility = async () => {
    if (overlayVisibilityDisabled) {
      return;
    }

    const nextOverlayVisible = !settings.overlayVisible;
    const previousOverlayVisible = settings.overlayVisible;

    setOverlayVisibilityLoading(true);
    setSettings((current) => ({
      ...current,
      overlayVisible: nextOverlayVisible,
    }));

    try {
      await chrome.runtime.sendMessage({
        action: "saveSettings",
        settings: {
          overlayVisible: nextOverlayVisible,
        },
      });
    } catch {
      setSettings((current) => ({
        ...current,
        overlayVisible: previousOverlayVisible,
      }));
    } finally {
      setOverlayVisibilityLoading(false);
    }
  };

  const updateAppearance = async (appearance: Settings["appearance"]) => {
    if (appearance === settings.appearance) {
      return;
    }

    const previousAppearance = settings.appearance;

    setAppearanceLoading(true);
    setSettings((current) => ({
      ...current,
      appearance,
    }));

    try {
      await chrome.runtime.sendMessage({
        action: "saveSettings",
        settings: {
          appearance,
        },
      });
    } catch {
      setSettings((current) => ({
        ...current,
        appearance: previousAppearance,
      }));
    } finally {
      setAppearanceLoading(false);
    }
  };

  return (
    <div className="mx-2 my-2 overflow-hidden rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--app-border-strong)_90%,transparent)] bg-[var(--app-bg)] text-[var(--app-text)] shadow-[0_14px_32px_var(--app-shadow)]">
      <div className="bg-[radial-gradient(circle_at_top_left,var(--app-accent-soft),transparent_56%),var(--app-bg)] px-4 pb-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <BrandMark size={44} theme={resolvedTheme} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--app-accent)]">
                  {t("common.quickAccess")}
                </p>
                {isDevelopmentBuild ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--app-accent-border)] bg-[color:color-mix(in_srgb,var(--app-accent-soft)_82%,transparent)] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.14em] text-[var(--app-accent)]">
                    <span className="inline-flex h-1.5 w-3.5 rounded-full bg-[var(--app-accent)]" />
                    {t("popup.header.devBadge")}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-1 text-[1.45rem] font-semibold leading-none text-[var(--app-text)]">
                {t("common.appName")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton
              onClick={openMeetingHistory}
              icon={<ArchiveIcon />}
              label={t("popup.header.openMeetingHistory")}
              variant="soft"
              size="sm"
            />
            <IconButton
              onClick={openSettings}
              icon={<GearIcon />}
              label={t("popup.header.openSettings")}
              variant="accent"
              size="sm"
            />
          </div>
        </div>

        <section className="mt-4 rounded-[1.45rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3 shadow-[0_12px_28px_var(--app-shadow)]">
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${getStatusClasses(
                status.tone
              )}`}
            >
              {status.tone === "ready" ? (
                <SparklesIcon className="h-3.5 w-3.5" />
              ) : (
                <ClockIcon className="h-3.5 w-3.5" />
              )}
              {status.label}
            </div>

            <span className="text-[11px] text-[var(--app-text-faint)]">
              {aiServiceConfigured ? verificationDetail : t("popup.setup.notConfigured")}
            </span>
          </div>

          <p
            className="mt-2 text-[12px] leading-relaxed text-[var(--app-text-muted)]"
            style={DYNAMIC_TEXT_STYLE}
          >
            {status.description}
          </p>
        </section>

        <div className="mt-3">
          <OverlayVisibilityControl
            enabled={settings.overlayVisible}
            loading={overlayVisibilityLoading}
            disabled={overlayVisibilityDisabled}
            modeLabel={overlayModeLabel}
            helperText={overlayHelperText}
            onToggle={toggleOverlayVisibility}
          />
        </div>

        <div className="mt-3">
          <PulsePanel
            liveRow={liveRow}
            summaryRow={summaryRow}
            archiveRow={archiveRow}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetaChip
            label={t("popup.meta.aiService")}
            value={t("common.brands.openAi")}
            indicatorTone={
              openAiAvailability.state === "unavailable"
                ? "attention"
                : openAiAvailability.state === "pending"
                  ? "pending"
                  : undefined
            }
            indicatorLabel={
              openAiAvailability.state === "unavailable"
                ? openAiUnavailableDetail
                : openAiAvailability.state === "pending"
                  ? t("popup.meta.pendingIndicator")
                  : undefined
            }
          />
          <MetaChip
            label={t("popup.meta.model")}
            value={getModelLabel(settings, t) || t("popup.meta.modelNotSelected")}
          />
          <MetaChip
            label={t("popup.meta.target")}
            value={formatTargetLanguageName(settings.targetLanguage, locale)}
          />
          <MetaChip
            label={t("popup.meta.startup")}
            value={getCaptureStartupBehaviorLabel(settings.captureStartupBehavior, t)}
          />
        </div>

        <div className="mt-3 border-t border-[color:color-mix(in_srgb,var(--app-border)_86%,transparent)] pt-3">
          <LegalFooter
            version={manifestVersion}
            compact
            accessory={
              <div
                className={appearanceLoading ? "pointer-events-none opacity-70" : undefined}
              >
                <ThemeToggle
                  value={settings.appearance}
                  onChange={updateAppearance}
                  className="scale-[0.86] shadow-none"
                  labels={themeToggleLabels}
                />
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
