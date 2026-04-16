#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
);
const packageVersion = String(packageJson.version || "0.0.0").trim() || "0.0.0";

function getConfigEnvFiles(mode = "production") {
  return Array.from(
    new Set([
      `.secrets/.env.${mode}.local`,
      ".secrets/.env.local",
      `.secrets/.env.${mode}`,
      ".secrets/.env",
    ])
  );
}

function readConfigEnv(name) {
  const existingValue = process.env[name]?.trim();
  if (existingValue) {
    return existingValue;
  }

  for (const fileName of getConfigEnvFiles("production")) {
    const filePath = path.resolve(repoRoot, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const fileContents = readFileSync(filePath, "utf8");
    const line = fileContents
      .split(/\r?\n/u)
      .find((entry) => entry.startsWith(`${name}=`));

    if (!line) {
      continue;
    }

    const parsedValue = line
      .slice(name.length + 1)
      .trim()
      .replace(/^['"]|['"]$/gu, "");

    if (parsedValue) {
      process.env[name] = parsedValue;
      return parsedValue;
    }
  }

  return "";
}

function resolveFirstValue(names) {
  for (const name of names) {
    const value = readConfigEnv(name);
    if (value) {
      return value;
    }
  }

  return "";
}

const releaseTag =
  String(process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || "")
    .trim()
    .replace(/^refs\/tags\//u, "") || "";
const normalizedReleaseVersion = releaseTag.replace(/^v/u, "");

const missingRequirements = [];

const requirements = [
  {
    label: "Chrome production extension key",
    envNames: [
      "WXT_CHROME_EXTENSION_KEY_PRODUCTION",
      "WXT_CHROME_EXTENSION_KEY",
    ],
  },
  {
    label: "Firefox production add-on id",
    envNames: ["WXT_FIREFOX_EXTENSION_ID_PRODUCTION", "WXT_FIREFOX_EXTENSION_ID"],
  },
  {
    label: "Chrome Google OAuth client id",
    envNames: ["WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME", "WXT_GOOGLE_OAUTH_CLIENT_ID"],
  },
  {
    label: "Chrome Google OAuth client secret",
    envNames: [
      "WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME",
      "WXT_GOOGLE_OAUTH_CLIENT_SECRET",
    ],
  },
  {
    label: "Firefox Google OAuth client id",
    envNames: ["WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX", "WXT_GOOGLE_OAUTH_CLIENT_ID"],
  },
  {
    label: "Firefox Google OAuth client secret",
    envNames: [
      "WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX",
      "WXT_GOOGLE_OAUTH_CLIENT_SECRET",
    ],
  },
  {
    label: "Chrome Microsoft OAuth client id",
    envNames: [
      "WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME",
      "WXT_MICROSOFT_OAUTH_CLIENT_ID",
    ],
  },
  {
    label: "Firefox Microsoft OAuth client id",
    envNames: [
      "WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX",
      "WXT_MICROSOFT_OAUTH_CLIENT_ID",
    ],
  },
];

for (const requirement of requirements) {
  if (!resolveFirstValue(requirement.envNames)) {
    missingRequirements.push(
      `${requirement.label}: expected one of ${requirement.envNames.join(", ")}`
    );
  }
}

if (releaseTag && normalizedReleaseVersion !== packageVersion) {
  missingRequirements.push(
    `Release tag ${releaseTag} does not match package.json version ${packageVersion}`
  );
}

if (missingRequirements.length > 0) {
  console.error("Release validation failed.");
  for (const requirement of missingRequirements) {
    console.error(`- ${requirement}`);
  }
  process.exit(1);
}

console.log(`Release validation passed for CaptionArc v${packageVersion}.`);
if (releaseTag) {
  console.log(`Release tag ${releaseTag} matches package.json version.`);
}
