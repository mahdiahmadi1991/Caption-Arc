import { describe, expect, test } from "vitest";
import {
  buildCloudSyncProviderCardModels,
  getCloudSyncHealthMeta,
  getCloudSyncOverviewMeta,
  getCloudSyncProviderDetails,
} from "../../entrypoints/options/cloud-sync-view-model";
import { createTranslator } from "../../entrypoints/shared/i18n";

const t = createTranslator("en");

describe("Cloud sync options view-model contracts", () => {
  test("CSYNC-VM-001: provider cards expose reconnect and unsupported-removal actions from checkpoint state", () => {
    const providerCards = buildCloudSyncProviderCardModels({
      checkpoints: [
        {
          provider: "google-drive",
          connected: true,
          supported: true,
          healthState: "action-required",
          manualRetryAvailable: false,
        },
        {
          provider: "onedrive",
          connected: false,
          supported: false,
          unsupportedReason: "Unsupported here",
          lastError: "Unsupported here",
          healthState: "action-required",
          manualRetryAvailable: false,
        },
      ],
      providerDetails: getCloudSyncProviderDetails(t),
      mutationState: {
        status: "idle",
        message: "Cloud sync status updated.",
      },
      settingsConnectedCloudProviders: ["google-drive", "onedrive"],
      t,
    });

    expect(providerCards[0]).toMatchObject({
      provider: "google-drive",
      needsReconnect: true,
      canRetry: false,
      canRemoveUnsupportedProvider: false,
      providerSupported: true,
    });
    expect(providerCards[1]).toMatchObject({
      provider: "onedrive",
      needsReconnect: false,
      canRemoveUnsupportedProvider: true,
      providerSupported: false,
      statusMessage: "Unsupported here",
    });
  });

  test("CSYNC-VM-002: overview prefers attention over syncing when a connected provider needs intervention", () => {
    const overview = getCloudSyncOverviewMeta(
      [
        {
          provider: "google-drive",
          connected: true,
          healthState: "syncing",
          manualRetryAvailable: false,
        },
        {
          provider: "onedrive",
          connected: true,
          healthState: "needs-attention",
          manualRetryAvailable: true,
        },
      ],
      false,
      t
    );

    expect(overview).toEqual({
      label: "Needs attention",
      tone: "warning",
      description:
        "At least one cloud destination needs intervention before the archive is fully protected again.",
    });
  });

  test("CSYNC-VM-003: overview keeps first-connect state simple even when local queue work exists", () => {
    const overview = getCloudSyncOverviewMeta([], false, t, {
      queueSize: 131,
      dueTaskCount: 131,
    });

    expect(overview).toEqual({
      label: "Not connected",
      tone: "neutral",
      description:
        "Connect a cloud provider to protect your archive automatically.",
    });
  });

  test("CSYNC-VM-004: health tones visually distinguish active sync from healthy steady state", () => {
    expect(getCloudSyncHealthMeta("syncing", t)).toEqual({
      label: "Syncing",
      tone: "accent",
      motion: "processing",
    });

    expect(getCloudSyncHealthMeta("up-to-date", t)).toEqual({
      label: "Up to date",
      tone: "success",
      motion: "none",
    });
  });
});
