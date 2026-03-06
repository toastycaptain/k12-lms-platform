# Task 85 — Standards Export Preview, Cycle Comparison, and Approval UX

## Phase step
4 — Turn Standards & Practices into a real evaluation subsystem

## Purpose
Complete the frontend reviewer workflow for standards/practices by adding export preview, cycle
comparison, review assignment, and approval/return flows with explicit states.

## Current repo anchors
- `apps/web/src/app/ib/`
- `apps/web/src/features/ib/data.ts`

## Deliverables
- Preview-before-export UI, cycle comparison UI, approve/return actions, and reviewer assignment affordances.
- A clear path from 'gap/weak' to 'ready/approved/exported'.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 3) Frontend work
- Allow reviewers to compare the current packet/cycle against a previous cycle using backend comparison payloads.
- Render export previews that show which evidence snapshots will be frozen into the artifact.
- Support return-with-comments and approval actions with confirmation and audit visibility.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Interaction tests for preview, compare, approve, return, and export initiation.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Export or preview at least one standards packet and verify evidence provenance is visible.

### 8) Acceptance criteria
- A coordinator/reviewer can move a packet through review without leaving the subsystem or guessing what export will include.

### 9) Pitfalls and guardrails
- Do not hide packet comments or review reasons in secondary modals if they are decision-critical.

### 10) Handoff to the next task

Before moving to Task 86, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
