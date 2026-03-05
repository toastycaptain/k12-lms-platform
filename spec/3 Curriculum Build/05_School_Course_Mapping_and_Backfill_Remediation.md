# 05 School Course Mapping and Backfill Remediation

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Eliminate ambiguous curriculum resolution by making course-to-school mapping deterministic, with a safe remediation workflow for unresolved legacy records.

## Current State and Gap
Current state:
- `courses.school_id` exists but is nullable.
- Backfill job only auto-fills single-school tenants and logs unresolved multi-school cases.

Grounding references:
- [`apps/core/db/migrate/20260302090000_add_curriculum_profile_fields.rb`](../../apps/core/db/migrate/20260302090000_add_curriculum_profile_fields.rb)
- [`apps/core/db/migrate/20260302090100_backfill_curriculum_profile_defaults.rb`](../../apps/core/db/migrate/20260302090100_backfill_curriculum_profile_defaults.rb)
- [`apps/core/app/models/course.rb`](../../apps/core/app/models/course.rb)
- [`apps/core/app/controllers/api/v1/courses_controller.rb`](../../apps/core/app/controllers/api/v1/courses_controller.rb)
- [`apps/web/src/app/admin/school/page.tsx`](../../apps/web/src/app/admin/school/page.tsx)

Gap summary:
- No productized unresolved queue for admin remediation.
- No deterministic workflow for multi-school tenant assignments.
- Cannot safely move to non-null `courses.school_id` yet.

## Scope
### In Scope
- Build unresolved mapping queue and remediation APIs/UI.
- Define deterministic inference order and confidence scoring.
- Define migration phases toward strict constraints.

### Out of Scope
- Resolver logic changes beyond using improved mapping (File 04).
- District governance inheritance changes (File 10).

## Deterministic Mapping Strategy
Inference order for unresolved `courses.school_id`:
1. Existing direct course-school mapping.
2. Section-to-school lineage via roster mappings.
3. OneRoster sync mapping (`SyncMapping`) school references.
4. Assignment and enrollment concentration heuristic (>= 80% same school evidence).
5. Manual admin assignment required.

Any inference with confidence < 0.8 enters unresolved queue.

## Data Model Changes
### `course_school_resolution_tasks`
- `tenant_id` bigint not null
- `course_id` bigint not null
- `status` string not null (`pending`, `resolved`, `ignored`)
- `recommended_school_id` bigint nullable
- `confidence_score` decimal(4,3) nullable
- `evidence` jsonb not null default `{}`
- `resolved_by_id` bigint nullable
- `resolved_at` datetime nullable
- unique index on `tenant_id, course_id`

## API and Contract Changes
### New admin endpoints
1. `GET /api/v1/admin/curriculum_course_mapping/tasks`
2. `PATCH /api/v1/admin/curriculum_course_mapping/tasks/:course_id`
3. `POST /api/v1/admin/curriculum_course_mapping/backfill/run`
4. `GET /api/v1/admin/curriculum_course_mapping/backfill/status`

### Example task list response
```json
{
  "tasks": [
    {
      "course_id": 27,
      "course_name": "Grade 7 Science",
      "status": "pending",
      "recommended_school_id": 4,
      "confidence_score": 0.91,
      "evidence": {
        "roster_school_matches": 34,
        "one_roster_org_mapping": "ext-org-42"
      }
    }
  ]
}
```

### Example resolution request
```json
{
  "school_id": 4,
  "decision": "resolve",
  "notes": "Validated against registrar spreadsheet"
}
```

## UI and UX Behavior Changes
Add admin remediation surface (new tab under `/admin/curriculum-profiles`):
1. Queue table with confidence, evidence summary, and suggested school.
2. Bulk apply for high-confidence tasks.
3. Manual assignment controls for unresolved tasks.
4. Audit trail preview per resolved item.

## Authorization and Security Constraints
- Admin-only mutation for mapping tasks.
- Curriculum leads read-only view of task queue optional; no write actions.
- Every resolution action audited with actor, before value, after value.
- Enforce tenant scoping for course and school records.

## Rollout and Migration Plan
### Phase 1
- Add task table and backfill analysis job.
- Populate queue without changing existing course mappings.

### Phase 2
- Admin resolves queue in pilot tenants.
- Enable auto-apply for confidence >= 0.95 with admin approval toggle.

### Phase 3
- Enforce `school_id` required for new courses.
- Block publish of curriculum profile changes if unresolved mapping count > threshold.

### Phase 4
- Consider migration to `courses.school_id NOT NULL` once unresolved queue reaches zero for target cohort.

## Monitoring and Alerts
Metrics:
- `course_school_mapping.unresolved_count`
- `course_school_mapping.auto_resolved_count`
- `course_school_mapping.manual_resolved_count`
- `course_school_mapping.conflict_count`

Alerts:
- Unresolved count increases week-over-week for any tenant.
- Backfill job failure or stuck status > 30 minutes.

## Test Matrix
### Unit
- Inference scoring logic by evidence set.

### Request
- Admin task list and resolution endpoints function with tenant boundaries.
- Non-admin mutation denied with `403`.

### Migration
- Existing course data remains intact.
- Queue creation is idempotent.

### UI
- Admin can resolve and bulk-apply tasks.

## Acceptance Criteria
1. Every unresolved course appears in admin remediation queue.
2. Admin can resolve each task and update `courses.school_id` safely.
3. Backfill analysis can be rerun idempotently.
4. No cross-tenant course/school assignment is possible.
5. Unresolved count becomes measurable and trendable.

## Risks and Rollback
### Risks
- Incorrect auto-resolution from low-quality source data.
- Operational overhead for large districts.

### Rollback
1. Disable auto-apply and return to manual-only decisions.
2. Revert recent auto-resolutions using audit trail snapshots.
3. Keep unresolved queue for further review.

## Codex Execution Checklist
1. Add `course_school_resolution_tasks` migration/model with tenant indexes.
2. Implement inference job with confidence scoring and evidence capture.
3. Build admin endpoints for queue list, resolve action, and backfill status.
4. Add admin UI queue and bulk/manual resolution controls.
5. Add audit events for all mapping decisions.
6. Add request/unit/migration/UI tests.
7. Add metrics and alert wiring for unresolved trends.
