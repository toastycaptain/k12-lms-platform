# Codex Task: Add Missing Spec Coverage

## Overview

The project has 635 passing tests but gaps in dedicated unit-level specs.
This task adds missing **policy specs** (37), **model specs** (33),
**request specs** (7 controllers), and **factories** (3).

**Rules:**
- Every spec file uses `require "rails_helper"` at the top.
- Every spec sets `Current.tenant` in `before` and clears it in `after`.
- Use `create(:factory)` from FactoryBot; never build raw SQL.
- Use `shoulda-matchers` for association/validation one-liners where possible.
- Follow the existing patterns shown in the Examples section below.
- Run `bundle exec rspec` after all files are created — every spec must pass.

---

## Examples of Existing Patterns

### Policy spec pattern (admin-only resources)

```ruby
# spec/policies/ai_provider_config_policy_spec.rb
require "rails_helper"

RSpec.describe AiProviderConfigPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  before { Current.tenant = tenant }
  after  { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy? do
    let(:admin)   { u = create(:user, tenant: tenant); u.add_role(:admin); u }
    let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
    let(:record)  { create(:ai_provider_config, tenant: tenant, created_by: admin) }

    it "permits admins"     { expect(policy).to permit(admin, record) }
    it "denies non-admins"  { expect(policy).not_to permit(teacher, record) }
  end
end
```

### Policy spec pattern (role-based with scopes)

```ruby
# spec/policies/course_policy_spec.rb  (abbreviated)
RSpec.describe CoursePolicy, type: :policy do
  subject(:policy) { described_class }
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term)   { create(:term, tenant: tenant, academic_year: academic_year) }
  before { Current.tenant = tenant }
  after  { Current.tenant = nil }

  permissions :show? do
    let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

    it "permits admin" do
      admin = create(:user, tenant: tenant); admin.add_role(:admin)
      expect(policy).to permit(admin, course)
    end

    it "permits enrolled teacher" do
      teacher = create(:user, tenant: tenant); teacher.add_role(:teacher)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
      expect(policy).to permit(teacher, course)
    end

    it "denies unenrolled student" do
      student = create(:user, tenant: tenant); student.add_role(:student)
      expect(policy).not_to permit(student, course)
    end
  end

  describe "Scope" do
    let!(:course_a) { create(:course, tenant: tenant, academic_year: academic_year) }
    let!(:course_b) { create(:course, tenant: tenant, academic_year: academic_year) }

    it "returns all for admin" do
      admin = create(:user, tenant: tenant); admin.add_role(:admin)
      expect(CoursePolicy::Scope.new(admin, Course).resolve).to include(course_a, course_b)
    end

    it "returns only enrolled for student" do
      student = create(:user, tenant: tenant); student.add_role(:student)
      section = create(:section, tenant: tenant, course: course_a, term: term)
      create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
      expect(CoursePolicy::Scope.new(student, Course).resolve).to contain_exactly(course_a)
    end
  end
end
```

### Model spec pattern

```ruby
# spec/models/course_spec.rb
require "rails_helper"

RSpec.describe Course, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:academic_year) }
    it { should have_many(:sections).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    before do
      Current.tenant = tenant1
      ay1 = create(:academic_year, tenant: tenant1)
      @course1 = create(:course, tenant: tenant1, academic_year: ay1)
      Current.tenant = tenant2
      ay2 = create(:academic_year, tenant: tenant2)
      @course2 = create(:course, tenant: tenant2, academic_year: ay2)
    end
    after { Current.tenant = nil }

    it "only returns courses for the current tenant" do
      Current.tenant = tenant1
      expect(Course.all).to contain_exactly(@course1)
    end
  end
end
```

### Request spec pattern

```ruby
# spec/requests/api/v1/courses_spec.rb  (abbreviated)
require "rails_helper"

RSpec.describe "Api::V1::Courses", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant); u.add_role(:admin)
    Current.tenant = nil; u
  end
  after { Current.tenant = nil; Current.user = nil }

  describe "GET /api/v1/courses" do
    it "returns courses for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      create_list(:course, 2, tenant: tenant, academic_year: ay)
      Current.tenant = nil
      get "/api/v1/courses"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end
  end
end
```

