# Phase 7 Workflow Event Model

## Purpose
Task 153 required one event vocabulary for teacher, specialist, coordinator, student, and family workflows. Phase 7 implements that vocabulary across `IbActivityEvent`, the browser emitter, and server-side canonical event storage.

## Event families
- `teacher_workflow`
- `specialist_workflow`
- `coordinator_intelligence`
- `student_journey`
- `family_experience`
- `search_and_navigation`
- `performance`

## Required event fields
| Field | Source | Notes |
|---|---|---|
| `event_name` | client or server | Namespaced as `ib.*` |
| `event_family` | client or server | One of the canonical families above |
| `surface` | client or server | Teacher home, specialist dashboard, operations center, student home, family home, search, performance |
| `tenant_id`, `school_id`, `user_id` | server | Added by the API/controller layer |
| `programme` | client or server | `PYP`, `MYP`, `DP`, or `Mixed` |
| `route_id` | client or server | Canonical route registry id when available |
| `entity_ref` | client or server | Stable object ref such as `curriculum_document:123` |
| `document_type` | optional | Only when it helps segmentation |
| `success` / `failure` | metadata | Store completion result and reason without leaking student or guardian private content |
| `latency` / `duration_ms` | metadata | Used by workflow benchmark and performance budgets |
| `click_count` | metadata | Used by workflow benchmark baselines |

## Canonical event names
| Workflow family | Trigger events | Completion events |
|---|---|---|
| Teacher workflow | `ib.route.view`, `ib.command.execute`, `ib.search.open_result`, `ib.request_reflection.executed`, `ib.duplicate_document.executed` | `ib.workflow.completed` |
| Specialist workflow | `ib.specialist.assignment.created`, `ib.specialist.multi_attach.created`, `ib.specialist.handoff.updated` | `ib.workflow.completed` |
| Coordinator intelligence | `ib.operations.view`, `ib.recommendation.accepted`, `ib.exception.triaged`, `ib.export.generated` | `ib.workflow.completed` |
| Student journey | `ib.student.timeline.view`, `ib.student.reflection.submitted`, `ib.student.collection.updated` | `ib.workflow.completed` |
| Family experience | `ib.family.story.view`, `ib.family.digest.preference_changed`, `ib.family.response.submitted`, `ib.family.acknowledged` | `ib.workflow.completed` |

## Client and server split
- Optimistic browser telemetry uses `emitIbEvent` and should never block the UI.
- Canonical events are persisted through `Api::V1::Ib::ActivityEventsController` and `Ib::Support::ActivityEventService`.
- Use the browser event for immediate latency and intent, then use the canonical event for audit, timeline, and benchmark calculations.

## Privacy rules
- Do not log story body text, reflection body text, or guardian/private narrative content.
- Use route ids, stable entity refs, and safe labels instead of sensitive free-form content.
- Keep guardian and student events queryable by workflow family and permission-safe metadata, not by the actual message body.

## Downstream consumers
- `Ib::Support::WorkflowBenchmarkService`
- `Ib::Support::PerformanceBudgetService`
- `Ib::Home::ActionConsoleService#recent_history`
- pilot analytics and future Phase 8 workflow scorecards
