# Phase 04 — Contracts and Verification

## Goal
Align API contracts and tests with newly added guardian family functionality.

## Scope
- OpenAPI path + schema updates for new guardian endpoints.
- Backend request spec updates.
- Web contract test updates.
- Run targeted backend/web validations.

## Tasks
1. Update `apps/core/config/openapi/core-v1.openapi.yaml`:
   - New guardian attendance/classes/calendar routes
   - New schemas for attendance summaries/items and guardian classes/calendar payloads as needed
2. Add/update web contract tests for guardian payload shapes.
3. Execute target test commands and capture outcomes.

## Acceptance
- OpenAPI includes new guardian family endpoints.
- Updated tests pass or have documented blockers.
