import {
  createDiagnosticsLogger,
  initializeDiagnosticsClient,
} from "../shared/diagnostics-client";

let contentDebugState: Record<string, unknown> = {};
const contentDiagnostics = createDiagnosticsLogger({
  runtime: "content",
  domain: "runtime",
  feature: "content-debug-state",
});

void initializeDiagnosticsClient();

function publishContentDebugState(): void {
  void contentDiagnostics.snapshot("content-runtime", contentDebugState);
}

export function updateContentDebugState(patch: Record<string, unknown>): void {
  contentDebugState = {
    ...contentDebugState,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  publishContentDebugState();
}

export function resetContentDebugState(): void {
  contentDebugState = {};
  void contentDiagnostics.clearSnapshot("content-runtime");
}
