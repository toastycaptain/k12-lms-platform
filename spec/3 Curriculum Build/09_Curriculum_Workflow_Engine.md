# 09 Curriculum Workflow Engine

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Introduce profile-bound declarative workflow state machines for planning objects so IB/US/UK can enforce different approval/moderation paths without branching core models.

## Current State and Gap
Current state:
- `UnitPlan` status model is global and static (`draft`, `pending_approval`, `published`, `archived`).
- Approval requirement uses tenant boolean setting, not profile-specific workflow definitions.

Grounding references:
- [`apps/core/app/models/unit_plan.rb`](../../apps/core/app/models/unit_plan.rb)
- [`apps/core/app/controllers/api/v1/unit_plans_controller.rb`](../../apps/core/app/controllers/api/v1/unit_plans_controller.rb)
- [`apps/core/app/models/approval.rb`](../../apps/core/app/models/approval.rb)
- [`apps/core/app/controllers/api/v1/approvals_controller.rb`](../../apps/core/app/controllers/api/v1/approvals_controller.rb)

Gap summary:
- Single workflow model for all curricula.
- No declarative transition bindings from profile pack.
- No versioned workflow compatibility strategy.

## Scope
### In Scope
- Define workflow definition, binding, and instance model.
- Define transition guard and role permission framework.
- Define side effects and audit integration.
- Define migration strategy from current status fields.

### Out of Scope
- Pack lifecycle publishing mechanics (File 02).
- Planner UI renderer details (File 06).

## Data Model Changes
### `workflow_definitions`
- `tenant_id` bigint not null
- `workflow_key` string not null
- `profile_key` string not null
- `profile_version` string not null
- `object_type` string not null (`unit_plan`, `template`, `lesson_plan`)
- `definition` jsonb not null
- unique index on `tenant_id, workflow_key, profile_key, profile_version`

### `workflow_instances`
- `tenant_id` bigint not null
- `workflow_definition_id` bigint not null
- `subject_type` string not null
- `subject_id` bigint not null
- `current_state` string not null
- `state_history` jsonb not null default `[]`
- unique index on `tenant_id, subject_type, subject_id`

### `workflow_transition_events`
- `tenant_id` bigint not null
- `workflow_instance_id` bigint not null
- `from_state` string not null
- `to_state` string not null
- `triggered_by_id` bigint not null
- `metadata` jsonb not null default `{}`
- `created_at` datetime not null

## Workflow Definition Contract
Workflow JSON shape:
- `states`: list of named states with display metadata.
- `transitions`: allowed transitions with guards.
- `permissions`: role/action mapping for transitions.
- `side_effects`: approved side-effect handlers (`create_approval`, `notify_reviewers`, `stamp_publish_time`).

Example snippet:
```json
{
  "states": ["draft", "coordinator_review", "published", "archived"],
  "transitions": [
    {"from": "draft", "to": "coordinator_review", "action": "submit_review"},
    {"from": "coordinator_review", "to": "published", "action": "approve_publish"}
  ],
  "permissions": {
    "submit_review": ["teacher", "curriculum_lead"],
    "approve_publish": ["admin", "curriculum_lead"]
  }
}
```

## API and Contract Changes
### New endpoints
1. `GET /api/v1/workflows/:object_type/:id`
2. `POST /api/v1/workflows/:object_type/:id/transitions`
3. `GET /api/v1/admin/workflow_definitions`
4. `PUT /api/v1/admin/workflow_definitions/:id`

### Existing endpoint impact
- Existing `publish`, `archive`, `submit_for_approval` actions become wrappers calling workflow transition service.

### Example transition request
```json
{
  "action": "approve_publish",
  "comment": "Aligned with moderation rubric"
}
```

## UI and UX Behavior Changes
- Show current workflow state and allowed actions in planner header.
- Show transition history panel for admins/curriculum leads.
- Keep button labels pack-specific via terminology tokens.

## Authorization and Security Constraints
- Transition authorization uses both Pundit and workflow role guards.
- Admin-only CRUD for workflow definitions.
- Non-admin users can only invoke transitions explicitly permitted for their role.
- Every transition audited and immutable.

## Rollout and Migration Plan
1. Introduce workflow engine and definitions for `unit_plan` first.
2. Map current statuses to equivalent initial workflow states.
3. Replace direct status mutation calls with workflow transition service.
4. Expand to templates and lessons.
5. Enable via feature flag `curriculum_workflow_engine_v1`.

## Monitoring and Alerts
Metrics:
- `workflow.transition.success_count`
- `workflow.transition.denied_count`
- `workflow.transition.invalid_count`
- `workflow.transition.duration_ms`

Alerts:
- Invalid transition rate > 2% for a tenant over 15 minutes.
- Transition service error rate > 0.5%.

## Test Matrix
### Unit
- Transition graph validation.
- Guard and permission enforcement.

### Request
- Allowed transitions succeed.
- Disallowed transitions return `403`/`422`.

### Integration
- Existing publish/archive routes still function through workflow engine.

### Regression
- Legacy statuses map correctly and remain readable.

## Acceptance Criteria
1. Workflow state is derived from profile-bound definition.
2. Transition permissions are role-enforced and audited.
3. Existing planner publish/archive actions remain supported.
4. Invalid transitions cannot mutate object state.
5. Unit and request tests cover state graph behavior.

## Risks and Rollback
### Risks
- Incorrect workflow mapping could block teacher publishing.
- Side-effect handler duplication risk on retries.

### Rollback
1. Disable `curriculum_workflow_engine_v1`.
2. Re-enable legacy status transitions in controllers.
3. Preserve workflow event records for postmortem.

## Codex Execution Checklist
1. Add workflow definition/instance/event models and migrations.
2. Implement workflow engine service and guard evaluation.
3. Implement transition endpoints and admin definition endpoints.
4. Refactor unit publish/archive/approval actions to workflow service.
5. Add planner UI state/action/history panels.
6. Add tests for transition validity, authorization, and side effects.
7. Add metrics, logging, and rollback switch.
