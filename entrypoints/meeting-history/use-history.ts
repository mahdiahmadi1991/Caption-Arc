import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { MeetingPlatform, MeetingSession } from "./components";
import type {
  SummaryJobStatus,
  SummaryProfile,
} from "../background/types";
import {
  getLanguageName,
} from "../shared/language-metadata";
import type { ThemePreference } from "../shared/theme";
import { buildMeetingSessionSearchableText } from "../shared/meeting-session";
import {
  buildMeetingSummaryPrompt,
  createMeetingSummaryArtifact,
} from "../shared/meeting-summary";
import {
  resolveSummaryProfile,
  resolveSummaryProfilePrompt,
} from "../shared/summary-profiles";
import {
  getOpenAiServiceAvailability,
  type OpenAiServiceAvailability,
} from "../shared/openai-service";
import { createDiagnosticsLogger } from "../shared/diagnostics-client";
import { useT, type UiTranslator } from "../shared/i18n";

const historyDiagnostics = createDiagnosticsLogger({
  runtime: "meeting-history",
  domain: "history",
  feature: "meeting-history-runtime",
});

type StorageInfo = {
  bytesUsed: number;
  quota: number;
};

type SettingsSnapshot = {
  openaiApiKey: string;
  provider: string;
  model: string;
  targetLanguage: string;
  summaryLanguage: string;
  customPrompt: string;
  summaryProfiles: SummaryProfile[];
  defaultSummaryProfileId: string;
  verificationSnapshot: {
    status: "verified" | "error";
    message: string;
    signature: string;
    verifiedAt: number;
  } | null;
};

export type ProviderFilter = "all" | MeetingPlatform;
export type SessionSort = "newest" | "oldest";
export type StarFilter = "all" | "starred";

type HistoryUrlState = {
  searchQuery: string;
  providerFilter: ProviderFilter;
  starFilter: StarFilter;
  sortOrder: SessionSort;
  selectedSessionId: string | null;
};

const VALID_PROVIDER_FILTERS: ProviderFilter[] = [
  "all",
  "google-meet",
  "microsoft-teams",
  "zoom-web",
];
const VALID_SORT_ORDERS: SessionSort[] = ["newest", "oldest"];
const VALID_STAR_FILTERS: StarFilter[] = ["all", "starred"];
const SETTINGS_STORAGE_KEYS = new Set(["settings", "settingsState"]);

function buildTimelineContext(
  session: MeetingSession,
  source: "caption" | "chat",
  timestamp: number
): string | undefined {
  const timeline = [
    ...session.captions.map((caption) => ({
      source: "caption" as const,
      timestamp: caption.timestamp,
      speaker: caption.speaker,
      text: caption.text,
    })),
    ...session.chatMessages.map((message) => ({
      source: "chat" as const,
      timestamp: message.timestamp,
      speaker: message.speaker,
      text: message.text,
    })),
  ].sort((left, right) => left.timestamp - right.timestamp);

  const itemIndex = timeline.findIndex(
    (item) => item.source === source && item.timestamp === timestamp
  );

  if (itemIndex <= 0) {
    return undefined;
  }

  return timeline
    .slice(Math.max(0, itemIndex - 3), itemIndex)
    .map((item) => `[${item.speaker || "Unknown"}]: ${item.text}`)
    .join("\n");
}

function getActionErrorMessage(
  t: UiTranslator,
  error: unknown,
  fallbackMessage: string
): string {
  const message = error instanceof Error ? error.message : String(error || "");
  const cleanedMessage = message.replace(/^Error:\s*/, "").trim();

  if (
    cleanedMessage.includes("Unknown action") ||
    cleanedMessage.includes("The extension runtime is out of date")
  ) {
    return t("history.runtime.errorOutdated", {
      fallback: fallbackMessage,
    });
  }

  if (!cleanedMessage) {
    return t("history.runtime.errorNoDetails", {
      fallback: fallbackMessage,
    });
  }

  if (
    cleanedMessage.toLowerCase().includes("truncated") ||
    cleanedMessage.toLowerCase().includes("output token limit") ||
    cleanedMessage.toLowerCase().includes("max_tokens")
  ) {
    return t("history.runtime.errorModelStopped", {
      fallback: fallbackMessage,
    });
  }

  if (cleanedMessage === fallbackMessage) {
    return t("history.runtime.errorNoProviderDetails", {
      fallback: fallbackMessage,
    });
  }

  return t("history.runtime.errorWithDetails", {
    fallback: fallbackMessage,
    details: cleanedMessage,
  });
}

function isOutdatedRuntimeError(value: unknown): boolean {
  const message = String(value || "");
  return (
    message.includes("Unknown action") ||
    message.includes("The extension runtime is out of date")
  );
}

