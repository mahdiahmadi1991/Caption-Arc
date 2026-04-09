#!/usr/bin/env bash

set -euo pipefail

PORT="${1:-9222}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

bash "$REPO_ROOT/scripts/manual-smoke/smoke-provider.sh" "google-meet" "meeting" "$PORT"
