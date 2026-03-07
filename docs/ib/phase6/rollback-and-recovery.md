# Rollback and Recovery Runbook

## Rollback classes
- code rollback: revert deploy and redeploy last known good commit
- feature-flag rollback: disable the phase 6 pilot bundle or selected risky surfaces
- pack rollback: rollback the published/frozen curriculum profile release to the last sanctioned version
- publishing recovery: replay held/failed publishing queue items after fixing root cause
- standards export recovery: replay failed exports with the original packet snapshot preserved
- readiness recovery: recompute setup/readiness status after migration or config repair
- import rollback: reverse draft-only imports through stored execution summaries when still safe

## Safe triggers
- unexpected route failure on canonical IB surfaces
- import execution blocks or cross-school mapping drift
- repeated publish/export failures after deploy
- pilot setup bundle diverges from sanctioned baseline
- readiness transitions from green/yellow to red for critical sections after rollout

## Operator ownership
- school admin/coordinator: readiness recompute, setup rerun, safe replay actions
- support: launch-day triage, pack/flag verification, batch rollback coordination
- engineering: migration rollback, code rollback, infrastructure repair

## Recovery actions exposed in-product
- recompute readiness
- reapply pilot baseline bundle
- replay failed standards export
- replay held or failed publishing queue item
- retry import dry-run or rollback completed draft-only import