---

## Task 1: Add Missing Factories (3 files)

Create these factory files. Each factory must include `association :tenant`.

### File: `spec/factories/discussion_posts.rb`

```ruby
FactoryBot.define do
  factory :discussion_post do
    association :tenant
    association :discussion
    association :created_by, factory: :user
    content { "This is a discussion post." }
  end
end
```

### File: `spec/factories/rubric_criteria.rb`

```ruby
FactoryBot.define do
  factory :rubric_criterion do
    association :tenant
    association :rubric
    title { "Criterion" }
    sequence(:position) { |n| n }
    points { 10 }
  end
end
```

### File: `spec/factories/rubric_ratings.rb`

```ruby
FactoryBot.define do
  factory :rubric_rating do
    association :tenant
    association :rubric_criterion
    description { "Excellent" }
    sequence(:position) { |n| n }
    points { 10 }
  end
end
```

---

## Task 2: Add 37 Missing Policy Specs

Create one spec file per policy listed below. Each spec must:

1. Open with `require "rails_helper"`.
2. Use `RSpec.describe <PolicyClass>, type: :policy do`.
3. Set `Current.tenant` in `before`, clear in `after`.
4. Test every public permission method defined in the policy (`index?`, `show?`, `create?`, `update?`, `destroy?`, and any custom actions like `publish?`, `lock?`, `grade?`, etc.).
5. Test the `Scope` if the policy defines one (verify admin sees all, restricted roles see subset or none).
6. Read the actual policy file to determine the exact permission rules — do NOT guess.

### Files to create:

**Admin-only policies** (pattern: admin permits, others denied):
- `spec/policies/academic_year_policy_spec.rb`
- `spec/policies/audit_log_policy_spec.rb`
- `spec/policies/approval_policy_spec.rb`
- `spec/policies/integration_config_policy_spec.rb`
- `spec/policies/sync_log_policy_spec.rb`
- `spec/policies/sync_mapping_policy_spec.rb`
- `spec/policies/sync_run_policy_spec.rb`
- `spec/policies/term_policy_spec.rb`

**Admin + curriculum_lead policies** (privileged users):
- `spec/policies/school_policy_spec.rb` — index?/show? allow admin+curriculum_lead; create?/update?/destroy? admin only. Scope returns all for privileged, none for others.
- `spec/policies/section_policy_spec.rb` — index?/show? open to all; create?/update? admin+curriculum_lead; destroy? admin only. Scope returns all.
- `spec/policies/standard_policy_spec.rb` — index?/show?/tree? open to all; create?/update? admin+curriculum_lead; destroy? admin only. Scope returns all.
- `spec/policies/standard_framework_policy_spec.rb` — same pattern as standard_policy.
- `spec/policies/template_policy_spec.rb`
- `spec/policies/template_version_policy_spec.rb`
- `spec/policies/lesson_plan_policy_spec.rb`

**Course-scoped policies** (require enrollment checks — use the course_policy_spec pattern with enrollments):
- `spec/policies/announcement_policy_spec.rb` — create?/update?/destroy? for admin+teacher; Scope returns all for admin/teacher, `.published` for students.
- `spec/policies/assignment_policy_spec.rb` — show? checks enrollment; create? checks teaches_course; Scope returns owned/taught for teacher, published+enrolled for student, all for admin.
- `spec/policies/quiz_policy_spec.rb` — same shape as assignment_policy. Also test publish?, close?, results?.
- `spec/policies/submission_policy_spec.rb` — create? requires student enrolled; grade? for admin/teacher; Scope: teacher sees own-assignment+taught-course submissions, student sees own.
- `spec/policies/discussion_policy_spec.rb` — show? checks enrollment; create? requires teacher+teaches_course; lock? same as update?. Scope: teacher sees own+taught, student sees enrolled-course only.
- `spec/policies/discussion_post_policy_spec.rb`
- `spec/policies/course_module_policy_spec.rb`
- `spec/policies/module_item_policy_spec.rb`
- `spec/policies/quiz_accommodation_policy_spec.rb`
- `spec/policies/quiz_attempt_policy_spec.rb`
- `spec/policies/quiz_item_policy_spec.rb`
- `spec/policies/question_policy_spec.rb`
- `spec/policies/question_bank_policy_spec.rb`
- `spec/policies/attempt_answer_policy_spec.rb`
- `spec/policies/resource_link_policy_spec.rb`
- `spec/policies/rubric_policy_spec.rb`
- `spec/policies/rubric_criterion_policy_spec.rb`
- `spec/policies/rubric_rating_policy_spec.rb`
- `spec/policies/rubric_score_policy_spec.rb`
- `spec/policies/lti_resource_link_policy_spec.rb`

