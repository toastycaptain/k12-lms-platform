# Codex Instructions — End-to-End Integration Tests

## Objective

Create integration tests that verify the full data flow from frontend through backend to AI gateway, proving the complete stack works together. This covers the critical user workflows that currently have no end-to-end verification.

**Spec references:** PRD-23 (reliability), TECH-2.1 (service architecture), P2 in PRIORITIZED_BACKLOG.md

---

## What Already Exists (DO NOT recreate)

### Backend Tests
- `apps/core/spec/` — 210 spec files covering models, policies, requests, services, jobs
- `apps/core/spec/contracts/` — 3 contract spec files

### Frontend Tests
- `apps/web/src/` — 47 test files, 232 passing tests
- Tests cover: dashboard, gradebook, unit planner, quiz builder, communication, admin pages, report, standards, components

### AI Gateway Tests
- `apps/ai-gateway/tests/` — 5 files, 49+ tests covering router, providers, registry

### Test Infrastructure
- `apps/web/src/test/factories.ts` — test data factory helpers (buildCourse, buildQuiz, etc.)
- `apps/web/src/test/utils.ts` — createMockUser helper
- `apps/core/spec/factories/` — 38 FactoryBot factory files

---

## Task 1: Frontend → Backend Contract Tests

**Create:** `apps/web/src/test/contract-tests/` directory

For each critical API endpoint the frontend calls, verify the response shape matches what the frontend expects.

**File:** `apps/web/src/test/contract-tests/course-api.test.ts`

```typescript
// These tests verify the API response shapes match frontend expectations.
// They use the actual serializer output format from the backend.

describe("Course API Contract", () => {
  it("GET /api/v1/courses returns expected shape", () => {
    // Define the expected shape based on what frontend code destructures
    const expectedCourseShape = {
      id: expect.any(Number),
      name: expect.any(String),
      code: expect.toBeOneOf([expect.any(String), null]),
      description: expect.toBeOneOf([expect.any(String), null]),
      sections: expect.any(Array),
    };

    // This validates the frontend's assumptions about the API
    // If the backend serializer changes, this test should fail
  });
});
```

**Create contract test files for:**
1. `course-api.test.ts` — Course listing and detail shapes
2. `assignment-api.test.ts` — Assignment CRUD response shapes
3. `quiz-api.test.ts` — Quiz, attempt, answer response shapes
4. `user-api.test.ts` — User/me response shapes
5. `module-api.test.ts` — CourseModule, ModuleItem, progress shapes
6. `messaging-api.test.ts` — MessageThread, Message response shapes
7. `notification-api.test.ts` — Notification response shapes

**Approach:** For each test:
1. Read the corresponding serializer to determine the exact response shape
2. Read the frontend page that consumes the endpoint to determine what fields it destructures
3. Create a contract type that both sides must agree on
4. Write a test that validates a sample response against the contract

---

## Task 2: Backend → AI Gateway Integration Spec

**Create:** `apps/core/spec/integration/ai_gateway_integration_spec.rb`

**Requirements:**
1. Test the full flow: create AiInvocation → call AiGatewayClient → receive response → update invocation
2. Mock the gateway HTTP response (do NOT call real AI providers)
3. Verify:
   - Invocation created with status "pending"
   - Gateway client sends correct request format (provider, model, prompt, temperature, max_tokens)
   - On success: invocation updated to "completed" with token counts and duration
   - On failure: invocation updated to "failed" with error message
   - On streaming: invocation tracks accumulated token counts

**Test the AiGatewayClient directly:**
```ruby
describe AiGatewayClient do
  let(:client) { described_class.new }

  before do
    stub_request(:post, "#{ENV['AI_GATEWAY_URL']}/v1/generate")
      .to_return(
        status: 200,
        body: {
          id: "gen-123",
          content: "Generated lesson plan...",
          model: "gpt-4o",
          provider: "openai",
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
          finish_reason: "stop"
        }.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end

  it "generates content and returns structured response" do
    response = client.generate(
      provider: "openai",
      model: "gpt-4o",
      prompt: "Create a lesson plan for photosynthesis",
      task_type: "lesson_generation"
    )
    expect(response[:content]).to be_present
    expect(response[:usage][:total_tokens]).to eq(300)
  end
end
```

---

## Task 3: Critical User Workflow Tests (Frontend)

**Create page-level integration tests for workflows that are currently untested:**

### 3a: Login Flow
**File:** `apps/web/src/app/login/page.test.tsx`
- Renders login page with Google OAuth button
- Shows SSO toggle when clicked
- Handles auth error states from URL params

### 3b: Quiz Attempt Flow
**File:** `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.test.tsx`
- Renders quiz with questions
- Handles timer display
- Shows accommodation adjustments (extra time)
- Submits attempt and navigates to results

### 3c: Grading Flow
**File:** `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.test.tsx`
- Renders submission content
- Renders rubric with criteria and ratings
- Saves grade and feedback
- Handles grading errors

### 3d: Messaging Flow
**File:** `apps/web/src/app/communicate/compose/page.test.tsx`
- Renders compose form
- Searches for recipients
- Sends message and navigates to thread
- Handles send errors

### 3e: Unit Planning → AI Assist Flow
**File:** `apps/web/src/app/plan/units/[id]/page.test.tsx`
- Renders unit editor
- Opens AI assistant panel
- Mocks streaming response
- Verifies AI output appears in panel

**Pattern for each test:**
1. Mock `apiFetch` for all required endpoints
2. Mock `useAuth` with appropriate role
3. Render the page in ToastProvider
4. Verify key UI elements render
5. Simulate user actions (click, type, submit)
6. Verify expected API calls were made
7. Verify success/error states

---

## Task 4: Cross-Service Health Check Test

**Create:** `apps/core/spec/integration/health_check_spec.rb`

A simple test that verifies all services report healthy:
1. `GET /api/v1/health` on Rails → 200
2. If AI_GATEWAY_URL is configured: verify Rails can reach `GET {AI_GATEWAY_URL}/v1/health`
3. If Redis is configured: verify Rails can connect to Redis

---

## Architecture Rules

1. Integration tests should NOT call real external services (AI providers, Google)
2. Use WebMock/VCR for HTTP stubs in Rails specs
3. Use vi.mock for API mocking in frontend tests
4. Contract tests validate shape/types, not specific values
5. Keep test data minimal — just enough to prove the flow works
6. Each test file should be independent and not depend on test execution order

---

## Testing

```bash
# Frontend
cd apps/web && npm run test

# Backend
cd apps/core && bundle exec rspec spec/integration/ spec/contracts/

# AI Gateway
cd apps/ai-gateway && pytest
```

---

## Definition of Done

- [ ] Frontend contract tests verify response shapes for 7 critical API endpoints
- [ ] Backend integration spec tests full AI invocation lifecycle (create → generate → complete)
- [ ] Login flow test covers Google OAuth and error states
- [ ] Quiz attempt flow test covers render → answer → submit
- [ ] Grading flow test covers render → score → save
- [ ] Messaging flow test covers compose → send
- [ ] Unit planning + AI assist flow test covers editor → AI panel → output
- [ ] Cross-service health check test passes
- [ ] All existing tests still pass
- [ ] No new lint warnings