function isTerminalSummaryJobState(
  state?: SummaryJobStatus["state"] | null
): boolean {
  return (
    state === "completed" || state === "failed" || state === "cancelled"
  );
}

function readHistoryUrlState(): HistoryUrlState {
  const url = new URL(window.location.href);
  const provider = url.searchParams.get("provider");
  const starred = url.searchParams.get("starred");
  const sort = url.searchParams.get("sort");
  const selectedSessionId = url.searchParams.get("session");

  return {
    searchQuery: url.searchParams.get("q") || "",
    providerFilter: VALID_PROVIDER_FILTERS.includes(provider as ProviderFilter)
      ? (provider as ProviderFilter)
      : "all",
    starFilter: VALID_STAR_FILTERS.includes(starred as StarFilter)
      ? (starred as StarFilter)
      : "all",
    sortOrder: VALID_SORT_ORDERS.includes(sort as SessionSort)
      ? (sort as SessionSort)
      : "newest",
    selectedSessionId: selectedSessionId?.trim() || null,
  };
}

function writeHistoryUrlState(
  state: HistoryUrlState,
  mode: "replace" | "push"
): void {
  const url = new URL(window.location.href);

  if (state.searchQuery.trim()) {
    url.searchParams.set("q", state.searchQuery.trim());
  } else {
    url.searchParams.delete("q");
  }

  if (state.providerFilter !== "all") {
    url.searchParams.set("provider", state.providerFilter);
  } else {
    url.searchParams.delete("provider");
  }

  if (state.starFilter !== "all") {
    url.searchParams.set("starred", state.starFilter);
  } else {
    url.searchParams.delete("starred");
  }

  if (state.sortOrder !== "newest") {
    url.searchParams.set("sort", state.sortOrder);
  } else {
    url.searchParams.delete("sort");
  }

  if (state.selectedSessionId) {
    url.searchParams.set("session", state.selectedSessionId);
  } else {
    url.searchParams.delete("session");
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState(null, "", nextUrl);
  } else {
    window.history.replaceState(null, "", nextUrl);
  }
}

