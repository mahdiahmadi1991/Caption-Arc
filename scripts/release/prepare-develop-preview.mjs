#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  computeNextPreviewVersion,
  extractStableVersionFromTag,
  listReleasableCommits,
} from "./versioning.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const packageJsonPath = path.join(repoRoot, "package.json");

function git(args, options = {}) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    if (options.allowFailure) {
      return "";
    }
    throw error;
  }
}

function writeOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) {
    return;
  }

  writeFileSync(outputFile, `${name}=${value}\n`, { flag: "a" });
}

function readPackageJson() {
  return JSON.parse(readFileSync(packageJsonPath, "utf8"));
}

function writePackageJson(nextPackageJson) {
  writeFileSync(packageJsonPath, `${JSON.stringify(nextPackageJson, null, 2)}\n`);
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

function listPreviewVersions() {
  return git(["tag", "--list", "v*"])
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry.includes("-preview."))
    .map((entry) => entry.replace(/^v/u, ""));
}

const latestStable = findLatestStableTag();
const commits = collectCommitsSince(latestStable.tag);
const nextPreview = computeNextPreviewVersion({
  latestStableVersion: latestStable.version,
  commits,
  existingPreviewVersions: listPreviewVersions(),
  prereleaseLabel: "preview",
  minimumPatch: true,
});

if (!nextPreview) {
  console.log("No new develop preview version is needed.");
  writeOutput("changed", "false");
  process.exit(0);
}

const packageJson = readPackageJson();
const currentVersion = String(packageJson.version || "").trim();
const changed = currentVersion !== nextPreview.previewVersion;

if (changed) {
  packageJson.version = nextPreview.previewVersion;
  writePackageJson(packageJson);
  console.log(`Prepared develop preview version ${nextPreview.previewVersion}.`);
} else {
  console.log(`Develop already reflects preview version ${nextPreview.previewVersion}.`);
}

writeOutput("changed", changed ? "true" : "false");
writeOutput("version", nextPreview.previewVersion);
writeOutput("stable_version", nextPreview.stableVersion);
writeOutput("tag_name", `v${nextPreview.previewVersion}`);
