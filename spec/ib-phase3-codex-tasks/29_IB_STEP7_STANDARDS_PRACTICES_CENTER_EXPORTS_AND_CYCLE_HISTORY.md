# Task 29 — IB STEP7 STANDARDS PRACTICES CENTER EXPORTS AND CYCLE HISTORY

## Position in sequence
- **Step:** 7 — Make Standards & Practices real
- **Run after:** Task 28
- **Run before:** Task 30 begins consolidating the planning stack so IB can fully standardize on curriculum documents.
- **Primary mode:** Backend + Frontend

## Objective
Bind the Standards & Practices board/center to live packet data, add export/review flows, and preserve evidence history across review cycles.

## Why this task exists now
Coordinators need a real evidence center with gaps, owners, export readiness, and historical continuity. This task makes the frontend operational and useful for real authorization/evaluation prep.

## Current repo anchors
- Output from Task 28
- `apps/web/src/features/ib/coordinator/StandardsAndPracticesBoard.tsx`
- `apps/web/src/features/ib/coordinator/StandardsPracticesEvidenceCenter.tsx`
- `apps/web/src/app/ib/standards-practices/page.tsx`

## Scope
- Replace static board content with live cycle, packet, and gap data.
- Support packet owner assignment, review state, evidence strength indicators, and export actions.
- Preserve historical cycles so schools can compare preparation across years rather than rebuilding from zero.

## Backend work
- Add any missing endpoints for export generation, packet history, and cycle duplication/rollover.
- Ensure export generation is auditable and policy-safe.

## Frontend work
- Bind board and center components to live packet/cycle data.
- Render gap views, owner queues, packet detail, and export readiness clearly.
- Support history switching by cycle and school/year context.

## Data contracts, APIs, and model rules
- Use exception-first design even here: highlight missing evidence, stale evidence, and unowned sections rather than only showing all packets equally.
- Show source provenance for packet items so coordinators trust the evidence chain.

## Risks and guardrails
- Do not make packet detail unreadably dense; coordinators still need quick scanning and drilldown.

## Testing and verification
- Integration tests for packet detail, history switching, and export actions.
- Regression tests proving the board is no longer static.

## Feature flags / rollout controls
- Gate with `ib_standards_practices_live_v1` until stable.
- Do not auto-export silently; keep export actions explicit and logged.

## Acceptance criteria
- Standards & Practices is now a real evidence workflow, not a static board.

## Handoff to the next task
- Task 30 begins consolidating the planning stack so IB can fully standardize on curriculum documents.
