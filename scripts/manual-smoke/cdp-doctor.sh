#!/usr/bin/env bash

set -euo pipefail

PORT="${1:-9222}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

WSL_OK=0
WINDOWS_OK=0

echo "== CDP Doctor =="
echo "Port: $PORT"

echo
echo "[1/2] WSL direct connectivity check"
if node "$SCRIPT_DIR/check-cdp.mjs" "$PORT"; then
  WSL_OK=1
else
  echo "WSL direct check failed."
fi

echo
echo "[2/2] Windows local connectivity check"
if bash "$SCRIPT_DIR/check-cdp-windows.sh" "$PORT"; then
  WINDOWS_OK=1
else
  echo "Windows connectivity check failed."
fi

echo
if [[ "$WSL_OK" -eq 1 ]]; then
  echo "Result: WSL direct mode is available."
  exit 0
fi

if [[ "$WINDOWS_OK" -eq 1 ]]; then
  echo "Result: Windows-only CDP mode is available (WSL direct unavailable)."
  echo "Use Windows-side browser checks and manual matrix execution."
  echo
  echo "To enable WSL direct mode, run (requires Windows Administrator):"
  echo "  pnpm chrome:debug:bridge:setup"
  echo "Then rerun:"
  echo "  pnpm chrome:debug:doctor"
  exit 0
fi

AUTO_START_DEBUG="${AUTO_START_DEBUG:-1}"
if [[ "$AUTO_START_DEBUG" == "1" ]]; then
  echo "Attempting automatic Chrome debug startup..."
  bash "$SCRIPT_DIR/ensure-cdp-ready.sh" "$PORT" "about:blank" || true

  echo
  echo "Rechecking CDP connectivity after auto-start..."
  if node "$SCRIPT_DIR/check-cdp.mjs" "$PORT"; then
    echo "Result: WSL direct mode is available after auto-start."
    exit 0
  fi

  if bash "$SCRIPT_DIR/check-cdp-windows.sh" "$PORT"; then
    echo "Result: Windows-only CDP mode is available after auto-start."
    exit 0
  fi
fi

echo "Result: CDP is unavailable in both WSL and Windows checks."
exit 1
