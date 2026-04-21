#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

resolve_secrets_file() {
  local explicit="${SMOKE_SECRETS_FILE:-}"
  if [[ -n "$explicit" && -f "$explicit" ]]; then
    printf "%s\n" "$explicit"
    return 0
  fi

  local candidates=(
    "$REPO_ROOT/.secrets/smoke.env"
    "$REPO_ROOT/.secrets/.env"
    "$REPO_ROOT/.secrets/.env.local"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      printf "%s\n" "$candidate"
      return 0
    fi
  done

  return 1
}

resolve_smoke_env_mode() {
  local mode="${SMOKE_ENV_MODE:-${WXT_BUILD_MODE:-development}}"
  mode="${mode,,}"
  if [[ "$mode" != "development" && "$mode" != "production" ]]; then
    mode="development"
  fi

  printf "%s\n" "$mode"
}

resolve_layered_secrets_files() {
  local mode
  mode="$(resolve_smoke_env_mode)"
  local files=()

  local candidates=(
    "$REPO_ROOT/.secrets/.env"
    "$REPO_ROOT/.secrets/.env.local"
    "$REPO_ROOT/.secrets/.env.$mode"
    "$REPO_ROOT/.secrets/.env.$mode.local"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      files+=("$candidate")
    fi
  done

  local explicit="${SMOKE_SECRETS_FILE:-}"
  if [[ -n "$explicit" && -f "$explicit" ]]; then
    files+=("$explicit")
  else
    local smoke_file
    if smoke_file="$(resolve_secrets_file)"; then
      files+=("$smoke_file")
    fi
  fi

  printf "%s\n" "${files[@]}"
}

load_secrets_env() {
  mapfile -t files < <(resolve_layered_secrets_files)
  if [[ "${#files[@]}" -eq 0 ]]; then
    return 0
  fi

  set -a
  local file
  for file in "${files[@]}"; do
    # shellcheck disable=SC1090
    source "$file"
  done
  set +a

  if [[ -n "${OPENAI_API_KEY:-}" && -z "${SMOKE_OPENAI_API_KEY:-}" ]]; then
    export SMOKE_OPENAI_API_KEY="$OPENAI_API_KEY"
  fi

  export captionarc_secrets_file="${files[$((${#files[@]} - 1))]}"
  export captionarc_secrets_files="${files[*]}"
  export captionarc_secrets_loaded=1
  printf 'Secrets loaded from: %s\n' "${files[*]}"
}

load_secrets_env
