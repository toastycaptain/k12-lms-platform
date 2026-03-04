#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE_OUT="${1:-${ROOT_DIR}/sbom-core.json}"
AI_OUT="${2:-${ROOT_DIR}/sbom-ai-gateway.json}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

ruby "${ROOT_DIR}/apps/core/script/generate_dependency_inventory.rb" \
  "${ROOT_DIR}/apps/core/Gemfile.lock" \
  "${CORE_OUT}"

if command -v cyclonedx-py >/dev/null 2>&1; then
  (
    cd "${ROOT_DIR}/apps/ai-gateway"
    cyclonedx-py environment -o "${AI_OUT}"
  )
else
  (
    cd "${ROOT_DIR}/apps/ai-gateway"
    "${PYTHON_BIN}" -m pip list --format=json > "${AI_OUT}"
  )
fi

echo "Generated SBOM artifacts:"
echo "  - ${CORE_OUT}"
echo "  - ${AI_OUT}"
