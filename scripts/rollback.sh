#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE_DIR="${ROOT_DIR}/apps/core"

notify() {
  local message="$1"
  if [[ -n "${SLACK_ALERT_WEBHOOK_URL:-}" ]]; then
    curl -sS -X POST "${SLACK_ALERT_WEBHOOK_URL}" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"${message}\"}" >/dev/null || true
  fi
}

echo "Starting rollback..."
notify ":warning: Rollback started"

cd "${CORE_DIR}"
bundle exec rails db:rollback STEP="${ROLLBACK_STEP:-1}"
bundle exec rails runner 'exit(SystemHealthService.check_all[:overall] == "critical" ? 1 : 0)'

notify ":white_check_mark: Rollback completed"
echo "Rollback complete."
