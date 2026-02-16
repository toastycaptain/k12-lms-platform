#!/usr/bin/env bash
set -euo pipefail

CORE_URL="${1:?Usage: smoke-test.sh <CORE_URL> <WEB_URL>}"
WEB_URL="${2:?Usage: smoke-test.sh <CORE_URL> <WEB_URL>}"

PASS=0
FAIL=0

check() {
  local description="$1"
  local url="$2"
  local expected_status="$3"
  local body_check="${4:-}"

  echo -n "  [TEST] ${description} ... "

  response=$(curl -s -o /tmp/smoke_body -w "%{http_code}" --max-time 15 "${url}" 2>/dev/null) || {
    echo "FAIL (curl error)"
    FAIL=$((FAIL + 1))
    return
  }

  if [[ "$response" != "$expected_status" ]]; then
    echo "FAIL (expected ${expected_status}, got ${response})"
    FAIL=$((FAIL + 1))
    return
  fi

  if [[ -n "$body_check" ]]; then
    if ! grep -q "$body_check" /tmp/smoke_body; then
      echo "FAIL (body missing: ${body_check})"
      FAIL=$((FAIL + 1))
      return
    fi
  fi

  echo "PASS"
  PASS=$((PASS + 1))
}

echo "========================================"
echo " Smoke Tests"
echo "========================================"
echo ""
echo "Core API: ${CORE_URL}"
echo "Web App:  ${WEB_URL}"
echo ""

echo "--- Core API ---"
check "Liveness: GET /up returns 200" \
  "${CORE_URL}/up" "200"

check "Readiness: GET /api/v1/health returns 200 with status ok" \
  "${CORE_URL}/api/v1/health" "200" '"status"'

echo ""
echo "--- Web Frontend ---"
check "Homepage: GET / returns 200" \
  "${WEB_URL}/" "200"

echo ""
echo "--- Auth Flow ---"
check "OAuth redirect: GET /auth/google_oauth2 returns 302" \
  "${CORE_URL}/auth/google_oauth2" "302"

echo ""
echo "========================================"
echo " Results: ${PASS} passed, ${FAIL} failed"
echo "========================================"

if [[ "$FAIL" -gt 0 ]]; then
  echo ""
  echo "::error::Smoke tests failed: ${FAIL} check(s) did not pass."
  exit 1
fi
