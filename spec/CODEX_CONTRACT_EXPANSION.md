# Codex Instructions — OpenAPI Contract Expansion

## Objective

Expand the OpenAPI contract from 31 documented endpoints to cover all ~100 active API endpoints. Add contract validation tests to ensure the spec stays in sync with the implementation.

**Spec references:** TECH-2.5 (API style), TECH-2.6 (key endpoints), P2-2 in PRIORITIZED_BACKLOG.md

---

## What Already Exists (DO NOT recreate)

### Contracts
- `packages/contracts/core-v1.openapi.yaml` — 31 endpoints, 48 schemas documented
- `packages/contracts/ai-gateway-v1.openapi.yaml` — 4 endpoints, 7 schemas (complete)
- `packages/contracts/CONTRACT_MISMATCHES.md` — 2 previously identified and fixed mismatches

### Contract Tests
- `apps/core/spec/contracts/` — 3 existing contract spec files

### Routes
- `apps/core/config/routes.rb` — defines all API routes
- 64 controllers with 100+ combined actions

---

## Task 1: Inventory Missing Endpoints

The following endpoint groups are NOT yet documented in `core-v1.openapi.yaml` and need to be added:

### Academic Structure
- `GET /api/v1/academic_years` — list academic years
- `POST /api/v1/academic_years` — create academic year
- `GET /api/v1/academic_years/{id}` — show academic year
- `PATCH /api/v1/academic_years/{id}` — update academic year
- `DELETE /api/v1/academic_years/{id}` — delete academic year
- `GET /api/v1/terms` — list terms
- `POST /api/v1/terms` — create term
- `GET /api/v1/terms/{id}` — show term
- `PATCH /api/v1/terms/{id}` — update term
- `DELETE /api/v1/terms/{id}` — delete term
- `GET /api/v1/sections` — list sections
- `POST /api/v1/sections` — create section

### Course Content
- `POST /api/v1/courses/{course_id}/course_modules` — create module
- `GET /api/v1/modules/{id}` — show module
- `PATCH /api/v1/modules/{id}` — update module
- `DELETE /api/v1/modules/{id}` — delete module
- `POST /api/v1/modules/{id}/publish` — publish module
- `POST /api/v1/modules/{id}/archive` — archive module
- `POST /api/v1/modules/{id}/reorder_items` — reorder module items
- `GET /api/v1/modules/{id}/module_items` — list module items
- `POST /api/v1/modules/{id}/module_items` — create module item
- `GET /api/v1/course_modules/{id}/progress` — get module progress
- `POST /api/v1/module_items/{id}/complete` — mark item complete

### Assignments (extended)
- `POST /api/v1/assignments` — create assignment (currently only course-scoped GET documented)
- `PATCH /api/v1/assignments/{id}` — update assignment
- `DELETE /api/v1/assignments/{id}` — delete assignment
- `POST /api/v1/assignments/{id}/publish` — publish
- `POST /api/v1/assignments/{id}/close` — close
- `POST /api/v1/assignments/{id}/push_to_classroom` — push to Google Classroom
- `POST /api/v1/assignments/{id}/sync_grades` — sync grades

### Discussions
- `GET /api/v1/discussions/{id}` — show discussion
- `PATCH /api/v1/discussions/{id}` — update discussion
- `DELETE /api/v1/discussions/{id}` — delete discussion
- `POST /api/v1/discussions/{id}/lock` — lock discussion
- `POST /api/v1/discussions/{id}/unlock` — unlock discussion
- `GET /api/v1/discussions/{id}/posts` — list posts
- `POST /api/v1/discussions/{id}/posts` — create post

### Announcements
- `GET /api/v1/announcements` — list announcements
- `POST /api/v1/announcements` — create announcement
- `PATCH /api/v1/announcements/{id}` — update announcement
- `DELETE /api/v1/announcements/{id}` — delete announcement

### Rubrics (full CRUD)
- `GET /api/v1/rubrics` — list rubrics
- `POST /api/v1/rubrics` — create rubric
- `GET /api/v1/rubrics/{id}` — show rubric
- `PATCH /api/v1/rubrics/{id}` — update rubric
- `DELETE /api/v1/rubrics/{id}` — delete rubric

### Unit Plans (extended)
- `POST /api/v1/unit_plans` — create unit plan
- `PATCH /api/v1/unit_plans/{id}` — update unit plan
- `DELETE /api/v1/unit_plans/{id}` — delete unit plan
- `POST /api/v1/unit_plans/{id}/create_version` — create version
- `GET /api/v1/unit_plans/{id}/versions` — list versions
- `POST /api/v1/unit_plans/{id}/publish` — publish
- `POST /api/v1/unit_plans/{id}/archive` — archive
- `POST /api/v1/unit_plans/{id}/export_pdf` — export PDF
- `GET /api/v1/unit_plans/{id}/export_pdf_status` — check PDF status
- `POST /api/v1/unit_plans/{id}/submit_for_approval` — submit for approval

