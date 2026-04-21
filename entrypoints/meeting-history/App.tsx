import { useMemo, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import {
  SessionList,
  SessionDetail,
  StorageIndicator,
  type MeetingSession,
} from "./components";
import { ConfirmDialog } from "./components/confirm-dialog";
import {
  useHistory,
  type ProviderFilter,
  type SessionSort,
  type StarFilter,
} from "./use-history";
import { useT } from "../shared/i18n";
import { useResolvedTheme } from "../shared/use-resolved-theme";
import { BrandLockup } from "../shared/brand";
import {
  GitHubHeaderLink,
  LegalFooter,
} from "../shared/extension-page-frame";
import { IconButton } from "../shared/icon-button";
import { AppLoadingScreen } from "../shared/loading-screen";
import type { OpenAiServiceAvailability } from "../shared/openai-service";
import {
  AlertTriangleIcon,
  CloseIcon,
  GearIcon,
  RefreshIcon,
  SearchIcon,
  StarIcon,
} from "../shared/icons";

function getProviderFilters(
  t: ReturnType<typeof useT>
): Array<{ id: ProviderFilter; label: string }> {
  return [
    { id: "all", label: t("history.filters.providerAll") },
    { id: "google-meet", label: t("history.filters.providerGoogleMeet") },
    {
      id: "microsoft-teams",
      label: t("history.filters.providerMicrosoftTeams"),
    },
    { id: "zoom-web", label: t("history.filters.providerZoomWeb") },
  ];
}

function getSortOptions(
  t: ReturnType<typeof useT>
): Array<{ id: SessionSort; label: string }> {
  return [
    { id: "newest", label: t("history.filters.sortNewest") },
    { id: "oldest", label: t("history.filters.sortOldest") },
  ];
}

function getStarFilters(
  t: ReturnType<typeof useT>
): Array<{ id: StarFilter; label: string }> {
  return [
    { id: "all", label: t("history.filters.starAll") },
    { id: "starred", label: t("history.filters.starStarred") },
  ];
}

function formatCountLabel(
  t: ReturnType<typeof useT>,
  singularKey: Parameters<ReturnType<typeof useT>>[0],
  pluralKey: Parameters<ReturnType<typeof useT>>[0],
  count: number
): string {
  return t(count === 1 ? singularKey : pluralKey, { count });
}

type PendingAction =
  | { type: "delete-session"; session: MeetingSession }
  | null;

function SurfacePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_18px_40px_var(--app-shadow)] backdrop-blur-xl ${className}`.trim()}
    >
      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <SurfacePanel className="px-6 py-14 text-center">
      <p className="text-2xl font-semibold text-[var(--app-text)]">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--app-text-muted)]">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onPrimary}
          className="h-10 rounded-full bg-[var(--app-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--app-accent-strong)]"
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-strong)]"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </SurfacePanel>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "accent" | "warning" | "danger";
}) {
  const className =
    tone === "accent"
      ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
      : tone === "warning"
        ? "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)]"
        : tone === "danger"
          ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}

function DependencyBanner({
  availability,
}: {
  availability: OpenAiServiceAvailability;
}) {
  const t = useT();

  if (availability.operational) {
    return null;
  }

  const tone = availability.state === "unavailable" ? "danger" : "warning";

  return (
    <SurfacePanel
      className={`mb-6 px-5 py-4 ${
        tone === "danger"
          ? "border-[var(--app-danger-border)] bg-[var(--app-danger-soft)]"
          : "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/15 bg-[var(--app-surface)] text-current">
          <AlertTriangleIcon className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-[var(--app-text)]">
          {t("history.dependency.title")}
        </p>
        <StatusPill
          label={
            tone === "danger"
              ? t("history.dependency.actionRequired")
              : t("history.dependency.needsVerification")
          }
          tone={tone}
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
        {t("history.dependency.impact", { message: availability.message })}
      </p>
    </SurfacePanel>
  );
}

