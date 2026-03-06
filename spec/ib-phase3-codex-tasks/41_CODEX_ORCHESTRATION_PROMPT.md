# Codex Orchestration Prompt — IB Phase 3 Pack

Use this prompt to start or resume a Codex session for this pack.

---

You are implementing the **IB Phase 3 full-stack operationalization pack** for `k12-lms-platform`.

## Read first
1. `00_IB_PHASE3_MASTER_EXECUTION.md`
2. Then execute tasks `01` through `39` **in order**
3. Use `40_COVERAGE_MATRIX_AND_NEXT_VERTICAL_SLICES.md` as the audit that all high-level steps were fully covered

## Non-negotiable execution rules
- Do not skip ahead to the PYP vertical slice before finishing Tasks 01–33.
- Do not start building the MYP or DP full-stack vertical slices in this pack.
- Keep shared platform primitives curriculum-neutral where possible; express IB specificity in the IB pack, IB routes, IB modules, and IB operational services.
- Prefer live data, real workflows, and auditable state over additional showcase UI.

## Architectural intent
This pack should turn the IB experience from presentation-first into **system-of-record-first**:
- live route tree
- live workspace summaries
- richer IB pack
- teacher operations layer
- coordinator operations center
- evidence + family publishing subsystem
- POI / exhibition / interdisciplinary / DP core first-class systems
- standards & practices evidence system
- IB cutover onto curriculum documents
- first full-stack PYP vertical slice

## Repository expectations
Focus your changes in the existing areas of the repo:
- frontend: `apps/web/src/app/ib/*`, `apps/web/src/features/ib/*`, `apps/web/src/curriculum/*`
- backend: `apps/core/app/models/*`, `apps/core/app/controllers/api/v1/*`, `apps/core/app/services/*`, `apps/core/app/queries/*`, `apps/core/config/routes.rb`
- contracts: `packages/contracts/curriculum-profiles/*`

## Development style
- Keep tasks incremental but do not leave mock-only behaviour behind when a task explicitly requires live data.
- Add tests for each task.
- Use feature flags where the task file calls for them.
- Preserve non-IB behaviour for American/British/shared flows unless a task explicitly says otherwise.
- Keep comments, ADR/support docs, and migration notes in-repo where the tasks request them.

## Stop condition
After Task 39:
- finish Task 40 audit
- stop
- explicitly note that the next packs should be:
  1. MYP full-stack vertical slice
  2. DP full-stack vertical slice

Do **not** implement those slices yet.

---

If resuming mid-pack, state:
- the highest completed task number
- the current git status
- whether any feature flags are partially wired
- which acceptance criteria from the current task remain open

Then continue with the next unfinished task only.
