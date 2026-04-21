#!/usr/bin/env node

const SEMVER_PATTERN =
  /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prereleaseLabel>[0-9A-Za-z-]+)\.(?<prereleaseNumber>0|[1-9]\d*))?$/u;
const CONVENTIONAL_COMMIT_PATTERN =
  /^(?<type>[a-z][a-z0-9-]*)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<description>.+)$/u;
const BREAKING_CHANGE_PATTERN = /BREAKING[\s-]CHANGE:/iu;
const STABLE_TAG_PATTERN = /^v(?<version>\d+\.\d+\.\d+)$/u;

/**
 * @typedef {{
 *   major: number;
 *   minor: number;
 *   patch: number;
 *   prereleaseLabel: string | null;
 *   prereleaseNumber: number | null;
 *   raw: string;
 * }} ParsedPackageVersion
 */

/**
 * @typedef {{
 *   sha?: string;
 *   subject: string;
 *   body?: string;
 * }} GitCommit
 */

/**
 * @typedef {"none" | "patch" | "minor" | "major"} ReleaseImpact
 */

/**
 * @typedef {{
 *   type: string;
 *   scope: string | null;
 *   description: string;
 *   breaking: boolean;
 * }} ConventionalCommit
 */

function ensureManifestSegment(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error(`Manifest ${label} must be an integer between 0 and 65535.`);
  }
}

/**
 * @param {string} version
 * @returns {ParsedPackageVersion}
 */
export function parsePackageVersion(version) {
  const normalized = String(version || "").trim();
  const match = normalized.match(SEMVER_PATTERN);
  if (!match?.groups) {
    throw new Error(`Unsupported package version: ${version}`);
  }

  const parsed = {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor),
    patch: Number(match.groups.patch),
    prereleaseLabel: match.groups.prereleaseLabel || null,
    prereleaseNumber: match.groups.prereleaseNumber
      ? Number(match.groups.prereleaseNumber)
      : null,
    raw: normalized,
  };

  ensureManifestSegment(parsed.major, "major version segment");
  ensureManifestSegment(parsed.minor, "minor version segment");
  ensureManifestSegment(parsed.patch, "patch version segment");
  if (parsed.prereleaseNumber !== null) {
    ensureManifestSegment(parsed.prereleaseNumber, "preview version segment");
  }

  return parsed;
}

/**
 * @param {ParsedPackageVersion} version
 * @returns {string}
 */
export function formatPackageVersion(version) {
  const stableVersion = `${version.major}.${version.minor}.${version.patch}`;
  if (!version.prereleaseLabel || version.prereleaseNumber === null) {
    return stableVersion;
  }

  return `${stableVersion}-${version.prereleaseLabel}.${version.prereleaseNumber}`;
}

/**
 * @param {string} version
 * @returns {boolean}
 */
export function isStablePackageVersion(version) {
  const parsed = parsePackageVersion(version);
  return !parsed.prereleaseLabel;
}

/**
 * @param {string} packageVersion
 * @returns {string}
 */
export function deriveManifestVersion(packageVersion) {
  const parsed = parsePackageVersion(packageVersion);
  const segments = [parsed.major, parsed.minor, parsed.patch];
  if (parsed.prereleaseNumber !== null) {
    segments.push(parsed.prereleaseNumber);
  }

  if (segments.every((segment) => segment === 0)) {
    throw new Error("Manifest version cannot be all zero.");
  }

  return segments.join(".");
}

/**
 * @param {string} packageVersion
 * @returns {string}
 */
export function deriveManifestVersionName(packageVersion) {
  return parsePackageVersion(packageVersion).raw;
}

/**
 * @param {string} version
 * @returns {ParsedPackageVersion}
 */
export function parseStableVersion(version) {
  const parsed = parsePackageVersion(version);
  if (parsed.prereleaseLabel) {
    throw new Error(`Expected stable version but received preview version ${version}`);
  }

  return parsed;
}

/**
 * @param {string} version
 * @returns {string | null}
 */
export function extractStableVersionFromTag(version) {
  const match = String(version || "").trim().match(STABLE_TAG_PATTERN);
  return match?.groups?.version || null;
}

/**
 * @param {string} version
 * @param {ReleaseImpact} impact
 * @returns {string}
 */
export function bumpStableVersion(version, impact) {
  const parsed = parseStableVersion(version);

  if (impact === "major") {
    return `${parsed.major + 1}.0.0`;
  }

  if (impact === "minor") {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }

  if (impact === "patch") {
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }

  return formatPackageVersion(parsed);
}

/**
 * @param {string} subject
 * @param {string} [body]
 * @returns {ConventionalCommit | null}
 */
