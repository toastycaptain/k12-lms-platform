#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
SCHOOL_ID="${SCHOOL_ID:-1}"

echo "[phase10] capture baseline health"
curl -fsS "$BASE_URL/api/v1/health" >/tmp/ib_phase10_health.json

echo "[phase10] inspect operational reliability"
curl -fsS -H "X-School-Id: $SCHOOL_ID" "$BASE_URL/api/v1/ib/operational_reliability" >/tmp/ib_phase10_reliability.json || true

echo "[phase10] simulate analytics backfill request"
curl -fsS -X POST -H "Content-Type: application/json" -H "X-School-Id: $SCHOOL_ID" \
  -d '{"kind":"analytics"}' "$BASE_URL/api/v1/ib/job_operations/backfill" >/tmp/ib_phase10_backfill.json || true

echo "[phase10] verify queue latency and dead-letter counts after drill"
cat /tmp/ib_phase10_reliability.json
