import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, test } from "vitest";

const REPO_ROOT = process.cwd();

function createTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function runBash(command: string, env: NodeJS.ProcessEnv = {}) {
  return spawnSync("bash", ["-lc", command], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      ...env,
    },
    encoding: "utf8",
  });
}

function installMockWindowsLaunchTools(mockBinDir: string, argsFile: string) {
  writeFileSync(
    join(mockBinDir, "powershell.exe"),
    `#!/usr/bin/env bash\nprintf '%s\\n' "$@" > "${argsFile}"\n`
  );
  writeFileSync(
    join(mockBinDir, "wslpath"),
    '#!/usr/bin/env bash\nif [[ "$1" == "-w" ]]; then\n  printf "C:\\\\mock\\\\%s\\n" "$(basename "$2")"\n  exit 0\nfi\nprintf "%s\\n" "${@: -1}"\n'
  );
  runBash(
    `chmod +x "${join(mockBinDir, "powershell.exe")}" "${join(mockBinDir, "wslpath")}"`
  );
}

describe("Manual smoke launch configuration", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("SMK-LAUNCH-001: load-secrets-env preserves quoted paths with spaces and maps OPENAI_API_KEY", () => {
    const tempDir = createTempDir("captionarc-secrets-");
    tempDirs.push(tempDir);
    const secretsFile = join(tempDir, "smoke.env");
    writeFileSync(
      secretsFile,
      [
        'OPENAI_API_KEY="sample-openai-key"',
        'CHROME_EXECUTABLE="/tmp/Chrome With Spaces/chrome.exe"',
        "CHROME_RUNTIME_MODE=system-only",
      ].join("\n")
    );

    const result = runBash(
      [
        'source "scripts/manual-smoke/load-secrets-env.sh" >/dev/null',
        'printf "%s\\n%s\\n%s\\n" "$SMOKE_OPENAI_API_KEY" "$CHROME_EXECUTABLE" "$CHROME_RUNTIME_MODE"',
      ].join(" && "),
      {
        SMOKE_SECRETS_FILE: secretsFile,
      }
    );

    expect(result.status).toBe(0);
    expect(result.stdout.trim().split("\n")).toEqual([
      "sample-openai-key",
      "/tmp/Chrome With Spaces/chrome.exe",
      "system-only",
    ]);
  });

  test("SMK-LAUNCH-002: load-secrets-env keeps an explicit SMOKE_OPENAI_API_KEY override", () => {
    const tempDir = createTempDir("captionarc-secrets-");
    tempDirs.push(tempDir);
    const secretsFile = join(tempDir, "smoke.env");
    writeFileSync(secretsFile, 'OPENAI_API_KEY="sample-openai-key"\n');

    const result = runBash(
      [
        'source "scripts/manual-smoke/load-secrets-env.sh" >/dev/null',
        'printf "%s\\n" "$SMOKE_OPENAI_API_KEY"',
      ].join(" && "),
      {
        SMOKE_SECRETS_FILE: secretsFile,
        SMOKE_OPENAI_API_KEY: "keep-existing-key",
      }
    );

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("keep-existing-key");
  });

  test("SMK-LAUNCH-003: start-windows-chrome-debug keeps the deterministic system runtime even when non-deterministic mode is requested", () => {
    const tempDir = createTempDir("captionarc-launch-");
    tempDirs.push(tempDir);
    const mockBinDir = join(tempDir, "bin");
    const extensionDir = join(tempDir, "extension");
    const secretsFile = join(tempDir, "smoke.env");
    const argsFile = join(tempDir, "powershell-args.txt");
    mkdirSync(mockBinDir);
    mkdirSync(extensionDir);
    writeFileSync(join(extensionDir, "manifest.json"), "{}");
    writeFileSync(
      secretsFile,
      [
        "CHROME_RUNTIME_MODE=system-only",
        'CHROME_EXECUTABLE="C:\\\\Custom Chrome\\\\chrome.exe"',
        "AUTO_PROVISION_CFT=0",
      ].join("\n")
    );
    installMockWindowsLaunchTools(mockBinDir, argsFile);

    const result = spawnSync("bash", ["scripts/start-windows-chrome-debug.sh"], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PATH: `${mockBinDir}:${process.env.PATH || ""}`,
        EXTENSION_DIR: extensionDir,
        SMOKE_SECRETS_FILE: secretsFile,
        DETERMINISTIC_TEST_MODE: "0",
      },
      encoding: "utf8",
    });

    const args = readFileSync(argsFile, "utf8").split("\n");
    const executableFlagIndex = args.indexOf("-ChromeExecutablePath");

    expect(result.status).toBe(0);
    expect(args).toContain("-ChromeRuntimeMode");
    expect(args).toContain("system-only");
    expect(args).toContain("-ExtensionLoadMode");
    expect(args).toContain("auto");
    expect(executableFlagIndex).toBeGreaterThanOrEqual(0);
    expect(args[executableFlagIndex + 1]).toBe("");
  });

  test("SMK-LAUNCH-004: start-windows-chrome-debug ignores local runtime overrides and keeps the deterministic system runtime", () => {
    const tempDir = createTempDir("captionarc-launch-");
    tempDirs.push(tempDir);
    const mockBinDir = join(tempDir, "bin");
    const extensionDir = join(tempDir, "extension");
    const secretsFile = join(tempDir, "smoke.env");
    const argsFile = join(tempDir, "powershell-args.txt");
    mkdirSync(mockBinDir);
    mkdirSync(extensionDir);
    writeFileSync(join(extensionDir, "manifest.json"), "{}");
    writeFileSync(
      secretsFile,
      [
        "CHROME_RUNTIME_MODE=system-only",
        'CHROME_EXECUTABLE="C:\\\\Custom Chrome\\\\chrome.exe"',
        "AUTO_PROVISION_CFT=0",
      ].join("\n")
    );
    installMockWindowsLaunchTools(mockBinDir, argsFile);

    const result = spawnSync("bash", ["scripts/start-windows-chrome-debug.sh"], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PATH: `${mockBinDir}:${process.env.PATH || ""}`,
        EXTENSION_DIR: extensionDir,
        SMOKE_SECRETS_FILE: secretsFile,
        DETERMINISTIC_TEST_MODE: "1",
      },
      encoding: "utf8",
    });

    const args = readFileSync(argsFile, "utf8").split("\n");
    const executableFlagIndex = args.indexOf("-ChromeExecutablePath");

    expect(result.status).toBe(0);
    expect(args).toContain("-ChromeRuntimeMode");
    expect(args).toContain("system-only");
    expect(args).toContain("-ExtensionLoadMode");
    expect(args).toContain("auto");
    expect(executableFlagIndex).toBeGreaterThanOrEqual(0);
    expect(args[executableFlagIndex + 1]).toBe("");
  });

  test("SMK-LAUNCH-005: assistant harness uses trusted CDP click flow for join automation instead of synthetic-only DOM clicks", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "scripts/manual-smoke/lib/google-meet-assistant-harness.mjs"
      ),
      "utf8"
    );

    expect(source).toContain('from "./cdp-runtime.mjs"');
    expect(source).toContain("dispatchMouseClickInTarget");
    expect(source).toContain("await dispatchMouseClickInTarget({");
    expect(source).not.toContain('node.dispatchEvent(new PointerEvent("pointerdown"');
    expect(source).not.toContain('node.dispatchEvent(new MouseEvent("click"');
  });

  test("SMK-LAUNCH-006: assistant harness resolves a joinable Google Meet session from the stable meeting flow instead of the lobby-only helper", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "scripts/manual-smoke/lib/google-meet-assistant-harness.mjs"
      ),
      "utf8"
    );

    expect(source).toContain('import { resolveGoogleMeetUrl } from "./meet-url.mjs"');
    expect(source).toContain("const resolved = await resolveGoogleMeetUrl({");
    expect(source).not.toContain("resolveGoogleMeetLobbyUrl");
  });

  test("SMK-LAUNCH-007: assistant harness reuses the landing-created meeting target before opening a duplicate tab", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "scripts/manual-smoke/lib/google-meet-assistant-harness.mjs"
      ),
      "utf8"
    );

    expect(source).toContain("function findPageTargetByUrl(");
    expect(source).toContain("findPageTargetByUrl(targets, resolved.url)");
    expect(source).toContain("findPageTargetByUrl(await listTargets(baseUrl), resolved.url)");
    expect(source).toContain(
      "const target = existingTarget || (await createTarget(baseUrl, resolved.url));"
    );
  });
});
