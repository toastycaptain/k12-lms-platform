# Task 49 — IB STEP10 MYP VERTICAL SLICE SERVICE-AS-ACTION, EVIDENCE, REFLECTION, AND APPROVALS

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 48
- **Run before:** Task 50 completes the coordinator-side MYP operations and review loop
- **Primary mode:** Backend + Frontend

## Objective
Operationalize service-as-action inside the MYP slice: service entries, evidence, reflections, approvals/validation, unit/project linkages, and clear visibility into completion and follow-up.

## Why this task exists now
Service-as-action is one of the places where platforms easily become compliance-heavy and annoying. This task should make service capture lightweight for students and teachers while still giving coordinators real oversight.

## Current repo anchors
- Outputs from Tasks 19–21, 24–25, and 48
- evidence subsystem
- MYP service entry models/endpoints from Phase 3
- `apps/web/src/features/ib/myp/*`
- student and guardian surfaces that will consume slice outputs

## Scope
- create and edit service entries
- attach evidence and reflections
- link service entries to subject units, interdisciplinary units, and/or projects where relevant
- validate/approve service entries or reflections through teacher/advisor/coordinator flows
- expose completion/follow-up state in student, teacher, and coordinator contexts

## Backend work
- Ensure service entry models support:
  - student ownership
  - optional linkage to unit/interdisciplinary/project records
  - reflection state
  - evidence linkage
  - approval/review state and reviewer identity
  - school and role scoping
- Add summary endpoints for “awaiting validation,” “missing reflection,” “service linked to active unit,” and cohort participation/risk views.
- Ensure evidence/reflection visibility rules are explicit and auditable.

## Frontend work
- Bind service flows to live data.
- Create lightweight student/teacher/advisor entry points from the right contexts rather than one isolated service page only.
- Add clear review/approval UI that shows what is missing before approval.
- Show service progress and reflection state in the project hub and unit side rails where relevant.

## UX / interaction rules
- service entry should be fast to create
- reflection prompts should be guided but not overbearing
- approval UI should distinguish between “needs reflection,” “needs evidence,” and “needs reviewer action”
- family/guardian visibility should remain controlled and calm, not automatic

## Data contracts, APIs, and model rules
- Do not conflate service approval state with generic evidence state if service has distinct validation semantics.
- Keep service linkages queryable for coordinator analytics.
- Separate internal reviewer notes from student-visible and family-visible content.

## Risks and guardrails
- Do not turn service-as-action into another dense teacher paperwork surface.
- Do not require duplicate data entry between projects and service where linkage is sufficient.
- Do not publish service items to families without explicit visibility logic.

## Testing and verification
- Model/request tests for service entry creation, linkage, reflection, and review transitions.
- Frontend integration tests for student entry, teacher validation, and coordinator summary views.
- Permission tests for visibility and editing boundaries.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`
- `ib_myp_service_slice_v1`

## Acceptance criteria
- Service-as-action is now a live, low-friction workflow linked into the MYP slice rather than a placeholder or generic evidence bucket.

## Handoff to the next task
- Task 50 completes the coordinator-side MYP operations and review loop.
