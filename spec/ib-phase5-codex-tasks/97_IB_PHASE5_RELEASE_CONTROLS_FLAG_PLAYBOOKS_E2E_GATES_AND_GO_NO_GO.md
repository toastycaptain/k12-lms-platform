# Task 97 — Release Controls, Flag Playbooks, E2E Gates, and Go/No-Go Criteria

## Phase step
7 — Add pilot telemetry, readiness reporting, and release controls

## Purpose
Translate all of Phase 5 into safe rollout mechanics: feature-flag playbooks, e2e regression gates,
QA checklists, rollback criteria, and a final go/no-go framework for an IB pilot or early adopter
launch.

## Current repo anchors
- `apps/core/app/models/feature_flag.rb`
- `docs/`
- `spec/`
- `apps/web/src/app/ib/`
- `apps/core/app/controllers/api/v1/`

## Deliverables
- A rollout playbook document checked into the repo.
- E2E and regression suites tied to the canonical IB routes and queues.
- Explicit go/no-go criteria for pilot launch and rollback.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Define which flags gate which Phase 5 capabilities and how to enable them safely by tenant/school.
- Add any missing safe defaults or rollback helpers.

### 3) Frontend work
- Ensure critical pilot routes are covered by end-to-end tests and smoke checks.
- Make any feature-disabled or partial-rollout states explicit on the UI.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.
- Expect changes under `docs/`, `spec/`, or a dedicated runbook directory for readiness and rollout documentation.

### 6) Test plan
- Playwright/Cypress/E2E coverage for the critical route tree and coordinator/teacher/governance flows.
- Rollback simulation or flag-off tests where feasible.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- The team has a concrete, test-backed way to launch or hold the IB pilot.

### 9) Pitfalls and guardrails
- Do not conflate internal demo success with pilot readiness; use the gates seriously.

### 10) Handoff to the next task

Before moving to Task 98, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