export function useHistory() {
  const t = useT();
  const initialUrlState = readHistoryUrlState();

  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MeetingSession | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState(initialUrlState.searchQuery);
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>(
    initialUrlState.providerFilter
  );
  const [starFilter, setStarFilter] = useState<StarFilter>(
    initialUrlState.starFilter
  );
  const [sortOrder, setSortOrder] = useState<SessionSort>(
    initialUrlState.sortOrder
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialUrlState.selectedSessionId
  );
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    bytesUsed: 0,
    quota: 5242880,
  });
  const [appearance, setAppearance] = useState<ThemePreference>("system");
  const [summaryDefaultLanguage, setSummaryDefaultLanguage] = useState("en");
  const [translationTargetLanguage, setTranslationTargetLanguage] =
    useState("en");
  const [translatingCaptionKey, setTranslatingCaptionKey] = useState<
    string | null
  >(null);
  const [translatingSessionId, setTranslatingSessionId] = useState<
    string | null
  >(null);
  const [summarizingSessionId, setSummarizingSessionId] = useState<
    string | null
  >(null);
  const [summaryJobStatuses, setSummaryJobStatuses] = useState<
    Record<string, SummaryJobStatus>
  >({});
  const [summaryProfiles, setSummaryProfiles] = useState<SummaryProfile[]>([]);
  const [defaultSummaryProfileId, setDefaultSummaryProfileId] = useState("");
  const [openAiAvailability, setOpenAiAvailability] =
    useState<OpenAiServiceAvailability>({
      state: "setup",
      configured: false,
      operational: false,
      message: "Finish OpenAI setup in Settings to enable AI features.",
      snapshot: null,
    });
  const activeSummaryRequestsRef = useRef<Set<string>>(new Set());
  const historyRefreshInFlightRef = useRef(false);
  const lastFocusRefreshAtRef = useRef(0);

  useEffect(() => {
    void loadHistory();
    void loadStorageInfo();
    void loadPreferences();
    void loadAllSummaryJobStatuses();
  }, []);

  useEffect(() => {
    const refreshHistoryOnFocus = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const now = Date.now();
      if (historyRefreshInFlightRef.current || now - lastFocusRefreshAtRef.current < 300) {
        return;
      }

      lastFocusRefreshAtRef.current = now;
      void loadHistory({
        showLoading: true,
        refreshDetail: true,
      });
      void loadAllSummaryJobStatuses();
    };

    window.addEventListener("focus", refreshHistoryOnFocus);
    document.addEventListener("visibilitychange", refreshHistoryOnFocus);

    return () => {
      window.removeEventListener("focus", refreshHistoryOnFocus);
      document.removeEventListener("visibilitychange", refreshHistoryOnFocus);
    };
  }, [selectedSessionId]);

  useEffect(() => {
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

      const nextAppearance = changes.settings?.newValue?.appearance;
      if (
        nextAppearance !== "light" &&
        nextAppearance !== "dark" &&
        nextAppearance !== "system"
      ) {
        return;
      }

      setAppearance((current) =>
        current === nextAppearance ? current : nextAppearance
      );
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextState = readHistoryUrlState();
      setSearchQuery(nextState.searchQuery);
      setProviderFilter(nextState.providerFilter);
      setStarFilter(nextState.starFilter);
      setSortOrder(nextState.sortOrder);
      setSelectedSessionId(nextState.selectedSessionId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleRuntimeMessage = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void
    ) => {
      const status = (message as { status?: SummaryJobStatus })?.status;
      const action = (message as { action?: string })?.action;

      if (action === "meetingSummaryJobStatusChanged" && status?.sessionId) {
        void historyDiagnostics.debug("meeting_history_summary_status_received", {
          sessionId: status.sessionId,
          state: status.state,
        }, {
          sessionId: status.sessionId,
        });
        setSummaryJobStatuses((prev) => ({
          ...prev,
          [status.sessionId]: status,
        }));

        if (status.state === "completed") {
          void loadSessionDetail(status.sessionId);
          void loadHistory();
          void loadAllSummaryJobStatuses();
        }

        if (
          status.state === "completed" ||
          status.state === "failed" ||
          status.state === "cancelled"
        ) {
          activeSummaryRequestsRef.current.delete(status.sessionId);
          setSummarizingSessionId((current) =>
            current === status.sessionId ? null : current
          );
        }
        return;
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, []);

  useEffect(() => {
    writeHistoryUrlState(
      {
        searchQuery,
        providerFilter,
        starFilter,
        sortOrder,
        selectedSessionId,
      },
      "replace"
    );
  }, [providerFilter, searchQuery, selectedSessionId, sortOrder, starFilter]);

  useEffect(() => {
    if (loading || !selectedSessionId) {
      setSelectedSession(null);
      return;
    }

    const exists = sessions.some((session) => session.id === selectedSessionId);
    if (!exists) {
      setSelectedSessionId(null);
      setSelectedSession(null);
    }
  }, [loading, selectedSessionId, sessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSelectedSession(null);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    void loadSessionDetail(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }

    const loadSummaryJobStatus = async () => {
      try {
        const statusResponse = await chrome.runtime.sendMessage({
          action: "getMeetingSummaryJobStatus",
          sessionId: selectedSessionId,
        });

        if (statusResponse?.success && statusResponse.status?.sessionId) {
          await historyDiagnostics.trace("meeting_history_selected_status_loaded", {
            sessionId: statusResponse.status.sessionId,
            state: statusResponse.status.state,
          }, {
            sessionId: statusResponse.status.sessionId,
          });
          setSummaryJobStatuses((prev) => ({
            ...prev,
            [statusResponse.status.sessionId]:
              statusResponse.status as SummaryJobStatus,
          }));
        }
      } catch (error) {
        await historyDiagnostics.trace("meeting_history_selected_status_load_failed", {
          selectedSessionId,
          error,
        }, {
          sessionId: selectedSessionId,
        });
        // Non-blocking UI hydration.
      }
    };

    void loadSummaryJobStatus();
  }, [selectedSessionId]);

  async function loadHistory(options?: {
    showLoading?: boolean;
    refreshDetail?: boolean;
  }) {
    await historyDiagnostics.info("meeting_history_index_load_started", {
      showLoading: Boolean(options?.showLoading),
      refreshDetail: Boolean(options?.refreshDetail),
      selectedSessionId,
    }, {
      sessionId: selectedSessionId || undefined,
    });
    if (options?.showLoading) {
      setLoading(true);
    }

    historyRefreshInFlightRef.current = true;
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getMeetingHistoryIndex",
      });
      if (response?.success) {
        setSessions(response.sessions || []);
        await historyDiagnostics.info("meeting_history_index_load_completed", {
          sessionCount: (response.sessions || []).length,
          refreshDetail: Boolean(options?.refreshDetail),
        }, {
          sessionId: selectedSessionId || undefined,
        });

        if (options?.refreshDetail && selectedSessionId) {
          void loadSessionDetail(selectedSessionId);
        }
      }
    } catch (error) {
      await historyDiagnostics.error("meeting_history_index_load_failed", {
        error,
      }, {
        sessionId: selectedSessionId || undefined,
      });
      toast.error(t("history.runtime.loadHistoryFailed"));
    } finally {
      historyRefreshInFlightRef.current = false;
      setLoading(false);
    }
  }

  async function loadAllSummaryJobStatuses() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getMeetingSummaryJobStatuses",
      });
      if (response?.success && response.statuses) {
        await historyDiagnostics.trace("meeting_history_statuses_loaded", {
          count: Object.keys(response.statuses).length,
        });
        setSummaryJobStatuses(
          response.statuses as Record<string, SummaryJobStatus>
        );
      }
    } catch (error) {
      await historyDiagnostics.trace("meeting_history_statuses_load_failed", {
        error,
      });
      // Non-blocking UI hydration.
    }
  }

  async function loadSessionDetail(sessionId: string) {
    await historyDiagnostics.debug("meeting_history_detail_load_started", {
      sessionId,
    }, {
      sessionId,
    });
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getMeetingSession",
        sessionId,
      });

      if (response?.success && response.session) {
        const fullSession = response.session as MeetingSession;
        await historyDiagnostics.info("meeting_history_detail_load_completed", {
          sessionId,
          captionCount: fullSession.captions.length,
          chatCount: fullSession.chatMessages.length,
        }, {
          sessionId,
        });
        setSelectedSession(fullSession);
        setSessions((prev) =>
          prev.map((session) =>
            session.id === fullSession.id ? fullSession : session
          )
        );
      }
    } catch (error) {
      await historyDiagnostics.error("meeting_history_detail_load_failed", {
        sessionId,
        error,
      }, {
        sessionId,
      });
      toast.error(t("history.runtime.loadSessionDetailFailed"));
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadStorageInfo() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getStorageUsage",
      });
      if (response?.success) {
        await historyDiagnostics.trace("meeting_history_storage_loaded", {
          bytesUsed: response.bytesUsed,
          quota: response.quota,
        });
        setStorageInfo({
          bytesUsed: response.bytesUsed,
          quota: response.quota,
        });
      }
    } catch (error) {
      await historyDiagnostics.trace("meeting_history_storage_load_failed", {
        error,
      });
      // Storage info is non-blocking.
    }
  }

  async function loadPreferences() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getSettings",
      });
      if (response?.success && response.settings) {
        const nextSettings = response.settings as SettingsSnapshot & {
          appearance?: ThemePreference;
        };
        setAppearance(nextSettings.appearance || "system");
        setSummaryDefaultLanguage(nextSettings.summaryLanguage || "en");
        setTranslationTargetLanguage(nextSettings.targetLanguage || "en");
        setSummaryProfiles(nextSettings.summaryProfiles || []);
        setDefaultSummaryProfileId(nextSettings.defaultSummaryProfileId || "");
        setOpenAiAvailability(getOpenAiServiceAvailability(nextSettings));
        await historyDiagnostics.trace("meeting_history_preferences_loaded", {
          summaryProfileCount: (nextSettings.summaryProfiles || []).length,
          targetLanguage: nextSettings.targetLanguage || "en",
        });
      }
    } catch (error) {
      await historyDiagnostics.trace("meeting_history_preferences_load_failed", {
        error,
      });
      // Appearance and language direction are non-blocking.
    }
  }

  const getSettingsSnapshot = async (): Promise<SettingsSnapshot> => {
    const response = await chrome.runtime.sendMessage({
      action: "getSettings",
    });

    if (!response?.success || !response.settings) {
      throw new Error(t("history.runtime.settingsLoadFailed"));
    }

    return response.settings as SettingsSnapshot;
  };

  const replaceSession = (updatedSession: MeetingSession) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    setSelectedSession((prev) =>
      prev?.id === updatedSession.id ? updatedSession : prev
    );
  };

  const filteredSessions = useMemo(() => {
    const providerScopedSessions =
      providerFilter === "all"
        ? sessions
        : sessions.filter((session) => session.platform === providerFilter);

    const starScopedSessions =
      starFilter === "starred"
        ? providerScopedSessions.filter((session) => Boolean(session.starred))
        : providerScopedSessions;

    const query = searchQuery.trim().toLowerCase();
    const searchedSessions = query
      ? starScopedSessions.filter((session) =>
          session.searchableText.includes(query)
        )
      : starScopedSessions;

    return [...searchedSessions].sort((left, right) => {
      const starredDiff = Number(Boolean(right.starred)) - Number(Boolean(left.starred));
      if (starredDiff !== 0) {
        return starredDiff;
      }

      return sortOrder === "newest"
        ? right.startTime - left.startTime
        : left.startTime - right.startTime;
    });
  }, [providerFilter, searchQuery, sessions, sortOrder, starFilter]);

  const translatedCaptionCount = useMemo(
    () =>
      sessions.reduce(
        (count, session) =>
          count +
          (session.derived?.translatedCaptionCount ??
            session.captions.filter((caption) => Boolean(caption.translation))
              .length),
        0
      ),
    [sessions]
  );

  const storagePercentage = useMemo(() => {
    if (!storageInfo.quota) {
      return 0;
    }

    return Math.min((storageInfo.bytesUsed / storageInfo.quota) * 100, 100);
  }, [storageInfo.bytesUsed, storageInfo.quota]);

  const openSession = (sessionId: string) => {
    void historyDiagnostics.debug("meeting_history_session_opened", {
      sessionId,
    }, {
      sessionId,
    });
    writeHistoryUrlState(
      {
        searchQuery,
        providerFilter,
        starFilter,
        sortOrder,
        selectedSessionId: sessionId,
      },
      "push"
    );
    setSelectedSession(null);
    setDetailLoading(true);
    setSelectedSessionId(sessionId);
  };

  const closeSession = () => {
    void historyDiagnostics.debug("meeting_history_session_closed", {
      sessionId: selectedSessionId,
    }, {
      sessionId: selectedSessionId || undefined,
    });
    writeHistoryUrlState(
      {
        searchQuery,
        providerFilter,
        starFilter,
        sortOrder,
        selectedSessionId: null,
      },
      "push"
    );
    setSelectedSessionId(null);
    setSelectedSession(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setProviderFilter("all");
    setStarFilter("all");
    setSortOrder("newest");
  };

  const reviewOldestSessions = () => {
    setSelectedSessionId(null);
    setSearchQuery("");
    setProviderFilter("all");
    setStarFilter("all");
    setSortOrder("oldest");
  };

  const deleteSession = async (sessionId: string) => {
    await historyDiagnostics.info("meeting_history_delete_started", {
      sessionId,
    }, {
      sessionId,
    });
    try {
      await chrome.runtime.sendMessage({
        action: "deleteMeetingSession",
        sessionId,
      });
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setSelectedSession(null);
      }
      toast.success(t("history.runtime.sessionDeleted"));
      await historyDiagnostics.info("meeting_history_delete_completed", {
        sessionId,
      }, {
        sessionId,
      });
      void loadStorageInfo();
    } catch (error) {
      await historyDiagnostics.error("meeting_history_delete_failed", {
        sessionId,
        error,
      }, {
        sessionId,
      });
      toast.error(t("history.runtime.sessionDeleteFailed"));
      throw new Error(t("history.runtime.sessionDeleteFailed"));
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    await historyDiagnostics.info("meeting_history_title_update_started", {
      sessionId,
      hasTitle: Boolean(title.trim()),
    }, {
      sessionId,
    });
    try {
      await chrome.runtime.sendMessage({
        action: "updateMeetingSession",
        sessionId,
        updates: { title: title || undefined },
      });
      const session =
        selectedSession?.id === sessionId
          ? selectedSession
          : sessions.find((entry) => entry.id === sessionId);
      if (session) {
        replaceSession({
          ...session,
          title: title || undefined,
          searchableText: buildMeetingSessionSearchableText({
            ...session,
            title: title || undefined,
          }),
        });
      }
      toast.success(t("history.runtime.titleUpdated"));
      await historyDiagnostics.info("meeting_history_title_update_completed", {
        sessionId,
        hasTitle: Boolean(title.trim()),
      }, {
        sessionId,
      });
    } catch (error) {
      await historyDiagnostics.error("meeting_history_title_update_failed", {
        sessionId,
        error,
      }, {
        sessionId,
      });
      toast.error(t("history.runtime.titleUpdateFailed"));
    }
  };

  const toggleSessionStar = async (sessionId: string, starred: boolean) => {
    await historyDiagnostics.info("meeting_history_star_toggle_started", {
      sessionId,
      starred,
    }, {
      sessionId,
    });
    try {
      await chrome.runtime.sendMessage({
        action: "updateMeetingSession",
        sessionId,
        updates: { starred },
      });

      const session =
        selectedSession?.id === sessionId
          ? selectedSession
          : sessions.find((entry) => entry.id === sessionId);
      if (session) {
        replaceSession({ ...session, starred });
      }
      await historyDiagnostics.info("meeting_history_star_toggle_completed", {
        sessionId,
        starred,
      }, {
        sessionId,
      });
    } catch (error) {
      await historyDiagnostics.error("meeting_history_star_toggle_failed", {
        sessionId,
        starred,
        error,
      }, {
        sessionId,
      });
      toast.error(t("history.runtime.starUpdateFailed"));
    }
  };

  const translateCaption = async (
    sessionId: string,
    captionTimestamp: number,
    targetLanguage: string,
    source: "caption" | "chat" = "caption"
  ) => {
    await historyDiagnostics.info("meeting_history_item_translation_started", {
      sessionId,
      source,
      targetLanguage,
      captionTimestamp,
    }, {
      sessionId,
    });
    const settingsSnapshot = await getSettingsSnapshot();
    const availability = getOpenAiServiceAvailability(settingsSnapshot);
    if (!availability.operational) {
      toast.error(availability.message);
      return;
    }

    const actionKey = `${sessionId}:${source}:${captionTimestamp}`;
    setTranslatingCaptionKey(actionKey);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "translateSessionCaption",
        sessionId,
        captionTimestamp,
        targetLanguage,
        source,
      });

      if (isOutdatedRuntimeError(response?.error)) {
        const session =
          selectedSession?.id === sessionId
            ? selectedSession
            : sessions.find((entry) => entry.id === sessionId);
        if (!session) {
          throw new Error(t("history.runtime.sessionNotFound"));
        }

        const items =
          source === "chat" ? session.chatMessages : session.captions;
        const itemIndex = items.findIndex(
          (entry) => entry.timestamp === captionTimestamp
        );
        if (itemIndex < 0) {
          throw new Error(
            source === "chat"
              ? t("history.runtime.chatMessageNotFound")
              : t("history.runtime.captionNotFound")
          );
        }

        const item = items[itemIndex];
        const settings = settingsSnapshot;
        const legacyResponse = await chrome.runtime.sendMessage({
          action: "translate",
          id: `${sessionId}:${source}:${captionTimestamp}`,
          text: item.text,
          targetLang: targetLanguage,
          mode: "semantic",
          force: true,
          speaker: item.speaker,
          context: buildTimelineContext(session, source, captionTimestamp),
          customPrompt: settings.customPrompt,
        });

        if (!legacyResponse?.success || !legacyResponse.translation) {
          throw new Error(
            legacyResponse?.error || t("history.runtime.translationFailed")
          );
        }

        const updatedSession = {
          ...session,
          captions:
            source === "caption"
              ? session.captions.map((entry, index) =>
                  index === itemIndex
                    ? {
                        ...entry,
                        translation: legacyResponse.translation as string,
                        translationLanguage: targetLanguage,
                      }
                    : entry
                )
              : session.captions,
          chatMessages:
            source === "chat"
              ? session.chatMessages.map((entry, index) =>
                  index === itemIndex
                    ? {
                        ...entry,
                        translation: legacyResponse.translation as string,
                        translationLanguage: targetLanguage,
                      }
                    : entry
                )
              : session.chatMessages,
        };

        await chrome.runtime.sendMessage({
          action: "updateMeetingSession",
          sessionId,
          updates:
            source === "chat"
              ? { chatMessages: updatedSession.chatMessages }
              : { captions: updatedSession.captions },
        });

        replaceSession({
          ...updatedSession,
          searchableText: buildMeetingSessionSearchableText(updatedSession),
        });
        await historyDiagnostics.info("meeting_history_item_translation_completed", {
          sessionId,
          source,
          targetLanguage,
          legacyFallback: true,
        }, {
          sessionId,
        });
        toast.success(
          t(
            source === "chat"
              ? "history.runtime.chatTranslated"
              : "history.runtime.captionTranslated",
            {
              language: getLanguageName(targetLanguage),
            }
          )
        );
        return;
      }

      if (!response?.success || !response.session) {
        throw new Error(response?.error || t("history.runtime.translationFailed"));
      }

      replaceSession(response.session as MeetingSession);
      await historyDiagnostics.info("meeting_history_item_translation_completed", {
        sessionId,
        source,
        targetLanguage,
        legacyFallback: false,
      }, {
        sessionId,
      });
      toast.success(
        t(
          source === "chat"
            ? "history.runtime.chatTranslated"
            : "history.runtime.captionTranslated",
          {
            language: getLanguageName(targetLanguage),
          }
        )
      );
    } catch (error) {
      await historyDiagnostics.error("meeting_history_item_translation_failed", {
        sessionId,
        source,
        targetLanguage,
        error,
      }, {
        sessionId,
      });
      await loadPreferences();
      toast.error(
        getActionErrorMessage(
          t,
          error,
          source === "chat"
            ? t("history.runtime.chatTranslateFailed")
            : t("history.runtime.captionTranslateFailed")
        )
      );
    } finally {
      setTranslatingCaptionKey(null);
    }
  };

  const generateSummary = async (
    sessionId: string,
    targetLanguage: string,
    profileId: string
  ) => {
    await historyDiagnostics.info("meeting_history_summary_started", {
      sessionId,
      targetLanguage,
      profileId,
    }, {
      sessionId,
    });
    const settingsSnapshot = await getSettingsSnapshot();
    const availability = getOpenAiServiceAvailability(settingsSnapshot);
    if (!availability.operational) {
      toast.error(availability.message);
      return;
    }

    const existingStatus = summaryJobStatuses[sessionId];
    if (
      activeSummaryRequestsRef.current.has(sessionId) ||
      (existingStatus && !isTerminalSummaryJobState(existingStatus.state))
    ) {
      setSummarizingSessionId(sessionId);
      return;
    }

    activeSummaryRequestsRef.current.add(sessionId);
    setSummarizingSessionId(sessionId);
    setSummaryJobStatuses((prev) => ({
      ...prev,
      [sessionId]: {
        sessionId,
        state: "preflighting",
        message: t("history.runtime.analyzingTranscript"),
        updatedAt: Date.now(),
      },
    }));

    let shouldKeepSummarizing = false;

    try {
      const response = await chrome.runtime.sendMessage({
        action: "generateMeetingSummary",
        sessionId,
        targetLanguage,
        profileId,
      });

      if (isOutdatedRuntimeError(response?.error)) {
        const session =
          selectedSession?.id === sessionId
            ? selectedSession
            : sessions.find((entry) => entry.id === sessionId);
        if (!session) {
          throw new Error(t("history.runtime.sessionNotFound"));
        }

        if (session.captions.length === 0 && session.chatMessages.length === 0) {
          throw new Error(t("history.runtime.noSummarySource"));
        }

        const settings = settingsSnapshot;
        const summaryProfile = resolveSummaryProfile(
          settings.summaryProfiles.length
            ? settings.summaryProfiles
            : summaryProfiles,
          profileId,
          settings.defaultSummaryProfileId || defaultSummaryProfileId
        );
        const resolvedPrompt = resolveSummaryProfilePrompt(summaryProfile);

        const summaryPrompt = buildMeetingSummaryPrompt(
          session,
          targetLanguage,
          summaryProfile.id,
          summaryProfile.name,
          resolvedPrompt
        );

        const legacyResponse = await chrome.runtime.sendMessage({
          action: "generateText",
          prompt: summaryPrompt,
          maxTokens: 3200,
        });

        if (!legacyResponse?.success || !legacyResponse.text) {
          throw new Error(
            legacyResponse?.error || t("history.runtime.summaryGenerationFailed")
          );
        }

        const summary = createMeetingSummaryArtifact(
          session,
          summaryProfile.id,
          summaryProfile.name,
          targetLanguage,
          legacyResponse.text as string,
          "openai",
          settings.model,
          resolvedPrompt,
          {
            requestSource: "manual",
            sourceSessionProfileId: session.summaryProfileId,
          }
        );

        const updatedSession = {
          ...session,
          summaries: {
            ...(session.summaries || {}),
            [summary.key]: summary,
          },
          artifacts: {
            ...(session.artifacts || {}),
            summaries: {
              ...(session.artifacts?.summaries || session.summaries || {}),
              [summary.key]: summary,
            },
          },
        };

        await chrome.runtime.sendMessage({
          action: "updateMeetingSession",
          sessionId,
          updates: {
            summaries: updatedSession.summaries,
            artifacts: updatedSession.artifacts,
          },
        });

        replaceSession({
          ...updatedSession,
          searchableText: buildMeetingSessionSearchableText(updatedSession),
        });
        await historyDiagnostics.info("meeting_history_summary_completed", {
          sessionId,
          targetLanguage,
          profileId,
          legacyFallback: true,
        }, {
          sessionId,
        });
        toast.success(
          t("history.runtime.summaryGenerated", {
            language: getLanguageName(targetLanguage),
          })
        );
        return;
      }

      if (!response?.success || !response.session) {
        if (
          typeof response?.error === "string" &&
          response.error.toLowerCase().includes("already being generated")
        ) {
          shouldKeepSummarizing = true;
          const statusResponse = await chrome.runtime.sendMessage({
            action: "getMeetingSummaryJobStatus",
            sessionId,
          });

          if (statusResponse?.success && statusResponse.status?.sessionId) {
            await historyDiagnostics.debug("meeting_history_summary_already_running", {
              sessionId,
              state: statusResponse.status.state,
            }, {
              sessionId,
            });
            setSummaryJobStatuses((prev) => ({
              ...prev,
              [sessionId]: statusResponse.status as SummaryJobStatus,
            }));
          }
          return;
        }

        if (
          typeof response?.error === "string" &&
          response.error.toLowerCase().includes("cancelled")
        ) {
          return;
        }
        throw new Error(
          response?.error || t("history.runtime.summaryGenerationFailed")
        );
      }

      replaceSession(response.session as MeetingSession);
      await historyDiagnostics.info("meeting_history_summary_completed", {
        sessionId,
        targetLanguage,
        profileId,
        legacyFallback: false,
      }, {
        sessionId,
      });
      toast.success(
        t("history.runtime.summaryGenerated", {
          language: getLanguageName(targetLanguage),
        })
      );
    } catch (error) {
      await historyDiagnostics.error("meeting_history_summary_failed", {
        sessionId,
        targetLanguage,
        profileId,
        error,
      }, {
        sessionId,
      });
      await loadPreferences();
      const message =
        error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
      if (message.includes("cancelled")) {
        return;
      }

      toast.error(
        getActionErrorMessage(
          t,
          error,
          t("history.runtime.summaryGenerationFailed")
        )
      );
    } finally {
      activeSummaryRequestsRef.current.delete(sessionId);
      if (shouldKeepSummarizing) {
        setSummarizingSessionId(sessionId);
      } else {
        setSummarizingSessionId(null);
      }
    }
  };

  const cancelSummary = async (sessionId: string) => {
    await historyDiagnostics.info("meeting_history_summary_cancel_started", {
      sessionId,
    }, {
      sessionId,
    });
    try {
      const response = await chrome.runtime.sendMessage({
        action: "cancelMeetingSummaryJob",
        sessionId,
      });

      if (!response?.success) {
        throw new Error(
          response?.error || t("history.runtime.summaryCancelFailed")
        );
      }
      await historyDiagnostics.info("meeting_history_summary_cancel_completed", {
        sessionId,
      }, {
        sessionId,
      });
    } catch (error) {
      await historyDiagnostics.error("meeting_history_summary_cancel_failed", {
        sessionId,
        error,
      }, {
        sessionId,
      });
      toast.error(
        getActionErrorMessage(
          t,
          error,
          t("history.runtime.summaryCancelFailed")
        )
      );
    }
  };

  const translateAllCaptions = async (
    sessionId: string,
    targetLanguage: string
  ) => {
    await historyDiagnostics.info("meeting_history_batch_translation_started", {
      sessionId,
      targetLanguage,
    }, {
      sessionId,
    });
    const settingsSnapshot = await getSettingsSnapshot();
    const availability = getOpenAiServiceAvailability(settingsSnapshot);
    if (!availability.operational) {
      toast.error(availability.message);
      return;
    }

    setTranslatingSessionId(sessionId);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "translateSessionCaptions",
        sessionId,
        targetLanguage,
      });

      if (!response?.success || !response.session) {
        throw new Error(
          response?.error || t("history.runtime.batchTranslationFailed")
        );
      }

      replaceSession(response.session as MeetingSession);

      const translatedCount = Number(response.translatedCount || 0);
      const skippedCount = Number(response.skippedCount || 0);

      if (translatedCount > 0) {
        const skippedSuffix =
          skippedCount > 0
            ? t("history.runtime.batchSkippedSuffix", {
                count: skippedCount,
              })
            : "";
        toast.success(
          t(
            translatedCount === 1
              ? "history.runtime.batchTranslatedOne"
              : "history.runtime.batchTranslatedOther",
            {
              count: translatedCount,
              language: getLanguageName(targetLanguage),
              suffix: skippedSuffix,
            }
          )
        );
      } else {
        toast.success(
          t("history.runtime.allCaptionsAlreadyTranslated", {
            language: getLanguageName(targetLanguage),
          })
        );
      }
      await historyDiagnostics.info("meeting_history_batch_translation_completed", {
        sessionId,
        targetLanguage,
        translatedCount,
        skippedCount,
      }, {
        sessionId,
      });
    } catch (error) {
      await historyDiagnostics.error("meeting_history_batch_translation_failed", {
        sessionId,
        targetLanguage,
        error,
      }, {
        sessionId,
      });
      await loadPreferences();
      toast.error(
        getActionErrorMessage(
          t,
          error,
          t("history.runtime.batchTranslationFailed")
        )
      );
    } finally {
      setTranslatingSessionId(null);
    }
  };

  return {
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
    summaryDefaultLanguage,
    summaryProfiles,
    defaultSummaryProfileId,
    openAiAvailability,
    storageInfo,
    storagePercentage,
    translatedCaptionCount,
    translatingCaptionKey,
    translatingSessionId,
    summarizingSessionId,
    summaryJobStatus: selectedSessionId
      ? summaryJobStatuses[selectedSessionId] || null
      : null,
    summaryJobStatuses,
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
  };
}
