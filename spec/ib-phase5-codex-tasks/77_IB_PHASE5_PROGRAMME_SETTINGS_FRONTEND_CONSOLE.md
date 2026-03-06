# Task 77 — Programme Settings Frontend Console

## Phase step
3 — Build the real IB admin/coordinator governance layer

## Purpose
Create the dedicated frontend surface for IB programme settings so coordinators and admins can
configure the product without resorting to Rails console, seed files, or undocumented flags.

## Current repo anchors
- `apps/web/src/features/ib/data.ts`
- `apps/web/src/app/ib/`
- `apps/web/src/lib/api.ts`

## Deliverables
- A real settings page or nested route under the IB coordinator/admin area for programme settings.
- Forms for cadence, review owners, thresholds, and defaults with validation and change confirmation.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Support form requirements with field descriptions, option lists, and error envelopes if needed.

### 3) Frontend work
- Build forms using the shared UI kit with explanatory copy that is practical, not bureaucratic.
- Support separate tabs or panels for PYP, MYP, DP, and whole-IB defaults if applicable.
- Make it obvious which settings are inherited versus overridden at school/programme scope.
- Add a read-only summary card that can be shown in the IB Operations Center.

### 5) Files to touch or create

- Start with the anchor files above.

### 6) Test plan
- Form validation tests.
- Role-based access tests.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- A coordinator/admin can configure cadence, ownership, and thresholds without code changes.

### 9) Pitfalls and guardrails
- Do not make settings navigation generic-admin-only if IB coordinators are intended users.

### 10) Handoff to the next task

Before moving to Task 78, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
