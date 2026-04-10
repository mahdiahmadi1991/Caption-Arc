export const CAPTION_ARC_GITHUB_URL =
  "https://github.com/mahdiahmadi1991/caption-arc";
export const CAPTION_ARC_PUBLIC_PRIVACY_POLICY_URL =
  "https://github.com/mahdiahmadi1991/caption-arc/blob/main/docs/security/privacy-policy.md";
export const CAPTION_ARC_PUBLIC_TERMS_OF_SERVICE_URL =
  "https://github.com/mahdiahmadi1991/caption-arc/blob/main/docs/security/terms-of-service.md";
export const CAPTION_ARC_TERMS_VERSION = "2026-04-10";
export const CAPTION_ARC_EFFECTIVE_DATE = "2026-04-10";
export const CAPTION_ARC_PUBLISHER_LEGAL_NAME = "Mohammad Mahdi Ahmadi";
export const CAPTION_ARC_SUPPORT_EMAIL = "me@mahdiahmadi.dev";
export const CAPTION_ARC_GOVERNING_LAW_JURISDICTION =
  "the Republic of Cyprus";
export const CAPTION_ARC_OPTIONS_PAGE_PATH = "options.html";
export const CAPTION_ARC_MEETING_HISTORY_PAGE_PATH = "meeting-history.html";
export const CAPTION_ARC_PRIVACY_POLICY_PAGE_PATH = "privacy-policy.html";
export const CAPTION_ARC_TERMS_OF_SERVICE_PAGE_PATH = "terms-of-service.html";

export type TermsAcceptance = {
  version: string;
  acceptedAt: number;
};

export type TermsDecline = {
  version: string;
  declinedAt: number;
};

export type TermsReturnTarget = "close" | "options" | "meeting-history";

export function createCurrentTermsAcceptance(
  acceptedAt = Date.now()
): TermsAcceptance {
  return {
    version: CAPTION_ARC_TERMS_VERSION,
    acceptedAt,
  };
}

export function createCurrentTermsDecline(
  declinedAt = Date.now()
): TermsDecline {
  return {
    version: CAPTION_ARC_TERMS_VERSION,
    declinedAt,
  };
}

export function hasAcceptedCurrentTerms(
  acceptance: TermsAcceptance | null | undefined
): boolean {
  return Boolean(
    acceptance &&
      acceptance.version === CAPTION_ARC_TERMS_VERSION &&
      typeof acceptance.acceptedAt === "number" &&
      Number.isFinite(acceptance.acceptedAt)
  );
}

export function hasDeclinedCurrentTerms(
  decline: TermsDecline | null | undefined
): boolean {
  return Boolean(
    decline &&
      decline.version === CAPTION_ARC_TERMS_VERSION &&
      typeof decline.declinedAt === "number" &&
      Number.isFinite(decline.declinedAt)
  );
}

function getRuntimeUrl(path: string): string {
  const runtime = globalThis.chrome?.runtime;
  if (runtime?.getURL) {
    return runtime.getURL(path);
  }

  return path;
}

export function getPrivacyPolicyPageUrl(): string {
  return getRuntimeUrl(CAPTION_ARC_PRIVACY_POLICY_PAGE_PATH);
}

export function getOptionsPageUrl(): string {
  return getRuntimeUrl(CAPTION_ARC_OPTIONS_PAGE_PATH);
}

export function getMeetingHistoryPageUrl(): string {
  return getRuntimeUrl(CAPTION_ARC_MEETING_HISTORY_PAGE_PATH);
}

export function normalizeTermsReturnTarget(
  value: string | null | undefined
): TermsReturnTarget | null {
  return value === "close" || value === "options" || value === "meeting-history"
    ? value
    : null;
}

export function getTermsReturnTargetUrl(
  target: TermsReturnTarget | null | undefined
): string | null {
  if (target === "options") {
    return getOptionsPageUrl();
  }

  if (target === "meeting-history") {
    return getMeetingHistoryPageUrl();
  }

  return null;
}

export function getTermsOfServicePageUrl(params?: {
  mode?: "accept" | "view";
  source?: string;
  returnTo?: TermsReturnTarget;
}): string {
  const searchParams = new URLSearchParams();

  if (params?.mode) {
    searchParams.set("mode", params.mode);
  }

  if (params?.source) {
    searchParams.set("source", params.source);
  }

  if (params?.returnTo) {
    searchParams.set("returnTo", params.returnTo);
  }

  const query = searchParams.toString();
  return query
    ? `${getRuntimeUrl(CAPTION_ARC_TERMS_OF_SERVICE_PAGE_PATH)}?${query}`
    : getRuntimeUrl(CAPTION_ARC_TERMS_OF_SERVICE_PAGE_PATH);
}
