#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { extractReleaseNotes } from "./versioning.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const defaultOutputPath = path.join(repoRoot, ".release-notes.md");
const explicitVersion = process.argv[2]?.trim() || "";
const outputPath = process.argv[3]?.trim() || defaultOutputPath;

const changelog = readFileSync(changelogPath, "utf8");
const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
);
const version = explicitVersion || String(packageJson.version || "").trim();

if (!version) {
  throw new Error("Could not resolve the release version for release notes.");
}

writeFileSync(outputPath, `${extractReleaseNotes(changelog, version)}\n`);
console.log(outputPath);
