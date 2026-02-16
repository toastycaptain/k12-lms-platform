# Codex Instructions — End-to-End API Contract Validation

## Objective

Audit, validate, and fix the API contracts between the Next.js frontend (`apps/web/`) and the Rails backend (`apps/core/`). The platform has 64 API controllers with 51 ActiveModelSerializers powering 79 frontend pages, but no systematic validation that the frontend's expected response shapes match what the backend actually returns. This task closes that gap by auditing both sides, fixing mismatches, updating OpenAPI specs, and adding contract tests.

---

## What Already Exists

### Backend (Rails)
- 64 API controllers at `apps/core/app/controllers/api/v1/`
- 51 serializers at `apps/core/app/serializers/` using `ActiveModel::Serializer`
- Routes defined in `apps/core/config/routes.rb` under `namespace :api { namespace :v1 { ... } }`
- Authentication via OmniAuth callback, session stored in cookie, `Current.user` set in `ApplicationController`
- Authorization via Pundit policies
- Multi-tenancy via `Current.tenant` and `TenantScoped` concern
- FactoryBot factories at `apps/core/spec/factories/`
- RSpec test suite run via `cd apps/core && bundle exec rspec`

### Frontend (Next.js)
- 79 pages at `apps/web/src/app/**/page.tsx`
- API client at `apps/web/src/lib/api.ts` exporting `apiFetch<T>(path, options)`
- `apiFetch` sends requests to `${NEXT_PUBLIC_API_URL}/api/v1/*` with `credentials: "include"` (cookie auth)
- Accepts header set to `application/json`, Content-Type set to `application/json` for non-FormData bodies
- Custom `X-School-Id` header sent from localStorage
- `ApiError` class thrown for non-2xx responses, reads `error` or `message` from JSON body
- 204 responses return `undefined`
- TypeScript interfaces defined inline in page files (no shared API types package)

### OpenAPI Specs
- `packages/contracts/core-v1.openapi.yaml` — partial, covers courses endpoints
- `packages/contracts/ai-gateway-v1.openapi.yaml` — AI gateway contract

### Key Serializer Patterns (source of truth)
All serializers follow `ActiveModel::Serializer` conventions:
- `attributes` declares scalar fields (returned as snake_case JSON keys)
- `has_many`, `belongs_to`, `has_one` includes nested associations
- Custom methods override attribute serialization (e.g., `UserSerializer#roles` calls `object.roles.pluck(:name)`)
- Rails default JSON key format is **snake_case**

### Key Frontend Patterns
- `apiFetch<T>("/api/v1/courses")` with generic type parameter for expected response shape
- Form submissions use `apiFetch("/api/v1/...", { method: "POST", body: JSON.stringify({...}) })`
- Response data accessed via dot notation on the typed response (e.g., `data.course.sections`)
- Error handling via try/catch on `ApiError`

---

## Task 1: Audit Frontend API Calls

Scan every page in `apps/web/src/app/` and every shared utility in `apps/web/src/lib/` and `apps/web/src/components/` to build a complete inventory of API calls.

### 1a. Scan Methodology

Search for ALL of the following patterns across the frontend codebase:
- `apiFetch(` — the primary API client
- `apiFetchStream(` or `apiStream(` — streaming API calls (if they exist in `api-stream.ts`)
- `apiPoll(` — polling calls (if they exist in `api-poll.ts`)
- `fetch(` with paths containing `/api/` — any raw fetch calls bypassing `apiFetch`
- String literals matching `/api/v1/` — hardcoded paths in any file

For each call found, document:
1. **File path** (relative to repo root)
2. **Line number**
3. **HTTP method** (GET, POST, PATCH, PUT, DELETE)
4. **Endpoint path** (e.g., `/api/v1/courses/${courseId}/assignments`)
5. **Request body shape** (for POST/PATCH/PUT) — what fields are sent
6. **Expected response type** — the TypeScript generic `<T>` used, or the inline interface, or how the response is destructured
7. **Expected nested associations** — any access like `response.sections` or `response.course.modules`

### 1b. Cross-Reference with Routes

