# Codex Instructions — Backend Test Coverage Depth (17% to 60%+)

## Objective

Dramatically increase Rails test coverage from the current 17% line coverage to 60%+ by deepening existing specs and adding missing spec files. The project currently has 1234 passing specs (57 model, 69 request, 52 policy, 7 service, 11 job specs) covering 59 models, 64 controllers, 52 policies, 7 services, and 12 jobs. Most existing specs only test the happy path. This task adds comprehensive edge-case coverage, missing action tests, validation depth, and new job specs to close the gap.

---

## What Already Exists

### Stack
- Rails 8.1.2, Ruby 4.0.1
- RSpec, FactoryBot, Shoulda-Matchers, SimpleCov
- Pundit for authorization (`require "pundit/rspec"` in rails_helper.rb)
- Multi-tenant via `TenantScoped` concern (`Current.tenant`)
- 56 factories in `spec/factories/`
- `mock_session(user, tenant: tenant)` helper in `spec/support/authentication_helpers.rb`

### Test Directories
- `apps/core/spec/models/` — 57 model specs
- `apps/core/spec/requests/api/v1/` — 69 request specs
- `apps/core/spec/policies/` — 52 policy specs
- `apps/core/spec/services/` — 7 service specs
- `apps/core/spec/jobs/` — 11 job specs

### Existing Spec Pattern (Model)
```ruby
require "rails_helper"

RSpec.describe Assignment, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course) }
    it { should have_many(:submissions).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:status).in_array(Assignment::VALID_STATUSES) }
  end

  describe "state transitions" do
    it "publishes from draft" do
      assignment = create(:assignment, tenant: tenant, status: "draft")
      assignment.publish!
      expect(assignment.reload.status).to eq("published")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      a1 = create(:assignment, tenant: t1)
      Current.tenant = t2
      create(:assignment, tenant: t2)

      Current.tenant = t1
      expect(Assignment.all).to contain_exactly(a1)
    end
  end
end
```

### Existing Spec Pattern (Request)
```ruby
require "rails_helper"

RSpec.describe "Api::V1::Assignments", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/courses/:course_id/assignments" do
    it "creates an assignment" do
      mock_session(teacher, tenant: tenant)
      # ... setup, request, expectations
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)
      # ... request, expect 403
    end

    it "returns 422 for invalid params" do
      mock_session(teacher, tenant: tenant)
      # ... request with bad params, expect 422
    end
  end
end
```

### Existing Spec Pattern (Policy)
```ruby
require "rails_helper"

RSpec.describe AssignmentPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:assignment, tenant: tenant, course: course, created_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits all users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end
end
```

### Existing Spec Pattern (Job)
```ruby
require "rails_helper"

RSpec.describe AiGenerationJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "calls the AI gateway and marks invocation completed" do
    allow(AiGatewayClient).to receive(:generate).and_return(result)
    described_class.perform_now(invocation.id)
    invocation.reload
    expect(invocation.status).to eq("completed")
  end
end
```

---

## Architecture Rules

1. Every spec file starts with `require "rails_helper"`
2. Every spec sets `Current.tenant` in `before` and clears it with `Current.tenant = nil` in `after`
3. Mock ALL external HTTP calls — never hit real endpoints (use `allow`, `instance_double`, `stub_const`)
4. Do NOT modify any application code — only add or modify spec files under `apps/core/spec/`
5. **Read the actual source file before writing tests** — open the model/controller/service/job file and base tests on real method signatures, validations, and logic. Do NOT guess behavior.
6. Follow the factory patterns in `spec/factories/` — use `tenant: tenant` on all `create`/`build` calls
7. Use `mock_session(user, tenant: tenant)` for request specs (defined in `spec/support/authentication_helpers.rb`)
8. Use Shoulda-Matchers for one-liner validations and associations
9. Use `create(:user, tenant: tenant).tap { |u| u.add_role(:role_name) }` pattern for role setup
10. Clear `Current.user = nil` in after blocks for service/job specs that set it

