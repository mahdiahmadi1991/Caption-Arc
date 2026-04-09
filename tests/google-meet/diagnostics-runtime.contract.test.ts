import { beforeEach, describe, expect, test, vi } from "vitest";

const evaluateInExtensionTarget = vi.fn();
const resolveCaptionArcExtensionTarget = vi.fn(async () => ({
  type: "page",
  webSocketDebuggerUrl: "ws://diagnostics-target",
  runtimeId: "runtime-id",
  manifestName: "CaptionArc",
}));

vi.mock("../../scripts/manual-smoke/lib/extension-target.mjs", () => ({
  evaluateInExtensionTarget,
  listTargets: vi.fn(async () => []),
  openExtensionUiTarget: vi.fn(async () => undefined),
  parseTargetExtensionId: vi.fn(() => null),
  resolveCaptionArcExtensionTarget,
}));

async function loadDiagnosticsRuntimeHelpers() {
  vi.resetModules();
  return await import("../../scripts/manual-smoke/lib/diagnostics-runtime.mjs");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Manual smoke diagnostics runtime helper", () => {
  test("DIAG-SMK-001: temporary diagnostics override restores the previous config after success", async () => {
    evaluateInExtensionTarget
      .mockResolvedValueOnce({
        ok: true,
        response: {
          success: true,
          config: {
            enabled: false,
            minLevel: "off",
            maxEvents: 400,
          },
        },
      })
      .mockResolvedValueOnce({ ok: true, response: { success: true } })
      .mockResolvedValueOnce({ ok: true, response: { success: true } })
      .mockResolvedValueOnce({ ok: true, response: { success: true } });

    const diagnosticsRuntime = await loadDiagnosticsRuntimeHelpers();
    const result = await diagnosticsRuntime.runWithTemporaryDiagnosticsConfig({
      baseUrl: "http://127.0.0.1:9222",
      minLevel: "debug",
      clearExisting: true,
      operation: async () => "done",
    });

    expect(result).toBe("done");
    expect(evaluateInExtensionTarget).toHaveBeenCalledTimes(4);
    expect(evaluateInExtensionTarget.mock.calls[0]?.[0]?.expression).toContain(
      '"action":"getDiagnosticsConfig"'
    );
    expect(evaluateInExtensionTarget.mock.calls[1]?.[0]?.expression).toContain(
      '"action":"clearDiagnosticsData"'
    );
    expect(evaluateInExtensionTarget.mock.calls[2]?.[0]?.expression).toContain(
      '"action":"setDiagnosticsConfig"'
    );
    expect(evaluateInExtensionTarget.mock.calls[3]?.[0]?.expression).toContain(
      '"enabled":false'
    );
  });

  test("DIAG-SMK-002: temporary diagnostics override restores the previous config after failure", async () => {
    evaluateInExtensionTarget
      .mockResolvedValueOnce({
        ok: true,
        response: {
          success: true,
          config: {
            enabled: true,
            minLevel: "info",
            maxEvents: 200,
          },
        },
      })
      .mockResolvedValueOnce({ ok: true, response: { success: true } })
      .mockResolvedValueOnce({ ok: true, response: { success: true } })
      .mockResolvedValueOnce({ ok: true, response: { success: true } });

    const diagnosticsRuntime = await loadDiagnosticsRuntimeHelpers();

    await expect(
      diagnosticsRuntime.runWithTemporaryDiagnosticsConfig({
        baseUrl: "http://127.0.0.1:9222",
        minLevel: "debug",
        clearExisting: true,
        operation: async () => {
          throw new Error("smoke-step-failed");
        },
      })
    ).rejects.toThrow("smoke-step-failed");

    expect(evaluateInExtensionTarget).toHaveBeenCalledTimes(4);
    expect(evaluateInExtensionTarget.mock.calls[3]?.[0]?.expression).toContain(
      '"minLevel":"info"'
    );
  });
});