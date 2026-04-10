import { describe, expect, test } from "vitest";
import {
  applyMeetingHistoryUrlState,
  buildMeetingHistoryRelativeUrl,
  buildMeetingHistorySummaryTargetUrl,
  readMeetingHistoryUrlState,
} from "../../entrypoints/meeting-history/url-state";

describe("Meeting history URL state contract", () => {
  test("MHURL-001: summary target URLs encode the selected session, summary key, and expanded state", () => {
    const url = buildMeetingHistorySummaryTargetUrl(
      "chrome-extension://test/meeting-history.html",
      {
        sessionId: "session-42",
        summaryKey: "default:fa:1712742000000",
      }
    );

    const parsed = readMeetingHistoryUrlState(url);

    expect(parsed.selectedSessionId).toBe("session-42");
    expect(parsed.targetSummaryKey).toBe("default:fa:1712742000000");
    expect(parsed.expandSummary).toBe(true);
  });

  test("MHURL-002: relative URL updates preserve existing filters while clearing summary targeting when absent", () => {
    const nextUrl = buildMeetingHistoryRelativeUrl(
      "chrome-extension://test/meeting-history.html?q=team&provider=google-meet&session=session-1&summary=old&summaryExpanded=1",
      {
        searchQuery: "team",
        providerFilter: "google-meet",
        starFilter: null,
        sortOrder: null,
        selectedSessionId: "session-1",
        targetSummaryKey: null,
        expandSummary: false,
      }
    );

    expect(nextUrl).toContain("q=team");
    expect(nextUrl).toContain("provider=google-meet");
    expect(nextUrl).toContain("session=session-1");
    expect(nextUrl).not.toContain("summary=");
    expect(nextUrl).not.toContain("summaryExpanded=");
  });

  test("MHURL-003: applying URL state omits default filters from the canonical query string", () => {
    const url = new URL("chrome-extension://test/meeting-history.html?provider=zoom-web&sort=oldest");

    applyMeetingHistoryUrlState(url, {
      searchQuery: "",
      providerFilter: "all",
      starFilter: "all",
      sortOrder: "newest",
      selectedSessionId: null,
      targetSummaryKey: null,
      expandSummary: false,
    });

    expect(url.search).toBe("");
  });
});