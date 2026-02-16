# API Contract Mismatches

## Summary
- Total mismatches found: 2
- Missing backend fields: 0
- Missing frontend fields: 0
- Naming mismatches: 0
- Missing associations: 0
- Missing routes: 1 (fixed)

## Mismatches by Area

### Shared API Client / Polling
| Issue Type | Detail | Frontend File | Backend File | Fix |
|-----------|--------|---------------|-------------|-----|
| Missing route prefix | Polling used `/ai_invocations/:id` (missing `/api/v1`), which bypassed v1 routing and could 404 in production. | `apps/web/src/lib/api-poll.ts:17` | `apps/core/config/routes.rb` | Updated frontend path to `/api/v1/ai_invocations/:id`. |

### OpenAPI Contract
| Issue Type | Detail | Frontend File | Backend File | Fix |
|-----------|--------|---------------|-------------|-----|
| Auth cookie scheme mismatch | Prior OpenAPI spec used cookie name `_session_id`, while Rails session middleware uses `_k12_lms_session`. | `apps/web/src/lib/api.ts:67` | `apps/core/config/application.rb:44` | Updated `packages/contracts/core-v1.openapi.yaml` security scheme cookie name to `_k12_lms_session`. |

## Serializer Cross-Check Notes
- Priority serializers audited for frontend consumption: `CourseSerializer`, `UnitPlanSerializer`, `AssignmentSerializer`, `QuizSerializer`, `UserSerializer`, `NotificationSerializer`, `SubmissionSerializer`, `SectionSerializer`, `EnrollmentSerializer`, `MessageThreadSerializer`, `MessageSerializer`, `RubricSerializer`.
- No sensitive fields were identified in serializer outputs for these priority serializers.
- No frontend camelCase-vs-snake_case contract break was found in audited production call sites.

## Route Cross-Reference Notes
- All `/api/v1/*` endpoints discovered in audited production frontend files mapped to existing Rails v1 routes after fixing `api-poll.ts`.
- Remaining route checks are based on `apps/core/config/routes.rb` plus route table verification.
