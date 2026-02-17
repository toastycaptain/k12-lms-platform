# CODEX_WORKFLOW_VALIDATION — End-to-End Workflow Tests for PRD Key Workflows

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-17 (Teacher Planning), PRD-18 (Course Delivery), PRD-19 (Assessment), PRD-20 (Google-Native), PRD-21 (AI-Assisted Planning)
**Depends on:** None

---

## Problem

PRD §7 defines 5 key workflows that represent the core user journeys. While individual endpoints have request specs, no test validates these complete multi-step workflows end-to-end through the backend. A regression in any step breaks the entire user journey silently.

---

## Workflows to Validate

### PRD-17: Teacher Planning Workflow
**Flow:** Create unit → align standards → draft lessons → attach Drive → publish → schedule

### PRD-18: Course Delivery Workflow
**Flow:** View modules → submit → grade → feedback → mastery

### PRD-19: Assessment Workflow
**Flow:** Build quiz → assign → attempt → analyze

### PRD-20: Google-Native Workflow
**Flow:** Attach Drive → create Docs/Slides → assign via Classroom

### PRD-21: AI-Assisted Planning Workflow
**Flow:** Invoke AI → review output → save draft → enforce policy

---

## Tasks

### 1. Create Workflow Test Infrastructure

Create `apps/core/spec/workflows/` directory and base helper:

```ruby
# apps/core/spec/workflows/workflow_helper.rb
module WorkflowHelper
  def setup_tenant_and_users
    @tenant = create(:tenant)
    Current.tenant = @tenant

    @admin = create(:user, tenant: @tenant)
    @admin.add_role(:admin)

    @teacher = create(:user, tenant: @tenant)
    @teacher.add_role(:teacher)

    @student = create(:user, tenant: @tenant)
    @student.add_role(:student)
  end

  def auth_headers_for(user)
    # Set up session/auth for request specs
    post "/api/v1/session", params: { user_id: user.id }
    # Return headers needed for subsequent requests
  end

  def api_get(path, user:)
    get "/api/v1/#{path}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:ok)
    JSON.parse(response.body)
  end

  def api_post(path, user:, params: {})
    post "/api/v1/#{path}",
      params: params.to_json,
      headers: auth_headers_for(user).merge("Content-Type" => "application/json")
    JSON.parse(response.body)
  end
end
```

### 2. Teacher Planning Workflow Test

Create `apps/core/spec/workflows/teacher_planning_workflow_spec.rb`:

```ruby
describe "PRD-17: Teacher Planning Workflow" do
  include WorkflowHelper

  before { setup_tenant_and_users }
  after { Current.tenant = nil }

  it "completes: create unit → align standards → draft lessons → publish" do
    # Step 1: Create unit plan
    unit = api_post("unit_plans", user: @teacher, params: {
      unit_plan: { title: "Fractions Unit", description: "..." }
    })
    expect(unit["id"]).to be_present

    # Step 2: Create version
    version = api_post("unit_plans/#{unit['id']}/create_version", user: @teacher)
    expect(version["version_number"]).to eq(1)

    # Step 3: Align standards
    framework = create(:standard_framework, tenant: @tenant)
    standard = create(:standard, standard_framework: framework, tenant: @tenant)
    api_post("unit_version_standards", user: @teacher, params: {
      unit_version_standard: { unit_version_id: version["id"], standard_id: standard.id }
    })

    # Step 4: Draft lesson
    lesson = api_post("unit_plans/#{unit['id']}/lessons", user: @teacher, params: {
      lesson_plan: { title: "Lesson 1: Introduction to Fractions" }
    })
    expect(lesson["id"]).to be_present

    # Step 5: Create lesson version
    lesson_version = api_post("lesson_plans/#{lesson['id']}/create_version", user: @teacher)
    expect(lesson_version["id"]).to be_present

    # Step 6: Publish unit
    api_post("unit_plans/#{unit['id']}/publish", user: @teacher)
    updated_unit = api_get("unit_plans/#{unit['id']}", user: @teacher)
    expect(updated_unit["status"]).to eq("published")
  end
end
```

### 3. Course Delivery Workflow Test

Create `apps/core/spec/workflows/course_delivery_workflow_spec.rb`:

```ruby
describe "PRD-18: Course Delivery Workflow" do
  include WorkflowHelper

  before { setup_tenant_and_users }

  it "completes: create course → add module → create assignment → submit → grade → feedback" do
    # Setup: Create course with section and enrollment
    course = create(:course, tenant: @tenant)
    section = create(:section, course: course, tenant: @tenant)
    create(:enrollment, section: section, user: @student, tenant: @tenant)
    create(:enrollment, section: section, user: @teacher, role: "teacher", tenant: @tenant)

    # Step 1: Create module
    mod = api_post("courses/#{course.id}/modules", user: @teacher, params: {
      course_module: { title: "Module 1", position: 1 }
    })

    # Step 2: Create assignment
    assignment = api_post("courses/#{course.id}/assignments", user: @teacher, params: {
      assignment: { title: "Homework 1", points_possible: 100, due_date: 1.week.from_now }
    })

    # Step 3: Student submits
    submission = api_post("assignments/#{assignment['id']}/submissions", user: @student, params: {
      submission: { body: "My answer to the homework" }
    })
    expect(submission["status"]).to eq("submitted")

    # Step 4: Teacher grades
    patch "/api/v1/submissions/#{submission['id']}/grade",
      params: { submission: { grade: 85, feedback: "Good work!" } }.to_json,
      headers: auth_headers_for(@teacher).merge("Content-Type" => "application/json")
    expect(response).to have_http_status(:ok)

    # Step 5: Student sees grade
    updated = api_get("submissions/#{submission['id']}", user: @student)
    expect(updated["grade"]).to eq(85)
    expect(updated["feedback"]).to be_present
  end
end
```

