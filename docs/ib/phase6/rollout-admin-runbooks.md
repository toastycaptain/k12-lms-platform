# IB Phase 6 Rollout, Support, and Admin Runbooks

## Scope
This document closes Tasks 109 and 127 by tying pilot rollout support directly to the live operator surfaces:
- `/ib/rollout`
- `/ib/readiness`
- `/ib/settings`
- `/ib/operations`
- `/ib/families/publishing`

## Status vocabulary
- `setup`: pilot setup exists but required steps are still incomplete
- `blocked`: at least one readiness blocker or red setup step is present
- `active`: setup validated, baseline frozen, and pilot traffic is allowed
- `paused`: school remains configured but new pilot traffic should stop until remediation completes
- `drifting`: school is active but pack/flag/readiness state moved away from the frozen baseline

## Ownership boundaries
- Product support: apply baseline, refresh readiness, stage imports, replay safe failed jobs, route operators to the correct surface
- School admin: confirm pilot owners, school scope, guardian visibility, launch-day contacts, and pause/resume decisions
- Programme coordinator: complete programme settings, review governance, publishing decisions, and standards/export follow-up
- Engineering: schema fixes, broken deploys, corrupted import files, and defects that safe replay cannot recover

## Common rollout scenarios
### Single-school pilot
1. Open `/ib/rollout` and confirm the frozen pack, required flag bundle, and setup blocker counts.
2. Open `Pilot setup wizard` and complete owner fields, academic year label, and guardian confirmation.
3. Apply the baseline, validate setup, and confirm the next actions list is empty or non-blocking.
4. Open `/ib/readiness` and verify no red sections remain.
5. If historical data is needed, stage the import in `Import operations`, save mappings, dry-run, then execute.
6. Verify publishing queue, standards export, and route readiness before pilot users are invited.

### District-first pilot
1. Treat each school as an independent readiness state even when the tenant baseline is shared.
2. Reuse mapping presets and the frozen baseline, but do not assume planning contexts or owner assignments resolve identically.
3. Keep district coordination in `/ib/rollout`, but make launch and pause decisions per school.

### Staged programme activation
1. Use the programme selector in `Pilot setup wizard` to validate `PYP`, `MYP`, or `DP` independently.
2. Keep other programmes in `setup` or `paused` until their blockers are cleared.
3. Re-run readiness after every programme-level import or settings change.

### Pause and resume
1. Pause from `Pilot setup wizard` when imports, publishing, exports, or readiness drift create user-facing risk.
2. Document the reason in the pause payload so support and coordinators see the same explanation.
3. Resume only after readiness refresh, import rollback or replay completion, and launch-day verification repeat.

### Pilot rollback
1. Disable pilot traffic by pausing setup.
2. Use import rollback for draft-only imported entities that have not been adopted by teachers yet.
3. Replay exports or publishing from `Job operations` if the data is still valid.
4. If route or pack drift remains, reapply the baseline and refresh readiness before reopening the pilot.
5. Escalate to engineering when the issue is schema-, deploy-, or integrity-related.

## Safe operator actions
- `Refresh readiness`: recomputes the live rules engine for the current school/programme scope
- `Apply baseline`: reasserts the sanctioned pack/version and required feature-flag bundle
- `Validate`: updates setup status and next actions from the latest backend evidence
- `Replay`: retries safe failed operations from the job operations console
- `Dry-run import`: previews create/update/skip conflicts without mutating live records
- `Rollback import`: reverts draft-only imported entities tracked by execution payloads

## Launch-day runbook
### Pre-flight
- repo integrity script passes
- release gate checklist is green
- rollout console shows frozen baseline and no setup blockers
- readiness console has no red sections
- staged imports are either completed or intentionally deferred
- publishing queue and standards export jobs are healthy

### Go-live
1. Activate the pilot setup.
2. Have an admin, coordinator, and teacher open their canonical IB homes.
3. Validate one evidence action, one publishing action, one coordinator action, and one guardian story read.
4. Capture any issues directly against the surfaced blocker or failure state rather than freeform notes.

### Post-launch verification
- confirm analytics timestamps are current
- confirm no failed replayable jobs remain in the queue console
- confirm guardian visibility was reviewed and publishing stayed in expected states
- schedule the first pilot success scorecard review within one week

## Temporary gaps still needing live-pilot feedback
- import edge cases beyond the seeded CSV/XLSX shapes
- queue and export latency under true pilot traffic
- support copy quality once real coordinators start using the wizard and readiness console
