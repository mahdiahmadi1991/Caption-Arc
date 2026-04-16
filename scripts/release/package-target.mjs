#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
);

const rawRequestedTarget = process.argv[2]?.trim().toLowerCase();
const requestedTarget =
  rawRequestedTarget === "chromium" ? "chrome" : rawRequestedTarget;
if (requestedTarget !== "chrome" && requestedTarget !== "firefox") {
  console.error('Expected release target "chrome" or "firefox".');
  process.exit(1);
}

const browserTarget = requestedTarget;
const version = String(packageJson.version || "0.0.0").trim() || "0.0.0";
const releaseRoot = path.join(repoRoot, ".release", `v${version}`);
const packagedTargetDir = path.join(releaseRoot, "production", requestedTarget);

mkdirSync(packagedTargetDir, { recursive: true });

const pnpmExecutable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const packageResult = spawnSync(
  pnpmExecutable,
  ["exec", "wxt", "zip", "-b", browserTarget, "--mode", "production"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  }
);

if (packageResult.status !== 0) {
  process.exit(packageResult.status ?? 1);
}

if (!existsSync(releaseRoot)) {
  console.error(`Missing release output directory: ${releaseRoot}`);
  process.exit(1);
}

const packageArtifacts = readdirSync(releaseRoot)
  .filter((entry) => entry.endsWith(".zip"))
  .filter(
    (entry) =>
      entry.endsWith(`-${requestedTarget}.zip`) ||
      entry.endsWith(`-${requestedTarget}-sources.zip`)
  );

if (packageArtifacts.length === 0) {
  console.error(
    `No packaged zip artifacts found for target "${requestedTarget}" under ${releaseRoot}`
  );
  process.exit(1);
}

for (const artifact of packageArtifacts) {
  const sourcePath = path.join(releaseRoot, artifact);
  const destinationPath = path.join(packagedTargetDir, artifact);
  rmSync(destinationPath, { force: true });
  renameSync(sourcePath, destinationPath);
  console.log(
    `Moved ${path.relative(repoRoot, sourcePath)} -> ${path.relative(repoRoot, destinationPath)}`
  );
}
