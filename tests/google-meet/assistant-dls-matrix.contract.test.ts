import { describe, expect, test } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ASSISTANT_DLS_DEFAULT_MATRIX,
  ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE,
  ASSISTANT_DLS_SCENARIO_ALIASES,
} from "../../scripts/manual-smoke/lib/assistant-dls-scenarios.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(
  __dirname,
  "../../scripts/manual-smoke/fixtures/assistant-dls"
);

type AssistantFixtureStep = {
  type?: string;
  profileId?: string;
  patch?: {
    meetingOutputLanguage?: string;
  };
};

type AssistantFixtureProfilePatch = {
  profileId?: string;
  patch?: {
    assistant?: {
      enabledByDefault?: boolean;
      prompt?: string;
      responseIntent?: string;
      responseFormat?: string;
      responseDepth?: string;
      responseTone?: string;
      deliveryBias?: string;
      triggerPolicy?: string;
      participantScope?: string;
    };
  };
};

type AssistantDlsFixture = {
  id?: string;
  initialSettingsPatch?: {
    meetingOutputLanguage?: string;
  };
  initialProfilePatches?: AssistantFixtureProfilePatch[];
  steps?: AssistantFixtureStep[];
};

async function loadAssistantDlsFixtures(): Promise<
  Array<{ fileName: string; fixture: AssistantDlsFixture }>
> {
  const fixtureNames = (await readdir(FIXTURES_DIR))
    .filter((name) => name.endsWith(".json"))
    .sort();

  return await Promise.all(
    fixtureNames.map(async (name) => {
      const raw = await readFile(path.join(FIXTURES_DIR, name), "utf8");
      return {
        fileName: name,
        fixture: JSON.parse(raw) as AssistantDlsFixture,
      };
    })
  );
}

function collectAssistantCoverage(fixtures: Array<{ fixture: AssistantDlsFixture }>) {
  const coverage = {
    enabledByDefault: new Set<boolean>(),
    responseIntent: new Set<string>(),
    responseFormat: new Set<string>(),
    responseDepth: new Set<string>(),
    responseTone: new Set<string>(),
    deliveryBias: new Set<string>(),
    triggerPolicy: new Set<string>(),
    participantScope: new Set<string>(),
    touchedMeetingOutputLanguages: new Set<string>(),
    hasCustomPromptScenario: false,
    hasSessionProfileSwitchScenario: false,
  };

  for (const { fixture } of fixtures) {
    for (const profilePatch of fixture?.initialProfilePatches || []) {
      const assistantPatch = profilePatch?.patch?.assistant;
      if (!assistantPatch) {
        continue;
      }

      if (typeof assistantPatch.enabledByDefault === "boolean") {
        coverage.enabledByDefault.add(assistantPatch.enabledByDefault);
      }
      if (assistantPatch.responseIntent) {
        coverage.responseIntent.add(assistantPatch.responseIntent);
      }
      if (assistantPatch.responseFormat) {
        coverage.responseFormat.add(assistantPatch.responseFormat);
      }
      if (assistantPatch.responseDepth) {
        coverage.responseDepth.add(assistantPatch.responseDepth);
      }
      if (assistantPatch.responseTone) {
        coverage.responseTone.add(assistantPatch.responseTone);
      }
      if (assistantPatch.deliveryBias) {
        coverage.deliveryBias.add(assistantPatch.deliveryBias);
      }
      if (assistantPatch.triggerPolicy) {
        coverage.triggerPolicy.add(assistantPatch.triggerPolicy);
      }
      if (assistantPatch.participantScope) {
        coverage.participantScope.add(assistantPatch.participantScope);
      }
      if (typeof assistantPatch.prompt === "string" && assistantPatch.prompt.trim()) {
        coverage.hasCustomPromptScenario = true;
      }
    }

    if (fixture?.initialSettingsPatch?.meetingOutputLanguage) {
      coverage.touchedMeetingOutputLanguages.add(
        fixture.initialSettingsPatch.meetingOutputLanguage
      );
    }

    for (const step of fixture?.steps || []) {
      if (step?.type === "settingsPatch" && step?.patch?.meetingOutputLanguage) {
        coverage.touchedMeetingOutputLanguages.add(step.patch.meetingOutputLanguage);
      }

      if (step?.type === "switchSessionProfile" && step?.profileId) {
        coverage.hasSessionProfileSwitchScenario = true;
      }
    }
  }

  return coverage;
}

describe("Assistant DLS matrix coverage", () => {
  test("ADLS-MTX-001: every canonical matrix scenario resolves to a checked-in fixture", async () => {
    const fixtures = await loadAssistantDlsFixtures();
    const fixtureIds = new Set(fixtures.map(({ fixture }) => String(fixture?.id || "")));

    for (const scenarioName of ASSISTANT_DLS_DEFAULT_MATRIX) {
      const canonicalName = ASSISTANT_DLS_SCENARIO_ALIASES[scenarioName];
      expect(canonicalName, `missing scenario alias for ${scenarioName}`).toBeTruthy();
      expect(
        fixtureIds.has(canonicalName),
        `canonical matrix scenario '${scenarioName}' does not have fixture '${canonicalName}'`
      ).toBe(true);
    }
  });

  test("ADLS-MTX-002: assistant DLS fixtures cover every assistant option value that the live settings can change", async () => {
    const fixtures = await loadAssistantDlsFixtures();
    const coverage = collectAssistantCoverage(fixtures);

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.enabledByDefault) {
      expect(coverage.enabledByDefault.has(expectedValue)).toBe(true);
    }

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.responseIntent) {
      expect(coverage.responseIntent.has(expectedValue)).toBe(true);
    }

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.responseFormat) {
      expect(coverage.responseFormat.has(expectedValue)).toBe(true);
    }

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.responseDepth) {
      expect(coverage.responseDepth.has(expectedValue)).toBe(true);
    }

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.responseTone) {
      expect(coverage.responseTone.has(expectedValue)).toBe(true);
    }

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.deliveryBias) {
      expect(coverage.deliveryBias.has(expectedValue)).toBe(true);
    }

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.triggerPolicy) {
      expect(coverage.triggerPolicy.has(expectedValue)).toBe(true);
    }

    for (const expectedValue of ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE.participantScope) {
      expect(coverage.participantScope.has(expectedValue)).toBe(true);
    }

    expect(coverage.hasCustomPromptScenario).toBe(true);
    expect(coverage.hasSessionProfileSwitchScenario).toBe(true);
    expect(coverage.touchedMeetingOutputLanguages.has("en")).toBe(true);
    expect(coverage.touchedMeetingOutputLanguages.has("fa")).toBe(true);
  });
});