**Special policies** (headless / non-model):
- `spec/policies/addon_policy_spec.rb` — test the action-based authorize pattern.
- `spec/policies/drive_policy_spec.rb` — test the headless policy pattern.

**Important notes for course-scoped policy specs:**

When testing policies that check enrollment (assignment, quiz, submission, discussion, etc.), you MUST set up the full enrollment chain:

```ruby
let(:academic_year) { create(:academic_year, tenant: tenant) }
let(:term)    { create(:term, tenant: tenant, academic_year: academic_year) }
let(:course)  { create(:course, tenant: tenant, academic_year: academic_year) }
let(:section) { create(:section, tenant: tenant, course: course, term: term) }

# Then enroll the user:
create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
```

Without the full chain (academic_year → term → course → section → enrollment), enrollment queries will fail.

---

## Task 3: Add 33 Missing Model Specs

Create one spec file per model listed below. Each spec must:

1. Open with `require "rails_helper"`.
2. Use `RSpec.describe <ModelClass>, type: :model do`.
3. Test **associations** with shoulda-matchers (`it { should belong_to(...) }`, `it { should have_many(...) }`).
4. Test **validations** with shoulda-matchers (`it { should validate_presence_of(...) }`, `it { should validate_inclusion_of(...) }`).
5. Test any **custom instance methods** (e.g., `publish!`, `activate!`, `submit!`, `auto_gradable?`).
6. Test **tenant scoping** with a two-tenant isolation check (create records for tenant1 and tenant2, verify scoping).
7. Read the actual model file to determine the exact validations, associations, and methods — do NOT guess.

### Files to create:

- `spec/models/announcement_spec.rb`
- `spec/models/assignment_spec.rb`
- `spec/models/attempt_answer_spec.rb`
- `spec/models/course_module_spec.rb`
- `spec/models/data_retention_policy_spec.rb`
- `spec/models/discussion_spec.rb`
- `spec/models/discussion_post_spec.rb`
- `spec/models/integration_config_spec.rb`
- `spec/models/lti_registration_spec.rb`
- `spec/models/lti_resource_link_spec.rb`
- `spec/models/module_item_spec.rb`
- `spec/models/question_spec.rb`
- `spec/models/question_bank_spec.rb`
- `spec/models/quiz_spec.rb`
- `spec/models/quiz_accommodation_spec.rb`
- `spec/models/quiz_attempt_spec.rb`
- `spec/models/quiz_item_spec.rb`
- `spec/models/rubric_spec.rb`
- `spec/models/rubric_criterion_spec.rb`
- `spec/models/rubric_rating_spec.rb`
- `spec/models/rubric_score_spec.rb`
- `spec/models/submission_spec.rb`
- `spec/models/sync_log_spec.rb`
- `spec/models/sync_mapping_spec.rb`
- `spec/models/sync_run_spec.rb`
- `spec/models/template_version_spec.rb`
- `spec/models/unit_version_spec.rb`
- `spec/models/unit_version_standard_spec.rb`
- `spec/models/ai_invocation_spec.rb`
- `spec/models/ai_provider_config_spec.rb`
- `spec/models/ai_task_policy_spec.rb`
- `spec/models/ai_template_spec.rb`