export function parseConventionalCommit(subject, body = "") {
  const normalizedSubject = String(subject || "").trim();
  if (!normalizedSubject || normalizedSubject.startsWith("Merge ")) {
    return null;
  }

  const match = normalizedSubject.match(CONVENTIONAL_COMMIT_PATTERN);
  if (!match?.groups) {
    return null;
  }

  return {
    type: match.groups.type,
    scope: match.groups.scope || null,
    description: match.groups.description.trim(),
    breaking:
      Boolean(match.groups.breaking) || BREAKING_CHANGE_PATTERN.test(String(body || "")),
  };
}

/**
 * @param {string} subject
 * @returns {boolean}
 */
export function isMergeCommitSubject(subject) {
  return String(subject || "").trim().startsWith("Merge ");
}

/**
 * @param {ConventionalCommit | null} commit
 * @returns {boolean}
 */
export function isReleaseAutomationCommit(commit) {
  if (!commit || commit.type !== "chore" || commit.scope !== "release") {
    return false;
  }

  return (
    commit.description.startsWith("update develop preview to ") ||
    commit.description.startsWith("prepare v") ||
    commit.description.startsWith("publish v")
  );
}

/**
 * @param {ConventionalCommit | null} commit
 * @param {{ minimumPatch?: boolean }} [options]
 * @returns {ReleaseImpact}
 */
export function classifyReleaseImpact(commit, options = {}) {
  if (!commit || isReleaseAutomationCommit(commit)) {
    return "none";
  }

  if (commit.breaking) {
    return "major";
  }

  if (commit.type === "feat") {
    return "minor";
  }

  if (commit.type === "fix" || commit.type === "perf" || commit.type === "refactor") {
    return "patch";
  }

  return options.minimumPatch ? "patch" : "none";
}

/**
 * @param {ReleaseImpact} left
 * @param {ReleaseImpact} right
 * @returns {ReleaseImpact}
 */
export function combineReleaseImpacts(left, right) {
  const priority = {
    none: 0,
    patch: 1,
    minor: 2,
    major: 3,
  };

  return priority[left] >= priority[right] ? left : right;
}

/**
 * @param {GitCommit[]} commits
 * @param {{ minimumPatch?: boolean }} [options]
 * @returns {ReleaseImpact}
 */
export function determineReleaseImpact(commits, options = {}) {
  return commits.reduce((impact, commit) => {
    if (isMergeCommitSubject(commit.subject)) {
      return impact;
    }

    const conventional = parseConventionalCommit(commit.subject, commit.body || "");
    const nextImpact =
      conventional === null && (options.minimumPatch ?? false)
        ? "patch"
        : classifyReleaseImpact(conventional, options);
    return combineReleaseImpacts(impact, nextImpact);
  }, /** @type {ReleaseImpact} */ ("none"));
}

/**
 * @param {GitCommit[]} commits
 * @returns {GitCommit[]}
 */
export function listReleasableCommits(commits) {
  return commits.filter((commit) => {
    if (isMergeCommitSubject(commit.subject)) {
      return false;
    }

    const conventional = parseConventionalCommit(commit.subject, commit.body || "");
    if (!conventional) {
      return true;
    }

    return !isReleaseAutomationCommit(conventional);
  });
}

/**
 * @param {{
 *   latestStableVersion: string;
 *   commits: GitCommit[];
 *   existingPreviewVersions: string[];
 *   prereleaseLabel?: string;
 *   minimumPatch?: boolean;
 * }} options
 * @returns {{ previewVersion: string; stableVersion: string; impact: ReleaseImpact } | null}
 */
export function computeNextPreviewVersion(options) {
  const impact = determineReleaseImpact(options.commits, {
    minimumPatch: options.minimumPatch ?? true,
  });

  if (impact === "none") {
    return null;
  }

  const stableVersion = bumpStableVersion(options.latestStableVersion, impact);
  const nextPreviewNumber =
    options.existingPreviewVersions.reduce((maxValue, candidate) => {
      const parsed = parsePackageVersion(candidate);
      const candidateStableVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
      if (
        candidateStableVersion !== stableVersion ||
        parsed.prereleaseLabel !== (options.prereleaseLabel || "preview") ||
        parsed.prereleaseNumber === null
      ) {
        return maxValue;
      }

      return Math.max(maxValue, parsed.prereleaseNumber);
    }, 0) + 1;

  return {
    previewVersion: `${stableVersion}-${options.prereleaseLabel || "preview"}.${nextPreviewNumber}`,
    stableVersion,
    impact,
  };
}

/**
 * @param {{
 *   latestStableVersion: string;
 *   commits: GitCommit[];
 *   minimumPatch?: boolean;
 * }} options
 * @returns {{ stableVersion: string; impact: ReleaseImpact } | null}
 */
export function computeNextStableVersion(options) {
  const impact = determineReleaseImpact(options.commits, {
    minimumPatch: options.minimumPatch ?? true,
  });

  if (impact === "none") {
    return null;
  }

  return {
    stableVersion: bumpStableVersion(options.latestStableVersion, impact),
    impact,
  };
}

