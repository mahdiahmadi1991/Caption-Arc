import type { MeetingProvider } from "./types";
import { googleMeetProvider } from "./google-meet";
import { microsoftTeamsProvider } from "./microsoft-teams";
import { zoomWebProvider } from "./zoom-web";
import { createDiagnosticsLogger } from "../../shared/diagnostics-client";

// Only providers with live capture implementations should be activated here.
const PROVIDERS: MeetingProvider[] = [
  googleMeetProvider,
  microsoftTeamsProvider,
  zoomWebProvider,
];

const providerRegistryDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "provider",
  feature: "provider-registry",
});

export const PLANNED_PROVIDERS: MeetingProvider[] = [];

export function getProviderForUrl(url: URL): MeetingProvider | null {
  const provider = PROVIDERS.find((candidate) => candidate.matchesUrl(url)) || null;
  void providerRegistryDiagnostics.trace("provider_resolved_for_url", {
    hostname: url.hostname,
    pathname: url.pathname,
    provider: provider?.platform || null,
  }, {
    provider: provider?.platform,
  });
  return provider;
}

export function getProviderByPlatform(
  platform: MeetingProvider["platform"]
): MeetingProvider | null {
  const provider =
    PROVIDERS.find((candidate) => candidate.platform === platform) || null;
  void providerRegistryDiagnostics.trace("provider_resolved_for_platform", {
    platform,
    found: Boolean(provider),
  }, {
    provider: provider?.platform,
  });
  return provider;
}

export function getProviderForPageContext(url: URL): MeetingProvider | null {
  const provider =
    PROVIDERS.find((candidate) => candidate.matchesPageContext?.(url) ?? false) ||
    null;
  void providerRegistryDiagnostics.trace("provider_resolved_for_page_context", {
    hostname: url.hostname,
    pathname: url.pathname,
    provider: provider?.platform || null,
  }, {
    provider: provider?.platform,
  });
  return provider;
}
