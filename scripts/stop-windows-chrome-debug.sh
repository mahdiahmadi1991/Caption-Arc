#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS_SCRIPT="$SCRIPT_DIR/windows/stop-chrome-remote-debug.ps1"

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "powershell.exe not found. This script must run from WSL on Windows."
  exit 1
fi

PS_SCRIPT_WIN="$(wslpath -w "$PS_SCRIPT")"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS_SCRIPT_WIN"