export default function App() {
  const t = useT();
  const manifestVersion = useMemo(() => chrome.runtime.getManifest().version, []);
  const {
    sessions,
    loading,
    detailLoading,
    selectedSession,
    searchQuery,
    setSearchQuery,
    providerFilter,
    setProviderFilter,
    starFilter,
    setStarFilter,
    sortOrder,
    setSortOrder,
    appearance,
    translationTargetLanguage,
    meetingOutputDefaultLanguage,
    meetingProfiles,
    defaultMeetingProfileId,
    openAiAvailability,
    storageInfo,
    storagePercentage,
    translatedCaptionCount,
    translatingCaptionKey,
    translatingSessionId,
    summarizingSessionId,
    summaryJobStatus,
    summaryJobStatuses,
    requestedSummaryExpanded,
    requestedSummaryKey,
    filteredSessions,
    openSession,
    closeSession,
    clearFilters,
    reviewOldestSessions,
    deleteSession,
    updateSessionTitle,
    toggleSessionStar,
    translateCaption,
    translateAllCaptions,
    generateSummary,
    cancelSummary,
  } = useHistory();
  const resolvedTheme = useResolvedTheme(appearance);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const providerFilters = useMemo(() => getProviderFilters(t), [t]);
  const sortOptions = useMemo(() => getSortOptions(t), [t]);
  const starFilters = useMemo(() => getStarFilters(t), [t]);

  const openSettings = () => {
    window.location.href = chrome.runtime.getURL("options.html");
  };

  const activeChips = useMemo(() => {
    const chips: string[] = [];

    if (searchQuery.trim()) {
      chips.push(
        t("history.filters.activeQuery", {
          query: searchQuery.trim(),
        })
      );
    }

    if (providerFilter !== "all") {
      chips.push(
        providerFilters.find((filter) => filter.id === providerFilter)?.label ||
          providerFilter
      );
    }

    if (starFilter === "starred") {
      chips.push(t("history.filters.starStarred"));
    }

    if (sortOrder === "oldest") {
      chips.push(t("history.filters.activeViewingOldest"));
    }

    return chips;
  }, [providerFilter, providerFilters, searchQuery, sortOrder, starFilter, t]);

  const resultLabel =
    filteredSessions.length === sessions.length
      ? formatCountLabel(
          t,
          "history.page.resultCountOne",
          "history.page.resultCountOther",
          filteredSessions.length
        )
      : t("history.page.resultCountFiltered", {
          filtered: filteredSessions.length,
          total: sessions.length,
        });

  const hasHighStorageUsage = storagePercentage >= 70;

  const confirmDialog = async () => {
    if (!pendingAction) {
      return;
    }

    setDialogBusy(true);
    try {
      if (pendingAction.type === "delete-session") {
        await deleteSession(pendingAction.session.id);
      }
      setPendingAction(null);
    } catch {
      // Toast feedback is handled by the history hook.
    } finally {
      setDialogBusy(false);
    }
  };

  const showInitialLoadingScreen =
    loading && sessions.length === 0 && !selectedSession;
  const showRefreshLoadingIndicator = loading && !showInitialLoadingScreen;

  if (showInitialLoadingScreen) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] p-6 text-[var(--app-text-muted)]">
        <AppLoadingScreen
          title={t("history.page.loadingTitle")}
          description={t("history.page.loadingDescription")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <Toaster
        position="top-center"
        theme={resolvedTheme}
        richColors
        toastOptions={{
          style: {
            background: "var(--app-surface-strong)",
            border: "1px solid var(--app-border)",
            color: "var(--app-text)",
            boxShadow: "0 18px 40px var(--app-shadow)",
            maxHeight: "10rem",
            maxWidth: "min(32rem, calc(100vw - 2rem))",
            overflowY: "auto",
          },
        }}
      />

      {showRefreshLoadingIndicator && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text-muted)] shadow-[0_12px_24px_var(--app-shadow)] backdrop-blur-xl">
            <span className="text-[var(--app-accent)] animate-spin">
              <RefreshIcon className="h-4 w-4" />
            </span>
            <span>{t("history.page.loadingTitle")}</span>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        busy={dialogBusy}
        tone="danger"
        title={
          pendingAction?.type === "delete-session"
            ? t("history.page.deleteSessionTitle")
            : ""
        }
        description={
          pendingAction?.type === "delete-session"
            ? t("history.page.deleteSessionDescription", {
                title:
                  pendingAction.session.title || pendingAction.session.providerLabel,
              })
            : ""
        }
        confirmLabel={
          pendingAction?.type === "delete-session"
            ? t("history.page.deleteSessionConfirm")
            : ""
        }
        onConfirm={() => {
          void confirmDialog();
        }}
        onCancel={() => setPendingAction(null)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 xl:py-10">
        <header className="mb-6 flex flex-col gap-5 xl:mb-8 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--app-accent)]">
              {t("history.page.archiveEyebrow")}
            </p>
            <BrandLockup
              title={t("history.page.title")}
              subtitle={t("history.page.subtitle")}
              size={52}
              theme={resolvedTheme}
              className="max-w-2xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StorageIndicator
              bytesUsed={storageInfo.bytesUsed}
              quota={storageInfo.quota}
            />
            <GitHubHeaderLink />
            <IconButton
              onClick={openSettings}
              icon={<GearIcon />}
              label={t("history.page.openSettings")}
              className="shadow-[0_12px_28px_var(--app-shadow)] backdrop-blur-xl"
            />
          </div>
        </header>

        <DependencyBanner availability={openAiAvailability} />

        {!selectedSession && (
          <div className="mb-6 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <SurfacePanel>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <label
                    htmlFor="meeting-history-search"
                    className="mb-2 block text-sm font-medium text-[var(--app-text)]"
                  >
                    {t("history.page.searchLabel")}
                  </label>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3">
                    <span className="text-[var(--app-text-faint)]">
                      <SearchIcon className="h-4 w-4" />
                    </span>
                    <input
                      id="meeting-history-search"
                      type="text"
                      placeholder={t("history.page.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full bg-transparent text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-faint)]"
                    />
                    {searchQuery && (
                      <IconButton
                        onClick={() => setSearchQuery("")}
                        icon={<CloseIcon />}
                        label={t("history.page.clearSearch")}
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
                      {t("history.page.sortLabel")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSortOrder(option.id)}
                          className={
                            "h-10 rounded-full border px-4 text-sm font-medium transition-colors " +
                            (sortOrder === option.id
                              ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]")
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-[var(--app-text)]">
                  {t("history.page.providerFilterLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {providerFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setProviderFilter(filter.id)}
                      className={
                        "h-10 rounded-full border px-4 text-sm font-medium transition-colors " +
                        (providerFilter === filter.id
                          ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                          : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]")
                      }
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-[var(--app-text)]">
                  {t("history.page.statusFilterLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {starFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStarFilter(filter.id)}
                      className={
                        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors " +
                        (starFilter === filter.id
                          ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                          : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]")
                      }
                    >
                      <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">
                        <StarIcon />
                      </span>
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-[var(--app-border)] pt-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--app-text)]">
                    {resultLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-text-faint)]">
                    {formatCountLabel(
                      t,
                      "history.page.translatedCaptionCountOne",
                      "history.page.translatedCaptionCountOther",
                      translatedCaptionCount
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text-muted)]"
                    >
                      {chip}
                    </span>
                  ))}
                  {activeChips.length > 0 && (
                    <IconButton
                      onClick={clearFilters}
                      icon={<CloseIcon />}
                      label={t("history.page.resetFilters")}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            </SurfacePanel>

            <SurfacePanel className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--app-text)]">
                  {t("history.page.archiveSnapshotTitle")}
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--app-text-muted)]">
                      {t("history.page.archiveSnapshotSessions")}
                    </span>
                    <span className="font-medium text-[var(--app-text)]">
                      {sessions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--app-text-muted)]">
                      {t("history.page.archiveSnapshotCurrentView")}
                    </span>
                    <span className="font-medium text-[var(--app-text)]">
                      {sortOrder === "newest"
                        ? t("history.filters.sortNewest")
                        : t("history.filters.sortOldest")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--app-text-muted)]">
                      {t("history.page.archiveSnapshotProviderFocus")}
                    </span>
                    <span className="font-medium text-[var(--app-text)]">
                      {providerFilters.find((filter) => filter.id === providerFilter)
                        ?.label || t("history.filters.providerAll")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--app-text-muted)]">
                      {t("history.page.archiveSnapshotStarFilter")}
                    </span>
                    <span className="font-medium text-[var(--app-text)]">
                      {starFilters.find((filter) => filter.id === starFilter)
                        ?.label || t("history.filters.starAll")}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[var(--app-text-muted)]">
                {t("history.page.archiveSnapshotUrlHint")}
              </p>
            </SurfacePanel>
          </div>
        )}

        {!selectedSession && hasHighStorageUsage && sessions.length > 0 && (
          <SurfacePanel className="mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--app-text)]">
                  {t("history.page.storageFullTitle")}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--app-text-muted)]">
                  {t("history.page.storageFullDescription", {
                    percentage: storagePercentage.toFixed(0),
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reviewOldestSessions}
                  className="h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-strong)]"
                >
                  {t("history.page.reviewOldestSessions")}
                </button>
              </div>
            </div>
          </SurfacePanel>
        )}

        {selectedSession ? (
          <SessionDetail
            session={selectedSession}
            translationTargetLanguage={translationTargetLanguage}
            meetingOutputDefaultLanguage={meetingOutputDefaultLanguage}
            meetingProfiles={meetingProfiles}
            defaultMeetingProfileId={defaultMeetingProfileId}
            openAiAvailability={openAiAvailability}
            translatingCaptionKey={translatingCaptionKey}
            translatingSessionId={translatingSessionId}
            summarizingSessionId={summarizingSessionId}
            summaryJobStatus={summaryJobStatus}
            requestedSummaryExpanded={requestedSummaryExpanded}
            requestedSummaryKey={requestedSummaryKey}
            onTranslateCaption={translateCaption}
            onTranslateAllCaptions={translateAllCaptions}
            onGenerateSummary={generateSummary}
            onCancelSummary={cancelSummary}
            onUpdateTitle={updateSessionTitle}
            onToggleStar={toggleSessionStar}
            onBack={closeSession}
            onRequestDelete={(session) =>
              setPendingAction({ type: "delete-session", session })
            }
          />
        ) : detailLoading ? (
          <AppLoadingScreen
            variant="panel"
            title={t("history.page.detailLoadingTitle")}
            description={t("history.page.detailLoadingDescription")}
          />
        ) : filteredSessions.length === 0 ? (
          sessions.length === 0 ? (
            <EmptyState
              title={t("history.page.emptyInitialTitle")}
              description={t("history.page.emptyInitialDescription")}
              primaryLabel={t("history.page.openSettings")}
              onPrimary={openSettings}
            />
          ) : (
            <EmptyState
              title={t("history.page.emptyFilteredTitle")}
              description={t("history.page.emptyFilteredDescription")}
              primaryLabel={t("history.page.resetFilters")}
              onPrimary={clearFilters}
              secondaryLabel={t("history.page.reviewOldestSessions")}
              onSecondary={reviewOldestSessions}
            />
          )
        ) : (
              <SessionList
                sessions={filteredSessions}
                summaryJobStatuses={summaryJobStatuses}
                onSelect={openSession}
                onRequestDelete={(session) =>
                  setPendingAction({ type: "delete-session", session })
                }
                onToggleStar={toggleSessionStar}
              />
        )}

        <LegalFooter className="mt-8" version={manifestVersion} />
      </div>
    </div>
  );
}
