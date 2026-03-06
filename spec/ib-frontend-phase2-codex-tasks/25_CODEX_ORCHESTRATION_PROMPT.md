# Task 25 — Codex Orchestration Prompt for IB Phase 2

Paste or adapt the prompt below when starting a new Codex session for this IB phase-2 workstream.

## Suggested prompt

You are implementing the IB phase-2 frontend task pack for `k12-lms-platform`.

Read these files first, in order:
1. `00_IB_PHASE2_MASTER_EXECUTION.md`
2. The current task file I tell you to execute
3. `24_ROADMAP_COVERAGE_MATRIX.md` whenever you need to verify scope

Execution rules:
- Implement tasks sequentially; do not skip ahead unless the current task explicitly requires route scaffolding.
- Do not invent backend payloads. Inspect existing contracts, generated types, and completed Route 3 backend work first.
- Keep shared platform primitives curriculum-neutral. Put IB-specific pages, composition, and labels under `apps/web/src/app/ib/**` and `apps/web/src/features/ib/**`.
- Use existing frontend conventions: `apiFetch`, `useAppSWR`, auth context, shared UI package, route tests, and existing test infrastructure.
- Every task must include loading, empty, error, permission, and (where relevant) poor-network states.
- Every task must include tests proportional to the surface being built.
- Avoid the main competitor pain patterns: too many clicks, hidden state, dead-end dashboards, noisy family feed, weak specialist workflows, and laggy behavior.
- If a contract gap blocks implementation, stop and document the exact gap instead of silently inventing a new API dialect.

Definition of done for each task:
- The routes/components in the task file exist.
- Major interactions work end-to-end against existing contracts or a clearly marked replaceable adapter.
- Tests pass.
- The implementation does not regress non-IB curriculum behavior.
- The implementation remains aligned with the click-budget and calm-mode principles from the roadmap.

When you finish a task:
- Summarize what changed.
- List any known follow-up items that should be carried into the next task.
- Confirm which later task(s) will consume the new surface.

## Resume prompt

I am resuming IB phase-2 work. Read:
- `00_IB_PHASE2_MASTER_EXECUTION.md`
- `<current task file>`
- `24_ROADMAP_COVERAGE_MATRIX.md`

Then inspect the latest branch state before coding. Tell me:
1. What in the task is already done
2. What remains
3. What files you will touch
4. What contract risks you see
5. Then start implementing
