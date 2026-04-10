export type MeetingHistoryUrlState = {
  searchQuery: string;
  providerFilter: string | null;
  starFilter: string | null;
  sortOrder: string | null;
  selectedSessionId: string | null;
  targetSummaryKey: string | null;
  expandSummary: boolean;
};

export const MEETING_HISTORY_SUMMARY_QUERY_KEY = "summary";
export const MEETING_HISTORY_SUMMARY_EXPANDED_QUERY_KEY = "summaryExpanded";
const MEETING_HISTORY_EXPANDED_TRUE_VALUE = "1";

export function readMeetingHistoryUrlState(
  urlLike: string | URL
): MeetingHistoryUrlState {
  const url = typeof urlLike === "string" ? new URL(urlLike) : urlLike;

  return {
    searchQuery: url.searchParams.get("q") || "",
    providerFilter: url.searchParams.get("provider"),
    starFilter: url.searchParams.get("starred"),
    sortOrder: url.searchParams.get("sort"),
    selectedSessionId: url.searchParams.get("session")?.trim() || null,
    targetSummaryKey:
      url.searchParams.get(MEETING_HISTORY_SUMMARY_QUERY_KEY)?.trim() || null,
    expandSummary:
      url.searchParams.get(MEETING_HISTORY_SUMMARY_EXPANDED_QUERY_KEY) ===
      MEETING_HISTORY_EXPANDED_TRUE_VALUE,
  };
}

export function applyMeetingHistoryUrlState(
  url: URL,
  state: MeetingHistoryUrlState
): void {
  if (state.searchQuery.trim()) {
    url.searchParams.set("q", state.searchQuery.trim());
  } else {
    url.searchParams.delete("q");
  }

  if (state.providerFilter && state.providerFilter !== "all") {
    url.searchParams.set("provider", state.providerFilter);
  } else {
    url.searchParams.delete("provider");
  }

  if (state.starFilter && state.starFilter !== "all") {
    url.searchParams.set("starred", state.starFilter);
  } else {
    url.searchParams.delete("starred");
  }

  if (state.sortOrder && state.sortOrder !== "newest") {
    url.searchParams.set("sort", state.sortOrder);
  } else {
    url.searchParams.delete("sort");
  }

  if (state.selectedSessionId) {
    url.searchParams.set("session", state.selectedSessionId);
  } else {
    url.searchParams.delete("session");
  }

  if (state.targetSummaryKey) {
    url.searchParams.set(
      MEETING_HISTORY_SUMMARY_QUERY_KEY,
      state.targetSummaryKey
    );
  } else {
    url.searchParams.delete(MEETING_HISTORY_SUMMARY_QUERY_KEY);
  }

  if (state.expandSummary) {
    url.searchParams.set(
      MEETING_HISTORY_SUMMARY_EXPANDED_QUERY_KEY,
      MEETING_HISTORY_EXPANDED_TRUE_VALUE
    );
  } else {
    url.searchParams.delete(MEETING_HISTORY_SUMMARY_EXPANDED_QUERY_KEY);
  }
}

export function buildMeetingHistoryRelativeUrl(
  currentUrl: string,
  state: MeetingHistoryUrlState
): string {
  const url = new URL(currentUrl);
  applyMeetingHistoryUrlState(url, state);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildMeetingHistorySummaryTargetUrl(
  pageUrl: string,
  params: {
    sessionId: string;
    summaryKey: string;
  }
): string {
  const url = new URL(pageUrl);
  applyMeetingHistoryUrlState(url, {
    searchQuery: "",
    providerFilter: null,
    starFilter: null,
    sortOrder: null,
    selectedSessionId: params.sessionId,
    targetSummaryKey: params.summaryKey,
    expandSummary: true,
  });
  return url.toString();
}