For every endpoint found in 1a, verify it exists in `apps/core/config/routes.rb`:
- Check the HTTP method matches (GET vs POST vs PATCH vs DELETE)
- Check the path matches (watch for nested resources like `/courses/:course_id/assignments` vs `/assignments/:id`)
- Check for path parameter naming (`courseId` in frontend vs `:course_id` in Rails)
- Flag any frontend calls to endpoints that do NOT exist in routes

### 1c. Output

**Create:** `packages/contracts/FRONTEND_API_AUDIT.md`

Format the report as a Markdown table grouped by page/feature area:

```markdown
# Frontend API Audit

## Summary
- Total unique API endpoints called: [N]
- Endpoints with matching backend routes: [N]
- Endpoints with NO matching backend route: [N]
- Endpoints with method mismatch: [N]

## By Feature Area

### Dashboard (`/dashboard`)
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|-------------|------------------------|---------------|
| apps/web/src/app/dashboard/page.tsx:42 | GET | /api/v1/courses | - | Course[] | Yes |
| ... | ... | ... | ... | ... | ... |

### Courses (`/teach/courses/*`, `/learn/courses/*`)
...

### Unit Plans (`/plan/*`)
...

### Communication (`/communicate/*`)
...

### Assessment (`/teach/courses/*/assignments/*`, quizzes)
...

### Admin (`/admin/*`)
...
```

---

## Task 2: Audit Backend Serializer Output

For each of the 51 serializers in `apps/core/app/serializers/`, document the exact JSON shape produced.

### 2a. Serializer Inventory

For each serializer, document:

1. **Serializer name** (e.g., `CourseSerializer`)
2. **Attributes** — every field listed in `attributes` (these become top-level JSON keys)
3. **Associations** — every `has_many`, `belongs_to`, `has_one` with:
   - Association name (JSON key)
   - Target serializer (if explicitly set via `serializer:` option)
   - Whether it is always included or conditional
4. **Custom methods** — any method that overrides an attribute (e.g., `def roles; object.roles.pluck(:name); end`)
5. **Computed fields** — any attribute that does NOT correspond to a database column
6. **Sensitive fields to watch** — flag any field that could leak sensitive data (password_digest, tokens, secrets)

### 2b. Compare Against Frontend Expectations

For each serializer, cross-reference with the frontend audit (Task 1):
- Does the frontend expect fields that the serializer does NOT include?
- Does the serializer include fields that no frontend page uses? (not necessarily a problem, but document it)
- Does the frontend expect nested associations that the serializer does NOT include?
- Are there naming mismatches? (e.g., frontend uses `createdAt` but serializer returns `created_at`)

### 2c. Output

**Create:** `packages/contracts/CONTRACT_MISMATCHES.md`

```markdown
# API Contract Mismatches

## Summary
- Total mismatches found: [N]
- Missing backend fields: [N]
- Missing frontend fields: [N]
- Naming mismatches: [N]
- Missing associations: [N]
- Missing routes: [N]

## Mismatches by Serializer

### CourseSerializer
| Issue Type | Detail | Frontend File | Backend File | Fix |
|-----------|--------|---------------|-------------|-----|
| Missing association | Frontend expects `course.sections` but serializer does not include `has_many :sections` | apps/web/src/app/.../page.tsx:55 | apps/core/app/serializers/course_serializer.rb | Add `has_many :sections` to serializer |
| ... | ... | ... | ... | ... |

### UserSerializer
...
```

---

## Task 3: Fix Mismatches

For each mismatch documented in Task 2, apply the appropriate fix. The backend serializer output is the **source of truth** for what field names and structures should be, but the frontend defines what data is **needed**.

### 3a. Fix Decision Matrix

| Mismatch Type | Fix Strategy |
|--------------|-------------|
| Frontend needs a field the serializer does not include | Add the field to the serializer (if it exists on the model and is not sensitive) |
| Frontend uses a different field name than the serializer returns | Fix the frontend to use the serializer's field name (snake_case) |
| Frontend expects a nested association not included in serializer | Add the association to the serializer (e.g., `has_many :sections`) |
| Frontend expects a count field (e.g., `submissions_count`) | Add a custom method to the serializer: `def submissions_count; object.submissions.count; end` and add it to `attributes` |
| Frontend calls an endpoint that does not exist in routes | Either add the route + controller action, OR fix the frontend URL to the correct existing endpoint |
| Frontend sends POST body with wrong field names | Fix the frontend to match what the controller's `strong_params` expects |
| Frontend expects camelCase but backend returns snake_case | Fix the frontend — Rails convention is snake_case, do NOT change the backend |
| Date format mismatch | Rails returns ISO 8601 by default via `as_json`; ensure frontend parses with `new Date()` or similar |

### 3b. Serializer Changes — Rules

When modifying serializers:

1. **DO NOT** add any of these fields: `password_digest`, `encrypted_password`, `reset_password_token`, `confirmation_token`, `api_key`, `secret`, `access_token`, `refresh_token`, `session_token`
2. **DO NOT** remove existing fields (backward compatibility)
3. **DO** add missing `attributes` for fields that exist on the model and are needed by the frontend
4. **DO** add `has_many`, `belongs_to`, `has_one` associations when the frontend needs nested data
5. **DO** add count methods when the frontend needs counts without loading full associations:
   ```ruby
   # Prefer counter_cache or SQL count over loading association
   def submissions_count
     object.submissions.count
   end
   ```
6. **Follow the existing pattern** — all serializers inherit from `ActiveModel::Serializer`
7. If adding an association would create an N+1 query, note it in a code comment:
   ```ruby
   # NOTE: Ensure controller uses `includes(:sections)` to avoid N+1
   has_many :sections
   ```

### 3c. Frontend Changes — Rules

When modifying frontend code:

1. Use **snake_case** for all API response field access (matching Rails convention)
2. Update TypeScript interfaces/types to match the actual serializer output
3. If a page defines an inline interface for API data, ensure it matches the serializer exactly
4. When fixing endpoint URLs, match the Rails route format:
   - Nested resources: `/api/v1/courses/${courseId}/assignments` (NOT `/api/v1/assignments?course_id=${courseId}`)
   - Member actions: `/api/v1/assignments/${id}/publish` (POST)
   - Collection actions: `/api/v1/notifications/mark_all_read` (POST)
5. Request body should wrap params in the resource key if the controller expects it:
   ```typescript
   // Rails controller uses params.require(:course).permit(...)
   body: JSON.stringify({ course: { name, description } })
   ```

### 3d. Controller Changes — Rules

If a route needs to be added:

1. Add the route in `apps/core/config/routes.rb` following existing patterns
2. Add the controller action following existing controller patterns:
   - Use `authorize` (Pundit) in every action
   - Use `ActiveModelSerializers` for response serialization (NOT `render json: object.as_json`)
   - Scope queries through `Current.tenant` (all models use `TenantScoped`)
   - Return appropriate HTTP status codes (200, 201, 204, 404, 422)
3. Add a Pundit policy method if the action is new
4. Add a serializer if a new resource type is being returned

---

## Task 4: Update OpenAPI Specs

Update `packages/contracts/core-v1.openapi.yaml` to document the actual API. Focus on the **20 most important endpoints** rather than exhaustive coverage.

### 4a. Priority Endpoints (must document)

1. `GET /api/v1/me` — current user + tenant info
2. `DELETE /api/v1/session` — sign out
3. `GET /api/v1/courses` — list courses
4. `POST /api/v1/courses` — create course
5. `GET /api/v1/courses/:id` — show course
6. `PATCH /api/v1/courses/:id` — update course
7. `GET /api/v1/courses/:course_id/assignments` — list assignments for course
8. `POST /api/v1/courses/:course_id/assignments` — create assignment
9. `GET /api/v1/assignments/:id` — show assignment
10. `GET /api/v1/assignments/:id/submissions` — list submissions
11. `POST /api/v1/assignments/:id/submissions` — create submission
12. `GET /api/v1/unit_plans` — list unit plans
13. `GET /api/v1/unit_plans/:id` — show unit plan
14. `GET /api/v1/notifications` — list notifications
15. `GET /api/v1/notifications/unread_count` — unread notification count
16. `POST /api/v1/notifications/mark_all_read` — mark all notifications read
17. `GET /api/v1/message_threads` — list message threads
18. `GET /api/v1/quizzes/:id` — show quiz
19. `GET /api/v1/courses/:id/gradebook` — gradebook data
20. `GET /api/v1/search` — global search

### 4b. Schema Requirements

For each endpoint, the OpenAPI spec must include:

```yaml
paths:
  /api/v1/example:
    get:
      summary: Short description
      tags:
        - FeatureArea
      security:
        - cookieAuth: []
      parameters:
        # Query params, path params
      responses:
        "200":
          description: Success description
          content:
            application/json:
              schema:
                # Response schema matching serializer output
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
```

### 4c. Component Schemas

Define reusable schemas in `components/schemas/` that match serializer output exactly. For each serializer that maps to a priority endpoint, create a schema:

```yaml
components:
  schemas:
    Course:
      type: object
      required: [id, name, code]
      properties:
        id:
          type: integer
        name:
          type: string
        code:
          type: string
        description:
          type: string
          nullable: true
        academic_year_id:
          type: integer
        sections:
          type: array
          items:
            $ref: "#/components/schemas/Section"
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
```

### 4d. Error Response Schemas

Define standard error responses:

```yaml
components:
  responses:
    Unauthorized:
      description: Not authenticated
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Not authenticated"
    Forbidden:
      description: Not authorized
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Not authorized"
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Not found"
    ValidationErrors:
      description: Validation failed
      content:
        application/json:
          schema:
            type: object
            properties:
              errors:
                type: object
                additionalProperties:
                  type: array
                  items:
                    type: string
                example:
                  name: ["can't be blank"]
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: _k12_lms_session
```

### 4e. Validation

After updating the spec, validate it:
```bash
# If npx is available:
npx @redocly/cli lint packages/contracts/core-v1.openapi.yaml
# Or at minimum, ensure it parses as valid YAML
```

---

## Task 5: Add Contract Tests

Create RSpec tests that verify serializer output matches the documented API contract. This catches future regressions where a serializer change breaks the frontend.

### 5a. Test File

**Create:** `apps/core/spec/contracts/serializer_contract_spec.rb`

### 5b. Test Structure

```ruby
require "rails_helper"

RSpec.describe "Serializer contracts", type: :model do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before do
    Current.tenant = tenant
    Current.user = user
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe CourseSerializer do
    let(:course) { create(:course, tenant: tenant) }
    let(:serialized) { ActiveModelSerializers::SerializableResource.new(course).as_json }

    it "includes all required keys" do
      expect(serialized.keys).to include(
        :id, :name, :code, :description, :academic_year_id,
        :created_at, :updated_at
      )
    end

    it "includes sections association" do
      expect(serialized).to have_key(:sections)
      expect(serialized[:sections]).to be_an(Array)
    end

    it "does not include sensitive fields" do
      expect(serialized.keys).not_to include(
        :password_digest, :encrypted_password, :reset_password_token
      )
    end

    it "returns id as an integer" do
      expect(serialized[:id]).to be_a(Integer)
    end

    it "returns timestamps as ISO 8601 strings" do
      expect(serialized[:created_at]).to match(/\d{4}-\d{2}-\d{2}T/)
    end
  end

  # Repeat for each major serializer...
end
```

### 5c. Serializers to Test (minimum required)

Write contract tests for at least these serializers:

1. **CourseSerializer** — id, name, code, description, academic_year_id, sections association, created_at, updated_at
2. **UnitPlanSerializer** — id, title, status, course_id, created_by_id, current_version_id, start_date, end_date, created_at, updated_at
3. **AssignmentSerializer** — id, course_id, created_by_id, rubric_id, title, description, instructions, assignment_type, points_possible, due_at, status, standard_ids, created_at, updated_at
4. **QuizSerializer** — id, tenant_id, course_id, created_by_id, title, description, quiz_type, time_limit_minutes, attempts_allowed, status, created_at, updated_at
5. **UserSerializer** — id, email, first_name, last_name, tenant_id, roles (as array of strings), created_at, updated_at; must NOT include password_digest or tokens
6. **NotificationSerializer** — id, user_id, actor_id, notification_type, title, message, url, read_at, created_at, updated_at
7. **SubmissionSerializer** — id, assignment_id, user_id, submission_type, body, status, submitted_at, grade, feedback, created_at, updated_at
8. **SectionSerializer** — verify all expected keys
9. **EnrollmentSerializer** — verify all expected keys
10. **MessageThreadSerializer** — verify all expected keys
11. **MessageSerializer** — verify all expected keys
12. **RubricSerializer** — verify all expected keys

### 5d. Test Patterns

For each serializer test:

1. **Required keys test** — verify all keys the frontend depends on are present
2. **No sensitive data test** — verify no sensitive fields are leaked
3. **Association shape test** — verify nested associations return the correct structure (array vs object)
4. **Type checks** — verify id is Integer, timestamps are String, arrays are Array
5. **Null safety** — verify nullable fields return `null` (not omitted) when the value is nil

### 5e. Shared Examples (optional but recommended)

```ruby
RSpec.shared_examples "a contract-compliant serializer" do |serializer_class, factory_name, required_keys, forbidden_keys|
  let(:record) { create(factory_name, tenant: tenant) }
  let(:serialized) { ActiveModelSerializers::SerializableResource.new(record).as_json }

  it "includes all required keys" do
    required_keys.each do |key|
      expect(serialized).to have_key(key), "Expected key #{key.inspect} in serialized output"
    end
  end

  it "does not include forbidden keys" do
    forbidden_keys.each do |key|
      expect(serialized).not_to have_key(key), "Forbidden key #{key.inspect} found in serialized output"
    end
  end

  it "has an integer id" do
    expect(serialized[:id]).to be_a(Integer)
  end
end
```

---

## Task 6: Verify

Run the full verification suite to ensure nothing is broken.

### 6a. Backend Tests

```bash
cd apps/core
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rspec
```

**Expected:** All existing tests pass. New contract tests (Task 5) also pass.

### 6b. Frontend Tests

```bash
cd apps/web
npm run test
```

**Expected:** All existing tests pass. Any tests that were testing API response shapes should still pass after frontend fixes.

### 6c. Frontend Build

```bash
cd apps/web
npm run build
```

**Expected:** No TypeScript compilation errors. Specifically:
- No `Property 'X' does not exist on type 'Y'` errors from API response access
- No type assertion failures from changed response shapes

### 6d. TypeScript Check

```bash
cd apps/web
npm run typecheck
```

**Expected:** Zero type errors related to API response shapes.

### 6e. Lint

```bash
cd apps/web
npm run lint
```

```bash
cd apps/core
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rubocop --autocorrect
```

**Expected:** No new lint violations introduced.

### 6f. OpenAPI Validation

Ensure the updated OpenAPI spec is valid YAML and parseable:
```bash
# Validate YAML syntax at minimum
ruby -ryaml -e "YAML.load_file('packages/contracts/core-v1.openapi.yaml')"
# Or via Node:
node -e "const yaml = require('yaml'); const fs = require('fs'); yaml.parse(fs.readFileSync('packages/contracts/core-v1.openapi.yaml', 'utf8'))"
```

---

## Architecture Rules

1. **Backend serializers are the source of truth** for field names and JSON structure. The frontend adapts to the backend, not the other way around.
2. **Rails convention is snake_case** for JSON keys. Do NOT configure `key_transform :camel_lower` or similar. The frontend must use snake_case when accessing API response fields.
3. **ActiveModelSerializers pattern only** — do NOT switch to `render json: object.as_json(...)` or `jbuilder` or `jsonapi-resources`. All responses go through serializers.
4. **No sensitive data in serializers** — never add password digests, tokens, API keys, or secrets to any serializer's attributes list.
5. **Backward compatibility** — do NOT remove existing serializer attributes. Only add new ones or fix associations.
6. **Tenant isolation** — all new queries must respect `Current.tenant` scoping. Do not bypass `TenantScoped`.
7. **Authorization** — all new controller actions must call `authorize` (Pundit). Do not skip authorization.
8. **N+1 prevention** — when adding associations to serializers, add a code comment if the controller needs to `includes()` the association to avoid N+1 queries. Better yet, add the `includes` call in the controller.
9. **Test isolation** — contract tests must set up their own data with FactoryBot. Do not rely on seed data or fixtures.
10. **OpenAPI accuracy over completeness** — it is better to have 20 accurate endpoint descriptions than 100 inaccurate ones.

---

## File Inventory

### Files to Create
| File | Purpose |
|------|---------|
| `packages/contracts/FRONTEND_API_AUDIT.md` | Complete inventory of every frontend API call (Task 1) |
| `packages/contracts/CONTRACT_MISMATCHES.md` | Documented mismatches between frontend expectations and backend reality (Task 2) |
| `apps/core/spec/contracts/serializer_contract_spec.rb` | RSpec contract tests for serializer output (Task 5) |

### Files to Modify
| File | Purpose |
|------|---------|
| `apps/core/app/serializers/*.rb` | Add missing fields/associations (Task 3) |
| `apps/web/src/app/**/page.tsx` | Fix field names, endpoint URLs, TypeScript types (Task 3) |
| `apps/web/src/lib/api.ts` | Fix any shared API types/interfaces (Task 3) |
| `apps/web/src/components/**/*.tsx` | Fix API calls in shared components (Task 3) |
| `apps/core/config/routes.rb` | Add any missing routes (Task 3) |
| `apps/core/app/controllers/api/v1/*.rb` | Add any missing controller actions (Task 3) |
| `packages/contracts/core-v1.openapi.yaml` | Update to reflect actual API (Task 4) |

### Files to Read (do not modify)
| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Authoritative route definitions |
| `apps/core/app/models/*.rb` | Model field definitions and associations |
| `apps/core/app/policies/*.rb` | Authorization rules |
| `apps/core/spec/factories/*.rb` | Factory definitions for contract tests |
| `apps/web/src/lib/api.ts` | API client implementation |
| `apps/web/src/lib/api-stream.ts` | Streaming API client (if present) |
| `apps/web/src/lib/api-poll.ts` | Polling API client (if present) |
| `apps/web/src/lib/auth-context.tsx` | Auth context with `CurrentUser` type |

---

## Existing Serializer Reference

For reference, the 51 serializers to audit (at `apps/core/app/serializers/`):

| # | Serializer | Key Frontend Consumer |
|---|-----------|----------------------|
| 1 | `AcademicYearSerializer` | Admin settings, course creation |
| 2 | `AiInvocationSerializer` | AI history/logs |
| 3 | `AiProviderConfigSerializer` | Admin AI settings |
| 4 | `AiTaskPolicySerializer` | Admin AI policies |
| 5 | `AiTemplateSerializer` | AI template management |
| 6 | `AnnouncementSerializer` | Communicate page, course announcements |
| 7 | `ApprovalSerializer` | Approval workflow pages |
| 8 | `AssignmentSerializer` | Assignment detail, grading, submissions |
| 9 | `AttemptAnswerSerializer` | Quiz attempt review |
| 10 | `AuditLogSerializer` | Admin audit logs |
| 11 | `CourseModuleSerializer` | Course modules list, module detail |
| 12 | `CourseSerializer` | Dashboard, course detail, course list |
| 13 | `DataRetentionPolicySerializer` | Admin data retention |
| 14 | `DiscussionPostSerializer` | Discussion thread view |
| 15 | `DiscussionSerializer` | Discussion list and detail |
| 16 | `EnrollmentSerializer` | Section management, roster |
| 17 | `IntegrationConfigSerializer` | Admin integrations |
| 18 | `LessonPlanSerializer` | Unit plan detail, lesson editing |
| 19 | `LessonVersionSerializer` | Lesson version history |
| 20 | `LtiRegistrationSerializer` | LTI admin |
| 21 | `LtiResourceLinkSerializer` | LTI resource links |
| 22 | `MessageSerializer` | Message thread detail |
| 23 | `MessageThreadSerializer` | Messaging inbox |
| 24 | `ModuleItemCompletionSerializer` | Student module progress |
| 25 | `ModuleItemSerializer` | Module detail, item list |
| 26 | `NotificationSerializer` | Notification bell, notification list |
| 27 | `QuestionBankSerializer` | Question bank management |
| 28 | `QuestionSerializer` | Question bank detail, quiz editing |
| 29 | `QuizAccommodationSerializer` | Quiz accommodations |
| 30 | `QuizAttemptSerializer` | Quiz taking, attempt review |
| 31 | `QuizItemSerializer` | Quiz detail, quiz editing |
| 32 | `QuizSerializer` | Quiz detail, quiz list |
| 33 | `ResourceLinkSerializer` | Resource attachments |
| 34 | `RubricCriterionSerializer` | Rubric detail |
| 35 | `RubricRatingSerializer` | Rubric detail |
| 36 | `RubricScoreSerializer` | Submission grading |
| 37 | `RubricSerializer` | Rubric list, rubric detail |
| 38 | `SchoolSerializer` | Admin school management |
| 39 | `SectionSerializer` | Course sections, enrollment |
| 40 | `StandardFrameworkSerializer` | Standards management |
| 41 | `StandardSerializer` | Standards alignment, coverage |
| 42 | `SubmissionSerializer` | Submission detail, grading |
| 43 | `SyncLogSerializer` | Integration sync logs |
| 44 | `SyncMappingSerializer` | Integration sync mappings |
| 45 | `SyncRunSerializer` | Integration sync runs |
| 46 | `TemplateSerializer` | Template management |
| 47 | `TemplateVersionSerializer` | Template version history |
| 48 | `TermSerializer` | Admin terms/semesters |
| 49 | `UnitPlanSerializer` | Unit plan list, unit plan detail |
| 50 | `UnitVersionSerializer` | Unit version history |
| 51 | `UserSerializer` | User management, profile |

---

## Testing

```bash
# Backend — from apps/core
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rspec

# Frontend — from apps/web
npm run test
npm run typecheck
npm run build
npm run lint
```

---

## Definition of Done

- [ ] **Task 1 complete:** `packages/contracts/FRONTEND_API_AUDIT.md` exists and lists every `apiFetch` call across all 79 pages with endpoint, method, and expected response shape
- [ ] **Task 2 complete:** `packages/contracts/CONTRACT_MISMATCHES.md` exists and documents every mismatch between frontend expectations and serializer output
- [ ] **Task 3 — Serializer fixes applied:** All serializers that were missing fields needed by the frontend have been updated
- [ ] **Task 3 — Frontend fixes applied:** All frontend pages using wrong field names, wrong endpoint URLs, or wrong request body shapes have been corrected
- [ ] **Task 3 — Route fixes applied:** Any missing routes have been added with corresponding controller actions and Pundit authorization
- [ ] **Task 3 — No sensitive data leaked:** No serializer exposes password_digest, tokens, API keys, or secrets
- [ ] **Task 4 complete:** `packages/contracts/core-v1.openapi.yaml` documents at least the 20 priority endpoints with correct request/response schemas
- [ ] **Task 4 — Valid YAML:** The OpenAPI spec parses without errors
- [ ] **Task 4 — Schemas match serializers:** Every schema in the OpenAPI spec matches the actual serializer output
- [ ] **Task 5 complete:** `apps/core/spec/contracts/serializer_contract_spec.rb` exists with contract tests for at least 12 serializers
- [ ] **Task 5 — Tests pass:** All contract tests pass via `bundle exec rspec spec/contracts/`
- [ ] **Task 6 — Backend tests pass:** `bundle exec rspec` passes with zero failures
- [ ] **Task 6 — Frontend tests pass:** `npm run test` passes with zero failures
- [ ] **Task 6 — Frontend builds:** `npm run build` succeeds with no TypeScript errors
- [ ] **Task 6 — No type errors:** `npm run typecheck` reports zero errors related to API response shapes
- [ ] **Task 6 — Linting clean:** No new lint violations in either codebase
- [ ] **Backward compatible:** No existing serializer attributes were removed
- [ ] **Tenant isolation preserved:** All new queries respect `Current.tenant` scoping
- [ ] **Authorization preserved:** All new controller actions use `authorize` (Pundit)