### Lesson Plans
- `GET /api/v1/unit_plans/{id}/lesson_plans` — list lessons
- `POST /api/v1/unit_plans/{id}/lesson_plans` — create lesson
- `GET /api/v1/unit_plans/{unit_id}/lesson_plans/{id}` — show lesson
- `PATCH /api/v1/unit_plans/{unit_id}/lesson_plans/{id}` — update lesson
- `DELETE /api/v1/unit_plans/{unit_id}/lesson_plans/{id}` — delete lesson

### Templates (extended)
- `POST /api/v1/templates` — create template
- `PATCH /api/v1/templates/{id}` — update template
- `DELETE /api/v1/templates/{id}` — delete template
- `POST /api/v1/templates/{id}/create_version` — create version
- `GET /api/v1/templates/{id}/versions` — list versions
- `POST /api/v1/templates/{id}/publish` — publish
- `POST /api/v1/templates/{id}/archive` — archive
- `POST /api/v1/templates/{id}/create_unit` — create unit from template

### Standards (extended)
- `POST /api/v1/standard_frameworks` — create framework
- `GET /api/v1/standard_frameworks/{id}` — show framework
- `PATCH /api/v1/standard_frameworks/{id}` — update framework
- `DELETE /api/v1/standard_frameworks/{id}` — delete framework
- `GET /api/v1/standard_frameworks/{id}/tree` — tree view
- `POST /api/v1/standards` — create standard
- `GET /api/v1/standards/{id}` — show standard

### Quizzes (extended)
- `POST /api/v1/quizzes` — create quiz
- `PATCH /api/v1/quizzes/{id}` — update quiz
- `DELETE /api/v1/quizzes/{id}` — delete quiz
- `POST /api/v1/quizzes/{id}/publish` — publish
- `POST /api/v1/quizzes/{id}/close` — close
- `GET /api/v1/quizzes/{id}/results` — results summary
- `GET /api/v1/quizzes/{id}/analytics` — analytics
- Quiz items, accommodations full CRUD

### Messaging (extended)
- `POST /api/v1/message_threads` — create thread
- `GET /api/v1/message_threads/{id}` — show thread
- `GET /api/v1/message_threads/{id}/messages` — list messages
- `POST /api/v1/message_threads/{id}/messages` — create message

### Admin
- `GET /api/v1/users` — list users
- `POST /api/v1/users` — create user
- `GET /api/v1/users/{id}` — show user
- `PATCH /api/v1/users/{id}` — update user
- `DELETE /api/v1/users/{id}` — delete user
- `GET /api/v1/schools` — list schools
- `GET /api/v1/audit_logs` — list audit logs
- Approvals, integration configs, sync resources, LTI, data retention, AI configs/policies/templates full CRUD

### Resource Links
- `GET /api/v1/resource_links` — list resource links
- `POST /api/v1/resource_links` — create resource link
- `DELETE /api/v1/resource_links/{id}` — delete resource link

### Standards Alignment
- `GET /api/v1/assignment_standards` — list
- `POST /api/v1/assignment_standards` — create
- `DELETE /api/v1/assignment_standards/{id}` — delete
- Standards coverage endpoints

---

## Task 2: Add Schema Definitions

For each new endpoint group, add the corresponding request/response schemas to the `components/schemas` section.

**Approach:** Read each controller's corresponding serializer to determine the exact response shape. For example:
- `apps/core/app/serializers/discussion_serializer.rb` → defines the Discussion schema
- `apps/core/app/serializers/announcement_serializer.rb` → defines the Announcement schema

**For each serializer, create a matching OpenAPI schema with:**
- All `attributes` as properties with correct types
- All `has_many`/`belongs_to` relationships documented
- Required fields based on model validations

---

## Task 3: Contract Validation Tests

**Expand** `apps/core/spec/contracts/` with tests that verify:

1. **Response shape validation:** For each documented endpoint, verify the actual API response matches the OpenAPI schema
2. **Required fields:** Verify responses include all required fields
3. **Status codes:** Verify documented status codes match actual responses

**Approach:** Use the `committee` gem or similar OpenAPI validation library, or manually compare response keys against the schema.

Create at minimum one contract test per endpoint group (academic, courses, assignments, quizzes, discussions, messaging, admin, AI).

---

## Architecture Rules

1. The OpenAPI spec is the source of truth for API consumers
2. All paths must use `/api/v1` prefix
3. All endpoints require `cookieAuth` security (except health check)
4. Response schemas must match serializer output exactly
5. Do NOT change any controller or serializer code — only document what exists

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/contracts/
```

---

## Definition of Done

- [ ] All ~100 active API endpoints documented in core-v1.openapi.yaml
- [ ] All response schemas match their serializers
- [ ] Contract validation tests cover all endpoint groups
- [ ] No existing tests broken
- [ ] CONTRACT_MISMATCHES.md updated if any new mismatches are found
