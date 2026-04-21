import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { DiagnosticsConsoleDrawer } from "../../entrypoints/options/diagnostics-console";
import { I18nProvider } from "../../entrypoints/shared/i18n";
import {
  DEFAULT_DIAGNOSTICS_CONFIG,
  createDiagnosticsEvent,
} from "../../entrypoints/shared/diagnostics";

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Diagnostics console UI contracts", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
      await flushMicrotasks();
    });
    root = null;
    container?.remove();
    container = null;
  });

  test("DIAG-UI-001: event rows stay left-aligned and ltr under Persian UI", async () => {
    const event = createDiagnosticsEvent({
      level: "info",
      runtime: "options",
      domain: "runtime",
      feature: "cloud-sync",
      provider: "options",
      message: "options_cloud_sync_load_completed",
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(
        <I18nProvider locale="fa">
          <DiagnosticsConsoleDrawer
            open
            onClose={() => {}}
            config={DEFAULT_DIAGNOSTICS_CONFIG}
            events={[event]}
            snapshotCount={0}
            resolvedSnapshot={null}
            manualRefreshInProgress={false}
            busyAction={null}
            requestError={null}
            pageVisible
            lastUpdatedAt={event.timestamp}
            onRefresh={async () => {}}
            onClear={async () => {}}
            onSetSessionCaptureEnabled={async () => {}}
          />
        </I18nProvider>
      );
      await flushMicrotasks();
    });

    const eventRow = container.querySelector("article");
    expect(eventRow).not.toBeNull();
    expect(eventRow?.getAttribute("dir")).toBe("ltr");
    expect(eventRow?.className).toContain("text-left");
  });
});
