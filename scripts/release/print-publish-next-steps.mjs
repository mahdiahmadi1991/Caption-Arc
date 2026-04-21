#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
);
const version = String(packageJson.version || "0.0.0");

console.log(`Release preparation completed for CaptionArc v${version}.`);
console.log("");
console.log("Next steps:");
console.log(
  `1. Review artifacts under .release/v${version}/production/chrome and .release/v${version}/production/firefox`
);
console.log("2. Confirm the stable release PR targeting main is ready to merge.");
console.log(
  "3. Merge the release PR to main so automation can create the stable tag, GitHub release, and packaged assets."
);
console.log(
  "4. After the GitHub release is published, publish the Chrome package to Chrome Web Store and any Chromium-compatible stores you support, such as Edge Add-ons."
);
console.log(
  "5. Publish the Firefox package to AMO after Firefox verification evidence is recorded."
);
