# Windows Chrome Extension Data Access

## Purpose

Use this guide when a Codex session needs fast access to CaptionArc data stored by a Windows Chrome runtime from WSL.

Preferred order:

1. safe runtime access through CDP and `chrome.storage.local`
2. read-only storage inspection from WSL
3. never direct-write live LevelDB files

## Default Playbook

### Build Rule For Agent Debugging

For Codex-led debugging and UI validation, prefer Chrome development builds by default.

Use:

```bash
pnpm build:target:chrome:development
```

Build and reload order is strict:

1. run the build first
2. wait for build success
3. only then reload the extension runtime

Do not start build and runtime reload in parallel. A reload against an in-flight build is treated as invalid debug workflow.

and point any manual debug launch or runtime validation flow at:

- `<repo-root>/.release/v<version>/development/chrome`

Only switch to production artifacts when the task explicitly requires production packaging behavior.

### 1. Normalize The Extension ID

If the user gives a URL such as `chrome-extension://<extension-id>/...`, extract the ID first:

```bash
export EXTENSION_ID="<extension-id>"
```

If a debug launch already happened, CaptionArc also caches the resolved ID at:

- `%LOCALAPPDATA%\\CaptionArc\\chrome-cdp-extension-id.txt`

That cache is used by the runtime helpers in:

- [extension-target.mjs](../../scripts/manual-smoke/lib/extension-target.mjs)

### 2. Try CDP First

Safe runtime access is the default path because it reads and writes through the extension runtime instead of touching Chrome storage files directly.

Useful commands:

```bash
pnpm chrome:debug:check:windows
pnpm chrome:debug:doctor
pnpm chrome:debug:diagnostics
pnpm chrome:debug:diagnostics:stream
```

If CDP is not reachable, start a debug runtime first:

```bash
pnpm chrome:debug
```

Canonical runtime assumption for this repo:

- DLS and Codex-led smoke validation must target the user-owned Windows Google Chrome runtime with remote debugging enabled
- do not switch acceptance flows to Chrome for Testing

### 3. Read Extension Settings Through The Runtime

Once CDP is reachable, use the existing helpers instead of re-implementing storage access:

- [cdp-runtime.mjs](../../scripts/manual-smoke/lib/cdp-runtime.mjs)
- [extension-target.mjs](../../scripts/manual-smoke/lib/extension-target.mjs)
- [settings-storage.mjs](../../scripts/manual-smoke/lib/settings-storage.mjs)

Read the current settings snapshot:

```bash
node --input-type=module <<'EOF'
import { resolveCdpEndpoint } from "./scripts/manual-smoke/lib/cdp-runtime.mjs";
import { ensureExtensionPageTarget } from "./scripts/manual-smoke/lib/extension-target.mjs";
import { readSettingsSnapshot } from "./scripts/manual-smoke/lib/settings-storage.mjs";

const extensionId = process.env.EXTENSION_ID;
const resolved = await resolveCdpEndpoint({ port: 9222, waitMs: 4000 });
const target = await ensureExtensionPageTarget({
  baseUrl: resolved.baseUrl,
  extensionId,
  pagePath: "options.html",
});
const snapshot = await readSettingsSnapshot(target.webSocketDebuggerUrl);
console.log(JSON.stringify(snapshot, null, 2));
EOF
```

CaptionArc settings of interest usually live under:

- `settings`
- `settingsState`
- `settingsState.shared.meetingProfiles`
- `settingsState.shared.defaultMeetingProfileId`
- `settingsState.shared.meetingProfiles[].assistant.prompt`

### 4. If CDP Is Down, Fall Back To Read-Only Storage Inspection

Default Chrome storage location on Windows:

- `%LOCALAPPDATA%\\Google\\Chrome\\User Data\\<browser-profile>\\Local Extension Settings\\<extension-id>`

From WSL this is typically:

- `/mnt/c/Users/<windows-user>/AppData/Local/Google/Chrome/User Data/<browser-profile>/Local Extension Settings/<extension-id>`

Resolve candidate directories from WSL:

```bash
find /mnt/c/Users/*/AppData/Local/Google/Chrome/'User Data' \
  -maxdepth 3 \
  -path "*/Local Extension Settings/${EXTENSION_ID}" \
  -type d
```

Inspect LevelDB logs in read-only mode:

```bash
strings -a "<local-extension-settings-path>"/* \
  | rg "settingsState|meetingProfiles|defaultMeetingProfileId|verificationSnapshot|diagnostics"
```

Use this path only for investigation. Prefer runtime helpers for any actual mutation.

### 5. Mutation Rule

Do not edit files under `Local Extension Settings` while Chrome is running.

For live changes:

1. bring up CDP
2. target `options.html`
3. patch through `chrome.storage.local` using:
   - [settings-storage.mjs](../../scripts/manual-smoke/lib/settings-storage.mjs)
   - background `saveSettings` flow in [settings.ts](../../entrypoints/background/settings.ts)

If CDP is unavailable, stop at read-only inspection and ask for a debug launch instead of force-writing storage.

## Fast Recognition Rules

When investigating a Windows Chrome runtime in this repo, assume:

- CaptionArc persists user settings to `chrome.storage.local`
- the main keys are `settings` and `settingsState`
- runtime diagnostics are available through the `chrome:debug:diagnostics*` commands
- the safest writable path is always `chrome.storage.local` through an extension target, not raw LevelDB

## Related Docs

- [wsl-windows-chrome-cdp-quickstart.md](./wsl-windows-chrome-cdp-quickstart.md)
- [debugging.md](./debugging.md)
- [../architecture/storage-and-state.md](../architecture/storage-and-state.md)
- [../api/settings-and-readiness-behavior-contract.md](../api/settings-and-readiness-behavior-contract.md)
