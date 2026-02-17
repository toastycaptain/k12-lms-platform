# CODEX_E2E_PLAYWRIGHT_SETUP — End-to-End Test Infrastructure with Playwright

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Reliability), TECH-2.11 (Observability)
**Depends on:** None

---

## Problem

The platform has backend request specs and frontend component/page tests but no end-to-end tests that verify the full stack (browser → Next.js → Rails API → database). Critical user journeys could break silently if:

1. Frontend and backend contract diverge
2. Authentication flow breaks across services
3. Multi-step workflows fail at step transitions
4. CSRF/session handling breaks in real browser context

---

## Tasks

### 1. Install and Configure Playwright

```bash
cd apps/web && npm install -D @playwright/test
npx playwright install chromium
```

Create `apps/web/playwright.config.ts`:
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "cd ../core && bundle exec rails server -p 4000",
      port: 4000,
      reuseExistingServer: true,
    },
    {
      command: "npm run dev",
      port: 3000,
      reuseExistingServer: true,
    },
  ],
});
```

### 2. Create Test Helpers

Create `apps/web/e2e/helpers/`:

**auth.ts** — Login helper that seeds a test user and authenticates via API:
```typescript
export async function loginAsTeacher(page: Page) { ... }
export async function loginAsStudent(page: Page) { ... }
export async function loginAsAdmin(page: Page) { ... }
```

**seed.ts** — Database seeding via Rails API or rake tasks:
```typescript
export async function seedTestData() { ... }
export async function cleanupTestData() { ... }
```

### 3. Write Critical Path E2E Tests

Create `apps/web/e2e/`:

**auth.spec.ts** — Login flow:
- Visit /login → redirect to OAuth → callback → dashboard
- Unauthenticated access redirects to /login
- Logout clears session

**teacher-planning.spec.ts** — PRD-17 workflow:
- Create unit plan → add standards → create lesson → publish
- Verify published unit appears in library

**course-delivery.spec.ts** — PRD-18 workflow:
- Teacher creates assignment → student submits → teacher grades
- Student sees grade and feedback

**assessment.spec.ts** — PRD-19 workflow:
- Teacher creates quiz → student takes quiz → auto-grade → analytics

**admin.spec.ts** — Admin workflows:
- User management (create, assign role)
- Standards import
- AI provider configuration

### 4. Add to CI

Update `.github/workflows/ci.yml`:
```yaml
e2e:
  needs: [web, core]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup services
      # Start Rails + Next.js + Postgres + Redis
    - name: Run Playwright
      run: cd apps/web && npx playwright test
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: apps/web/playwright-report/
```

### 5. Create Seed Script for E2E

Create `apps/core/lib/tasks/e2e_seed.rake`:
- Creates test tenant, users (teacher, student, admin)
- Creates sample course, section, enrollments
- Creates sample unit plan with standards
- Idempotent (safe to run multiple times)

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/playwright.config.ts` | Playwright configuration |
| `apps/web/e2e/helpers/auth.ts` | Auth helpers |
| `apps/web/e2e/helpers/seed.ts` | Data seeding |
| `apps/web/e2e/auth.spec.ts` | Auth flow tests |
| `apps/web/e2e/teacher-planning.spec.ts` | Planning workflow |
| `apps/web/e2e/course-delivery.spec.ts` | Delivery workflow |
| `apps/web/e2e/assessment.spec.ts` | Assessment workflow |
| `apps/web/e2e/admin.spec.ts` | Admin workflows |
| `apps/core/lib/tasks/e2e_seed.rake` | Test data seeding |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/package.json` | Add Playwright dev dependency |
| `.github/workflows/ci.yml` | Add E2E job |

---

## Definition of Done

- [ ] Playwright installed and configured
- [ ] Auth helpers authenticate test users
- [ ] Seed rake task creates test data idempotently
- [ ] 5 E2E test files covering critical user journeys
- [ ] Tests pass locally against running stack
- [ ] CI job runs E2E tests on PRs
- [ ] Failure screenshots and traces uploaded as artifacts
- [ ] No flaky tests (retries handle transient issues)
