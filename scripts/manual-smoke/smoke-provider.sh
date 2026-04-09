#!/usr/bin/env bash

set -euo pipefail

PROVIDER="${1:-${SMOKE_PROVIDER:-google-meet}}"
SCENARIO="${2:-${SMOKE_SCENARIO:-meeting}}"
PORT="${3:-${SMOKE_PORT:-9222}}"
RELOAD_RUNTIME="${RELOAD_RUNTIME:-1}"
AUTO_BUILD_EXTENSION_ALWAYS="${AUTO_BUILD_EXTENSION_ALWAYS:-0}"
RELOAD_EXTENSION_IF_RUNNING="${RELOAD_EXTENSION_IF_RUNNING:-1}"
RELOAD_PROVIDER_TABS="${RELOAD_PROVIDER_TABS:-0}"
SMOKE_SINGLE_TAB="${SMOKE_SINGLE_TAB:-1}"
SMOKE_STEP_MODE="${SMOKE_STEP_MODE:-1}"
SMOKE_STEP_PAUSE_MS="${SMOKE_STEP_PAUSE_MS:-700}"
DETERMINISTIC_TEST_MODE="${DETERMINISTIC_TEST_MODE:-1}"
SMOKE_LIVE_DIAGNOSTICS="${SMOKE_LIVE_DIAGNOSTICS:-1}"
SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL="${SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL:-debug}"
SMOKE_LIVE_DIAGNOSTICS_POLL_MS="${SMOKE_LIVE_DIAGNOSTICS_POLL_MS:-450}"
SMOKE_LIVE_DIAGNOSTICS_CLEAR="${SMOKE_LIVE_DIAGNOSTICS_CLEAR:-1}"
SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA="${SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA:-1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$REPO_ROOT/scripts/manual-smoke/load-secrets-env.sh"

LIVE_DIAGNOSTICS_PID=""

start_live_diagnostics_stream() {
  if [[ "$SMOKE_LIVE_DIAGNOSTICS" != "1" ]]; then
    return
  fi

  echo "Starting live diagnostics stream..."
  SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL="$SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL" \
    SMOKE_LIVE_DIAGNOSTICS_POLL_MS="$SMOKE_LIVE_DIAGNOSTICS_POLL_MS" \
    SMOKE_LIVE_DIAGNOSTICS_CLEAR="$SMOKE_LIVE_DIAGNOSTICS_CLEAR" \
    SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA="$SMOKE_LIVE_DIAGNOSTICS_SHOW_DATA" \
    node "$REPO_ROOT/scripts/manual-smoke/stream-diagnostics-live.mjs" "$PORT" "$SMOKE_LIVE_DIAGNOSTICS_MIN_LEVEL" &
  LIVE_DIAGNOSTICS_PID="$!"
  sleep 0.25
  if ! kill -0 "$LIVE_DIAGNOSTICS_PID" >/dev/null 2>&1; then
    echo "Live diagnostics stream did not start; continuing without live diagnostics."
    LIVE_DIAGNOSTICS_PID=""
  fi
}

stop_live_diagnostics_stream() {
  if [[ -z "$LIVE_DIAGNOSTICS_PID" ]]; then
    return
  fi

  if kill -0 "$LIVE_DIAGNOSTICS_PID" >/dev/null 2>&1; then
    kill "$LIVE_DIAGNOSTICS_PID" >/dev/null 2>&1 || true
    wait "$LIVE_DIAGNOSTICS_PID" 2>/dev/null || true
  fi

  LIVE_DIAGNOSTICS_PID=""
}

cleanup() {
  stop_live_diagnostics_stream
}

trap cleanup EXIT

run_smoke_checks() {
  echo "Ensuring CDP readiness..."
  AUTO_START_DEBUG="$RELOAD_RUNTIME" \
  AUTO_BUILD_EXTENSION_ALWAYS="$AUTO_BUILD_EXTENSION_ALWAYS" \
  RELOAD_EXTENSION_IF_RUNNING="$RELOAD_EXTENSION_IF_RUNNING" \
  RELOAD_PROVIDER_TABS="$RELOAD_PROVIDER_TABS" \
  EXTENSION_LOAD_MODE="auto" \
  CHROME_RUNTIME_MODE="cft-only" \
  DETERMINISTIC_TEST_MODE="$DETERMINISTIC_TEST_MODE" \
  bash "$REPO_ROOT/scripts/manual-smoke/ensure-cdp-ready.sh" "$PORT" "about:blank"

  start_live_diagnostics_stream

  echo "Running provider smoke check..."
  SMOKE_SINGLE_TAB="$SMOKE_SINGLE_TAB" \
    SMOKE_STEP_MODE="$SMOKE_STEP_MODE" \
    SMOKE_STEP_PAUSE_MS="$SMOKE_STEP_PAUSE_MS" \
    node "$REPO_ROOT/scripts/manual-smoke/smoke-provider.mjs" "$PROVIDER" "$SCENARIO" "$PORT"
}

run_smoke_checks
