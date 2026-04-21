#!/usr/bin/env bash

set -euo pipefail

PORT="${1:-9222}"
START_URL="${2:-about:blank}"

AUTO_START_DEBUG="${AUTO_START_DEBUG:-1}"
AUTO_BUILD_EXTENSION="${AUTO_BUILD_EXTENSION:-1}"
AUTO_BUILD_EXTENSION_ALWAYS="${AUTO_BUILD_EXTENSION_ALWAYS:-0}"
RELOAD_EXTENSION_IF_RUNNING="${RELOAD_EXTENSION_IF_RUNNING:-0}"
RELOAD_PROVIDER_TABS="${RELOAD_PROVIDER_TABS:-0}"
RELOAD_EXTENSION_STRICT="${RELOAD_EXTENSION_STRICT:-0}"
DETERMINISTIC_TEST_MODE="${DETERMINISTIC_TEST_MODE:-1}"
DEFAULT_CHROME_RUNTIME_MODE="${CHROME_RUNTIME_MODE:-system-only}"
DEFAULT_AUTO_PROVISION_CFT="${AUTO_PROVISION_CFT:-0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXTENSION_BUILD_MODE="${EXTENSION_BUILD_MODE:-development}"
EXTENSION_VERSION="${EXTENSION_VERSION:-$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version)" "$REPO_ROOT/package.json")}"
RELOAD_SCRIPT="$SCRIPT_DIR/reload-extension-runtime.mjs"

resolve_extension_dir() {
  if [[ "$EXTENSION_BUILD_MODE" == "development" ]]; then
    printf "%s/.release/development/chrome" "$REPO_ROOT"
    return
  fi

  printf "%s/.release/production/%s/chrome" "$REPO_ROOT" "$EXTENSION_VERSION"
}

EXTENSION_DIR="${EXTENSION_DIR:-$(resolve_extension_dir)}"

active_debug_runtime_uses_command_line_extension_load() {
  local command_line
  command_line="$(
    powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { \$_.Name -eq 'chrome.exe' -and \$_.CommandLine -and \$_.CommandLine -like '*--remote-debugging-port=$PORT*' -and \$_.CommandLine -notlike '*--type=*' } | Select-Object -First 1 -ExpandProperty CommandLine" 2>/dev/null | tr -d '\r'
  )"

  [[ "$command_line" == *"--load-extension="* ]]
}

check_cdp() {
  node "$SCRIPT_DIR/check-cdp.mjs" "$PORT"
}

launch_runtime() {
  EXTENSION_LOAD_MODE="auto" \
    CHROME_RUNTIME_MODE="$DEFAULT_CHROME_RUNTIME_MODE" \
    AUTO_PROVISION_CFT="$DEFAULT_AUTO_PROVISION_CFT" \
    bash "$REPO_ROOT/scripts/start-windows-chrome-debug.sh" "$PORT" "$START_URL" "0.0.0.0"
}

if [[ "$DETERMINISTIC_TEST_MODE" == "1" ]]; then
  DEFAULT_CHROME_RUNTIME_MODE="system-only"
  DEFAULT_AUTO_PROVISION_CFT="0"
  RELOAD_EXTENSION_STRICT="1"
fi

ensure_extension_build() {
  if [[ "$AUTO_BUILD_EXTENSION_ALWAYS" == "1" ]]; then
    echo "Running Chrome ${EXTENSION_BUILD_MODE} extension build (AUTO_BUILD_EXTENSION_ALWAYS=1)..."
    (
      cd "$REPO_ROOT"
      "pnpm" "build:target:chrome:${EXTENSION_BUILD_MODE}"
    )
    return
  fi

  if [[ -d "$EXTENSION_DIR" ]]; then
    return
  fi

  if [[ "$AUTO_BUILD_EXTENSION" != "1" ]]; then
    echo "Extension build missing at: $EXTENSION_DIR"
    echo "Set AUTO_BUILD_EXTENSION=1 or run: pnpm build:target:chrome:${EXTENSION_BUILD_MODE}"
    return 1
  fi

  echo "Extension build missing. Running pnpm build:target:chrome:${EXTENSION_BUILD_MODE}..."
  (
    cd "$REPO_ROOT"
    "pnpm" "build:target:chrome:${EXTENSION_BUILD_MODE}"
  )
}