---

## Task 1: Deepen Model Specs

**Goal:** For each of the 59 models in `app/models/`, ensure the corresponding spec in `spec/models/` comprehensively covers all behavior defined in the source file.

**Before writing any tests for a model, read the source file at `app/models/<model_name>.rb` to identify:**
- All `validates` declarations (presence, inclusion, numericality, uniqueness, format, custom)
- All `has_many ... dependent:` options (destroy, nullify, restrict_with_exception)
- All `scope` declarations
- All instance methods (especially state transitions and computed values)
- All callbacks (before_validation, after_create, etc.)
- All class methods
- Any `include` of concerns beyond TenantScoped

### 1a. Validation Depth

For every model, test ALL validations — not just presence. Specifically:

- **Presence**: `it { should validate_presence_of(:field) }`
- **Inclusion**: `it { should validate_inclusion_of(:status).in_array(Model::VALID_STATUSES) }` — also test that an invalid value raises validation error
- **Uniqueness**: `it { should validate_uniqueness_of(:slug).scoped_to(:tenant_id) }` — test duplicate creation fails
- **Numericality**: `it { should validate_numericality_of(:points_possible).is_greater_than_or_equal_to(0) }` — test negative values, nil, non-numeric strings
- **Format**: Test regex validations with valid and invalid inputs
- **Custom validators**: Test each custom validation method individually with edge cases

### 1b. Association Dependent Options

For every `has_many ... dependent: :destroy`:
```ruby
it "destroys associated submissions when destroyed" do
  assignment = create(:assignment, tenant: tenant)
  create(:submission, tenant: tenant, assignment: assignment)
  expect { assignment.destroy }.to change(Submission, :count).by(-1)
end
```

For every `has_many ... dependent: :nullify`:
```ruby
it "nullifies foreign key on associated records when destroyed" do
  # ... create parent and child, destroy parent, expect child.parent_id to be nil
end
```

### 1c. State Transition Methods

Test every state transition method with:
1. **Valid transition**: from the correct starting state, expect the new state
2. **Invalid transition**: from an incorrect starting state, expect it to raise an error or remain unchanged
3. **Side effects**: timestamps set (e.g., `published_at`, `submitted_at`, `completed_at`), counters updated, associated records modified

**Models with state transitions that MUST have deep coverage:**

| Model | Methods to Test |
|---|---|
| Assignment | `publish!`, `close!`, `archive!` |
| Quiz | `publish!`, `close!`, `archive!`, `calculate_points!` |
| QuizAttempt | `submit!`, `calculate_score!` |
| Submission | `submit!` |
| SyncRun | `start!`, `complete!`, `fail!` |
| AiInvocation | `complete!`, `fail!` |
| IntegrationConfig | `activate!`, `deactivate!` |
| Approval | `approve!`, `reject!` |

### 1d. Named Scopes

For every `scope` defined on a model, test:
1. Records matching the scope are returned
2. Records NOT matching the scope are excluded
3. Scope returns an ActiveRecord::Relation (can be chained)

Common scopes to look for: `.active`, `.pending`, `.published`, `.draft`, `.recent`, `.for_user`, `.by_course`, `.ordered`

### 1e. Custom Instance Methods

**Models with methods that MUST have deep test coverage:**

- **QuizAttempt**: `effective_time_limit` (with and without accommodation), `calculate_score!` (all graded, partially graded, zero score), `within_attempt_limit` (at limit, over limit, unlimited), `quiz_is_available` (published, draft, closed, nil available dates, past dates)
- **Submission**: `grade_within_points_possible` (grade equal to max, grade over max, nil grade)
- **SyncRun**: `log_info`, `log_warn`, `log_error` (verify SyncLog created with correct level and message)
- **AiTaskPolicy**: `allowed_for_role?` (each role type), `effective_model` (with and without override)
- **Question**: `auto_gradable?` (for each question type — multiple_choice, true_false, short_answer, essay, matching)
- **User**: `has_role?` (existing role, missing role), `add_role` (new role, duplicate role idempotency)
- **Approval**: `no_duplicate_pending` (custom validation — create two pending approvals for same record)