### 4. Assessment Workflow Test

Create `apps/core/spec/workflows/assessment_workflow_spec.rb`:

```ruby
describe "PRD-19: Assessment Workflow" do
  include WorkflowHelper

  it "completes: build quiz → add questions → student attempts → auto-grade → analyze" do
    # Step 1: Create question bank
    bank = api_post("question_banks", user: @teacher, params: {
      question_bank: { name: "Math Questions" }
    })

    # Step 2: Add questions
    q1 = api_post("questions", user: @teacher, params: {
      question: {
        question_bank_id: bank["id"], question_type: "multiple_choice",
        content: "What is 2+2?", choices: [
          { text: "3", correct: false }, { text: "4", correct: true },
          { text: "5", correct: false }
        ], points: 10,
      }
    })

    # Step 3: Create quiz
    quiz = api_post("quizzes", user: @teacher, params: {
      quiz: { title: "Math Quiz 1", course_id: @course.id, time_limit_minutes: 30 }
    })

    # Step 4: Add question to quiz
    api_post("quizzes/#{quiz['id']}/quiz_items", user: @teacher, params: {
      quiz_item: { question_id: q1["id"], position: 1 }
    })

    # Step 5: Student starts attempt
    attempt = api_post("quizzes/#{quiz['id']}/attempts", user: @student)
    expect(attempt["status"]).to eq("in_progress")

    # Step 6: Student answers
    api_post("quiz_attempts/#{attempt['id']}/answers", user: @student, params: {
      attempt_answer: { question_id: q1["id"], selected_choice: "4" }
    })

    # Step 7: Student submits
    patch "/api/v1/quiz_attempts/#{attempt['id']}/submit", headers: auth_headers_for(@student)
    expect(response).to have_http_status(:ok)

    # Step 8: View analytics
    analytics = api_get("quizzes/#{quiz['id']}/analytics", user: @teacher)
    expect(analytics["score_statistics"]).to be_present
  end
end
```

### 5. AI-Assisted Planning Workflow Test

Create `apps/core/spec/workflows/ai_planning_workflow_spec.rb`:

```ruby
describe "PRD-21: AI-Assisted Planning Workflow" do
  include WorkflowHelper

  it "completes: configure provider → set policy → invoke AI → persist invocation" do
    # Step 1: Admin configures AI provider
    provider = api_post("ai_provider_configs", user: @admin, params: {
      ai_provider_config: { provider_name: "openai", display_name: "OpenAI", default_model: "gpt-4o", status: "active" }
    })

    # Step 2: Admin sets task policy
    policy = api_post("ai_task_policies", user: @admin, params: {
      ai_task_policy: { task_type: "lesson_generation", enabled: true, allowed_roles: ["teacher"] }
    })

    # Step 3: Teacher invokes AI (mock gateway response)
    invocation = api_post("ai_invocations", user: @teacher, params: {
      ai_invocation: { task_type: "lesson_generation", prompt: "Generate a lesson on fractions" }
    })
    expect(invocation["status"]).to be_present

    # Step 4: Verify audit trail
    logs = api_get("audit_logs?auditable_type=AiInvocation", user: @admin)
    expect(logs).not_to be_empty
  end
end
```

### 6. Add Workflow Test CI Job

Ensure workflow tests run in CI by adding them to the existing RSpec suite (they're just regular request specs in a dedicated directory).

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/spec/workflows/workflow_helper.rb` | Shared workflow test utilities |
| `apps/core/spec/workflows/teacher_planning_workflow_spec.rb` | PRD-17 |
| `apps/core/spec/workflows/course_delivery_workflow_spec.rb` | PRD-18 |
| `apps/core/spec/workflows/assessment_workflow_spec.rb` | PRD-19 |
| `apps/core/spec/workflows/ai_planning_workflow_spec.rb` | PRD-21 |

---

## Definition of Done

- [ ] 4 workflow test files covering PRD-17, PRD-18, PRD-19, PRD-21
- [ ] Each workflow test validates the complete multi-step flow
- [ ] All workflow tests pass in existing test suite
- [ ] No N+1 queries detected during workflows (if Bullet is installed)
- [ ] `bundle exec rspec spec/workflows/` passes with 0 failures
- [ ] Workflow tests run in CI
