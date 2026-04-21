import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")
) as {
  version?: string;
};
const packageVersion = String(packageJson.version || "0.0.0").trim() || "0.0.0";

const resolveBuildMode = (): "development" | "production" => {
  const modeFromEnv = process.env.WXT_BUILD_MODE?.trim().toLowerCase();
  if (modeFromEnv === "development" || modeFromEnv === "production") {
    return modeFromEnv;
  }

  const modeFlagIndex = process.argv.findIndex((entry) => entry === "--mode");
  const modeFromArg = process.argv[modeFlagIndex + 1]?.trim().toLowerCase();
  if (modeFromArg === "development" || modeFromArg === "production") {
    return modeFromArg;
  }

  const commandArgs = process.argv.slice(2).map((entry) => entry.trim().toLowerCase());
  if (commandArgs.includes("build") || commandArgs.includes("zip")) {
    return "production";
  }

  return "development";
};

const buildMode = resolveBuildMode();

const getConfigEnvFiles = (mode: "development" | "production") =>
  Array.from(
    new Set([
      `.secrets/.env.${mode}.local`,
      ".secrets/.env.local",
      `.secrets/.env.${mode}`,
      ".secrets/.env",
    ])
  );

const readConfigEnv = (name: string) => {
  const existingValue = process.env[name]?.trim();
  if (existingValue) {
    return existingValue;
  }

  for (const fileName of getConfigEnvFiles(buildMode)) {
    const filePath = path.resolve(process.cwd(), fileName);
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

  return undefined;
};

const readFirstConfigEnv = (...names: string[]): string | undefined => {
  for (const name of names) {
    const value = readConfigEnv(name);
    if (value) {
      return value;
    }
  }

  return undefined;
};

const resolveBrowserTarget = (): "chrome" | "firefox" => {
  const browserFlagIndexes = process.argv.flatMap((entry, index) =>
    entry === "--browser" || entry === "-b" ? [index] : []
  );

  for (const index of browserFlagIndexes) {
    const browserFromArg = process.argv[index + 1]?.trim().toLowerCase();
    if (browserFromArg === "chrome" || browserFromArg === "firefox") {
      return browserFromArg;
    }
  }

  return "chrome";
};
const browserTarget = resolveBrowserTarget();
const defaultFirefoxExtensionId =
  buildMode === "development"
    ? "development@captionarc.invalid"
    : "production@captionarc.invalid";
const resolveBrowserScopedConfig = (options: {
  chrome?: string;
  firefox?: string;
  fallback?: string;
}) =>
  browserTarget === "firefox"
    ? options.firefox || options.fallback
    : options.chrome || options.fallback;
const googleOauthClientId = resolveBrowserScopedConfig({
  chrome: readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME"),
  firefox: readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX"),
  fallback: readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_ID"),
});
const googleOauthClientIdChrome =
  readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME") || "";
const googleOauthClientIdFirefox =
  readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX") || "";
const googleOauthClientSecretShared =
  readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_SECRET") || "";
const googleOauthClientSecretChrome =
  readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME") || "";
const googleOauthClientSecretFirefox =
  readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX") || "";
const microsoftOauthClientIdShared =
  readConfigEnv("WXT_MICROSOFT_OAUTH_CLIENT_ID") || "";
const microsoftOauthClientIdChrome =
  readConfigEnv("WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME") || "";
const microsoftOauthClientIdFirefox =
  readConfigEnv("WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX") || "";
const microsoftOauthTenant =
  readConfigEnv("WXT_MICROSOFT_OAUTH_TENANT") || "";
const cloudSyncRuntimeEnvDefine = {
  "import.meta.env.WXT_GOOGLE_OAUTH_CLIENT_ID": JSON.stringify(
    readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_ID") || ""
  ),
  "import.meta.env.WXT_GOOGLE_OAUTH_CLIENT_ID_CHROME": JSON.stringify(
    googleOauthClientIdChrome
  ),
  "import.meta.env.WXT_GOOGLE_OAUTH_CLIENT_ID_FIREFOX": JSON.stringify(
    googleOauthClientIdFirefox
  ),
  "import.meta.env.WXT_GOOGLE_OAUTH_CLIENT_SECRET": JSON.stringify(
    googleOauthClientSecretShared
  ),
  "import.meta.env.WXT_GOOGLE_OAUTH_CLIENT_SECRET_CHROME": JSON.stringify(
    googleOauthClientSecretChrome
  ),
  "import.meta.env.WXT_GOOGLE_OAUTH_CLIENT_SECRET_FIREFOX": JSON.stringify(
    googleOauthClientSecretFirefox
  ),
  "import.meta.env.WXT_MICROSOFT_OAUTH_CLIENT_ID": JSON.stringify(
    microsoftOauthClientIdShared
  ),
  "import.meta.env.WXT_MICROSOFT_OAUTH_CLIENT_ID_CHROME": JSON.stringify(
    microsoftOauthClientIdChrome
  ),
  "import.meta.env.WXT_MICROSOFT_OAUTH_CLIENT_ID_FIREFOX": JSON.stringify(
    microsoftOauthClientIdFirefox
  ),
  "import.meta.env.WXT_MICROSOFT_OAUTH_TENANT": JSON.stringify(
    microsoftOauthTenant
  ),
};
const chromeExtensionManifestKey =
  (buildMode === "development"
    ? readConfigEnv("WXT_CHROME_EXTENSION_KEY_DEVELOPMENT")
    : readConfigEnv("WXT_CHROME_EXTENSION_KEY_PRODUCTION")) ||
  readConfigEnv("WXT_CHROME_EXTENSION_KEY");
const firefoxExtensionId = resolveBrowserScopedConfig({
  chrome: undefined,
  firefox:
    (buildMode === "development"
      ? readConfigEnv("WXT_FIREFOX_EXTENSION_ID_DEVELOPMENT")
      : readConfigEnv("WXT_FIREFOX_EXTENSION_ID_PRODUCTION")) ||
    readConfigEnv("WXT_FIREFOX_EXTENSION_ID") ||
    defaultFirefoxExtensionId,
});
const meetingHostPermissions = [
  "https://meet.google.com/*",
  "https://teams.microsoft.com/l/meetup-join/*",
  "https://teams.microsoft.com/meet/*",
  "https://teams.microsoft.com/v2/*",
  "https://*.teams.microsoft.com/l/meetup-join/*",
  "https://*.teams.microsoft.com/meet/*",
  "https://*.teams.microsoft.com/v2/*",
  "https://teams.live.com/meet/*",
  "https://teams.live.com/v2/*",
  "https://*.teams.live.com/meet/*",
  "https://*.teams.live.com/v2/*",
  "https://*.zoom.us/wc/*",
  "https://*.zoom.us/j/*",
  "https://*.zoom.us/w/*",
] as const;

const meetingWebAccessibleMatches = [
  "https://meet.google.com/*",
  "https://teams.microsoft.com/*",
  "https://*.teams.microsoft.com/*",
  "https://teams.live.com/*",
  "https://*.teams.live.com/*",
  "https://*.zoom.us/*",
] as const;

export default defineConfig({
  outDir: `.release/v${packageVersion}`,
  outDirTemplate: `${buildMode}/${browserTarget}`,
  zip: {
    artifactTemplate: `{{name}}-{{version}}-${browserTarget}.zip`,
    sourcesTemplate: `{{name}}-{{version}}-${browserTarget}-sources.zip`,
  },
  vite: () => ({
    plugins: [react(), tailwindcss()],
    define: cloudSyncRuntimeEnvDefine,
    build: {
      chunkSizeWarningLimit: 600,
    },
  }),
  manifest: {
    name: "Caption Arc",
    description: "Capture and translate browser meeting captions in real-time",
    version: packageVersion,
    ...(browserTarget === "chrome" && chromeExtensionManifestKey
      ? {
          key: chromeExtensionManifestKey,
        }
      : {}),
    ...(browserTarget === "firefox" && firefoxExtensionId
      ? {
          browser_specific_settings: {
            gecko: {
              id: firefoxExtensionId,
            },
          },
        }
      : {}),
    permissions: ["storage", "identity", "alarms", "notifications"],
    host_permissions: [
      ...meetingHostPermissions,
      "https://api.openai.com/*",
      "https://www.googleapis.com/*",
      "https://oauth2.googleapis.com/*",
      "https://graph.microsoft.com/*",
      "https://login.microsoftonline.com/*",
    ],
    ...(browserTarget === "chrome" && googleOauthClientId
      ? {
          oauth2: {
            client_id: googleOauthClientId,
            scopes: [
              "https://www.googleapis.com/auth/drive.appdata",
              "https://www.googleapis.com/auth/userinfo.email",
            ],
          },
        }
      : {}),
    icons: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
    action: {
      default_title: "Caption Arc",
      default_icon: {
        16: "icon-16.png",
        32: "icon-32.png",
        48: "icon-48.png",
      },
    },
    web_accessible_resources: [
      {
        resources: [
          "logo-mark.svg",
          "logo-mark-light.svg",
          "logo-mark-dark.svg",
        ],
        matches: [...meetingWebAccessibleMatches],
      },
    ],
  },
});
