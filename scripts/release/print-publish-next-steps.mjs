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
console.log(`2. Push the annotated tag v${version} to trigger the GitHub release workflow`);
console.log(
  "3. Publish the Chrome package to Chrome Web Store and any Chromium-compatible stores you support, such as Edge Add-ons"
);
console.log(
  "4. Publish the Firefox package to AMO after Firefox verification evidence is recorded"
);