resolve_staged_extension_dir() {
  local localappdata_win
  localappdata_win="$(powershell.exe -NoProfile -Command '$env:LOCALAPPDATA' 2>/dev/null | tr -d '\r\n')"
  if [[ -z "$localappdata_win" ]]; then
    return 1
  fi

  local localappdata_wsl
  localappdata_wsl="$(wslpath -u "$localappdata_win")"
  if [[ -z "$localappdata_wsl" ]]; then
    return 1
  fi

  printf "%s/CaptionArc/extension/%s" "$localappdata_wsl" "$EXTENSION_BUILD_MODE"
}

sync_staged_extension() {
  local staged_dir="${STAGED_EXTENSION_DIR:-}"
  if [[ -z "$staged_dir" ]]; then
    staged_dir="$(resolve_staged_extension_dir)" || {
      echo "Could not resolve Windows staged extension path."
      return 1
    }
  fi

  mkdir -p "$staged_dir"

  if [[ "$staged_dir" == /mnt/* ]] && command -v powershell.exe >/dev/null 2>&1; then
    local source_win
    local staged_win
    source_win="$(wslpath -w "$EXTENSION_DIR")"
    staged_win="$(wslpath -w "$staged_dir")"
    powershell.exe -NoProfile -Command "& {
      \$source = '$source_win'
      \$dest = '$staged_win'
      if (-not (Test-Path \$dest)) {
        New-Item -ItemType Directory -Force -Path \$dest | Out-Null
      }
      \$null = & robocopy.exe \$source \$dest /MIR /NFL /NDL /NJH /NJS /NP /R:2 /W:1
      if (\$LASTEXITCODE -ge 8) {
        exit \$LASTEXITCODE
      }
    }"
  elif command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$EXTENSION_DIR/" "$staged_dir/"
  else
    cp -a "$EXTENSION_DIR/." "$staged_dir/"
  fi

  echo "Extension staged at: $staged_dir"
}

try_reload_running_extension() {
  if [[ "$RELOAD_EXTENSION_IF_RUNNING" != "1" ]]; then
    return 1
  fi

  if ! command -v powershell.exe >/dev/null 2>&1; then
    echo "Skipping extension reload: powershell.exe not found."
    return 1
  fi

  sync_staged_extension || return 1

  if RELOAD_PROVIDER_TABS="$RELOAD_PROVIDER_TABS" node "$RELOAD_SCRIPT" "$PORT"; then
    echo "Extension runtime reloaded on active debug Chrome."
    return 0
  fi

  echo "Extension runtime reload failed."
  return 1
}

echo "Ensuring CDP is reachable on port $PORT..."
ensure_extension_build

if check_cdp; then
  echo "CDP ready."
  if ! active_debug_runtime_uses_command_line_extension_load; then
    echo "Skipping staged extension reload: active debug profile uses profile-managed extension lifecycle."
    exit 0
  fi
  if try_reload_running_extension; then
    exit 0
  fi

  if [[ "$RELOAD_EXTENSION_IF_RUNNING" == "1" && "$AUTO_START_DEBUG" == "1" && "$RELOAD_EXTENSION_STRICT" == "1" ]]; then
    echo "Restarting Chrome debug runtime to apply latest extension build..."
    launch_runtime
    if check_cdp; then
      echo "CDP ready after runtime restart."
      exit 0
    fi
  elif [[ "$RELOAD_EXTENSION_IF_RUNNING" == "1" ]]; then
    echo "Continuing without runtime restart (RELOAD_EXTENSION_STRICT=0)."
  fi

  exit 0
fi

if [[ "$AUTO_START_DEBUG" != "1" ]]; then
  echo "CDP is unavailable and AUTO_START_DEBUG=0."
  exit 1
fi

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "Cannot auto-start Chrome debug: powershell.exe was not found."
  echo "Run in WSL on Windows, or start Chrome debug manually."
  exit 1
fi

echo "Auto-starting Chrome debug runtime (single-path: system-only + auto extension load)..."
launch_runtime

if check_cdp; then
  echo "CDP ready after auto-start."
  if ! active_debug_runtime_uses_command_line_extension_load; then
    echo "Skipping staged extension reload: active debug profile uses profile-managed extension lifecycle."
  fi
  exit 0
fi

echo "CDP is still unavailable after auto-start attempts."
echo "If this is WSL direct-bridge related, run once (Windows Admin):"
echo "  pnpm chrome:debug:bridge:setup"
echo "Then retry the same command."
exit 1
