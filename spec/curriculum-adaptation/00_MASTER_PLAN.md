# Curriculum-Adaptive LMS v1 Master Plan

## Objective
Enable fast, reliable adaptation to multiple curricula (initially IB, British, American, and Singapore) by introducing an admin-governed curriculum profile layer that drives derived planner and course behavior across the platform.

## Why This Matters
Institutions that follow different curricula need different planning taxonomy, standards defaults, and instructional workflow context. The system should adapt after an admin sets a curriculum profile, without requiring teachers or students to manually configure curriculum settings.

## Scope
### In Scope (v1)
- Curriculum profile model and resolver.
- Tenant default + school override strategy (with optional course override support in data model).
- Admin-only profile/settings/import controls.
- Derived UI/data behavior for non-admin roles.
- Additive schema and `/api/v1` contract updates.
- Integration context propagation for Google, LTI, OneRoster.

### Out of Scope (v1)
- Full grading policy parity by curriculum (e.g., IB 1-7 report-card pipeline).
- Transcript generation differences by curriculum authority.
- Exam timetable/proctoring workflows.
- SIS replacement or major backend architecture change.

## Non-Negotiable Governance
Curriculum configuration, profile/package management, and framework import are admin-exclusive operations.

Teachers, students, guardians, and curriculum leads are read-only consumers for curriculum behavior in this initiative and must only see derived outcomes from the effective admin-configured profile.

## Effective Curriculum Resolution
1. Course-level explicit override (if present).
2. School-level override.
3. Tenant default profile.
4. System fallback profile.

## Phased Delivery
### Phase 1: Foundation
- Add schema fields and resolver service.
- Add profile registry and validation assets.
- No user-facing behavioral change yet.

### Phase 2: Admin Governance
- Deliver admin-only settings pages/endpoints.
- Add import/upload controls for profile/framework data (admin-only).
- Add auditing hooks for profile mutations.

### Phase 3: Planner Derivation
- Update unit creation and planning filters to derive from effective profile.
- Preserve existing planner flows and endpoints.

### Phase 4: Integration Propagation
- Add effective profile context to Google/LTI/OneRoster integration calls and metadata.
- Keep integration ownership boundaries intact.

### Phase 5: Hardening and Rollout
- Complete test matrix, feature-flag rollout, monitoring, and rollback readiness.

## Success Criteria
1. Any non-admin attempt to mutate curriculum profile/settings/import endpoints returns `403`.
2. Non-admin UI surfaces show no curriculum authoring controls.
3. New unit/course planning defaults correctly reflect the effective profile.
4. Existing tenants without explicit settings continue to function via safe fallback.
5. Integration flows remain functional and tenant-scoped.
