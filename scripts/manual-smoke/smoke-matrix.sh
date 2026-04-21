#!/usr/bin/env bash

set -euo pipefail

PORT="${SMOKE_PORT:-9222}"
if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  PORT="$1"
  shift
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$REPO_ROOT/scripts/manual-smoke/load-secrets-env.sh"

build_cases_from_input() {
  local input="$1"
  local -n out_ref="$2"
  IFS=',' read -ra raw_items <<< "$input"
  for raw in "${raw_items[@]}"; do
    local item
    item="$(echo "$raw" | xargs)"
    [[ -z "$item" ]] && continue
    item="${item//:/ }"
    item="${item//\// }"
    local provider scenario
    provider="$(echo "$item" | awk '{print $1}')"
    scenario="$(echo "$item" | awk '{print $2}')"
    if [[ -n "$provider" && -n "$scenario" ]]; then
      out_ref+=("$provider $scenario")
    fi
  done
}

CASES=()
if [[ "$#" -gt 0 ]]; then
  for arg in "$@"; do
    build_cases_from_input "$arg" CASES
  done
elif [[ -n "${SMOKE_CASES:-}" ]]; then
  build_cases_from_input "$SMOKE_CASES" CASES
fi

if [[ "${#CASES[@]}" -eq 0 ]]; then
  CASES=(
    "google-meet lobby"
    "google-meet meeting"
    "google-meet continuation"
    "microsoft-teams lobby"
    "microsoft-teams meeting"
    "zoom-web lobby"
    "zoom-web meeting"
  )

  if [[ "${ZOOM_INCLUDE_JOURNEY_SCENARIO:-1}" == "1" ]]; then
    CASES+=("zoom-web journey")
  fi

  if [[ -n "${ZOOM_SHARED_URL:-}" || -n "${ZOOM_GUEST_URL:-}" || -n "${ZOOM_INVITE_URL:-}" ]]; then
    CASES+=("zoom-web meeting-shared")
  fi

  if [[ "${ZOOM_INCLUDE_SCHEDULED_SCENARIO:-0}" == "1" ]]; then
    CASES+=("zoom-web meeting-scheduled")
  fi
fi

TOTAL="${#CASES[@]}"
FAILED=0
INDEX=0

for CASE in "${CASES[@]}"; do
  INDEX=$((INDEX + 1))
  PROVIDER="${CASE%% *}"
  SCENARIO="${CASE##* }"

  echo
  echo "== Smoke matrix [$INDEX/$TOTAL] provider=$PROVIDER scenario=$SCENARIO =="

  if ! bash "$REPO_ROOT/scripts/manual-smoke/smoke-provider.sh" "$PROVIDER" "$SCENARIO" "$PORT"; then
    echo "Case failed: provider=$PROVIDER scenario=$SCENARIO"
    FAILED=$((FAILED + 1))
  fi
done

echo
if [[ "$FAILED" -gt 0 ]]; then
  echo "Smoke matrix result: FAIL ($FAILED/$TOTAL failed)"
  exit 1
fi

echo "Smoke matrix result: PASS ($TOTAL/$TOTAL passed)"
