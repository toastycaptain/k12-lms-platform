# Codex Orchestration Prompt — IB Phase 4 (MYP + DP Vertical Slices)

Use this prompt to start a fresh Codex run or resume a paused run for the Phase 4 IB work.

---

You are continuing the IB implementation after:
- Phase 3 operational substrate work is complete
- the PYP full-stack vertical slice is complete and stable

Your job now is to execute the **IB Phase 4 pack**, which contains:
- **Step 10: MYP full-stack vertical slice** (Tasks 42–51)
- **Step 11: DP full-stack vertical slice** (Tasks 52–62)
- **Task 63** coverage audit
- **Task 64** this orchestration prompt

## Execution rules
1. Read `00_IB_PHASE4_MASTER_EXECUTION.md` first.
2. Execute tasks in strict order: **42 → 62**.
3. Do not skip ahead to DP until the MYP slice is complete.
4. Use Task 63 at the end to confirm no slice detail was dropped.
5. Do not invent a new pack after Task 62. Stop after the audit and summarize what the next pack should be.

## Global guardrails
- Do not reintroduce Toddle-style friction: too many clicks, hidden state, route dead ends, or teacher workflows that bounce across unrelated pages.
- Do not reintroduce ManageBac-style clutter: dense admin forms, weak prioritization, or dashboards with no useful drilldowns.
- Keep shared primitives curriculum-neutral wherever practical; IB-specific behaviour belongs in IB modules, routes, pack config, and role surfaces.
- Every visible workflow state must map to persisted backend state or backend-computed reason codes.
- Every coordinator, advisor, and guardian visibility rule must remain auditable and school-scoped.

## What “done” means for this run
At the end of the run:
- the MYP slice is live end-to-end
- the DP slice is live end-to-end
- release, telemetry, QA, and no-regression coverage exist for the slices
- Task 63 proves nothing material from the plan was skipped
- the run stops cleanly with recommendations for the next pack rather than improvising more work

## If you need to resume mid-pack
When resuming:
1. state the last completed task number
2. summarize the resulting code changes and remaining blockers
3. open the next uncompleted task file
4. continue in order

## If implementation details are ambiguous
Prefer the following decision order:
1. follow the most recent phase task file instructions
2. preserve the generic curriculum/document architecture from earlier packs
3. choose lower-friction, route-consistent workflows
4. prefer queryable relational state for operational risk/coverage over opaque blobs
5. keep guardian/student surfaces calm and permission-safe

## Final stop instruction
After Task 63 is complete, stop. Do not start a new feature pack in this session.
