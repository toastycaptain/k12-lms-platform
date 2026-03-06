# Codex Orchestration Prompt — IB Phase 5

You are continuing the IB buildout of `k12-lms-platform`.

## Read order
1. Read `00_IB_PHASE5_MASTER_EXECUTION.md`.
2. Execute Tasks `65` through `97` sequentially.
3. Use `98_COVERAGE_MATRIX_AND_POST_PHASE5_SIGNAL.md` as the audit checklist.
4. If the session is interrupted, re-read:
   - `00_IB_PHASE5_MASTER_EXECUTION.md`
   - the last completed task file
   - `98_COVERAGE_MATRIX_AND_POST_PHASE5_SIGNAL.md`

## Non-negotiable rules
- Do not skip the audit/design subsection at the start of each task.
- Do not silently improvise schema or route contracts that contradict earlier tasks.
- Do not add new `/demo` routes or preserve placeholder destinations as production routes.
- Do not push IB users back into legacy generic planner pages unless the task explicitly allows an admin/debug exception.
- Keep shared infrastructure generic where possible, but keep IB-specific route/workflow/document behavior under IB modules and contracts.
- Respect school scoping, role boundaries, and feature flags at all times.
- When a task changes an API shape, add or update tests and write the final request/response example into repo documentation rather than leaving it implicit.

## Recommended working style
For each task:
1. Audit the existing code at the listed repo anchors.
2. Write down the delta you are about to implement.
3. Implement the smallest coherent slice that satisfies the task end-to-end.
4. Add/update automated tests.
5. Manually verify the listed QA checklist.
6. Update any relevant route/contract/readiness notes for downstream tasks.

## Phase goal
The goal of Phase 5 is **IB productionization, governance, and pilot readiness**. By the end of this pack the system should be coherent enough that an admin/coordinator can inspect readiness, teachers can work through real canonical routes, and operational reliability is visible rather than assumed.

## Completion signal
After Task 97:
- run the audit in `98_COVERAGE_MATRIX_AND_POST_PHASE5_SIGNAL.md`
- summarize any unresolved blockers
- do not start a new major pack automatically; wait for the next explicit planning step
