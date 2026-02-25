#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-production}"
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

echo "Starting deploy for ${ENVIRONMENT}..."
notify ":rocket: Deploy started for ${ENVIRONMENT}"

if [[ "${BYPASS_DEPLOY_WINDOW:-false}" != "true" ]]; then
  allowed="$(cd "${CORE_DIR}" && bundle exec rails runner 'puts DeployWindowService.allowed_now?')"
  if [[ "${allowed}" != "true" ]]; then
    echo "Deployment blocked: school hours window is active."
    notify ":warning: Deploy blocked for ${ENVIRONMENT} - outside deploy window"
    exit 1
  fi
fi

echo "Running core checks..."
cd "${CORE_DIR}"
bundle exec rspec --dry-run >/dev/null
bundle exec rubocop --parallel >/dev/null

echo "Running database migrations..."
bundle exec rails db:migrate

echo "Running post-migration health check..."
bundle exec rails runner 'exit(SystemHealthService.check_all[:overall] == "critical" ? 1 : 0)'

notify ":white_check_mark: Deploy completed for ${ENVIRONMENT}"
echo "Deploy complete."
