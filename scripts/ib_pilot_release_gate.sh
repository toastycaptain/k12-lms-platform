#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run() {
  echo
  echo ">>> $*"
  "$@"
}

run "${ROOT_DIR}/scripts/ib_repo_integrity.sh"
run "${ROOT_DIR}/scripts/ib_archive_verify.sh"
run bash -lc "cd '${ROOT_DIR}/apps/web' && npm run lint && npm run typecheck && npm test && npm run build"
run bash -lc "cd '${ROOT_DIR}/apps/core' && bundle exec rails zeitwerk:check"
run bash -lc "cd '${ROOT_DIR}/apps/core' && bundle exec rails db:migrate"
run bash -lc "cd '${ROOT_DIR}/apps/core' && bundle exec rspec spec/services/ib spec/requests/api/v1/ib_phase5_api_spec.rb spec/requests/api/v1/ib_phase6_api_spec.rb"
run bash -lc "cd '${ROOT_DIR}/apps/ai-gateway' && pytest"
run bash -lc "cd '${ROOT_DIR}/apps/web' && npm run e2e -- --grep @ib-smoke"
