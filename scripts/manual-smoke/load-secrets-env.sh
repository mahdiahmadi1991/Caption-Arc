#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

resolve_secrets_file() {
  local explicit="${SMOKE_SECRETS_FILE:-}"
  local allow_legacy="${ALLOW_LEGACY_SECRETS_PATH:-0}"
  if [[ -n "$explicit" && -f "$explicit" ]]; then
    printf "%s\n" "$explicit"
    return 0
  fi

  local candidates=(
    "$REPO_ROOT/.secrets/smoke.env"
    "$REPO_ROOT/.secrets/.env"
    "$REPO_ROOT/.secrets/.env.local"
  )

  if [[ "$allow_legacy" == "1" ]]; then
    # Optional legacy fallback path for older local setups.
    candidates+=(
      "$REPO_ROOT/secrets/smoke.env"
      "$REPO_ROOT/secrets/.env"
      "$REPO_ROOT/secrets/.env.local"
    )
  fi

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      printf "%s\n" "$candidate"
      return 0
    fi
  done

  return 1
}

load_secrets_env() {
  local file
  if ! file="$(resolve_secrets_file)"; then
    return 0
  fi

  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a

  if [[ -n "${OPENAI_API_KEY:-}" && -z "${SMOKE_OPENAI_API_KEY:-}" ]]; then
    export SMOKE_OPENAI_API_KEY="$OPENAI_API_KEY"
  fi

  export captionarc_secrets_file="$file"
  export captionarc_secrets_loaded=1
  echo "Secrets loaded from: $file"
}

load_secrets_env
