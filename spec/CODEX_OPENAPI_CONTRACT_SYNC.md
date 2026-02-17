# CODEX_OPENAPI_CONTRACT_SYNC — Expand OpenAPI Spec to All Endpoints

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.5 (API Style — OpenAPI schemas), TECH-2.6 (Key Endpoints)
**Depends on:** None

---

## Problem

`packages/contracts/core-v1.openapi.yaml` documents ~31 endpoints but the Rails API has ~100+ endpoints. This means:

1. **68% of endpoints undocumented** — no schema validation for most API responses
2. **Frontend contracts untested** — `CONTRACT_MISMATCHES.md` documents known gaps but no automated enforcement
3. **New endpoints added without spec** — no process to keep OpenAPI in sync

---

## Tasks

### 1. Audit All Rails Routes

Run `rails routes` and catalog every `/api/v1/*` endpoint. Group by domain:

- Identity: sessions, users, roles, permissions, guardian_links
- Planning: unit_plans, lesson_plans, templates, standards, approvals
- LMS: courses, sections, enrollments, assignments, submissions, rubrics, discussions, announcements
- Assessment: question_banks, questions, quizzes, quiz_attempts, accommodations
- Calendar: calendar events
- Communication: message_threads, messages, notifications, notification_preferences
- Integrations: drive, classroom sync, LTI
- AI: ai_provider_configs, ai_task_policies, ai_templates, ai_invocations
- Admin: schools, academic_years, terms, district, search, gradebook, standards_coverage
- Reports: quiz_analytics, student_progress

### 2. Add Missing Endpoint Schemas

For each undocumented endpoint, add to `core-v1.openapi.yaml`:
- Path definition with HTTP method
- Request parameters (path, query, body)
- Response schema with all fields and types
- Error responses (401, 403, 404, 422)
- Example values

### 3. Add Schema Definitions

Ensure every serializer has a matching OpenAPI schema component:
- Match field names and types to `*_serializer.rb` output
- Include nested relationships
- Document nullable fields

### 4. Create Contract Validation Tests

Create `apps/core/spec/contracts/openapi_validation_spec.rb`:

```ruby
describe "OpenAPI contract compliance" do
  ENDPOINTS_TO_VALIDATE.each do |endpoint|
    it "#{endpoint[:method]} #{endpoint[:path]} matches schema" do
      # Make request
      # Parse response
      # Validate against OpenAPI schema
    end
  end
end
```

Use `openapi_first` or `committee` gem for schema validation.

### 5. Add CI Check for Contract Drift

Add a CI step that validates the OpenAPI spec is valid YAML and that response schemas match actual serializer output.

### 6. Resolve CONTRACT_MISMATCHES.md

Review and resolve each documented mismatch:
- Update OpenAPI spec to match implementation, OR
- Update implementation to match spec
- Remove resolved items from the document

---

## Files to Modify

| File | Purpose |
|------|---------|
| `packages/contracts/core-v1.openapi.yaml` | Add ~70 missing endpoint schemas |
| `packages/contracts/CONTRACT_MISMATCHES.md` | Resolve documented mismatches |

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/spec/contracts/openapi_validation_spec.rb` | Schema validation tests |

---

## Definition of Done

- [ ] All ~100 API endpoints documented in OpenAPI spec
- [ ] Schema components defined for all serializers
- [ ] Request/response examples for each endpoint
- [ ] Error response schemas (401, 403, 404, 422) documented
- [ ] Contract validation tests pass
- [ ] CONTRACT_MISMATCHES.md items resolved
- [ ] CI validates OpenAPI spec on every PR
- [ ] No undocumented endpoints
