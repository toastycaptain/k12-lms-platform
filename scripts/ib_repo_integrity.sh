#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST_FILE="${ROOT_DIR}/docs/ib/phase6/critical-manifest.txt"

if [[ ! -f "${MANIFEST_FILE}" ]]; then
  echo "Missing manifest: ${MANIFEST_FILE}" >&2
  exit 1
fi

missing=0
while IFS= read -r path; do
  [[ -z "${path}" ]] && continue
  if [[ ! -e "${ROOT_DIR}/${path}" ]]; then
    echo "MISSING ${path}"
    missing=1
  fi
done < "${MANIFEST_FILE}"

junk_paths=(
  "apps/web/.next"
  "apps/web/coverage"
  "apps/core/coverage"
  "apps/core/tmp"
  "apps/core/log"
  "apps/core/storage"
)

junk_found=0
for rel in "${junk_paths[@]}"; do
  if [[ -e "${ROOT_DIR}/${rel}" ]]; then
    echo "LOCAL_ARTIFACT ${rel}"
    junk_found=1
  fi
done

untracked=$(git -C "${ROOT_DIR}" ls-files --others --exclude-standard)
if [[ -n "${untracked}" ]]; then
  echo "UNTRACKED_FILES"
  echo "${untracked}"
fi

if [[ "${missing}" -ne 0 ]]; then
  echo "Repo integrity failed: missing critical files" >&2
  exit 1
fi

if [[ "${junk_found}" -ne 0 ]]; then
  echo "Repo integrity warning: generated local artifacts exist; clean before release export" >&2
fi

echo "Repo integrity OK"