### 1f. Edge Cases

For every model, add at minimum:
- Test creating a record with all optional fields set to `nil`
- Test that `tenant_id` is required (except Tenant model itself)
- Test boundary values for numeric fields (0, negative, MAX_INT for integer fields)

---

## Task 2: Deepen Request Specs

**Goal:** For each of the 64 controllers in `app/controllers/api/`, ensure the corresponding request spec covers all actions, authorization failures, validation failures, not-found handling, and tenant isolation.

**Before writing tests for a controller, read the source file at `app/controllers/api/<controller_name>.rb` to identify:**
- All actions (index, show, create, update, destroy, plus custom actions)
- Params permitted via strong parameters
- Which roles are authorized (check the corresponding policy)
- Any filter/query params on index actions
- Nested resource scoping (e.g., `course.assignments`)

### 2a. Authorization (403 Forbidden)

For EVERY action on EVERY controller, test that unauthorized roles receive 403:
```ruby
it "returns 403 for students on create" do
  mock_session(student, tenant: tenant)
  post "/api/v1/courses/#{course.id}/assignments", params: { title: "X", assignment_type: "written" }
  expect(response).to have_http_status(:forbidden)
end
```

Roles to test denial for (based on the policy):
- `student` on write actions (create/update/destroy) for most resources
- `teacher` on admin-only resources (schools, terms, academic_years, integration_configs, data_retention_policies, ai_provider_configs, ai_task_policies, lti_registrations)
- `guardian` on write actions
- Unauthenticated requests (no `mock_session`) should return 401

### 2b. Validation Errors (422 Unprocessable Entity)

For every `create` and `update` action, test at least:
1. Missing required params
2. Invalid enum/inclusion values
3. Invalid numericality (negative points, non-integer)
4. Duplicate uniqueness violations

```ruby
it "returns 422 when title is blank" do
  mock_session(teacher, tenant: tenant)
  post "/api/v1/courses/#{course.id}/assignments", params: { title: "", assignment_type: "written" }
  expect(response).to have_http_status(:unprocessable_content)
  expect(response.parsed_body["errors"]).to be_present
end
```

### 2c. Not Found (404)

For every `show`, `update`, `destroy`, and custom member action, test:
```ruby
it "returns 404 for non-existent record" do
  mock_session(teacher, tenant: tenant)
  get "/api/v1/assignments/999999"
  expect(response).to have_http_status(:not_found)
end
```

### 2d. Tenant Isolation

For at least 10 key controllers (assignments, courses, quizzes, submissions, announcements, discussions, enrollments, rubrics, standards, templates), add:
```ruby
it "does not return records from another tenant" do
  tenant2 = create(:tenant)
  Current.tenant = tenant2
  other_record = create(:assignment, tenant: tenant2, ...)
  Current.tenant = nil

  mock_session(teacher, tenant: tenant)
  get "/api/v1/courses/#{course.id}/assignments"
  ids = response.parsed_body.map { |r| r["id"] }
  expect(ids).not_to include(other_record.id)
end
```

### 2e. Pagination

For every `index` action that supports pagination, test:
```ruby
it "paginates results" do
  mock_session(teacher, tenant: tenant)
  Current.tenant = tenant
  15.times { create(:assignment, tenant: tenant, course: course, created_by: teacher) }
  Current.tenant = nil

  get "/api/v1/courses/#{course.id}/assignments", params: { page: 1, per_page: 5 }
  expect(response).to have_http_status(:ok)
  expect(response.parsed_body.length).to be <= 5
end
```

### 2f. Filter Params

For every `index` action that supports query filters, test each filter param. Read the controller to find supported params. Common ones:
- `status` filter on assignments, quizzes, submissions, announcements
- `course_id` filter where applicable
- `user_id` or `student_id` filter
- `q` search param on SearchController

