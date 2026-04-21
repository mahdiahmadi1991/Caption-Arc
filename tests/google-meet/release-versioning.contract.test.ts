import { describe, expect, it } from "vitest";
import {
  computeNextPreviewVersion,
  computeNextStableVersion,
  deriveManifestVersion,
  deriveManifestVersionName,
  deriveReleaseArtifactBaseDir,
  deriveReleaseArtifactDir,
  extractReleaseNotes,
  parseConventionalCommit,
  updateChangelog,
} from "../../scripts/release/versioning.mjs";

describe("release versioning automation", () => {
  it("derives manifest-safe versions from stable and preview package versions", () => {
    expect(deriveManifestVersion("1.4.0")).toBe("1.4.0");
    expect(deriveManifestVersion("1.4.0-preview.7")).toBe("1.4.0.7");
    expect(deriveManifestVersionName("1.4.0-preview.7")).toBe("1.4.0-preview.7");
  });

  it("derives the canonical release artifact directories for development and production", () => {
    expect(
      deriveReleaseArtifactBaseDir({
        buildMode: "development",
        packageVersion: "1.4.0-preview.7",
      })
    ).toBe(".release/development");
    expect(
      deriveReleaseArtifactDir({
        buildMode: "development",
        packageVersion: "1.4.0-preview.7",
        browserTarget: "chrome",
      })
    ).toBe(".release/development/chrome");
    expect(
      deriveReleaseArtifactBaseDir({
        buildMode: "production",
        packageVersion: "1.4.0-preview.7",
      })
    ).toBe(".release/production/1.4.0-preview.7");
    expect(
      deriveReleaseArtifactDir({
        buildMode: "production",
        packageVersion: "1.4.0-preview.7",
        browserTarget: "firefox",
      })
    ).toBe(".release/production/1.4.0-preview.7/firefox");
  });

  it("ignores merge commits and parses conventional commits with breaking markers", () => {
    expect(parseConventionalCommit("Merge branch 'feature/foo' into develop")).toBeNull();
    expect(
      parseConventionalCommit("feat(runtime)!: switch provider lifecycle", "")
    ).toMatchObject({
      type: "feat",
      scope: "runtime",
      breaking: true,
      description: "switch provider lifecycle",
    });
  });

  it("computes the next preview version from the highest release impact since the last stable tag", () => {
    const nextPreview = computeNextPreviewVersion({
      latestStableVersion: "1.3.0",
      commits: [
        { subject: "docs(release): document new workflow" },
        { subject: "fix(runtime): restore summary click handling" },
        { subject: "feat(summary): add segment-aware auto summaries" },
      ],
      existingPreviewVersions: ["1.3.1-preview.1", "1.4.0-preview.1"],
      prereleaseLabel: "preview",
      minimumPatch: true,
    });

    expect(nextPreview).toEqual({
      previewVersion: "1.4.0-preview.2",
      stableVersion: "1.4.0",
      impact: "minor",
    });
  });

  it("bumps stable versions by at least patch for non-empty release trains", () => {
    const nextStable = computeNextStableVersion({
      latestStableVersion: "1.3.0",
      commits: [{ subject: "docs(governance): align release workflow" }],
      minimumPatch: true,
    });

    expect(nextStable).toEqual({
      stableVersion: "1.3.1",
      impact: "patch",
    });
  });

  it("treats legacy non-conventional commits as patch-level release input", () => {
    const nextStable = computeNextStableVersion({
      latestStableVersion: "1.3.0",
      commits: [{ subject: "Add contract tests for Google Meet and Zoom Web provider functionality" }],
      minimumPatch: true,
    });

    expect(nextStable).toEqual({
      stableVersion: "1.3.1",
      impact: "patch",
    });
  });

  it("updates the changelog and extracts release notes for the stable release", () => {
    const updated = updateChangelog(
      `# Changelog

All notable repository releases are recorded here.

## Unreleased

- Work in progress.

## 1.3.0 - 2026-04-09

### Added

- Initial governed bootstrap release.
`,
      {
        version: "1.4.0",
        releaseDate: "2026-04-21",
        commits: [
          { subject: "feat(summary): add stable release PR generation" },
          { subject: "fix(release): align tag publication flow" },
          { subject: "docs(ops): document release-train expectations" },
        ],
      }
    );

    expect(updated).toContain("## Unreleased\n\n- No unreleased stable changes.");
    expect(updated).toContain("## 1.4.0 - 2026-04-21");
    expect(updated).toContain("- summary: add stable release PR generation");
    expect(updated).toContain("- release: align tag publication flow");
    expect(updated).toContain("- ops: document release-train expectations");

    expect(extractReleaseNotes(updated, "1.4.0")).toContain(
      "### Added\n\n- summary: add stable release PR generation"
    );
  });
});