function normalizeChangelogDescription(commit) {
  if (isMergeCommitSubject(commit.subject)) {
    return null;
  }

  const conventional = parseConventionalCommit(commit.subject, commit.body || "");
  if (!conventional) {
    return String(commit.subject || "").trim() || null;
  }

  if (isReleaseAutomationCommit(conventional)) {
    return null;
  }

  const scopePrefix = conventional.scope ? `${conventional.scope}: ` : "";
  return `${scopePrefix}${conventional.description}`;
}

/**
 * @param {GitCommit[]} commits
 * @returns {{ breaking: string[]; added: string[]; fixed: string[]; changed: string[] }}
 */
export function buildChangelogGroups(commits) {
  const groups = {
    breaking: [],
    added: [],
    fixed: [],
    changed: [],
  };

  for (const commit of commits) {
    const conventional = parseConventionalCommit(commit.subject, commit.body || "");
    const description = normalizeChangelogDescription(commit);
    if (!conventional || !description) {
      continue;
    }

    if (conventional.breaking) {
      groups.breaking.push(description);
      continue;
    }

    if (conventional.type === "feat") {
      groups.added.push(description);
      continue;
    }

    if (conventional.type === "fix") {
      groups.fixed.push(description);
      continue;
    }

    groups.changed.push(description);
  }

  return groups;
}

/**
 * @param {{ version: string; releaseDate: string; commits: GitCommit[] }} options
 * @returns {string}
 */
export function buildChangelogSection(options) {
  const groups = buildChangelogGroups(options.commits);
  const lines = [`## ${options.version} - ${options.releaseDate}`, ""];

  const appendGroup = (heading, entries) => {
    if (entries.length === 0) {
      return;
    }

    lines.push(`### ${heading}`, "");
    for (const entry of entries) {
      lines.push(`- ${entry}`);
    }
    lines.push("");
  };

  appendGroup("Breaking Changes", groups.breaking);
  appendGroup("Added", groups.added);
  appendGroup("Fixed", groups.fixed);
  appendGroup("Changed", groups.changed);

  if (
    groups.breaking.length === 0 &&
    groups.added.length === 0 &&
    groups.fixed.length === 0 &&
    groups.changed.length === 0
  ) {
    lines.push("- No release-worthy changes were recorded.", "");
  }

  return lines.join("\n").trimEnd();
}

/**
 * @param {string} changelog
 * @param {{ version: string; releaseDate: string; commits: GitCommit[] }} options
 * @returns {string}
 */
export function updateChangelog(changelog, options) {
  const unreleasedHeading = "## Unreleased";
  const section = buildChangelogSection(options);
  const normalizedChangelog = String(changelog || "").trimEnd();
  const unreleasedIndex = normalizedChangelog.indexOf(unreleasedHeading);
  if (unreleasedIndex === -1) {
    throw new Error("CHANGELOG.md is missing the '## Unreleased' heading.");
  }

  const nextHeadingIndex = normalizedChangelog
    .slice(unreleasedIndex + unreleasedHeading.length)
    .search(/\n## /u);
  const trailingContent =
    nextHeadingIndex === -1
      ? ""
      : normalizedChangelog.slice(
          unreleasedIndex + unreleasedHeading.length + nextHeadingIndex + 1
        );

  const beforeUnreleased = normalizedChangelog.slice(0, unreleasedIndex);
  const rebuilt = [
    beforeUnreleased.trimEnd(),
    unreleasedHeading,
    "",
    "- No unreleased stable changes.",
    "",
    section,
    trailingContent.trimStart(),
  ]
    .filter((value, index, values) => {
      if (value.length > 0) {
        return true;
      }

      const previous = values[index - 1] || "";
      return previous.length > 0;
    })
    .join("\n");

  return `${rebuilt.trimEnd()}\n`;
}

/**
 * @param {string} changelog
 * @param {string} version
 * @returns {string}
 */
export function extractReleaseNotes(changelog, version) {
  const normalizedVersion = String(version || "").trim();
  const heading = `## ${normalizedVersion} - `;
  const normalizedChangelog = String(changelog || "");
  const startIndex = normalizedChangelog.indexOf(heading);
  if (startIndex === -1) {
    throw new Error(`Could not find release notes for version ${version}.`);
  }

  const nextHeadingIndex = normalizedChangelog
    .slice(startIndex + heading.length)
    .search(/\n## /u);
  const section =
    nextHeadingIndex === -1
      ? normalizedChangelog.slice(startIndex)
      : normalizedChangelog.slice(
          startIndex,
          startIndex + heading.length + nextHeadingIndex
        );

  return section
    .split("\n")
    .slice(1)
    .join("\n")
    .trim();
}