### 2g. Controllers with Specialized Actions

These controllers have non-standard actions that need explicit test coverage:

| Controller | Actions to Test |
|---|---|
| QuizAnalyticsController | `by_quiz` (returns analytics for a quiz), `course_summary` (aggregate course analytics) |
| StandardsCoverageController | `by_academic_year` (coverage across all courses), `by_course` (single course coverage) |
| AiStreamController | `create` (SSE streaming — test that the response initiates, mock AiGatewayClient.stream) |
| GradebookController | `show` (returns gradebook data for a course section) |
| SearchController | `index` with `q` param (test empty query, partial match, no results) |
| SubmissionGradingController | Custom grading actions — test grade assignment, validation of points |
| AttemptAnswerGradingController | Grade individual attempt answers |
| DriveController | Google Drive file operations — mock GoogleDriveService |

---

## Task 3: Deepen Service Specs

**Goal:** For each of the 7 services in `app/services/`, ensure the spec covers all public methods, error handling, and edge cases.

**Before writing tests, read each service file at `app/services/<service_name>.rb` to understand all public methods and error paths.**

### 3a. AiGatewayClient (`spec/services/ai_gateway_client_spec.rb`)

The existing spec covers `.generate`. Add:
- **`.stream` method**: Test that it yields chunks, handles connection errors, handles incomplete streams
- **Timeout handling**: Test that Faraday::TimeoutError is caught and raised as AiGatewayError
- **Connection errors**: Test Faraday::ConnectionFailed handling
- **Retry logic**: If the client retries on 429/503, test retry behavior with counted attempts

Also check `spec/services/ai_gateway_client_stream_spec.rb` — read it first and fill gaps.

### 3b. AuditLogger (`spec/services/audit_logger_spec.rb`)

Read the source to find all methods. Test:
- All metadata normalization paths (different input shapes for metadata)
- Error swallowing — if the logger itself raises, it should not propagate
- Each audit event type that the logger handles
- Nil/empty inputs for optional parameters

### 3c. GoogleClassroomService (`spec/services/google_classroom_service_spec.rb`)

Mock all HTTP calls. Test:
- **Course sync**: Create, update, archive courses in Google Classroom
- **Roster sync**: Import students from a Google Classroom course
- **Coursework push**: Push assignment to Google Classroom
- **Grade passback**: Sync grades back to Google Classroom
- **Error handling**: Expired token (trigger token refresh), API rate limit, not found course
- **Token refresh flow**: Ensure GoogleTokenService.refresh is called on 401

### 3d. GoogleDriveService (`spec/services/google_drive_service_spec.rb`)

Mock all HTTP calls. Test:
- File upload, download, list, delete operations
- Permission/sharing operations
- Error handling: not found, permission denied, quota exceeded
- Large file handling if applicable

### 3e. GoogleTokenService (`spec/services/google_token_service_spec.rb`)

Test:
- **Fresh token**: Returns stored token when not expired
- **Expired token**: Refreshes and returns new token
- **Refresh failure**: Handles invalid refresh token gracefully
- **Missing token**: Returns appropriate error for users without Google tokens
- **Token storage**: Verify tokens are persisted after refresh

### 3f. NotificationService

**Check if `spec/services/notification_service_spec.rb` exists. If not, create it.**

Read `app/services/notification_service.rb`. Test:
- Each notification trigger type (assignment published, submission graded, quiz available, message received, announcement posted, AI generation complete, approval requested, sync completed)
- Correct user targeting (notify the right user)
- Notification attributes (type, notifiable, message)
- Duplicate prevention if applicable
- Nil/missing user handling

### 3g. OneRosterClient (`spec/services/one_roster_client_spec.rb`)

Mock all HTTP calls. Test:
- **Authentication**: Token caching, token expiry, re-authentication
- **Retry on 401**: When a cached token is stale, retry after re-auth
- **Pagination**: Test multi-page responses with offset/limit
- **Entity types**: Test fetching orgs, users, enrollments, courses, classes, academic sessions
- **Error handling**: Connection timeout, 500 errors, malformed JSON response
- **Rate limiting**: Handle 429 responses

