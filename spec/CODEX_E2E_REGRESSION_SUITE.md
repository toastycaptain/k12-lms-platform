# CODEX_E2E_REGRESSION_SUITE — Complete Playwright E2E Suite for All PRD Key Workflows

**Priority:** P0
**Effort:** Medium (8–10 hours)
**Spec Refs:** PRD-17 (Teacher Planning), PRD-18 (Course Delivery), PRD-19 (Assessment), PRD-20 (Google-Native), PRD-21 (AI-Assisted Planning), PRD-23 (Reliability)
**Depends on:** None

---

## Problem

The PRD defines 5 key workflows (§7) that represent the complete user journey. While unit tests, request specs, and contract tests exist, no end-to-end test proves each workflow works from browser to database and back. This is the final verification before launch.

Existing E2E coverage:
- Playwright infrastructure exists (`apps/web/e2e/`)
- Some contract validation tests exist
- No tests covering full multi-step user workflows

---

## Tasks

### 1. Create Test Fixtures and Seed Data

Create `apps/web/e2e/fixtures/seed.ts`:

```typescript
// Shared test data creation via API calls
export async function seedTestSchool(page: Page) {
  // Create tenant, school, academic year, term
  // Create teacher, student, admin, guardian users
  // Create courses, sections, enrollments
  // Return IDs for use in tests
}
```

Create `apps/web/e2e/helpers/auth.ts`:
```typescript
export async function loginAs(page: Page, role: "teacher" | "student" | "admin" | "guardian") {
  // Navigate to login, authenticate, verify dashboard
}
```

### 2. PRD-17: Teacher Planning Workflow

Create `apps/web/e2e/workflows/teacher-planning.spec.ts`:

```typescript
test.describe("PRD-17: Teacher Planning Workflow", () => {
  test("Create unit → align standards → draft lessons → attach resource → publish → schedule", async ({ page }) => {
    await loginAs(page, "teacher");

    // Step 1: Create unit
    await page.goto("/plan/units");
    await page.click("text=Create Unit");
    await page.fill('[name="title"]', "E2E Test Unit: Fractions");
    await page.fill('[name="description"]', "Grade 4 fractions unit");
    await page.click("text=Save");
    await expect(page.locator("h1")).toContainText("Fractions");

    // Step 2: Align standards
    await page.click("text=Standards");
    await page.click("text=Add Standard");
    await page.fill('[placeholder="Search standards"]', "4.NF");
    await page.click("text=4.NF.1");
    await expect(page.locator(".standards-list")).toContainText("4.NF.1");

    // Step 3: Draft lesson
    await page.click("text=Lessons");
    await page.click("text=Add Lesson");
    await page.fill('[name="title"]', "Introduction to Fractions");
    await page.fill('[name="objectives"]', "Students will identify fractions");
    await page.click("text=Save");

    // Step 4: Attach resource
    await page.click("text=Resources");
    await page.click("text=Add Resource");
    // Upload a test file or add a link
    await page.fill('[name="title"]', "Fraction Worksheet");
    await page.fill('[name="external_url"]', "https://example.com/worksheet.pdf");
    await page.click("text=Attach");

    // Step 5: Publish
    await page.goto("/plan/units");
    await page.click("text=E2E Test Unit: Fractions");
    await page.click("text=Publish");
    await page.click("text=Confirm");
    await expect(page.locator(".status-badge")).toContainText("Published");

    // Step 6: Verify on calendar
    await page.goto("/plan/calendar");
    await expect(page.locator("body")).toContainText("Fractions");
  });
});
```

### 3. PRD-18: Course Delivery Workflow

Create `apps/web/e2e/workflows/course-delivery.spec.ts`:

```typescript
test.describe("PRD-18: Course Delivery Workflow", () => {
  test("View modules → submit assignment → grade → feedback → view mastery", async ({ browser }) => {
    // Teacher: create assignment
    const teacherPage = await browser.newPage();
    await loginAs(teacherPage, "teacher");
    await teacherPage.goto(`/teach/courses/${COURSE_ID}`);
    await teacherPage.click("text=Assignments");
    await teacherPage.click("text=Create Assignment");
    await teacherPage.fill('[name="title"]', "E2E Fraction Quiz");
    await teacherPage.fill('[name="points_possible"]', "100");
    await teacherPage.click("text=Publish");

    // Student: view and submit
    const studentPage = await browser.newPage();
    await loginAs(studentPage, "student");
    await studentPage.goto(`/learn/courses/${COURSE_ID}`);
    await expect(studentPage.locator("body")).toContainText("E2E Fraction Quiz");
    await studentPage.click("text=E2E Fraction Quiz");
    await studentPage.fill('[name="submission_text"]', "My answer to the fraction quiz");
    await studentPage.click("text=Submit");
    await expect(studentPage.locator(".status")).toContainText("Submitted");

    // Teacher: grade with feedback
    await teacherPage.goto(`/teach/courses/${COURSE_ID}/submissions`);
    await teacherPage.click("text=E2E Fraction Quiz");
    await teacherPage.fill('[name="grade"]', "85");
    await teacherPage.fill('[name="feedback"]', "Good work on fractions!");
    await teacherPage.click("text=Save Grade");

    // Student: view grade and feedback
    await studentPage.goto("/learn/grades");
    await expect(studentPage.locator("body")).toContainText("85");
    await expect(studentPage.locator("body")).toContainText("Good work on fractions!");
  });
});
```

### 4. PRD-19: Assessment Workflow

Create `apps/web/e2e/workflows/assessment.spec.ts`:

```typescript
test.describe("PRD-19: Assessment Workflow", () => {
  test("Build quiz → assign → student attempt → auto-grade → analyze results", async ({ browser }) => {
    // Teacher: build quiz
    const teacherPage = await browser.newPage();
    await loginAs(teacherPage, "teacher");

    // Create question bank
    await teacherPage.goto("/assess/question-banks");
    await teacherPage.click("text=Create Bank");
    await teacherPage.fill('[name="title"]', "E2E Fractions Bank");

    // Add questions
    await teacherPage.click("text=Add Question");
    await teacherPage.fill('[name="content"]', "What is 1/2 + 1/4?");
    await teacherPage.click("text=Multiple Choice");
    // Fill choices, mark correct answer
    await teacherPage.click("text=Save Question");

    // Create quiz from bank
    await teacherPage.goto(`/teach/courses/${COURSE_ID}/quizzes`);
    await teacherPage.click("text=Create Quiz");
    await teacherPage.fill('[name="title"]', "E2E Fractions Quiz");
    await teacherPage.fill('[name="time_limit"]', "30");
    // Add questions from bank
    await teacherPage.click("text=Publish");

    // Student: take quiz
    const studentPage = await browser.newPage();
    await loginAs(studentPage, "student");
    await studentPage.goto(`/learn/courses/${COURSE_ID}/quizzes/${QUIZ_ID}/attempt`);
    await studentPage.click("text=Start Quiz");
    // Answer questions
    await studentPage.click("text=3/4"); // Select answer
    await studentPage.click("text=Submit Quiz");

    // Verify auto-grading
    await expect(studentPage.locator(".score")).toBeVisible();

    // Teacher: view analytics
    await teacherPage.goto(`/assess/quizzes/${QUIZ_ID}/analytics`);
    await expect(teacherPage.locator("body")).toContainText("Attempts");
  });
});
```

### 5. PRD-20: Google-Native Workflow

Create `apps/web/e2e/workflows/google-native.spec.ts`:

```typescript
test.describe("PRD-20: Google-Native Workflow", () => {
  // Note: Google OAuth mocked in E2E; Drive picker mocked
  test("Attach Drive file → create resource → assign via course", async ({ page }) => {
    await loginAs(page, "teacher");

    // Attach Drive resource to unit
    await page.goto(`/plan/units/${UNIT_ID}`);
    await page.click("text=Resources");
    await page.click("text=Link Drive File");
    // Mock Drive picker response
    await page.evaluate(() => {
      window.postMessage({ type: "drive_picker_result", fileId: "mock_123", fileName: "Worksheet.docx", url: "https://drive.google.com/mock" }, "*");
    });
    await expect(page.locator(".resource-list")).toContainText("Worksheet.docx");

    // Assign to course
    await page.goto(`/teach/courses/${COURSE_ID}/assignments`);
    await page.click("text=Create Assignment");
    await page.fill('[name="title"]', "Drive Assignment");
    await page.click("text=Attach Resource");
    await page.click("text=Worksheet.docx");
    await page.click("text=Publish");
  });
});
```

### 6. PRD-21: AI-Assisted Planning Workflow

Create `apps/web/e2e/workflows/ai-planning.spec.ts`:

```typescript
test.describe("PRD-21: AI-Assisted Planning Workflow", () => {
  // Note: AI gateway mocked to return deterministic responses
  test("Invoke AI → review output → apply to plan → enforce policy", async ({ page }) => {
    await loginAs(page, "teacher");

    // Navigate to unit planner
    await page.goto(`/plan/units/${UNIT_ID}`);

    // Open AI panel
    await page.click("text=AI Assistant");
    await expect(page.locator(".ai-panel")).toBeVisible();

    // Select task and generate
    await page.click("text=Draft");
    await page.fill('[name="prompt"]', "Create a lesson about fractions for grade 4");
    await page.click("text=Generate");

    // Wait for streaming response
    await expect(page.locator(".ai-output")).toContainText("Lesson", { timeout: 15000 });

    // Apply to plan
    await page.click("text=Apply to Plan");
    await expect(page.locator(".lesson-content")).not.toBeEmpty();

    // Verify policy banner is visible
    await expect(page.locator(".policy-banner")).toBeVisible();
  });
});
```

### 7. Cross-Cutting Workflow Tests

Create `apps/web/e2e/workflows/cross-cutting.spec.ts`:

```typescript
test.describe("Cross-Cutting Workflows", () => {
  test("Guardian views student grades and portfolio", async ({ browser }) => {
    const guardianPage = await browser.newPage();
    await loginAs(guardianPage, "guardian");
    // Navigate to linked student
    // View grades, portfolio, consent management
  });

  test("Admin manages school settings and users", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/dashboard");
    // Navigate through admin screens
    // Verify analytics dashboard loads
    // Create a user via CSV import
    // Manage webhook endpoints
  });

  test("Multi-role navigation: curriculum lead reviews and approves", async ({ page }) => {
    await loginAs(page, "curriculum_lead");
    // View approval queue
    // Open unit plan, view version diff
    // Approve the unit
  });

  test("Network resilience: offline banner and recovery", async ({ page, context }) => {
    await loginAs(page, "teacher");
    await page.goto("/dashboard");

    // Simulate offline
    await context.setOffline(true);
    await expect(page.locator(".connection-banner")).toContainText("offline");

    // Restore connection
    await context.setOffline(false);
    await expect(page.locator(".connection-banner")).toContainText("restored");
  });
});
```

### 8. CI Integration

Update `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests
on:
  push:
    branches: [main]
  pull_request:
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: k12_test
          POSTGRES_USER: k12
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install Playwright
        run: cd apps/web && npx playwright install --with-deps
      - name: Start services
        run: |
          cd apps/core && bundle exec rails db:setup RAILS_ENV=test &
          cd apps/core && bundle exec rails server -e test -p 4000 &
          cd apps/web && npm run build && npm start -- -p 3000 &
          sleep 10
      - name: Run E2E tests
        run: cd apps/web && npx playwright test e2e/workflows/
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
```

### 9. Add Test Configuration

Create `apps/web/e2e/playwright.config.ts` (update if exists):

```typescript
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 1,
  workers: 2,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
});
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/e2e/fixtures/seed.ts` | Test data creation helpers |
| `apps/web/e2e/helpers/auth.ts` | Login helpers per role |
| `apps/web/e2e/workflows/teacher-planning.spec.ts` | PRD-17 E2E |
| `apps/web/e2e/workflows/course-delivery.spec.ts` | PRD-18 E2E |
| `apps/web/e2e/workflows/assessment.spec.ts` | PRD-19 E2E |
| `apps/web/e2e/workflows/google-native.spec.ts` | PRD-20 E2E |
| `apps/web/e2e/workflows/ai-planning.spec.ts` | PRD-21 E2E |
| `apps/web/e2e/workflows/cross-cutting.spec.ts` | Multi-role and resilience |
| `.github/workflows/e2e.yml` | CI pipeline for E2E |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/playwright.config.ts` | Update config for workflow tests |
| `apps/web/package.json` | Add E2E test scripts |

---

## Definition of Done

- [ ] PRD-17 (Teacher Planning): unit create → standards → lesson → resource → publish → calendar verified E2E
- [ ] PRD-18 (Course Delivery): assignment create → student submit → grade → feedback → view grades verified E2E
- [ ] PRD-19 (Assessment): quiz build → assign → attempt → auto-grade → analytics verified E2E
- [ ] PRD-20 (Google-Native): Drive attach → resource link → assign verified E2E (mocked Drive)
- [ ] PRD-21 (AI Planning): AI invoke → stream → apply-to-plan → policy banner verified E2E (mocked gateway)
- [ ] Guardian workflow: view grades and portfolio
- [ ] Admin workflow: dashboard, analytics, user import, webhooks
- [ ] Network resilience: offline banner appears and recovers
- [ ] All E2E tests pass in CI
- [ ] Screenshots and traces captured on failure
- [ ] Tests run in under 5 minutes total
