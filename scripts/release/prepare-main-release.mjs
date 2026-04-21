#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  computeNextStableVersion,
  extractStableVersionFromTag,
  listReleasableCommits,
  updateChangelog,
} from "./versioning.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function writeOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) {
    return;
  }

  writeFileSync(outputFile, `${name}=${value}\n`, { flag: "a" });
}

function findLatestStableTag() {
  const tags = git(["tag", "--merged", "HEAD", "--list", "v*", "--sort=-v:refname"])
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const tag of tags) {
    const stableVersion = extractStableVersionFromTag(tag);
    if (stableVersion) {
      return { tag, version: stableVersion };
    }
  }

  throw new Error("Could not find a stable version tag reachable from HEAD.");
}

function collectCommitsSince(reference) {
  const raw = git([
    "log",
    "--format=%H%x00%s%x00%b%x00",
    `${reference}..HEAD`,
  ]);

  if (!raw) {
    return [];
  }

  const fields = raw.split("\u0000");
  const commits = [];
  for (let index = 0; index + 2 < fields.length; index += 3) {
    const sha = fields[index]?.trim();
    const subject = fields[index + 1]?.trim();
    const body = fields[index + 2] || "";
    if (!sha || !subject) {
      continue;
    }
    commits.push({ sha, subject, body });
  }

  return listReleasableCommits(commits);
}

const latestStable = findLatestStableTag();
const commits = collectCommitsSince(latestStable.tag);
const nextStable = computeNextStableVersion({
  latestStableVersion: latestStable.version,
  commits,
  minimumPatch: true,
});

if (!nextStable) {
  console.log("No stable release is needed.");
  writeOutput("changed", "false");
  process.exit(0);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const changelog = readFileSync(changelogPath, "utf8");
const releaseDate = new Date().toISOString().slice(0, 10);

packageJson.version = nextStable.stableVersion;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
writeFileSync(
  changelogPath,
  updateChangelog(changelog, {
    version: nextStable.stableVersion,
    releaseDate,
    commits,
  })
);

console.log(`Prepared main release version ${nextStable.stableVersion}.`);
writeOutput("changed", "true");
writeOutput("version", nextStable.stableVersion);
writeOutput("tag_name", `v${nextStable.stableVersion}`);
