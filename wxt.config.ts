import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const readConfigEnv = (name: string) => {
  const existingValue = process.env[name]?.trim();
  if (existingValue) {
    return existingValue;
  }

  for (const fileName of [".env.local", ".env"]) {
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

const googleOauthClientId = readConfigEnv("WXT_GOOGLE_OAUTH_CLIENT_ID");
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
  outDir: ".release",
  outDirTemplate: "{{browser}}/{{mode}}",
  zip: {
    artifactTemplate:
      "{{browser}}/{{mode}}/{{name}}-{{version}}-{{browser}}.zip",
    sourcesTemplate:
      "{{browser}}/{{mode}}/{{name}}-{{version}}-{{browser}}-sources.zip",
  },
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
  manifest: {
    name: "CaptionArc",
    description: "Capture and translate browser meeting captions in real-time",
    version: "1.1.0",
    permissions: ["storage", "identity", "alarms"],
    host_permissions: [
      ...meetingHostPermissions,
      "https://api.openai.com/*",
      "https://www.googleapis.com/*",
      "https://oauth2.googleapis.com/*",
      "https://graph.microsoft.com/*",
      "https://login.microsoftonline.com/*",
    ],
    ...(googleOauthClientId
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
      default_title: "CaptionArc",
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
