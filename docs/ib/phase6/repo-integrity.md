# Repo Integrity and Export Reliability

## Integrity commands
- `scripts/ib_repo_integrity.sh`
- `scripts/ib_archive_verify.sh`

## What the integrity pass checks
- missing tracked files in the phase-critical IB paths from `critical-manifest.txt`
- untracked generated junk under `coverage`, `.next`, `tmp`, `log`, and `storage`
- export/archive parity for the critical manifest
- ignored cache/build artifacts that would create misleading handoff archives

## Cleanliness expectations
- no committed coverage or build output
- no route trees rebuilt from local shell history
- no export process that silently strips IB app routes, backend controllers, or contract files

## Known intentional exclusions
- `.next`, `coverage`, `tmp`, `log`, and runtime storage remain environment-local
- task packs under `spec/ib-phase6-codex-tasks` are source artifacts and should stay in export output for future Codex handoff
