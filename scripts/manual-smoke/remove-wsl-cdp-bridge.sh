#!/usr/bin/env bash

set -euo pipefail

BRIDGE_PORT="${1:-9223}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS_SCRIPT="$SCRIPT_DIR/../windows/remove-wsl-cdp-bridge.ps1"
PS_SCRIPT_WIN="$(wslpath -w "$PS_SCRIPT")"

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "powershell.exe not found. This script must run from WSL on Windows."
  exit 1
fi

echo "This action requires Administrator privileges in Windows PowerShell."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS_SCRIPT_WIN" -BridgePort "$BRIDGE_PORT"

