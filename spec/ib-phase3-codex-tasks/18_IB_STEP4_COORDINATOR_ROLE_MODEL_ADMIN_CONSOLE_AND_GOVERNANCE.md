# Task 18 — IB STEP4 COORDINATOR ROLE MODEL ADMIN CONSOLE AND GOVERNANCE

## Position in sequence
- **Step:** 4 — Build the coordinator/admin IB Operations Center
- **Run after:** Task 17
- **Run before:** Task 19 now builds the portfolio/family publishing subsystem that operations will monitor.
- **Primary mode:** Backend + Frontend

## Objective
Clarify coordinator/admin roles, permissions, thresholds, and programme configuration so the IB Operations Center is governable and auditable, not a collection of implicit assumptions.

## Why this task exists now
Once coordinator screens go live, the product needs explicit control over who can configure thresholds, approve items, manage family cadence, and own programme-level review.

## Current repo anchors
- `apps/core/app/policies/*`
- `apps/core/app/models/role*` or role/permission structures
- `apps/web/src/app/admin/*`
- `apps/web/src/features/ib/home/CoordinatorOverview.tsx`
- `apps/web/src/features/ib/operations/ProgrammeOperationsCenter.tsx`

## Scope
- Define or document role/capability distinctions for PYP coordinator, MYP coordinator, DP coordinator, head of programme, admin, and district admin.
- Expose configuration surfaces for thresholds, cadence expectations, review ownership, and perhaps school-specific IB settings where appropriate.
- Ensure approvals, review queue access, and standards/practices evidence ownership are role-safe and auditable.

## Backend work
- Update policies/permission checks to support coordinator-specific capabilities if they are not already explicit.
- Create settings models/endpoints or use existing tenant/school settings in a disciplined way for operations thresholds and review configuration.
- Audit existing approval/review policies for compatibility with the new coordinator workflows.

## Frontend work
- Add admin/coordinator configuration pages or drawers where thresholds and role-owned settings can be adjusted without editing code or raw JSON.
- Surface configuration origin and effective values clearly when district/school overrides apply.

## Data contracts, APIs, and model rules
- Document which settings belong at district, tenant, school, or programme level.
- Document the audit requirements for changing thresholds or ownership settings.

## Risks and guardrails
- Do not bury important threshold settings deep inside generic admin menus with no IB context.
- Do not let school-level overrides silently diverge from district defaults without showing provenance.

## Testing and verification
- Policy tests for all coordinator/admin capabilities touched.
- UI tests for configuration forms and override visibility.
- Manual verification that a teacher cannot access coordinator-only controls by URL.

## Feature flags / rollout controls
- Gate sensitive new controls behind `ib_operations_center_v1` or a narrower `ib_programme_settings_v1` if needed.
- Do not ship silent role changes; document them in release notes or internal support docs.

## Acceptance criteria
- Coordinator/admin operations are now governable and permission-safe.
- The rest of the phase can rely on explicit ownership and threshold configuration.

## Handoff to the next task
- Task 19 now builds the portfolio/family publishing subsystem that operations will monitor.