---

## Task 4: Add/Deepen Job Specs

**Goal:** Ensure every job in `app/jobs/` has a spec with happy path, error handling, and mocked external dependencies.

**Before writing tests, read each job file at `app/jobs/<job_name>.rb`.**

### Existing Jobs (deepen if spec already exists, create if missing)

| Job | Spec File | Key Tests |
|---|---|---|
| AiGenerationJob | `spec/jobs/ai_generation_job_spec.rb` | Already has 4 tests. Add: test with missing invocation ID (record not found), test idempotency (already completed invocation skipped) |
| ClassroomCourseSyncJob | `spec/jobs/classroom_course_sync_job_spec.rb` | Mock GoogleClassroomService. Test: happy path sync, error handling, SyncRun status updates |
| ClassroomCourseworkPushJob | `spec/jobs/classroom_coursework_push_job_spec.rb` | Mock GoogleClassroomService. Test: push assignment, push quiz, error creates failed SyncRun |
| ClassroomGradePassbackJob | `spec/jobs/classroom_grade_passback_job_spec.rb` | Mock GoogleClassroomService. Test: successful grade sync, partial failure handling |
| ClassroomRosterSyncJob | `spec/jobs/classroom_roster_sync_job_spec.rb` | Mock GoogleClassroomService. Test: new students created, existing students updated, removed students handled |
| DataRetentionEnforcementJob | `spec/jobs/data_retention_enforcement_job_spec.rb` | Test: records older than retention period are purged, recent records are preserved, job runs per-tenant |
| OneRosterOrgSyncJob | `spec/jobs/one_roster_org_sync_job_spec.rb` | Mock OneRosterClient. Test: orgs imported as schools, update existing orgs, SyncRun tracking |
| OneRosterUserSyncJob | `spec/jobs/one_roster_user_sync_job_spec.rb` | Mock OneRosterClient. Test: users imported with correct roles, duplicate handling, SyncRun tracking |
| PdfExportJob | `spec/jobs/pdf_export_job_spec.rb` | Mock PDF generation. Test: generates file, attaches to record, handles template not found |
| QtiExportJob | `spec/jobs/qti_export_job_spec.rb` | Mock QTI serialization. Test: exports quiz with questions, handles empty quiz |
| QtiImportJob | `spec/jobs/qti_import_job_spec.rb` | Mock QTI parsing. Test: imports questions and quiz structure, handles malformed QTI XML |

### For Every Job, Test:

1. **Enqueue behavior**: `expect { described_class.perform_later(args) }.to have_enqueued_job(described_class)` (only if not already covered)
2. **Happy path execution**: Call `perform_now` with valid arguments, verify expected side effects
3. **Error handling**: Mock the service to raise, verify the job handles it gracefully (marks records failed, does not leave stale state)
4. **Idempotency**: If the job is called twice with the same arguments, verify no duplicate side effects
5. **Tenant context**: Jobs that accept a tenant_id should set `Current.tenant` before executing and clear after

---

## Task 5: Verify Coverage

After completing Tasks 1-4, run the full test suite and SimpleCov report:

```bash
cd apps/core
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rspec
```

### Verification Steps

1. **All specs pass**: `0 failures` in RSpec output
2. **No pending specs**: All specs should be implemented, not pending
3. **SimpleCov report**: Check `apps/core/coverage/index.html` — line coverage must be above 60%
4. **No broken factories**: Run `bundle exec rspec spec/models/` first to catch factory issues early
5. **No external HTTP calls**: Verify no specs hit real endpoints (WebMock or similar should block by default; if not, all HTTP must be mocked manually)

### If Coverage is Below 60%

Identify the lowest-coverage files from the SimpleCov report and add targeted tests:
1. Open `apps/core/coverage/index.html`
2. Sort by coverage percentage ascending
3. For each file below 50% coverage, read the source and add tests for uncovered lines
4. Focus on: models with complex logic, controllers with many actions, services with branching code paths

