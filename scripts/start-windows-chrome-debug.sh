#!/usr/bin/env bash

set -euo pipefail

PORT="${1:-9222}"
START_URL="${2:-about:blank}"
ADDRESS="${3:-0.0.0.0}"
CFT_DOWNLOAD_TIMEOUT_MS="${CFT_DOWNLOAD_TIMEOUT_MS:-180000}"
DETERMINISTIC_TEST_MODE="${DETERMINISTIC_TEST_MODE:-1}"
AUTO_PROVISION_CFT_BOOL="false"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXTENSION_BUILD_MODE="${EXTENSION_BUILD_MODE:-development}"
EXTENSION_VERSION="${EXTENSION_VERSION:-$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version)" "$REPO_ROOT/package.json")}"
EXTENSION_DIR="${EXTENSION_DIR:-$REPO_ROOT/.release/v$EXTENSION_VERSION/$EXTENSION_BUILD_MODE/chrome}"
PS_SCRIPT="$SCRIPT_DIR/windows/start-chrome-remote-debug.ps1"

if [[ -f "$REPO_ROOT/scripts/manual-smoke/load-secrets-env.sh" ]]; then
  # Reuse the local-only smoke env loader so smoke credentials and runtime
  # toggles can live under .secrets/ without leaking into git.
  # shellcheck disable=SC1090
  source "$REPO_ROOT/scripts/manual-smoke/load-secrets-env.sh"
fi

if [[ "$DETERMINISTIC_TEST_MODE" != "1" ]]; then
  echo "WARNING: Non-deterministic launch is disabled in this repository."
  echo "Forcing deterministic single-path launch (system-only + auto extension load)."
fi

EXTENSION_LOAD_MODE="auto"
CHROME_RUNTIME_MODE="system-only"

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "powershell.exe not found. This script must run from WSL on Windows."
  exit 1
fi

if [[ ! -d "$EXTENSION_DIR" ]]; then
  echo "Extension build was not found at: $EXTENSION_DIR"
  echo "Run 'pnpm build:target:chrome:${EXTENSION_BUILD_MODE}' first."
  exit 1
fi

EXTENSION_DIR_WIN="$(wslpath -w "$EXTENSION_DIR")"
PS_SCRIPT_WIN="$(wslpath -w "$PS_SCRIPT")"
CHROME_EXECUTABLE_WIN=""

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS_SCRIPT_WIN" \
  -ExtensionPath "$EXTENSION_DIR_WIN" \
  -RemoteDebuggingPort "$PORT" \
  -RemoteDebuggingAddress "$ADDRESS" \
  -ExtensionLoadMode "$EXTENSION_LOAD_MODE" \
  -ChromeRuntimeMode "$CHROME_RUNTIME_MODE" \
  -ChromeExecutablePath "$CHROME_EXECUTABLE_WIN" \
  -AutoProvisionChromeForTesting:$AUTO_PROVISION_CFT_BOOL \
  -ChromeForTestingDownloadTimeoutMs "$CFT_DOWNLOAD_TIMEOUT_MS" \
  -StartUrl "$START_URL"

echo "Chrome launch command sent."
echo "CDP endpoint hint: http://127.0.0.1:${PORT}/json/version"
