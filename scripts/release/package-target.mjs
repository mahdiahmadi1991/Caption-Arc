#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { deriveReleaseArtifactBaseDir, deriveReleaseArtifactDir } from "./versioning.mjs";

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
const releaseRoot = path.join(
  repoRoot,
  deriveReleaseArtifactBaseDir({
    buildMode: "production",
    packageVersion: version,
  })
);
const packagedTargetDir = path.join(
  repoRoot,
  deriveReleaseArtifactDir({
    buildMode: "production",
    packageVersion: version,
    browserTarget: requestedTarget,
  })
);

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

const packageArtifactsAtRoot = readdirSync(releaseRoot)
  .filter((entry) => entry.endsWith(".zip"))
  .filter(
    (entry) =>
      entry.endsWith(`-${requestedTarget}.zip`) ||
      entry.endsWith(`-${requestedTarget}-sources.zip`)
  );

const packageArtifactsInTargetDir = existsSync(packagedTargetDir)
  ? readdirSync(packagedTargetDir)
      .filter((entry) => entry.endsWith(".zip"))
      .filter(
        (entry) =>
          entry.endsWith(`-${requestedTarget}.zip`) ||
          entry.endsWith(`-${requestedTarget}-sources.zip`)
      )
  : [];

if (packageArtifactsAtRoot.length === 0 && packageArtifactsInTargetDir.length === 0) {
  console.error(
    `No packaged zip artifacts found for target "${requestedTarget}" under ${releaseRoot}`
  );
  process.exit(1);
}

for (const artifact of packageArtifactsAtRoot) {
  const sourcePath = path.join(releaseRoot, artifact);
  const destinationPath = path.join(packagedTargetDir, artifact);
  rmSync(destinationPath, { force: true });
  copyFileSync(sourcePath, destinationPath);
  rmSync(sourcePath, { force: true });
  console.log(
    `Moved ${path.relative(repoRoot, sourcePath)} -> ${path.relative(repoRoot, destinationPath)}`
  );
}

for (const artifact of packageArtifactsInTargetDir) {
  console.log(
    `Packaged artifact already available at ${path.relative(
      repoRoot,
      path.join(packagedTargetDir, artifact)
    )}`
  );
}
