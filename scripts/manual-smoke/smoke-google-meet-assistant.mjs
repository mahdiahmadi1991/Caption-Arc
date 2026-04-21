#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCdpEndpoint } from "./lib/cdp-runtime.mjs";
import { resolveCaptionArcExtensionTarget } from "./lib/extension-target.mjs";
import { runWithTemporaryDiagnosticsConfig } from "./lib/diagnostics-runtime.mjs";
import {
  ensureAssistantDlsCaptureReady,
  getAssistantDlsCaptureSnapshot,
  pingAssistantDlsCaptureBridge,
  pushAssistantDlsCaption,
  resetAssistantDlsCaptureBridge,
  shutdownAssistantDlsCaptureBridge,
  switchAssistantDlsSessionProfile,
} from "./lib/assistant-dls-capture-driver.mjs";
import {
  assertAssistantScenarioExpectations,
  collectAssistantScenarioEvidence,
  openAssistantSurface,
  waitForAssistantState,
  waitForSessionByMeetingCode,
} from "./lib/assistant-dls-observer.mjs";
import {
  ASSISTANT_DLS_DEFAULT_MATRIX,
  ASSISTANT_DLS_DEFAULT_SCENARIO,
  ASSISTANT_DLS_SCENARIO_ALIASES,
} from "./lib/assistant-dls-scenarios.mjs";
import {
  patchMeetingProfileSettings,
  readResolvedSettings,
  restoreSettingsSnapshotForAssistantDls,
  saveSettingsPatch,
  switchDefaultMeetingProfile,
} from "./lib/assistant-dls-settings.mjs";
import {
  closeAllGoogleMeetTabs,
  createAndJoinGoogleMeetSession,
  ensureChromeExtensionsTab,
  resolveCaptionArcCapturePrompt,
  waitForCaptionArcRuntimeReady,
} from "./lib/google-meet-assistant-harness.mjs";
import { auditAndClearCaptionArcExtensionErrors } from "./lib/extension-errors.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, "fixtures", "assistant-dls");

const scenarioArg = String(
  process.argv[2] ||
    process.env.ASSISTANT_DLS_SCENARIO ||
    ASSISTANT_DLS_DEFAULT_SCENARIO
)
  .trim()
  .toLowerCase();
const portArg = Number.parseInt(process.argv[3] || process.env.SMOKE_PORT || "9222", 10);
const diagnosticsMinLevel = String(
  process.env.SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL || "debug"
).trim();

