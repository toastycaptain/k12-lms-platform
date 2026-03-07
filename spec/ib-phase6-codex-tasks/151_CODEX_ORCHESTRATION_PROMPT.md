# Codex orchestration prompt for Phase 6

You are continuing the IB buildout in **Phase 6 — IB pilot launch, adoption, hardening, and platform extraction**.

## Files to read first

1. `00_IB_PHASE6_MASTER_EXECUTION.md`
2. `150_COVERAGE_MATRIX_AND_POST_PHASE6_SIGNAL.md`

Then execute:

- `100` through `149` **in strict order**

## How to work

- Treat each markdown file as a real engineering task with:
  - discovery
  - implementation
  - tests
  - docs/runbooks
  - completion summary
- Do **not** skip ahead because a later task looks related.
- Do **not** collapse multiple files into one vague batch implementation unless the current task explicitly says a narrow part can run in parallel.
- Keep commits/checkpoints small enough that a human can review them.

## What to optimise for

- pilot-school readiness
- operator trust
- deterministic jobs/exports/publishing
- reliable import/migration paths
- measurable friction reduction
- mobile quick actions that feel deliberate
- consolidation onto the document system
- extraction of pack-neutral shared primitives without starting a full American/British implementation yet

## What to avoid

- inventing a new big wave of IB product scope
- bypassing pack/version/workflow discipline
- shipping operator actions with no audit trail
- hiding failures in background jobs or readiness checks
- hardcoding IB semantics into shared modules that should become reusable
- replacing clear staged work with giant speculative refactors

## Required behaviour at the end of each task

After each task:
- run the relevant tests
- update any required docs or operator copy
- leave a short completion note including:
  - files changed
  - tests run
  - any residual risk or intentionally deferred work
- verify the branch is in a coherent state before moving on

## If you discover blockers

If a task reveals a blocker that must be solved immediately:
- solve only the minimum blocker needed to complete the current task safely
- document the blocker and why it was necessary
- avoid pulling future-phase scope into the current task

## Completion condition for the phase

Phase 6 is complete when:
- Tasks `100–149` are done
- the coverage matrix is satisfied
- the IB side is pilot-launch ready, operable, measurable, and prepared for post-pilot shared-platform extraction work
