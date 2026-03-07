#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST_FILE="${ROOT_DIR}/docs/ib/phase6/critical-manifest.txt"
TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="${TMP_DIR}/repo.tar"
EXTRACT_DIR="${TMP_DIR}/extract"
trap 'rm -rf "${TMP_DIR}"' EXIT

mkdir -p "${EXTRACT_DIR}"

git -C "${ROOT_DIR}" archive --format=tar HEAD > "${ARCHIVE_PATH}"
tar -xf "${ARCHIVE_PATH}" -C "${EXTRACT_DIR}"

failed=0
while IFS= read -r path; do
  [[ -z "${path}" ]] && continue
  if [[ ! -e "${ROOT_DIR}/${path}" ]]; then
    echo "SOURCE_MISSING ${path}"
    failed=1
    continue
  fi
  if [[ ! -e "${EXTRACT_DIR}/${path}" ]]; then
    echo "ARCHIVE_MISSING ${path}"
    failed=1
  fi
done < "${MANIFEST_FILE}"

if [[ "${failed}" -ne 0 ]]; then
  echo "Archive verification failed" >&2
  exit 1
fi

echo "Archive verification OK"