**Note on `template_spec.rb`:** A spec already exists at `spec/models/template_spec.rb`. Do NOT overwrite it. Skip `Template` from this list.

**Note on `template_version_standard_spec.rb`:** A spec already exists. Do NOT overwrite it.

### Key models with custom methods to test:

**Assignment** — `publish!`, `close!`, `archive!` (state transitions)
**Quiz** — `publish!`, `close!`, `archive!`, `calculate_points!`
**QuizAttempt** — `submit!`, `effective_time_limit`, `calculate_score!`, custom validations (`within_attempt_limit`, `quiz_is_available`)
**QuestionBank** — `archive!`
**CourseModule** — `publish!`, `archive!`
**Submission** — `submit!`, custom validation `grade_within_points_possible`
**DiscussionPost** — custom validation `discussion_must_be_open`
**IntegrationConfig** — `activate!`, `deactivate!`
**SyncRun** — `start!`, `complete!`, `fail!(message)`, `log_info`, `log_warn`, `log_error`
**SyncMapping** — class methods `find_local`, `find_external`
**AiProviderConfig** — `activate!`, `deactivate!`, `encrypts :api_key`
**AiInvocation** — `complete!(tokens:, duration:, response_hash:)`, `fail!(message)`
**AiTaskPolicy** — `allowed_for_role?`, `effective_model`
**Question** — `auto_gradable?`

---

## Task 4: Add 7 Missing Request Specs

Create one spec file per controller. Each spec must:

1. Open with `require "rails_helper"`.
2. Use `mock_session(user, tenant: tenant)` for authentication.
3. Test at minimum: index (200 for authorized, 403 for unauthorized), create (201 for authorized), and show (200).
4. Follow the existing request spec pattern shown in the Examples section.

### Files to create:

### `spec/requests/api/v1/gradebook_spec.rb`

Tests for `GET /api/v1/courses/:id/gradebook`:
- Admin can view gradebook (returns submission data)
- Enrolled teacher can view gradebook
- Unenrolled student gets 403
- Returns correct JSON shape: `[{ user_id, assignment_id, grade, status }]`

Setup requires: course with assignments, sections, enrolled students with submissions.

### `spec/requests/api/v1/schools_spec.rb`

Tests for CRUD `/api/v1/schools`:
- Admin can list, create, update, destroy schools
- Teacher gets 403 on create/update/destroy
- Non-privileged users get 403 on index

### `spec/requests/api/v1/sections_spec.rb`

Tests for CRUD `/api/v1/sections`:
- Admin can list, create, update, destroy sections
- Index supports optional `course_id` filter param
- Teacher can view (index/show open to all) but cannot create

### `spec/requests/api/v1/users_spec.rb`

Tests for CRUD `/api/v1/users`:
- Admin can list, create, update, destroy users
- Create includes role assignment
- Non-admin gets 403 on mutation actions

### `spec/requests/api/v1/standard_frameworks_spec.rb`

Tests for CRUD `/api/v1/standard_frameworks`:
- Admin can create, update, destroy
- Curriculum lead can create/update but not destroy
- Teacher gets 403 on create

### `spec/requests/api/v1/rubric_criteria_spec.rb`

Tests for nested CRUD `/api/v1/rubrics/:rubric_id/rubric_criteria`:
- Admin can list, create, update, destroy criteria
- Creates criterion nested under rubric
- Verify tenant is set on create

### `spec/requests/api/v1/rubric_ratings_spec.rb`

Tests for nested CRUD `/api/v1/rubrics/:rubric_id/rubric_criteria/:criterion_id/ratings`:
- Admin can list, create, update, destroy ratings
- Creates rating nested under criterion
- Verify tenant is set on create

---

## Task 5: Verify

After creating ALL files from Tasks 1-4, run:

```bash
bundle exec rspec
```

Every single spec must pass. If any spec fails:
1. Read the actual source file (model/policy/controller) to understand the real behavior.
2. Fix the spec to match reality — do NOT modify application code.
3. Re-run until green.

**Expected result:** Total examples should increase from ~635 to ~900+ with 0 failures.