---

## Testing

```bash
cd apps/core
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rails db:migrate
bundle exec rubocop --autocorrect
bundle exec rspec
```

---

## Definition of Done

### Model Specs (Task 1)
- [ ] All 59 models have spec files in `spec/models/`
- [ ] Every validation declared in each model has a corresponding spec
- [ ] Every `dependent: :destroy` and `dependent: :nullify` has a spec verifying cascade behavior
- [ ] All state transition methods tested with valid transition, invalid transition from wrong state, and side effects
- [ ] All named scopes tested with matching and non-matching records
- [ ] Assignment: `publish!`, `close!`, `archive!` tested from valid and invalid states
- [ ] Quiz: `publish!`, `close!`, `archive!`, `calculate_points!` tested
- [ ] QuizAttempt: `submit!`, `effective_time_limit`, `calculate_score!`, `within_attempt_limit`, `quiz_is_available` tested with edge cases
- [ ] Submission: `submit!`, `grade_within_points_possible` tested
- [ ] SyncRun: `start!`, `complete!`, `fail!`, `log_info`, `log_warn`, `log_error` tested
- [ ] AiInvocation: `complete!`, `fail!` tested
- [ ] AiTaskPolicy: `allowed_for_role?`, `effective_model` tested
- [ ] IntegrationConfig: `activate!`, `deactivate!` tested
- [ ] Approval: `approve!`, `reject!`, `no_duplicate_pending` tested
- [ ] Question: `auto_gradable?` tested for each question type

### Request Specs (Task 2)
- [ ] All 64 controllers have request spec files in `spec/requests/api/v1/`
- [ ] Every action tested for unauthorized role returning 403
- [ ] Every create/update action tested with invalid params returning 422
- [ ] Every show/update/destroy action tested with non-existent ID returning 404
- [ ] At least 10 key controllers tested for tenant isolation
- [ ] Index actions with pagination tested for page/per_page
- [ ] Index actions with filter params tested for each supported filter
- [ ] QuizAnalyticsController `by_quiz` and `course_summary` tested
- [ ] StandardsCoverageController `by_academic_year` and `by_course` tested
- [ ] AiStreamController `create` tested with mocked SSE
- [ ] GradebookController `show` tested
- [ ] SearchController `index` tested with q param (empty, match, no results)

### Service Specs (Task 3)
- [ ] AiGatewayClient: `.stream` method, timeout, connection error, retry logic tested
- [ ] AuditLogger: all metadata normalization paths, error swallowing tested
- [ ] GoogleClassroomService: course sync, roster sync, coursework push, grade passback, error handling tested
- [ ] GoogleDriveService: upload, download, list, delete, error handling tested
- [ ] GoogleTokenService: fresh token, expired token, refresh failure, missing token tested
- [ ] NotificationService: all trigger types, correct user targeting, nil handling tested
- [ ] OneRosterClient: auth caching, retry on 401, pagination, all entity types, error handling tested

### Job Specs (Task 4)
- [ ] All 11 jobs (excluding ApplicationJob) have spec files in `spec/jobs/`
- [ ] Each job spec tests: happy path, error handling, tenant context
- [ ] AiGenerationJob: missing invocation and idempotency tests added
- [ ] All Classroom jobs mock GoogleClassroomService
- [ ] All OneRoster jobs mock OneRosterClient
- [ ] DataRetentionEnforcementJob tests retention period logic
- [ ] PdfExportJob, QtiExportJob, QtiImportJob test file generation/parsing

### Overall
- [ ] `bundle exec rspec` passes with 0 failures
- [ ] No pending specs
- [ ] SimpleCov line coverage is above 60%
- [ ] No application code was modified — only spec files added or edited
- [ ] All external HTTP calls are mocked — no real network requests in tests
- [ ] All specs follow existing patterns: `require "rails_helper"`, `Current.tenant` set/cleared, `mock_session` for requests
