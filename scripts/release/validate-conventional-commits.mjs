#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { parseConventionalCommit } from "./versioning.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

function readArg(name) {
  const index = process.argv.findIndex((entry) => entry === name);
  return index === -1 ? "" : process.argv[index + 1]?.trim() || "";
}

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

const baseSha = readArg("--base");
const headSha = readArg("--head") || "HEAD";
const range = baseSha ? `${baseSha}..${headSha}` : headSha;
const rawLog = git(["log", "--format=%H%x00%s%x00%b%x00", range]);

if (!rawLog) {
  console.log("No commits to validate.");
  process.exit(0);
}

const fields = rawLog.split("\u0000");
const failures = [];

for (let index = 0; index + 2 < fields.length; index += 3) {
  const sha = fields[index]?.trim();
  const subject = fields[index + 1]?.trim();
  const body = fields[index + 2] || "";
  if (!sha || !subject || subject.startsWith("Merge ")) {
    continue;
  }

  if (!parseConventionalCommit(subject, body)) {
    failures.push(`${sha.slice(0, 7)} ${subject}`);
  }
}

if (failures.length > 0) {
  console.error("Conventional commit validation failed.");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Conventional commit validation passed.");