if (!Number.isFinite(portArg) || portArg <= 0) {
  console.error("Invalid port. Usage: node scripts/manual-smoke/smoke-google-meet-assistant.mjs <scenario|matrix> [port]");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function readFixture(name) {
  const canonicalName = ASSISTANT_DLS_SCENARIO_ALIASES[name];
  if (!canonicalName) {
    throw new Error(
      `Unknown assistant DLS scenario '${name}'. Supported: ${Object.keys(ASSISTANT_DLS_SCENARIO_ALIASES).join(", ")}`
    );
  }

  const fixturePath = path.join(FIXTURES_DIR, `${canonicalName}.json`);
  const raw = await readFile(fixturePath, "utf8");
  return {
    fixturePath,
    fixture: JSON.parse(raw),
  };
}

async function applyInitialScenarioSettings({
  baseUrl,
  webSocketDebuggerUrl,
  expectedRuntimeId,
  fixture,
} = {}) {
  if (fixture?.initialSettingsPatch) {
    await saveSettingsPatch({
      baseUrl,
      webSocketDebuggerUrl,
      expectedRuntimeId,
      patch: fixture.initialSettingsPatch,
    });
  }

  if (Array.isArray(fixture?.initialProfilePatches)) {
    for (const patch of fixture.initialProfilePatches) {
      await patchMeetingProfileSettings({
        baseUrl,
        webSocketDebuggerUrl,
        expectedRuntimeId,
        profileId: patch.profileId,
        patch: patch.patch,
      });
    }
  }

  if (fixture?.initialDefaultProfileId) {
    await switchDefaultMeetingProfile({
      baseUrl,
      webSocketDebuggerUrl,
      expectedRuntimeId,
      profileId: fixture.initialDefaultProfileId,
    });
  }
}

async function executeScenarioStep({
  step,
  meetingCode,
  baseUrl,
  webSocketDebuggerUrl,
  meetTarget,
  expectedRuntimeId,
} = {}) {
  switch (step?.type) {
    case "caption":
      await pushAssistantDlsCaption({
        webSocketDebuggerUrl: meetTarget.webSocketDebuggerUrl,
        stableKey: step.stableKey,
        speaker: step.speaker,
        text: step.text,
        own: Boolean(step.own),
        mode: "caption",
      });
      if (Number.isFinite(step.settleMs)) {
        await sleep(step.settleMs);
      }
      return;

    case "update":
      await pushAssistantDlsCaption({
        webSocketDebuggerUrl: meetTarget.webSocketDebuggerUrl,
        stableKey: step.stableKey,
        speaker: step.speaker,
        text: step.text,
        own: Boolean(step.own),
        mode: "update",
      });
      if (Number.isFinite(step.settleMs)) {
        await sleep(step.settleMs);
      }
      return;

    case "pause":
      await sleep(Number(step.ms || 0));
      return;

    case "settingsPatch":
      await saveSettingsPatch({
        baseUrl,
        webSocketDebuggerUrl,
        expectedRuntimeId,
        patch: step.patch || {},
      });
      await sleep(Number(step.propagationWaitMs || 1800));
      return;

    case "profilePatch":
      await patchMeetingProfileSettings({
        baseUrl,
        webSocketDebuggerUrl,
        expectedRuntimeId,
        profileId: step.profileId,
        patch: step.patch || {},
      });
      await sleep(Number(step.propagationWaitMs || 1200));
      return;

    case "switchDefaultProfile":
      await switchDefaultMeetingProfile({
        baseUrl,
        webSocketDebuggerUrl,
        expectedRuntimeId,
        profileId: step.profileId,
      });
      await sleep(Number(step.propagationWaitMs || 1200));
      return;

    case "switchSessionProfile":
      {
        const meetPageWebSocketDebuggerUrl =
          meetTarget?.webSocketDebuggerUrl || webSocketDebuggerUrl;
        const switchResult = await switchAssistantDlsSessionProfile({
          webSocketDebuggerUrl: meetPageWebSocketDebuggerUrl,
          profileId: step.profileId,
          assistantEnabled:
            typeof step.assistantEnabled === "boolean"
              ? step.assistantEnabled
              : undefined,
          timeoutMs: Number(step.profileSwitchTimeoutMs || 12000),
        });

        let resolvedProfileId =
          switchResult?.currentSession?.meetingProfileId || null;

        if (resolvedProfileId !== step.profileId) {
          const pollStartedAt = Date.now();
          while (Date.now() - pollStartedAt <= 3500) {
            const bridgeSnapshot = await getAssistantDlsCaptureSnapshot({
              webSocketDebuggerUrl: meetPageWebSocketDebuggerUrl,
            }).catch(() => null);
            resolvedProfileId =
              bridgeSnapshot?.currentSession?.meetingProfileId || null;
            if (resolvedProfileId === step.profileId) {
              break;
            }
            await sleep(180);
          }
        }

        if (
          resolvedProfileId &&
          resolvedProfileId !== step.profileId
        ) {
          throw new Error(
            `Assistant DLS profile switch converged to the wrong profile. Expected '${step.profileId}', got '${resolvedProfileId}'.`
          );
        }

        if (!resolvedProfileId) {
          console.warn(
            `Profile switch runtime snapshot did not immediately expose a meetingProfileId for '${step.profileId}'. Continuing and deferring validation to final scenario assertions.`
          );
        }
      }
      await sleep(Number(step.propagationWaitMs || 1500));
      return;

    default:
      throw new Error(`Unsupported assistant DLS step type '${step?.type}'.`);
  }
}

function printScenarioHeader(fixture, fixturePath) {
  console.log("Assistant DLS scenario");
  console.log(`Scenario: ${fixture.id}`);
  console.log(`Fixture: ${path.relative(process.cwd(), fixturePath)}`);
  if (fixture.description) {
    console.log(`Description: ${fixture.description}`);
  }
}

async function runSingleScenario({
  baseUrl,
  targets,
  extensionTarget,
  fixture,
  fixturePath,
} = {}) {
  const expectedRuntimeId = extensionTarget?.runtimeId || null;
  const webSocketDebuggerUrl = extensionTarget?.webSocketDebuggerUrl;
  if (!webSocketDebuggerUrl) {
    throw new Error("Could not resolve CaptionArc extension page target.");
  }

  printScenarioHeader(fixture, fixturePath);

  const originalSettings = await readResolvedSettings({ webSocketDebuggerUrl });
  const startedAt = Date.now();
  let joinedTargetWebSocketUrl = null;
  let primaryError = null;
  let postRunErrorAudit = null;

  try {
    await closeAllGoogleMeetTabs({
      baseUrl,
    }).catch(() => null);
    await ensureChromeExtensionsTab({
      baseUrl,
    }).catch(() => null);

    const preflightErrorAudit = await auditAndClearCaptionArcExtensionErrors({
      baseUrl,
      extensionId: expectedRuntimeId,
      stageLabel: `pre-scenario/${fixture.id}`,
      failOnErrors: false,
    });
    if (preflightErrorAudit?.inspection?.entryCount) {
      console.warn(preflightErrorAudit.summary);
    }

    await applyInitialScenarioSettings({
      baseUrl,
      webSocketDebuggerUrl,
      expectedRuntimeId,
      fixture,
    });

    const joined = await createAndJoinGoogleMeetSession({
      baseUrl,
      targets: [],
    });
    joinedTargetWebSocketUrl = joined.target.webSocketDebuggerUrl;

    await resolveCaptionArcCapturePrompt({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
      action: "approve",
    });
    await waitForCaptionArcRuntimeReady({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
    });
    await resolveCaptionArcCapturePrompt({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
      action: "approve",
      timeoutMs: 2500,
    });
    await openAssistantSurface({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
    }).catch(() => null);

    await pingAssistantDlsCaptureBridge({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
    });
    await ensureAssistantDlsCaptureReady({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
    });
    await resetAssistantDlsCaptureBridge({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
    });

    for (const step of fixture.steps || []) {
      console.log(`Step: ${step.type}`);
      await executeScenarioStep({
        step,
        meetingCode: joined.meetingCode,
        baseUrl,
        webSocketDebuggerUrl,
        meetTarget: joined.target,
        expectedRuntimeId,
      });
    }

    await waitForSessionByMeetingCode({
      baseUrl,
      meetingCode: joined.meetingCode,
      expectedRuntimeId,
      timeoutMs: 25000,
    });
    await openAssistantSurface({
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
    }).catch(() => null);

    const expectedOutputCount =
      Number.isFinite(fixture?.expectations?.outputCount)
        ? fixture.expectations.outputCount
        : Number.isFinite(fixture?.expectations?.minOutputCount)
          ? fixture.expectations.minOutputCount
          : null;

    const settled = await waitForAssistantState({
      baseUrl,
      meetingCode: joined.meetingCode,
      expectedRuntimeId,
      expectedOutputCount,
      expectedLiveState: fixture?.expectations?.liveState || null,
      timeoutMs: Number(fixture?.expectations?.settleTimeoutMs || 40000),
    }).catch(async (error) => {
      if (fixture?.expectations?.requireNoOutputs) {
        await sleep(2200);
        return null;
      }
      throw error;
    });

    if (settled?.session?.id) {
      await openAssistantSurface({
        webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
      }).catch(() => null);
    }

    const evidence = await collectAssistantScenarioEvidence({
      baseUrl,
      webSocketDebuggerUrl: joined.target.webSocketDebuggerUrl,
      meetingCode: joined.meetingCode,
      expectedRuntimeId,
      diagnosticsQuery: {
        domain: "assistant",
      },
    });

    const assertionSummary = assertAssistantScenarioExpectations(
      evidence,
      fixture.expectations || {}
    );

    console.log(`Meeting URL: ${joined.meetingUrl}`);
    console.log(`Meeting code: ${joined.meetingCode}`);
    console.log(`Session ID: ${evidence?.session?.id || "n/a"}`);
    console.log(`Outputs: ${assertionSummary.outputCount}`);
    console.log(`Live state: ${assertionSummary.liveState}`);
    console.log(`Overlay cards: ${assertionSummary.overlayCardCount}`);
    if (assertionSummary.latestOutput) {
      console.log(
        `Latest trigger: ${assertionSummary.latestOutput.triggerText}`
      );
      console.log(
        `Latest profile: ${assertionSummary.latestOutput.profileId} / ${assertionSummary.latestOutput.responseIntent}`
      );
    }
    console.log(`Duration: ${Date.now() - startedAt}ms`);
    console.log("Result: PASS");
  } catch (error) {
    primaryError = error;
  } finally {
    if (joinedTargetWebSocketUrl) {
      await shutdownAssistantDlsCaptureBridge({
        webSocketDebuggerUrl: joinedTargetWebSocketUrl,
      }).catch(() => null);
    }
    await closeAllGoogleMeetTabs({
      baseUrl,
      exceptTargetId: null,
    }).catch(() => null);
    await ensureChromeExtensionsTab({
      baseUrl,
    }).catch(() => null);
    await restoreSettingsSnapshotForAssistantDls({
      webSocketDebuggerUrl,
      snapshot: originalSettings.snapshot,
    }).catch(() => null);
    postRunErrorAudit = await auditAndClearCaptionArcExtensionErrors({
      baseUrl,
      extensionId: expectedRuntimeId,
      stageLabel: `post-scenario/${fixture.id}`,
      failOnErrors: false,
    }).catch((error) => ({
      summary: `post-scenario/${fixture.id}: extension error audit failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      inspection: {
        entryCount: 0,
      },
    }));
  }

  if (primaryError) {
    throw primaryError;
  }

  if (postRunErrorAudit?.inspection?.entryCount) {
    throw new Error(postRunErrorAudit.summary);
  }
}

async function runScenarioName(name) {
  const { fixture, fixturePath } = await readFixture(name);
  const resolved = await resolveCdpEndpoint({
    port: portArg,
    waitMs: Number.parseInt(process.env.SMOKE_WAIT_MS || "9000", 10),
  });

  const extensionTarget = await resolveCaptionArcExtensionTarget({
    baseUrl: resolved.baseUrl,
    allowNameFallback: true,
  });

  if (!extensionTarget?.runtimeId) {
    throw new Error("Could not resolve the CaptionArc extension runtime for assistant DLS.");
  }

  await runWithTemporaryDiagnosticsConfig({
    baseUrl: resolved.baseUrl,
    expectedRuntimeId: extensionTarget.runtimeId,
    minLevel: diagnosticsMinLevel,
    clearExisting: true,
    operation: async () =>
      await runSingleScenario({
        baseUrl: resolved.baseUrl,
        targets: resolved.targets,
        extensionTarget,
        fixture,
        fixturePath,
      }),
  });
}

try {
  if (scenarioArg === "matrix") {
    for (const scenarioName of ASSISTANT_DLS_DEFAULT_MATRIX) {
      console.log(`\n=== ${scenarioName} ===`);
      await runScenarioName(scenarioName);
    }
  } else {
    await runScenarioName(scenarioArg);
  }
} catch (error) {
  console.error(
    `Assistant DLS failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
